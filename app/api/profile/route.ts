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
    const formData   = await req.formData()
    const resumeFile = formData.get('resume') as File | null
    const targetRole = ((formData.get('targetRole') as string | null) ?? '').slice(0, 300)

    if (!resumeFile)
      return NextResponse.json({ error: 'Resume file is required.' }, { status: 400 })

    const buf        = Buffer.from(await resumeFile.arrayBuffer())
    const resumeText = (await extractTextFromBuffer(buf, resumeFile.name)).slice(0, 15000)
    const roleCtx    = targetRole ? `\n\nTARGET ROLE / INDUSTRY: ${targetRole}` : ''

    const prompt = `You are a world-class career coach and resume expert. Perform a deep, honest audit of this resume. Analyze it as if you're preparing detailed feedback for a coaching session.

RESUME:
${resumeText}${roleCtx}

Respond ONLY with valid JSON, no markdown, no backticks:

{
  "name": "<person's name from resume or 'Your Profile'>",
  "currentRole": "<their current/most recent role title>",
  "profileScore": <0-100, honest overall profile strength>,
  "grade": "<S|A|B|C|D>",
  "summary": "<2-3 sentence honest assessment of where they stand as a professional. Be specific about their strengths and the single biggest thing holding their profile back.>",
  "dimensions": [
    {
      "name": "Work Experience", "emoji": "💼", "score": <0-100>, "color": "#6366F1",
      "issues": [{"text": "<specific finding>", "type": "<ok|bad>"}]
    },
    {
      "name": "Skills Section", "emoji": "⚡", "score": <0-100>, "color": "#10B981",
      "issues": [{"text": "<finding>", "type": "<ok|bad>"}]
    },
    {
      "name": "Education", "emoji": "🎓", "score": <0-100>, "color": "#F59E0B",
      "issues": [{"text": "<finding>", "type": "<ok|bad>"}]
    },
    {
      "name": "Impact & Metrics", "emoji": "📊", "score": <0-100>, "color": "#EF4444",
      "issues": [{"text": "<finding>", "type": "<ok|bad>"}]
    },
    {
      "name": "Resume Formatting", "emoji": "📐", "score": <0-100>, "color": "#6366F1",
      "issues": [{"text": "<finding>", "type": "<ok|bad>"}]
    },
    {
      "name": "Career Progression", "emoji": "📈", "score": <0-100>, "color": "#10B981",
      "issues": [{"text": "<finding>", "type": "<ok|bad>"}]
    }
  ],
  "skillCategories": [
    {
      "category": "<skill category name>", "emoji": "<emoji>", "categoryScore": <0-100>,
      "skills": [
        {"name": "<skill>", "level": <0-100>, "status": "<STRONG|GOOD|DEVELOPING|MISSING>", "note": "<brief honest note>"}
      ]
    }
  ],
  "sectionGaps": [
    {
      "section": "<resume section>", "emoji": "<emoji>",
      "description": "<what's missing or weak>",
      "items": [{"text": "<specific gap>", "severity": "<CRITICAL|IMPORTANT|NICE>"}]
    }
  ],
  "healthChecks": [
    {"label": "<check name>", "emoji": "<emoji>", "status": "<PASS|WARN|FAIL>", "detail": "<brief explanation>"}
  ],
  "suggestions": [
    {
      "priority": "<HIGH|MEDIUM|LOW>", "emoji": "<emoji>",
      "title": "<specific actionable title>",
      "description": "<2-3 sentences explaining the problem and solution. Reference specific resume content.>",
      "action": "<concrete first step>"
    }
  ],
  "careerNarrative": {
    "clarity": <0-100>,
    "progression": "<LINEAR|ZIGZAG|PIVOT|EARLY>",
    "assessment": "<2-3 sentences about their career story>",
    "suggestion": "<specific advice to sharpen narrative>"
  }
}

Provide: 6 dimensions with 2-3 issues each, 3-5 skill categories with 4-6 skills each, 3-5 section gaps with 2-4 items each, 6-8 health checks, 5-7 suggestions ordered by priority. Be specific and reference actual resume content throughout.`

    const raw    = await callClaude(prompt, 4500)
    const result = safeParseJSON(raw)
    return NextResponse.json({ success: true, data: result })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
