/* Interactive extras: readiness check, IT/OT segmentation demo, phishing game, hidden terminal.
   Self-contained: remove this file and its <script> tag (plus the four containers in index.html)
   to take them out again. Depends on window.SBS from main.js. */
(function () {
  "use strict";
  const SBS = window.SBS;
  if (!SBS) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const t = (k) => SBS.t(k);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fill = (str, n) => String(str).replace("{n}", n);
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
            <button type="button" class="btn btn-ghost" data-open="monitoring">${icon("layers")}<span>${esc(t("ix.as.tiers"))}</span></button>
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
          <button type="button" class="seg-cta" data-open="consulting">${esc(t("ix.seg.cta"))}${icon("arrow")}</button>
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
     3. Spot-the-phishing game
     ========================================================= */
  const phEl = $("#phishGame");
  const SPOTS = ["from", "subject", "hello", "body", "button", "attach"];
  let found = new Set(), revealed = false;

  function spot(key, inner) { return `<button type="button" class="ph-spot${found.has(key) || revealed ? " on" : ""}" data-spot="${key}">${inner}<span class="ph-tip" role="note">${esc(t("ix.ph.tips")[key])}</span></button>`; }

  function renderPhish() {
    if (!phEl) return;
    const done = found.size === SPOTS.length;
    phEl.innerHTML = `<div class="ph-head"><p class="eyebrow">${esc(t("ix.ph.eyebrow"))}</p><h3>${esc(t("ix.ph.title"))}</h3><p class="sub">${esc(t("ix.ph.sub"))}</p></div>
      <div class="ph-mail" aria-label="${esc(t("ix.ph.demo"))}">
        <div class="ph-demo">${esc(t("ix.ph.demo"))}</div>
        <div class="ph-row"><span class="ph-k">${esc(t("ix.ph.from"))}</span>${spot("from", `IT Helpdesk &lt;support@acme-payrol1.co&gt;`)}</div>
        <div class="ph-row"><span class="ph-k">${esc(t("ix.ph.subjLabel"))}</span>${spot("subject", `<strong>${esc(t("ix.ph.subject"))}</strong>`)}</div>
        <div class="ph-body">
          ${spot("hello", esc(t("ix.ph.hello")))}
          ${spot("body", esc(t("ix.ph.body")))}
          ${spot("button", `<span class="ph-fakebtn">${esc(t("ix.ph.button"))}</span><small>acme-payroll.secure-login.xyz/verify</small>`)}
          <p class="ph-sign">${esc(t("ix.ph.sign"))}</p>
          ${spot("attach", `<span class="ph-file">${icon("box")}Payroll_Update.pdf.exe</span>`)}
        </div>
      </div>
      <div class="ph-foot">
        <div class="ph-meter"><i style="width:${((revealed ? SPOTS.length : found.size) / SPOTS.length) * 100}%"></i></div>
        <p class="ph-score">${esc(fill(t("ix.ph.found"), revealed ? SPOTS.length : found.size))}</p>
        ${done || revealed ? `<p class="ph-end">${esc(t(done && !revealed ? "ix.ph.win" : "ix.ph.shown"))}</p>
          <div class="ph-actions"><a class="btn btn-primary" href="${mailto(SBS.cfg.trainingEmail, t("ix.ph.cta"))}">${icon("training")}<span>${esc(t("ix.ph.cta"))}</span></a><button type="button" class="btn btn-ghost" data-ph="again">${esc(t("ix.ph.again"))}</button></div>`
          : `<div class="ph-actions"><button type="button" class="btn btn-ghost" data-ph="reveal">${esc(t("ix.ph.reveal"))}</button></div>`}
      </div>`;
  }

  if (phEl) {
    phEl.addEventListener("click", (e) => {
      const s = e.target.closest("[data-spot]");
      const a = e.target.closest("[data-ph]");
      if (s) {
        const k = s.dataset.spot;
        if (!found.has(k) && !revealed) { found.add(k); SBS.buzz(12); renderPhish(); const el = phEl.querySelector(`[data-spot="${k}"]`); if (el) el.classList.add("pop"); }
        return;
      }
      if (a) { if (a.dataset.ph === "reveal") revealed = true; else { found = new Set(); revealed = false; } SBS.buzz(); renderPhish(); }
    });
    onLang.push(renderPhish);
    renderPhish();
  }

  /* =========================================================
     4. Hidden terminal: ~ key, the >_ footer button, or 5 taps on the logo
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
  const go = (id) => { closeTerm(); setTimeout(() => SBS.scrollTo(id), 120); };
  const COMMANDS = {
    help: () => print("Commands: services · about · training · contact · assess · phish · whoami · date · lang en|th · ls · clear · exit"),
    ls: () => print("home/  services/  about/  training/  assess/  contact/"),
    services: () => { print("→ Opening services…", "ok"); go("services"); },
    about: () => { print("→ Opening about…", "ok"); go("about"); },
    training: () => { print("→ Opening training…", "ok"); go("training"); },
    contact: () => { print("→ Opening contact…", "ok"); go("contact"); },
    assess: () => { print("→ Starting the 1-minute security check…", "ok"); go("assess"); },
    phish: () => { print("→ Loading the phishing challenge…", "ok"); closeTerm(); setTimeout(() => $("#phishGame") && $("#phishGame").scrollIntoView({ behavior: SBS.reduceMotion ? "auto" : "smooth", block: "center" }), 120); },
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
  // Five quick taps on the logo
  let taps = [];
  $$(".brand").forEach((b) => b.addEventListener("click", () => {
    const now = Date.now();
    taps = taps.filter((x) => now - x < 2500).concat(now);
    if (taps.length >= 5) { taps = []; openTerm(); }
  }));
})();
