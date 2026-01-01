# View Modes

Make your habit tracker less cluttered by choosing a view mode! Add this to your habit tracker settings:

## Available Modes

### Default (no setting needed)
Shows everything: values, streaks, notes, full size
```yaml
# No viewMode setting = default
```

### Compact
Smaller cells, less spacing, cleaner look
```yaml
viewMode: compact
```

### Minimal  
Just checkmarks - no values, no streak counts, no note indicators
Perfect for simple yes/no habit tracking
```yaml
viewMode: minimal
```

### Streaks Only
Shows streak bars but hides values for cleaner look
```yaml
viewMode: streaks-only
```

## How to Use

Add to your habit tracker code block:
```habittracker
viewMode: compact
from: 2024-01-01
```

Or set globally in plugin settings (when implemented) to apply to all trackers.

## Examples

**Minimal mode** - Just want to see if you did it or not:
- No numbers cluttering the view
- Simple circles for completed days
- Focus on the pattern, not the details

**Compact mode** - Need to see everything but want more space:
- 20% smaller cells
- Fits more on screen
- Still shows all information

**Streaks only** - Love the streak bars, don't need the numbers:
- Emphasizes consistency
- Cleaner visual flow
- Small note indicators (subtle)
