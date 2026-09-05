import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),source=path.join(root,'dist/client'),output=path.join(root,'out');
const prefix=process.env.PAGES_BASE_PATH||'/DotaCards';
await stat(path.join(source,'index.html'));
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
// Vinext emits prefixed assets in a matching folder. Pages already mounts the artifact there.
for(const entry of await readdir(source,{withFileTypes:true})){
 if(entry.name.startsWith('.')||entry.name===prefix.slice(1)||entry.name.endsWith('manifest.json'))continue;
 await cp(path.join(source,entry.name),path.join(output,entry.name),{recursive:true});
}
const nested=path.join(source,prefix.slice(1));
try{for(const name of await readdir(nested))await cp(path.join(nested,name),path.join(output,name),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(output,'.nojekyll'),'');
const html=await readFile(path.join(output,'index.html'),'utf8');
const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(u=>u.startsWith('/'));
for(const url of new Set(urls)){
 if(!url.startsWith(prefix+'/'))throw Error('Unprefixed local asset: '+url);
 await stat(path.join(output,url.slice(prefix.length+1).split('?')[0]));
}
console.log(`Pages artifact ready; ${new Set(urls).size} local asset URLs verified.`);
