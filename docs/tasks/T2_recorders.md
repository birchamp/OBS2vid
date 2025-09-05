# T2 — Recorder modules (iOS + Android)

**Goal:** One M4A (AAC 44.1kHz mono) recording per section with Record/Play/Retake.

- iOS: AVAudioRecorder wrapper with proper session category; metering.
- Android: MediaRecorder wrapper with runtime permissions and device checks.
- UI: Section screen controls and file naming per section.
- Tests: permission gating + deterministic filename mapping.
