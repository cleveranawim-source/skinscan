import { rgbToLab, rgbSaturation, itaAngle, itaCategory } from './colorScience';
import { buildRois, estimateFaceGeometry } from './roi';
import { detectFaceLandmarks } from './faceMesh';
import { metricDefinitions } from './metricDefinitions';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const round = (value, digit = 0) => Number(value.toFixed(digit));

export function scoreLabel(score) {
  if (score >= 85) return '안정';
  if (score >= 70) return '양호';
  if (score >= 55) return '관찰';
  return '주의';
}

// 점수 등급에 맞춰 UI 색상을 통일하기 위한 톤. scoreLabel과 같은 경계값을 씁니다.
export function scoreTone(score) {
  if (score >= 85) return 'good';
  if (score >= 70) return 'ok';
  if (score >= 55) return 'watch';
  return 'warn';
}

export function confidenceLabel(confidence) {
  if (confidence >= 82) return '높음';
  if (confidence >= 66) return '중간';
  return '낮음';
}

const QUALITY_WEIGHTS = {
  exposure: 0.2,
  glare: 0.18,
  sharpness: 0.16,
  resolution: 0.1,
  faceSize: 0.14,
  faceCenter: 0.12,
  faceRoll: 0.1
};

function weightedQualityScore(quality) {
  let total = 0;
  let weightSum = 0;
  quality.forEach((item) => {
    const weight = QUALITY_WEIGHTS[item.id] ?? 0.1;
    total += item.score * weight;
    weightSum += weight;
  });
  return weightSum > 0 ? total / weightSum : 0;
}

// 원형 ROI 안의 픽셀만 모아 Lab/휘도/엣지/하이라이트 통계를 냅니다.
function sampleRegion(data, width, height, roi) {
  const { cx, cy, r } = roi;
  const minX = Math.max(0, Math.floor(cx - r));
  const maxX = Math.min(width - 2, Math.ceil(cx + r));
  const minY = Math.max(0, Math.floor(cy - r));
  const maxY = Math.min(height - 2, Math.ceil(cy + r));
  const r2 = r * r;

  const samples = [];
  let lumSum = 0;
  let lSum = 0;
  let aSum = 0;
  let bSum = 0;
  let edgeSum = 0;
  let glare = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const idx = (y * width + x) * 4;
      const red = data[idx];
      const green = data[idx + 1];
      const blue = data[idx + 2];
      const lum = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const lab = rgbToLab(red, green, blue);
      const sat = rgbSaturation(red, green, blue);

      const rightIdx = (y * width + (x + 1)) * 4;
      const downIdx = ((y + 1) * width + x) * 4;
      const lumRight = 0.2126 * data[rightIdx] + 0.7152 * data[rightIdx + 1] + 0.0722 * data[rightIdx + 2];
      const lumDown = 0.2126 * data[downIdx] + 0.7152 * data[downIdx + 1] + 0.0722 * data[downIdx + 2];

      samples.push({ lum, l: lab.l, a: lab.a, b: lab.b });
      lumSum += lum;
      lSum += lab.l;
      aSum += lab.a;
      bSum += lab.b;
      edgeSum += Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      if (lum > 225 && sat < 0.22) glare += 1;
    }
  }

  const n = Math.max(samples.length, 1);
  const meanLum = lumSum / n;
  let lumSq = 0;
  samples.forEach((sample) => {
    lumSq += (sample.lum - meanLum) ** 2;
  });
  const lumStd = Math.sqrt(lumSq / n);
  const darkCount = samples.filter((sample) => sample.lum < meanLum - lumStd * 1.1).length;

  return {
    n,
    meanLum,
    meanL: lSum / n,
    meanA: aSum / n,
    meanB: bSum / n,
    meanEdge: edgeSum / n,
    glareRatio: (glare / n) * 100,
    darkRatio: (darkCount / n) * 100,
    lumStd
  };
}

// 얼굴 박스를 감싸는 사각형 전체(주변 여백 포함)로 촬영 품질(노출/반사/선명도)을 판단합니다.
function sampleRect(data, width, height, rect) {
  const step = 2;
  let lumSum = 0;
  let lumSq = 0;
  let edgeSum = 0;
  let glare = 0;
  let n = 0;

  for (let y = rect.minY; y <= rect.maxY; y += step) {
    for (let x = rect.minX; x <= rect.maxX; x += step) {
      const idx = (y * width + x) * 4;
      const red = data[idx];
      const green = data[idx + 1];
      const blue = data[idx + 2];
      const lum = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const sat = rgbSaturation(red, green, blue);

      const rightIdx = (y * width + Math.min(width - 1, x + 2)) * 4;
      const downIdx = (Math.min(height - 1, y + 2) * width + x) * 4;
      const lumRight = 0.2126 * data[rightIdx] + 0.7152 * data[rightIdx + 1] + 0.0722 * data[rightIdx + 2];
      const lumDown = 0.2126 * data[downIdx] + 0.7152 * data[downIdx + 1] + 0.0722 * data[downIdx + 2];

      lumSum += lum;
      lumSq += lum * lum;
      edgeSum += Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      if (lum > 225 && sat < 0.22) glare += 1;
      n += 1;
    }
  }

  const count = Math.max(n, 1);
  const meanLum = lumSum / count;
  const lumStd = Math.sqrt(Math.max(0, lumSq / count - meanLum * meanLum));
  return { meanLum, lumStd, meanEdge: edgeSum / count, glareRatio: (glare / count) * 100 };
}

function buildAmbientQuality(ambient, resolutionScore, image) {
  const exposureScore = clamp(100 - Math.abs(ambient.meanLum - 145) * 0.85, 0, 100);
  const glareScore = clamp(100 - ambient.glareRatio * 7, 0, 100);
  const sharpnessScore = clamp(ambient.meanEdge * 7.5, 0, 100);
  return [
    {
      id: 'exposure',
      label: '노출',
      value: ambient.meanLum < 85 ? '어두움' : ambient.meanLum > 195 ? '과노출' : '적정',
      score: round(exposureScore),
      pass: exposureScore >= 68,
      detail: `평균 밝기 ${round(ambient.meanLum)}`
    },
    {
      id: 'glare',
      label: '반사광',
      value: ambient.glareRatio > 9 ? '강함' : ambient.glareRatio > 4 ? '주의' : '낮음',
      score: round(glareScore),
      pass: glareScore >= 68,
      detail: `하이라이트 ${round(ambient.glareRatio, 1)}%`
    },
    {
      id: 'sharpness',
      label: '선명도',
      value: sharpnessScore < 45 ? '흔들림 가능' : '확인 가능',
      score: round(sharpnessScore),
      pass: sharpnessScore >= 45,
      detail: `엣지 ${round(ambient.meanEdge, 1)}`
    },
    {
      id: 'resolution',
      label: '해상도',
      value: resolutionScore < 75 ? '부족' : '충분',
      score: round(resolutionScore),
      pass: resolutionScore >= 65,
      detail: `${image.width} x ${image.height}`
    }
  ];
}

function toneSpreadValue(roiStats) {
  const ids = ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin'];
  const means = ids.map((id) => roiStats[id].meanL);
  const avg = means.reduce((sum, value) => sum + value, 0) / means.length;
  return Math.sqrt(means.reduce((sum, value) => sum + (value - avg) ** 2, 0) / means.length);
}

function buildMetrics(roiStats, ambient, baseConfidence) {
  const { forehead, leftCheek, rightCheek, nose, leftUnderEye, rightUnderEye, chin, mouthCorners } = roiStats;

  const rednessRel = (leftCheek.meanA + rightCheek.meanA + nose.meanA) / 3 - forehead.meanA;
  const toneSpread = toneSpreadValue(roiStats);
  const toneAvgL = (forehead.meanL + leftCheek.meanL + rightCheek.meanL + nose.meanL + chin.meanL) / 5;
  const toneAvgB = (forehead.meanB + leftCheek.meanB + rightCheek.meanB + nose.meanB + chin.meanB) / 5;
  const ita = itaAngle(toneAvgL, toneAvgB);
  const spotsDark = (forehead.darkRatio + leftCheek.darkRatio + rightCheek.darkRatio) / 3;
  const textureEdge = (leftCheek.meanEdge + rightCheek.meanEdge + nose.meanEdge) / 3;
  const shineGlare = (forehead.glareRatio + nose.glareRatio) / 2;
  const wrinkleEdge = (leftUnderEye.meanEdge + rightUnderEye.meanEdge + forehead.meanEdge + mouthCorners.meanEdge) / 4;

  const scores = {
    redness: clamp(96 - Math.max(0, rednessRel) * 7, 15, 98),
    tone: clamp(98 - toneSpread * 2.2 - ambient.glareRatio * 1.0, 18, 98),
    spots: clamp(94 - spotsDark * 2.7 - ambient.lumStd * 0.2, 18, 97),
    texture: clamp(96 - textureEdge * 2.6 - ambient.lumStd * 0.16, 16, 98),
    shine: clamp(96 - shineGlare * 5.2, 12, 98),
    wrinkle: clamp(92 - wrinkleEdge * 1.7 - ambient.lumStd * 0.12, 20, 95)
  };

  const raw = {
    redness: `이마 대비 볼·코 a* +${round(Math.max(0, rednessRel), 1)}`,
    tone: `톤 분산 ${round(toneSpread, 1)}, ITA ${round(ita, 1)}° (${itaCategory(ita)})`,
    spots: `부위 내 어두운 후보 ${round(spotsDark, 1)}%`,
    texture: `고주파 변화 ${round(textureEdge, 1)}`,
    shine: `T존 하이라이트 ${round(shineGlare, 1)}%`,
    wrinkle: `눈가·이마·입가 선형 후보 밀도 ${round(wrinkleEdge, 1)}`
  };

  const confidenceOffsets = { redness: 0, tone: 0, spots: -4, texture: -6, shine: -8, wrinkle: -18 };

  return metricDefinitions.map((metric) => {
    const score = scores[metric.id];
    const confidence = clamp(baseConfidence + confidenceOffsets[metric.id], 34, 94);
    return {
      ...metric,
      score: Math.round(score),
      confidence: Math.round(confidence),
      raw: raw[metric.id],
      status: scoreLabel(score)
    };
  });
}

export async function analyzeImage(image) {
  const maxSide = 840;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const resolutionScore = clamp((Math.min(image.width, image.height) / 900) * 100, 35, 100);

  let landmarks = null;
  let faceMeshError = false;
  try {
    landmarks = await detectFaceLandmarks(canvas);
  } catch (error) {
    faceMeshError = true;
  }

  if (!landmarks) {
    const ambient = sampleRect(data, width, height, { minX: 0, minY: 0, maxX: width - 2, maxY: height - 2 });
    const quality = buildAmbientQuality(ambient, resolutionScore, image);
    return {
      faceDetected: false,
      faceMeshError,
      imageMeta: { width: image.width, height: image.height },
      quality,
      qualityScore: Math.round(weightedQualityScore(quality)),
      confidence: 0,
      overall: 0,
      metrics: [],
      rois: null
    };
  }

  const rois = buildRois(landmarks, width, height);
  const geometry = estimateFaceGeometry(landmarks, width, height);
  const { box } = geometry;
  const padX = (box.maxX - box.minX) * 0.35;
  const padY = (box.maxY - box.minY) * 0.35;
  const ambient = sampleRect(data, width, height, {
    minX: Math.max(0, Math.floor(box.minX - padX)),
    minY: Math.max(0, Math.floor(box.minY - padY)),
    maxX: Math.min(width - 2, Math.ceil(box.maxX + padX)),
    maxY: Math.min(height - 2, Math.ceil(box.maxY + padY))
  });

  const roiStats = {};
  Object.entries(rois).forEach(([name, roi]) => {
    roiStats[name] = sampleRegion(data, width, height, roi);
  });

  const quality = buildAmbientQuality(ambient, resolutionScore, image);
  const faceSizeScore = clamp(geometry.sizeRatio * 230, 0, 100);
  const faceCenterScore = clamp(100 - geometry.centerOffset * 260, 0, 100);
  const faceRollScore = clamp(100 - Math.abs(geometry.rollDeg) * 4, 0, 100);
  quality.push(
    {
      id: 'faceSize',
      label: '얼굴 크기',
      value: geometry.sizeRatio >= 0.32 ? '적정' : '너무 작음',
      score: round(faceSizeScore),
      pass: geometry.sizeRatio >= 0.32,
      detail: `프레임 대비 ${round(geometry.sizeRatio * 100)}%`
    },
    {
      id: 'faceCenter',
      label: '중앙 정렬',
      value: geometry.centerOffset <= 0.14 ? '중앙' : '치우침',
      score: round(faceCenterScore),
      pass: geometry.centerOffset <= 0.14,
      detail: `오차 ${round(geometry.centerOffset * 100)}%`
    },
    {
      id: 'faceRoll',
      label: '기울기',
      value: Math.abs(geometry.rollDeg) <= 12 ? '수평' : '기울어짐',
      score: round(faceRollScore),
      pass: Math.abs(geometry.rollDeg) <= 12,
      detail: `${round(geometry.rollDeg, 1)}°`
    }
  );

  const qualityScore = Math.round(weightedQualityScore(quality));
  const confidencePenalty = quality.filter((item) => !item.pass).length * 6;
  const baseConfidence = clamp(qualityScore - confidencePenalty, 42, 96);

  const metrics = buildMetrics(roiStats, ambient, baseConfidence);
  const overall = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);

  return {
    faceDetected: true,
    faceMeshError,
    imageMeta: { width: image.width, height: image.height, sampleCount: roiStats.forehead.n },
    raw: {
      avgLum: round(ambient.meanLum, 1),
      contrast: round(ambient.lumStd, 1),
      edge: round(ambient.meanEdge, 1),
      glareRatio: round(ambient.glareRatio, 2),
      redRatio: round((roiStats.leftCheek.meanA + roiStats.rightCheek.meanA) / 2, 2),
      darkRatio: round((roiStats.forehead.darkRatio + roiStats.leftCheek.darkRatio + roiStats.rightCheek.darkRatio) / 3, 2),
      toneSpread: round(toneSpreadValue(roiStats), 2)
    },
    quality,
    qualityScore,
    confidence: Math.round(baseConfidence),
    overall,
    metrics,
    rois
  };
}
