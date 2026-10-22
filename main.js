/* Tempo Strength Club — interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var html = document.documentElement;
  html.classList.add('js');

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var mqPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduce = mqReduce.matches;
  var desktop = mqDesktop.matches;

  var scrollY = window.scrollY || window.pageYOffset;
  var vh = window.innerHeight;
  var ticking = false;
  var scrollTasks = [];
  var measureTasks = [];

  function frame() {
    ticking = false;
    scrollY = window.scrollY || window.pageYOffset;
    for (var i = 0; i < scrollTasks.length; i++) scrollTasks[i](scrollY, vh);
  }

  function requestFrame() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(frame);
    }
  }

  function measure() {
    vh = window.innerHeight;
    for (var i = 0; i < measureTasks.length; i++) measureTasks[i]();
    requestFrame();
  }

  var resizeTimer = null;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      desktop = mqDesktop.matches;
      measure();
    }, 120);
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', measure);

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(onResize);
    ro.observe(document.body);
  }

  function onMediaChange(mq, fn) {
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', fn);
    else if (typeof mq.addListener === 'function') mq.addListener(fn);
  }

  onMediaChange(mqReduce, function (e) {
    reduce = e.matches;
    html.classList.toggle('has-cursor', !reduce && mqPointer.matches && !!$('.cursor'));
    measure();
  });

  onMediaChange(mqDesktop, function (e) {
    desktop = e.matches;
    measure();
  });

  /* ------------------------------------------------------------------
     Fonts: start the hero entrance once Anton and Inter are available,
     or after a short timeout so a slow font never blocks the page.
     ------------------------------------------------------------------ */
  function whenFontsReady(timeout) {
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () { if (!done) { done = true; resolve(); } };
      window.setTimeout(finish, timeout);
      if (!document.fonts || !document.fonts.load) { finish(); return; }
      var loadFaces = function () {
        Promise.all([
          document.fonts.load('400 1em Anton'),
          document.fonts.load('400 1em Inter'),
          document.fonts.load('600 1em Inter')
        ]).then(finish, finish);
      };
      var link = $('link[data-fonts]');
      if (link && !link.sheet) {
        link.addEventListener('load', loadFaces, { once: true });
        link.addEventListener('error', finish, { once: true });
      } else {
        loadFaces();
      }
    });
  }

  /* ------------------------------------------------------------------
     Split headings into words for the staggered reveal.
     ------------------------------------------------------------------ */
  function splitWords(el) {
    if (el.classList.contains('split')) return;
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    var words = text.split(' ');
    el.textContent = '';
    words.forEach(function (word, i) {
      var outer = document.createElement('span');
      outer.className = 'w';
      var inner = document.createElement('span');
      inner.className = 'w__i';
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('split');
  }

  $$('[data-split]').forEach(splitWords);

  /* ------------------------------------------------------------------
     Reveals (IntersectionObserver, run once)
     ------------------------------------------------------------------ */
  var revealTargets = $$('[data-reveal], .split').filter(function (el) {
    return !el.closest('.hero');
  });

  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealTargets.forEach(function (el) { revealIO.observe(el); });

    var bgIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          bgIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
    $$('[data-bg]').forEach(function (el) { bgIO.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    $$('[data-bg]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     Nav: translucent after 80px, active link by scroll position
     ------------------------------------------------------------------ */
  var nav = $('.nav');
  var navLinks = $$('.nav__link[href^="#"]');
  var navSections = navLinks.map(function (a) {
    return { link: a, el: $(a.getAttribute('href')) };
  }).filter(function (s) { return s.el; });

  scrollTasks.push(function (y) {
    if (nav) nav.classList.toggle('is-scrolled', y > 80);
    var line = vh * 0.4;
    var current = null;
    for (var i = 0; i < navSections.length; i++) {
      if (navSections[i].el.getBoundingClientRect().top <= line) current = navSections[i];
    }
    navSections.forEach(function (s) {
      var active = s === current;
      s.link.classList.toggle('is-active', active);
      if (active) s.link.setAttribute('aria-current', 'true');
      else s.link.removeAttribute('aria-current');
    });
  });

  /* ------------------------------------------------------------------
     Overlay menu
     ------------------------------------------------------------------ */
  var burger = $('.nav__burger');
  var menu = $('#menu');
  var menuOpen = false;
  var lastFocus = null;

  function focusables(root) {
    return $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', root);
  }

  // Everything outside the header and the overlay is unreachable while the menu is open.
  function setPageInert(on) {
    ['main', 'footer'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      if ('inert' in el) el.inert = on;
      else if (on) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    });
  }

  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    lastFocus = document.activeElement;
    menu.hidden = false;
    if ('inert' in menu) menu.inert = false;
    // Force a style flush so the entrance transition runs from the hidden state.
    void menu.offsetWidth;
    menu.classList.add('is-open');
    html.classList.add('menu-open');
    setPageInert(true);
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    var first = focusables(menu)[0];
    if (first) first.focus();
  }

  function closeMenu(returnFocus) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    if ('inert' in menu) menu.inert = true;
    html.classList.remove('menu-open');
    setPageInert(false);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    var hide = function () { if (!menuOpen) menu.hidden = true; };
    if (reduce) hide(); else window.setTimeout(hide, 360);
    if (returnFocus !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (menuOpen) closeMenu(); else openMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        var items = [burger].concat(focusables(menu));
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    onMediaChange(mqDesktop, function (e) { if (e.matches) closeMenu(); });
  }

  /* ------------------------------------------------------------------
     Smooth anchor scrolling with a 90px offset for the fixed nav
     ------------------------------------------------------------------ */
  var NAV_OFFSET = 90;

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute('href');
    if (href === '#') { e.preventDefault(); return; }
    var target = href === '#top' ? document.body : $(href);
    if (!target) return;
    e.preventDefault();
    if (menuOpen) closeMenu(false);
    var top = href === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - NAV_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', href === '#top' ? ' ' : href);
    }
    if (href !== '#top') {
      var focusTarget = target.querySelector('h1, h2') || target;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  });

  /* ------------------------------------------------------------------
     Hero: entrance, pinned scroll progress, marquee rise
     ------------------------------------------------------------------ */
  var hero = $('.hero');
  var heroPin = $('.hero__pin');
  var heroTitle = $('.hero__title');
  var heroContent = $('.hero__content');
  var marquee = $('.marquee');

  if (hero) {
    whenFontsReady(1000).then(function () {
      hero.classList.add('is-ready');
      if (heroTitle) heroTitle.classList.add('is-visible');
    });

    var BG = [14, 15, 15];
    var BG2 = [22, 23, 22];

    scrollTasks.push(function (y) {
      if (reduce) return;
      var dist = hero.offsetHeight - heroPin.offsetHeight;
      if (dist <= 0) {
        heroContent.style.transform = '';
        heroContent.style.opacity = '';
        heroPin.style.backgroundColor = '';
        marquee.style.transform = 'translateY(0)';
        return;
      }
      var p = clamp(y / dist, 0, 1);
      var eased = easeOutCubic(p);
      heroContent.style.transform = 'scale(' + (1 - 0.15 * eased).toFixed(4) + ')';
      heroContent.style.opacity = (1 - 0.4 * eased).toFixed(3);
      var r = Math.round(BG[0] + (BG2[0] - BG[0]) * p);
      var g = Math.round(BG[1] + (BG2[1] - BG[1]) * p);
      var b = Math.round(BG[2] + (BG2[2] - BG[2]) * p);
      heroPin.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
      var mp = clamp(p / 0.6, 0, 1);
      marquee.style.transform = 'translateY(' + ((1 - easeOutCubic(mp)) * 100).toFixed(2) + '%)';
    });
  }

  /* ------------------------------------------------------------------
     Stats count-up (once, 1.2s, eased)
     ------------------------------------------------------------------ */
  var stats = $$('[data-count]');

  function formatCount(n, suffix) {
    return n.toLocaleString('en-US') + (suffix || '');
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / duration, 0, 1);
      el.textContent = formatCount(Math.round(target * easeOutCubic(t)), suffix);
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (stats.length && !reduce && 'IntersectionObserver' in window) {
    var statsIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.textContent = formatCount(0, entry.target.getAttribute('data-suffix') || '');
          countUp(entry.target);
          statsIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { statsIO.observe(el); });
  }

  /* ------------------------------------------------------------------
     Programs: sticky index and name follow the scrolling blocks
     ------------------------------------------------------------------ */
  var programs = $$('.program');
  var programIndex = $('.programs__index-cur');
  var programName = $('.programs__current-inner');
  var programSticky = $('.programs__sticky');
  var activeProgram = null;

  function swapText(el, text, dir) {
    if (!el) return;
    if (reduce || !el.animate) { el.textContent = text; return; }
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    el._pending = text;
    var out = el.animate(
      [{ transform: 'translateY(' + (dir * -100) + '%)', opacity: 0 }],
      { duration: 220, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' }
    );
    out.onfinish = function () {
      if (el._pending !== text) return;
      el.textContent = text;
      el.animate(
        [{ transform: 'translateY(' + (dir * 100) + '%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 480, easing: 'cubic-bezier(0.33, 1, 0.68, 1)', fill: 'both' }
      );
    };
  }

  function setActiveProgram(el) {
    if (el === activeProgram) return;
    var dir = activeProgram && programs.indexOf(el) < programs.indexOf(activeProgram) ? -1 : 1;
    activeProgram = el;
    if (programSticky) programSticky.classList.toggle('is-last', el === programs[programs.length - 1]);
    swapText(programIndex, el.getAttribute('data-index'), dir);
    swapText(programName, el.getAttribute('data-name'), dir);
  }

  if (programs.length && programIndex && 'IntersectionObserver' in window) {
    activeProgram = programs[0];
    var programIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveProgram(entry.target);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    programs.forEach(function (el) { programIO.observe(el); });
  }

  /* ------------------------------------------------------------------
     Coaches: pinned horizontal scroll on desktop
     ------------------------------------------------------------------ */
  var coaches = $('.coaches');
  var coachesPin = $('.coaches__pin');
  var coachTrack = $('.coaches__track');
  var coachViewport = $('.coaches__viewport');
  var coachBar = $('.coaches__progress-bar');
  var coachTop = 0;
  var coachDist = 0;
  var coachMax = 0;
  var coachPinned = false;

  function coachesPinnable() {
    return desktop && !reduce;
  }

  function coachTravel() {
    var style = window.getComputedStyle(coachViewport);
    var padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return Math.max(0, coachTrack.scrollWidth - (coachViewport.clientWidth - padding));
  }

  function setCoachScrollable(scrollable) {
    if (scrollable) coachViewport.setAttribute('tabindex', '0');
    else coachViewport.removeAttribute('tabindex');
  }

  if (coaches && coachTrack) {
    measureTasks.push(function () {
      coachPinned = coachesPinnable();
      if (coachPinned) {
        // Measure with the pin active; if the row nearly fits there is nothing to scroll, so do not pin.
        coaches.classList.remove('is-unpinned');
        coachTrack.style.transform = '';
        coachMax = coachTravel();
        if (coachMax < 120) {
          coachPinned = false;
          coaches.classList.add('is-unpinned');
        }
      }
      if (!coachPinned) {
        coachTrack.style.transform = '';
        if (coachBar) coachBar.style.transform = '';
        setCoachScrollable(coachViewport.scrollWidth > coachViewport.clientWidth + 1);
        return;
      }
      setCoachScrollable(false);
      coachTop = coaches.getBoundingClientRect().top + scrollY;
      coachDist = coaches.offsetHeight - coachesPin.offsetHeight;
    });

    scrollTasks.push(function (y) {
      if (!coachPinned || coachDist <= 0) return;
      var p = clamp((y - coachTop) / coachDist, 0, 1);
      coachTrack.style.transform = 'translate3d(' + (-p * coachMax).toFixed(1) + 'px, 0, 0)';
      if (coachBar) coachBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* ------------------------------------------------------------------
     Image parallax inside overflow-hidden wrappers
     ------------------------------------------------------------------ */
  var parallaxEls = $$('.parallax');
  var parallaxActive = [];

  if (parallaxEls.length && !reduce && 'IntersectionObserver' in window) {
    var parallaxIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = parallaxActive.indexOf(entry.target);
        if (entry.isIntersecting && idx === -1) parallaxActive.push(entry.target);
        if (!entry.isIntersecting && idx !== -1) parallaxActive.splice(idx, 1);
      });
      requestFrame();
    }, { rootMargin: '15% 0px 15% 0px' });
    parallaxEls.forEach(function (el) { parallaxIO.observe(el); });

    scrollTasks.push(function (y, viewH) {
      if (reduce) return;
      for (var i = 0; i < parallaxActive.length; i++) {
        var el = parallaxActive[i];
        var r = el.getBoundingClientRect();
        var offset = (r.top + r.height / 2) - viewH / 2;
        var max = r.height * 0.14;
        var t = clamp(-offset * 0.15, -max, max);
        el.style.setProperty('--py', t.toFixed(1) + 'px');
      }
    });
  }

  /* ------------------------------------------------------------------
     Schedule filters
     ------------------------------------------------------------------ */
  var filterButtons = $$('.filter[data-filter]');
  var cells = $$('.schedule__table .cell');
  var filterStatus = $('#filter-status');
  var scheduleScroller = $('.schedule__scroller');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      var shown = 0;
      cells.forEach(function (cell) {
        var type = cell.getAttribute('data-type');
        var dim = f !== 'all' && type !== f;
        cell.classList.toggle('is-dim', dim);
        if (!dim && type !== 'none') shown++;
      });
      if (filterStatus) {
        filterStatus.textContent = f === 'all'
          ? 'Showing every class.'
          : 'Showing ' + shown + ' ' + btn.textContent.trim() + ' classes; others dimmed.';
      }
    });
  });

  if (scheduleScroller) {
    measureTasks.push(function () {
      if (scheduleScroller.scrollWidth > scheduleScroller.clientWidth + 1) scheduleScroller.setAttribute('tabindex', '0');
      else scheduleScroller.removeAttribute('tabindex');
    });
  }

  /* ------------------------------------------------------------------
     Trial form: validate, then swap in a success message
     ------------------------------------------------------------------ */
  var form = $('#trial-form');

  if (form) {
    form.noValidate = true;
    var fields = $$('.field', form);

    var validators = {
      name: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      phone: function (v) { return v.replace(/\D/g, '').length >= 7; }
    };

    function setFieldState(field, valid) {
      var input = $('input', field);
      var error = $('.field__error', field);
      field.classList.toggle('is-invalid', !valid);
      input.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (error) {
        error.hidden = valid;
        if (valid) input.removeAttribute('aria-describedby');
        else input.setAttribute('aria-describedby', error.id);
      }
    }

    function validateField(field) {
      var input = $('input', field);
      var fn = validators[input.name] || function (v) { return v.trim().length > 0; };
      var valid = fn(input.value);
      setFieldState(field, valid);
      return valid;
    }

    fields.forEach(function (field) {
      var input = $('input', field);
      input.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
      input.addEventListener('blur', function () {
        if (input.value.trim()) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        $('input', firstInvalid).focus();
        return;
      }
      var success = document.createElement('div');
      success.className = 'form__success';
      success.setAttribute('role', 'status');
      success.setAttribute('tabindex', '-1');
      success.innerHTML =
        '<p class="form__success-title">You’re in.</p>' +
        '<p class="form__success-text">We’ll text you within the hour.</p>';
      form.replaceWith(success);
      success.focus();
    });
  }

  /* ------------------------------------------------------------------
     Magnetic primary buttons (pointer devices only)
     ------------------------------------------------------------------ */
  if (mqPointer.matches && !reduce) {
    var magnets = $$('.btn--primary, .btn--dark');
    var mx = -1;
    var my = -1;
    var magTick = false;
    var RANGE = 80;
    var PULL = 6;

    function magnetFrame() {
      magTick = false;
      for (var i = 0; i < magnets.length; i++) {
        var btn = magnets[i];
        var r = btn.getBoundingClientRect();
        if (!r.width) continue;
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = mx - cx;
        var dy = my - cy;
        var rx = r.width / 2 + RANGE;
        var ry = r.height / 2 + RANGE;
        if (Math.abs(dx) < rx && Math.abs(dy) < ry) {
          var tx = clamp(dx / rx, -1, 1) * PULL;
          var ty = clamp(dy / ry, -1, 1) * PULL;
          btn.style.transform = 'translate(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px)';
          btn.classList.add('is-magnetic');
        } else if (btn.classList.contains('is-magnetic')) {
          btn.style.transform = '';
          btn.classList.remove('is-magnetic');
        }
      }
    }

    function requestMagnetFrame() {
      if (!magTick) {
        magTick = true;
        window.requestAnimationFrame(magnetFrame);
      }
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      requestMagnetFrame();
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      mx = -10000;
      my = -10000;
      requestMagnetFrame();
    });

    scrollTasks.push(function () {
      if (mx > -1000) requestMagnetFrame();
    });
  }

  /* ------------------------------------------------------------------
     Custom cursor (desktop, fine pointer, motion allowed)
     ------------------------------------------------------------------ */
  var cursor = $('.cursor');

  if (cursor && mqPointer.matches && !reduce) {
    html.classList.add('has-cursor');
    var cx = -100;
    var cy = -100;
    var tx = -100;
    var ty = -100;
    var cursorRunning = false;

    function cursorFrame() {
      cx += (tx - cx) * 0.55;
      cy += (ty - cy) * 0.55;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px, ' + cy.toFixed(1) + 'px, 0)';
      if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) {
        window.requestAnimationFrame(cursorFrame);
      } else {
        cursorRunning = false;
      }
    }

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-shown');
      if (!cursorRunning) {
        cursorRunning = true;
        window.requestAnimationFrame(cursorFrame);
      }
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('a, button, input, label, [data-cursor]') : null;
      cursor.classList.toggle('is-active', !!t);
      var lime = e.target.closest && e.target.closest('.cta, .btn--secondary, .filter[aria-pressed="true"], .tier__tag');
      cursor.classList.toggle('is-dark', !!lime);
    });

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) cursor.classList.remove('is-shown');
    });

    window.addEventListener('blur', function () { cursor.classList.remove('is-shown'); });
  }

  measure();
})();
