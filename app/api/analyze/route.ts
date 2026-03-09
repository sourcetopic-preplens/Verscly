import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { extractTextFromBuffer } from '@/lib/extractText'
import { safeParseJSON } from '@/lib/safeParseJSON'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip).ok)
    return NextResponse.json({ error: 'Too many requests — wait 1 minute.' }, { status: 429 })

  try {
    const formData  = await req.formData()
    const resumeFile = formData.get('resume') as File | null
    const jdText     = (formData.get('jdText') as string | null) ?? ''
    const jdFile     = formData.get('jdFile') as File | null

    if (!resumeFile)
      return NextResponse.json({ error: 'Resume file is required.' }, { status: 400 })
    if (!jdText && !jdFile)
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 })

    const resumeBuf  = Buffer.from(await resumeFile.arrayBuffer())
    const resumeText = (await extractTextFromBuffer(resumeBuf, resumeFile.name)).slice(0, 15000)

    let finalJD = jdText
    if (!jdText && jdFile) {
      const jdBuf = Buffer.from(await jdFile.arrayBuffer())
      finalJD = (await extractTextFromBuffer(jdBuf, jdFile.name)).slice(0, 8000)
    }

    if (finalJD.length < 50)
      return NextResponse.json({ error: 'Job description is too short.' }, { status: 400 })

    const prompt = `You are a senior hiring manager with 20+ years of experience. Make a REAL human assessment of whether this person can do this job — not keyword matching, but genuine capability analysis.

Consider: actual work done, transferable skills, domain knowledge, learning trajectory, career arc.

RESUME:
${resumeText}

JOB DESCRIPTION:
${finalJD}

Respond ONLY with valid JSON, no markdown, no backticks:

{
  "verdict": "<YES|STRETCH|NO>",
  "verdictTitle": "<honest 6-9 word verdict>",
  "verdictDesc": "<2-3 sentences. Reference ACTUAL resume content. Be specific and direct.>",
  "overallScore": <0-100>,
  "scores": [
    {"label": "Day-1 Ready", "value": <0-100>, "description": "<specific tasks ready now>", "color": "#10B981"},
    {"label": "Transferable", "value": <0-100>, "description": "<what crosses over>", "color": "#6366F1"},
    {"label": "Gap Severity", "value": <0-100, 100=tiny gap>, "description": "<learning required>", "color": "#F59E0B"},
    {"label": "Domain Fit", "value": <0-100>, "description": "<industry/culture fit>", "color": "#6366F1"}
  ],
  "capabilities": [
    {"title": "<JD responsibility>", "status": "<READY|PARTIAL|TRANSFERABLE|GAP>", "evidence": "<specific evidence from resume OR gap explanation>", "confidence": <0-100>}
  ],
  "rampupTimeline": [
    {"period": "Week 1-2", "filled": true, "label": "<immediate contribution>"},
    {"period": "Month 1", "filled": true, "label": "<end of month 1>"},
    {"period": "Month 3", "filled": false, "label": "<month 3 milestone>"},
    {"period": "Month 6", "filled": false, "label": "<full productivity>"}
  ],
  "rampupNote": "<specific learning curve explanation>",
  "strengths": [{"title": "<genuine strength>", "detail": "<concrete resume evidence + why it matters for this role>"}],
  "gaps": [{"title": "<specific gap>", "severity": "<CRITICAL|MODERATE|MINOR>", "howToAddress": "<concrete action>"}],
  "interviewQuestions": [{"question": "<specific question for THIS person for THIS role>", "type": "<Behavioral|Technical|Situational|Experience|Gap-probe>", "hint": "<what interviewer is assessing>"}]
}

Provide 5-7 capabilities, 3-5 strengths, 3-5 gaps, 6-8 questions. Be honest and specific.`

    const raw    = await callClaude(prompt)
    const result = safeParseJSON(raw)
    return NextResponse.json({ success: true, data: result })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
