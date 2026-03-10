'use client'
import { usePathname, useRouter } from 'next/navigation'

const tabs = [
  { label: '🎯 Job Fit Analysis', href: '/analyze' },
  { label: '📊 Profile Score',    href: '/profile'  },
  { label: '🎙️ Interview Practice', href: '/practice' },
]

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 40px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky', top: 0,
      background: 'rgba(10,10,15,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100, gap: '20px',
    }}>

      {/* Logo */}
      <div onClick={() => router.push('/')} style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.4rem', fontWeight: 700,
        color: '#c8f542', letterSpacing: '-0.02em',
        flexShrink: 0, cursor: 'pointer',
      }}>
        Verscly<span style={{ color: '#e8e8f0', fontStyle: 'italic' }}> AI</span>
      </div>

      {/* Tabs — centered */}
      <div style={{
        display: 'flex', gap: '4px',
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '4px',
      }}>
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <button key={tab.href} onClick={() => router.push(tab.href)} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: active ? 700 : 500,
              padding: '7px 18px', borderRadius: '9px',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: active ? '#c8f542' : 'transparent',
              color: active ? '#0a0a0f' : '#6b6b80',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* AI POWERED pill */}
      <div style={{
        background: '#1a1a26',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '100px', padding: '6px 14px',
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.65rem', color: '#6b6b80',
        letterSpacing: '0.1em', flexShrink: 0,
      }}>
        AI POWERED
      </div>
    </nav>
  )
}
