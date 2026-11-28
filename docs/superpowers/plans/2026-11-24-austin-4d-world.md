# Austin 4D Venue World Implementation Plan

> **For agentic workers:** execute inline. Each step should be reviewed in context; do not install a test framework or add tests unless requested.

**Goal:** Transform the Prism Stage Austin site into an unusual, navigable 3D night world where visitors can walk at ground level, rise above the city, and step into five recognizable Austin music venues.

**Architecture:** Replace the Canvas 2D scene with a WebGL scene rendered by Three.js and served through ES modules from a CDN. Keep the existing semantic HTML controls, venue facts, studio link, and responsive overlay, but integrate them with a 3D world renderer and camera state. The fourth dimension is continuous time: moving traffic, venue-specific live lights, skyline ambience, and stage projections respond to the selected stop and elapsed time.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Three.js WebGLRenderer, custom procedural geometry/materials; no build step.

**Spec:** `docs/superpowers/plans/2026-11-24-austin-venue-world.md` plus user approval in conversation: build a full 4D version, accepting the Three.js approach.

## Global Constraints

- Dark theme on initial load.
- Work only in `C:\Apps\Prism Stage Website`; leave `C:\Apps\Prism Stage\prism-stage` untouched.
- Keep five venues: Continental Club, Antone’s, Mohawk, Stubb’s, and ACL Live at the Moody Theater.
- Make venue architecture/signage distinct and original, recognizable by venue details, not copied assets.
- Support ground walking, elevated/aerial navigation, entering/exiting venues, keyboard, pointer, and touch.
- Preserve reduced-motion support and readable overlays.
- Keep studio link at `http://127.0.0.1:4863/`.
- Do not publish or create a hosted Site; this is a local project.

## Review Focus

- WebGL unavailable: explain the problem while preserving working venue information/navigation.
- Ground camera: WASD/arrows move through the connected block; vertical controls adjust camera height; no snapping when the selected venue changes.
- Aerial mode: view city and all venue nodes, with venue-picker navigation and clear return to ground.
- Enter/exit: venue-specific scene, no white flash, returns to the previous level.
- Resize/reduced motion: camera aspect and motion respond safely; overlay controls remain usable on mobile.

## Tasks

### Task 1: Replace the 2D canvas with the 3D Austin world

**Files:** Modify `index.html`, `prism.css`, and `explore.css`; create `world3d.js`.

- [x] Load Three.js as an ES module without adding a package/build system.
- [x] Implement renderer setup, camera, dark Austin skyline, street plane, sidewalks, lighting, time ambience, resize handling, and WebGL fallback.
- [x] Build five distinct procedural 3D facades: Continental vertical sign and low club, Antone’s brick/blue sign, Mohawk brick tiers/balconies, Stubb’s open-air canopy/stage, and ACL Live theater massing.
- [x] Add ground/walk camera, elevated/aerial orbit camera, and fly mode. Ground movement remains continuous while selected venue metadata changes.

### Task 2: Connect interaction and venue interiors

**Files:** Modify `world3d.js`, `index.html`, `prism.css`, `explore.css`.

- [x] Wire venue picker, entry/exit buttons, level toggle, keyboard controls, aerial click selection, and mobile directional/altitude control.
- [x] Implement distinct venue stage volumes with animated projection beams, pulsing fixtures, traffic, windows, stars, and river motion.
- [x] Remove the old `prism.js` script include and route all UI updates through the new renderer.
- [x] Preserve accessibility status labels, selected-state semantics, reduced-motion behavior, and local Prism Stage links.

### Task 3: Verify and update the plan

**Files:** Modify this plan document.

- [x] Run JavaScript syntax check and inspect source wiring for every HTML control and venue.
- [ ] Open the local HTTP preview in a browser and inspect ground, aerial, interior, and mobile layout (CUA browser transport returned “Transport closed”).
- [x] Record actual verification and browser limitations; no visual review is claimed.

## Review

No automated tests were added or run. `node --check world3d.js` passed; HTML ID references resolve; local preview and module returned HTTP 200; Three.js CDN returned HTTP 200. Browser visual review could not run because CUA returned “Transport closed.”
