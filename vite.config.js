import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { SEASONS, SEASON_THEMES, resolveSeason } from './src/data/seasons.js'
import { heroPreloadTag } from './src/data/heroSlides.js'

// The festive theme can't be decided at build time (the page is static and the
// date is the visitor's), so /season-boot.js runs in <head>, before first
// paint, checks the date and sets data-season-* attributes on <html>. The CSS
// in src/season.css and the components in src/components/season key off them.
// The date logic is the real resolveSeason() from src/data/seasons.js, so the
// page and the React side can never disagree.
//
// It is a separate file rather than an inline <script> so the site's
// Content-Security-Policy can forbid inline scripts altogether.
//
// The holidays the hotel adds in the Studio are not in the build, so the boot
// script also reads the copy src/lib/holidays.js cached on the last visit: the
// very first visit of a holiday shows the bar a moment after load, every one
// after that is right before the first paint.
const seasonBootSource = () => `(function () {
  try {
    var d = document.documentElement;
    var read = function (store, key) { try { return window[store].getItem(key); } catch (e) { return null; } };
    var q = new URLSearchParams(location.search);
    var asked = q.get("season");
    if (asked) {
      try { sessionStorage.setItem("season-preview", asked + (q.get("phase") ? ":" + q.get("phase") : "")); } catch (e) {}
    }
    // The hotel chose "never show seasonal greetings" in the Studio (remembered by src/lib/season.js).
    if (!asked && read("localStorage", "season-force-off") === "1") return;
    var extra = [];
    try {
      var cached = JSON.parse(read("localStorage", "season-schedule") || "null");
      if (cached && cached.seasons && cached.seasons.length) extra = cached.seasons;
    } catch (e) {}
    var season = (${resolveSeason.toString()})(extra.concat(${JSON.stringify(SEASONS)}), new Date(), read("sessionStorage", "season-preview"));
    if (!season) return;
    d.setAttribute("data-season-name", season.name);
    d.setAttribute("data-season-phase", season.phase);
    d.setAttribute("data-season-year", String(season.year));
    if (read("localStorage", "season-off") !== season.key) {
      d.setAttribute("data-season", season.theme);
      // The mobile browser's own chrome (address bar) takes the season's colour too.
      var theme = document.querySelector('meta[name="theme-color"]');
      var themes = ${JSON.stringify(SEASON_THEMES)};
      if (theme) theme.setAttribute("content", season.phase === "newyear" ? "#1f5a3d" : (themes[season.theme] || {}).chrome || "#8c5f2e");
      // The festive artwork is its own file, fetched only for the Christmas look
      // (see src/season-art.css) — the other themes are colour and type only.
      if (season.theme === "christmas" && !document.getElementById("season-art")) {
        var art = document.createElement("link");
        art.id = "season-art";
        art.rel = "stylesheet";
        art.href = "/season-art.css";
        document.head.appendChild(art);
      }
    }
    if (read("localStorage", "season-bar") === season.key) d.setAttribute("data-season-bar", "closed");
    if (read("localStorage", "season-snow") === "off") d.setAttribute("data-season-snow", "off");
  } catch (e) {}
})();
`

const seasonArtSource = () => fs.readFileSync(fileURLToPath(new URL('./src/season-art.css', import.meta.url)), 'utf8')

const seasonBoot = () => ({
  name: 'season-boot',
  configureServer(server) {
    server.middlewares.use('/season-boot.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript')
      res.end(seasonBootSource())
    })
    server.middlewares.use('/season-art.css', (_req, res) => {
      res.setHeader('Content-Type', 'text/css')
      res.end(seasonArtSource())
    })
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'season-boot.js', source: seasonBootSource() })
    this.emitFile({ type: 'asset', fileName: 'season-art.css', source: seasonArtSource() })
  },
})

// Writes the <link rel="preload"> for the first hero slide into index.html, from the
// same slide list and image manifest the slideshow itself uses (src/data/heroSlides.js).
const heroPreload = () => ({
  name: 'hero-preload',
  transformIndexHtml: (html) => {
    const variants = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./src/lib/imageVariants.json', import.meta.url)), 'utf8'))
    return html.replace('<!--hero-preload-->', heroPreloadTag(variants))
  },
})

// Seasonal social card. Link previews are built from the HTML alone — WhatsApp,
// Facebook and X do not run the page — so the only way a shared link can carry
// festive artwork is for the HTML to say so. A build made during the season
// points at the Christmas card; a January build points back at the standard one.
// (public/og-image-christmas.jpg is generated by scripts/generate-og-image.mjs.)
const seasonOg = () => ({
  name: 'season-og',
  transformIndexHtml: (html) => {
    if (resolveSeason(SEASONS, new Date())?.theme !== 'christmas') return html
    return html
      .replaceAll('/og-image.jpg', '/og-image-christmas.jpg')
      .replaceAll('content="Hotel Itoya | Premier Business Hotel in Busia, Kenya"', 'content="Christmas at Hotel Itoya | Busia, Kenya"')
      .replaceAll('Hotel Itoya exterior — Busia, Kenya', 'Hotel Itoya in Busia, decorated for Christmas')
  },
})

// Two HTML entries. The homepage is the app shell; /privacy is its own document
// so that its <link rel="canonical"> lives in the raw HTML instead of being
// injected by JavaScript (Search Console was filing /privacy as an "alternate
// page" because it inherited the homepage's canonical through shared HTML).
export default defineConfig({
  plugins: [react(), seasonBoot(), heroPreload(), seasonOg()],
  build: {
    rollupOptions: {
      input: {
        main:    fileURLToPath(new URL('./index.html', import.meta.url)),
        privacy: fileURLToPath(new URL('./privacy/index.html', import.meta.url)),
      },
    },
  },
})
