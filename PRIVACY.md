# Privacy Notice

SkinCheck Lab is designed as a local, browser-only prototype.

## Image Handling

- Camera frames and selected photos are processed in the browser.
- Face region detection runs locally via an on-device model (MediaPipe Face Landmarker). The wasm runtime and model file ship inside the app itself (`public/mediapipe`), not a CDN, so no photo or video frame is ever sent anywhere to find your face.
- The app does not upload photos to a server.
- The app does not store photos in a remote database.
- The app does not include analytics, tracking scripts, or third-party SDKs.

## Local Browser State

- The app may temporarily hold image data in browser memory while the page is open. Reloading or closing the page clears the current session state.
- If you check a report, the app saves a small history entry to this browser's `localStorage`: date/time, overall score, per-item scores, and confidence. **No photo or image data is included in this history.** It stays on this device only, is capped at the last 20 entries, and can be cleared anytime from the 분석 기록 (history) screen or by clearing site data.
- The history screen has an explicit "내보내기"/"가져오기" (export/import) feature. Exporting writes those same score-only entries to a `.json` file the user saves themselves; nothing is sent anywhere automatically. Importing only reads a file the user picks.

## Sensitive Data

Face photos can be sensitive personal data. Testers should avoid using photos of other people without consent.

## Testing Recommendation

For public or semi-public tests:

- Tell testers that the app is a prototype.
- Tell testers that photos are processed locally.
- Do not ask testers to submit face photos through chat, email, or issue trackers.
- Ask testers to submit text feedback only.

## Medical Disclaimer

This app is for cosmetic self-check and usability testing only. It does not diagnose, treat, or prevent disease.
