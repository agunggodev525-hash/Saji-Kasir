// ============================================
// SUPABASE CONFIGURATION
// Saji Kasir - Kasir App
// ============================================

const SUPABASE_URL = 'https://knamlrrbucyvvixrqunk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuYW1scnJidWN5dnZpeHJxdW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU3MDEzNSwiZXhwIjoyMDk0MTQ2MTM1fQ.j35fI4ZVZSIDgc0GDFtTVrR9tn9-8LjW8ipBEN07bcI';

// Initialize Supabase client (requires @supabase/supabase-js via CDN)
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
        return supabaseClient;
    } else {
        console.error('❌ Supabase library not loaded. Make sure CDN script is included.');
        return null;
    }
}

function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Export globally
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.initSupabase = initSupabase;
window.getSupabase = getSupabase;
