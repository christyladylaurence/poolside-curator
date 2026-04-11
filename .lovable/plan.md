

## YouTube Optimization Features — Expert Recommendations

Here's what the product currently does well: episode building with crossfades, YouTube chapters, SRT subtitles, SEO-enhanced track names, and MP4 export. Below are high-impact features that would take it further.

---

### 1. Auto-generate YouTube description (high impact)
Currently you get chapters and SRT, but no full description. A complete YouTube description should include:
- A hook line (e.g. "1 hour of deep house for focus & relaxation")
- The chapter timestamps (already generated)
- Track credits with artist/track links
- Hashtags based on genre (#DeepHouse #ChillMix #LofiBeats)
- A call-to-action ("Subscribe for weekly mixes")
- Social links placeholder

**Changes**: Add a "Copy Description" button to CommandPanel that assembles all of this from the existing track data, genre, schedule date, and lead instrument.

### 2. Auto-generate YouTube title with SEO
Generate a ready-to-paste title like: `Deep House Mix 2026 · Poolside Sunset Vibes · Flute Edition [1 Hour]`
Using: genre, lead instrument, runtime, and rotating SEO keywords.

**Changes**: Generate title in the build step, display it at the top of CommandPanel with a copy button.

### 3. YouTube tags generator
Generate a comma-separated list of tags based on genre, track names, and instrument. YouTube tags are limited to 500 characters — the generator should respect that.

**Changes**: Add tag generation logic and a "Copy Tags" button to CommandPanel.

### 4. Thumbnail text overlay suggestion
Show a recommended thumbnail text line based on the genre and episode metadata (e.g. "DEEP HOUSE · FLUTE · 1 HOUR"). This helps maintain a consistent thumbnail style.

**Changes**: Small text display in CommandPanel with copy button.

### 5. Episode numbering / series tracking
For channels posting regularly, auto-increment episode numbers (persisted in localStorage). This helps with titles like "Poolside Sessions #47" and builds series recognition.

**Changes**: Add an `episodeNumber` counter in localStorage, display in FilterBar, include in generated titles/descriptions.

---

### Implementation priority

I'd suggest doing **#1 (description), #2 (title), and #3 (tags)** together — they're all text generation added to CommandPanel and would immediately save 10+ minutes per upload. Features #4 and #5 are quick additions that round out the workflow.

### Technical approach
- All logic lives in a new utility function `generateYouTubeMetadata()` in `audio-utils.ts`
- CommandPanel gets three new copy buttons in the "ready" phase
- No database changes needed — everything is derived from existing state

