# BZIK container-house minisite — design

Date: 2026-10-28 · Status: approved in brainstorming, awaiting spec review

## Goal

A one-page marketing site for BZIK's container-house visualization service. Audience: container-house distributors and manufacturers, contractors, real-estate agents and developers. It must show the full process (plans → 3D model → renders → assembly → room-by-room) and convince the visitor that every output is dimensionally exact.

Success: a visitor understands in one scroll what they can order, sees the plan become a precise 3D assembly, and has one obvious action — send plans by email.

## Decisions

| Topic | Decision |
|---|---|
| Scope | New standalone BZIK site. The existing `White-Label-Minisite.html` and the Container House deck are not modified. |
| Location | `white-lable-minisite/bzik-container-site/` |
| Language | English + Hebrew with a toggle. Hebrew sets `dir="rtl"`. |
| Positioning | "Model-true": every image and frame is rendered from a dimension-true 3D model; no generated images. The site does not attack AI and never uses a "No AI" badge. |
| Style | Technical editorial: off-white canvas, black ink, thin technical linework, pink used sparingly. |
| Axonometry | Three.js scene rendered as a line drawing, choreographed by GSAP ScrollTrigger. |
| Contact | `bzik.david@gmail.com` via `mailto:` only. No form, no phone or website. |

## Brand

Source: `~/Documents/BZIK_brand guidelines/` (`bzik.css`, `bzik.tokens.json`, `assets/wordmark.svg`, `assets/symbol.svg`).

- Colours: canvas `#F3F3F0` (bg/subtle) with `#FFFFFF` surfaces, ink `#131313`, secondary text `#555552`, borders `#DDDDD8`, accent pink `#F2A4C3` (hover `#E97FAA`), accent text on light `#8E3159`.
- Type: Satoshi 400/500 from Fontshare for Latin script. Heebo 400/500 (Google Fonts) for Hebrew, because Satoshi has no Hebrew glyphs.
- Logo: the wordmark SVG, copied unmodified, appears in the nav and footer. The symbol SVG's arc is used as a large graphic on the pink chapter break, following the social kit's corner-arc motif.
- Motion tokens: the brand's `standard` easing `cubic-bezier(0.2,0,0,1)` and durations of 250/400/600/1000 ms apply to UI transitions. Scroll scrubs use `ease: none`.
- Pink is used only for: primary button, the current assembly step, the active language, and one full-pink chapter break.

## Page structure (scroll story)

1. **Nav (sticky):** wordmark · Process · Work · Outputs · Contact · EN/HE toggle.
2. **Hero:** headline "Your drawings, built to the millimetre." A short line naming the audiences, a "Send your plans" button (mailto), and a slowly auto-rotating line axonometry of the finished house in the hero canvas.
3. **Plan → model (pinned, ~200vh):** the camera starts top-down (orthographic plan) with dimension strings 12 190 / 7 320 and room labels (Living, Dining, Kitchen, Entry, Stair). As you scroll, ground-floor walls extrude from 0 to full height and the camera tilts from plan to SE isometric. Caption: "Step 01–02 · From plan to modules".
4. **Assembly (pinned, ~400vh):** scroll scrubs the 10 assembly steps from the deck (piers, C1, C2, C3, seam steel + stair, C4, C5, glazing + doors, deck + pergolas, terrace + shade + PV). A side caption list highlights the current step in pink. In the final segment the model explodes by level, then a vertical section plane sweeps east→west, clipping the shells to reveal stair and steel.
5. **Pink chapter break:** full-bleed `#F2A4C3` with a black arc. "Model-true. Every image and every frame is rendered from one dimension-true 3D model. No generated images, no invented details."
6. **Clay → finished (pinned, ~150vh):** the clay render, with the day-SE material render wiped across it as you scroll.
7. **Exterior gallery:** pinned horizontal scroll through day-SE, day-NE, dusk and terrace.
8. **Room by room (pinned, ~300vh):** scroll-driven crossfade through the interior stills in walk order (entry, open plan, living, dining, kitchen, stair, gallery, main bedroom, ensuite, studio), with a room-name counter.
9. **Who it's for:** three columns: distributors and manufacturers, contractors and builders, real estate and developers. Copy reused from the deck.
10. **What you can order:** six outputs: drawings, exterior renders, interior renders, interactive 3D assembly, assembly animation, walkthrough video. Each has its formats.
11. **How it works:** 4 steps: send drawings → scope and quote → model review → final delivery.
12. **Contact / footer:** "Send the plans. I'll do the rest." Name David Budzik, a mailto link and the wordmark.

## Architecture

```
bzik-container-site/
  index.html        markup; every translatable string carries data-i18n="key"
  site.css          brand tokens (copied from bzik.css), layout, RTL rules
  js/i18n.js        { en: {...}, he: {...} }; setLang(lang) swaps text, lang, dir; remembers choice in localStorage (wrapped in try/catch)
  js/axo.js         Three.js scene module (no DOM knowledge beyond its canvas)
  js/scroll.js      all GSAP + ScrollTrigger timelines; the only caller of axo.js controls
  js/main.js        boot: fonts, i18n, axo init, scroll init, fallbacks
  assets/brand/     wordmark.svg, symbol.svg (unmodified copies)
  assets/img/       compressed JPGs (renders, interior stills, fallback axo PNGs)
```

### `axo.js` API

The geometry comes from the deck's assembly scene in `Container House/output/process-presentation/index.html` (module dims 12.19 × 2.44 × 2.90 m, pier grid, seam steel, glazing schedule, deck, pergolas, terrace, louvers, PV). It is restyled as a line drawing: white/off-white faces, `#131313` edges, pink edges for the active step, glazing in a pale grey-blue.

- `createAxo(canvas, {mode})` → controller; `mode` is `'hero'` (auto-rotate, finished state) or `'story'`.
- `setBuild(t)` — assembly progress 0–10 (same semantics as the deck's `tNow`).
- `setExtrude(k)` — 0–1 ground-floor wall height, for the plan → model chapter.
- `setView(k)` — 0 = plan, 1 = SE iso. Interpolates camera position and up-vector.
- `setExplode(k)`, `setSection(k)` — 0–1. The section uses a clipping plane on shell materials only.
- `setLabels(bool)`, `resize()`, `dispose()`.
- Renders only when a value changed or the hero is rotating, and pauses when its canvas is off-screen (IntersectionObserver).

There are two canvases: the hero instance, and one shared story instance whose canvas is pinned across chapters 3–4.

### `scroll.js`

One ScrollTrigger per pinned chapter, each with `scrub: true` and a timeline that tweens a plain state object (`{extrude, view, build, explode, section}`). An `onUpdate` pushes that state into the axo controller. `gsap.matchMedia()` provides three branches:
- `(prefers-reduced-motion: no-preference) and (min-width: 768px)`: full pins.
- Mobile: shorter pin distances and pixel ratio capped at 1.5.
- `(prefers-reduced-motion: reduce)`: no pins or scrubs; each chapter shows its end state and the room sequence becomes a static grid.

ScrollTrigger is refreshed after a language switch, because RTL and Hebrew text change layout heights.

### Libraries

- GSAP 3.12.5 + ScrollTrigger from cdnjs.
- Three.js 0.160.0 from jsdelivr via importmap.
- Fonts: Satoshi from `api.fontshare.com`, Heebo from Google Fonts.

No build step and no smooth-scroll library.

## Content

- English copy is adapted from the approved deck (cover, audiences, standard, outputs, how to start).
- Hebrew copy is drafted by Claude and flagged for native review before publishing.
- Images: compressed copies of `Container House/output/design-v2/*.png` and `Container House/output/stills-updated-v2/previews/*.png`. The interior stills are 720 × 480, a known limitation that is shown at moderate size, not full-bleed.
- No AI-generated imagery anywhere. The Kling assembly video and the `output/imagegen/` images are excluded.

## Error handling and fallbacks

- WebGL unavailable or three.js fails to load: each canvas is replaced by a static PNG of the matching state (plan, iso, exploded), exported once from the scene. Captions and scroll still work.
- GSAP fails to load: sections render as a normal static page (no `opacity:0` initial states are set in CSS; GSAP sets them in JS).
- `localStorage` throws: the language defaults from `navigator.language` (`he*` → Hebrew).

## Testing

In the built-in browser, via a local static server:
- 1440 × 900 and 375 × 812, in EN and HE.
- Scroll through every chapter. Check that the plan → iso transition, assembly steps, explode and section scrub forward and backward without jumps.
- Reduced motion emulated: no pins, all content visible.
- Console free of errors. Network shows no failed asset requests.
- Language toggle keeps scroll position sensible and pins re-measure.

## Out of scope

Hosting and deployment, contact form, analytics, CMS or editing tools, pricing, re-rendering higher-resolution stills, and the white-label per-distributor version.
