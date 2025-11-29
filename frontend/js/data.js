// FULL data.js for NEWS THING — basic, easy to extend

// Interface languages
const NT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
  { code: "hi", label: "हिन्दी" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "tr", label: "Türkçe" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "pt", label: "Português" }
];

const NT_RTL_LANGS = ["ar", "ur"];

// Countries – IDs MUST match backend region keys in feeds.config.js
const NT_COUNTRIES = [
  { id: "saudi", label: "Saudi Arabia" },
  { id: "uae", label: "United Arab Emirates" },
  { id: "qatar", label: "Qatar" },
  { id: "usa", label: "United States" },
  { id: "uk", label: "United Kingdom" },
  { id: "europe", label: "Europe (General)" },
  { id: "global", label: "Global mix" } // optional, if you add a "global" section
];

// Categories – IDs MUST match category keys in feeds.config.js
const NT_CATEGORIES = [
  { id: "top", label: "Top stories" },
  { id: "events", label: "Events & things happening" },
  { id: "new_trends", label: "New trends & social" },
  { id: "equestrian", label: "Equestrian" },
  { id: "football", label: "Football" },
  { id: "soccer", label: "Soccer" },
  { id: "basketball_nba", label: "Basketball / NBA" },
  { id: "fashion", label: "Fashion & style" },
  { id: "financial", label: "Financial / business" },
  { id: "politics", label: "Politics" },
  { id: "royal_family", label: "Royal family" },
  { id: "weather", label: "Weather & alerts" },
  { id: "entertainment", label: "Entertainment" },
  { id: "global", label: "Global mix" },
  { id: "donald_trump", label: "Donald Trump" }
];

// Scenarios & levels – used for icebreaker tone, easy to extend
const NT_SCENARIOS = ["event", "school", "family", "online"];

const NT_LEVELS = [
  { level: 0, label: "Ultra-safe" },
  { level: 1, label: "Easy" },
  { level: 2, label: "Bold" }
];

// Simple mapping helper – currently 1:1 but you can change later
const NT_COUNTRY_REGION = {
  saudi: "saudi",
  uae: "uae",
  qatar: "qatar",
  usa: "usa",
  uk: "uk",
  europe: "europe",
  global: "global"
};

function ntGetRegionKeyForCountry(countryId) {
  return NT_COUNTRY_REGION[countryId] || countryId || "global";
}

// Minimal fallback topics (you can expand later)
const NT_TOPICS = [
  {
    id: "ai_everywhere",
    region: "global",
    category: "new_trends",
    scenarioHints: ["event", "school", "online"],
    level: 1,
    title: "Everyone is talking about AI tools",
    summary: "AI tools are everywhere from school to design.",
    contextLabel: "Easy universal topic.",
    sourceLabel: "Global trend.",
    icebreakers: {
      en: {
        opener: "Have you tried any new AI tools recently?",
        followups: [
          "Do you use AI more for school or for fun?",
          "Does AI make life easier or more confusing for you?"
        ]
      }
    }
  }
];

// Soft skills playbook – you can add more cards here
const NT_PLAYBOOK = [
  {
    id: "be_interested",
    title: "Lead with genuine curiosity",
    tagline: "Makes people comfortable.",
    bullets: ["Ask real questions", "Notice small details", "Stay relaxed"]
  }
];

// Panic lines if the card feels dead
const NT_ICEPACKS_BY_LANG = {
  en: [
    "What's something you've been quietly obsessed with recently?",
    "If today had a title, what would you call it?"
  ]
};

// Footer helper
function ntGetFooterLanguageLabel(code) {
  const lang = NT_LANGUAGES.find(l => l.code === code);
  return lang ? `Interface language: ${lang.label}` : "Interface language";
}
