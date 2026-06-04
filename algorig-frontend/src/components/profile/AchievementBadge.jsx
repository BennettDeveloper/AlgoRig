function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function AchievementBadge({ achievement, earned, awardedAt }) {
  const date = formatDate(awardedAt)

  return (
    <div
      title={!earned ? achievement.description : achievement.displayName}
      style={{
        width: 120,
        background: earned
          ? 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.04))'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${earned ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 10px 12px',
        gap: 6,
        opacity: earned ? 1 : 0.45,
        cursor: earned ? 'default' : 'help',
        transition: 'opacity 0.2s',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 30, lineHeight: 1, filter: earned ? 'none' : 'grayscale(1)' }}>
        {achievement.icon}
      </span>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: earned ? '#f97316' : '#555577',
        textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.04em',
        lineHeight: 1.3,
      }}>
        {achievement.displayName}
      </span>
      {earned && date && (
        <span style={{
          fontSize: 9,
          color: '#444466',
          fontFamily: 'JetBrains Mono, monospace',
          marginTop: 2,
        }}>
          {date}
        </span>
      )}
      {!earned && (
        <span style={{ fontSize: 10, color: '#333355' }}>???</span>
      )}
    </div>
  )
}
