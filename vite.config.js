import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { SEASONS, resolveSeason } from './src/data/seasons.js'

// The festive theme can't be decided at build time (the page is static and the
// date is the visitor's), so /season-boot.js runs in <head>, before first
// paint, checks the date and sets data-season-* attributes on <html>. The CSS
// in src/season.css and the components in src/components/season key off them.
// The date logic is the real resolveSeason() from src/data/seasons.js, so the
// page and the React side can never disagree.
//
// It is a separate file rather than an inline <script> so the site's
// Content-Security-Policy can forbid inline scripts altogether.
const seasonBootSource = () => `(function () {
  try {
    var d = document.documentElement;
    var read = function (store, key) { try { return window[store].getItem(key); } catch (e) { return null; } };
    var q = new URLSearchParams(location.search);
    var asked = q.get("season");
    if (asked) {
      try { sessionStorage.setItem("season-preview", asked + (q.get("phase") ? ":" + q.get("phase") : "")); } catch (e) {}
    }
    var season = (${resolveSeason.toString()})(${JSON.stringify(SEASONS)}, new Date(), read("sessionStorage", "season-preview"));
    if (!season) return;
    d.setAttribute("data-season-name", season.name);
    d.setAttribute("data-season-phase", season.phase);
    d.setAttribute("data-season-year", String(season.year));
    if (read("localStorage", "season-off") !== "1") d.setAttribute("data-season", season.name);
    if (read("localStorage", "season-bar") === season.key) d.setAttribute("data-season-bar", "closed");
    if (read("localStorage", "season-snow") === "off") d.setAttribute("data-season-snow", "off");
  } catch (e) {}
})();
`

const seasonBoot = () => ({
  name: 'season-boot',
  configureServer(server) {
    server.middlewares.use('/season-boot.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript')
      res.end(seasonBootSource())
    })
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'season-boot.js', source: seasonBootSource() })
  },
})

// Two HTML entries. The homepage is the app shell; /privacy is its own document
// so that its <link rel="canonical"> lives in the raw HTML instead of being
// injected by JavaScript (Search Console was filing /privacy as an "alternate
// page" because it inherited the homepage's canonical through shared HTML).
export default defineConfig({
  plugins: [react(), seasonBoot()],
  build: {
    rollupOptions: {
      input: {
        main:    fileURLToPath(new URL('./index.html', import.meta.url)),
        privacy: fileURLToPath(new URL('./privacy/index.html', import.meta.url)),
      },
    },
  },
})
