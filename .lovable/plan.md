

## Plan: Switch filename date format to Australian (DD-MM-YYYY)

### Change
In `src/pages/Index.tsx`, update all filename date formatting from `yyyy-MM-dd` to `dd-MM-yyyy`.

**Example**: `poolside-episode-15-04-2026.mp4` instead of `poolside-episode-2026-04-15.mp4`

### File: `src/pages/Index.tsx`
- Find every `format(scheduleDate, 'yyyy-MM-dd')` and `format(new Date(), 'yyyy-MM-dd')` call used for filenames
- Change the format string to `'dd-MM-yyyy'`

One file, one pattern change.

