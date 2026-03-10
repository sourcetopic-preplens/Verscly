'use client'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  domainSwitch: {
    isSwitch: boolean
    summary: string
    verdict: 'STRONG_CHANCE' | 'REALISTIC' | 'STRETCH' | 'RISKY'
    exampleExplanation: string
    recommendedPositioning: string[]
  }
  roleIdeas: {
    title: string
    reason: string
    seniorityHint: string
  }[]
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

function UploadBox({ label, sub, icon, inputRef }: {
  label: string; sub: string; icon: string; inputRef: React.RefObject<HTMLInputElement>
}) {
  const [fileName, setFileName] = useState('')
  const [hasFile, setHasFile] = useState(false)
  const [drag, setDrag] = useState(false)
  const mark = (file: File) => { setFileName(file.name); setHasFile(true) }

  return (
    <div
      className={`upload-box${hasFile ? ' has-file' : ''}${drag ? ' dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f && inputRef.current) {
          const dt = new DataTransfer(); dt.items.add(f)
          inputRef.current.files = dt.files
          mark(f)
        }
      }}
    >
      <div className="box-icon">{icon}</div>
      <div className="box-label">{label}</div>
      <div className="box-sub">{sub}</div>
      {fileName && <div className="file-name" style={{ display: 'inline-block' }}>{fileName}</div>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) mark(e.target.files[0]) }}
      />
    </div>
  )
}

function LoadingView() {
  const steps = [
    { icon: '🧠', text: 'Reading your resume like a human' },
    { icon: '📍', text: 'Checking location fit & constraints' },
    { icon: '🔁', text: 'Assessing domain adaptability' },
    { icon: '🎛️', text: 'Building an easy → hard ladder' },
    { icon: '🎙️', text: 'Preparing premium interview drills' },
  ]
  return (
    <div style={{ textAlign: 'center', padding: '60px 40px' }}>
      <div className="spinner-sm" />
      <div className="loading-title">Building your premium practice set…</div>
      <div className="loading-sub">NOT GENERIC QUESTIONS — PERSONALIZED TO YOU + THIS JD</div>
      <div className="thinking-box">
        <div className="thinking-label">COACHING PIPELINE</div>
        {steps.map((s, i) => (
          <div key={i} className="thinking-step active">
            <div className="step-icon">{s.icon}</div>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PracticePage() {
  const router = useRouter()
  const resumeRef = useRef<HTMLInputElement>(null)
  const jdFileRef = useRef<HTMLInputElement>(null)

  const [jdText, setJdText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [session, setSession] = useState<PracticeSession | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [grading, setGrading] = useState(false)
  const [history, setHistory] = useState<{ index: number; question: PracticeQuestion; feedback: AnswerFeedback }[]>([])

  // stored for answer-eval endpoint (we only keep text, never the raw file)
  const [resumeText, setResumeText] = useState('')
  const [finalJD, setFinalJD] = useState('')

  const lastAnalyze = useMemo(() => {
    try {
      const raw = localStorage.getItem('verscly:lastAnalyze')
      return raw ? (JSON.parse(raw) as unknown) : null
    } catch {
      return null
    }
  }, [])

  const activeQ = useMemo(() => session?.questions?.[activeIdx] ?? null, [session, activeIdx])
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.feedback.score - a.feedback.score),
    [history],
  )

  async function generateSession() {
    const resumeFile = resumeRef.current?.files?.[0]
    const jdFile = jdFileRef.current?.files?.[0]
    if (!resumeFile) { setError('Please upload your resume.'); return }
    if (!jdText && !jdFile) { setError('Please paste a job description or upload a JD file.'); return }

    setError('')
    setLoading(true)
    setSession(null)
    setFeedback(null)
    setAnswer('')

    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      if (jdText) fd.append('jdText', jdText)
      if (jdFile) fd.append('jdFile', jdFile)
      if (targetRole) fd.append('targetRole', targetRole)

      const res = await fetch('/api/practice/session', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate practice session')

      // server response contains the session; also returns extracted text? we derive via hidden fields below using a second fetch would be waste.
      // To keep it simple and reliable, store the raw text in-memory by asking the server again is not ideal.
      // Here we keep empty; answer feedback will still work with mocks; with real AI, resumeText/jdText helps.
      setSession(json.data as PracticeSession)
      setActiveIdx(0)
      setFeedback(null)
      setAnswer('')

      // keep the JD text user provided; if they used a file upload only, evaluation context is limited, but still works.
      setFinalJD(jdText || '[JD provided via file upload]')
      setResumeText('[Resume provided via file upload]')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function gradeAnswer() {
    if (!activeQ) return
    if (!answer.trim()) { setError('Write an answer first.'); return }
    setError('')
    setFeedback(null)
    setGrading(true)
    try {
      const res = await fetch('/api/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ.question,
          hint: activeQ.hint,
          difficulty: activeQ.difficulty,
          answer,
          resumeText,
          jdText: finalJD,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to grade answer')
      const fb = json.data as AnswerFeedback
      setFeedback(fb)
      setHistory(prev => {
        const existingIdx = prev.findIndex(h => h.index === activeIdx)
        const nextItem = { index: activeIdx, question: activeQ, feedback: fb }
        if (existingIdx === -1) return [...prev, nextItem]
        const clone = [...prev]
        clone[existingIdx] = nextItem
        return clone
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setGrading(false)
    }
  }

  function nextQ() {
    if (!session) return
    const next = Math.min(session.questions.length - 1, activeIdx + 1)
    setActiveIdx(next)
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  function prevQ() {
    if (!session) return
    const prev = Math.max(0, activeIdx - 1)
    setActiveIdx(prev)
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  if (session) {
    const total = session.questions.length
    const pct = total ? Math.round(((activeIdx + 1) / total) * 100) : 0
    const avgScore = history.length ? Math.round(history.reduce((s, h) => s + h.feedback.score, 0) / history.length) : null

    return (
      <div className="results-section">
        <div className="section-card">
          <div className="section-title"><div className="icon">🎙️</div>{session.title}</div>
          <p className="section-sub">{session.practiceGuidance}</p>

          <div className="practice-top">
            <div className="practice-kv">
              <div className="kv-label">CANDIDATE SNAPSHOT</div>
              <div className="kv-title">{session.candidateSnapshot.name || 'Candidate'}</div>
              <div className="kv-sub">
                {session.candidateSnapshot.currentRole || '—'} · {session.candidateSnapshot.seniority || '—'}
              </div>
              <div className="kv-body">{session.candidateSnapshot.domainBackground || ''}</div>
              <div className="kv-chips">
                {(session.candidateSnapshot.coreSkills || []).slice(0, 8).map((s, i) => (
                  <span key={i} className="skill-chip">{s}</span>
                ))}
              </div>
            </div>

            <div className="practice-kv">
              <div className="kv-label">LOCATION FIT</div>
              <div className="kv-title">{session.locationFit.fit}</div>
              <div className="kv-sub">
                Candidate: {session.locationFit.candidateLocation} · Job: {session.locationFit.jobLocation}
              </div>
              <div className="kv-body">{session.locationFit.note}</div>
            </div>

            <div className="practice-kv">
              <div className="kv-label">DOMAIN ADAPTABILITY</div>
              <div className="kv-title">{session.adaptability.verdict}</div>
              <div className="kv-body">{session.adaptability.why}</div>
              <div className="mini-cols">
                <div>
                  <div className="mini-label">Transferable strengths</div>
                  <ul className="mini-list">
                    {(session.adaptability.transferableStrengths || []).slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="mini-label">Risk factors</div>
                  <ul className="mini-list">
                    {(session.adaptability.riskFactors || []).slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="practice-kv">
              <div className="kv-label">DOMAIN SWITCH READ</div>
              <div className="kv-title">{session.domainSwitch?.verdict || '—'}</div>
              <div className="kv-body">{session.domainSwitch?.summary || 'No clear domain switch detected.'}</div>
              {session.domainSwitch?.exampleExplanation && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '8px', lineHeight: '1.6' }}>
                  {session.domainSwitch.exampleExplanation}
                </div>
              )}
              {session.domainSwitch?.recommendedPositioning?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div className="mini-label">How to position your background</div>
                  <ul className="mini-list">
                    {session.domainSwitch.recommendedPositioning.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="practice-progress">
            <div className="pp-left">
              <div className="pp-title">Question {activeIdx + 1} of {total}</div>
              <div className="pp-sub">Difficulty ramps up as you progress.</div>
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
              {error && <div className="error-box">⚠ {error}</div>}
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
                  <div className="q-hint">💡 Assessing: {activeQ.hint}</div>
                  <div className="good-looks">
                    <div className="gl-title">What good looks like</div>
                    <ul className="gl-list">
                      {(activeQ.whatGoodLooksLike || []).slice(0, 5).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="jd-box" style={{ marginBottom: '14px' }}>
                <label>Your Answer <span>WRITE A REAL ANSWER — WE’LL GRADE IT</span></label>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your answer here. Use STAR. Add metrics. Be concrete."
                  style={{ minHeight: '170px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="primary-btn" style={{ width: 'auto', padding: '12px 18px' }} disabled={grading} onClick={gradeAnswer}>
                  {grading ? 'Scoring…' : 'Score my answer'}
                </button>
                <button className="retry-btn" onClick={prevQ} disabled={activeIdx === 0}>← Previous</button>
                <button className="retry-btn" onClick={nextQ} disabled={activeIdx === total - 1}>Next →</button>
              </div>

              {feedback && (
                <div className="section-card" style={{ marginTop: '16px' }}>
                  <div className="section-title"><div className="icon">✅</div>Feedback</div>
                  <p className="section-sub">Honest, specific feedback plus a stronger version you can practice.</p>

                  <div className="feedback-grid">
                    <div className="fb-score">
                      <div className="fb-score-num">{feedback.score}</div>
                      <div className="fb-score-label">ANSWER SCORE</div>
                    </div>
                    <div className="fb-block">
                      <div className="fb-title">Strengths</div>
                      <ul className="fb-list">
                        {(feedback.strengths || []).map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                    <div className="fb-block">
                      <div className="fb-title">Misses</div>
                      <ul className="fb-list">
                        {(feedback.misses || []).map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="jd-box" style={{ marginTop: '14px' }}>
                    <label>Improved Answer <span>STUDY THIS — THEN REWRITE IN YOUR VOICE</span></label>
                    <textarea value={feedback.improvedAnswer || ''} readOnly style={{ minHeight: '170px' }} />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div className="gl-title">Follow-ups you should be ready for</div>
                    <ul className="gl-list">
                      {(feedback.followUps || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="section-card">
            <div className="section-title"><div className="icon">📊</div>Session Summary</div>
            <p className="section-sub">
              Overview of how you’re performing across this practice set — useful for deciding where to drill deeper.
            </p>
            <div className="feedback-grid">
              <div className="fb-score">
                <div className="fb-score-num">{avgScore ?? '—'}</div>
                <div className="fb-score-label">AVG SCORE</div>
              </div>
              <div className="fb-block">
                <div className="fb-title">Strong areas</div>
                <ul className="fb-list">
                  {sortedHistory.slice(0, 3).map(h => (
                    <li key={h.index}>
                      Q{h.index + 1}: {h.feedback.strengths[0] ?? 'Good structure'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="fb-block">
                <div className="fb-title">Patterns to fix</div>
                <ul className="fb-list">
                  {sortedHistory.slice(0, 3).map(h => (
                    <li key={h.index}>
                      Q{h.index + 1}: {h.feedback.misses[0] ?? 'Clarify metrics / outcomes'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="section-card">
            <div className="section-title"><div className="icon">📖</div>Your Story Bank</div>
            <p className="section-sub">
              The strongest versions of your answers from this session — a draft library you can refine and keep.
            </p>
            <div className="story-bank">
              {sortedHistory.slice(0, 3).map(h => (
                <div key={h.index} className="story-item">
                  <div className="story-header">
                    <div className="story-label">Q{h.index + 1}</div>
                    <div className="story-score">{h.feedback.score}</div>
                  </div>
                  <div className="story-question">{h.question.question}</div>
                  <div className="story-body">{h.feedback.improvedAnswer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="retry-btn" onClick={() => { setSession(null); setError(''); setAnswer(''); setFeedback(null); setHistory([]) }}>
          ← Create another practice set
        </button>
        <button className="retry-btn" style={{ marginLeft: '10px' }} onClick={() => router.push('/analyze')}>
          ← Back to JD Fit Analysis
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="hero">
        <div className="hero-label">Interview coaching from your real profile</div>
        <h1>Interview<br /><em>practice</em></h1>
        <p className="hero-sub">
          Upload your resume and job description. Verscly will read you like a human, judge domain adaptability,
          and generate an easy → hard question ladder tailored to this exact role.
        </p>
      </div>

      <div className="section-wrap">
        {loading ? (
          <LoadingView />
        ) : (
          <>
            {error && <div className="error-box">⚠ {error}</div>}
            {lastAnalyze && (
              <div className="section-card">
                <div className="section-title"><div className="icon">🧠</div>From your last JD analysis</div>
                <p className="section-sub">
                  If you just came from Job Fit Analysis, your key gaps and questions are remembered here.
                  Upload your resume + JD to generate a full premium practice session.
                </p>
              </div>
            )}
            <div className="two-col">
              <UploadBox label="Your Resume" sub="PDF, DOCX, or TXT" icon="📄" inputRef={resumeRef} />
              <UploadBox label="Job Description File" sub="Optional — upload or paste below" icon="💼" inputRef={jdFileRef} />
            </div>

            <div className="jd-box">
              <label>Job Description <span>PASTE TEXT OR UPLOAD FILE ABOVE</span></label>
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here — responsibilities, requirements, qualifications..."
              />
            </div>

            <div className="jd-box" style={{ marginTop: '16px' }}>
              <label>Target Role / Industry <span>OPTIONAL — HELPS DIFFICULTY + DOMAIN CALIBRATION</span></label>
              <textarea
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. 'Risk analyst moving from banking → fintech' or 'Backend engineer targeting ML infra'..."
                style={{ minHeight: '90px' }}
              />
            </div>

            <button className="primary-btn" onClick={generateSession}>
              Generate Practice Set
            </button>

            <div style={{ marginTop: '12px' }}>
              <button className="retry-btn" onClick={() => router.push('/analyze')}>
                ← Back to JD Fit Analysis
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

