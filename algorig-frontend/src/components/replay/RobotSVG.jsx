export function RobotSVGA({ size = 120, isActing = false, isDead = false }) {
  const scale = size / 120
  const opacity = isDead ? 0.35 : 1
  const glow = isActing ? '0 0 18px 4px rgba(0,200,255,0.7)' : 'none'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{
        opacity,
        filter: isActing ? 'drop-shadow(0 0 10px rgba(0,200,255,0.9))' : isDead ? 'grayscale(1)' : 'none',
        transition: 'filter 0.3s, opacity 0.5s',
        transform: isActing ? 'scale(1.06)' : 'scale(1)',
        transformOrigin: 'center',
      }}
    >
      {/* body */}
      <rect x="35" y="45" width="50" height="45" rx="6" fill="#0a2a3a" stroke="#00c8ff" strokeWidth="2" />
      {/* head */}
      <rect x="40" y="18" width="40" height="30" rx="5" fill="#0d3347" stroke="#00c8ff" strokeWidth="2" />
      {/* antenna */}
      <line x1="60" y1="18" x2="60" y2="8" stroke="#00c8ff" strokeWidth="2" />
      <circle cx="60" cy="6" r="3" fill="#00c8ff" />
      {/* eyes */}
      <rect x="45" y="26" width="10" height="7" rx="2" fill="#00e5ff" />
      <rect x="65" y="26" width="10" height="7" rx="2" fill="#00e5ff" />
      {/* chest panel */}
      <rect x="44" y="54" width="32" height="20" rx="3" fill="#0d3a4d" stroke="#00c8ff" strokeWidth="1" />
      <rect x="48" y="57" width="8" height="4" rx="1" fill="#00c8ff" opacity="0.7" />
      <rect x="58" y="57" width="8" height="4" rx="1" fill="#00c8ff" opacity="0.4" />
      <rect x="48" y="64" width="20" height="3" rx="1" fill="#004f6b" />
      <rect x="48" y="64" width="14" height="3" rx="1" fill="#00c8ff" opacity="0.8" />
      {/* arms */}
      <rect x="18" y="47" width="16" height="36" rx="5" fill="#0a2a3a" stroke="#00c8ff" strokeWidth="2" />
      <rect x="86" y="47" width="16" height="36" rx="5" fill="#0a2a3a" stroke="#00c8ff" strokeWidth="2" />
      {/* legs */}
      <rect x="40" y="89" width="16" height="22" rx="4" fill="#0a2a3a" stroke="#00c8ff" strokeWidth="2" />
      <rect x="64" y="89" width="16" height="22" rx="4" fill="#0a2a3a" stroke="#00c8ff" strokeWidth="2" />
      {/* fists */}
      <rect x="16" y="82" width="20" height="12" rx="4" fill="#0d3347" stroke="#00c8ff" strokeWidth="1.5" />
      <rect x="84" y="82" width="20" height="12" rx="4" fill="#0d3347" stroke="#00c8ff" strokeWidth="1.5" />
      {/* dead X overlay */}
      {isDead && (
        <>
          <line x1="40" y1="26" x2="60" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="26" x2="40" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export function RobotSVGB({ size = 120, isActing = false, isDead = false }) {
  const opacity = isDead ? 0.35 : 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{
        opacity,
        filter: isActing ? 'drop-shadow(0 0 10px rgba(255,60,60,0.9))' : isDead ? 'grayscale(1)' : 'none',
        transition: 'filter 0.3s, opacity 0.5s',
        transform: isActing ? 'scale(1.06)' : 'scale(1)',
        transformOrigin: 'center',
        transform: `scaleX(-1) ${isActing ? 'scale(1.06)' : 'scale(1)'}`,
      }}
    >
      {/* body */}
      <rect x="35" y="45" width="50" height="45" rx="6" fill="#2a0a0a" stroke="#ff3c3c" strokeWidth="2" />
      {/* head */}
      <rect x="40" y="18" width="40" height="30" rx="5" fill="#3a1010" stroke="#ff3c3c" strokeWidth="2" />
      {/* antenna */}
      <line x1="60" y1="18" x2="60" y2="8" stroke="#ff3c3c" strokeWidth="2" />
      <circle cx="60" cy="6" r="3" fill="#ff3c3c" />
      {/* eyes */}
      <rect x="45" y="26" width="10" height="7" rx="2" fill="#ff6060" />
      <rect x="65" y="26" width="10" height="7" rx="2" fill="#ff6060" />
      {/* chest panel */}
      <rect x="44" y="54" width="32" height="20" rx="3" fill="#3a1414" stroke="#ff3c3c" strokeWidth="1" />
      <rect x="48" y="57" width="8" height="4" rx="1" fill="#ff3c3c" opacity="0.7" />
      <rect x="58" y="57" width="8" height="4" rx="1" fill="#ff3c3c" opacity="0.4" />
      <rect x="48" y="64" width="20" height="3" rx="1" fill="#4d1010" />
      <rect x="48" y="64" width="14" height="3" rx="1" fill="#ff3c3c" opacity="0.8" />
      {/* arms */}
      <rect x="18" y="47" width="16" height="36" rx="5" fill="#2a0a0a" stroke="#ff3c3c" strokeWidth="2" />
      <rect x="86" y="47" width="16" height="36" rx="5" fill="#2a0a0a" stroke="#ff3c3c" strokeWidth="2" />
      {/* legs */}
      <rect x="40" y="89" width="16" height="22" rx="4" fill="#2a0a0a" stroke="#ff3c3c" strokeWidth="2" />
      <rect x="64" y="89" width="16" height="22" rx="4" fill="#2a0a0a" stroke="#ff3c3c" strokeWidth="2" />
      {/* fists */}
      <rect x="16" y="82" width="20" height="12" rx="4" fill="#3a1010" stroke="#ff3c3c" strokeWidth="1.5" />
      <rect x="84" y="82" width="20" height="12" rx="4" fill="#3a1010" stroke="#ff3c3c" strokeWidth="1.5" />
      {/* dead X overlay */}
      {isDead && (
        <>
          <line x1="40" y1="26" x2="60" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="26" x2="40" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
