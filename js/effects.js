// effects.js  (pure visual effects; the Controller decides when to start them)
// Load order: model.js, view.js, effects.js, controller.js

// People who prefer less motion get a calmer page: no loops, no tilt, no custom cursor
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;   // true for a mouse, false for touch

const Effects = {

  // ----- Fade and slide elements in when they scroll into view -----
  reveal(elements) {
    if (REDUCED || !("IntersectionObserver" in window)) {
      elements.forEach(el => { el.classList.add("in"); this.countUp(el); });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");   // CSS does the animation once ".in" is added
        this.countUp(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    elements.forEach(el => observer.observe(el));
  },

  // ----- Numbers that count up (any element with data-count="12") -----
  countUp(root) {
    root.querySelectorAll("[data-count]").forEach(el => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const to = Number(el.dataset.count);
      if (REDUCED) { el.textContent = to; return; }
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / 1200);
        el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));   // eases out
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },

  // ----- Hero background: a drifting network of dots (fits "networks and databases") -----
  network(canvas) {
    const hero = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const rgb = "143,184,255";               // same sky blue as --accent
    let w = 0, h = 0, nodes = [], running = false, raf = 0;
    const mouse = { x: -999, y: -999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, Math.max(22, w * h / 16000)));   // fewer dots on small screens
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8
      }));
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const a of nodes) {
        if (running) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        // Dots near the cursor lean toward it and connect to it
        const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
        if (d < 170) {
          if (running) { a.x += dx * 0.004; a.y += dy * 0.004; }
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / 170) * 0.55})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${rgb},0.7)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      // Lines between dots that are close to each other
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / 130) * 0.22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
    };

    const loop = () => { draw(); if (running) raf = requestAnimationFrame(loop); };
    const start = () => { if (!running && !REDUCED) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    window.addEventListener("resize", resize);
    // Save battery: only animate while the hero is on screen and the tab is visible
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    resize();
  },

  // ----- A soft ring that trails the mouse and grows over clickable things -----
  cursor(ring) {
    if (REDUCED || !FINE_POINTER) return;
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; ring.classList.add("on"); });
    document.documentElement.addEventListener("mouseleave", () => ring.classList.remove("on"));
    document.addEventListener("pointerover", e => {
      ring.classList.toggle("big", !!e.target.closest("a, button, .card, .chip, .avatar, input, textarea"));
    });
    const loop = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;     // easing makes the ring lag behind a little
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  },

  // ----- Buttons that lean toward the cursor like a magnet -----
  magnetic(elements) {
    if (REDUCED || !FINE_POINTER) return;
    elements.forEach(el => {
      el.classList.add("magnetic");
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left - r.width / 2) * 0.3 + "px");
        el.style.setProperty("--my", (e.clientY - r.top - r.height / 2) * 0.3 + "px");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });
  },

  // ----- 3D tilt with a light glare on cards (works for cards added later too) -----
  tilt(root, selector) {
    if (REDUCED || !FINE_POINTER) return;
    root.addEventListener("pointermove", e => {
      const card = e.target.closest(selector);
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.transition = "border-color .25s";    // no slow easing while following the mouse
      card.style.transform = `perspective(800px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-6px)`;
      card.style.setProperty("--gx", px * 100 + "%");
      card.style.setProperty("--gy", py * 100 + "%");
    });
    root.addEventListener("pointerout", e => {
      const card = e.target.closest(selector);
      if (card && !card.contains(e.relatedTarget)) { card.style.transition = ""; card.style.transform = ""; }
    });
  },

  // ----- A glow that follows the cursor inside each skill chip -----
  spotlight(root, selector) {
    if (REDUCED || !FINE_POINTER) return;
    root.addEventListener("pointermove", e => {
      const chip = e.target.closest(selector);
      if (!chip) return;
      const r = chip.getBoundingClientRect();
      chip.style.setProperty("--gx", e.clientX - r.left + "px");
      chip.style.setProperty("--gy", e.clientY - r.top + "px");
    });
  }
};
