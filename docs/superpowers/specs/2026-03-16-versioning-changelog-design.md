# Versioning & Changelog Design

**Date:** 2026-03-16
**Status:** Approved

## Overview

Implement an official version scheme and automated changelog for Keyboard Quest, surfaced as GitHub Releases.

## Version Scheme

Game-style versioning using SemVer (`vMAJOR.MINOR.PATCH`):

- `feat:` commits → bump **minor** (e.g. `v0.1.0 → v0.2.0`)
- `fix:` commits alone → bump **patch** (e.g. `v0.1.0 → v0.1.1`)
- `feat!:` or `BREAKING CHANGE` → bump **major** (reserved for `v1.0.0` launch)

In practice releases will look like `v0.1.0`, `v0.2.0` — game-style major.minor progression.

## Starting Point

Begin at `v0.1.0`. The 376 pre-existing commits are not retroactively tagged. The `v0.1.0` GitHub Release body is hand-crafted to summarize everything built so far (worlds, mobile support, overland map, etc.). All future releases are fully automated.

## Tooling: release-please (v4)

Uses `googleapis/release-please-action@v4` with `release-type: node`.

**Day-to-day workflow:**
1. Developer pushes `feat:` / `fix:` commits directly to `main` as usual
2. Release-please bot opens/maintains a standing "chore: release vX.Y.Z" PR
3. When ready to ship, developer merges the PR on GitHub
4. Release-please automatically: creates the git tag, publishes the GitHub Release with grouped changelog, updates `package.json` version and `CHANGELOG.md`

## Files Changed

### `package.json`
- `name`: `"temp-vite-app"` → `"keyboard-quest"`
- `version`: `"0.0.0"` → `"0.1.0"`

### `.github/workflows/release-please.yml` (new)
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

No additional config or manifest files are needed for a single-package repo.

## Changelog Format

Release-please auto-groups conventional commits into sections:
- **Features** — `feat:` commits
- **Bug Fixes** — `fix:` commits
- **Documentation** — `docs:` commits (optional, can be excluded)

The `CHANGELOG.md` file is created and maintained automatically in the repo root.

## v0.1.0 Release Notes

To be hand-crafted by the developer with Claude's help, covering all work completed before automated versioning begins. Will summarize major feature areas: game worlds, level types, mobile support, overland map, character/companion system, etc.

## Notes

- The default `GITHUB_TOKEN` is used; CI checks will not re-run on release PRs (acceptable since no required CI checks exist)
- Commit message convention (`feat:`, `fix:`, `docs:`, etc.) is already in use throughout the repo — no workflow change needed
- Merging the release PR counts as a push to `main`, so any existing GitHub Pages deploy workflow will also trigger — this is the desired behavior (deployed game reflects the released version)
