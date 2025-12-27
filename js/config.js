const SUPABASE_URL = 'https://rplieisbxvruijvnxbya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bwA6-ahysrqAjTYZsgbzVw_PbZ7-BQR';
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
