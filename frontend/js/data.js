// FULL data.js for NEWS THING — Ready to use

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

// Countries (ids MUST match backend region codes)
const NT_COUNTRIES = [
  { id: "saudi", label: "Saudi Arabia" },
  { id: "uae", label: "United Arab Emirates" },
  { id: "qatar", label: "Qatar" },
  { id: "usa", label: "United States" },
  { id: "uk", label: "United Kingdom" },
  { id: "europe", label: "Europe (General)" },
  { id: "global", label: "Global feed" } // optional extra, maps to backend "global"
];

// Categories (ids MUST match backend category keys)
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

// Scenarios
const NT_SCENARIOS = ["event", "school", "family", "online"];

// Levels
const NT_LEVELS = [
  { level: 0, label: "Ultra-safe" },
  { level: 1, label: "Easy" },
  { level: 2, label: "Bold" }
];

// Old simple map (kept for compatibility if needed later)
const NT_COUNTRY_REGION = {
  saudi: "saudi",
  uae: "uae",
  qatar: "qatar",
  uk: "uk",
  europe: "europe",
  usa: "usa",
  global: "global"
};

// Helper: currently just returns the same id (so we don’t break app.js if it calls this)
function ntGetRegionKeyForCountry(countryId) {
  return NT_COUNTRY_REGION[countryId] || countryId || "global";
}

// Fallback curated topics (shortened example)
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

// Playbook
const NT_PLAYBOOK = [
  {
    id: "be_interested",
    title: "Lead with genuine curiosity",
    tagline: "Makes people comfortable.",
    bullets: ["Ask real questions", "Notice small details", "Stay relaxed"]
  }
];

// Panic lines
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
