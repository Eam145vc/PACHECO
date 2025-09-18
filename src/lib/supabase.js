import { createClient } from '@supabase/supabase-js'

// USAR LA MISMA KEY QUE FUNCIONA EN EL BACKEND
const supabaseUrl = 'https://ikrjjodyclyizrefqclt.supabase.co'
// HARDCODED TEMPORALMENTE PARA FIXEAR PROBLEMA DE BUILD
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrcmpqb2R5Y2x5aXpyZWZxY2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDM2MjUsImV4cCI6MjA0MjI3OTYyNX0.rjSDKE3kNfBYYJOVuNStOIFUQ4PaGJKO9n5YfQY0pyw'

console.log('🔍 [FRONTEND SUPABASE] Configuración hardcoded:')
console.log('   URL:', supabaseUrl)
console.log('   Key length:', supabaseKey.length)
console.log('   ⚠️ USANDO CREDENCIALES HARDCODED PARA FIXEAR BUILD')

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase