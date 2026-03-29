'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import type { FlowAnalysis } from '@/lib/flowTypes'
import {
  readDraftJd,
  writeDraftJd,
  loadDraftResume,
  saveDraftResume,
  clearAllFormDraft,
} from '@/lib/formDraft'

export default function ResumeAnalyzePage() {
  const router = useRouter()
  const { commitSession } = useSession()
  const resumeRef = useRef<HTMLInputElement>(null)
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** Kept in state — clearing the file input’s value (for “pick same file again”) wipes `files`, so analyze must not rely on the ref alone. */
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const [draftHydrated, setDraftHydrated] = useState(false)

  useEffect(() => {
    setJdText(readDraftJd())
    void loadDraftResume().then(f => {
      if (f && resumeRef.current) {
        const dt = new DataTransfer()
        dt.items.add(f)
        resumeRef.current.files = dt.files
        setResumeFile(f)
      }
    }).finally(() => setDraftHydrated(true))
  }, [])

  useEffect(() => {
    if (!draftHydrated) return
    const t = setTimeout(() => writeDraftJd(jdText), 400)
    return () => clearTimeout(t)
  }, [jdText, draftHydrated])

  const markFile = useCallback((f: File) => {
    setResumeFile(f)
    void saveDraftResume(f)
  }, [])

  async function handleAnalyze() {
    const file = resumeFile ?? resumeRef.current?.files?.[0]
    if (!file?.size) {
      setError('Upload your resume.')
      return
    }
    if (!jdText.trim() || jdText.trim().length < 50) {
      setError('Paste a complete job description (at least 50 characters).')
      return
    }

    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('resume', file)
      fd.append('jdText', jdText.trim())
      fd.append('positionName', '')
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed')
      const resumeText = (json.meta?.resumeText as string) || ''
      if (resumeText.length < 50) throw new Error('Could not read resume text.')
      await commitSession({
        positionName: '',
        jdText: jdText.trim(),
        resumeText,
        analysis: json.data as FlowAnalysis,
      })
      await clearAllFormDraft()
      router.push('/profile-score')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <header className="hero">
        <h1>
          Resume <em>analyze</em>
        </h1>
        <p className="hero-sub">
          Upload your resume and paste the job description. We extract fit, strengths, and gaps before interview prep.
        </p>
      </header>

      <div className="section-wrap">
        {error ? <div className="error-box">{error}</div> : null}

        <input
          id="verscly-resume-file"
          ref={resumeRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="resume-file-input-hidden"
          tabIndex={-1}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) markFile(f)
          }}
        />

        <div className="two-col">
          <label
            htmlFor="verscly-resume-file"
            className={`upload-box${resumeFile ? ' has-file' : ''}${drag ? ' dragover' : ''}`}
            onDragOver={e => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault()
              setDrag(false)
              const f = e.dataTransfer.files[0]
              if (f && resumeRef.current) {
                const dt = new DataTransfer()
                dt.items.add(f)
                resumeRef.current.files = dt.files
                markFile(f)
              }
            }}
          >
            <div className="box-icon linear-icon-wrap">
              <FileText size={22} strokeWidth={1.75} />
            </div>
            <div className="box-label">Resume</div>
            <div className="box-sub">PDF, DOCX, or TXT — click to choose</div>
            {resumeFile ? <div className="file-name file-name-visible">{resumeFile.name}</div> : null}
          </label>

          <div className="jd-box linear-jd-box-merge">
            <label className="linear-label">
              <FileText size={16} strokeWidth={2} className="linear-label-icon" />
              Job description
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full posting: responsibilities, requirements, qualifications."
              style={{ minHeight: '220px' }}
            />
          </div>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleAnalyze}
          disabled={loading || !resumeFile}
        >
          {loading ? (
            <>
              <Loader2 className="linear-btn-spinner" size={20} strokeWidth={2} />
              Analyzing
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </div>
  )
}
