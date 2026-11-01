# Delhi Smart Bus — Project Status & Future Work Roadmap

**Date & Time:** November 1, 2026 · 23:40 IST  
**Git Branch:** `main` (Clean working tree, 10 atomic commits ahead of `origin/main`)  
**Build Status:** Production Build Successful (`next build` 31/31 static routes generated)  
**QA Gates:** 100% Passed (Axe-core 0 critical/serious violations, 13/13 functional service pages)

---

## 1. Saved Work & Completed Milestones

All work from the Master Prompt (P0, P1, P2) and Round-2 UI Prompt (Steps 0 through 7) has been implemented, visually captured, rigorously tested, and committed to git:

| Commit Hash | Milestone | Highlights & Verified Deliverables |
|---|---|---|
| [`498a400`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **P0 Overhaul** | Responsive design, isometric bus anatomy, services page recovery. |
| [`b13e974`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **P1 Backend & Packaging** | Single-origin Docker container, self-hosted auth, in-memory rate limiting. |
| [`2aff031`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **P2 SEO & Schemas** | JSON-LD TransitSystem schemas, OpenGraph meta, robots.txt, sitemap.xml. |
| [`2d1876c`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 1** | Red `SOS` badge on Women's safety shortcut with 2-loop pulse animation. Screenshot: [`docs/step1_sos_badge.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step1_sos_badge.png). |
| [`bae6796`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 2** | Anatomy card alignment fixes (radius 28, 6:5 aspect, 2-row grid, no text wrap on 320px). Screenshots: [`docs/step2_anatomy_320.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step2_anatomy_320.png), [`360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step2_anatomy_360.png), [`390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step2_anatomy_390.png). |
| [`b47a153`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 3** | 13 punchy 2-column service cards with honest badges (`GTFS data`, `Demo data`, `Beta`, `New`, `SOS`), full-width black fares banner, and 13 functional destinations (`/services/[slug]`). Screenshot: [`docs/step3_services_grid.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step3_services_grid.png). |
| [`dad9273`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 4** | Home promo carousel (78vw snap, 4:3 art, right peek) + black promo banner for DTC Pink Pass with ₹0 stamp. Screenshot: [`docs/step4_promo_carousel.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step4_promo_carousel.png). |
| [`dd5ee69`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 5** | Sticky search bar with 40px top scroll fade (`backdrop-filter: blur(8px)`) and 28px bottom feather layer above floating nav. Screenshot: [`docs/step5_scroll_fade.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step5_scroll_fade.png). |
| [`8db0ed9`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 6** | Uber-style Account redesign: Bricolage 800 display name, 88×88 avatar, 2×2 quick tiles, icon list rows, and zero-flash Dark Mode bottom sheet. Screenshots: [`docs/step6_account_light.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step6_account_light.png), [`docs/step6_account_dark.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/step6_account_dark.png). |
| [`1bf5c8d`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project) | **Round-2 Step 7** | Full QA verification suite passing: 12 multi-viewport screenshots (`docs/round2/`), WCAG AA contrast, WCAG 2.5.3 Label-in-Name fixes, and **0 critical/serious violations across all 3 screens**. |

---

## 2. Visual QA Gallery (12 Multi-Viewport Screenshots)

All screenshots are stored in [`docs/round2/`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/):

| Screen | Light Mode (390×844) | Light Mode (360×800) | Dark Mode (390×844) | Dark Mode (360×800) |
|---|---|---|---|---|
| **Home** | [`home_light_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/home_light_390.png) | [`home_light_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/home_light_360.png) | [`home_dark_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/home_dark_390.png) | [`home_dark_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/home_dark_360.png) |
| **Services** | [`services_light_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/services_light_390.png) | [`services_light_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/services_light_360.png) | [`services_dark_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/services_dark_390.png) | [`services_dark_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/services_dark_360.png) |
| **Account** | [`account_light_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/account_light_390.png) | [`account_light_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/account_light_360.png) | [`account_dark_390.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/account_dark_390.png) | [`account_dark_360.png`](file:///c:/Users/prans/OneDrive/Desktop/bus%20project/docs/round2/account_dark_360.png) |

---

## 3. Work Remaining / Next Steps (When Resuming)

When you return to continue development, here is the clear roadmap of what can be done next:

1. **Push Commits to Remote Repository**:
   - Run `git push origin main` to publish the 10 commits to your GitHub / remote repository.
2. **Local Python Virtual Environment Setup (Optional)**:
   - The system Python currently lacks `pytest`. To run backend tests locally without Docker:
     ```bash
     cd backend
     python -m venv .venv
     .venv\Scripts\activate
     pip install -r requirements.txt pytest httpx
     pytest -v
     ```
   - (Note: Backend tests already ran and passed 61/61 in the test container).
3. **Cloud Deployment (Docker / AWS)**:
   - Build and run the single-origin Docker container:
     ```bash
     docker build -t delhi-smart-bus .
     docker run -d -p 8000:8000 --name bus-app delhi-smart-bus
     ```
   - Deploy image to AWS ECR / ECS or Lightsail instance with the pre-configured single-origin routing.
4. **Transit Agency Integration (Future Enhancement)**:
   - Replace the demo GTFS-RT feed URL with live Delhi Transit open data feeds (OTD Delhi API key).
