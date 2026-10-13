"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app");

let server;
let origin;
before(async () => {
  await new Promise((resolve) => {
    server = createApp({ version: "test-release" }).listen(0, "127.0.0.1", resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test("health is available, current, and carries the deployed release", async () => {
  const response = await fetch(`${origin}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const health = await response.json();
  assert.equal(health.status, "ok");
  assert.equal(health.service, "otk-deploy-demo");
  assert.equal(health.version, "test-release");
  assert.ok(Number.isInteger(health.uptimeSeconds) && health.uptimeSeconds >= 0);
  assert.ok(Math.abs(Date.now() - Date.parse(health.timestamp)) < 10_000);
});

test("info describes the running application and links only implemented endpoints", async () => {
  const response = await fetch(`${origin}/api/info`);
  assert.equal(response.status, 200);
  const info = await response.json();
  assert.equal(info.version, "test-release");
  assert.equal(info.runtime, "Node.js");
  for (const route of info.endpoints) {
    const endpoint = await fetch(`${origin}${route}`);
    assert.equal(endpoint.status, 200, `${route} must resolve`);
  }
});

test("welcome page and guide are usable pages with local assets and security headers", async () => {
  for (const route of ["/", "/guide"]) {
    const response = await fetch(`${origin}${route}`);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    const html = await response.text();
    assert.match(html, /OTK Deploy/);
    const localAssets = [...html.matchAll(/(?:src|href)="(\/(?:styles\.css|status\.js))"/g)].map((m) => m[1]);
    assert.ok(localAssets.length >= 1);
    for (const asset of localAssets) assert.equal((await fetch(`${origin}${asset}`)).status, 200);
    assert.doesNotMatch(html, /(?:src|href)="https?:\/\/[^\"]+\.(?:js|css)/);
  }
});

test("unknown resources return a real 404 instead of reporting a healthy app", async () => {
  const response = await fetch(`${origin}/missing-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found", guide: "/guide" });
});
