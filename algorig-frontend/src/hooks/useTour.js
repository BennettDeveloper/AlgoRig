import Shepherd from 'shepherd.js'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function buildTour(navigate) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      popperOptions: {
        modifiers: [{ name: 'offset', options: { offset: [0, 16] } }],
      },
    },
  })

  const back = { text: '← BACK', action: () => tour.back() }

  function primary(text) {
    return { text, classes: 'shepherd-button-primary', action: () => tour.next() }
  }

  // ── Step 1: Dashboard welcome (centered, no element) ─────────────────────
  tour.addStep({
    id: 'welcome',
    title: 'BOOT SEQUENCE INITIATED...',
    text: `
      <div class="tour-step-body">
        <p>Systems online. Neural core: <strong>active</strong>.</p>
        <p>I am your <strong>AlgoRig unit</strong> — a combat robot
        awaiting a PILOT. Without your commands, I am nothing but
        dormant steel.</p>
        <p>Allow me to walk you through my systems. By the end of this
        sequence, you will know how to <strong>program me to fight</strong>.</p>
        <p class="tour-hint">This will only take a moment, pilot.</p>
      </div>
    `,
    buttons: [primary('BEGIN SEQUENCE →')],
  })

  // ── Step 2: Navbar ────────────────────────────────────────────────────────
  tour.addStep({
    id: 'navbar',
    title: 'SYSTEM NAVIGATION ONLINE',
    text: `
      <div class="tour-step-body">
        <p>This is your <strong>command interface</strong>. Every system
        you need to operate me lives here.</p>
        <p>SCRIPTS. ROBOTS. BATTLES. LEADERBOARD. Learn these pathways —
        they are how you access my full potential.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="navbar"]', on: 'bottom' },
    beforeShowPromise: () => { navigate('/'); return delay(300) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 3: /robots tier filter ──────────────────────────────────────────
  tour.addStep({
    id: 'tier-filter',
    title: 'UNIT CLASSIFICATION: TIERS DETECTED',
    text: `
      <div class="tour-step-body">
        <p>We robots are classified into <strong>5 TIERS</strong> —
        from basic GRAY units to elite GOLD apex machines.</p>
        <p>Higher tier units like myself carry more powerful PASSIVE
        SUBROUTINES. But they require a more skilled pilot to deploy.</p>
        <p>Choose your unit wisely.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="tier-filter"]', on: 'bottom' },
    beforeShowPromise: () => { navigate('/robots'); return delay(400) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 4: /robots first robot card ─────────────────────────────────────
  tour.addStep({
    id: 'robot-card',
    title: 'PASSIVE SUBROUTINE DETECTED',
    text: `
      <div class="tour-step-body">
        <p>Every unit carries a <strong>PASSIVE ABILITY</strong> —
        a subroutine that activates automatically each turn.</p>
        <p>You cannot directly control it. But a smart pilot
        <strong>builds their SCRIPT around it</strong>.</p>
        <p>Hover over any unit card to inspect its passive.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="robot-card-first"]', on: 'right' },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 5: /scripts/new block palette ───────────────────────────────────
  tour.addStep({
    id: 'block-palette',
    title: 'SCRIPT EDITOR: COMMAND INPUT READY',
    text: `
      <div class="tour-step-body">
        <p>This is where you <strong>program my behavior</strong>.</p>
        <p>Drag COMMAND BLOCKS from the palette into the workspace.
        Each block becomes an instruction I execute in battle —
        in the exact order you define.</p>
        <p>I will follow your logic <strong>precisely</strong>.
        Choose wisely.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="block-palette"]', on: 'right' },
    beforeShowPromise: () => { navigate('/scripts/new'); return delay(600) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 6: IF / ELSE block ───────────────────────────────────────────────
  tour.addStep({
    id: 'block-if',
    title: 'CONDITIONAL LOGIC: IF / ELSE',
    text: `
      <div class="tour-step-body">
        <p>This is how you teach me to <strong>think</strong>.</p>
        <p><strong>IF</strong> a condition is true — I execute that branch.
        <strong>ELSE</strong> — I adapt and run the fallback.</p>
        <p>Example: <code>IF myBattery &gt; 30</code> → attack.
        <code>ELSE</code> → recharge and defend.</p>
        <p>Logic is my language. Speak it fluently.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="block-if"]', on: 'right' },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 7: SET / UPDATE blocks ───────────────────────────────────────────
  tour.addStep({
    id: 'block-set',
    title: 'MEMORY BANKS: SET / UPDATE',
    text: `
      <div class="tour-step-body">
        <p>Variables allow me to <strong>remember and calculate</strong>
        during combat.</p>
        <p><strong>SET</strong> initializes a value.
        <strong>UPDATE</strong> modifies it. You must SET before
        you UPDATE — just like real programming.</p>
        <p>Use my MEMORY BANKS to track thresholds, countdowns,
        and adaptive strategies.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="block-set"]', on: 'right' },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 8: /battles/new robot + script selectors ─────────────────────────
  tour.addStep({
    id: 'battle-selectors',
    title: 'BATTLE SYSTEMS: UNIT & SCRIPT ASSIGNMENT',
    text: `
      <div class="tour-step-body">
        <p>COMBAT CONFIGURATION REQUIRED.</p>
        <p>Select two units and assign each a SCRIPT. The battle
        engine will execute both scripts <strong>simultaneously</strong>,
        turn by turn, until one unit is destroyed or the turn
        limit is reached.</p>
        <p>Choose your opponent. Choose your strategy.
        Initiate combat.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="battle-selectors"]', on: 'bottom' },
    beforeShowPromise: () => { navigate('/battles/new'); return delay(600) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 9: Tier cap + turn limit ─────────────────────────────────────────
  tour.addStep({
    id: 'tier-cap',
    title: 'COMBAT PARAMETERS: TIER CAP & TURN LIMIT',
    text: `
      <div class="tour-step-body">
        <p><strong>TIER CAP</strong> restricts which units may enter
        combat. Higher caps allow stronger units — and greater risk.</p>
        <p><strong>TURN LIMIT</strong> caps the battle length.
        If neither unit is destroyed by the limit, the unit with
        more remaining HP wins.</p>
        <p>Warning: higher-tier units demand more advanced SCRIPTS.
        Grow stronger before you challenge what is above you.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="tier-cap"]', on: 'top' },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 10: /repository first script card ────────────────────────────────
  tour.addStep({
    id: 'repo-card',
    title: 'SCRIPT REPOSITORY: INTELLIGENCE DATABASE',
    text: `
      <div class="tour-step-body">
        <p>Other pilots have uploaded their SCRIPTS here for
        public analysis.</p>
        <p>Study them. Challenge them. If their logic is superior,
        learn from it. Each script is rated by
        <strong>win rate</strong> and <strong>difficulty</strong>
        — earned through real combat data.</p>
        <p>Knowledge of your enemy is a weapon.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="repo-card-first"]', on: 'right' },
    beforeShowPromise: () => { navigate('/repository'); return delay(400) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 11: /leaderboard rankings table ──────────────────────────────────
  tour.addStep({
    id: 'leaderboard',
    title: 'LEADERBOARD: COMBAT RANKINGS ONLINE',
    text: `
      <div class="tour-step-body">
        <p>The strongest pilots rise here.</p>
        <p>Rankings are determined by the <strong>combined win data
        of all public SCRIPTS</strong> a pilot owns. Total wins,
        win rate, and best streak — all tracked.</p>
        <p>Your name will appear here when your scripts
        prove themselves in battle.</p>
        <p>I intend to help you reach the top.</p>
      </div>
    `,
    attachTo: { element: '[data-tour="leaderboard-table"]', on: 'top' },
    beforeShowPromise: () => { navigate('/leaderboard'); return delay(400) },
    buttons: [back, primary('NEXT SYSTEM →')],
  })

  // ── Step 12: Finale (centered, no element) ────────────────────────────────
  tour.addStep({
    id: 'finale',
    title: 'BOOT SEQUENCE COMPLETE.',
    text: `
      <div class="tour-step-body">
        <p>All systems have been explained. You now understand
        my architecture.</p>
        <p>Write your first SCRIPT. Select your unit.
        Launch your first battle.</p>
        <p>I will execute every command you give me
        <strong>with precision</strong>.</p>
        <p class="tour-final">The question is, pilot —
        <strong>are YOU ready to command me?</strong></p>
      </div>
    `,
    beforeShowPromise: () => { navigate('/'); return delay(300) },
    buttons: [
      back,
      {
        text: 'I AM READY. ⚡',
        classes: 'shepherd-button-primary',
        action: () => tour.complete(),
      },
    ],
  })

  tour.on('complete', () => localStorage.setItem('algorig_tour_completed', 'true'))
  tour.on('cancel',   () => localStorage.setItem('algorig_tour_completed', 'true'))

  return tour
}
