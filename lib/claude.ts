// SERVER ONLY — never import this in a client component
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const USE_MOCK_CLAUDE = process.env.MOCK_CLAUDE === '1'

export async function callClaude(prompt: string, maxTokens = 4000): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Dev / local mode: when key is missing or MOCK_CLAUDE=1, return realistic fixture JSON
  if (!apiKey || USE_MOCK_CLAUDE) {
    return mockClaude(prompt)
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return (data.content as Array<{ type: string; text?: string }>)
    .filter(b => b.type === 'text')
    .map(b => b.text || '')
    .join('')
    .replace(/```json|```/g, '')
    .trim()
}

function mockClaude(prompt: string): string {
  if (prompt.includes('PRACTICE_SESSION')) {
    const gapTitle = prompt.includes('PRIORITY GAP TARGETING')
      ? 'Gap-targeted interview drill'
      : 'Role readiness sprint'
    return JSON.stringify({
      title: gapTitle,
      candidateSnapshot: {
        name: 'Candidate',
        currentRole: 'Analyst / Specialist',
        seniority: 'Mid',
        domainBackground: 'Background in a domain that may differ from the target role, with transferable analytical work.',
        coreSkills: ['Analysis', 'Reporting', 'Stakeholder communication', 'Process improvement', 'Excel/Sheets'],
        notableSignals: [
          'Shows consistent responsibility growth',
          'Mentions collaboration across teams',
          'Has evidence of structured thinking',
        ],
      },
      locationFit: {
        candidateLocation: 'Unknown',
        jobLocation: 'Unknown',
        fit: 'UNCLEAR',
        note: 'Location isn’t clearly stated in the resume/JD. If the role is on-site, add a location line and confirm work authorization / relocation.',
      },
      adaptability: {
        verdict: 'MAYBE',
        why: 'The resume suggests transferable analytical skills, but direct domain exposure is limited. Adaptability depends on how quickly the candidate can learn domain constraints and tools.',
        transferableStrengths: [
          'Structured analysis and reporting',
          'Comfort operating with stakeholders',
          'Ability to learn new workflows',
        ],
        riskFactors: [
          'No clear evidence of working in the target domain',
          'Impact metrics may be under-specified',
        ],
        fastRampPlan: [
          'Map the domain: users, flows, constraints, and success metrics in week 1.',
          'Shadow 2–3 top performers and copy their operating rhythm.',
          'Ship a small scoped win within 2–3 weeks to prove traction.',
        ],
      },
      practiceGuidance:
        'Answer like a premium candidate: use STAR, quantify impact, be specific about decisions/trade-offs, and connect your experience directly to JD responsibilities.',
      questions: [
        {
          id: 'q1',
          difficulty: 'EASY',
          type: 'Experience',
          question: 'Give me a 60-second overview of your background and why this role fits you.',
          hint: 'Clarity, narrative, role alignment.',
          whatGoodLooksLike: ['Tight story arc', '2 proof points', 'Direct link to JD'],
        },
        {
          id: 'q2',
          difficulty: 'EASY',
          type: 'Behavioral',
          question: 'Tell me about a time you improved a process or workflow. What changed and what was the impact?',
          hint: 'Ownership, practical execution, measurable outcomes.',
          whatGoodLooksLike: ['Before/after', 'Metric', 'Your specific actions'],
        },
        {
          id: 'q3',
          difficulty: 'MEDIUM',
          type: 'Situational',
          question: 'If you join and realize you lack domain knowledge, what is your first 30-day plan?',
          hint: 'Ramp-up plan, humility, learning speed.',
          whatGoodLooksLike: ['Week-by-week plan', 'How you validate learning', 'Early wins'],
        },
        {
          id: 'q4',
          difficulty: 'MEDIUM',
          type: 'Gap-probe',
          question: 'What’s the biggest gap between your background and this role, and how will you close it?',
          hint: 'Self-awareness and credibility.',
          whatGoodLooksLike: ['Honest gap', 'Concrete plan', 'Evidence of learning before'],
        },
        {
          id: 'q5',
          difficulty: 'HARD',
          type: 'Technical',
          question: 'Walk me through how you would measure success for a key responsibility in this JD.',
          hint: 'Metrics, systems thinking, prioritization.',
          whatGoodLooksLike: ['North star + inputs', 'Trade-offs', 'Instrumentation'],
        },
        {
          id: 'q6',
          difficulty: 'HARD',
          type: 'Situational',
          question: 'A stakeholder demands a feature that conflicts with the strategy. What do you do?',
          hint: 'Stakeholder management, strategy, conflict resolution.',
          whatGoodLooksLike: ['Clarify goals', 'Offer alternatives', 'Decide with principles'],
        },
        {
          id: 'q7',
          difficulty: 'HARD',
          type: 'Behavioral',
          question: 'Tell me about a time you made a hard decision with incomplete information.',
          hint: 'Judgment under uncertainty.',
          whatGoodLooksLike: ['Decision framework', 'Risks', 'Outcome + learning'],
        },
        {
          id: 'q8',
          difficulty: 'MEDIUM',
          type: 'Experience',
          question: 'Pick one project from your resume and explain the business impact end-to-end.',
          hint: 'Depth, metrics, outcome focus.',
          whatGoodLooksLike: ['Problem → actions → results', 'Numbers', 'Lessons'],
        },
        {
          id: 'q9',
          difficulty: 'EASY',
          type: 'Behavioral',
          question: 'What feedback have you received at work, and what did you change because of it?',
          hint: 'Coachability, growth mindset.',
          whatGoodLooksLike: ['Specific feedback', 'Action taken', 'Result'],
        },
        {
          id: 'q10',
          difficulty: 'MEDIUM',
          type: 'Technical',
          question: 'How do you validate that a report/analysis is correct before sharing it broadly?',
          hint: 'Quality, rigor, credibility.',
          whatGoodLooksLike: ['Checks', 'Peer review', 'Edge cases'],
        },
        {
          id: 'q11',
          difficulty: 'HARD',
          type: 'Gap-probe',
          question: 'Convince me you can succeed in a new domain without direct experience.',
          hint: 'Transferability proof and learning evidence.',
          whatGoodLooksLike: ['Similar pattern', 'Learning proof', 'Fast ramp approach'],
        },
        {
          id: 'q12',
          difficulty: 'EASY',
          type: 'Experience',
          question: 'What type of team environment helps you do your best work?',
          hint: 'Self-management, collaboration style.',
          whatGoodLooksLike: ['Specific', 'Non-generic', 'Role fit'],
        },
      ],
    })
  }

  if (prompt.includes('PRACTICE_FEEDBACK')) {
    return JSON.stringify({
      score: 76,
      strengths: [
        'You gave a clear structure and stayed on-topic.',
        'You described your actions (not just the team’s).',
      ],
      misses: [
        'Add one concrete metric or outcome (time saved, revenue, accuracy, adoption).',
        'Make the trade-off/decision moment explicit (what you chose and why).',
      ],
      improvedAnswer:
        'Here’s how I’d answer: I’ll share one example. Situation: we had recurring reporting errors causing rework each week. Task: I owned improving the reliability and turnaround time. Action: I audited the pipeline, added validation checks for edge cases, and introduced a simple peer-review step before distribution. I also documented the workflow so others could follow it. Result: we reduced weekly rework, improved accuracy, and stakeholders trusted the numbers faster. If I did it again, I’d add monitoring earlier to catch issues automatically.',
      followUps: [
        'What was the baseline and what did it improve to?',
        'What was the hardest part of getting buy-in for the change?',
        'If accuracy and speed conflict, which do you prioritize and why?',
      ],
    })
  }

  const isAnalyze = prompt.includes('JOB DESCRIPTION:')

  if (isAnalyze) {
    // Shape matches app/api/analyze/route.ts expectations
    return JSON.stringify({
      verdict: 'STRETCH',
      verdictTitle: 'Relevant background with some gaps',
      verdictDesc:
        'Based on the resume and JD, this candidate has overlapping experience but will need ramp‑up on a few core responsibilities.',
      overallScore: 72,
      scores: [
        { label: 'Day-1 Ready', value: 65, description: 'Can handle a subset of the core scope immediately.', color: '#10B981' },
        { label: 'Transferable', value: 80, description: 'Prior roles build many of the right underlying skills.', color: '#6366F1' },
        { label: 'Gap Severity', value: 70, description: 'Gaps are meaningful but addressable with focused ramp‑up.', color: '#F59E0B' },
        { label: 'Domain Fit', value: 60, description: 'Some exposure to similar domains; not a perfect match.', color: '#6366F1' },
      ],
      capabilities: [
        {
          title: 'Own end‑to‑end feature delivery',
          status: 'READY',
          evidence: 'Has led multiple projects from discovery through launch with clear ownership.',
          confidence: 82,
        },
        {
          title: 'Define and track success metrics',
          status: 'PARTIAL',
          evidence: 'Mentions KPIs but impact is not consistently quantified.',
          confidence: 68,
        },
        {
          title: 'Deep domain expertise',
          status: 'GAP',
          evidence: 'Limited direct experience in the target industry; will rely on fast learning.',
          confidence: 74,
        },
        {
          title: 'Cross‑functional collaboration',
          status: 'READY',
          evidence: 'Repeated examples of partnering with engineering and design.',
          confidence: 88,
        },
        {
          title: 'Leadership and mentoring',
          status: 'TRANSFERABLE',
          evidence: 'Has informal leadership and mentoring experience that can scale in this role.',
          confidence: 71,
        },
      ],
      rampupTimeline: [
        { period: 'Week 1-2', filled: true, label: 'Shadow key workflows, understand stack and rituals.' },
        { period: 'Month 1', filled: true, label: 'Own a small scoped project and close quick‑win improvements.' },
        { period: 'Month 3', filled: false, label: 'Comfortably lead medium‑sized initiatives with light guidance.' },
        { period: 'Month 6', filled: false, label: 'Operate as a fully ramped core contributor on the team roadmap.' },
      ],
      rampupNote:
        'Main ramp‑up is around domain nuance and internal decision‑making patterns; once those are learned, execution risk is moderate.',
      strengths: [
        {
          title: 'Proven ownership of ambiguous work',
          detail: 'Has repeatedly taken loosely defined problems and driven them to shipped outcomes.',
        },
        {
          title: 'Breadth across product lifecycle',
          detail: 'Experience spans discovery, delivery, and iteration, not just execution of specs.',
        },
        {
          title: 'Clear communication',
          detail: 'Resume suggests strong written communication with structured bullet points.',
        },
      ],
      gaps: [
        {
          title: 'Limited direct domain track record',
          severity: 'CRITICAL',
          howToAddress: 'Invest in fast domain immersion: talk to users, read internal docs, and mirror top performers.',
        },
        {
          title: 'Impact not consistently quantified',
          severity: 'MODERATE',
          howToAddress: 'Rewrite bullets to highlight metrics, baselines, and business outcomes.',
        },
        {
          title: 'Senior‑level stakeholder management',
          severity: 'MINOR',
          howToAddress: 'Seek projects that require working with directors/VPs and document those examples.',
        },
      ],
      transferableSkillsAnalysis: {
        summary:
          'Your background overlaps in execution and collaboration patterns, but the JD sits in a domain that will require deliberate translation of your prior context into new constraints, metrics, and operating rhythms.',
        domainPivots: [
          {
            fromDomain: 'Prior industry / function (from resume)',
            toDomain: 'Target domain implied by JD',
            narrative:
              'Many workflows differ in naming, but stakeholder alignment, prioritization, and delivery cadence translate when you re-map your tools and risk surface.',
            transferStrength: 72,
          },
        ],
        skillBridges: [
          {
            skill: 'Structured analysis & reporting',
            howItTransfers: 'You already reason from messy inputs into decisions; the bridge is learning domain-specific definitions and success metrics.',
            jdRelevance: 'Supports responsibilities that require turning ambiguity into an actionable plan.',
          },
          {
            skill: 'Cross-team communication',
            howItTransfers: 'Coalition-building transfers across domains; you must re-learn who the real decision-makers are.',
            jdRelevance: 'Maps to collaboration-heavy JD themes and stakeholder management.',
          },
        ],
      },
      interviewQuestions: [
        {
          question: 'Tell me about a time you owned a project where requirements changed mid‑flight. How did you adapt?',
          type: 'Behavioral',
          hint: 'Change management, resilience, stakeholder alignment.',
        },
        {
          question: 'Walk me through how you chose success metrics for a recent feature.',
          type: 'Experience',
          hint: 'Product thinking, data literacy, tying work to outcomes.',
        },
        {
          question: 'Describe a situation where you had to learn a new domain quickly. What did you do in the first 30 days?',
          type: 'Situational',
          hint: 'Learning speed, ramp‑up strategy, curiosity.',
        },
        {
          question: 'What is the most impactful project on your resume and why?',
          type: 'Behavioral',
          hint: 'Depth of impact, ability to articulate outcomes.',
        },
        {
          question: 'Where do you feel least prepared for this role, and how are you addressing it?',
          type: 'Gap-probe',
          hint: 'Self‑awareness, growth mindset, realism.',
        },
      ],
    })
  }

  // Shape matches app/api/profile/route.ts expectations
  return JSON.stringify({
    name: 'Sample Candidate',
    currentRole: 'Product Manager',
    profileScore: 78,
    grade: 'B',
    summary:
      'Solid mid‑career profile with strong ownership and cross‑functional collaboration. Biggest unlock is sharpening impact stories and targeting the narrative toward a specific direction.',
    dimensions: [
      {
        name: 'Work Experience',
        emoji: '💼',
        score: 80,
        color: '#6366F1',
        issues: [
          { text: 'Experience is relevant and shows progression.', type: 'ok' },
          { text: 'Some bullets could be more outcome‑oriented.', type: 'bad' },
        ],
      },
      {
        name: 'Skills Section',
        emoji: '⚡',
        score: 75,
        color: '#10B981',
        issues: [
          { text: 'Core tools and practices are listed.', type: 'ok' },
          { text: 'Mixes generic buzzwords with concrete skills.', type: 'bad' },
        ],
      },
      {
        name: 'Education',
        emoji: '🎓',
        score: 70,
        color: '#F59E0B',
        issues: [{ text: 'Education is appropriate but under‑leveraged in the story.', type: 'ok' }],
      },
      {
        name: 'Impact & Metrics',
        emoji: '📊',
        score: 65,
        color: '#EF4444',
        issues: [
          { text: 'Some quantified outcomes are present.', type: 'ok' },
          { text: 'Many bullets lack clear before/after metrics.', type: 'bad' },
        ],
      },
      {
        name: 'Resume Formatting',
        emoji: '📐',
        score: 82,
        color: '#6366F1',
        issues: [
          { text: 'Overall structure is clean and scannable.', type: 'ok' },
          { text: 'Minor consistency nits (spacing, tense).', type: 'bad' },
        ],
      },
      {
        name: 'Career Progression',
        emoji: '📈',
        score: 80,
        color: '#10B981',
        issues: [
          { text: 'Trajectory shows increasing scope and responsibility.', type: 'ok' },
          { text: 'Next step would benefit from a clearer target narrative.', type: 'bad' },
        ],
      },
    ],
    skillCategories: [
      {
        category: 'Product Discovery',
        emoji: '🔍',
        categoryScore: 78,
        skills: [
          { name: 'User interviews', level: 80, status: 'STRONG', note: 'Multiple roles reference direct customer contact.' },
          { name: 'Problem framing', level: 75, status: 'GOOD', note: 'Summaries hint at clear problem statements.' },
          { name: 'Experiment design', level: 65, status: 'DEVELOPING', note: 'Limited explicit A/B testing examples.' },
          { name: 'Opportunity sizing', level: 60, status: 'DEVELOPING', note: 'Impact often described qualitatively.' },
        ],
      },
      {
        category: 'Delivery & Execution',
        emoji: '🚀',
        categoryScore: 82,
        skills: [
          { name: 'Backlog management', level: 80, status: 'STRONG', note: '' },
          { name: 'Roadmapping', level: 78, status: 'GOOD', note: '' },
          { name: 'Cross‑functional rituals', level: 85, status: 'STRONG', note: 'Shows strong collaboration patterns.' },
          { name: 'Release management', level: 75, status: 'GOOD', note: '' },
        ],
      },
      {
        category: 'Business & Strategy',
        emoji: '💼',
        categoryScore: 70,
        skills: [
          { name: 'Business case building', level: 68, status: 'DEVELOPING', note: '' },
          { name: 'Stakeholder alignment', level: 75, status: 'GOOD', note: '' },
          { name: 'Market understanding', level: 70, status: 'GOOD', note: '' },
          { name: 'Pricing / revenue levers', level: 55, status: 'DEVELOPING', note: 'Not clearly covered in bullets.' },
        ],
      },
    ],
    sectionGaps: [
      {
        section: 'Summary / Header',
        emoji: '📝',
        description: 'The top of the resume could do more to position your unique value and target direction.',
        items: [
          { text: 'Headline is generic and not tailored to a target role.', severity: 'IMPORTANT' },
          { text: 'Summary doesn’t highlight 2–3 standout strengths upfront.', severity: 'IMPORTANT' },
        ],
      },
      {
        section: 'Experience Bullets',
        emoji: '💼',
        description: 'Bullets show solid responsibilities but could better emphasize measurable outcomes.',
        items: [
          { text: 'Not all major projects include metrics.', severity: 'CRITICAL' },
          { text: 'Some bullets describe tasks instead of impact.', severity: 'IMPORTANT' },
        ],
      },
    ],
    healthChecks: [
      { label: 'Length reasonable (1–2 pages)', emoji: '📄', status: 'PASS', detail: '' },
      { label: 'Readable formatting', emoji: '📐', status: 'PASS', detail: '' },
      { label: 'Consistent tense & person', emoji: '✍️', status: 'WARN', detail: 'A few bullets mix past and present tense.' },
      { label: 'ATS‑friendly structure', emoji: '🤖', status: 'PASS', detail: '' },
      { label: 'Contact details clear', emoji: '☎️', status: 'PASS', detail: '' },
      { label: 'Typos / grammar', emoji: '🔍', status: 'WARN', detail: 'Minor polish issues could be cleaned up.' },
    ],
    suggestions: [
      {
        priority: 'HIGH',
        emoji: '🎯',
        title: 'Rewrite top summary to match your target role',
        description:
          'Your current summary is generic and doesn’t clearly communicate what specific role or level you’re aiming for. Tightening this section will help recruiters quickly understand how to route you.',
        action: 'Draft a 2–3 line summary that states your target role, core strengths, and 1–2 proof points.',
      },
      {
        priority: 'HIGH',
        emoji: '📊',
        title: 'Quantify impact for your top 3–4 projects',
        description:
          'Several strong projects are listed without concrete metrics, which makes it harder to compare you to other candidates. Adding numbers will immediately upgrade perceived seniority.',
        action: 'For each key project, add 1 metric (e.g., conversion uplift, revenue impact, efficiency gains).',
      },
      {
        priority: 'MEDIUM',
        emoji: '🧩',
        title: 'Group skills into clearer categories',
        description:
          'Your skills are present but not structured in a way that highlights depth vs breadth. Clustering them will help both ATS and humans see your strengths faster.',
        action: 'Create 3–4 skill buckets (e.g., Discovery, Delivery, Analytics) with 4–6 skills each.',
      },
    ],
    careerNarrative: {
      clarity: 76,
      progression: 'LINEAR',
      assessment:
        'Your story presents a clear move from junior to mid‑level product roles with increasing ownership. The path is coherent, though the next step is not explicitly defined.',
      suggestion:
        'Decide on a target niche (e.g., B2B SaaS, platform, growth) and tweak your bullets and summary to emphasize experiences that support that direction.',
    },
  })
}
