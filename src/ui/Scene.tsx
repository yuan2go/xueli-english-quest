import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { QuestBoard, Verdict, Intent } from '../game/quest.ts';
import { puzzle, lexeme } from '../content/quest.ts';
import { nodeOf, visible } from '../domain/spatial.ts';
import type { Place } from '../domain/spatial.ts';
import { Visual } from './Art.tsx';
import { usePointerDrop } from './pointer.ts';
export function Scene({ board, selected, select, send, receipt, reduced }: {
 board: QuestBoard; selected: string | undefined; select: (id: string) => void; send: (intent: Intent) => void; receipt?: Verdict; reduced: boolean;
}) {
 const scope=useRef<HTMLDivElement>(null), spec=puzzle(board.level,board.variant), w=board.world;
 const positions=useRef(new Map<string,{x:number;y:number}>()), animations=useRef<Animation[]>([]);
 const [pose,setPose]=useState('cat');
 function drop(source:string,target:string|null){
  if(!target||!w.entities[source])return;
  const [kind,id]=target.split(':');
  if(kind==='node') send({kind:'world',action:{type:'move',source,to:{kind:'node',id}}});
  else if(kind==='on'||kind==='in')send({kind:'world',action:{type:'move',source,to:{kind,id}}});
 }
 const pointer=usePointerDrop(drop,false,scope);
 function go(place:Place){send({kind:'world',action:{type:'move',source:selected??'cat-companion',to:place}});}
 useLayoutEffect(()=>{
  const stop=()=>{animations.current.forEach(a=>a.cancel());animations.current=[];setPose('cat');};
  stop();
  const elements=[...(scope.current?.querySelectorAll<HTMLElement>('[data-entity]')??[])];
  const bounds=scope.current!.getBoundingClientRect();
  const sampled=elements.map(el=>{const r=el.getBoundingClientRect();return {el,id:el.dataset.entity!,x:r.left-bounds.left,y:r.top-bounds.top};});
  if(!reduced){
   for(const {el,id,x,y} of sampled){
    const before=positions.current.get(id), motion=receipt?.motions.find(m=>m.id===id);
    if(before&&motion&&motion.nodes.length>1){
     const delta=motion.nodes.map(node=>spec.rules.nodes.find(n=>n.id===node)!);
     const final=delta.at(-1)!;
     const frames=[{transform:`translate(-50%,-80%) translate(${before.x-x}px,${before.y-y}px)`},...delta.slice(1,-1).map(n=>({transform:`translate(-50%,-80%) translate(${(n.x-final.x)*bounds.width/100}px,${(n.y-final.y)*bounds.height/100}px)`})),{transform:'translate(-50%,-80%)'}];
     animations.current.push(el.animate(frames,{duration:Math.min(1200,350*motion.nodes.length),easing:'ease-in-out'}));
    }
   }
  }
  positions.current=new Map(sampled.map(({id,x,y})=>[id,{x,y}]));
  setPose(receipt?.status==='blocked'?'cat-thinking':receipt?.status==='done'?'cat-happy':receipt?.motions.length?'cat-action':'cat');
  const timer=setTimeout(()=>setPose('cat'),reduced?0:1300);
  window.addEventListener('resize',stop);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  return()=>{clearTimeout(timer);stop();window.removeEventListener('resize',stop);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};
 },[w,receipt,reduced]);
 const objects=Object.values(w.entities);
 function position(id:string):{x:number;y:number}{
  const e=w.entities[id],node=spec.rules.nodes.find(n=>n.id===nodeOf(w,id))!;
  if(e.place.kind!=='node'){const p=position(e.place.id);return {x:p.x+(e.place.kind==='in'?2:0),y:p.y-(e.place.kind==='on'?13:4)};}
  const peers=objects.filter(t=>t.place.kind==='node'&&t.place.id===e.place.id&&t.word!=='door');
  const i=peers.findIndex(t=>t.id===id);
  return {x:node.x+(e.word==='door'?13:peers.length>1?(i-(peers.length-1)/2)*9:0),y:node.y-(e.word==='door'?14:13)};
 }
 return <div className={`quest-scene level-${board.level}`} ref={scope} aria-label="可操作的纸上世界" data-level={board.level} data-world-revision={w.revision}>
  <div className="paper-sun" aria-hidden="true"/><div className="distant-trees" aria-hidden="true">♧　♧　♧</div>
  {spec.rules.handles.length>0&&<div className={`paper-fence ${w.entities.gate?.open?'is-open':''}`} aria-hidden="true"><i/><i/><i/><i/></div>}
  <svg className="paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{spec.rules.edges.map((e,i)=>{const a=spec.rules.nodes.find(n=>n.id===e.a)!,b=spec.rules.nodes.find(n=>n.id===e.b)!;return <path key={i} d={`M${a.x},${a.y} L${b.x},${b.y}`} className={!e.enabled?'sealed':e.door&&!w.entities[e.door].open?'closed-path':''}/>;})}</svg>
  {spec.rules.nodes.map(n=><button key={n.id} className={`ground-node ${n.id==='hole'?'hole-node':''}`} data-drop={`node:${n.id}`} data-node={n.id} style={{left:`${n.x}%`,top:`${n.y}%`}} onClick={()=>pointer.click(()=>go({kind:'node',id:n.id}))} aria-label={`前往${n.label}`}><span>{n.label}</span>{n.clearance<3&&<small>{n.clearance===1?'仅 small':'最高 normal'}</small>}</button>)}
  {objects.filter(e=>visible(w,e.id)).map(e=>{const p=position(e.id);return <button key={e.id} data-entity={e.id} data-size={e.size} data-place={`${e.place.kind}:${e.place.id}`} data-open={String(e.open)} data-drop={spec.rules.types[e.word].support?`on:${e.id}`:spec.rules.types[e.word].container?`in:${e.id}`:undefined}
   className={`world-entity ${e.word==='door'?'door-entity':''} ${selected===e.id?'selected':''} ${e.open?'open':'closed'}`} style={{left:`${p.x}%`,top:`${p.y}%`,'--size':e.size==='small'?.66:e.size==='big'?1.32:1} as CSSProperties}
   onPointerDown={event=>pointer.start(event,e.id)} onClick={()=>pointer.click(()=>select(e.id))} aria-label={`${lexeme(e.word)?.zh??e.word} ${e.word}`} aria-pressed={selected===e.id}>
   <span className="entity-picture"><Visual id={e.word==='cat'?pose:e.word} label={lexeme(e.word)?.zh??e.word}/></span>
   <span className="entity-label">{lexeme(e.word)?.zh} <b lang="en">{e.word}</b></span>
   <span className="entity-state">{e.size!=='normal'?e.size:''}{spec.rules.types[e.word].container||e.word==='door'?e.open?' · open':' · closed':''}</span>
  </button>;})}
  {pointer.ghost&&<div className="drag-ghost" style={{left:pointer.ghost.x,top:pointer.ghost.y}}>{lexeme(w.entities[pointer.ghost.label]?.word)?.zh??'移动'}</div>}
  <p className="scene-instruction">选物品，再点地点 · 也可以拖动</p>
  {!reduced&&receipt?.motions.length?<button className="skip-motion" onClick={()=>{animations.current.forEach(a=>a.finish());setPose('cat');}}>跳过动作</button>:null}
 </div>;
}
