
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function env() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

function headers(key) {
  const base = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };

  if (String(key).startsWith('sb_')) {
    return base;
  }

  return {
    ...base,
    Authorization: `Bearer ${key}`
  };
}

async function readRow(url, key, deviceKey) {
  const endpoint =
    `${url}/rest/v1/gio_sync_state?device_key=eq.${encodeURIComponent(deviceKey)}` +
    `&select=device_key,payload,updated_at,updated_by`;
  const res = await fetch(endpoint, { headers: headers(key), cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase GET ${res.status}: ${txt}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

export async function GET(req) {
  try {
    const { url, key } = env();
    if (!url || !key) {
      return Response.json(
        { configured: false, error: 'Supabase environment variables ontbreken.', diagnostic: '/api/gio-env-check' },
        { status: 503 }
      );
    }
    const deviceKey = new URL(req.url).searchParams.get('device_key') || 'gio-master';
    const row = await readRow(url, key, deviceKey);
    return Response.json({
      configured: true,
      row,
      keyMode: String(key).startsWith('sb_') ? 'secret/publishable api key' : 'legacy jwt key'
    });
  } catch (e) {
    return Response.json({ configured: true, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { url, key } = env();
    if (!url || !key) {
      return Response.json(
        { configured: false, error: 'Supabase environment variables ontbreken.', diagnostic: '/api/gio-env-check' },
        { status: 503 }
      );
    }
    const body = await req.json();
    const deviceKey = body.device_key || 'gio-master';
    const current = await readRow(url, key, deviceKey);

    if (
      current?.updated_at &&
      body.base_updated_at &&
      !body.force &&
      new Date(current.updated_at).getTime() > new Date(body.base_updated_at).getTime()
    ) {
      return Response.json(
        { conflict: true, row: current, error: 'Cloud bevat nieuwere gegevens.' },
        { status: 409 }
      );
    }

    const payload = [{
      device_key: deviceKey,
      payload: body.payload || {},
      updated_at: new Date().toISOString(),
      updated_by: String(body.updated_by || 'GIO master').slice(0, 120)
    }];

    const endpoint = `${url}/rest/v1/gio_sync_state?on_conflict=device_key`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers(key), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Supabase POST ${res.status}: ${txt}`);
    }
    const rows = await res.json();
    return Response.json({ configured: true, row: rows[0] || payload[0] });
  } catch (e) {
    return Response.json({ configured: true, error: e.message }, { status: 500 });
  }
}
