'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  MapPin,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  User,
  CircleDot,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import type { FlowGap } from '@/lib/flowTypes'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
type QType = 'Behavioral' | 'Technical' | 'Situational' | 'Experience' | 'Gap-probe'

interface PracticeQuestion {
  id: string
  difficulty: Difficulty
  type: QType
  question: string
  hint: string
  whatGoodLooksLike: string[]
}

interface PracticeSession {
  title: string
  candidateSnapshot: {
    name: string
    currentRole: string
    seniority: string
    domainBackground: string
    coreSkills: string[]
    notableSignals: string[]
  }
  locationFit: {
    candidateLocation: string
    jobLocation: string
    fit: 'MATCH' | 'REMOTE_OK' | 'RELOCATE' | 'UNCLEAR'
    note: string
  }
  adaptability: {
    verdict: 'YES' | 'MAYBE' | 'NO'
    why: string
    transferableStrengths: string[]
    riskFactors: string[]
    fastRampPlan: string[]
  }
  practiceGuidance: string
  questions: PracticeQuestion[]
}

interface AnswerFeedback {
  score: number
  strengths: string[]
  misses: string[]
  improvedAnswer: string
  followUps: string[]
}

function DifficultyChip({ d }: { d: Difficulty }) {
  const cls = d === 'EASY' ? 'diff-easy' : d === 'HARD' ? 'diff-hard' : 'diff-med'
  return <span className={`diff-chip ${cls}`}>{d}</span>
}

function TypeChip({ t }: { t: QType }) {
  return <span className="type-chip">{t}</span>
}

function LoadingView() {
  return (
    <div className="linear-loading-center">
      <Loader2 className="linear-page-spinner" size={44} strokeWidth={1.5} />
      <div className="loading-title">Building gap-targeted practice</div>
      <div className="loading-sub">Mapping your profile to this role and stress-testing weak signals.</div>
    </div>
  )
}

export default function PracticePage() {
  const router = useRouter()
  const { session, hydrated } = useSession()

  const [bootError, setBootError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionPractice, setSessionPractice] = useState<PracticeSession | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hydrated) return
    if (!session?.analysis || !session.resumeText || session.resumeText.length < 50 || !session.jdText || session.jdText.length < 50) {
      router.replace('/')
    }
  }, [hydrated, session, router])

  useEffect(() => {
    if (!hydrated || !session?.sessionId || !session.analysis || !session.resumeText || !session.jdText) return
    let cancelled = false
    setBootError('')
    setLoading(true)
    ;(async () => {
      try {
        const gaps = (session.analysis?.gaps || []) as FlowGap[]
        const gapsLines = gaps.map(g => `- ${g.title} (${g.severity}): ${g.howToAddress}`).join('\n')
        const fd = new FormData()
        fd.append('resumeText', session.resumeText)
        fd.append('jdText', session.jdText)
        if (session.positionName) fd.append('positionName', session.positionName)
        if (gapsLines) fd.append('gapsFocus', gapsLines)
        const res = await fetch('/api/practice/session', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate practice session')
        if (cancelled) return
        setSessionPractice(json.data as PracticeSession)
        setActiveIdx(0)
        setAnswer('')
        setFeedback(null)
      } catch (e) {
        if (!cancelled) setBootError(e instanceof Error ? e.message : 'Practice session failed.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, session?.sessionId])

  async function gradeAnswer() {
    const q = sessionPractice?.questions[activeIdx]
    if (!q || !session) return
    if (!answer.trim()) {
      setError('Write an answer first.')
      return
    }
    setError('')
    setFeedback(null)
    setGrading(true)
    try {
      const res = await fetch('/api/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          hint: q.hint,
          difficulty: q.difficulty,
          answer,
          resumeText: session.resumeText,
          jdText: session.jdText,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to grade answer')
      setFeedback(json.data as AnswerFeedback)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setGrading(false)
    }
  }

  function nextQ() {
    if (!sessionPractice) return
    setActiveIdx(Math.min(sessionPractice.questions.length - 1, activeIdx + 1))
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  function prevQ() {
    setActiveIdx(Math.max(0, activeIdx - 1))
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  if (!hydrated || !session?.analysis) {
    return (
      <div className="section-wrap linear-loading-page">
        <Loader2 className="linear-page-spinner" size={40} strokeWidth={1.5} />
      </div>
    )
  }

  if (loading && !sessionPractice) {
    return (
      <div className="section-wrap">
        <LoadingView />
        {bootError ? <div className="error-box linear-error">{bootError}</div> : null}
      </div>
    )
  }

  if (!sessionPractice) {
    return (
      <div className="section-wrap">
        <div className="error-box linear-error">{bootError || 'Could not load practice.'}</div>
        <button type="button" className="retry-btn" onClick={() => router.push('/profile-score')}>
          Back to profile score
        </button>
      </div>
    )
  }

  const total = sessionPractice.questions.length
  const pct = total ? Math.round(((activeIdx + 1) / total) * 100) : 0
  const activeQ = sessionPractice.questions[activeIdx] ?? null

  return (
    <div className="results-section">
      <header className="hero" style={{ paddingBottom: 16 }}>
        <h1 style={{ fontSize: 'clamp(1.85rem,3.5vw,2.6rem)' }}>
          Interview <em>prepare</em>
        </h1>
        <p className="hero-sub" style={{ maxWidth: 520 }}>
          Gap-led questions from your profile score and this job description.
        </p>
      </header>

      <div className="section-card">
        <div className="section-title linear-section-title">
          <span className="icon linear-lucide-icon">
            <CircleDot size={20} strokeWidth={2} />
          </span>
          {sessionPractice.title}
        </div>
        <p className="section-sub">{sessionPractice.practiceGuidance}</p>

        <div className="practice-top">
          <div className="practice-kv">
            <div className="kv-label">Snapshot</div>
            <div className="kv-title">{sessionPractice.candidateSnapshot.name || 'Candidate'}</div>
            <div className="kv-sub">
              {sessionPractice.candidateSnapshot.currentRole || '—'} · {sessionPractice.candidateSnapshot.seniority || '—'}
            </div>
            <div className="kv-body">{sessionPractice.candidateSnapshot.domainBackground || ''}</div>
            <div className="kv-chips">
              {(sessionPractice.candidateSnapshot.coreSkills || []).slice(0, 8).map((s, i) => (
                <span key={i} className="skill-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="practice-kv">
            <div className="kv-label">Location</div>
            <div className="kv-title linear-kv-fit">
              <MapPin size={16} strokeWidth={2} />
              {sessionPractice.locationFit.fit}
            </div>
            <div className="kv-sub">
              {sessionPractice.locationFit.candidateLocation} · {sessionPractice.locationFit.jobLocation}
            </div>
            <div className="kv-body">{sessionPractice.locationFit.note}</div>
          </div>

          <div className="practice-kv">
            <div className="kv-label">Adaptability</div>
            <div className="kv-title linear-kv-fit">
              <Shuffle size={16} strokeWidth={2} />
              {sessionPractice.adaptability.verdict}
            </div>
            <div className="kv-body">{sessionPractice.adaptability.why}</div>
            <div className="mini-cols">
              <div>
                <div className="mini-label">Transferable</div>
                <ul className="mini-list">
                  {(sessionPractice.adaptability.transferableStrengths || []).slice(0, 4).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mini-label">Risks</div>
                <ul className="mini-list">
                  {(sessionPractice.adaptability.riskFactors || []).slice(0, 4).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="practice-progress">
          <div className="pp-left">
            <div className="pp-title">
              Question {activeIdx + 1} of {total}
            </div>
            <div className="pp-sub">Difficulty ramps across the set.</div>
          </div>
          <div className="pp-right">
            <div className="pp-pct">{pct}%</div>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {activeQ && (
          <div style={{ marginTop: '18px' }}>
            {error ? (
              <div className="error-box linear-error">
                <AlertCircle size={16} strokeWidth={2} className="linear-error-icon" />
                {error}
              </div>
            ) : null}
            <div className="question-item" style={{ marginBottom: '14px' }}>
              <div className="q-meta">
                <div className="q-num">Q{activeIdx + 1}</div>
                <div style={{ marginTop: '8px' }}>
                  <DifficultyChip d={activeQ.difficulty} />
                </div>
                <div style={{ marginTop: '6px' }}>
                  <TypeChip t={activeQ.type} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="q-text">{activeQ.question}</div>
                <div className="q-hint linear-hint">
                  <User size={13} strokeWidth={2} />
                  Assessing: {activeQ.hint}
                </div>
                <div className="good-looks">
                  <div className="gl-title">What good looks like</div>
                  <ul className="gl-list">
                    {(activeQ.whatGoodLooksLike || []).slice(0, 5).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="jd-box" style={{ marginBottom: '14px' }}>
              <label>
                Your answer <span className="linear-label-hint">graded against your resume and JD</span>
              </label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Structured answer: situation, actions, outcomes, metrics."
                style={{ minHeight: '170px' }}
              />
            </div>

            <div className="linear-action-row">
              <button type="button" className="primary-btn linear-btn-inline" disabled={grading} onClick={gradeAnswer}>
                {grading ? <Loader2 className="linear-btn-spinner" size={18} strokeWidth={2} /> : null}
                {grading ? 'Scoring' : 'Score answer'}
              </button>
              <button type="button" className="retry-btn linear-icon-btn" onClick={prevQ} disabled={activeIdx === 0}>
                <ChevronLeft size={18} strokeWidth={2} />
                Previous
              </button>
              <button type="button" className="retry-btn linear-icon-btn" onClick={nextQ} disabled={activeIdx === total - 1}>
                Next
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>

            {feedback && (
              <div className="section-card" style={{ marginTop: '16px' }}>
                <div className="section-title linear-section-title">
                  <span className="icon linear-lucide-icon">
                    <CheckCircle2 size={20} strokeWidth={2} />
                  </span>
                  Feedback
                </div>
                <p className="section-sub">Specific coaching plus a stronger answer template.</p>

                <div className="feedback-grid">
                  <div className="fb-score">
                    <div className="fb-score-num">{feedback.score}</div>
                    <div className="fb-score-label">Score</div>
                  </div>
                  <div className="fb-block">
                    <div className="fb-title">Strengths</div>
                    <ul className="fb-list">
                      {(feedback.strengths || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="fb-block">
                    <div className="fb-title">Misses</div>
                    <ul className="fb-list">
                      {(feedback.misses || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="jd-box" style={{ marginTop: '14px' }}>
                  <label>Improved answer</label>
                  <textarea value={feedback.improvedAnswer || ''} readOnly style={{ minHeight: '170px' }} />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div className="gl-title">Follow-ups</div>
                  <ul className="gl-list">
                    {(feedback.followUps || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button type="button" className="retry-btn" onClick={() => router.push('/profile-score')}>
        Back to profile score
      </button>
    </div>
  )
}
