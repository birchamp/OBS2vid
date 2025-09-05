# OBS Video App — Starter Repo

This is a **starter scaffold** for a cross‑platform mobile app (React Native + TypeScript) that turns **Open Bible Stories (OBS)** into narrated **Ken Burns–style** videos.

> Use this repo with the **Codex agent (2025)**: create small GitHub issues (T1–T7 included in `/docs/tasks`), then run Codex to open PRs from sandboxes. CI here runs typecheck/lint/tests.

---

## Quick start

1. **Clone & init**  
   ```bash
   git init
   git add .
   git commit -m "chore: starter repo"
   ```

2. **Create the app (bare RN, TypeScript template)**  
   > If you already have an app, skip and copy files from `/app` and `/src` as needed.
   ```bash
   npx @react-native-community/cli init obsVideoApp --template react-native-template-typescript
   # Move our /src into the created app and copy configs as desired
   ```

3. **Install dev deps (for CI, scripts, and tests)**  
   ```bash
   npm i -D typescript ts-node jest ts-jest @types/jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
   ```

4. **Run checks**  
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

5. **Open the tasks and start Codex**  
   Create GitHub issues from `/docs/tasks/T*.md`. Assign Codex or tag `@codex` on PRs.

---

## Structure

```
/docs            # PRD, spec, attribution, and tasks for Codex
/src             # Shared TS (parsers, types, ken-burns path, scripts)
/app             # RN app stubs (screens/components) – copy into your RN app
/scripts         # Helper scripts (e.g., fetch OBS English v9)
/.github         # CI workflow (lint/typecheck/test)
```

### OBS licensing

OBS text and images are licensed **CC BY‑SA 4.0**. Videos you export must include attribution and be shared alike. See `/docs/attribution.md`.

