# Feature Ideas

A running backlog for **Potemkin Pipeline**. Same rules as the rest of the
project: zero dependencies, no build step, single-file output, system monospace,
seeded RNG, respects `prefers-reduced-motion`. Convincing from across the room,
honest to anyone who reads it.

Ranked roughly by theater-per-byte. ⭐ = recommended next.

---

## Top picks (high impact, low effort)

### ✅ 1. Idle / AFK "deep work" mode — _shipped_
After N seconds of no input (default 30, `?idle=N`), the agent clears the log and
settles into an unbroken multi-minute grind toward an absurd goal ("Backfilling
the ledger from genesis · 14% · 2,278,901 / 15,736,440 rows") with climbing
counters and tool/think texture. Any keypress/mouse/touch parks the pass and
snaps it back. Indicator: `⚙ deep work`. Test hooks: scene picker → Special →
"deep work · away mode", or `__HYP.deepwork()` / `__HYP.wake()` with `?debug`.

### ⭐ 2. Cost / burn meter
A live "$ spent this session" counter in the header that ticks up with every
tool call, plus the occasional `⚠ token budget 80%` warning the agent nervously
works around. Near-zero code, very 2026.

### 3. Incident → postmortem arc
When a boss drama resolves, occasionally auto-generate a one-screen postmortem
(timeline, root cause, "action items," a blameless-culture platitude). The most
LinkedIn-brained possible artifact; reads as deeply real from a distance.

### 4. Agent-to-agent chatter
A second/third named codename occasionally appears — ORION asks COLOSSUS to
review its PR, they "disagree" on an approach, reach consensus. Multi-agent
swarm theater, which is exactly the zeitgeist being parodied. Just more
generators.

---

## Tool-call realism

The single tool line — `⏺ Tool(arg)` with an occasional detached `⎿ output` — is
what the eye rests on most. Three tells give it away; closing them is the highest
realism-per-byte work in the project.

16. ✅ **Pending → resolved lifecycle** — _shipped_. A tool renders with a live
    spinner (pending) and resolves to a solid dot once its result lands, so every
    call has the half-second of suspense a real agent shows instead of appearing
    fully-formed and instant.
17. ✅ **Impact result lines** — _shipped_. Results report *what the call did*, not
    flavor: `Read 248 lines`, `Updated app.ts with 3 additions and 1 removal`,
    `Found 12 matches in 4 files`, `41 files`. The lines counter bumps by the same
    additions number the Edit result just claimed — honest to the call that made it.
18. **Structured arg signatures** — args read like real ones: `Read(file,
    offset:240, limit:80)`, `Grep(pat, glob:"*.ts", output_mode:"content")`,
    `Bash(cmd, timeout:120000)`. Param keys dim, values normal — pure CSS, big
    fidelity jump. (Next.)
19. **Collapsed long output** — `⎿ … +37 lines (ctrl+r to expand)`. Instantly
    recognizable CC affordance; signals the call did a lot without showing it.
20. **Per-call token cost** — a faint trailing `· 1.2k tokens` on heavier calls,
    feeding the burn meter so cost ticks come *from* visible work.
21. **Nested sub-tool indentation** — `Task`/subagent child calls indent one level
    under their parent (the swarm drama already has the fiction).
22. **MCP-flavored calls** — occasional `mcp__linear__create_issue(...)` /
    `playwright(browser_navigate)`. The two-underscore namespace reads as *more*
    authentic precisely because nobody bothers to fake it.

---

## New boss scenes

5. **Kafka / event-stream lag** — consumer-group lag spikes into the millions,
   partitions rebalance, lag drains. (Canvas bar-per-partition.)
6. **Postgres replication failover** — primary goes dark, a replica is promoted,
   WAL catches up.
7. **Terraform plan/apply** — `+47 ~12 -3`, a scary `-aws_db_instance.prod`,
   then a confident apply. The destroy-line is the joke.
8. **git bisect hunt** — walks commits, narrows to the culprit, "found it."
   Satisfying, legible arc.
9. **On-call page** — a PagerDuty-style alert fires at "03:14," gets acked,
   resolved. Timestamps imply the agent never sleeps.

---

## Texture & polish

10. **Fake commit ticker / contribution graph** in the rail — an all-green wall
    that fills as it works.
11. **Typo-and-correct micro-beats** — the agent occasionally "mistypes" a
    command, gets an error, fixes it. Imperfection reads as *more* real than
    flawless output.
12. **Sound-design pass** — distinct cues per drama severity (the WebAudio
    engine already exists).
13. **Screenshot / share-card export** — a button that renders the current frame
    to a branded PNG for posting.

---

## Meta & distribution

14. **Preset "vibes" via URL** — `?vibe=startup-crunch | enterprise-migration |
    security-incident` bundles seed + intensity + drama-weighting into one
    shareable link.
15. **OG image + meta tags** so the live link unfurls nicely when shared.

---

_Recommendation: build **idle deep-work mode** (#1) first — it's what makes the
"the agent is busy" excuse actually work while you're away from the desk — then
the **cost/burn meter** (#2)._

---

## HEATMAP DRAMAS

**What the heatmap actually is** ([hyperion.js:1041](hyperion.js:1041)): a `liveState` canvas ticker — `rows × scrolling time-columns`, each cell color-mapped by intensity, columns push left every 150ms, and a single `phase('spike'|'recover')` flag re-shapes the value distribution (the bottom rows stay flat, top rows blow up via `tail*tail`). The drama arc ([dHeatmap:1557](hyperion.js:1557)) is just: pull up dashboard → calm baseline → `beep('alert')` → spike → agent edits → recover → resolved.

So anything that reads as **"a category × time grid that's calm until one band goes hot"** can reuse `buildHeat`'s mechanics almost verbatim — swap `HEAT_BANDS`, the color ramp, and the spike math. Here's the brainstorm:

## Direct reskins (same grid, new semantics)

1. **GC / heap-pressure heatmap** — rows = `Eden / S0 / S1 / Old / Metaspace`, color = occupancy. Spike: Old gen creeps up, pause times climb, a "STOP-THE-WORLD 4.2s" banner. Fix: "tune G1 region size." The bottom-row-flat / top-row-blowout shape maps perfectly onto generational heap.

2. **Thermal / power throttle map** — rows = GPU dies or rack units, color = °C. This is the *most* natural fit — heat is literally the metaphor. Spike: a column of dies redlines to 94°C, throttle kicks in. Pairs nicely as a sibling to the existing `gpu` drama.

3. **Cache hit-rate heatmap** — rows = `L1 / L2 / Redis / CDN / origin`, color = miss-rate. Spike: a cache stampede — misses cascade downward through the tiers as each layer's hit-rate collapses. Cascade *direction* (top→bottom) is a fresh visual beat the latency one doesn't have.

4. **Error-budget / status-code heatmap** — rows = `2xx / 3xx / 4xx / 5xx`, color = volume. Spike: the 5xx row lights up across all columns at once (a deploy went bad), then recovers after a "rollback."

5. **Partition-lag heatmap** — rows = Kafka partitions, color = consumer lag. Spike: a few partitions go red as a consumer falls behind; recover = "rebalanced / scaled consumers."

## Variations that bend the mechanic

6. **Per-region/shard grid (true 2D, not bands)** — instead of percentile bands on Y, make rows = regions (`us-east / eu-west / ap-south …`) and let the spike be *spatially localized* (one region row goes hot, the rest stay cool). Reads as a regional outage rather than a tail blowout. Tiny change to the `tick` value function, big change in story.

7. **Replication-lag "the wave"** — spike doesn't recover instantly; it propagates: lag appears in one row, then the heat sweeps to adjacent rows column-by-column (failover cascade), then drains in reverse. Same canvas, animated spike *travels* across rows.

8. **Cooldown that doesn't fully recover** — most dramas end clean. A heatmap variant could end with a faint warm residue ("p99 still elevated — opened follow-up ticket") for tonal variety, since the engine already supports partial-intensity columns.

## My picks

If you want one: **thermal throttle map** (#2) — it's the highest-payoff because the heat metaphor is literal, the color ramp already exists, and it slots beside the GPU drama thematically. If you want a *new visual beat* rather than a reskin: **cache-stampede cascade** (#3) or the **traveling replication wave** (#7), because the spike moving *through* rows is something the latency heatmap's all-rows-at-once spike never shows.

Want me to implement one? I'd suggest the thermal map as the clean win, or the cascade if you want to push the mechanic somewhere new. I can wire up `buildThermal`/`dThermal`, register them, and run `./build.sh`.