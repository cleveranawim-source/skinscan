# Testing Guide

Use this guide when sharing SkinCheck Lab with testers.

## Who Should Test

- Adults who understand this is a prototype
- People comfortable testing a browser camera/photo workflow
- People willing to give text feedback about usability and trust

Avoid collecting tests from minors or people who may treat the result as medical advice.

## Test Script

Ask testers to try:

1. Open the app. First-time visitors see an intro screen; after at least one analysis, the home screen becomes a dashboard (last score, delta vs previous, trend).
2. Try `촬영 시작`/`오늘 피부 스캔` or `앨범에서 선택`.
3. In the camera preview, check whether the oval border turns green when the face is centered/close enough/level, and whether the on-screen hint (e.g. "조금 더 가까이 와주세요") matches what's actually wrong.
4. After pressing the shutter, a 사진 확인 (photo review) screen shows the captured photo — confirm you can retake (다시 촬영) or proceed (이 사진으로 분석), and that analysis does NOT start until you confirm. (Album picks skip this step since you already saw the photo.)
4. With a good photo, the quality-gate screen should be skipped entirely — you land straight on the report, with a "사진 품질 N · 통과" chip near the top that opens the gate for review. The gate screen should only appear when something is wrong with the photo.
5. On the report, check the radar chart ("한눈에 보기") — 7 axes, and after a second analysis a translucent "지난번" overlay should appear.
6. Read the result and product recommendations, including the ROI labels overlaid on the photo (이마/볼/코/눈가/턱).
7. Open a metric's detail screen and check whether the "판단 근거"(basis) makes sense, and whether the score color (green/amber/red) matches how bad the number looks.
8. Switch to the 기록 tab (bottom bar) and confirm the trend appears after at least two analyses; tap an entry to replay its full report. Try "내보내기" to download a backup file, then "가져오기" with that same file to confirm it says "새로 추가할 항목이 없습니다" (no duplicates).
9. Copy the feedback template and send text feedback.

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
