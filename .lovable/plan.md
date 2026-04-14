

## Refactor MP4 Export: Let ffmpeg Handle Audio Mixing

### What this solves
The current export renders all audio into a single WAV blob in the browser (OfflineAudioContext), which crashes on long mixes due to multi-GB memory allocation. The fix delegates all audio mixing, crossfading, and loudnorm to ffmpeg on disk.

### Architecture change

```text
BEFORE:
  Renderer: decode all tracks → OfflineAudioContext → WAV blob → IPC chunks → temp file → ffmpeg mux

AFTER:
  Renderer: collect file paths + crossfade config → single IPC call → ffmpeg does everything
```

### Plan

**1. Add `diskPath` to Track type and capture it on drop**

- In `src/lib/audio-utils.ts`, add `diskPath?: string` to the `Track` interface.
- In `src/pages/Index.tsx` `handleLoadTracks`, read `(file as any).path` (Electron exposes this on dropped File objects) and store it as `diskPath` on each track.
- In `src/lib/video-store.ts`, persist `diskPath` in IndexedDB alongside other track data, and restore it on load.

**2. Add `save-track-to-temp` IPC for tracks without a disk path**

- In `electron/main.cjs`, add a handler that accepts `{ blob: ArrayBuffer, fileName: string }`, writes it to a temp file, and returns the path. This covers edge cases where tracks are loaded from URLs or restored from IndexedDB without a valid path.
- Add corresponding method in `electron/preload.cjs` and `src/lib/electron-export.ts` types.

**3. Create `build-episode` IPC handler in `electron/main.cjs`**

- Accepts a manifest: `{ videoPath, outputPath, crossfadeSeconds, tracks: [{ path }] }`.
- First runs `which ffmpeg` check. Returns clear error if not found.
- Dynamically constructs the ffmpeg `filter_complex` chain:
  - For N tracks, builds N-1 pairwise `acrossfade=d=X` filters.
  - Appends `loudnorm=I=-14:TP=-1.5:LRA=11` at the end.
- Uses `-stream_loop -1` on video, `-map 0:v`, `-map "[out]"`, `-c:v copy` (no re-encode since input is already good), `-c:a aac -b:a 320k`, `-shortest`.
- Spawns ffmpeg, parses `time=` from stderr, sends `build-episode-progress` events to renderer.
- On completion, resolves with `{ success: true }` or `{ success: false, error }`.

**4. Rewrite `handleBuildMp4` in `src/pages/Index.tsx`**

- Remove dependency on `cpanel.wavBlob` — the new flow doesn't need a pre-rendered WAV.
- When user clicks Build MP4:
  1. Show save dialog.
  2. Collect `diskPath` from each track. For any track missing a `diskPath`, call `save-track-to-temp` IPC to write its File blob to disk and get a path.
  3. Get `videoFile.path` for the video.
  4. Send `build-episode` IPC with the manifest.
  5. Listen for `build-episode-progress` events to update progress bar.
- The Build MP4 button will be available directly (not gated behind WAV rendering).

**5. Simplify `handleBuild` (the "Build Episode" button)**

- Remove the `OfflineAudioContext` rendering, `createWAVFile`, and WAV blob creation from the export path entirely.
- Keep the metadata generation (chapters, SRT, YouTube metadata) — this only needs track durations, not audio data.
- The "Download WAV" option will be removed from the Electron path (ffmpeg handles everything). On web, we can keep it as a fallback or remove it.
- Update `CommandPanelState` to remove `wavBlob`/`wavFilename` when in Electron mode.

**6. Clean up obsolete code**

- Remove `writeBlobToTempWav` from `src/lib/electron-export.ts` (replace with new types/interfaces).
- Remove `create-temp-wav-file`, `append-temp-wav-chunk`, `delete-temp-wav-file` IPC handlers from `electron/main.cjs`.
- Remove `electron/temp-file.cjs` (replace with simpler track-to-temp-file utility).
- Remove the old `mux-video` IPC handler.
- Update `src/vite-env.d.ts` and preload with new API surface.

**7. Update preload and type definitions**

- `electron/preload.cjs`: Expose `buildEpisode(manifest)`, `onBuildEpisodeProgress(callback)`, `saveTrackToTemp({ blob, fileName })`, plus existing `showSaveDialog`.
- `src/lib/electron-export.ts`: Update `ElectronAPI` interface to match.
- `src/vite-env.d.ts`: Keep pointing at the updated interface.

### Files modified

| File | Action |
|------|--------|
| `src/lib/audio-utils.ts` | Add `diskPath` to Track |
| `src/pages/Index.tsx` | Capture diskPath on drop, rewrite handleBuild + handleBuildMp4 |
| `src/lib/video-store.ts` | Persist/restore diskPath |
| `electron/main.cjs` | Replace old IPC handlers with `build-episode` + `save-track-to-temp` |
| `electron/preload.cjs` | Expose new IPC methods |
| `src/lib/electron-export.ts` | New types, remove writeBlobToTempWav |
| `electron/temp-file.cjs` | Delete (replaced by inline temp logic) |
| `src/vite-env.d.ts` | Updated automatically via ElectronAPI import |

### What stays the same
- Web Audio API for preview playback (crossfade slider, track preview)
- Web fallback (ffmpeg.wasm) for non-Electron builds
- All metadata generation (chapters, SRT, YouTube)
- Track UI, drag-and-drop reordering, genre cycling

