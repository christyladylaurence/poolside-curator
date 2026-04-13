

## Switch to Native FFmpeg via Electron IPC (Revised)

Addresses both flags from Claude — no large blobs through IPC, and a graceful web fallback cap.

### What changes

**1. New file: `electron/preload.cjs`**
- Uses `contextBridge` to expose `window.electronAPI` with:
  - `muxVideo({ videoPath, audioPath, outputPath })` — all file paths, no blobs
  - `onMuxProgress(callback)` — receives `{ percent, timeStr }` updates
  - `showSaveDialog(defaultName)` — native macOS save dialog
  - `writeTempWav(arrayBuffer)` — writes WAV to `os.tmpdir()` in chunks, returns the temp path

**2. Updated: `electron/main.cjs`**
- Add `preload` to BrowserWindow's webPreferences
- Add IPC handlers:
  - `write-temp-wav`: Receives WAV ArrayBuffer, writes it to `os.tmpdir()` in 64KB chunks using streaming (`fs.createWriteStream`), returns the file path. This avoids buffering a 2-3GB WAV in memory.
  - `mux-video`: Receives three file paths (video, audio WAV, output MP4). Spawns `ffmpeg` via `child_process.spawn` (not execFile — spawn streams stderr). Parses `time=HH:MM:SS.xx` from stderr for progress. Sends progress to renderer via `event.sender.send()`. Cleans up temp WAV when done.
  - `show-save-dialog`: Opens `dialog.showSaveDialog()` with `.mp4` filter, returns chosen path
  - `get-dropped-file-path`: Given a file name, returns the actual filesystem path (Electron can access this from the drop event's `path` property)

**3. Updated: `src/pages/Index.tsx`** — `handleBuildMp4`
- **Electron path** (when `window.electronAPI` exists):
  1. Show save dialog → user picks output location
  2. Get video file's real path (Electron exposes `file.path` on dropped Files)
  3. Write WAV blob to temp file via IPC (streamed in chunks)
  4. Call `muxVideo({ videoPath, audioPath, outputPath })`
  5. Listen for progress updates, update the progress bar
  6. Show "Done — saved to [path]" when complete
  7. Skip the cloud upload step entirely
- **Web path** (no `window.electronAPI`):
  - Keep existing ffmpeg.wasm code
  - Add a check: if total track duration > 30 minutes, show a toast: "For mixes over 30 minutes, use the desktop app for reliable MP4 builds"
  - Still attempt the build (don't block it), but the warning sets expectations

**4. Updated: `electron/main.cjs`** — video file path access
- The `videoFile` in the renderer is a `File` object from a drag-and-drop. In Electron, dropped `File` objects have a `.path` property with the real filesystem path. We'll pass this directly — no need to read the video into memory at all.

### Key design decisions
- **No blobs through IPC** — WAV is streamed to a temp file, video path is passed directly. FFmpeg reads both from disk.
- **Streaming throughout** — `fs.createWriteStream` for the WAV write, `child_process.spawn` for ffmpeg (streams stderr for progress)
- **No ffmpeg bundling needed** — user already has it installed. Show a clear error if `ffmpeg` isn't found on PATH.
- **Web fallback capped** — warning message for long mixes, but doesn't block the attempt

### After approving
Same rebuild command as always to get the changes into the desktop app.

