'use client'
import { useState, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dimension   { name:string; emoji:string; score:number; color:string; issues:{text:string;type:string}[] }
interface Skill       { name:string; level:number; status:'STRONG'|'GOOD'|'DEVELOPING'|'MISSING'; note:string }
interface SkillCat    { category:string; emoji:string; categoryScore:number; skills:Skill[] }
interface GapItem     { text:string; severity:'CRITICAL'|'IMPORTANT'|'NICE' }
interface SectionGap  { section:string; emoji:string; description:string; items:GapItem[] }
interface HealthCheck { label:string; emoji:string; status:'PASS'|'WARN'|'FAIL'; detail:string }
interface Suggestion  { priority:'HIGH'|'MEDIUM'|'LOW'; emoji:string; title:string; description:string; action:string }
interface Narrative   { clarity:number; progression:string; assessment:string; suggestion:string }
interface ProfileResult {
  name:string; currentRole:string; profileScore:number; grade:string; summary:string
  dimensions:Dimension[]; skillCategories:SkillCat[]; sectionGaps:SectionGap[]
  healthChecks:HealthCheck[]; suggestions:Suggestion[]; careerNarrative:Narrative
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score:number }) {
  const r = 54, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="big-score-ring">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="65" cy="65" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8f542" />
            <stop offset="100%" stopColor="#4dffa0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="big-score-center">
        <div className="big-score-num">{score}</div>
        <div className="big-score-label">PROFILE<br />SCORE</div>
      </div>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingView() {
  const steps = [
    { icon:'🧠', text:'Reading career narrative & trajectory' },
    { icon:'🎨', text:'Scoring resume quality dimensions' },
    { icon:'⚡', text:'Mapping your skill landscape' },
    { icon:'🔦', text:'Identifying gaps by category' },
    { icon:'📋', text:'Building your improvement roadmap' },
  ]
  return (
    <div style={{ textAlign:'center', padding:'60px 40px' }}>
      <div className="spinner-sm" />
      <div className="loading-title">Auditing your entire profile…</div>
      <div className="loading-sub">SCORING, ANALYZING GAPS, BUILDING YOUR IMPROVEMENT PLAN</div>
      <div className="thinking-box">
        <div className="thinking-label">AI AUDIT PROCESS</div>
        {steps.map((s,i) => (
          <div key={i} className="thinking-step" id={`p2-step${i+1}`}>
            <div className="step-icon">{s.icon}</div>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────
function ProfileHero({ d }: { d:ProfileResult }) {
  const gradeMap   = { S:'grade-S', A:'grade-A', B:'grade-B', C:'grade-C', D:'grade-D' }
  const gradeLabel = {
    S:'⭐ S-Tier — Exceptional Profile', A:'✅ A-Grade — Strong Profile',
    B:'📈 B-Grade — Solid, Room to Grow', C:'⚡ C-Grade — Needs Work', D:'🔧 D-Grade — Significant Gaps',
  }
  const g = d.grade || 'B'
  return (
    <div className="profile-hero">
      <ScoreRing score={d.profileScore || 0} />
      <div className="profile-info">
        <div className="profile-name">{d.name || 'Your Profile'}</div>
        <div className="profile-role">{d.currentRole || ''}</div>
        <div className="profile-summary">{d.summary || ''}</div>
        <div className={`grade-badge ${gradeMap[g as keyof typeof gradeMap] || 'grade-B'}`}>
          {gradeLabel[g as keyof typeof gradeLabel] || g}
        </div>
      </div>
    </div>
  )
}

function DimensionGrid({ dims }: { dims:Dimension[] }) {
  return (
    <div className="dimension-grid">
      {(dims||[]).map((dim,i) => (
        <div key={i} className="dimension-card">
          <div className="dim-header">
            <div className="dim-name">{dim.emoji} {dim.name}</div>
            <div className="dim-score" style={{color:dim.color||'#c8f542'}}>{dim.score}</div>
          </div>
          <div className="dim-bar-track">
            <div className="dim-bar-fill" style={{background:dim.color||'#c8f542',width:`${dim.score}%`}} />
          </div>
          <div>
            {(dim.issues||[]).map((issue,j) => (
              <div key={j} className={`dim-issue ${issue.type||''}`}>{issue.text}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillLandscape({ cats }: { cats:SkillCat[] }) {
  const clrMap  = { STRONG:'#4dffa0', GOOD:'#c8f542', DEVELOPING:'#ffd166', MISSING:'#ff4d6d' }
  const chipMap = { STRONG:'chip-strong', GOOD:'chip-good', DEVELOPING:'chip-learn', MISSING:'chip-missing' }
  return (
    <div>
      {(cats||[]).map((cat,i) => (
        <div key={i} className="skill-category">
          <div className="skill-cat-header">
            <div className="skill-cat-name">{cat.emoji||'⚡'} {cat.category}</div>
            <div className="skill-cat-score">Category strength: {cat.categoryScore||0}%</div>
          </div>
          <div className="skill-list">
            {(cat.skills||[]).map((s,j) => (
              <div key={j}>
                <div className="skill-row">
                  <div className="skill-name" title={s.name}>{s.name}</div>
                  <div className="skill-track">
                    <div className="skill-fill" style={{background:clrMap[s.status]||'#c8f542',width:`${s.level||50}%`}} />
                  </div>
                  <div className="skill-pct">{s.level||0}%</div>
                  <div className={`skill-status-chip ${chipMap[s.status]||'chip-good'}`}>{s.status}</div>
                </div>
                {s.note && (
                  <div style={{fontSize:'0.7rem',color:'var(--muted)',paddingLeft:'181px',marginTop:'-2px',marginBottom:'2px',lineHeight:'1.5'}}>
                    {s.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionGaps({ gaps }: { gaps:SectionGap[] }) {
  const sevCls = { CRITICAL:'critical', IMPORTANT:'important', NICE:'nice' }
  const sevEm  = { CRITICAL:'🔴 ', IMPORTANT:'🟡 ', NICE:'🔵 ' }
  return (
    <div>
      {(gaps||[]).map((sec,i) => (
        <div key={i} className="gap-section">
          <div className="gap-sec-title">{sec.emoji||'📄'} {sec.section}</div>
          <div className="gap-sec-sub">{sec.description}</div>
          <div className="gap-chips">
            {(sec.items||[]).map((it,j) => (
              <span key={j} className={`gap-chip ${sevCls[it.severity]||'important'}`}>
                {sevEm[it.severity]||''}{it.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HealthGrid({ checks }: { checks:HealthCheck[] }) {
  const hCls = { PASS:'health-pass', WARN:'health-warn', FAIL:'health-fail' }
  const hLbl = { PASS:'✓ Pass', WARN:'⚠ Warning', FAIL:'✕ Fail' }
  return (
    <div className="health-grid">
      {(checks||[]).map((h,i) => (
        <div key={i} className="health-item">
          <div className="health-emoji">{h.emoji||'✅'}</div>
          <div className="health-label">{h.label}</div>
          <div className={`health-status ${hCls[h.status]||'health-warn'}`}>{hLbl[h.status]||h.status}</div>
          {h.detail && (
            <div style={{fontSize:'0.68rem',color:'var(--muted)',marginTop:'4px',lineHeight:'1.4'}}>{h.detail}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function Suggestions({ items }: { items:Suggestion[] }) {
  const priCls = { HIGH:'sug-high', MEDIUM:'sug-med', LOW:'sug-low' }
  const priLbl = { HIGH:'HIGH PRIORITY', MEDIUM:'MEDIUM PRIORITY', LOW:'LOW PRIORITY' }
  return (
    <div>
      {(items||[]).map((s,i) => (
        <div key={i} className="suggestion-item">
          <div className={`sug-icon-wrap ${priCls[s.priority]||'sug-med'}`}>{s.emoji||'💡'}</div>
          <div className="sug-content">
            <div className={`sug-priority ${(s.priority||'MEDIUM').toLowerCase()}`}>
              {priLbl[s.priority]||'MEDIUM PRIORITY'}
            </div>
            <div className="sug-title">{s.title}</div>
            <div className="sug-desc">{s.description}</div>
            <div className="sug-action">→ {s.action}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CareerNarrative({ cn }: { cn:Narrative }) {
  const progLabel: Record<string,string> = {
    LINEAR:'📈 Linear Progression', ZIGZAG:'↔️ Non-Linear Path',
    PIVOT:'🔄 Career Pivot',        EARLY:'🌱 Early Career',
  }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',flexWrap:'wrap'}}>
        <div style={{
          background:'var(--surface2)',border:'1px solid var(--border)',
          borderRadius:'12px',padding:'14px 18px',flex:1,minWidth:'130px',textAlign:'center',
        }}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.56rem',letterSpacing:'0.1em',color:'var(--muted)',marginBottom:'6px'}}>
            NARRATIVE CLARITY
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',color:'#c8f542'}}>
            {cn.clarity||0}<span style={{fontSize:'0.9rem',color:'var(--muted)'}}>%</span>
          </div>
        </div>
        <div style={{
          background:'var(--surface2)',border:'1px solid var(--border)',
          borderRadius:'12px',padding:'14px 18px',flex:1,minWidth:'130px',textAlign:'center',
        }}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.56rem',letterSpacing:'0.1em',color:'var(--muted)',marginBottom:'6px'}}>
            CAREER TYPE
          </div>
          <div style={{fontSize:'0.84rem',fontWeight:600,marginTop:'4px',color:'var(--text)'}}>
            {progLabel[cn.progression]||cn.progression||'—'}
          </div>
        </div>
      </div>
      <div style={{fontSize:'0.84rem',color:'var(--muted)',lineHeight:'1.7',marginBottom:'12px'}}>
        {cn.assessment||''}
      </div>
      <div style={{
        background:'rgba(200,245,66,0.06)',border:'1px solid rgba(200,245,66,0.2)',
        borderRadius:'12px',padding:'14px',fontSize:'0.82rem',lineHeight:'1.6',color:'var(--text)',
      }}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'#c8f542',letterSpacing:'0.1em'}}>
          RECOMMENDATION →{' '}
        </span>
        {cn.suggestion||''}
      </div>
    </div>
  )
}

function ResultsView({ d, onReset }: { d:ProfileResult; onReset:()=>void }) {
  return (
    <div className="results-section">
      <ProfileHero d={d} />
      <div className="section-card">
        <div className="section-title"><div className="icon">📐</div>Resume Quality Dimensions</div>
        <p className="section-sub">How your resume scores across the key dimensions that hiring managers and ATS systems evaluate.</p>
        <DimensionGrid dims={d.dimensions} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">⚡</div>Skill Landscape — Where You Stand</div>
        <p className="section-sub">Your skills mapped by category — what you&apos;re strong in, what&apos;s developing, and what&apos;s missing for your target trajectory.</p>
        <SkillLandscape cats={d.skillCategories} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">🔦</div>Where the Gaps Live — By Resume Section</div>
        <p className="section-sub">Specific gaps identified in each part of your resume, categorized by how critical they are to fix.</p>
        <SectionGaps gaps={d.sectionGaps} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">✅</div>Resume Health Check</div>
        <p className="section-sub">Structural and formatting issues that affect ATS parsing and recruiter first impression.</p>
        <HealthGrid checks={d.healthChecks} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">🗺️</div>Your Improvement Roadmap</div>
        <p className="section-sub">Prioritized action items — what to fix first, what skills to build, and how to reframe your experience.</p>
        <Suggestions items={d.suggestions} />
      </div>
      <div className="section-card">
        <div className="section-title"><div className="icon">📖</div>Career Narrative Assessment</div>
        <CareerNarrative cn={d.careerNarrative} />
      </div>
      <button className="retry-btn" onClick={onReset}>← Audit Another Resume</button>
    </div>
  )
}

// ─── Upload Box ───────────────────────────────────────────────────────────────
function UploadBox({ label, sub, icon, inputRef }: {
  label:string; sub:string; icon:string; inputRef:React.RefObject<HTMLInputElement>
}) {
  const [fileName, setFileName] = useState('')
  const [hasFile,  setHasFile]  = useState(false)
  const [drag,     setDrag]     = useState(false)
  const mark = (f:File) => { setFileName(f.name); setHasFile(true) }
  return (
    <div
      className={`upload-box${hasFile?' has-file':''}${drag?' dragover':''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f && inputRef.current) {
          const dt = new DataTransfer(); dt.items.add(f)
          inputRef.current.files = dt.files; mark(f)
        }
      }}
    >
      <div className="box-icon">{icon}</div>
      <div className="box-label">{label}</div>
      <div className="box-sub">{sub}</div>
      {fileName && <div className="file-name" style={{display:'inline-block'}}>{fileName}</div>}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:'none'}}
        onChange={e => { if (e.target.files?.[0]) mark(e.target.files[0]) }} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<ProfileResult|null>(null)
  const [error,      setError]      = useState('')
  const [targetRole, setTargetRole] = useState('')
  const resumeRef = useRef<HTMLInputElement>(null)

  const animateSteps = useCallback(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i > 0) {
        const prev = document.getElementById(`p2-step${i}`)
        if (prev) prev.className = 'thinking-step done'
      }
      i++
      if (i <= 5) {
        const cur = document.getElementById(`p2-step${i}`)
        if (cur) cur.className = 'thinking-step active'
      } else {
        clearInterval(iv)
      }
    }, 1800)
    return iv
  }, [])

  async function handleAudit() {
    const resumeFile = resumeRef.current?.files?.[0]
    if (!resumeFile) { setError('Please upload your resume to audit.'); return }

    setError(''); setResult(null); setLoading(true)
    const iv = animateSteps()

    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      if (targetRole) fd.append('targetRole', targetRole)

      const res  = await fetch('/api/profile', { method:'POST', body:fd })
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
        <div className="hero-label">Standalone resume intelligence — no JD needed</div>
        <h1>Your <em>profile</em><br />score &amp; audit</h1>
        <p className="hero-sub">
          Upload just your resume. Get a deep audit of your profile strength, skill gaps
          by category, resume quality issues, and a concrete action plan to level up.
        </p>
      </div>

      <div className="section-wrap">
        {loading ? (
          <LoadingView />
        ) : (
          <>
            {error && <div className="error-box">⚠ {error}</div>}
            <UploadBox
              label="Upload Your Resume"
              sub="PDF, DOCX, or TXT — just your resume, no job description needed"
              icon="📄"
              inputRef={resumeRef}
            />
            <div className="jd-box" style={{ marginTop:'16px' }}>
              <label>Target Role / Industry <span>OPTIONAL — HELPS CALIBRATE THE ANALYSIS</span></label>
              <textarea
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. 'Senior Product Manager at a B2B SaaS company' — helps tailor the skill gap analysis to where you want to go..."
                style={{ minHeight:'90px' }}
              />
            </div>
            <button className="primary-btn" onClick={handleAudit}>
              Audit My Profile
            </button>
          </>
        )}
      </div>
    </div>
  )
}
