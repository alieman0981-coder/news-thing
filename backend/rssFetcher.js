// rssFetcher.js — fetch & normalize RSS for NEWS THING

const Parser = require("rss-parser");
const { getFeedsFor } = require("./feeds");

const parser = new Parser({
  timeout: 10000
});

async function fetchFromFeed(url, limit = 20) {
  const feed = await parser.parseURL(url);

  return (feed.items || []).slice(0, limit).map((item) => {
    const link = item.link || "";
    let hostname = "";
    try {
      if (link) {
        hostname = new URL(link).hostname.replace(/^www\./, "");
      }
    } catch (_) {
      hostname = "";
    }

    return {
      title: item.title || "",
      description:
        item.contentSnippet ||
        item.summary ||
        item.content ||
        "",
      url: link,
      pubDate: item.isoDate || item.pubDate || null,
      sourceName: feed.title || hostname || "Source"
    };
  });
}

function dedupeAndSort(items, maxItems = 40) {
  const map = new Map();
  for (const item of items) {
    const key = (item.url || item.title || "").toLowerCase();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  const arr = Array.from(map.values());
  arr.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da; // newest first
  });
  return arr.slice(0, maxItems);
}

/**
 * Fetch news articles for a given region + category.
 * region = NEWS THING country id (usa, saudi_arabia, etc)
 * category = category id (top, politics, fashion, etc)
 */
async function fetchNewsFor(region, category) {
  const feeds = getFeedsFor(region, category);
  if (!feeds || !feeds.length) {
    return [];
  }

  const allItems = [];
  for (const url of feeds) {
    try {
      const items = await fetchFromFeed(url);
      allItems.push(...items);
    } catch (err) {
      console.error("Error fetching feed", url, err.message);
    }
  }

  return dedupeAndSort(allItems);
}

module.exports = {
  fetchNewsFor
};
