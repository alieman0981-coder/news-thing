// server.js — Express API for NEWS THING

const express = require("express");
const cors = require("cors");
const { fetchNewsFor } = require("./rssFetcher");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: allow your Netlify domain in production
app.use(
  cors({
    origin: "*"
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get("/api/news", async (req, res) => {
  const region = (req.query.region || "usa").toLowerCase();
  const category = (req.query.category || "top").toLowerCase();

  try {
    const articles = await fetchNewsFor(region, category);
    res.json({
      region,
      category,
      count: articles.length,
      articles
    });
  } catch (err) {
    console.error("API /api/news error", err);
    res.status(500).json({
      error: "Failed to fetch news",
      region,
      category
    });
  }
});

app.listen(PORT, () => {
  console.log(`NEWS THING backend running on port ${PORT}`);
});
