# Project Architecture & Design Decisions (Master Prompt Execution)

- 2026-11-01: Installed `jakubkrehel/skills` (14 UI/UX skills) and `wheresryan22/anatomy` (isometric SVG engine) successfully via npx.
- 2026-11-01: Services tab blank page diagnosis: static catalogue in `lib/services.ts` created to render immediately with zero API blocking.
- 2026-11-01: Isometric Moving Bus built as Figure-sized SVG component in `components/anatomy/MovingBus.tsx` adhering to anatomy skill.
- 2026-11-01: Palette updated to oklch tokens with saffron `oklch(0.80 0.17 75)` and ink `oklch(0.18 0.02 260)` conforming to better-colors.
- 2026-11-01: Fixed concentric radii in UI cards (sheet 24px, card 20px, tile 12px, pill 999px) conforming to better-ui.
- 2026-11-01: Auto-follow camera throttled to 1/s with offset calculation for tracking sheet visibility conforming to P0.6.
- 2026-11-01: Universal local demo OTP passkey set to 123456 with rate-limiting bypassed in dev mode.
- 2026-11-01: Redesigned MovingBus.tsx with hand-crafted true mathematical isometric projection (+x road 30° down-right, +y kerb side 30° down-left, +z vertical) using exact trigonometry (C = 0.866, S = 0.5) with four-tone semantic OKLCH shading.
- 2026-11-01: Grounded wheels at z=0 with polygonal contact shadows directly under each tyre; added aerodynamic windscreen rake, side mirrors, white Delhi license plate DL 1PC 1409, and amber LED destination board (764 Kashmere Gate).
- 2026-11-01: Completed 3 visual iteration rounds with Playwright capturing light and dark modes at 360x300 and 720x600 in docs/anatomy-rounds/.
- 2026-11-01: Card chrome simplified to 20px concentric card with layered ring shadow, single-line heading, tabular status pill, interactive caption, and 8px occupancy progress bar.
- 2026-11-01: Trip planner endpoint (/v1/trips/plan) updated to support from/to alias parameters and verified candidate buses with realistic ETAs.
