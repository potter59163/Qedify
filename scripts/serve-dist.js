/**
 * Minimal static server for the production export in dist/, with the same
 * clean-URL and 404 behaviour as the Vercel deployment. For local checks only.
 *
 *   npm run build:web && node scripts/serve-dist.js 4173
 */
const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");

const root = path.join(__dirname, "..", "dist");
const port = Number(process.argv[2]) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ttf": "font/ttf",
};

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const base = path.join(root, clean);
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, `${base}.html`, path.join(base, "index.html")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

http
  .createServer((req, res) => {
    let file = resolve(req.url || "/");
    let status = 200;
    if (!file) {
      file = path.join(root, "404.html");
      status = 404;
      if (!fs.existsSync(file)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
    }
    const ext = path.extname(file);
    const type = TYPES[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Cache-Control": file.includes(`${path.sep}_expo${path.sep}static`) ? "public, max-age=31536000, immutable" : "no-cache",
    };
    const body = fs.readFileSync(file);
    const compressible = /^(text\/|application\/(json|xml)|image\/svg)/.test(type);
    if (compressible && /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""))) {
      res.writeHead(status, { ...headers, "Content-Encoding": "gzip", Vary: "Accept-Encoding" });
      res.end(zlib.gzipSync(body));
    } else {
      res.writeHead(status, headers);
      res.end(body);
    }
  })
  .listen(port, () => console.log(`Serving dist/ at http://localhost:${port}`));
