

## Add schedule date and lead instrument to the build episode panel

**Problem**: When building multiple episodes in different tabs, the CommandPanel ("Episode ready!" screen) doesn't show which date or lead instrument the episode is for, making tabs indistinguishable.

**Solution**: Pass `scheduleDate` and `leadInstrument` into the CommandPanel state and display them as a summary line at the top of the panel body.

### Changes

**1. `src/components/CommandPanel.tsx`**
- Add `scheduleDate?: string` and `leadInstrument?: string` to the `CommandPanelState` interface
- Display a subtitle line below the title showing the date (formatted nicely) and lead instrument when available — visible during all phases (building, ready, error)

**2. `src/pages/Index.tsx`**
- When setting `setCpanel(...)` for the initial "Building episode..." state and the final "Episode ready!" state, include `scheduleDate` (formatted as a readable string) and `leadInstrument` values from component state

**Result**: Each tab's build panel will clearly show something like "Thursday 12 June · Lead: Guitar" at the top, making it easy to tell episodes apart when working in bulk.

