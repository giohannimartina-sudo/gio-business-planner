export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(v) {
  return String(v || '').trim();
}

export async function GET() {
  const url = clean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secret = clean(process.env.SUPABASE_SECRET_KEY);
  const service = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return Response.json({
    ok: true,
    diagnostic: 'DEV 026E',
    SUPABASE_URL: { present: Boolean(url), length: url.length },
    SUPABASE_SECRET_KEY: {
      present: Boolean(secret),
      correctPrefix: secret.startsWith('sb_secret_'),
      length: secret.length
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: Boolean(service),
      length: service.length
    },
    selectedCredential:
      secret ? 'SUPABASE_SECRET_KEY' :
      service ? 'SUPABASE_SERVICE_ROLE_KEY' :
      'NONE'
  });
}
