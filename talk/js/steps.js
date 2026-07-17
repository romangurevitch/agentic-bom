// The 23 screens: overlay content, camera shots, substeps, speaker notes.
// Bullets follow talk/SCRIPT.md and talk/DESIGN.md; keep them in sync.
// Notes are plain dot points that explain the screen and add context beyond
// the bullets, so a reader who was not in the room can follow the argument.
// They never narrate what is already visible on screen.

const C = {
  input: '#6ee7b7', exp: '#60a5fa', life: '#f59e0b', sdlc: '#f472b6',
  agent: '#38bdf8', cap: '#34d399', std: '#fbbf24', int: '#c084fc',
  know: '#22d3ee', dist: '#fb7185', infra: '#94a3b8', gov: '#ef4444',
  meas: '#10b981', outcome: '#facc15', ink: '#e6edf3',
};

export const ACTS = [
  'The Empty Lot', 'The Line', 'On & Under the Floor',
  'Beyond One Plant', 'The Invisible Systems', 'The Picture',
];

export const STEPS = [
  {
    act: 1, accent: C.know, kicker: 'Welcome',
    title: 'We are going to build a factory',
    qr: { img: 'assets/qr.svg', title: 'Scan to open this deck', url: 'romangurevitch.github.io/agentic-bom' },
    bullets: [
      'A Bill of Materials for the agentic SDLC, assembled live',
      'You leave with a parts list to hold your own org against',
    ],
    notes: [
      'Agent adoption is everywhere, but few of us have a picture of what a full setup looks like, which makes it hard to plan or compare notes.',
      'This talk offers one attempt at that picture, as a parts list; a starting point to argue with, not a prescription.',
      'The deck stays online at the QR link, so every screen can be revisited later.',
    ],
    cam: { pos: [0, -5, 44], target: [0, -4.5, -6] },
  },
  {
    act: 1, accent: C.infra, kicker: 'The problem',
    title: 'Easy to start, hard to hold together',
    bullets: [
      'Everyone is adopting, and a coding agent takes an afternoon to set up',
      'Models, tools, patterns change faster than plans can',
      'The hard part is common ways of working, reusable components, and evolving them over time',
    ],
    notes: [
      'Getting started is quick; a coding agent takes an afternoon. The ground keeps moving though: models, tools and patterns change month to month.',
      'The harder question is how dozens of individually sensible quick starts become shared ways of working and reusable components, and who evolves them as things shift.',
    ],
    cam: { pos: [16, -3, 22], target: [0, -10, -2] },
  },
  {
    act: 1, accent: C.know, kicker: 'The idea',
    title: 'A Bill of Materials',
    bullets: [
      'Manufacturing solved this a century ago. Every part named, composed, load-bearing.',
      'A Bill of Materials for the agentic SDLC. This sheet is the outline; the full schema is bigger than a slide.',
      'Every component keeps its color for the whole talk, in the labels, the dots, the full plant',
      'The rest of the talk assembles the real picture, piece by piece',
    ],
    notes: [
      'Manufacturing hit the same wall: thousands of parts and no shared view. Their fix was the Bill of Materials: name every part, show how parts fit, mark what is load-bearing.',
      'Most of us have never seen our own agentic setup laid out, and that makes it hard to discuss, compare or plan.',
      'The sheet on screen is only the outline; the full schema is too dense for a slide. The factory built over the rest of the talk is the real picture, assembled piece by piece.',
      'It is offered as a checklist of decisions to debate, not a vendor pitch or a maturity model. The colors stay constant for the whole talk so each part can be followed.',
    ],
    cam: { pos: [6, 0.5, 52], target: [6, -0.4, 26] },
  },
  {
    act: 2, accent: C.life, kicker: 'The frame',
    title: 'First, the Head Office',
    bullets: [
      'Leadership decides what gets built and how: requirements, priorities, risk appetite',
      'Technical and non-technical leadership together, not an engineering side project',
      'They create the factory rather than run it: choose the workflows, define the definition of done, set the baseline',
    ],
    notes: [
      'Who should design the way of working: engineering alone, or the business as a whole?',
      'Team workflows, the definition of done and the mandatory baseline are business decisions; when engineering makes them alone, adoption tends to stay a side project that speeds up typing.',
      'Work enters at the intake wall and leaves at the shipping dock; everything else in the talk hangs off that line.',
    ],
    cam: { pos: [-36, 20, 0], target: [-14, 13.5, -27] },
  },
  {
    act: 2, accent: C.input, kicker: 'Continuous Inputs',
    title: 'The intake gate',
    bullets: [
      'Business goals · leadership direction · user feedback · telemetry & incidents · market & regulation',
      'Real inputs fall continuously: a Sev-2, an NPS dip, a CPS 230 update',
      'Each input starts a product, and every layer it passes adds a piece',
    ],
    notes: [
      'Real work rarely starts as a neat quarterly plan. It arrives continuously, as a Sev-2, an NPS dip, a CPS 230 update.',
      'Each of those becomes an input that starts a product, collecting a piece at every layer until it ships.',
      'Leadership direction enters through the same gate as telemetry and market changes, as an input to the system rather than a memo beside it.',
    ],
    cam: { pos: [6, 30, 8], target: [-2, 9, -21] },
  },
  {
    act: 2, accent: C.exp, kicker: 'Experience Layer',
    title: 'Three ways in',
    bullets: [
      'IDE: an engineer and their agent, terminal and editor',
      'Portal: everyone else, through a browser',
      'Autonomous: nobody. The incident routes straight to an agent.',
      'If only engineers have a way in, you automated a team, not an SDLC',
    ],
    notes: [
      'Most agent setups only have a door for engineers, which quietly limits adoption to one team.',
      'Here there are three ways in: the IDE for engineers, a portal for BAs, PMs, security and design, and an autonomous path where an incident goes straight to an agent.',
      'Who cannot reach your agents today, and what would their door look like?',
    ],
    cam: { pos: [0, 17, 21], target: [0, 1.2, -9] },
  },
  {
    act: 2, accent: C.life, kicker: 'Lifecycle Configuration',
    title: 'Inside the Head Office',
    bullets: [
      'The way of working is decided here: lifecycle profiles, role playbooks, outcome definitions, the mandatory baseline',
      'The wall rack is the component catalog: workflow blocks, skills, templates, connectors. Unique to the org.',
      'Catalog blocks chain into whole team workflows; the assembly happens next door in the foundry',
    ],
    notes: [
      'Ways of working usually live in habits and stale wiki pages, and agents cannot use either.',
      'The Head Office makes those decisions explicit in one place: lifecycle profiles per domain, role playbooks, outcome definitions written before work starts, and a mandatory baseline.',
      'The catalog on the wall holds the building blocks; where they are stocked from is covered at the Catalog Marketplace, later in the talk.',
    ],
    cam: { pos: [-38, 18, -7], target: [-15, 15, -28] },
  },
  {
    act: 2, accent: C.life, kicker: 'At the Workflow Foundry',
    title: 'The Meta Workflow',
    bullets: [
      '"The workflow that builds your workflows"',
      'Every team composes its own shape from the same catalog blocks: a line, a branch, a gated loop',
      'Teams stop inheriting process by accident; each workflow is assembled, versioned, owned',
      'An agent can only drive a workflow that is explicitly described',
    ],
    substeps: 5,
    subLabels: ['The foundry', 'Product team', 'Data team', 'Platform team', 'Choose one'],
    onSubstep: (world, sub) => world.setMetaState(8, sub),
    subCams: { 4: { pos: [40, 38, 26], target: [10, 7, -13] } },
    notes: [
      'Team workflows mostly grow by accident, inherited from whoever set things up first.',
      'The foundry assembles them instead from shared blocks, versioned and owned, because a product team, a data team and a platform team genuinely need different shapes.',
      'It matters for a practical reason: an agent can only drive a workflow that is explicitly described, and a way of working that lives in habits is invisible to it.',
    ],
    cam: { pos: [10, 34, 1], target: [7, 13.5, -27] },
  },
  {
    act: 2, accent: C.sdlc, kicker: 'Self-Continuous SDLC',
    title: 'The line, built from the chosen workflow',
    bullets: [
      'Define · Design · Build · Verify · Release · Operate · Measure',
      'Every station leaves an explicit, checkable artifact: acceptance criteria, ADRs, evals, gates',
      'Verify needs evaluation criteria for agent output, not just green CI',
    ],
    substeps: 7,
    subLabels: ['Define', 'Design', 'Build', 'Verify', 'Release', 'Operate', 'Measure'],
    onSubstep: (world, sub) => world.setStationCount(sub + 1),
    notes: [
      'Each station leaves an artifact that can be checked: acceptance criteria in Define, ADRs in Design, evals in Verify, gated templates in Release, traces in Operate, metrics in Measure.',
      'Explicit artifacts are what let agents carry the work, and what let humans audit it afterwards.',
      'Verify is an honest gap in most of our orgs: green CI says the build did not break, but says nothing about whether agent output is right. That needs its own evaluation criteria.',
    ],
    cam: { pos: [0, 20, 34], target: [0, 3, -1] },
  },
  {
    act: 2, accent: C.sdlc, kicker: 'The phrase that matters',
    title: 'The loop',
    bullets: [
      'The return conveyor carries Measure back into Define',
      'What you measure after shipping becomes what you define next',
      'AI-assisted means humans drive every step, slightly faster. Self-continuous means the system carries the work and humans govern it.',
    ],
    notes: [
      'Does your pipeline end when the thing ships, or does what you learn feed the next cycle?',
      'Here the measurements ride back to intake and become next quarter’s inputs.',
      'AI-assisted means humans drive every step a bit faster; self-continuous means the system carries work between stages while humans govern it.',
    ],
    cam: { pos: [14, 24, 30], target: [0, 2, 3] },
  },
  {
    act: 3, accent: C.agent, kicker: 'Agent Layer',
    title: 'The occupants',
    bullets: [
      'Define holds only people; judgment and intent live there',
      'Build, Release, and Operate hold only agents, work that runs unattended',
      'Design, Verify, and Measure are mixed; a human signs off with an agent beside them',
      'The mix per room is a CHOICE, set by workflow type and maturity, not an accident',
    ],
    notes: [
      'The mix shown here is one answer, not the answer: judgment and intent stay human in Define, unattended work suits Build, Release and Operate, and the mixed rooms pair an agent with a human sign-off.',
      'The mix shifts with workflow type and maturity; the Choose Your Build screen later shows the same rooms staffed three different ways.',
      'Which rooms would you leave to agents today, and what evidence would change your answer?',
    ],
    cam: { pos: [22, 10, 22], target: [-10, 1.5, -3] },
  },
  {
    act: 3, accent: C.ink, kicker: 'The Foundation',
    title: 'Under the floor',
    bullets: [
      'Four foundation layers: capability, standards & patterns, integration, knowledge',
      'Shared services every stage draws on, not per-team copies',
      'The layers feed each other: skills use standards, integrations ground on knowledge',
    ],
    notes: [
      'Without shared foundations, every team builds its own skills, standards, integrations and knowledge, again and again.',
      'The four layers under the floor are shared services every stage draws on, and they feed each other: skills use standards, integrations ground on knowledge.',
      'The next four screens take them one at a time.',
    ],
    cam: { pos: [-26, -2, 32], target: [0, -7, -2] },
  },
  {
    act: 3, accent: C.cap, kicker: 'Capability Layer',
    title: 'The toolkits',
    bullets: [
      'What agents know how to do, the verbs of the factory',
      'Skills · playbooks · agent instructions, each tapped into the network',
      'Versioned, reviewed, discoverable. Like production code.',
      'They sync with the Catalog Marketplace; we get there soon',
    ],
    notes: [
      'Where do your prompts and playbooks live today? If the answer is personal notes apps, nobody else can find, review or improve them.',
      'Capabilities (skills, playbooks, agent instructions) deserve the treatment we already give production code: versioned, reviewed, discoverable.',
      'The racks sync with the Catalog Marketplace, so proven skills can flow between teams and orgs.',
    ],
    cam: { pos: [0, -4, 14], target: [0, -10, -7.5] },
  },
  {
    act: 3, accent: C.std, kicker: 'Standards & Patterns',
    title: 'The Pattern Shop',
    bullets: [
      'Master patterns on stands: code, deploy, architecture, evaluation',
      'The press stamps identical copies. That is what a standard is.',
      'Wired into the toolkits, because skills USE the patterns',
      'Published as artifacts. Tribal knowledge is invisible to an agent.',
    ],
    notes: [
      'In most orgs, standards live as tribal knowledge, and tribal knowledge is invisible to an agent.',
      'The pattern shop turns them into artifacts: code templates, deployment templates, architecture patterns, evaluation criteria; identical copies stamped from one master.',
      'Skills lean on these patterns, which is why the two layers are wired together.',
    ],
    cam: { pos: [4, -3.3, 30.4], target: [1, -13.5, 9.1] },
  },
  {
    act: 3, accent: C.int, kicker: 'Integration Layer · MCP',
    title: 'The pipes',
    bullets: [
      'Three pipes into one hub on the plant: Context reads, Action writes, Observe reports',
      'Context: read-only grounding · Action: scoped, time-bound · Observe: traces and evals out',
      'An approved menu of connections; every one scoped, audited, revocable',
    ],
    notes: [
      'Integration is where agent risk gets real, so the model splits it into three verbs: Context reads for grounding, Action performs scoped and time-bound writes, Observe carries traces and evals out.',
      'An approved menu of connections saves every team re-discovering integration alone, and scoping, audit and revocation are what make agent writes safe enough to allow.',
      'How wide should that menu be, and who curates it? Both are worth debating.',
    ],
    cam: { pos: [22, 6, 32], target: [48, -11, 6] },
  },
  {
    act: 3, accent: C.know, kicker: 'Knowledge Layer',
    title: 'The warehouse',
    bullets: [
      'Code & architecture truth · internal knowledge · process & standards · bounded external docs',
      'Provenance and freshness labels on every shelf',
      'Answers what is true and current once, for every project; wired to the pipes and the toolkits',
    ],
    notes: [
      'We have all seen an agent ground on a stale or unlabeled document and be confidently wrong.',
      'The warehouse counters that with a defined set of sources (code and architecture truth, internal knowledge, process and standards, bounded external docs), each carrying provenance and freshness labels.',
      'What is true and current gets answered once for the org, instead of once per project.',
    ],
    cam: { pos: [-36, -1, 22], target: [-56, -8, 0] },
  },
  {
    act: 4, accent: C.dist, kicker: 'Distribution',
    title: 'The Catalog Marketplace',
    bullets: [
      'One Catalog Marketplace serves MANY factories; ours is just one plant on its spokes',
      'Imports arrive from the internet, vendors, other plants; proven components flow back out',
      'The Head Office CONSUMES from it: components land in our catalog, and the catalog feeds the foundry',
      'One good plant is a pilot. Components moving between plants is an operating model.',
    ],
    notes: [
      'One good plant is a pilot; the harder and more interesting question is how proven components move between plants.',
      'The marketplace is one answer: neutral ground where imports arrive from the internet, vendors and other plants, and proven components flow back out. It stocks the Head Office catalog and syncs the basement racks.',
      'For your org this might be a repo and a review process rather than a platform; the point is that the flow exists and someone owns it.',
    ],
    cam: { pos: [36, 52, -18], target: [-58, 2, -76] },
  },
  {
    act: 4, accent: C.infra, kicker: 'Infrastructure',
    title: 'The structure itself',
    bullets: [
      'CI/CD, agent runtime, data pipelines, compute & hosting: you already own all four',
      'The slab and columns · the belts · the machine room · the wires',
      'The BOM claims what you already own. It replaces nothing.',
    ],
    substeps: 4,
    subLabels: ['Compute & hosting', 'CI/CD pipelines', 'Agent runtime', 'Data pipeline'],
    chipMode: 'single',
    onSubstep: (world, sub) => world.setInfraFocus(sub),
    notes: [
      'This all stands on infrastructure most orgs already own: compute and hosting, CI/CD pipelines, an agent runtime, data pipelines. The pipelines literally are the conveyors.',
      'The BOM claims what exists and replaces nothing, so an adoption plan that opens with "first we replatform" deserves a hard look.',
    ],
    cam: { pos: [-34, 8, 42], target: [0, -5, -2] },
  },
  {
    act: 5, accent: C.gov, kicker: 'Cross-cutting · Governance',
    title: 'The scanners',
    bullets: [
      'Access control at the entrances: who, or which agent, can do what, where, for how long',
      'Quality gates between every pair of stations; decision rules for human sign-off in the mixed rooms',
      'Audit: every gate verdict and sign-off streams to one ledger, recorded and replayable',
      'Embedded at every stage, not a checkpoint at the end; it is what lets you say yes to autonomy',
    ],
    substeps: 4,
    subLabels: ['Access control', 'Quality gates', 'Decision rules', 'Audit'],
    chipMode: 'single',
    onSubstep: (world, sub) => world.setGovFocus(sub),
    subCams: {
      0: { pos: [28, 17, 15], target: [0, 4, -13] },
      1: { pos: [28, 8, 18], target: [0, 2.2, -1] },
      2: { pos: [24, 14, 18], target: [2, 4.5, -4] },
      3: { pos: [42, 14, 8], target: [21, 4, -6] },
    },
    notes: [
      'Governance usually arrives as a checkpoint at the end, where all it can do is say no. Embedded at every stage, it becomes what lets you say yes to autonomy.',
      'Access control decides who, or which agent, can do what, where, for how long; quality gates sit between stations; decision rules encode human sign-off; one audit ledger keeps every verdict replayable.',
      'Could you replay how any given change was approved? If not, unattended agents will be a hard sell.',
    ],
    cam: { pos: [0, 26, 40], target: [0, 4, -2] },
  },
  {
    act: 5, accent: C.meas, kicker: 'Cross-cutting · Measurement',
    title: 'The sensors',
    bullets: [
      'Adoption: who uses which components, with what friction',
      'Impact: cycle time, quality, cost. Demand: where autonomy pays vs where a human is cheaper.',
      'Outcome validation: what shipped, checked against the outcome definition it was built to',
      'Those numbers ride back to the intake as next quarter’s inputs. Without this line, AI-assisted; with it, self-continuous.',
    ],
    notes: [
      'Measurement is the part most adoption efforts skip, and without it nobody can say whether any of this is actually working.',
      'Four things worth measuring: adoption (who uses what, with what friction), impact (cycle time, quality, cost), demand (where autonomy pays versus where a human is cheaper), and outcomes against the definitions written up front.',
      'The feed back to intake is what turns measurement from reporting theatre into next quarter’s inputs.',
    ],
    cam: { pos: [-14, 13, 9], target: [-24, 8.5, -15] },
  },
  {
    act: 6, accent: C.ink, kicker: 'The shared picture',
    title: 'The full plant',
    bullets: [
      'Eleven components, two systems over the top, one loop',
      'No single component is novel; the leverage is the wiring between them',
      'Most adoption efforts are not missing parts. They are missing the parts list.',
    ],
    notes: [
      'Nothing on this page is novel on its own; the argument is that the value sits in the wiring, work carried end to end.',
      'Most adoption efforts are not missing parts, they are missing a shared picture of the parts. This one is offered as that picture, to be argued with.',
    ],
    cam: { pos: [58, 46, 48], target: [2, 2, -14] },
    orbit: true,
  },
  {
    act: 6, accent: C.outcome, kicker: 'Same BOM, three factories',
    title: 'Choose your build',
    bullets: [
      '"We cannot build all that." Correct. You should not.',
      'Same Head Office, same catalog, three different factories',
      'Components re-light per profile, AND the people-to-agent mix inside the rooms changes',
      'Every box considered, even if the decision is one file',
    ],
    substeps: 4,
    subLabels: ['Full BOM', 'Garage Startup', 'Scale-up', 'Regulated Enterprise'],
    chipMode: 'single',
    profiles: [null, 'startup', 'scaleup', 'enterprise'],
    notes: [
      'Nobody can build all of this, and nobody should.',
      'Three honest builds from the same list: a garage startup keeps people in most rooms with one agent, a slim skills folder, one pipe, one metric; a scale-up lights the line and puts governance on the risky pipes; a regulated enterprise (think APRA) runs agent-heavy rooms with humans at the gates and full audit.',
      'Consider every box, even when the decision is one file, and choose who staffs each room on purpose.',
    ],
    cam: { pos: [48, 52, 56], target: [2, 2, -10] },
  },
  {
    act: 6, accent: C.outcome, kicker: 'Close',
    title: 'Build your own factory',
    qr: { img: 'assets/qr-linkedin.svg', title: 'Connect on LinkedIn', url: 'linkedin.com/in/roman-gurevitch-781220aa' },
    bullets: [
      'Adopting tools is not building a factory. The factory is your SDLC, rebuilt around agents.',
      'Take the parts list home and hold your org against it: every component gets a deliberate depth, even if that depth is "one file"',
      'Compose your Meta Workflow on purpose: assembled, versioned, owned, never an accident',
      'Roman Gurevitch · Principal Software Engineer · Mantel',
    ],
    notes: [
      'The talk opened on an empty lot with "we are going to build a factory"; the close hands the job over.',
      'Hold your org against the parts list and give each component a deliberate depth, even if that depth is one file; then compose your Meta Workflow on purpose instead of letting it grow by accident.',
      'The QR goes to LinkedIn; the slide stays up through questions, and disagreement is welcome.',
    ],
    cam: { pos: [-10, 10, 46], target: [0, 2, 20] },
  },
];
