# Feature Ideas

A running backlog for **Potemkin Pipeline**. Same rules as the rest of the
project: zero dependencies, no build step, single-file output, system monospace,
seeded RNG, respects `prefers-reduced-motion`. Convincing from across the room,
honest to anyone who reads it.

Ranked roughly by theater-per-byte. ⭐ = recommended next.

---

## New boss scenes

6. **Postgres replication failover** — primary goes dark, a replica is promoted,
   WAL catches up.

---

## Texture & polish

10. **Fake commit ticker / contribution graph** in the rail — an all-green wall
    that fills as it works.
13. **Screenshot / share-card export** — a button that renders the current frame
    to a branded PNG for posting.

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

7. **Replication-lag "the wave"** — spike doesn't recover instantly; it propagates: lag appears in one row, then the heat sweeps to adjacent rows column-by-column (failover cascade), then drains in reverse. Same canvas, animated spike *travels* across rows.

8. **Cooldown that doesn't fully recover** — most dramas end clean. A heatmap variant could end with a faint warm residue ("p99 still elevated — opened follow-up ticket") for tonal variety, since the engine already supports partial-intensity columns.

## My picks (heatmap)

For a *new visual beat* rather than a reskin: **cache-stampede cascade** (#3) or the **traveling replication wave** (#7), because the spike moving *through* rows is something the latency heatmap's all-rows-at-once spike never shows.
