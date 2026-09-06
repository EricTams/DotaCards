export function observe(state:any):any;
export function createBot(seed?:number):{seed:number,steps:number};
export function decide(view:any,memory:{seed:number,steps:number}):{action:any,note:string};
