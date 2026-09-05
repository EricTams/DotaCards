import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,reduce,makeMap,stats,publicState,CARDS,HEROES,ASPECTS} from '../lib/game.mjs';
function fight(hero='earth',enemy='melee'){let s=createRun(hero);s.map[51].type='enemy';s.map[51].enemy=enemy;return reduce(s,{type:'move',x:1,y:5});}
test('all heroes have exactly 3 innate and 8 paired aspect starters',()=>{for(const h of Object.keys(HEROES)){let s=createRun(h);assert.equal(s.deck.length,11);assert.equal(s.deck.filter(id=>CARDS[id].aspect==='Innate').length,3);assert(!s.deck.includes(HEROES[h].ult));}});
test('3x3 reveal includes walls, restores once, caps resources, hides remaining contents',()=>{let s=createRun('earth');s.hp=10;s.mana=0;let before=s.map.filter(t=>t.seen).length;let n=reduce(s,{type:'move',x:1,y:5});let count=n.map.filter(t=>t.seen).length-before;assert.equal(count,3);assert.equal(n.hp,13);assert.equal(n.mana,1.5);assert(n.map[42].seen);n=reduce(n,{type:'move',x:0,y:5});assert.equal(n.hp,13);assert.deepEqual(Object.keys(publicState(n).map.find(t=>!t.seen)).sort(),['seen','x','y']);});
test('seeing an enemy does not fight; entering it does; movement rejected during combat',()=>{let s=createRun('earth');s.map[51].type='enemy';s.map[51].enemy='melee';assert.equal(s.phase,'map');s=reduce(s,{type:'move',x:1,y:5});assert.equal(s.phase,'combat');assert.throws(()=>reduce(s,{type:'move',x:0,y:5}));});
test('every Earthshaker spell triggers Aftershock including zero mana and twice in one turn',()=>{let s=fight();s.combat.hand=['cask','cask'];let hp=s.combat.hp;s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'play',index:0});assert.equal(s.combat.hp,hp-10);assert.equal(s.combat.block,6);assert.equal(s.metrics.passives,2);});
test('lethal damage cancels intent and grants pre-level recovery',()=>{let s=fight();s.hp=15;s.mana=0;s.combat.hp=5;s.combat.hand=['crush'];s=reduce(s,{type:'play',index:0});assert.equal(s.phase,'reward');assert.equal(s.hp,18);assert.equal(s.mana,0);assert.equal(s.level,2);});
test('Gris-gris resolves before Curse, restores half maxima once, second death loses',()=>{let s=fight('witch','elite');s.hp=1;s.mana=0;s.combat.turn=2;s.combat.curse=2;s=reduce(s,{type:'end'});assert.equal(s.hp,16);assert.equal(s.mana,8);assert.equal(s.gris,false);assert.equal(s.combat.hp,36);s.hp=1;s.combat.turn=2;s=reduce(s,{type:'end'});assert.equal(s.phase,'lost');});
test('Drow bonus is binary and based on HP damage during previous round',()=>{let s=fight('drow','elite');s=reduce(s,{type:'end'});assert.equal(s.combat.agile,true);assert.equal(s.combat.hand.length,6);s=reduce(s,{type:'end'});assert.equal(s.combat.agile,false);assert.equal(s.combat.hand.length,5);s.combat.block=100;s=reduce(s,{type:'end'});assert.equal(s.combat.agile,true);assert.equal(stats(s).draw,6);s.combat.block=100;s=reduce(s,{type:'end'});assert.equal(stats(s).draw,6);});
test('level six grants only the ultimate and never double-grants on acknowledgement',()=>{let s=fight();s.level=5;s.combat.hp=1;s.combat.hand=['crush'];s=reduce(s,{type:'play',index:0});assert.equal(s.level,6);assert.equal(s.reward.kind,'ultimate');assert.equal(s.deck.length,12);s=reduce(s,{type:'reward',id:'echo'});assert.equal(s.phase,'map');assert.equal(s.deck.filter(x=>x==='echo').length,1);assert.throws(()=>reduce(s,{type:'reward',id:'echo'}));});
test('zero mana basic cards work; illegal plays never mutate original state',()=>{let s=fight();s.mana=0;s.combat.hand=['fissure','stone','brace'];let orig=structuredClone(s);assert.throws(()=>reduce(s,{type:'play',index:0}));assert.deepEqual(s,orig);s=reduce(s,{type:'play',index:1});s=reduce(s,{type:'play',index:1});assert.equal(s.combat.actions,0);assert.throws(()=>reduce(s,{type:'play',index:0}));});
test('items respect capacity, one use per turn, and single effects',()=>{let s=fight();s.hp=10;s=reduce(s,{type:'item',index:0});assert.equal(s.hp,18);assert.throws(()=>reduce(s,{type:'item',index:0}));s=createRun('earth');s.phase='reward';s.reward={kind:'item',cards:['bomb']};assert.throws(()=>reduce(s,{type:'reward',id:'bomb'}));s=reduce(s,{type:'reward',id:'bomb',replace:1});assert.deepEqual(s.items,['heal','bomb']);});
test('resource relic acquisition changes max only',()=>{let s=createRun('earth');s.hp=20;s.phase='reward';s.reward={kind:'relic',cards:['heart']};s=reduce(s,{type:'reward',id:'heart'});assert.equal(s.maxHp,46);assert.equal(s.hp,20);});
test('map has a safe connected route between Ancients with all enemies blocked',()=>{let m=makeMap(),seen=new Set([50]),q=[50];while(q.length){let idx=q.shift(),t=m[idx];for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=t.x+dx,y=t.y+dy;if(x<0||x>9||y<0||y>9)continue;let n=y*10+x;if(seen.has(n)||m[n].wall||m[n].enemy)continue;seen.add(n);q.push(n);}}assert([...seen].some(i=>Math.abs(m[i].x-9)+Math.abs(m[i].y-5)===1));assert(seen.size>25);});
test('same seed and actions reproduce gameplay',()=>{let a=fight(),b=fight();for(let n=0;n<2;n++){a=reduce(a,{type:'end'});b=reduce(b,{type:'end'});}delete a.started;delete b.started;assert.deepEqual(a,b);});
test('high-agility late Drow draws 3 more than low-agility starting Earthshaker',()=>{let s=fight('drow');s.level=16;s.combat.agile=true;assert.equal(stats(s).draw-stats(createRun('earth')).draw,3);});

test('combat and event rewards exclude all basic aspect starters while retaining innate abilities',()=>{
 const starters=new Set(Object.values(ASPECTS).flat());
 for(const hero of Object.keys(HEROES))for(let seed=1;seed<=30;seed++){
  let s=fight(hero);s.seed=seed;s.combat.hp=1;s.combat.hand=['crush'];
  const victory=reduce(s,{type:'play',index:0});
  let event=createRun(hero,seed);event.phase='event';event.reward={kind:'cache',tile:50};
  event=reduce(event,{type:'event',choice:'pay'});
  for(const result of [victory,event]){
   assert.equal(result.reward.cards.length,3);
   assert(result.reward.cards.every(id=>!starters.has(id)));
   assert(HEROES[hero].innate.includes(result.reward.cards[0]));
   assert.equal(CARDS[result.reward.cards[1]].aspect,HEROES[hero].aspects[0]);
   assert.equal(CARDS[result.reward.cards[2]].aspect,HEROES[hero].aspects[1]);
  }
 }
});
