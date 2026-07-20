# Agentic BOM: "BOM for Agentic Engineering" Talk

**Live: [romangurevitch.github.io/agentic-bom](https://romangurevitch.github.io/agentic-bom/)**

> Open the live deck on a computer. The 3D factory is not supported on
> phones.

A 3D, game-styled conference presentation built in Three.js. An agentic
software factory assembles itself live across 23 keyboard-driven screens
(six acts), ending in a full-plant orbit and a "choose your build" depth
selector (startup / scale-up / regulated enterprise).

The talk uses a factory as a metaphor for a target agentic
engineering setup: inputs arrive at intake funnels, flow through
experience cells and a workflow foundry, are shaped station by station on a
factory floor, and ship as finished, recognizable products. Underneath the
floor runs one connected service network (patterns, capability, knowledge,
infrastructure) tying every station together.

## Project Structure

```
├── talk/
│   ├── index.html               # Presentation shell + HUD
│   ├── js/                      # Step engine, 3D factory world, screen content
│   ├── vendor/                  # Three.js, vendored for offline use
│   ├── DESIGN.md                # Experience design for the talk site
│   └── SCRIPT.md                # Speaker script in dot points
├── .github/workflows/pages.yml  # GitHub Pages deployment workflow
└── README.md
```

## Run it locally

ES modules need an HTTP origin:

```bash
python3 -m http.server 8000
# open http://localhost:8000/talk/
```

Controls: arrows or space to step, mouse drag to rotate, `WASD` to move,
scroll to zoom, `N` speaker notes, `O` auto-orbit, `F` free roam (the full
plant lit and running, fixed signage only, also reachable at `#roam`),
`T` light/dark theme (persisted), `1-6` jump to act, `R` reset. The URL
hash tracks the current step, so a refresh restores position. Fully offline: Three.js and the Space Grotesk
font are vendored, no CDN.

## Deployment

Published as a [GitHub Pages](https://docs.github.com/en/pages) site via the
`.github/workflows/pages.yml` Actions workflow. Any push to the default
branch triggers a deployment automatically, publishing the `talk/` directory
with `talk/index.html` as the entry point.

Live at <https://romangurevitch.github.io/agentic-bom/>. Pages only serves
from public repos on the free plan, and needs to be configured with source
"GitHub Actions" (Settings → Pages) rather than the legacy "deploy from a
branch" mode for the workflow to publish successfully.

## Editing

- `talk/DESIGN.md` describes the experience design and metaphor map (factory
  parts to architecture concepts).
- `talk/SCRIPT.md` is the speaker script in dot points.
- `talk/js/steps.js` defines the 23 screens; `talk/js/world.js` builds the 3D
  factory; `talk/js/main.js` wires the renderer, camera, and post-processing.
- Keep the site self-contained: no external scripts, no external CSS, no
  fonts pulled from a CDN. It should render the same offline as it does on
  Pages.

To ship a change: edit, commit, push to the default branch, watch the
`pages` workflow in the Actions tab, refresh the Pages URL.
