# Implementation roadmap

## Phase 0 — Environment foundation
- [x] Monorepo layout and project guidance
- [x] Minimal React frontend and FastAPI health endpoint
- [x] Backend health test

## Phase 1 — Product shell and design system
- [x] Responsive shared shell and screen navigation
- [x] Group picker, header, language toggle and lesson stepper
- [x] Centralized light-mode design tokens
- [x] English/Hindi content dictionaries (Hindi requires educator review)

## Phase 2 — Physics lesson module
- [x] Mission and prediction
- [x] Short concept explanations
- [x] Five-question quiz with hints and answer explanations
- [x] Reflection prompt and local persistence

## Phase 3 — Interactive circuit laboratory
- [x] Four-slot Workbench based on the supplied reference HTML
- [x] Battery, bulb, wire and switch interactions
- [x] Deterministic circuit state model and unit tests
- [x] Three sequential challenges with star progress
- [x] Rule-based Spark tutor in English and Hindi

## Phase 4 — Local progress and teacher view
- [x] Local attempt/hint/complete event log
- [x] Pulse Board summary from the same event log
- [x] Group-scoped challenge progress

## Phase 5 — Offline app shell
- [x] Production service-worker generation
- [x] Precache HTML, scripts, styles, fonts and manifest
- [x] Local learning progress and event history
- [ ] Verify offline reopen on the user's Windows machine after build

## Phase 6 — Validation and demo
- [x] Circuit unit tests
- [x] Playwright screenshot tests authored for all screens, both languages, 360px and 1280px
- [ ] Run full Vite production build after `npm install`
- [ ] Run Playwright suite and review generated screenshots
- [ ] Accessibility, screen-reader, contrast and real low-end Android performance review

## Future phases
- AI tutor behind FastAPI with approved lesson retrieval and safe fallbacks.
- Accounts, teacher classes, hosted data, authorization and consent controls.
- Cloud progress sync and cross-device continuity.
- Additional STEM topics and reviewed regional-language content.

Complete and verify each phase before moving to the next. Do not claim production readiness based only on successful unit tests.
