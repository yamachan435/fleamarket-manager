import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let clientInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return clientInstance
}

// For convenience, export a lazy-loaded supabase instance
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})
