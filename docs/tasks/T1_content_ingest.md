# T1 — Content ingest (English v9)

**Goal:** Fetch and cache OBS English v9 Markdown and images for offline use.

- Read 50 Markdown stories from Door43 en_obs v9.
- Parse into `Story/Section` with `imageUrl`, `text`, `index`.
- Cache images (UI size + full size for export).
- Create `/docs/attribution.md` and ensure UI shows license.
- Add unit tests: parsing and URL resolution.
