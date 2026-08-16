
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function env() {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  const rawKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const url = String(rawUrl).trim();
  const key = String(rawKey).trim();

  return { url, key };
}

function headers(key) {
  const base = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation'
  };

  if (String(key).startsWith('sb_')) return base;

  return {
    ...base,
    Authorization: `Bearer ${key}`
  };
}

export async function GET() {
  try {
    const { url, key } = env();

    if (!url || !key) {
      return Response.json(
        { ok: false, error: 'Supabase environment variables ontbreken.' },
        { status: 503 }
      );
    }

    const endpoint = `${url}/rest/v1/gio_sync_state?on_conflict=device_key`;
    const payload = [{
      device_key: 'gio-connection-test',
      payload: {
        test: true,
        note: 'DEV 026B veilige verbindingstest',
        timestamp: new Date().toISOString()
      },
      updated_at: new Date().toISOString(),
      updated_by: 'DEV 026B connection test'
    }];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          status: res.status,
          keyMode: String(key).startsWith('sb_') ? 'sb_secret/publishable' : 'legacy-jwt',
          error: text
        },
        { status: res.status }
      );
    }

    let rows = [];
    try { rows = JSON.parse(text); } catch {}

    return Response.json({
      ok: true,
      status: res.status,
      keyMode: String(key).startsWith('sb_') ? 'sb_secret/publishable' : 'legacy-jwt',
      testRecord: rows[0] || null
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
