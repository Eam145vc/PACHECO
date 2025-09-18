import { createClient } from '@supabase/supabase-js'

// USAR LA MISMA KEY QUE FUNCIONA EN EL BACKEND
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikrjjodyclyizrefqclt.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrcmpqb2R5Y2x5aXpyZWZxY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDM2MjUsImV4cCI6MjA0MjI3OTYyNX0.rjSDKE3kNfBYYJOVuNStOIFUQ4PaGJKO9n5YfQY0pyw'

console.log('🔍 [FRONTEND SUPABASE] Configuración:')
console.log('   URL:', supabaseUrl)
console.log('   Key length:', supabaseKey.length)
console.log('   Env URL:', import.meta.env.VITE_SUPABASE_URL ? 'DEFINIDA' : 'NO DEFINIDA')
console.log('   Env KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NO DEFINIDA')

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase