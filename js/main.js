(function () {
  "use strict";

  const CFG = window.SBS_CONFIG;
  const DICT = window.SBS_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const buzz = () => { if (navigator.vibrate) navigator.vibrate(8); };
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mailto = (addr, subject) => `mailto:${addr}?subject=${encodeURIComponent(subject)}`;

  /* ---------- i18n ---------- */
  let lang = store.get("sbs-lang") === "th" ? "th" : "en";
  const t = (k) => (DICT[lang][k] !== undefined ? DICT[lang][k] : DICT.en[k]);

  const SECTIONS = ["home", "services", "about", "training", "contact"];
  const TIERS = ["bronze", "silver", "gold"];
  const SHOWCASE = [
    { key: "conf", link: "secureBangkok", subject: "training.subject.conf", img: "assets/img/training.jpg" },
    { key: "gamp", link: "gamp", subject: "training.subject.gamp", img: "assets/img/story.jpg" },
  ];

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.count && !el.dataset.done) return; // keep the count-up start value until it has run
      el.textContent = t(el.dataset.i18n);
    });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    renderSteps();
    renderSince();
    renderProfile();
    renderSpeaker();
    renderTalks();
    renderShowcase();
    renderFeatures();
    renderRail();
    wireContacts();
    if (current) renderSheet(current);
    updateProgressUi();
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    store.set("sbs-lang", l);
    buzz();
    applyLang();
  }

  /* ---------- Contact wiring ---------- */
  function trainHref(link, subjectKey) {
    const url = link && CFG.links[link];
    return url
      ? { href: url, ext: true }
      : { href: mailto(CFG.trainingEmail, t(subjectKey)), ext: false };
  }

  function wireContacts() {
    $$("[data-mail]").forEach((a) => { a.href = mailto(CFG.email, t("contact.subject")); });
    $$("[data-mail-addr]").forEach((el) => { el.textContent = CFG.email; });
    $$("[data-train-addr]").forEach((el) => { el.textContent = CFG.trainingEmail; });
    $$("[data-train]").forEach((a) => {
      const r = trainHref(a.dataset.train, a.dataset.subject);
      a.href = r.href;
      if (r.ext) { a.target = "_blank"; a.rel = "noopener"; } else { a.removeAttribute("target"); }
    });
  }

  /* ---------- Content renderers ---------- */
  let stepIO;
  function renderSteps() {
    const steps = t("steps");
    $("#steps").innerHTML = steps
      .map((s, i) => `<article class="step glass spot"><b>${String(i + 1).padStart(2, "0")}</b><strong>${esc(s[0])}</strong><span>${esc(s[1])}</span></article>`)
      .join("");
    $("#stepDots").innerHTML = steps.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("");
    if (stepIO) stepIO.disconnect();
    const box = $("#steps");
    stepIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle("on", en.isIntersecting));
    }, { root: box, threshold: 0.75 });
    $$(".step", box).forEach((s) => stepIO.observe(s));
  }

  function renderSince() {
    $("#sinceFacts").innerHTML = t("since.f")
      .map((f) => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`)
      .join("");
  }

  const initials = () => t("profile.name").split(" ").map((w) => w[0]).join("");

  function renderProfile() {
    $("#profile").innerHTML = `<article class="profile glass spot">
      <div class="avatar" aria-hidden="true">${esc(initials())}</div>
      <div class="profile-main">
        <strong>${esc(t("profile.name"))}</strong><span class="role">${esc(t("profile.role"))}</span>
        <p>${esc(t("profile.bio"))}</p>
        <ul class="ptags">${t("profile.tags").map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <a class="btn btn-ghost" data-mail href="#contact">${icon("contact")}<span>${esc(t("profile.cta"))}</span></a>
      </div></article>`;
  }

  function renderSpeaker() {
    $("#speaker").innerHTML = `<div class="speaker glass spot"><div class="avatar sm" aria-hidden="true">${esc(initials())}</div><div><strong>${esc(t("profile.name"))}</strong><span>${esc(t("speaker.role"))}</span></div></div>`;
  }

  function renderTalks() {
    $("#talks").innerHTML = t("talks")
      .map((x) => `<li class="jn"><span class="jn-dot"></span><div class="jn-card glass spot"><time>${esc(x[0])}</time><strong>${esc(x[1])}</strong><span>${esc(x[2])}</span></div></li>`)
      .join("");
    updateJourney();
  }

  let showIdx = 0;
  function renderShowcase() {
    $("#showTabs").innerHTML = SHOWCASE.map((it, i) =>
      `<button type="button" role="tab" data-show="${i}" aria-selected="${i === showIdx}"><span class="svc-tag">${esc(t("training." + it.key + ".tag"))}</span><strong>${esc(t("training." + it.key + ".title"))}</strong></button>`).join("");
    const it = SHOWCASE[showIdx];
    const r = trainHref(it.link, it.subject);
    $("#showStage").innerHTML = `<figure class="show-img"><img src="${it.img}" alt="" loading="lazy" width="1400" height="900"></figure>
      <div class="show-card glass spot">
        <span class="svc-tag">${esc(t("training." + it.key + ".tag"))}</span>
        <h3>${esc(t("training." + it.key + ".title"))}</h3>
        <p>${esc(t("training." + it.key + ".p"))}</p>
        <div class="show-actions">
          <a class="btn btn-primary" href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener"' : ""}><span>${esc(t("training." + it.key + ".cta"))}</span>${icon("arrow")}</a>
          <button type="button" class="btn btn-ghost" data-open="training">${icon("layers")}<span>${esc(t("training.compare.title"))}</span></button>
        </div>
      </div>`;
    $("#showStage").classList.remove("swap");
    void $("#showStage").offsetWidth;
    $("#showStage").classList.add("swap");
  }

  function renderFeatures() {
    const offices = CFG.offices.map((o) => {
      const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(o.address);
      return `<a class="feat spot" href="${url}" target="_blank" rel="noopener"><span class="chip-ico">${icon("pin")}</span><strong>${esc(t("office." + o.id))}</strong><span class="feat-d">${esc(o.address)}</span><span class="feat-go">${esc(t("contact.map"))}${icon("arrow")}</span></a>`;
    }).join("");
    const social = CFG.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icon(s.id)}</a>`).join("");
    const phone = CFG.phone
      ? `<a class="feat spot" href="tel:${esc(CFG.phone.replace(/[^\d+]/g, ""))}"><span class="chip-ico">${icon("phone")}</span><strong>${esc(t("contact.call"))}</strong><span class="feat-main">${esc(CFG.phone)}</span><span class="feat-d">${esc(t("feat.call.d"))}</span></a>`
      : "";
    $("#features").innerHTML = `
      <a class="feat feat-wide feat-accent spot" href="${mailto(CFG.email, t("contact.subject"))}"><span class="chip-ico">${icon("contact")}</span><strong>${esc(t("contact.email"))}</strong><span class="feat-main">${esc(CFG.email)}</span><span class="feat-d">${esc(t("feat.email.d"))}</span><span class="feat-go">${icon("arrow")}</span></a>
      ${phone}${offices}
      <a class="feat spot" href="${mailto(CFG.trainingEmail, t("training.subject.pres"))}"><span class="chip-ico">${icon("training")}</span><strong>${esc(t("feat.training.t"))}</strong><span class="feat-main sm">${esc(CFG.trainingEmail)}</span><span class="feat-d">${esc(t("feat.training.d"))}</span></a>
      <div class="feat feat-social spot"><span class="chip-ico">${icon("users")}</span><strong>${esc(t("feat.social.t"))}</strong><span class="feat-d">${esc(t("feat.social.d"))}</span><span class="social-row">${social}</span></div>`;
  }

  function renderRail() {
    const rail = $("#rail");
    rail.innerHTML = `<i class="rail-fill" id="railFill"></i>` + SECTIONS.map((id, i) =>
      `<a href="#${id}" data-tab="${id}"><span class="rail-n">${String(i + 1).padStart(2, "0")}</span><span class="rail-l">${esc(t("nav." + id))}</span></a>`).join("");
    const act = $(".tab.active");
    if (act) setActive(act.dataset.tab);
  }

  /* ---------- Bottom sheet ---------- */
  const sheetRoot = $("#sheetRoot");
  const sheet = $("#sheet");
  let current = null;
  let tier = 2;
  let lastFocus = null;

  const checkList = (items) => `<ul class="checks">${items.map((i) => `<li>${icon("check")}<span>${esc(i)}</span></li>`).join("")}</ul>`;

  function tierMarkup() {
    const k = TIERS[tier];
    return `<p class="tier-for">${esc(t("tier." + k + ".for"))}</p>${checkList(t("tier." + k + ".items"))}`;
  }

  function monitoringTable() {
    const head = TIERS.map((n, i) => `<th scope="col" data-c="${i}">${esc(t("tier." + n))}</th>`).join("");
    const rows = t("monitoring.rows").map((r) =>
      `<tr><th scope="row">${esc(r[0])}</th>${[1, 2, 3].map((c) => `<td data-c="${c - 1}"${r[c] === "—" ? ' class="none"' : ""}>${esc(r[c])}</td>`).join("")}</tr>`).join("");
    return `<div class="cmp-wrap"><table class="cmp" data-sel="${tier}"><thead><tr><th scope="col">${esc(t("compare.col"))}</th>${head}</tr></thead><tbody>${rows}</tbody></table></div><p class="cmp-note">${esc(t("compare.note"))}</p>`;
  }

  function renderSheet(kind) {
    let html = "";
    let ctaMail = CFG.email;
    let subject = t("sheet.subject");
    if (kind === "consulting") {
      subject += t("svc.consulting.title");
      html = `<h3 id="sheetTitle">${esc(t("consulting.heading"))}</h3>
        <p>${esc(t("consulting.intro"))}</p><p>${esc(t("consulting.approach"))}</p>
        <h4>${esc(t("consulting.listTitle"))}</h4>
        <div class="gbento">${t("consulting.groups").map((g, i) =>
          `<section class="gcard spot g${i}"><h5>${esc(g[0])}<span>${g[1].length}</span></h5>${checkList(g[1])}</section>`).join("")}</div>`;
    } else if (kind === "monitoring") {
      subject += t("svc.monitoring.title");
      html = `<h3 id="sheetTitle">${esc(t("monitoring.heading"))}</h3>
        <p>${esc(t("monitoring.intro"))}</p>
        <h4>${esc(t("monitoring.procTitle"))}</h4>${checkList(t("monitoring.procs"))}
        <h4>${esc(t("monitoring.areasTitle"))}</h4><div class="chips">${t("monitoring.areas").map((a) => `<span>${esc(a)}</span>`).join("")}</div>
        <h4>${esc(t("monitoring.tiersTitle"))}</h4>
        <div class="tiers" role="group">${TIERS.map((n, i) =>
          `<button type="button" class="tier-tile tt-${n} spot${i === tier ? " sel" : ""}" data-tier="${i}" aria-pressed="${i === tier}"><span class="tt-name">${esc(t("tier." + n))}</span><span class="tt-for">${esc(t("tier." + n + ".for"))}</span><span class="tt-n"><b>${t("tier." + n + ".items").length}</b> ${esc(t("tier.count"))}</span></button>`).join("")}</div>
        <div id="tierBody">${tierMarkup()}</div>
        <h4>${esc(t("compare.title"))} <small class="hint">${esc(t("compare.hint"))}</small></h4>
        ${monitoringTable()}`;
    } else {
      ctaMail = CFG.trainingEmail;
      subject += t("sheet.trainingTitle");
      const rows = t("training.rows").map((r) =>
        `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("");
      const btns = SHOWCASE.map((it) => {
        const r = trainHref(it.link, it.subject);
        return `<a class="btn btn-ghost" href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener"' : ""}><span>${esc(t("training." + it.key + ".cta"))}</span>${icon("arrow")}</a>`;
      }).join("");
      html = `<h3 id="sheetTitle">${esc(t("sheet.trainingTitle"))}</h3>
        <p>${esc(t("svc.training.sum"))}</p>
        <h4>${esc(t("training.compare.title"))}</h4>
        <div class="cmp-wrap"><table class="cmp cmp-2"><thead><tr><th scope="col"></th><th scope="col">${esc(t("training.colConf"))}</th><th scope="col">${esc(t("training.colGamp"))}</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="show-actions">${btns}</div>`;
    }
    html += `<div class="sheet-foot"><a class="btn btn-primary sheet-cta" href="${mailto(ctaMail, subject)}">${icon("contact")}<span>${esc(t("sheet.cta"))}</span></a></div>`;
    $("#sheetBody").innerHTML = html;
  }

  function openSheet(kind) {
    current = kind;
    tier = 2;
    lastFocus = document.activeElement;
    renderSheet(kind);
    sheetRoot.hidden = false;
    document.body.classList.add("locked");
    $("#sheetScroll").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => sheetRoot.classList.add("open")));
    buzz();
    setTimeout(() => $("#sheetClose").focus({ preventScroll: true }), 120);
  }

  function closeSheet() {
    if (!current) return;
    current = null;
    sheet.style.removeProperty("--drag");
    sheetRoot.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(() => { if (!current) sheetRoot.hidden = true; }, 460);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) openSheet(o.dataset.open);
  });
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetBackdrop").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  $("#sheetBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tier]");
    if (!b) return;
    tier = Number(b.dataset.tier);
    buzz();
    $$("[data-tier]").forEach((x) => {
      const on = x === b;
      x.classList.toggle("sel", on);
      x.setAttribute("aria-pressed", String(on));
    });
    $("#tierBody").innerHTML = tierMarkup();
    const table = $(".cmp[data-sel]");
    if (table) table.dataset.sel = tier;
  });

  // Showcase tabs
  $("#showTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-show]");
    if (!b || Number(b.dataset.show) === showIdx) return;
    showIdx = Number(b.dataset.show);
    buzz();
    renderShowcase();
  });

  // Drag the handle down to dismiss
  (function dragToClose() {
    const grab = $("#sheetGrab");
    let startY = 0, dy = 0, active = false;
    grab.addEventListener("pointerdown", (e) => {
      active = true; startY = e.clientY; dy = 0;
      grab.setPointerCapture(e.pointerId);
      sheet.classList.add("dragging");
    });
    grab.addEventListener("pointermove", (e) => {
      if (!active) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.setProperty("--drag", dy + "px");
    });
    const end = () => {
      if (!active) return;
      active = false;
      sheet.classList.remove("dragging");
      if (dy > 110) closeSheet(); else sheet.style.setProperty("--drag", "0px");
    };
    grab.addEventListener("pointerup", end);
    grab.addEventListener("pointercancel", end);
  })();

  sheet.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = $$("button, a[href]", sheet).filter((x) => !x.hidden && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Navigation placement (bottom bar on phones, inside the top bar on wide screens) ---------- */
  const appbar = $("#appbar");
  const tabbar = $("#tabbar");
  const wide = window.matchMedia("(min-width: 900px)");
  function placeNav() {
    if (wide.matches) {
      if (tabbar.parentElement !== appbar) appbar.insertBefore(tabbar, $(".lang", appbar));
    } else if (tabbar.parentElement !== document.body) {
      document.body.appendChild(tabbar);
    }
  }
  placeNav();
  (wide.addEventListener ? wide.addEventListener("change", placeNav) : wide.addListener(placeNav));

  /* ---------- Scroll behaviour ---------- */
  const progress = $("#progress");
  const heroBg = $("#heroBg");
  let lastY = window.scrollY, ticking = false;

  function updateJourney() {
    const j = $(".journey");
    if (!j) return;
    const r = j.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / Math.max(1, r.height)));
    j.style.setProperty("--prog", p.toFixed(3));
    const items = $$(".jn", j);
    items.forEach((li, i) => li.classList.toggle("on", p >= (i + 0.35) / items.length));
  }

  function updateProgressUi() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    progress.style.transform = `scaleX(${p})`;
    const fill = $("#railFill");
    if (fill) fill.style.setProperty("--rp", p.toFixed(3));
  }

  function onScroll() {
    const y = window.scrollY;
    updateProgressUi();
    updateJourney();
    if (!wide.matches) {
      if (y > lastY + 6 && y > 120) appbar.classList.add("hide");
      else if (y < lastY - 6 || y < 40) appbar.classList.remove("hide");
    }
    lastY = y;
    if (!reduceMotion && y < window.innerHeight * 1.2) heroBg.style.setProperty("--py", (y * 0.25).toFixed(1) + "px");
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Step dots follow the swipe carousel
  $("#steps").addEventListener("scroll", () => {
    const box = $("#steps");
    const cards = $$(".step", box);
    if (!cards.length) return;
    const w = cards[0].offsetWidth + 12;
    const i = Math.min(cards.length - 1, Math.round(box.scrollLeft / w));
    $$("#stepDots i").forEach((d, n) => d.classList.toggle("on", n === i));
  }, { passive: true });

  // Reveal on scroll
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el, i) => {
    el.style.setProperty("--d", (i % 4) * 70 + "ms");
    revealIO.observe(el);
  });

  // Count-up numbers (hero stats)
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      runCount(en.target);
    });
  }, { threshold: 0.6 });
  function runCount(el) {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const done = () => { el.dataset.done = "1"; el.textContent = t(el.dataset.i18n); };
    if (reduceMotion) { done(); return; }
    const dur = 1400, t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick); else done();
    })(t0);
  }
  $$("[data-count]").forEach((el) => {
    el.textContent = reduceMotion ? el.textContent : el.dataset.from || "0";
    if (reduceMotion) el.dataset.done = "1";
    countIO.observe(el);
  });

  // Glass spotlight that follows the finger / cursor
  function spot(e) {
    const el = e.target.closest && e.target.closest(".spot");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px");
    el.style.setProperty("--my", e.clientY - r.top + "px");
  }
  document.addEventListener("pointermove", spot, { passive: true });
  document.addEventListener("pointerdown", spot, { passive: true });

  // Active tab / rail step follows the section in view
  function setActive(id) {
    $$("[data-tab]").forEach((tb) => {
      const on = tb.dataset.tab === id;
      tb.classList.toggle("active", on);
      if (on) tb.setAttribute("aria-current", "page"); else tb.removeAttribute("aria-current");
    });
  }
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-section]").forEach((s) => secIO.observe(s));
  document.addEventListener("click", (e) => { if (e.target.closest("[data-tab]")) buzz(); });

  /* ---------- Hero network animation ---------- */
  (function network() {
    const cv = $("#net");
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, dpr = 1, nodes = [], raf = 0, running = false;
    const ptr = { x: -999, y: -999 };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, (w * h) / 14000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const link = Math.min(140, w / 3);
      for (const a of nodes) {
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        ctx.fillStyle = "rgba(211,224,230,.8)";
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(211,224,230,${(1 - d / link) * 0.32})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dp = Math.hypot(a.x - ptr.x, a.y - ptr.y);
        if (dp < 170) {
          ctx.strokeStyle = `rgba(224,80,94,${(1 - dp / 170) * 0.7})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
        }
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size(); frame();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); frame(); }, 150); });
    const hero = $("#home");
    const move = (e) => {
      const r = cv.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      ptr.x = p.clientX - r.left; ptr.y = p.clientY - r.top;
    };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", () => { ptr.x = ptr.y = -999; });
    hero.addEventListener("touchmove", move, { passive: true });
    hero.addEventListener("touchend", () => { ptr.x = ptr.y = -999; });
    new IntersectionObserver((en) => (en[0].isIntersecting && !document.hidden ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  })();

  /* ---------- Cookie notice ---------- */
  const cookie = $("#cookie");
  if (!store.get("sbs-cookie")) cookie.hidden = false;
  $("#cookieOk").addEventListener("click", () => { store.set("sbs-cookie", "1"); cookie.hidden = true; buzz(); });

  /* ---------- Language buttons + boot ---------- */
  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  setActive("home");
  applyLang();
  onScroll();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
