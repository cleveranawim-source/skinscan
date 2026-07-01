import { useEffect, useRef, useState } from 'react';
import { Camera, Info, XCircle } from 'lucide-react';
import { AppHeader } from './AppHeader';
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
  return { status: 'good', message: '좋아요, 이대로 촬영하세요' };
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

export function CameraScreen({ onClose, onCaptured }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('카메라를 준비하는 중입니다.');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [guide, setGuide] = useState({ status: 'searching', message: '얼굴을 찾는 중이에요' });

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('이 브라우저에서는 카메라 촬영을 지원하지 않습니다.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 1600 }
          },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          setStatus('얼굴을 프레임 안에 맞춘 뒤 촬영하세요.');
        }
      } catch (cameraError) {
        setError('카메라 권한을 허용해야 촬영할 수 있습니다. 권한이 어렵다면 사진 선택을 이용하세요.');
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
      <AppHeader title="카메라 촬영" onBack={onClose} />
      <section className="camera-preview">
        <video ref={videoRef} playsInline muted />
        <div className={`oval-guide oval-guide-${guide.status}`} />
        <div className="camera-topbar">
          <span>{ready ? guide.message : '얼굴을 타원 안에 맞추세요'}</span>
        </div>
        <div className="camera-hud">
          <span>정면</span>
          <span>밝은 조명</span>
          <span>무보정</span>
        </div>
        <button className="shutter-button" onClick={captureFrame} disabled={!ready || capturing} aria-label="촬영">
          <Camera />
        </button>
      </section>
      <section className={`camera-status ${error ? 'error' : ''}`} aria-live="polite">
        {error ? <XCircle /> : <Info />}
        <p>{error || (capturing ? '촬영 중입니다…' : status)}</p>
      </section>
      <div className="camera-controls">
        <button className="secondary-button" onClick={onClose}>
          취소
        </button>
        <button className="primary-button" onClick={captureFrame} disabled={!ready || capturing}>
          <Camera />
          사진 촬영
        </button>
      </div>
    </main>
  );
}
