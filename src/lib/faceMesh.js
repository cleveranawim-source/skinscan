import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// wasm과 모델 파일은 CDN이 아니라 앱 안에 그대로 들어있습니다 (public/mediapipe).
// GitHub Pages에 올려도 얼굴 사진이든 인식 모델이든 외부 서버 호출 없이 브라우저 안에서 끝납니다.
const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL_PATH = `${import.meta.env.BASE_URL}mediapipe/models/face_landmarker.task`;

let imageLandmarkerPromise = null;
let videoLandmarkerPromise = null;

async function createLandmarker(runningMode) {
  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
  const baseConfig = {
    runningMode,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5
  };
  // 기기별 GPU 위임 실패(구형 브라우저, WebGL 미지원 등)에 대비해 CPU로 한 번 더 시도합니다.
  try {
    return await FaceLandmarker.createFromOptions(filesetResolver, {
      ...baseConfig,
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' }
    });
  } catch (gpuError) {
    return FaceLandmarker.createFromOptions(filesetResolver, {
      ...baseConfig,
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' }
    });
  }
}

export function loadFaceLandmarker() {
  if (!imageLandmarkerPromise) {
    imageLandmarkerPromise = createLandmarker('IMAGE').catch((error) => {
      imageLandmarkerPromise = null;
      throw error;
    });
  }
  return imageLandmarkerPromise;
}

// 라이브 카메라 미리보기의 실시간 정렬 가이드 전용 인스턴스입니다. 정적 사진 분석용
// 인스턴스와 runningMode가 다르므로, 하나를 프레임마다 전환해 쓰기보다 따로 두는 편이
// 더 단순하고 안전합니다. 실제로 카메라를 열었을 때만 로드됩니다.
export function loadVideoFaceLandmarker() {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = createLandmarker('VIDEO').catch((error) => {
      videoLandmarkerPromise = null;
      throw error;
    });
  }
  return videoLandmarkerPromise;
}

// 얼굴을 못 찾으면 null을 돌려줍니다. 호출부에서 "얼굴 미검출" 상태를 명확히 보여줘야 합니다.
export async function detectFaceLandmarks(image) {
  const landmarker = await loadFaceLandmarker();
  const result = landmarker.detect(image);
  const landmarks = result?.faceLandmarks?.[0];
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks;
}

export async function detectVideoFrameLandmarks(videoElement, timestampMs) {
  const landmarker = await loadVideoFaceLandmarker();
  const result = landmarker.detectForVideo(videoElement, timestampMs);
  const landmarks = result?.faceLandmarks?.[0];
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks;
}
