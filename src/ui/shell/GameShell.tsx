import { useState } from 'react';
import { current, goalSatisfied, taskId } from '../../game/quest.ts';
import type { Intent, Quest, Verdict } from '../../game/quest.ts';
import { puzzle, LEXICON, lexeme } from '../../content/quest.ts';
import { tokensFor } from '../../game/language.ts';
import { Scene } from '../Scene.tsx';
import { SentenceBuilder } from '../SentenceBuilder.tsx';
import { Visual } from '../Art.tsx';
export function GameShell({ session, send, receipt, reduced, speak }: {session:Quest;send:(i:Intent)=>void;receipt?:Verdict;reduced:boolean;speak:(text:string)=>void}) {
 const b=current(session),spec=puzzle(b.level,b.variant);
 const [selected,setSelected]=useState<string>();
 const [tool,setTool]=useState<'object'|'spell'|'sentence'|'learn'|null>(null);
 const [word,setWord]=useState('box'),[answer,setAnswer]=useState(''),[sentence,setSentence]=useState('');
 const selectedEntity=selected?b.world.entities[selected]:undefined;
 const choose=(id:string)=>{setSelected(id);setTool('object');};
 function teach(w:string){setWord(w);setTool('learn');send({kind:'teach',word:w});}
 function close(){setTool(null);document.querySelector<HTMLElement>(`[data-entity="${selected}"]`)?.focus();}
 const done=goalSatisfied(b);
 return <main className={`game-shell ${tool?'has-tool':''}`}>
  <div className="scene-heading"><div><span className="eyebrow">{spec.subtitle}</span><h1>{spec.title}</h1></div><button onClick={()=>send({kind:'undo'})} disabled={!b.undo.length} aria-label="撤销世界行动">↶ 撤销</button></div>
  <p className="goal-ribbon">{done?'✓ ':''}{spec.goalText}</p>
  <Scene board={b} selected={selected} select={choose} send={send} receipt={receipt} reduced={reduced}/>
  <div className="tool-ribbon" aria-label="英语工具"><button onClick={()=>{setWord(spec.rules.quotas[0]?.word??'box');setTool('spell');}}>✧ 拼词造物</button><button onClick={()=>setTool('sentence')}>说一句话</button><button onClick={()=>teach('small')}>词义小样</button><button onClick={()=>send({kind:'support',value:'hint'})}>给我提示</button></div>
  <div className={`feedback ${receipt?.status??''}`} role="status" aria-live="polite">{receipt?.message??spec.invitation}</div>
  {done&&b.level!=='workshop'&&<div className="chapter-arrival">{b.level==='R1'||b.level==='R2'?<button className="primary" onClick={()=>{setTool(null);setSelected(undefined);send({kind:'next'});}}>沿小径继续 →</button>:<><h2>这一份心意，送到了。</h2><p>小猫和你一起布置的野餐，留在这张纸上。</p><button onClick={()=>send({kind:'enter',mode:'revisit'})}>雨后，再回花园</button></>}</div>}
  {tool&&<aside className="context-tool" aria-label="英语工具抽屉" onKeyDown={e=>{if(e.key==='Escape')close();}}><header><h2>{tool==='spell'?'WordSpell · 拼词造物':tool==='sentence'?'让英语做点事情':tool==='learn'?'词义小样':selectedEntity?`${lexeme(selectedEntity.word)?.zh} · ${selectedEntity.word}`:'选一个物品'}</h2><button aria-label="关闭工具" onClick={close}>×</button></header><div className="tool-scroll">
   {tool==='object'&&selectedEntity&&<><p>{lexeme(selectedEntity.word)?.meaning}</p><div className="action-row">{spec.rules.types[selectedEntity.word].resize&&<>{(['small','normal','big'] as const).map(size=><button key={size} onClick={()=>send({kind:'world',action:{type:'resize',source:selectedEntity.id,size}})}>{size==='normal'?'原来大小':size}</button>)}</>}</div>
    {(spec.rules.types[selectedEntity.word].container||selectedEntity.word==='door')&&<div className="action-row"><button onClick={()=>send({kind:'world',action:{type:'open',source:selectedEntity.id,open:true}})}>Open · 打开</button><button onClick={()=>send({kind:'world',action:{type:'open',source:selectedEntity.id,open:false}})}>Close · 关上</button></div>}
    <p className="micro">点场景中的地点来移动；放进或放上其他物品：</p><div className="destinations">{Object.values(b.world.entities).filter(e=>e.id!==selectedEntity.id).flatMap(e=>(['in','on'] as const).filter(kind=>kind==='in'?spec.rules.types[e.word].container:spec.rules.types[e.word].support).map(kind=><button key={`${kind}-${e.id}`} onClick={()=>send({kind:'world',action:{type:'move',source:selectedEntity.id,to:{kind,id:e.id}}})}>{kind} {e.word} · {kind==='in'?'放入':'放上'}</button>))}</div><button className="text-button" onClick={()=>teach(selectedEntity.word)}>认识 {selectedEntity.word}</button></>}
   {tool==='learn'&&<><div className="meaning-tabs">{spec.words.map(w=><button key={w} aria-pressed={word===w} onClick={()=>teach(w)}>{w}</button>)}</div><div className="meaning-sample"><Visual id={lexeme(word)?.asset??'box'} label={lexeme(word)?.zh??word}/><div><h3>{word} · {lexeme(word)?.zh}</h3><p>{lexeme(word)?.meaning}</p><button onClick={()=>speak(word)}>听词语</button></div></div><p lang="en">{lexeme(word)?.example}</p><p>Open / Put / Make 请伙伴行动；The … is … 说眼前的情况。</p><button className="primary" onClick={()=>{setTool('object');setSelected('cat-companion');}}>回到场景试一试</button></>}
   {tool==='spell'&&<><p>用字母做一个{lexeme(word)?.zh}，放在场景里自由使用。</p><div className="action-row">{spec.rules.quotas.map(q=><button key={q.id} onClick={()=>{setWord(q.word);setAnswer('');}}>{lexeme(q.word)?.zh}</button>)}</div>{!b.taught.includes(word)?<button className="primary" onClick={()=>teach(word)}>先认识这个词</button>:<><button onClick={()=>speak(word)}>听一听</button><label className="spell-input">我的字母<input aria-label="我的字母" autoComplete="off" autoCapitalize="none" value={answer} maxLength={20} onChange={e=>setAnswer(e.target.value)}/></label><div className="letter-bank">{[...new Set([...word,'a','e','t'])].sort().map(c=><button key={c} onClick={()=>setAnswer(s=>s+c)} lang="en">{c}</button>)}<button onClick={()=>setAnswer(s=>s.slice(0,-1))}>取回</button></div><button className="primary" disabled={answer.length<word.length} onClick={()=>send({kind:'spell',word,answer})}>施法造物</button></>}</>}
   {tool==='sentence'&&<><p>选择指令或描述。含糊的 it 指向你当前选中的物品。</p><SentenceBuilder task={{id:taskId(session),tokens:tokensFor(taskId(session))}} submit={ids=>send({kind:'sentence',task:taskId(session),ids,selected})}/><details><summary>也可以打字</summary><label>我的句子<input aria-label="输入句子" value={sentence} maxLength={240} onChange={e=>setSentence(e.target.value)}/></label><button onClick={()=>send({kind:'sentence',task:taskId(session),text:sentence,selected})}>提交句子</button></details></>}
  </div></aside>}
 </main>;
}
export function WordBook({session,speak}:{session:Quest;speak:(text:string)=>void}){
 const words=new Set(Object.values(session.boards).flatMap(b=>b.taught));
 session.events.forEach(e=>{if(e.word)words.add(e.word);});
 return <main className="word-book"><span className="eyebrow">我的纸上足迹</span><h1>词语册</h1><p>记录见过和用过的词，不把一次成功当作永久掌握。</p>{LEXICON.filter(l=>words.has(l.word)).map(l=>{const events=session.events.filter(e=>e.word===l.word);return <article key={l.word}><Visual id={l.asset} label={l.zh}/><div><h2>{l.word} <small>{l.zh}</small></h2><p>{l.meaning}</p><p lang="en">{l.example}</p><button onClick={()=>speak(l.word)}>听词语</button><small>见过 / 使用观察 {events.length} 次 · {events.some(e=>e.evidence==='independent')?'有本次独立练习':'尚无独立练习'} · {events.some(e=>e.evidence==='revisit')?'有回访观察':'尚无回访观察'}</small></div></article>;})}{!words.size&&<p>去场景认识一个词，它就会来到这里。</p>}</main>;
}
