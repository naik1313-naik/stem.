# SmartClass Buddy Design System

## Source of truth

`apps/web/src/styles/smartclass-design-system.css` is the one source of truth for colours, typography, radii, shadows, touch sizes, spacing, and shared screen styles. It is imported exactly once by `src/main.tsx`. The project intentionally uses plain CSS rather than Tailwind so there is no second token map to maintain.

## Tokens

- Colour: `--paper`, `--surface`, `--ink`, `--copper`, `--copper-dark`, `--spark`, `--spark-soft`, `--teal`, `--teal-soft`, `--alert`, `--alert-soft`, `--line`, and `--muted`.
- Shape: `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-pill`, `--bw`.
- Depth: `--depth`, `--depth-lg`, `--depth-pressed`, `--shadow-soft`.
- Touch: `--tap` (56px minimum for interactive controls).
- Typography: `--font`, `--fs-xs`, `--fs-sm`, `--fs-body`, `--fs-h1`, `--fs-h2`, `--fs-h3`.
- Spacing: `--space-1` through `--space-8`.

Mukta is bundled locally from the `@fontsource/mukta` package. Vite emits the font assets into the build; no font is fetched from a remote URL at runtime. The family includes Latin and Devanagari subsets.

## Shared components

- `.app-shell`, `.app-header`, `.brand`, `.language-switch`: common app header and language controls.
- `.stepper`, `.step`, `.step-dot`: common lesson progress.
- `.card`, `.card-flat`, `.panel-spark`, `.panel-success`, `.panel-alert`: shared surfaces and feedback.
- `.btn`, `.btn-primary`, `.btn-spark`, `.btn-teal`: shared 56px minimum actions.
- `.option`, `.option-list`: full-row prediction and quiz options.
- `.workbench`, `.circuit-board`, `.parts-tray`, `.spark-panel`: Workbench structures.
- `.status-chip`: semantic status with both icon and text; colour alone is never used.

## Rules

1. **No new colours or sizes outside the tokens.** Do not add ad-hoc hex/RGB/HSL values, font sizes, radii, or shadows in screen CSS, TSX inline styles, SVG attributes, or Tailwind config.
2. The app is light-mode only.
3. Body text is at least 18px. No text is below 16px.
4. Interactive targets are at least 56 × 56px.
5. Motion animates only `transform` and `opacity`; respect `prefers-reduced-motion`.
6. Status always combines semantic icon, text, and colour.
7. Use inline SVG for UI icons; do not use emoji icon glyphs.
8. The circuit rules are deterministic, independent from presentation, and covered by unit tests.
9. Learning activity is saved locally. The service worker precaches app HTML, bundled scripts, styles, fonts, and the manifest for offline reopen after the first successful online build visit.
10. Hindi translations are marked `TODO-REVIEW` and must be checked by a Hindi educator before classroom release.

## Current styling approach (8-line audit)

1. The frontend is built with React and TypeScript; screens are composed in `src/App.tsx`.
2. Styling uses plain global CSS, not CSS Modules.
3. Shared screen styles and design tokens live in `src/styles/smartclass-design-system.css`.
4. That stylesheet is imported once from `src/main.tsx`.
5. Tailwind is not used for styling and there is no Tailwind token mirror.
6. UI icons and the circuit illustration use inline SVG through `src/components/Icon.tsx` and the Workbench JSX.
7. Inline styles are limited to values that change at runtime, such as the drag ghost position and quiz progress transform.
8. Responsive rules are centralized in the design-system stylesheet and cover narrow phone and desktop layouts.
