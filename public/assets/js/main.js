/* Штаб Барбершоп: interactions and motion.
   GSAP 3.15 (core, ScrollTrigger, SplitText, ScrambleText) is loaded from assets/js/vendor.
   "power4.out" is the same curve as cubic-bezier(0.22, 1, 0.36, 1) used in the CSS. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'power4.out';

  /* ---------- Open now / closed, business time zone Europe/Kyiv ---------- */

  const OPEN_AT = 9 * 60;
  const CLOSE_AT = 19 * 60;
  const kyivClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  function updateOpenStatus() {
    const parts = kyivClock.formatToParts(new Date());
    const part = (type) => Number(parts.find((p) => p.type === type).value);
    const now = part('hour') * 60 + part('minute');
    const isOpen = now >= OPEN_AT && now < CLOSE_AT;
    let text = 'Зараз відчинено · до 19:00';
    if (!isOpen) text = now < OPEN_AT ? 'Зараз зачинено · відкриємося о 9:00' : 'Зараз зачинено · відкриємося завтра о 9:00';
    $$('[data-open-status]').forEach((el) => { el.textContent = text; });
    $$('[data-open-dot]').forEach((el) => el.classList.toggle('is-open', isOpen));
  }

  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Mobile menu ---------- */

  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  const menuItems = $$('[data-menu-item]', menu);
  const outsideMenu = [$('main'), $('.site-footer'), $('[data-mobile-cta]'), $('.skip-link')];
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    root.classList.toggle('is-menu-open', open);
    outsideMenu.forEach((el) => { if (el) el.inert = open; });

    const gsap = window.gsap;
    if (open) {
      menu.hidden = false;
      if (!gsap) return;
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: EASE, overwrite: true });
      if (!reducedMotion.matches) {
        // 60 ms between items, the whole sequence never longer than 400 ms
        gsap.fromTo(menuItems, { y: 24, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          ease: EASE,
          stagger: Math.min(0.06, 0.4 / menuItems.length),
          overwrite: true,
          clearProps: 'transform',
        });
      }
    } else if (gsap) {
      gsap.to(menu, { autoAlpha: 0, duration: 0.25, ease: EASE, overwrite: true, onComplete: () => { menu.hidden = true; } });
    } else {
      menu.hidden = true;
    }
  }

  menuToggle.addEventListener('click', () => setMenu(!menuOpen));
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menuOpen) return;
    setMenu(false);
    menuToggle.focus();
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });

  /* ---------- FAQ ---------- */

  let refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued || !window.ScrollTrigger) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      window.ScrollTrigger.refresh();
    });
  }

  $$('.faq__item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open && window.gsap && !reducedMotion.matches) {
        window.gsap.fromTo($('.faq__a', item), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE, clearProps: 'transform' });
      }
      queueRefresh(); // answers change the page height below
    });
  });

  /* ---------- Walkthrough video: plays only while on screen, never on its own for reduced motion or Save-Data ---------- */

  const video = $('[data-video]');
  const videoToggle = $('[data-video-toggle]');
  if (video && videoToggle) {
    let pausedByUser = reducedMotion.matches || Boolean(navigator.connection && navigator.connection.saveData);
    const syncToggle = () => {
      const playing = !video.paused;
      videoToggle.classList.toggle('is-playing', playing);
      videoToggle.setAttribute('aria-label', playing ? 'Поставити відео на паузу' : 'Відтворити відео');
    };
    video.addEventListener('play', syncToggle);
    video.addEventListener('pause', syncToggle);
    videoToggle.addEventListener('click', () => {
      pausedByUser = !video.paused;
      if (pausedByUser) video.pause();
      else video.play().catch(() => {});
    });
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !pausedByUser) video.play().catch(() => {});
      else if (!entry.isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.35 }).observe(video);
  }

  /* ---------- Motion ---------- */

  const { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin } = window;
  if (!gsap || !ScrollTrigger || !SplitText || !ScrambleTextPlugin) {
    root.classList.remove('js-anim');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
  gsap.defaults({ ease: EASE });
  ScrollTrigger.config({ ignoreMobileResize: true });

  const CYRILLIC = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';
  const DIGITS = '0123456789';

  const fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 800))])
    : Promise.resolve();
  fontsReady.then(initMotion);

  function initMotion() {
    let introPlayed = false;
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
        desktop: '(min-width: 1024px)',
      },
      (context) => {
        const { motion, desktop } = context.conditions;
        root.classList.remove('js-anim');

        if (!motion) {
          if (!introPlayed) heroFade();
          introPlayed = true;
          fadeReveals();
          return undefined;
        }

        const cleanups = [];
        // The pinned gallery goes first, so triggers further down measure with its pin spacer in place.
        if (desktop) cleanups.push(worksGallery());
        if (!introPlayed) heroIntro(desktop);
        introPlayed = true;
        heroParallax();
        cleanups.push(marquee());
        headings();
        eyebrows();
        reveals();
        counters();
        prices();
        if (!desktop) worksSwipeIn();
        statement();
        team();
        steps();
        return () => cleanups.forEach((cleanup) => cleanup && cleanup());
      }
    );

    mm.add('(max-width: 1023.98px)', () => mobileCta());
    headerAutoHide();
    navSpy();
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* Hero */

  function heroIntro(desktop) {
    const logo = $('.hero__logo svg');
    const tl = gsap.timeline({ delay: 0.1 });

    tl.from($$('.logo-letter', logo), {
      autoAlpha: 0,
      yPercent: -30,
      scale: 1.3,
      transformOrigin: '50% 100%',
      duration: 0.9,
      stagger: 0.08,
    }, 0)
      .from($('.logo-frame', logo), { scaleX: 0, transformOrigin: '50% 50%', duration: 1 }, 0.35)
      .from($$('.logo-char', logo), { autoAlpha: 0, y: 8, duration: 0.6, stagger: { each: 0.03, from: 'center' } }, 0.55)
      .from('.site-header', { autoAlpha: 0, y: -24, duration: 0.8 }, 0.3)
      .from('.hero__motto-line', { scaleX: 0, duration: 0.9 }, 0.6)
      .from('.hero__motto-text', { autoAlpha: 0, duration: 0.8 }, 0.7)
      .from('.hero__lead', { autoAlpha: 0, y: 24, duration: 0.8 }, 0.95)
      .from('.hero__actions > *', { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08, clearProps: 'transform' }, 1.05)
      .from('.hero__facts > *', { autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.2);

    SplitText.create('.hero__title', {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      autoSplit: true,
      onSplit(self) {
        self.elements[0].classList.add('is-split');
        return gsap.from(self.lines, { yPercent: 110, duration: 1, stagger: 0.1, delay: 0.85 });
      },
      onRevert(self) {
        self.elements[0].classList.remove('is-split');
      },
    });

    // On desktop the photo is above the fold and joins the intro; on phones it waits for the scroll.
    const media = gsap.timeline(desktop ? {} : { scrollTrigger: { trigger: '.hero__media', start: 'top 90%', once: true } });
    media
      .from('.hero__frame', { autoAlpha: 0, y: 48, duration: 1.2 })
      .from('.hero__frame img', { scale: 1.25, duration: 1.6 }, 0)
      .from('.hero__media .corner', { autoAlpha: 0, scale: 0.4, duration: 0.8, stagger: 0.06 }, 0.5)
      .from('.hero__chip', { autoAlpha: 0, y: 12, duration: 0.8 }, 0.8);
    if (desktop) tl.add(media, 0.3);
  }

  function heroFade() {
    gsap.from(['.site-header', ...$$('.hero__content > *'), '.hero__media'], { autoAlpha: 0, duration: 0.6, stagger: 0.06 });
  }

  function heroParallax() {
    gsap.fromTo('.hero__frame img', { yPercent: -5 }, {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: '.hero__media', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* Services ticker: constant drift, speeds up with scroll velocity and follows scroll direction */

  function marquee() {
    const el = $('[data-marquee]');
    const track = $('.marquee__track', el);
    const group = $('.marquee__group', el);
    const setX = gsap.quickSetter(track, 'x', 'px');
    const BASE_SPEED = 60; // px per second
    let width = group.offsetWidth;
    let x = 0;
    let direction = 1;
    let boost = 0;
    let visible = ScrollTrigger.isInViewport(el);

    const tick = (time, deltaTime) => {
      if (!visible) return;
      boost *= 0.92;
      x = gsap.utils.wrap(-width, 0, x - direction * (BASE_SPEED + boost) * (deltaTime / 1000));
      setX(x);
    };
    const onResize = () => { width = group.offsetWidth; };

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { visible = self.isActive; },
      onUpdate: (self) => {
        direction = self.direction;
        boost = Math.min(Math.abs(self.getVelocity()) * 0.5, 1200);
      },
    });
    gsap.ticker.add(tick);
    window.addEventListener('resize', onResize);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      gsap.set(track, { clearProps: 'transform' });
    };
  }

  /* Section content */

  function headings() {
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'line',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110,
          duration: 1,
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
      });
    });
  }

  // Section labels "decode" like an HQ transmission
  function eyebrows() {
    $$('[data-scramble]').forEach((el) => {
      const text = el.textContent.trim();
      gsap.set(el, { textContent: '' });
      gsap.to(el, {
        duration: 0.9,
        ease: 'none',
        scrambleText: { text, chars: CYRILLIC, speed: 0.6 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  function reveals() {
    const items = $$('[data-reveal]');
    gsap.set(items, { autoAlpha: 0, y: 32 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, overwrite: true, clearProps: 'transform' }),
    });
  }

  function counters() {
    $$('[data-count]').forEach((el) => {
      gsap.from(el, {
        textContent: 0,
        duration: 1.6,
        snap: { textContent: 1 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  function prices() {
    const rows = $$('.price-table tbody tr');
    rows.forEach((row) => gsap.set(row.children, { autoAlpha: 0, y: 16 }));
    ScrollTrigger.batch(rows, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => batch.forEach((row, i) => {
        gsap.to(row.children, { autoAlpha: 1, y: 0, duration: 0.7, delay: i * 0.06, overwrite: true });
        $$('[data-price]', row).forEach((price) => {
          gsap.to(price, {
            duration: 0.8,
            delay: i * 0.06 + 0.1,
            ease: 'none',
            scrambleText: { text: price.textContent, chars: DIGITS, speed: 0.8 },
          });
        });
      }),
    });
  }

  function worksSwipeIn() {
    gsap.from('.work', {
      x: 64,
      autoAlpha: 0,
      duration: 1,
      stagger: 0.08,
      clearProps: 'transform',
      scrollTrigger: { trigger: '.works__viewport', start: 'top 85%', once: true },
    });
  }

  // Desktop: vertical scroll drives the gallery sideways while the section is pinned
  function worksGallery() {
    const section = $('#works');
    const viewport = $('[data-works-viewport]');
    const track = $('[data-works-track]');
    section.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-works-pin]',
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    });

    // lazy images would pop in late inside a translated track, so fetch them while the section approaches
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom+=1200',
      once: true,
      onEnter: () => $$('img', track).forEach((img) => { img.loading = 'eager'; }),
    });

    $$('.work__img img', track).forEach((img) => {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
      });
    });

    return () => section.classList.remove('is-pinned');
  }

  // Tagline: every word lights up in reading order as the block scrolls through
  function statement() {
    const el = $('[data-words]');
    SplitText.create(el, {
      type: 'words',
      onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.25 }, {
        opacity: 1,
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
      }),
    });
  }

  function team() {
    const cards = $$('.barber');
    gsap.set(cards, { autoAlpha: 0, y: 32 });
    gsap.set($$('.barber__curtain'), { scaleY: 1 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, overwrite: true, clearProps: 'transform' });
        gsap.to(batch.map((card) => $('.barber__curtain', card)), { scaleY: 0, duration: 1.1, stagger: 0.1, delay: 0.15 });
        gsap.fromTo(batch.map((card) => $('.barber__photo img', card)), { scale: 1.2 }, {
          scale: 1,
          duration: 1.6,
          stagger: 0.1,
          delay: 0.15,
          clearProps: 'transform', // hand the hover zoom back to CSS
        });
      },
    });
  }

  function steps() {
    $$('[data-step]').forEach((el) => {
      const text = el.textContent.trim();
      gsap.set(el, { textContent: '' });
      gsap.to(el, {
        duration: 0.8,
        ease: 'none',
        scrambleText: { text, chars: DIGITS, speed: 0.8 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  function fadeReveals() {
    const items = $$('[data-reveal], .barber, .work, .price-table tbody tr');
    gsap.set(items, { autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, duration: 0.6, stagger: 0.05, overwrite: true }),
    });
  }

  /* Chrome */

  function mobileCta() {
    const bar = $('[data-mobile-cta]');
    const show = (visible) => gsap.to(bar, {
      autoAlpha: visible ? 1 : 0,
      y: visible || reducedMotion.matches ? 0 : 24,
      duration: 0.5,
      overwrite: true,
    });
    // visible between the hero button and the contacts section, which has its own button
    ScrollTrigger.create({
      trigger: '.hero__actions',
      start: 'bottom top',
      endTrigger: '#contacts',
      end: 'top bottom',
      onToggle: (self) => show(self.isActive),
    });
    return () => gsap.set(bar, { clearProps: 'opacity,visibility,transform' });
  }

  function headerAutoHide() {
    const header = $('.site-header');
    let hidden = false;
    const setHidden = (hide) => {
      if (hide === hidden) return;
      hidden = hide;
      gsap.to(header, { yPercent: hide ? -140 : 0, duration: hide ? 0.4 : 0.6, overwrite: 'auto' });
    };
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (menuOpen || reducedMotion.matches) return;
        setHidden(self.direction === 1 && self.scroll() > 320);
      },
    });
    header.addEventListener('focusin', () => setHidden(false));
  }

  function navSpy() {
    const links = $$('[data-nav]');
    new Set(links.map((link) => link.getAttribute('href'))).forEach((hash) => {
      const section = $(hash);
      if (!section) return;
      const sectionLinks = links.filter((link) => link.getAttribute('href') === hash);
      ScrollTrigger.create({
        trigger: section,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => sectionLinks.forEach((link) => {
          if (self.isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }),
      });
    });
  }
})();
