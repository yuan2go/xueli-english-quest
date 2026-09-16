import { STEPS } from './story.ts';
import { correctInput, initialSession, run } from '../game/session.ts';
import { isWord, singleLetterChange } from '../domain/world.ts';
import type { Step } from './story.ts';

/** Runs the production command path. This is reachability, never teaching approval. */
export function validateStory(steps: Step[] = STEPS): void {
  if (!Array.isArray(steps) || steps.length !== 13 || new Set(steps.map(s => s.id)).size !== 13) throw new Error('关卡数量或编号不正确');
  const fields = ['id','challenge','act','title','story','type','mode','word','prompt','letters','hints','source','from','target','effect','enter','requires'];
  let state = initialSession('validation');
  steps.forEach((s, index) => {
    if (!s || Object.keys(s).some(k => !fields.includes(k)) || !/^s\d{2}[ab]?$/.test(s.id) || !Number.isInteger(s.challenge) || s.challenge < 1 || s.challenge > 12 || ![1,2,3].includes(s.act) || !['spell','transform','select','place'].includes(s.type) || !['teaching','guided','independent','interaction'].includes(s.mode) || !isWord(s.word) || ![s.title,s.story,s.prompt,s.letters].every(v => typeof v === 'string' && v.length < 200) || !Array.isArray(s.hints) || s.hints.length !== 2 || s.hints.some(h => typeof h !== 'string' || h.length > 150)) throw new Error(`关卡结构错误 ${index}`);
    if (s.type === 'spell') {
      const letters = [...s.letters];
      for (const c of s.word) { const i = letters.indexOf(c); if (i < 0) throw new Error('字母不足'); letters.splice(i, 1); }
    }
    if (s.type === 'transform' && (!s.from || !singleLetterChange(s.from, s.word))) throw new Error('换字规则错误');
    const result = run(state, { sessionId: state.id, stepId: s.id, attemptId: `validate-${index}`, expectedRevision: state.revision, type: 'submit', input: correctInput(s) }, steps);
    if (result.outcome !== 'success') throw new Error(`不可达步骤 ${s.id}`);
    state = result.session;
  });
  if (state.world.entities['route-sheet']?.word !== 'map' || state.world.entities['picnic-mat']?.word !== 'mat' || !state.world.flags.includes('crossed-ink') || state.world.entities['cat-companion']?.location.kind !== 'relation') throw new Error('结局状态错误');
}
