import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Werklink cloudconfiguratie ontbreekt');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export const hashToken=t=>crypto.createHash('sha256').update(String(t||'')).digest('hex');
export function checkMasterCode(code){
  const expected=process.env.WORKLINK_MASTER_CODE;
  if(!expected) throw new Error('WORKLINK_MASTER_CODE ontbreekt');
  return String(code||'')===String(expected);
}
export function safeLink(r){return {
  id:r.id,employeeName:r.employee_name,employeeType:r.employee_type,employeePhoto:r.employee_photo||'',
  projectName:r.project_name,customerName:r.customer_name,workAddress:r.work_address,workDate:r.work_date,
  plannedStart:r.planned_start,plannedEnd:r.planned_end,assignment:r.assignment,allowKm:r.allow_km,
  allowNote:r.allow_note,validUntil:r.valid_until,active:r.active,status:r.status,clockIn:r.clock_in,
  clockOut:r.clock_out,pauseStarted:r.pause_started,pauseMinutes:r.pause_minutes||0,
  kilometers:Number(r.kilometers||0),tripType:r.trip_type||'retour',note:r.note||'',updatedAt:r.updated_at
}};
