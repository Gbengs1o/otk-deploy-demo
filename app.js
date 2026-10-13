"use strict";

const express = require("express");
const path = require("node:path");

function createApp(options = {}) {
  const app = express();
  const version = options.version || process.env.RELEASE_VERSION || require("./package.json").version;
  const startedAt = new Date().toISOString();
  const startedTime = Date.now();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    });
    next();
  });
  app.get("/health", (req, res) => {
    res.set("Cache-Control", "no-store").json({
      status: "ok",
      service: "otk-deploy-demo",
      version,
      uptimeSeconds: Math.floor((Date.now() - startedTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  });
  app.get("/api/info", (req, res) => {
    res.set("Cache-Control", "no-store").json({
      name: "OTK Deploy demo",
      version,
      runtime: "Node.js",
      framework: "Express",
      startedAt,
      endpoints: ["/", "/guide", "/health", "/api/info"],
    });
  });
  app.get("/guide", (req, res) => res.sendFile(path.join(__dirname, "public", "guide.html")));
  app.use(express.static(path.join(__dirname, "public"), { maxAge: "5m" }));
  app.use((req, res) => res.status(404).json({ error: "Not found", guide: "/guide" }));
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const server = createApp().listen(port, "0.0.0.0", () => {
    console.log(`OTK Deploy demo listening on 0.0.0.0:${port}`);
  });
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      console.log(`${signal} received; closing HTTP server`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}

module.exports = { createApp };
