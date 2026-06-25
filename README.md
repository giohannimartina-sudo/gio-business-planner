# GIO Business Planner v1.0 LIVE

Direct bruikbare Next.js versie voor Vercel + Supabase.

## Stappen

1. Zet `database/schema.sql` in Supabase SQL Editor en voer uit.
2. Commit en push deze bestanden naar GitHub.
3. Vercel bouwt automatisch.
4. Open de app en maak een account aan.
5. Importeer je oude JSON-back-up via Back-up / Import.

## Supabase environment variables

Vercel moet deze hebben:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Data-opslag

Deze versie gebruikt een veilige Supabase tabel `planner_data` met Row Level Security.
Iedere gebruiker ziet alleen zijn eigen data.
