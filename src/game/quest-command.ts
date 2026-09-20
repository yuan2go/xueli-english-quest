import type { Intent } from "./quest.ts";
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 200): v is string => typeof v === "string" && v.length <= max;
function fields(v: Record<string, unknown>, allowed: string[]) { if(Object.keys(v).some(k=>!allowed.includes(k))) throw new Error("Unexpected command field"); }
const intents: Record<Intent['kind'], string[]> = {
 world:['kind','action'],sentence:['kind','task','ids','text','selected'],spell:['kind','word','answer'],teach:['kind','word'],support:['kind','value'],audio:['kind','value','assetId','source','version'],
 undo:['kind'],next:['kind'],restart:['kind'],enter:['kind','mode'],practice:['kind','mode','exercise'],
};
export function validIntent(value: unknown): value is Intent {
 if (!isRecord(value) || typeof value.kind !== 'string' || !Object.hasOwn(intents,value.kind)) return false;
 fields(value,intents[value.kind as Intent['kind']]);
 if (value.kind==='world') {
  const a=value.action; if(!isRecord(a) || !str(a.type)) return false;
  if(a.type==='create') {fields(a,['type','word']); return str(a.word,30);}
  if(!str(a.source,64)) return false;
  if(a.type==='resize'){fields(a,['type','source','size']);return ['small','normal','big'].includes(String(a.size));}
  if(a.type==='open'){fields(a,['type','source','open']);return typeof a.open==='boolean';}
  if(a.type==='move'){fields(a,['type','source','to']);const t=a.to;if(!isRecord(t))return false;fields(t,['kind','id']);return ['node','in','on'].includes(String(t.kind))&&str(t.id,64);}
  return false;
 }
 if(value.kind==='sentence') return str(value.task,100)&&((str(value.text,240)&&value.ids===undefined)||(Array.isArray(value.ids)&&value.text===undefined&&value.ids.length<=24&&value.ids.every(x=>str(x,100))))&&(value.selected===undefined||str(value.selected,64));
 if(value.kind==='spell')return str(value.word,30)&&str(value.answer,40);
 if(value.kind==='teach')return str(value.word,30);
 if(value.kind==='support')return ['hint','text','demo'].includes(String(value.value));
 if(value.kind==='audio')return ['loading','playing','completed','failed','cancelled','muted'].includes(String(value.value))&&['recording','development-speech','unavailable'].includes(String(value.source))&&str(value.assetId,100)&&str(value.version,100);
 if(value.kind==='enter')return ['story','workshop','revisit'].includes(String(value.mode));
 if(value.kind==='practice')return ['assisted','independent'].includes(String(value.mode))&&['command','description','spelling'].includes(String(value.exercise));
 return true;
}

export function validCommand(value: unknown): boolean {
 try {
 if(!isRecord(value))return false; fields(value,["sessionId","revision","board","attemptId","intent"]);
 return str(value.sessionId,100)&&str(value.board,40)&&str(value.attemptId,100)&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value.attemptId)&&Number.isSafeInteger(value.revision)&&Number(value.revision)>=0&&validIntent(value.intent);
 } catch {return false;}
}
