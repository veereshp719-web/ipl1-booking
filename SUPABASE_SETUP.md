# BlogSphere + Supabase setup

1. Create a project at Supabase.
2. In Supabase Dashboard -> SQL Editor, run `supabase-schema.sql`.
3. Open Project Settings -> API and copy the Project URL and public `anon` key.
4. Put them in `supabase-config.js`:
   - `BLOGSPHERE_SUPABASE_URL`
   - `BLOGSPHERE_SUPABASE_ANON_KEY`
5. Serve the folder through a local web server (for example VS Code Live Server).
6. Test: click Publish Story while logged out -> Login modal appears. Create an account -> confirm email if Supabase requires it -> log in -> publish.

The browser uses only the public anon key. Never put the Supabase `service_role` key in this project.

The `profiles` trigger stores the user's full name and username in Supabase. Every article stores `author_id`, and BlogSphere reads the author's full name from `profiles`, so the published article displays the name used for the account.
