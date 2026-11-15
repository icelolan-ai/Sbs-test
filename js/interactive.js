/* Security Lab tools (lab.html): readiness check, IT/OT segmentation demo, scam practice, terminal.
   Depends on window.SBS from js/lab.js. */
(function () {
  "use strict";
  const SBS = window.SBS;
  if (!SBS) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => SBS.t(k);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fill = (str, n, m) => String(str).replace("{n}", n).replace("{m}", m);
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const mailto = (to, subject, body) => `mailto:${to}?subject=${encodeURIComponent(subject)}${body ? "&body=" + encodeURIComponent(body) : ""}`;
  const onLang = [];
  window.SBS_onLang = onLang;

  /* =========================================================
     1. Readiness check: 6 questions -> radar profile + tier
     ========================================================= */
  const assessEl = $("#assessApp");
  let answers = [], qIdx = -1; // -1 = intro, 0..5 = question, 6 = result

  function radar(vals) {
    const C = 130, R = 92, n = vals.length;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
    const ring = (f) => vals.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
    const shape = vals.map((v, i) => pt(i, (R * v) / 3).map((x) => x.toFixed(1)).join(",")).join(" ");
    const labels = t("ix.as.qs").map((q, i) => {
      const [x, y] = pt(i, R + 22);
      const anchor = Math.abs(x - C) < 6 ? "middle" : x > C ? "start" : "end";
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle">${esc(q[0])}</text>`;
    }).join("");
    const axes = vals.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
    const dots = vals.map((v, i) => { const [x, y] = pt(i, (R * v) / 3); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>`; }).join("");
    return `<svg class="radar" viewBox="-40 0 340 260" role="img" aria-label="${esc(t("ix.as.resultTitle"))}">
      <g class="r-grid"><polygon points="${ring(1)}"/><polygon points="${ring(2 / 3)}"/><polygon points="${ring(1 / 3)}"/>${axes}</g>
      <polygon class="r-shape" points="${shape}"/><g class="r-dots">${dots}</g><g class="r-labels">${labels}</g></svg>`;
  }

  function assessResult() {
    const need = answers.reduce((a, b) => a + b, 0); // 6..18
    let tier = need <= 9 ? 0 : need <= 13 ? 1 : 2;
    if (tier === 0 && (answers[1] === 3 || answers[2] === 3)) tier = 1; // audits or OT never fit the basic level
    const names = ["bronze", "silver", "gold"];
    const steps = t("ix.as.steps");
    const picks = [];
    [3, 2].forEach((lvl) => answers.forEach((v, i) => { if (v === lvl && steps[i + "-" + lvl] && picks.length < 3) picks.push(steps[i + "-" + lvl]); }));
    return { tier, name: names[tier], picks };
  }

  function renderAssess(animate) {
    if (!assessEl) return;
    const qs = t("ix.as.qs");
    let html = "";
    if (qIdx < 0) {
      html = `<div class="as-intro">
        <div class="as-icons" aria-hidden="true">${qs.map((q, i) => `<span style="--i:${i}">${esc(q[0])}</span>`).join("")}</div>
        <button type="button" class="btn btn-primary" data-as="start">${esc(t("ix.as.start"))}${icon("arrow")}</button></div>`;
    } else if (qIdx < qs.length) {
      const q = qs[qIdx];
      html = `<div class="as-top"><span>${esc(fill(t("ix.as.step"), qIdx + 1))}</span><span class="as-axis">${esc(q[0])}</span></div>
        <div class="as-bar"><i style="width:${((qIdx) / qs.length) * 100}%"></i></div>
        <h3 class="as-q">${esc(q[1])}</h3>
        <div class="as-opts" role="group">${q[2].map((o, i) => `<button type="button" class="as-opt${answers[qIdx] === i + 1 ? " sel" : ""}" data-as-opt="${i + 1}"><b>${i + 1}</b><span>${esc(o)}</span></button>`).join("")}</div>
        ${qIdx > 0 ? `<button type="button" class="as-back" data-as="back">${icon("arrow")}<span>${esc(t("ix.as.back"))}</span></button>` : ""}`;
    } else {
      const r = assessResult();
      const summary = qs.map((q, i) => `- ${q[0]}: ${q[2][answers[i] - 1]}`).join("\n");
      const body = `${t("ix.as.mailIntro")}\n\n${summary}\n\n${t("ix.as.suggest")}: ${t("tier." + r.name)}\n`;
      html = `<div class="as-result">
        <div class="as-chart">${radar(answers)}</div>
        <div class="as-text">
          <p class="eyebrow">${esc(t("ix.as.resultTitle"))}</p>
          <p class="as-suggest">${esc(t("ix.as.suggest"))}</p>
          <p class="as-tier tier-${r.name}"><i></i>${esc(t("tier." + r.name))}</p>
          <p class="sub">${esc(t("ix.as.tierWhy")[r.tier])}</p>
          <h4>${esc(t("ix.as.nextTitle"))}</h4>
          <ul class="checks">${(r.picks.length ? r.picks : [t("ix.as.none")]).map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>
          <div class="as-actions">
            <a class="btn btn-primary" href="${mailto(SBS.cfg.email, t("ix.as.mailSubject"), body)}">${icon("contact")}<span>${esc(t("ix.as.send"))}</span></a>
            <a class="btn btn-ghost" href="index.html#open-monitoring">${icon("layers")}<span>${esc(t("ix.as.tiers"))}</span></a>
            <button type="button" class="btn btn-ghost" data-as="retake">${esc(t("ix.as.retake"))}</button>
          </div>
          <p class="cmp-note">${esc(t("ix.as.note"))}</p>
        </div></div>`;
    }
    assessEl.innerHTML = html;
    if (animate) { assessEl.classList.remove("swap"); void assessEl.offsetWidth; assessEl.classList.add("swap"); }
  }

  if (assessEl) {
    assessEl.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-as-opt]");
      const act = e.target.closest("[data-as]");
      if (opt) {
        answers[qIdx] = Number(opt.dataset.asOpt);
        opt.classList.add("sel");
        SBS.buzz(10);
        setTimeout(() => { qIdx++; renderAssess(true); if (qIdx === 6) assessEl.scrollIntoView({ block: "nearest", behavior: SBS.reduceMotion ? "auto" : "smooth" }); }, SBS.reduceMotion ? 0 : 220);
        return;
      }
      if (!act) return;
      if (act.dataset.as === "start") { qIdx = 0; answers = []; }
      else if (act.dataset.as === "back") qIdx = Math.max(0, qIdx - 1);
      else if (act.dataset.as === "retake") { qIdx = 0; answers = []; }
      SBS.buzz();
      renderAssess(true);
    });
    onLang.push(() => renderAssess(false));
    renderAssess(false);
  }

  /* =========================================================
     2. IT/OT segmentation demo
     ========================================================= */
  const segEl = $("#segDemo");
  const NODES = {
    pc: [48, 50, "it"], mail: [48, 112, "it"], files: [48, 178, "it"], erp: [118, 192, "it"], itc: [118, 112, "core"],
    fw: [190, 112, "fw"], otc: [262, 112, "core"], hmi: [262, 50, "ot"], plc1: [334, 78, "ot"], plc2: [332, 160, "ot"], line: [262, 192, "ot"],
  };
  const BASE_EDGES = [["pc", "itc"], ["mail", "itc"], ["files", "itc"], ["erp", "itc"], ["otc", "hmi"], ["otc", "plc1"], ["otc", "plc2"], ["otc", "line"]];
  const SYSTEMS = ["pc", "mail", "files", "erp", "hmi", "plc1", "plc2", "line"];
  let segMode = "flat", segTimers = [], infected = new Set(), segDone = false;

  function segEdges() { return BASE_EDGES.concat(segMode === "flat" ? [["itc", "otc"]] : [["itc", "fw"], ["fw", "otc"]]); }

  function renderSeg() {
    if (!segEl) return;
    const nm = t("ix.seg.nodes");
    const edges = segEdges().map(([a, b]) => `<line class="e" data-e="${a}-${b}" x1="${NODES[a][0]}" y1="${NODES[a][1]}" x2="${NODES[b][0]}" y2="${NODES[b][1]}"/>`).join("");
    const nodes = Object.entries(NODES).filter(([k]) => segMode === "seg" || k !== "fw").map(([k, [x, y, kind]]) =>
      kind === "core"
        ? `<g class="n core" data-n="${k}"><rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4"/></g>`
        : `<g class="n ${kind}" data-n="${k}"><circle cx="${x}" cy="${y}" r="${kind === "fw" ? 15 : 13}"/>${kind === "fw" ? `<path d="M${x - 6} ${y - 4}h12M${x - 6} ${y}h12M${x - 6} ${y + 4}h12M${x - 2} ${y - 7}v3M${x + 3} ${y - 3}v3M${x - 2} ${y + 1}v3" class="fw-mark"/>` : ""}<text x="${x}" y="${y + 26}" text-anchor="middle">${esc(nm[k])}</text></g>`).join("");
    segEl.innerHTML = `<div class="seg-head"><p class="eyebrow">${esc(t("ix.seg.eyebrow"))}</p><h3>${esc(t("ix.seg.title"))}</h3><p class="sub">${esc(t("ix.seg.sub"))}</p></div>
      <div class="seg-body">
        <div class="seg-stage">
          <svg viewBox="0 0 380 230" class="seg-svg" role="img" aria-label="${esc(t("ix.seg.title"))}">
            <rect class="zone it" x="8" y="6" width="152" height="218" rx="14"/><text class="zone-l" x="20" y="24">${esc(t("ix.seg.it"))}</text>
            <rect class="zone ot" x="220" y="6" width="152" height="218" rx="14"/><text class="zone-l" x="232" y="24">${esc(t("ix.seg.ot"))}</text>
            <g class="edges">${edges}</g><g class="nodes">${nodes}</g>
          </svg>
        </div>
        <div class="seg-side">
          <div class="seg-mode" role="group">
            <button type="button" data-seg-mode="flat" aria-pressed="${segMode === "flat"}">${esc(t("ix.seg.flat"))}</button>
            <button type="button" data-seg-mode="seg" aria-pressed="${segMode === "seg"}">${esc(t("ix.seg.segmented"))}</button>
          </div>
          <p class="seg-count" id="segCount">${esc(fill(t("ix.seg.count"), infected.size))}</p>
          <p class="seg-msg" id="segMsg">${segDone ? esc(t(segMode === "flat" ? "ix.seg.flatDone" : "ix.seg.segDone")) : ""}</p>
          <div class="seg-actions">
            <button type="button" class="btn btn-primary" data-seg="run">${icon("shield")}<span>${esc(t("ix.seg.run"))}</span></button>
            <button type="button" class="btn btn-ghost" data-seg="reset">${esc(t("ix.seg.reset"))}</button>
          </div>
          <a class="seg-cta" href="index.html#open-consulting">${esc(t("ix.seg.cta"))}${icon("arrow")}</a>
        </div>
      </div>`;
    infected.forEach((k) => mark(k));
  }

  function mark(k, cls = "hit") { const g = segEl.querySelector(`[data-n="${k}"]`); if (g) g.classList.add(cls); }
  function segClear() { segTimers.forEach(clearTimeout); segTimers = []; }
  function segReset() { segClear(); infected = new Set(); segDone = false; renderSeg(); }

  function segRun() {
    segReset();
    const adj = {};
    segEdges().forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
    // Breadth-first spread from the infected laptop; the firewall never passes it on.
    const order = [], seen = new Set(["pc"]);
    let frontier = ["pc"], step = 0;
    while (frontier.length) {
      frontier.forEach((n) => order.push([n, step]));
      const next = [];
      frontier.forEach((n) => { if (n === "fw") return; (adj[n] || []).forEach((m) => { if (!seen.has(m)) { seen.add(m); next.push(m); } }); });
      frontier = next; step++;
    }
    const delay = SBS.reduceMotion ? 0 : 420;
    order.forEach(([n, s]) => segTimers.push(setTimeout(() => {
      if (n === "fw") { mark("fw", "block"); SBS.buzz(20); return; }
      if (NODES[n][2] !== "core") infected.add(n);
      mark(n);
      const c = $("#segCount"); if (c) c.textContent = fill(t("ix.seg.count"), infected.size);
    }, s * delay)));
    const total = (Math.max(...order.map((o) => o[1])) + 1) * delay;
    segTimers.push(setTimeout(() => {
      segDone = true;
      const m = $("#segMsg"); if (m) m.textContent = t(segMode === "flat" ? "ix.seg.flatDone" : "ix.seg.segDone");
      segEl.classList.toggle("safe", segMode === "seg");
    }, total));
  }

  if (segEl) {
    segEl.addEventListener("click", (e) => {
      const m = e.target.closest("[data-seg-mode]");
      const a = e.target.closest("[data-seg]");
      if (m) { segMode = m.dataset.segMode; segEl.classList.remove("safe"); segReset(); SBS.buzz(); }
      if (a) { SBS.buzz(); a.dataset.seg === "run" ? segRun() : segReset(); }
    });
    onLang.push(renderSeg);
    renderSeg();
  }

  /* =========================================================
     3. Spot-the-scam practice: five scenarios, each with its own warning signs
     ========================================================= */
  const phEl = $("#phishGame");
  const SCEN = [
    { id: "mail", spots: ["from", "subject", "hello", "body", "button", "attach"] },
    { id: "sms", spots: ["sender", "fee", "deadline", "link"] },
    { id: "chat", spots: ["newnum", "gift", "secret", "codes"] },
    { id: "login", spots: ["secure", "url", "lure", "otp"] },
    { id: "inv", spots: ["from", "reply", "bank", "pressure", "zip"] },
  ];
  const TOTAL = SCEN.reduce((a, s) => a + s.spots.length, 0);
  let scIdx = 0;
  let scState = SCEN.map(() => ({ found: new Set(), revealed: false }));
  const scDone = (i) => scState[i].revealed || scState[i].found.size === SCEN[i].spots.length;

  function scenarioHtml(i) {
    const id = SCEN[i].id, P = t("ix.ph.s")[id], L = t("ix.ph.lbl"), st = scState[i];
    const spot = (key, inner) => `<button type="button" class="ph-spot${st.found.has(key) || st.revealed ? " on" : ""}" data-spot="${key}">${inner}<span class="ph-tip" role="note">${esc(P.tips[key])}</span></button>`;
    const demo = `<div class="ph-demo">${esc(t("ix.ph.demo"))}</div>`;
    if (id === "mail") return `<div class="ph-mail">${demo}
        <div class="ph-row"><span class="ph-k">${esc(L.from)}</span>${spot("from", "IT Helpdesk &lt;support@acme-payrol1.co&gt;")}</div>
        <div class="ph-row"><span class="ph-k">${esc(L.subject)}</span>${spot("subject", `<strong>${esc(P.subject)}</strong>`)}</div>
        <div class="ph-body">${spot("hello", esc(P.hello))}${spot("body", esc(P.body))}
          ${spot("button", `<span class="ph-fakebtn">${esc(P.button)}</span><small>acme-payroll.secure-login.xyz/verify</small>`)}
          <p class="ph-sign">${esc(P.sign)}</p>${spot("attach", `<span class="ph-file">${icon("box")}Payroll_Update.pdf.exe</span>`)}</div></div>`;
    if (id === "sms") return `<div class="ph-phone">${demo}
        <div class="ph-phone-top">${spot("sender", "+44 7700 900123")}</div>
        <div class="ph-sms"><span>${esc(P.p1)}</span> ${spot("fee", esc(P.fee))} ${spot("deadline", esc(P.deadline))} ${spot("link", "<u>swft-parcel.co/pay?id=88213</u>")}</div>
        <time class="ph-time">10:42</time></div>`;
    if (id === "chat") return `<div class="ph-chat">${demo}
        <div class="ph-chat-top"><span class="ph-avatar" aria-hidden="true">S</span><div><strong>${esc(P.name)}</strong><small>${esc(P.contact)}</small></div></div>
        <div class="ph-bubbles">${["newnum", "gift", "secret", "codes"].map((k, n) => `<div class="ph-bub">${spot(k, esc(P["m" + (n + 1)]))}</div>`).join("")}</div></div>`;
    if (id === "login") return `<div class="ph-browser">${demo}
        <div class="ph-urlbar">${spot("secure", `<span class="ph-warn">⚠ ${esc(P.notsecure)}</span>`)}${spot("url", "http://acme-cloud.login-verify.co/signin")}</div>
        <div class="ph-login"><div class="ph-logo">Acme Cloud</div>${spot("lure", esc(P.lure))}
          <span class="ph-field"><small>${esc(P.email)}</small><span class="ph-input">name@company.com</span></span>
          <span class="ph-field"><small>${esc(P.password)}</small><span class="ph-input">••••••••</span></span>
          ${spot("otp", `<span class="ph-field"><small>${esc(P.otp)}</small><span class="ph-input">_ _ _ _ _ _</span></span>`)}
          <span class="ph-fakebtn">${esc(P.button)}</span></div></div>`;
    return `<div class="ph-mail">${demo}
        <div class="ph-row"><span class="ph-k">${esc(L.from)}</span>${spot("from", "Accounts &lt;accounts@acme-supp1ies.com&gt;")}</div>
        <div class="ph-row"><span class="ph-k">${esc(L.reply)}</span>${spot("reply", "finance.acme@freemail.com")}</div>
        <div class="ph-row"><span class="ph-k">${esc(L.subject)}</span><strong>${esc(P.subject)}</strong></div>
        <div class="ph-body"><p>${esc(P.hello)}</p>${spot("bank", esc(P.bank))}<p class="ph-acct">${esc(P.account)}</p>${spot("pressure", esc(P.pressure))}
          <p class="ph-sign">${esc(P.sign)}</p>${spot("zip", `<span class="ph-file">${icon("box")}Invoice_4471.zip</span>`)}</div></div>`;
  }

  function renderPhish(animateStage) {
    if (!phEl) return;
    const names = t("ix.ph.names"), sc = SCEN[scIdx], st = scState[scIdx];
    const shownCount = st.revealed ? sc.spots.length : st.found.size;
    const allDone = SCEN.every((_, i) => scDone(i));
    const own = scState.reduce((a, s, i) => a + (s.revealed ? Math.min(s.found.size, SCEN[i].spots.length) : s.found.size), 0);
    let foot;
    if (scDone(scIdx)) {
      foot = `<p class="ph-end">${esc(t(st.revealed ? "ix.ph.shown" : "ix.ph.win"))}</p>
        ${allDone ? `<p class="ph-total">${esc(fill(t("ix.ph.total"), own, TOTAL))}</p>` : ""}
        <div class="ph-actions">
          ${scIdx < SCEN.length - 1 ? `<button type="button" class="btn btn-primary" data-ph="next">${esc(t("ix.ph.next"))}${icon("arrow")}</button>` : `<a class="btn btn-primary" href="${mailto(SBS.cfg.trainingEmail, t("ix.ph.cta"))}">${icon("training")}<span>${esc(t("ix.ph.cta"))}</span></a>`}
          <button type="button" class="btn btn-ghost" data-ph="again">${esc(t("ix.ph.again"))}</button>
          ${allDone ? `<button type="button" class="btn btn-ghost" data-ph="restart">${esc(t("ix.ph.restart"))}</button>` : ""}
        </div>`;
    } else {
      foot = `<div class="ph-actions"><button type="button" class="btn btn-ghost" data-ph="reveal">${esc(t("ix.ph.reveal"))}</button></div>`;
    }
    phEl.innerHTML = `<div class="ph-head"><p class="eyebrow">${esc(t("ix.ph.eyebrow"))}</p><h3>${esc(t("ix.ph.title"))}</h3><p class="sub">${esc(t("ix.ph.sub"))}</p>
        <div class="ph-tabs" role="tablist">${SCEN.map((s, i) => `<button type="button" role="tab" class="ph-tab${scDone(i) ? " done" : ""}" data-ph-sc="${i}" aria-selected="${i === scIdx}"><b>${scDone(i) ? "✓" : i + 1}</b>${esc(names[i])}</button>`).join("")}</div></div>
      <div class="ph-stage" id="phStage"><p class="ph-intro">${esc(t("ix.ph.s")[sc.id].intro)}</p>${scenarioHtml(scIdx)}</div>
      <div class="ph-foot">
        <div class="ph-meter"><i style="width:${(shownCount / sc.spots.length) * 100}%"></i></div>
        <p class="ph-score">${esc(fill(t("ix.ph.found"), shownCount, sc.spots.length))}</p>
        ${foot}
      </div>`;
    if (animateStage) { const s = $("#phStage"); s.classList.remove("swap"); void s.offsetWidth; s.classList.add("swap"); }
  }

  if (phEl) {
    phEl.addEventListener("click", (e) => {
      const s = e.target.closest("[data-spot]");
      const a = e.target.closest("[data-ph]");
      const tab = e.target.closest("[data-ph-sc]");
      const st = scState[scIdx];
      if (s) {
        const k = s.dataset.spot;
        if (!st.found.has(k) && !st.revealed) { st.found.add(k); SBS.buzz(12); renderPhish(false); const el = phEl.querySelector(`[data-spot="${k}"]`); if (el) el.classList.add("pop"); }
        return;
      }
      if (tab) { scIdx = Number(tab.dataset.phSc); SBS.buzz(); renderPhish(true); return; }
      if (!a) return;
      if (a.dataset.ph === "reveal") st.revealed = true;
      else if (a.dataset.ph === "again") scState[scIdx] = { found: new Set(), revealed: false };
      else if (a.dataset.ph === "next") scIdx = Math.min(SCEN.length - 1, scIdx + 1);
      else if (a.dataset.ph === "restart") { scState = SCEN.map(() => ({ found: new Set(), revealed: false })); scIdx = 0; }
      SBS.buzz();
      renderPhish(a.dataset.ph !== "reveal");
      if (a.dataset.ph === "next" || a.dataset.ph === "restart") phEl.scrollIntoView({ block: "start", behavior: SBS.reduceMotion ? "auto" : "smooth" });
    });
    onLang.push(() => renderPhish(false));
    renderPhish(false);
  }

  /* =========================================================
     4. Terminal: the Open terminal button or the ~ key
     ========================================================= */
  const term = document.createElement("div");
  term.className = "xterm";
  term.hidden = true;
  term.setAttribute("role", "dialog");
  term.setAttribute("aria-modal", "true");
  term.innerHTML = `<div class="xterm-win">
      <div class="xterm-bar"><i></i><i></i><i></i><span>guest@silverbullet: ~</span><button type="button" class="xterm-x" aria-label="Close">${icon("close")}</button></div>
      <div class="xterm-out" id="xtermOut" aria-live="polite"></div>
      <form class="xterm-in" autocomplete="off"><span>guest@sbs:~$</span><input id="xtermIn" spellcheck="false" autocapitalize="off" autocomplete="off" enterkeyhint="go" aria-label="Command"></form>
    </div>`;
  document.body.appendChild(term);
  const out = $("#xtermOut", term), input = $("#xtermIn", term);
  let hist = [], hi = 0, lastFocus = null;

  function print(text, cls = "") {
    const line = document.createElement("div");
    line.className = "xl " + cls;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }
  const go = (id) => { closeTerm(); if (document.getElementById(id)) setTimeout(() => SBS.scrollTo(id), 120); else location.href = "index.html#" + id; };
  const COMMANDS = {
    help: () => print("Commands: home · services · about · training · contact · assess · network · phish · whoami · date · lang en|th · ls · clear · exit"),
    ls: () => print("home/  services/  about/  training/  contact/  lab/assess  lab/network  lab/phish"),
    services: () => { print("→ Opening services…", "ok"); go("services"); },
    about: () => { print("→ Opening about…", "ok"); go("about"); },
    training: () => { print("→ Opening training…", "ok"); go("training"); },
    contact: () => { print("→ Opening contact…", "ok"); go("contact"); },
    assess: () => { print("→ Starting the 1-minute security check…", "ok"); go("assess"); },
    phish: () => { print("→ Loading the scam practice…", "ok"); go("phish"); },
    network: () => { print("→ Loading the network demo…", "ok"); go("segment"); },
    home: () => { print("→ Back to the main site…", "ok"); closeTerm(); location.href = "index.html"; },
    whoami: () => print("guest — curious visitor. Clearance level: coffee."),
    date: () => print(new Date().toString()),
    clear: () => { out.innerHTML = ""; },
    exit: () => closeTerm(),
    email: () => print(SBS.cfg.email),
    phone: () => print(SBS.cfg.phone || "—"),
    sudo: () => print("Nice try. This incident has been logged. (Not really.)", "warn"),
    hack: () => print("Access denied. Try `assess` — it's more useful.", "warn"),
  };
  function run(raw) {
    const cmd = raw.trim();
    print("guest@sbs:~$ " + cmd, "cmd");
    if (!cmd) return;
    hist.push(cmd); hi = hist.length;
    const [c, arg] = cmd.toLowerCase().split(/\s+/);
    if (c === "lang") {
      if (arg === "en" || arg === "th") { SBS.setLang(arg); print("Language: " + arg.toUpperCase(), "ok"); }
      else print("usage: lang en | lang th");
      return;
    }
    if (c === "sudo" || c.startsWith("rm")) return COMMANDS.sudo();
    (COMMANDS[c] || (() => print(`${c}: command not found. Type 'help'.`, "warn")))();
  }
  function openTerm() {
    if (!term.hidden) return;
    lastFocus = document.activeElement;
    term.hidden = false;
    document.body.classList.add("xterm-open");
    requestAnimationFrame(() => term.classList.add("open"));
    if (!out.childElementCount) {
      print("Silver Bullet Security — secure shell v1.0", "ok");
      print("Type 'help' to see what you can do.");
    }
    SBS.buzz(15);
    setTimeout(() => input.focus({ preventScroll: true }), 80);
  }
  function closeTerm() {
    if (term.hidden) return;
    term.classList.remove("open");
    document.body.classList.remove("xterm-open");
    setTimeout(() => { term.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $(".xterm-in", term).addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && hi > 0) { e.preventDefault(); input.value = hist[--hi]; }
    if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
  });
  $(".xterm-x", term).addEventListener("click", closeTerm);
  term.addEventListener("click", (e) => { if (e.target === term) closeTerm(); });
  document.addEventListener("keydown", (e) => {
    if (!term.hidden && e.key === "Escape") { e.stopImmediatePropagation(); closeTerm(); return; }
    const typing = e.target.closest && e.target.closest("input, textarea, [contenteditable]");
    if (!typing && (e.key === "`" || e.key === "~")) { e.preventDefault(); openTerm(); }
  }, true);
  const openBtn = $("#termOpen");
  if (openBtn) openBtn.addEventListener("click", openTerm);
})();
