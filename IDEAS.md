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

### ✅ 2. Cost / burn meter — _shipped_
A live "$ spent this session" counter in the header that ticks up with every
tool call, plus the occasional `⚠ token budget 80%` warning the agent nervously
works around. Near-zero code, very 2026.

### ✅ 3. Incident → postmortem arc — _shipped_
A blameless one-screen postmortem box (impact, timeline, root cause, action
items with @owners, a blameless-culture platitude). Registered as an autoplay
CORE scene `dPostmortem`; the on-call page (`pager`) spawns one ~50% of the time.

### ✅ 4. Agent-to-agent chatter — _shipped_
`dChatter`: a second seed-derived codename reviews the PR, pushes back on an
approach, and reaches consensus — multi-agent swarm theater. Log-only CORE scene.

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
18. ✅ **Structured arg signatures** — _shipped_. Args read like real ones:
    `Read(file, offset: 240, limit: 80)`, `Grep(pat, glob: "*.ts",
    output_mode: "content")`, `Bash(cmd, timeout: 120000)`,
    `Task(desc, subagent_type: "Explore")`. Param keys dim, values normal;
    generated per-tool at render with `Math.random` (cosmetic flavor — leaves
    the seeded rng stream untouched, like the jitter rule).
19. ✅ **Collapsed long output** — _shipped_. Bash-stdout-shaped results
    (test runs, `kubectl logs`, Sentry queries) trail a dim
    `… +N lines (ctrl+r to expand)` via an `OUT(...,{more:N})` field; signals
    the call did a lot without showing it. (`.ln.out.collapse`.)
20. ✅ **Per-call token cost** — _shipped_. A faint trailing `· 1.2k tokens` on
    heavier calls (Math.random flavor, untouched seeded stream), feeding
    `burnTick` so the cost meter ticks come *from* visible work.
21. **Nested sub-tool indentation** — `Task`/subagent child calls indent one level
    under their parent (the swarm drama already has the fiction).
22. ✅ **MCP-flavored calls** — _shipped_. Purpose-driven beats: `mcpScan`
    (Sentry/Datadog query during SCAN) and `mcpShip` (Linear/Slack/GitHub after
    deploy). The `mcp__server__action` namespace renders with the `mcp__server__`
    prefix dimmed (`.tns`); reads as *more* authentic precisely because nobody
    bothers to fake it.

---

## New boss scenes

5. ✅ **Kafka / event-stream lag** — _shipped_ (`kafka` / `buildKafka`). Consumer-group
   lag spikes into the millions on a few partitions, rebalances, drains.
6. **Postgres replication failover** — primary goes dark, a replica is promoted,
   WAL catches up.
7. ✅ **Terraform plan/apply** — _shipped_ (`terraform`). `+47 ~12 -3`, a scary
   `- …prod (forces replacement)`, then a confident apply. The destroy-line is the joke.
8. ✅ **git bisect hunt** — _shipped_ (`bisect`). Walks commits log₂, narrows to the
   culprit, reverts it.
9. ✅ **On-call page** — _shipped_ (`pager`). A PagerDuty-style P1 fires at "03:14,"
   gets ack'd in seconds, resolved with an MTTR. Often chains into the postmortem.

---

## Texture & polish

10. **Fake commit ticker / contribution graph** in the rail — an all-green wall
    that fills as it works.
11. ✅ **Typo-and-correct micro-beats** — _shipped_ (`typoBeat` in missions, ~18%
    per mission). The agent fat-fingers a Bash command, gets command-not-found,
    retypes. Imperfection reads as *more* real than flawless output.
12. **Sound-design pass** — distinct cues per drama severity (the WebAudio
    engine already exists).
13. **Screenshot / share-card export** — a button that renders the current frame
    to a branded PNG for posting.

---

## Meta & distribution

14. ✅ **Preset "vibes" via URL** — _shipped_. `?vibe=startup-crunch | enterprise-migration |
    security-incident` bundles seed + pacing (speed/freq) + drama-weighting into one
    shareable link; the scheduler favors each vibe's signature scenes (~62%).
15. **OG image + meta tags** so the live link unfurls nicely when shared.

---

_Recommendation: build **idle deep-work mode** (#1) first — it's what makes the
"the agent is busy" excuse actually work while you're away from the desk — then
the **cost/burn meter** (#2)._

---

## Engine & behavior

### ✅ A. Behavioral agent codenames — _shipped_
Make codenames affect behavior, not just the header label. Each codename implies an
"agent temperament" that influences scene weights, language style, and the opening
tagline (`AGENT_PROFILES` in `src/config.js`, resolved to `agentProfile` in `rng.js`):
`KERNEL` (perf/syscall/kernel), `PRISM` (observability), `FORGE` (aggressive
ship/git), `PILOT` (cautious tests/auth), `RELAY` (distributed/queues),
`CURSOR-X` (subagent/tool-spam parody). The scheduler favors a profile's signature
scenes (~45% when no `?vibe=` override); `rethink()` mixes in profile-flavored
second-guesses; a boot tagline opens mission #1. Seed-derived and deterministic;
`?agent=` maps to a known profile or falls back neutral (NOVA/FLUX/VECTOR/ORBIT and
any custom name are neutral).

### ✅ B. Batched DOM rendering — _shipped_
Reduce layout churn: `appendLine` queues nodes instead of inserting per event; the
frame loop flushes the whole batch through one `DocumentFragment`, prunes once, and
autoscrolls once per frame. File-highlight `scrollIntoView` is coalesced to a single
call per frame. `MAX_PER_FRAME` still caps logical emission.

---

## HEATMAP DRAMAS

**What the heatmap actually is** ([hyperion.js:1041](hyperion.js:1041)): a `liveState` canvas ticker — `rows × scrolling time-columns`, each cell color-mapped by intensity, columns push left every 150ms, and a single `phase('spike'|'recover')` flag re-shapes the value distribution (the bottom rows stay flat, top rows blow up via `tail*tail`). The drama arc ([dHeatmap:1557](hyperion.js:1557)) is just: pull up dashboard → calm baseline → `beep('alert')` → spike → agent edits → recover → resolved.

So anything that reads as **"a category × time grid that's calm until one band goes hot"** can reuse `buildHeat`'s mechanics almost verbatim — swap `HEAT_BANDS`, the color ramp, and the spike math. Here's the brainstorm:

## Direct reskins (same grid, new semantics)

1. **GC / heap-pressure heatmap** — rows = `Eden / S0 / S1 / Old / Metaspace`, color = occupancy. Spike: Old gen creeps up, pause times climb, a "STOP-THE-WORLD 4.2s" banner. Fix: "tune G1 region size." The bottom-row-flat / top-row-blowout shape maps perfectly onto generational heap.

2. ✅ **Thermal / power throttle map** — _shipped_ (`thermal` / `buildThermal`). Rows = GPU dies, color = °C. A column of dies redlines past 90°C, throttle kicks in, fans/power-cap recover it. Sibling to the `gpu` drama.

3. **Cache hit-rate heatmap** — rows = `L1 / L2 / Redis / CDN / origin`, color = miss-rate. Spike: a cache stampede — misses cascade downward through the tiers as each layer's hit-rate collapses. Cascade *direction* (top→bottom) is a fresh visual beat the latency one doesn't have.

4. **Error-budget / status-code heatmap** — rows = `2xx / 3xx / 4xx / 5xx`, color = volume. Spike: the 5xx row lights up across all columns at once (a deploy went bad), then recovers after a "rollback."

5. **Partition-lag heatmap** — rows = Kafka partitions, color = consumer lag. Spike: a few partitions go red as a consumer falls behind; recover = "rebalanced / scaled consumers."

## Variations that bend the mechanic

6. **Per-region/shard grid (true 2D, not bands)** — instead of percentile bands on Y, make rows = regions (`us-east / eu-west / ap-south …`) and let the spike be *spatially localized* (one region row goes hot, the rest stay cool). Reads as a regional outage rather than a tail blowout. Tiny change to the `tick` value function, big change in story.

7. **Replication-lag "the wave"** — spike doesn't recover instantly; it propagates: lag appears in one row, then the heat sweeps to adjacent rows column-by-column (failover cascade), then drains in reverse. Same canvas, animated spike *travels* across rows.

8. **Cooldown that doesn't fully recover** — most dramas end clean. A heatmap variant could end with a faint warm residue ("p99 still elevated — opened follow-up ticket") for tonal variety, since the engine already supports partial-intensity columns.

## My picks (heatmap)

If you want one: **thermal throttle map** (#2) — it's the highest-payoff because the heat metaphor is literal, the color ramp already exists, and it slots beside the GPU drama thematically. If you want a *new visual beat* rather than a reskin: **cache-stampede cascade** (#3) or the **traveling replication wave** (#7), because the spike moving *through* rows is something the latency heatmap's all-rows-at-once spike never shows.

Want me to implement one? I'd suggest the thermal map as the clean win, or the cascade if you want to push the mechanic somewhere new. I can wire up `buildThermal`/`dThermal`, register them, and run `./build.sh`.

---

# BOSS SPECS (build-ready)

Each spec is written to drop straight into the engine. The shared shape:

- **Generator** `function* dXxx()` in `DRAMA GENERATORS` → register in `const DRAMAS` →
  add the key to the right roster array (`BOSS` for app-window scenes, `GIT` for git
  scenes, `CORE` for log-only beats).
- **Builder** (only if a new GUI is needed) `buildXxx` in `APP_BUILDERS` + overlay CSS;
  the generator mutates it live via `OV('appstep',{k,…})` / `OV('livefx',{phase})`.
- **Primitives reused**: `OV('app'|'box'|'banner'|'bar'|'boxline'|'appstep'|'close')`,
  `TOOL/OUT/DIFF/THINK/L`, `beep('alert'|'ok'|'deploy')`, `CNT(field,Δ)` on
  `files/lines/tests/cves/deploys/commits/incidents`, banks `FILES/FIX/ADD/RETHINK`,
  helpers `hash() grp() ri() U() pick() barStr()`.
- **The arc** every scene already follows: pull up → calm/context → `beep('alert')` →
  crisis escalates → agent acts (Edit/Bash + diff) → `beep('ok')` recover → resolved
  banner → `CNT(...)` → `OV('close')`. All motion behind `body:not(.reduce)`; matrix-class
  flashes guarded by `reduceFlash`/`reduceMotion`.

---

## ✅ 0. `vim` — the vim edit hero session  _(headliner — shipped)_

_Shipped as `dVim` / `buildVim`: search → visual-yank → macro replay (the lines
counter ticks under `@a`) → `:%s//gc` live count → `gg=G` → `:wq`, exits on the first
try. Wild variant edits `~/.vimrc` during deep-work. Below is the original spec._

**The joke.** The single most-mythologized developer flex — a touch-typist flying through
modal editing — performed by an agent that writes no code. Macros, `:%s` with a live
count, a registered yank, `gg=G`, `:wq`. The hero beat is that it *exits vim* on the first
try. Reads as virtuosic from across the room; pure pantomime up close.

**Roster:** add `vim` to `BOSS`. **New builder:** `buildVim` in `APP_BUILDERS`.

**Builder `buildVim(body)`** — a faux terminal-vim window (`OV('app',{tool:'vim',…})`,
title `vim · <file>`, no `url`). Structure:
- A gutter+text pane: ~16 visible lines, each a `<div class="vl">` with a dim line-number
  span (`data-k="ln-<i>"`) and a code span (`data-k="src-<i>"`). Seed it with plausible
  source from `genSnippet()` (already exists) or a `FILES` path's faux body — keep it
  static; the drama mutates specific lines in place.
- A `~` empty-line filler below content (classic vim), dimmed.
- A **mode line / ruler** at the bottom: a left chip `data-k="mode"` (`-- NORMAL --`,
  flips to `-- INSERT --` / `-- VISUAL --` / `:` command), a right `data-k="ruler"`
  (`<line>,<col>  <pct>%`), and a center `data-k="cmd"` for the command-line / `:%s` echo.
- A block **cursor** `data-k="cur"` that the generator repositions onto a `src-<i>` line
  (bg-accent block in normal/visual, thin bar in insert). Movement is cosmetic — set via
  `appstep` `cssVar`/class, not re-render.

**Generator `function* dVim()`** beats:
1. `OV('app',{tool:'vim',title:'vim · '+pick(FILES),file})` ·
   `L('▌ Dropping into the editor — '+ri(2,9)+' files need surgery','accent')`.
2. **Navigate.** A few `appstep` mode/ruler bumps narrating motion in vim-ese:
   `OV('appstep',{k:'cmd',text:'/'+pick(['TODO','panic(','any','== nil'])})` then
   `n` `n` (jump matches), each repositioning `cur`. `mode` stays `-- NORMAL --`.
3. **Visual + yank.** `mode` → `-- VISUAL --`, highlight a span (`vap` / `5j`),
   `OV('appstep',{k:'cmd',text:'"ay'})` → `OUT(ri(4,30)+' lines yanked to register a','dim')`.
4. **The macro.** `L('Recording a macro — qa … q','warn')`, then a loop
   `for(let i=0;i<ri(4,9);i++)` replaying `@a`: each iteration bump the `ruler`, flash a
   `DIFF('+',pick(ADD))` or `DIFF('-',…)`, and `CNT('lines',ri(3,40))`. This is the
   centerpiece — the counter ticking under a replaying macro is the whole flex.
5. **The substitute.** `mode` → `:`, `OV('appstep',{k:'cmd',text:':%s/'+old+'/'+neW+'/gc'})`
   where `old/neW` come from `FIX`-flavored tokens. Then a live count:
   `OUT(grp(ri(60,4000))+' substitutions on '+ri(20,400)+' lines','dim',{burst:true})`.
6. **Reindent.** `OV('appstep',{k:'cmd',text:'gg=G'})` · `OUT('reformatted buffer','dim')`.
7. **Write + exit.** `mode` → `:`, `OV('appstep',{k:'cmd',text:':wq'})`,
   `OV('banner',{cls:'ok',text:'✓ :wq — wrote '+file+', '+grp(lines)+'L, '+bytes+'B'})`,
   `beep('ok')`, `L('✔ exited vim on the first try','ok')` (the punchline),
   `CNT('files',1) CNT('lines',N)`, `OV('close')`.

**Wild variant for the deep-work / `?wild` lane:** title `vim · ~/.vimrc`, and the macro
edits the vimrc itself — "optimizing my own keybindings" — an infinite-recursion gag the
deep-work grind can cut into and resume (mirror the `dramaQ` drain in `dDeepWork`).

**Notes:** keep all cursor/mode changes as `appstep` mutations (no re-render, per the
overlay rule). Macro replay timing `U(180,420)` per iteration so the eye reads it as fast
human typing, not instant. Honor `reduceMotion` by dropping cursor-blink and shortening
the macro loop.

---

## ✅ 1. `tmux` — split-pane war room — _shipped_

_Shipped as `dTmux` / `buildTmux`: a 2×2 grid (logs/build/htop/test), the test pane
goes red, the agent Ctrl-b jumps to it, fixes, all panes settle green._

The agent tiles a tmux session: logs tailing in one pane, `htop` in another, a build in a
third, a vim sliver in the fourth. One pane goes red (a test fails / a tail spikes), the
agent `Ctrl-b →` jumps to it, fixes, all panes settle green.

- **Builder `buildTmux`**: a 2×2 grid of mini-panes, each a titled box with a few live
  `data-k` lines + a tmux status bar (`[0] 0:logs 1:build* 2:htop 3:vim`, clock). The
  active pane gets an accent border.
- **Generator**: `OV('app',{tool:'tmux'})` → calm tail in all panes → `beep('alert')`,
  flip `pane-1` state to `err` → `appstep` move active border to pane 1 → `TOOL('Edit')`
  + `DIFF('+',pick(FIX))` → pane back to `ok` → `beep('ok')` resolved → `CNT('tests',N)`.
- Pairs with `vim` and `btop` thematically; reuses the appstep-mutation pattern wholesale.

## ✅ 2. `dns` — propagation / the cursed cache — _shipped_

_Shipped as `dDns` / `buildDns`: a resolver→answer→TTL table, rows stale-red until they
flip fresh one by one as the record propagates. "It's always DNS."_

A record change that "should be instant" but isn't. A `dig` fan-out across resolvers
(8.8.8.8, 1.1.1.1, authoritative, regional) shows stale vs fresh TTLs draining toward 0.

- **Box scene** (no new builder needed — reuse `OV('box')` + `OV('bar')` per resolver, or
  a tiny `buildDns` table of resolver→value→TTL rows that count down via `appstep`).
- Arc: `banner` "⚠ STALE RECORD — half the planet still sees the old A record" → per-row
  TTL countdown bars → `TOOL('Bash','dig +short @… ')` → rows flip to the new IP one by one
  → `banner` ok "✓ PROPAGATED — global consensus reached" → `CNT('incidents',1)`.
- The eternal "it's always DNS" punchline; legible countdown arc.

## ✅ 3. `chaos` — chaos-engineering game day — _shipped_

_Shipped as `dChaos` (reuses the mesh window): the agent injects a fault on purpose,
services go red, breakers hold, steady state confirmed._

Self-inflicted crisis: the agent *intentionally* kills a dependency to prove resilience,
sweats while the blast radius spreads, then the circuit breakers hold.

- Reuse the `cluster`/`mesh` builder, or a `box` of services. Arc: `banner` "⚂ GAME DAY —
  injecting fault: kill us-east-1 / drop 30% packets / +400ms latency" → services flip
  amber → `OUT('blast radius: '+ri(2,9)+' services degraded')` → breakers trip, fallbacks
  engage (`appstep` to `degraded`→`ok`) → `banner` ok "✓ STEADY STATE held · 0 user-facing
  errors" → `CNT('incidents',1)`. The boss the agent *chose* — distinct tonal beat.

## ✅ 4. `terraform` — plan/apply (from the backlog, #7) — _shipped_

_Shipped as `dTerraform`: box scene, `Plan: +N ~N -N`, a scary `- …prod (forces
replacement)`, the agent explains it's an intentional blue/green swap, then applies._

The destroy-line is the joke. `box`/`bar` scene, no live canvas.

- `box` title "⊹ TERRAFORM · plan" → `boxline`s: `Plan: +47 ~12 -3` with a scary red
  `- aws_db_instance.prod` (`tone:'err'`) → `THINK()` + `L('that destroy is intentional —
  blue/green swap','warn')` → `bar` apply steps (`creating…`/`destroying…`/`modifying…`)
  → `boxline` ok "Apply complete! 47 added, 12 changed, 3 destroyed" → `beep('deploy')`
  `CNT('deploys',1)`. Register in `BOSS` (it's app-flavored) or `CORE`.

## ✅ 5. `pager` — 03:14 on-call page (from the backlog, #9) — _shipped_

_Shipped as `dPager`: P1 page at 03:NN, ack'd in seconds, triage + hotfix, resolved
with an MTTR; chains into `dPostmortem` ~50% of the time._

PagerDuty-style. `anomaly`-class overlay. Timestamps imply the agent never sleeps.

- `banner` pulse "📟 PAGE · P1 · 03:14:0"+ri — "API error budget exhausted" → `L('▌ Ack'd
  in 11s — agent never sleeps','accent')` → triage `TOOL`s → `DIFF('+',pick(FIX))` →
  `banner` ok "✓ RESOLVED · 03:21 · MTTR 6m" → `CNT('incidents',1)`. Optionally chain into
  the **postmortem arc** (backlog #3) as a follow-on `box`.

## ✅ 6. `kafka` — consumer-group lag (backlog #5, canvas) — _shipped_

_Shipped as `dKafka` / `buildKafka`: bar-per-partition live ticker, spike localizes to
a few partitions climbing into the millions, rebalance drains it._

Bar-per-partition `liveState` canvas (clone `buildHeat`/`buildGpu` mechanics). Spike: a few
partitions' lag climbs into the millions, a rebalance churns, lag drains. `livefx`
`'spike'`/`'recover'`. `banner` → `beep('alert')` → "rebalanced / scaled consumers" →
`beep('ok')` → `CNT('incidents',1)`.

---

## Picks

If you build one new boss: **`vim` hero session** — highest theater-per-byte, it's the
quintessential dev flex and nothing in the roster touches modal editing. Cleanest non-vim
add: **`terraform`** (no new builder, the destroy-line lands instantly). Best *new visual*:
**`tmux`** split-pane (the 2×2 live grid is a fresh layout the roster doesn't have yet).