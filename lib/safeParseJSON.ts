// Ported exactly from your HTML — handles truncated/malformed Claude JSON
export function safeParseJSON<T = unknown>(raw: string): T {
  try { return JSON.parse(raw) as T } catch (_) {}

  const start = raw.indexOf('{')
  if (start === -1) throw new Error('No JSON found in response')
  let str = raw.slice(start)

  for (let i = str.length; i > 10; i--) {
    try { return JSON.parse(str.slice(0, i)) as T } catch (_) {}
  }

  const opens: string[] = []
  let inStr = false, esc = false
  for (const ch of str) {
    if (esc)        { esc = false; continue }
    if (ch === '\\') { esc = true;  continue }
    if (ch === '"')  { inStr = !inStr; continue }
    if (!inStr) {
      if (ch === '{' || ch === '[') opens.push(ch)
      else if (ch === '}' || ch === ']') opens.pop()
    }
  }
  str = str.replace(/,\s*$/, '')
  for (let i = opens.length - 1; i >= 0; i--)
    str += opens[i] === '{' ? '}' : ']'

  try { return JSON.parse(str) as T }
  catch { throw new Error('Could not parse AI response — please try again.') }
}
