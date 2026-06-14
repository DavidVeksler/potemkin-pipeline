# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Potemkin Pipeline** — an offline, single-file browser app that performs the *theater* of
an autonomous AI coding agent: streaming tool calls, inventing and fixing bugs, shipping to
prod, surviving full-screen "boss" dramas. It writes no real code; every counter is a
confident lie from a seeded PRNG. Convincing across the room, honest to anyone who reads it.

Project name is *Potemkin Pipeline*; the in-app product uses a random codename (HYPERION is
one). Source keeps the `hyperion.*` prefix — leave that split alone.

## Build & the cardinal rule

```sh
./build.sh        # inlines hyperion.css + hyperion.js into index.html
```

Edit **`hyperion.{html,css,js}`** — never `index.html` (it is generated). After any change
run `./build.sh` and commit both the source file(s) and the regenerated `index.html`.
No npm, no framework, no server, no external requests — the zero-dependency single-file
output is the whole point. Runs over `file://`.

**Deploy:** there is no CI. GitHub Pages serves `index.html` from the repo root of `main`
(remote `origin` → `github.com/DavidVeksler/potemkin-pipeline`), so the committed
`index.html` *is* the deploy — pushing a stale or unbuilt one ships broken. Always
`./build.sh` before committing. Live at `davidveksler.github.io/potemkin-pipeline/`.

There is no test suite. Test manually: open `hyperion.html` (raw) or `index.html` (built)
in a browser. Append `?debug` to expose `window.__HYP`:
`__HYP.drama('gpu')` · `__HYP.force()` · `__HYP.deepwork()`/`.wake()` · `__HYP.state()`.

## Where things live (hyperion.js, ~1900 lines, banner-comment sections)

Sections are delimited by `/* ===== TITLE ===== */` banners — grep the title to jump.
Line numbers drift; the `const X=` / `function X` anchors below are stable.

| To change… | Go to | Notes |
|---|---|---|
| URL params / defaults | `CONFIG` → `const cfg=` | parsed via `QS`/`qint`/`qfloat` |
| String flavor (verbs, snippets, CVEs) | `BANKS` | flat arrays; `pick()`ed by generators |
| A mission's beats | `MISSION GENERATORS` | `function*` yielding events |
| A boss drama | `DRAMA GENERATORS` + `const DRAMAS=` map | key → `function* dXxx` |
| A drama's overlay GUI | `const APP_BUILDERS=` map + OVERLAY/`BOSS-LEVEL APP WINDOWS` | tool → `buildXxx` |
| Drama timing / cadence | `SCHEDULER` → `pumpAuto`, `nextDramaAt`, `dramaFreq` | |
| Header widgets (cost, ctx, tokens) | `DOM REFS` (`$('.h-cost')`) + `STATE` vars + tick fn (e.g. `burnTick`) | also edit html markup + css |
| Hotkeys | `INPUT / HOTKEYS` | |
| Deep-work / away behavior | `IDLE / DEEP-WORK` → `enterIdle`, `markActivity` | |
| Config dialog controls | `CONFIGURATION DIALOG` → `fld`/`rng_`, `syncURL` | `s` hotkey |

## How the engine works (read these together)

- **One clock, one loop.** A single `requestAnimationFrame` (`frame()`) drives a *logical*
  clock (`logicalNow`) scaled by `speed`. No `setInterval`, no wall time — tabbing away
  pauses instead of replaying a backlog (`VISIBILITY` section enforces this).
- **Scripts are generators.** Missions and dramas are `function*`s that `yield` typed events
  (`EVENT CONSTRUCTORS` section: `TOOL OUT DIFF THINK TASK FILE SNIP BANNER PHASE CNT CLR
  WAIT(ms) OV(op)` …). The `SCHEDULER` pumps each event when the clock passes its due time
  and the `RENDERER` dispatches by `event.kind`.
- **Determinism by seed.** `rng()` is `mulberry32` seeded from `cfg.seed`; it drives
  everything narratively load-bearing (file tree, project, codename, which drama strikes).
  `?seed=N` reproduces a run. **Cosmetic per-frame jitter intentionally uses `Math.random()`
  instead** — preserve this split; don't convert jitter to `rng()`.
- **Overlays mutate in place.** A builder constructs the faux window once; the generator
  then mutates it live via `[data-k]`/`OV` ops (no re-render) — flip a GPU to THROTTLE, turn
  a pod red. Threat-map continents are a dot bitmap; mesh packets use SMIL `animateMotion`;
  heatmap/btop use `<canvas>`.

## Recurring change recipes (from commit history)

- **Add a boss drama:** new `function* dXxx` in `DRAMA GENERATORS` → register in `DRAMAS` →
  if it needs a new GUI add `buildXxx` to `APP_BUILDERS` + overlay CSS. See `IDEAS.md` for
  the planned backlog and the rules each scene follows.
- **Add a config knob:** four places must stay in sync — parse in `cfg`/CONFIG → add a
  control in the config dialog (`fld`/`rng_`) + `syncURL` → surface in `__HYP.state()` if
  useful → document in README's URL-params list.
- **Add a header widget:** markup in `hyperion.html` + style in `hyperion.css` + a `DOM REF`
  + state var + a tick hook called from the render/event path (mirror `burnTick`).

## Conventions

- Match the existing style: terse single-line functions, short names, dense. Don't reformat.
- Three themes (amber/green/cyan) via CSS custom properties. All motion sits behind
  `body:not(.reduce)` and honors `prefers-reduced-motion` — new animation must too.
- Audio is synthesized on the fly (WebAudio, no files — files are dependencies).
- Keep README's hotkey table, URL-param list, and drama roster in sync with code.
