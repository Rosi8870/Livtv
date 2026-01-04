import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

/* CORS for Vercel frontend */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

/* Fetch with timeout */
async function fetchWithTimeout(url, ms = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

/* Channels API */
app.get("/channels", async (req, res) => {
  try {
    const m3uUrl = "https://iptv-org.github.io/iptv/index.m3u";
    const text = await fetchWithTimeout(m3uUrl);

    const channels = [];
    let name = "";

    text.split("\n").forEach(line => {
      line = line.trim();
      if (line.startsWith("#EXTINF")) {
        name = line.split(",").pop()?.trim();
      } else if (line.startsWith("http") && line.includes(".m3u8")) {
        channels.push({
          name: name || "Unknown Channel",
          url: line
        });
      }
    });

    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Failed to load channels" });
  }
});

/* Health check */
app.get("/", (req, res) => {
  res.send("Live TV Backend is running");
});

app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
