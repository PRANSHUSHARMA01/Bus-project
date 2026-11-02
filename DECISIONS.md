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
- 2026-11-02: Women's Safety Hub (`/safety`) completely redesigned from hacker-terminal to native light/dark design system with saffron-to-magenta flat field (`linear-gradient(135deg, oklch(0.80 0.17 75) 0%, oklch(0.62 0.24 355) 100%)`) and inline geometric SVG artwork conforming to `better-ui` and `better-colors`.
- 2026-11-02: Implemented 168px circular SOS button with 2.0s press-and-hold progress ring (stroke-dashoffset), haptic vibration feedback, early release cancel shake, and 5-second cancel window before escalation (`role="alertdialog"`).
- 2026-11-02: Replaced overclaiming copy with honest status timeline (Control room alerted, Contacts notified, Live link shared); verified helplines grouped into Emergency (112), Women & Children (1091, 181, 1098), Transport (DTC 011-23370373); marked safer stop tags with "Demo data".
- 2026-11-02: Home sticky header rebuilt with `position: sticky; top: 0; z-index: 30`, 32px soft fade/blur pseudo-element (`.home-header-fade`), and scroll-driven collapsible greeting with clean user first name filter (no email prefixes).
- 2026-11-02: Live-bus tracking sheet redesigned into 3 zones: pinned info header (ETA, Route · Plate, crowd pill, destination, separate tabular speed chip), scrollable corridor timeline, and pinned action bar (Notify me, Share trip).
- 2026-11-02: Verified with Playwright across 320/360/390/430px viewports (light + dark), zero horizontal overflow, CLS < 0.05, 100% QA gates passed.
