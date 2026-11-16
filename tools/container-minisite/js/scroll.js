// Every scroll-driven animation lives here; axo.js only receives state.
export function initScroll({ story }) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const root = document.documentElement;
  const S = { extrude: 1, view: 1, build: 10, explode: 0, section: 0 };

  const steps = [...document.querySelectorAll('#steps li')];
  function markStep(t) {
    const f = Math.max(0, Math.min(9, Math.ceil(t - 1e-3) - 1)), live = t > 4 && t < 9.99;
    steps.forEach((li, i) => { li.classList.toggle('on', live && i === f); li.classList.toggle('done', i < f || t >= 9.99); });
  }
  function push() {
    if (story) { story.setExtrude(S.extrude); story.setView(S.view); story.setBuild(S.build); story.setExplode(S.explode); story.setSection(S.section); }
    markStep(S.build);
  }

  const caps = gsap.utils.toArray('.story-cap');
  let capNow = '';
  function capTo(name) {
    if (name === capNow) return; capNow = name;
    caps.forEach(c => gsap.to(c, { autoAlpha: c.dataset.at === name ? 1 : 0, y: c.dataset.at === name ? 0 : 12, duration: .35, ease: 'power2.out', overwrite: true }));
  }

  const rooms = gsap.utils.toArray('#rooms .room');
  const count = document.querySelector('#rooms .room-count'), rname = document.querySelector('#rooms .room-name');
  let roomNow = 0;
  const prog = document.querySelector('#rooms .rooms-progress');
  if (prog && !prog.children.length) rooms.forEach(() => prog.appendChild(document.createElement('span')));
  function setRoom(i) {
    roomNow = i;
    [...(prog?.children || [])].forEach((sp, k) => { sp.classList.toggle('on', k < i); sp.classList.toggle('cur', k === i); });
    count.textContent = String(i + 1).padStart(2, '0') + ' / ' + rooms.length;
    rname.textContent = rooms[i].querySelector('figcaption').textContent;
  }
  setRoom(0);

  const mm = gsap.matchMedia();
  mm.add({
    full: '(prefers-reduced-motion: no-preference) and (min-width: 1025px)',
    compact: '(prefers-reduced-motion: no-preference) and (max-width: 1024px)',
    reduce: '(prefers-reduced-motion: reduce)',
  }, ctx => {
    const { reduce, compact } = ctx.conditions;
    if (reduce) { Object.assign(S, { extrude: 1, view: 1, build: 10, explode: 0, section: 0 }); push(); return; }
    root.classList.add('motion');
    const k = compact ? .6 : 1;

    // 1 · the client's PDF → walls traced and raised → iso → assembly → explode → section
    gsap.set(caps, { autoAlpha: 0 }); capNow = ''; capTo('plan');
    gsap.timeline({
      defaults: { ease: 'none' }, onUpdate: push,
      scrollTrigger: {
        trigger: '#process', start: 'top top', end: `+=${Math.round(800 * k)}%`, pin: '.story-pin', scrub: true, anticipatePin: 1,
        onUpdate: s => { const p = s.progress; capTo(p < .1 ? 'plan' : p < .28 ? 'extrude' : p < .74 ? 'assembly' : p < .85 ? 'explode' : 'section'); },
      },
    })
      .fromTo(S, { extrude: 0, view: 0, build: 4, explode: 0, section: 0 }, { duration: 1, extrude: 0 })
      .to(S, { duration: 1.2, extrude: 1 })
      .to(S, { duration: 1.4, view: 1 }, '<.3')
      .to(S, { duration: 4.5, build: 10 })
      .to(S, { duration: 1, explode: 1 })
      .to(S, { duration: 1.2, section: 1 })
      .to(S, { duration: .3 });

    // keep the model centred in the space the caption panel leaves free
    const side = document.querySelector('.story-side'), stage = document.getElementById('storyAxo');
    const fitInset = () => { if (!story) return;
      const f = compact ? 0 : (side.offsetWidth + 20) / Math.max(1, stage.clientWidth);
      story.setInset(root.dir === 'rtl' ? -f : f); };
    fitInset(); ScrollTrigger.addEventListener('refresh', fitInset);
    push(); story?.snap();

    // full-screen renders: inset frame opens to full bleed, slow zoom out
    const makeFull = sec => {
      const frame = sec.querySelector('.full-frame'), img = frame.querySelector('img'), cap = sec.querySelector('.full-cap');
      gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } })
        .fromTo(frame, { clipPath: 'inset(10% 12% round 12px)' }, { clipPath: 'inset(0% 0% round 0px)', ease: 'none' }, 0)
        .fromTo(img, { scale: 1.18 }, { scale: 1.04, ease: 'none' }, 0);
      gsap.to(img, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.from(cap, { y: 40, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 30%', toggleActions: 'play none none reverse' } });
    };
    makeFull(document.getElementById('full1'));

    // 2 · clay → finished wipe (logical start edge follows text direction)
    gsap.fromTo('#wipe', { '--w': '100%' }, {
      '--w': '0%', ease: 'none',
      scrollTrigger: { trigger: '#work', start: 'top top', end: `+=${Math.round(120 * k)}%`, pin: true, scrub: true },
    });

    // 3 · horizontal exterior gallery
    const track = document.querySelector('#hgal .hgal-track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => (root.dir === 'rtl' ? 1 : -1) * dist(), ease: 'none',
      scrollTrigger: { trigger: '#hgal', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true, invalidateOnRefresh: true },
    });

    // 4 · room by room
    gsap.set(rooms.slice(1), { autoAlpha: 0 });
    const rt = gsap.timeline({
      scrollTrigger: {
        trigger: '#rooms', start: 'top top', end: `+=${Math.round(rooms.length * 55 * k)}%`, pin: true, scrub: true,
        onUpdate: s => { const i = Math.min(rooms.length - 1, Math.floor(s.progress * rooms.length + .15)); if (i !== roomNow) setRoom(i); },
      },
    });
    // each room holds still for most of its scroll distance, then a short crossfade with a gentle push-in
    rooms.forEach((r, i) => {
      if (i) rt.fromTo(r, { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1.02, duration: .3, ease: 'none' });
      rt.to(r, { scale: 1, duration: .7, ease: 'none' });
    });

    makeFull(document.getElementById('full2'));

    // closer: slow push-out on the full-screen image (or film)
    gsap.fromTo('.closer-media > *', { scale: 1.12 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.closer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // 5 · reveals
    gsap.utils.toArray('[data-reveal]').forEach(el => gsap.from(el, {
      y: 36, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    }));

    return () => { root.classList.remove('motion'); ScrollTrigger.removeEventListener('refresh', fitInset); story?.setInset(0); };
  });

  push();
  return () => { setRoom(roomNow); ScrollTrigger.refresh(); };
}
