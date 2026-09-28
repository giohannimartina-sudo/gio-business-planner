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

  // Master sync mag nooit terugvallen op anon/publishable credentials.
  const key = secretKey || serviceRoleKey;
  const keyType = secretKey
    ? (secretKey.startsWith('sb_secret_') ? 'secret' : 'invalid-secret')
    : (serviceRoleKey ? 'legacy-service-role' : 'missing');

  return { url, key, keyType };
}

function supabaseHeaders(key, keyType, prefer = 'return=representation') {
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: prefer
  };

  // Nieuwe Supabase secret keys zijn geen JWT.
  // Alleen via apikey versturen.
  if (keyType === 'secret') {
    return headers;
  }

  // Legacy service_role is wel JWT-gebaseerd.
  if (keyType === 'legacy-service-role') {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

function configError(url, key, keyType) {
  if (!url) return 'SUPABASE_URL ontbreekt.';
  if (!key) return 'SUPABASE_SECRET_KEY ontbreekt.';
  if (keyType === 'invalid-secret') {
    return 'SUPABASE_SECRET_KEY heeft niet het verwachte sb_secret_ formaat.';
  }
  return null;
}

async function readRow(url, key, keyType, deviceKey) {
  const endpoint =
    `${url}/rest/v1/gio_sync_state?device_key=eq.${encodeURIComponent(deviceKey)}` +
    `&select=device_key,payload,updated_at,updated_by`;

  const res = await fetch(endpoint, {
    headers: supabaseHeaders(key, keyType),
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase GET ${res.status}: ${text}`);
  }

  const rows = await res.json();
  return rows[0] || null;
}

export async function GET(req) {
  try {
    const { url, key, keyType } = env();
    const error = configError(url, key, keyType);

    if (error) {
      return Response.json(
        { configured: false, error, keyType },
        { status: 503 }
      );
    }

    const deviceKey =
      new URL(req.url).searchParams.get('device_key') || 'gio-master';

    const row = await readRow(url, key, keyType, deviceKey);

    return Response.json({
      configured: true,
      row,
      keyType
    });
  } catch (e) {
    return Response.json(
      {
        configured: true,
        error: e instanceof Error ? e.message : String(e)
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { url, key, keyType } = env();
    const error = configError(url, key, keyType);

    if (error) {
      return Response.json(
        { configured: false, error, keyType },
        { status: 503 }
      );
    }

    const body = await req.json();
    const deviceKey = String(body.device_key || 'gio-master').slice(0, 120);

    const current = await readRow(url, key, keyType, deviceKey);

    if (
      current?.updated_at &&
      body.base_updated_at &&
      !body.force &&
      new Date(current.updated_at).getTime() >
        new Date(body.base_updated_at).getTime()
    ) {
      return Response.json(
        {
          conflict: true,
          row: current,
          error: 'Cloud bevat nieuwere gegevens.'
        },
        { status: 409 }
      );
    }

    const payload = [{
      device_key: deviceKey,
      payload: body.payload || {},
      updated_at: new Date().toISOString(),
      updated_by: String(body.updated_by || 'GIO master').slice(0, 120)
    }];

    const endpoint =
      `${url}/rest/v1/gio_sync_state?on_conflict=device_key`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: supabaseHeaders(
        key,
        keyType,
        'resolution=merge-duplicates,return=representation'
      ),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase POST ${res.status}: ${text}`);
    }

    const rows = await res.json();

    return Response.json({
      configured: true,
      row: rows[0] || payload[0],
      keyType
    });
  } catch (e) {
    return Response.json(
      {
        configured: true,
        error: e instanceof Error ? e.message : String(e)
      },
      { status: 500 }
    );
  }
}
