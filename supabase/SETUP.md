# Cloud auto-save setup (Supabase)

With Supabase connected, every account and its tasks, settings and profile picture are saved
online automatically and follow the user to any device. Without it, the app saves to the
browser only.

1. Create a free project at https://supabase.com/dashboard.
2. In the project, open **SQL Editor**, paste and run each file in `supabase/migrations/`
   in order (oldest date first).
3. Open **Project Settings → API** and copy the **Project URL** and the **publishable (anon) key**.
4. In the project root, create `.env.local` (it is git-ignored):

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
   ```

5. Restart the dev server (`npm run dev`).
6. In **Authentication → URL Configuration**, set the **Site URL** to where the app runs
   (for example `http://localhost:5173`, or your deployed address) so email confirmation
   links open the app.

Notes

- By default Supabase asks new users to confirm their email before signing in.
  You can turn this off under **Authentication → Sign In / Providers → Email**.
- Accounts made before cloud saving existed live only in that browser. The user registers
  again with the same email; on first sign-in, their tasks from that browser are moved
  into the new account automatically.
- For a deployed site, add the same two variables in your hosting provider's settings.
