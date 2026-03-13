# Level Intro Dialogue Redesign

**Date:** 2026-03-13
**Status:** Approved

## Problem

The `dialogue` arrays in all world level configs (`world1.ts`–`world5.ts`) are generic and repetitive. The hero has ~6 stock phrases reused across 40+ levels (e.g. "Stand aside, foul goblins! Your raids end here.", "I've come to restore the letters! Surrender them!"). Every level uses the same 2-line structure (enemy sets scene → hero gives canned response). There is no narrative arc, no personality differentiation between enemy types, and no sense of the hero growing over time.

## Goal

Every level should feel unique. The dialogue should reflect the specific location, enemy, and story moment. The hero's voice should arc from uncertain newcomer (World 1) to battle-hardened veteran (World 5). The exchange should feel like a real interrupted conversation, not a script.

## Approach: Option B — `{name}` token + content rewrite

### Code Change (minimal)

In `LevelIntroScene.ts`, inside the `drawBubble` function, add one line before rendering text:

```ts
const resolvedText = text.replace(/\{name\}/g, this.profile.playerName)
```

Pass `resolvedText` instead of `text` to the Phaser text object. This allows dialogue strings in level data to include `{name}` wherever the player's name should appear.

### Content Change (bulk of work)

Rewrite all `dialogue` arrays in `world1.ts`, `world2.ts`, `world3.ts`, `world4.ts`, and `world5.ts`.

## Dialogue Content Rules

### Length by Level Type

| Level type | Lines |
|---|---|
| Regular levels | 2–3 |
| Mini-boss levels | 3–4 |
| World boss levels | 4–5 |

### Hero Voice Arc

| World | Hero tone |
|---|---|
| 1 | Nervous, determined, slightly naive |
| 2 | Finding footing, occasional dry humor |
| 3 | Confident, quips back at enemies |
| 4 | Seasoned, direct, occasionally weary |
| 5 | Battle-hardened, few words, commands respect |

### Name Usage

- Used in ~20–30% of levels
- Always by the enemy (taunting, surprised) or a neutral NPC — never self-referential by the hero
- Only included where it fits naturally; never forced

### Enemy Voice

Each enemy type has a distinct personality:
- **Goblins:** scrappy, crude, overconfident
- **Skeletons/undead:** cold, formal, contemptuous
- **Bosses:** theatrical, grandiose, personally invested in crushing the hero
- **NPCs (alchemist, scholar, etc.):** warm, eccentric, or businesslike depending on context

### Flow

- Dialogue feels like an interrupted conversation, not a Q&A
- Enemy does not always get the last word on regular levels
- Boss levels end with the boss making a threatening declaration (raises stakes before the fight begins)
- No line should be reused verbatim across levels

## Illustrative Examples

**w1_l1 "Oakhaven Outskirts"** (regular, hero nervous):
```
enemy: "Ha! Another soft-handed villager thinks words can stop us?"
hero:  "I— yes. Actually, I do. Back off!"
```

**w1_boss "Grizzlefang's Den"** (world boss, 4–5 lines):
```
enemy: "I have ground a thousand heroes into dust beneath these keys."
hero:  "Then you know what's coming."
enemy: "A trembling child? THIS is what they send against me, {name}?"
hero:  "Start grinding."
```

**w3_l3 "Dragon's Tooth Tunnels"** (regular, hero confident):
```
enemy: "Run, little hero! The tunnels are ours!"
hero:  "I've outrun worse than you."
enemy: "We'll see about that!"
```

**w4 mini-boss** (hero direct/weary):
```
enemy: "You've come far, {name}. Farther than most."
hero:  "Not far enough yet."
enemy: "Then let's settle this."
hero:  "Finally."
```

## Files Changed

| File | Change |
|---|---|
| `src/scenes/LevelIntroScene.ts` | Add `{name}` token replacement in `drawBubble` |
| `src/data/levels/world1.ts` | Rewrite all `dialogue` arrays |
| `src/data/levels/world2.ts` | Rewrite all `dialogue` arrays |
| `src/data/levels/world3.ts` | Rewrite all `dialogue` arrays |
| `src/data/levels/world4.ts` | Rewrite all `dialogue` arrays |
| `src/data/levels/world5.ts` | Rewrite all `dialogue` arrays |

## Out of Scope

- Changing `LevelConfig` type structure (dialogue field stays as-is)
- Adding voice acting, sound effects, or animated portraits
- Dynamic/procedural dialogue generation
- Any changes to level gameplay, rewards, or progression
