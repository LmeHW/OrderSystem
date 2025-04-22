import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://horxssmuzgkqgcotqmwv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvcnhzc211emdrcWdjb3RxbXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyOTcyMzQsImV4cCI6MjA2MDg3MzIzNH0.0-z9PlgqojVd54vokXqLuGlmv0bwSxuFqjgv76uzn3g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
