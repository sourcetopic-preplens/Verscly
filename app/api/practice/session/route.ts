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
    const formData = await req.formData()
    const resumeFile = formData.get('resume') as File | null
    const resumeTextField = ((formData.get('resumeText') as string | null) ?? '').trim()
    const jdText = (formData.get('jdText') as string | null) ?? ''
    const jdFile = formData.get('jdFile') as File | null
    const targetRole = ((formData.get('targetRole') as string | null) ?? '').slice(0, 300)
    const positionName = ((formData.get('positionName') as string | null) ?? '').trim().slice(0, 200)
    const gapsFocus = ((formData.get('gapsFocus') as string | null) ?? '').trim().slice(0, 4000)

    const hasFile = resumeFile && resumeFile.size > 0
    let resumeText: string
    if (hasFile) {
      const resumeBuf = Buffer.from(await resumeFile.arrayBuffer())
      resumeText = (await extractTextFromBuffer(resumeBuf, resumeFile.name)).slice(0, 15000)
    } else if (resumeTextField.length >= 50) {
      resumeText = resumeTextField.slice(0, 15000)
    } else {
      return NextResponse.json({ error: 'Resume file or resume text is required.' }, { status: 400 })
    }

    if (!jdText && !jdFile)
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 })

    let finalJD = jdText
    if (!jdText && jdFile) {
      const jdBuf = Buffer.from(await jdFile.arrayBuffer())
      finalJD = (await extractTextFromBuffer(jdBuf, jdFile.name)).slice(0, 8000)
    }

    if (finalJD.length < 50)
      return NextResponse.json({ error: 'Job description is too short.' }, { status: 400 })

    const roleCtx = [targetRole && `TARGET ROLE: ${targetRole}`, positionName && `POSITION: ${positionName}`]
      .filter(Boolean)
      .join('\n')

    const gapBlock = gapsFocus
      ? `\nPRIORITY GAP TARGETING — prioritize Gap-probe, Technical, and Situational questions that stress-test these gaps; require candidates to show proof, metrics, and closure plans:\n${gapsFocus}\n`
      : ''

    const prompt = `PRACTICE_SESSION

You are a premium interview coach + senior hiring manager. Read the resume like a human would (line-by-line understanding), then build an interview practice plan based on the JD.

Goals:
- Explain what you infer about the candidate (experience, skills, seniority, career arc).
- Infer candidate location and job location (if present) and assess location fit (same city/country, remote, relocation suggestion).
- Assess domain adaptability: can they work in the new environment/domain even without direct prior domain experience? Be honest and explain why.
- Create a question ladder from EASY → HARD using JD responsibilities + candidate experience.
- Mix question types: Behavioral, Experience, Situational, Technical, Gap-probe.
${gapBlock}
RESUME:
${resumeText}

JOB DESCRIPTION:
${finalJD}
${roleCtx ? `\n${roleCtx}\n` : ''}

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "title": "<short premium session title>",
  "candidateSnapshot": {
    "name": "<name or 'Candidate'>",
    "currentRole": "<best guess>",
    "seniority": "<Junior|Mid|Senior|Lead|Manager|Executive>",
    "domainBackground": "<1 sentence>",
    "coreSkills": ["<skill>", "..."],
    "notableSignals": ["<signal>", "..."]
  },
  "locationFit": {
    "candidateLocation": "<from resume or 'Unknown'>",
    "jobLocation": "<from JD or 'Unknown'>",
    "fit": "<MATCH|REMOTE_OK|RELOCATE|UNCLEAR>",
    "note": "<1-2 sentences: suggestion + risks>"
  },
  "adaptability": {
    "verdict": "<YES|MAYBE|NO>",
    "why": "<2-3 sentences referencing resume evidence>",
    "transferableStrengths": ["<strength>", "..."],
    "riskFactors": ["<risk>", "..."],
    "fastRampPlan": ["<step>", "<step>", "<step>"]
  },
  "practiceGuidance": "<short coach guidance: how to answer, STAR, metrics, honesty>",
  "questions": [
    {
      "id": "<stable id>",
      "difficulty": "<EASY|MEDIUM|HARD>",
      "type": "<Behavioral|Experience|Situational|Technical|Gap-probe>",
      "question": "<question>",
      "hint": "<what interviewer is assessing>",
      "whatGoodLooksLike": ["<bullet>", "<bullet>", "<bullet>"]
    }
  ]
}

Provide 12-18 questions with clear EASY→HARD progression. If PRIORITY GAP TARGETING is present, at least half the HARD questions must directly confront those gaps.`

    const raw = await callClaude(prompt, 4500)
    const result = safeParseJSON(raw)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Practice session failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
