import { setLang, initialLang } from './i18n.js?v=13';

const MODEL = 'assets/models/house.glb?v=3';   // exported from Container House.blend

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}
function showFallback(canvas) {
  document.documentElement.classList.add('no-3d');
  canvas.hidden = true;
  const img = canvas.parentElement.querySelector('.axo-fallback');
  if (img) img.hidden = false;
}

async function boot() {
  setLang(initialLang());
  const heroCanvas = document.getElementById('heroAxo'), storyCanvas = document.getElementById('storyAxo'), exploreCanvas = document.getElementById('exploreAxo');
  const axos = { hero: null, story: null, explore: null };
  let explore = null;
  if (webglOK()) {
    try {
      const { createAxo } = await import('./axo.js?v=21');
      axos.hero = createAxo(heroCanvas, { mode: 'hero', fit: 1.04, model: MODEL });
      axos.hero.setBuild(10); axos.hero.setView(1); axos.hero.setLabels(false);
      axos.story = createAxo(storyCanvas, { mode: 'story', model: MODEL });
      axos.story.setBuild(10); axos.story.setView(1);
      axos.explore = createAxo(exploreCanvas, { mode: 'story', fit: 1.2, model: MODEL });
      explore = (await import('./explore.js?v=4')).initExplore(axos.explore);
    } catch (e) {
      console.warn('3D view unavailable, showing static drawings.', e);
      axos.hero = axos.story = axos.explore = null;
      showFallback(heroCanvas); showFallback(storyCanvas); showFallback(exploreCanvas);
    }
  } else { showFallback(heroCanvas); showFallback(storyCanvas); showFallback(exploreCanvas); }

  addEventListener('resize', () => { axos.hero?.resize(); axos.story?.resize(); axos.explore?.resize(); });

  let refresh = () => {};
  if (window.gsap && window.ScrollTrigger) {
    try { refresh = (await import('./scroll.js?v=9')).initScroll({ story: axos.story }); }
    catch (e) { console.warn('Scroll animation unavailable.', e); }
  }
  document.fonts?.ready.then(() => refresh());

  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.lang); refresh(); explore?.refresh();
  }));
}

// Magnetic primary button: drifts a few px toward the pointer (fine pointers, motion allowed only).
function magnet() {
  if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  document.querySelectorAll('.magnet').forEach(el => {
    let raf = 0, tx = 0, ty = 0;
    const apply = () => { raf = 0; el.style.transform = `translate(${tx}px, ${ty}px)`; };
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * .18; ty = (e.clientY - (r.top + r.height / 2)) * .28;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('pointerleave', () => { tx = ty = 0; el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; apply();
      setTimeout(() => { el.style.transition = ''; }, 500); });
  });
}
magnet();

// Model-true split: drag, click or arrow keys move the divider between line drawing and render.
function split() {
  const fig = document.getElementById('mtSplit'); if (!fig) return;
  const handle = fig.querySelector('.mt-handle');
  const set = f => { f = Math.max(0, Math.min(1, f)); fig.style.setProperty('--s', (f * 100).toFixed(2) + '%'); handle.setAttribute('aria-valuenow', Math.round(f * 100)); };
  const at = e => { const r = fig.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; return document.documentElement.dir === 'rtl' ? 1 - f : f; };
  let down = false;
  fig.addEventListener('pointerdown', e => { down = true; fig.setPointerCapture(e.pointerId); set(at(e)); });
  fig.addEventListener('pointermove', e => { if (down) set(at(e)); });
  fig.addEventListener('pointerup', () => { down = false; });
  handle.addEventListener('keydown', e => {
    const cur = parseFloat(getComputedStyle(fig).getPropertyValue('--s')) / 100 || .5;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); set(cur + (e.key === 'ArrowRight' ? .05 : -.05) * (document.documentElement.dir === 'rtl' ? -1 : 1)); }
  });
}
split();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
