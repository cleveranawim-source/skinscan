import { useEffect, useRef, useState } from 'react';
import { ImagePlus, SwitchCamera, X, XCircle } from 'lucide-react';
import { StepDots } from './StepDots';
import { loadImageFromUrl } from '../lib/imageUtils';
import { detectVideoFrameLandmarks } from '../lib/faceMesh';
import { estimateFaceGeometry } from '../lib/roi';

const DETECT_INTERVAL_MS = 150;
const BURST_FRAME_COUNT = 3;
const BURST_GAP_MS = 90;

function evaluateGuide(geometry) {
  if (geometry.sizeRatio < 0.32) {
    return { status: 'adjust', message: '조금 더 가까이 와주세요' };
  }
  if (geometry.centerOffset > 0.14) {
    return { status: 'adjust', message: '얼굴을 타원 중앙에 맞춰주세요' };
  }
  if (Math.abs(geometry.rollDeg) > 12) {
    return { status: 'adjust', message: '고개를 똑바로 세워주세요' };
  }
  return { status: 'good', message: '좋아요, 그대로 계세요' };
}

// 프레임을 alpha = 1/(n+1)로 순서대로 겹쳐 그리면 픽셀별 평균과 같은 결과가 됩니다.
// 손떨림이나 순간적인 노이즈에 덜 민감한 사진을 만들기 위한 버스트 촬영입니다.
async function captureBurst(video, count, gapMs) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 960;
  canvas.height = video.videoHeight || 1280;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (i < count - 1) {
      await new Promise((resolve) => setTimeout(resolve, gapMs));
    }
  }
  ctx.globalAlpha = 1;
  return canvas;
}

export function CameraScreen({ onClose, onCaptured, onUpload }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [guide, setGuide] = useState({ status: 'searching', message: '얼굴을 찾는 중이에요' });

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      setReady(false);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('이 브라우저에서는 카메라 촬영을 지원하지 않습니다.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 1600 }
          },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          setError('');
        }
      } catch (cameraError) {
        // 후면 카메라가 없는 기기에서 전환을 시도한 경우 전면으로 되돌립니다.
        if (facingMode === 'environment') {
          setFacingMode('user');
          return;
        }
        setError('카메라 권한을 허용해야 촬영할 수 있습니다. 권한이 어렵다면 앨범에서 선택하세요.');
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  // 라이브 얼굴 정렬 가이드: 촬영 전에 이미 얼굴이 잘 잡혔는지 실시간으로 보여줘서
  // "찍고 -> 확인하고 -> 다시 찍고"의 왕복을 줄입니다. 실패해도 촬영 자체는 막지 않습니다.
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    let rafId;
    let lastRun = 0;
    let running = false;

    async function tick(now) {
      if (cancelled) return;
      if (!running && now - lastRun >= DETECT_INTERVAL_MS && videoRef.current) {
        running = true;
        lastRun = now;
        try {
          const landmarks = await detectVideoFrameLandmarks(videoRef.current, now);
          if (!cancelled) {
            if (!landmarks) {
              setGuide({ status: 'searching', message: '얼굴을 찾는 중이에요' });
            } else {
              const geometry = estimateFaceGeometry(landmarks, videoRef.current.videoWidth, videoRef.current.videoHeight);
              setGuide(evaluateGuide(geometry));
            }
          }
        } catch {
          // 실시간 가이드 전용 오류는 무시합니다. 최종 판단은 촬영 후 분석 단계에서 다시 합니다.
        } finally {
          running = false;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [ready]);

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;
    setCapturing(true);
    try {
      const canvas = await captureBurst(video, BURST_FRAME_COUNT, BURST_GAP_MS);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const image = await loadImageFromUrl(dataUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      onCaptured(dataUrl, image);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <main className="screen camera-screen">
      <div className="camera-top">
        <button className="icon-button" onClick={onClose} aria-label="닫기">
          <X />
        </button>
        <StepDots step={0} onDark />
        <span className="camera-top-spacer" />
      </div>
      <section className="camera-preview">
        <video ref={videoRef} playsInline muted />
        <div className={`oval-guide oval-guide-${guide.status}`} />
        <div className={`camera-pill camera-pill-${guide.status}`} aria-live="polite">
          {ready ? guide.message : '카메라를 준비하는 중이에요'}
        </div>
      </section>
      {error && (
        <section className="camera-status error">
          <XCircle />
          <p>{error}</p>
        </section>
      )}
      <div className="camera-dock">
        <label className="dock-side" aria-label="앨범에서 선택">
          <ImagePlus />
          <input type="file" accept="image/*" onChange={onUpload} />
        </label>
        <button
          className={`shutter-button${guide.status === 'good' ? ' shutter-good' : ''}`}
          onClick={captureFrame}
          disabled={!ready || capturing}
          aria-label="촬영"
        >
          <i />
        </button>
        <button
          className="dock-side"
          onClick={() => setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'))}
          aria-label="카메라 전환"
        >
          <SwitchCamera />
        </button>
      </div>
      <p className="camera-caption">{capturing ? '촬영 중입니다…' : '얼굴이 타원에 맞으면 셔터 링이 초록으로 켜져요'}</p>
    </main>
  );
}
