'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/supabaseClient.js'
import { getOrCreateClientId } from '@/lib/clientId'
import { randomUUID } from '@/lib/uuid'
import type { FlowAnalysis, FlowSessionState } from '@/lib/flowTypes'

const STORAGE_KEY = 'verscly:flow:session:v1'

function readLocalSession(): FlowSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as FlowSessionState
    if (!p?.sessionId || !p.resumeText || !p.jdText) return null
    return p
  } catch {
    return null
  }
}

function writeLocalSession(s: FlowSessionState | null) {
  if (typeof window === 'undefined') return
  if (!s) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

async function writeRemoteSession(s: FlowSessionState) {
  const clientId = getOrCreateClientId()
  if (!supabase || !clientId) return
  await supabase.from('verscly_sessions').upsert(
    {
      id: s.sessionId,
      client_id: clientId,
      position_name: s.positionName,
      jd_text: s.jdText,
      resume_text: s.resumeText,
      analysis_json: s.analysis,
      updated_at: s.updatedAt,
    },
    { onConflict: 'id' },
  )
}

type SessionCtx = {
  session: FlowSessionState | null
  hydrated: boolean
  commitSession: (payload: {
    positionName: string
    jdText: string
    resumeText: string
    analysis: FlowAnalysis | null
    sessionId?: string
  }) => Promise<void>
  clearSession: () => void
}

const SessionContext = createContext<SessionCtx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FlowSessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSession(readLocalSession())
    setHydrated(true)
  }, [])

  const commitSession = useCallback(async (payload: {
    positionName: string
    jdText: string
    resumeText: string
    analysis: FlowAnalysis | null
    sessionId?: string
  }) => {
    const next: FlowSessionState = {
      sessionId: payload.sessionId ?? randomUUID(),
      positionName: payload.positionName,
      jdText: payload.jdText,
      resumeText: payload.resumeText,
      analysis: payload.analysis,
      updatedAt: new Date().toISOString(),
    }
    setSession(next)
    writeLocalSession(next)
    await writeRemoteSession(next)
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
    writeLocalSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, hydrated, commitSession, clearSession }),
    [session, hydrated, commitSession, clearSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
