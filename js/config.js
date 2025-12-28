const SUPABASE_URL = 'https://qpecqvvjyoycsxuvrzge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWNxdnZqeW95Y3N4dXZyemdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDEyMTIsImV4cCI6MjA4MjQxNzIxMn0._NYiFimE45ATHyQEH1bE2PPebi7YvcMl5lylOXFxjEs';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let authInitialized = false;
let isAdmin = false;

async function checkIfAdmin() {
    if (!currentUser) return false;

    try {
        const { data, error } = await _supabase
            .from('administradores')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking admin status:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking admin:', error);
        return false;
    }
}
