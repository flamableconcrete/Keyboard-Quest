# Level Intro Dialogue Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all repetitive level intro dialogue across ~70 levels with unique, character-appropriate exchanges, and add `{name}` token support so the enemy can address the player by name.

**Architecture:** One-line code change in `LevelIntroScene.ts` to resolve `{name}` tokens at render time; all remaining work is content — rewriting every `dialogue` array in the five world data files. No type changes, no new files.

**Tech Stack:** TypeScript, Phaser 3, Vite. Tests via Vitest (`npm run test`). Build check via `npm run build`.

---

## Hero Voice Reference

| World | Tone |
|---|---|
| 1 | Nervous, determined, slightly naive |
| 2 | Finding footing, occasional dry humor |
| 3 | Confident, quips back |
| 4 | Seasoned, direct, occasionally weary |
| 5 | Battle-hardened, few words, commands respect |

## Dialogue Rules Reminder

- Regular levels: 2–3 lines. Mini-boss (`isMiniBoss: true`): 3–4 lines. World boss (`isBoss: true`): 4–5 lines.
- Boss/mini-boss levels: enemy always speaks last (threatening declaration).
- `{name}` used in ~20–30% of levels, always by the enemy or NPC, on the escalation line.
- Each line ≤ ~100 characters to fit the fixed-height bubble.
- `speaker: "enemy"` is sometimes a friendly NPC (GuildRecruitment, PotionBrewingLab, MonsterManual, WoodlandFestival) — write in that NPC's voice.

---

## Chunk 1: Code Change + World 1

### Task 1: Add `{name}` token replacement in LevelIntroScene

**Files:**
- Modify: `src/scenes/LevelIntroScene.ts` (inside `drawBubble`, before `this.add.text`)

- [ ] **Step 1: Read the file and locate the text render call**

Open `src/scenes/LevelIntroScene.ts`. Find `drawBubble` (around line 173). The Phaser text object is created at approximately line 208:
```ts
const bubbleText = this.add.text(bubbleX, bubbleY, text, {
```

- [ ] **Step 2: Add the token replacement**

Immediately before that `this.add.text(...)` call, insert:
```ts
const resolvedText = text.replace(/\{name\}/g, this.profile.playerName)
```
Then change the `text` argument in `this.add.text(...)` to `resolvedText`:
```ts
const bubbleText = this.add.text(bubbleX, bubbleY, resolvedText, {
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/LevelIntroScene.ts
git commit -m "feat: add {name} token replacement in LevelIntroScene dialogue bubbles"
```

---

### Task 2: Rewrite World 1 dialogue

**Files:**
- Modify: `src/data/levels/world1.ts`

World 1 hero tone: **nervous, determined, slightly naive**.

Replace every `dialogue` array with the content below. Replace the full array for each level — do not change anything else in the file.

- [ ] **Step 1: Update w1_l1 "Oakhaven Outskirts" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ha! Another soft-handed villager thinks words can stop us!" },
  { speaker: "hero",  text: "I— yes. Actually, I do. Stand back!" },
],
```

- [ ] **Step 2: Update w1_l2 "Riverbend Village" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Look! They send one hero to save a whole village. How... adorable." },
  { speaker: "hero",  text: "Laugh all you want. I'm still driving you out." },
],
```

- [ ] **Step 3: Update w1_l3 "The Stolen Trails" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "We took every word on this road. You'll find nothing to throw at us!" },
  { speaker: "hero",  text: "I don't need what you stole. I have plenty more." },
],
```

- [ ] **Step 4: Update w1_mb1 "Grom's Thicket" (MiniBoss: Knuckle, Keeper of E — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "I am Knuckle — and E belongs to ME. What do you want with it?" },
  { speaker: "hero",  text: "Give it back. Every word in the world needs it." },
  { speaker: "enemy", text: "The last hero who said that never left the thicket." },
],
```

- [ ] **Step 5: Update w1_l4 "Sunlit Glade" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The letter E is gone and you think you can fight us? Fool!" },
  { speaker: "hero",  text: "E's back now. Which means I've got more words than yesterday." },
],
```

- [ ] **Step 6: Update w1_l5 "The Lost Ruins of Elda" (DungeonPlatformer — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "These ruins haven't seen a living soul in centuries. They will claim you." },
  { speaker: "hero",  text: "I just have to keep typing... I can do this." },
],
```

- [ ] **Step 7: Update w1_mb2 "Serpent's Coil" (MiniBoss: Nessa, Keeper of N — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ssso... the little hero comes for N. Do you even know what you're asking?" },
  { speaker: "hero",  text: "I know exactly what I'm asking. Hand it over." },
  { speaker: "enemy", text: "Bold words. Let's see if your fingers are as brave as your mouth." },
],
```

- [ ] **Step 8: Update w1_l6 "The Crazed Cook's Camp" (SillyChallenge — 3 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "You dare enter my camp?! My exploding cheese will flatten your fingers!" },
  { speaker: "hero",  text: "...Is that a real threat? Are you a real cook?" },
  { speaker: "enemy", text: "TASTE THE BRIE OF DOOM!" },
],
```

- [ ] **Step 9: Update w1_l7 "Whispering Pass" (SkeletonSwarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Turn back. The pass belongs to the dead now." },
  { speaker: "hero",  text: "I need through. I'm sorry." },
],
```

- [ ] **Step 10: Update w1_mb3 "Shadowfall Crag" (MiniBoss: Rend the Red, Keeper of R — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Clever, surviving this far. But R is mine, and I don't share." },
  { speaker: "hero",  text: "R belongs to everyone. To every word that needs it." },
  { speaker: "enemy", text: "Then everyone will go without. I'll begin with you." },
],
```

- [ ] **Step 11: Update w1_l8 "The Scholar's Hermitage" (MonsterManual — NPC scholar — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ah, a visitor! Come — I have notes on Grizzlefang. You'll need them." },
  { speaker: "hero",  text: "Tell me everything." },
],
```

- [ ] **Step 12: Update w1_boss "Grizzlefang's Den" (isBoss — 5 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "I have crushed a thousand heroes beneath these fists. To dust." },
  { speaker: "hero",  text: "Then you've had plenty of practice. So have I." },
  { speaker: "enemy", text: "So. You're {name}. They said you were brave. They were mistaken." },
  { speaker: "hero",  text: "Are we going to talk all day or..." },
  { speaker: "enemy", text: "You're going to regret that." },
],
```

- [ ] **Step 13: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 14: Commit**

```bash
git add src/data/levels/world1.ts
git commit -m "content: rewrite World 1 level intro dialogue"
```

---

## Chunk 2: World 2 + World 3

### Task 3: Rewrite World 2 dialogue

**Files:**
- Modify: `src/data/levels/world2.ts`

World 2 hero tone: **finding footing, occasional dry humor**.

- [ ] **Step 1: Update w2_l1 "Mistweaver Shore" (SkeletonSwarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "None may cross the Mistweaver Shore. The dead have held it since the Age of Silence." },
  { speaker: "hero",  text: "I've crossed worse for worse reasons. Move aside." },
],
```

- [ ] **Step 2: Update w2_l2 "The Proving Grounds" (MonsterArena — 3 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "They call this the Proving Grounds. Every champion who came here proved our point." },
  { speaker: "hero",  text: "What point is that?" },
  { speaker: "enemy", text: "That they weren't ready. Neither are you." },
],
```

- [ ] **Step 3: Update w2_l3 "Bloodmoss Path" (UndeadSiege — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "This road runs red with more than moss. Hold the line... if you can." },
  { speaker: "hero",  text: "I've held worse. Let's see what you've got." },
],
```

- [ ] **Step 4: Update w2_mb1 "Bramblegate Watch" (MiniBoss: Thornback the Troll, Keeper of T — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "THORNBACK holds this gate! No T, no path! Simple as that!" },
  { speaker: "hero",  text: "Simple. That's one word for you." },
  { speaker: "enemy", text: "You think you're clever. Clever ones crack first." },
],
```

- [ ] **Step 5: Update w2_l4 "Elderwood Thicket" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "T is back? Bah. More words for you and more trouble for us!" },
  { speaker: "hero",  text: "That's the idea. I'm getting the hang of this." },
],
```

- [ ] **Step 6: Update w2_l5 "The Sludge Pools" (SlimeSplitting — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Slimes split, slimes multiply. You can't type fast enough." },
  { speaker: "hero",  text: "I know. I've tried this before. Spoiler: I won." },
],
```

- [ ] **Step 7: Update w2_l6 "Dwarven Depths" (DungeonTrapDisarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Dwarven traps. Centuries old. Still deadly." },
  { speaker: "hero",  text: "Fortunately, so am I. Well — moderately deadly." },
],
```

- [ ] **Step 8: Update w2_mb2 "Ironweb Keep" (MiniBoss: Irontongue, Keeper of I — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "I am Irontongue. Every word of power flows through I — and I control every word." },
  { speaker: "hero",  text: "Then you're what's been strangling the language." },
  { speaker: "enemy", text: "Poetic. You'll make a fine addition to my web." },
],
```

- [ ] **Step 9: Update w2_l7 "Rune-Scarred Path" (MagicRuneTyping — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "These runes were carved before your kind learned to write. Can you even read them?" },
  { speaker: "hero",  text: "Let me try. That's how you learn anything." },
],
```

- [ ] **Step 10: Update w2_l8 "Haven of the Silver Arrow" (GuildRecruitment — NPC archer — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "You've made it further than most. Our guild watches. We'd like to walk with you a while." },
  { speaker: "hero",  text: "I'd be glad for the company. Welcome." },
],
```

- [ ] **Step 11: Update w2_mb3 "Hollowhorn Peak" (MiniBoss: Hexus, Keeper of H — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "H hisses... echoes... haunts. I've kept it in the hollow where nothing escapes." },
  { speaker: "hero",  text: "You can keep the haunting. I just need the letter." },
  { speaker: "enemy", text: "Then you'll have to pry it from the cold hollow of this ridge." },
],
```

- [ ] **Step 12: Update w2_l9 "The Alchemist's Grotto" (PotionBrewingLab — NPC alchemist — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ah! A brave one! Help me mix these potions and I'll see you well rewarded." },
  { speaker: "hero",  text: "Potions for passage? That's a trade I can make." },
],
```

- [ ] **Step 13: Update w2_l10 "The Ranger's Outpost" (MonsterManual — NPC ranger — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "You're heading toward the Hydra. Sit. Read this before you go." },
  { speaker: "hero",  text: "I'm listening. Every detail." },
],
```

- [ ] **Step 14: Update w2_mb4 "Frostbite Hollow" (MiniBoss: Crackthorn the Crone, Keeper of C — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Cackle, crackle! Come for C, have you? What will you give me for it?" },
  { speaker: "hero",  text: "Nothing. It doesn't belong to you." },
  { speaker: "enemy", text: "Oho! Then you'll have to TAKE it — if you can stand the cold." },
],
```

- [ ] **Step 15: Update w2_boss "Lair of the Deep Fen Hydra" (isBoss — 5 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Five heads. Five minds. We have debated whether to let you pass." },
  { speaker: "hero",  text: "Unanimous decision?" },
  { speaker: "enemy", text: "Four to one. The fifth head wanted to eat you immediately." },
  { speaker: "hero",  text: "I'm trying not to think about that." },
  { speaker: "enemy", text: "You should. It's still hungry." },
],
```

- [ ] **Step 16: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 17: Commit**

```bash
git add src/data/levels/world2.ts
git commit -m "content: rewrite World 2 level intro dialogue"
```

---

### Task 4: Rewrite World 3 dialogue

**Files:**
- Modify: `src/data/levels/world3.ts`

World 3 hero tone: **confident, quips back at enemies**.

- [ ] **Step 1: Update w3_l1 "Emberfall Ascent" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Fire goblins! Tougher than the forest kind! Burn everything — everyone!" },
  { speaker: "hero",  text: "You're on fire. Literally. Convenient for me." },
],
```

- [ ] **Step 2: Update w3_l2 "Ashwood Cemetery" (UndeadSiege — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ash walkers do not tire. They do not fear. They simply advance." },
  { speaker: "hero",  text: "And they simply fall. I've done this before." },
],
```

- [ ] **Step 3: Update w3_l3 "Dragon's Tooth Tunnels" (DungeonEscape — 3 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The tunnels collapse for the unworthy! Run, little hero!" },
  { speaker: "hero",  text: "I've outrun worse. Though not by much." },
  { speaker: "enemy", text: "We'll see about that!" },
],
```

- [ ] **Step 4: Update w3_mb1 "Obsidian Gate" (MiniBoss: Moloch the Magma Mole, Keeper of M — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "MOLOCH erupts! M is mine — buried deep beneath this mountain!" },
  { speaker: "hero",  text: "Deep enough? I've been digging all campaign." },
  { speaker: "enemy", text: "Clever. But this mountain is older than your cleverness." },
],
```

- [ ] **Step 5: Update w3_l4 "The Scorched Arena" (MonsterArena — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The gladiators of Pumice Mesa bow to no one. Especially not outsiders." },
  { speaker: "hero",  text: "Then bow to no one. Just move." },
],
```

- [ ] **Step 6: Update w3_l5 "Pillars of Flame" (MagicRuneTyping — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "These runes hold the heat of a thousand summers. Touch them wrong and burn." },
  { speaker: "hero",  text: "I touch nothing wrong. That's the whole point." },
],
```

- [ ] **Step 7: Update w3_mb2 "Spire of the Phoenix" (MiniBoss: Pyreth, Keeper of P — 3 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "I rise. I fall. I rise again. You cannot kill a phoenix." },
  { speaker: "hero",  text: "I don't need to kill you. I just need the letter." },
  { speaker: "enemy", text: "Then survive me first, {name}. I've been burning for centuries." },
],
```

- [ ] **Step 8: Update w3_l6 "The Grand Crucible" (PotionBrewingLab — NPC alchemist — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Volcanic minerals! Extraordinary! Help me brew these and you'll earn my finest work." },
  { speaker: "hero",  text: "You had me at extraordinary. Let's brew." },
],
```

- [ ] **Step 9: Update w3_l7 "Magma Vents" (SlimeSplitting — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Magma slimes split from the vents! Each one hotter than the last!" },
  { speaker: "hero",  text: "I've split colder things. Though not by much." },
],
```

- [ ] **Step 10: Update w3_mb3 "The Umber Bridge" (MiniBoss: Urgruth, Keeper of U — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "U is the sound of understanding — and you understand nothing of what guards this bridge." },
  { speaker: "hero",  text: "I understand enough. You're blocking my path." },
  { speaker: "enemy", text: "Then feel the weight of the Umber. Your understanding ends here." },
],
```

- [ ] **Step 11: Update w3_l8 "Festival of the Fire-Smiths" (WoodlandFestival — NPC smiths — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "A hero at our festival! Enter! We'll name your deeds in fire-song tonight!" },
  { speaker: "hero",  text: "I've never had a fire-song before. I'll take it." },
],
```

- [ ] **Step 12: Update w3_l9 "The Drake-Scholar's Rest" (MonsterManual — NPC dragon scholar — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "You're heading to the Citadel. You should know what lives inside. Sit." },
  { speaker: "hero",  text: "I'm already sitting. Talk fast." },
],
```

- [ ] **Step 13: Update w3_mb4 "The Gorgon's Pit" (MiniBoss: Gorven, Keeper of G — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "None who have looked upon Gorven have left the pit. You'll be no different." },
  { speaker: "hero",  text: "Then I won't look. I'll type." },
  { speaker: "enemy", text: "Clever. But cleverness has a way of... petrifying... under pressure." },
],
```

- [ ] **Step 14: Update w3_boss "The Brass Citadel" (isBoss: Clockwork Dragon — 5 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "TICK. TICK. TICK. I have waited inside this citadel for three hundred years." },
  { speaker: "hero",  text: "A lot of waiting for a machine." },
  { speaker: "enemy", text: "A lot of hubris for a mortal." },
  { speaker: "hero",  text: "Let's find out which matters more." },
  { speaker: "enemy", text: "Beginning threat calculation... ATTACK." },
],
```

- [ ] **Step 15: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 16: Commit**

```bash
git add src/data/levels/world3.ts
git commit -m "content: rewrite World 3 level intro dialogue"
```

---

## Chunk 3: World 4 + World 5

### Task 5: Rewrite World 4 dialogue

**Files:**
- Modify: `src/data/levels/world4.ts`

World 4 hero tone: **seasoned, direct, occasionally weary**.

- [ ] **Step 1: Update w4_l1 "Twilight Thicket" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Shadow goblins! We move silent! You won't see us coming!" },
  { speaker: "hero",  text: "I've been doing this long enough to see plenty." },
],
```

- [ ] **Step 2: Update w4_l2 "The Drowned Moor" (UndeadSiege — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The drowned rise with terrible purpose. They remember what you forget." },
  { speaker: "hero",  text: "I remember enough. Step aside." },
],
```

- [ ] **Step 3: Update w4_l3 "Forgotten Stone Pass" (DungeonTrapDisarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ancient traps. Every one still perfect. Still deadly. Still waiting." },
  { speaker: "hero",  text: "So am I." },
],
```

- [ ] **Step 4: Update w4_mb1 "Troll's Toll Bridge" (MiniBoss: Brutus, Keeper of B — 3 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "TOLL. Everyone pays toll. Even you, {name}." },
  { speaker: "hero",  text: "The toll is getting B back. That's what I'm paying with." },
  { speaker: "enemy", text: "You pay with your fingers. Brutus BREAKS fingers." },
],
```

- [ ] **Step 5: Update w4_l4 "The Weeping Woods" (MagicRuneTyping — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Witch runes twist the air here. They rearrange what you write. Don't trust your eyes." },
  { speaker: "hero",  text: "I trust my fingers. Eyes are optional." },
],
```

- [ ] **Step 6: Update w4_l5 "Ancestral Barrows" (SkeletonSwarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "We were warriors once. Now we are wardens. Leave. This is our rest." },
  { speaker: "hero",  text: "I wish I could. Your masters won't let me." },
],
```

- [ ] **Step 7: Update w4_mb2 "Keep of the Wraith-Witch" (MiniBoss: Wynna, Keeper of W — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "W whispers through every wall in this keep. You'll hear it in your sleep." },
  { speaker: "hero",  text: "I don't sleep much anymore." },
  { speaker: "enemy", text: "No. But you will... once I'm done with you." },
],
```

- [ ] **Step 8: Update w4_l6 "Venomous Shallows" (SlimeSplitting — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Yew-sap slimes — venomous and hungry. They've dissolved three heroes this week." },
  { speaker: "hero",  text: "I'll be number four that they missed." },
],
```

- [ ] **Step 9: Update w4_l7 "The Jester's Glade" (SillyChallenge — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "A word duel in the valley! The jester challenges all comers! Ha-HA!" },
  { speaker: "hero",  text: "Fine. But if I lose I'm going to be annoyed for days." },
],
```

- [ ] **Step 10: Update w4_mb3 "Frosthowl Summit" (MiniBoss: Yax the Yeti-Lord, Keeper of Y — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "YAAAAX. I am the heights. I am the cold. I am Y." },
  { speaker: "hero",  text: "And I'm the one who came to take it back." },
  { speaker: "enemy", text: "Many have said that. I still feel the wind from their running." },
],
```

- [ ] **Step 11: Update w4_l8 "Ruins of the Old Kingdom" (MonsterArena — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The vault-guardians have stood since before the Age of Silence. They'll stand after." },
  { speaker: "hero",  text: "They won't stand in my way." },
],
```

- [ ] **Step 12: Update w4_l9 "Shadow-Warden's Trap" (DungeonEscape — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The hollow closes in. There's no door. Only words to unlock the way." },
  { speaker: "hero",  text: "I know. I've been here before. Different hollow." },
],
```

- [ ] **Step 13: Update w4_mb4 "Vault of the Ancients" (MiniBoss: Vault-Keeper, Guardian of V — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "V is the last seal. I have kept it for an age. No exceptions." },
  { speaker: "hero",  text: "I'm not asking for an exception. I'm taking it back." },
  { speaker: "enemy", text: "Then you'll find the seal was forged to resist exactly that." },
],
```

- [ ] **Step 14: Update w4_boss "Sanctum of the Dice Lich" (isBoss — 5 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "Every letter you've restored is a letter I've studied. I know your patterns." },
  { speaker: "hero",  text: "Then you know I don't stop." },
  { speaker: "enemy", text: "You've been lucky, {name}. The dice decide everything here." },
  { speaker: "hero",  text: "Then roll them." },
  { speaker: "enemy", text: "...With pleasure. Let the Dice Lich begin." },
],
```

- [ ] **Step 15: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 16: Commit**

```bash
git add src/data/levels/world4.ts
git commit -m "content: rewrite World 4 level intro dialogue"
```

---

### Task 6: Rewrite World 5 dialogue

**Files:**
- Modify: `src/data/levels/world5.ts`

World 5 hero tone: **battle-hardened, few words, commands respect**.

- [ ] **Step 1: Update w5_l1 "Gates of the Maelstrom" (GoblinWhacker — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "No one passes the Typemancer's gates! No one!" },
  { speaker: "hero",  text: "I'm not no one." },
],
```

- [ ] **Step 2: Update w5_l2 "The Shifting Labyrinth" (DungeonTrapDisarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The labyrinth shifts. New traps each time. Even a veteran can't prepare." },
  { speaker: "hero",  text: "I'm not prepared. I'm experienced. There's a difference." },
],
```

- [ ] **Step 3: Update w5_l3 "Archives of Eternity" (MonsterManual — NPC archivist — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "These scrolls contain the Typemancer's full history. It's unsettling. Read anyway." },
  { speaker: "hero",  text: "Show me." },
],
```

- [ ] **Step 4: Update w5_mb1 "Chamber of the Quillmaster" (MiniBoss: Quixel, Keeper of Q — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Quixel the Quillmaster! The rarest letter belongs to the rarest keeper!" },
  { speaker: "hero",  text: "Q goes to everyone or it goes to no one. Hand it over." },
  { speaker: "enemy", text: "You've come far to demand things of Quixel. You won't leave carrying them." },
],
```

- [ ] **Step 5: Update w5_l4 "The Enchanted Forges" (MagicRuneTyping — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "These forges ring with rare letters being hammered into shape. Touch nothing you can't type." },
  { speaker: "hero",  text: "I'm ready." },
],
```

- [ ] **Step 6: Update w5_l5 "The Desolate Courtyard" (SkeletonSwarm — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The Typemancer's own guard. We were alive when he took the letters. We'll be here when you fail." },
  { speaker: "hero",  text: "You've waited a long time. Don't wait any longer." },
],
```

- [ ] **Step 7: Update w5_mb2 "Spire of the Hexed Exile" (MiniBoss: Xeron, Keeper of X — 3 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "X. The rarest stroke. The hardest reach. You will never cross it." },
  { speaker: "hero",  text: "Watch." },
  { speaker: "enemy", text: "Brave. Stupid. I've hexed heroes for less, {name}. Prepare yourself." },
],
```

- [ ] **Step 8: Update w5_l6 "The Mad King's Court" (SillyChallenge — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The Mad King's jester! With the zaniest words in the KNOWN WORLD! Ha ha HA!" },
  { speaker: "hero",  text: "I've heard worse. Let's go." },
],
```

- [ ] **Step 9: Update w5_l7 "Prison of the Wind Faeries" (WoodlandFestival — NPC faeries — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "Hero! Our words are locked away with us! Break the seal and we'll sing your name to the winds!" },
  { speaker: "hero",  text: "That's the nicest thing anyone's offered me in a while. I'm in." },
],
```

- [ ] **Step 10: Update w5_mb3 "Zealot's Ascent" (MiniBoss: Zindark the Zealot, Keeper of Z — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Z. The final letter. I have died for it. I will kill for it. It does not leave this spire." },
  { speaker: "hero",  text: "Every other Keeper said the same." },
  { speaker: "enemy", text: "Every other Keeper was not a Zealot. This ends differently." },
],
```

- [ ] **Step 11: Update w5_l8 "The Crumbling Stairway" (DungeonEscape — 2 lines)**

```ts
dialogue: [
  { speaker: "enemy", text: "The tower trembles! The stairway crumbles! Type faster than the falling stone!" },
  { speaker: "hero",  text: "Moving." },
],
```

- [ ] **Step 12: Update w5_mb4 "Hall of Illusions" (MiniBoss: Typemancer's Jester — 3 lines, enemy last)**

```ts
dialogue: [
  { speaker: "enemy", text: "Ha! You've come so far just to laugh at your own failure!" },
  { speaker: "hero",  text: "I'm not laughing." },
  { speaker: "enemy", text: "No. But I am. And that's the joke. Come on then — show me what you've got." },
],
```

- [ ] **Step 13: Update w5_boss "Throne of the Typemancer" (isBoss — 5 lines, enemy last, uses {name})**

```ts
dialogue: [
  { speaker: "enemy", text: "So. {name}. You've returned every letter I scattered. Every one." },
  { speaker: "hero",  text: "Every one." },
  { speaker: "enemy", text: "I scattered them because this world didn't deserve them. It still doesn't." },
  { speaker: "hero",  text: "That's not your call." },
  { speaker: "enemy", text: "It was. It is. And when I take them back — it will be again." },
],
```

- [ ] **Step 14: Verify TypeScript compiles**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 15: Commit**

```bash
git add src/data/levels/world5.ts
git commit -m "content: rewrite World 5 level intro dialogue"
```

---

## Final Verification

- [ ] **Run full build**

```bash
npm run build
```
Expected: no type errors.

- [ ] **Run tests**

```bash
npm run test
```
Expected: all existing tests pass (no dialogue unit tests exist; the build is the validator).

- [ ] **Manual smoke test** (optional but recommended)

Start the dev server (`npm run dev`), navigate to any level in the overland map, click a level node, and confirm:
1. The dialogue exchange shows with the correct number of bubbles
2. On a level that uses `{name}`, the player's name appears correctly in the enemy line
3. No text is visually clipped (lines stay within the bubble)

- [ ] **Final commit if needed**

```bash
git add -A
git commit -m "chore: final cleanup after dialogue rewrite"
```
