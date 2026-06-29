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
4. Check the photo quality screen.
5. Run analysis.
6. Read the result and product recommendations.
7. Copy the feedback template and send text feedback.

## Questions To Ask

- Did the app feel trustworthy or overconfident?
- Did the quality gate make sense?
- Did the result match your perception of the photo?
- Were any skin scores confusing?
- Did the Korean cosmetics recommendations feel useful?
- Did the cautions make you less likely to misunderstand the recommendation?
- Did camera permission or photo selection work on your device?

## Known Limits

- Results depend heavily on light, camera, face position, makeup, and image compression.
- Current analysis uses image heuristics, not a validated dermatology AI model.
- Recommendations are product candidates, not prescriptions.
- Product ingredients and formulations can change.

## Feedback Format

The app has a `테스터 피드백 양식 복사` button. Ask testers to paste that text into a message or GitHub issue.
