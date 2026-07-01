import { useEffect, useRef, useState } from 'react';
import { Camera, Info, XCircle } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { loadImageFromUrl } from '../lib/imageUtils';

export function CameraScreen({ onClose, onCaptured }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('카메라를 준비하는 중입니다.');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

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

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const image = await loadImageFromUrl(dataUrl);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    onCaptured(dataUrl, image);
  }

  return (
    <main className="screen camera-screen">
      <AppHeader title="카메라 촬영" onBack={onClose} />
      <section className="camera-preview">
        <video ref={videoRef} playsInline muted />
        <div className="oval-guide" />
        <div className="camera-topbar">
          <span>얼굴을 타원 안에 맞추세요</span>
        </div>
        <div className="camera-hud">
          <span>정면</span>
          <span>밝은 조명</span>
          <span>무보정</span>
        </div>
        <button className="shutter-button" onClick={captureFrame} disabled={!ready} aria-label="촬영">
          <Camera />
        </button>
      </section>
      <section className={`camera-status ${error ? 'error' : ''}`} aria-live="polite">
        {error ? <XCircle /> : <Info />}
        <p>{error || status}</p>
      </section>
      <div className="camera-controls">
        <button className="secondary-button" onClick={onClose}>
          취소
        </button>
        <button className="primary-button" onClick={captureFrame} disabled={!ready}>
          <Camera />
          사진 촬영
        </button>
      </div>
    </main>
  );
}
