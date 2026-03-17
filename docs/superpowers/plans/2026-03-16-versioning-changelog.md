# Versioning & Changelog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up release-please automated versioning with GitHub Releases, bootstrapped at v0.1.0 with hand-crafted release notes.

**Architecture:** Two-phase approach — (1) add the GitHub Actions workflow and fix package.json, then (2) manually tag + publish v0.1.0 so release-please takes over from a clean baseline. No manifest or config files needed for a single-package repo.

**Tech Stack:** `googleapis/release-please-action@v4`, GitHub Actions, `gh` CLI

---

## Chunk 1: Infrastructure Setup

### Task 1: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Edit package.json**

Change `name` and `version`:

```json
{
  "name": "keyboard-quest",
  "private": true,
  "version": "0.1.0",
  ...
}
```

- [ ] **Step 2: Verify the file looks correct**

Run: `cat package.json | head -5`
Expected output:
```
{
  "name": "keyboard-quest",
  "private": true,
  "version": "0.1.0",
  "type": "module",
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: rename package to keyboard-quest and set version to 0.1.0"
```

---

### Task 2: Add release-please GitHub Actions workflow

**Files:**
- Create: `.github/workflows/release-please.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

name: release-please

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
          token: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/release-please.yml
git commit -m "ci: add release-please workflow"
git push
```

- [ ] **Step 3: Verify the workflow appears in GitHub**

Run: `gh workflow list`
Expected: `release-please` appears in the list.

---

## Chunk 2: Bootstrap v0.1.0 Release

Release-please uses the latest git tag as its baseline. We need to manually create the `v0.1.0` tag and GitHub Release *before* release-please runs — otherwise it will try to auto-generate a changelog from all 376+ commits.

### Task 3: Create v0.1.0 tag

- [ ] **Step 1: Tag current HEAD as v0.1.0**

```bash
git tag v0.1.0
git push origin v0.1.0
```

- [ ] **Step 2: Verify tag exists on remote**

Run: `gh api repos/flamableconcrete/Keyboard-Quest/git/refs/tags/v0.1.0 --jq '.ref'`
Expected: `refs/tags/v0.1.0`

---

### Task 4: Publish hand-crafted v0.1.0 GitHub Release

- [ ] **Step 1: Create the GitHub Release with hand-crafted notes**

```bash
gh release create v0.1.0 \
  --title "v0.1.0 — Initial Release" \
  --notes "$(cat <<'EOF'
## Keyboard Quest v0.1.0

The first official release of Keyboard Quest — a browser-based typing RPG built with Phaser 3 and TypeScript.

### Worlds & Levels

- Five fully playable worlds, each with a unique visual theme and boss
- Multiple level types: Goblin Whacker (wave-based), Dungeon Platformer (side-scrolling obstacles), Trap Disarm, and mini/full boss battles
- Level intro scenes with sequential character dialogue and story taunt lines

### Overland Map

- Unified scrollable map spanning all 5 worlds side-by-side
- Click-drag pan, edge scrolling, and find-hero button
- Left/right arrow key navigation between map nodes
- World selector dropdown in the title bar
- Camera tween for cross-world travel

### Hero & Character System

- Full-body hero avatar with randomized outfits and interactive customizer
- Character screen with paper doll equipment layout
- Item rarity color-coding (common, uncommon, rare, epic)
- Equipment visuals displayed on avatar in-game

### Companions & Pets

- Tavern scene to recruit and level up companions
- Stable scene to adopt pets
- Companions and pets render alongside the hero in levels and boss fights
- Pets collect physical gold drops during combat

### Shop & Economy

- Shop scene accessible from every world's overland map
- 15 fantasy items across weapons, armors, and accessories
- Item stat comparisons before buying
- Rotating shop inventory that refreshes on mini-boss defeat

### Progression & Scoring

- Star ratings (1–5) for accuracy and speed per level
- WPM tracker in the level HUD with world-scaled speed thresholds
- XP rewards and companion leveling
- Mastery trophies and trophy room scene
- Boss map node scaling and world unlock progression

### Audio

- Procedurally generated retro NES-style background music

### Mobile

- Mobile-responsive layouts for main menu, profile select, and overland map
- Vertical scrolling level list on mobile overland map
- Native keyboard support on mobile
- Full-screen panel scenes for sub-menus on mobile

### Profiles

- 4 save slots with full localStorage persistence
- Profile selection and character creation flow
EOF
)"
```

- [ ] **Step 2: Verify the release is live**

Run: `gh release view v0.1.0`
Expected: Shows the release title, tag, and body text.

Also visit: `https://github.com/flamableconcrete/Keyboard-Quest/releases` to confirm it appears.

---

### Task 5: Verify release-please is ready for future releases

- [ ] **Step 1: Check that the Actions tab shows release-please ran**

Run: `gh run list --workflow=release-please.yml --limit 3`
Expected: Shows a completed run triggered by the `ci: add release-please workflow` push.

- [ ] **Step 2: Check if a release PR was opened (or not)**

Run: `gh pr list --label "autorelease: pending"`
Expected: No PR yet (since we just tagged v0.1.0 and there are no new `feat:`/`fix:` commits after the tag). Once you land the next `feat:` commit, release-please will open a "chore: release v0.2.0" PR automatically.

---

## How Release-Please Works Going Forward

1. Push `feat:` / `fix:` commits to `main` as normal
2. After each push, release-please updates a standing "chore: release vX.Y.Z" PR
3. When you're ready to ship, merge that PR on GitHub
4. Release-please creates the git tag, publishes the GitHub Release with auto-grouped changelog (Features / Bug Fixes), and updates `package.json` + `CHANGELOG.md`
