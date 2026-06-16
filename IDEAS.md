# Feature Ideas

A running backlog for **Potemkin Pipeline**. Same rules as the rest of the
project: zero dependencies, no build step, single-file output, system monospace,
seeded RNG, respects `prefers-reduced-motion`. Convincing from across the room,
honest to anyone who reads it.

Ranked roughly by theater-per-byte. ⭐ = recommended next.

---

## Texture & polish

10. **Fake commit ticker / contribution graph** in the rail — an all-green wall
    that fills as it works.
13. **Screenshot / share-card export** — a button that renders the current frame
    to a branded PNG for posting.

---

## Platform selector — remaining tiers

Tier 1 shipped (`?platform=typescript|react|go|rust|python` pins the file tree +
code snippets; see [config.js](src/config.js) `PLATFORM_ALIASES`/`cfg.platform`
and [banks.js](src/content-banks/banks.js) `platformStack`/`genFiles`). The
selector is convincing across the room but leaks language under a close read,
because most verbal flavor and two boss dramas are still polyglot. Remaining work:

### Tier 3 — fix the two dramas that hardcode Go ⭐
Cheapest high-value follow-up; without it these scenes contradict any non-Go selection.

- **`dDocker`** ([boss.js:185](src/dramas/boss.js)) — build steps are hardcoded
  `FROM golang:…` / `go mod download` / `go build`. Parameterize from the active
  stack (mirror `snipDocker`'s base-image + build-command pairs in [snippets.js:44](src/content-banks/snippets.js)).
- **`dTmux`** ([boss.js:475](src/dramas/boss.js)) — test pane is hardcoded
  `go test ./...` with a `_test.go` FAIL line. Drive the runner + failure-file
  extension off the stack.

### Tier 2 — split the mixed content banks
Each is a flat array mixing languages; tag/duplicate into per-stack variants with a
shared generic fallback, pick by `cfg.platform`. Highest visibility first:

- `TESTCMDS` ([banks.js:98](src/content-banks/banks.js)) — `pytest` beside `cargo test` beside `go test`.
- `PKGS` ([banks.js:113](src/content-banks/banks.js)) — CVE dep names (`urllib3`/`lodash`/`log4j-core`).
- `ASSERT` ([banks.js:96](src/content-banks/banks.js)) — `panic: nil map`, `goroutine … mu.Lock`, `AssertionError`.
- `DIAG` ([banks.js:95](src/content-banks/banks.js)) — Go-only `-race` flag.
- `GREPS` ([banks.js:113](src/content-banks/banks.js)) / `GLOBS` ([banks.js:112](src/content-banks/banks.js)) — `panic\(`, `unsafe`, `await`, all extensions.
- Also: `dBtop`/`dOom` process-name pickers ([boss.js:201](src/dramas/boss.js), [boss.js:223](src/dramas/boss.js)) and the
  renderer's Grep glob params ([renderer.js:45](src/render/renderer.js)) bake in language runtimes/extensions.
- Leave generic infra-speak (`VERBS`/`SUBS`/`QUALS`) shared — language-neutral, low ROI to split.

### Tier "beyond" — real React snippets
`tsx` currently routes through `snipTS` (generic TypeScript). Add a `snipTSX`
generator with JSX/hooks so React reads as React rather than plain TS
([snippets.js genSnippet](src/content-banks/snippets.js)).

---

## HEATMAP DRAMAS

**What the heatmap actually is** ([hyperion.js:1041](hyperion.js:1041)): a `liveState` canvas ticker — `rows × scrolling time-columns`, each cell color-mapped by intensity, columns push left every 150ms, and a single `phase('spike'|'recover')` flag re-shapes the value distribution (the bottom rows stay flat, top rows blow up via `tail*tail`). The drama arc ([dHeatmap:1557](hyperion.js:1557)) is just: pull up dashboard → calm baseline → `beep('alert')` → spike → agent edits → recover → resolved.

So anything that reads as **"a category × time grid that's calm until one band goes hot"** can reuse `buildHeat`'s mechanics almost verbatim — swap `HEAT_BANDS`, the color ramp, and the spike math. Here's the brainstorm:

## Direct reskins (same grid, new semantics)

1. **GC / heap-pressure heatmap** — rows = `Eden / S0 / S1 / Old / Metaspace`, color = occupancy. Spike: Old gen creeps up, pause times climb, a "STOP-THE-WORLD 4.2s" banner. Fix: "tune G1 region size." The bottom-row-flat / top-row-blowout shape maps perfectly onto generational heap.

3. **Cache hit-rate heatmap** — rows = `L1 / L2 / Redis / CDN / origin`, color = miss-rate. Spike: a cache stampede — misses cascade downward through the tiers as each layer's hit-rate collapses. Cascade *direction* (top→bottom) is a fresh visual beat the latency one doesn't have.

4. **Error-budget / status-code heatmap** — rows = `2xx / 3xx / 4xx / 5xx`, color = volume. Spike: the 5xx row lights up across all columns at once (a deploy went bad), then recovers after a "rollback."

## Variations that bend the mechanic

6. **Per-region/shard grid (true 2D, not bands)** — instead of percentile bands on Y, make rows = regions (`us-east / eu-west / ap-south …`) and let the spike be *spatially localized* (one region row goes hot, the rest stay cool). Reads as a regional outage rather than a tail blowout. Tiny change to the `tick` value function, big change in story.

8. **Cooldown that doesn't fully recover** — most dramas end clean. A heatmap variant could end with a faint warm residue ("p99 still elevated — opened follow-up ticket") for tonal variety, since the engine already supports partial-intensity columns.

## My picks (heatmap)

For a *new visual beat* rather than a reskin: the **cache-stampede cascade** (#3), because the spike moving *through* rows is something the latency heatmap's all-rows-at-once spike never shows. (The traveling replication wave shipped as the `repl` scene.)
