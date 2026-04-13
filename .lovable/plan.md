

## Fix: Serve Electron app via local HTTP server instead of `file://`

Claude's diagnosis is spot-on — this is the same root cause I identified earlier. The `file://` protocol breaks two things FFmpeg needs: dynamic ES module imports and COOP/COEP headers for SharedArrayBuffer. The fix is to serve the app over `http://localhost` from inside Electron.

### What changes

**1. `electron/main.cjs`** — Add a tiny local HTTP server using Node's built-in `http` and `fs` modules (no extra dependencies needed):
- Create a static file server that serves the `dist/` folder
- Set COOP/COEP headers on every response (replacing the current `onHeadersReceived` hack)
- Pick a random available port
- Change `win.loadFile(...)` → `win.loadURL('http://localhost:<port>/index.html')`
- Remove the `session.defaultSession.webRequest.onHeadersReceived` block (no longer needed)

**2. `src/pages/Index.tsx`** (lines 515-525) — Simplify FFmpeg URL logic:
- Remove the `file://` special case entirely
- Always use `window.location.origin` for coreURL and wasmURL since the app will always run over HTTP now

### After approving

You'll need to do one more rebuild on your Mac (same single command as before) to get the fix into your desktop app. This should be the last time for this issue.

