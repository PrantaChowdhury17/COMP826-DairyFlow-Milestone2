import type { SQLiteDatabase } from 'expo-sqlite';
import {pendingOperations,markAcknowledged} from './database';

// API host: emulator uses 10.0.2.2; real phone must use computer's LAN address.
export const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8000';

export async function synchronise(db:SQLiteDatabase):Promise<{sent:number;acknowledged:number;rejected:number}> {
  const operations=await pendingOperations(db);
  if (operations.length===0) return {sent:0,acknowledged:0,rejected:0};
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try {
    const r=await fetch(`${API_URL}/sync`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operations}),signal:controller.signal});
    if(!r.ok) throw new Error(`Server returned HTTP ${r.status}`);
    const data: {acknowledged:string[];rejected:{operationId:string;reason:string}[]}=await r.json();
    const expected=new Set(operations.map(o=>o.operationId));
    const ack=(data.acknowledged??[]).filter(id=>expected.has(id));
    await markAcknowledged(db,ack);
    return {sent:operations.length,acknowledged:ack.length,rejected:data.rejected?.length??0};
  } finally {clearTimeout(timeout);}
}
