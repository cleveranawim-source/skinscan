import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// wasm과 모델 파일은 CDN이 아니라 앱 안에 그대로 들어있습니다 (public/mediapipe).
// GitHub Pages에 올려도 얼굴 사진이든 인식 모델이든 외부 서버 호출 없이 브라우저 안에서 끝납니다.
const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL_PATH = `${import.meta.env.BASE_URL}mediapipe/models/face_landmarker.task`;

let landmarkerPromise = null;

async function createLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
  const baseConfig = {
    runningMode: 'IMAGE',
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
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}

// 얼굴을 못 찾으면 null을 돌려줍니다. 호출부에서 "얼굴 미검출" 상태를 명확히 보여줘야 합니다.
export async function detectFaceLandmarks(image) {
  const landmarker = await loadFaceLandmarker();
  const result = landmarker.detect(image);
  const landmarks = result?.faceLandmarks?.[0];
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks;
}
