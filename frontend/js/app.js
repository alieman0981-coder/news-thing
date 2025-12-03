// app.js — NEWS THING main logic

// Adjust this if needed
const apiBase = window.NT_API_BASE || "https://news-thing.onrender.com";

const state = {
  language: "en",
  country: "usa",
  newsCategory: "top",
  socialCategory: "trends",
  scenario: null,
  newsStack: [],
  socialStack: [],
  newsIndex: 0,
  socialIndex: 0,
  selectedMapCountry: null
};

function qs(sel) {
  return document.querySelector(sel);
}
function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

/* ---------- SAFETY + ICEBREAKER LOGIC ---------- */

function scoreSafety(article, categoryId) {
  // Base by category
  let risk = 1;

  const medCats = [
    "sports",
    "nba",
    "stocks",
    "economies",
    "economics",
    "finance",
    "royal_family",
    "celebrities",
    "media",
    "education"
  ];
  const highCats = ["politics"];

  if (medCats.includes(categoryId)) risk = 2;
  if (highCats.includes(categoryId)) risk = 2; // bumped later by keywords

  const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
  const redWords = [
    "war",
    "killed",
    "death",
    "dead",
    "shooting",
    "attack",
    "bomb",
    "explosion",
    "crash",
    "disaster",
    "suicide",
    "genocide",
    "massacre",
    "riot",
    "protest",
    "crisis",
    "recession",
    "corruption",
    "scandal",
    "laid off",
    "layoff"
  ];

  let hasRedWord = redWords.some((w) => text.includes(w));

  if (hasRedWord) {
    risk = Math.min(3, risk + 1);
  }

  return risk;
}

function isAiRelated(article) {
  const t = ((article.title || "") + " " + (article.description || "")).toLowerCase();
  return (
    t.includes(" ai ") ||
    t.startsWith("ai ") ||
    t.includes("artificial intelligence") ||
    t.includes("chatgpt") ||
    t.includes("gpt-") ||
    t.includes("openai")
  );
}

function pickIcebreaker(article, scenarioId) {
  const title = article.title || "";
  const baseTopic =
    title.length > 0
      ? title
      : article.description?.slice(0, 80) || "something that’s been trending";

  const safeTopic = baseTopic.replace(/\s+/g, " ").trim();

  const prefix = (() => {
    switch (scenarioId) {
      case "school":
        return "People in my class keep mentioning";
      case "family":
        return "I saw something about";
      case "online":
        return "Everyone online keeps talking about";
      case "event":
      default:
        return "I keep seeing headlines about";
    }
  })();

  const endingOptions = [
    "Have you seen anything about it?",
    "What do you think about it?",
    "Do you feel like people are overreacting or not talking about it enough?",
    "Does it come up much around you?"
  ];

  const ending = endingOptions[Math.floor(Math.random() * endingOptions.length)];

  return `${prefix} ${safeTopic.endsWith(".") ? safeTopic.slice(0, -1) : safeTopic}. ${ending}`;
}

/* ---------- FETCH HELPERS ---------- */

async function fetchNews(region, category) {
  try {
    const url = new URL("/api/news", apiBase);
    url.searchParams.set("region", region);
    url.searchParams.set("category", category);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();
    return Array.isArray(data.articles) ? data.articles : [];
  } catch (err) {
    console.error("fetchNews error", err);
    return [];
  }
}

function enrichArticles(articles, categoryId) {
  return (articles || []).map((a) => {
    const safety = scoreSafety(a, categoryId);
    return {
      ...a,
      _safety: safety,
      _category: categoryId,
      _ai: isAiRelated(a)
    };
  });
}

/* ---------- STACK RENDERING ---------- */

function formatTimeAgo(pubDate) {
  if (!pubDate) return "Just now";
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "Recently";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

function renderStackCard(type) {
  const stack = type === "news" ? state.newsStack : state.socialStack;
  const index = type === "news" ? state.newsIndex : state.socialIndex;

  const cardEl = qs(`#${type}-card`);
  const statusEl = qs(`#${type}-stack-status`);
  const counterEl = qs(`#${type}-counter`);
  const sourceEl = qs(`#${type}-source`);
  const timeEl = qs(`#${type}-time`);
  const titleEl = qs(`#${type}-title`);
  const summaryEl = qs(`#${type}-summary`);
  const linkEl = qs(`#${type}-link`);
  const safetyEl = qs(`#${type}-safety`);
  const aiEl = qs(`#${type}-ai-warning`);

  if (!cardEl || !statusEl) return;

  if (!stack.length) {
    statusEl.textContent = "No cards yet. Choose your setup and tap “Build my stacks”.";
    cardEl.style.visibility = "hidden";
    if (counterEl) counterEl.textContent = "0 / 0";
    return;
  }

  statusEl.textContent = "";
  cardEl.style.visibility = "visible";

  const clampedIndex = Math.min(Math.max(index, 0), stack.length - 1);
  if (type === "news") state.newsIndex = clampedIndex;
  else state.socialIndex = clampedIndex;

  const a = stack[clampedIndex];

  if (counterEl) counterEl.textContent = `${clampedIndex + 1} / ${stack.length}`;
  if (sourceEl) sourceEl.textContent = a.sourceName || "Source";
  if (timeEl) timeEl.textContent = formatTimeAgo(a.pubDate);
  if (titleEl) titleEl.textContent = a.title || "Untitled story";
  if (summaryEl)
    summaryEl.textContent = a.description
      ? a.description.replace(/<\/?[^>]+(>|$)/g, "")
      : "Short summary unavailable — you can still use the headline.";
  if (linkEl) linkEl.href = a.url || "#";

  if (safetyEl) {
    safetyEl.textContent = a._safety || 1;
    safetyEl.className = "nt-safety-badge";
    if (a._safety === 1) safetyEl.classList.add("nt-safety-1");
    else if (a._safety === 2) safetyEl.classList.add("nt-safety-2");
    else safetyEl.classList.add("nt-safety-3");
  }

  if (aiEl) {
    if (a._ai) {
      aiEl.style.display = "block";
      aiEl.textContent =
        "AI can be a sensitive topic — feel the other person’s vibe first and keep it light.";
    } else {
      aiEl.style.display = "none";
    }
  }

  const scenarioId = state.scenario || "event";
  const ice = pickIcebreaker(a, scenarioId);
  const iceEl = qs(`#${type}-ice`);
  if (iceEl) iceEl.textContent = ice;
}

function renderStacksSummary() {
  const el = qs("#stacks-summary");
  if (!el) return;

  const country = NT_COUNTRIES.find((c) => c.id === state.country);
  const newsCat = NT_CATEGORIES.find((c) => c.id === state.newsCategory);
  const socialCat = NT_CATEGORIES.find((c) => c.id === state.socialCategory);
  const scenario = NT_SCENARIOS.find((s) => s.id === state.scenario);

  const parts = [];
  if (country) parts.push(country.label);
  if (newsCat && socialCat) parts.push(`News: ${newsCat.label} · Social: ${socialCat.label}`);
  if (scenario) parts.push(`Scenario: ${scenario.label}`);

  el.textContent = parts.join(" · ");
}

/* ---------- PANIC MODAL ---------- */

function pickPanicLine(lang) {
  const list = NT_ICEPACKS_BY_LANG[lang] || NT_ICEPACKS_BY_LANG.en || [];
  if (!list.length) return "Ask them how their week has been so far.";
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function initPanicModal() {
  const modal = qs("#panic-modal");
  const panicBtn = qs("#btn-panic");
  const panicText = qs("#panic-text");
  const panicNext = qs("#panic-next");
  const panicClose = qs("#panic-close");

  if (!modal || !panicBtn || !panicText || !panicNext || !panicClose) return;

  function openModal() {
    panicText.textContent = pickPanicLine(state.language);
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }

  panicBtn.addEventListener("click", openModal);
  panicNext.addEventListener("click", () => {
    panicText.textContent = pickPanicLine(state.language);
  });
  panicClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("nt-modal-backdrop")) {
      closeModal();
    }
  });
}

/* ---------- WORLD MAP ---------- */

function populateWorldDetail(countryId) {
  const detailName = qs("#world-detail-name");
  const detailText = qs("#world-detail-text");
  const detailCats = qs("#world-detail-cats");
  const useBtn = qs("#btn-use-country");
  const openBtn = qs("#btn-open-country-page");
  const country = NT_COUNTRIES.find((c) => c.id === countryId);

  if (!country || !detailName || !detailText || !detailCats || !useBtn || !openBtn) return;

  state.selectedMapCountry = countryId;

  detailName.textContent = country.label;

  const catsIds = NT_COUNTRY_CATEGORY_MAP[countryId] || [];
  const catLabels = catsIds
    .map((cid) => NT_CATEGORIES.find((c) => c.id === cid))
    .filter(Boolean)
    .map((c) => c.label);

  detailText.textContent =
    catLabels.length > 0
      ? `We track topics like ${catLabels.join(" · ")} for ${country.label}.`
      : `We’re still wiring categories for ${country.label}.`;

  detailCats.innerHTML = "";
  catLabels.forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "nt-chip";
    chip.textContent = label;
    detailCats.appendChild(chip);
  });

  useBtn.disabled = false;
  openBtn.disabled = false;

  useBtn.onclick = () => {
    const sel = qs("#sel-country");
    if (sel) {
      sel.value = countryId;
      state.country = countryId;
      filterCategoriesForCountry(countryId);
    }
    document.getElementById("app").scrollIntoView({ behavior: "smooth" });
  };

  openBtn.onclick = () => {
    const sel = qs("#sel-country");
    if (sel) {
      sel.value = countryId;
      state.country = countryId;
      filterCategoriesForCountry(countryId);
    }
    document.getElementById("app").scrollIntoView({ behavior: "smooth" });
  };
}

function initWorldMap() {
  const pins = qsa(".nt-world-pin");
  pins.forEach((pin) => {
    pin.addEventListener("click", () => {
      const c = pin.getAttribute("data-country");
      if (c) populateWorldDetail(c);
    });
  });
}

/* ---------- SELECTION ---------- */

function populateDropdowns() {
  const countrySel = qs("#sel-country");
  const newsSel = qs("#sel-news-cat");
  const socialSel = qs("#sel-social-cat");

  if (!countrySel || !newsSel || !socialSel) return;

  countrySel.innerHTML = "";
  NT_COUNTRIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    countrySel.appendChild(opt);
  });

  countrySel.value = state.country;

  filterCategoriesForCountry(state.country);
}

function filterCategoriesForCountry(countryId) {
  const allowed = NT_COUNTRY_CATEGORY_MAP[countryId];
  const newsSel = qs("#sel-news-cat");
  const socialSel = qs("#sel-social-cat");
  if (!newsSel || !socialSel) return;

  const currentNews = state.newsCategory;
  const currentSocial = state.socialCategory;

  function rebuildSelect(selectEl, isNews) {
    selectEl.innerHTML = "";
    const all = NT_CATEGORIES || [];
    all.forEach((cat) => {
      if (Array.isArray(allowed) && !allowed.includes(cat.id)) return;
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      selectEl.appendChild(opt);
    });
    if (selectEl.options.length > 0) {
      const prev = isNews ? currentNews : currentSocial;
      if (prev && allowed && allowed.includes(prev)) {
        selectEl.value = prev;
      } else {
        selectEl.selectedIndex = 0;
      }
    }
  }

  rebuildSelect(newsSel, true);
  rebuildSelect(socialSel, false);

  state.newsCategory = newsSel.value;
  state.socialCategory = socialSel.value;
}

function initScenarioPills() {
  const row = qs("#scenario-row");
  if (!row) return;
  row.innerHTML = "";

  NT_SCENARIOS.forEach((s) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "nt-pill";
    pill.textContent = s.label;
    pill.dataset.id = s.id;
    pill.addEventListener("click", () => {
      if (state.scenario === s.id) {
        state.scenario = null;
      } else {
        state.scenario = s.id;
      }
      qsa(".nt-pill").forEach((p) => p.classList.remove("active"));
      if (state.scenario) pill.classList.add("active");
    });
    row.appendChild(pill);
  });
}

/* ---------- GLOBAL PREVIEW ---------- */

async function initGlobalPreview() {
  const sourceEl = qs("#gp-source");
  const timeEl = qs("#gp-time");
  const titleEl = qs("#gp-title");
  const summaryEl = qs("#gp-summary");
  const safetyEl = qs("#gp-safety");
  const iceEl = qs("#gp-ice");
  const aiEl = qs("#gp-ai-caution");

  try {
    const articles = await fetchNews("usa", "top");
    if (!articles.length) return;

    const enriched = enrichArticles(articles, "top");
    const first = enriched[0];

    if (sourceEl) sourceEl.textContent = first.sourceName || "Global source";
    if (timeEl) timeEl.textContent = formatTimeAgo(first.pubDate);
    if (titleEl) titleEl.textContent = first.title || "Live global topic";
    if (summaryEl)
      summaryEl.textContent =
        first.description?.replace(/<\/?[^>]+(>|$)/g, "") ||
        "A current story that people may be chatting about.";

    if (safetyEl) {
      safetyEl.textContent = first._safety || 2;
      safetyEl.className = "nt-safety-badge";
      safetyEl.classList.add(
        first._safety === 1 ? "nt-safety-1" : first._safety === 2 ? "nt-safety-2" : "nt-safety-3"
      );
    }

    if (aiEl) {
      if (first._ai) {
        aiEl.style.display = "block";
        aiEl.textContent =
          "AI can be a sensitive topic — feel the other person’s vibe first and keep it light.";
      } else {
        aiEl.style.display = "none";
      }
    }

    const ice = pickIcebreaker(first, "event");
    if (iceEl) iceEl.textContent = ice;
  } catch (err) {
    console.error("Global preview error", err);
  }
}

/* ---------- BUILD STACKS ---------- */

async function buildStacks(e) {
  if (e) e.preventDefault();

  const countrySel = qs("#sel-country");
  const newsSel = qs("#sel-news-cat");
  const socialSel = qs("#sel-social-cat");
  if (!countrySel || !newsSel || !socialSel) return;

  state.country = countrySel.value;
  state.newsCategory = newsSel.value;
  state.socialCategory = socialSel.value;

  const region = ntGetRegionKeyForCountry(state.country);

  const [newsArticles, socialArticles] = await Promise.all([
    fetchNews(region, state.newsCategory),
    fetchNews(region, state.socialCategory)
  ]);

  state.newsStack = enrichArticles(newsArticles, state.newsCategory);
  state.socialStack = enrichArticles(socialArticles, state.socialCategory);
  state.newsIndex = 0;
  state.socialIndex = 0;

  // Fallback if empty: inject one generic topic
  if (!state.newsStack.length) {
    state.newsStack = NT_TOPICS.map((t) => ({
      title: t.title,
      description: t.summary,
      url: "#",
      sourceName: t.sourceLabel || "Global trend",
      pubDate: new Date().toISOString(),
      _category: t.category || "trends",
      _safety: 1,
      _ai: false
    }));
  }
  if (!state.socialStack.length) {
    state.socialStack = state.newsStack.slice(0, 5);
  }

  renderStacksSummary();
  renderStackCard("news");
  renderStackCard("social");
}

/* ---------- INIT ---------- */

function initNavigation() {
  const heroStart = qs("#btn-hero-start");
  const heroExamples = qs("#btn-hero-examples");
  const backSelection = qs("#btn-back-selection");

  if (heroStart) {
    heroStart.addEventListener("click", () => {
      document.getElementById("app").scrollIntoView({ behavior: "smooth" });
    });
  }

  if (heroExamples) {
    heroExamples.addEventListener("click", () => {
      document.getElementById("world").scrollIntoView({ behavior: "smooth" });
    });
  }

  if (backSelection) {
    backSelection.addEventListener("click", () => {
      const selPanel = qs(".nt-selection-panel");
      if (selPanel) selPanel.scrollIntoView({ behavior: "smooth" });
    });
  }
}

function initCardsNavigation() {
  const newsPrev = qs("#news-prev");
  const newsNext = qs("#news-next");
  const socialPrev = qs("#social-prev");
  const socialNext = qs("#social-next");

  if (newsPrev)
    newsPrev.addEventListener("click", () => {
      if (!state.newsStack.length) return;
      state.newsIndex = Math.max(0, state.newsIndex - 1);
      renderStackCard("news");
    });
  if (newsNext)
    newsNext.addEventListener("click", () => {
      if (!state.newsStack.length) return;
      state.newsIndex = Math.min(state.newsStack.length - 1, state.newsIndex + 1);
      renderStackCard("news");
    });

  if (socialPrev)
    socialPrev.addEventListener("click", () => {
      if (!state.socialStack.length) return;
      state.socialIndex = Math.max(0, state.socialIndex - 1);
      renderStackCard("social");
    });
  if (socialNext)
    socialNext.addEventListener("click", () => {
      if (!state.socialStack.length) return;
      state.socialIndex = Math.min(state.socialStack.length - 1, state.socialIndex + 1);
      renderStackCard("social");
    });
}

/* ---------- LANG + FOOTER ---------- */

function initLanguage() {
  const toggle = qs("#nt-lang-toggle");
  const footerLang = qs("#footer-lang");
  if (!toggle || !footerLang) return;

  footerLang.textContent = ntGetFooterLanguageLabel(state.language);

  toggle.addEventListener("click", () => {
    state.language = state.language === "en" ? "ar" : "en";
    document.documentElement.dir = NT_RTL_LANGS.includes(state.language) ? "rtl" : "ltr";
    footerLang.textContent = ntGetFooterLanguageLabel(state.language);
  });
}

/* ---------- ENTRY ---------- */

function initApp() {
  initNavigation();
  populateDropdowns();
  initScenarioPills();
  initWorldMap();
  initGlobalPreview();
  initPanicModal();
  initCardsNavigation();
  initLanguage();

  const form = qs("#nt-selection-form");
  if (form) {
    form.addEventListener("submit", buildStacks);
  }
}

document.addEventListener("DOMContentLoaded", initApp);
