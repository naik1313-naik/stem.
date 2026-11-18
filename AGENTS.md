# SmartClass Buddy — Codex instructions

## Product goal
Build an accessible, offline-first STEM learning platform for school students, initially focusing on Class 6–8 Physics: Electricity and Circuits.

## Working rules
- Before changing code, inspect the relevant files and explain the implementation plan briefly.
- Build one complete module at a time. Do not scaffold unrelated modules or invent unfinished UI controls.
- Preserve existing working behavior and avoid broad refactors during focused tasks.
- Prefer small, typed, readable components and explicit API contracts.
- Keep frontend presentation, API client code, backend routes, business services, and persistence concerns separated.
- Never expose API keys, service-role credentials, database passwords, or other secrets to browser code.
- Treat all student data as sensitive. Use synthetic data in demos and tests; do not log credentials or unnecessary personal data.
- AI-generated educational content must be age-appropriate, explain reasoning, and allow students to ask follow-up questions. Do not present the AI as infallible.
- Offline mode must be explicit: cached learning content and queued progress can work offline; cloud AI calls cannot.
- Do not claim a feature is offline-capable, secure, tested, or complete without evidence.

## Verification
- Frontend: run `npm run build` in `apps/web`; run relevant unit or browser tests when present.
- Backend: run `uv run pytest` in `apps/api` and `uv run ruff check .` when lint is configured.
- For API changes, update tests and API documentation.
- For UI changes, verify loading, empty, error, and success states.
- Report exact commands run and whether they passed. Do not hide failing tests.

## Scope discipline
- Do not add authentication, database integrations, or AI providers until the corresponding module is approved and its requirements are defined. The initial offline app-shell cache and local learning event log are approved requirements.
- Do not add placeholder buttons that imply functionality which does not exist.
- Ask before destructive operations, overwriting user work, or introducing paid services.
