# SkinCheck Lab

사진 기반 피부 상태 체크 흐름을 테스트하기 위한 브라우저 전용 MVP입니다.

이 앱은 의료 진단 도구가 아닙니다. 사용자가 직접 촬영하거나 선택한 얼굴 사진에서 얼굴 부위(이마·양볼·코·눈가·턱)를 인식한 뒤, 그 부위에서만 밝기·색차(CIELAB)·반사·질감 같은 이미지 신호를 계산해 미용 관리 참고용 점수로 보여줍니다.

## 주요 기능

- 카메라 촬영 또는 로컬 사진 선택
- **카메라 미리보기 중 실시간 얼굴 정렬 가이드** — 거리/중앙/기울기가 맞으면 오벌 테두리가 초록색으로 바뀝니다
- **버스트 촬영(3연속 프레임 평균)** — 셔터를 누르면 짧은 간격으로 3장을 찍어 평균해, 손떨림/찰나의 노이즈에 덜 민감한 사진을 만듭니다
- **얼굴 랜드마크 인식(MediaPipe Face Landmarker)으로 이마·양볼·코·눈가·턱 위치를 실제로 찾아 그 부위에서만 분석**
- 서버 업로드 없는 브라우저 내부 처리 — 인식 모델(wasm+가중치)도 CDN이 아니라 `public/mediapipe`에 내장되어 외부 호출 없이 동작
- 분석 전 사진 품질 게이트(노출·반사·선명도·해상도·색상 정보) + 얼굴 정렬 게이트(크기·중앙 정렬·기울기) — **품질이 기준 미달이면 실제로 분석 버튼이 막힙니다**
- 노출 판정은 절대 밝기가 아니라 암부/명부 클리핑(디테일 손실) 기준이라 피부톤에 따라 불리해지지 않습니다
- 얼굴을 못 찾거나 인식 모델을 못 불러온 경우 분석을 막고 원인을 안내
- CIELAB a*/L*/ITA° 기반 홍조·톤 계산 (이마를 기준선으로 삼아 조명 영향을 상쇄)
- 항목별 피부 신호 점수와 신뢰도 표시, 등급별 색상(초록/황/빨강) 코딩
- 한국 화장품 후보 추천 (30개 후보, 2025 올리브영 어워즈 수상작은 배지로 표시, 정보 갱신일과 검증 상태를 화면에 직접 표시)
- **분석 기록/추이 보기** — 점수만 이 브라우저에 저장(사진은 저장하지 않음), 언제든 삭제 가능
- **분석 기록 내보내기/가져오기** — JSON 파일로 백업하거나 다른 기기로 옮길 수 있습니다
- 홈 화면에 추가할 수 있는 PWA 매니페스트/아이콘
- 테스터 피드백 양식 복사

## 하지 않는 것

- 피부 질환을 진단하지 않습니다.
- 실제 수분량, 피지량, 탄력, 주름 깊이를 측정하지 않습니다.
- 사진을 서버로 업로드하지 않습니다.
- 검증된 피부과 AI 모델이라고 주장하지 않습니다.
- 특정 제품 효과를 보장하지 않습니다.

## 아키텍처

```
src/
  lib/
    colorScience.js     sRGB -> CIELAB, ITA° 계산
    faceMesh.js          MediaPipe FaceLandmarker 로더 (self-hosted wasm/모델)
    roi.js               랜드마크 인덱스 -> 부위별 픽셀 좌표/반지름, 얼굴 각도·크기·중심 오차
    analysis.js          품질 게이트 + 부위별 6개 지표 스코어링 파이프라인
    metricDefinitions.js 지표 메타데이터(라벨/설명/주의문)
    productCatalog.js    화장품 후보 데이터 + 정보 갱신일
    recommendations.js   점수 기반 제품 매칭
    history.js           localStorage 기록 저장/추이 계산
    imageUtils.js        이미지 로드 유틸
    constants.js         촬영 프로토콜 문구, ROI 라벨
  components/            화면 단위 컴포넌트 (Empty/Camera/Analyzing/Quality/Report/Detail/History)
  App.jsx                화면 전환 상태 머신
public/
  mediapipe/wasm/        MediaPipe 실행에 필요한 wasm 런타임
  mediapipe/models/      face_landmarker.task (약 3.7MB)
```

## 로컬 실행

```bash
npm install
npm run dev
```

Vite가 출력하는 로컬 주소를 엽니다. 보통 `http://127.0.0.1:5173/` 또는 `http://127.0.0.1:5174/`입니다.

## 빌드

```bash
npm run build
```

`public/mediapipe`의 wasm/모델 파일도 함께 `dist/`로 복사됩니다.

## GitHub Pages 배포

이 저장소는 GitHub Actions가 아니라 `gh-pages` 브랜치로 배포합니다.

```bash
npm run deploy
```

내부적으로 `npm run build` 후 `dist/`를 `gh-pages` 브랜치에 푸시합니다(`gh-pages` 패키지 사용). 저장소 `Settings` → `Pages`에서 Source를 `gh-pages` 브랜치로 지정해두면 됩니다.

## 테스터에게 공유할 때

아래 문구를 같이 보내는 것을 권장합니다.

> 이 앱은 사진 기반 피부 상태 체크 흐름을 실험하는 초기 MVP입니다. 미용 관리 참고와 사용성 피드백 수집 목적이며, 의료 진단이 아닙니다. 사진과 인식 모델 모두 서버로 전송되지 않고 브라우저 안에서 처리됩니다.

## 제품 추천 기준

화장품 추천은 현재 사진에서 관찰되는 이미지 신호와 제품 포지셔닝을 바탕으로 한 후보 제안입니다. 구매 전에는 최신 전성분, 알레르기, 기존 처방 약물과의 충돌 가능성을 반드시 확인해야 합니다.

자세한 기준은 [PRODUCT_RECOMMENDATION_POLICY.md](./PRODUCT_RECOMMENDATION_POLICY.md)를 참고하세요.

## 개인정보와 테스트 가이드

- 개인정보 안내: [PRIVACY.md](./PRIVACY.md)
- 테스트 가이드: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
