# Television Display Behavior

## Overscan and safe areas

The interface uses conservative safe margins on every edge. These margins
also include browser/device `safe-area-inset-*` values when present.

The Ambient jacket, Liner Notes, Browse header, Browse grid, and Browse hint
all remain inside the safe region.

## Viewport handling

JavaScript writes the visible viewport height to `--app-height`. This avoids
layout jumps in browser shells whose `100vh` does not exactly match the usable
television viewport.

The value updates on:

- Window resize
- Visual viewport resize
- Fullscreen entry and exit

Focused Browse content and Liner Notes scroll positions are clamped after a
viewport change.

## Cursor behavior

On devices with a fine pointer:

- Pointer movement reveals the cursor.
- The cursor hides after 2.5 seconds of inactivity.
- Keyboard or remote commands hide it quickly.

Touch-only and remote-only devices are unaffected.

## Display targets

CSS includes targeted adjustments for:

- 720p-height displays
- Typical 1080p displays
- 4K displays

The record jacket remains intentionally restrained rather than scaling to fill
a large screen.
