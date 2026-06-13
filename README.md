# Potemkin Pipeline

An offline, single-file browser app that simulates the theater of an autonomous
AI coding agent at work — streaming tool calls, self-correcting bugs, deploying,
patching CVEs, and the occasional boss-level "drama" (a runaway process on a
critical server, a flailing CI pipeline, a flame graph, a btop meltdown).

It's a Potemkin village for your terminal: all show, real-looking, convincing to
a non-technical observer — but it isn't meant to fool anyone who actually reads
the content. The in-app product is branded **HYPERION**; *Potemkin Pipeline* is
the project name.

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

## Build

```sh
./build.sh   # → index.html
```

## Live

- GitHub Pages: https://davidveksler.github.io/potemkin-pipeline/
- Target home: cheatsheets.davidveksler.com
