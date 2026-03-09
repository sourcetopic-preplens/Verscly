const ipMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, limit = 10): { ok: boolean } {
  const now    = Date.now()
  const window = 60_000
  const entry  = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + window })
    return { ok: true }
  }

  entry.count++
  return { ok: entry.count <= limit }
}
