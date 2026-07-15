# BOM for Agentic Engineering: Presentation Site Design

Talk: "BOM for Agentic Engineering" (30-40 min, external conference audience)
Speaker: Roman Gurevitch, Principal Software Engineer, Mantel

## Concept

We build an agentic software factory live on stage, in a 3D isometric game
world. The story has one authority: **the Head Office**, where **the
business** (technical and non-technical leadership) defines requirements and
direction. They do not run the factory; they CREATE it. The Head Office and
the foundry are the TOP LEVEL of the plant: a deck raised over the intake
wall, built incrementally as the talk progresses: first the deck and the
leadership floor (screen 4), then the component catalog covering its east
wall (screen 7), then the **Workflow Foundry** beside it (screen 8). Goals
and direction pipe straight down from the office into the intake funnels.

The foundry is the talk's second branded idea, **The Meta Workflow**: "the
workflow that builds your workflows." Candidate workflows assemble in place
from catalog blocks as visibly different topologies (a product team's line, a
data team's branch, a platform team's gated loop). The Head Office chooses
one; it flies down from the top level and becomes the assembly line.

**Distribution is the Catalog Marketplace**: a hub on neutral ground between our
plant and the far plants. One Catalog Marketplace serves MANY factories; imports
arrive from the internet, vendors, and other plants; proven components flow
back out; our Head Office CONSUMES from it (it stocks the component catalog, which feeds the
foundry).

The factory is **one connected flow** carried by **LEGO-style products**:
each input starts a product base at a funnel; the experience cell adds the
first part; every station room adds one more at its front window; a finished
recognizable object (rocket, bridge, house, robot, rover, one per input
chute) ships out the dock. Products arrive on a fixed cadence: every journey
is padded to the same total duration and spawns on a fixed interval.

Below the floor sits **one connected service network**: color-coded trunks
from each foundation layer converge on a central spine, risers feed every
room, conduits feed the cells and dock, and cross-links join the layers
(patterns to toolkits, pipes to capability, knowledge to both). The
**Pattern Shop** (Standards & Patterns) keeps master patterns on stands and
stamps identical copies with a press. **Infrastructure is the structure
itself**: screen 18 x-rays the building one system per keypress (slab and
columns, the belts, the basement machine room, the wire network).

The finale re-builds the same factory at three depths, changing both which
components exist and who occupies the rooms. Thesis: the gap is not a
missing tool, it is the missing picture.

The talk site is a self-contained artifact under `talk/` with its own accent
palette.

## The metaphor map

| BOM component            | Factory counterpart                                          |
|--------------------------|--------------------------------------------------------------|
| Continuous Inputs        | Intake gate: five funnels starting worded product bases on a collector belt |
| Experience Layer         | Three cells: IDE desk (engineer in t-shirt + agent, Claude-style icon on screen), Portal kiosk (suit, browser chrome on screen), Autonomous dock (robot only, no label needed) |
| Lifecycle Config         | The Head Office: the business creates the factory; catalog covers the east wall inside |
| The Meta Workflow        | The Workflow Foundry beside the office: candidate topologies assemble in place; the chosen one flies to the factory floor |
| Self-Continuous SDLC     | The line: seven glass-fronted station rooms behind the belt, nameplates on the rooms, products gain a part at each window |
| Agent Layer              | The occupants: people-only, agent-only, and mixed rooms, plus cloud agents and specialists on the floor |
| Capability Layer         | Toolkit racks below the floor, tapped into the network        |
| Standards & Patterns     | The Pattern Shop: master patterns on stands + a stamping press |
| Integration (MCP)        | Pipes anchored to the building via flanged wall penetrations  |
| Knowledge Layer          | The parts warehouse, provenance beacons, trunk into the spine |
| Distribution             | The Catalog Marketplace: neutral-ground hub serving many factories    |
| Infrastructure           | The structure itself: slab/columns, belts, machine room, wires |
| Governance               | Access arches with badge readers at the entrances, quality gates between stations, sign-off masts on the mixed rooms, an audit ledger tower collecting red record threads |
| Measurement              | Green sensor threads converging on a dashboard, feed line back to intake |
| Outcome                  | Finished products shipping out the dock                      |

Numbers appear ONLY on the screen-3 construction plan (it is the printed
parts list). No in-world label or HUD kicker carries a number.

## Site plan

- **The ground**: night grass terrain with a paved lot (plinth + survey
  grid) under the plant and a pad under the Catalog Marketplace. Street level is
  y 0; the lot surface is y -12; terrain is y -13.6. Everything visibly
  stands on something.
- **The factory** (center): plant shell on the paved lot; intake wall at the
  back; three experience cells mid-floor; the belt at z 0 with the station
  rooms BEHIND it (products ride past the rooms, never through them); loop
  conveyor; dock at the front; the connected basement below.
- **The top level**: a deck on tall columns over the back of the plant,
  directly above the intake wall. The Head Office (leadership figures,
  direction screens, catalog wall inside) stands on its west half; the
  foundry hall rises beside it on the east half at screen 8. Amber feed
  pipes run from the office front into the goals and direction funnels.
- **The Catalog Marketplace**: pad on neutral ground north-west of the plant,
  between our factory and the far plants. The hub is a sealed black-box
  plant at our factory's scale: glowing seams, its name on the walls, roof
  vents and stack, a rooftop drone port, and in/out conveyors where
  components enter one face and emerge from the other; a storefront shelf
  and drone pads surround it. The internet node sits on the horizon beyond
  it.
  The internet node sits on the horizon beyond it.

## Experience structure: six acts, 23 screens

- **Act I: The Empty Lot** (1-3) title, the problem, the BOM idea
- **Act II: The Line** (4-10) Head Office, intake, cells, catalog, foundry,
  the line, the loop
- **Act III: On & Under the Floor** (11-16) occupants, the connected dive,
  toolkits, pattern shop, pipes, warehouse
- **Act IV: Beyond One Plant** (17-18) the Catalog Marketplace, the structure itself
- **Act V: The Invisible Systems** (19-20) governance, measurement
- **Act VI: The Picture** (21-23) full plant orbit, Choose Your Build, close

Screens 8 (five sub-steps: foundry, three compositions, choose), 9 (seven
rooms), 18 (four x-ray systems), 19 (four governance mechanisms), and 22
(four profiles) have sub-steps.

## Screen-by-screen

1. **Title.** Night, the paved empty lot on grass, holographic sign.
2. **The Problem.** "Easy to start, hard to hold together": four starter
   rigs on floor tiles that slowly drift and re-arrange beneath them; the
   ground literally never stops moving.
3. **The Idea.** A landscape construction plan on millimeter paper, opened
   like a scroll on the lot: mock structural elevation and plan of the
   factory with dimension lines, leader annotations naming the components,
   title block and revision table. Deliberately dense. The color system is
   called out here once. No other geometry competes with the page.
4. **First, the Head Office.** The top-level deck rises over the back of
   the lot with the office on it: tech and non-tech leadership at the amber
   direction screens. They are creating the factory. Nothing else on the
   deck yet.
5. **Intake Gate.** Funnels drop worded product bases on a steady rhythm;
   each input starts a product.
6. **Three Ways In.** Bigger cells; the labels live ON the screens (Claude
   starburst + IDE, browser chrome + Portal); the Autonomous dock has no
   label at all. Engineer in shorts and t-shirt; Portal user in a suit.
7. **Inside the Head Office.** The catalog materializes covering the east
   wall, facing into the room. No floating catalog label.
8. **The Meta Workflow.** Foundry rises; candidates assemble IN PLACE, one
   block after another with flow arrows drawing: line, branch, gated loop,
   side by side, inside the hall. Choose one: pull-back camera and the
   chosen workflow flies to the factory floor.
9. **The Line.** Each block becomes a glass-fronted room with its nameplate
   on the front and occupants inside; the belt runs in front; products dwell
   at each window and gain a part. No construction effect for the line: it
   rises from the workflow blocks.
10. **The Loop.** Return conveyor; finished products ship; signals ride back.
11. **The Occupants.** Camera along the rooms: people-only, agent-only,
    mixed; cloud agents and specialists on the open floor.
12. **The Dive.** The connected basement: color-coded trunks into the spine,
    risers into every room, conduits to cells and dock, pulses flowing up;
    basement walls and the machine room give it structure.
13. **The Toolkits.** Racks tapped into the capability trunk; Catalog Marketplace
    supply arrives later.
14. **The Pattern Shop.** Master patterns on stands, the press stamping
    identical copies, cross-link to the toolkits.
15. **The Pipes.** Context/Action/Observe, anchored to the building, legs to
    the ground, feeding the spine; the word "pipes" appears once in copy.
16. **The Warehouse.** Shelves with provenance beacons, trunk into the
    spine, cross-links to pipes and capability.
17. **The Catalog Marketplace.** Neutral-ground hub: drones to many plants, imports
    from the internet and vendors, a consume route to our catalog, and the
    underground supply main into the spine (foundry evolution 2: blocks come
    from here).
18. **The Structure Itself.** Four x-ray sub-steps: slab and columns, the
    belts, the machine room, the wires. Everything else dims; a single tag
    names each system.
19. **Governance.** Four sub-steps, one mechanism per press: access arches
    with badge readers at the cells, intake, and pipes entrances; quality
    gates between the stations; sign-off masts on the mixed rooms; the audit
    ledger tower with red record threads. Everything else dims; a single tag
    names each mechanism.
20. **Measurement.** Threads from every layer to the dashboard; feed line
    back to the intake.
21. **The Full Plant.** Slow orbit; band labels return; everything running.
22. **Choose Your Build.** Full BOM plus three profiles; components re-light
    AND room occupancy changes (startup people-heavy, scale-up balanced,
    enterprise agent-heavy with humans at Define and Verify). The head
    office and catalog stay lit for every profile.
23. **Close.** Finished products ship into the dark. Speaker contact.

## Visual direction

- Physically-based night factory on grass with paved surfaces; restrained
  envMapIntensity; procedural noise albedo and roughness on large surfaces;
  fog blends terrain into the sky. Glow is reserved for what matters.
- Post chain: linear HDR render into an MSAA half-float target, subtle
  UnrealBloom, gentle vignette, OutputPass tone mapping (ACES). Emissive
  accents are the bloom sources; text never blooms.
- **One label language.** In-world labels share the HUD panel system: dark
  plate, thin line border, component-colored left accent bar. Labels render
  on a dedicated layer after the post chain so text stays crisp.
- **Text on structures where the thing is the point**: station names are lit
  nameplates on the rooms; experience labels are drawn on the computer
  screens themselves; the Autonomous cell needs no text at all.
- **Glow hierarchy.** The narrative subject glows; supporting structure
  carries deliberate low-emissive trim; background stays dim on purpose.
- **Component births materialize in place** (short rise + fade with a glow
  pulse). Nothing flies except the chosen workflow and the Catalog Marketplace
  drones, which are the story.
- **HUD chrome uses two corner radii** (8px compact, 16px content); chips
  are pills. FHD projection scale at 1700px+ (larger type, single-row dots,
  notes bar anchored bottom-right clear of the card).
- One fixed color per component for the whole talk, called out once on
  screen 3.
- Typography: Space Grotesk (vendored woff2) everywhere.
- Continuous single scene; the camera flies between shots, never cuts.

## Technical design

- `talk/index.html` + `talk/js/` modules + vendored three r160 with matching
  post-processing addons under `vendor/`. Fully offline, served with
  `python3 -m http.server`.
- Step engine: ordered steps with camera shot, world state, overlay content,
  sub-steps; sub-steps may carry their own camera (screen 8 choose). World
  visibility is a pure function of screen number (bornAt/dieAt per group);
  newly born groups materialize in place; the line group is excluded (rooms
  pop per keypress).
- Factor composition: material opacity/emissive = base x profile mode x
  infra focus x birth factor. Each dynamic system (labels, products,
  occupants, meta blocks) owns object visibility; ghosting never touches
  `object.visible`.
- Journeys: 8 slots (chutes round-robin), uniform speed, every path padded
  to one total duration, fixed spawn interval; products fade politely where
  the buildable road ends and never re-flash. Parts pop with a short pulse
  at each dwell.
- The screen-3 plan sheet, experience screens, room nameplates, grass and
  roughness maps are all procedural canvas textures (offline).
- Screens 18 and 19 share one focus mechanism (`setInfraFocus` /
  `setGovFocus`): dim all groups except the highlighted set, show one tag
  sprite per sub-step. A focus owner guard keeps the two setters from
  clobbering each other, since both are called on every screen change.
- Controls: Right/Space next, Left previous, drag rotates around the shot
  focus, scroll zooms, `O` orbit, `N` notes, `T` theme, `1-6` act jump,
  `R` reset, URL hash restores position. Clicking never advances.
- Theme: dark (night plant) is the default; `T` flips to a clear sunny
  day and persists via localStorage. Day swaps the sky, thins the fog to
  a whisper, brightens the ambient rig and the sun, raises the bloom
  threshold above the sky's luminance, turns the vignette off (it mixes
  corners toward grey, which reads as mist on a light frame), switches
  additive holograms to normal blending and darkens edge accents. HUD
  chrome swaps via CSS variables; material palettes, in-world signage
  and label plates are shared by both themes.
- Dimming (profile ghosts, x-ray focus): at night components fade toward
  black, reading as lights turning off. Under daylight nothing "turns
  off", so dimmed components instead desaturate toward clay grey at
  moderate opacity: still present, clearly not built. Dimmed materials
  also stop writing depth, or mis-sorted translucent boxes cut sky-white
  holes through the scene.
- Render passes: fully-opaque materials live in the opaque pass; every
  runtime opacity change goes through setFade so a material hops passes
  as it dims. Keeping the whole plant transparent made the per-frame
  distance sort reshuffle big boxes during camera flights (tearing, and
  materializing pillars hiding behind the grass until birth finished).
  Births keep writing depth so buildings fade in solid, not as x-rays.
- Profiles re-light via material modes and swap room occupancy sets; the
  startup profile keeps the Head Office and catalog lit and one measurement
  thread alive.
- Failure mode: without WebGL the overlay cards still step through.

## Content rules

- Genericized: no internal Mantel system names. APRA appears once as the
  enterprise profile's example regulator.
- Naming system: **the Head Office** (the business creates the factory),
  the **component catalog** (the org's catalog wall), the **Workflow
  Foundry** with **The Meta Workflow** ("the workflow that builds your
  workflows"), **workflow blocks**, **the Pattern Shop** (standards), and
  **the Catalog Marketplace** (distribution; serves many factories; the Head Office
  consumes from it). "Cell" is never repeated in labels; "roaming unit" is
  retired (use cloud agent). The agent layer naming gets a dedicated later
  pass with Roman.
- No numbers in labels or kickers (screen-3 sheet only). No em dashes or en
  dashes anywhere in content or code.
