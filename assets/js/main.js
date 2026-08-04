document.addEventListener('DOMContentLoaded', function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector('.nav__toggle');
  var navMobile = document.getElementById('navMobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      var isOpen = navMobile.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', isOpen);
    });
    navMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMobile.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  /* ---------- scroll progress ---------- */
  var railProgress = document.querySelector('.rail__progress');
  var railMobileFill = document.querySelector('.rail-mobile__fill');
  function updateScrollProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
    if (railProgress) railProgress.style.transform = 'scaleY(' + pct + ')';
    if (railMobileFill) railMobileFill.style.transform = 'scaleX(' + pct + ')';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  /* ---------- active section tracking ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var railNodes = document.querySelectorAll('.rail__node');
  var navLinks = document.querySelectorAll('.nav__links a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          railNodes.forEach(function (n) { n.classList.toggle('is-active', n.dataset.target === id); });
          navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  railNodes.forEach(function (n) {
    n.addEventListener('click', function () {
      var target = document.getElementById(n.dataset.target);
      if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- count-up numbers ---------- */
  function countUp(el, target, duration, decimals) {
    duration = duration || 900;
    decimals = decimals || 0;
    var start = null;
    function format(v) {
      return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN');
    }
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    }
    requestAnimationFrame(tick);
  }
  function renderCountsInstant() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = parseInt(el.dataset.count, 10).toLocaleString('en-IN');
    });
    document.querySelectorAll('[data-count-scroll]').forEach(function (el) {
      var val = parseFloat(el.dataset.countScroll);
      var dec = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = dec ? val.toFixed(dec) : val.toLocaleString('en-IN');
    });
  }

  /* ---------- GSAP ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (!prefersReduced) {
      gsap.set(['.nav', '.hero__eyebrow', '.hero__title .word', '.hero__sub', '.hero__bench-item', '.hero__ctas'], { opacity: 0, y: 22 });

      var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .to('.nav', { opacity: 1, y: 0, duration: 0.6 })
        .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .to('.hero__title .word', { opacity: 1, y: 0, duration: 0.85, stagger: 0.1 }, '-=0.25')
        .to('.hero__sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.45')
        .to('.hero__bench-item', { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
        .to('.hero__ctas', { opacity: 1, y: 0, duration: 0.5 }, '-=0.25')
        .add(function () {
          document.querySelectorAll('[data-count]').forEach(function (el) {
            countUp(el, parseInt(el.dataset.count, 10), 1000);
          });
        }, '-=0.15');
    } else {
      renderCountsInstant();
    }

    /* generic reveal */
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    gsap.utils.toArray('.stack__group').forEach(function (group, i) {
      gsap.fromTo(group, { opacity: 0, y: 18 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.05,
        scrollTrigger: { trigger: group, start: 'top 92%' }
      });
      var chips = group.querySelectorAll('.stack__chips span');
      gsap.to(chips, {
        opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.035,
        scrollTrigger: { trigger: group, start: 'top 90%' }
      });
    });

    /* scroll-triggered counters outside the hero (contest stats, project stat) */
    document.querySelectorAll('[data-count-scroll]').forEach(function (el) {
      var target = parseFloat(el.dataset.countScroll);
      var decimals = parseInt(el.dataset.decimals || '0', 10);
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () { countUp(el, target, 1100, decimals); }
      });
    });

    /* featured cards: gentle cursor tilt, desktop pointer only */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.project-card--featured .project-card__inner').forEach(function (inner) {
        var bounds;
        inner.addEventListener('mouseenter', function () {
          bounds = inner.getBoundingClientRect();
          gsap.to(inner, { y: -4, duration: 0.4, ease: 'power2.out', transformPerspective: 900 });
        });
        inner.addEventListener('mousemove', function (e) {
          if (!bounds) bounds = inner.getBoundingClientRect();
          var px = (e.clientX - bounds.left) / bounds.width - 0.5;
          var py = (e.clientY - bounds.top) / bounds.height - 0.5;
          gsap.to(inner, { rotateX: py * -2.2, rotateY: px * 2.6, duration: 0.5, ease: 'power2.out' });
        });
        inner.addEventListener('mouseleave', function () {
          gsap.to(inner, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        });
      });
    }

    /* project card charge-and-deal reveal */
    gsap.utils.toArray('.project-card').forEach(function (card) {
      var glow = card.querySelector('.project-card__glow');
      var state = { angle: 0 };
      gsap.set(card, { y: 36, scale: 0.97 });
      if (glow) gsap.set(glow, { opacity: 0 });

      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
          if (glow) {
            tl.to(glow, { opacity: 1, duration: 0.2 }, 0);
            tl.to(state, {
              angle: 360, duration: 1.05, ease: 'power2.inOut',
              onUpdate: function () { glow.style.setProperty('--angle', state.angle + 'deg'); }
            }, 0);
          }
          tl.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'back.out(1.5)' }, 0.15);
          if (glow) tl.to(glow, { opacity: 0.35, duration: 0.6 }, 0.95);
        }
      });
    });

  } else {
    renderCountsInstant();
    document.querySelectorAll('.reveal, .project-card, .nav, .hero__eyebrow, .hero__title .word, .hero__sub, .hero__bench-item, .hero__ctas, .stack__chips span').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* ---------- back to top ---------- */
  var footTop = document.querySelector('.footer__top');
  if (footTop) {
    footTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- whole-card click-through to project detail pages ---------- */
  document.querySelectorAll('.project-card[data-href]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.project-links')) return;
      var href = card.dataset.href;
      if (href) window.location.href = href;
    });
  });

  /* ---------- gallery lightbox (project detail pages) ---------- */
  var lightbox = document.querySelector('.pd-lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbCaption = lightbox.querySelector('.pd-lightbox__caption');
    var lastFocused = null;
    function openLightbox(src, alt, caption) {
      lastFocused = document.activeElement;
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCaption.textContent = caption || '';
      lightbox.classList.add('is-open');
      document.body.classList.add('no-scroll');
      lightbox.querySelector('.pd-lightbox__close').focus();
    }
    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      if (lastFocused) lastFocused.focus();
    }
    document.querySelectorAll('.pd-gallery__item').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        openLightbox(img.src, img.alt, item.dataset.caption || img.alt);
      });
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    var closeBtn = lightbox.querySelector('.pd-lightbox__close');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

  /* ---------- gallery + diagram reveals (project detail pages) ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray('.pd-gallery__item').forEach(function (item, i) {
      gsap.fromTo(item, { opacity: 0, y: 24, scale: .97 }, {
        opacity: 1, y: 0, scale: 1, duration: .7, ease: 'power3.out', delay: (i % 3) * 0.06,
        scrollTrigger: { trigger: item, start: 'top 90%' }
      });
    });
    gsap.utils.toArray('.pd-diagram').forEach(function (diagram) {
      var flows = diagram.querySelectorAll('.pd-diagram-line--flow');
      var nodes = diagram.querySelectorAll('.pd-diagram-node');
      var labels = diagram.querySelectorAll('.pd-diagram-text, .pd-diagram-text--dim');
      flows.forEach(function (p) {
        var len = p.getTotalLength ? p.getTotalLength() : 200;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(nodes, { opacity: 0, scale: .9, transformOrigin: '50% 50%' });
      gsap.set(labels, { opacity: 0 });
      ScrollTrigger.create({
        trigger: diagram, start: 'top 75%', once: true,
        onEnter: function () {
          var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
          tl.to(nodes, { opacity: 1, scale: 1, duration: .5, stagger: .08 }, 0);
          tl.to(flows, { strokeDashoffset: 0, duration: .8, stagger: .1, ease: 'power2.inOut' }, .15);
          tl.to(labels, { opacity: 1, duration: .4, stagger: .03 }, .3);
        }
      });
    });
    gsap.utils.toArray('.pd-nextprev a').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .8, scrollTrigger: { trigger: el, start: 'top 95%' } });
    });
  } else {
    document.querySelectorAll('.pd-gallery__item, .pd-diagram-node, .pd-diagram-text, .pd-diagram-text--dim, .pd-nextprev a').forEach(function (el) {
      el.style.opacity = 1;
    });
  }
});
