import test from 'node:test';
import assert from 'node:assert/strict';
import {initialQuest,issue,current,goalSatisfied,taskId,runQuest} from '../src/game/quest.ts';
import {encodeQuest,decodeQuest} from '../src/platform/quest-save.ts';
import {parseLanguage,tokensFor,assembleTokens} from '../src/game/language.ts';
const move=(source,id,kind='node')=>({kind:'world',action:{type:'move',source,to:{kind,id}}});
const resize=(source,size)=>({kind:'world',action:{type:'resize',source,size}});
const open=(source)=>({kind:'world',action:{type:'open',source,open:true}});
function runner(){let s=initialQuest('test');return {get s(){return s;},go(i){const r=issue(s,i);s=r.session;return r.verdict;}};}
export function solveR1(r,method){
 if(method==='step'){
  r.go({kind:'teach',word:'box'});r.go({kind:'spell',word:'box',answer:'box'});
  r.go(move('craft-box','step'));r.go(resize('craft-box','big'));r.go(move('cat-companion','craft-box','on'));r.go(open('gate'));
 }else{r.go(resize('cat-companion','small'));r.go(move('cat-companion','inside'));r.go(open('gate'));r.go(resize('cat-companion','normal'));}
 r.go(move('basket-main','home'));
}
test('G01 two mechanisms reach the same R1 world goal through the single transition',()=>{
 for(const method of ['step','hole']){const r=runner();solveR1(r,method);assert.ok(goalSatisfied(current(r.s)),method);assert.equal(current(r.s).world.entities['cat-companion'].word,'cat');assert.deepEqual(decodeQuest(encodeQuest(r.s)),r.s);}
});
test('G02/G03 blocked transport, handle and occupied support publish no partial world',()=>{
 const r=runner();const before=structuredClone(current(r.s).world);
 assert.equal(r.go(move('basket-main','home')).status,'blocked');assert.deepEqual(current(r.s).world,before);
 assert.equal(r.go(open('gate')).status,'blocked');assert.deepEqual(current(r.s).world,before);
 r.go({kind:'teach',word:'box'});r.go({kind:'spell',word:'box',answer:'box'});r.go(move('craft-box','step'));r.go(move('cat-companion','craft-box','on'));
 assert.equal(r.go(open('gate')).status,'blocked');assert.equal(r.go(resize('craft-box','small')).status,'blocked');
});
test('G05 short grammar, variants, repeated tokens and descriptions are separate',()=>{
 for(const text of ['Open the box.','please OPEN BOX!','Make the box small.','The box is small.','Put the apple in the bag.','In the bag, put the apple.'])assert.equal(parseLanguage(text).status,'valid',text);
 assert.equal(parseLanguage('Open the').status,'incomplete');assert.equal(parseLanguage('Sing happily').status,'outside');
 const bank=tokensFor('test'),the=bank.filter(t=>t.text==='the');assert.equal(the.length,2);assert.notEqual(the[0].id,the[1].id);assert.equal(assembleTokens('test',[the[0].id,the[0].id]),undefined);assert.equal(assembleTokens('other',[the[0].id]),undefined);
 const r=runner(),before=structuredClone(current(r.s).world);const v=r.go({kind:'sentence',task:taskId(r.s),text:'The cat is small.'});assert.equal(v.status,'mismatch');assert.equal(v.language,'correct');assert.deepEqual(current(r.s).world,before);
 assert.equal(r.go({kind:'sentence',task:taskId(r.s),text:'Open the door.'}).language,'correct');
});
test('G06/G07 identity, replay idempotence, stale command and undo preserve support and attempts',()=>{
 const r=runner();r.go({kind:'support',value:'hint'});r.go(resize('cat-companion','small'));r.go({kind:'undo'});assert.equal(current(r.s).world.entities['cat-companion'].size,'normal');assert.deepEqual(current(r.s).support,['hint']);assert.equal(r.s.events.length,2);
 const c={sessionId:r.s.id,revision:r.s.revision,board:r.s.active,attemptId:'same',intent:resize('cat-companion','small')};const a=runQuest(r.s,c);const b=runQuest(a.session,c);assert.equal(b.session,a.session);assert.deepEqual(b.verdict,a.verdict);assert.equal(runQuest(a.session,{...c,intent:resize('cat-companion','big')}).verdict.status,'stale');
 assert.deepEqual(decodeQuest(encodeQuest(r.s)),r.s);
});
test('G02/G04 R2 capacity, opening, subtree transport, occupied resize and narrow route reuse actual rules',()=>{
 const r=runner();solveR1(r,'hole');r.go({kind:'next'});
 const before=structuredClone(current(r.s).world);
 assert.equal(r.go(move('apple-main','bag-main','in')).status,'blocked');assert.deepEqual(current(r.s).world,before);
 r.go(open('bag-main'));assert.equal(r.go(move('apple-main','bag-main','in')).status,'blocked');
 r.go(resize('bag-main','big'));r.go(move('apple-main','bag-main','in'));
 const loaded=structuredClone(current(r.s).world);assert.equal(r.go(resize('bag-main','small')).status,'blocked');assert.deepEqual(current(r.s).world,loaded);
 assert.equal(r.go(move('bag-main','clearing')).status,'blocked');
 r.go(resize('bag-main','normal'));r.go({kind:'world',action:{type:'open',source:'bag-main',open:false}});
 assert.equal(r.go(move('apple-main','packing')).status,'blocked');
 r.go(move('bag-main','clearing'));assert.ok(goalSatisfied(current(r.s)));assert.deepEqual(current(r.s).world.entities['apple-main'].place,{kind:'in',id:'bag-main'});
 r.go({kind:'undo'});assert.equal(goalSatisfied(current(r.s)),false);assert.equal(current(r.s).history,true);assert.deepEqual(decodeQuest(encodeQuest(r.s)),r.s);
});
test('G05/G09 full chapter, task mismatch, observation, workshop isolation and changed revisit',()=>{
 const r=runner();solveR1(r,'hole');r.go({kind:'next'});r.go(open('bag-main'));r.go(resize('apple-main','small'));r.go(move('apple-main','bag-main','in'));r.go(move('bag-main','clearing'));r.go({kind:'next'});
 r.go(open('gate'));let v=r.go({kind:'sentence',task:taskId(r.s),text:'Put the apple on the box.'});assert.equal(v.status,'mismatch');assert.equal(v.language,'correct');assert.equal(v.task,'unmet');assert.equal(goalSatisfied(current(r.s)),false);
 const before=structuredClone(current(r.s).world);v=r.go({kind:'sentence',task:taskId(r.s),text:'The apple is on the box.'});assert.equal(v.status,'mismatch');assert.equal(v.language,'correct');assert.deepEqual(current(r.s).world,before);
 r.go({kind:'sentence',task:taskId(r.s),text:'Put the apple in the basket.'});assert.ok(goalSatisfied(current(r.s)));
 const story=structuredClone(current(r.s));r.go({kind:'enter',mode:'workshop'});assert.equal(r.s.active,'workshop');r.go(resize('cat-companion','big'));r.go({kind:'enter',mode:'story'});assert.deepEqual(current(r.s),story);
 r.go({kind:'enter',mode:'revisit'});r.go(resize('cat-companion','small'));assert.equal(r.go(move('cat-companion','inside')).status,'blocked');r.go({kind:'restart'});solveR1(r,'step');assert.ok(goalSatisfied(current(r.s)));assert.equal(current(r.s).level,'R1-R');
 assert.deepEqual(decodeQuest(encodeQuest(r.s)),r.s);
});
test('G07 practice meaning gate, honest independent versus help and no mistakes for incomplete or audio',()=>{
 const r=runner();r.go({kind:'enter',mode:'workshop'});assert.equal(r.go({kind:'practice',mode:'independent',exercise:'command'}).status,'blocked');
 for(const word of ['apple','box','put','in'])r.go({kind:'teach',word});r.go({kind:'practice',mode:'independent',exercise:'command'});
 const count=r.s.events.length;r.go({kind:'sentence',task:taskId(r.s),text:'Put the'});assert.equal(r.s.events.length,count);
 r.go({kind:'sentence',task:taskId(r.s),text:'Put the apple in the box.'});assert.equal(r.s.events.at(-1).evidence,'independent');
 r.go({kind:'support',value:'demo'});r.go({kind:'undo'});r.go({kind:'sentence',task:taskId(r.s),text:'Put the apple in the box.'});assert.equal(r.s.events.at(-1).evidence,'demonstrated');
 r.go({kind:'restart'});r.go({kind:'practice',mode:'independent',exercise:'command'});r.go({kind:'sentence',task:taskId(r.s),text:'Put the apple in the box.'});assert.equal(r.s.events.at(-1).evidence,'demonstrated');
});
test('G08 strict save schema, unknown commands and tampered projection fail closed',()=>{
 const r=runner();solveR1(r,'step');const saved=JSON.parse(encodeQuest(r.s));
 for(const change of [x=>x.schema=7,x=>x.pack.rulesVersion='future',x=>x.projection.active='R3',x=>x.journal[0].intent.extra='injection',x=>x.journal[0].intent.kind='complete',x=>x.journal[0].revision=999]){const v=structuredClone(saved);change(v);assert.throws(()=>decodeQuest(JSON.stringify(v)));}
 assert.throws(()=>decodeQuest('{'));assert.throws(()=>decodeQuest('x'.repeat(4_000_001)));
});
