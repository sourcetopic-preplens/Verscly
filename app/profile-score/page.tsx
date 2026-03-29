'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Loader2,
  MessageSquareQuote,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import type { FlowGap, FlowStrength } from '@/lib/flowTypes'

type ScoreItem = { label: string; value: number; description: string; color: string }
type Capability = {
  title: string
  status: string
  evidence: string
  confidence: number
}

export default function ProfileScorePage() {
  const router = useRouter()
  const { session, hydrated } = useSession()

  useEffect(() => {
    if (!hydrated) return
    if (!session?.analysis) router.replace('/')
  }, [hydrated, session, router])

  if (!hydrated || !session?.analysis) {
    return (
      <div className="section-wrap linear-loading-page">
        <Loader2 className="linear-page-spinner" size={40} strokeWidth={1.5} />
      </div>
    )
  }

  const a = session.analysis
  const score = Number(a.overallScore ?? 0)
  const strengths = (a.strengths || []) as FlowStrength[]
  const gaps = (a.gaps || []) as FlowGap[]
  const scores = (Array.isArray(a.scores) ? a.scores : []) as ScoreItem[]
  const capabilities = (Array.isArray(a.capabilities) ? a.capabilities : []) as Capability[]
  const questions = (Array.isArray(a.interviewQuestions) ? a.interviewQuestions : []) as {
    question: string
    type: string
    hint: string
  }[]

  return (
    <div className="results-section">
      <header className="hero" style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Your <em>results</em>
        </h1>
        <p className="hero-sub" style={{ maxWidth: 560 }}>
          Match strength, what is working, where to improve, and focused prep suggestions based on this role.
        </p>
      </header>

      <div className="section-card dashboard-hero">
        <div className="dashboard-hero-top">
          <div>
            <div className="linear-kicker">Profile score</div>
            <h2 className="dashboard-title">{a.verdictTitle || 'Role fit'}</h2>
          </div>
          <div className="match-score-block">
            <div className="linear-kicker">Match strength</div>
            <div className="match-score-num">{Math.round(score)}</div>
            <div className="match-score-suffix">/ 100</div>
          </div>
        </div>
        {a.verdictDesc ? <p className="dashboard-verdict">{String(a.verdictDesc)}</p> : null}
      </div>

      {scores.length > 0 ? (
        <div className="score-row">
          {scores.map((s, i) => (
            <div
              key={i}
              className="score-card animate"
              style={{ '--fill': s.value / 100, '--bar-clr': s.color || '#6366F1' } as React.CSSProperties}
            >
              <div className="sc-label">{s.label}</div>
              <div className="sc-val">
                {s.value}
                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>%</span>
              </div>
              <div className="sc-sub">{s.description}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="section-card">
        <div className="section-title linear-section-title">
          <span className="icon linear-lucide-icon">
            <TrendingUp size={20} strokeWidth={2} />
          </span>
          Strengths
        </div>
        <ul className="dashboard-list">
          {strengths.map((s, i) => (
            <li key={i} className="dashboard-list-item">
              <span className="linear-list-marker">
                <Target size={14} strokeWidth={2} />
              </span>
              <div>
                <div className="dashboard-item-title">{s.title}</div>
                <div className="dashboard-item-body">{s.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="section-card">
        <div className="section-title linear-section-title">
          <span className="icon linear-lucide-icon">
            <AlertTriangle size={20} strokeWidth={2} />
          </span>
          Gaps to improve
        </div>
        <ul className="dashboard-list dashboard-gap-list">
          {gaps.map((g, i) => (
            <li key={i} className="dashboard-list-item">
              <span className="linear-list-marker muted">{String(g.severity)}</span>
              <div>
                <div className="dashboard-item-title">{g.title}</div>
                <div className="dashboard-item-body">{g.howToAddress}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {capabilities.length > 0 ? (
        <div className="section-card">
          <div className="section-title linear-section-title">
            <span className="icon linear-lucide-icon">
              <ListChecks size={20} strokeWidth={2} />
            </span>
            Capability fit
          </div>
          <p className="section-sub">How key responsibilities line up with your experience.</p>
          <ul className="dashboard-list">
            {capabilities.map((c, i) => (
              <li key={i} className="dashboard-list-item">
                <span className="linear-list-marker muted">{c.status}</span>
                <div>
                  <div className="dashboard-item-title">{c.title}</div>
                  <div className="dashboard-item-body">{c.evidence}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {questions.length > 0 ? (
        <div className="section-card">
          <div className="section-title linear-section-title">
            <span className="icon linear-lucide-icon">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            Suggested prep focus
          </div>
          <p className="section-sub">Themes your answers should cover for this posting.</p>
          <ul className="dashboard-list">
            {questions.slice(0, 8).map((q, i) => (
              <li key={i} className="dashboard-list-item">
                <span className="linear-list-marker muted">{q.type}</span>
                <div>
                  <div className="dashboard-item-title">{q.question}</div>
                  <div className="dashboard-item-body">{q.hint}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="section-card profile-score-practice-cta">
        <div className="section-title linear-section-title">
          <span className="icon linear-lucide-icon">
            <MessageSquareQuote size={20} strokeWidth={2} />
          </span>
          Interview
        </div>
        <p className="section-sub">
          Practice is built from this job description and the gaps above so you rehearse what actually matters.
        </p>
        <button type="button" className="primary-btn dashboard-practice-btn" onClick={() => router.push('/practice')}>
          Interview prepare
        </button>
      </div>
    </div>
  )
}
