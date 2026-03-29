'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const showBackToAnalyze = pathname !== '/'

  return (
    <nav
      className="nav-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100,
        gap: '20px',
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.35rem',
          fontWeight: 700,
          color: '#c8f542',
          letterSpacing: '-0.02em',
          flexShrink: 0,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        Verscly
      </button>

      {showBackToAnalyze ? (
        <button type="button" className="retry-btn" onClick={() => router.push('/')}>
          Resume analyze
        </button>
      ) : (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.62rem',
            color: '#6b6b80',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          Career intelligence
        </div>
      )}
    </nav>
  )
}
