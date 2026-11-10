# Supabase setup for the SBV portfolio

The codebase now contains a real Supabase Auth + database editor. Passwords are never in this repository. The browser uses only the publishable anon key; Row Level Security protects writes.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. In Project Settings → API, copy the Project URL and publishable anon key.
3. Create `.env.local` in this project with:

```text
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Never copy the `service_role` key into this project or a browser environment.

## 2. Configure Auth

1. Open Authentication → Providers → Email.
2. Enable Email provider.
3. Decide whether email confirmation is required. For a private admin tool, keep confirmation enabled and confirm both accounts from the Supabase Auth users screen.
4. Do not create passwords in SQL or in this repository.

## 3. Create the database and policies

1. Open SQL Editor.
2. Run [`supabase/schema.sql`](D:/Portfolio/Sanjay%20Final/SBV-Cinematic-V2/supabase/schema.sql).
3. Confirm `portfolio_admins` and `portfolio_content` have RLS enabled.

The policies allow anonymous/public reads only for rows where `published = true`. Authenticated users must be present in `portfolio_admins` to read or update content. Anonymous users have no insert or update policy.

## 4. Create the two accounts

In Authentication → Users, create two email users manually:

- Owner: choose a private owner email and a private password.
- Sanjay: `kamarothusanjay@gmail.com` and a private password chosen by Sanjay.

Do not use a default password and do not paste either password into a file.

## 5. Assign roles and seed content

1. Open [`supabase/seed.sql`](D:/Portfolio/Sanjay%20Final/SBV-Cinematic-V2/supabase/seed.sql).
2. Replace only `OWNER_EMAIL` with the owner email used in Supabase.
3. Run the SQL in Supabase SQL Editor.
4. The script assigns `owner` and `sanjay` roles and inserts the verified portfolio content, including profile, contact, skills, experience, projects, metrics, education, and certifications.

## 6. Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`, choose the small `ADMIN` footer link, and sign in with either Supabase Auth account. The dashboard supports profile, contact, skills, experience, projects, metrics, and password changes. Saving upserts the protected `portfolio_content` row; the public page reads the published row and falls back to the verified defaults if Supabase is unavailable.

## 7. Test the security boundary

- Sign in as Sanjay: edit and publish content, change the Sanjay password, and log out.
- Sign in as owner: verify full content editing access.
- In an incognito window, confirm the public portfolio loads but `/admin` shows the login screen and cannot save.
- Verify the Supabase SQL editor shows RLS enabled and no service-role key appears in browser environment variables.
- Change a harmless summary word, save, refresh the public page, then restore the intended verified text.

## 8. Deployment

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as deployment environment variables. Keep the service-role/secret key only in Supabase/server-side infrastructure if a future owner-management endpoint is added. The current static export can authenticate through Supabase Auth and read/write through RLS using the publishable key.
