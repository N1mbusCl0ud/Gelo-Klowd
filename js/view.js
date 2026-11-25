// view.js  (needs model.js loaded first)

/* =========================================================
   VIEW  (the only place that reads or changes the HTML)
   ========================================================= */
const View = {

  // Shortcuts to the page elements the View needs
  el: {
    menuBtn: document.getElementById("menuBtn"),
    menu: document.getElementById("menu"),
    aboutText: document.getElementById("aboutText"),
    timeline: document.getElementById("timeline"),
    skillsList: document.getElementById("skillsList"),
    section: document.getElementById("projects"),
    pin: document.querySelector("#projects .pin"),
    track: document.getElementById("track"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    barFill: document.getElementById("barFill"),
    pageProgress: document.getElementById("pageProgress"),
    typed: document.getElementById("typed"),
    avatar: document.getElementById("avatar"),
    pupils: document.querySelectorAll("#avatar .pupil"),
    glow: document.getElementById("glow"),
    formNote: document.getElementById("formNote"),
    year: document.getElementById("year")
  },

  // Makes text safe to place inside HTML
  esc(text) {
    return String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  },

  // ----- Drawing the content from the Model -----
  renderAbout(profile, stats) {
    this.el.aboutText.innerHTML =
      "<p><strong>" + this.esc(profile.lead) + "</strong></p>" +
      profile.paragraphs.map(t => "<p>" + this.esc(t) + "</p>").join("") +
      '<div class="stats">' + stats.map(s => `<div class="stat"><b data-count="${s.value}">0</b><span>${this.esc(s.label)}</span></div>`).join("") + "</div>";
  },

  renderTimeline(items) {
    this.el.timeline.innerHTML = items.map(i =>
      `<li class="${i.now ? "now" : ""}"><h3>${this.esc(i.role)}</h3><span>${this.esc(i.details)}</span></li>`
    ).join("");
  },

  renderSkills(groups) {
    this.el.skillsList.innerHTML = groups.map(g =>
      `<div class="skill-group"><h3>${this.esc(g.group)}</h3><div class="chips">` +
      g.items.map((s, n) => `<span class="chip" style="--i:${n}">${this.esc(s)}</span>`).join("") +
      `</div></div>`
    ).join("");
  },

  renderProjects(projects, illustrations) {
    this.el.track.innerHTML = projects.map(p =>
      `<article class="card">
         <div class="pic">${illustrations[p.art]}</div>
         <div class="desc">
           <h3>${this.esc(p.title)}</h3>
           <p>${this.esc(p.description)}</p>
           <span class="tags">${p.tags.map(t => this.esc(t)).join(" · ")}</span>
         </div>
       </article>`
    ).join("");
  },

  // Fills in the email / LinkedIn / GitHub icon links
  renderContact(profile) {
    document.querySelectorAll("[data-link]").forEach(a => {
      const key = a.dataset.link;
      a.href = key === "email" ? "mailto:" + profile.email : profile.links[key];
    });
  },

  // Skills ticker: the list is drawn twice so the loop never shows a gap
  renderMarquee(groups) {
    const items = groups.flatMap(g => g.items).map(s => `<span>${this.esc(s)}</span>`).join("");
    document.getElementById("marquee").innerHTML = items + items;
  },

  // Splits the name into letters so they can rise in one by one
  splitName() {
    const h1 = document.querySelector(".hero h1");
    const text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.innerHTML = [...text].map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c}</span>`).join("");
  },

  // Marks the elements that should fade in as you scroll, and returns them
  markReveal() {
    const els = [...document.querySelectorAll("section:not(#projects) h2, #aboutText, .timeline li, .skill-group, .contact-box, .v-stats, .guest-form")];
    els.forEach((el, n) => {
      el.classList.add("reveal");
      if (el.matches(".timeline li")) el.style.setProperty("--i", [...el.parentNode.children].indexOf(el));
    });
    return els;
  },

  // ----- Visitors -----
  flag(code) {
    return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0))) : "";
  },
  ago(ts) {
    const m = Math.round(Math.max(1, (Date.now() - ts) / 1000) / 60);
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    const h = Math.round(m / 60);
    return h < 24 ? h + " h ago" : Math.round(h / 24) + " d ago";
  },
  renderVisitors(v, topCountries) {
    const count = document.getElementById("visitCount");
    count.dataset.count = v.visits; delete count.dataset.done;
    document.getElementById("visitMode").innerHTML = v.live
      ? '<span class="dot"></span>Live'
      : "Preview mode: saved in this browser only until the site is connected to Vercel storage";
    document.getElementById("visitFlags").innerHTML = topCountries.length
      ? topCountries.map(([code, n]) => `<span class="flag" title="${this.esc(code)}">${this.flag(code) || "🌐"} ${this.esc(code)} · ${n}</span>`).join("")
      : '<span class="v-note">Countries appear here as people visit.</span>';
    document.getElementById("wall").innerHTML = v.entries.length
      ? v.entries.map(e => {
          const hue = [...e.name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;   // each name gets its own color
          const where = [this.flag(e.country), this.ago(e.ts)].filter(Boolean).join(" · ");
          return `<li class="entry" style="--h:${hue}"><span class="av">${this.esc(e.name[0].toUpperCase())}</span>
            <div><b>${this.esc(e.name)}</b> <small>${where}</small>${e.message ? "<p>" + this.esc(e.message) + "</p>" : ""}</div></li>`;
        }).join("")
      : '<li class="empty">No signatures yet. Be the first to say hi!</li>';
  },
  setGuestNote(text) { document.getElementById("guestNote").textContent = text; },
  prefillName(name) { document.getElementById("gname").value = name; },
  setGreeting(name) {
    document.querySelector(".hero .hi").textContent = "Hi " + name + ", I’m Gelo, an IT graduate known online as";
  },
  toast(text) {
    const t = document.getElementById("toast");
    t.textContent = text; t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  },

  // ----- Ctrl+K menu -----
  renderPalette(items, active) {
    document.getElementById("paletteList").innerHTML = items.length
      ? items.map((c, i) => `<li role="option" data-i="${i}" class="${i === active ? "active" : ""}"><span>${this.esc(c.label)}</span><small>${this.esc(c.hint || "")}</small></li>`).join("")
      : '<li class="none">No match</li>';
  },
  openPalette() { const p = document.getElementById("palette"); p.hidden = false; const i = document.getElementById("paletteInput"); i.value = ""; i.focus(); },
  closePalette() { document.getElementById("palette").hidden = true; },
  paletteIsOpen() { return !document.getElementById("palette").hidden; },

  // ----- Extras -----
  setParallax(px, py) {   // clouds shift a little with the mouse (each cloud has its own depth)
    const wrap = document.querySelector(".name-wrap");
    wrap.style.setProperty("--px", px); wrap.style.setProperty("--py", py);
  },
  setTopProgress(percent, show) {
    const b = document.getElementById("topBtn");
    b.style.setProperty("--p", percent); b.classList.toggle("show", show);
  },

  setYear(year) { this.el.year.textContent = year; },

  // ----- Small screen changes -----
  setMenu(open) {
    this.el.menu.classList.toggle("open", open);
    this.el.menuBtn.setAttribute("aria-expanded", open);
  },
  setActiveLink(id) {
    document.querySelectorAll("nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
  },
  setPageProgress(percent) { this.el.pageProgress.style.width = percent + "%"; },
  setTyped(text) { this.el.typed.textContent = text; },
  setFormNote(text) { this.el.formNote.textContent = text; },
  moveGlow(x, y) { this.el.glow.style.transform = `translate(${x}px, ${y}px)`; },
  lookAt(dx, dy) {   // moves the avatar's pupils; dx and dy are between -1 and 1
    this.el.pupils.forEach(p => p.style.transform = `translate(${dx * 3}px, ${dy * 3}px)`);
  },

  // ----- Projects carousel -----
  // Measures the carousel so the Controller can work out how much scrolling it needs
  measureCarousel() {
    return {
      maxX: this.el.track.scrollWidth - this.el.track.clientWidth,   // total sideways distance
      pinTop: parseFloat(getComputedStyle(this.el.pin).top) || 0,    // where the section sticks
      pinHeight: this.el.pin.offsetHeight
    };
  },
  setSectionHeight(px) { this.el.section.style.height = px + "px"; },
  sectionTop() { return this.el.section.getBoundingClientRect().top; },
  cardStep() { return this.el.track.querySelector(".card").offsetWidth + 20; },  // card width + gap
  moveCarousel(progress, maxX) {
    this.el.track.scrollLeft = progress * maxX;
    this.el.barFill.style.width = (progress * 100) + "%";
    this.el.prev.disabled = progress < 0.01;   // grey out arrows at the ends
    this.el.next.disabled = progress > 0.99;
  },
  avatarRect() { return this.el.avatar.getBoundingClientRect(); }
};
