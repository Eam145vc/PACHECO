import { createClient } from '@supabase/supabase-js'

// USAR LA MISMA KEY QUE FUNCIONA EN EL BACKEND
const supabaseUrl = 'https://ikrjjodyclyizrefqclt.supabase.co'
// USAR LA ANON KEY ACTUAL Y CORRECTA
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrcmpqb2R5Y2x5aXpyZWZxY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzMyNDUsImV4cCI6MjA3MzYwOTI0NX0.pg2mQuFkZGiOpinpZoVABJzasATJYrrzXfRt0jGW0WQ'

console.log('🔍 [FRONTEND SUPABASE] Configuración hardcoded:')
console.log('   URL:', supabaseUrl)
console.log('   Key length:', supabaseKey.length)
console.log('   ⚠️ USANDO CREDENCIALES HARDCODED PARA FIXEAR BUILD')

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase