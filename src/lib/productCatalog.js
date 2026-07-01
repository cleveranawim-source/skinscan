// 화장품 후보 데이터. 실제 서비스 전환 시 이 파일을 기준으로 전성분/재고를 재검증하세요.
// 자세한 매칭 기준은 PRODUCT_RECOMMENDATION_POLICY.md 참고.
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
