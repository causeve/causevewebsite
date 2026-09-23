(() => {
  const carousel = document.querySelector('.hero-visual');
  if (!carousel) return;

  const slides = [
    { src: 'asset/hero/3.png', title: 'Connected Engineering', alt: 'Connected devices, gateways, and embedded engineering' },
    { src: 'asset/Product/1.png', title: 'Embedded Firmware', alt: 'Embedded board with firmware, Bluetooth, and sensor interfaces' },
    { src: 'asset/Product/2.png', title: 'Device & Gateway Integration', alt: 'Connected software and Linux gateway integration' },
    { src: 'asset/Digi/1.png', title: 'IoT Platforms', alt: 'Connected device data and IoT platform architecture' },
    { src: 'asset/Digi/2.png', title: 'AI & Operational Analytics', alt: 'Analytics and intelligence for connected operations' },
    { src: 'asset/Digi/3.png', title: 'Web & Mobile Applications', alt: 'Web and mobile interfaces for connected systems' },
    { src: 'asset/process/1.png', title: 'Research to Implementation', alt: 'Engineering workflow from research to implementation' },
  ];
  const interval = 5000;
  const images = [...carousel.querySelectorAll('.hero-slide')];
  const echo = carousel.querySelector('.hero-echo');
  const controls = carousel.querySelector('.hero-controls');
  const title = carousel.querySelector('[data-carousel="title"]');
  const count = carousel.querySelector('[data-carousel="count"]');
  const pause = carousel.querySelector('[data-carousel="pause"]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let current = 0;
  let active = 0;
  let timer;
  let busy = false;
  let visible = true;
  let paused = motion.matches;

  // Load and decode before displaying; only fetch the next image ahead of time.
  function prepare(index) {
    if (!cache.has(index)) {
      const image = new Image();
      image.src = slides[index].src;
      cache.set(index, image.decode().then(() => true).catch(() => false));
    }
    return cache.get(index);
  }

  function canPlay() {
    return !paused && visible && !document.hidden;
  }

  function schedule() {
    clearTimeout(timer);
    if (canPlay() && !busy) {
      prepare((current + 1) % slides.length);
      timer = setTimeout(() => show(1, true), interval);
    }
  }

  function updatePause() {
    pause.textContent = paused ? '\u25b6' : '\u275a\u275a';
    pause.setAttribute('aria-label', paused ? 'Play image slideshow' : 'Pause image slideshow');
    schedule();
  }

  async function show(direction, automatic = false) {
    if (busy) return;
    busy = true;
    clearTimeout(timer);
    try {
      let next = current;
      let ready = false;
      for (let attempt = 0; attempt < slides.length - 1; attempt += 1) {
        next = (next + direction + slides.length) % slides.length;
        if (await prepare(next)) { ready = true; break; }
      }
      if (!ready || (automatic && !canPlay())) return;
      const incoming = images[1 - active];
      const outgoing = images[active];
      incoming.src = slides[next].src;
      await incoming.decode();
      if (automatic && !canPlay()) return;
      incoming.alt = slides[next].alt;
      incoming.classList.toggle('hero-slide--photo', Boolean(slides[next].photo));
      incoming.removeAttribute('aria-hidden');
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.classList.add('is-active');
      outgoing.classList.remove('is-active');
      echo.src = slides[next].src;
      // Portrait project photos keep a clean frame without a blurred duplicate.
      echo.hidden = Boolean(slides[next].photo);
      current = next;
      active = 1 - active;
      title.textContent = slides[current].title;
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
      carousel.dataset.slide = String(current + 1);
      await new Promise(resolve => setTimeout(resolve, motion.matches ? 0 : 720));
    } catch (_) {
      // Preserve the current image if a requested asset cannot be decoded.
    } finally {
      busy = false;
      schedule();
    }
  }

  count.textContent = `01 / ${slides.length}`;
  controls.hidden = false;
  carousel.dataset.slide = '1';
  carousel.querySelector('[data-carousel="previous"]').addEventListener('click', () => show(-1));
  carousel.querySelector('[data-carousel="next"]').addEventListener('click', () => show(1));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', event => { paused = event.matches; updatePause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      schedule();
    }, { threshold: 0.15 }).observe(carousel);
  }
  updatePause();
})();
