

# Recreate "Poolside Sessions — Track Curator" in React

This is a sophisticated audio track curator app with video backgrounds, drag-and-drop reordering, audio playback with scrub bars, crossfade mixing, genre filtering, YouTube SEO enhancement, and FFmpeg-based episode building. Here's the plan to convert it into a clean React application.

## What gets built

A dark, cinematic track management tool where users can:
- Drop a video file as an ambient looping background
- Load audio tracks, filter by genre, drag to reorder
- Play/pause tracks with scrub bars and visualizer bars
- Edit track names inline, cycle genres
- Adjust crossfade duration between tracks
- "Enhance for YouTube" — append SEO suffixes to track names
- "Build Episode" — stitch tracks with crossfade via Web Audio API, generate WAV, YouTube chapters, SRT subtitles
- Optionally mux with video via FFmpeg.wasm to produce MP4

## Architecture

### Pages & Components
- **`Index.tsx`** — main page, orchestrates state
- **`VideoDropScreen.tsx`** — full-screen overlay for video upload (drag-and-drop + file picker)
- **`AppHeader.tsx`** — wordmark, title, change video button
- **`FilterBar.tsx`** — genre filter buttons + load/clear actions
- **`TrackList.tsx`** — renders list of tracks with drag-and-drop reordering
- **`TrackItem.tsx`** — individual track row (play, scrub, edit name, genre pip, delete, drag handle, visualizer)
- **`FooterBar.tsx`** — fixed bottom bar with stats, crossfade input, now playing, enhance & build buttons
- **`CommandPanel.tsx`** — modal overlay showing build progress, chapters, download links
- **`BackgroundVideo.tsx`** — fixed video element + overlay + grain layers

### State Management
All state lives in `Index.tsx` via `useState`/`useRef`:
- `tracks[]`, `filter`, `currentlyPlaying`, `crossfadeDuration`, `videoFile`, `isEnhanced`, `commandPanelState`

### Styling
- CSS variables matching the original (amber, dh/lf/hy colors, surfaces, borders)
- Custom CSS in `index.css` for the design system (dark theme, DM Mono + Cormorant Garamond fonts)
- Tailwind for layout utilities where convenient, custom classes for the unique aesthetic

### Key Technical Details
- **Drag-and-drop**: HTML5 native drag events on track items
- **Audio playback**: `HTMLAudioElement` via refs, `ontimeupdate` for scrub bar
- **Visualizer bars**: CSS animation on `.playing` state
- **Build Episode**: Web Audio API `OfflineAudioContext` for crossfade rendering → WAV blob
- **MP4 muxing**: Dynamic import of `@ffmpeg/ffmpeg` and `@ffmpeg/util` from ESM CDN
- **Fonts**: Google Fonts link for Cormorant Garamond (italic serif) and DM Mono (monospace)

### Files to create/modify
1. **`src/index.css`** — replace with full dark theme CSS variables and custom styles
2. **`src/pages/Index.tsx`** — main page with all state
3. **`src/components/BackgroundVideo.tsx`**
4. **`src/components/VideoDropScreen.tsx`**
5. **`src/components/AppHeader.tsx`**
6. **`src/components/FilterBar.tsx`**
7. **`src/components/TrackList.tsx`**
8. **`src/components/TrackItem.tsx`**
9. **`src/components/FooterBar.tsx`**
10. **`src/components/CommandPanel.tsx`**
11. **`src/lib/audio-utils.ts`** — helper functions (cleanName, genre detection, fmt, WAV creation, etc.)
12. **`index.html`** — add Google Fonts link

