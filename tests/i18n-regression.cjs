// LUMITRA zero-dependency static localization regression tests.
// Run: node tests/i18n-regression.cjs
const fs=require('node:fs');const assert=require('node:assert/strict');
const home=fs.readFileSync('index.html','utf8');const global=fs.readFileSync('global.html','utf8');const guide=fs.readFileSync('japan-guide.html','utf8');
const family=fs.readFileSync('family-japan.html','utf8');const guideGlobal=fs.readFileSync('japan-guide-global.html','utf8');
const locales=['ja','en','zh','zh-TW','ko','fr','es','th'];
for(const lang of locales){assert(home.includes('value="'+lang+'"'),'homepage missing '+lang);assert(global.includes('value="'+lang+'"'),'global missing '+lang);}
assert(home.includes('new URLSearchParams(location.search).get("lang")'),'homepage must respect explicit language');
assert(home.includes('localStorage.setItem("lumitra-language",language)'),'homepage must persist language');
assert(global.includes('./index.html?lang=ja'),'Japanese return must explicitly override stale storage');
assert(global.includes('LUMITRA_AUDIT_NOW'),'runtime audit missing');
assert(global.includes('LUMITRA_EXPORT_I18N_AUDIT'),'audit export missing');
assert(global.includes('characterData:true'),'dynamic content translation/audit missing');
assert(guide.includes('<html'),'Japan guide missing');
assert(family.includes('lumitra-family-restore'),'family page must redirect to full planner');
assert(family.includes('location.replace(target)'),'family redirect missing');
assert(global.includes('LUMITRA_LOCALIZE_PLAN'),'dynamic plan localizer missing');
assert(home.includes('japan-guide-global.html'),'home guide link missing');
assert(global.includes('japan-guide-global.html'),'global guide link missing');
for(const [name,html] of [['index',home],['global',global],['guide',guide],['family',family],['guide-global',guideGlobal]]) {
 assert(!/https?:\/\/[^\s"'<>]*\.ts\.net(?::\d+)?/i.test(html),name+' contains a private Tailscale URL');
}
assert(global.includes('lumitra-plan-localizer'),'localized planner script missing');
assert(global.includes(String.raw`/^(\d+)名(以上)?$/`),'traveler count regex must match digits');
assert(global.includes(String.raw`/^(\d+)万円(以内|以上)$/`),'yen budget regex must match digits');
assert(!global.includes(String.raw`/^(\\d+)名(以上)?$/`),'traveler count regex double-escaped');
assert(!global.includes(String.raw`/^(\\d+)万円(以内|以上)$/`),'yen budget regex double-escaped');
assert(global.includes('LUMITRA_I18N_AUDIT'),'browser untranslated-content audit missing');
for(const lang of locales){assert(guideGlobal.includes('value="'+lang+'"'),'guide missing '+lang);}

for(const [name,html] of [['index',home],['global',global],['guide',guide],['family',family],['guide-global',guideGlobal]]){
 const scripts=[...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)];
 for(let i=0;i<scripts.length;i++){try{new (require('node:vm').Script)(scripts[i][1],{filename:name+'-inline-'+i+'.js'});}catch(e){throw new Error(name+' script '+i+': '+e.message);}}
 console.log('PASS '+name+': '+scripts.length+' inline scripts parse');
}

const vm=require('node:vm');
const localizer=global.match(/<script id="lumitra-plan-localizer">([\\s\\S]*?)<\\/script>/);
assert(localizer,'localizer script missing');
for(const lang of locales.filter(x=>x!=='ja')){
 const nodes={};
 const el=id=>nodes[id]||(nodes[id]={textContent:'',children:[],replaceChildren(){this.children=[];},append(...v){this.children.push(...v);}});
 const document={getElementById:el,createElement:tag=>({tag,textContent:'',children:[],append(...v){this.children.push(...v);}})};
 const context={window:{},document,location:{search:'?lang='+lang},URLSearchParams,localStorage:{getItem:()=>null}};
 vm.runInNewContext(localizer[1],context,{timeout:1500});
 const plan=context.window.LUMITRA_LOCALIZE_PLAN({area:'長野',theme:'温泉',days:'1泊2日',origin:'Tokyo',date:'2026-12-01',transport:'車',party:'2名',budget:'7万円以内',season:'秋',original:'original Japanese'});
 assert(plan&&plan!=='original Japanese','planner did not localize '+lang);
 assert(!/[\\u3040-\\u30ff]/.test(plan),'Japanese kana remained in '+lang+' generated plan: '+plan);
 assert(!plan.includes('2名')&&!plan.includes('7万円'),'traveler or budget not localized '+lang);
 assert(el('trip-result-title').textContent,'result title missing '+lang);
 assert(el('trip-itinerary').children.length>0,'itinerary missing '+lang);
}
console.log('PASS generated itinerary localization for seven languages');

console.log('PASS locale selectors: '+locales.join(', '));
console.log('PASS locale persistence, Japanese return and runtime audit hooks');
console.log('NOTE: static tests do not establish translated content completeness or browser behavior');
