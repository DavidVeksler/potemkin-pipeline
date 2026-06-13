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
