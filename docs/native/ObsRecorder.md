# ObsRecorder Native Skeleton

This repo includes minimal native module stubs for iOS and Android named `ObsRecorder` that match the JS API in `src/native/ObsRecorder.ts`. They are no-op placeholders to unblock UI wiring and tests.

Locations
- iOS: `ios/ObsRecorder.m`
- Android: `android/src/main/java/com/obs2vid/ObsRecorderModule.java`, `ObsRecorderPackage.java`

Wire-up steps
- iOS
  - Add `ios/ObsRecorder.m` to your Xcode target (if not auto-added).
  - Add mic usage descriptions to `Info.plist`:
    - `NSMicrophoneUsageDescription` → "This app records narration for stories."
  - Build; React Native will discover `ObsRecorder` via `RCT_EXPORT_MODULE`.

- Android
  - Add the package in `MainApplication.java` if autolinking is not used:
    - `packages.add(new com.obs2vid.ObsRecorderPackage());`
  - Add permissions to `AndroidManifest.xml`:
    - `<uses-permission android:name="android.permission.RECORD_AUDIO" />`
    - `<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />` (if writing externally)
  - Target SDK 31+ requires runtime permission flow.

Implementations to fill in
- requestPermission/hasPermission: platform runtime mic permissions.
- start/stop: configure `AVAudioRecorder` / `MediaRecorder` for M4A (AAC), 44.1kHz, mono, ~64kbps.
- play/stopPlay: `AVAudioPlayer` / `MediaPlayer` (or ExoPlayer).
- remove: delete the file at given path.
- getMetering: return dBFS level if available.
- resolvePath: resolve `recordings/obs-en-XX-YY.m4a` under app data dir.

Contract
- Module name: `ObsRecorder`
- Methods return Promises and match the signatures in `src/native/ObsRecorder.ts`.

