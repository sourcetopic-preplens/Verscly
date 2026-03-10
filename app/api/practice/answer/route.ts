import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { safeParseJSON } from '@/lib/safeParseJSON'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip).ok)
    return NextResponse.json({ error: 'Too many requests — wait 1 minute.' }, { status: 429 })

  try {
    const body = await req.json()
    const question = (body?.question as string | undefined) ?? ''
    const hint = (body?.hint as string | undefined) ?? ''
    const difficulty = (body?.difficulty as string | undefined) ?? 'MEDIUM'
    const answer = (body?.answer as string | undefined) ?? ''
    const resumeText = (body?.resumeText as string | undefined) ?? ''
    const jdText = (body?.jdText as string | undefined) ?? ''

    if (!question || question.length < 8)
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
    if (!answer || answer.length < 10)
      return NextResponse.json({ error: 'Answer is too short.' }, { status: 400 })

    const prompt = `PRACTICE_FEEDBACK

You are a premium interview coach. Evaluate the candidate's answer for this specific question.
Be honest, specific, and practical. Encourage clarity, metrics, decision-making, and credibility.

QUESTION (${difficulty}):
${question}

HINT (what interviewer is assessing):
${hint}

CANDIDATE ANSWER:
${answer}

CONTEXT (resume excerpt):
${resumeText.slice(0, 8000)}

CONTEXT (JD excerpt):
${jdText.slice(0, 5000)}

Respond ONLY with JSON (no markdown):
{
  "score": <0-100>,
  "strengths": ["<what was strong>", "..."],
  "misses": ["<what is missing / unclear>", "..."],
  "improvedAnswer": "<rewrite as a strong premium answer, concise but detailed>",
  "followUps": ["<probing follow-up question>", "..."]
}

Keep improvedAnswer grounded in plausible resume evidence; don't invent big claims.`

    const raw = await callClaude(prompt, 1800)
    const result = safeParseJSON(raw)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Answer feedback failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

