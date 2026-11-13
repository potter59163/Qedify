// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/**
 * In production /api/coach is a Vercel function (api/coach.js). During
 * `expo start` there is no Vercel, so the dev server answers the same route
 * with the same handler. ANTHROPIC_API_KEY is read from .env.local.
 */
function devCoach(req, res) {
  const send = (status, body) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST") return send(405, { error: "method_not_allowed" });

  let raw = "";
  let tooBig = false;
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 32_000) tooBig = true;
  });
  req.on("end", async () => {
    if (tooBig) return send(413, { error: "context_too_large" });
    let body = null;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(400, { error: "bad_request" });
    }
    try {
      const { handleCoach } = require("./server/coach");
      const out = await handleCoach(body, req.socket?.remoteAddress || "local");
      send(out.status, out.body);
    } catch (err) {
      console.error("[coach]", err);
      send(500, { error: "server_error" });
    }
  });
}

const previous = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previous ? previous(middleware, server) : middleware;
    return (req, res, next) => {
      if (req.url && req.url.split("?")[0] === "/api/coach") return devCoach(req, res);
      return base(req, res, next);
    };
  },
};

module.exports = config;
