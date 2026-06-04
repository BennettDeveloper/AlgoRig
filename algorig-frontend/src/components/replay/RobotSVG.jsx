export function RobotSVGA({ size = 120, isActing = false, isDead = false, healthPercent = 100, suppressHealthAnim = false }) {
  const isCritical = !isDead && healthPercent <= 25
  const isLow = !isDead && healthPercent <= 50

  const svgStyle = {
    filter: isDead
      ? 'grayscale(1) opacity(0.4)'
      : isActing
      ? 'drop-shadow(0 0 10px rgba(0,200,255,0.9))'
      : isCritical
      ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'
      : 'none',
    transition: 'filter 0.3s, opacity 0.5s',
    transform: isActing ? 'scale(1.06)' : 'scale(1)',
    transformOrigin: 'center',
    animation: isDead || suppressHealthAnim
      ? 'none'
      : isCritical
      ? 'robotShake 0.4s ease-in-out infinite, criticalPulse 0.8s ease-in-out infinite'
      : isLow
      ? 'robotShake 0.8s ease-in-out infinite'
      : 'none',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
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
        {isDead && (
          <>
            <line x1="40" y1="26" x2="60" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="60" y1="26" x2="40" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </svg>

      {isLow && (
        <>
          <div style={{ position: 'absolute', top: '30%', left: '20%', width: 6, height: 6, background: '#38bdf8', borderRadius: 1, animation: 'boltDrop 1.2s ease-in infinite', animationDelay: '0s', opacity: 0 }} />
          <div style={{ position: 'absolute', top: '20%', right: '25%', width: 4, height: 4, background: '#7dd3fc', borderRadius: '50%', animation: 'boltDrop 1.5s ease-in infinite', animationDelay: '0.3s', opacity: 0 }} />
          {isCritical && (
            <>
              <div style={{ position: 'absolute', top: '15%', left: '35%', width: 5, height: 8, background: '#38bdf8', borderRadius: 2, animation: 'boltDrop 0.9s ease-in infinite', animationDelay: '0.1s', opacity: 0 }} />
              <div style={{ position: 'absolute', top: '25%', right: '15%', width: 4, height: 6, background: '#7dd3fc', borderRadius: 1, animation: 'boltDrop 1.1s ease-in infinite', animationDelay: '0.5s', opacity: 0 }} />
              <div style={{ position: 'absolute', top: '10%', left: '50%', width: 5, height: 8, background: 'rgba(56,189,248,0.6)', borderRadius: '0 50% 50% 50%', transform: 'rotate(45deg)', animation: 'sweatDrop 1s ease-in infinite', animationDelay: '0.2s', opacity: 0 }} />
            </>
          )}
        </>
      )}
    </div>
  )
}

export function RobotSVGB({ size = 120, isActing = false, isDead = false, healthPercent = 100, suppressHealthAnim = false }) {
  const isCritical = !isDead && healthPercent <= 25
  const isLow = !isDead && healthPercent <= 50

  const svgStyle = {
    filter: isDead
      ? 'grayscale(1) opacity(0.4)'
      : isActing
      ? 'drop-shadow(0 0 10px rgba(255,60,60,0.9))'
      : isCritical
      ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'
      : 'none',
    transition: 'filter 0.3s, opacity 0.5s',
    transformOrigin: 'center',
    transform: `scaleX(-1) ${isActing ? 'scale(1.06)' : 'scale(1)'}`,
    animation: isDead || suppressHealthAnim
      ? 'none'
      : isCritical
      ? 'robotShake 0.4s ease-in-out infinite, criticalPulse 0.8s ease-in-out infinite'
      : isLow
      ? 'robotShake 0.8s ease-in-out infinite'
      : 'none',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
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
        {isDead && (
          <>
            <line x1="40" y1="26" x2="60" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="60" y1="26" x2="40" y2="46" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </svg>

      {isLow && (
        <>
          <div style={{ position: 'absolute', top: '30%', left: '20%', width: 6, height: 6, background: '#ef4444', borderRadius: 1, animation: 'boltDrop 1.2s ease-in infinite', animationDelay: '0s', opacity: 0 }} />
          <div style={{ position: 'absolute', top: '20%', right: '25%', width: 4, height: 4, background: '#fca5a5', borderRadius: '50%', animation: 'boltDrop 1.5s ease-in infinite', animationDelay: '0.3s', opacity: 0 }} />
          {isCritical && (
            <>
              <div style={{ position: 'absolute', top: '15%', left: '35%', width: 5, height: 8, background: '#ef4444', borderRadius: 2, animation: 'boltDrop 0.9s ease-in infinite', animationDelay: '0.1s', opacity: 0 }} />
              <div style={{ position: 'absolute', top: '25%', right: '15%', width: 4, height: 6, background: '#fca5a5', borderRadius: 1, animation: 'boltDrop 1.1s ease-in infinite', animationDelay: '0.5s', opacity: 0 }} />
              <div style={{ position: 'absolute', top: '10%', left: '50%', width: 5, height: 8, background: 'rgba(239,68,68,0.6)', borderRadius: '0 50% 50% 50%', transform: 'rotate(45deg)', animation: 'sweatDrop 1s ease-in infinite', animationDelay: '0.2s', opacity: 0 }} />
            </>
          )}
        </>
      )}
    </div>
  )
}
