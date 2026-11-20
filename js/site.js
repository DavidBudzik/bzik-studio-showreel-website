/* BZIK site behaviour. Plain JavaScript, no libraries.
 *
 *  - scroll reveals (.reveal)
 *  - video pause / play buttons ([data-video-toggle])
 *  - demo pop-ups: a button with data-demo="x" opens <template id="demo-x"> in a dialog
 *  - embeds that load on click: a button with data-embed="url" inside .tour-stage
 *  - clay / finished comparison sliders ([data-cmp])
 *  - plan-to-apartment steps ([data-rz])
 *  - drawing viewer on tool pages (.drawing-section[data-config])
 *
 * Text that only JavaScript shows lives in TEXT below, in English and Hebrew.
 * Everything else is in the HTML pages.
 */
(() => {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const lang = html.lang === 'he' ? 'he' : 'en';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TEXT = {
    en: {
      pause: 'Pause',
      play: 'Play',
      fullScreen: 'Full screen',
      close: 'Close ✕',
      closeDemo: 'Close demo',
      closeDrawing: 'Close',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      fit: 'Fit',
      viewport: 'Drawing; scroll to pan when zoomed',
      zoomNote: 'Zoom for detail. Download the original SVG to print at A3 / 100%.',
      fullySeparated: 'Fully separated',
      roofLowered: 'Roof lowered',
      separated: (n) => `${n}% separated`,
      download: (ext) => `Download ${ext}`,
      finished: 'finished view',
      clay: 'clay model',
    },
    he: {
      pause: 'השהיה',
      play: 'הפעלה',
      fullScreen: 'מסך מלא',
      close: 'סגירה ✕',
      closeDemo: 'סגירת ההדגמה',
      closeDrawing: 'סגירה',
      zoomIn: 'הגדלה',
      zoomOut: 'הקטנה',
      fit: 'התאמה',
      viewport: 'שרטוט; גוללים כדי לנוע כשהוא מוגדל',
      zoomNote: 'מגדילים כדי לראות פרטים. מורידים את קובץ ה־SVG המקורי כדי להדפיס ב־A3 / 100%.',
      fullySeparated: 'מופרד לגמרי',
      roofLowered: 'הגג הונמך',
      separated: (n) => `${n}% הפרדה`,
      download: (ext) => `הורדת ${ext}`,
      finished: 'מבט גמור',
      clay: 'מודל חימר',
    },
  }[lang];

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- sticky header height (anchors land below it) ---------- */
  const shell = doc.querySelector('.shell');
  const setNavHeight = () => shell && html.style.setProperty('--nav-h', shell.offsetHeight + 'px');
  setNavHeight();
  addEventListener('resize', setNavHeight);

  /* ---------- scroll reveals ---------- */
  const reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.08 },
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- background videos: respect reduced motion ---------- */
  if (reduceMotion) {
    doc.querySelectorAll('[data-video-toggle]').forEach((button) => {
      const video = button.parentElement.querySelector('video');
      if (!video) return;
      video.removeAttribute('autoplay');
      video.pause();
      button.textContent = TEXT.play;
      button.setAttribute('aria-pressed', 'true');
    });
  }

  function toggleVideo(button) {
    const video = button.parentElement.querySelector('video');
    if (!video) return;
    if (video.paused) {
      video.play();
      button.textContent = TEXT.pause;
      button.setAttribute('aria-pressed', 'false');
    } else {
      video.pause();
      button.textContent = TEXT.play;
      button.setAttribute('aria-pressed', 'true');
    }
  }

  /* ---------- demo pop-ups ---------- */
  let demoDialog = null;

  function openDemo(button) {
    if (button.dataset.href) {
      location.href = button.dataset.href; // e.g. the floor plan opens its own page
      return;
    }
    const template = doc.getElementById('demo-' + button.dataset.demo);
    if (!template) return;
    demoDialog?.close();

    const dialog = doc.createElement('dialog');
    dialog.className = 'demo-dialog';
    dialog.setAttribute('aria-label', template.dataset.title || '');
    dialog.innerHTML =
      `<header class="demo-bar"><span>${esc(template.dataset.title)}</span><div>` +
      `<button type="button" data-demo-full>${esc(TEXT.fullScreen)}</button>` +
      `<button type="button" data-demo-close aria-label="${esc(TEXT.closeDemo)}">${esc(TEXT.close)}</button>` +
      `</div></header><div class="demo-body"></div>`;
    dialog.querySelector('.demo-body').append(template.content.cloneNode(true));
    doc.body.append(dialog);

    // a plan-to-apartment block loads the iframe of its selected step
    dialog.querySelectorAll('[data-rz]').forEach((rz) => showStep(rz, rz.querySelector('[data-rz-step][aria-selected="true"]')));

    dialog.addEventListener('close', () => {
      if (doc.fullscreenElement) doc.exitFullscreen?.();
      dialog.remove();
      if (demoDialog === dialog) demoDialog = null;
    });
    demoDialog = dialog;
    dialog.showModal();
  }

  function toggleFullScreen() {
    if (doc.fullscreenElement) {
      doc.exitFullscreen();
      return;
    }
    const el = html;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
  }

  /* ---------- embeds that load on click (360 tours, room explorer) ---------- */
  function startEmbed(button) {
    const frame = doc.createElement('iframe');
    frame.title = button.dataset.embedTitle || '';
    frame.src = button.dataset.embed;
    frame.setAttribute('allow', 'fullscreen');
    frame.allowFullscreen = true;
    button.closest('.tour-stage').replaceChildren(frame);
    frame.focus();
  }

  /* ---------- clay / finished comparison ---------- */
  function choosePair(button) {
    const root = button.closest('[data-cmp]');
    const title = button.textContent.trim();
    const finished = root.querySelector('.cmp-hi');
    const clay = root.querySelector('.cmp-clay');
    finished.src = button.dataset.hi;
    finished.alt = `${title}, ${TEXT.finished}`;
    clay.src = button.dataset.clay;
    clay.alt = `${title}, ${TEXT.clay}`;
    root.querySelectorAll('[data-pair]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  }

  /* ---------- plan to apartment: step tabs ---------- */
  function showStep(root, tab) {
    if (!tab) return;
    root.querySelectorAll('[data-rz-step]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    root.querySelectorAll('[data-rz-img]').forEach((panel) => {
      const active = panel.dataset.rzImg === tab.dataset.rzStep;
      panel.hidden = !active;
      const frame = active && panel.querySelector('iframe[data-src]');
      if (frame && !frame.getAttribute('src')) frame.src = frame.dataset.src;
    });
  }

  /* ---------- clicks ---------- */
  doc.addEventListener('click', (event) => {
    const t = event.target;
    const hit = (selector) => t.closest(selector);
    let el;
    if ((el = hit('[data-video-toggle]'))) return toggleVideo(el);
    if ((el = hit('[data-demo]'))) {
      event.preventDefault();
      return openDemo(el);
    }
    if (hit('[data-demo-close]')) return demoDialog?.close();
    if (hit('[data-demo-full]')) return toggleFullScreen();
    if ((el = hit('[data-embed]'))) return startEmbed(el);
    if ((el = hit('[data-pair]'))) return choosePair(el);
    if ((el = hit('[data-rz-step]'))) return showStep(el.closest('[data-rz]'), el);
  });

  doc.addEventListener('input', (event) => {
    const t = event.target;
    if (t.matches('.cmp-stage input[type=range]')) t.closest('.cmp-stage').style.setProperty('--pos', t.value + '%');
  });

  /* ---------- drawing viewer (tool pages) ---------- */
  const section = doc.querySelector('.drawing-section[data-config]');
  if (section) drawingViewer(section);

  function drawingViewer(sec) {
    // config: { dir, slug, title, sheets: { kind: [label, code] }, tabs: [{ key, label, sub, views: [[kind, label]] }] }
    const config = JSON.parse(sec.dataset.config);
    const canvas = sec.querySelector('.drawing-canvas');
    const code = sec.querySelector('.drawing-code');
    const download = sec.querySelector('.drawing-download');
    const angleNav = sec.querySelector('.angle-nav');
    const isoWrap = sec.querySelector('.iso-wrap');
    const areas = sec.querySelector('.area-summary');
    const svgCache = {};
    let current = sec.dataset.kind || 'plan';
    let request = 0;

    const url = (kind) => `${config.dir}/${kind}.svg`;
    const load = (kind) =>
      (svgCache[kind] ||= fetch(url(kind)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))));

    async function setDrawing(kind) {
      const sheet = config.sheets[kind];
      if (!sheet) return;
      const ticket = ++request;
      current = kind;
      sec.dataset.kind = kind;

      const tab = config.tabs.find((tb) => tb.views.some((v) => v[0] === kind));
      sec.querySelectorAll('.drawing-nav [data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab?.key)));
      const many = tab && tab.views.length > 1;
      angleNav.innerHTML = many
        ? `<span>${esc(tab.sub)}</span>` +
          tab.views.map(([k, label]) => `<button type="button" data-drawing="${k}" aria-pressed="${k === kind}">${esc(label)}</button>`).join('')
        : '';
      angleNav.hidden = !many;
      if (areas) areas.hidden = kind !== 'areas';
      code.textContent = `${sheet[1]} / ${sheet[0]}`;
      download.href = url(kind);
      download.download = `${config.slug}-${kind}.svg`;
      download.textContent = TEXT.download('SVG');
      isoWrap.hidden = !kind.startsWith('exploded');
      resetIso(sec);

      canvas.classList.add('is-loading');
      let markup;
      try {
        markup = await load(kind);
      } catch {
        markup = `<img src="${url(kind)}" alt="${esc(config.title)} — ${esc(sheet[0])}">`;
      }
      if (ticket !== request) return; // a newer choice arrived meanwhile
      canvas.innerHTML = markup;
      canvas.classList.remove('is-loading');
    }

    sec.addEventListener('click', (event) => {
      const b = event.target.closest('[data-drawing]');
      if (b) setDrawing(b.dataset.drawing);
      if (event.target.closest('[data-draw-open]')) openDrawing();
    });
    sec.addEventListener('input', (event) => isoInput(sec, event.target));

    function openDrawing() {
      const sheet = config.sheets[current];
      const dialog = doc.createElement('dialog');
      dialog.className = 'drawing-dialog';
      dialog.setAttribute('aria-label', `${config.title} — ${sheet[0]}`);
      const controls = current.startsWith('exploded') ? sec.querySelector('.iso-controls').outerHTML : '';
      dialog.innerHTML =
        `<div class="dialog-bar"><span>${esc(config.title)} / ${esc(sheet[0])}</span>` +
        `<button type="button" data-zoom="out" aria-label="${esc(TEXT.zoomOut)}">−</button>` +
        `<button type="button" data-zoom="in" aria-label="${esc(TEXT.zoomIn)}">+</button>` +
        `<button type="button" data-zoom="reset">${esc(TEXT.fit)}</button>` +
        `<button type="button" data-draw-close>${esc(TEXT.closeDrawing)}</button></div>` +
        `<div class="dialog-viewport" tabindex="0" aria-label="${esc(TEXT.viewport)}"><div class="drawing-canvas">${canvas.innerHTML}</div></div>` +
        controls +
        `<p class="drawing-note">${esc(TEXT.zoomNote)}</p>`;
      doc.body.append(dialog);
      resetIso(dialog);
      if (controls) {
        explode(dialog, 100);
        roofVisible(dialog, true);
      }
      dialog.showModal();
      doc.body.classList.add('drawing-modal-open');

      const viewport = dialog.querySelector('.dialog-viewport');
      const art = dialog.querySelector('.drawing-canvas');
      const fit = Math.min(viewport.clientWidth, (innerHeight * 0.68 * 420) / 297); // A3 proportions
      let zoom = 1;
      art.style.width = fit + 'px';

      dialog.addEventListener('close', () => {
        doc.body.classList.remove('drawing-modal-open');
        dialog.remove();
        sec.querySelector('[data-draw-open]')?.focus();
      });
      dialog.addEventListener('click', (event) => {
        if (event.target.closest('[data-draw-close]')) return dialog.close();
        const z = event.target.closest('[data-zoom]');
        if (!z) return;
        zoom = z.dataset.zoom === 'reset' ? 1 : Math.max(1, Math.min(4, zoom + (z.dataset.zoom === 'in' ? 0.5 : -0.5)));
        art.style.width = zoom * fit + 'px';
      });
      dialog.addEventListener('input', (event) => isoInput(dialog, event.target));
    }
  }

  /* exploded views: the roof layer lifts with the slider and can be hidden */
  function isoInput(root, input) {
    if (input.matches('.iso-controls input[type=range]')) explode(root, +input.value);
    if (input.matches('[data-roof-visible]')) roofVisible(root, input.checked);
  }
  function explode(root, value) {
    root.querySelectorAll('[data-lift]').forEach((g) => g.setAttribute('transform', `translate(0 ${+g.dataset.lift * (1 - value / 100)})`));
    root.querySelectorAll('[data-iso-guides],[data-iso-labels]').forEach((g) => (g.style.opacity = value / 100));
    const state = root.querySelector('[data-explode-state]');
    if (state) state.textContent = value === 0 ? TEXT.roofLowered : value === 100 ? TEXT.fullySeparated : TEXT.separated(value);
  }
  function roofVisible(root, visible) {
    root.querySelectorAll('[data-layer=roof],[data-iso-guides]').forEach((g) => (g.style.display = visible ? '' : 'none'));
  }
  function resetIso(root) {
    const range = root.querySelector('.iso-controls input[type=range]');
    const roof = root.querySelector('[data-roof-visible]');
    const state = root.querySelector('[data-explode-state]');
    if (range) range.value = 100;
    if (roof) roof.checked = true;
    if (state) state.textContent = TEXT.fullySeparated;
  }
})();
