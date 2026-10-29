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

  /* ---------- i18n ---------- */
  let lang = store.get("sbs-lang") === "th" ? "th" : "en";
  const t = (k) => (DICT[lang][k] !== undefined ? DICT[lang][k] : DICT.en[k]);

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    renderSteps();
    renderTalks();
    renderOffices();
    wireContacts();
    if (current) renderSheet(current);
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    store.set("sbs-lang", l);
    buzz();
    applyLang();
  }

  /* ---------- Contact wiring (email / phone / training links) ---------- */
  const mailto = (addr, subject) => `mailto:${addr}?subject=${encodeURIComponent(subject)}`;

  function wireContacts() {
    $$("[data-mail]").forEach((a) => { a.href = mailto(CFG.email, t("contact.subject")); });
    $$("[data-mail-addr]").forEach((el) => { el.textContent = CFG.email; });
    const call = $("#callBtn");
    if (CFG.phone) {
      call.hidden = false;
      call.href = "tel:" + CFG.phone.replace(/[^\d+]/g, "");
      $("[data-phone-num]").textContent = CFG.phone;
    } else {
      call.hidden = true;
    }
    $$("[data-train-addr]").forEach((el) => { el.textContent = CFG.trainingEmail; });
    $$("[data-train]").forEach((a) => {
      const link = a.dataset.train && CFG.links[a.dataset.train];
      if (link) {
        a.href = link;
        a.target = "_blank";
        a.rel = "noopener";
      } else {
        a.href = mailto(CFG.trainingEmail, t(a.dataset.subject));
        a.removeAttribute("target");
      }
    });
    const social = $("#social");
    social.innerHTML = CFG.social
      .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icon(s.id)}<span>${esc(s.label)}</span></a>`)
      .join("");
  }

  /* ---------- Dynamic lists ---------- */
  function renderSteps() {
    $("#steps").innerHTML = t("steps")
      .map((s, i) => `<div class="step"><b>${String(i + 1).padStart(2, "0")}</b><strong>${esc(s[0])}</strong><span>${esc(s[1])}</span></div>`)
      .join("");
    observeSteps();
  }

  function renderTalks() {
    $("#talks").innerHTML = t("talks")
      .map((x) => `<li><time>${esc(x[0])}</time><strong>${esc(x[1])}</strong><span>${esc(x[2])}</span></li>`)
      .join("");
  }

  function renderOffices() {
    $("#offices").innerHTML = CFG.offices
      .map((o, i) => {
        const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(o.address);
        return `<a class="office reveal in" style="--d:${i * 60}ms" href="${url}" target="_blank" rel="noopener">${icon("pin")}<div><strong>${esc(t("office." + o.id))}</strong><span>${esc(o.address)}</span><em>${esc(t("contact.map"))}</em></div></a>`;
      })
      .join("");
  }

  /* ---------- Bottom sheet ---------- */
  const sheetRoot = $("#sheetRoot");
  const sheet = $("#sheet");
  let current = null;
  let tier = 0;
  let lastFocus = null;
  const TIERS = ["bronze", "silver", "gold"];

  const checkList = (items) => `<ul class="checks">${items.map((i) => `<li>${icon("check")}<span>${esc(i)}</span></li>`).join("")}</ul>`;

  function renderSheet(kind) {
    const body = $("#sheetBody");
    let html = "";
    if (kind === "consulting") {
      html = `<h3 id="sheetTitle">${esc(t("consulting.heading"))}</h3>
        <p>${esc(t("consulting.intro"))}</p><p>${esc(t("consulting.approach"))}</p>
        <h4>${esc(t("consulting.listTitle"))}</h4>${checkList(t("consulting.items"))}`;
    } else {
      const k = TIERS[tier];
      html = `<h3 id="sheetTitle">${esc(t("monitoring.heading"))}</h3>
        <p>${esc(t("monitoring.intro"))}</p>
        <h4>${esc(t("monitoring.procTitle"))}</h4>${checkList(t("monitoring.procs"))}
        <h4>${esc(t("monitoring.areasTitle"))}</h4><div class="chips">${t("monitoring.areas").map((a) => `<span>${esc(a)}</span>`).join("")}</div>
        <h4>${esc(t("monitoring.tiersTitle"))}</h4>
        <div class="seg" role="tablist" data-t="${tier}" style="--i:${tier}"><i></i>${TIERS.map((n, i) => `<button type="button" role="tab" data-tier="${i}" aria-selected="${i === tier}">${esc(t("tier." + n))}</button>`).join("")}</div>
        <p class="tier-for">${esc(t("tier." + k + ".for"))}</p>
        <div id="tierList">${checkList(t("tier." + k + ".items"))}</div>`;
    }
    const subject = t("sheet.subject") + t(kind === "consulting" ? "svc.consulting.title" : "svc.monitoring.title");
    html += `<div class="sheet-foot"><a class="btn btn-primary sheet-cta" href="${mailto(CFG.email, subject)}">${icon("contact")}<span>${esc(t("sheet.cta"))}</span></a></div>`;
    body.innerHTML = html;
  }

  function openSheet(kind) {
    current = kind;
    tier = 0;
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
    setTimeout(() => { if (!current) sheetRoot.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  $$("[data-open]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.open)));
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetBackdrop").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  $("#sheetBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tier]");
    if (!b) return;
    tier = Number(b.dataset.tier);
    buzz();
    const seg = $(".seg");
    seg.dataset.t = tier;
    seg.style.setProperty("--i", tier);
    $$("[data-tier]", seg).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $(".tier-for").textContent = t("tier." + TIERS[tier] + ".for");
    $("#tierList").innerHTML = checkList(t("tier." + TIERS[tier] + ".items"));
  });

  // Drag the handle down to dismiss (touch / mouse / pen)
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

  // Keep Tab focus inside the open sheet
  sheet.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = $$("button, a[href]", sheet).filter((x) => !x.hidden && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Scroll behaviour ---------- */
  const appbar = $("#appbar");
  const progress = $("#progress");
  const heroBg = $("#heroBg");
  let lastY = window.scrollY, ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (window.innerWidth < 900) {
      if (y > lastY + 6 && y > 120) appbar.classList.add("hide");
      else if (y < lastY - 6 || y < 40) appbar.classList.remove("hide");
    }
    lastY = y;
    if (!reduceMotion && y < window.innerHeight * 1.2) heroBg.style.setProperty("--py", (y * 0.25).toFixed(1) + "px");
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Reveal on scroll
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i % 3) * 70 + "ms");
    revealIO.observe(el);
  });

  // Active tab follows the section in view
  const tabs = $$(".tab");
  const setActive = (id) => tabs.forEach((tb) => {
    const on = tb.dataset.tab === id;
    tb.classList.toggle("active", on);
    if (on) tb.setAttribute("aria-current", "page"); else tb.removeAttribute("aria-current");
  });
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("[data-section]").forEach((s) => secIO.observe(s));
  setActive("home");
  tabs.forEach((tb) => tb.addEventListener("click", buzz));

  // Highlight the centred step card in the swipe carousel
  let stepIO;
  function observeSteps() {
    if (stepIO) stepIO.disconnect();
    const box = $("#steps");
    stepIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle("on", en.isIntersecting));
    }, { root: box, threshold: 0.75 });
    $$(".step", box).forEach((s) => stepIO.observe(s));
  }

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
        ctx.fillStyle = "rgba(201,211,224,.8)";
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(201,211,224,${(1 - d / link) * 0.32})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dp = Math.hypot(a.x - ptr.x, a.y - ptr.y);
        if (dp < 170) {
          ctx.strokeStyle = `rgba(208,65,79,${(1 - dp / 170) * 0.7})`;
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
  applyLang();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
