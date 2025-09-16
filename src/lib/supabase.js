import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikrjjodyclyizrefqclt.supabase.co'
const supabaseKey = 'sb_publishable_UaWz3wzTb604gD6t69XFgg_bDd5JDvd'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase