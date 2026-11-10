# SBV Cinematic Portfolio

First-person portfolio for Sanjay Bhargav Varma, built with Next.js static export.

## Run locally

```powershell
cd "D:\Portfolio\Sanjay Final\SBV-Cinematic-V2"
npm run dev
```

Open `http://localhost:3000`.

## Production preview

```powershell
npm run build
python -m http.server 4173 --directory out
```

Open `http://localhost:4173`.

## Experience

- Six chapters with an index menu and scroll progress.
- Interactive Three.js signal core built for this portfolio; it visualizes connected QA systems rather than presenting the blocky GLB as a professional portrait.
- GSAP reveals and Lenis scrolling, with reduced-motion support.
- Animated OFSC-to-Pega flow, two project case studies, interactive toolkit, experience, education and contact.
- First-person copy and verified facts; no confidential product screenshots.

## Admin access

The small `ADMIN` footer link opens the Supabase-backed login and content dashboard. The dashboard edits profile, contact, skills, experience, projects, verified metrics, and the current user's password. Apply the SQL and seed instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) before using it.

## GitHub safety

- `.env` and deployment secrets are ignored.
- `.env.example` contains placeholders only.
- The public site reads the published Supabase content row when configured and falls back to verified defaults when it is unavailable.
- Do not place a service-role key in browser or public environment variables.
