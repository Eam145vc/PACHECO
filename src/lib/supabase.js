import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikrjjodyclyizrefqclt.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrcmpqb2R5Y2x5aXpyZWZxY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzMyNDUsImV4cCI6MjA3MzYwOTI0NX0.pg2mQuFkZGiOpinpZoVABJzasATJYrrzXfRt0jGW0WQ'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase