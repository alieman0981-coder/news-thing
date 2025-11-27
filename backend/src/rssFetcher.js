const fetch = require("node-fetch");
const { XMLParser } = require("fast-xml-parser");
const feedsConfig = require("../config/feeds.config");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "text"
});

// Clean whitespace
function normaliseSpaces(str) {
  return (str || "").replace(/\s+/g, " ").trim();
}

// Safe truncation
function truncate(str, max) {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

// Choose the correct feed list based on region + category
function pickFeeds(region, category) {
  const regionCfg = feedsConfig[region] || feedsConfig.global;
  const feeds = regionCfg[category] || regionCfg.top || [];
  return feeds;
}

// Fetch a single feed, parse RSS OR Atom
async function fetchOneFeed(url) {
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) {
    throw new Error(`Feed HTTP error ${res.status}`);
  }
  const text = await res.text();
  const xml = parser.parse(text);

  let items = [];

  // RSS format
  if (xml.rss && xml.rss.channel && xml.rss.channel.item) {
    items = xml.rss.channel.item;
  }
  // Atom format
  else if (xml.feed && xml.feed.entry) {
    items = xml.feed.entry;
  }

  if (!Array.isArray(items)) items = [items];

  return items
    .map(item => {
      const title = normaliseSpaces(
        (item.title && item.title.text) || item.title || ""
      );

      const description = normaliseSpaces(
        (item.description && item.description.text) ||
          item.description ||
          (item.summary && item.summary.text) ||
          item.summary ||
          ""
      );

      const link =
        (item.link && item.link.href) ||
        (Array.isArray(item.link) ? item.link[0].href : item.link) ||
        "";

      const pubDate = item.pubDate || item.updated || item.published || "";
      const sourceName =
        (item.source && (item.source.text || item.source["#text"])) || "";

      return {
        title,
        description,
        link,
        pubDate,
        sourceName
      };
    })
    .filter(a => a.title); // keep only items with a title
}

// Fetch & merge articles from all selected feeds
async function fetchArticles(region, category, limit = 24) {
  const feeds = pickFeeds(region, category);
  const allArticles = [];
  const seenTitles = new Set();

  for (const url of feeds) {
    try {
      const items = await fetchOneFeed(url);
      for (const art of items) {
        const key = art.title.toLowerCase();

        // dedupe (RSS feeds repeat stories A LOT)
        if (seenTitles.has(key)) continue;

        seenTitles.add(key);
        allArticles.push({
          title: truncate(art.title, 160),
          description: truncate(art.description, 260),
          link: art.link,
          pubDate: art.pubDate,
          sourceName: art.sourceName || new URL(url).hostname
        });

        if (allArticles.length >= limit) break;
      }
      if (allArticles.length >= limit) break;
    } catch (err) {
      console.warn("Error fetching feed:", url, err.message);
    }
  }

  // sort newest → oldest
  allArticles.sort((a, b) => {
    const da = new Date(a.pubDate || 0).getTime();
    const db = new Date(b.pubDate || 0).getTime();
    return db - da;
  });

  return allArticles.slice(0, limit);
}

module.exports = {
  fetchArticles
};
