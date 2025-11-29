// backend/src/rssFetcher.js
// Generic RSS fetcher for NEWS THING – safe, easy to extend

const { parseStringPromise } = require("xml2js");

// Normalize one RSS item into our common format
function normalizeArticle(item, feedMeta = {}) {
  // title
  const title =
    (item.title && item.title[0]) ||
    (item["media:title"] && item["media:title"][0]) ||
    "";

  // description / summary
  const description =
    (item.description && item.description[0]) ||
    (item.summary && item.summary[0]) ||
    "";

  // link
  const link =
    (item.link && (typeof item.link[0] === "string"
      ? item.link[0]
      : item.link[0]._)) || "";

  // pubDate
  const pubDate = (item.pubDate && item.pubDate[0]) ||
    (item.published && item.published[0]) ||
    "";

  return {
    title: title.trim(),
    description: (description || "").trim(),
    url: (link || "").trim(),
    pubDate: pubDate,
    sourceName: feedMeta.sourceName || feedMeta.id || "",
    lang: feedMeta.lang || "en"
  };
}

// Fetch and parse one RSS feed URL
async function fetchRssUrl(rawFeed) {
  // Support either a plain string or an object { url, lang, sourceName }
  const feed =
    typeof rawFeed === "string"
      ? { url: rawFeed }
      : rawFeed || {};

  if (!feed.url) {
    throw new Error("Feed has no URL");
  }

  const res = await fetch(feed.url);
  if (!res.ok) {
    throw new Error(`Failed to fetch RSS: ${feed.url} (${res.status})`);
  }
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: true });

  const channel =
    parsed?.rss?.channel?.[0] ||
    parsed?.feed || {};

  const items =
    channel.item ||
    channel.entry ||
    [];

  const articles = items
    .map(item => normalizeArticle(item, feed))
    .filter(a => a.title && a.url);

  return articles;
}

// Choose the correct feed list based on region + category
function pickFeeds(feedsConfig, region, category) {
  const regionCfg = feedsConfig[region] || null;
  const globalCfg = feedsConfig.global || null;

  let feeds = [];

  // 1) Try exact region + category
  if (regionCfg) {
    if (Array.isArray(regionCfg[category]) && regionCfg[category].length > 0) {
      feeds = regionCfg[category];
    } else if (Array.isArray(regionCfg.top) && regionCfg.top.length > 0) {
      // fallback to region top stories
      feeds = regionCfg.top;
    }
  }

  // 2) Fallback to global config (if you add one)
  if (!feeds.length && globalCfg) {
    if (Array.isArray(globalCfg[category]) && globalCfg[category].length > 0) {
      feeds = globalCfg[category];
    } else if (Array.isArray(globalCfg.top) && globalCfg.top.length > 0) {
      feeds = globalCfg.top;
    }
  }

  // 3) Last resort: empty list (no crash)
  return feeds || [];
}

// Main function called from server.js
async function fetchNewsForRegionAndCategory(feedsConfig, region, category) {
  const feeds = pickFeeds(feedsConfig, region, category);

  // No feeds configured for this combo → just return empty
  if (!feeds.length) {
    return { lang: "en", articles: [] };
  }

  const feedPromises = feeds.map(feed => fetchRssUrl(feed));

  const settled = await Promise.allSettled(feedPromises);

  const allArticles = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  }

  // Basic dedup by title + url
  const seen = new Set();
  const unique = [];
  for (const a of allArticles) {
    const key = (a.title || "") + "::" + (a.url || "");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  // Light sort: newest-ish first if pubDate exists
  unique.sort((a, b) => {
    const da = new Date(a.pubDate || 0).getTime();
    const db = new Date(b.pubDate || 0).getTime();
    return db - da;
  });

  return {
    lang: unique[0]?.lang || "en",
    articles: unique
  };
}

module.exports = {
  fetchNewsForRegionAndCategory
};
