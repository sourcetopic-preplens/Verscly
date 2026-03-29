const DB_NAME = 'verscly-form-draft'
const DB_VER = 1
const STORE = 'draft'
const JD_KEY = 'verscly:draft:jd'
const RESUME_KEY = 'resume'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function readDraftJd(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(JD_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeDraftJd(text: string): void {
  if (typeof window === 'undefined') return
  try {
    if (!text.trim()) localStorage.removeItem(JD_KEY)
    else localStorage.setItem(JD_KEY, text)
  } catch {
    /* quota */
  }
}

type ResumeRecord = { name: string; type: string; blob: Blob }

export async function saveDraftResume(file: File): Promise<void> {
  const db = await openDb()
  const rec: ResumeRecord = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    blob: file,
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(rec, RESUME_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadDraftResume(): Promise<File | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(RESUME_KEY)
      req.onsuccess = () => {
        const v = req.result as ResumeRecord | undefined
        if (!v?.blob) {
          resolve(null)
          return
        }
        resolve(new File([v.blob], v.name, { type: v.type }))
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function clearDraftResume(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(RESUME_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* ignore */
  }
}

export function clearDraftJd(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(JD_KEY)
  } catch {
    /* ignore */
  }
}

export async function clearAllFormDraft(): Promise<void> {
  clearDraftJd()
  await clearDraftResume()
}
