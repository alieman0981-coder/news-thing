// feeds.js — country + category → Google News RSS URLs

const GOOGLE_NEWS_BASE = "https://news.google.com/rss/search";

function gn(q, hl, gl, ceid) {
  const query = encodeURIComponent(q);
  return `${GOOGLE_NEWS_BASE}?q=${query}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

// Top-headlines shortcut for a country
function gnTop(hl, gl, ceid) {
  return `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

// Map NEWS THING region ids → Google country/lang codes
const COUNTRY_LANG = {
  usa: { hl: "en-US", gl: "US", ceid: "US:en" },
  canada: { hl: "en-CA", gl: "CA", ceid: "CA:en" },
  uk: { hl: "en-GB", gl: "GB", ceid: "GB:en" },
  switzerland: { hl: "en-CH", gl: "CH", ceid: "CH:en" },
  australia: { hl: "en-AU", gl: "AU", ceid: "AU:en" },
  saudi_arabia: { hl: "en-SA", gl: "SA", ceid: "SA:en" },
  uae: { hl: "en-AE", gl: "AE", ceid: "AE:en" },
  germany: { hl: "en-DE", gl: "DE", ceid: "DE:en" },
  finland: { hl: "en-FI", gl: "FI", ceid: "FI:en" }
};

// Build feeds for one country
function buildCountryFeeds(countryId) {
  const cfg = COUNTRY_LANG[countryId];
  if (!cfg) return null;
  const { hl, gl, ceid } = cfg;

  switch (countryId) {
    // 🇺🇸 USA
    case "usa":
      return {
        top: [gnTop(hl, gl, ceid)],
        politics: [gn("US politics when:1d", hl, gl, ceid)],
        sports: [gn("US sports news today when:1d", hl, gl, ceid)],
        nba: [gn("NBA basketball when:1d", hl, gl, ceid)],
        fashion: [gn("US fashion streetwear style when:7d", hl, gl, ceid)],
        entertainment: [gn("US entertainment movies music TV when:3d", hl, gl, ceid)],
        stocks: [gn("US stock market S&P 500 Dow Jones when:1d", hl, gl, ceid)],
        economies: [gn("US economy inflation jobs when:7d", hl, gl, ceid)],
        trends: [gn("social media trends US when:1d", hl, gl, ceid)]
      };

    // 🇨🇦 Canada
    case "canada":
      return {
        top: [gnTop(hl, gl, ceid)],
        sports: [gn("Canada sports news today when:1d", hl, gl, ceid)],
        hockey: [gn("NHL hockey Canada when:1d", hl, gl, ceid)],
        weather: [gn("Canada weather alerts when:1d", hl, gl, ceid)],
        economies: [gn("Canada economy inflation when:7d", hl, gl, ceid)],
        fashion: [gn("Canada fashion street style when:7d", hl, gl, ceid)],
        media: [gn("Canada media internet culture when:7d", hl, gl, ceid)],
        trends: [gn("social trends Canada when:3d", hl, gl, ceid)]
      };

    // 🇬🇧 UK
    case "uk":
      return {
        top: [gnTop(hl, gl, ceid)],
        equestrian: [gn("UK equestrian showjumping when:30d", hl, gl, ceid)],
        fashion: [gn("UK fashion street style when:7d", hl, gl, ceid)],
        entertainment: [gn("UK entertainment TV shows music when:3d", hl, gl, ceid)],
        royal_family: [gn("UK royal family news when:7d", hl, gl, ceid)],
        football: [gn("Premier League football when:1d", hl, gl, ceid)],
        celebrities: [gn("UK celebrities pop culture when:7d", hl, gl, ceid)],
        education: [gn("UK education schools students when:30d", hl, gl, ceid)],
        trends: [gn("social media trends UK when:3d", hl, gl, ceid)]
      };

    // 🇨🇭 Switzerland
    case "switzerland":
      return {
        top: [gnTop(hl, gl, ceid)],
        skiing: [gn("Switzerland skiing resorts when:30d", hl, gl, ceid)],
        polo: [gn("polo sport Switzerland when:365d", hl, gl, ceid)],
        economies: [gn("Swiss economy banking when:30d", hl, gl, ceid)],
        finance: [gn("Swiss finance banks when:30d", hl, gl, ceid)],
        entertainment: [gn("Switzerland entertainment events when:30d", hl, gl, ceid)],
        events: [gn("events Switzerland things to do when:14d", hl, gl, ceid)],
        weather: [gn("Switzerland weather alerts when:1d", hl, gl, ceid)],
        trends: [gn("social trends Switzerland when:30d", hl, gl, ceid)]
      };

    // 🇦🇺 Australia
    case "australia":
      return {
        top: [gnTop(hl, gl, ceid)],
        weather: [gn("Australia weather alerts when:1d", hl, gl, ceid)],
        sports: [gn("Australia sports news today when:1d", hl, gl, ceid)],
        equestrian: [gn("Australia equestrian showjumping when:365d", hl, gl, ceid)],
        fashion: [gn("Australia fashion street style when:30d", hl, gl, ceid)],
        entertainment: [gn("Australia entertainment TV music when:7d", hl, gl, ceid)],
        events: [gn("events Australia things to do when:14d", hl, gl, ceid)],
        trends: [gn("social media trends Australia when:3d", hl, gl, ceid)]
      };

    // 🇸🇦 Saudi Arabia
    case "saudi_arabia":
      return {
        top: [gnTop(hl, gl, ceid)],
        fashion: [gn("Saudi Arabia fashion abaya street style when:30d", hl, gl, ceid)],
        entertainment: [gn("Saudi Arabia entertainment concerts events when:14d", hl, gl, ceid)],
        events: [gn("events Saudi Arabia Riyadh Jeddah when:14d", hl, gl, ceid)],
        sports: [gn("Saudi sports football equestrian when:7d", hl, gl, ceid)],
        equestrian: [gn("Saudi equestrian showjumping when:365d", hl, gl, ceid)],
        trends: [gn("Saudi social media trends when:7d", hl, gl, ceid)],
        royal_family: [gn("Saudi royal family news when:30d", hl, gl, ceid)],
        finance: [gn("Saudi finance economy Vision 2030 when:30d", hl, gl, ceid)]
      };

    // 🇦🇪 UAE
    case "uae":
      return {
        top: [gnTop(hl, gl, ceid)],
        events: [gn("events UAE Dubai Abu Dhabi when:14d", hl, gl, ceid)],
        entertainment: [gn("UAE entertainment concerts festivals when:14d", hl, gl, ceid)],
        media: [gn("UAE media influencers internet culture when:30d", hl, gl, ceid)],
        finance: [gn("UAE finance business Dubai when:30d", hl, gl, ceid)],
        economies: [gn("UAE economy trade tourism when:30d", hl, gl, ceid)],
        fashion: [gn("UAE fashion street style abaya when:30d", hl, gl, ceid)],
        trends: [gn("social trends UAE when:7d", hl, gl, ceid)]
      };

    // 🇩🇪 Germany
    case "germany":
      return {
        top: [gnTop(hl, gl, ceid)],
        finance: [gn("Germany finance banking when:30d", hl, gl, ceid)],
        entertainment: [gn("Germany entertainment TV music when:14d", hl, gl, ceid)],
        events: [gn("events Germany Berlin Munich when:14d", hl, gl, ceid)],
        trends: [gn("social media trends Germany when:7d", hl, gl, ceid)],
        fashion: [gn("Germany fashion streetwear when:30d", hl, gl, ceid)],
        economies: [gn("Germany economy inflation energy when:30d", hl, gl, ceid)],
        education: [gn("Germany education universities students when:30d", hl, gl, ceid)]
      };

    // 🇫🇮 Finland
    case "finland":
      return {
        top: [gnTop(hl, gl, ceid)],
        fashion: [gn("Finland fashion street style when:30d", hl, gl, ceid)],
        entertainment: [gn("Finland entertainment music festivals when:30d", hl, gl, ceid)],
        education: [gn("Finland education schools students when:30d", hl, gl, ceid)],
        events: [gn("events Finland Helsinki when:14d", hl, gl, ceid)],
        finance: [gn("Finland finance economy when:30d", hl, gl, ceid)],
        economics: [gn("Finland economy inflation when:30d", hl, gl, ceid)],
        trends: [gn("social media trends Finland when:7d", hl, gl, ceid)]
      };

    default:
      return null;
  }
}

// Build full feeds map
const FEEDS = {};
Object.keys(COUNTRY_LANG).forEach((countryId) => {
  const cfg = buildCountryFeeds(countryId);
  if (cfg) FEEDS[countryId] = cfg;
});

function getFeedsFor(region, category) {
  const countryFeeds = FEEDS[region];
  if (!countryFeeds) return null;
  if (countryFeeds[category]) {
    return countryFeeds[category];
  }
  // Fallback: if category missing, use top
  if (countryFeeds.top) return countryFeeds.top;
  return null;
}

module.exports = {
  FEEDS,
  getFeedsFor
};
