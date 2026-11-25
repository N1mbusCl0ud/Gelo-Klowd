// controller.js  (needs model.js and view.js loaded first)

/* =========================================================
   CONTROLLER  (reacts to the visitor, then updates Model and View)
   ========================================================= */
const Controller = {

  // Numbers used by the scrolling carousel
  maxX: 0, extra: 300, ratio: 1, pinTop: 0,

  // Runs once when the page loads
  init() {
    // 1. Ask the View to draw everything from the Model
    View.splitName();
    View.renderAbout(Model.profile, Model.stats());
    View.renderMarquee(Model.skills);
    View.renderTimeline(Model.timeline);
    View.renderSkills(Model.skills);
    View.renderProjects(Model.projects, Model.illustrations);
    View.renderContact(Model.profile);
    View.setYear(new Date().getFullYear());

    // 2. Start listening for what the visitor does
    this.bindMenu();
    this.bindNavHighlight();
    this.bindGlow();
    this.bindAvatar();
    this.bindCarousel();
    this.bindPageProgress();
    this.bindForm();
    this.startTyping();
    this.startEffects();
    this.startVisitors();
    this.bindGuestForm();
    this.bindPalette();
    this.bindModal();
    this.startClock();
    document.getElementById("topBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  },

  // Animation and interaction extras (see effects.js)
  startEffects() {
    Effects.reveal(View.markReveal());                                  // fade in on scroll + number counters
    Effects.network(document.getElementById("net"));                    // moving dots behind the hero
    Effects.cursor(document.getElementById("cursor"));                  // trailing ring
    Effects.magnetic(document.querySelectorAll(".btn, .links.icons a")); // magnetic buttons
    Effects.tilt(View.el.track, ".card");                               // 3D tilt on project cards
    Effects.spotlight(View.el.skillsList, ".chip");                     // glow inside skill chips
  },

  // Mobile menu: Menu button and link taps
  bindMenu() {
    View.el.menuBtn.addEventListener("click", () => {
      Model.setMenuOpen(!Model.state.menuOpen);
      View.setMenu(Model.state.menuOpen);
    });
    View.el.menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      Model.setMenuOpen(false);
      View.setMenu(false);
    }));
  },

  // Highlight the nav link of the section on screen
  bindNavHighlight() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) View.setActiveLink(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach(s => observer.observe(s));
  },

  // Hero glow follows the mouse
  bindGlow() {
    document.getElementById("home").addEventListener("mousemove", e => {
      View.moveGlow((e.clientX / window.innerWidth - 0.5) * 120, (e.clientY / window.innerHeight - 0.5) * 80);
      View.setParallax(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    });
  },

  // Avatar eyes follow the cursor while it is over the box
  bindAvatar() {
    const box = View.el.avatar;
    box.addEventListener("pointermove", e => {
      const r = View.avatarRect();
      const clamp = n => Math.max(-1, Math.min(1, n));
      View.lookAt(clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2)),
                  clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    });
    box.addEventListener("pointerleave", () => View.lookAt(0, 0));   // look straight ahead again
    box.addEventListener("click", () => Effects.cloudBurst(box));    // click the avatar for a surprise
  },

  // Page scrolling moves the carousel sideways
  bindCarousel() {
    window.addEventListener("scroll", () => this.updateCarousel(), { passive: true });
    window.addEventListener("resize", () => this.measureCarousel());
    window.addEventListener("load", () => this.measureCarousel());
    // Arrow buttons scroll the page by the amount that moves the cards one step
    View.el.prev.addEventListener("click", () => window.scrollBy({ top: -View.cardStep() * this.ratio, behavior: "smooth" }));
    View.el.next.addEventListener("click", () => window.scrollBy({ top: View.cardStep() * this.ratio, behavior: "smooth" }));
    this.measureCarousel();
  },
  measureCarousel() {
    const m = View.measureCarousel();
    this.maxX = m.maxX;
    this.pinTop = m.pinTop;
    this.extra = Math.max(this.maxX * 2.2, 300);          // page distance used while the cards move
    this.ratio = this.extra / Math.max(this.maxX, 1);
    View.setSectionHeight(m.pinHeight + this.extra);
    this.updateCarousel();
  },
  updateCarousel() {
    Model.setCarouselProgress((this.pinTop - View.sectionTop()) / this.extra);
    View.moveCarousel(Model.state.carouselProgress, this.maxX);
  },

  // Thin bar at the top showing how far down the page you are
  bindPageProgress() {
    window.addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max * 100 : 0;
      View.setPageProgress(pct);
      View.setTopProgress(pct, window.scrollY > 600);
    }, { passive: true });
  },

  // Contact form: opens the visitor's email app
  bindForm() {
    document.getElementById("contactForm").addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const message = document.getElementById("msg").value;
      window.location.href = Model.mailLink(name, message);
      View.setFormNote("Opening your email app…");
    });
  },

  // ----- Visitors: count this visit, then show the numbers and the guestbook -----
  async startVisitors() {
    const saved = Model.savedName();
    if (saved) { View.prefillName(saved); View.setGreeting(saved); }   // welcome returning visitors
    await Model.recordVisit();
    this.showVisitors(true);
  },
  showVisitors(countUp) {
    View.renderVisitors(Model.visitors, Model.topCountries(8));
    const box = document.querySelector(".v-stats");
    if (countUp && box.classList.contains("in")) Effects.countUp(box);   // if it is already on screen, count now
  },
  bindGuestForm() {
    const form = document.getElementById("guestForm");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = new FormData(form);
      if (data.get("website")) return;                    // hidden field: only bots fill it in
      const name = String(data.get("gname")).trim();
      View.setGuestNote("Saving…");
      try {
        await Model.sign(name, String(data.get("gmsg")));
        this.showVisitors(false);
        View.setGuestNote("");
        form.querySelector("textarea").value = "";
        View.setGreeting(name);
        View.toast("Thanks for signing, " + name + "!");
        Effects.cloudBurst(form.querySelector("button"));
      } catch (err) {
        View.setGuestNote(err.message);
      }
    });
  },

  // ----- Ctrl+K quick navigation -----
  pal: { items: [], active: 0 },
  bindPalette() {
    const input = document.getElementById("paletteInput");
    const refresh = () => {
      const q = input.value.trim().toLowerCase();
      this.pal.items = Model.commands.filter(c => c.label.toLowerCase().includes(q));
      this.pal.active = 0;
      View.renderPalette(this.pal.items, this.pal.active);
    };
    const open = () => { View.openPalette(); refresh(); };
    document.getElementById("paletteBtn").addEventListener("click", open);
    input.addEventListener("input", refresh);
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); View.paletteIsOpen() ? View.closePalette() : open(); return; }
      if (!View.paletteIsOpen()) return;
      if (e.key === "Escape") View.closePalette();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = this.pal.items.length || 1;
        this.pal.active = (this.pal.active + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
        View.renderPalette(this.pal.items, this.pal.active);
      }
      if (e.key === "Enter" && this.pal.items[this.pal.active]) this.runCommand(this.pal.items[this.pal.active]);
    });
    document.getElementById("paletteList").addEventListener("click", e => {
      const li = e.target.closest("li[data-i]");
      if (li) this.runCommand(this.pal.items[Number(li.dataset.i)]);
    });
    document.getElementById("palette").addEventListener("click", e => { if (e.target.id === "palette") View.closePalette(); });
  },
  runCommand(cmd) {
    View.closePalette();
    if (cmd.go) { document.querySelector(cmd.go).scrollIntoView({ behavior: "smooth" }); return; }
    if (cmd.action === "copyEmail") {
      (navigator.clipboard ? navigator.clipboard.writeText(Model.profile.email) : Promise.reject()).then(
        () => View.toast("Email copied: " + Model.profile.email), () => View.toast(Model.profile.email));
    } else if (cmd.action === "linkedin" || cmd.action === "github") {
      window.open(Model.profile.links[cmd.action], "_blank", "noopener");
    }
  },

  // ----- Project pop-up: click a card (or press Enter on it) -----
  modalIndex: 0, lastFocus: null,
  bindModal() {
    const show = (i, trigger) => {
      if (trigger) this.lastFocus = trigger;
      const n = Model.projects.length;
      this.modalIndex = (i + n) % n;
      View.openProject(Model.projects[this.modalIndex], Model.illustrations);
    };
    View.el.track.addEventListener("click", e => { const c = e.target.closest(".card"); if (c) show(Number(c.dataset.i), c); });
    View.el.track.addEventListener("keydown", e => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches(".card")) { e.preventDefault(); show(Number(e.target.dataset.i), e.target); }
    });
    const close = () => { View.closeProject(); if (this.lastFocus) this.lastFocus.focus(); };
    document.getElementById("modalClose").addEventListener("click", close);
    document.getElementById("modalPrev").addEventListener("click", () => show(this.modalIndex - 1));
    document.getElementById("modalNext").addEventListener("click", () => show(this.modalIndex + 1));
    document.getElementById("modal").addEventListener("click", e => { if (e.target.id === "modal") close(); });
    document.addEventListener("keydown", e => {
      if (!View.modalIsOpen()) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(this.modalIndex + 1);
      if (e.key === "ArrowLeft") show(this.modalIndex - 1);
    });
  },

  // Footer clock
  startClock() {
    View.setClock(Model.clockText());
    setInterval(() => View.setClock(Model.clockText()), 30000);
  },

  // Typing effect: types a word, pauses, deletes it, then the next one
  startTyping() {
    const words = Model.profile.roles;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      View.setTyped("IT support, networks and databases");   // no animation for people who prefer less motion
      return;
    }
    let w = 0, c = 0, deleting = false;
    const tick = () => {
      const word = words[w];
      View.setTyped(word.slice(0, c));
      if (!deleting && c === word.length) { deleting = true; return setTimeout(tick, 1400); }
      if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; }
      c += deleting ? -1 : 1;
      setTimeout(tick, deleting ? 40 : 80);
    };
    tick();
  }
};

// Start the app
Controller.init();
