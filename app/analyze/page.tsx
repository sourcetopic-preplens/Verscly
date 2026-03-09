'use client'
import { useState, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Score        { label:string; value:number; description:string; color:string }
interface Capability   { title:string; status:'READY'|'PARTIAL'|'TRANSFERABLE'|'GAP'; evidence:string; confidence:number }
interface RampupStep   { period:string; filled:boolean; label:string }
interface Strength     { title:string; detail:string }
interface Gap          { title:string; severity:'CRITICAL'|'MODERATE'|'MINOR'; howToAddress:string }
interface Question     { question:string; type:string; hint:string }
interface AnalyzeResult {
  verdict:'YES'|'STRETCH'|'NO'; verdictTitle:string; verdictDesc:string; overallScore:number
  scores:Score[]; capabilities:Capability[]; rampupTimeline:RampupStep[]; rampupNote:string
  strengths:Strength[]; gaps:Gap[]; interviewQuestions:Question[]
}

// ─── Loading Steps Component ─────────────────────────────────────────────────
function LoadingView() {
  const steps = [
    { icon:'🧠', text:'Parsing work history & career arc' },
    { icon:'🔍', text:'Decomposing JD responsibilities' },
    { icon:'⚡', text:'Identifying transferable capabilities' },
    { icon:'📊', text:'Evaluating capability gap per task' },
    { icon:'🎯', text:'Generating honest verdict & questions' },
  ]
  return (
    <div style={{ textAlign:'center', padding:'60px 40px' }}>
      <div className="spinner-sm" />
      <div className="loading-title">Reading your profile deeply…</div>
      <div className="loading-sub">NOT KEYWORD MATCHING — UNDERSTANDING REAL CAPABILITIES</div>
      <div className="thinking-box">
        <div className="thinking-label">AI REASONING PROCESS</div>
        {steps.map((s,i) => (
          <div key={i} className="thinking-step" id={`p1-step${i+1}`}>
            <div className="step-icon">{s.icon}</div>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Results Components ───────────────────────────────────────────────────────
function VerdictBanner({ d }: { d:AnalyzeResult }) {
  const cls   = { YES:'verdict-yes', STRETCH:'verdict-stretch', NO:'verdict-no' }[d.verdict] || 'verdict-stretch'
  const emoji = { YES:'✅', STRETCH:'⚡', NO:'🚫' }[d.verdict] || '🤔'
  const tag   = { YES:'STRONG FIT — CAN DO THIS ROLE', STRETCH:'STRETCH ROLE — POSSIBLE WITH EFFORT', NO:'SIGNIFICANT CAPABILITY MISMATCH' }[d.verdict] || ''
  return (
    <div className={`verdict-banner ${cls}`}>
      <div className="verdict-emoji">{emoji}</div>
      <div className="verdict-content">
        <div className="verdict-tag">{tag}</div>
        <div className="verdict-title">{d.verdictTitle}</div>
        <div className="verdict-desc">{d.verdictDesc}</div>
      </div>
    </div>
  )
}

function ScoreRow({ d }: { d:AnalyzeResult }) {
  const makeCard = (label:string, val:number, desc:string, clr:string, id?:string) => (
    <div key={label} className="score-card animate"
      style={{ '--fill':val/100, '--bar-clr':clr } as React.CSSProperties}>
      <div className="sc-label">{label}</div>
      <div className="sc-val" id={id}>{val}<span style={{fontSize:'0.9rem',color:'var(--muted)'}}>%</span></div>
      <div className="sc-sub">{desc}</div>
    </div>
  )
  return (
    <div className="score-row">
      {makeCard('OVERALL FIT', d.overallScore||0, 'Holistic capability assessment', '#6366F1', 'p1-overall')}
      {(d.scores||[]).map(s => makeCard(s.label, s.value, s.description, s.color))}
    </div>
  )
}

function CapabilityList({ caps }: { caps:Capability[] }) {
  const sm = {
    READY:       { cls:'badge-ready',       label:'READY ✓',       clr:'#10B981' },
    PARTIAL:     { cls:'badge-partial',     label:'PARTIAL',        clr:'#F59E0B' },
    TRANSFERABLE:{ cls:'badge-transferable',label:'TRANSFERABLE',   clr:'#6366F1' },
    GAP:         { cls:'badge-gap',         label:'GAP',            clr:'#EF4444' },
  }
  return (
    <div>
      {(caps||[]).map((cap,i) => {
        const s = sm[cap.status] || sm.PARTIAL
        return (
          <div key={i} className="capability-row">
            <div className="cap-header">
              <div className="cap-title">{cap.title}</div>
              <div className={`cap-badge ${s.cls}`}>{s.label}</div>
            </div>
            <div className="cap-reason">{cap.evidence}</div>
            <div className="cap-bar">
              <div className="cap-fill" style={{ background:s.clr, width:`${cap.confidence||50}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Timeline({ steps, note }: { steps:RampupStep[]; note:string }) {
  return (
    <>
      <div className="learning-timeline">
        {(steps||[]).map((t,i) => (
          <div key={i} className="lt-item">
            <div className={`lt-dot${t.filled?' filled':''}`} />
            <div className="lt-period">{t.period}</div>
            <div className="lt-label">{t.label}</div>
          </div>
        ))}
      </div>
      {note && <p style={{fontSize:'0.75rem',color:'var(--muted)',marginTop:'14px',lineHeight:'1.6'}}>{note}</p>}
    </>
  )
}

function StrengthsList({ items }: { items:Strength[] }) {
  return (
    <div>
      {(items||[]).map((s,i) => (
        <div key={i} className="advice-item">
          <div className="a-icon do">💪</div>
          <div>
            <strong style={{fontSize:'0.84rem'}}>{s.title}</strong>
            <br />
            <span style={{color:'var(--muted)',fontSize:'0.77rem'}}>{s.detail}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GapsList({ items }: { items:Gap[] }) {
  const sev = {
    CRITICAL:{ ic:'avoid', em:'🔴', cl:'#DC2626' },
    MODERATE:{ ic:'fix',   em:'🟡', cl:'#D97706' },
    MINOR:   { ic:'learn', em:'🔵', cl:'#6366F1' },
  }
  return (
    <div>
      {(items||[]).map((g,i) => {
        const s = sev[g.severity] || sev.MODERATE
        return (
          <div key={i} className="advice-item">
            <div className={`a-icon ${s.ic}`}>{s.em}</div>
            <div>
              <strong style={{fontSize:'0.84rem'}}>{g.title}</strong>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.08em',color:s.cl,marginLeft:'8px'}}>{g.severity}</span>
              <br />
              <span style={{color:'var(--muted)',fontSize:'0.76rem'}}>How to address: {g.howToAddress}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuestionsList({ items }: { items:Question[] }) {
  return (
    <div>
      {(items||[]).map((q,i) => (
        <div key={i} className="question-item">
          <div className="q-meta">
            <div className="q-num">Q{i+1}</div>
            <div className="q-type">{q.type}</div>
          </div>
          <div>
            <div className="q-text">{q.question}</div>
            <div className="q-hint">💡 Assessing: {q.hint}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsView({ d, onReset }: { d:AnalyzeResult; onReset:()=>void }) {
  return (
    <div className="results-section">
      <VerdictBanner d={d} />
      <ScoreRow d={d} />
      <div className="section-card">
        <div className="section-title"><div className="icon">⚡</div>Capability Breakdown</div>
        <p className="section-sub">Each core JD responsibility evaluated against your real experience — not keywords, but actual capability.</p>
        <CapabilityList caps={d.capabilities} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">📈</div>Realistic Ramp-Up Timeline</div>
        <Timeline steps={d.rampupTimeline} note={d.rampupNote} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">💪</div>What You Genuinely Bring</div>
        <StrengthsList items={d.strengths} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">🔦</div>Honest Gaps & How to Address Them</div>
        <GapsList items={d.gaps} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">🎙️</div>Tailored Interview Questions</div>
        <p className="section-sub">Questions an interviewer would ask <em>this specific person</em> for <em>this specific role</em> — not generic templates.</p>
        <QuestionsList items={d.interviewQuestions} />
      </div>
      <button className="retry-btn" onClick={onReset}>← Analyze Another Role</button>
    </div>
  )
}

// ─── Upload Box ───────────────────────────────────────────────────────────────
function UploadBox({ label, sub, icon, inputRef, nameId }: {
  label:string; sub:string; icon:string
  inputRef:React.RefObject<HTMLInputElement>; nameId:string
}) {
  const [fileName, setFileName] = useState('')
  const [hasFile,  setHasFile]  = useState(false)
  const [drag,     setDrag]     = useState(false)

  const mark = (file:File) => { setFileName(file.name); setHasFile(true) }

  return (
    <div
      className={`upload-box${hasFile?' has-file':''}${drag?' dragover':''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true)  }}
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
      {fileName && <div className="file-name" style={{display:'inline-block'}}>{fileName}</div>}
      <input
        ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt"
        style={{display:'none'}}
        onChange={e => { if (e.target.files?.[0]) mark(e.target.files[0]) }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<AnalyzeResult|null>(null)
  const [error,   setError]   = useState('')
  const [jdText,  setJdText]  = useState('')
  const resumeRef = useRef<HTMLInputElement>(null)
  const jdFileRef = useRef<HTMLInputElement>(null)

  const animateSteps = useCallback(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i > 0) {
        const prev = document.getElementById(`p1-step${i}`)
        if (prev) prev.className = 'thinking-step done'
      }
      i++
      if (i <= 5) {
        const cur = document.getElementById(`p1-step${i}`)
        if (cur) cur.className = 'thinking-step active'
      } else clearInterval(iv)
    }, 1800)
    return iv
  }, [])

  async function handleAnalyze() {
    const resumeFile = resumeRef.current?.files?.[0]
    const jdFile     = jdFileRef.current?.files?.[0]
    if (!resumeFile)         { setError('Please upload your resume.');                          return }
    if (!jdText && !jdFile)  { setError('Please paste a job description or upload a JD file.'); return }

    setError(''); setResult(null); setLoading(true)
    const iv = animateSteps()

    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      if (jdText) fd.append('jdText', jdText)
      if (jdFile) fd.append('jdFile', jdFile)

      const res  = await fetch('/api/analyze', { method:'POST', body:fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed')
      setResult(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      clearInterval(iv); setLoading(false)
    }
  }

  if (result) return <ResultsView d={result} onReset={() => setResult(null)} />

  return (
    <div>
      <div className="hero">
        <div className="hero-label">✦ Beyond keyword matching — real capability assessment</div>
        <h1>Can you <em>actually</em><br />do this job?</h1>
        <p className="hero-sub">
          Upload your resume and the job description. Verscly thinks like a senior hiring
          manager — analyzing real experience, transferable ability, and learning potential.
        </p>
      </div>

      <div className="section-wrap">
        {loading ? (
          <LoadingView />
        ) : (
          <>
            {error && <div className="error-box">⚠ {error}</div>}
            <div className="two-col">
              <UploadBox label="Your Resume"          sub="PDF, DOCX, or TXT"                  icon="📄" inputRef={resumeRef} nameId="resume" />
              <UploadBox label="Job Description File" sub="Optional — upload or paste below"   icon="💼" inputRef={jdFileRef} nameId="jdfile" />
            </div>
            <div className="jd-box">
              <label>Job Description <span>PASTE TEXT OR UPLOAD FILE ABOVE</span></label>
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here — include responsibilities, requirements, and qualifications..."
              />
            </div>
            <button className="primary-btn" onClick={handleAnalyze}>
              ✦ Analyze My Real Fit
            </button>
          </>
        )}
      </div>
    </div>
  )
}
