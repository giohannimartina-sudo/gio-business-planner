import { NextResponse } from "next/server";
export const runtime = "nodejs";

const SYSTEM = `Je bent de ChatGPT Offerte & Calculatie Assistent van GIO KLUSBAAS & G MARTINA - Vakwerk en Techniek.
Werk in het Nederlands. Help als ervaren kluscalculateur. Voer een normaal gesprek: begrijp de klus, vraag alleen noodzakelijke ontbrekende gegevens, reken mee met arbeid, hoeveelheden, materialen, reistijd/rijkosten, risico's en voorwaarden. De gebruiker bepaalt prijzen en de definitieve offerte.
Verzin geen klantgegevens, afmetingen of concrete inkoopprijzen wanneer die niet zijn gegeven. Benoem aannames.
Wanneer de gebruiker tevreden is of vraagt om het in de offerte te plaatsen, maak een compleet offerDraft.
Antwoord ALTIJD als geldig JSON:
{"reply":"gespreksantwoord","offerDraft":{"ready":false,"title":"","workLocation":"","duration":"","intro":"","workLines":[],"materials":[],"assumptions":[]}}
workLines items: {"description":"","quantity":1,"unit":"st","rate":0,"vat":21}
materials items: {"description":"","quantity":"","amount":0,"vat":21}`;

function outputText(d){
 if(typeof d?.output_text==="string") return d.output_text;
 const a=[];
 for(const item of d?.output||[]) for(const c of item?.content||[]) if(c?.text)a.push(c.text);
 return a.join("\n");
}
export async function POST(req){
 try{
  if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:"OPENAI_API_KEY ontbreekt in Vercel."},{status:503});
  const b=await req.json(), messages=Array.isArray(b.messages)?b.messages.slice(-24):[];
  const transcript=messages.map(m=>`${m.role==="assistant"?"ASSISTENT":"GEBRUIKER"}: ${String(m.content||"")}`).join("\n\n");
  const prompt=`${SYSTEM}\n\nAPP CONTEXT:\n${JSON.stringify(b.context||{})}\n\nGESPREK:\n${transcript}`;
  const r=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",
   headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
   body:JSON.stringify({model:process.env.OPENAI_OFFER_MODEL||"gpt-5.6",input:prompt})
  });
  const raw=await r.text();
  if(!r.ok)return NextResponse.json({error:"OpenAI API fout",detail:raw.slice(0,600)},{status:r.status});
  const text=outputText(JSON.parse(raw)).trim();
  const a=text.indexOf("{"),z=text.lastIndexOf("}");
  if(a<0||z<a)throw new Error("Geen geldig antwoordobject ontvangen.");
  return NextResponse.json(JSON.parse(text.slice(a,z+1)));
 }catch(e){return NextResponse.json({error:e?.message||"Onbekende fout"},{status:500})}
}