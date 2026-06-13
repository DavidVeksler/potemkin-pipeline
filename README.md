# Potemkin Pipeline

An offline, single-file browser app that simulates the theater of an autonomous
AI coding agent at work — streaming tool calls, self-correcting bugs, deploying,
patching CVEs, and the occasional boss-level "drama" (a runaway process on a
critical server, a flailing CI pipeline, a flame graph, a btop meltdown).

It's a Potemkin village for your terminal: all show, real-looking, convincing to
a non-technical observer — but it isn't meant to fool anyone who actually reads
the content. The in-app product is branded **HYPERION**; *Potemkin Pipeline* is
the project name.

▶ **[Run it live](https://davidveksler.github.io/potemkin-pipeline/)** · press <kbd>f</kbd> to force a random drama, <kbd>d</kbd> to pick a specific scene, <kbd>b</kbd> for the boss key.

> The agent picks a fresh hyperbolic codename each load (ORION, COLOSSUS, SINGULARITY, PLUS-ULTRA…),
> riffing on the rumored next-gen model mythos. It's seed-derived, so a shared `?seed=` link reproduces it.

## The show

Every so often the agent hits a "boss" — a production crisis that pops a full-screen
overlay, panics convincingly, then fixes it. Here's the highlight reel:

![Boss drama slideshow](assets/slideshow.gif)

## The full roster

Fourteen distinct dramas, each a crisis → the-agent-acts → recovery arc.

<table>
<tr>
<td width="50%"><img src="assets/attackmap.gif" width="100%"><br><sub><b>🌍 Threat map</b> — a volumetric DDoS converges on the edge WAF; the agent null-routes the offending ASNs.</sub></td>
<td width="50%"><img src="assets/gpu.gif" width="100%"><br><sub><b>🎛️ GPU farm</b> — an H200 overheats and throttles; the training shard rebalances across the cluster.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/mesh.gif" width="100%"><br><sub><b>🛰️ Service mesh</b> — a circuit breaker trips an edge red; bad endpoints are ejected and traffic flows again.</sub></td>
<td width="50%"><img src="assets/heatmap.gif" width="100%"><br><sub><b>🔥 Latency heatmap</b> — the p99.9 tail blows out while p50 stays flat, then cools after a hedging fix.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/btop.gif" width="100%"><br><sub><b>📊 btop meltdown</b> — a runaway process pins several cores on a critical host; <code>kill -9</code> reclaims them.</sub></td>
<td width="50%"><img src="assets/sql.gif" width="100%"><br><sub><b>🗄️ Slow query</b> — <code>EXPLAIN ANALYZE</code> reveals a seq scan; a concurrent index makes it 172× faster.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/trace.gif" width="100%"><br><sub><b>🔍 Distributed trace</b> — a Jaeger trace pins a slow serialize span; streaming the encoder cuts tail latency.</sub></td>
<td width="50%"><img src="assets/flame.gif" width="100%"><br><sub><b>🔥 Flame graph</b> — pprof shows a hot <code>json.Marshal</code> path; a <code>sync.Pool</code> rewrite lands ~4× faster.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/grafana.gif" width="100%"><br><sub><b>📈 Grafana SLO</b> — the error rate breaches the SLO; scaling the deployment pulls it back into the green.</sub></td>
<td width="50%"><img src="assets/cluster.gif" width="100%"><br><sub><b>☸️ Cluster</b> — a pod hits <code>CrashLoopBackOff</code>; a rollout restart reschedules it healthy.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/pipeline.gif" width="100%"><br><sub><b>🔧 CI/CD pipeline</b> — build → test → scan → canary → deploy marches green and ships to prod.</sub></td>
<td width="50%"><img src="assets/load.gif" width="100%"><br><sub><b>🚦 Load test</b> — k6 ramps virtual users to a sustained peak rps at a healthy p95 with zero errors.</sub></td>
</tr>
<tr>
<td width="50%"><img src="assets/pr.gif" width="100%"><br><sub><b>🔀 Pull request</b> — every check goes green and the PR merges into <code>main</code>.</sub></td>
<td width="50%"><img src="assets/docker.gif" width="100%"><br><sub><b>🐳 Docker build</b> — a multi-stage <code>buildx</code> runs layer by layer and pushes to the registry.</sub></td>
</tr>
</table>

> GIFs are short loops captured at default (medium) intensity. They re-render slightly
> differently every run — every story beat is driven by a seeded RNG.

## Design constraints

- Zero dependencies, no build step required to run — works over `file://` and any static host.
- System monospace, single `requestAnimationFrame` loop, respects `prefers-reduced-motion`.
- Deterministic: a seeded RNG drives every story beat, so a shared link reproduces the same run.

## Layout

Developed as split files and re-inlined into a standalone distributable:

- `hyperion.html` — markup
- `hyperion.css` — styles
- `hyperion.js` — the engine (RNG, mission/drama FSMs, overlay system, live btop)
- `build.sh` — inlines CSS + JS into `index.html`
- `index.html` — the generated single-file artifact you deploy (also the GitHub Pages root)
- `assets/` — README GIFs only; not part of the app

## Build

```sh
./build.sh   # → index.html
```

## Live

- GitHub Pages: https://davidveksler.github.io/potemkin-pipeline/
- Target home: cheatsheets.davidveksler.com
