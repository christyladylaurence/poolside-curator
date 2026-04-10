

## Energy Rating Button — Right Side

Add a clickable energy/vibe indicator on the right side of each track row, next to the existing ✓ and ✂ buttons. Clicking cycles through 3 levels plus off, using a Lucide `Music` icon at increasing sizes to show how upbeat/strong a track is.

### Behavior
- Click cycles: **off → small 🎵 → medium 🎵 → large 🎵 → off**
- Three sizes: 14px, 18px, 24px
- Color intensifies: dim → amber → bright gold
- When off, shows a small faded icon as clickable target

### Button order (left to right)
`[track box] [✓ check] [🎵 energy] [✂ cutoff]`

### File changes

1. **`src/lib/audio-utils.ts`** — Add `energy?: 0 | 1 | 2 | 3` to `Track` interface

2. **`src/components/TrackItem.tsx`** — Add `onCycleEnergy` prop. Render `.energy-side-btn` between the check and cutoff buttons. Import `Music` from `lucide-react` and render it at the appropriate size based on `track.energy`.

3. **`src/index.css`** — Style `.energy-side-btn` matching the existing side button pattern, with amber/gold color states for each energy level.

4. **`src/pages/Index.tsx`** — Add `handleCycleEnergy` callback: `energy = ((track.energy || 0) + 1) % 4`

5. **`src/components/TrackList.tsx`** — Pass the new callback through to TrackItem.

