import { NextResponse } from 'next/server';
import { adminClient,hashToken,safeLink } from '../../../../lib/worklinkServer';
const fail=(m,s=400)=>NextResponse.json({error:m},{status:s});
async function getRow(token){const sb=adminClient();const {data,error}=await sb.from('work_links').select('*').eq('token_hash',hashToken(token)).maybeSingle();if(error)throw error;if(!data)throw new Error('Werklink bestaat niet');if(!data.active)throw new Error('Werklink is ingetrokken');if(data.valid_until&&new Date(data.valid_until)<new Date())throw new Error('Werklink is verlopen');return{sb,row:data}}
export async function GET(_r,{params}){try{const {token}=await params;const {row}=await getRow(token);return NextResponse.json({work:safeLink(row)})}catch(e){return fail(e.message,404)}}
export async function POST(req,{params}){try{
  const {token}=await params,b=await req.json(),{sb,row}=await getRow(token),now=new Date().toISOString(),u={updated_at:now};
  if(b.action==='clock_in'){if(['Ingeklokt','Pauze'].includes(row.status))return fail('Je bent al ingeklokt');Object.assign(u,{status:'Ingeklokt',clock_in:now,clock_out:null,pause_started:null,pause_minutes:0})}
  else if(b.action==='pause'){if(row.status!=='Ingeklokt')return fail('Je moet eerst inklokken');Object.assign(u,{status:'Pauze',pause_started:now})}
  else if(b.action==='resume'){if(row.status!=='Pauze')return fail('Geen actieve pauze');const extra=Math.max(0,Math.round((Date.now()-new Date(row.pause_started).getTime())/60000));Object.assign(u,{status:'Ingeklokt',pause_started:null,pause_minutes:(row.pause_minutes||0)+extra})}
  else if(b.action==='clock_out'){if(!['Ingeklokt','Pauze'].includes(row.status))return fail('Je bent niet ingeklokt');let p=row.pause_minutes||0;if(row.status==='Pauze'&&row.pause_started)p+=Math.max(0,Math.round((Date.now()-new Date(row.pause_started).getTime())/60000));Object.assign(u,{status:'Uitgeklokt',clock_out:now,pause_started:null,pause_minutes:p})}
  else if(b.action==='save_km'){if(!row.allow_km)return fail('KM invoeren is niet toegestaan');const km=Number(b.kilometers);if(!Number.isFinite(km)||km<0||km>3000)return fail('Ongeldige kilometers');Object.assign(u,{kilometers:km,trip_type:b.tripType==='enkel'?'enkel':'retour'})}
  else if(b.action==='save_note'){if(!row.allow_note)return fail('Notitie niet toegestaan');u.note=String(b.note||'').slice(0,2000)} else return fail('Onbekende actie');
  const {data,error}=await sb.from('work_links').update(u).eq('id',row.id).select('*').single();if(error)throw error;
  await sb.from('work_events').insert({work_link_id:row.id,event_type:b.action,event_data:{kilometers:u.kilometers,tripType:u.trip_type,note:u.note}});
  return NextResponse.json({work:safeLink(data)});
}catch(e){return fail(e.message||'Opslaan mislukt')}}
