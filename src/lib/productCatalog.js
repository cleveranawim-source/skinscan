// 화장품 후보 데이터. 실제 서비스 전환 시 이 파일을 기준으로 전성분/재고를 재검증하세요.
// 자세한 매칭 기준은 PRODUCT_RECOMMENDATION_POLICY.md 참고.
//
// tier: 'A'는 2025 올리브영 어워즈 수상작 등 공식 자료로 확인되는 항목, 'B'는 스테디셀러/
// 브랜드 인지도 기준 후보입니다(둘 다 이 앱이 자체적으로 검증한 것은 아닙니다).
// 카테고리는 클렌징·마스크팩·메이크업(쿠션/립/아이)·헤어·바디케어를 제외하고, 이 앱이
// 실제로 점수를 매기는 얼굴 피부 신호(홍조/톤/잡티/결/번들거림/주름)와 연결되는
// 선케어·토너/미스트·세럼/앰플·크림/보습·패드만 다룹니다.
export const catalogUpdatedAt = '2026-07-01';
export const catalogReviewStatus = '테스트용 후보 목록 · 공개 전 전성분/재고 재검증 필요';

export const productCatalog = [
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
    caution: '토너만으로 장벽 회복은 부족합니다. 건조 신호가 있으면 크림을 함께 봐야 합니다.',
    tier: 'A'
  },
  {
    id: 'aestura-atobarrier',
    name: 'AESTURA(에스트라) 아토베리어365 크림',
    category: '장벽 크림',
    fits: ['texture', 'wrinkle', 'tone'],
    strength: '장벽 약화/푸석함 후보',
    reason: '세라마이드 중심 보습 크림이라 거칠고 푸석한 신호가 있을 때 먼저 고려할 만합니다.',
    caution: '유분감이 답답하면 양을 줄이거나 밤에만 사용하세요.',
    tier: 'A'
  },
  {
    id: 'torriden-divein',
    name: 'Torriden 다이브인 저분자 히알루론산 세럼',
    category: '수분 세럼',
    fits: ['texture', 'tone'],
    strength: '가벼운 수분 보충 후보',
    reason: '히알루론산 계열 수분 세럼이라 피부결이 거칠고 밝기 균일도가 떨어질 때 부담 낮은 선택지입니다.',
    caution: '건조한 환경에서는 단독 사용보다 크림으로 덮어야 수분 증발을 줄일 수 있습니다.',
    tier: 'A'
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
    caution: '각질 정돈 성격이 맞지 않는 민감 피부는 사용 빈도를 낮춰 테스트하세요.',
    tier: 'A'
  },
  {
    id: 'drg-red-blemish',
    name: 'Dr.G(닥터지) 레드 블레미쉬 클리어 수딩 크림',
    category: '진정 크림',
    fits: ['redness', 'spots'],
    strength: '붉은기+트러블 흔적 후보',
    reason: '진정 보습 크림 포지션이라 붉은기와 잡티 후보가 같이 보일 때 무난한 후보입니다.',
    caution: '활성 여드름을 빠르게 줄이는 약은 아니므로 염증성 병변은 별도 관리가 필요합니다.',
    tier: 'A'
  },
  {
    id: 'numbuzin-panthetoin',
    name: '넘버즈인 5番 판테토인크림',
    category: '장벽 크림',
    fits: ['redness', 'texture'],
    strength: '자극 신호+장벽 약화 동반 후보',
    reason: '판테놀·병풀 중심의 진정 보습 크림이라 붉은기와 거친 결이 함께 보일 때 무난한 후보입니다.',
    caution: '유수분 밸런스가 무거운 편이라 지성 피부는 소량만 먼저 테스트해보세요.'
  },
  {
    id: 'roundlab-birch',
    name: '라운드랩 자작나무 수분크림',
    category: '수분 크림',
    fits: ['texture', 'tone'],
    strength: '가벼운 수분 보충 크림 후보',
    reason: '자작나무 수액 기반의 산뜻한 크림이라 결이 거칠고 톤이 들쭉날쭉할 때 부담 없이 덧바르기 좋습니다.',
    caution: '보습력이 가벼운 편이라 매우 건조한 계절에는 크림을 하나 더 겹쳐야 할 수 있습니다.',
    tier: 'B'
  },
  {
    id: 'innisfree-greentea',
    name: '이니스프리 그린티 씨드 세럼',
    category: '수분 세럼',
    fits: ['texture', 'tone'],
    strength: '오래 검증된 수분 세럼 후보',
    reason: '그린티 추출물 기반의 스테디셀러 세럼이라 결·톤 불균일 신호가 있을 때 부담 없이 시작하기 좋습니다.',
    caution: '녹차 성분에 민감했던 적이 있다면 소량으로 먼저 테스트하세요.'
  },
  {
    id: 'cosrx-snail',
    name: '코스알엑스 어드밴스드 스네일 96 뮤신 파워 에센스',
    category: '수분 에센스',
    fits: ['texture', 'spots'],
    strength: '결 정돈+흔적 관리 후보',
    reason: '달팽이 점액 여과물 중심 에센스로, 결이 거칠고 잡티 흔적이 같이 보일 때 오래 검증된 후보입니다.',
    caution: '점성이 있는 텍스처라 끈적임이 싫다면 소량만 펴 발라보세요.',
    tier: 'B'
  },
  {
    id: 'goodal-vitaminc',
    name: '구달 청귤 비타C 잡티케어 세럼 알파',
    category: '미백 세럼',
    fits: ['spots', 'tone'],
    strength: '색소·톤 개선 목적 1순위 후보',
    reason: '비타민C 유도체 중심 세럼이라 잡티와 톤 불균일이 우선 관리 항목일 때 먼저 고려할 만합니다.',
    caution: '비타민C는 자극이 될 수 있어 처음엔 격일로 시작하고, 아침에 쓴다면 자외선 차단을 꼭 같이 하세요.',
    tier: 'A'
  },
  {
    id: 'drjart-cicapair',
    name: '닥터자르트 시카페어 크림',
    category: '진정 크림',
    fits: ['redness'],
    strength: '홍조 진정 대표 후보',
    reason: '병풀 성분 중심의 진정 크림으로, 붉은기가 두드러질 때 가장 먼저 떠올릴 만한 스테디셀러입니다.',
    caution: '그린 밀착 커버 효과가 있어 이후 스킨케어/메이크업이 밀리면 얇게 펴 바르세요.',
    tier: 'B'
  },
  {
    id: 'cosrx-centella-blemish',
    name: '코스알엑스 병풀 진정 크림',
    category: '진정 크림',
    fits: ['redness', 'texture'],
    strength: '가벼운 진정+장벽 후보',
    reason: '병풀 추출물 고함량 크림이라 붉은기와 거친 결이 함께 있을 때 자극이 적은 선택지입니다.',
    caution: '활성 여드름 치료 목적이 아니므로 염증성 병변은 진료를 우선하세요.'
  },
  {
    id: 'drg-brightening-sun',
    name: '닥터지 브라이트닝 업 선크림',
    category: '자외선 차단',
    fits: ['tone', 'spots', 'wrinkle'],
    strength: '톤/잡티 관리의 대안 자차',
    reason: '미백 기능성을 겸한 선크림이라 톤·잡티 관리가 우선일 때 기존 선크림 후보와 번갈아 고려할 만합니다.',
    caution: '기능성 표시 제품도 매일 충분한 양을 발라야 효과가 있습니다.'
  },

  // ↓ 2026-07-01 올리브영 용도별 추천 리스트(2025 어워즈 기준) 반영분
  {
    id: 'roundlab-birch-sun',
    name: '라운드랩 자작나무 수분 선크림 SPF50+/PA++++',
    category: '자외선 차단',
    fits: ['tone', 'spots'],
    strength: '건성·데일리 자차 대표 후보',
    reason: '2025 올리브영 어워즈 선케어 1위로, 촉촉한 사용감이라 매일 쓰는 기본 자외선 차단으로 무난합니다.',
    caution: '가벼운 제형이라 강한 야외활동 시에는 덧바름 주기를 짧게 가져가세요.',
    tier: 'A'
  },
  {
    id: 'dalba-waterfull-suncream',
    name: '달바 워터풀 톤업 선크림 SPF50+/PA++++',
    category: '자외선 차단',
    fits: ['tone'],
    strength: '톤업 자차 후보',
    reason: '2025 올리브영 어워즈 선케어 2위로, 톤 불균일 신호가 있을 때 자연스러운 톤 보정을 겸할 수 있습니다.',
    caution: '톤업 효과가 있어 다른 베이스 메이크업과 밀림이 있으면 양을 줄여보세요.',
    tier: 'A'
  },
  {
    id: 'goodal-heartleaf-sun',
    name: '구달 맑은 어성초 진정 수분 선크림',
    category: '자외선 차단',
    fits: ['redness', 'tone'],
    strength: '민감·붉은기 동반 자차 후보',
    reason: '2025 올리브영 어워즈 선케어 3위로, 어성초 진정 컨셉이라 홍조 신호가 있을 때 자차 겸 진정으로 고려할 만합니다.',
    caution: '자외선 차단은 매일 충분한 양을 바르는 습관이 성분보다 중요합니다.',
    tier: 'A'
  },
  {
    id: 'skin1004-sunserum',
    name: 'SKIN1004 마다가스카르 센텔라 히알루-시카 워터핏 선세럼',
    category: '자외선 차단',
    fits: ['redness', 'texture'],
    strength: '가벼운 자차+진정 후보',
    reason: '글로벌 베스트셀러 선세럼으로, 센텔라 기반이라 붉은기·거친 결이 함께 보일 때 가벼운 자차로 고려할 만합니다.',
    caution: '세럼 타입이라 강한 유분 밀착이 필요한 경우엔 크림 자차가 더 나을 수 있습니다.'
  },
  {
    id: 'bioderma-hydrabio-toner',
    name: '바이오더마 하이드라비오 토너',
    category: '수분 토너',
    fits: ['texture', 'tone'],
    strength: '건성·속건조 토너 후보',
    reason: '2025 올리브영 어워즈 토너/미스트 3위로, 건성·속건조 신호가 있을 때 수분 보충용으로 무난합니다.',
    caution: '토너 단독으로는 장벽 회복이 부족해 크림과 함께 쓰는 편이 좋습니다.',
    tier: 'A'
  },
  {
    id: 'wellage-blue100',
    name: '웰라쥬 리얼 히알루로닉 블루 100 앰플',
    category: '수분 세럼',
    fits: ['texture', 'tone'],
    strength: '건성·속건조 앰플 후보',
    reason: '2025 올리브영 어워즈 에센스/세럼 3위 수분 앰플로, 결이 거칠고 톤이 들쭉날쭉할 때 고려할 만합니다.',
    caution: '고보습 제형이라 지성 피부는 소량만 먼저 사용해보세요.',
    tier: 'A'
  },
  {
    id: 'anua-pdrn-capsule100',
    name: '아누아 PDRN 히알루론산 캡슐 100 세럼',
    category: '수분 세럼',
    fits: ['texture', 'tone'],
    strength: '광채·수분 세럼 후보',
    reason: '2025 올리브영 어워즈 MD\'s Pick 제품으로, 결·톤 불균일이 함께 보일 때 광채 보강용으로 고려할 만합니다.',
    caution: 'PDRN 성분에 민감했던 적이 있다면 소량 테스트 후 사용하세요.',
    tier: 'A'
  },
  {
    id: 'anua-niacinamide-txa',
    name: '아누아 나이아신아마이드 10 TXA 4 다크스팟 세럼',
    category: '미백 세럼',
    fits: ['spots', 'tone'],
    strength: '잡티·칙칙함 세럼 후보',
    reason: '나이아신아마이드·TXA 조합의 잡티·톤 케어 세럼으로, 색소·톤 불균일이 우선 관리 항목일 때 고려할 만합니다.',
    caution: '트라넥사믹애씨드(TXA) 계열도 자극이 될 수 있어 처음엔 격일로 시작하세요.',
    tier: 'A'
  },
  {
    id: 'medihell-madeca-serum',
    name: '메디힐 마데카소사이드 블레미쉬 리페어 세럼',
    category: '진정 세럼',
    fits: ['redness', 'spots'],
    strength: '트러블 흔적+진정 세럼 후보',
    reason: '마데카소사이드 기반으로, 붉은기와 트러블 흔적이 함께 보일 때 진정 목적으로 고려할 만합니다.',
    caution: '활성 여드름 치료제가 아니므로 염증성 병변은 진료를 우선하세요.',
    tier: 'A'
  },
  {
    id: 'medicube-pdrn-ampoule',
    name: '메디큐브 PDRN 핑크 펩타이드 앰플',
    category: '탄력 앰플',
    fits: ['wrinkle', 'tone'],
    strength: '탄력·광채 앰플 후보',
    reason: '슬로우에이징 컨셉의 PDRN·펩타이드 앰플로, 잔주름 후보와 톤 저하가 함께 보일 때 고려할 만합니다.',
    caution: '탄력 개선을 보장하는 제품은 아니며, 효과는 꾸준한 사용을 전제로 합니다.',
    tier: 'A'
  },
  {
    id: 'primera-vitatinol-serum',
    name: '프리메라 비타티놀 바운시 리프트 세럼',
    category: '탄력 세럼',
    fits: ['wrinkle', 'texture'],
    strength: '탄력 초기 관리 후보(레티놀 계열 주의)',
    reason: '레티놀 계열 탄력 세럼으로, 잔주름 후보와 결 거침이 함께 있을 때 밤 루틴에 천천히 도입해볼 만합니다.',
    caution: '레티놀 계열은 자극이 클 수 있어 주 2~3회부터 시작하고, 아침엔 자외선 차단을 꼭 병행하세요.',
    tier: 'A'
  },
  {
    id: 'senature-aqua-squalane',
    name: '에스네이처 아쿠아 스쿠알란 수분크림',
    category: '수분 크림',
    fits: ['texture', 'tone'],
    strength: '속건조·복합성 크림 후보',
    reason: '2025 올리브영 어워즈 크림 3위로, 스쿠알란 기반이라 결이 거칠고 톤이 들쭉날쭉할 때 무난한 보습 크림입니다.',
    caution: '유분감이 부담스러우면 소량부터 시작해보세요.',
    tier: 'A'
  },
  {
    id: 'zeroid-intensive-cream',
    name: '제로이드 인텐시브 크림',
    category: '장벽 크림',
    fits: ['redness', 'texture'],
    strength: '민감·극건성 장벽 후보',
    reason: '2025 올리브영 어워즈 MD\'s Pick 제품으로, 장벽이 약해진 신호(붉은기+거친 결)가 함께 보일 때 고려할 만합니다.',
    caution: '고보습 제형이라 지성 피부는 밤에만 사용하는 것도 방법입니다.',
    tier: 'A'
  },
  {
    id: 'dr-althea-345-relief',
    name: '닥터알테아 345 릴리프 크림',
    category: '진정 크림',
    fits: ['redness'],
    strength: '진정·장벽 보조 후보',
    reason: '글로벌 라이징 제품으로, 붉은기 신호가 두드러질 때 진정 목적의 크림 후보로 고려할 만합니다.',
    caution: '진정 크림도 매일 새 성분을 여러 개 겹치기보다 한 가지씩 반응을 확인하세요.',
    tier: 'A'
  },
  {
    id: 'medihell-madeca-pad',
    name: '메디힐 마데카소사이드 흔적 패드',
    category: '진정 패드',
    fits: ['redness', 'spots'],
    strength: '트러블 흔적+붉은기 패드 후보',
    reason: '2025 올리브영 어워즈 패드 1위로, 트러블 흔적과 붉은기가 함께 보일 때 토너 다음 단계로 가볍게 더할 만합니다.',
    caution: '패드의 물리적 마찰도 자극이 될 수 있어 세게 문지르지 말고 가볍게 두드리세요.',
    tier: 'A'
  }
];
