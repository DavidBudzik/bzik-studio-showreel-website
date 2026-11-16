// Free-orbit viewer: pointer, pinch, wheel and keyboard input plus the build/explode/section controls.
// Page scrolling is never captured: the wheel only zooms with Ctrl/⌘ (which is also how trackpad pinch arrives).
export function initExplore(axo) {
  const canvas = document.getElementById('exploreAxo'), box = document.getElementById('exploreBox');
  const hint = document.getElementById('exHint');
  const slider = document.getElementById('exBuild'), stepOut = document.getElementById('exStep'), nameOut = document.getElementById('exName');
  const playBtn = document.getElementById('exPlay'), explodeBtn = document.getElementById('exExplode'), sectionBtn = document.getElementById('exSection');
  const viewBtns = [...document.querySelectorAll('.explore [data-view]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let view = 1, build = 10;
  axo.setBuild(build); axo.setView(view); axo.setExtrude(1); axo.setSheet(0); axo.snap();   // the 2D sheet only shows in Plan

  /* ---------- orbit / zoom ---------- */
  const pts = new Map();
  let pinch0 = 0, zoom0 = 1;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  function toIso() { if (view !== 1) setView(1); }
  function dismissHint() { hint.classList.add('gone'); }

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { pinch0 = dist(); zoom0 = axo.getOrbit().zoom; }
    box.classList.add('dragging'); toIso(); dismissHint();
  });
  canvas.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) { const o = axo.getOrbit(); axo.setOrbit(o.az - dx * .008, o.el + dy * .006); }
    else if (pts.size === 2 && pinch0) axo.setZoom(zoom0 * dist() / pinch0);
  });
  const end = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) box.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('dblclick', () => axo.resetOrbit());

  let flashT = 0;
  canvas.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); toIso(); axo.setZoom(axo.getOrbit().zoom * Math.exp(-e.deltaY * .004)); dismissHint(); return; }
    hint.classList.remove('gone'); hint.classList.add('flash'); clearTimeout(flashT);
    flashT = setTimeout(() => hint.classList.remove('flash'), 900);
  }, { passive: false });

  canvas.addEventListener('keydown', e => {
    const o = axo.getOrbit(), step = .12;
    const keys = {
      ArrowLeft: () => axo.setOrbit(o.az + step, o.el), ArrowRight: () => axo.setOrbit(o.az - step, o.el),
      ArrowUp: () => axo.setOrbit(o.az, o.el + step), ArrowDown: () => axo.setOrbit(o.az, o.el - step),
      '+': () => axo.setZoom(o.zoom * 1.2), '=': () => axo.setZoom(o.zoom * 1.2), '-': () => axo.setZoom(o.zoom / 1.2),
      '0': () => axo.resetOrbit(),
    };
    if (keys[e.key]) { e.preventDefault(); toIso(); keys[e.key](); dismissHint(); }
  });
  box.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
    toIso(); axo.setZoom(axo.getOrbit().zoom * (b.dataset.zoom > 0 ? 1.25 : 1 / 1.25)); }));
  box.querySelector('[data-reset]').addEventListener('click', () => axo.resetOrbit());

  /* ---------- full-bleed stage: centre the model beside the floating panel; full-screen toggle ---------- */
  const stage = document.getElementById('exploreStage'), ctrl = stage.querySelector('.explore-ctrl'), fsBtn = box.querySelector('[data-fs]');
  function fitInset() {
    const floating = getComputedStyle(ctrl).position === 'absolute';
    const f = floating ? (ctrl.offsetWidth + 40) / Math.max(1, stage.clientWidth) : 0;
    axo.setInset(document.documentElement.dir === 'rtl' ? -f : f);
  }
  new ResizeObserver(fitInset).observe(stage);
  if (!stage.requestFullscreen && !stage.webkitRequestFullscreen) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
  });
  const onFs = () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); fsBtn.setAttribute('aria-pressed', String(on)); fitInset(); };
  document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);

  /* ---------- build sequence ---------- */
  let raf = 0;
  const stepName = t => {
    const i = Math.max(0, Math.min(9, Math.ceil(t - 1e-3) - 1));
    return t < .05 ? '' : document.querySelector(`[data-i18n="step.${i}"]`)?.textContent || '';
  };
  function setBuild(t, fromSlider) {
    build = t; axo.setBuild(t);
    if (!fromSlider) slider.value = t;
    stepOut.textContent = String(Math.ceil(t - 1e-3)).padStart(2, '0') + ' / 10';
    nameOut.textContent = stepName(t);
  }
  slider.addEventListener('input', () => { cancelAnimationFrame(raf); setBuild(+slider.value, true); });

  playBtn.addEventListener('click', () => {
    cancelAnimationFrame(raf);
    if (reduce) { setBuild(10); return; }
    const t0 = performance.now(), dur = 7000;
    const tick = now => { const f = Math.min(1, (now - t0) / dur); setBuild(f * 10); if (f < 1) raf = requestAnimationFrame(tick); };
    setBuild(0); axo.snap(); raf = requestAnimationFrame(tick);
  });

  /* ---------- view, explode, section ---------- */
  function setView(v) {
    view = v; axo.setView(v); axo.setSheet(v ? 0 : 1);
    viewBtns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.view === v)));
  }
  viewBtns.forEach(b => b.addEventListener('click', () => setView(+b.dataset.view)));
  const toggle = (btn, fn) => btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on)); toIso(); fn(on ? 1 : 0); });
  toggle(explodeBtn, v => axo.setExplode(v));
  toggle(sectionBtn, v => axo.setSection(v));

  /* ---------- focus areas and layers ---------- */
  // at = camera target (m, drawing origin = NW container corner), levels shown, cut = plan-cut height (m)
  const FOCUS = {
    all: {},
    ground:  { at: [6.1, 1.0, 3.7],  zoom: 1.3,  levels: [1, 0, 0], cut: 2.5 },
    upper:   { at: [6.1, 3.9, 2.5],  zoom: 1.45, levels: [1, 1, 0], cut: 5.5 },
    stair:   { at: [10.2, 2.0, 1.4], zoom: 2.1,  levels: [1, 1, 0], cut: 4.8 },
    deck:    { at: [7.2, 1.2, 8.4],  zoom: 1.6 },
    terrace: { at: [6.2, 4.4, 6.0],  zoom: 1.8 },
  };
  const focusBtns = [...document.querySelectorAll('.explore [data-focus]')];
  focusBtns.forEach(b => b.addEventListener('click', () => {
    const f = FOCUS[b.dataset.focus];
    focusBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    toIso();
    if (f.cut && explodeBtn.getAttribute('aria-pressed') === 'true') explodeBtn.click();   // a plan cut reads best un-exploded
    if (f.cut) setDisplay('walls');                                 // floor plans read best as walls + furniture
    axo.setFocus(f); dismissHint();
  }));
  // Display presets switch whole layer sets; the layer toggles below stay in sync and can fine-tune.
  const ALL = ['shell', 'steel', 'frame', 'glass', 'timber', 'interior', 'accent', 'floor', 'furniture', 'roof', 'pv', 'pier'];
  const DISPLAY = {
    full: ALL,
    walls: ['shell', 'interior', 'accent', 'floor', 'furniture', 'glass'],
    structure: ['shell', 'steel', 'timber', 'pier'],
  };
  const layerBtns = [...document.querySelectorAll('.explore [data-layer]')], displayBtns = [...document.querySelectorAll('.explore [data-display]')];
  function setDisplay(name) {
    const on = new Set(DISPLAY[name]);
    ALL.forEach(k => axo.setLayer(k, on.has(k)));
    layerBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layer.split(' ').some(k => on.has(k)))));
    displayBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.display === name)));
  }
  displayBtns.forEach(b => b.addEventListener('click', () => setDisplay(b.dataset.display)));
  document.querySelectorAll('.explore [data-layer]').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on)); axo.setLayer(b.dataset.layer.split(' '), on);
    displayBtns.forEach(x => x.setAttribute('aria-pressed', 'false'));      // a manual mix is no longer a preset
  }));
  box.querySelector('[data-reset]').addEventListener('click', () => focusBtns[0].click());

  setBuild(10);
  return { refresh: () => { nameOut.textContent = stepName(build); fitInset(); } };    // re-read step names after a language switch
}
