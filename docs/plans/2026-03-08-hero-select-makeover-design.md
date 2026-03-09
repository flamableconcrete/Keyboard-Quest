# Hero Select Screen Makeover — Design

## Overview

Redesign the "Select Your Hero" (ProfileSelectScene) screen from plain colored rectangles with text into a polished retro pixel-art experience. Add a gallery of 24-30 pre-generated 48x48 pixel face avatars that players choose from when creating a new hero.

## Style

- Retro pixel art aesthetic: chunky borders, pixel-style panel frames, 8-bit color palette
- No entrance animations — everything renders immediately
- Subtle idle animations only — gentle pulse on hovered slots, blinking cursor accents, soft glow effects to keep attention

## Screen Layout (1280x720)

### Title
- "Select Your Hero" in pixel-art style, gold color, centered top
- Subtle shimmer or pulse on the text

### Hero Slots (4 total, stacked vertically, centered)

**Filled slot:**
- Pixel-art bordered panel
- 48x48 pixel avatar on the left
- Hero name in white pixel-style text
- Stats line: level, world progress, star count/average
- Active companion icon (small, next to stats)
- Export/Delete buttons styled as retro pixel buttons
- Hover: subtle border glow or color shift

**Empty slot:**
- Dashed/dotted pixel border, muted colors
- "+ New Hero" centered with a gentle blink animation
- Import button
- Hover: border brightens

### Back Button
- Bottom-left, styled as a small pixel button

## Avatar Gallery (New Hero Creation Flow)

1. Player clicks empty slot → name entry screen (current keyboard input, pixel-styled)
2. After pressing Enter → Avatar Gallery screen appears
3. Grid of 24-30 avatars in a 6x5 layout, all 48x48 pixel face portraits
4. Avatars vary by: hair style/color, skin tone, eye color, accessories (helmets, headbands, scars, glasses, beards)
5. Click to select → highlighted with a pixel border/glow
6. "Confirm" pixel button at bottom
7. Selected avatarChoice stored as an ID (e.g. `avatar_0` through `avatar_29`)

## Avatar Generation (Code)

- All avatars generated at runtime using Phaser graphics primitives (rectangles for pixels)
- Each avatar defined as a config object: `{ skinTone, hairStyle, hairColor, eyeColor, accessory }`
- Rendered to RenderTextures at boot so they can be reused as sprites throughout the game

## What's NOT Changing

- Export/Import/Delete functionality (just restyled)
- Profile data structure (just using the existing `avatarChoice` field)
- Scene flow (ProfileSelect → OverlandMap)
