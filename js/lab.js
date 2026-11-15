/* Security Lab page shell: language, in-page links and reveal-on-scroll.
   Exposes the same window.SBS helper that js/interactive.js expects. */
(function () {
  "use strict";
  const CFG = window.SBS_CONFIG;
  const DICT = window.SBS_I18N;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  let lang = store.get("sbs-lang") === "th" ? "th" : "en";
  const t = (k) => (DICT[lang][k] !== undefined ? DICT[lang][k] : DICT.en[k]);
  const buzz = (ms = 8) => { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); };

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("lab.metaTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("lab.sub"));
    $$("[data-i18n]").forEach((el) => { el.textContent = String(t(el.dataset.i18n)).replace("{year}", new Date().getFullYear()); });
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    (window.SBS_onLang || []).forEach((fn) => fn());
  }
  function setLang(l) {
    if (l === lang) return;
    lang = l;
    store.set("sbs-lang", l);
    buzz();
    applyLang();
  }
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  window.SBS = { t, get lang() { return lang; }, setLang, scrollTo, buzz, reduceMotion, cfg: CFG };

  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  // In-page links scroll without adding a #fragment (iOS re-scrolls to it when the toolbar resizes)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    scrollTo(a.getAttribute("href").slice(1));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.1 });
  $$(".reveal").forEach((el) => io.observe(el));

  applyLang();

  // Arriving from the main site with lab.html#assess etc.
  if (location.hash) {
    const id = location.hash.slice(1);
    history.replaceState(null, "", location.pathname + location.search);
    window.addEventListener("load", () => setTimeout(() => scrollTo(id), 80));
  }
})();
