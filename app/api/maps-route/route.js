import { NextResponse } from 'next/server';

async function geocode(address, key) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('region', 'nl');
  url.searchParams.set('key', key);
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || data.status !== 'OK' || !data.results?.[0]) {
    throw new Error(`Adres niet gevonden: ${address}`);
  }
  return data.results[0].geometry.location;
}

function seconds(value) {
  return Number(String(value || '0s').replace('s', '')) || 0;
}

export async function POST(request) {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Google Maps API-key is nog niet ingesteld. Voeg GOOGLE_MAPS_API_KEY toe in Vercel.' }, { status: 503 });
    }
    const { origin, destination } = await request.json();
    if (!origin || !destination) return NextResponse.json({ error: 'Vertrek- en bestemmingsadres zijn verplicht.' }, { status: 400 });
    const [o, d] = await Promise.all([geocode(origin, key), geocode(destination, key)]);
    const routeResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.staticDuration'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: o.lat, longitude: o.lng } } },
        destination: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        languageCode: 'nl-NL',
        units: 'METRIC'
      }),
      cache: 'no-store'
    });
    const routeData = await routeResponse.json();
    if (!routeResponse.ok || !routeData.routes?.[0]) throw new Error(routeData.error?.message || 'Geen route gevonden.');
    const route = routeData.routes[0];
    return NextResponse.json({
      distanceKm: route.distanceMeters / 1000,
      normalMinutes: seconds(route.staticDuration || route.duration) / 60,
      trafficMinutes: seconds(route.duration) / 60
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Routeberekening mislukt.' }, { status: 500 });
  }
}
