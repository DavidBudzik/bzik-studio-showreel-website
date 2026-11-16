# BZIK Sales Tools — Showreel Site Spec

**Date:** 2026-11-08 · **Status:** Draft for review

## 1. Positioning
BZIK is not a render studio. BZIK builds interactive sales tools that real-estate sales teams use with buyers: 360 walkthroughs, interactive floor plans, clay-to-final comparisons, property minisites.

Headline direction (EN): *"Tools your sales team sells with — not pictures they show."*
Hebrew copy written natively, not translated (review needed before launch).

## 2. Audience
**Primary:** sales agents in the showroom, presenting on a tablet with a buyer beside them.
**Secondary:** developer marketing managers who receive a link from an agent and decide to buy.

Implications:
- Tablet-first (landscape 1180×820 and portrait), touch targets ≥ 48 px.
- **Present mode:** one tap hides nav and copy, leaves only the live tool full-screen. Exit button in a corner.
- Each tool starts in one tap; no scroll-hunting during a meeting.
- Works on showroom Wi‑Fi: tools lazy-load; poster image shows instantly.

## 3. Market & brand
- Israel. BZIK brand tokens (from `BZIK_brand guidelines/bzik.css`).
- Hebrew + English with full RTL; language toggle top bar. Reuse `js/i18n.js` pattern from bzik-container-site.

## 4. Site structure

### 4.1 Hero — live, not video
Container House axonometry (reuse `axo.js`) builds itself as page loads. Buyer-facing caption: "Every room, before it exists." Button: **Try it** → present mode.

### 4.2 The toolkit (core section)
Five cards. Each card = poster + 6 s looping preview; tap opens the live tool inline (decided default: preview video, live on tap; in present mode always live).

| Tool | Source project | What the agent does with it |
|---|---|---|
| 360 walkthrough | David's 360 work (folder TBD) | Buyer "stands" in the living room, turns around, sees the view |
| Interactive floor plan | bzik-container-site (`explore.js`) | Tap a room → size, finishes, light, furniture fit |
| Clay → reality | Clay to Reality Viewer | Drag slider: model vs finished interior; proves accuracy |
| Plan to apartment | rz-plan | Messy plan → clean plan → furnished renders → fast-cut video |
| White-label minisite | white-lable-minisite | Developer's own branded site per project, ready to send on WhatsApp |

### 4.3 Case studies
Each property shown as **the tools it received**, not a gallery.
Story frame per case: *Sales problem → Tools built → What the agent can now do in the meeting.*
No numbers yet — phrase outcomes as capabilities ("buyer sees the finished bathroom before tiling"). Slot reserved for metrics/quotes later.

1. **Container House** (flagship): model, 39 views, walkthrough, comparison viewer, axo explorer, lighting plan.
2. **RZ Apartment**: plan cleanup, furnishing, fast-cut reel.
3. **White-label minisites**: 3 projects × 10 sheets, clearance-checked plans.

### 4.4 How it works
4 steps: Your drawings → We build the model once → Tools generated from it → In the showroom, on tablet, by WhatsApp link.

### 4.5 CTA — "Send one floor plan, get a live demo"
Upload / WhatsApp / email a single plan; BZIK returns a working interactive plan for that project. Form fields: name, company, project, plan file, phone. Hosting and form backend: decide at build (current sites are mailto only).

## 5. Technical
- Static site, vanilla JS + ES modules (matches existing projects). GSAP (ScrollTrigger) + Three.js from CDN, pinned versions.
- 360 viewer: Three.js equirectangular sphere or Pannellum — pick after seeing 360 assets.
- Static image fallbacks when WebGL unavailable (existing pattern in `main.js`).
- `prefers-reduced-motion` respected.
- Production renders re-exported ≥ 2560 px (current exteriors 1200 px, interiors 720 px — too soft for full-screen).

## 6. Open items
- [ ] Location and format of 360 panoramas (equirectangular JPG? Matterport? Pano tour export?)
- [ ] Hebrew copy native review
- [ ] Hosting + form backend for CTA
- [ ] Client permission wording per project (all approved for showing — confirm credits/names)

## 7. Next steps
1. Wireframe homepage + one case page (tablet landscape, EN + HE).
2. Build hero + toolkit with reused modules.
3. Add case studies, CTA, present mode.
