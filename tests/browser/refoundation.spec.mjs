import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const evidence='docs/evidence/gameplay-refoundation-06';
const obj=(page,id)=>page.locator(`[data-entity="${id}"]`);
async function select(page,id){await obj(page,id).click();}
async function action(page,name){await page.getByRole('button',{name,exact:true}).click();}
async function node(page,id){await page.locator(`[data-node="${id}"]`).click();}
async function start(page){await page.goto('/');await page.getByRole('button',{name:'开始冒险 →',exact:true}).click();}
export async function solve(page,method){
 if(method==='step'){
  await action(page,'✧ 拼词造物');await action(page,'先认识这个词');await action(page,'✧ 拼词造物');await page.getByLabel('我的字母',{exact:true}).fill('box');await action(page,'施法造物');
  await select(page,'craft-box');await node(page,'step');await action(page,'big');await select(page,'cat-companion');await action(page,'on box · 放上');await select(page,'gate');await action(page,'Open · 打开');
 }else{await select(page,'cat-companion');await action(page,'small');await node(page,'inside');await select(page,'gate');await action(page,'Open · 打开');await select(page,'cat-companion');await action(page,'原来大小');}
 await select(page,'basket-main');await node(page,'home');await expect(page.getByRole('button',{name:'沿小径继续 →'})).toBeVisible();
}
test('R1 real home: two mechanically distinct solutions, undo and refresh',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});await start(page);
 await select(page,'basket-main');await node(page,'home');await expect(page.getByRole('status')).toContainText('过不去');await expect(obj(page,'basket-main')).toHaveAttribute('data-place','node:garden');
 await solve(page,'step');await mkdir(evidence,{recursive:true});await page.getByRole('button',{name:'跳过动作'}).click();await page.screenshot({path:`${evidence}/r1-step.png`,fullPage:true});
 await page.reload();await page.getByRole('button',{name:'继续冒险 →'}).click();await expect(obj(page,'basket-main')).toHaveAttribute('data-place','node:home');
 await page.getByRole('button',{name:'暂停与设置'}).click();await action(page,'重开本关（保留尝试记录）');await solve(page,'hole');await page.getByRole('button',{name:'跳过动作'}).click();await page.screenshot({path:`${evidence}/r1-hole.png`,fullPage:true});expect(errors).toEqual([]);
});
