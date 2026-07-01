// MediaPipe Face Landmarker의 468점 표준 메쉬 인덱스 중 각 부위를 대표하는 점들.
// 한 점만 쓰면 잡음에 약해서, 부위마다 2~4개 점의 평균 좌표를 중심으로 잡습니다.
const LANDMARK_CLUSTERS = {
  forehead: [109, 10, 338, 151],
  leftCheek: [50, 187, 205],
  rightCheek: [280, 411, 425],
  nose: [4, 195, 197],
  leftUnderEye: [145, 163, 7],
  rightUnderEye: [374, 390, 249],
  chin: [152, 175, 199],
  mouthCorners: [61, 291]
};

const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

function averagePoint(landmarks, indices, width, height) {
  let sx = 0;
  let sy = 0;
  indices.forEach((index) => {
    sx += landmarks[index].x * width;
    sy += landmarks[index].y * height;
  });
  return { x: sx / indices.length, y: sy / indices.length };
}

// 눈 사이 거리(inter-ocular distance)는 얼굴 크기에 비례해서 늘어나므로
// ROI 반지름을 사진마다 다른 얼굴 크기에 맞춰 스케일하는 기준으로 씁니다.
function interOcularDistance(landmarks, width, height) {
  const left = { x: landmarks[LEFT_EYE_OUTER].x * width, y: landmarks[LEFT_EYE_OUTER].y * height };
  const right = { x: landmarks[RIGHT_EYE_OUTER].x * width, y: landmarks[RIGHT_EYE_OUTER].y * height };
  return Math.hypot(right.x - left.x, right.y - left.y);
}

export function buildRois(landmarks, width, height) {
  const iod = interOcularDistance(landmarks, width, height);
  const radius = Math.max(10, iod * 0.62);
  const rois = {};
  Object.entries(LANDMARK_CLUSTERS).forEach(([name, indices]) => {
    const center = averagePoint(landmarks, indices, width, height);
    rois[name] = { cx: center.x, cy: center.y, r: radius, xPct: (center.x / width) * 100, yPct: (center.y / height) * 100 };
  });
  return rois;
}

export function estimateFaceGeometry(landmarks, width, height) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  landmarks.forEach((point) => {
    const x = point.x * width;
    const y = point.y * height;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const left = { x: landmarks[LEFT_EYE_OUTER].x * width, y: landmarks[LEFT_EYE_OUTER].y * height };
  const right = { x: landmarks[RIGHT_EYE_OUTER].x * width, y: landmarks[RIGHT_EYE_OUTER].y * height };
  const rollDeg = (Math.atan2(right.y - left.y, right.x - left.x) * 180) / Math.PI;

  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const boxCx = (minX + maxX) / 2;
  const boxCy = (minY + maxY) / 2;
  const imgDiag = Math.hypot(width, height);
  const centerOffset = Math.hypot(boxCx - width / 2, boxCy - height / 2) / imgDiag;
  const sizeRatio = Math.hypot(faceWidth, faceHeight) / imgDiag;

  return { rollDeg, sizeRatio, centerOffset, box: { minX, minY, maxX, maxY } };
}
