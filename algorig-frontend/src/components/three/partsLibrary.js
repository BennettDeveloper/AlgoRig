export const PARTS_LIBRARY = {
  head: [
    {
      key: 'box',
      label: 'Standard',
      description: 'Classic rectangular head unit',
      shape: 'box',
    },
    {
      key: 'dome',
      label: 'Dome',
      description: 'Rounded sensor array housing',
      shape: 'dome',
    },
    {
      key: 'angular',
      label: 'Angular',
      description: 'Sharp-edged combat visor',
      shape: 'angular',
    },
    {
      key: 'visor',
      label: 'Visor',
      description: 'Wide-profile scanning unit',
      shape: 'visor',
    },
  ],
  torso: [
    {
      key: 'box',
      label: 'Standard',
      description: 'Balanced chassis frame',
      shape: 'box',
    },
    {
      key: 'hex',
      label: 'Hexcore',
      description: 'Six-sided reinforced housing',
      shape: 'hex',
    },
    {
      key: 'diamond',
      label: 'Diamond',
      description: 'Sleek angular power core',
      shape: 'diamond',
    },
  ],
  arms: [
    {
      key: 'standard',
      label: 'Standard',
      description: 'Balanced arm configuration',
      width: 1.0,
      length: 1.0,
    },
    {
      key: 'heavy',
      label: 'Heavy',
      description: 'Thick reinforced arm plating',
      width: 1.4,
      length: 1.1,
    },
    {
      key: 'slim',
      label: 'Slim',
      description: 'Lightweight agile arm struts',
      width: 0.7,
      length: 1.0,
    },
    {
      key: 'blade',
      label: 'Blade',
      description: 'Extended blade-arm structure',
      width: 0.6,
      length: 1.35,
    },
  ],
  legs: [
    {
      key: 'box',
      label: 'Standard',
      description: 'Reliable bipedal leg frame',
      shape: 'box',
    },
    {
      key: 'tapered',
      label: 'Tapered',
      description: 'Streamlined speed-optimized legs',
      shape: 'tapered',
    },
    {
      key: 'wide',
      label: 'Wide Stance',
      description: 'Broad stabilizing leg platform',
      shape: 'box',
      spreadMultiplier: 1.5,
    },
    {
      key: 'strut',
      label: 'Strut',
      description: 'Tall lightweight leg struts',
      shape: 'tapered',
      heightMultiplier: 1.3,
    },
  ],
}

export const SLOT_LABELS = {
  head:  'Head',
  torso: 'Torso',
  arms:  'Arms',
  legs:  'Legs',
}

export const DEFAULT_PARTS = {
  head:  'box',
  torso: 'box',
  arms:  'standard',
  legs:  'box',
}

export function getPartConfig(slot, key) {
  return PARTS_LIBRARY[slot]?.find(p => p.key === key) || null
}
