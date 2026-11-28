# Austin Venue World Implementation Plan

> **For agentic workers:** This plan is executed inline.

**Goal:** Replace Prism Stage’s conventional landing page with an offbeat, keyboard and touch friendly Austin music world. Visitors can roam at aerial and street level, see recognizable venue-specific illustrated frontages, and step inside distinct projection scenes.

**Architecture:** A self-contained static site in `index.html`, using Canvas 2D for a stylized Austin night map, a traversable ground-level street, venue-specific facades, and performance scenes. Accessible HTML controls expose venue choice, two-level navigation, scene descriptions, and the local studio link.

**Tech Stack:** HTML, CSS, JavaScript, Canvas 2D; no runtime dependencies.

**Spec:** User requests a very unusual site, unlike Oneirodex, using multiple iconic Austin venues. The user clarified that venue facades must look like the actual places, clicking must not cause a white flash, and the site needs stylized animation with movement both at ground and aerial levels. Visual inspiration includes Bruno Simon and recent weird/creative websites; create original venue illustrations with Austin mural and gig-poster energy rather than copying an individual artist.

## Global Constraints

- Launch in dark mode.
- Work only in `C:\Apps\Prism Stage Website`.
- Leave `C:\Apps\Prism Stage\prism-stage` unchanged.
- Feature multiple Austin venues: The Continental Club, Antone’s, Mohawk, Stubb’s, and ACL Live at the Moody Theater.
- Present venue visuals as original interpretations, not official assets or endorsements.
- Make each stop visually distinct and recognizable from its facade and sign.
- Provide continuous ground-level movement and an aerial map level; entering a venue must not flash white.
- Keep the website usable on desktop and mobile, with reduced-motion support and an accessible non-canvas venue selector.
- Keep the link to the local Prism Stage studio at `http://127.0.0.1:4863/`.

## Review Focus

- Clicking/tapping each venue changes its name, setting, and visual behavior.
- Keyboard arrows change venues; Enter enters a scene; Escape returns to the route.
- Touch layout keeps every venue selectable and studio CTA reachable.
- Canvas resizing and reduced-motion preference do not obscure the HTML controls.
- Scene copy distinguishes historical venue facts from Prism-created visual interpretations.

## Tasks

### Task 1: Make the venue route explorable

**Files:** Modify `index.html`, `prism.css`, `explore.css`, and `prism.js`.

- [x] Replace the hero and cards with an Austin night map canvas and a route selector for five named venues.
- [x] Implement venue-specific map labels and compact factual descriptions.
- [x] Add pointer, click, touch, and keyboard venue selection plus location HUD.
- [x] Add ground/aerial level toggle, continuous ground walk controls, per-venue facade artwork, and direct step-inside CTA.
- [x] Replace the old full-canvas white flash with a localized color ripple; preserve street position while active stop changes.

### Task 2: Enter five original projection scenes

**Files:** Modify `index.html`, `prism.css`, and `prism.js`.

- [x] Implement a distinct Canvas 2D interior/light treatment for each venue and enter/return transitions.
- [x] Add responsive controls, reduced-motion behavior, an accessible HTML venue list, and local studio/guide links.
- [ ] Inspect latest ground-level rendered desktop and mobile page in a browser and resolve material layout defects (browser preview transport unavailable during final edits).

**Review:** Earlier browser inspection confirmed the selectable route, venue readout updates, separate projection scenes, and desktop/mobile layout. Latest two-level ground exploration is source-reviewed; browser preview transport stopped responding before final visual review. No automated tests were added or run.
