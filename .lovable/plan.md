

## Fix: FFmpeg core loading failure

**Problem**: The MP4 build fetches `ffmpeg-core.js` and `ffmpeg-core.wasm` from `unpkg.com` at runtime. This CDN can be unreliable, causing the "failed to import ffmpeg-core.js" error.

**Solution**: Switch to jsdelivr CDN (more reliable) and add a retry mechanism.

### Changes

**File: `src/pages/Index.tsx`**

1. Change the CDN base URL from unpkg to jsdelivr:
   - From: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd`
   - To: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd`

2. Wrap the `ffmpeg.load()` call in a retry loop (2 attempts) so a transient network failure doesn't immediately kill the build.

3. Improve the error message to suggest the user check their network and try again.

