// sRGB(D65) -> CIE 1976 L*a*b* 변환. 홍조(a*)와 피부톤(L*, ITA°) 계산에 사용합니다.
// 참고: 이전 버전은 r - (g+b)/2 같은 임시 근사식을 썼는데, 실제 색차 지표인 a*를 쓰면
// 조명 색온도 변화에 덜 흔들리는 값이 나옵니다.

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function labF(t) {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

const WHITE_D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

export function rgbToLab(r, g, b) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;

  const fx = labF(x / WHITE_D65.x);
  const fy = labF(y / WHITE_D65.y);
  const fz = labF(z / WHITE_D65.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

// ITA(Individual Typology Angle): 피부과학에서 피부톤을 분류할 때 쓰는 표준 지표.
// 높을수록 밝은 톤, 낮을수록 어두운 톤으로 분류됩니다.
export function itaAngle(l, b) {
  return (Math.atan2(l - 50, b) * 180) / Math.PI;
}

// 반사광(하이라이트) 판정에 쓰는 채도. HSL의 s와 동일합니다.
export function rgbSaturation(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

export function itaCategory(ita) {
  if (ita > 55) return '매우 밝은 톤';
  if (ita > 41) return '밝은 톤';
  if (ita > 28) return '중간 밝은 톤';
  if (ita > 10) return '중간 톤';
  if (ita > -30) return '중간 어두운 톤';
  return '어두운 톤';
}
