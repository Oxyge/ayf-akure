const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined';
if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   Full-screen overlay menu (top-right "Menu" button)
   ========================================================================== */
const menuToggle = document.getElementById('menuToggle');
const overlayNav = document.getElementById('overlayNav');
const overlayClose = document.getElementById('overlayClose');
function openOverlay() {
  overlayNav.classList.add('open');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeOverlay() {
  overlayNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
if (menuToggle) menuToggle.addEventListener('click', openOverlay);
if (overlayClose) overlayClose.addEventListener('click', closeOverlay);
if (overlayNav) overlayNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeOverlay));

/* ==========================================================================
   Header gains a hairline shadow once the page scrolls
   ========================================================================== */
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const onScroll = () => siteHeader.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ==========================================================================
   Dynamic footer year
   ========================================================================== */
const copyYear = document.getElementById('copyYear');
if (copyYear) copyYear.textContent = new Date().getFullYear();

/* ==========================================================================
   Custom cursor accent (fine-pointer desktops only)
   ========================================================================== */
(function () {
  if (reduceMotion || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);
  window.addEventListener('mousemove', (e) => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .tilt-el').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('hovering'));
    el.addEventListener('mouseleave', () => dot.classList.remove('hovering'));
  });
})();

/* ==========================================================================
   Magnetic buttons — a subtle pull toward the cursor
   ========================================================================== */
(function () {
  if (reduceMotion || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ==========================================================================
   3D tilt on photo elements
   ========================================================================== */
(function () {
  if (reduceMotion || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const selectors = '.lead-photo, .exec-photo, .arch-thumb, .g-item, .video-thumb, .history-image';
  document.querySelectorAll(selectors).forEach(el => {
    el.classList.add('tilt-el');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${py * -8}deg) rotateY(${px * 10}deg) scale(1.02)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

/* ==========================================================================
   Scroll reveal — GSAP ScrollTrigger where available, IO fallback otherwise
   ========================================================================== */
if (hasGsap && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
  document.querySelectorAll('.reveal').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 90, rotate: -2.5 }, {
      opacity: 1, y: 0, rotate: 0, duration: 1.1, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Grids fly in from alternating sides with rotation and a bouncy landing
  const flyDist = window.innerWidth < 700 ? 70 : 140;
  const gridSelectors = ['.prog-grid', '.lead-grid', '.arch-grid', '.video-grid', '.pub-grid', '.gallery-grid', '.news-card-grid'];
  gridSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(grid => {
      const items = Array.from(grid.children);
      if (!items.length) return;
      items.forEach((item, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(item, {
          opacity: 0, x: fromLeft ? -flyDist : flyDist, y: 50, rotate: fromLeft ? -7 : 7, scale: 0.88
        }, {
          opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, duration: 1, ease: 'back.out(1.6)',
          delay: i * 0.12,
          scrollTrigger: { trigger: grid, start: 'top 88%' }
        });
      });
    });
  });

  // Vision/mission columns pop up with a satisfying overshoot
  document.querySelectorAll('.vmp-grid').forEach(grid => {
    const items = Array.from(grid.children);
    gsap.fromTo(items, { opacity: 0, y: 70, scale: 0.8 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.7)', stagger: 0.15,
      scrollTrigger: { trigger: grid, start: 'top 88%' }
    });
  });

  // Timeline items swing in from the left
  document.querySelectorAll('.t-item').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, x: -80, rotate: -3 }, {
      opacity: 1, x: 0, rotate: 0, duration: 0.8, ease: 'back.out(1.6)', delay: i * 0.08,
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // Section headings fly up and settle with a bounce
  document.querySelectorAll('.section-head').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 60, scale: 0.94 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // Stat numbers punch in
  document.querySelectorAll('.stat').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 40, scale: 0.7 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(2)', delay: i * 0.1,
      scrollTrigger: { trigger: el, start: 'top 92%' }
    });
  });

  // Quote band: mark and text fly in from opposite directions
  document.querySelectorAll('.quote-slide').forEach(slide => {
    const qMark = slide.querySelector('.quote-mark');
    const qText = slide.querySelector('.quote-text');
    const qAttr = slide.querySelector('.quote-attr');
    if (!qText) return;
    const qtl = gsap.timeline({ scrollTrigger: { trigger: qText, start: 'top 80%' } });
    if (qMark) qtl.fromTo(qMark, { opacity: 0, y: -50, rotate: -15 }, { opacity: 1, y: 0, rotate: 0, duration: 0.7, ease: 'back.out(1.8)' }, 0);
    qtl.fromTo(qText, { opacity: 0, y: 60, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, 0.1);
    if (qAttr) qtl.fromTo(qAttr, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.4);
  });
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ==========================================================================
   Quote band — cycles through each leader's quote automatically, with
   dot navigation for anyone who wants to jump to one directly
   ========================================================================== */
(function () {
  const band = document.querySelector('.quote-band');
  if (!band) return;
  const slides = band.querySelectorAll('.quote-slide');
  const dotsWrap = document.getElementById('quoteDots');
  if (slides.length < 2 || !dotsWrap) return;

  const DURATION = 7000;
  let current = 0, timer;

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show quote ' + (i + 1));
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
  });
  const dots = dotsWrap.querySelectorAll('button');

  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => goTo(current + 1), DURATION);
  }

  resetTimer();
})();

/* ==========================================================================
   Hero — layered slider with Ken Burns background, staggered text entrance,
   drifting particles, and a filling progress tick per slide
   ========================================================================== */
(function () {
  const hero = document.querySelector('.hero');
  const slides = document.querySelectorAll('.hero-slide');
  const ticksWrap = document.getElementById('heroTicks');
  const particlesWrap = document.getElementById('heroParticles');
  if (!hero || !slides.length) return;

  const SLIDE_DURATION = 7000;

  // Build progress ticks
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    const fill = document.createElement('span');
    fill.className = 'tick-fill';
    b.appendChild(fill);
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => goTo(i));
    ticksWrap.appendChild(b);
  });
  const ticks = ticksWrap.querySelectorAll('button');
  const fills = ticksWrap.querySelectorAll('.tick-fill');

  // Drifting particles
  if (!reduceMotion && particlesWrap) {
    const count = window.innerWidth < 700 ? 10 : 22;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'hero-particle';
      const size = 2 + Math.random() * 3;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      const duration = 8 + Math.random() * 10;
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = (Math.random() * duration) + 's';
      particlesWrap.appendChild(p);
    }
  }

  let current = 0, timer, fillTween;

  function playTextIn(slide) {
    if (!hasGsap || reduceMotion) return;
    const eyebrow = slide.querySelector('[data-anim="eyebrow"]');
    const heading = slide.querySelector('[data-anim="heading"]');
    const lede = slide.querySelector('[data-anim="lede"]');
    const buttons = slide.querySelector('[data-anim="buttons"]');
    const ex = window.innerWidth < 700 ? 50 : 110;
    const tl = gsap.timeline();
    if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, x: -ex, rotate: -4 }, { opacity: 1, x: 0, rotate: 0, duration: 0.8, ease: 'back.out(1.8)' }, 0);
    if (heading) tl.fromTo(heading, { opacity: 0, y: 90, rotate: -2, scale: 0.94 }, { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 1, ease: 'back.out(1.4)' }, 0.14);
    if (lede) tl.fromTo(lede, { opacity: 0, y: 50, x: -ex * 0.3 }, { opacity: 1, y: 0, x: 0, duration: 0.7, ease: 'power3.out' }, 0.4);
    if (buttons) tl.fromTo(buttons, { opacity: 0, y: 30, scale: 0.6, rotate: 6 }, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.2)' }, 0.58);
  }

  function runFill(i) {
    if (fillTween && fillTween.kill) fillTween.kill();
    fills.forEach(f => { if (hasGsap) gsap.set(f, { width: '0%' }); else f.style.width = '0%'; });
    const target = fills[i];
    if (!target) return;
    if (hasGsap) {
      fillTween = gsap.to(target, { width: '100%', duration: SLIDE_DURATION / 1000, ease: 'none' });
    } else {
      target.style.transition = `width ${SLIDE_DURATION}ms linear`;
      requestAnimationFrame(() => { target.style.width = '100%'; });
    }
  }

  function goTo(i) {
    slides[current].classList.remove('active');
    ticks[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    ticks[current].classList.add('active');
    playTextIn(slides[current]);
    runFill(current);
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), SLIDE_DURATION);
  }

  playTextIn(slides[0]);
  runFill(0);
  resetTimer();
})();

/* ==========================================================================
   People cards (Executives, Patrons & Patroness, Past Presidents) — the
   name/title overlay shows on hover for mouse users; on touch devices
   (no hover) a tap toggles it instead, and it's keyboard-reachable too.
   ========================================================================== */
(function () {
  const cards = document.querySelectorAll('.exec-card, .lead-card, .pt-card');
  if (!cards.length) return;
  const isTouch = window.matchMedia('(hover: none)').matches;
  cards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (e) => {
      if (!isTouch || e.target.closest('a')) return;
      const wasActive = card.classList.contains('info-active');
      cards.forEach(c => c.classList.remove('info-active'));
      if (!wasActive) card.classList.add('info-active');
    });
  });
})();

/* ==========================================================================
   Lightbox for gallery images
   ========================================================================== */
(function () {
  const items = document.querySelectorAll('[data-lightbox]');
  if (!items.length) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(10,18,36,.94);z-index:999;align-items:center;justify-content:center;padding:30px;cursor:zoom-out;';
  const img = document.createElement('img');
  img.style.cssText = 'max-width:90vw;max-height:88vh;box-shadow:0 20px 60px rgba(0,0,0,.5);';
  overlay.appendChild(img);
  overlay.addEventListener('click', () => overlay.style.display = 'none');
  document.body.appendChild(overlay);
  items.forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      const url = el.getAttribute('data-lightbox');
      if (!url) return;
      img.src = url;
      overlay.style.display = 'flex';
    });
  });
})();

/* ==========================================================================
   Video lightbox — videos play right on the page instead of navigating away
   ========================================================================== */
(function () {
  const items = document.querySelectorAll('[data-video]');
  if (!items.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'video-lightbox';
  overlay.innerHTML = '<div class="video-lightbox-inner"><button type="button" class="video-lightbox-close" aria-label="Close video">&times;</button><div class="video-lightbox-frame"></div></div>';
  document.body.appendChild(overlay);
  const frame = overlay.querySelector('.video-lightbox-frame');
  const closeBtn = overlay.querySelector('.video-lightbox-close');

  function getYouTubeId(url) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  function openLightbox(url) {
    frame.innerHTML = '';
    const ytId = getYouTubeId(url);
    if (ytId) {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0';
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('frameborder', '0');
      frame.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      frame.appendChild(video);
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    frame.innerHTML = '';
  }

  items.forEach(el => {
    el.addEventListener('click', (e) => {
      const url = el.getAttribute('data-video');
      if (!url) return;
      e.preventDefault();
      openLightbox(url);
    });
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
  closeBtn.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox(); });
})();
