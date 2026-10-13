"use strict";
const byId = (id) => document.getElementById(id);
const statusBadge = byId("service-status");
function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
async function refreshHealth() {
  const started = performance.now();
  try {
    const response = await fetch("/health", { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== "ok" || typeof data.version !== "string" || !Number.isInteger(data.uptimeSeconds)) throw new Error("Invalid health response");
    statusBadge.className = "status-badge healthy";
    byId("status-label").textContent = "Service healthy";
    byId("release-version").textContent = data.version;
    byId("service-uptime").textContent = formatUptime(data.uptimeSeconds);
    byId("response-time").textContent = `${Math.round(performance.now() - started)} ms`;
    byId("example-version").textContent = JSON.stringify(data.version);
    byId("last-checked").textContent = `Checked at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · refreshes every 15s`;
  } catch {
    statusBadge.className = "status-badge offline";
    byId("status-label").textContent = "Service unavailable";
    byId("response-time").textContent = "No response";
    byId("service-uptime").textContent = "Unavailable";
    byId("last-checked").textContent = "Health check failed · retrying every 15s";
  }
}
if (statusBadge) {
  byId("curl-origin").textContent = `${window.location.origin}/health`;
  refreshHealth();
  setInterval(refreshHealth, 15_000);
}
