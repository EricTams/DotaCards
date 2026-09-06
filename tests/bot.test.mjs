import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,reduce} from '../lib/game.mjs';
import {createBot,decide,observe} from '../lib/bot.mjs';
test('bot observation excludes hidden content, game RNG and draw order',()=>{const s=createRun('earth');let v=observe(s);assert(!('seed' in v));assert(!('combat' in v));assert(!('history' in v));for(const t of v.map.filter(t=>!t.seen))assert.deepEqual(Object.keys(t).sort(),['seen','x','y']);let altered=structuredClone(s);altered.seed=999;for(const t of altered.map)if(!t.seen){t.wall=!t.wall;t.enemy='boss';}assert.deepEqual(decide(observe(s),createBot()),decide(observe(altered),createBot()));});
test('combat bot can deliberately waste a card instead of optimizing it',()=>{const v={phase:'combat',items:[],itemUsed:false,hp:40,maxHp:40,mana:0,maxMana:12,hand:['brace'],actions:2};assert.deepEqual(decide(v,createBot()).action,{type:'play',index:0});v.actions=0;assert.deepEqual(decide(v,createBot()).action,{type:'end'});});
test('bot stops at terminal states and action limit',()=>{assert.equal(decide({phase:'won'},createBot()).action,null);assert.equal(decide({phase:'map'},{steps:1500,seed:1}).action,null);});
test('simple bot takes only legal actions through complete runs for every hero',()=>{
 for(const hero of ['earth','witch','drow'])for(let seed=1;seed<=5;seed++){
  let s=createRun(hero,seed),memory=createBot(seed);
  for(let steps=0;steps<1500&&!['won','lost'].includes(s.phase);steps++){
   const d=decide(observe(s),memory);assert(d.action,`${hero} stopped early: ${d.note}`);
   s=reduce(s,d.action);s.history=[];
  }
  assert(['won','lost'].includes(s.phase),`${hero} failed to finish`);
 }
});
