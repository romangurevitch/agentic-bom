# BOM for Agentic Engineering: Speaker Script (dot points)

30-40 min. One block per screen. These notes are also loaded into the site's
speaker-notes strip (`N` key), step-synced.

## Act I: The Empty Lot

### 1. Title
- Welcome. I am Roman Gurevitch, Principal Software Engineer at Mantel.
- Tonight we build a factory, live, piece by piece.
- You leave with a complete parts list for agentic engineering, and a way to
  decide how much of it your org needs.

### 2. The Problem
- Everyone in this room is adopting agentic engineering, or trying to.
- Starting is the easy part; a coding agent takes an afternoon. Watch the
  ground under each quick start. It never stops moving.
- Models, tools, and patterns change month to month. Hard to plan against,
  hard to standardize on.
- So the hard part is not starting. It is common ways of working, reusable
  components, and evolving them as everything shifts.

### 3. The Idea: a Bill of Materials
- Manufacturing solved this a century ago with the Bill of Materials. Every
  part named, how parts compose, what is load-bearing.
- Here is the whole agentic SDLC on one page. It looks complex. That is
  exactly the point. You cannot hold your org against a list you have never
  seen.
- Every component keeps one color for the rest of the talk. The labels, the
  dots at the bottom right, the full plant at the end; the colors are the map.
- The rest of the talk breaks this page apart, piece by piece. Not a vendor
  pitch, not a maturity model.

## Act II: The Line

### 4. First, the Head Office
- Everything reads the same way. Input in at the intake, outcome out at the
  dock.
- Before any machinery, the Head Office rises as the TOP LEVEL, a deck above
  where the factory will stand.
- Inside it sits the business, technical and non-technical leadership. They
  define the requirements and what needs to be built.
- They are not going to run this factory. They are going to CREATE it.
  Everything you see tonight is decided up there.

### 5. Intake Gate: Continuous Inputs
- The first component is delivered. The intake gate, right under the head
  office.
- Five chutes: business goals; leadership direction; user feedback; telemetry
  and incidents; market and regulation.
- Watch the amber pipes. Goals and direction pour straight out of the head
  office into their funnels; direction never travels far.
- Read the labels. A Sev-2, an NPS dip, a CPS 230 update. Real inputs,
  arriving at a steady pace.
- And each input starts a PRODUCT. A base plate on the belt. Every layer it
  passes will add a piece. By the dock it will be a whole thing.

### 6. Experience: Three Ways In
- The collector belt feeds three very different setups. Look at the screens,
  not at me.
- IDE: an engineer, shorts and t-shirt, living in an editor with their agent.
- Portal: a BA, a PM, security, design; the suit. Same factory through a
  browser.
- Autonomous: nobody. An incident arrives and an agent picks it up. Agent to
  agent.
- If only engineers have a way in, you automated a team, not an SDLC.

### 7. Inside the Head Office
- Up to the top level, into the head office. The catalog just arrived on the
  wall.
- This is where the way of working is decided: lifecycle profiles per domain,
  role playbooks, outcome definitions written before work starts, the
  mandatory baseline every initiative meets.
- The wall rack is the component catalog: workflow blocks, skills, templates,
  connectors. Unique to the org.
- These blocks are not settings. They compose. And composition happens next
  door.

### 8. The Meta Workflow, at the Workflow Foundry
- Beside the head office on the top level stands the Workflow Foundry, a
  factory whose only product is workflows. Its name is The Meta Workflow, the
  workflow that builds your workflows.
- (Press) A product team’s workflow assembles, a clean line from Define to
  Measure.
- (Press) A data team’s BRANCHES, parallel model and eval paths that merge
  before publish.
- (Press) A platform team’s is a gated LOOP, heavy verify and release gates,
  and work that cycles back.
- Same catalog blocks. Visibly different shapes. That is the point of the
  foundry. Workflows become intentional and composed, instead of accreting by
  accident.
- (Press) the head office chooses one for our factory; it flies down from the
  top level and lays itself out where our line will stand.
- Because an agent can only drive a workflow that is explicitly described.
  Next, watch it become the line.

### 9. The Line, Built from the Chosen Workflow
- Back at our factory. The chosen workflow is laid out on the floor, and each
  block becomes a station ROOM. (One per press.)
- Define: intent and acceptance criteria, machine-readable enough to verify
  against.
- Design: architecture, ADRs, patterns from a catalogue. Build: implementation
  against explicit rules.
- Verify: tests plus evals; agent output needs evaluation criteria, not just
  green CI.
- Release: standard templates, gates wired in. Operate: run, trace, escalate.
- Measure: adoption, impact, demand. An input source, not reporting theatre.
- Watch a product. It stops at each window, the room adds its piece, and it
  moves on. People and agents are already inside; we meet them in a minute.

### 10. The Loop
- Watch the return conveyor. Measure feeds Define.
- Now the journey is complete. An input starts a product, the cells route it,
  every room adds a piece, and a FINISHED product ships out the dock. The
  signal rides back.
- Most orgs run a pipeline that ends. This line feeds itself.
- AI-assisted means humans drive every step slightly faster. Self-continuous
  means the system carries work between stages and humans govern it.

## Act III: On & Under the Floor

### 11. The Occupants
- Who actually runs this line? Look inside the rooms.
- One room holds only people. Define, where judgment and intent live.
- Some rooms hold only agents. Build, Release, Operate; work that runs
  unattended.
- Some rooms are mixed. Design, Measure, and Verify, where a human signs off
  with an agent beside them. Decision rules, made visible.
- On the open floor, cloud agents roam, and specialists (reviewer, evaluator)
  compose into flows.
- The people-to-agent mix per room is a CHOICE, set by workflow type and
  maturity, not an accident.

### 12. The Dive: Under the Floor
- Everything the workforce reaches for is down here, and it is CONNECTED.
- Each foundation layer runs a trunk into the central spine; risers carry it
  up into every room; wires feed the cells and the dock.
- Watch the pulses, data flowing up to the floors above. This basement is what
  makes the top floor look effortless.
- Four layers down here. (Camera dives.)

### 13. The Toolkits: Capability Layer
- What agents know how to do. The verbs.
- Skills, playbooks, agent instructions. Each rack taps into the green trunk;
  watch its pulses climb to the rooms above.
- Treat them like production code: versioned, reviewed, discoverable.
- A prompt in someone’s notes app is not a capability. And these racks will
  sync with the marketplace later; hold that thought.

### 14. The Pattern Shop: Standards & Patterns
- How good looks. The nouns. This is the Pattern Shop, where the master
  patterns live.
- Four masters on stands: code templates, deployment templates, architecture
  patterns, evaluation criteria. The press stamps identical copies; everything
  that comes out has the same shape. That is what a standard is.
- See the yellow link. The toolkits next door USE these patterns; skills
  ground on standards, and both feed the floors above.
- Agents use standards by default only if standards exist as artifacts. Tribal
  knowledge is invisible to an agent.

### 15. The Pipes: Integration Layer (MCP)
- How agents reach real systems. Three pipes plug into one header hub, and a
  single main runs through the wall into the spine.
- Context: read-only grounding. Action: scoped, time-bound writes. Observe:
  traces and evals out.
- An approved menu beats every team re-discovering integration. Valves on
  everything.

### 16. The Warehouse: Knowledge Layer
- What agents are allowed to ground on. The warehouse feeds the cyan trunk
  into the spine.
- Architecture truth, internal knowledge bases, process and standards, bounded
  external docs.
- Every shelf has provenance and freshness labels.
- And see the cross-links. Knowledge feeds the pipes and the toolkits; answer
  what is true and current once, not per project.

## Act IV: Beyond One Plant

### 17. The Marketplace: Distribution
- Zoom out. The marketplace stands on neutral ground, between our plant and
  the others. It does not belong to us.
- One marketplace, many factories. Watch the drones; spokes run to every plant
  on the horizon, and ours is just one of them.
- Imports arrive from the internet, from vendors, from other factories. Proven
  components flow back out.
- And our head office CONSUMES from it, marketplace to catalog to foundry. The
  workflow blocks you saw composing earlier? This is where they come from.
- One good plant is a pilot. Components moving between plants is an operating
  model.

### 18. Infrastructure: The Structure Itself
- (One press per system; everything else dims.)
- Compute and hosting: the slab and columns the whole plant stands on.
- CI/CD pipelines: the belts themselves. The pipelines ARE the conveyors you
  have been watching.
- Agent runtime: the machine room in the basement.
- Data pipeline: the wires and trunks carrying every signal.
- The BOM claims existing infrastructure; it does not replace it. If a plan
  starts with first-we-replatform, be suspicious.

## Act V: The Invisible Systems

### 19. Governance: The Scanners
- (Red arches snap on everywhere at once: stations, cells, intake, pipes.)
- Access control: who or which agent can do what, where, for how long.
- Quality gates between stations; decision rules for human sign-off; audit,
  recorded and replayable.
- Governance is a field over the whole plant, not a checkpoint at the end. It
  is what lets you say yes to autonomy, not the thing that says no.

### 20. Measurement: The Sensors
- (Green threads converge, then the feed line runs back to intake.)
- Adoption: who uses which components, with what friction.
- Impact: cycle time, quality, cost. Outcome validation against the outcome
  definition. Demand: where autonomy pays vs where a human is cheaper.
- The line back to the intake gate is the whole thesis. Without it,
  AI-assisted delivery. With it, self-continuous.

## Act VI: The Picture

### 21. The Full Plant
- (Slow orbit. Say little. Let it run.)
- Eleven components, two systems over the top, one loop. Head office, foundry,
  marketplace, and the plant, all wired together.
- Every piece is boring on its own. The value is the composition.
- This picture is what most adoption efforts are missing. Not the parts, the
  parts list.

### 22. Choose Your Build
- The obvious objection is that we cannot build all that. Correct. You should
  not.
- (Start on Full BOM: everything lit.) This is the complete parts list. Now
  watch what different orgs actually build from it.
- Same head office, same catalog, three different factories. Watch the
  components AND who is inside the rooms.
- (Select Garage Startup.) A simple line, people in most rooms with one agent
  helping. A coding agent, a slim skills folder, one pipe, one metric.
  Everything else a ghost, but every box considered; most implemented as a
  file, not a platform.
- (Select Scale-up.) The line fully lit, foundation at medium depth, agents in
  most rooms, governance on the risky pipes.
- (Select Regulated Enterprise, e.g. APRA-regulated.) The whole plant.
  Agent-heavy rooms with humans at the gates, multiple cells, full scanners,
  audit, evals, end-to-end sensors.
- The BOM is the same for everyone; the build is not, and neither is the mix
  of people and agents.

### 23. Close
- The gap in agentic engineering is not a missing tool. It is the missing
  picture.
- Take the parts list home. Hold your org against it. Decide each component’s
  depth deliberately, even if the decision is one file.
- And compose your Meta Workflow deliberately. Decide how your teams’
  workflows are built instead of letting them accrete.
- That is the difference between adopting tools and rebuilding the SDLC around
  agentic capability.
- (Thanks; name, Mantel, LinkedIn. Questions.)
