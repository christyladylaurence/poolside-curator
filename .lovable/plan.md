

## Bundle FFmpeg locally — no more external CDN

**What this fixes**: Right now, every time you click "Build MP4," the app downloads ~30MB of FFmpeg files from an external server (jsdelivr). If that server is slow or down, the build fails. By bundling these files directly into the app, the build becomes fully self-contained and instant — no external downloads needed.

**How it works**: The FFmpeg package is already installed in the project. We just need to copy the actual files into the app's `public/` folder and point the code at them instead of the CDN.

---

### Steps

1. **Copy FFmpeg WASM files to `public/wasm/`**
   - Copy `ffmpeg-core.js` and `ffmpeg-core.wasm` from the installed `@ffmpeg/core` package into `public/wasm/`
   - These will be served directly by the app — no internet required

2. **Update `src/pages/Index.tsx`**
   - Remove the CDN URL and retry logic (no longer needed)
   - Load the files from `/wasm/ffmpeg-core.js` and `/wasm/ffmpeg-core.wasm` instead
   - Simplify the loading code since failures from network issues are eliminated

3. **Update `vite.config.ts`**
   - Add proper headers so the browser accepts the WASM file (`application/wasm` content type) — Vite handles this automatically for files in `public/`, so this may not need changes

**Result**: The "Build MP4" button will work reliably every time, with no dependency on external servers.

