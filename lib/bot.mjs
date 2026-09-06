import { CARDS, publicState } from './game.mjs';

// Keep the bot's input separate from engine state: no hidden terrain, draw order or game RNG.
export function observe(s) {
  return { ...publicState(s), maxHp:s.maxHp, maxMana:s.maxMana, items:[...s.items],
    deckSize:s.deck.length, actions:s.combat?.actions??0, itemUsed:s.combat?.itemUsed??false };
}
export function createBot(seed=71) { return { seed:seed>>>0, steps:0 }; }
function pick(memory, values) {
  memory.seed=(Math.imul(memory.seed,1664525)+1013904223)>>>0;
  return values[Math.floor(memory.seed/4294967296*values.length)];
}
function destinations(v) {
  const [x,y]=v.position,start=y*10+x,queue=[start],paths=new Map([[start,[]]]);
  while(queue.length){const idx=queue.shift(),t=v.map[idx];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=t.x+dx,ny=t.y+dy;if(nx<0||nx>9||ny<0||ny>9)continue;
      const n=ny*10+nx,cell=v.map[n];if(paths.has(n)||!cell.seen||cell.wall)continue;
      paths.set(n,[...paths.get(idx),{type:'move',x:nx,y:ny}]);
      // An event or enemy is a destination, not a path through an unresolved choice.
      if(cell.done||['empty','home'].includes(cell.type))queue.push(n);
    }
  }
  return [...paths].filter(([,p])=>p.length).map(([idx,path])=>({tile:v.map[idx],path}));
}
export function decide(v, memory) {
  if(!v||['won','lost'].includes(v.phase))return {action:null,note:'Run finished.'};
  if(memory.steps>=1500)return {action:null,note:'Stopped at the action limit.'};
  memory.steps++;
  const result=(action,note)=>({action,note});
  if(['map','combat'].includes(v.phase)&&!v.itemUsed){
    if(v.hp<=v.maxHp-8&&v.items.includes('heal'))return result({type:'item',index:v.items.indexOf('heal')},'Drank a healing draught.');
    if(v.mana<=2&&v.items.includes('mana'))return result({type:'item',index:v.items.indexOf('mana')},'Drank a mana draught.');
    if(v.phase==='combat'&&v.items.includes('bomb'))return result({type:'item',index:v.items.indexOf('bomb')},'Used a blast charge.');
  }
  if(v.phase==='combat'){
    const affordable=v.hand.map((id,index)=>({id,index})).filter(c=>CARDS[c.id].mana<=v.mana);
    if(!v.actions||!affordable.length)return result({type:'end'},'Ended the turn.');
    const chosen=pick(memory,affordable);
    return result({type:'play',index:chosen.index},`Played ${CARDS[chosen.id].name}.`);
  }
  if(v.phase==='approach')return result({type:'encounter',choice:'fight'},'Chose to fight.');
  if(v.phase==='reward'){
    const r=v.reward,id=r.kind==='cards'&&v.deckSize>=22?null:pick(memory,r.cards);
    return result({type:'reward',id,replace:0},id?'Took a reward.':'Skipped a card.');
  }
  if(v.phase==='event')return result({type:'event',choice:v.reward.kind==='shrine'?(v.hp<v.maxHp-4?'heal':'mana'):'leave'},v.reward.kind==='shrine'?'Used the shrine.':'Left the event.');
  if(v.phase==='map'){
    const choices=destinations(v),enemies=choices.filter(c=>c.tile.enemy&&!c.tile.done&&c.tile.type!=='boss');
    const bosses=choices.filter(c=>c.tile.type==='boss'&&!c.tile.done);
    const treasure=choices.filter(c=>!c.tile.done&&['treasure','shrine'].includes(c.tile.type));
    const frontier=choices.filter(c=>!c.tile.enemy||c.tile.done).filter(c=>v.map.some(t=>!t.seen&&Math.abs(t.x-c.tile.x)<=1&&Math.abs(t.y-c.tile.y)<=1));
    let pool,note;
    if(treasure.length){pool=treasure;note='Moved toward a discovery.';}
    else if(v.hp>=v.maxHp*.6&&enemies.length){pool=enemies;note='Moved toward an enemy.';}
    else if(frontier.length){pool=frontier;note='Moved toward unexplored ground.';}
    else if(enemies.length){pool=enemies;note='Moved toward an enemy.';}
    else if(bosses.length){pool=bosses;note='Moved toward the enemy Ancient.';}
    else return result(null,'No useful known route. Paused.');
    const distance=Math.min(...pool.map(c=>c.path.length));
    return result(pick(memory,pool.filter(c=>c.path.length===distance)).path[0],note);
  }
  return result(null,'Paused at an unsupported choice.');
}
