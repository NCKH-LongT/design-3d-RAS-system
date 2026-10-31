import{readdir,readFile}from'node:fs/promises';
for(const name of await readdir('dist/assets'))if(name.endsWith('.js')){const source=await readFile(`dist/assets/${name}`,'utf8');if(source.includes('qa-only-user')||source.includes('VITE_QA_PREVIEW'))throw Error('Development fixture leaked into production.');}
const config=JSON.parse(await readFile('dist/firebase-config.json','utf8'));if(config.private_key||config.client_email)throw Error('Never publish service-account credentials.');
console.log('Production has no QA login fixture or service-account credentials.');
