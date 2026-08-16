export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value) {
  return String(value || '').trim();
}

function env() {
  const url = clean(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  const secretKey = clean(process.env.SUPABASE_SECRET_KEY);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const key = secretKey || serviceRoleKey;
  const keyType = secretKey
    ? (secretKey.startsWith('sb_secret_') ? 'secret' : 'invalid-secret')
    : (serviceRoleKey ? 'legacy-service-role' : 'missing');

  return { url, key, keyType };
}

function headers(key, keyType) {
  const h = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation'
  };

  if (keyType === 'legacy-service-role') {
    h.Authorization = `Bearer ${key}`;
  }

  return h;
}

export async function GET() {
  try {
    const { url, key, keyType } = env();

    if (!url || !key) {
      return Response.json(
        { ok: false, error: 'Supabase serverconfiguratie ontbreekt.', keyType },
        { status: 503 }
      );
    }

    if (keyType === 'invalid-secret') {
      return Response.json(
        {
          ok: false,
          error: 'SUPABASE_SECRET_KEY heeft niet het verwachte sb_secret_ formaat.',
          keyType
        },
        { status: 503 }
      );
    }

    const endpoint =
      `${url}/rest/v1/gio_sync_state?on_conflict=device_key`;

    const payload = [{
      device_key: 'gio-connection-test',
      payload: {
        test: true,
        version: 'DEV 026E',
        timestamp: new Date().toISOString()
      },
      updated_at: new Date().toISOString(),
      updated_by: 'DEV 026E connection test'
    }];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers(key, keyType),
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          status: res.status,
          keyType,
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
      keyType,
      testRecord: rows[0] || null
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
