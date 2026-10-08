// BlogSphere Supabase configuration.
// Replace these two values with your Supabase project values.
// IMPORTANT: use the public anon key here, never the service_role key.
window.BLOGSPHERE_SUPABASE_URL = "https://coznefhjvvoydwziummj.supabase.co";
window.BLOGSPHERE_SUPABASE_ANON_KEY = "sb_publishable_ropb6EQr3AMO_ajdh9Kblg_1phV51_p";

window.blogSupabase = null;

if (window.supabase &&
    !window.BLOGSPHERE_SUPABASE_URL.includes("YOUR_") &&
    !window.BLOGSPHERE_SUPABASE_ANON_KEY.includes("YOUR_")) {
  window.blogSupabase = window.supabase.createClient(
    window.BLOGSPHERE_SUPABASE_URL,
    window.BLOGSPHERE_SUPABASE_ANON_KEY
  );
}
