# GIO v2.1 RC – Slimme KM-update

- KM-vergoeding staat alleen onder Uitgave / Investeren.
- Opgeslagen locaties (Thuis, Werkplaats, leveranciers, klantadressen).
- Enkele reis of heen en terug.
- Automatische afstand en reistijd via Google Maps wanneer `GOOGLE_MAPS_API_KEY` in Vercel staat.
- Verkeersafhankelijke reistijd via Routes API.
- Handmatige KM-invoer en Open in Google Maps blijven altijd beschikbaar.
- KM blijft gekoppeld aan klant/project en wordt doorberekend.

Vercel: voeg een server environment variable `GOOGLE_MAPS_API_KEY` toe voor Production en Preview. Activeer in Google Cloud de Geocoding API en Routes API.
