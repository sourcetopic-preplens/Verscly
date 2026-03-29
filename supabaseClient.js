import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  typeof url === 'string' &&
  url.length > 0 &&
  typeof key === 'string' &&
  key.length > 0
    ? createClient(url, key)
    : null
