import { randomUUID } from '@/lib/uuid'

const CLIENT_KEY = 'verscly:clientId'

export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(CLIENT_KEY)
  if (!id) {
    id = randomUUID()
    localStorage.setItem(CLIENT_KEY, id)
  }
  return id
}
