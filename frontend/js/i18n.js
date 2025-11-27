// Lightweight UI strings.

const NT_UI_STRINGS = {
  footerLanguageLabel: {
    en: "Interface language: English",
    ar: "لغة الواجهة: العربية مع دعم للإنجليزية",
    ur: "انٹرفیس زبان: اردو (انگلش بھی دستیاب ہے)",
    hi: "इंटरफ़ेस भाषा: हिन्दी (साथ में अंग्रेज़ी)",
    fr: "Langue de l’interface : Français",
    de: "Interface-Sprache: Deutsch",
    tr: "Arayüz dili: Türkçe",
    zh: "界面语言：中文（含英文）",
    es: "Idioma de la interfaz: Español",
    it: "Lingua dell’interfaccia: Italiano",
    ru: "Язык интерфейса: Русский",
    pt: "Idioma da interface: Português"
  },
  rtlHint: {
    en: "",
    ar: "يتم ضبط اتجاه النص تلقائياً لليسار/اليمين حسب اللغة.",
    ur: "زبان کے حساب سے متن کا رخ خود بخود دائیں سے بائیں یا بائیں سے دائیں ہو جاتا ہے۔"
  }
};

function ntGetFooterLanguageLabel(code) {
  const entry = NT_UI_STRINGS.footerLanguageLabel;
  return entry[code] || entry.en;
}

function ntGetRtlHint(code) {
  const entry = NT_UI_STRINGS.rtlHint;
  return entry[code] || "";
}
