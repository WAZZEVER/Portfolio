// Initialize Supabase
// REPLACE these with your actual Supabase keys when ready
const SUPABASE_URL = 'https://ptbqakkltimpvontiuej.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YnFha2tsdGltcHZvbnRpdWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTcxMjMsImV4cCI6MjA4MzM5MzEyM30.HLxHdilypwR9vxXp2heVH1ZfdztR3_zr7SrjtVyrMfA';

let supabase = null;

if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

export { supabase };