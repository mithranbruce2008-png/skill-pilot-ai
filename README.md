# SkillPilot AI

AI-powered personalized learning platform for universities and organizations with an interactive 3D Skill Galaxy login, adaptive learning roadmap, 7-criteria rubric evaluation, and multi-agent coordination.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server on port 3000:
   ```bash
   npm run dev
   ```
3. Run verification checks:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## 3D Login

- Route: `/login` renders the full-screen procedural **Skill Galaxy** (60 `InstancedMesh` skill nodes, `LineSegments` prerequisite edges, custom GLSL Fresnel core sphere, 5 tilted AI agent orbit rings with traveling light pulses, and stardust particles).
- Interactions:
  - Pointer parallax moves the galaxy subtly on desktop.
  - Hovering skill nodes scales them up, brightens connected prerequisite links, and shows a sanitized DOM tooltip.
  - Focusing Email brightens the galaxy; focusing Password activates a 3D shield-ring lock around the core and a DOM security indicator.
  - Invalid login triggers a red core ripple, a card shake (skipped under reduced motion), and a `role="alert"` error summary. Five consecutive failures lock the form for 30s with exponential backoff and 10s screen-reader countdown announcements.
  - Valid login plays a ~1.2s warp fly-through into the core (or immediate transition under reduced motion / 3D Off) before navigating to the requested destination.
  - Pressing `D` outside form inputs highlights **Python**, **SQL**, and **HTML** in gold with the `"Demo student skills"` label.

### Environment Variables

Configure optional Firebase Web SDK credentials in `.env` (see `.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

When these variables are omitted, the login page displays an inline notice and **Try demo student**, **Continue as guest**, and local preview sign-in (`student@skillpilot.edu` / `SkillPilot1!`) continue to work without crashing.

## 3D and Themes

- **Themes** (`src/theme/themes.ts`): Cosmos, Neon Cyber, Enchanted Forest, Deep Ocean, and Clean Light (static 2D gradient, no animated 3D). Every foreground/background and accent pair meets WCAG 2.1 AA contrast (`>= 4.5:1`), enforced by automated unit tests and validated on load with Zod (`src/theme/themeSchema.ts`).
- **Accessibility & Fallbacks**:
  - Visible toggles for **3D effects: Full / Lite / Off**, **Reduce motion**, **High contrast**, and **View as table/list**.
  - Honors `prefers-reduced-motion` (`frameloop="demand"`, no rotation, no particle motion, no camera tweens, no warp/shake) and `prefers-contrast: more` (defaults to Clean Light).
  - Every 3D canvas is wrapped in `CanvasErrorBoundary` with a 2D fallback sibling and `webglcontextlost` / `webglcontextrestored` handling.
- **Performance Budget**:
  - Three.js, `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing` are isolated in a lazy `three-vendor` chunk via `React.lazy` and Vite `manualChunks`.
  - `devicePixelRatio` is capped at `1.5` (Full) or `1` (Lite); stardust particles are capped at `600` (desktop) / `200` (mobile); rendering pauses automatically when the tab is hidden or the canvas is offscreen.
  - An automatic 2-second FPS monitor downgrades Full -> Lite if average frame rate drops below 40 fps and surfaces a toast notification.

## Assumptions

- Because the workspace started from an empty template, the complete SkillPilot AI multi-page application (`/dashboard`, `/skills`, `/roadmap`, `/evaluation`, `/agents`) and `useAppStore` were implemented alongside `/login` so every route guard, demo student loader, goal switcher, and adaptation workflow works end-to-end.
- No remote textures, `.glb` models, or external HDRIs are used; all 3D geometry, shaders, and particles are 100% procedural and offline/CSP safe.
- Local preview credentials (`student@skillpilot.edu` / `SkillPilot1!`) and in-memory signup accounts are provided as a non-persistent fallback only when `VITE_FIREBASE_*` environment variables are not configured; passwords are never stored in `localStorage` or `sessionStorage`.
