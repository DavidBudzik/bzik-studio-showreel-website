# BZIK — interactive sales tools

The BZIK website, in English and Hebrew. Plain HTML, CSS and JavaScript: no build step, no framework.

## Preview locally

From this folder:

```bash
npx http-server -p 8766 -c-1
```

Then open http://localhost:8766. Use a local server rather than opening the files directly: the drawing viewer and the
tools load files with JavaScript, which browsers block for `file://` pages.

## What's where

| Path | What it is |
| --- | --- |
| `index.html`, `about.html` | Home, and About + contact (English) |
| `toolkit/*.html` | One page per tool: 360° walkthrough, interactive floor plan, sections & exploded views, clay → reality, walkthrough film |
| `he/` | The same pages in Hebrew, right to left, at the same paths |
| `404.html` | "Page not found", English and Hebrew |
| `css/site.css` | All styles. Colours are the `--bz-*` tokens at the top; Hebrew rules are in the "Hebrew / RTL" section |
| `js/site.js` | Behaviour: scroll reveals, pop-up demos, comparison sliders, plan-to-apartment steps, drawing viewer. Text that only JavaScript shows is in `TEXT` at the top, English and Hebrew |
| `images/` | Photography, posters, comparison pairs, and the drawing sets (`images/drawings/<project>/*.svg`, with `areas.json`) |
| `media/`, `assets/` | Videos, the studio animation, and the font shared by the tools |
| `fonts/` | Editorial (used for the large numbers) |
| `tools/` | The interactive tools, each self-contained and shown inside the pages: `moor-tour`, `room-explorer`, `rz-isometric.html`, `rz-rendered`, `rz-renders`, `finish-selection`, `container-presentation`, `container-minisite` |

## Editing

- **Text:** edit the HTML page. Every English page has a Hebrew twin at the same path under `he/`; change both.
- **Pop-ups on the home page:** each tool card opens the `<template id="demo-…">` block with the same name at the bottom of
  `index.html` (and `he/index.html`).
- **Drawings:** a tool page's drawing viewer reads its sheets from `images/drawings/<project>/`. The `data-config`
  attribute on `.drawing-section` lists the sheets, their codes and the tabs.
- **Tools** take their language from the address: `?lang=he` (or `#he` for `rz-isometric.html` and `rz-rendered`).

## Notes

- The Hebrew for the newest content (the Finish selection card, the living-room section on the 360° page, and
  plan-to-apartment steps 04–05) is a first draft and needs a native review.
- Fonts load from Fontshare (Satoshi) and Google Fonts (Heebo, Hebrew pages only). The presentation and minisite tools load
  libraries from cdnjs and jsDelivr.
- `White-Label-Minisite.html` is the previous single-file version of the site, kept for comparison until the new site is
  approved. The other top-level files (`Architecture-Drawing-Archive.html`, `drawings-export/`, `docs/`, `sales-tools/`,
  the `.py` checks) are working material, not part of the website.
