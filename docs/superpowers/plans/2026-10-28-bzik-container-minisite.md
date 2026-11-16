# BZIK Container Minisite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page EN/HE BZIK service site for container-house visualization. Its signature is a scroll-scrubbed, dimension-true line axonometry.

**Architecture:** Static site with no build step. `axo.js` owns a Three.js scene drawn as technical linework and exposes setters only. `scroll.js` owns every GSAP ScrollTrigger timeline and is the only caller of those setters. `i18n.js` swaps strings and text direction. `main.js` boots everything and handles fallbacks.

**Tech stack:** HTML/CSS/ES modules, Three.js 0.160.0 (jsdelivr importmap), GSAP 3.12.5 + ScrollTrigger (cdnjs), Satoshi (Fontshare), Heebo (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-10-28-bzik-container-minisite-design.md`

**Testing approach:** there is no test runner for a static page. Each task ends with a concrete check in the built-in browser against a local server (`python3 -m http.server 8766` from `white-lable-minisite/`), plus `node --check` for syntax on JS files. The folder is not a git repo, so "commit" steps are replaced by a checkpoint: the check passes and the files are saved.

**Root:** `R = /Users/davidbudzik/Documents/arcviz-concepts/white-lable-minisite/bzik-container-site`
**Sources:** `CH = /Users/davidbudzik/Documents/arcviz-concepts/Container House`, `BR = ~/Documents/BZIK_brand guidelines`

## File map

| File | Responsibility |
|---|---|
| `index.html` | Markup for 12 sections; `data-i18n` keys; importmap; script tags |
| `site.css` | Brand tokens, layout, components, RTL, reduced-motion |
| `js/i18n.js` | String dictionary EN/HE + `setLang()` |
| `js/axo.js` | Three.js scene + controller API |
| `js/scroll.js` | GSAP timelines for hero, plan→model, assembly, clay wipe, gallery, rooms, reveals |
| `js/main.js` | Boot order, WebGL/GSAP fallbacks, language toggle wiring |
| `assets/brand/*.svg` | Unmodified copies of the BZIK wordmark and symbol |
| `assets/img/*.jpg` | Compressed renders and stills; `axo-*.png` fallbacks |

---

### Task 1: Scaffold and assets

**Files:** create `R/assets/brand/`, `R/assets/img/`, `R/js/`

- [ ] **Step 1: Copy brand and image assets**

```bash
R="/Users/davidbudzik/Documents/arcviz-concepts/white-lable-minisite/bzik-container-site"
CH="/Users/davidbudzik/Documents/arcviz-concepts/Container House"
BR="$HOME/Documents/BZIK_brand guidelines"
mkdir -p "$R/assets/brand" "$R/assets/img" "$R/js"
cp "$BR/assets/wordmark.svg" "$BR/assets/symbol.svg" "$R/assets/brand/"
for f in clay day-se day-ne dusk terrace interior; do sips -s format jpeg -s formatOptions 80 "$CH/output/design-v2/$f.png" --out "$R/assets/img/r-$f.jpg" >/dev/null; done
for f in "$CH"/output/stills-updated-v2/previews/{01,02,03,04,05,06,07,08,09,10}-*.png; do sips -s format jpeg -s formatOptions 82 "$f" --out "$R/assets/img/s-$(basename "$f" .png).jpg" >/dev/null; done
ls "$R/assets/img" | wc -l
```

Expected: `16`.

- [ ] **Step 2: Check that the logos use `currentColor` or a fixed fill**

Run: `grep -o 'fill="[^"]*"' "$R/assets/brand/wordmark.svg" | sort -u`
If the fill is a fixed colour, inline the SVG in HTML and set `fill="currentColor"` on the inline copy only. The files themselves stay unmodified.

### Task 2: `site.css`: tokens, base, layout primitives

**Files:** create `R/site.css`

- [ ] **Step 1: Write tokens and base styles**

```css
:root{
  --canvas:#F3F3F0; --surface:#FFFFFF; --ink:#131313; --ink-2:#555552; --ink-3:#73736F;
  --line:#DDDDD8; --line-soft:#EBEBE7; --pink:#F2A4C3; --pink-hover:#E97FAA; --pink-ink:#8E3159;
  --ease:cubic-bezier(0.2,0,0,1); --d-base:250ms; --d-slow:400ms;
  --f-latin:'Satoshi',system-ui,sans-serif; --f-he:'Heebo','Satoshi',system-ui,sans-serif;
  --gutter:clamp(16px,4vw,64px); --maxw:1440px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--canvas);color:var(--ink);font-family:var(--f-latin);-webkit-font-smoothing:antialiased}
html[lang=he]{font-family:var(--f-he)}
body{background:var(--canvas);overflow-x:hidden}
img{display:block;max-width:100%}
a{color:inherit}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--gutter)}
.kicker{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.h-display{font-weight:500;font-size:clamp(48px,8vw,128px);line-height:.94;letter-spacing:-.04em}
.h-1{font-weight:500;font-size:clamp(36px,5vw,72px);line-height:1;letter-spacing:-.03em}
.lede{font-size:clamp(18px,1.6vw,22px);line-height:1.45;color:var(--ink-2);max-width:46ch}
.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;background:var(--pink);color:var(--ink);font-weight:500;text-decoration:none;transition:background var(--d-base) var(--ease)}
.btn:hover{background:var(--pink-hover)}
.rule{border:0;border-top:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
```

- [ ] **Step 2: Add section-specific styles.** Use these selectors (they are referenced by the markup in Task 3 and the timelines in Task 7):
  - `.nav`: sticky, `backdrop-filter`, wordmark height 22px. `.lang button[aria-pressed=true]` gets a pink background.
  - `.hero`: 100svh grid, copy left and canvas `#heroAxo` right. Under 768px it stacks, with the canvas at 60vw height.
  - `.story`: section wrapping `.story-pin` (100svh, contains `#storyAxo` and `.story-captions`); each `.story-cap[data-at]` is absolutely positioned and hidden via opacity.
  - `.steps li[data-step]` and `.steps li.on`: pink left border, or pink right border in RTL.
  - `.break`: pink full-bleed, `.break-arc` absolutely positioned bottom-end using `symbol.svg` at 50vw.
  - `.wipe`: aspect 3/2, `.wipe-top` with `clip-path:inset(0 0 0 var(--w,100%))`.
  - `.hgal`: overflow hidden, `.hgal-track` flex row of `figure` at 70vw.
  - `.rooms`: pinned, `.room` absolutely stacked, `.room-count` and `.room-name`.
  - `.grid-3`, `.grid-outputs` (3×2), `.how ol`, `.contact`.
  - RTL: `[dir=rtl] .hgal-track{flex-direction:row-reverse}` and logical properties (`margin-inline`, `inset-inline-end`) everywhere instead of left/right.

- [ ] **Step 3: Check.** `open` is not needed. After Task 3, load the page and confirm Satoshi renders (DevTools → computed `font-family` on `h1`).

### Task 3: `index.html` markup

**Files:** create `R/index.html`

- [ ] **Step 1: Write the head**

```html
<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BZIK — Container houses, built to the millimetre</title>
<meta name="description" content="Renders, walkthroughs and interactive 3D assembly for container-house distributors, contractors and real estate. Every output rendered from one dimension-true model.">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500&display=swap">
<link rel="stylesheet" href="site.css">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script type="module" src="js/main.js"></script>
</head>
```

- [ ] **Step 2: Write the 12 sections in spec order.** Rules:
  - Every visible string has `data-i18n="<key>"`. Keys are listed in Task 4. The English text is written inline too, so the page reads correctly before JS runs.
  - IDs used by JS: `heroAxo` (canvas), `storyAxo` (canvas), `story` (section), `steps` (ol with 10 `li[data-step=0..9]`), `wipe`, `hgal`, `rooms`, `langToggle`.
  - Story captions: `.story-cap` elements with `data-at="plan"`, `"extrude"`, `"assembly"`, `"explode"`, `"section"`.
  - The contact button is `<a class="btn" href="mailto:bzik.david@gmail.com?subject=Container%20house%20visualization">`.
  - Images use `loading="lazy"`, real `alt` text and explicit `width`/`height` (1200×800 renders, 720×480 stills).
  - Each canvas wrapper also contains `<img class="axo-fallback" hidden>` pointing to `assets/img/axo-iso.png`.

- [ ] **Step 3: Check.** Run `python3 -m http.server 8766` in `white-lable-minisite/`, open `http://localhost:8766/bzik-container-site/`. All 12 sections should be readable with JS disabled (Network → block `main.js`): no blank sections and no invisible text.

### Task 4: `js/i18n.js`

**Files:** create `R/js/i18n.js`

- [ ] **Step 1: Write the module**

```js
export const STR = {
  en: { 'nav.process':'Process','nav.work':'Work','nav.outputs':'Outputs','nav.contact':'Contact',
        'hero.kicker':'Visualization for container houses','hero.title':'Your drawings, built to the millimetre.',
        'hero.lede':'Renders, walkthroughs and interactive 3D assembly for distributors, contractors and real estate. Every output comes from one model built to your plan dimensions.',
        'cta.send':'Send your plans' /* …every key used in index.html… */ },
  he: { 'nav.process':'תהליך','nav.work':'עבודות','nav.outputs':'תוצרים','nav.contact':'צור קשר',
        'hero.kicker':'הדמיות לבתי מכולות','hero.title':'השרטוטים שלכם, בנויים במדויק עד המילימטר.',
        'hero.lede':'הדמיות, סרטוני הליכה והרכבה תלת־ממדית אינטראקטיבית למפיצים, קבלנים ונדל״ן. כל תוצר נובע ממודל אחד שנבנה לפי מידות התוכנית.',
        'cta.send':'שלחו תוכניות' /* … */ }
};
export function setLang(lang){
  const d = STR[lang] ? lang : 'en';
  document.documentElement.lang = d;
  document.documentElement.dir = d === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = STR[d][el.dataset.i18n]; if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === d)));
  try { localStorage.setItem('bzik-lang', d); } catch (e) {}
  return d;
}
export function initialLang(){
  try { const s = localStorage.getItem('bzik-lang'); if (s) return s; } catch (e) {}
  return (navigator.language || '').toLowerCase().startsWith('he') ? 'he' : 'en';
}
```

- [ ] **Step 2: Fill both dictionaries with every key in `index.html`.**
  - Check: `grep -o 'data-i18n="[^"]*"' R/index.html | sort -u | wc -l` must equal the key count of `STR.en`. Verify in the console with `Object.keys(STR.en).length`.
  - Every `en` key must also exist in `he`.
  - The Hebrew copy is a draft for native review.

- [ ] **Step 3: Check.** `node --check R/js/i18n.js` → no output.

### Task 5: `js/axo.js`: scene and controller

**Files:** create `R/js/axo.js`

Port the geometry from `CH/output/process-presentation/index.html` (the `<script type="module">` block: `container()`, piers, steel, stair, `pane()` glazing, deck, pergolas, terrace, louvers, PV, and the `STEPS` step indices 0–9). Change only what is listed here.

- [ ] **Step 1: Style changes.**
  - Faces: `MeshBasicMaterial` in palette `{shell:0xFFFFFF, steel:0x131313, glass:0xE6ECEE, oak:0xEBE3D6, pier:0xDDDDD8}`.
  - All edges: `0x131313`. Active-step edges: `0xE97FAA`.
  - Background: transparent.
  - Corrugation line opacity: 0.22.
  - No lights needed.
- [ ] **Step 2: Extrude support.** Ground modules C1–C3 get `p.extrudable = true`. In `apply()`, apply `obj.scale.y = max(0.001, state.extrude)` for extrudable pieces when `state.build >= 4`, else drop animation as in the deck.
- [ ] **Step 3: Section clipping.** Create one `THREE.Plane(new Vector3(-1,0,0), x)`. Assign it to `clippingPlanes` of shell face materials only, and set `renderer.localClippingEnabled = true`. `setSection(k)` maps k 0–1 to plane constant `L+0.5 → -0.5` (east to west); k=0 sets `clippingPlanes=[]`.
- [ ] **Step 4: Controller API (exact signatures)**

```js
export function createAxo(canvas, { mode = 'story' } = {}) {
  // returns:
  return {
    setBuild(t)    {/* 0..10 */},
    setExtrude(k)  {/* 0..1  */},
    setView(k)     {/* 0 plan .. 1 SE iso; lerp camera dir (0,1,0.0001)->(1,0.82,1), up (0,0,-1)->(0,1,0) */},
    setExplode(k)  {/* 0..1 level offsets [0,2.4,4.2] m */},
    setSection(k)  {/* 0..1 */},
    setLabels(on)  {},
    resize()       {/* reads canvas.clientWidth/Height, updates ortho frustum (half-height 12 / zoom), renderer size, pixel ratio min(dpr, mobile?1.5:2) */},
    dispose()      {},
  };
}
```

All setters store into one `state` object and set `dirty = true`. One rAF loop renders when `dirty || mode === 'hero'`. In hero mode the root group rotates at 0.08 rad/s. The loop pauses while an IntersectionObserver reports the canvas off-screen. Labels are HTML elements in the canvas's parent (`.axo-labels`), projected each render as in the deck.

- [ ] **Step 5: Check.** `node --check R/js/axo.js`. Then in the browser console on the page:

```js
const m = await import('./js/axo.js'); const a = m.createAxo(document.getElementById('storyAxo'));
a.setView(0); a.setBuild(4); a.setExtrude(0);
```

Expected: a plan view with flat module outlines and dimension labels. `a.setExtrude(1); a.setView(1)` → SE iso with full-height boxes. `a.setBuild(10); a.setExplode(1); a.setSection(0.5)` → exploded, with shells clipped at mid-length so the stair is visible.

### Task 6: `js/main.js`: boot and fallbacks

**Files:** create `R/js/main.js`

- [ ] **Step 1: Write boot**

```js
import { setLang, initialLang } from './i18n.js';
let axoMod = null;
function webglOK(){ try { const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); } catch(e){ return false; } }
function showFallback(canvas){ canvas.hidden = true; const img = canvas.parentElement.querySelector('.axo-fallback'); if (img) img.hidden = false; }

async function boot(){
  setLang(initialLang());
  const hero = document.getElementById('heroAxo'), story = document.getElementById('storyAxo');
  let axos = { hero:null, story:null };
  if (webglOK()) {
    try { axoMod = await import('./axo.js');
      axos.hero = axoMod.createAxo(hero, { mode:'hero' }); axos.hero.setBuild(10); axos.hero.setView(1);
      axos.story = axoMod.createAxo(story, { mode:'story' });
    } catch (e) { console.warn('3D unavailable', e); showFallback(hero); showFallback(story); }
  } else { showFallback(hero); showFallback(story); }
  addEventListener('resize', () => { axos.hero?.resize(); axos.story?.resize(); });
  let refresh = () => {};
  if (window.gsap && window.ScrollTrigger) {
    const { initScroll } = await import('./scroll.js');
    refresh = initScroll({ story: axos.story });
  }
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); refresh(); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
```

The GSAP scripts are `defer` and the module script runs after them, so `window.gsap` is defined at boot.

- [ ] **Step 2: Check.** Load the page. The hero shows a rotating finished house and the console has no errors. Toggle to HE: the text changes, `dir=rtl`, and the nav order mirrors.

### Task 7: `js/scroll.js`: timelines

**Files:** create `R/js/scroll.js`

- [ ] **Step 1: Write the module**

```js
export function initScroll({ story }) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const S = { extrude:0, view:0, build:4, explode:0, section:0 };
  const push = () => { if (!story) return;
    story.setExtrude(S.extrude); story.setView(S.view); story.setBuild(S.build);
    story.setExplode(S.explode); story.setSection(S.section); markStep(S.build); };
  const steps = [...document.querySelectorAll('#steps li')];
  function markStep(t){ const f = Math.max(0, Math.min(9, Math.ceil(t - 1e-3) - 1)); steps.forEach((li,i)=>li.classList.toggle('on', i===f)); }
  const caps = gsap.utils.toArray('.story-cap');
  const capTo = name => caps.forEach(c => gsap.to(c, { autoAlpha: c.dataset.at === name ? 1 : 0, duration: .3, overwrite: true }));
  const mm = gsap.matchMedia();

  mm.add({ full:'(prefers-reduced-motion: no-preference) and (min-width: 768px)',
           mobile:'(prefers-reduced-motion: no-preference) and (max-width: 767px)',
           reduce:'(prefers-reduced-motion: reduce)' }, ctx => {
    const { reduce, mobile } = ctx.conditions;
    if (reduce) { Object.assign(S, { extrude:1, view:1, build:10, explode:0, section:0 }); push(); caps.forEach(c=>gsap.set(c,{autoAlpha:1})); return; }
    const k = mobile ? 0.6 : 1;

    // plan → model → assembly → explode → section, one pinned story
    const tl = gsap.timeline({ defaults:{ ease:'none' }, onUpdate: push,
      scrollTrigger:{ trigger:'#story', start:'top top', end:`+=${Math.round(700*k)}%`, pin:'.story-pin', scrub:0.6,
        onUpdate: self => { const p = self.progress; capTo(p<.12?'plan':p<.28?'extrude':p<.75?'assembly':p<.88?'explode':'section'); } } });
    tl.set(S, { extrude:0, view:0, build:4 })
      .to(S, { duration:1, extrude:1 })
      .to(S, { duration:1, view:1 }, '<0.3')
      .to(S, { duration:4, build:10 })
      .to(S, { duration:1, explode:1 })
      .to(S, { duration:1.2, section:1 });

    // clay → finished wipe
    gsap.fromTo('#wipe', { '--w':'100%' }, { '--w':'0%', ease:'none',
      scrollTrigger:{ trigger:'#wipe', start:'center center', end:'+=120%', pin:true, scrub:true } });

    // horizontal gallery
    const track = document.querySelector('#hgal .hgal-track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, { x: () => (document.dir === 'rtl' ? 1 : -1) * dist(), ease:'none',
      scrollTrigger:{ trigger:'#hgal', start:'top top', end: () => '+=' + dist(), pin:true, scrub:true, invalidateOnRefresh:true } });

    // room-by-room crossfade
    const rooms = gsap.utils.toArray('#rooms .room'), count = document.querySelector('#rooms .room-count');
    const rt = gsap.timeline({ scrollTrigger:{ trigger:'#rooms', start:'top top', end:`+=${rooms.length*60*k}%`, pin:true, scrub:true,
      onUpdate: s => { count.textContent = String(Math.min(rooms.length, Math.floor(s.progress*rooms.length)+1)).padStart(2,'0') + ' / ' + rooms.length; } } });
    rooms.forEach((r,i) => { if (i) rt.fromTo(r, { autoAlpha:0, scale:1.04 }, { autoAlpha:1, scale:1, duration:1 }); });

    // section reveals
    gsap.utils.toArray('[data-reveal]').forEach(el => gsap.from(el, { y:40, autoAlpha:0, duration:.8, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 85%', once:true } }));
  });
  push();
  return () => ScrollTrigger.refresh();
}
```

- [ ] **Step 2: Check.** `node --check R/js/scroll.js`. Then scroll the page top to bottom and back, and confirm:
  1. The story opens as a plan.
  2. Walls rise.
  3. The camera tilts into iso.
  4. Modules arrive in order, with the step list highlighting each.
  5. The model explodes.
  6. A section sweeps through it.
  7. Scrolling back reverses everything with no jumps.

  Also confirm the wipe, horizontal gallery and rooms pin and scrub, the room counter shows `01 / 10 … 10 / 10`, and the console has no errors.

### Task 8: Fallback images

**Files:** create `R/assets/img/axo-plan.png`, `axo-iso.png`, `axo-exploded.png`

- [ ] **Step 1:** In the browser console, call `story.setView(0); story.setExtrude(0); story.setBuild(4)` and screenshot the canvas region at 1600 px wide. Repeat for iso (view 1, build 10) and exploded (explode 1). Save the files under the names above. Set `.axo-fallback` src per canvas: hero → `axo-iso.png`, story → `axo-plan.png`, and add `axo-exploded.png` to the explode caption as an `<img>` that is shown only when the story canvas is hidden.
- [ ] **Step 2: Check.** Block `three.module.js` in the request blocker, or set `window.WebGLRenderingContext = undefined` before boot. Static images should appear where the canvases were, with no layout jump and no console errors beyond the warning.

### Task 9: Verification pass

- [ ] **Step 1:** At 1440×900 in EN, run the full scroll from Task 7 Step 2.
- [ ] **Step 2:** At 1440×900 in HE: RTL mirrors the layout, the gallery scrolls in the right direction, captions are in Hebrew, and pins re-measure after toggling.
- [ ] **Step 3:** At 375×812 in EN: no horizontal page scroll, shorter pins, hero canvas stacked under the copy.
- [ ] **Step 4:** With reduced motion emulated: no pins, the story shows the finished iso, rooms show statically, all text is visible.
- [ ] **Step 5:** Network tab: no 404s. Console: no errors.
- [ ] **Step 6:** Write `R/README.md` covering how to run locally (`python3 -m http.server`), the file map, where the strings live, and the known limitations (Hebrew copy needs native review; interior stills are 720×480; fonts and libraries load from CDN).

---

## Self-review

- **Spec coverage:**
  - Nav, hero, plan→model, assembly + explode + section, pink break, clay wipe, gallery and rooms: Tasks 3, 5, 7.
  - Audiences, outputs, how-it-works and contact: Task 3.
  - EN/HE: Tasks 4 and 6.
  - Brand: Tasks 1–2.
  - Fallbacks: Tasks 6 and 8.
  - Reduced motion and mobile: Task 7.
  - Tests: Task 9.
- **Names consistent across tasks:** `createAxo`, `setBuild`, `setExtrude`, `setView`, `setExplode`, `setSection`, `setLabels`, `resize`, `initScroll`, `setLang`, `initialLang`; the IDs `heroAxo`, `storyAxo`, `story`, `steps`, `wipe`, `hgal`, `rooms`.
- **Gap fixed:** the spec's "room sequence becomes a static grid" under reduced motion is handled by CSS `@media (prefers-reduced-motion:reduce){ #rooms .room{position:static;opacity:1} }`, added in Task 2 Step 2.
