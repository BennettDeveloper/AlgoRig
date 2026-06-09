export const ROBOT_VARIANTS = {
  // TIER 1
  'BoltJr':      { headShape: 'box',     torsoShape: 'box',     legShape: 'box' },
  'GlitchBot':   { headShape: 'angular', torsoShape: 'box',     legShape: 'box' },
  'NanoUnit':    { headShape: 'dome',    torsoShape: 'hex',     legShape: 'box' },
  'RustBucket':  { headShape: 'visor',   torsoShape: 'box',     legShape: 'box' },
  'Sparky':      { headShape: 'box',     torsoShape: 'box',     legShape: 'tapered' },

  // TIER 2
  'ByteBlade':   { headShape: 'angular', torsoShape: 'box',     legShape: 'tapered' },
  'IronClad':    { headShape: 'visor',   torsoShape: 'hex',     legShape: 'box' },
  'PatchBot':    { headShape: 'dome',    torsoShape: 'box',     legShape: 'box' },
  'SurgeUnit':   { headShape: 'angular', torsoShape: 'diamond', legShape: 'box' },
  'SwiftStrike': { headShape: 'dome',    torsoShape: 'box',     legShape: 'tapered' },
  'WallBot':     { headShape: 'visor',   torsoShape: 'box',     legShape: 'box' },

  // TIER 3
  'CrimsonCore': { headShape: 'angular', torsoShape: 'diamond', legShape: 'box' },
  'GhostCPU':    { headShape: 'dome',    torsoShape: 'hex',     legShape: 'tapered' },
  'IceWall':     { headShape: 'visor',   torsoShape: 'box',     legShape: 'box' },
  'MedBay':      { headShape: 'dome',    torsoShape: 'box',     legShape: 'box' },
  'ThunderBolt': { headShape: 'box',     torsoShape: 'hex',     legShape: 'tapered' },
  'VirusX':      { headShape: 'angular', torsoShape: 'diamond', legShape: 'tapered' },
  'GridLock':    { headShape: 'visor',   torsoShape: 'hex',     legShape: 'box' },

  // TIER 4
  'NovaBlade':   { headShape: 'angular', torsoShape: 'diamond', legShape: 'tapered' },
  'PhantomOS':   { headShape: 'dome',    torsoShape: 'hex',     legShape: 'tapered' },
  'PulseHealer': { headShape: 'dome',    torsoShape: 'box',     legShape: 'box' },
  'StormRider':  { headShape: 'angular', torsoShape: 'box',     legShape: 'tapered' },
  'TitanShell':  { headShape: 'visor',   torsoShape: 'hex',     legShape: 'box' },

  // TIER 5
  'AbsoluteZero':{ headShape: 'visor',   torsoShape: 'hex',     legShape: 'box' },
  'HyperStrike': { headShape: 'dome',    torsoShape: 'box',     legShape: 'tapered' },
  'NetReaper':   { headShape: 'angular', torsoShape: 'diamond', legShape: 'tapered' },
  'OmegaCore':   { headShape: 'box',     torsoShape: 'hex',     legShape: 'box' },
  'VoidWalker':  { headShape: 'dome',    torsoShape: 'diamond', legShape: 'tapered' },
}

export function getRobotVariant(robotName) {
  return ROBOT_VARIANTS[robotName] || null
}
