// data.js — NEWS THING config

const NT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" }
];
const NT_RTL_LANGS = ["ar"];

const NT_SCENARIOS = ["event", "school", "family", "online"];

// Countries + category sets (your current list)
const NT_COUNTRY_CONFIG = {
  usa: {
    label: "United States",
    newsCats: ["top","politics","sports","nba","fashion","entertainment","stocks","economies"],
    socialCats: ["trends","fashion","entertainment","sports"]
  },
  canada: {
    label: "Canada",
    newsCats: ["top","sports","hockey","weather","economies","fashion","media"],
    socialCats: ["trends","fashion","entertainment","media"]
  },
  uk: {
    label: "United Kingdom",
    newsCats: ["top","equestrian","fashion","entertainment","royal_family","football","celebrities","education"],
    socialCats: ["trends","fashion","entertainment","celebrities"]
  },
  switzerland: {
    label: "Switzerland",
    newsCats: ["top","skiing","polo","economies","finance","entertainment","events","weather"],
    socialCats: ["trends","entertainment","events","fashion"]
  },
  australia: {
    label: "Australia",
    newsCats: ["top","weather","sports","equestrian","fashion","entertainment","events"],
    socialCats: ["trends","fashion","entertainment","events"]
  },
  saudi_arabia: {
    label: "Saudi Arabia",
    newsCats: ["top","fashion","entertainment","events","sports","equestrian","trends","royal_family","finance"],
    socialCats: ["trends","fashion","entertainment","events"]
  },
  uae: {
    label: "United Arab Emirates",
    newsCats: ["top","events","entertainment","media","finance","economies","fashion","trends"],
    socialCats: ["trends","fashion","entertainment","media"]
  },
  germany: {
    label: "Germany",
    newsCats: ["top","finance","entertainment","events","trends","fashion","economies","education"],
    socialCats: ["trends","fashion","entertainment","events"]
  },
  finland: {
    label: "Finland",
    newsCats: ["top","fashion","entertainment","education","events","finance","economics","trends"],
    socialCats: ["trends","fashion","entertainment","events"]
  }
};

// Friendly labels (for UI)
const NT_CATEGORY_LABELS = {
  top: "Top",
  politics: "Politics",
  sports: "Sports",
  nba: "NBA",
  fashion: "Fashion",
  entertainment: "Entertainment",
  stocks: "Stocks",
  economies: "Economies",
  economics: "Economics",
  hockey: "Hockey",
  weather: "Weather",
  media: "Media",
  equestrian: "Equestrian",
  royal_family: "Royal family",
  football: "Football",
  celebrities: "Celebrities",
  education: "Education",
  skiing: "Skiing",
  polo: "Polo",
  finance: "Finance",
  trends: "Trends",
  events: "Events"
};

const NT_ICEPACKS_BY_LANG = {
  en: [
    "What’s something you’ve been quietly obsessed with recently?",
    "What’s been the highlight of your week so far?",
    "If you could plan a perfect weekend, what would it look like?",
    "What’s a show or song you can’t stop replaying lately?",
    "What’s the most interesting thing you learned recently?"
  ],
  ar: [
    "وش أكثر شي شاغل بالك هالفترة؟",
    "وش أحلى شي صار لك هالأسبوع؟",
    "لو تقدر تخطط ويكند مثالي، وش بتسوي؟",
    "وش أغنية أو مسلسل ما تقدر توقف عنه؟",
    "وش أكثر معلومة جديدة عجبتك مؤخرًا؟"
  ]
};

function ntGetFooterLanguageLabel(code) {
  const lang = NT_LANGUAGES.find(l => l.code === code);
  return lang ? `Interface language: ${lang.label}` : "Interface language";
}
