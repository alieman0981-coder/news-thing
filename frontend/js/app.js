// app.js – main logic for NEWS THING

const apiBase =
  (window.NEWS_THING_CONFIG && window.NEWS_THING_CONFIG.apiBase) ||
  (location.origin.includes("localhost")
    ? "http://localhost:4000"
    : location.origin);

const state = {
  language: "en",
  country: "saudi",
  newsCategory: "top",
  socialCategory: "new_trends",
  scenario: "event",
  level: 1,
  newsStack: [],
  socialStack: [],
  newsIndex: 0,
  socialIndex: 0
};

function qs(selector) {
  return document.querySelector(selector);
}
function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

// ----- Screens -----
function showScreen(id) {
  qsa(".screen").forEach(el => el.classList.remove("active-screen"));
  const el = qs("#" + id);
  if (el) el.classList.add("active-screen");
}

// ----- Dropdowns -----
function populateDropdowns() {
  const countrySel = qs("#sel-country");
  const langSel = qs("#sel-lang");
  const newsSel = qs("#sel-news-cat");
  const socialSel = qs("#sel-social-cat");

  if (!countrySel || !langSel || !newsSel || !socialSel) return;
  if (!Array.isArray(NT_COUNTRIES) || !Array.isArray(NT_LANGUAGES) || !Array.isArray(NT_CATEGORIES)) {
    console.error("NT_* data arrays missing from data.js");
    return;
  }

  NT_COUNTRIES.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    if (c.id === "saudi") opt.selected = true;
    countrySel.appendChild(opt);
  });

  NT_LANGUAGES.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.label;
    if (l.code === "en") opt.selected = true;
    langSel.appendChild(opt);
  });

  NT_CATEGORIES.forEach(cat => {
    const opt1 = document.createElement("option");
    opt1.value = cat.id;
    opt1.textContent = cat.label;
    if (cat.id === "top") opt1.selected = true;
    newsSel.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = cat.id;
    opt2.textContent = cat.label;
    if (cat.id === "new_trends") opt2.selected = true;
    socialSel.appendChild(opt2);
  });
}

// ----- Backend -----
async function fetchStack(countryId, categoryId) {
  // map selected country to backend region key (gulf, europe, americas, global)
  const regionKey =
    typeof ntGetRegionKeyForCountry === "function"
      ? ntGetRegionKeyForCountry(countryId)
      : countryId;

  const url = new URL("/api/news", apiBase);
  url.searchParams.set("region", regionKey);
  url.searchParams.set("category", categoryId);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch " + url.toString());
  const data = await res.json();
  return Array.isArray(data.articles) ? data.articles : [];
}


// ----- Icebreakers -----
function buildIcebreaker(article, lang) {
  const title = article.title || "";
  const shortened =
    title.length > 80 ? title.slice(0, 77).replace(/\s+\S*$/, "") + "…" : title;

  const templates = {
    en: [
      `Have you seen what’s going on with “${shortened}”?`,
      `What do you think about this whole “${shortened}” thing?`,
      `If this came up at an event, would you join the conversation about “${shortened}”?`
    ],
    ar: [
      `سمعتي عن موضوع “${shortened}”؟`,
      `إيش رأيك بكل اللي يصير حول “${shortened}”؟`
    ]
  };

  const list = templates[lang] || templates["en"];
  const opener = list[0];
  const followups = list.slice(1);
  return { opener, followups };
}

// ----- Sidebar -----
function renderSidebar() {
  const profile = qs("#profile-summary");
  const playbookList = qs("#playbook-list");
  const footerLang = qs("#footer-lang-label");

  if (profile) {
    const countryObj = NT_COUNTRIES.find(c => c.id === state.country);
    const newsCat = NT_CATEGORIES.find(c => c.id === state.newsCategory);
    const socialCat = NT_CATEGORIES.find(c => c.id === state.socialCategory);
    const langObj = NT_LANGUAGES.find(l => l.code === state.language);

    profile.textContent =
      `Country: ${countryObj?.label || state.country} · ` +
      `News: ${newsCat?.label || state.newsCategory} · ` +
      `Social: ${socialCat?.label || state.socialCategory} · ` +
      `Language: ${langObj?.label || state.language}`;
  }

  if (playbookList) {
    playbookList.innerHTML = "";
    (NT_PLAYBOOK || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.tagline;
      playbookList.appendChild(li);
    });
  }

  if (footerLang && typeof ntGetFooterLanguageLabel === "function") {
    footerLang.textContent = ntGetFooterLanguageLabel(state.language);
  }
}

// ----- Card rendering -----
function getCountryLabel(id) {
  const c = NT_COUNTRIES.find(c => c.id === id);
  return c ? c.label : id;
}
function getCategoryLabel(id) {
  const c = NT_CATEGORIES.find(c => c.id === id);
  return c ? c.label : id;
}

function renderStackCard(stackType) {
  const isNews = stackType === "news";
  const stack = isNews ? state.newsStack : state.socialStack;
  const index = isNews ? state.newsIndex : state.socialIndex;
  const cardEl = qs(isNews ? "#news-card" : "#social-card");
  const countEl = qs(isNews ? "#news-count" : "#social-count");
  const indexEl = qs(isNews ? "#news-index-display" : "#social-index-display");

  if (!cardEl || !countEl || !indexEl) return;

  const tagCountry = cardEl.querySelector(".tag-country");
  const tagCategory = cardEl.querySelector(".tag-category");
  const linkEl = cardEl.querySelector(".card-link");

  if (!stack.length) {
    cardEl.querySelector(".card-title").textContent = "No cards yet";
    cardEl.querySelector(".card-summary").textContent =
      "Try changing the country or category, or tap refresh.";
    cardEl.querySelector(".card-source").textContent = "";
    if (tagCountry) tagCountry.textContent = "";
    if (tagCategory) tagCategory.textContent = "";
    if (linkEl) {
      linkEl.href = "#";
      linkEl.style.visibility = "hidden";
    }
    cardEl.querySelector(".ice-text").textContent =
      "Use one of your backup lines or ask about their week.";
    const chips = cardEl.querySelectorAll(".nt-chip");
    chips.forEach(ch => (ch.textContent = ""));
    countEl.textContent = "0 cards";
    indexEl.textContent = "0 / 0";
    return;
  }

  const idx = Math.max(0, Math.min(index, stack.length - 1));
  const article = stack[idx];

  cardEl.querySelector(".card-title").textContent = article.title || "";
  cardEl.querySelector(".card-summary").textContent =
    article.description || "";
  cardEl.querySelector(".card-source").textContent =
    article.source || "Source";

  if (tagCountry) {
    const label = getCountryLabel(state.country);
    tagCountry.textContent = label;
  }
  if (tagCategory) {
    const label = getCategoryLabel(
      isNews ? state.newsCategory : state.socialCategory
    );
    tagCategory.textContent = label;
  }
  if (linkEl) {
    if (article.url && article.url.startsWith("http")) {
      linkEl.href = article.url;
      linkEl.style.visibility = "visible";
    } else {
      linkEl.href = "#";
      linkEl.style.visibility = "hidden";
    }
  }

  const ice = buildIcebreaker(article, state.language);
  cardEl.querySelector(".ice-text").textContent = ice.opener;
  const chips = cardEl.querySelectorAll(".nt-chip");
  chips.forEach((chip, i) => {
    chip.textContent = ice.followups[i] || "";
  });

  countEl.textContent = `${stack.length} card${stack.length > 1 ? "s" : ""}`;
  indexEl.textContent = `${idx + 1} / ${stack.length}`;
}

// ----- Swipe -----
function attachSwipe(cardEl, stackType) {
  let startX = 0;
  let currentX = 0;
  let isDown = false;
  const threshold = 60;

  cardEl.addEventListener("pointerdown", e => {
    isDown = true;
    startX = e.clientX;
    currentX = startX;
    cardEl.classList.add("swiping");
  });

  cardEl.addEventListener("pointermove", e => {
    if (!isDown) return;
    currentX = e.clientX;
    const dx = currentX - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`;
  });

  function endSwipe() {
    if (!isDown) return;
    isDown = false;
    const dx = currentX - startX;
    cardEl.classList.remove("swiping");

    if (dx < -threshold) {
      cardEl.classList.add("exit-left");
      setTimeout(() => {
        cardEl.classList.remove("exit-left");
        cardEl.style.transform = "";
        if (stackType === "news") {
          state.newsIndex = Math.min(
            state.newsIndex + 1,
            Math.max(state.newsStack.length - 1, 0)
          );
          renderStackCard("news");
        } else {
          state.socialIndex = Math.min(
            state.socialIndex + 1,
            Math.max(state.socialStack.length - 1, 0)
          );
          renderStackCard("social");
        }
      }, 150);
    } else if (dx > threshold) {
      cardEl.classList.add("exit-right");
      setTimeout(() => {
        cardEl.classList.remove("exit-right");
        cardEl.style.transform = "";
        if (stackType === "news") {
          state.newsIndex = Math.max(state.newsIndex - 1, 0);
          renderStackCard("news");
        } else {
          state.socialIndex = Math.max(state.socialIndex - 1, 0);
          renderStackCard("social");
        }
      }, 150);
    } else {
      cardEl.style.transform = "";
    }
  }

  cardEl.addEventListener("pointerup", endSwipe);
  cardEl.addEventListener("pointercancel", endSwipe);
}

// ----- Build feed -----
async function buildFeedFromSelection(skipScreenSwitch) {
  const countrySel = qs("#sel-country");
  const langSel = qs("#sel-lang");
  const newsSel = qs("#sel-news-cat");
  const socialSel = qs("#sel-social-cat");
  const scenarioSel = qs("#sel-scenario");
  const levelSel = qs("#sel-level");

  state.country = countrySel ? countrySel.value : state.country;
  state.language = langSel ? langSel.value : state.language;
  state.newsCategory = newsSel ? newsSel.value : state.newsCategory;
  state.socialCategory = socialSel ? socialSel.value : state.socialCategory;
  state.scenario = scenarioSel ? scenarioSel.value : state.scenario;
  state.level = levelSel ? parseInt(levelSel.value, 10) : state.level;

  renderSidebar();

  const refreshBtn = qs("#btn-refresh");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading…";
  }

  try {
    const [news, social] = await Promise.all([
      fetchStack(state.country, state.newsCategory),
      fetchStack(state.country, state.socialCategory)
    ]);

    state.newsStack = news || [];
    state.socialStack = social || [];
    state.newsIndex = 0;
    state.socialIndex = 0;

    renderStackCard("news");
    renderStackCard("social");
  } catch (err) {
    console.error(err);
    state.newsStack = [];
    state.socialStack = [];
    state.newsIndex = 0;
    state.socialIndex = 0;
    renderStackCard("news");
    renderStackCard("social");
    alert("Could not fetch live topics. Check backend or internet.");
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "Refresh";
    }
  }

  if (!skipScreenSwitch) {
    showScreen("cards-screen");
  }
}

// ----- Init -----
function initAppSafe() {
  try {
    populateDropdowns();
    renderSidebar();
    renderStackCard("news");
    renderStackCard("social");
    showScreen("landing-screen");

    const logoLanding = qs("#logo-back-to-landing");
    if (logoLanding) {
      logoLanding.addEventListener("click", () => showScreen("landing-screen"));
    }
    const logoSelection = qs("#logo-back-to-selection");
    if (logoSelection) {
      logoSelection.addEventListener("click", () =>
        showScreen("selection-screen")
      );
    }

    const startBtn = qs("#btn-start");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        showScreen("selection-screen");
      });
    }

    const skipBtn = qs("#btn-skip-to-feed");
    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        // Build with defaults and jump straight to cards
        buildFeedFromSelection(false);
      });
    }

    const form = qs("#selection-form");
    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        buildFeedFromSelection(false);
      });
    }

    const refreshBtn = qs("#btn-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        buildFeedFromSelection(true);
      });
    }

    const newsPrev = qs("#news-prev");
    const newsNext = qs("#news-next");
    const socialPrev = qs("#social-prev");
    const socialNext = qs("#social-next");

    if (newsPrev)
      newsPrev.addEventListener("click", () => {
        state.newsIndex = Math.max(state.newsIndex - 1, 0);
        renderStackCard("news");
      });
    if (newsNext)
      newsNext.addEventListener("click", () => {
        state.newsIndex = Math.min(
          state.newsIndex + 1,
          Math.max(state.newsStack.length - 1, 0)
        );
        renderStackCard("news");
      });

    if (socialPrev)
      socialPrev.addEventListener("click", () => {
        state.socialIndex = Math.max(state.socialIndex - 1, 0);
        renderStackCard("social");
      });
    if (socialNext)
      socialNext.addEventListener("click", () => {
        state.socialIndex = Math.min(
          state.socialIndex + 1,
          Math.max(state.socialStack.length - 1, 0)
        );
        renderStackCard("social");
      });

    const newsCard = qs("#news-card");
    const socialCard = qs("#social-card");
    if (newsCard) attachSwipe(newsCard, "news");
    if (socialCard) attachSwipe(socialCard, "social");
  } catch (e) {
    console.error("initApp error:", e);
  }
}

document.addEventListener("DOMContentLoaded", initAppSafe);
