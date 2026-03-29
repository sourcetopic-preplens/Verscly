export interface FlowStrength {
  title: string
  detail: string
}

export interface FlowGap {
  title: string
  severity: string
  howToAddress: string
}

export interface FlowAnalysis {
  verdict?: 'YES' | 'STRETCH' | 'NO' | string
  verdictTitle?: string
  verdictDesc?: string
  overallScore?: number
  strengths?: FlowStrength[]
  gaps?: FlowGap[]
  interviewQuestions?: { question: string; type: string; hint: string }[]
  [key: string]: unknown
}

export interface FlowSessionState {
  sessionId: string
  positionName: string
  jdText: string
  resumeText: string
  analysis: FlowAnalysis | null
  updatedAt: string
}
