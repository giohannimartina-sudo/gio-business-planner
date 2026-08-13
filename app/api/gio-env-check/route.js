
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const candidates = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  };

  const safe = {};
  for (const [name, value] of Object.entries(candidates)) {
    safe[name] = {
      present: Boolean(value),
      length: value ? String(value).length : 0
    };
  }

  const visibleSupabaseNames = Object.keys(process.env)
    .filter(k => k.toUpperCase().includes('SUPABASE'))
    .sort();

  return Response.json({
    ok: true,
    diagnostic: 'DEV 026A',
    candidates: safe,
    visibleSupabaseNames
  });
}
