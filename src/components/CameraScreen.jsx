import { useEffect, useRef, useState } from 'react';
import { ImagePlus, SwitchCamera, X, XCircle } from 'lucide-react';
import { StepDots } from './StepDots';
import { loadImageFromUrl } from '../lib/imageUtils';
import { detectVideoFrameLandmarks } from '../lib/faceMesh';
import { estimateFaceGeometry } from '../lib/roi';

const DETECT_INTERVAL_MS = 150;
const BURST_FRAME_COUNT = 3;
const BURST_GAP_MS = 90;

// 자동 촬영: 셔터를 누르는 동작 자체가 손떨림(선명도 차단)의 주 원인이라,
// 정렬이 안정적으로 유지되면 카운트다운 후 자동으로 찍습니다. 수동 셔터는 그대로 유지.
const AUTO_ARM_DELAY_MS = 1800; // 카메라 진입/재진입 직후엔 발동 잠금 (재촬영 루프 방지)
const AUTO_STABLE_MS = 900; // 이 시간 동안 '좋음' 상태가 유지돼야 카운트다운 시작
const AUTO_COUNT_TICK_MS = 700; // 3→2→1 한 칸의 길이. 카운트 중 정렬이 깨지면 취소.

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
  // 자동 촬영 카운트다운(3/2/1, 비활성이면 null). 판정 자체는 인터벌 안에서 ref로 합니다 —
  // 인터벌 클로저가 오래된 state를 붙잡는 문제를 피하기 위해서입니다.
  const [countdown, setCountdown] = useState(null);
  const guideRef = useRef(guide);
  guideRef.current = guide;
  const capturingRef = useRef(false);
  const armedAtRef = useRef(0);
  const goodSinceRef = useRef(null);
  const countStartRef = useRef(null);

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
    if (!video || !ready || capturingRef.current) return;
    capturingRef.current = true;
    setCapturing(true);
    setCountdown(null);
    try {
      const canvas = await captureBurst(video, BURST_FRAME_COUNT, BURST_GAP_MS);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const image = await loadImageFromUrl(dataUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      onCaptured(dataUrl, image);
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }

  // 자동 촬영 판정 루프. '좋음'이 AUTO_STABLE_MS 이상 유지되면 카운트다운을 시작하고,
  // 도중에 정렬이 깨지면 처음부터 다시 셉니다. 진입 직후 AUTO_ARM_DELAY_MS 동안은
  // 발동을 잠가서, 재촬영으로 돌아오자마자 바로 찍혀버리는 루프를 막습니다.
  useEffect(() => {
    if (!ready) return undefined;
    armedAtRef.current = Date.now();
    goodSinceRef.current = null;
    countStartRef.current = null;
    setCountdown(null);
    const id = setInterval(() => {
      if (capturingRef.current) return;
      const now = Date.now();
      if (guideRef.current.status !== 'good') {
        goodSinceRef.current = null;
        if (countStartRef.current !== null) {
          countStartRef.current = null;
          setCountdown(null);
        }
        return;
      }
      if (goodSinceRef.current === null) goodSinceRef.current = now;
      if (now - armedAtRef.current < AUTO_ARM_DELAY_MS) return;
      if (now - goodSinceRef.current < AUTO_STABLE_MS) return;
      if (countStartRef.current === null) countStartRef.current = now;
      const step = 3 - Math.floor((now - countStartRef.current) / AUTO_COUNT_TICK_MS);
      if (step <= 0) {
        countStartRef.current = null;
        goodSinceRef.current = null;
        captureFrame();
      } else {
        setCountdown(step);
      }
    }, 120);
    return () => clearInterval(id);
  }, [ready]);

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
          {!ready ? '카메라를 준비하는 중이에요' : countdown ? `그대로 계세요, 곧 찍을게요 · ${countdown}` : guide.message}
        </div>
        {countdown && (
          <div className="camera-countdown" aria-hidden="true">
            {countdown}
          </div>
        )}
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
      <p className="camera-caption">
        {capturing ? '촬영 중입니다…' : '정렬이 맞으면 3초 뒤 자동으로 찍혀요 · 셔터로 바로 찍을 수도 있어요'}
      </p>
    </main>
  );
}
