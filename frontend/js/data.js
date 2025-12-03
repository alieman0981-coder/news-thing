// data.js — NEWS THING config

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

// Countries — ids must match backend region keys
const NT_COUNTRIES = [
  { id: "usa", label: "United States" },
  { id: "canada", label: "Canada" },
  { id: "uk", label: "United Kingdom" },
  { id: "switzerland", label: "Switzerland" },
  { id: "australia", label: "Australia" },
  { id: "saudi_arabia", label: "Saudi Arabia" },
  { id: "uae", label: "United Arab Emirates" },
  { id: "germany", label: "Germany" },
  { id: "finland", label: "Finland" }
];

// Categories (global list)
const NT_CATEGORIES = [
  { id: "top", label: "Top stories" },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "nba", label: "NBA / Basketball" },
  { id: "fashion", label: "Fashion & style" },
  { id: "entertainment", label: "Entertainment" },
  { id: "stocks", label: "Stocks & markets" },
  { id: "economies", label: "Economy & macro" },
  { id: "economics", label: "Economics & policy" },
  { id: "hockey", label: "Hockey" },
  { id: "weather", label: "Weather & alerts" },
  { id: "media", label: "Media & internet culture" },
  { id: "equestrian", label: "Equestrian" },
  { id: "royal_family", label: "Royal family" },
  { id: "football", label: "Football" },
  { id: "celebrities", label: "Celebrities" },
  { id: "education", label: "Education & schools" },
  { id: "skiing", label: "Skiing" },
  { id: "polo", label: "Polo" },
  { id: "finance", label: "Finance & banking" },
  { id: "events", label: "Events & things happening" },
  { id: "trends", label: "New trends & social" }
];

// Per-country allowed categories
const NT_COUNTRY_CATEGORY_MAP = {
  usa: [
    "top",
    "politics",
    "sports",
    "nba",
    "fashion",
    "entertainment",
    "stocks",
    "economies"
  ],
  canada: [
    "top",
    "sports",
    "hockey",
    "weather",
    "economies",
    "fashion",
    "media"
  ],
  uk: [
    "equestrian",
    "top",
    "fashion",
    "entertainment",
    "royal_family",
    "football",
    "celebrities",
    "education"
  ],
  switzerland: [
    "skiing",
    "polo",
    "economies",
    "finance",
    "entertainment",
    "events",
    "weather"
  ],
  australia: [
    "top",
    "weather",
    "sports",
    "equestrian",
    "fashion",
    "entertainment",
    "events"
  ],
  saudi_arabia: [
    "top",
    "fashion",
    "entertainment",
    "events",
    "sports",
    "equestrian",
    "trends",
    "royal_family",
    "finance"
  ],
  uae: [
    "top",
    "events",
    "entertainment",
    "media",
    "finance",
    "economies",
    "fashion",
    "trends"
  ],
  germany: [
    "top",
    "finance",
    "entertainment",
    "events",
    "trends",
    "fashion",
    "economies",
    "education"
  ],
  finland: [
    "top",
    "fashion",
    "entertainment",
    "education",
    "events",
    "finance",
    "economics",
    "trends"
  ]
};

// Scenarios
const NT_SCENARIOS = [
  { id: "event", label: "Event" },
  { id: "school", label: "School / uni" },
  { id: "family", label: "Family" },
  { id: "online", label: "Online" }
];

// Region mapping (1:1 for now)
const NT_COUNTRY_REGION = NT_COUNTRIES.reduce((acc, c) => {
  acc[c.id] = c.id;
  return acc;
}, {});

function ntGetRegionKeyForCountry(countryId) {
  return NT_COUNTRY_REGION[countryId] || countryId || "usa";
}

// Example fallback topics (used if news fails)
const NT_TOPICS = [
  {
    id: "ai_everywhere",
    region: "global",
    category: "trends",
    scenarioHints: ["event", "school", "online"],
    level: 2,
    title: "Everyone is talking about AI tools",
    summary: "AI tools keep slipping into school, work and daily life.",
    contextLabel: "Easy universal topic.",
    sourceLabel: "Global trend.",
    icebreakers: {
      en: {
        opener: "Have you tried any AI tools recently, or are you avoiding them on purpose?",
        followups: [
          "Do you think AI makes life easier or more confusing?",
          "If AI could do one boring task for you forever, what would you pick?"
        ]
      }
    }
  }
];

// Panic lines
const NT_ICEPACKS_BY_LANG = {
  en: [
    "What’s something you’ve been quietly obsessed with recently?",
    "What’s the best thing that happened to you this week?",
    "If today had a title, what would you call it?",
    "Is there anything you’re looking forward to this month?",
    "What’s a tiny thing that made you happy recently?"
  ]
};

// Footer helper
function ntGetFooterLanguageLabel(code) {
  const lang = NT_LANGUAGES.find((l) => l.code === code);
  return lang ? `Interface language: ${lang.label}` : "Interface language";
}
