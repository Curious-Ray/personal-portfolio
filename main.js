/* ======================================
   MAIN.JS — Animations & Interactions
   Stack: Lenis (smooth scroll) + GSAP + ScrollTrigger
   ====================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const hasLenis = typeof window.Lenis !== 'undefined';

if (!hasGsap || !hasLenis) {
  document.documentElement.classList.add('no-gsap');
}

// ── 1. LENIS SMOOTH SCROLL ─────────────────────────────────────────────────
const lenis = hasLenis && !prefersReducedMotion
  ? new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    })
  : null;

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
}

if (lenis && hasGsap) {
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
}

if (hasGsap && window.matchMedia('(hover: hover)').matches) {
  gsap.ticker.lagSmoothing(0);
}


// ── 2. SCROLL PROGRESS BAR ────────────────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
function updateProgressBar(scroll) {
  if (!progressBar) return;
  const total = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  progressBar.style.width = `${Math.max(0, Math.min(scroll / total, 1)) * 100}%`;
}

if (lenis) {
  lenis.on('scroll', ({ scroll }) => {
    updateProgressBar(scroll);
  });
} else {
  updateProgressBar(window.scrollY);
  window.addEventListener('scroll', () => updateProgressBar(window.scrollY), { passive: true });
}


// ── 3. NAV SCROLL STATE ────────────────────────────────────────────────────
const nav = document.getElementById('nav');

if (hasGsap) {
  ScrollTrigger.create({
    start: 80,
    onEnter: () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  });
} else {
  const syncNavScrolled = () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  };
  syncNavScrolled();
  window.addEventListener('scroll', syncNavScrolled, { passive: true });
}


// ── 3. MOBILE NAV TOGGLE ───────────────────────────────────────────────────
const toggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');

if (toggle) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}


// ── 4. HERO ANIMATION ─────────────────────────────────────────────────────

function scrambleText(el, finalText, delay = 0) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·×';
  const totalFrames = 38;
  let frame = 0;

  setTimeout(() => {
    el.style.opacity = '1';
    const id = setInterval(() => {
      const progress = frame / totalFrames;
      el.textContent = finalText
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < Math.floor(progress * finalText.length)) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      frame++;
      if (frame > totalFrames) { el.textContent = finalText; clearInterval(id); }
    }, 16);
  }, delay);
}

function animateHero() {
  if (!hasGsap) {
    document.querySelector('.hero__subtitle')?.style.setProperty('opacity', '1');
    return;
  }

  const heroSubtitle = document.querySelector('.hero__subtitle');
  const heroImage   = document.querySelector('.hero__image-wrap');
  const btns        = document.querySelectorAll('.hero__buttons .btn');

  const isMobile = window.innerWidth <= 768;
  document.querySelectorAll('.hero__line').forEach((line) => {
    if (line.classList.contains('hero__d') && isMobile) return;
    if (line.classList.contains('hero__m') && !isMobile) return;
    const nodes = [...line.childNodes];
    line.innerHTML = '';
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { line.appendChild(document.createTextNode(part)); return; }
          const wrap  = document.createElement('span');
          wrap.className = 'hw';
          wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
          const inner = document.createElement('span');
          inner.className = 'hwi';
          inner.style.cssText = 'display:inline-block;';
          inner.textContent = part;
          wrap.appendChild(inner);
          line.appendChild(wrap);
        });
      } else {
        const wrap  = document.createElement('span');
        wrap.className = 'hw';
        wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
        const inner = document.createElement('span');
        inner.className = 'hwi';
        inner.style.cssText = 'display:inline-block;';
        inner.appendChild(node.cloneNode(true));
        wrap.appendChild(inner);
        line.appendChild(wrap);
      }
    });
  });

  gsap.set('.hwi',  { y: '105%', rotation: 3, opacity: 0 });
  gsap.set(btns,    { opacity: 0, y: 18, scale: 0.94 });
  gsap.set(heroImage, { opacity: 0, y: 50 });

  const tl = gsap.timeline();

  scrambleText(heroSubtitle, heroSubtitle.textContent.trim(), 0);

  tl.to('.hwi', {
    y: '0%', rotation: 0, opacity: 1,
    duration: 0.75, stagger: 0.055, ease: 'power4.out',
  }, 0.15);

  tl.to(btns, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.55, stagger: 0.13, ease: 'back.out(1.6)',
  }, '-=0.25');

  tl.to(heroImage, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5');
}

if (hasGsap) {
  gsap.set('.hero__subtitle', { opacity: 0 });
}

if (hasGsap && document.fonts) {
  document.fonts.ready.then(animateHero);
} else {
  window.addEventListener('load', animateHero);
}


// ── 5. SCROLL-TRIGGERED ANIMATIONS ────────────────────────────────────────
function initScrollAnimations() {
  gsap.utils.toArray('.section__label').forEach((el) => {
    const original = el.textContent.trim();
    el.style.opacity = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => scrambleText(el, original),
    });
  });

  gsap.utils.toArray('.section__title').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
    });
  });

  const animGroups = new Map();

  document.querySelectorAll('[data-animate]').forEach((el) => {
    const parent = el.parentElement;
    if (!animGroups.has(parent)) animGroups.set(parent, []);
    animGroups.get(parent).push(el);
  });

  animGroups.forEach((els, parent) => {
    if (els.length === 1) {
      gsap.to(els[0], {
        scrollTrigger: {
          trigger: els[0],
          start: 'top 88%',
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      });
    } else {
      gsap.to(els, {
        scrollTrigger: {
          trigger: parent,
          start: 'top 85%',
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }
  });

  gsap.utils.toArray('.exp-row').forEach((row, i) => {
    gsap.fromTo(row,
      { opacity: 0, y: 16 },
      {
        scrollTrigger: {
          trigger: row,
          start: 'top 92%',
        },
        opacity: 1,
        y: 0,
        duration: 0.45,
        delay: i * 0.04,
        ease: 'power2.out',
      }
    );
  });
}

if (hasGsap) {
  initScrollAnimations();
}


// ── 6. EXPERIENCE ACCORDION ────────────────────────────────────────────────
const accordionRows = [...document.querySelectorAll('.exp-row[data-accordion]')];
accordionRows.forEach((row) => {
  row.querySelector('.exp-row__header').addEventListener('click', () => {
    const willOpen = !row.classList.contains('is-open');

    accordionRows.forEach((item) => {
      item.classList.remove('is-open');
    });

    if (willOpen) {
      row.classList.add('is-open');
    }
  });
});

// ── 7. SMOOTH ANCHOR SCROLL ────────────────────────────────────────────────
document.querySelector('.nav__logo').addEventListener('click', (e) => {
  e.preventDefault();
  if (lenis) {
    lenis.scrollTo(0, { duration: 0.8 });
  } else {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
});

document.querySelectorAll('a[href^="#"]:not(.nav__logo)').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -80, duration: 1.2 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  });
});


// ── 7. CAT EMOJI SWAP on hover + secret 404 Easter egg ───────────────────
const catEmoji = document.querySelector('.trait-card__emoji--cat');
if (catEmoji) {
  const card = catEmoji.closest('.trait-card');
  card.addEventListener('mouseenter', () => { catEmoji.textContent = '😻'; });
  card.addEventListener('mouseleave', () => { catEmoji.textContent = '🐱'; });

  let catClicks = 0;
  let catTimer = null;
  catEmoji.addEventListener('click', () => {
    catClicks++;
    clearTimeout(catTimer);
    if (catClicks >= 5) {
      catClicks = 0;
      window.location.href = '/404';
    } else {
      catTimer = setTimeout(() => { catClicks = 0; }, 800);
    }
  });
}


// ── 8. MARQUEE — sync speed + smooth hover slow-down ──────────────────────
const BASE_SPEED = 80;
const HOVER_RATE = 0.15;
const LERP_MS    = 400;

function lerpRate(anim, target) {
  const startRate = anim.playbackRate;
  const t0 = performance.now();
  (function step(now) {
    const p = Math.min((now - t0) / LERP_MS, 1);
    anim.playbackRate = startRate + (target - startRate) * p;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

function scrubMarqueeAnimation(track, deltaX) {
  const anim = track.getAnimations()[0];
  if (!anim) return;

  const duration = anim.effect?.getComputedTiming().duration;
  if (!Number.isFinite(duration) || duration <= 0) return;

  const deltaTime = (deltaX / BASE_SPEED) * 1000;
  const currentTime = typeof anim.currentTime === 'number' ? anim.currentTime : 0;
  let nextTime = currentTime - deltaTime;

  while (nextTime < 0) nextTime += duration;
  while (nextTime >= duration) nextTime -= duration;

  anim.currentTime = nextTime;
}

function attachWheelMarquee(container, track) {
  if (!container || !track) return;

  const getResumeRate = () => (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches && container.matches(':hover')
      ? HOVER_RATE
      : 1
  );

  let wheelReleaseTimer = null;

  container.addEventListener('wheel', (e) => {
    const anim = track.getAnimations()[0];
    if (!anim) return;

    anim.playbackRate = 0;
    const horizontalDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;

    if (!horizontalDelta) return;

    e.preventDefault();
    scrubMarqueeAnimation(track, -horizontalDelta);

    if (wheelReleaseTimer) {
      window.clearTimeout(wheelReleaseTimer);
    }

    wheelReleaseTimer = window.setTimeout(() => {
      lerpRate(anim, getResumeRate());
    }, 120);
  }, { passive: false });
}

function attachTouchMarquee(container, track) {
  if (!container || !track) return;

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let isHorizontalSwipe = false;
  let justSwiped = false;
  let resumeTimer = null;

  const resumeAnimation = () => {
    const anim = track.getAnimations()[0];
    if (!anim) return;

    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
    }

    resumeTimer = window.setTimeout(() => {
      lerpRate(anim, 1);
    }, 120);
  };

  container.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    isHorizontalSwipe = false;
    justSwiped = false;
  });

  container.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return;

    const totalDeltaX = e.clientX - startX;
    const totalDeltaY = e.clientY - startY;
    const stepDeltaX = e.clientX - lastX;
    lastX = e.clientX;

    if (!isHorizontalSwipe) {
      if (Math.abs(totalDeltaY) > 8 && Math.abs(totalDeltaY) > Math.abs(totalDeltaX)) {
        pointerId = null;
        return;
      }

      if (Math.abs(totalDeltaX) > 8 && Math.abs(totalDeltaX) > Math.abs(totalDeltaY)) {
        isHorizontalSwipe = true;
      }
    }

    if (!isHorizontalSwipe) return;

    const anim = track.getAnimations()[0];
    if (!anim) return;

    anim.playbackRate = 0;
    justSwiped = true;
    e.preventDefault();
    scrubMarqueeAnimation(track, stepDeltaX);
    resumeAnimation();
  }, { passive: false });

  const stopTouchSwipe = (e) => {
    if (pointerId !== null && e.pointerId !== undefined && pointerId !== e.pointerId) return;
    pointerId = null;
    isHorizontalSwipe = false;
  };

  container.addEventListener('pointerup', stopTouchSwipe);
  container.addEventListener('pointercancel', stopTouchSwipe);
  container.addEventListener('lostpointercapture', stopTouchSwipe);

  container.addEventListener('click', (e) => {
    if (!justSwiped) return;
    e.preventDefault();
    e.stopPropagation();
    justSwiped = false;
  }, true);
}

document.querySelectorAll('.project-card__marquee').forEach((marquee) => {
  const track = marquee.querySelector('.project-card__marquee-track');
  const imgs = [...marquee.querySelectorAll('img:not([aria-hidden="true"])')];
  if (!imgs.length) { marquee.classList.add('is-ready'); return; }

  let loaded = 0;
  const onLoad = () => {
    if (++loaded < imgs.length) return;
    marquee.classList.add('is-ready');

    const duration = (track.scrollWidth / 2) / BASE_SPEED;
    track.style.animationDuration = duration + 's';

    marquee.addEventListener('mouseenter', () => {
      const anim = track.getAnimations()[0];
      if (anim) lerpRate(anim, HOVER_RATE);
    });
    marquee.addEventListener('mouseleave', () => {
      const anim = track.getAnimations()[0];
      if (anim) lerpRate(anim, 1);
    });

    attachWheelMarquee(marquee, track);
    attachTouchMarquee(marquee, track);
  };

  imgs.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) { onLoad(); }
    else {
      img.addEventListener('load',  onLoad, { once: true });
      img.addEventListener('error', onLoad, { once: true });
    }
  });
});


// ── 9. COVERS MARQUEE — same lerp slow-down as project marquees ───────────
const coversMarquee = document.querySelector('.ai-card__covers-marquee');
if (coversMarquee) {
  const coversTrack = coversMarquee.querySelector('.ai-card__covers-track');
  const duration = (coversTrack.scrollWidth / 2) / BASE_SPEED;
  coversTrack.style.animationDuration = duration + 's';
  attachWheelMarquee(coversMarquee, coversTrack);
  attachTouchMarquee(coversMarquee, coversTrack);

  coversMarquee.addEventListener('mouseenter', () => {
    const anim = coversTrack.getAnimations()[0];
    if (anim) lerpRate(anim, HOVER_RATE);
  });
  coversMarquee.addEventListener('mouseleave', () => {
    const anim = coversTrack.getAnimations()[0];
    if (anim) lerpRate(anim, 1);
  });
}

// ── 10. 3D TILT — cover cards + project marquee images (Apple TV style) ─────
if (
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !prefersReducedMotion
) {
  const MAX_TILT = 7;
  const SCALE    = 1.03;

  function applyTilt(el) {
    let rafId = null;
    let targetRX = 0, targetRY = 0;

    el.addEventListener('mouseenter', () => {
      el.style.willChange = 'transform';
    });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x  = e.clientX - rect.left;
      const y  = e.clientY - rect.top;
      const cx = rect.width  / 2;
      const cy = rect.height / 2;

      targetRX = ((y - cy) / cy) * -MAX_TILT;
      targetRY = ((x - cx) / cx) *  MAX_TILT;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          el.style.transition = 'transform 0.08s linear';
          el.style.transform  = `perspective(700px) rotateX(${targetRX}deg) rotateY(${targetRY}deg) scale3d(${SCALE},${SCALE},${SCALE})`;
          rafId = null;
        });
      }
    });

    el.addEventListener('mouseleave', () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      el.style.transition = 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)';
      el.style.transform  = '';
      el.addEventListener('transitionend', () => {
        el.style.willChange = 'auto';
      }, { once: true });
    });
  }

  document.querySelectorAll('.cover-card').forEach(applyTilt);
  document.querySelectorAll('.project-card__marquee-track img').forEach(applyTilt);
}


// ── 11. CURSOR GLOW (subtle, desktop only) ─────────────────────────────────
if (
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !prefersReducedMotion
) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(70,255,122,0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.3s ease;
    top: 0;
    left: 0;
    will-change: transform;
  `;
  document.body.appendChild(glow);

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    glow.style.transform = `translate(${glowX - 150}px, ${glowY - 150}px)`;
    requestAnimationFrame(updateGlow);
  }

  updateGlow();
}


// ── 8. NAV ACTIVE SECTION INDICATOR ───────────────────────────────────────
const navLinksList = document.querySelectorAll('.nav__link[href^="#"]');

function setActiveNav(hash) {
  navLinksList.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === hash);
  });
}

if (hasGsap) {
  document.querySelectorAll('section[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveNav(`#${section.id}`),
      onEnterBack: () => setActiveNav(`#${section.id}`),
    });
  });
} else if ('IntersectionObserver' in window) {
  const activeSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveNav(`#${entry.target.id}`);
    });
  }, {
    threshold: 0.45,
  });

  document.querySelectorAll('section[id]').forEach((section) => {
    activeSectionObserver.observe(section);
  });
}


// ── 9. HERO VIDEO SOURCE SYNC ─────────────────────────────────────────────
function syncHeroVideoSource() {
  const desktopVideo = document.querySelector('.hero__img--desktop');
  const mobileVideo = document.querySelector('.hero__img--mobile');
  if (!desktopVideo || !mobileVideo) return;

  const shouldUseMobile = window.matchMedia('(max-width: 480px)').matches;
  const activeVideo = shouldUseMobile ? mobileVideo : desktopVideo;
  const inactiveVideo = shouldUseMobile ? desktopVideo : mobileVideo;

  if (activeVideo.dataset.src && activeVideo.src !== activeVideo.dataset.src && !activeVideo.currentSrc) {
    activeVideo.src = activeVideo.dataset.src;
    activeVideo.load();
  }

  inactiveVideo.pause();
  tryPlay(activeVideo);
}


// ── 10. AUTOPLAY ALL VIDEOS (Safari-compatible) ───────────────────────────
const protectedMedia = document.querySelectorAll([
  '.hero__image img',
  '.hero__image video',
  '.project-card__marquee-track img',
  '.ai-card__images-static img',
  '.ai-card__covers-track img',
  '.cover-card__img',
  '.contact__image img',
  '.contact__image video'
].join(', '));

protectedMedia.forEach((media) => {
  media.addEventListener('contextmenu', (e) => e.preventDefault());
  media.addEventListener('dragstart', (e) => e.preventDefault());
});

function tryPlay(v) {
  v.muted = true;
  v.defaultMuted = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  if (v.dataset.src && !v.currentSrc) {
    v.src = v.dataset.src;
  }
  if (v.readyState < HTMLMediaElement.HAVE_CURRENT_DATA && (v.currentSrc || v.src)) {
    v.load();
  }
  v.play().catch(() => {});
}

const videos = document.querySelectorAll('video');

videos.forEach(tryPlay);
syncHeroVideoSource();

videos.forEach((video) => {
  video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
  video.addEventListener('canplay', () => tryPlay(video), { once: true });
});

window.addEventListener('pageshow', () => {
  videos.forEach(tryPlay);
  syncHeroVideoSource();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    videos.forEach(tryPlay);
    syncHeroVideoSource();
  }
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) tryPlay(entry.target);
    });
  }, { threshold: 0.1 });
  videos.forEach((v) => observer.observe(v));
}

document.addEventListener('pointerdown', () => {
  videos.forEach((v) => { if (v.paused && v.src) tryPlay(v); });
}, { once: true });

window.addEventListener('resize', syncHeroVideoSource);
window.addEventListener('orientationchange', syncHeroVideoSource);

// ── 11. RECALCULATE LENIS SCROLL LIMIT AFTER ALL MEDIA LOADS ──────────────
window.addEventListener('load', () => {
  if (lenis) lenis.resize();
  if (hasGsap) ScrollTrigger.refresh();
});


// ── 12. LAWN CHAT ──────────────────────────────────────────────────────────
(function initLawnChat() {
  const chatRoot = document.querySelector('[data-chat-root]');
  if (!chatRoot) return;

  const launcher = chatRoot.querySelector('[data-chat-launcher]');
  const panel = chatRoot.querySelector('[data-chat-panel]');
  const closeButton = chatRoot.querySelector('[data-chat-close]');
  const messagesEl = chatRoot.querySelector('[data-chat-messages]');
  const promptsEl = chatRoot.querySelector('[data-chat-prompts]');
  const form = chatRoot.querySelector('[data-chat-form]');
  const input = chatRoot.querySelector('[data-chat-input]');
  const sendButton = chatRoot.querySelector('[data-chat-send]');

  const STORAGE_KEY = 'deepak-chat-state-v1';
  const MAX_TURNS = 10;
  const MAX_HISTORY = 8;
  const MAX_INPUT_CHARS = 500;
  const locale = 'en';
  const labels = {
    en: {
      title: 'Ask about Deepak.',
      subtitle: "His work, his projects, what he's into.",
      note: "Anything about Deepak. For specifics like rates or scoping, the bot will point you to email.",
      launcher: '23 Hotline',
      placeholder: 'Ask about Deepak...',
      send: 'Send',
      prompts: [
        { label: 'What he builds', value: 'What does Deepak build?' },
        { label: 'Tech stack', value: 'What is his tech stack?' },
        { label: 'Available to hire?', value: 'Is Deepak available for freelance or full-time work?' },
        { label: 'Where based', value: 'Where is Deepak based?' },
        { label: 'His story', value: "What's Deepak's background and how did he get into building?" },
        { label: 'Why AI-first', value: 'Why does Deepak build with AI?' },
        { label: 'What he reads', value: 'What kind of books does Deepak read?' },
        { label: 'Why mountains', value: 'Why is Deepak into mountains?' },
        { label: 'Languages', value: 'What languages does Deepak speak?' },
        { label: 'Why Michael Jordan', value: 'Why the Michael Jordan reference?' },
        { label: 'Finance tracker', value: "Tell me about his personal finance tracker project." },
        { label: 'Contact', value: "What's the best way to get in touch with Deepak?" }
      ],
      welcome: "Hey 👋 I can tell you about Deepak — his work, his projects, what he reads, why he loves mountains, anything. What do you want to know?",
      introMeta: 'Deepak bot',
      userMeta: 'You',
      error: "Quick brain hiccup. Try again in a moment.",
      limit: "10 questions in — that's all I've got for this session. Email Deepak directly for the deeper stuff.",
      sessionLimit: "10 questions in — that's all I've got for this session. Email Deepak directly for the deeper stuff.",
      typing: 'Thinking...',
      cta: 'Email Deepak directly'
    }
  };

  const copy = labels[locale];
  const state = {
    messages: [],
    userTurns: 0,
    isOpen: false,
    limited: false,
    locale
  };

  launcher.querySelector('.lawn-chat__launcher-text').textContent = copy.launcher;
  panel.querySelector('.lawn-chat__title').textContent = copy.title;

  input.placeholder = copy.placeholder;
  sendButton.textContent = copy.send;

  const promptButtons = [...promptsEl.querySelectorAll('[data-chat-prompt]')];
  const shuffled = [...copy.prompts].sort(() => Math.random() - 0.5);
  shuffled.slice(0, promptButtons.length).forEach((prompt, index) => {
    promptButtons[index].textContent = prompt.label;
    promptButtons[index].dataset.chatPrompt = prompt.value;
  });

  function saveState() {
    const snapshot = {
      messages: state.messages.slice(-MAX_HISTORY),
      userTurns: state.userTurns,
      limited: state.limited,
      locale: state.locale
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function restoreState() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (!stored) return;
      if (Array.isArray(stored.messages)) {
        state.messages = stored.messages.slice(-MAX_HISTORY);
      }
      if (typeof stored.userTurns === 'number') {
        state.userTurns = stored.userTurns;
      }
      state.limited = Boolean(stored.limited);
    } catch (_) {}
  }

  function createMessageNode(message) {
    const wrapper = document.createElement('div');
    wrapper.className = `lawn-chat__message lawn-chat__message--${message.role}`;

    const meta = document.createElement('div');
    meta.className = 'lawn-chat__meta';
    meta.textContent = message.role === 'assistant' ? copy.introMeta : copy.userMeta;

    const bubble = document.createElement('div');
    bubble.className = 'lawn-chat__bubble';
    bubble.textContent = message.content;

    wrapper.append(meta, bubble);

    if (message.cta && message.role === 'assistant') {
      const cta = document.createElement('a');
      cta.className = 'lawn-chat__cta';
      cta.href = message.cta.href;
      cta.textContent = message.cta.label || copy.cta;
      if (/^https?:/i.test(message.cta.href)) {
        cta.target = '_blank';
        cta.rel = 'noopener';
      }
      wrapper.appendChild(cta);
    }

    return wrapper;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function renderMessages() {
    messagesEl.innerHTML = '';
    state.messages.forEach((message) => {
      messagesEl.appendChild(createMessageNode(message));
    });
    scrollToBottom();
  }

  function pushMessage(message) {
    state.messages.push(message);
    state.messages = state.messages.slice(-MAX_HISTORY);
    renderMessages();
    saveState();
  }

  function setOpen(nextOpen) {
    state.isOpen = nextOpen;
    launcher.setAttribute('aria-expanded', String(nextOpen));
    launcher.hidden = nextOpen;
    panel.setAttribute('aria-hidden', String(!nextOpen));
    panel.hidden = !nextOpen;
    if (nextOpen) {
      scrollToBottom();
      setTimeout(() => input.focus(), 60);
    }
  }

  function setBusy(isBusy) {
    input.disabled = isBusy || state.limited || state.userTurns >= MAX_TURNS;
    sendButton.disabled = isBusy || state.limited || state.userTurns >= MAX_TURNS;
    promptButtons.forEach((button) => { button.disabled = isBusy || state.limited; });
  }

  function getConversationPayload() {
    return state.messages
      .filter((message) => message.role === 'assistant' || message.role === 'user')
      .map(({ role, content }) => ({ role, content }))
      .slice(-MAX_HISTORY);
  }

  function autosizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(Math.max(input.scrollHeight, 44), 96)}px`;
  }

  function buildTypingNode() {
    const wrapper = document.createElement('div');
    wrapper.className = 'lawn-chat__message lawn-chat__message--assistant';
    wrapper.dataset.typing = 'true';

    const meta = document.createElement('div');
    meta.className = 'lawn-chat__meta';
    meta.textContent = copy.typing;

    const bubble = document.createElement('div');
    bubble.className = 'lawn-chat__bubble';

    const dots = document.createElement('div');
    dots.className = 'lawn-chat__typing';
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);

    wrapper.append(meta, bubble);
    return wrapper;
  }

  function setLimited() {
    state.limited = true;
    panel.classList.add('is-limited');
    saveState();
  }

  async function sendMessage(content) {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_INPUT_CHARS) {
      input.value = trimmed.slice(0, MAX_INPUT_CHARS);
    }

    if (state.userTurns >= MAX_TURNS) {
      pushMessage({ role: 'assistant', content: copy.sessionLimit });
      setLimited();
      setBusy(false);
      return;
    }

    pushMessage({ role: 'user', content: trimmed.slice(0, MAX_INPUT_CHARS) });
    state.userTurns += 1;
    saveState();

    input.value = '';
    autosizeInput();
    setBusy(true);

    const typingNode = buildTypingNode();
    messagesEl.appendChild(typingNode);
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locale: state.locale,
          messages: getConversationPayload()
        })
      });

      const data = await response.json().catch(() => null);
      typingNode.remove();

      if (!response.ok || !data || typeof data.message !== 'string') {
        throw new Error('bad_response');
      }

      if (data.limited) {
        setLimited();
      }

      pushMessage({
        role: 'assistant',
        content: data.message,
        cta: data.cta && data.cta.href ? data.cta : null
      });
    } catch (_) {
      typingNode.remove();
      pushMessage({
        role: 'assistant',
        content: state.limited ? copy.limit : copy.error
      });
    } finally {
      setBusy(false);
    }
  }

  restoreState();

  if (!state.messages.length) {
    state.messages = [{ role: 'assistant', content: copy.welcome }];
    saveState();
  }

  if (state.limited) {
    panel.classList.add('is-limited');
  }

  renderMessages();
  setBusy(false);
  autosizeInput();

  launcher.addEventListener('click', () => setOpen(!state.isOpen));
  closeButton.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  promptsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chat-prompt]');
    if (!button) return;
    sendMessage(button.dataset.chatPrompt || '');
  });

  input.addEventListener('input', autosizeInput);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.isOpen) {
      setOpen(false);
    }
  });
})();
