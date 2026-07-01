# Testing Guide

Use this guide when sharing SkinCheck Lab with testers.

## Who Should Test

- Adults who understand this is a prototype
- People comfortable testing a browser camera/photo workflow
- People willing to give text feedback about usability and trust

Avoid collecting tests from minors or people who may treat the result as medical advice.

## Test Script

Ask testers to try:

1. Open the app.
2. Read the first screen.
3. Try `카메라 촬영` or `사진 선택`.
4. Check the photo quality screen — this now includes face size/centering/tilt checks, not just exposure/glare/sharpness/resolution.
5. Run analysis.
6. Read the result and product recommendations, including the ROI labels overlaid on the photo (이마/볼/코/눈가/턱).
7. Open a metric's detail screen and check whether the "판단 근거"(basis) makes sense.
8. Open 분석 기록 (history icon, top right of the first screen) and confirm the score-only trend appears after at least two analyses.
9. Copy the feedback template and send text feedback.

Also ask at least one tester to intentionally upload a non-face photo (a landscape, an object, a heavily cropped image) to confirm the app blocks analysis with a clear "얼굴을 찾지 못했습니다" message instead of producing a fake result.

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

## Feedback Format

The app has a `테스터 피드백 양식 복사` button. Ask testers to paste that text into a message or GitHub issue.
