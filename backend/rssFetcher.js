// rssFetcher.js — fetch & normalize RSS for NEWS THING (FAST + CLEAN + SMART)

const Parser = require("rss-parser");
const { getFeedsFor } = require("./feeds");

const parser = new Parser({ timeout: 10000 });

// -------------------- SPEED: Cache --------------------
const CACHE_TTL_MS = 90 * 1000; // 90 seconds
const cache = new Map(); // key -> { ts, items }

function cacheKey(region, category, limit) {
  return `${region}::${category}::${limit}`;
}
function fromCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) return null;
  return hit.items;
}
function setCache(key, items) {
  cache.set(key, { ts: Date.now(), items });
}

// -------------------- NORMALIZATION --------------------
function normText(s) {
  return (s || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normTitleKey(title) {
  const t = normText(title);
  return t
    .replace(/\b(the|a|an|and|or|to|of|in|on|for|with|from|at|by|as)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normUrlKey(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid"].forEach(p =>
      u.searchParams.delete(p)
    );
    return u.toString();
  } catch {
    return (url || "").trim();
  }
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function minutesAgo(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return Infinity;
  return (Date.now() - d.getTime()) / 60000;
}

function looksGarbage(title, desc) {
  const t = (title || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  const bad = [
    "watch live", "live updates", "minute-by-minute", "podcast", "subscribe",
    "sponsored", "advertisement", "promo", "horoscope", "lottery", "coupon",
    "buy now", "deal:", "shop", "opinion:", "editorial:"
  ];
  if (!t || t.length < 18) return true;
  if (bad.some(x => t.includes(x) || d.includes(x))) return true;
  if (/^\W*(video|photos|gallery)\W*$/i.test(title)) return true;
  return false;
}

function cleanDesc(s) {
  return (s || "")
    .replace(/\s+/g, " ")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

// -------------------- CATEGORY RELEVANCE + SCORING --------------------
const CATEGORY_KEYWORDS = {
  top: [],
  politics: ["election","parliament","congress","government","minister","policy","senate","white house","prime minister","president"],
  sports: ["match","tournament","league","championship","coach","season","final","win","loss","score"],
  nba: ["nba","playoffs","lakers","warriors","celtics","knicks","bucks","mvp","trade","draft"],
  hockey: ["nhl","hockey","stanley cup","goal","ice","leafs","canadiens","oilers","flames"],
  fashion: ["fashion","runway","collection","designer","street style","trend","outfit","brand","wear","style"],
  entertainment: ["movie","film","music","album","concert","festival","tv","series","celebrity","award"],
  stocks: ["stocks","shares","market","s&p","dow","nasdaq","earnings","investor","rally","selloff"],
  economies: ["economy","inflation","rates","gdp","jobs","growth","recession","central bank","trade"],
  economics: ["economy","inflation","rates","gdp","jobs","growth","recession","central bank","trade"],
  finance: ["finance","bank","investment","fund","ipo","deal","market","assets","regulator"],
  weather: ["weather","storm","rain","snow","forecast","warning","alert","heat","flood","wind"],
  events: ["event","festival","opening","launch","expo","show","weekend","things to do","tickets"],
  trends: ["trend","viral","tiktok","instagram","social media","meme","challenge"],
  equestrian: ["equestrian","showjumping","show jumping","fei","dressage","eventing","grand prix","horse"],
  royal_family: ["royal","king","queen","prince","princess","palace","monarchy"],
  football: ["football","premier league","uefa","champions league","goal","manager","transfer"],
  celebrities: ["celebrity","actor","actress","singer","model","star","red carpet"],
  education: ["school","student","university","exam","education","teacher","classroom","curriculum"],
  skiing: ["ski","skiing","resort","slopes","snow","alps"],
  polo: ["polo","tournament","club","match"]
};

const MAX_AGE_MINUTES_BY_CATEGORY = {
  events: 7 * 24 * 60,
  equestrian: 14 * 24 * 60,
  skiing: 14 * 24 * 60,
  polo: 30 * 24 * 60,
  default: 48 * 60
};

function maxAgeMinutes(category) {
  return MAX_AGE_MINUTES_BY_CATEGORY[category] ?? MAX_AGE_MINUTES_BY_CATEGORY.default;
}

function scoreArticle(category, a) {
  let score = 0;

  const title = a.title || "";
  const desc = a.description || "";
  const url = a.url || "";

  // Freshness
  const ageMin = minutesAgo(a.pubDate);
  if (ageMin < 60) score += 50;
  else if (ageMin < 6 * 60) score += 35;
  else if (ageMin < 24 * 60) score += 22;
  else if (ageMin < 48 * 60) score += 8;
  else score -= 45;

  // Content quality
  if (desc && desc.length >= 80) score += 12;
  if (desc && desc.length >= 140) score += 8;
  if (domainOf(url)) score += 6;

  // Title quality
  if (/\b(live|watch|photos|gallery)\b/i.test(title)) score -= 18;
  if (/[!?]{2,}/.test(title)) score -= 10;

  // Category relevance
  const kws = CATEGORY_KEYWORDS[category] || [];
  if (kws.length) {
    const hay = (title + " " + desc).toLowerCase();
    let hits = 0;
    for (const k of kws) if (hay.includes(k)) hits++;
    score += Math.min(30, hits * 10);
    if (hits === 0) score -= 12;
  }

  return score;
}

function filterSortDedup(category, rawArticles, limit) {
  const maxAge = maxAgeMinutes(category);

  // 1) clean + filter by age + remove garbage
  const cleaned = rawArticles
    .map(a => ({
      title: (a.title || "").trim(),
      description: cleanDesc(a.description || ""),
      url: (a.url || "").trim(),
      pubDate: a.pubDate || "",
      sourceName: a.sourceName || domainOf(a.url || "")
    }))
    .filter(a => !looksGarbage(a.title, a.description))
    .filter(a => minutesAgo(a.pubDate) <= maxAge);

  // 2) hard dedupe by title + url
  const seenTitle = new Set();
  const seenUrl = new Set();
  const deduped = [];

  for (const a of cleaned) {
    const tk = normTitleKey(a.title);
    const uk = normUrlKey(a.url);

    if (tk && seenTitle.has(tk)) continue;
    if (uk && seenUrl.has(uk)) continue;

    if (tk) seenTitle.add(tk);
    if (uk) seenUrl.add(uk);

    deduped.push(a);
  }

  // 3) score + sort
  const scored = deduped
    .map(a => ({ ...a, _score: scoreArticle(category, a) }))
    .sort((x, y) => y._score - x._score);

  // 4) domain diversity cap (prevents same site spam)
  const domainCount = new Map();
  const finalList = [];
  const perDomainCap = 3;

  for (const a of scored) {
    const d = domainOf(a.url) || a.sourceName || "source";
    const c = domainCount.get(d) || 0;
    if (c >= perDomainCap) continue;

    domainCount.set(d, c + 1);
    finalList.push(a);

    if (finalList.length >= limit) break;
  }

  return finalList;
}

// -------------------- FETCHING --------------------
async function fetchFromFeed(url, limit = 25) {
  const feed = await parser.parseURL(url);

  return (feed.items || []).slice(0, limit).map((item) => {
    const link = item.link || "";
    let hostname = "";
    try {
      if (link) hostname = new URL(link).hostname.replace(/^www\./, "");
    } catch (_) {
      hostname = "";
    }

    return {
      title: item.title || "",
      description: item.contentSnippet || item.summary || item.content || "",
      url: link,
      pubDate: item.isoDate || item.pubDate || null,
      sourceName: feed.title || hostname || "Source"
    };
  });
}

/**
 * Fetch news for region+category
 * region: country id (usa, saudi_arabia...)
 * category: category id (top, politics...)
 */
async function fetchNewsFor(region, category, limit = 30) {
  const key = cacheKey(region, category, limit);
  const cached = fromCache(key);
  if (cached) return cached;

  const feeds = getFeedsFor(region, category) || [];
  if (!feeds.length) {
    setCache(key, []);
    return [];
  }

  // Speed: fetch feeds in parallel (cap to avoid slow waits)
  const FEEDS_TO_HIT = Math.min(feeds.length, 6);

  const results = await Promise.allSettled(
    feeds.slice(0, FEEDS_TO_HIT).map((url) =>
      fetchFromFeed(url).catch((err) => {
        console.error("Error fetching feed", url, err.message);
        return [];
      })
    )
  );

  const allItems = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) allItems.push(...r.value);
  }

  let finalItems = filterSortDedup(category, allItems, limit);

  // Fallback: if category is empty, try top for same region (prevents "no cards")
  if (!finalItems.length && category !== "top") {
    const topFeeds = getFeedsFor(region, "top") || [];
    if (topFeeds.length) {
      const topRes = await Promise.allSettled(
        topFeeds.slice(0, Math.min(topFeeds.length, 6)).map((url) =>
          fetchFromFeed(url).catch(() => [])
        )
      );
      const topItems = [];
      for (const r of topRes) if (r.status === "fulfilled") topItems.push(...r.value);
      finalItems = filterSortDedup("top", topItems, limit);
    }
  }

  setCache(key, finalItems);
  return finalItems;
}

module.exports = { fetchNewsFor };
