    // Helpers
    const qs = (s, r=document) => r.querySelector(s);
    const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
    const htmlEl = document.documentElement;

    const themeToggles = qsa('.theme-toggle');
    function getTheme(){
      return htmlEl.dataset.theme === 'dark' ? 'dark' : 'light';
    }
    function updateThemeToggles(){
      const dark = getTheme() === 'dark';
      themeToggles.forEach((button) => {
        const nextLabel = dark ? 'Light mode' : 'Dark mode';
        button.setAttribute('aria-pressed', String(dark));
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('data-tooltip', nextLabel);
        const label = qs('.theme-toggle-label', button);
        if (label) label.textContent = nextLabel;
      });
    }
    function applyTheme(theme){
      const nextTheme = theme === 'dark' ? 'dark' : 'light';
      htmlEl.dataset.theme = nextTheme;
      try {
        localStorage.setItem('causeve-theme', nextTheme);
      } catch (_) {}
      updateThemeToggles();
    }
    themeToggles.forEach((button) => {
      button.addEventListener('click', () => {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
      });
    });
    updateThemeToggles();

    // Header height -> CSS var (in case logo size changes)
    const setHeaderOffset = () => {
      const h = (qs('header')?.offsetHeight) || 64;
      document.documentElement.style.setProperty('--header-h', h + 'px');
    };
    setHeaderOffset();
    addEventListener('resize', setHeaderOffset);
    addEventListener('orientationchange', setHeaderOffset);

    // Mobile nav
    const hamburger = qs('#hamburger');
    const panel = qs('#mobileNav');
    const scrim = qs('#scrim');
    function toggleMobile(open) {
      const willOpen = (open ?? !panel.classList.contains('open'));
      panel.classList.toggle('open', willOpen);
      scrim.classList.toggle('open', willOpen);
      hamburger.setAttribute('aria-expanded', String(willOpen));
      panel.setAttribute('aria-hidden', String(!willOpen));
      scrim.setAttribute('aria-hidden', String(!willOpen));
      document.body.style.overflow = willOpen ? 'hidden' : '';
    }
    hamburger?.addEventListener('click', () => toggleMobile());
    scrim?.addEventListener('click', () => toggleMobile(false));
    qsa('#mobileNav a, .menu a').forEach(a => a.addEventListener('click', () => toggleMobile(false)));

    // Year
    qs('#year').textContent = new Date().getFullYear();

    const navIndicator = qs('#navIndicator');

    (() => {
      const hero = qs('main.hero');
      if (!hero) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        htmlEl.classList.remove('hero-reveal-pending');
        return;
      }
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          htmlEl.classList.remove('hero-reveal-pending');
        }, 220);
      });
    })();

    function setupInteractiveRevealCards(cardSelector, sectionSelector) {
      const cards = qsa(cardSelector);
      if (!cards.length) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const section = qs(sectionSelector);

      function closeCards(){
        cards.forEach((card) => {
          card.classList.remove('is-open');
          card.setAttribute('aria-expanded', 'false');
        });
      }

      function openCard(card){
        cards.forEach((item) => {
          const isCurrent = item === card;
          item.classList.toggle('is-open', isCurrent);
          item.setAttribute('aria-expanded', String(isCurrent));
        });
      }

      if (pointerFine) {
        cards.forEach((card) => {
          card.addEventListener('click', (event) => {
            event.preventDefault();
            closeCards();
          });
        });
      } else {
        cards.forEach((card) => {
          card.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (card.classList.contains('is-open')) {
              closeCards();
              return;
            }
            openCard(card);
          });

          card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            card.click();
          });
        });

        document.addEventListener('click', (event) => {
          if (event.target && event.target.closest && event.target.closest(cardSelector)) return;
          closeCards();
        });
      }

      if (!reduceMotion && section && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          if (!visible) closeCards();
        }, { threshold: 0.18 });
        observer.observe(section);
      }
    }

    setupInteractiveRevealCards('.product-reveal-card', '#product-engineering');
    setupInteractiveRevealCards('.digital-reveal-card', '#digital-engineering');

    (() => {
      const section = qs('#about');
      const grid = qs('.principle-grid', section);
      if (!section || !grid) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mobileAboutSequenceDisabled =
        window.matchMedia('(max-width: 900px)').matches ||
        window.matchMedia('(pointer: coarse)').matches;
      if (reduceMotion || mobileAboutSequenceDisabled) return;
      if (!('IntersectionObserver' in window)) return;

      const cards = qsa('.principle-card', grid);
      if (!cards.length) return;
      let principleTimer = 0;
      let sequenceStartTimer = 0;
      let sequenceCleanupTimer = 0;
      let isRevealed = false;

      section.classList.add('is-about-sequence-primed');

      function clearTimers(){
        if (principleTimer) {
          window.clearTimeout(principleTimer);
          principleTimer = 0;
        }
        if (sequenceStartTimer) {
          window.clearTimeout(sequenceStartTimer);
          sequenceStartTimer = 0;
        }
        if (sequenceCleanupTimer) {
          window.clearTimeout(sequenceCleanupTimer);
          sequenceCleanupTimer = 0;
        }
      }

      function resetStack(){
        clearTimers();
        isRevealed = false;
        grid.classList.remove('is-stack-revealed', 'is-stack-primed', 'is-signal-pass');
        section.classList.remove('is-about-sequence-active');
        section.classList.add('is-about-sequence-primed');
      }

      function revealStack(){
        if (isRevealed) return;
        isRevealed = true;
        clearTimers();
        grid.classList.remove('is-stack-revealed', 'is-signal-pass');
        section.classList.remove('is-about-sequence-active');
        grid.classList.add('is-stack-primed');
        section.classList.add('is-about-sequence-primed');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            grid.classList.add('is-stack-revealed');
            grid.classList.add('is-signal-pass');
          });
        });
        principleTimer = window.setTimeout(() => {
          grid.classList.remove('is-stack-primed', 'is-signal-pass');
          principleTimer = 0;
        }, 560);
        sequenceStartTimer = window.setTimeout(() => {
          section.classList.add('is-about-sequence-active');
          sequenceStartTimer = 0;
        }, 260);
        sequenceCleanupTimer = window.setTimeout(() => {
          section.classList.remove('is-about-sequence-primed');
          sequenceCleanupTimer = 0;
        }, 980);
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.28) {
            revealStack();
            return;
          }
          if (entry.intersectionRatio <= 0.05) {
            resetStack();
          }
        });
      }, {
        threshold: [0, 0.05, 0.28],
        rootMargin: '0px 0px -6% 0px'
      });

      observer.observe(section);
    })();

    function setActiveMenu(key){
      qsa('.menu a').forEach(el => el.classList.remove('active-link'));
      const desktopLink = qs(`.menu a[href="#${key}"]`) || qs('.menu a[href="#home"]');
      desktopLink?.classList.add('active-link');

      htmlEl.classList.remove('mode-home','mode-product','mode-digital','mode-process','mode-about','mode-portfolio','mode-contact');
      const cls = key === 'home' ? 'mode-home' :
                  key === 'product-engineering' ? 'mode-product' :
                  key === 'digital-engineering' ? 'mode-digital' :
                  key === 'process' ? 'mode-process' :
                  key === 'about' ? 'mode-about' :
                  key === 'portfolio' ? 'mode-portfolio' :
                  key === 'contact' ? 'mode-contact' : 'mode-home';
      htmlEl.classList.add(cls);

      const active = desktopLink;
      const menu = qs('ul.menu');
      if (navIndicator && active && menu) {
        const r = active.getBoundingClientRect();
        const mr = menu.getBoundingClientRect();
        const pad = 6;
        navIndicator.style.transform = `translate(${r.left - mr.left - pad}px, ${r.top - mr.top - pad}px)`;
        navIndicator.style.width = r.width + pad * 2 + 'px';
        navIndicator.style.height = r.height + pad * 2 + 'px';
      }
    }

    (() => {
      const ids = ['home', 'product-engineering', 'digital-engineering', 'process', 'about', 'portfolio', 'contact'];
      const sections = ids.map(id => qs('#' + id)).filter(Boolean);
      let sectionPositions = [];
      let ticking = false;

      function headerH(){
        return (qs('header')?.offsetHeight || 64);
      }

      function recomputeOffsets(){
        sectionPositions = sections.map(section => ({
          id: section.id,
          top: section.getBoundingClientRect().top + window.scrollY
        }));
      }

      function updateActiveSection(){
        const y = window.scrollY + headerH() + 12;
        let active = 'home';
        for (const section of sectionPositions) {
          if (y >= section.top) active = section.id;
        }
        setActiveMenu(active);
      }

      function onScroll(){
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
      }

      recomputeOffsets();
      updateActiveSection();

      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', () => {
        recomputeOffsets();
        updateActiveSection();
      });
      addEventListener('orientationchange', () => {
        recomputeOffsets();
        updateActiveSection();
      });
      addEventListener('hashchange', () => {
        requestAnimationFrame(() => {
          recomputeOffsets();
          updateActiveSection();
        });
      });
      setTimeout(() => {
        recomputeOffsets();
        updateActiveSection();
      }, 0);
    })();

    // === Hero Canvas Background (interactive mesh) ===
    (() => {
      const canvas = document.getElementById('heroCanvas');
      if (!canvas) return;
      const heroEl = document.querySelector('main.hero') || canvas;
      const orbitEl = heroEl.querySelector('.hero-orbit');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const ctx = canvas.getContext('2d', { alpha: true });

      const BASE = {
        DPR_CAP: 1.25,
        COUNT_DIV: 9800,
        MIN_NODES: 34,
        MAX_NODES: 58,
        MAX_DIST_MIN: 130,
        MAX_DIST_MAX: 210,
        SPEED: 0.30,
        POINTER_RADIUS: 220,
        POINTER_LINK_RADIUS: 168,
        POINTER_PULL: 0.015,
        POINTER_EASE: 0.14,
        FOCUS_X: 0.74,
        FOCUS_Y: 0.50
      };
      const MOBILE = {
        DPR_CAP: 1.0,
        COUNT_DIV: 11800,
        MIN_NODES: 24,
        MAX_NODES: 38,
        MAX_DIST_MIN: 110,
        MAX_DIST_MAX: 170,
        SPEED: 0.24,
        POINTER_RADIUS: 150,
        POINTER_LINK_RADIUS: 120,
        POINTER_PULL: 0.010,
        POINTER_EASE: 0.12,
        FOCUS_X: 0.62,
        FOCUS_Y: 0.42
      };

      let cfg = { ...BASE };
      let w = 0, h = 0, dpr = 1;
      let nodes = [];
      let isDocVisible = document.visibilityState !== 'hidden';
      let isHeroVisible = true;
      const intro = reduceMotion ? null : {
        startedAt: performance.now() + 30,
        duration: 1180,
        active: true,
        direction: 1
      };
      let lastIntroAt = reduceMotion ? 0 : performance.now();
      let lightCurveSamples = [];
      let lightCurveLength = 1;
      let lightOrbitProfile = null;
      let lightOrbitRect = null;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
      const hotspots = [];
      const MAX_HOTSPOTS = 10;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const hypot = (x, y) => Math.hypot(x, y);

      function startIntro(delay = 0, direction = -1){
        if (!intro) return;
        const now = performance.now();
        if (now - lastIntroAt < 900) return;
        intro.startedAt = now + delay;
        intro.active = true;
        intro.direction = direction;
        lastIntroAt = now;
      }

      function setPointerTarget(x, y, active){
        pointer.tx = x;
        pointer.ty = y;
        pointer.active = !!active;
      }

      function findHotspotIndexAt(x, y){
        return hotspots.findIndex((hotspot) => hypot(x - hotspot.x, y - hotspot.y) < 22);
      }

      function addHotspot(x, y){
        if (hotspots.length >= MAX_HOTSPOTS) hotspots.shift();
        let nearest = null;
        let nearestDist = Infinity;
        nodes.forEach((node) => {
          const dist = hypot(node.x - x, node.y - y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = node;
          }
        });
        hotspots.push({
          x,
          y,
          vx: nearest ? nearest.vx : (Math.random() - 0.5) * 0.22,
          vy: nearest ? nearest.vy : (Math.random() - 0.5) * 0.22,
          accent: nearest ? nearest.accent : hotspots.length % 3 === 0,
          pointerBoost: 0,
          pulseStart: performance.now(),
          links: []
        });
      }

      function removeHotspotAt(index){
        if (index < 0 || index >= hotspots.length) return;
        hotspots.splice(index, 1);
      }

      function resetPointer(){
        setPointerTarget(w * cfg.FOCUS_X, h * cfg.FOCUS_Y, false);
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }

      function sizeFromHero(){
        const rect = heroEl.getBoundingClientRect();
        const cw = Math.max(1, Math.floor(rect.width || innerWidth));
        const ch = Math.max(1, Math.floor(rect.height || innerHeight));
        cfg = (cw <= 640) ? { ...MOBILE } : { ...BASE };
        dpr = Math.min(devicePixelRatio || 1, cfg.DPR_CAP);
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        canvas.width = Math.floor(cw * dpr);
        canvas.height = Math.floor(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        w = cw;
        h = ch;
        updateLightOrbitRect();
      }

      function smoothArray(values, radius){
        return values.map((_, index) => {
          let total = 0;
          let count = 0;
          for (let offset = -radius; offset <= radius; offset += 1) {
            const sample = values[index + offset];
            if (typeof sample !== 'number') continue;
            total += sample;
            count += 1;
          }
          return count ? total / count : values[index];
        });
      }

      function updateLightOrbitRect(){
        if (!orbitEl) {
          lightOrbitRect = null;
          return;
        }
        const heroRect = heroEl.getBoundingClientRect();
        const orbitRect = orbitEl.getBoundingClientRect();
        lightOrbitRect = {
          left: orbitRect.left - heroRect.left,
          top: orbitRect.top - heroRect.top,
          width: orbitRect.width,
          height: orbitRect.height
        };
      }

      function prepareLightOrbitProfile(){
        if (!orbitEl || !orbitEl.complete || !orbitEl.naturalWidth || !orbitEl.naturalHeight) return;

        const offscreen = document.createElement('canvas');
        offscreen.width = orbitEl.naturalWidth;
        offscreen.height = orbitEl.naturalHeight;
        const offctx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!offctx) return;
        offctx.drawImage(orbitEl, 0, 0);

        const { data, width, height } = offctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const alphaThreshold = 20;
        const bodyWindow = 14;
        const bodyThreshold = 10;
        const clip = new Array(width);
        const rim = new Array(width);

        for (let x = 0; x < width; x += 1) {
          let topOpaque = height - 1;
          let bodyStart = height - 1;
          let topFound = false;
          let bodyFound = false;

          for (let y = 0; y < height; y += 1) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (!topFound && alpha > alphaThreshold) {
              topOpaque = y;
              topFound = true;
            }
            if (!bodyFound) {
              let solid = 0;
              for (let k = 0; k < bodyWindow && y + k < height; k += 1) {
                if (data[((y + k) * width + x) * 4 + 3] > alphaThreshold) solid += 1;
              }
              if (solid >= bodyThreshold) {
                bodyStart = y;
                bodyFound = true;
              }
            }
            if (topFound && bodyFound) break;
          }

          clip[x] = topOpaque;
          rim[x] = bodyFound ? bodyStart : topOpaque;
        }

        lightOrbitProfile = {
          width,
          height,
          clip,
          rim: smoothArray(rim, 18)
        };
        updateLightOrbitRect();
      }

      function fallbackLightSkyBoundaryY(x){
        const normalizedX = (x - w * 0.5) / (w * 0.5 || 1);
        const bow = normalizedX * normalizedX;
        return h * (0.755 + bow * 0.072);
      }

      function getOrbitProfileY(x, mode = 'rim'){
        if (!lightOrbitProfile || !lightOrbitRect || !lightOrbitRect.width || !lightOrbitRect.height) {
          return null;
        }
        const ratio = clamp((x - lightOrbitRect.left) / lightOrbitRect.width, 0, 1);
        const profile = mode === 'clip' ? lightOrbitProfile.clip : lightOrbitProfile.rim;
        const position = ratio * (profile.length - 1);
        const index = Math.floor(position);
        const next = Math.min(profile.length - 1, index + 1);
        const t = position - index;
        const sourceY = profile[index] + (profile[next] - profile[index]) * t;
        return lightOrbitRect.top + sourceY * (lightOrbitRect.height / lightOrbitProfile.height);
      }

      function createNodes(){
        const count = Math.max(cfg.MIN_NODES, Math.min(cfg.MAX_NODES, Math.round((w * h) / cfg.COUNT_DIV)));
        nodes = Array.from({ length: count }, (_, index) => {
          const rightBias = Math.random() < 0.56;
          const x = rightBias ? w * (0.30 + Math.random() * 0.70) : Math.random() * w * 0.82;
          return {
            x,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.16,
            vy: (Math.random() - 0.5) * 0.16,
            accent: index % 6 === 0,
            pointerBoost: 0
          };
        });
      }

      function resizeMesh(){
        sizeFromHero();
        rebuildLightCurveMap();
        createNodes();
        resetPointer();
        refreshHotspotLinks();
        drawMesh(true);
      }

      function getIntroState(now = performance.now()){
        const darkTheme = getTheme() === 'dark';
        if (!intro || !intro.active) {
          return {
            active: false,
            progress: 1,
            headX: w * 1.2,
            headY: darkTheme ? h * 0.48 : getLightSkyBoundaryY(w * 1.2),
            headS: darkTheme ? 0 : lightCurveLength,
            band: Math.max(120, w * 0.18),
            curved: !darkTheme
          };
        }

        const progress = clamp((now - intro.startedAt) / intro.duration, 0, 1);
        if (progress >= 1) intro.active = false;
        const band = Math.max(120, w * 0.18);
        if (!darkTheme) {
          const headS = intro.direction === -1
            ? lightCurveLength * (1 - progress)
            : lightCurveLength * progress;
          const point = getLightCurvePointAtArc(headS);
          return {
            active: intro.active,
            progress,
            headX: point.x,
            headY: point.y,
            headS,
            band,
            curved: true
          };
        }

        const headX = intro.direction === -1
          ? w * (1.12 - progress * 1.28)
          : w * (-0.12 + progress * 1.28);
        return {
          active: intro.active,
          progress,
          headX,
          headY: darkTheme ? h * 0.48 : getLightSkyBoundaryY(headX),
          headS: 0,
          band,
          curved: false
        };
      }

      function revealForX(x, introState){
        if (!introState.active) return 1;
        if (introState.curved) {
          const pointS = getLightCurveArcAtX(x);
          const sweepDir = intro.direction === -1 ? -1 : 1;
          const revealLead = introState.headS + sweepDir * introState.band * 0.76;
          const revealTrail = introState.band * 2.6;
          return sweepDir === -1
            ? clamp((pointS - revealLead) / revealTrail, 0, 1)
            : clamp((revealLead - pointS) / revealTrail, 0, 1);
        }
        const revealLead = introState.headX + introState.band * 0.76;
        const revealTrail = introState.band * 2.6;
        return clamp((revealLead - x) / revealTrail, 0, 1);
      }

      function pulseForPoint(x, y, introState){
        if (!introState.active) return 0;
        if (introState.curved) {
          const pointS = getLightCurveArcAtX(x);
          const along = clamp(1 - Math.abs(pointS - introState.headS) / (introState.band * 0.95), 0, 1);
          const normal = clamp(1 - Math.abs(y - getLightSkyBoundaryY(x)) / (h * 0.08), 0, 1);
          return along * normal;
        }
        const horizontal = clamp(1 - Math.abs(x - introState.headX) / introState.band, 0, 1);
        const vertical = clamp(1 - Math.abs(y - introState.headY) / (h * 0.44), 0, 1);
        return horizontal * vertical;
      }

      function getLightSkyBoundaryY(x){
        return getOrbitProfileY(x, 'rim') ?? fallbackLightSkyBoundaryY(x);
      }

      function getLightSkyClipY(x){
        const clipY = getOrbitProfileY(x, 'clip');
        if (clipY == null) return getLightSkyBoundaryY(x) - 6;
        return clipY - 4;
      }

      function rebuildLightCurveMap(){
        const samples = [];
        const count = 240;
        let total = 0;
        let prevX = 0;
        let prevY = getLightSkyBoundaryY(0);

        for (let i = 0; i <= count; i += 1) {
          const x = (i / count) * w;
          const y = getLightSkyBoundaryY(x);
          if (i > 0) total += hypot(x - prevX, y - prevY);
          samples.push({ x, y, s: total });
          prevX = x;
          prevY = y;
        }

        lightCurveSamples = samples;
        lightCurveLength = Math.max(total, 1);
      }

      function getLightCurveArcAtX(x){
        if (!lightCurveSamples.length) return 0;
        const clampedX = clamp(x, 0, w);
        for (let i = 1; i < lightCurveSamples.length; i += 1) {
          const a = lightCurveSamples[i - 1];
          const b = lightCurveSamples[i];
          if (clampedX <= b.x) {
            const span = Math.max(1, b.x - a.x);
            const t = (clampedX - a.x) / span;
            return a.s + (b.s - a.s) * t;
          }
        }
        return lightCurveLength;
      }

      function getLightCurvePointAtArc(targetS){
        if (!lightCurveSamples.length) {
          return { x: 0, y: 0, s: 0 };
        }

        const clampedS = clamp(targetS, 0, lightCurveLength);
        for (let i = 1; i < lightCurveSamples.length; i += 1) {
          const a = lightCurveSamples[i - 1];
          const b = lightCurveSamples[i];
          if (clampedS <= b.s) {
            const span = Math.max(0.001, b.s - a.s);
            const t = (clampedS - a.s) / span;
            return {
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
              s: clampedS
            };
          }
        }

        const last = lightCurveSamples[lightCurveSamples.length - 1];
        return { x: last.x, y: last.y, s: lightCurveLength };
      }

      function clipToLightSky(){
        const samples = 96;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        for (let i = samples; i >= 0; i -= 1) {
          const x = (i / samples) * w;
          ctx.lineTo(x, getLightSkyClipY(x));
        }
        ctx.closePath();
        ctx.clip();
      }

      function getLightCurveSegment(centerS, halfLength){
        if (!lightCurveSamples.length) return [];
        return lightCurveSamples.filter((sample) => Math.abs(sample.s - centerS) <= halfLength);
      }

      function strokeCurve(samples){
        if (!samples.length) return;
        ctx.beginPath();
        samples.forEach((sample, index) => {
          if (index === 0) ctx.moveTo(sample.x, sample.y);
          else ctx.lineTo(sample.x, sample.y);
        });
      }

      function drawLightOrbitRim(introState){
        if (!lightCurveSamples.length || !introState.curved || !introState.active) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const visible = getLightCurveSegment(introState.headS, introState.band * 0.9);
        if (visible.length > 1) {
          strokeCurve(visible);
          ctx.strokeStyle = 'rgba(110,244,233,0.20)';
          ctx.lineWidth = Math.max(7, w * 0.0052);
          ctx.shadowColor = 'rgba(110,244,233,0.28)';
          ctx.shadowBlur = 16;
          ctx.stroke();

          strokeCurve(visible);
          ctx.strokeStyle = 'rgba(246,250,249,0.64)';
          ctx.lineWidth = Math.max(2, w * 0.0019);
          ctx.shadowBlur = 0;
          ctx.stroke();
        }

        ctx.restore();
      }

      function drawAmbientWash(introState){
        const glow = ctx.createRadialGradient(w * cfg.FOCUS_X, h * cfg.FOCUS_Y, Math.max(18, w * 0.02), w * cfg.FOCUS_X, h * cfg.FOCUS_Y, Math.max(220, w * 0.32));
        glow.addColorStop(0, 'rgba(95,230,221,0.14)');
        glow.addColorStop(0.32, 'rgba(26,183,173,0.11)');
        glow.addColorStop(0.62, 'rgba(246,182,84,0.08)');
        glow.addColorStop(1, 'rgba(95,230,221,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const fullWash = ctx.createLinearGradient(0, 0, w, 0);
        fullWash.addColorStop(0, 'rgba(95,230,221,0.045)');
        fullWash.addColorStop(0.56, 'rgba(255,255,255,0)');
        fullWash.addColorStop(1, 'rgba(246,182,84,0.035)');
        ctx.fillStyle = fullWash;
        ctx.fillRect(0, 0, w, h);

        if (introState.active) {
          const pulseGlow = ctx.createRadialGradient(
            introState.headX,
            introState.headY,
            0,
            introState.headX,
            introState.headY,
            introState.curved ? introState.band * 0.9 : introState.band * 1.4
          );
          pulseGlow.addColorStop(0, 'rgba(110,244,233,0.22)');
          pulseGlow.addColorStop(0.28, 'rgba(110,244,233,0.13)');
          pulseGlow.addColorStop(0.48, 'rgba(246,182,84,0.12)');
          pulseGlow.addColorStop(1, 'rgba(110,244,233,0)');
          ctx.fillStyle = pulseGlow;
          ctx.fillRect(0, 0, w, h);
        }

      }

      function updatePointer(){
        pointer.x += (pointer.tx - pointer.x) * cfg.POINTER_EASE;
        pointer.y += (pointer.ty - pointer.y) * cfg.POINTER_EASE;
      }

      function updateNodes(){
        const targetX = pointer.active ? pointer.x : w * cfg.FOCUS_X;
        const targetY = pointer.active ? pointer.y : h * cfg.FOCUS_Y;

        nodes.forEach((node) => {
          function applyInfluence(originX, originY, radius, pullScale){
            const dx = originX - node.x;
            const dy = originY - node.y;
            const dist = hypot(dx, dy) || 1;
            const influence = clamp(1 - dist / radius, 0, 1);
            if (influence > 0) {
              node.x += (dx / dist) * cfg.POINTER_PULL * pullScale * influence * Math.min(24, dist);
              node.y += (dy / dist) * cfg.POINTER_PULL * pullScale * influence * Math.min(24, dist);
            }
            return influence;
          }

          const ambientRadius = Math.min(cfg.POINTER_RADIUS * 0.7, Math.max(140, w * 0.18));
          const ambientBoost = applyInfluence(w * cfg.FOCUS_X, h * cfg.FOCUS_Y, ambientRadius, pointer.active ? 0.14 : 0.30);
          const pointerBoost = pointer.active ? applyInfluence(targetX, targetY, cfg.POINTER_RADIUS, 1) : 0;

          node.pointerBoost = pointer.active ? pointerBoost : ambientBoost * 0.36;

          node.x += node.vx * cfg.SPEED;
          node.y += node.vy * cfg.SPEED;

          if (node.x < -20) node.x = w + 20;
          if (node.x > w + 20) node.x = -20;
          if (node.y < -20) node.y = h + 20;
          if (node.y > h + 20) node.y = -20;
        });
      }

      function updateHotspots(){
        const targetX = pointer.active ? pointer.x : w * cfg.FOCUS_X;
        const targetY = pointer.active ? pointer.y : h * cfg.FOCUS_Y;

        hotspots.forEach((hotspot) => {
          function applyInfluence(originX, originY, radius, pullScale){
            const dx = originX - hotspot.x;
            const dy = originY - hotspot.y;
            const dist = hypot(dx, dy) || 1;
            const influence = clamp(1 - dist / radius, 0, 1);
            if (influence > 0) {
              hotspot.x += (dx / dist) * cfg.POINTER_PULL * pullScale * influence * Math.min(24, dist);
              hotspot.y += (dy / dist) * cfg.POINTER_PULL * pullScale * influence * Math.min(24, dist);
            }
            return influence;
          }

          const ambientRadius = Math.min(cfg.POINTER_RADIUS * 0.7, Math.max(140, w * 0.18));
          const ambientBoost = applyInfluence(w * cfg.FOCUS_X, h * cfg.FOCUS_Y, ambientRadius, pointer.active ? 0.14 : 0.30);
          const pointerBoost = pointer.active ? applyInfluence(targetX, targetY, cfg.POINTER_RADIUS, 1) : 0;
          hotspot.pointerBoost = pointer.active ? pointerBoost : ambientBoost * 0.36;

          hotspot.x += hotspot.vx * cfg.SPEED;
          hotspot.y += hotspot.vy * cfg.SPEED;

          if (hotspot.x < -20) hotspot.x = w + 20;
          if (hotspot.x > w + 20) hotspot.x = -20;
          if (hotspot.y < -20) hotspot.y = h + 20;
          if (hotspot.y > h + 20) hotspot.y = -20;
        });
      }

      function refreshHotspotLinks(){
        if (!hotspots.length) {
          return;
        }

        const radius = cfg.POINTER_LINK_RADIUS * 1.06;
        const maxLinks = w <= 640 ? 8 : 10;
        hotspots.forEach((hotspot) => {
          hotspot.links = nodes
            .map((node, index) => ({
              index,
              distance: hypot(node.x - hotspot.x, node.y - hotspot.y)
            }))
            .filter((item) => item.distance < radius)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxLinks)
            .map((item) => ({
              index: item.index,
              strength: clamp(1 - item.distance / radius, 0, 1)
            }));
        });
      }

      function drawPointerField(){
        if (!pointer.active) return;

        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, cfg.POINTER_RADIUS * 0.82);
        glow.addColorStop(0, 'rgba(95,230,221,0.16)');
        glow.addColorStop(0.46, 'rgba(246,182,84,0.09)');
        glow.addColorStop(1, 'rgba(95,230,221,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, cfg.POINTER_RADIUS * 0.82, 0, Math.PI * 2);
        ctx.fill();

        nodes.forEach((node) => {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const dist = hypot(dx, dy);
          if (dist >= cfg.POINTER_LINK_RADIUS) return;

          const t = 1 - dist / cfg.POINTER_LINK_RADIUS;
          ctx.strokeStyle = node.accent
            ? `rgba(246,182,84,${(0.08 + t * 0.22).toFixed(3)})`
            : `rgba(95,230,221,${(0.09 + t * 0.26).toFixed(3)})`;
          ctx.lineWidth = 1 + t * 1.35;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        });
      }

      function drawHotspotField(hotspot, now){
        if (!hotspot) return;

        const hotspotRadius = cfg.POINTER_RADIUS * 0.96;
        const glow = ctx.createRadialGradient(hotspot.x, hotspot.y, 0, hotspot.x, hotspot.y, hotspotRadius * 0.9);
        if (hotspot.accent) {
          glow.addColorStop(0, 'rgba(246,182,84,0.15)');
          glow.addColorStop(0.36, 'rgba(246,182,84,0.10)');
          glow.addColorStop(1, 'rgba(246,182,84,0)');
        } else {
          glow.addColorStop(0, 'rgba(95,230,221,0.15)');
          glow.addColorStop(0.36, 'rgba(95,230,221,0.11)');
          glow.addColorStop(1, 'rgba(95,230,221,0)');
        }
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(hotspot.x, hotspot.y, hotspotRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();

        hotspot.links.forEach((link) => {
          const node = nodes[link.index];
          if (!node) return;
          const t = link.strength;
          ctx.strokeStyle = node.accent
            ? `rgba(246,182,84,${(0.12 + t * 0.26).toFixed(3)})`
            : `rgba(95,230,221,${(0.12 + t * 0.28).toFixed(3)})`;
          ctx.lineWidth = 1.15 + t * 1.55;
          ctx.beginPath();
          ctx.moveTo(hotspot.x, hotspot.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        });

        const elapsed = hotspot.pulseStart < 0 ? 9999 : now - hotspot.pulseStart;
        const duration = 900;
        if (elapsed < duration) {
          const t = elapsed / duration;
          const radius = 14 + hotspotRadius * 0.92 * t;
          const alpha = (1 - t) * 0.34;
          ctx.strokeStyle = hotspot.accent
            ? `rgba(246,182,84,${alpha.toFixed(3)})`
            : `rgba(95,230,221,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.4 + (1 - t) * 1.4;
          ctx.beginPath();
          ctx.arc(hotspot.x, hotspot.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = hotspot.accent ? 'rgba(246,182,84,0.22)' : 'rgba(96,238,228,0.24)';
        ctx.beginPath();
        ctx.arc(hotspot.x, hotspot.y, hotspot.accent ? 13.6 : 12.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hotspot.accent ? 'rgba(246,182,84,0.92)' : 'rgba(96,238,228,0.94)';
        ctx.beginPath();
        ctx.arc(hotspot.x, hotspot.y, hotspot.accent ? 5.2 : 4.9, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawMesh(skipMotion, now = performance.now()){
        ctx.clearRect(0, 0, w, h);
        const darkTheme = getTheme() === 'dark';
        const introState = getIntroState(now);
        if (!darkTheme) {
          ctx.save();
          clipToLightSky();
        }
        drawAmbientWash(introState);

        if (!skipMotion) {
          updatePointer();
          updateNodes();
          updateHotspots();
        }
        refreshHotspotLinks();

        const hotspotLinkBoosts = new Map();
        hotspots.forEach((hotspot) => {
          hotspot.links.forEach((link) => {
            const current = hotspotLinkBoosts.get(link.index) || 0;
            if (link.strength > current) hotspotLinkBoosts.set(link.index, link.strength);
          });
        });

        const maxDistance = Math.min(cfg.MAX_DIST_MAX, Math.max(cfg.MAX_DIST_MIN, Math.min(w, h) * 0.3));
        const maxDistanceSq = maxDistance * maxDistance;

        for (let i = 0; i < nodes.length; i += 1) {
          const a = nodes[i];

          for (let j = i + 1; j < nodes.length; j += 1) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq >= maxDistanceSq) continue;

            const distance = Math.sqrt(distanceSq);
            const avgX = (a.x + b.x) * 0.5;
            const avgY = (a.y + b.y) * 0.5;
            const regionBoost = avgX > w * 0.62 ? 1.24 : avgX > w * 0.34 ? 1.02 : 0.82;
            const pointerBoost = pointer.active
              ? clamp(1 - hypot(avgX - pointer.x, avgY - pointer.y) / (cfg.POINTER_RADIUS * 1.16), 0, 1)
              : 0;
            const alpha = 0.08 + (1 - distance / maxDistance) * 0.2;
            const introReveal = revealForX(avgX, introState);
            const introPulse = pulseForPoint(avgX, avgY, introState);
            const introVisibility = introState.active
              ? clamp(introReveal * 1.06 + introPulse * 0.78, 0, 1)
              : 1;
            const tunedAlpha = (alpha * regionBoost + pointerBoost * 0.16) * introVisibility + introPulse * 0.12;
            const hasAccent = a.accent || b.accent;

            ctx.strokeStyle = hasAccent
              ? `rgba(246,182,84,${Math.min(0.42, tunedAlpha * 0.98).toFixed(3)})`
              : `rgba(43,156,189,${Math.min(0.56, tunedAlpha * 1.14).toFixed(3)})`;
            ctx.lineWidth =
              (0.95 + (1 - distance / maxDistance) * 1.02) * Math.max(0.86, regionBoost) +
              pointerBoost * 0.7 +
              introPulse * 0.82;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        drawPointerField();
        hotspots.forEach((hotspot) => drawHotspotField(hotspot, now));

        nodes.forEach((node, index) => {
          const regionBoost = node.x > w * 0.62 ? 1.28 : node.x > w * 0.34 ? 1.06 : 0.86;
          const hoverPulse = pointer.active ? node.pointerBoost * 0.48 : node.pointerBoost * 0.14;
          const pinPulse = (hotspotLinkBoosts.get(index) || 0) * 0.82;
          const introReveal = revealForX(node.x, introState);
          const introPulse = pulseForPoint(node.x, node.y, introState);
          const introVisibility = introState.active
            ? clamp(introReveal * 1.08 + introPulse * 0.74, 0, 1)
            : 1;
          const outerRadius =
            (node.accent ? 8.8 : 6.4) * Math.max(0.88, regionBoost) * (0.72 + introVisibility * 0.28) +
            hoverPulse * 5.1 +
            pinPulse * 7.1 +
            introPulse * 2.6;
          const innerRadius =
            (node.accent ? 2.35 : 1.85) * Math.max(0.92, regionBoost) * (0.78 + introVisibility * 0.22) +
            hoverPulse * 1.24 +
            pinPulse * 1.72 +
            introPulse * 0.82;

          ctx.beginPath();
          ctx.fillStyle = node.accent
            ? `rgba(246,182,84,${Math.min(0.72, (0.14 * regionBoost + hoverPulse * 0.16 + pinPulse * 0.24) * introVisibility + introPulse * 0.22).toFixed(3)})`
            : `rgba(74,198,222,${Math.min(0.74, (0.18 * regionBoost + hoverPulse * 0.18 + pinPulse * 0.24) * introVisibility + introPulse * 0.24).toFixed(3)})`;
          ctx.arc(node.x, node.y, outerRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = node.accent
            ? `rgba(246,182,84,${Math.min(0.98, (0.56 + regionBoost * 0.34 + hoverPulse * 0.24 + pinPulse * 0.18) * introVisibility + introPulse * 0.16).toFixed(3)})`
            : `rgba(23,163,193,${Math.min(0.98, (0.56 + regionBoost * 0.34 + hoverPulse * 0.24 + pinPulse * 0.18) * introVisibility + introPulse * 0.18).toFixed(3)})`;
          ctx.arc(node.x, node.y, innerRadius, 0, Math.PI * 2);
          ctx.fill();
        });

        if (!darkTheme) {
          ctx.restore();
          drawLightOrbitRim(introState);
        }
      }

      let last = 0;
      const FRAME_MS = 1000 / 60;
      function loop(now = performance.now()){
        if (reduceMotion) return;
        requestAnimationFrame(loop);
        if (!isDocVisible || !isHeroVisible) return;
        if (now - last < FRAME_MS * 0.9) return;
        last = now;
        drawMesh(false, now);
      }

      try {
        const obs = new IntersectionObserver((entries) => {
          const nextVisible = entries.some((entry) => entry.isIntersecting);
          if (nextVisible && !isHeroVisible) {
            startIntro(40, -1);
          }
          isHeroVisible = nextVisible;
        }, { root: null, threshold: 0.08 });
        obs.observe(heroEl);
      } catch(_) { /* noop */ }

      if (pointerFine && !reduceMotion) {
        heroEl.addEventListener('pointermove', (event) => {
          const rect = heroEl.getBoundingClientRect();
          setPointerTarget(event.clientX - rect.left, event.clientY - rect.top, true);
        });
        heroEl.addEventListener('pointerleave', () => {
          setPointerTarget(w * cfg.FOCUS_X, h * cfg.FOCUS_Y, false);
        });
      }

      heroEl.addEventListener('click', (event) => {
        if (event.target && event.target.closest && event.target.closest('a, button')) return;
        const rect = heroEl.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hotspotIndex = findHotspotIndexAt(x, y);
        if (hotspotIndex !== -1) {
          removeHotspotAt(hotspotIndex);
          if (reduceMotion) drawMesh(true, performance.now());
          return;
        }
        addHotspot(x, y);
        if (reduceMotion) drawMesh(true, performance.now());
      });

      if (orbitEl) {
        if (orbitEl.complete) {
          prepareLightOrbitProfile();
        } else {
          orbitEl.addEventListener('load', () => {
            prepareLightOrbitProfile();
            resizeMesh();
          }, { once: true });
        }
      }

      resizeMesh();
      if (!reduceMotion) requestAnimationFrame(loop);
      addEventListener('resize', resizeMesh);
      document.addEventListener('visibilitychange', () => {
        isDocVisible = (document.visibilityState === 'visible');
        if (isDocVisible) resizeMesh();
      });
    })();
