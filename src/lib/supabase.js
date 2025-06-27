import { createClient } from '@supabase/supabase-js'

// Project ID will be auto-injected during deployment
const SUPABASE_URL = 'https://kxsxosefcpckembyvgbj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4c3hvc2VmY3Bja2VtYnl2Z2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjUzMDYsImV4cCI6MjA2NjYwMTMwNn0.QhJbwp16Xb8N_VT8la8e1PlEaej4lAhffN1ImMOa9DU'

if(SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>' ){
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})