/**
 * Vercel serverless function: POST /api/coach
 * Needs ANTHROPIC_API_KEY in the project's environment variables.
 */
const { handleCoach } = require("../server/coach");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  const out = await handleCoach(body, forwarded.split(",")[0].trim() || "anon");
  res.status(out.status).json(out.body);
};
