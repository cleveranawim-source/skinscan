import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Info,
  Lock,
  MessageSquare,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  XCircle
} from 'lucide-react';
import './styles.css';

const roiLabels = ['이마', '양볼', '코', '눈가', '입가', '턱'];

const protocolSteps = [
  '정면 얼굴',
  '그림자 최소화',
  '필터/보정 없음',
  '같은 거리',
  '화장 여부 기록',
  '반복 비교'
];

const metricDefinitions = [
  {
    id: 'redness',
    label: '홍조',
    reliable: '높음',
    model: 'Lab a* 근사 + 볼/코 주변 붉은기 비율',
    area: '양볼, 코 주변',
    caution: '조명 색온도와 운동 직후 상태에 민감합니다.',
    description: '피부 기준색보다 붉은 성분이 얼마나 넓고 강하게 분포하는지 봅니다.'
  },
  {
    id: 'tone',
    label: '피부톤 균일도',
    reliable: '높음',
    model: '중앙 피부 ROI의 밝기/색 분산',
    area: '이마, 볼, 턱',
    caution: '그림자와 머리카락 가림은 톤 불균일로 오인될 수 있습니다.',
    description: '얼굴 부위별 밝기와 색 차이가 고르게 유지되는지 추정합니다.'
  },
  {
    id: 'spots',
    label: '색소·잡티 후보',
    reliable: '중간',
    model: '주변 피부 대비 어두운 국소 영역 후보',
    area: '볼, 이마',
    caution: '점, 수염, 그림자, 렌즈 노이즈를 완전히 구분하지는 못합니다.',
    description: '정상 피부 평균보다 어둡게 보이는 작은 영역의 비율을 확인합니다.'
  },
  {
    id: 'texture',
    label: '피부결·거침',
    reliable: '중간',
    model: '고주파 밝기 변화 + 미세 대비',
    area: '볼, 코 주변',
    caution: '카메라 해상도와 흔들림의 영향을 크게 받습니다.',
    description: '피부 표면의 미세한 밝기 변화가 얼마나 거칠게 나타나는지 봅니다.'
  },
  {
    id: 'shine',
    label: '번들거림',
    reliable: '중간',
    model: '저채도 고휘도 하이라이트 면적',
    area: '이마, 코',
    caution: '조명 반사와 실제 피지를 구분하기 어렵습니다.',
    description: '코와 이마 근처의 밝고 하얗게 반사되는 영역 비율을 계산합니다.'
  },
  {
    id: 'wrinkle',
    label: '잔주름 후보',
    reliable: '낮음',
    model: '선형 엣지 밀도',
    area: '눈가, 이마, 입가',
    caution: '사진 한 장으로 깊이나 탄력을 직접 측정할 수 없습니다.',
    description: '얇은 선형 패턴을 후보로 잡되, 신뢰도는 낮게 표시합니다.'
  }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digit = 0) => Number(value.toFixed(digit));

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return { l, s };
}

function scoreLabel(score) {
  if (score >= 85) return '안정';
  if (score >= 70) return '양호';
  if (score >= 55) return '관찰';
  return '주의';
}

function confidenceLabel(confidence) {
  if (confidence >= 82) return '높음';
  if (confidence >= 66) return '중간';
  return '낮음';
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ url, image });
    image.onerror = reject;
    image.src = url;
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function analyzePixels(image) {
  const maxSide = 720;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const cx = width / 2;
  const cy = height * 0.5;
  const rx = width * 0.31;
  const ry = height * 0.39;

  const samples = [];
  const grid = Array.from({ length: 12 }, () => ({ l: 0, r: 0, g: 0, b: 0, n: 0 }));
  let glare = 0;
  let redArea = 0;
  let darkArea = 0;
  let lumSum = 0;
  let lumSq = 0;
  let redSum = 0;
  let satSum = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const red = r - (g + b) / 2;
      const hsl = rgbToHsl(r, g, b);
      const bandX = clamp(Math.floor(((x - (cx - rx)) / (rx * 2)) * 4), 0, 3);
      const bandY = clamp(Math.floor(((y - (cy - ry)) / (ry * 2)) * 3), 0, 2);
      const cell = grid[bandY * 4 + bandX];

      samples.push({ x, y, lum, red });
      lumSum += lum;
      lumSq += lum * lum;
      redSum += red;
      satSum += hsl.s;
      cell.l += lum;
      cell.r += r;
      cell.g += g;
      cell.b += b;
      cell.n += 1;
      if (lum > 225 && hsl.s < 0.22) glare += 1;
      if (red > 18 && r > 105) redArea += 1;
    }
  }

  const n = Math.max(samples.length, 1);
  const avgLum = lumSum / n;
  const contrast = Math.sqrt(Math.max(0, lumSq / n - avgLum * avgLum));
  const avgRed = redSum / n;
  const avgSat = satSum / n;

  let edgeSum = 0;
  let edgeN = 0;
  for (let i = 0; i < samples.length; i += 3) {
    const { x, y, lum } = samples[i];
    const right = ((y * width + Math.min(width - 1, x + 2)) * 4);
    const down = ((Math.min(height - 1, y + 2) * width + x) * 4);
    const lumRight = 0.2126 * data[right] + 0.7152 * data[right + 1] + 0.0722 * data[right + 2];
    const lumDown = 0.2126 * data[down] + 0.7152 * data[down + 1] + 0.0722 * data[down + 2];
    edgeSum += Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
    edgeN += 2;
  }
  const edge = edgeSum / Math.max(edgeN, 1);

  samples.forEach((sample) => {
    if (sample.lum < avgLum - contrast * 1.15) darkArea += 1;
  });

  const populatedCells = grid.filter((cell) => cell.n > 20).map((cell) => ({
    l: cell.l / cell.n,
    r: cell.r / cell.n,
    g: cell.g / cell.n,
    b: cell.b / cell.n
  }));
  const meanCellLum = populatedCells.reduce((sum, cell) => sum + cell.l, 0) / Math.max(populatedCells.length, 1);
  const toneSpread = Math.sqrt(
    populatedCells.reduce((sum, cell) => sum + (cell.l - meanCellLum) ** 2, 0) / Math.max(populatedCells.length, 1)
  );

  const glareRatio = (glare / n) * 100;
  const redRatio = (redArea / n) * 100;
  const darkRatio = (darkArea / n) * 100;
  const resolutionScore = clamp((Math.min(image.width, image.height) / 900) * 100, 35, 100);
  const exposureScore = clamp(100 - Math.abs(avgLum - 145) * 0.85, 0, 100);
  const glareScore = clamp(100 - glareRatio * 7, 0, 100);
  const sharpnessScore = clamp(edge * 7.5, 0, 100);
  const uniformLightScore = clamp(100 - toneSpread * 2.1, 0, 100);
  const qualityScore = Math.round(
    exposureScore * 0.26 + glareScore * 0.24 + sharpnessScore * 0.22 + resolutionScore * 0.16 + uniformLightScore * 0.12
  );

  const quality = [
    {
      id: 'exposure',
      label: '노출',
      value: avgLum < 85 ? '어두움' : avgLum > 195 ? '과노출' : '적정',
      score: round(exposureScore),
      pass: exposureScore >= 68,
      detail: `평균 밝기 ${round(avgLum)}`
    },
    {
      id: 'glare',
      label: '반사광',
      value: glareRatio > 9 ? '강함' : glareRatio > 4 ? '주의' : '낮음',
      score: round(glareScore),
      pass: glareScore >= 68,
      detail: `하이라이트 ${round(glareRatio, 1)}%`
    },
    {
      id: 'sharpness',
      label: '선명도',
      value: sharpnessScore < 45 ? '흔들림 가능' : '확인 가능',
      score: round(sharpnessScore),
      pass: sharpnessScore >= 45,
      detail: `엣지 ${round(edge, 1)}`
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

  const confidencePenalty = quality.filter((item) => !item.pass).length * 8;
  const baseConfidence = clamp(qualityScore - confidencePenalty, 42, 94);
  const metrics = metricDefinitions.map((metric) => {
    let score;
    let raw;
    let confidence = baseConfidence;
    if (metric.id === 'redness') {
      score = clamp(96 - redRatio * 4.2 - Math.max(0, avgRed - 8) * 0.8, 15, 98);
      raw = `붉은 후보 ${round(redRatio, 1)}%, red index ${round(avgRed, 1)}`;
    }
    if (metric.id === 'tone') {
      score = clamp(98 - toneSpread * 2.2 - glareRatio * 1.3, 18, 98);
      raw = `톤 분산 ${round(toneSpread, 1)}, 평균 밝기 ${round(avgLum)}`;
    }
    if (metric.id === 'spots') {
      score = clamp(94 - darkRatio * 2.7 - contrast * 0.22, 18, 97);
      raw = `어두운 후보 ${round(darkRatio, 1)}%, 대비 ${round(contrast, 1)}`;
      confidence -= 4;
    }
    if (metric.id === 'texture') {
      score = clamp(96 - edge * 2.6 - contrast * 0.18, 16, 98);
      raw = `고주파 변화 ${round(edge, 1)}, 대비 ${round(contrast, 1)}`;
      confidence -= 6;
    }
    if (metric.id === 'shine') {
      score = clamp(96 - glareRatio * 5.2, 12, 98);
      raw = `저채도 하이라이트 ${round(glareRatio, 1)}%`;
      confidence -= 8;
    }
    if (metric.id === 'wrinkle') {
      score = clamp(92 - edge * 1.7 - contrast * 0.14, 20, 95);
      raw = `선형 후보 밀도 ${round(edge, 1)}`;
      confidence -= 18;
    }
    return {
      ...metric,
      score: Math.round(score),
      confidence: Math.round(clamp(confidence, 34, 94)),
      raw,
      status: scoreLabel(score)
    };
  });

  const overall = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);
  return {
    imageMeta: { width: image.width, height: image.height, sampleCount: n },
    raw: {
      avgLum: round(avgLum, 1),
      contrast: round(contrast, 1),
      avgSat: round(avgSat, 3),
      edge: round(edge, 1),
      glareRatio: round(glareRatio, 2),
      redRatio: round(redRatio, 2),
      darkRatio: round(darkRatio, 2),
      toneSpread: round(toneSpread, 2)
    },
    quality,
    qualityScore,
    confidence: Math.round(baseConfidence),
    overall,
    metrics
  };
}

const productCatalog = [
  {
    id: 'skin1004-centella',
    name: 'SKIN1004 마다가스카르 센텔라 앰플',
    category: '진정 앰플',
    fits: ['redness', 'texture'],
    strength: '자극 신호가 있을 때 1순위 후보',
    reason: '센텔라 중심의 단순한 진정 축이라 붉은기와 민감 신호가 있을 때 과한 활성 성분보다 안전한 편입니다.',
    caution: '여드름 치료제는 아닙니다. 병변이 반복되면 진정 제품보다 진료가 우선입니다.'
  },
  {
    id: 'anua-heartleaf',
    name: 'Anua 어성초 77 수딩 토너',
    category: '진정 토너',
    fits: ['redness', 'shine'],
    strength: '가벼운 진정/수분 보충 후보',
    reason: '어성초 추출물 기반의 가벼운 토너라 번들거림이 부담스러울 때 무거운 크림 전 단계로 쓰기 좋습니다.',
    caution: '토너만으로 장벽 회복은 부족합니다. 건조 신호가 있으면 크림을 함께 봐야 합니다.'
  },
  {
    id: 'aestura-atobarrier',
    name: 'AESTURA 아토베리어365 크림',
    category: '장벽 크림',
    fits: ['texture', 'wrinkle', 'tone'],
    strength: '장벽 약화/푸석함 후보',
    reason: '세라마이드 중심 보습 크림이라 거칠고 푸석한 신호가 있을 때 먼저 고려할 만합니다.',
    caution: '유분감이 답답하면 양을 줄이거나 밤에만 사용하세요.'
  },
  {
    id: 'torriden-divein',
    name: 'Torriden 다이브인 저분자 히알루론산 세럼',
    category: '수분 세럼',
    fits: ['texture', 'tone'],
    strength: '가벼운 수분 보충 후보',
    reason: '히알루론산 계열 수분 세럼이라 피부결이 거칠고 밝기 균일도가 떨어질 때 부담 낮은 선택지입니다.',
    caution: '건조한 환경에서는 단독 사용보다 크림으로 덮어야 수분 증발을 줄일 수 있습니다.'
  },
  {
    id: 'boj-relief-sun',
    name: 'Beauty of Joseon 맑은쌀 선크림',
    category: '자외선 차단',
    fits: ['tone', 'spots', 'wrinkle'],
    strength: '톤/잡티 관리의 기본값',
    reason: '색소·톤 불균일은 관리 제품보다 매일 쓰는 자외선 차단이 우선입니다.',
    caution: '눈시림, 트러블, 밀림이 있으면 같은 SPF라도 다른 제형을 선택하세요.'
  },
  {
    id: 'roundlab-dokdo',
    name: 'ROUND LAB 1025 독도 토너',
    category: '수분 토너',
    fits: ['texture', 'shine'],
    strength: '가벼운 수분/결 정돈 후보',
    reason: '무겁지 않은 보습 토너 후보라 번들거림과 푸석함이 동시에 보일 때 루틴을 무겁게 만들지 않습니다.',
    caution: '각질 정돈 성격이 맞지 않는 민감 피부는 사용 빈도를 낮춰 테스트하세요.'
  },
  {
    id: 'drg-red-blemish',
    name: 'Dr.G 레드 블레미쉬 클리어 수딩 크림',
    category: '진정 크림',
    fits: ['redness', 'spots'],
    strength: '붉은기+트러블 흔적 후보',
    reason: '진정 보습 크림 포지션이라 붉은기와 잡티 후보가 같이 보일 때 무난한 후보입니다.',
    caution: '활성 여드름을 빠르게 줄이는 약은 아니므로 염증성 병변은 별도 관리가 필요합니다.'
  }
];

function buildRecommendations(analysis) {
  const weakMetrics = [...analysis.metrics].sort((a, b) => a.score - b.score);
  const focusIds = new Set(weakMetrics.slice(0, 3).map((metric) => metric.id));
  const ranked = productCatalog
    .map((product) => {
      const matches = product.fits.filter((id) => focusIds.has(id));
      return {
        ...product,
        matchCount: matches.length,
        matchedLabels: matches.map((id) => analysis.metrics.find((metric) => metric.id === id)?.label).filter(Boolean)
      };
    })
    .filter((product) => product.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 4);
  return {
    focus: weakMetrics.slice(0, 3),
    products: ranked,
    avoid: [
      analysis.raw.glareRatio > 7 ? '강한 오일막/광택 제형' : '새 제품을 여러 개 동시에 시작하기',
      analysis.raw.redRatio > 5 ? '고농도 산/레티노이드의 즉시 도입' : '강한 스크럽',
      analysis.raw.contrast > 38 ? '필링 패드 매일 사용' : '향이 강한 제품'
    ]
  };
}

function AppHeader({ title, onBack }) {
  return (
    <header className="app-header">
      {onBack ? (
        <button className="icon-button" onClick={onBack} aria-label="뒤로">
          <ArrowLeft />
        </button>
      ) : (
        <span />
      )}
      <h1>{title}</h1>
      <span />
    </header>
  );
}

function GuideFrame({ imageUrl, mode = 'guide' }) {
  return (
    <div className={`guide-frame ${imageUrl ? 'with-photo' : ''}`}>
      {imageUrl ? <img src={imageUrl} alt="업로드한 얼굴 사진" /> : <div className="camera-grid" />}
      <div className="oval-guide" />
      {mode === 'analysis' && (
        <div className="roi-layer" aria-hidden="true">
          <span className="roi-chip forehead">이마</span>
          <span className="roi-chip left-cheek">볼</span>
          <span className="roi-chip right-cheek">볼</span>
          <span className="roi-chip nose">코</span>
          <span className="roi-chip under-eye">눈가</span>
          <span className="roi-chip chin">턱</span>
        </div>
      )}
      {mode === 'scan' && <div className="scan-beam" />}
    </div>
  );
}

function EmptyScreen({ onUpload, onOpenCamera }) {
  return (
    <main className="screen capture">
      <AppHeader title="SkinCheck Lab" />
      <section className="hero-copy">
        <p>사진 기반 피부 분석</p>
        <h2>먼저 사진이 분석 가능한지 검증합니다.</h2>
      </section>
      <GuideFrame mode="guide" />
      <section className="protocol-strip">
        {protocolSteps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </section>
      <section className="trust-panel">
        <div>
          <ShieldCheck />
          <strong>품질 게이트 우선</strong>
          <p>어둡거나 흔들린 사진은 점수 신뢰도를 낮춰 표시합니다.</p>
        </div>
        <div>
          <Lock />
          <strong>브라우저 안에서 처리</strong>
          <p>이 프로토타입은 업로드 사진을 서버로 보내지 않습니다.</p>
        </div>
      </section>
      <div className="capture-actions">
        <button className="primary-button" onClick={onOpenCamera}>
          <Camera />
          카메라 촬영
        </button>
        <label className="secondary-upload">
          <ImagePlus />
          사진 선택
          <input type="file" accept="image/*" onChange={onUpload} />
        </label>
      </div>
      <FeedbackButton />
      <p className="medical-note">미용 관리 참고용이며 질병 진단이나 치료 판단을 대신하지 않습니다.</p>
    </main>
  );
}

function CameraScreen({ onClose, onCaptured }) {
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
        <div className="camera-hud">
          <span>정면 얼굴</span>
          <span>그림자 최소화</span>
          <span>필터 없음</span>
        </div>
      </section>
      <section className={`camera-status ${error ? 'error' : ''}`}>
        {error ? <XCircle /> : <Info />}
        <p>{error || status}</p>
      </section>
      <div className="camera-controls">
        <button className="secondary-button" onClick={onClose}>
          취소
        </button>
        <button className="primary-button" onClick={captureFrame} disabled={!ready}>
          <Camera />
          촬영
        </button>
      </div>
    </main>
  );
}

function QualityScreen({ imageUrl, analysis, onUpload, onAnalyze, onReset }) {
  const passCount = analysis.quality.filter((item) => item.pass).length;
  const gateLabel = analysis.qualityScore >= 72 ? '분석 가능' : analysis.qualityScore >= 55 ? '제한적 분석' : '재촬영 권장';
  return (
    <main className="screen">
      <AppHeader title="촬영 품질" onBack={onReset} />
      <section className="score-hero">
        <div>
          <p>품질 점수</p>
          <strong>{analysis.qualityScore}</strong>
        </div>
        <span className={analysis.qualityScore >= 72 ? 'status-good' : 'status-warn'}>{gateLabel}</span>
      </section>
      <GuideFrame imageUrl={imageUrl} mode="scan" />
      <section className="quality-grid">
        {analysis.quality.map((item) => (
          <div className={`quality-card-v2 ${item.pass ? 'pass' : 'warn'}`} key={item.id}>
            {item.pass ? <CheckCircle2 /> : <AlertTriangle />}
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </section>
      <section className="gate-copy">
        <Info />
        <p>{passCount}/4개 조건이 통과되었습니다. 통과하지 못한 항목은 결과의 신뢰도를 자동으로 낮춥니다.</p>
      </section>
      <div className="action-row">
        <label className="secondary-upload">
          <RotateCcw />
          다시 선택
          <input type="file" accept="image/*" onChange={onUpload} />
        </label>
        <button className="primary-button" onClick={onAnalyze}>
          <ScanLine />
          분석 실행
        </button>
      </div>
    </main>
  );
}

function MetricBar({ metric, onSelect }) {
  return (
    <button className="metric-card" onClick={() => onSelect(metric)}>
      <div className="metric-head">
        <span>{metric.label}</span>
        <strong>{metric.score}</strong>
      </div>
      <div className="bar">
        <i style={{ width: `${metric.score}%` }} />
      </div>
      <div className="metric-foot">
        <small>{metric.area}</small>
        <small>신뢰도 {confidenceLabel(metric.confidence)}</small>
      </div>
      <ChevronRight />
    </button>
  );
}

function ReportScreen({ imageUrl, analysis, onBack, onSelect }) {
  const weakest = [...analysis.metrics].sort((a, b) => a.score - b.score).slice(0, 2);
  const recommendations = buildRecommendations(analysis);
  return (
    <main className="screen report">
      <AppHeader title="분석 리포트" onBack={onBack} />
      <section className="report-summary">
        <div>
          <p>종합 점수</p>
          <strong>{analysis.overall}</strong>
          <span>결과 신뢰도 {analysis.confidence}%</span>
        </div>
        <div className="mini-stack">
          <span>관리 우선</span>
          {weakest.map((metric) => (
            <b key={metric.id}>{metric.label}</b>
          ))}
        </div>
      </section>
      <GuideFrame imageUrl={imageUrl} mode="analysis" />
      <section className="pipeline-card">
        <h2>분석 파이프라인</h2>
        <div className="pipeline">
          {['품질 검사', '피부 ROI', '색·질감 특징', '기준 보정', '신뢰도 표시'].map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </section>
      <section className="metric-list">
        <h2>항목별 추정</h2>
        {analysis.metrics.map((metric) => (
          <MetricBar metric={metric} key={metric.id} onSelect={onSelect} />
        ))}
      </section>
      <section className="recommend-card">
        <div className="recommend-title">
          <SlidersHorizontal />
          <div>
            <h2>한국 화장품 추천</h2>
            <p>점수가 낮은 항목과 제형 리스크를 기준으로 고른 후보입니다.</p>
          </div>
        </div>
        <div className="focus-row">
          {recommendations.focus.map((metric) => (
            <span key={metric.id}>{metric.label} {metric.score}</span>
          ))}
        </div>
        <div className="product-list">
          {recommendations.products.map((product) => (
            <article className="product-card" key={product.id}>
              <div>
                <span>{product.category}</span>
                <h3>{product.name}</h3>
              </div>
              <strong>{product.strength}</strong>
              <p>{product.reason}</p>
              <small>맞는 신호: {product.matchedLabels.join(', ')}</small>
              <em>{product.caution}</em>
            </article>
          ))}
        </div>
        <div className="avoid-box">
          <strong>이번 결과에서 피할 것</strong>
          {recommendations.avoid.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
      <section className="limitation-card">
        <AlertTriangle />
        <p>화장품 추천은 진단이 아니라 성분/제형 후보입니다. 전성분 변경, 개인 알레르기, 기존 처방약과의 충돌 가능성은 구매 전 반드시 확인하세요.</p>
      </section>
      <FeedbackButton analysis={analysis} />
    </main>
  );
}

function DetailScreen({ metric, analysis, onBack }) {
  return (
    <main className="screen detail">
      <AppHeader title={metric.label} onBack={onBack} />
      <section className="detail-score-card">
        <div>
          <p>{metric.status}</p>
          <strong>{metric.score}</strong>
        </div>
        <span>신뢰도 {metric.confidence}%</span>
      </section>
      <section className="evidence-card">
        <h2>판단 근거</h2>
        <dl>
          <div>
            <dt>분석 부위</dt>
            <dd>{metric.area}</dd>
          </div>
          <div>
            <dt>분석 방법</dt>
            <dd>{metric.model}</dd>
          </div>
          <div>
            <dt>원시 단서</dt>
            <dd>{metric.raw}</dd>
          </div>
          <div>
            <dt>사진 기반 가능도</dt>
            <dd>{metric.reliable}</dd>
          </div>
        </dl>
      </section>
      <section className="explain-card">
        <h2>해석</h2>
        <p>{metric.description}</p>
      </section>
      <section className="explain-card warn">
        <h2>주의</h2>
        <p>{metric.caution}</p>
      </section>
      <section className="raw-card">
        <h2>이미지 신호</h2>
        <div>
          <span>밝기 {analysis.raw.avgLum}</span>
          <span>대비 {analysis.raw.contrast}</span>
          <span>반사 {analysis.raw.glareRatio}%</span>
          <span>붉은 후보 {analysis.raw.redRatio}%</span>
        </div>
      </section>
    </main>
  );
}

function FeedbackButton({ analysis }) {
  const [copied, setCopied] = useState(false);

  async function copyFeedbackTemplate() {
    const focus = analysis
      ? [...analysis.metrics]
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((metric) => `${metric.label} ${metric.score}`)
          .join(', ')
      : '분석 전';
    const template = [
      '[SkinCheck Lab 테스트 피드백]',
      `테스트 단계: ${analysis ? '분석 결과 확인' : '첫 화면/촬영 전'}`,
      analysis ? `종합 점수: ${analysis.overall}, 신뢰도: ${analysis.confidence}%` : '종합 점수: 없음',
      `관리 우선 항목: ${focus}`,
      '',
      '1. 촬영/사진 선택 과정에서 불편했던 점:',
      '',
      '2. 분석 결과가 납득된 부분:',
      '',
      '3. 분석 결과가 이상하거나 과장되어 보인 부분:',
      '',
      '4. 화장품 추천이 맞거나 틀려 보인 이유:',
      '',
      '5. 사용 기기/브라우저:',
      '',
      '6. 기타 의견:'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('아래 피드백 양식을 복사해 주세요.', template);
    }
  }

  return (
    <button className="feedback-button" onClick={copyFeedbackTemplate}>
      <MessageSquare />
      {copied ? '피드백 양식 복사됨' : '테스터 피드백 양식 복사'}
    </button>
  );
}

function App() {
  const [stage, setStage] = useState('empty');
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const { url, image } = await readImage(file);
    const result = analyzePixels(image);
    setImageUrl(url);
    setAnalysis(result);
    setSelectedMetric(null);
    setStage('quality');
    event.target.value = '';
  }

  function acceptImage(url, image) {
    const result = analyzePixels(image);
    setImageUrl(url);
    setAnalysis(result);
    setSelectedMetric(null);
    setStage('quality');
  }

  const screen = useMemo(() => {
    if (stage === 'detail' && selectedMetric && analysis) {
      return <DetailScreen metric={selectedMetric} analysis={analysis} onBack={() => setStage('report')} />;
    }
    if (stage === 'report' && analysis) {
      return (
        <ReportScreen
          imageUrl={imageUrl}
          analysis={analysis}
          onBack={() => {
            setStage('quality');
          }}
          onSelect={(metric) => {
            setSelectedMetric(metric);
            setStage('detail');
          }}
        />
      );
    }
    if (stage === 'quality' && analysis) {
      return (
        <QualityScreen
          imageUrl={imageUrl}
          analysis={analysis}
          onUpload={handleUpload}
          onAnalyze={() => setStage('report')}
          onReset={() => {
            setImageUrl('');
            setAnalysis(null);
            setStage('empty');
          }}
        />
      );
    }
    if (stage === 'camera') {
      return <CameraScreen onClose={() => setStage('empty')} onCaptured={acceptImage} />;
    }
    return <EmptyScreen onUpload={handleUpload} onOpenCamera={() => setStage('camera')} />;
  }, [analysis, imageUrl, selectedMetric, stage]);

  return (
    <div className="app-shell">
      <section className="phone-wrap">{screen}</section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
