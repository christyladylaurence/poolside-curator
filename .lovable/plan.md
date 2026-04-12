

## Fix: "Failed to import ffmpeg-core.js" error

**Root cause**: The `@ffmpeg/ffmpeg` v0.12.x library requires `SharedArrayBuffer` to work, which in turn requires specific CORS headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) on the page. The Lovable preview server doesn't set these headers, so the FFmpeg WASM module fails to initialize.

Additionally, the bundled `public/wasm/ffmpeg-core.js` file (21 lines) appears to be a stub/placeholder rather than the full ~30MB core file from `@ffmpeg/core@0.12.6`.

**Fix approach**:

1. **Add required CORS headers in `vite.config.ts`**
   - Add `headers` config to the dev server: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
   - This enables `SharedArrayBuffer` which FFmpeg WASM requires

2. **Replace the stub `ffmpeg-core.js` with the real file**
   - Copy the actual `@ffmpeg/core@0.12.6` files from `node_modules/@ffmpeg/core/dist/esm/` into `public/wasm/`
   - This includes `ffmpeg-core.js` (~600KB) and `ffmpeg-core.wasm` (~30MB)

3. **Add a `worker` URL to `ffmpeg.load()`**
   - The v0.12.x API also needs a worker URL — add `workerURL` pointing to a local copy of `ffmpeg-core.worker.js`

**Caveat**: The CORS headers may break other resources on the page (e.g., external images, fonts, or CDN scripts) because `require-corp` blocks all cross-origin resources that don't opt in. If that happens, we can switch to `credentialless` instead, or use a `crossOriginIsolated` check and fall back gracefully.

**Result**: The "Build MP4" button will work without any external CDN dependency.

