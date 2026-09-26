import { NextResponse } from "next/server";
export const runtime="nodejs";
export async function POST(req){
 try{
  if(!process.env.GOOGLE_MAPS_API_KEY)return NextResponse.json({error:"GOOGLE_MAPS_API_KEY ontbreekt in Vercel."},{status:503});
  const {origin,destination}=await req.json();
  if(!origin||!destination)return NextResponse.json({error:"Vertrek en bestemming zijn verplicht."},{status:400});
  const r=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{
   method:"POST",
   headers:{"Content-Type":"application/json","X-Goog-Api-Key":process.env.GOOGLE_MAPS_API_KEY,"X-Goog-FieldMask":"routes.distanceMeters,routes.duration"},
   body:JSON.stringify({origin:{address:String(origin)},destination:{address:String(destination)},travelMode:"DRIVE",routingPreference:"TRAFFIC_AWARE",languageCode:"nl-NL",units:"METRIC"})
  });
  const raw=await r.text();
  if(!r.ok)return NextResponse.json({error:"Google Routes fout",detail:raw.slice(0,700)},{status:r.status});
  const x=JSON.parse(raw).routes?.[0];
  if(!x)return NextResponse.json({error:"Geen autoroute gevonden."},{status:404});
  const km=(Number(x.distanceMeters)||0)/1000, sec=Number(String(x.duration||"0s").replace("s",""))||0;
  return NextResponse.json({km,returnKm:km*2,minutes:Math.round(sec/60)});
 }catch(e){return NextResponse.json({error:e?.message||"Routefout"},{status:500})}
}