import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient,hashToken,checkMasterCode } from '../../../lib/worklinkServer';
const fail=(m,s=400)=>NextResponse.json({error:m},{status:s});
export async function GET(req){try{
  if(!checkMasterCode(req.headers.get('x-worklink-master-code')))return fail('Geen toegang',401);
  const {data,error}=await adminClient().from('work_links').select('id,employee_name,employee_type,project_name,customer_name,work_date,status,clock_in,clock_out,kilometers,active,valid_until,updated_at').order('created_at',{ascending:false}).limit(100);
  if(error)throw error;return NextResponse.json({links:data||[]});
}catch(e){return fail(e.message||'Laden mislukt',500)}}
export async function POST(req){try{
  const b=await req.json();if(!checkMasterCode(b.masterCode))return fail('Mastercode klopt niet',401);
  if(!String(b.employeeName||'').trim()||!String(b.projectName||'').trim())return fail('Vul medewerker en project in');
  const token=crypto.randomBytes(24).toString('base64url');
  const record={token_hash:hashToken(token),employee_name:String(b.employeeName).trim(),employee_type:String(b.employeeType||'Medewerker'),employee_photo:String(b.employeePhoto||''),project_name:String(b.projectName).trim(),customer_name:String(b.customerName||''),work_address:String(b.workAddress||''),work_date:b.workDate||null,planned_start:b.plannedStart||null,planned_end:b.plannedEnd||null,assignment:String(b.assignment||''),allow_km:b.allowKm!==false,allow_note:b.allowNote!==false,valid_until:b.validUntil||new Date(Date.now()+14*86400000).toISOString(),active:true,status:'Niet gestart'};
  const sb=adminClient();const {data,error}=await sb.from('work_links').insert(record).select('id').single();if(error)throw error;
  await sb.from('work_events').insert({work_link_id:data.id,event_type:'link_created',event_data:{employee:record.employee_name,project:record.project_name}});
  return NextResponse.json({id:data.id,url:`${new URL(req.url).origin}/werk/${token}`});
}catch(e){return fail(e.message||'Maken mislukt',500)}}
export async function PATCH(req){try{
  const b=await req.json();if(!checkMasterCode(b.masterCode))return fail('Mastercode klopt niet',401);
  const {error}=await adminClient().from('work_links').update({active:b.active===true,updated_at:new Date().toISOString()}).eq('id',b.id);if(error)throw error;
  return NextResponse.json({ok:true});
}catch(e){return fail(e.message||'Wijzigen mislukt',500)}}
