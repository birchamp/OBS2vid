# T4 — iOS exporter (AVFoundation)

**Goal:** Concatenate sections into 1080p30 MP4 (H.264 + AAC) with Ken Burns animation per section and 350ms cross‑fades.

- AVMutableComposition + AVVideoComposition transforms.
- Mux audio tracks; generate optional SRT (one cue per section).
- Golden test (3 sections): constant fps, A/V sync ±40ms.
