// app.js — handles landing + app page

const NT_API_BASE = window.NT_API_BASE || "https://news-thing.onrender.com";

// ---------- helpers ----------
function timeAgo(dateString) {
  if (!dateString) return "Just now";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Just now";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function clampText(str, maxChars) {
  const s = (str || "").replace(/\s+/g, " ").trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, Math.max(0, maxChars - 1)).trim() + "…";
}

function isAiRelated(article) {
  const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
  return (
    text.includes("artificial intelligence") ||
    text.includes("machine learning") ||
    text.includes("openai") ||
    text.includes("chatgpt") ||
    /\bgpt-?\d\b/.test(text) ||
    /\bai\b/.test(text)
  );
}

// SAFETY: politics OR killing/war => 3
function computeSafety(category, article) {
  const cat = (category || "").toLowerCase();
  const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();

  // category hard rules
  if (cat.includes("politic")) return 3;
  if (cat === "donald_trump") return 3;

  // keyword hard rules
  const killWords = ["killed","killing","dead","death","murder","shot","shooting","massacre","slain"];
  const warWords  = ["war","invasion","airstrike","bomb","missile","attack","terror","hostage","genocide","conflict"];
  if (killWords.some(w => text.includes(w)) || warWords.some(w => text.includes(w))) return 3;

  // light/medium
  const easyCats = ["events","fashion","equestrian","skiing","weather","entertainment","trends","royal_family","polo"];
  if (easyCats.includes(cat)) return 1;

  const mediumCats = ["sports","nba","stocks","economies","economics","finance","media","education","football","celebrities","hockey"];
  if (mediumCats.includes(cat)) return 2;

  return 2;
}

function safetyClass(level) {
  if (level === 1) return "nt-safety-1";
  if (level === 3) return "nt-safety-3";
  return "nt-safety-2";
}

function scenarioLabel(s) {
  if (!s) return "";
  if (s === "event") return "at an event";
  if (s === "school") return "at school";
  if (s === "family") return "with family";
  if (s === "online") return "online";
  return s;
}

// Varied icebreakers (not repetitive)
const ICEBREAKER_TEMPLATES = [
  (t, s) => `“Have you seen this? ${t}”`,
  (t, s) => `“I keep seeing this everywhere — ${t}. What do you think?”`,
  (t, s) => `“Quick question: ${t}. Have you heard about it?”`,
  (t, s) => `“This is kind of interesting: ${t}. Does it sound real to you?”`,
  (t, s) => `“People are talking about ${t}. Are you following it at all?”`,
  (t, s) => `“Random but… ${t}. What’s your take?”`,
  (t, s) => `“I’m curious — ${t}. Would you bring this up or skip it?”`,
  (t, s) => `“Okay I need your opinion: ${t}.”`,
  (t, s) => `“Someone mentioned this ${s ? scenarioLabel(s) : ""}: ${t}. Have you seen it?”`.replace(/\s+/g," ").trim(),
  (t, s) => `“I’m trying to keep up with what’s trending — ${t}. Is it a big thing?”`
];

function pickIcebreaker(article, scenario) {
  const title = clampText(article.title || "this", 92);
  const fn = ICEBREAKER_TEMPLATES[Math.floor(Math.random() * ICEBREAKER_TEMPLATES.length)];
  return fn(title, scenario);
}

// ---------- slide deck logic ----------
function resetAnim(card) {
  card.classList.remove("slide-out-left","slide-out-right","slide-in-left","slide-in-right","slide-in-active");
}

function slide(card, direction, renderFn) {
  const outClass = direction > 0 ? "slide-out-left" : "slide-out-right";
  const inStart  = direction > 0 ? "slide-in-right" : "slide-in-left";

  resetAnim(card);
  card.classList.add(outClass);

  setTimeout(() => {
    resetAnim(card);
    card.classList.add(inStart);
    renderFn();
    requestAnimationFrame(() => {
      card.classList.add("slide-in-active");
      setTimeout(() => resetAnim(card), 220);
    });
  }, 200);
}

function attachSwipe(card, onNext, onPrev) {
  let startX = 0, startY = 0;
  let active = false;

  const threshold = 18; // easy swipe

  card.addEventListener("touchstart", (e) => {
    active = true;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  card.addEventListener("touchend", (e) => {
    if (!active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    active = false;

    if (Math.abs(dy) > Math.abs(dx)) return; // ignore vertical
    if (Math.abs(dx) < threshold) { onNext(); return; }
    if (dx < 0) onNext(); else onPrev();
  });

  // Desktop drag
  let down = false;
  card.addEventListener("mousedown", (e) => { down = true; startX = e.clientX; startY = e.clientY; });
  window.addEventListener("mouseup", (e) => {
    if (!down) return;
    down = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < threshold) { onNext(); return; }
    if (dx < 0) onNext(); else onPrev();
  });

  // Tap/click -> next (fast)
  card.addEventListener("click", () => onNext());
}

// ---------- landing: world map detail ----------
function setupWorldMap() {
  const pins = document.querySelectorAll(".nt-world-pin");
  const nameEl = document.getElementById("world-detail-name");
  const catsEl = document.getElementById("world-detail-cats");
  const btnUse = document.getElementById("btn-use-country");
  const btnOpen = document.getElementById("btn-open-country-page");
  if (!pins.length || !nameEl || !catsEl || !btnUse || !btnOpen) return;

  let chosen = null;

  pins.forEach((pin) => {
    pin.addEventListener("click", () => {
      const id = pin.dataset.country;
      const cfg = (typeof NT_COUNTRY_CONFIG !== "undefined") ? NT_COUNTRY_CONFIG[id] : null;
      if (!cfg) return;
      chosen = id;

      nameEl.textContent = cfg.label;
      catsEl.innerHTML = "";

      const set = new Set([...(cfg.newsCats||[]), ...(cfg.socialCats||[])]);
      [...set].forEach((c) => {
        const chip = document.createElement("span");
        chip.className = "nt-chip";
        chip.textContent = (NT_CATEGORY_LABELS && NT_CATEGORY_LABELS[c]) ? NT_CATEGORY_LABELS[c] : c.replace(/_/g," ");
        catsEl.appendChild(chip);
      });

      btnUse.disabled = false;
      btnUse.onclick = () => location.href = `./app.html?country=${encodeURIComponent(id)}`;
      btnOpen.href = `./app.html?country=${encodeURIComponent(id)}`;
    });
  });
}

// ---------- landing: rotating preview stack ----------
let gStack = [];
let gIndex = 0;

function renderGlobal() {
  const card = document.getElementById("global-card");
  if (!card) return;

  const a = gStack[gIndex];
  if (!a) return;

  const source = document.getElementById("g-source");
  const time = document.getElementById("g-time");
  const title = document.getElementById("g-title");
  const summary = document.getElementById("g-summary");
  const safety = document.getElementById("g-safety");
  const ice = document.getElementById("g-ice");
  const ai = document.getElementById("g-ai");
  const counter = document.getElementById("g-counter");

  const level = computeSafety(a._category || "top", a);
  const isAI = isAiRelated(a);

  source.textContent = a.sourceName || "Source";
  time.textContent = timeAgo(a.pubDate);
  title.textContent = clampText(a.title, 120);
  summary.textContent = clampText(a.description, 320);

  safety.textContent = String(level);
  safety.classList.remove("nt-safety-1","nt-safety-2","nt-safety-3");
  safety.classList.add(safetyClass(level));

  ice.textContent = pickIcebreaker(a, "event");
  ai.style.display = isAI ? "block" : "none";
  counter.textContent = `${gIndex + 1} / ${gStack.length}`;
}

async function loadGlobalPreview() {
  const card = document.getElementById("global-card");
  if (!card) return;

  try {
    const res = await fetch(`${NT_API_BASE}/api/news?region=usa&category=top`);
    const json = await res.json();
    gStack = (json.articles || []).slice(0, 12).map(a => ({...a, _category:"top"}));
    gIndex = 0;

    renderGlobal();

    attachSwipe(
      card,
      () => { // next
        if (!gStack.length) return;
        gIndex = (gIndex + 1) % gStack.length;
        slide(card, +1, renderGlobal);
      },
      () => { // prev
        if (!gStack.length) return;
        gIndex = (gIndex - 1 + gStack.length) % gStack.length;
        slide(card, -1, renderGlobal);
      }
    );

    // auto-rotate every 6s (feels like a real stack)
    setInterval(() => {
      if (!gStack.length) return;
      gIndex = (gIndex + 1) % gStack.length;
      slide(card, +1, renderGlobal);
    }, 6000);

  } catch (e) {
    console.error("Global preview failed", e);
  }
}

// ---------- app page stacks ----------
let currentScenario = null;

let newsStack = [], newsIndex = 0;
let socialStack = [], socialIndex = 0;

function setupPanic() {
  const btn = document.getElementById("btn-panic");
  const modal = document.getElementById("panic-modal");
  if (!btn || !modal) return;

  const txt = document.getElementById("panic-text");
  const close = document.getElementById("panic-close");
  const next = document.getElementById("panic-next");
  const back = modal.querySelector(".nt-modal-backdrop");

  function randomLine() {
    const lang = "en";
    const arr = (NT_ICEPACKS_BY_LANG && NT_ICEPACKS_BY_LANG[lang]) ? NT_ICEPACKS_BY_LANG[lang] : [];
    return arr[Math.floor(Math.random() * arr.length)] || "What’s something you’ve been quietly obsessed with recently?";
  }

  function open() {
    txt.textContent = randomLine();
    modal.classList.add("nt-modal-open");
    modal.setAttribute("aria-hidden","false");
  }
  function hide() {
    modal.classList.remove("nt-modal-open");
    modal.setAttribute("aria-hidden","true");
  }

  btn.addEventListener("click", open);
  close.addEventListener("click", hide);
  back.addEventListener("click", hide);
  next.addEventListener("click", () => txt.textContent = randomLine());
}

function initAppPage() {
  const form = document.getElementById("nt-selection-form");
  if (!form) return;

  const selCountry = document.getElementById("sel-country");
  const selNews = document.getElementById("sel-news-cat");
  const selSocial = document.getElementById("sel-social-cat");
  const scenarioRow = document.getElementById("scenario-row");
  const summary = document.getElementById("stacks-summary");

  // News DOM
  const newsCard = document.getElementById("news-card");
  const newsStatus = document.getElementById("news-stack-status");
  const nSource = document.getElementById("news-source");
  const nTime = document.getElementById("news-time");
  const nTitle = document.getElementById("news-title");
  const nSummary = document.getElementById("news-summary");
  const nSafety = document.getElementById("news-safety");
  const nAI = document.getElementById("news-ai-warning");
  const nIce = document.getElementById("news-ice");
  const nLink = document.getElementById("news-link");
  const nCounter = document.getElementById("news-counter");

  // Social DOM
  const socialCard = document.getElementById("social-card");
  const socialStatus = document.getElementById("social-stack-status");
  const sSource = document.getElementById("social-source");
  const sTime = document.getElementById("social-time");
  const sTitle = document.getElementById("social-title");
  const sSummary = document.getElementById("social-summary");
  const sSafety = document.getElementById("social-safety");
  const sAI = document.getElementById("social-ai-warning");
  const sIce = document.getElementById("social-ice");
  const sLink = document.getElementById("social-link");
  const sCounter = document.getElementById("social-counter");

  // Fill countries
  selCountry.innerHTML = "";
  Object.entries(NT_COUNTRY_CONFIG).forEach(([id,cfg]) => {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = cfg.label;
    selCountry.appendChild(o);
  });

  // Preselect from URL
  const params = new URLSearchParams(location.search);
  const initCountry = params.get("country");
  if (initCountry && NT_COUNTRY_CONFIG[initCountry]) selCountry.value = initCountry;

  function fillCats() {
    const cfg = NT_COUNTRY_CONFIG[selCountry.value];
    selNews.innerHTML = "";
    selSocial.innerHTML = "";

    (cfg.newsCats||[]).forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = NT_CATEGORY_LABELS[c] || c;
      selNews.appendChild(o);
    });
    (cfg.socialCats||[]).forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = NT_CATEGORY_LABELS[c] || c;
      selSocial.appendChild(o);
    });
  }
  fillCats();
  selCountry.addEventListener("change", fillCats);

  // Scenarios
  scenarioRow.innerHTML = "";
  NT_SCENARIOS.forEach(s => {
    const b = document.createElement("button");
    b.type="button";
    b.className="nt-pill";
    b.textContent = s[0].toUpperCase()+s.slice(1);
    b.onclick = () => {
      currentScenario = s;
      [...scenarioRow.children].forEach(x => x.classList.toggle("nt-pill-active", x===b));
    };
    scenarioRow.appendChild(b);
  });

  function renderNews() {
    if (!newsStack.length) {
      newsStatus.textContent = "No cards loaded. Try another category.";
      newsCard.style.visibility = "hidden";
      nCounter.textContent = "0 / 0";
      return;
    }
    newsCard.style.visibility = "visible";
    const a = newsStack[newsIndex];
    const level = computeSafety(a._category, a);
    const ai = isAiRelated(a);

    nSource.textContent = a.sourceName || "Source";
    nTime.textContent = timeAgo(a.pubDate);
    nTitle.textContent = clampText(a.title, 120);
    nSummary.textContent = clampText(a.description, 320);

    nSafety.textContent = String(level);
    nSafety.classList.remove("nt-safety-1","nt-safety-2","nt-safety-3");
    nSafety.classList.add(safetyClass(level));

    nAI.style.display = ai ? "block" : "none";
    nAI.textContent = ai ? "AI can be polarizing — start light and read the vibe." : "";

    nIce.textContent = pickIcebreaker(a, currentScenario);
    nLink.href = a.url || "#";
    nCounter.textContent = `${newsIndex+1} / ${newsStack.length}`;
    newsStatus.textContent = "";
  }

  function renderSocial() {
    if (!socialStack.length) {
      socialStatus.textContent = "No cards loaded. Try another category.";
      socialCard.style.visibility = "hidden";
      sCounter.textContent = "0 / 0";
      return;
    }
    socialCard.style.visibility = "visible";
    const a = socialStack[socialIndex];
    const level = computeSafety(a._category, a);
    const ai = isAiRelated(a);

    sSource.textContent = a.sourceName || "Source";
    sTime.textContent = timeAgo(a.pubDate);
    sTitle.textContent = clampText(a.title, 120);
    sSummary.textContent = clampText(a.description, 320);

    sSafety.textContent = String(level);
    sSafety.classList.remove("nt-safety-1","nt-safety-2","nt-safety-3");
    sSafety.classList.add(safetyClass(level));

    sAI.style.display = ai ? "block" : "none";
    sAI.textContent = ai ? "AI can be polarizing — start light and read the vibe." : "";

    sIce.textContent = pickIcebreaker(a, currentScenario);
    sLink.href = a.url || "#";
    sCounter.textContent = `${socialIndex+1} / ${socialStack.length}`;
    socialStatus.textContent = "";
  }

  async function buildStacks(countryId, newsCat, socialCat) {
    newsStatus.textContent = "Loading…";
    socialStatus.textContent = "Loading…";
    newsCard.style.visibility = "hidden";
    socialCard.style.visibility = "hidden";

    try {
      const [r1, r2] = await Promise.all([
        fetch(`${NT_API_BASE}/api/news?region=${encodeURIComponent(countryId)}&category=${encodeURIComponent(newsCat)}`),
        fetch(`${NT_API_BASE}/api/news?region=${encodeURIComponent(countryId)}&category=${encodeURIComponent(socialCat)}`)
      ]);
      const j1 = await r1.json();
      const j2 = await r2.json();

      newsStack = (j1.articles || []).slice(0, 30).map(a => ({...a, _category: newsCat}));
      socialStack = (j2.articles || []).slice(0, 30).map(a => ({...a, _category: socialCat}));

      newsIndex = 0; socialIndex = 0;
      renderNews(); renderSocial();

    } catch (e) {
      console.error(e);
      newsStatus.textContent = "Failed to load. Try again.";
      socialStatus.textContent = "Failed to load. Try again.";
    }
  }

  // Swipe controls
  attachSwipe(
    newsCard,
    () => { if(!newsStack.length) return; newsIndex=(newsIndex+1)%newsStack.length; slide(newsCard,+1,renderNews); },
    () => { if(!newsStack.length) return; newsIndex=(newsIndex-1+newsStack.length)%newsStack.length; slide(newsCard,-1,renderNews); }
  );
  attachSwipe(
    socialCard,
    () => { if(!socialStack.length) return; socialIndex=(socialIndex+1)%socialStack.length; slide(socialCard,+1,renderSocial); },
    () => { if(!socialStack.length) return; socialIndex=(socialIndex-1+socialStack.length)%socialStack.length; slide(socialCard,-1,renderSocial); }
  );

  setupPanic();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const countryId = selCountry.value;
    const newsCat = selNews.value;
    const socialCat = selSocial.value;

    summary.textContent =
      `${NT_COUNTRY_CONFIG[countryId].label} · News: ${NT_CATEGORY_LABELS[newsCat]||newsCat} · Social: ${NT_CATEGORY_LABELS[socialCat]||socialCat}` +
      (currentScenario ? ` · Scenario: ${scenarioLabel(currentScenario)}` : "");

    buildStacks(countryId, newsCat, socialCat);
  });
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", () => {
  setupWorldMap();
  loadGlobalPreview();
  initAppPage();

  const footerLang = document.getElementById("footer-lang");
  if (footerLang && typeof ntGetFooterLanguageLabel === "function") {
    footerLang.textContent = ntGetFooterLanguageLabel("en");
  }
});
