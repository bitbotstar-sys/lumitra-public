// LUMITRA zero-dependency static localization regression tests.
// Run: node tests/i18n-regression.cjs
const fs=require('node:fs');const assert=require('node:assert/strict');
const home=fs.readFileSync('index.html','utf8');const global=fs.readFileSync('global.html','utf8');const guide=fs.readFileSync('japan-guide.html','utf8');
const locales=['ja','en','zh','zh-TW','ko','fr','es','th'];
for(const lang of locales){assert(home.includes('value="'+lang+'"'),'homepage missing '+lang);assert(global.includes('value="'+lang+'"'),'global missing '+lang);}
assert(home.includes('new URLSearchParams(location.search).get("lang")'),'homepage must respect explicit language');
assert(home.includes('localStorage.setItem("lumitra-language",language)'),'homepage must persist language');
assert(global.includes('./index.html?lang=ja'),'Japanese return must explicitly override stale storage');
assert(global.includes('LUMITRA_AUDIT_NOW'),'runtime audit missing');
assert(global.includes('LUMITRA_EXPORT_I18N_AUDIT'),'audit export missing');
assert(global.includes('characterData:true'),'dynamic content translation/audit missing');
assert(guide.includes('<html'),'Japan guide missing');
for(const [name,html] of [['index',home],['global',global],['guide',guide]]){
 const scripts=[...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)];
 for(let i=0;i<scripts.length;i++){try{new (require('node:vm').Script)(scripts[i][1],{filename:name+'-inline-'+i+'.js'});}catch(e){throw new Error(name+' script '+i+': '+e.message);}}
 console.log('PASS '+name+': '+scripts.length+' inline scripts parse');
}
console.log('PASS locale selectors: '+locales.join(', '));
console.log('PASS locale persistence, Japanese return and runtime audit hooks');
console.log('NOTE: static tests do not establish translated content completeness or browser behavior');
