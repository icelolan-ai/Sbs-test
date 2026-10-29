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
  const buzz = (ms = 8) => { if (navigator.vibrate) navigator.vibrate(ms); };
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mailto = (addr, subject) => `mailto:${addr}?subject=${encodeURIComponent(subject)}`;
  const swap = (el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); };

  /* ---------- i18n ---------- */
  let lang = store.get("sbs-lang") === "th" ? "th" : "en";
  const t = (k) => (DICT[lang][k] !== undefined ? DICT[lang][k] : DICT.en[k]);

  const TIERS = ["bronze", "silver", "gold"];
  const TRAININGS = [
    { key: "conf", link: "secureBangkok", subject: "training.subject.conf", img: "assets/img/training.jpg" },
    { key: "gamp", link: "gamp", subject: "training.subject.gamp", img: "assets/img/story.jpg" },
  ];
  // Office map pins: [lat, lon]
  const COORDS = { us: [29.4, -95.4], th: [13.74, 100.56], au: [-37.81, 144.96] };

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.count && !el.dataset.done) return; // count-up still pending
      el.textContent = t(el.dataset.i18n);
    });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    updateWheelLabels();
    showStep(stepIdx, false);
    renderTimeline();
    renderTalks();
    renderTraining(false);
    renderMap();
    renderOffice(false);
    renderSocial();
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

  /* ---------- Contact wiring ---------- */
  function trainHref(link, subjectKey) {
    const url = link && CFG.links[link];
    return url ? { href: url, ext: true } : { href: mailto(CFG.trainingEmail, t(subjectKey)), ext: false };
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
    const call = $("#callBtn");
    if (CFG.phone) {
      call.hidden = false;
      call.href = "tel:" + CFG.phone.replace(/[^\d+]/g, "");
      $("[data-phone-num]").textContent = CFG.phone;
    } else {
      call.hidden = true;
    }
  }

  function renderSocial() {
    $("#social").innerHTML = CFG.social
      .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icon(s.id)}</a>`)
      .join("");
  }

  /* ---------- Approach wheel ---------- */
  const wheel = $("#wheel");
  const approach = $(".approach");
  let stepIdx = 0;
  let autoTimer = null;
  let userTouchedWheel = false;

  (function buildWheel() {
    const C = 160, R = 152, r = 90, gap = 2;
    const pt = (rad, deg) => {
      const a = (deg * Math.PI) / 180;
      return [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    };
    let html = "";
    for (let i = 0; i < 6; i++) {
      const a0 = -90 + i * 60 + gap, a1 = a0 + 60 - gap * 2, mid = (a0 + a1) / 2;
      const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1), [x2, y2] = pt(r, a1), [x3, y3] = pt(r, a0);
      const [tx, ty] = pt(121, mid);
      const off = [Math.cos((mid * Math.PI) / 180) * 7, Math.sin((mid * Math.PI) / 180) * 7];
      html += `<g class="wseg" data-i="${i}" tabindex="0" role="button" style="--tx:${off[0].toFixed(1)}px;--ty:${off[1].toFixed(1)}px">
        <path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}A${r} ${r} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)}Z"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${String(i + 1).padStart(2, "0")}</text></g>`;
    }
    wheel.innerHTML = html;
  })();

  function updateWheelLabels() {
    const steps = t("steps");
    $$(".wseg", wheel).forEach((g, i) => g.setAttribute("aria-label", `${i + 1}. ${steps[i][0]}`));
  }

  function showStep(i, animate = true) {
    stepIdx = (i + 6) % 6;
    const s = t("steps")[stepIdx];
    $$(".wseg", wheel).forEach((g, n) => {
      g.classList.toggle("on", n === stepIdx);
      g.setAttribute("aria-pressed", String(n === stepIdx));
    });
    $("#stepNum").textContent = String(stepIdx + 1).padStart(2, "0");
    $("#stepTitle").textContent = s[0];
    $("#stepText").textContent = s[1];
    if (animate) {
      swap($(".step-detail"));
      approach.classList.add("spin");
      setTimeout(() => approach.classList.remove("spin"), 500);
    }
  }

  function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
  function startAuto() {
    if (reduceMotion || userTouchedWheel || autoTimer) return;
    autoTimer = setInterval(() => showStep(stepIdx + 1), 3800);
  }
  new IntersectionObserver((en) => (en[0].isIntersecting ? startAuto() : stopAuto()), { threshold: 0.4 }).observe(approach);

  function pickStep(i) {
    userTouchedWheel = true;
    stopAuto();
    buzz(12);
    showStep(i);
  }
  wheel.addEventListener("click", (e) => {
    const g = e.target.closest(".wseg");
    if (g) pickStep(Number(g.dataset.i));
  });
  wheel.addEventListener("keydown", (e) => {
    const g = e.target.closest(".wseg");
    if (!g) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickStep(Number(g.dataset.i)); }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pickStep(stepIdx + 1); $$(".wseg", wheel)[stepIdx].focus(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pickStep(stepIdx - 1); $$(".wseg", wheel)[stepIdx].focus(); }
  });

  /* ---------- Story timeline + talks ---------- */
  function renderTimeline() {
    $("#timeline").innerHTML = t("since.f").map((f) => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join("");
  }

  function renderTalks() {
    const open = $$(".talk.open").map((x) => x.dataset.i);
    $("#talks").innerHTML = t("talks").map((x, i) => {
      const on = open.includes(String(i));
      return `<div class="talk${on ? " open" : ""}" data-i="${i}">
        <button type="button" class="talk-btn" aria-expanded="${on}"><span><time>${esc(x[0])}</time><strong>${esc(x[1])}</strong></span>${icon("down")}</button>
        <div class="talk-body"><p>${esc(x[2])}</p></div></div>`;
    }).join("");
  }
  $("#talks").addEventListener("click", (e) => {
    const b = e.target.closest(".talk-btn");
    if (!b) return;
    const item = b.parentElement;
    const on = !item.classList.contains("open");
    item.classList.toggle("open", on);
    b.setAttribute("aria-expanded", String(on));
    buzz();
  });

  /* ---------- Training switcher ---------- */
  let trainIdx = 0;
  function renderTraining(animate = true) {
    const it = TRAININGS[trainIdx];
    const r = trainHref(it.link, it.subject);
    $("#trainTabs").style.setProperty("--i", trainIdx);
    $$("[data-train-tab]").forEach((b, n) => b.setAttribute("aria-selected", String(n === trainIdx)));
    const stage = $("#trainStage");
    stage.innerHTML = `<img src="${it.img}" alt="" loading="lazy" width="1400" height="900">
      <div class="train-text">
        <p class="tag">${esc(t("training." + it.key + ".tag"))}</p>
        <h3>${esc(t("training." + it.key + ".title"))}</h3>
        <p>${esc(t("training." + it.key + ".p"))}</p>
        <div class="train-actions">
          <a class="btn btn-primary" href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener"' : ""}><span>${esc(t("training." + it.key + ".cta"))}</span>${icon("arrow")}</a>
          <button type="button" class="btn btn-ghost" data-open="training">${icon("layers")}<span>${esc(t("training.compare.title"))}</span></button>
        </div>
      </div>`;
    if (animate) swap(stage);
  }
  function setTraining(i) {
    if (i === trainIdx || i < 0 || i >= TRAININGS.length) return;
    trainIdx = i;
    buzz();
    renderTraining();
  }
  $("#trainTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-train-tab]");
    if (b) setTraining(Number(b.dataset.trainTab));
  });
  // Swipe left/right on the training card to switch
  (function swipe() {
    const stage = $("#trainStage");
    let x0 = null, y0 = 0;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setTraining(trainIdx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  })();

  /* ---------- Office map ---------- */
  let officeId = "th";
  // Equirectangular, cropped to lat 60..-50 / lon -130..170, inset so pins stay off the edges
  const project = ([lat, lon]) => [8 + ((lon + 130) / 300) * 84, 10 + ((60 - lat) / 110) * 80];

  function renderMap() {
    const map = $("#map");
    $$(".pin", map).forEach((p) => p.remove());
    CFG.offices.forEach((o) => {
      const [x, y] = project(COORDS[o.id]);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pin" + (o.id === officeId ? " on" : "") + (x > 72 ? " edge-r" : x < 28 ? " edge-l" : "");
      b.dataset.office = o.id;
      b.style.setProperty("--x", x + "%");
      b.style.setProperty("--y", y + "%");
      b.setAttribute("aria-label", t("office." + o.id));
      b.setAttribute("aria-pressed", String(o.id === officeId));
      b.innerHTML = `<i></i><span>${esc(t("office." + o.id))}</span>`;
      map.appendChild(b);
    });
    const pts = CFG.offices.map((o) => { const [x, y] = project(COORDS[o.id]); return [x, y * 0.6]; });
    const arc = (a, b) => {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return `<path d="M${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${mx.toFixed(2)} ${(my - d * 0.35).toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}"/>`;
    };
    $("#mapArcs").innerHTML = arc(pts[0], pts[1]) + arc(pts[1], pts[2]);
  }

  function renderOffice(animate = true) {
    const o = CFG.offices.find((x) => x.id === officeId);
    const a = $("#office");
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(o.address);
    a.innerHTML = `${icon("pin")}<div><strong>${esc(t("office." + o.id))}</strong><span>${esc(o.address)}</span><em>${esc(t("contact.map"))}${icon("arrow")}</em></div>`;
    if (animate) swap(a);
  }

  $("#map").addEventListener("click", (e) => {
    const p = e.target.closest(".pin");
    if (!p || p.dataset.office === officeId) return;
    officeId = p.dataset.office;
    $$(".pin").forEach((x) => { x.classList.toggle("on", x === p); x.setAttribute("aria-pressed", String(x === p)); });
    buzz(12);
    renderOffice();
  });

  /* ---------- Radar: tap to drop a signal ---------- */
  $("#radar").addEventListener("click", (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const b = document.createElement("i");
    b.className = "blip tap";
    b.style.setProperty("--x", ((e.clientX - r.left) / r.width) * 100 + "%");
    b.style.setProperty("--y", ((e.clientY - r.top) / r.height) * 100 + "%");
    e.currentTarget.appendChild(b);
    setTimeout(() => b.remove(), 1700);
    buzz(14);
  });

  /* ---------- Sheets ---------- */
  const sheetRoot = $("#sheetRoot");
  const sheet = $("#sheet");
  let current = null;
  let tier = 2;
  let compareOpen = false;
  let lastFocus = null;

  const checkList = (items, cls = "") => `<ul class="checks ${cls}">${items.map((i) => `<li>${icon("check")}<span>${esc(i)}</span></li>`).join("")}</ul>`;

  function tierTable() {
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
        <p>${esc(t("consulting.intro"))}</p>
        <h4>${esc(t("consulting.listTitle"))}</h4>
        ${t("consulting.groups").map((g, i) => `<div class="acc${i === 0 ? " open" : ""}">
          <button type="button" class="acc-btn" aria-expanded="${i === 0}">${esc(g[0])}<small>${g[1].length}</small>${icon("down")}</button>
          <div class="acc-body"><div>${checkList(g[1])}</div></div></div>`).join("")}`;
    } else if (kind === "monitoring") {
      subject += t("svc.monitoring.title");
      const k = TIERS[tier];
      html = `<h3 id="sheetTitle">${esc(t("monitoring.heading"))}</h3>
        <p>${esc(t("monitoring.intro"))}</p>
        <h4>${esc(t("monitoring.tiersTitle"))}</h4>
        <div class="tiers" role="group">${TIERS.map((n, i) =>
          `<button type="button" class="tier tier-${n}${i === tier ? " sel" : ""}" data-tier="${i}" aria-pressed="${i === tier}"><i></i><b>${esc(t("tier." + n))}</b><span>${t("tier." + n + ".items").length} ${esc(t("tier.count"))}</span></button>`).join("")}</div>
        <p class="tier-for" id="tierFor">${esc(t("tier." + k + ".for"))}</p>
        <div id="tierList">${checkList(t("tier." + k + ".items"), "tier-list")}</div>
        <button type="button" class="btn btn-ghost toggle" id="cmpToggle" aria-expanded="${compareOpen}">${icon("layers")}<span>${esc(t(compareOpen ? "compare.hide" : "compare.show"))}</span></button>
        <div id="cmpBox"${compareOpen ? "" : " hidden"}>${tierTable()}</div>
        <h4>${esc(t("monitoring.procTitle"))}</h4>${checkList(t("monitoring.procs"))}`;
    } else {
      ctaMail = CFG.trainingEmail;
      subject += t("sheet.trainingTitle");
      const rows = t("training.rows").map((r) => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("");
      html = `<h3 id="sheetTitle">${esc(t("training.compare.title"))}</h3>
        <p>${esc(t("svc.training.sum"))}</p>
        <div class="cmp-wrap"><table class="cmp"><thead><tr><th scope="col"></th><th scope="col">${esc(t("training.colConf"))}</th><th scope="col">${esc(t("training.colGamp"))}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    html += `<div class="sheet-foot"><a class="btn btn-primary sheet-cta" href="${mailto(ctaMail, subject)}">${icon("contact")}<span>${esc(t("sheet.cta"))}</span></a></div>`;
    $("#sheetBody").innerHTML = html;
  }

  function openSheet(kind) {
    current = kind;
    tier = 2;
    compareOpen = false;
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
    const svc = e.target.closest && e.target.closest(".svc[data-open]");
    if (svc && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openSheet(svc.dataset.open); }
  });
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetBackdrop").addEventListener("click", closeSheet);

  $("#sheetBody").addEventListener("click", (e) => {
    const acc = e.target.closest(".acc-btn");
    if (acc) {
      const box = acc.parentElement;
      const on = !box.classList.contains("open");
      box.classList.toggle("open", on);
      acc.setAttribute("aria-expanded", String(on));
      buzz();
      return;
    }
    if (e.target.closest("#cmpToggle")) {
      compareOpen = !compareOpen;
      $("#cmpBox").hidden = !compareOpen;
      const b = $("#cmpToggle");
      b.setAttribute("aria-expanded", String(compareOpen));
      $("span", b).textContent = t(compareOpen ? "compare.hide" : "compare.show");
      buzz();
      return;
    }
    const tb = e.target.closest("[data-tier]");
    if (tb) {
      tier = Number(tb.dataset.tier);
      buzz(12);
      $$("[data-tier]").forEach((x) => { const on = x === tb; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); });
      $("#tierFor").textContent = t("tier." + TIERS[tier] + ".for");
      $("#tierList").innerHTML = checkList(t("tier." + TIERS[tier] + ".items"), "tier-list swap");
      const table = $(".cmp[data-sel]");
      if (table) table.dataset.sel = tier;
    }
  });

  (function dragToClose() {
    const grab = $("#sheetGrab");
    let startY = 0, dy = 0, active = false;
    grab.addEventListener("pointerdown", (e) => { active = true; startY = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); sheet.classList.add("dragging"); });
    grab.addEventListener("pointermove", (e) => { if (!active) return; dy = Math.max(0, e.clientY - startY); sheet.style.setProperty("--drag", dy + "px"); });
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

  /* ---------- Tap feedback: ripple on every pressable thing ---------- */
  const PRESSABLE = ".btn, .svc, .chip, .tab, .lang-btn, .seg button, .tier, .office, .social a, .talk-btn, .acc-btn";
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(PRESSABLE);
    if (!el || reduceMotion) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span");
    s.className = "rp";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    el.appendChild(s);
    setTimeout(() => s.remove(), 700);
    if (el.classList.contains("svc")) {
      el.classList.add("pressed");
      setTimeout(() => el.classList.remove("pressed"), 750);
    }
  }, { passive: true });

  /* ---------- iOS-style press: the pressed button grows, its neighbours shrink ---------- */
  const GROUPS = ".tabbar, .lang, .seg, .tiers, .chip-row, .social, .hero-actions, .train-actions, .svc-list, .contact-cta";
  let pressedGroup = null;
  function releasePress() {
    if (!pressedGroup) return;
    pressedGroup.classList.remove("pressing");
    $$(".is-pressed", pressedGroup).forEach((x) => x.classList.remove("is-pressed"));
    pressedGroup = null;
  }
  document.addEventListener("pointerdown", (e) => {
    const group = e.target.closest(GROUPS);
    if (!group || reduceMotion) return;
    const item = Array.from(group.children).find((c) => c.contains(e.target));
    if (!item || item.matches(".seg-thumb")) return;
    releasePress();
    pressedGroup = group;
    group.classList.add("pressing");
    item.classList.add("is-pressed");
  }, { passive: true });
  ["pointerup", "pointercancel", "dragstart"].forEach((ev) => document.addEventListener(ev, () => setTimeout(releasePress, 140), { passive: true }));

  /* ---------- Dock magnification on the tab bar (finger or cursor) ---------- */
  function magnify(e) {
    if (reduceMotion) return;
    const tabs = $$(".tab", tabbar);
    tabs.forEach((tb) => {
      const r = tb.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const k = Math.max(0, 1 - d / 120);
      tb.style.setProperty("--s", (1 + k * 0.38).toFixed(3));
    });
  }
  function unmagnify() { $$(".tab", tabbar).forEach((tb) => tb.style.removeProperty("--s")); }

  /* ---------- Navigation placement ---------- */
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
  tabbar.addEventListener("pointermove", magnify);
  tabbar.addEventListener("pointerdown", magnify);
  tabbar.addEventListener("pointerleave", unmagnify);
  tabbar.addEventListener("pointerup", () => setTimeout(unmagnify, 180));
  tabbar.addEventListener("pointercancel", unmagnify);
  (wide.addEventListener ? wide.addEventListener("change", placeNav) : wide.addListener(placeNav));

  /* ---------- Scroll behaviour ---------- */
  const progress = $("#progress");
  let ticking = false;
  const intro = $("#intro");
  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    document.body.classList.toggle("at-intro", y < vh * 0.35);
    if (!reduceMotion) intro.style.setProperty("--ip", Math.min(1, y / (vh * 0.7)).toFixed(3));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => revealIO.observe(el));

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { countIO.unobserve(en.target); runCount(en.target); } });
  }, { threshold: 0.6 });
  function runCount(el) {
    const to = Number(el.dataset.count), from = Number(el.dataset.from || 0);
    const done = () => { el.dataset.done = "1"; el.textContent = t(el.dataset.i18n); };
    if (reduceMotion) { done(); return; }
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / 1400);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick); else done();
    })(t0);
  }
  $$("[data-count]").forEach((el) => {
    if (reduceMotion) { el.dataset.done = "1"; return; }
    el.textContent = el.dataset.from || "0";
    countIO.observe(el);
  });

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
  tabbar.addEventListener("click", () => buzz());

  /* ---------- Hero network: drifts, follows the finger, and ripples on tap ---------- */
  (function network() {
    const cv = $("#net");
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, nodes = [], waves = [], raf = 0, running = false;
    const ptr = { x: -999, y: -999 };

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, (w * h) / 20000));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const link = Math.min(140, w / 3);
      for (const a of nodes) {
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          a.vx *= 0.99; a.vy *= 0.99;
          if (Math.abs(a.vx) < 0.12) a.vx += (Math.random() - 0.5) * 0.05;
          if (Math.abs(a.vy) < 0.12) a.vy += (Math.random() - 0.5) * 0.05;
          if (a.x < 0 || a.x > w) { a.vx *= -1; a.x = Math.min(w, Math.max(0, a.x)); }
          if (a.y < 0 || a.y > h) { a.vy *= -1; a.y = Math.min(h, Math.max(0, a.y)); }
        }
        ctx.fillStyle = "rgba(211,224,230,.85)";
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.7, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) { ctx.strokeStyle = `rgba(211,224,230,${(1 - d / link) * 0.3})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        const dp = Math.hypot(a.x - ptr.x, a.y - ptr.y);
        if (dp < 170) { ctx.strokeStyle = `rgba(224,80,94,${(1 - dp / 170) * 0.75})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke(); }
      }
      waves = waves.filter((wv) => wv.r < wv.max);
      for (const wv of waves) {
        wv.r += 6;
        ctx.strokeStyle = `rgba(224,80,94,${(1 - wv.r / wv.max) * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(wv.x, wv.y, wv.r, 0, 6.283); ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size(); frame();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); frame(); }, 150); });
    const hero = $("#home");
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    hero.addEventListener("pointermove", (e) => { [ptr.x, ptr.y] = pos(e); });
    hero.addEventListener("pointerleave", () => { ptr.x = ptr.y = -999; });
    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      const [x, y] = pos(e);
      ptr.x = x; ptr.y = y;
      waves.push({ x, y, r: 4, max: 220 });
      for (const a of nodes) {
        const dx = a.x - x, dy = a.y - y, d = Math.hypot(dx, dy) || 1;
        if (d < 220) { const f = (1 - d / 220) * 4; a.vx += (dx / d) * f; a.vy += (dy / d) * f; }
      }
      buzz(10);
    });
    new IntersectionObserver((en) => (en[0].isIntersecting && !document.hidden ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  })();

  /* ---------- Cookie notice ---------- */
  const cookie = $("#cookie");
  if (!store.get("sbs-cookie")) cookie.hidden = false;
  $("#cookieOk").addEventListener("click", () => { store.set("sbs-cookie", "1"); cookie.hidden = true; buzz(); });

  /* ---------- Boot ---------- */
  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  setActive("home");
  applyLang();
  onScroll();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
