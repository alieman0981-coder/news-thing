const express = require("express");
const cors = require("cors");
const { fetchArticles } = require("./src/rssFetcher");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "NEWS THING backend is running." });
});

app.get("/api/news", async (req, res) => {
  const region = (req.query.region || "global").toString();
  const category = (req.query.category || "top").toString();
  const lang = (req.query.lang || "en").toString();

  try {
    const articles = await fetchArticles(region, category, 24);
    res.json({ region, category, lang, articles });
  } catch (err) {
    console.error("Error in /api/news", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.listen(PORT, () => {
  console.log(`NEWS THING backend listening on port ${PORT}`);
});
