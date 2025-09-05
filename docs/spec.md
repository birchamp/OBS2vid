# OBS Video App — MVP Spec
Date: 2025-09-05

See full PRD in `./PRD.md`. This spec drives acceptance criteria for Codex tasks.

## MVP scope
- Browse 50 OBS stories; show sections with image + text and reference (S:V).
- Record one audio clip per section (M4A AAC 44.1kHz mono).
- Export per story to MP4 1080p30 with Ken Burns animation per section and cross‑fades.
- Append CC BY‑SA attribution end‑card.

## Acceptance tests
- Parse English v9 Markdown → `Story/Section` objects.
- Record 3 sections and export a short sample; verify no crashes, A/V sync, and end‑card included.
