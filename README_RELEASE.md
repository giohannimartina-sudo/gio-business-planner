# GIO Business Planner PRO v2.0 FINAL LIVE

Deze release vervangt de losse HTML/patch werkwijze door één Next.js app.

Belangrijkste onderdelen:
- Dashboard PRO met weekagenda
- Projectplanning met start/einddatum en over-tijd status
- Projectkaart PRO
- Klantbetalingen en open bedrag per project
- Urenregistratie met inklokken/uitklokken
- Slimme offerte assistent op basis van historie
- Projectarchief
- Cloud Sync via Supabase planner_data tabel
- Wachtwoord tonen/verbergen
- Android PWA met GIO-logo

Live zetten:
1. Download en pak ZIP uit.
2. Upload alle bestanden naar GitHub.
3. Commit: GIO Business Planner PRO v2.0 FINAL LIVE
4. Vercel deployt automatisch.
5. Controleer Supabase env vars: NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY.

Supabase tabel nodig:
Zie database/schema.sql.
