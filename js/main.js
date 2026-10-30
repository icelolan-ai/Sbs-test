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
    $$("[data-i18n-alt]").forEach((el) => el.setAttribute("alt", t(el.dataset.i18nAlt)));
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    updateWheelLabels();
    showStep(stepIdx, false);
    renderTimeline();
    renderTalks();
    renderTraining(false);
    renderMap();
    renderOffice(false);
    $("#officeList").innerHTML = CFG.offices.map((o) => `<a class="detail-card" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}" target="_blank" rel="noopener"><strong>${esc(t("office." + o.id))}</strong><span>${esc(o.address)}</span><em>${esc(t("contact.map"))}</em></a>`).join("");
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
  function previewWheelSegment(e) {
    const g = e.target.closest(".wseg");
    if (!g) return;
    userTouchedWheel = true;
    stopAuto();
    const index = Number(g.dataset.i);
    if (index !== stepIdx) showStep(index);
  }
  wheel.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "touch") previewWheelSegment(e);
  });
  wheel.addEventListener("pointerdown", previewWheelSegment);
  wheel.addEventListener("focusin", previewWheelSegment);
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

  const presentationImages = ["EXPORT%202.png", "EXPORT%201%20VER%202.png", "EXPORT%203.png"].map(name =>
    "https://img1.wsimg.com/isteam/ip/312c3578-4387-4c6d-8cee-7c91665b25d1/" + name + "/:/rs=w:1023,cg:true");

  function renderTalks() {
    const open = $$(".talk.open").map((x) => x.dataset.i);
    $("#talks").innerHTML = t("talks").map((x, i) => {
      const on = open.includes(String(i));
      return `<div class="talk${on ? " open" : ""}" data-i="${i}">
        <a class="presentation-image" href="${presentationImages[i]}" target="_blank" rel="noopener" aria-label="${esc(t("presentation.open"))}: ${esc(x[1])}"><img src="${presentationImages[i]}" alt="${esc(x[1] + ": " + x[2])}" loading="lazy" width="1023" height="576"></a>
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
    const r = trainHref(null, it.subject);
    $("#trainTabs").style.setProperty("--i", trainIdx);
    $$("[data-train-tab]").forEach((b, n) => b.setAttribute("aria-selected", String(n === trainIdx)));
    const stage = $("#trainStage");
    stage.innerHTML = `<img src="${it.img}" alt="${esc(t("training.alt"))}" loading="lazy" width="1400" height="900">
      <div class="train-text">
        <p class="tag">${esc(t("training." + it.key + ".tag"))}</p>
        <h3>${esc(t("training." + it.key + ".title"))}</h3>
        <p>${esc(t("training." + it.key + ".p"))}</p>
        <div class="train-actions">
          <a class="btn btn-primary" href="${esc(r.href)}"${r.ext ? ' target="_blank" rel="noopener"' : ""}><span>${esc(t("training." + it.key + ".cta"))}</span>${icon("arrow")}</a>
          <a class="btn btn-ghost" href="${esc(CFG.links[it.link])}" target="_blank" rel="noopener">${esc(t("training.details"))}${icon("arrow")}</a>
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
  // Match the stylized world graphic: full longitude/latitude within the globe.
  const project = ([lat, lon]) => [50 + (lon / 180) * 40, 50 - (lat / 90) * 40];

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
    const pts = CFG.offices.map((o) => { const [x, y] = project(COORDS[o.id]); return [x, y]; });
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
    const topicSources = { siem: "24%2F7-monitoring", cloud: "consulting", iso: "about", vuln: "consulting", eib: "about", bi: "about" };
    if (Object.prototype.hasOwnProperty.call(topicSources, kind)) {
      subject += t("detail." + kind + ".title");
      html = `<h3 id="sheetTitle">${esc(t("detail." + kind + ".title"))}</h3><p>${esc(t("detail." + kind + ".p"))}</p>${checkList(t("detail." + kind + ".items"))}<a class="btn btn-ghost" href="https://silverbulletsecurity.com/${topicSources[kind]}" target="_blank" rel="noopener">${esc(t("detail.source"))}${icon("arrow")}</a>`;

    } else if (kind === "consulting") {
      subject += t("svc.consulting.title");
      html = `<h3 id="sheetTitle">${esc(t("consulting.heading"))}</h3>
        <p>${esc(t("consulting.intro"))}</p>
        <p>${esc(t("consulting.approach"))}</p>
        <h4>${esc(t("consulting.listTitle"))}</h4>
        ${t("consulting.groups").map((g, i) => `<div class="acc${i === 0 ? " open" : ""}">
          <button type="button" class="acc-btn" aria-expanded="${i === 0}">${esc(g[0])}<small>${g[1].length}</small>${icon("down")}</button>
          <div class="acc-body"><div>${checkList(g[1])}</div></div></div>`).join("")}`;
    } else if (kind === "monitoring") {
      subject += t("svc.monitoring.title");
      const k = TIERS[tier];
      html = `<h3 id="sheetTitle">${esc(t("monitoring.heading"))}</h3>
        <p>${esc(t("monitoring.intro"))}</p>
        <h4>${esc(t("monitoring.procTitle"))}</h4>${checkList(t("monitoring.procs"))}
        <h4>${esc(t("monitoring.areasTitle"))}</h4>${checkList(t("monitoring.areas"))}
        <h4>${esc(t("monitoring.tiersTitle"))}</h4>
        <p class="tier-scroll-hint">${esc(t("tier.scroll"))}</p><div class="tiers" data-selected="${tier}" role="group" aria-label="${esc(t("monitoring.tiersTitle"))}">${TIERS.map((n, i) =>
          `<button type="button" class="tier tier-${n}${i === tier ? " sel" : ""}" data-tier="${i}"${window.matchMedia("(hover: none) and (pointer: coarse)").matches ? " disabled" : ""} aria-pressed="${i === tier}"><span class="tier-emblem" aria-hidden="true"><svg viewBox="0 0 64 72"><path d="M32 4 56 14v20c0 16-12 27-24 34C20 61 8 50 8 34V14Z"/><path class="tier-check" d="m21 35 8 8 16-18"/></svg></span><span class="tier-label"><b>${esc(t("tier." + n))}</b><span>${t("tier." + n + ".items").length} ${esc(t("tier.count"))}</span></span><span class="tier-rank" aria-hidden="true">${"▰".repeat(i + 1)}</span></button>`).join("")}</div>
        <div class="tier-dots" role="group" aria-label="${esc(t("monitoring.tiersTitle"))}">${TIERS.map((n,i)=>`<button type="button" class="tier-dot tier-dot-${n}${i===tier ? " sel" : ""}" data-tier-dot="${i}" aria-label="${esc(t("tier."+n))}" title="${esc(t("tier."+n))}" aria-pressed="${i===tier}"><span class="tier-dot-mark" aria-hidden="true"></span><span class="tier-dot-label">${esc(t("tier."+n))}</span></button>`).join("")}</div>
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
    const dot = e.target.closest("[data-tier-dot]");
    const tb = dot ? $(`[data-tier="${dot.dataset.tierDot}"]`, $("#sheetBody")) : e.target.closest("[data-tier]");
    if (tb) {
      tier = Number(tb.dataset.tier);
      tb.closest(".tiers").dataset.selected = tier;
      buzz(12);
      $$("[data-tier]").forEach((x) => { const on = x === tb; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); });
      $$("[data-tier-dot]").forEach((x) => { const on = Number(x.dataset.tierDot) === tier; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); });
      $("#tierFor").textContent = t("tier." + TIERS[tier] + ".for");
      $("#tierList").innerHTML = checkList(t("tier." + TIERS[tier] + ".items"), "tier-list swap");
      const table = $(".cmp[data-sel]");
      if (table) table.dataset.sel = tier;
    }
  });

  // One wheel gesture advances one level; at the ends, normal sheet scrolling resumes.
  let tierWheelTime = 0, tierWheelDelta = 0, tierWheelLast = 0;
  $("#sheetScroll").addEventListener("wheel", (e) => {
    const stack = e.target.closest(".tiers");
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    if (!stack || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
    const direction = Math.sign(e.deltaY), next = tier + direction;
    if (next < 0 || next >= TIERS.length) { tierWheelDelta = 0; return; }
    e.preventDefault();
    const now = performance.now();
    if (now - tierWheelTime < 420) return;
    if (now - tierWheelLast > 180 || Math.sign(tierWheelDelta) !== direction) tierWheelDelta = 0;
    tierWheelLast = now;
    tierWheelDelta += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stack.clientHeight : 1);
    if (Math.abs(tierWheelDelta) < 30) return;
    tierWheelTime = now; tierWheelDelta = 0;
    $(`[data-tier="${next}"]`, stack).click();
  }, { passive: false });
  $("#sheetBody").addEventListener("keydown", (e) => {
    const button = e.target.closest("[data-tier]");
    if (!button || !["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? 2 : Math.min(2, Math.max(0, tier + (e.key === "ArrowDown" ? 1 : -1)));
    const target = $(`[data-tier="${next}"]`, button.closest(".tiers"));
    target.click(); target.focus({ preventScroll: true });
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
    if (!el || reduceMotion || (el.matches(".tier") && window.matchMedia("(hover: none) and (pointer: coarse)").matches)) return;
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
    if (!group || reduceMotion || (group.matches(".tiers") && window.matchMedia("(hover: none) and (pointer: coarse)").matches)) return;
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

  /* ---------- Circuit traces: the dot rides the path as you scroll, the trail stays lit ---------- */
  // Each trace: main path points (fractions of width/height) + side branches
  // [from point index, end x, end y] that light up when the dot passes that point.
  const TRACE_SHAPES = [
    { pts: [[0.015, 0], [0.015, 0.16], [0.9, 0.16], [0.9, 0.6], [0.46, 0.6], [0.46, 0.84], [0.015, 0.84], [0.015, 1]],
      branches: [[2, 0.9, 0.04], [4, 0.62, 0.74], [5, 0.62, 0.84]] },
    { pts: [[0.96, 0], [0.96, 0.32], [0.58, 0.32], [0.58, 0.7], [0.015, 0.7], [0.015, 1]],
      branches: [[1, 0.8, 0.18], [3, 0.78, 0.7], [2, 0.58, 0.16]] },
    { pts: [[0.5, 0], [0.5, 0.22], [0.16, 0.22], [0.16, 0.52], [0.84, 0.52], [0.84, 0.82], [0.015, 0.82], [0.015, 1]],
      branches: [[2, 0.16, 0.08], [4, 0.96, 0.4], [5, 0.96, 0.82]] },
    { pts: [[0.96, 0], [0.96, 0.46], [0.34, 0.46], [0.34, 0.78], [0.015, 0.78], [0.015, 1]],
      branches: [[1, 0.72, 0.3], [2, 0.34, 0.24], [3, 0.6, 0.9]] },
  ];
  const SVGNS = "http://www.w3.org/2000/svg";
  const traces = $$(".trace").map((el) => ({ el, def: TRACE_SHAPES[Number(el.dataset.variant) % TRACE_SHAPES.length] }));

  function roundedPath(pts, r) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1);
      if (l1 < 0.5 || l2 < 0.5) { d += ` L${x1} ${y1}`; continue; } // repeated point: no corner to round
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const ax = x1 - ((x1 - x0) / l1) * rr, ay = y1 - ((y1 - y0) / l1) * rr;
      const bx = x1 + ((x2 - x1) / l2) * rr, by = y1 + ((y2 - y1) / l2) * rr;
      d += ` L${ax.toFixed(1)} ${ay.toFixed(1)} Q${x1.toFixed(1)} ${y1.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    return d + ` L${last[0]} ${last[1]}`;
  }

  function buildTrace(tr) {
    const w = tr.el.clientWidth, h = tr.el.clientHeight;
    if (!w || !h) return;
    const P = ([fx, fy]) => [Math.round(fx * w), Math.round(fy * h)];
    const pts = tr.def.pts.map(P);
    const d = roundedPath(pts, 16);
    // Branches leave the main trace at a right angle, then turn to their pad
    const stubs = tr.def.branches.map(([i, fx, fy]) => {
      const [x0, y0] = pts[i], [x1, y1] = P([fx, fy]);
      const bend = Math.abs(x1 - x0) > Math.abs(y1 - y0) ? [x1, y0] : [x0, y1];
      return { i, d: roundedPath([[x0, y0], bend, [x1, y1]], 10), end: [x1, y1] };
    });
    tr.el.innerHTML = `<svg viewBox="0 0 ${w} ${h}">
      ${stubs.map((b) => `<path class="base" d="${b.d}"/>`).join("")}
      <path class="base" d="${d}"/>
      ${stubs.map((b, k) => `<path class="stub" data-k="${k}" d="${b.d}"/>`).join("")}
      <path class="lit" d="${d}"/></svg>`;
    tr.lit = $(".lit", tr.el);
    tr.total = tr.lit.getTotalLength();
    tr.lit.style.strokeDasharray = tr.total;
    let acc = 0;
    tr.nodes = pts.map((p, i) => {
      if (i) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const n = document.createElement("i");
      n.className = "node";
      n.style.left = p[0] + "px";
      n.style.top = p[1] + "px";
      tr.el.appendChild(n);
      return { n, at: acc };
    });
    tr.nodes.forEach((x) => { x.at = x.at / acc; });
    tr.stubs = stubs.map((b, k) => {
      const pad = document.createElement("i");
      pad.className = "pad";
      pad.style.left = b.end[0] + "px";
      pad.style.top = b.end[1] + "px";
      tr.el.appendChild(pad);
      return { path: $(`.stub[data-k="${k}"]`, tr.el), pad, at: tr.nodes[b.i].at };
    });
    tr.spark = document.createElement("i");
    tr.spark.className = "spark";
    tr.el.appendChild(tr.spark);
    tr.last = -1;
  }

  function updateTraces() {
    const vh = window.innerHeight;
    for (const tr of traces) {
      if (!tr.lit) continue;
      const r = tr.el.getBoundingClientRect();
      const p = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * 0.72 - r.top) / (r.height + vh * 0.22)));
      if (Math.abs(p - tr.last) < 0.0005) continue;
      tr.last = p;
      tr.lit.style.strokeDashoffset = (tr.total * (1 - p)).toFixed(1);
      const pt = tr.lit.getPointAtLength(tr.total * p);
      tr.spark.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
      tr.spark.classList.toggle("on", p > 0.001 && p < 0.999 && !reduceMotion);
      tr.nodes.forEach((x) => x.n.classList.toggle("on", p >= x.at - 0.001 && p > 0.001));
      tr.stubs.forEach((x) => {
        const on = p >= x.at - 0.001 && p > 0.001;
        x.path.classList.toggle("on", on);
        x.pad.classList.toggle("on", on);
      });
    }
  }
  function buildTraces() { traces.forEach(buildTrace); updateTraces(); }
  let traceRt;
  window.addEventListener("resize", () => { clearTimeout(traceRt); traceRt = setTimeout(buildTraces, 150); });

  /* ---------- In-page links scroll without touching the URL hash.
     iOS Safari re-scrolls to a #target whenever its toolbar resizes, which used to
     pull the page back down from the logo screen after tapping the scroll cue. ---------- */
  function scrollToTarget(id) {
    const smooth = reduceMotion ? "auto" : "smooth";
    if (id === "home" || id === "") { window.scrollTo({ top: 0, behavior: smooth }); return; }
    const el = document.getElementById(id);
    if (!el) return;
    if (el.matches("[data-section]")) el.scrollIntoView({ behavior: smooth, block: "start" });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: smooth });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    scrollToTarget(a.getAttribute("href").slice(1));
  });
  if (location.hash) {
    const id = location.hash.slice(1);
    history.replaceState(null, "", location.pathname + location.search);
    requestAnimationFrame(() => scrollToTarget(id));
  }

  /* ---------- Scroll behaviour ---------- */
  const progress = $("#progress");
  let ticking = false;
  /* Opening logo screen: fades as you scroll, comes back (and replays) at the top */
  const intro = $("#intro");
  let leftIntro = false;
  function syncIntro() {
    const y = Math.max(0, window.scrollY);
    const vh = window.innerHeight;
    document.body.classList.toggle("at-intro", y < vh * 0.35);
    if (!reduceMotion) intro.style.setProperty("--ip", Math.min(1, y / (vh * 0.7)).toFixed(3));
    if (y > vh * 0.6) leftIntro = true;
    if (leftIntro && y < vh * 0.08) {
      leftIntro = false;
      intro.classList.remove("play");
      void intro.offsetWidth;
      intro.classList.add("play");
    }
  }
  // Measure stable layout positions; transforms are applied only after all reads.
  const heroRevealItems = $$(".hero-reveal");
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  function syncHeroReveal() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    const states = heroRevealItems.map((el) => {
      const top = el.offsetTop + el.offsetParent.getBoundingClientRect().top;
      const enter = clamp01((vh * 0.95 - top) / (vh * 0.65));
      const leave = clamp01((top + vh * 0.45) / (vh * 0.45));
      const progress = Math.min(enter, leave);
      const opacity = progress * progress * (3 - 2 * progress);
      return { el, opacity, offset: 56 * (1 - enter) - 36 * (1 - leave) };
    });
    states.forEach(({ el, opacity, offset }) => {
      el.style.setProperty("--hero-opacity", opacity.toFixed(3));
      el.style.setProperty("--hero-offset", `${offset.toFixed(2)}px`);
    });
  }
  // iOS can skip the last scroll event of a fling, so re-check when the scroll settles
  ["scrollend", "touchend", "resize", "orientationchange"].forEach((ev) =>
    window.addEventListener(ev, () => requestAnimationFrame(() => { syncIntro(); syncHeroReveal(); }), { passive: true }));
  new IntersectionObserver(() => syncIntro(), { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }).observe(intro);
  function onScroll() {
    const y = window.scrollY;
    syncIntro();
    syncHeroReveal();
    updateTraces();
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

  /* ---------- Cyber defense grid: circuit routes, secure nodes and data packets ---------- */
  (function network() {
    const cv = $("#net"), ctx = cv.getContext("2d");
    let w = 0, h = 0, routes = [], raf = 0, running = false, last = 0;
    let pulse = null, scrollProgress = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 600 ? 9 : 16;
      routes = Array.from({ length: count * 2 }, (_, i) => {
        const right = i >= count, n = i % count;
        const edge = right ? w : 0, dir = right ? -1 : 1;
        // Each side/route has a stable independent seed, so resizing preserves its identity.
        let seed = (Math.imul(i + 1, 2654435761) ^ (right ? 0x6d2b79f5 : 0x1b873593)) >>> 0;
        const random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        const rowHeight = h / count;
        let y = (n + .2 + random() * .6) * rowHeight;
        const reach = w * (.35 + random() * .15);
        const bends = 1 + Math.floor(random() * 3);
        const points = [[edge, y]];
        for (let j = 0; j < bends; j++) {
          const fraction = (j + .28 + random() * .35) / (bends + .2);
          const x = edge + dir * reach * fraction;
          points.push([x, y]);
          const shift = (random() < .5 ? -1 : 1) * rowHeight * (.22 + random() * .55);
          y = Math.min(h - 8, Math.max(8, y + shift));
          // Mix right-angle and diagonal transitions, with different run lengths.
          const diagonal = random() < .65 ? Math.min(reach * .08, Math.abs(shift)) : 0;
          if (diagonal > 0 || y !== points[points.length - 1][1]) points.push([x + dir * diagonal, y]);
        }
        points.push([edge + dir * reach, y]);
        const lengths = points.slice(1).map((p,j) => Math.hypot(p[0]-points[j][0], p[1]-points[j][1]));
        return { points, lengths, total: lengths.reduce((a,b)=>a+b,0), red: random() < .28, phase: random(), speed: .00013 + random() * .0001 };

      });
    }
    function draw(now = 0) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const target = motion.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll));
      scrollProgress += (target - scrollProgress) * .18;
      if (Math.abs(target - scrollProgress) < .0001) scrollProgress = target;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      // Architectural grid with crosshair intersections, rather than drifting dust.
      ctx.strokeStyle = "rgba(77,155,183,.09)";
      const step = w < 600 ? 48 : 64;
      ctx.beginPath();
      for (let x = 0; x < w; x += step) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
      for (let y = 0; y < h; y += step) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
      ctx.stroke();
      for (const route of routes) {
        // Extend each circuit from its anchored screen edge as the page scrolls.
        const growth = motion.matches ? 1 : 1 + scrollProgress * .14;
        const edge = route.points[0][0];
        const fullPoints = route.points.map(([x,y]) => [edge + (x-edge)*growth, y]);
        const fullLengths = fullPoints.slice(1).map((p,i)=>Math.hypot(p[0]-fullPoints[i][0],p[1]-fullPoints[i][1]));
        const fullTotal = fullLengths.reduce((a,b)=>a+b,0);
        let remaining = fullTotal * (motion.matches ? 1 : .9 + scrollProgress * .1);
        const points = [fullPoints[0]];
        for (let i=0;i<fullLengths.length;i++) {
          const a=fullPoints[i], b=fullPoints[i+1];
          const amount=Math.min(1,remaining/fullLengths[i]);
          points.push([a[0]+(b[0]-a[0])*amount,a[1]+(b[1]-a[1])*amount]);
          remaining-=fullLengths[i];
          if(remaining<=0) break;
        }
        const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
        const total=lengths.reduce((a,b)=>a+b,0);
        const time = motion.matches ? 0 : now / 1000;
        const phase = route.phase * Math.PI * 2;
        const dx = motion.matches ? 0 : Math.sin(time * .55 + phase) * (w < 600 ? 5 : 10);
        const dy = motion.matches ? 0 : Math.cos(time * .45 + phase) * (w < 600 ? 8 : 14);
        const energy = motion.matches ? .5 : (Math.sin(time * 1.4 + phase) + 1) / 2;
        ctx.save();
        ctx.translate(dx, dy);
        const color = route.red ? "224,80,94" : "65,194,220";
        ctx.strokeStyle = `rgba(${color},${.32 + energy * .18})`;
        ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
        // A moving dashed highlight makes the data direction visible along the circuit.
        ctx.setLineDash([18, 70]);
        ctx.lineDashOffset = motion.matches ? 0 : -now * .045 - route.phase * 88;
        ctx.strokeStyle = `rgba(${color},.7)`;
        ctx.stroke();
        ctx.setLineDash([]);
        const [ex,ey] = points[points.length-1];
        const halo = 5 + energy * 5;
        ctx.strokeStyle = `rgba(${color},${.08 + energy * .18})`;
        ctx.strokeRect(ex-halo,ey-halo,halo*2,halo*2);
        ctx.shadowColor = `rgb(${color})`; ctx.shadowBlur = 5 + energy * 10;
        ctx.strokeStyle = `rgba(${color},.65)`;
        ctx.strokeRect(ex-3,ey-3,6,6);
        ctx.shadowBlur = 0;
        let distance = ((motion.matches ? .55 : now * route.speed + route.phase) % 1) * total;
        for (let j=0;j<lengths.length;j++) {
          if (distance <= lengths[j]) {
            const t = distance / lengths[j], a = points[j], b = points[j+1];
            const x = a[0]+(b[0]-a[0])*t, y = a[1]+(b[1]-a[1])*t;
            ctx.shadowColor = `rgb(${color})`; ctx.shadowBlur = 12;
            ctx.fillStyle = `rgba(${color},.95)`; ctx.fillRect(x-2,y-2,4,4); ctx.shadowBlur = 0; break;
          }
          distance -= lengths[j];
        }
        ctx.restore();
      }
      if (!motion.matches) {
        const scan = (now * .035) % (h + 180) - 180;
        const gradient = ctx.createLinearGradient(0,scan,0,scan+140);
        gradient.addColorStop(0,"rgba(65,194,220,0)"); gradient.addColorStop(1,"rgba(65,194,220,.055)");
        ctx.fillStyle=gradient; ctx.fillRect(0,scan,w,140);
        ctx.fillStyle="rgba(65,194,220,.16)"; ctx.fillRect(0,scan+140,w,1);
      }
      if (pulse) {
        const age=(now-pulse.time)/1100;
        if(age>=1) pulse=null;
        else { ctx.strokeStyle=`rgba(224,80,94,${(1-age)*.65})`; const r=12+age*110; ctx.strokeRect(pulse.x-r,pulse.y-r,r*2,r*2); }
      }
    }
    function frame(now) {
      if (!running) return;
      if(now-last>=32) { draw(now); last=now; }
      raf=requestAnimationFrame(frame);
    }
    function sync() {
      cancelAnimationFrame(raf); running=!document.hidden && !motion.matches;
      if(running) raf=requestAnimationFrame(frame); else draw();
    }
    size(); draw();
    let resizeTimer;
    window.addEventListener("resize",()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{size(); if(!running) draw();},150); });
    document.addEventListener("pointerdown",e=>{
      if(motion.matches || e.target.closest("a,button,summary")) return;
      const r=cv.getBoundingClientRect(); pulse={x:e.clientX-r.left,y:e.clientY-r.top,time:performance.now()};
    });
    sync();
    document.addEventListener("visibilitychange",sync);
    motion.addEventListener("change",sync);
  })();

  /* ---------- Opening logo: pointer, touch and keyboard emphasis ---------- */
  (function introLogoEmphasis() {
    const logo = $(".intro-logo");
    const opening = $("#intro");
    const activate = () => opening.classList.add("logo-emphasis");
    const reset = () => opening.classList.remove("logo-emphasis");
    logo.addEventListener("contextmenu", (e) => e.preventDefault());
    logo.addEventListener("dragstart", (e) => e.preventDefault());
    logo.addEventListener("pointerenter", activate);
    logo.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") e.preventDefault();
      activate();
    });
    logo.addEventListener("pointerleave", reset);
    logo.addEventListener("pointercancel", reset);
    logo.addEventListener("focus", activate);
    logo.addEventListener("blur", reset);
    document.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") reset(); });
    window.addEventListener("blur", reset);
  })();

  /* ---------- Cookie notice ---------- */
  const cookie = $("#cookie");
  if (!store.get("sbs-cookie")) cookie.hidden = false;
  $("#cookieOk").addEventListener("click", () => { store.set("sbs-cookie", "1"); cookie.hidden = true; buzz(); });

  /* ---------- Boot ---------- */
  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  setActive("home");
  applyLang();
  buildTraces();
  onScroll();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
