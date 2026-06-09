export const TIER_ORDER = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5']

export const TIER_BUDGETS = {
  TIER_1: 200, TIER_2: 270, TIER_3: 350, TIER_4: 440, TIER_5: 540,
}

export const STAT_FLOORS = {
  hp: 30, coreImpact: 5, exploitPower: 5, clockSpeed: 5,
  chassisArmor: 5, firewallStrength: 5, battery: 20,
}

export const FLOORS_TOTAL = 75

export const STAT_CEILINGS = {
  TIER_1: { hp: 80,  coreImpact: 20, exploitPower: 20, clockSpeed: 30, chassisArmor: 20, firewallStrength: 20, battery: 60  },
  TIER_2: { hp: 110, coreImpact: 35, exploitPower: 35, clockSpeed: 45, chassisArmor: 35, firewallStrength: 35, battery: 75  },
  TIER_3: { hp: 140, coreImpact: 50, exploitPower: 50, clockSpeed: 60, chassisArmor: 50, firewallStrength: 50, battery: 85  },
  TIER_4: { hp: 170, coreImpact: 65, exploitPower: 65, clockSpeed: 75, chassisArmor: 65, firewallStrength: 65, battery: 90  },
  TIER_5: { hp: 200, coreImpact: 80, exploitPower: 80, clockSpeed: 90, chassisArmor: 80, firewallStrength: 80, battery: 100 },
}

export const TIER_COLORS = {
  TIER_1: '#a1a5b4', TIER_2: '#22c55e', TIER_3: '#3b82f6',
  TIER_4: '#7c3aed', TIER_5: '#facc15',
}

export const TIER_LABELS = {
  TIER_1: 'Tier 1', TIER_2: 'Tier 2', TIER_3: 'Tier 3',
  TIER_4: 'Tier 4', TIER_5: 'Tier 5',
}

export const STAT_KEYS = ['hp', 'coreImpact', 'exploitPower', 'clockSpeed', 'chassisArmor', 'firewallStrength', 'battery']

export const STAT_LABELS = {
  hp: 'HP', coreImpact: 'Core Impact', exploitPower: 'Exploit Power',
  clockSpeed: 'Clock Speed', chassisArmor: 'Chassis Armor',
  firewallStrength: 'Firewall', battery: 'Battery',
}

export const PASSIVES_BY_TIER = {
  TIER_1: [
    { key: 'QUICK_REFLEXES',  name: 'Quick Reflexes',  desc: '+10% battery regen efficiency' },
    { key: 'DEBUG_PROTOCOL',  name: 'Debug Protocol',  desc: 'Software attacks cost 15% less battery' },
    { key: 'SELF_REPAIR',     name: 'Self Repair',     desc: '+3 HP per turn' },
    { key: 'IRON_WILL',       name: 'Iron Will',       desc: 'Reduce debuff duration by 1 turn' },
    { key: 'RESILIENT_FRAME', name: 'Resilient Frame', desc: 'Reduce damage taken by 5%' },
  ],
  TIER_2: [
    { key: 'ADAPTIVE_COMBAT',     name: 'Adaptive Combat',     desc: '+2% damage per unique action used' },
    { key: 'FORTIFIED_STRUCTURE', name: 'Fortified Structure', desc: '+15% armor and firewall restoration' },
    { key: 'VITAL_SYSTEMS',       name: 'Vital Systems',       desc: 'Patch heals 20% more and removes 1 debuff' },
    { key: 'CASCADING_OVERFLOW',  name: 'Cascading Overflow',  desc: '+5% software power per turn (stacks)' },
    { key: 'MOMENTUM',            name: 'Momentum',            desc: '+3% speed per physical attack, max +15%' },
    { key: 'UNBREAKABLE',         name: 'Unbreakable',         desc: '20% damage reduction after taking 40+ damage' },
  ],
  TIER_3: [
    { key: 'COMBAT_RHYTHM',      name: 'Combat Rhythm',      desc: '+8% damage when alternating attack types' },
    { key: 'PHASE_SHIFT',        name: 'Phase Shift',        desc: '+25% damage reduction for first 3 turns' },
    { key: 'PERMAFROST',         name: 'Permafrost',         desc: 'Enemy next action costs +20% battery' },
    { key: 'EMERGENCY_PROTOCOL', name: 'Emergency Protocol', desc: '+15% healing boost when HP below 30%' },
    { key: 'OVERCHARGE',         name: 'Overcharge',         desc: '+1 battery regen per 10% battery missing' },
    { key: 'INFECTION',          name: 'Infection',          desc: 'Virus Upload applies double debuff duration' },
    { key: 'NETWORK_SHIELD',     name: 'Network Shield',     desc: 'Block first status effect each turn' },
  ],
  TIER_4: [
    { key: 'LETHAL_EDGE',       name: 'Lethal Edge',       desc: '+15% physical damage, +30% vs low HP enemies' },
    { key: 'SILENT_EXECUTION',  name: 'Silent Execution',  desc: 'Software attacks ignore 20% firewall' },
    { key: 'LIFE_PULSE',        name: 'Life Pulse',        desc: 'Auto-heal 15% max HP every 3 turns' },
    { key: 'TEMPEST',           name: 'Tempest',           desc: '+1% damage per turn, max +50%, resets on 50+ damage' },
    { key: 'REINFORCED',        name: 'Reinforced',        desc: '-10% all damage taken, Armor Plate extends effect' },
  ],
  TIER_5: [
    { key: 'PERFECT_FORM',  name: 'Perfect Form',  desc: '+10% resistance to all damage' },
    { key: 'HYPERDRIVE',    name: 'Hyperdrive',    desc: '+5% damage per turn stacked, max +50%' },
    { key: 'ZERO_DAY',      name: 'Zero Day',      desc: 'First software attack ignores 50% firewall' },
    { key: 'INFINITE_LOOP', name: 'Infinite Loop', desc: '+50% battery regen, never stall' },
    { key: 'PHASE_OUT',     name: 'Phase Out',     desc: 'Dodge the first attack each turn' },
  ],
}

export function getAllPassives() {
  return TIER_ORDER.flatMap(t => PASSIVES_BY_TIER[t])
}

export function getAvailablePassives(tierKey) {
  const idx = TIER_ORDER.indexOf(tierKey)
  return TIER_ORDER.slice(0, idx + 1).flatMap(t => PASSIVES_BY_TIER[t])
}

export function getPassiveName(key) {
  return getAllPassives().find(p => p.key === key)?.name ?? key
}

export function tierNumToKey(num) {
  return `TIER_${num}`
}
