# OTK Deploy demo

A small Express backend and developer welcome page for the OTK team. This is a reference application deployed **by Coolify**; the Coolify dashboard provides app management and team controls.

Adapted from [render-examples/express-hello-world](https://github.com/render-examples/express-hello-world). The original Render Developers copyright and MIT license are preserved in [LICENSE](LICENSE). OTK added the interface, health API, guide, Dockerfile, and tests.

## Public access

- Dashboard: https://deploy.otkdeploy.app (sign in with your existing account).
- Demo: https://demo.otkdeploy.app
- Developer guide: https://demo.otkdeploy.app/guide
- Health: https://demo.otkdeploy.app/health

The public routes use Cloudflare Tunnel and work from any internet connection. The LAN addresses below remain useful for local maintenance.

## Endpoints

| Route | Purpose |
| --- | --- |
| `/` | Responsive OTK Deploy welcome page with live backend status |
| `/guide` | Practical developer deployment guide |
| `/health` | HTTP 200 JSON health, version, uptime, and timestamp |
| `/api/info` | Runtime, release version, and implemented endpoints |

The page uses local assets, without CDNs. `/health` and `/api/info` are not cached. Health status is fetched from the running backend every 15 seconds and changes to unavailable when a request fails.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm test
npm start
# http://localhost:3000
```

The app listens on `0.0.0.0`. Set `PORT` to change its listening port. The displayed release defaults to `package.json`'s version; set `RELEASE_VERSION` to override it. Never commit secrets or `.env` files.

## Deploy through Coolify

1. In the OTK project and development environment, create an application from this public GitHub repository: `https://github.com/Gbengs1o/otk-deploy-demo`.
2. Select branch `main`, server `otk-deploy`, and the Dockerfile build pack.
3. Set base directory `/` and Dockerfile location `/Dockerfile`.
4. Set the exposed internal port to `3000`; set `PORT=3000` as a runtime variable if needed.
5. For the demo, map host port `3001` to container port `3000` using `3001:3000`. Other applications must use a different host port or a hostname through the proxy.
6. Set domain `http://demo.192.168.1.94.sslip.io` to test the Coolify proxy on the LAN. Public DNS resolving private addresses can be blocked on some networks; the direct LAN address avoids that dependency.
7. Enable an HTTP health check at `/health` on port `3000`, with the health check host set to `127.0.0.1`, and deploy. This keeps the check on IPv4, matching the app's listener. The Docker image also provides its own health check.
8. Check build/runtime logs, then open `http://192.168.1.94:3001`. Verify `/health` and `/api/info` return HTTP 200 and the expected version.

The dashboard is on `http://192.168.1.94:8000`. These addresses need access to the local network. This demo does not need a database and is suitable for a 256 MiB memory / 0.5 CPU limit; application workloads and build requirements vary.

## Prove a GitHub update

Change the application code or package version, commit and push to `main`, and choose **Redeploy** in Coolify. Confirm the deployment commit and new release returned by `/health`. Leave `RELEASE_VERSION` unset if you want changes to the package version reflected automatically.

Manual deployment from GitHub works. **Automatic deployment on pushes still requires configuring the GitHub App or a signed repository webhook.** The public webhook URL is now available at `https://deploy.otkdeploy.app/webhooks/source/github/events/manual`. Use the secret shown in the app's Webhooks settings. Once configured, push a change and verify that deployment starts automatically.

## Adding another public app

Set the app's public hostname in Coolify. Add that hostname as a Cloudflare published application route to `http://127.0.0.1:80`, leaving the HTTP Host Header override empty. Disable the app's origin HTTP-to-HTTPS redirect when using this HTTP tunnel origin. Verify public HTTPS and application endpoints. The existing tunnel currently has routes for the dashboard and this demo; a new hostname needs its own route.

The tunnel is an external access step; this app does not configure tunnels, DNS, router rules, or Proxmox.

## Docker

```sh
docker build -t otk-deploy-demo .
docker run --rm -p 3001:3000 otk-deploy-demo
```

The image uses Node.js 22 Alpine, `npm ci --omit=dev`, a non-root runtime user, and a `/health` check. Dependencies are locked in `package-lock.json`. The HTTP server closes on SIGTERM for container shutdown.
