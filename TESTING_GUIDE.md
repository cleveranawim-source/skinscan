# Testing Guide

Use this guide when sharing SkinCheck Lab with testers.

## Who Should Test

- Adults who understand this is a prototype
- People comfortable testing a browser camera/photo workflow
- People willing to give text feedback about usability and trust

Avoid collecting tests from minors or people who may treat the result as medical advice.

## Test Script

Ask testers to try:

1. Open the app. First-time visitors see an intro screen; after at least one analysis, the home screen becomes a skin diary: today's date + "기록 N일째" chip, last score with delta vs previous, overall trend, a Mon–Sun week strip showing which days you scanned, and mini trend lines for the three core metrics (홍조/피부톤/번들거림) once you have 2+ records.
2. Try `촬영 시작`/`오늘 피부 스캔` or `앨범에서 선택`.
3. In the camera preview, check the step indicator (촬영·확인·분석) at the top, and whether the shutter ring + oval border turn sage green when the face is centered/close enough/level. The single status pill (e.g. "조금 더 가까이 와주세요" → "좋아요, 그대로 계세요") should match what's actually wrong. Also try the album button (bottom-left) and camera-flip button (bottom-right).
4. Auto-capture: hold a good alignment — after about a second a 3-2-1 countdown should appear (center overlay + pill text) and the photo fires by itself at 0. Move your face mid-countdown to confirm it cancels and starts over. After 다시 촬영, confirm it does NOT instantly re-fire (there is a ~2s lock before auto-capture can trigger again). The manual shutter should still work at any time.
5. After pressing the shutter, a 사진 확인 (photo review) screen shows the captured photo. Within a moment, a "품질 확인 중…" spinner should resolve into an actual quality score, pass-count, and confidence percentage on that same screen — confirm the number matches how the photo actually looks (blurry/shaky photos should show a low score and a warning, not a green "분석 가능"). If the photo is badly blocked (e.g. no face, severe blur), "이 사진으로 분석" should be disabled and only 다시 촬영 or 자세히 보기 should work. Analysis does NOT re-run when you confirm — it reuses the number already shown. (Album picks skip this step since you already saw the photo.)
6. With a good photo, confirming from the review screen should skip the quality-gate screen entirely and land straight on the report, with a "사진 품질 N · 통과" chip near the top that opens the gate for review. The gate screen should only appear when something is wrong with the photo (or when you tap "자세히 보기" on the review screen).
7. The report is now split into three segments (요약/상세/케어). On 요약, check the radar chart ("한눈에 보기") — 7 axes, and after a second analysis a translucent "지난번" overlay should appear. Metrics and the ROI photo live under 상세; product recommendations under 케어. Opening a metric's detail and going back should return you to the tab you were on.
8. Read the result and product recommendations, including the ROI labels overlaid on the photo (이마/볼/코/눈가/턱).
9. Open a metric's detail screen and check whether the "판단 근거"(basis) makes sense, and whether the score color (green/amber/red) matches how bad the number looks.
10. Check the evidence-tier badges (핵심/보조/실험적) next to each metric name: 홍조·피부톤·번들거림 should be 핵심, 색소잡티·트러블 보조, 피부결·잔주름 실험적. Confirm that 피부결/잔주름 never appear under "우선 관리" or as the basis of a product recommendation, and that their detail screens show the "이 지표를 얼마나 믿을 수 있나요" warning.
11. Switch to the 기록 tab (bottom bar) and confirm the trend appears after at least two analyses; tap an entry to replay its full report. Try "내보내기" to download a backup file, then "가져오기" with that same file to confirm it says "새로 추가할 항목이 없습니다" (no duplicates).
12. Copy the feedback template and send text feedback.

Also ask at least one tester to intentionally upload a non-face photo (a landscape, an object, a heavily cropped image) and a black-and-white/grayscale photo, to confirm the app blocks analysis with a clear message in both cases instead of producing a fake result.

## Questions To Ask

- Did the app feel trustworthy or overconfident?
- Did the quality gate (including the new face-alignment checks) make sense?
- Did the result match your perception of the photo?
- Were any skin scores confusing?
- Did the ROI labels look like they landed on the right part of your face?
- Did the Korean cosmetics recommendations feel useful?
- Did the cautions make you less likely to misunderstand the recommendation?
- Did camera permission or photo selection work on your device?
- Did the first face-model load feel too slow? (It downloads once per browser session and is cached after.)
- Was it clear that history is score-only and stays on-device?

## Known Limits

- Results depend heavily on light, camera, face position, makeup, and image compression.
- Face detection uses MediaPipe Face Landmarker; unusual angles, heavy occlusion (masks, hair covering the face), or very low light can still fail to detect a face.
- Current per-region scoring uses image heuristics grounded in CIELAB color values, not a validated dermatology AI model.
- Recommendations are product candidates, not prescriptions.
- Product ingredients and formulations can change.
- The live camera alignment guide and burst capture (3-frame average) were verified with the underlying MediaPipe VIDEO-mode detection logic, but not on real camera hardware across different devices/browsers — please test on an actual phone before treating this as production-ready.

## Feedback Format

The app has a `테스터 피드백 양식 복사` button. Ask testers to paste that text into a message or GitHub issue.
