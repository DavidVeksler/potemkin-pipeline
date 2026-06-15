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
./build.sh        # concatenates src/ → hyperion.js, then inlines css+js into index.html
```

On Windows, use PowerShell instead:

```powershell
.\build.ps1       # same output, PowerShell equivalent
```

Edit **`src/**`** files — never `hyperion.js` or `index.html` directly (both are generated).
`hyperion.css` and `hyperion.html` are still hand-edited source files.
After any change run `./build.sh` and commit both the source file(s) and the regenerated
`hyperion.js` + `index.html`.
**Auto-commit these changes — no need to ask first.** No npm, no framework, no server, no
external requests — the zero-dependency single-file output is the whole point. Runs over
`file://`.

**Deploy:** there is no CI. GitHub Pages serves `index.html` from the repo root of `main`
(remote `origin` → `github.com/DavidVeksler/potemkin-pipeline`), so the committed
`index.html` *is* the deploy — pushing a stale or unbuilt one ships broken. Always
`./build.sh` before committing. Live at `davidveksler.github.io/potemkin-pipeline/`.

There is no test suite. Test manually: open `hyperion.html` (raw) or `index.html` (built)
in a browser. Append `?debug` to expose `window.__HYP`:
`__HYP.drama('gpu')` · `__HYP.force()` · `__HYP.deepwork()`/`.wake()` · `__HYP.state()`.

## Where things live (src/ directory)

Sections are delimited by `/* ===== TITLE ===== */` banners — grep the title to jump.
The `const X=` / `function X` anchors below are stable across files.

| To change… | File | Notes |
|---|---|---|
| URL params / defaults | `src/config.js` → `const cfg=` | parsed via `QS`/`qint`/`qfloat` |
| RNG, helpers, formatters | `src/rng.js` | `rng()`, `pick()`, `hash()`, `barStr()` etc. |
| String flavor (verbs, snippets, CVEs) | `src/content-banks/banks.js` | flat arrays; `pick()`ed by generators |
| Code snippet generators | `src/content-banks/snippets.js` | `snipTS`, `genSnippet`, `hiCode` |
| Event constructors | `src/event-dsl.js` | `TOOL OUT DIFF THINK TASK FILE SNIP BANNER PHASE CNT CLR WAIT OV` |
| Runtime state vars | `src/state.js` | `logicalNow`, `counters`, `SPIN`, etc. |
| DOM element refs | `src/render/dom.js` | `$()`, `logEl`, `cFiles`, etc. |
| File tree rendering | `src/render/file-tree.js` | `buildFileTree`, `highlightFile` |
| Log renderer | `src/render/renderer.js` | `render()`, `appendLine`, autoscroll |
| Overlay renderer + matrix rain | `src/render/overlay.js` | `renderOverlay`, `drawMatrix` |
| Boss-level app GUIs | `src/overlays/index.js` | `APP_BUILDERS`, `buildGrafana` … `buildCpu` |
| A mission's beats | `src/missions/index.js` | `pScan`, `pImpl`, `missionStream` |
| Simple dramas (anomaly/deploy/sec/matrix/auth/compact) | `src/dramas/simple.js` | |
| Boss dramas (grafana/btop/gpu/mesh/…) | `src/dramas/boss.js` | |
| Git dramas (rebase/bisect/blame/…) | `src/dramas/git.js` | |
| Deep-work away mode | `src/dramas/deep-work.js` | `MEGA_GOALS`, `dDeepWork` |
| Drama registry | `src/dramas/registry.js` | `DRAMAS`, `BOSS`, `GIT`, `CORE`, `enabledDramas` |
| Drama timing / cadence | `src/scheduler.js` | `pumpAuto`, `nextDramaAt`, `dramaFreq`, `frame` |
| Header widgets (cost, ctx, tokens) | `src/render/header.js` | `burnTick`, `renderBurn`, `ctxBump` — also edit html markup + css |
| Hotkeys | `src/ui/hotkeys.js` | |
| Deep-work / away behavior | `src/ui/idle.js` | `enterIdle`, `markActivity` |
| Scene picker dialog | `src/ui/scene-picker.js` | `SCENE_GROUPS`, `buildDramaPicker` |
| Config dialog controls | `src/ui/config-dialog.js` | `fld`/`rng_`, `syncURL` — `s` hotkey |
| Audio (WebAudio synth) | `src/audio.js` | `beep`, `sfx`, `tone`, `sweep` |
| Visibility / tab-away pause | `src/render/visibility.js` | |
| Init | `src/main.js` | `init()` |
| Debug hook | `src/debug.js` | `window.__HYP` — only with `?debug` |

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

- **Add a boss drama:** new `function* dXxx` in `src/dramas/boss.js` → register in `src/dramas/registry.js` →
  if it needs a new GUI add `buildXxx` to `src/overlays/index.js` + overlay CSS. See `IDEAS.md` for
  the planned backlog and the rules each scene follows.
  **Adding/registering a drama does NOT require re-running seed discovery** — vibe seeds tune only
  rng draws 1–6 (codename/counters/project), which fire before the first frame; scene selection is
  later and isn't seed-reproducible anyway (it depends on viewport + frame rate).
- **Re-tune vibe seeds (`node tools/seed-search.js`, exhaustive over all 2^32):** re-run ONLY when you
  change an *input the search reads*, not when you add behavior: reorder/add/remove a `CODENAMES` or
  `PROJECTS` entry; add/change an rng draw at load *before* init()'s project pick (or a counter
  `ri()` range in `src/state.js`); add a scene id to a vibe's `bias[]` or an `AGENT_PROFILE.bias[]`
  (may flip the ideal codename); or add a new vibe. Mirror that change into `seed-search.js`'s copies
  (`CODENAMES`/`PROJECTS`/`VIBE_BIAS`/`AGENT_BIAS`/`identity()`), then re-run. Its `GROUND_TRUTH` check
  catches draw-math drift — BUT it only proves the harness matches the *recorded* values, so when you
  touch the load-draw order you must **re-capture ground truth from the live engine** (`/?debug&seed=N`,
  read codename/project/counters off the page) before trusting the search.
- **Add a config knob:** four places must stay in sync — parse in `cfg`/CONFIG → add a
  control in the config dialog (`fld`/`rng_`) + `syncURL` → surface in `__HYP.state()` if
  useful → document in README's URL-params list.
- **Add a header widget:** markup in `hyperion.html` + style in `hyperion.css` + a DOM ref in `src/render/dom.js`
  + state var in `src/state.js` + a tick hook in `src/render/header.js` called from `frame()` (mirror `burnTick`).

## Conventions

- Match the existing style: terse single-line functions, short names, dense. Don't reformat.
- Three themes (amber/green/cyan) via CSS custom properties. All motion sits behind
  `body:not(.reduce)` and honors `prefers-reduced-motion` — new animation must too.
- Audio is synthesized on the fly (WebAudio, no files — files are dependencies).
- Keep README's hotkey table, URL-param list, and drama roster in sync with code.
