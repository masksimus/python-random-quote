import 'dotenv/config';import{readFileSync,readdirSync}from'node:fs';import{join}from'node:path';import{pool}from'./pool.js';
async function main(){const dir=join(process.cwd(),'migrations');for(const f of readdirSync(dir).filter(x=>x.endsWith('.sql')).sort()){await pool.query(readFileSync(join(dir,f),'utf8'));console.log('applied',f)}await pool.end()}main();
