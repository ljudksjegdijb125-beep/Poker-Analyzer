/* =========================================================
   扑克机 · V34 ENGINE CORE
   API-only / local-first / no built-in characters
   ========================================================= */
const STORE='pokeji_api_only_v34';
const LEGACY_STORES=['pokeji_api_only_v33','pokeji_api_only_v32','pokeji_api_only_v31','pokeji_api_only_v30','pokeji_api_only_v29','pokeji_api_only_v28','pokeji_api_only_v27','pokeji_api_only_v26','pokeji_api_only_v25','pokeji_api_only_v24','pokeji_api_only_v23','pokeji_api_only_v22','pokeji_api_only_v21','pokeji_api_only_v20','pokeji_api_only_v19','pokeji_api_only_v18','private_ai_space_v18','pokeji_api_only_v4','pokeji_api_only_v3'];
const VERSION=34;
let deferredInstallPrompt=null;
let installRequestState='idle';
let installWatchdog=null;
let startupError=null;
const HOME_APP_CATALOG={
 chats:{label:'聊天',view:'chats',icon:'./assets/icons/apps/chat-a-heart.webp',glyph:'♡',rank:'A',suit:'♥'},
 contacts:{label:'角色',view:'contacts',icon:'./assets/icons/apps/character-k-spade.webp',glyph:'♠',rank:'K',suit:'♠'},
 groups:{label:'群聊',view:'groups',icon:'./assets/icons/apps/group-q-club.webp',glyph:'♣',rank:'Q',suit:'♣'},
 feed:{label:'动态',view:'feed',icon:'./assets/icons/apps/moments-diamond.webp',glyph:'◆',rank:'J',suit:'♦'},
 world:{label:'世界书',view:'world',glyph:'✦',rank:'W',suit:'♠'},memory:{label:'记忆',view:'memory',glyph:'⌁',rank:'M',suit:'♥'},
 engine:{label:'规则',view:'engine',glyph:'✧',rank:'R',suit:'♣'},settings:{label:'设置',view:'settings',glyph:'⚙',rank:'S',suit:'♦'},
 notifications:{label:'通知',view:'notifications',glyph:'◈',rank:'N',suit:'♥'},dataCenter:{label:'资料',view:'dataCenter',glyph:'▣',rank:'D',suit:'♣'}
};
const HOME_GLYPH_SVGS={
 world:'<path d="M16 4.5c1.7 6.2 4.8 9.3 11 11-6.2 1.7-9.3 4.8-11 11-1.7-6.2-4.8-9.3-11-11 6.2-1.7 9.3-4.8 11-11Z"/><circle cx="16" cy="15.5" r="2.2"/>',
 memory:'<path class="icon-fill" d="M18.5 3.8 8.6 17h7l-1.9 11.2 10.5-14.1h-7.1l1.4-10.3Z"/>',
 engine:'<circle cx="16" cy="16" r="9.2"/><path d="m16 7.7 2.3 6 6 2.3-6 2.3-2.3 6-2.3-6-6-2.3 6-2.3 2.3-6Z"/><circle cx="16" cy="16" r="1.8"/>',
 settings:'<circle cx="16" cy="16" r="4.1"/><path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3M7.9 7.9l2.1 2.1M22 22l2.1 2.1M24.1 7.9 22 10M10 22l-2.1 2.1"/><circle cx="16" cy="16" r="9.1" stroke-dasharray="2 3"/>'
};
const HOME_DOCK_APPS=new Set(['notifications','dataCenter']);
function defaultHomeDesktop(){return{pageCount:2,items:[
 {id:'widget_photo_main',kind:'widget',widget:'photo',page:0,x:0,y:0,w:2,h:2,color:'#5b452e',image:''},
 {id:'app_chats',kind:'app',app:'chats',page:0,x:2,y:0,w:1,h:1},
 {id:'app_contacts',kind:'app',app:'contacts',page:0,x:3,y:0,w:1,h:1},
 {id:'app_groups',kind:'app',app:'groups',page:0,x:2,y:1,w:1,h:1},
 {id:'app_feed',kind:'app',app:'feed',page:0,x:3,y:1,w:1,h:1},
 {id:'app_world',kind:'app',app:'world',page:0,x:0,y:2,w:1,h:1},
 {id:'app_memory',kind:'app',app:'memory',page:0,x:1,y:2,w:1,h:1},
 {id:'app_engine',kind:'app',app:'engine',page:0,x:0,y:3,w:1,h:1},
 {id:'app_settings',kind:'app',app:'settings',page:0,x:1,y:3,w:1,h:1},
 {id:'widget_cd_main',kind:'widget',widget:'cd',page:0,x:2,y:2,w:2,h:2,color:'#6f5137',image:''}
 ]}}
function normalizeHomeDesktop(input){
 const base=defaultHomeDesktop();if(!input||typeof input!=='object'||!Array.isArray(input.items))return base;
 const pageCount=Math.min(12,Math.max(1,Number(input.pageCount)||1));
 const ids=new Set(),seenApps=new Set(),items=[];
 for(const raw of input.items){
  if(!raw||!['app','widget'].includes(raw.kind))continue;
  if(raw.kind==='app'&&(!HOME_APP_CATALOG[raw.app]||HOME_DOCK_APPS.has(raw.app)||seenApps.has(raw.app)))continue;
  if(raw.kind==='widget'&&!['photo','cd'].includes(raw.widget))continue;
  const id=String(raw.id||`${raw.kind}_${crypto.randomUUID()}`);if(ids.has(id))continue;ids.add(id);
  if(raw.kind==='app')seenApps.add(raw.app);
  const isWidget=raw.kind==='widget',w=isWidget?2:1,h=isWidget?2:1,page=Math.min(pageCount-1,Math.max(0,Number(raw.page)||0));
  let x=isWidget?(Number(raw.x)<2?0:2):Math.min(3,Math.max(0,Number(raw.x)||0)),y=isWidget?(Number(raw.y)<2?0:2):Math.min(3,Math.max(0,Number(raw.y)||0));
  const overlaps=(sx,sy)=>items.some(item=>item.page===page&&sx<item.x+item.w&&sx+w>item.x&&sy<item.y+item.h&&sy+h>item.y);
  if(overlaps(x,y)){
   let slot=null;
   if(isWidget){for(const [sx,sy] of [[0,0],[2,0],[0,2],[2,2]])if(!overlaps(sx,sy)){slot={x:sx,y:sy};break}}
   else{for(let sy=0;sy<4&&!slot;sy++)for(let sx=0;sx<4;sx++)if(!overlaps(sx,sy)){slot={x:sx,y:sy};break}}
   if(!slot)continue;x=slot.x;y=slot.y;
  }
  items.push({...raw,id,page,x,y,w,h,color:String(raw.color||'#6e5540'),image:String(raw.image||'')});
 }
 return{pageCount,items};
}
let data=load();
let currentChat=null;
let abortController=null;
let busy=false;
let activeBackgroundTaskId='';
let wakeLockSentinel=null;
let chatListMode='online';
let proactiveTimer=null;
let proactiveBusy=false;
const summaryTasks=new Set();
let msgMenuTarget=null;
let homePage=0, homeTouchX=0,homeTouchY=0,homeEditMode=false,homePointerDrag=null;
let groupPendingSpeaker=null;
let islandTimer=null;
let characterImageDraft='';
let characterOriginalImage='';
let characterEditorDraft=null;
let characterEditorTab='profile';
let characterEditorReturn='contacts';
let personaEditorDraft=null;
let personaManagerReturn='contacts';
let personaEditorTab='identity';

function emptyModel(){return{provider:'openai',base:'',key:'',model:'',voice:'alloy'}}
function defaultPersona(){return{id:'persona_default',name:'我',nickname:'',pronouns:'',age:'',identity:'',description:'',personality:'',background:'',appearance:'',likes:'',dislikes:'',speechStyle:'',relationship:'',boundaries:'',goals:'',notes:'',image:''}}
function normalizeCharacter(c={}){return{id:String(c.id||('c_'+crypto.randomUUID())),name:String(c.name||''),nickname:String(c.nickname||''),status:String(c.status||''),pronouns:String(c.pronouns||''),tags:String(c.tags||''),bio:String(c.bio||''),personality:String(c.personality||''),background:String(c.background||''),appearance:String(c.appearance||''),speechStyle:String(c.speechStyle||''),relationship:String(c.relationship||''),scenario:String(c.scenario||''),firstMessage:String(c.firstMessage||''),exampleDialogue:String(c.exampleDialogue||''),systemPrompt:String(c.systemPrompt||''),boundaries:String(c.boundaries||''),image:String(c.image||''),proactiveEnabled:c.proactiveEnabled===true}}
function normalizePersona(p={}){return{id:String(p.id||('persona_'+crypto.randomUUID())),name:String(p.name||'我'),nickname:String(p.nickname||''),pronouns:String(p.pronouns||''),age:String(p.age||''),identity:String(p.identity||''),description:String(p.description||''),personality:String(p.personality||''),background:String(p.background||''),appearance:String(p.appearance||''),likes:String(p.likes||''),dislikes:String(p.dislikes||''),speechStyle:String(p.speechStyle||''),relationship:String(p.relationship||''),boundaries:String(p.boundaries||''),goals:String(p.goals||''),notes:String(p.notes||''),image:String(p.image||'')}}
function defaultDynamicIsland(){return{compactText:'POKEJI',title:'扑克机',subtitle:'私人空间',symbol:'♠',accent:'#eeda9f',size:'standard'}}
function blank(){return{
 settings:{apiProvider:'openai',apiBase:'',apiKey:'',apiModel:'',temperature:.8,maxHistory:40,summaryKeepTurns:12,summaryAutoEnabled:true,timeout:60000,maxTokens:2048,promptCache:true,backgroundRelayEnabled:true,backgroundNotificationEnabled:false,screenWakeLockEnabled:true,proactiveEnabled:false,proactiveMinMinutes:60,proactiveMaxMinutes:180,fullscreenEnabled:false,randomEventsEnabled:false,randomEventChance:15,dynamicIslandEnabled:true,dynamicIsland:defaultDynamicIsland(),appIcon:'',homeAvatar:'',homeAppIcons:{},homeLayoutRevision:2,customFont:{source:'',label:''},themes:[],activeTheme:''},
 models:{chat:emptyModel(),random:emptyModel(),voice:emptyModel(),vision:emptyModel(),summary:emptyModel()},
 characters:[],personas:[defaultPersona()],activePersonaId:'persona_default',chats:{},chatSettings:{},chatSummaries:{},proactiveSchedule:{},groups:[],posts:[],notifications:[],worlds:[],memories:[],
 homeDesktop:defaultHomeDesktop(),
 engine:{
  worldRules:[],presetModules:[],regexRules:[],
  state:{location:'',time:'',weather:'',events:[]}
 }
}}
function normalize(x){
 const d=blank();
 if(!x||typeof x!=='object')return d;
 Object.assign(d,x);
 d.settings={...d.settings,...(x.settings||{})};
 d.settings.dynamicIsland={...defaultDynamicIsland(),...(x.settings?.dynamicIsland||{})};
 d.settings.homeAppIcons=x.settings?.homeAppIcons&&typeof x.settings.homeAppIcons==='object'?x.settings.homeAppIcons:{};
 d.settings.customFont={source:'',label:'',...(x.settings?.customFont||{})};
 d.models={...d.models,...(x.models||{})};
 for(const k of Object.keys(d.models)){const raw=d.models[k]||{},profile={...raw};delete profile.weight;d.models[k]={...emptyModel(),...profile}}
 if(!d.models.chat.base&&d.settings.apiBase)d.models.chat={provider:d.settings.apiProvider||'openai',base:d.settings.apiBase||'',key:d.settings.apiKey||'',model:d.settings.apiModel||'',voice:'alloy'};
 d.characters=Array.isArray(x.characters)?x.characters.map(normalizeCharacter):[];
 d.personas=Array.isArray(x.personas)&&x.personas.length?x.personas.map(normalizePersona):[defaultPersona()];
 d.activePersonaId=d.personas.some(p=>p.id===x.activePersonaId)?x.activePersonaId:d.personas[0].id;
 d.chats=x.chats&&typeof x.chats==='object'&&!Array.isArray(x.chats)?x.chats:{};
 d.chatSummaries=x.chatSummaries&&typeof x.chatSummaries==='object'?x.chatSummaries:{};
 d.chatSettings=x.chatSettings&&typeof x.chatSettings==='object'&&!Array.isArray(x.chatSettings)?x.chatSettings:{};
 d.proactiveSchedule=x.proactiveSchedule&&typeof x.proactiveSchedule==='object'&&!Array.isArray(x.proactiveSchedule)?x.proactiveSchedule:{};
 for(const [id,cfg] of Object.entries(d.chatSettings))d.chatSettings[id]={background:String(cfg?.background||''),personaId:String(cfg?.personaId||'')};
 d.groups=Array.isArray(x.groups)?x.groups:[];
 d.posts=Array.isArray(x.posts)?x.posts:[];d.notifications=Array.isArray(x.notifications)?x.notifications:[];
 d.worlds=Array.isArray(x.worlds)?x.worlds.map(w=>{const entry={...w,scope:['global','character','group'].includes(w.scope)?w.scope:'global',activation:['persistent','trigger'].includes(w.activation)?w.activation:(w.global||!String(w.trigger||'').trim()?'persistent':'trigger'),targetIds:Array.isArray(w.targetIds)?w.targetIds.map(String):[]};delete entry.priority;delete entry.weight;delete entry.global;return entry}):[];d.memories=Array.isArray(x.memories)?x.memories:[];
 d.homeDesktop=Number(x.settings?.homeLayoutRevision)===2?normalizeHomeDesktop(x.homeDesktop):defaultHomeDesktop();
 d.settings.homeLayoutRevision=2;
 d.engine={...d.engine,...(x.engine||{})};
 d.engine.worldRules=Array.isArray(d.engine.worldRules)?d.engine.worldRules.map(r=>{const rule={...r,activation:['persistent','trigger'].includes(r.activation)?r.activation:(r.global||!String(r.trigger||'').trim()?'persistent':'trigger')};delete rule.priority;delete rule.weight;delete rule.global;return rule}):[];
 d.engine.presetModules=Array.isArray(d.engine.presetModules)?d.engine.presetModules.map(m=>{const module={...m};delete module.priority;delete module.weight;return module}):[];
 d.engine.regexRules=Array.isArray(d.engine.regexRules)?d.engine.regexRules:[];
 d.engine.state={...blank().engine.state,...(d.engine.state||{})};
 return d;
}
function load(){try{
 const raw=localStorage.getItem(STORE)||LEGACY_STORES.map(k=>localStorage.getItem(k)).find(Boolean);
 if(!raw)return blank();
 return normalize(JSON.parse(raw));
}catch(error){startupError=error;return blank()}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch(error){errorDetail(error,'本地存储异常');return false}}
function redactSensitive(value){
 let result=String(value??'');
 for(const profile of Object.values(data?.models||{})){
  const secret=String(profile?.key||'');
  if(secret.length>=4)result=result.split(secret).join('[REDACTED]');
 }
 result=result.replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi,'$1[REDACTED]')
  .replace(/(x-api-key\s*[:=]\s*)[^\s,;]+/gi,'$1[REDACTED]')
  .replace(/([?&]key=)[^&\s]+/gi,'$1[REDACTED]')
  .replace(/("?(?:api[_-]?key|token)"?\s*[:=]\s*"?)[^"\s,}]+/gi,'$1[REDACTED]');
 return result;
}
function errorDetail(error,context='运行错误'){
 const detail=redactSensitive([context,error?.name||'Error',error?.message||String(error),error?.stack||''].filter(Boolean).join('\n\n'));
 console.error(detail);
 modal(`<h2>${esc(context)}</h2><pre class="error-detail">${esc(detail)}</pre><div class="form-actions"><button onclick="copyError()">复制完整报错</button><button class="primary" onclick="closeModal()">关闭</button></div>`);
 window.__lastError=detail;
}
function copyError(){navigator.clipboard?.writeText(window.__lastError||'').then(()=>toast('完整报错已复制')).catch(()=>toast('复制失败'))}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(x){return esc(x).replace(/`/g,'&#96;')}
function time(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
function toast(t){const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove('show'),2200)}
function isInstalledMode(){return window.matchMedia?.('(display-mode: standalone)').matches===true||window.navigator.standalone===true}
function updateInstallStatus(){
 const status=document.getElementById('installAppStatus');if(!status)return;
 if(document.body?.dataset.singleFile==='true'){status.textContent='部署包可安装';return}
 if(isInstalledMode()){status.textContent='已安装 ✓';return}
 if(installRequestState==='accepted'){status.textContent='系统安装中…';return}
 if(installRequestState==='timeout'){status.textContent='系统未完成 ›';return}
 if(deferredInstallPrompt){status.textContent='可以安装 ›';return}
 if(!window.isSecureContext){status.textContent='需要 HTTPS';return}
 if(!('serviceWorker' in navigator)){status.textContent='浏览器不支持';return}
 status.textContent='Chrome 检测中…';
}
function showInstallSystemNotice(){
 modal(`<h2>安装尚未完成</h2><div class="note">Chrome 已接收请求，但没有返回安装完成事件。请关闭这个页面后重新打开，再从 Chrome 菜单选择“安装应用”。</div><div class="form-actions"><button onclick="closeModal()">关闭</button><button class="primary" onclick="location.reload()">重新检测</button></div>`);
}
async function installPWA(){
 if(document.body?.dataset.singleFile==='true')return toast('单文件仅供预览，请使用静态部署包安装');
 if(isInstalledMode())return toast('扑克机已经安装到桌面');
 if(!window.isSecureContext)return toast('安装需要 HTTPS 安全网址');
 if(installRequestState==='accepted'||installRequestState==='timeout')return showInstallSystemNotice();
 if(deferredInstallPrompt){
  const prompt=deferredInstallPrompt;updateInstallStatus();
  try{
   prompt.prompt();
   const choice=await prompt.userChoice;
   deferredInstallPrompt=null;
   if(choice?.outcome==='accepted'){
    installRequestState='accepted';
    toast('已交给 Chrome 安装');
    clearTimeout(installWatchdog);
    installWatchdog=setTimeout(()=>{
     if(!isInstalledMode()&&installRequestState==='accepted'){
      installRequestState='timeout';
      updateInstallStatus();
     }
    },25000);
   }else{
    installRequestState='idle';
    toast('已取消安装');
   }
  }catch(error){errorDetail(error,'桌面安装失败')}
  updateInstallStatus();return;
 }
 const registration=await navigator.serviceWorker?.getRegistration?.();
 modal(`<h2>安装到桌面</h2><div class="note">${registration?.active?'离线服务已经就绪，但 Chrome 尚未发出安装许可。请停留数秒后再点一次，或使用 Chrome 菜单中的“安装应用”。':'离线服务仍在激活，请稍后再点一次。'}</div><div class="form-actions"><button class="primary" onclick="closeModal()">知道了</button></div>`);
}
function applyHomeBackground(){
  const home=document.querySelector('#home .p12-home');
  if(!home)return;
  const bg=data.settings?.homeBackground||'';
  home.style.backgroundImage=bg?`linear-gradient(rgba(7,7,10,.38),rgba(7,7,10,.52)),url("${bg}")`:'';
  home.classList.toggle('has-custom-bg',!!bg);
}
function applyAppearance(){
 applyHomeBackground();
 const icon=data.settings?.appIcon||'./assets/icon-192.png?v=34';
 document.getElementById('appFavicon')?.setAttribute('href',icon);
 document.getElementById('appleTouchIcon')?.setAttribute('href',icon);
 const theme=(data.settings.themes||[]).find(t=>t.id===data.settings.activeTheme);
 if(theme?.vars)Object.entries(theme.vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
 applyDynamicIsland();
 applyHomeAvatar();
 applyCustomFont();
 renderHomeDesktop();
}
function cleanIslandConfig(input=data.settings?.dynamicIsland){
 const fallback=defaultDynamicIsland(),cfg={...fallback,...(input||{})};
 cfg.compactText=String(cfg.compactText||fallback.compactText).slice(0,18);
 cfg.title=String(cfg.title||fallback.title).slice(0,24);
 cfg.subtitle=String(cfg.subtitle||fallback.subtitle).slice(0,36);
 cfg.symbol=Array.from(String(cfg.symbol||fallback.symbol)).slice(0,3).join('');
 cfg.accent=/^#[0-9a-f]{6}$/i.test(String(cfg.accent))?String(cfg.accent):fallback.accent;
 cfg.size=['compact','standard','wide'].includes(cfg.size)?cfg.size:fallback.size;
 return cfg;
}
function applyDynamicIsland(){
 const island=document.getElementById('dynamicIsland');if(!island)return;
 const cfg=cleanIslandConfig();data.settings.dynamicIsland=cfg;
 const enabled=data.settings.dynamicIslandEnabled!==false;
 island.hidden=!enabled;island.dataset.size=cfg.size;island.style.setProperty('--island-accent',cfg.accent);
 document.getElementById('islandCompactText').textContent=cfg.compactText;
 document.getElementById('islandCompactSymbol').textContent=cfg.symbol;
 document.getElementById('islandExpandedSymbol').textContent=cfg.symbol;
 document.getElementById('islandTitle').textContent=cfg.title;
 document.getElementById('islandSubtitle').textContent=cfg.subtitle;
 if(!enabled)collapseDynamicIsland();
}
function collapseDynamicIsland(){
 const island=document.getElementById('dynamicIsland');if(!island)return;
 clearTimeout(islandTimer);island.classList.remove('is-expanded');island.setAttribute('aria-expanded','false');island.setAttribute('aria-label','展开灵动岛');
}
function toggleDynamicIsland(){
 const island=document.getElementById('dynamicIsland');if(!island||island.hidden)return;
 const open=!island.classList.contains('is-expanded');clearTimeout(islandTimer);
 island.classList.toggle('is-expanded',open);island.setAttribute('aria-expanded',String(open));island.setAttribute('aria-label',open?'收起灵动岛':'展开灵动岛');
 if(open)islandTimer=setTimeout(collapseDynamicIsland,5200);
}
function applyChatBackground(){
  const chat=document.getElementById('chat');
  if(!chat)return;
  const bg=currentChat&&data.chatSettings?.[currentChat]?.background||'';
  chat.style.backgroundImage=bg?`linear-gradient(rgba(7,7,10,.38),rgba(7,7,10,.5)),url("${bg}")`:'';
  chat.classList.toggle('has-custom-bg',!!bg);
}
function getChatSettings(id){
  data.chatSettings??={};
  data.chatSettings[id]??={background:'',personaId:''};
  data.chatSettings[id]={background:String(data.chatSettings[id].background||''),personaId:String(data.chatSettings[id].personaId||'')};
  return data.chatSettings[id];
}
const OFFLINE_CHAT_PREFIX='offline__';
function offlineChatId(characterId){return OFFLINE_CHAT_PREFIX+String(characterId||'')}
function chatModeForId(chatId=currentChat){return String(chatId||'').startsWith(OFFLINE_CHAT_PREFIX)?'offline':'online'}
function directCharacterId(chatId=currentChat){const id=String(chatId||'');return id.startsWith(OFFLINE_CHAT_PREFIX)?id.slice(OFFLINE_CHAT_PREFIX.length):id}
function directChatId(characterId,mode='online'){return mode==='offline'?offlineChatId(characterId):String(characterId||'')}
function directCharacterForChat(chatId=currentChat){return data.characters.find(character=>character.id===directCharacterId(chatId))}
function isGroupChatId(chatId=currentChat){return data.groups.some(group=>group.id===chatId)}
function readImageFile(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type.startsWith('image/'))return reject(new Error('image'));
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',.82));
      };
      img.onerror=()=>reject(new Error('image'));
      img.src=reader.result;
    };
    reader.onerror=()=>reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}
function chooseHomeBackground(){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{data.settings.homeBackground=await readImageFile(file);save();applyHomeBackground();toast('主界面背景已更换')}catch(error){errorDetail(error,'主界面背景读取失败')}};
  input.click();
}
function clearHomeBackground(){data.settings.homeBackground='';save();applyHomeBackground();toast('已恢复主界面背景')}
function chooseChatBackground(){
  if(!currentChat)return;
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{getChatSettings(currentChat).background=await readImageFile(file);save();applyChatBackground();toast('聊天背景已更换')}catch(error){errorDetail(error,'聊天背景读取失败')}};
  input.click();
}
function clearChatBackground(){if(!currentChat)return;getChatSettings(currentChat).background='';save();applyChatBackground();toast('已恢复聊天背景')}
function show(id){collapseDynamicIsland();document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active')}
function openView(id){show(id);if(id==='home')applyAppearance();if(id==='engine')engineTab('world');if(id==='chats')renderChats();if(id==='contacts')renderContacts();if(id==='groups')renderGroups();if(id==='feed')renderFeed();if(id==='notifications')renderNotifications();if(id==='world')renderWorld();if(id==='memory')renderMemory();if(id==='settings')loadSettings()}
function unlock(){show('home');clock();applyAppearance();if(data.settings.fullscreenEnabled&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(e=>errorDetail(e,'无法进入全屏'))}
function clock(){const d=new Date(),t=d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),days=['日','一','二','三','四','五','六'];document.getElementById('statusTime').textContent=t;document.getElementById('lockTime').textContent=t;document.getElementById('lockDate').textContent=`${d.getMonth()+1}月${d.getDate()}日 星期${days[d.getDay()]}`;const h=document.getElementById('homeClock');if(h)h.textContent=t;const hl=document.getElementById('homeClockLarge');if(hl)hl.textContent=t;const hd=document.getElementById('homeDate');if(hd)hd.textContent=`${d.getMonth()+1}月${d.getDate()}日 · 星期${days[d.getDay()]}`}
function safeColor(value,fallback='#6e5540'){return /^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):fallback}
function safeImageSrc(value){const s=String(value||'');return /^(?:data:image\/(?:jpeg|png|webp);base64,|\.\/assets\/)/i.test(s)?s:''}
function homeAppIcon(key){return safeImageSrc(data.settings.homeAppIcons?.[key])||HOME_APP_CATALOG[key]?.icon||''}
function applyHomeAvatar(){
 const image=document.getElementById('homeAvatarImage'),fallback=document.getElementById('homeAvatarFallback');if(!image||!fallback)return;
 const src=safeImageSrc(data.settings.homeAvatar);image.src=src;image.hidden=!src;fallback.hidden=!!src;
}
function chooseHomeAvatar(){
 const input=document.createElement('input');input.type='file';input.accept='image/*';
 input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;data.settings.homeAvatar=await readImageFile(file);save();applyHomeAvatar();toast('桌面头像已更换')}catch(error){errorDetail(error,'头像读取失败')}};input.click();
}
async function applyCustomFont(){
 const cfg=data.settings.customFont||{};const root=document.documentElement;root.classList.toggle('font-custom',!!cfg.source);
 if(!cfg.source){root.style.removeProperty('--ui-font');return}
 try{const face=new FontFace('PokejiCustom',`url(${JSON.stringify(cfg.source)})`);await face.load();document.fonts.add(face);root.style.setProperty('--ui-font','PokejiCustom, sans-serif')}catch(error){errorDetail(error,'自定义字体加载失败')}
}
function showFontSettings(){
 const cfg=data.settings.customFont||{};
 modal(`<h2>界面字体</h2><div class="note">可上传本机字体文件，也可填写可跨域访问的字体直链。字体只改变界面，不进入聊天上下文。</div><div class="field"><label>字体直链</label><input id="fontUrl" value="${attr(cfg.source&&!cfg.source.startsWith('data:')?cfg.source:'')}" placeholder="https://.../font.woff2"></div><div class="form-actions"><button onclick="chooseFontFile()">上传字体</button><button onclick="clearCustomFont()">恢复系统字体</button><button class="primary" onclick="saveFontUrl()">应用直链</button></div>`);
}
function chooseFontFile(){
 const input=document.createElement('input');input.type='file';input.accept='.woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf';
 input.onchange=()=>{const file=input.files?.[0];if(!file)return;if(file.size>6*1024*1024)return toast('字体文件请控制在 6MB 内');const reader=new FileReader();reader.onload=()=>{data.settings.customFont={source:String(reader.result),label:file.name};save();closeModal();applyCustomFont();toast('字体已上传并应用')};reader.onerror=()=>errorDetail(reader.error||Error('读取失败'),'字体读取失败');reader.readAsDataURL(file)};input.click();
}
function saveFontUrl(){const source=document.getElementById('fontUrl')?.value.trim();if(!/^https?:\/\//i.test(source||''))return toast('请填写完整的 http/https 字体链接');data.settings.customFont={source,label:'链接字体'};save();closeModal();applyCustomFont();toast('字体链接已应用')}
function clearCustomFont(){data.settings.customFont={source:'',label:''};save();closeModal();applyCustomFont();toast('已恢复系统字体')}
function homeItemMarkup(item){
 const style=`grid-column:${item.x+1}/span ${item.w};grid-row:${item.y+1}/span ${item.h};--widget-color:${safeColor(item.color)}`;
 if(item.kind==='app'){
  const app=HOME_APP_CATALOG[item.app],src=homeAppIcon(item.app);
  const glyphSvg=HOME_GLYPH_SVGS[item.app];
  const icon=src?`<span class="home-app-icon home-app-image"><img src="${attr(src)}" alt=""></span>`:`<span class="home-app-icon home-app-glyph" data-rank="${attr(app.rank||'A')}" data-suit="${attr(app.suit||'♠')}">${glyphSvg?`<svg viewBox="0 0 32 32" aria-hidden="true">${glyphSvg}</svg>`:`<b>${esc(app.glyph)}</b>`}</span>`;
  return `<button class="home-item home-app${homeEditMode?' is-editing':''}" style="${style}" data-home-id="${attr(item.id)}" aria-label="${attr(app.label)}" onpointerdown="homeItemPointerDown(event,'${attr(item.id)}')" onclick="activateHomeItem(event,'${attr(item.id)}')">${icon}<span class="home-app-label">${esc(app.label)}</span><i class="home-edit-badge">×</i></button>`;
 }
 const src=safeImageSrc(item.image),kind=item.widget==='cd'?' home-widget-cd':' home-widget-photo';
 const inner=item.widget==='cd'
  ?`<span class="home-cd-head"><i>♦</i> CD · 01</span><span class="home-record${item.playing?' is-playing':''}">${src?`<img src="${attr(src)}" alt="">`:'<i>♠</i>'}</span><span class="home-cd-foot"><b>Ⅱ</b><small>PLAY</small><em>装饰组件 ◆</em></span>`
  :(src?`<img class="home-photo-image" src="${attr(src)}" alt=""><span class="home-photo-caption">♠ 照片档案 <em>更换图片 +</em></span>`:`<span class="home-photo-empty"><span class="home-photo-code">POKEJI A<br>FILM<br>3 · ♠</span><span class="home-photo-action"><b>♠ 照片档案</b><em>上传图片 +</em></span></span>`);
 return `<button class="home-item home-widget${kind}${homeEditMode?' is-editing':''}" style="${style}" data-home-id="${attr(item.id)}" aria-label="${item.widget==='cd'?'唱片组件':'照片组件'}" onpointerdown="homeItemPointerDown(event,'${attr(item.id)}')" onclick="activateHomeItem(event,'${attr(item.id)}')">${inner}<i class="home-edit-badge">×</i></button>`;
}
function renderHomeDesktop(){
 const pages=document.getElementById('homePages');if(!pages)return;
 data.homeDesktop=normalizeHomeDesktop(data.homeDesktop);homePage=Math.min(homePage,data.homeDesktop.pageCount-1);
 pages.innerHTML=Array.from({length:data.homeDesktop.pageCount},(_,page)=>`<div class="p12-page home-grid-page${page===homePage?' active':''}" data-page="${page}">${homeEditMode?`<span class="home-grid-guide" aria-hidden="true">${'<i></i>'.repeat(16)}</span>`:''}${data.homeDesktop.items.filter(item=>item.page===page).map(homeItemMarkup).join('')}</div>`).join('');
 const dots=document.getElementById('homeDots');if(dots)dots.innerHTML=Array.from({length:data.homeDesktop.pageCount},(_,i)=>`<button type="button" class="${i===homePage?'on':''}" onclick="setHomePage(${i})" aria-label="第 ${i+1} 页"></button>`).join('');
 document.getElementById('homeDesk')?.classList.toggle('home-edit-mode',homeEditMode);
 const toggle=document.getElementById('homeEditToggle');if(toggle)toggle.textContent=homeEditMode?'完成':'开启';
}
function setHomePage(n){homePage=Math.max(0,Math.min(Number(n)||0,(data.homeDesktop?.pageCount||1)-1));renderHomeDesktop()}
function activateHomeItem(event,id){
 if(Date.now()<(window.__homeMovedUntil||0))return;
 const item=data.homeDesktop.items.find(x=>x.id===id);if(!item)return;
 if(homeEditMode){event.preventDefault();editHomeItem(id);return}
 if(item.kind==='app'){const app=HOME_APP_CATALOG[item.app];if(app)openView(app.view);return}
 if(item.widget==='cd'){item.playing=!item.playing;renderHomeDesktop()}
}
function canPlaceHomeItem(page,x,y,w,h,ignoreId=''){
 if(x<0||y<0||x+w>4||y+h>4)return false;
 return !data.homeDesktop.items.some(item=>item.page===page&&item.id!==ignoreId&&x<item.x+item.w&&x+w>item.x&&y<item.y+item.h&&y+h>item.y);
}
function findHomeSlot(page,w,h,ignoreId=''){for(let y=0;y<=4-h;y++)for(let x=0;x<=4-w;x++)if(canPlaceHomeItem(page,x,y,w,h,ignoreId))return{x,y};return null}
function findHomeWidgetSlot(page,ignoreId=''){for(const [x,y] of [[0,0],[2,0],[0,2],[2,2]])if(canPlaceHomeItem(page,x,y,2,2,ignoreId))return{x,y};return null}
function homeItemPointerDown(event,id){
 if(!homeEditMode)return;event.preventDefault();event.stopPropagation();
 const item=data.homeDesktop.items.find(x=>x.id===id),pageEl=event.currentTarget.closest('.home-grid-page');if(!item||!pageEl)return;
 event.currentTarget.setPointerCapture?.(event.pointerId);event.currentTarget.classList.add('is-dragging');
 homePointerDrag={id,page:item.page,startX:event.clientX,startY:event.clientY,pageEl,node:event.currentTarget,moved:false};
 const move=e=>{if(!homePointerDrag)return;if(Math.hypot(e.clientX-homePointerDrag.startX,e.clientY-homePointerDrag.startY)>7){homePointerDrag.moved=true;homePointerDrag.node.style.transform=`translate(${e.clientX-homePointerDrag.startX}px,${e.clientY-homePointerDrag.startY}px) scale(.95)`}};
 const finish=e=>{
  window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);
  const drag=homePointerDrag;homePointerDrag=null;if(!drag)return;drag.node.classList.remove('is-dragging');drag.node.style.transform='';if(!drag.moved)return;
  window.__homeMovedUntil=Date.now()+350;
  const rect=drag.pageEl.getBoundingClientRect(),moving=data.homeDesktop.items.find(v=>v.id===drag.id);if(!moving||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY)){renderHomeDesktop();return}
  let targetPage=drag.page;
  if(e.clientX<=rect.left+24&&drag.page>0)targetPage=drag.page-1;
  if(e.clientX>=rect.right-24&&drag.page<data.homeDesktop.pageCount-1)targetPage=drag.page+1;
  if(targetPage!==drag.page){const slot=moving.kind==='widget'?findHomeWidgetSlot(targetPage,moving.id):findHomeSlot(targetPage,1,1,moving.id);if(!slot){toast('目标页没有合适空位');renderHomeDesktop();return}moving.page=targetPage;moving.x=slot.x;moving.y=slot.y;homePage=targetPage;save();renderHomeDesktop();toast(`已移到第 ${targetPage+1} 页`);return}
  const css=getComputedStyle(drag.pageEl),gapX=parseFloat(css.columnGap)||0,gapY=parseFloat(css.rowGap)||0,padL=parseFloat(css.paddingLeft)||0,padR=parseFloat(css.paddingRight)||0,padT=parseFloat(css.paddingTop)||0,padB=parseFloat(css.paddingBottom)||0;
  const cellW=(rect.width-padL-padR-gapX*3)/4,cellH=(rect.height-padT-padB-gapY*3)/4;
  let x=Math.max(0,Math.min(4-moving.w,Math.floor((e.clientX-rect.left-padL)/(cellW+gapX)))),y=Math.max(0,Math.min(4-moving.h,Math.floor((e.clientY-rect.top-padT)/(cellH+gapY))));
  if(moving.kind==='widget'){x=x<2?0:2;y=y<2?0:2}
  if(x===moving.x&&y===moving.y){renderHomeDesktop();return}
  const overlaps=data.homeDesktop.items.filter(item=>item.page===drag.page&&item.id!==moving.id&&x<item.x+item.w&&x+moving.w>item.x&&y<item.y+item.h&&y+moving.h>item.y);
  const oldX=moving.x,oldY=moving.y;
  if(!overlaps.length){moving.x=x;moving.y=y}
  else if(moving.kind==='app'&&overlaps.length===1&&overlaps[0].kind==='app'){
   moving.x=x;moving.y=y;overlaps[0].x=oldX;overlaps[0].y=oldY;
  }else if(moving.kind==='widget'&&overlaps.length===1&&overlaps[0].kind==='widget'){
   moving.x=x;moving.y=y;overlaps[0].x=oldX;overlaps[0].y=oldY;
  }else if(moving.kind==='widget'&&overlaps.length===4&&overlaps.every(item=>item.kind==='app'&&item.x>=x&&item.x<x+2&&item.y>=y&&item.y<y+2)){
   for(const item of overlaps){item.x=oldX+(item.x-x);item.y=oldY+(item.y-y)}moving.x=x;moving.y=y;
  }else{toast(moving.kind==='widget'?'组件只能与完整四宫格或另一组件换位':'图标只能与其他图标换位');renderHomeDesktop();return}
  save();window.__homeMovedUntil=Date.now()+350;renderHomeDesktop();
 };
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish,{once:true});window.addEventListener('pointercancel',finish,{once:true});
}
function openHomeEditor(){const editor=document.getElementById('homeEditor');if(editor)editor.classList.add('on');const toggle=document.getElementById('homeEditToggle');if(toggle)toggle.textContent=homeEditMode?'完成':'开启'}
function closeHomeEditor(){document.getElementById('homeEditor')?.classList.remove('on')}
function toggleHomeEditMode(){homeEditMode=!homeEditMode;closeHomeEditor();renderHomeDesktop();toast(homeEditMode?'已进入整理模式：拖动图标或组件':'桌面排列已保存')}
function addHomePage(){if(data.homeDesktop.pageCount>=12)return toast('最多 12 页');data.homeDesktop.pageCount++;homePage=data.homeDesktop.pageCount-1;save();closeHomeEditor();renderHomeDesktop();toast('已新增桌面页')}
function removeCurrentHomePage(){if(data.homeDesktop.pageCount<=1)return toast('至少保留一页');if(data.homeDesktop.items.some(x=>x.page===homePage))return toast('请先移走或删除当前页项目');data.homeDesktop.items.forEach(x=>{if(x.page>homePage)x.page--});data.homeDesktop.pageCount--;homePage=Math.max(0,homePage-1);save();renderHomeDesktop();toast('空白页已删除')}
function createHomeWidget(type){
 const w=2,h=2,slot=findHomeWidgetSlot(homePage);if(!slot)return toast('本页没有组件位，请新增页面');
 const id=`widget_${type}_${crypto.randomUUID()}`;data.homeDesktop.items.push({id,kind:'widget',widget:type,page:homePage,x:slot.x,y:slot.y,w,h,color:type==='cd'?'#9c6f57':'#6e5540',image:''});save();closeHomeEditor();renderHomeDesktop();editHomeItem(id);
}
function showWidgetPicker(){modal(`<h2>添加图1尺寸组件</h2><div class="note">组件固定占一个 2×2 区块，创建后可立即上传图片。</div><div class="home-picker"><button onclick="createHomeWidget('photo')"><b>照片组件</b><span>上传自己的图片</span></button><button onclick="createHomeWidget('cd')"><b>CD 组件</b><span>图片作为唱片封面</span></button></div>`)}
function showAppPicker(){const present=new Set(data.homeDesktop.items.filter(x=>x.kind==='app').map(x=>x.app)),missing=Object.entries(HOME_APP_CATALOG).filter(([key])=>!HOME_DOCK_APPS.has(key)&&!present.has(key));modal(`<h2>添加应用</h2>${missing.length?`<div class="home-app-picker">${missing.map(([key,app])=>`<button onclick="addHomeApp('${key}')"><span>${esc(app.glyph)}</span><b>${esc(app.label)}</b></button>`).join('')}</div>`:'<div class="empty">所有桌面功能都已放好</div>'}`)}
function addHomeApp(key){if(!HOME_APP_CATALOG[key]||HOME_DOCK_APPS.has(key))return;if(data.homeDesktop.items.some(item=>item.kind==='app'&&item.app===key))return toast('该功能已在桌面上');let slot=findHomeSlot(homePage,1,1);if(!slot)return toast('本页没有空位');data.homeDesktop.items.push({id:`app_${key}_${crypto.randomUUID()}`,kind:'app',app:key,page:homePage,x:slot.x,y:slot.y,w:1,h:1});save();closeModal();closeHomeEditor();renderHomeDesktop()}
function editHomeItem(id){
 const item=data.homeDesktop.items.find(x=>x.id===id);if(!item)return;
 const title=item.kind==='app'?HOME_APP_CATALOG[item.app].label:(item.widget==='cd'?'唱片组件':'照片组件');
 modal(`<h2>${esc(title)}</h2><div class="note">第 ${item.page+1} 页 · ${item.kind==='widget'?'固定 2×2 组件尺寸':'固定 1×1 图标格'}</div>${item.kind==='widget'?`<div class="field"><label>组件颜色</label><input id="homeItemColor" type="color" value="${safeColor(item.color)}" onchange="setHomeItemColor('${attr(id)}')"></div><div class="form-actions"><button class="primary" onclick="chooseHomeItemImage('${attr(id)}')">上传 / 更换图片</button><button onclick="clearHomeItemImage('${attr(id)}')">清除图片</button></div>`:`<div class="form-actions"><button onclick="chooseHomeAppIcon('${item.app}')">更换图标</button><button onclick="resetHomeAppIcon('${item.app}')">恢复图标</button></div>`}<div class="form-actions"><button onclick="moveHomeItemPage('${attr(id)}',-1)">上一页</button><button onclick="moveHomeItemPage('${attr(id)}',1)">下一页</button><button class="danger" onclick="removeHomeItem('${attr(id)}')">从桌面移除</button></div>`);
}
function setHomeItemColor(id){const item=data.homeDesktop.items.find(x=>x.id===id),input=document.getElementById('homeItemColor');if(!item||!input)return;item.color=safeColor(input.value);save();renderHomeDesktop()}
function chooseHomeItemImage(id){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const item=data.homeDesktop.items.find(x=>x.id===id),file=input.files?.[0];if(!item||!file)return;item.image=await readImageFile(file);save();closeModal();renderHomeDesktop();toast('组件图片已更换')}catch(error){errorDetail(error,'组件图片读取失败')}};input.click()}
function clearHomeItemImage(id){const item=data.homeDesktop.items.find(x=>x.id===id);if(!item||item.kind!=='widget')return;item.image='';save();closeModal();renderHomeDesktop();toast('组件图片已清除')}
function moveHomeItemPage(id,delta){const item=data.homeDesktop.items.find(x=>x.id===id);if(!item)return;const target=item.page+delta;if(target<0)return toast('已经是第一页');if(target>=data.homeDesktop.pageCount)return toast('请先新增一页');const slot=item.kind==='widget'?findHomeWidgetSlot(target,item.id):findHomeSlot(target,1,1,item.id);if(!slot)return toast('目标页没有足够空位');item.page=target;item.x=slot.x;item.y=slot.y;save();closeModal();homePage=target;renderHomeDesktop()}
function removeHomeItem(id){if(!confirm('只从桌面移除这个项目？业务资料不会被删除。'))return;data.homeDesktop.items=data.homeDesktop.items.filter(x=>x.id!==id);save();closeModal();renderHomeDesktop()}
function chooseHomeAppIcon(key){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;data.settings.homeAppIcons[key]=await readImageFile(file);save();closeModal();renderHomeDesktop();toast('桌面图标已更换')}catch(error){errorDetail(error,'桌面图标读取失败')}};input.click()}
function resetHomeAppIcon(key){delete data.settings.homeAppIcons[key];save();closeModal();renderHomeDesktop();toast('已恢复资源包图标')}
function showHomeIconManager(){modal(`<h2>桌面应用图标</h2><div class="note">四张主图标已统一裁切与尺寸；每个桌面应用仍可单独上传。</div><div class="home-icon-manager">${Object.entries(HOME_APP_CATALOG).filter(([key])=>!HOME_DOCK_APPS.has(key)).map(([key,app])=>`<div><b>${esc(app.label)}</b><span><button onclick="chooseHomeAppIcon('${key}')">上传</button><button onclick="resetHomeAppIcon('${key}')">恢复</button></span></div>`).join('')}</div>`)}
function showPageOverview(){modal(`<h2>桌面分页</h2><div class="summary-picker">${Array.from({length:data.homeDesktop.pageCount},(_,i)=>`<button onclick="goHomePage(${i})"><b>第 ${i+1} 页</b><span>${data.homeDesktop.items.filter(item=>item.page===i).length} 项${i===homePage?' · 当前':''}</span></button>`).join('')}</div>`)}
function goHomePage(page){setHomePage(page);closeModal()}
function resetHomeLayout(){if(!confirm('恢复默认两页排列？自定义图标与图片资源仍会保留。'))return;data.homeDesktop=defaultHomeDesktop();homePage=0;homeEditMode=false;save();closeHomeEditor();renderHomeDesktop();toast('默认排列已恢复')}
function initHomeGestures(){const pages=document.getElementById('homePages');if(!pages)return;pages.addEventListener('touchstart',e=>{if(homeEditMode)return;homeTouchX=e.touches[0].clientX;homeTouchY=e.touches[0].clientY},{passive:true});pages.addEventListener('touchend',e=>{if(homeEditMode||!homeTouchX)return;const dx=e.changedTouches[0].clientX-homeTouchX,dy=e.changedTouches[0].clientY-homeTouchY;homeTouchX=0;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.25){window.__homeMovedUntil=Date.now()+350;setHomePage(homePage+(dx<0?1:-1))}},{passive:true})}

setInterval(clock,1000);clock();applyAppearance();initHomeGestures();updateInstallStatus();
if(startupError)setTimeout(()=>errorDetail(startupError,'本地资料读取失败'),0);

/* ---------- boot ---------- */
(function(){
  const boot=document.getElementById('bootScreen');
  if(!boot)return;
  setTimeout(()=>{boot.classList.add('done');setTimeout(()=>{if(boot.parentNode)boot.parentNode.removeChild(boot)},900);},3800);
})();

function avatar(c){const a=document.createElement('div');a.className='avatar';if(c.image){const im=document.createElement('img');im.src=c.image;im.alt='';im.loading='lazy';a.appendChild(im)}return a.outerHTML}

/* ---------- chats & contacts ---------- */
function setChatListMode(mode){chatListMode=mode==='offline'?'offline':'online';renderChats()}
function showCharacterChatEntrances(id){const character=data.characters.find(item=>item.id===id);if(!character)return;modal(`<h2>${esc(character.name)}</h2><div class="note">线上与线下是两套独立记录；线下模式不会混入线上消息。</div><div class="chat-entry-picker"><button onclick="closeModal();openChat('${attr(id)}','online')"><span>◉</span><b>线上消息</b><small>手机消息式交流 · 可主动来信</small></button><button onclick="closeModal();openChat('${attr(id)}','offline')"><span>◇</span><b>线下相遇</b><small>面对面剧情 · 独立情境记录</small></button></div>`)}
function renderChats(){
 const e=document.getElementById('chatList'),q=(document.getElementById('chatSearch')?.value||'').toLowerCase(),mode=chatListMode;
 document.querySelectorAll('#chatModeEntrances button').forEach(button=>button.classList.toggle('on',button.dataset.mode===mode));
 const label=document.getElementById('chatModeCaption');if(label)label.textContent=mode==='offline'?'面对面剧情 · 与线上记录分开':'手机消息式交流 · 支持活人感主动来信';
 const arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q));
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">${mode==='offline'?'◇':'♡'}</div>${q?'没有匹配的角色':'还没有角色<br>请先创建角色。'}</div>`;return}
 e.innerHTML=arr.map(c=>{const chatId=directChatId(c.id,mode),m=(data.chats[chatId]||[]).at(-1),proactive=mode==='online'&&data.settings.proactiveEnabled===true&&c.proactiveEnabled?'<span class="chat-live-badge">主动</span>':'';return `<div class="row card chat-channel-row" onclick="openChat('${attr(c.id)}','${mode}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)} ${proactive}</b><div class="muted">${esc(m?.text||(mode==='offline'?'尚未开始线下剧情':'尚未开始线上聊天'))}</div></div><span class="muted">${esc(m?.time||'')}</span></div>`}).join('');
}

function renderContacts(q=''){
 const e=document.getElementById('contactList'),arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q.toLowerCase()));
 const characterCount=document.getElementById('characterCount'),personaCount=document.getElementById('personaCount');
 if(characterCount)characterCount.textContent=`${data.characters.length} 个角色`;
 if(personaCount)personaCount.textContent=`${data.personas.length} 张面具`;
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">◌</div>${q?'没有匹配的角色':'还没有角色<br>从上方角色设置中心开始创建。'}</div>`;return}
 e.innerHTML=arr.map(c=>`<div class="row card character-list-row" onclick="showCharacterChatEntrances('${c.id}')">${avatar(c)}<div class="character-list-copy"><b>${esc(c.name)}</b><div class="muted">${esc(c.status||c.bio||'尚未填写角色摘要')}</div></div><button class="icon-btn" aria-label="编辑角色" onclick="event.stopPropagation();editCharacter('${c.id}')">⋯</button></div>`).join('')
}

/* ---------- group chat ---------- */
function avatarStack(members){return `<div class="avatar-stack">${members.slice(0,3).map(c=>avatar(c)).join('')}</div>`}
function renderGroups(){
 const e=document.getElementById('groupList');
 if(!data.groups.length){e.innerHTML='<div class="empty"><div class="big">❖</div>还没有群聊<br>至少创建 2 个角色后即可建群。</div>';return}
 e.innerHTML=data.groups.map(g=>{
  const members=g.memberIds.map(id=>data.characters.find(c=>c.id===id)).filter(Boolean);
  const last=(data.chats[g.id]||[]).at(-1);
  let preview=last?last.text:'尚未开始聊天';
  if(last&&last.role==='assistant'){const spk=data.characters.find(c=>c.id===last.speaker);preview=`${spk?spk.name+'：':''}${last.text}`}
  return `<div class="row card" style="margin:0 16px 9px;cursor:pointer" onclick="openChat('${g.id}')">${avatarStack(members)}<div style="flex:1;min-width:0"><b>${esc(g.name)}</b><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px">${esc(preview)}</div></div><span class="muted">${esc(last?.time||'')}</span></div>`;
 }).join('');
}
function newGroup(){
 if(data.characters.length<2)return toast('请先创建至少 2 个角色');
 modal(`<h2>创建群聊</h2><div class="field"><label>群聊名称</label><input id="gn" placeholder="给这个群起个名字"></div><div class="field"><label>选择成员（至少 2 人）</label><div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto">${data.characters.map(c=>`<label style="display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--line);border-radius:11px"><input type="checkbox" class="gmChk" value="${c.id}" style="width:auto">${avatar(c)}<b style="font-size:13px">${esc(c.name)}</b></label>`).join('')}</div></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createGroup()">创建</button></div>`);
}
function createGroup(){
 const name=document.getElementById('gn').value.trim();if(!name)return toast('请填写群聊名称');
 const memberIds=[...document.querySelectorAll('.gmChk:checked')].map(x=>x.value);
 if(memberIds.length<2)return toast('至少选择 2 个角色');
 const id='g_'+crypto.randomUUID();
 data.groups.push({id,name,memberIds,turnIndex:0});
 data.chats[id]=[];getChatSettings(id);save();closeModal();renderGroups();toast('群聊已创建');
}
function editGroup(id){
 const g=data.groups.find(x=>x.id===id);if(!g)return;
 const personaId=getChatSettings(id).personaId||'';
 modal(`<h2>群聊设置</h2><div class="field"><label>群聊名称</label><input id="gn" value="${attr(g.name)}"></div><div class="field"><label>成员</label><div class="muted" style="line-height:1.9">${g.memberIds.map(mid=>data.characters.find(c=>c.id===mid)?.name).filter(Boolean).join('、')||'成员已被删除'}</div></div><div class="field"><label>用户面具</label><select id="groupPersona"><option value="">跟随默认面具</option>${data.personas.map(p=>`<option value="${attr(p.id)}" ${personaId===p.id?'selected':''}>${esc(p.name)}${data.activePersonaId===p.id?' · 默认':''}</option>`).join('')}</select></div><div class="group" style="margin:14px 0"><div class="group-title">聊天外观</div><div class="setting" onclick="chooseChatBackground()"><span>更换聊天背景</span><span class="muted">图片 ›</span></div><div class="setting" onclick="clearChatBackground()"><span>恢复默认聊天背景</span><span class="muted">›</span></div></div><div class="form-actions"><button class="danger" onclick="deleteGroup('${id}')">解散群聊</button><button onclick="clearChat('${id}')">清空聊天</button><button class="primary" onclick="updateGroup('${id}')">保存</button></div>`);
}
function updateGroup(id){const g=data.groups.find(x=>x.id===id);if(!g)return;g.name=document.getElementById('gn').value.trim()||g.name;getChatSettings(id).personaId=document.getElementById('groupPersona')?.value||'';save();closeModal();renderGroups();toast('群聊设置已保存')}
function deleteGroup(id){if(!confirm('解散这个群聊？聊天记录也会被删除。'))return;data.groups=data.groups.filter(g=>g.id!==id);delete data.chats[id];delete data.chatSettings?.[id];if(currentChat===id)currentChat=null;save();closeModal();renderGroups();openView('groups')}
function renderSpeakerPicker(g){
 const el=document.getElementById('speakerPicker');if(!el)return;
 const chips=[`<button class="chip ${groupPendingSpeaker===null?'on':''}" onclick="pickSpeaker(null)">自动轮流</button>`]
  .concat(g.memberIds.map(id=>{const c=data.characters.find(x=>x.id===id);if(!c)return'';return `<button class="chip ${groupPendingSpeaker===id?'on':''}" onclick="pickSpeaker('${id}')">${esc(c.name)}</button>`}));
 el.innerHTML=chips.join('');
}
function pickSpeaker(id){groupPendingSpeaker=id;const g=data.groups.find(x=>x.id===currentChat);if(g)renderSpeakerPicker(g)}
function backFromChat(){openView(isGroupChatId(currentChat)?'groups':'chats')}

function modelProfile(kind='chat'){return data.models?.[kind]||emptyModel()}
function validModel(kind='chat'){const p=modelProfile(kind);return !!(p.base&&p.key&&p.model)}
function validAPI(){return validModel('chat')}
function requireAPI(){if(!validAPI()){toast('请先在设置中配置 API');openView('settings');return false}return true}

/* ---------- character CRUD ---------- */
const CHARACTER_TABS={profile:'档案',personality:'人格',dialogue:'对话',binding:'绑定'};
function newCharacter(){openCharacterEditor(null,'profile','contacts')}
function editCharacter(id,tab='profile',returnView='contacts'){openCharacterEditor(id,tab,returnView)}
function openCharacterEditor(id=null,tab='profile',returnView='contacts'){
 const source=id?data.characters.find(c=>c.id===id):null;if(id&&!source)return;
 characterEditorDraft=normalizeCharacter(source||{id:'c_'+crypto.randomUUID()});
 characterEditorDraft.__new=!source;
 characterEditorDraft.boundPersonaId=source?(getChatSettings(source.id).personaId||data.activePersonaId):data.activePersonaId;
 characterEditorTab=CHARACTER_TABS[tab]?tab:'profile';characterEditorReturn=returnView;
 characterImageDraft='';characterOriginalImage=characterEditorDraft.image||'';
 show('characterEditor');renderCharacterEditor();
}
function closeCharacterEditor(){characterEditorDraft=null;if(characterEditorReturn==='chat'&&currentChat){show('chat');renderMessages();applyChatBackground()}else openView(characterEditorReturn||'contacts')}
function characterField(id){return document.getElementById(id)}
function collectCharacterEditorPage(){
 const d=characterEditorDraft;if(!d)return;
 const take=(key,id)=>{const el=characterField(id);if(el)d[key]=el.value.trim()};
 if(characterEditorTab==='profile'){
  ['name','nickname','status','pronouns','tags'].forEach(k=>take(k,'char_'+k));
  const imageUrl=characterField('char_image_url');
  if(imageUrl){const value=imageUrl.value.trim();if(value)d.image=value;else if(!String(d.image||'').startsWith('data:'))d.image=''}
 }
 if(characterEditorTab==='personality')['bio','personality','background','appearance','speechStyle','relationship'].forEach(k=>take(k,'char_'+k));
 if(characterEditorTab==='dialogue')['scenario','firstMessage','exampleDialogue','systemPrompt','boundaries'].forEach(k=>take(k,'char_'+k));
 if(characterEditorTab==='binding'){const persona=characterField('char_persona'),proactive=characterField('char_proactive');if(persona)d.boundPersonaId=persona.value;if(proactive)d.proactiveEnabled=proactive.checked===true}
}
function setCharacterEditorTab(tab){if(!CHARACTER_TABS[tab])return;collectCharacterEditorPage();characterEditorTab=tab;renderCharacterEditor()}
function characterEditorHero(d){return `<div class="editor-hero"><div class="editor-avatar">${d.image?`<img src="${attr(d.image)}" alt="">`:'<span>♠</span>'}</div><div><small>${d.__new?'NEW CHARACTER':'CHARACTER PROFILE'}</small><h2>${esc(d.name||'未命名角色')}</h2><p>${esc(d.status||'在这里定义完整角色')}</p></div><button onclick="pickCharacterImage()">更换头像</button></div>`}
function characterProfilePage(d){return `<div class="editor-section-title"><span>01</span><div><b>基础档案</b><small>用于列表、聊天标题与身份识别</small></div></div><div class="editor-grid"><div class="field"><label>角色名称 *</label><input id="char_name" value="${attr(d.name)}" placeholder="角色的正式名称"></div><div class="field"><label>昵称 / 称呼</label><input id="char_nickname" value="${attr(d.nickname)}" placeholder="希望被用户怎样称呼"></div><div class="field"><label>状态短句</label><input id="char_status" value="${attr(d.status)}" placeholder="显示在角色列表中"></div><div class="field"><label>代词 / 称谓</label><input id="char_pronouns" value="${attr(d.pronouns)}" placeholder="例如：她 / 他 / TA"></div><div class="field editor-wide"><label>标签</label><input id="char_tags" value="${attr(d.tags)}" placeholder="例如：现代、搭档、慢热"></div><div class="field editor-wide"><label>头像 URL（可选）</label><input id="char_image_url" value="${attr(String(d.image||'').startsWith('data:')?'':d.image)}" placeholder="https://..."></div></div><div class="editor-inline-actions"><button onclick="pickCharacterImage()">上传本机图片</button><button onclick="clearCharacterImage()">移除头像</button></div>`}
function characterPersonalityPage(d){return `<div class="editor-section-title"><span>02</span><div><b>人格与经历</b><small>这些内容会真正进入角色上下文</small></div></div><div class="editor-grid"><div class="field editor-wide"><label>身份概要</label><textarea id="char_bio" placeholder="身份、职业、核心背景">${esc(d.bio)}</textarea></div><div class="field editor-wide"><label>性格</label><textarea id="char_personality" placeholder="稳定特质、偏好、矛盾点">${esc(d.personality)}</textarea></div><div class="field editor-wide"><label>过往经历</label><textarea id="char_background" placeholder="成长、重要事件与已知事实">${esc(d.background)}</textarea></div><div class="field"><label>外貌与气质</label><textarea id="char_appearance">${esc(d.appearance)}</textarea></div><div class="field"><label>说话方式</label><textarea id="char_speechStyle">${esc(d.speechStyle)}</textarea></div><div class="field editor-wide"><label>与用户的关系</label><textarea id="char_relationship" placeholder="初始关系、称呼、相处边界">${esc(d.relationship)}</textarea></div></div>`}
function characterDialoguePage(d){return `<div class="editor-section-title"><span>03</span><div><b>对话行为</b><small>开场、示例和角色专属规则</small></div></div><div class="editor-grid"><div class="field editor-wide"><label>当前情境</label><textarea id="char_scenario" placeholder="对话开始时所在的地点、时间与关系状态">${esc(d.scenario)}</textarea></div><div class="field editor-wide"><label>首条消息</label><textarea id="char_firstMessage" placeholder="新建角色后显示的第一条角色消息">${esc(d.firstMessage)}</textarea></div><div class="field editor-wide"><label>对话示例</label><textarea class="editor-tall" id="char_exampleDialogue" placeholder="用户：…&#10;角色：…">${esc(d.exampleDialogue)}</textarea></div><div class="field editor-wide"><label>角色专属指令</label><textarea class="editor-tall" id="char_systemPrompt" placeholder="只影响这个角色的行为规则">${esc(d.systemPrompt)}</textarea></div><div class="field editor-wide"><label>边界与禁区</label><textarea id="char_boundaries" placeholder="不应代替用户做决定，以及其他边界">${esc(d.boundaries)}</textarea></div></div>`}
function characterBindingPage(d){
 const isNew=d.__new,appearanceChatId=!isNew&&characterEditorReturn==='chat'&&directCharacterId(currentChat)===d.id?currentChat:d.id,settings=isNew?{background:'',personaId:d.boundPersonaId}:getChatSettings(appearanceChatId);
 return `<div class="editor-section-title"><span>04</span><div><b>会话绑定</b><small>为这个角色选择用户身份、主动来信与聊天外观</small></div></div><div class="editor-grid"><div class="field editor-wide"><label>此聊天使用的用户面具</label><select id="char_persona"><option value="">跟随默认面具</option>${data.personas.map(p=>`<option value="${attr(p.id)}" ${(d.boundPersonaId||settings.personaId)===p.id?'selected':''}>${esc(p.name)}${data.activePersonaId===p.id?' · 默认':''}</option>`).join('')}</select></div><label class="editor-toggle editor-wide"><span><b>允许活人感主动来信</b><small>只在“线上消息”中按随机频率主动发消息</small></span><input id="char_proactive" type="checkbox" ${d.proactiveEnabled?'checked':''}></label></div><div class="binding-cards"><button onclick="openPersonaManager('characterEditor')"><span>◈</span><b>管理用户面具</b><small>${data.personas.length} 张可用面具</small></button><button ${isNew?'disabled':''} onclick="chooseCharacterChatBackground()"><span>▧</span><b>聊天背景</b><small>${isNew?'保存角色后可设置':(settings.background?'已设置图片':'使用默认背景')}</small></button><button onclick="exportCharacterCard('${d.id}')"><span>⇩</span><b>导出角色卡</b><small>完整资料与角色绑定世界书</small></button></div>${isNew?'':`<div class="editor-danger-zone"><b>本地会话数据</b><button onclick="clearCharacterConversations('${d.id}')">清空线上与线下</button><button class="danger" onclick="deleteCharacter('${d.id}')">删除角色</button></div>`}`
}
function renderCharacterEditor(){
 const d=characterEditorDraft,body=document.getElementById('characterEditorBody'),title=document.getElementById('characterEditorTitle');if(!d||!body)return;
 if(title)title.textContent=d.__new?'新建角色':'角色设置';
 const pages={profile:characterProfilePage,personality:characterPersonalityPage,dialogue:characterDialoguePage,binding:characterBindingPage};
 body.innerHTML=`${characterEditorHero(d)}<div class="editor-tabs">${Object.entries(CHARACTER_TABS).map(([key,label])=>`<button class="${characterEditorTab===key?'on':''}" onclick="setCharacterEditorTab('${key}')"><span>${label}</span></button>`).join('')}</div><div class="editor-page">${pages[characterEditorTab](d)}</div>`;
}
function saveCharacterEditor(){
 collectCharacterEditorPage();const d=characterEditorDraft;if(!d)return;if(!d.name)return toast('请填写角色名称');
 const isNew=d.__new,id=d.id,boundPersonaId=d.boundPersonaId||'';delete d.__new;delete d.boundPersonaId;
 if(isNew)data.characters.push(normalizeCharacter(d));else{const index=data.characters.findIndex(c=>c.id===id);if(index<0)return;data.characters[index]=normalizeCharacter(d)}
 data.chats[id]??=[];getChatSettings(id).personaId=boundPersonaId;
 if(isNew&&d.firstMessage)data.chats[id].push({role:'assistant',text:d.firstMessage,time:time(),systemGreeting:true});
 if(d.proactiveEnabled)scheduleNextProactive(id,true);else delete data.proactiveSchedule[id];
 save();renderContacts();renderChats();characterEditorDraft=null;toast(isNew?'角色已创建':'角色设置已保存');
 if(characterEditorReturn==='chat'&&!isNew)openChat(id,chatModeForId(currentChat));else openView('contacts');
}
function pickCharacterImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const image=await readImageFile(file);if(characterEditorDraft){characterEditorDraft.image=image;renderCharacterEditor()}else characterImageDraft=image;toast('头像图片已选择，保存后生效')}catch(error){errorDetail(error,'角色头像读取失败')}};input.click()}
function clearCharacterImage(){if(!characterEditorDraft)return;characterEditorDraft.image='';renderCharacterEditor()}
function chooseCharacterChatBackground(){
 const id=characterEditorDraft?.id;if(!id||characterEditorDraft.__new)return toast('请先保存角色');
 const targetId=characterEditorReturn==='chat'&&directCharacterId(currentChat)===id?currentChat:id;
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;getChatSettings(targetId).background=await readImageFile(file);save();renderCharacterEditor();toast('当前入口的聊天背景已更换')}catch(error){errorDetail(error,'聊天背景读取失败')}};input.click();
}
function deleteCharacter(id){if(!confirm('删除角色以及本机保存的线上、线下聊天记录？'))return;const offlineId=offlineChatId(id);data.characters=data.characters.filter(c=>c.id!==id);delete data.chats[id];delete data.chats[offlineId];delete data.chatSettings?.[id];delete data.chatSettings?.[offlineId];delete data.chatSummaries?.[id];delete data.chatSummaries?.[offlineId];delete data.proactiveSchedule?.[id];for(const g of data.groups)g.memberIds=g.memberIds.filter(mid=>mid!==id);if(directCharacterId(currentChat)===id)currentChat=null;save();characterEditorDraft=null;closeModal();renderContacts();renderChats();openView('contacts');toast('角色已删除')}

function exportCharacterCard(id){
 let character=data.characters.find(c=>c.id===id);if(characterEditorDraft?.id===id){collectCharacterEditorPage();character=characterEditorDraft}
 if(!character?.name)return toast('请先填写角色名称');
 const cleanCharacter=normalizeCharacter(character);delete cleanCharacter.id;
 const worldEntries=(data.worlds||[]).filter(w=>w.scope==='character'&&(w.targetIds||[]).includes(id)).map(w=>{const copy={...w};delete copy.id;delete copy.targetIds;delete copy.global;return copy});
 downloadJSON({format:'pokeji-character-card',version:1,exportedAt:new Date().toISOString(),character:cleanCharacter,worldEntries},`pokeji-character-${character.name.replace(/[\\/:*?"<>|]/g,'_')}.json`);toast('角色卡已导出')
}
function importCharacterCard(){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const card=JSON.parse(await file.text());if(card?.format!=='pokeji-character-card'||!card.character||typeof card.character!=='object')throw Error('只支持扑克机角色卡 JSON');const id='c_'+crypto.randomUUID(),character=normalizeCharacter({...card.character,id});if(!character.name)throw Error('角色卡缺少名称');data.characters.push(character);data.chats[id]=character.firstMessage?[{role:'assistant',text:character.firstMessage,time:time(),systemGreeting:true}]:[];getChatSettings(id).personaId='';for(const raw of Array.isArray(card.worldEntries)?card.worldEntries:[]){data.worlds.push({id:'w_'+crypto.randomUUID(),name:String(raw.name||`${character.name}的世界书`),desc:String(raw.desc||''),trigger:String(raw.trigger||''),scope:'character',targetIds:[id],activation:raw.activation==='trigger'?'trigger':'persistent',enabled:raw.enabled!==false})}save();renderContacts();renderChats();toast('角色卡已导入');openCharacterEditor(id,'profile','contacts')}catch(error){errorDetail(error,'角色卡导入失败')}};input.click();
}

/* ---------- user personas ---------- */
function activePersonaFor(chatId=currentChat){const configured=chatId?(getChatSettings(chatId).personaId||(chatModeForId(chatId)==='offline'?getChatSettings(directCharacterId(chatId)).personaId:'')):'';return data.personas.find(p=>p.id===configured)||data.personas.find(p=>p.id===data.activePersonaId)||data.personas[0]||defaultPersona()}
function personaContext(p=activePersonaFor()){return [`名称：${p.name||'我'}`,p.nickname&&`昵称：${p.nickname}`,p.pronouns&&`代词 / 称谓：${p.pronouns}`,p.age&&`年龄或年龄段：${p.age}`,p.identity&&`身份：${p.identity}`,p.description&&`身份描述：${p.description}`,p.personality&&`性格：${p.personality}`,p.background&&`个人经历：${p.background}`,p.appearance&&`外貌与气质：${p.appearance}`,p.likes&&`偏好：${p.likes}`,p.dislikes&&`不喜欢：${p.dislikes}`,p.speechStyle&&`表达习惯：${p.speechStyle}`,p.relationship&&`希望与角色的关系：${p.relationship}`,p.boundaries&&`互动边界：${p.boundaries}`,p.goals&&`当前目标：${p.goals}`,p.notes&&`补充信息：${p.notes}`].filter(Boolean).join('\n')}
function openPersonaManager(returnView='contacts'){if(returnView==='characterEditor')collectCharacterEditorPage();personaManagerReturn=returnView;show('personaManager');renderPersonaManager()}
function closePersonaManager(){if(personaManagerReturn==='characterEditor'&&characterEditorDraft){show('characterEditor');renderCharacterEditor()}else openView(personaManagerReturn||'contacts')}
function renderPersonaManager(){
 const e=document.getElementById('personaManagerBody');if(!e)return;const active=data.personas.find(p=>p.id===data.activePersonaId)||data.personas[0];
 e.innerHTML=`<div class="persona-hero"><small>USER PERSONAS</small><h2>用户面具</h2><p>这里定义聊天中的“你”。身份、人格、经历和互动边界都会进入当前会话的系统上下文，并可按角色或群聊分别绑定。</p><div><b>${esc(active?.name||'我')}</b><span>当前默认 · ${data.personas.length} 张</span></div></div><div class="persona-list">${data.personas.map(p=>{const count=Object.values(data.chatSettings||{}).filter(s=>s?.personaId===p.id).length;return `<article class="persona-card ${p.id===data.activePersonaId?'is-active':''}" onclick="editPersona('${p.id}')">${avatar(p)}<div><b>${esc(p.name)}</b><small>${esc(p.identity||p.description||p.pronouns||'尚未填写详细设定')}</small><em>${count} 个会话绑定</em></div><button onclick="event.stopPropagation();setDefaultPersona('${p.id}')">${p.id===data.activePersonaId?'默认':'设为默认'}</button></article>`}).join('')}</div>`;
}
function newPersona(){openPersonaEditor(null)}
function editPersona(id){openPersonaEditor(id)}
const PERSONA_TABS={identity:'身份',profile:'人格',interaction:'互动'};
function openPersonaEditor(id=null){const source=id?data.personas.find(p=>p.id===id):null;if(id&&!source)return;personaEditorDraft=normalizePersona(source||{id:'persona_'+crypto.randomUUID(),name:''});personaEditorDraft.__new=!source;personaEditorTab='identity';show('personaEditor');renderPersonaEditor()}
function closePersonaEditor(){personaEditorDraft=null;personaEditorTab='identity';show('personaManager');renderPersonaManager()}
function collectPersonaEditorPage(){const d=personaEditorDraft;if(!d)return;const take=key=>{const el=document.getElementById('persona_'+key);if(el)d[key]=el.value.trim()};const fields=personaEditorTab==='identity'?['name','nickname','pronouns','age','identity','description']:personaEditorTab==='profile'?['personality','background','appearance','likes','dislikes']:['speechStyle','relationship','boundaries','goals','notes'];fields.forEach(take);if(personaEditorTab==='identity'){const url=document.getElementById('persona_image_url')?.value.trim();if(url)d.image=url;else if(!String(d.image||'').startsWith('data:'))d.image=''}}
function switchPersonaEditorTab(tab){if(!PERSONA_TABS[tab])return;collectPersonaEditorPage();personaEditorTab=tab;renderPersonaEditor()}
function personaIdentityPage(d){return `<div class="editor-section-title"><span>01</span><div><b>身份档案</b><small>角色眼中的名字、称谓与客观身份</small></div></div><div class="editor-grid"><div class="field"><label>面具名称 *</label><input id="persona_name" value="${attr(d.name)}" placeholder="例如：本名、侦探、旅人"></div><div class="field"><label>昵称</label><input id="persona_nickname" value="${attr(d.nickname)}"></div><div class="field"><label>代词 / 称谓</label><input id="persona_pronouns" value="${attr(d.pronouns)}"></div><div class="field"><label>年龄或年龄段</label><input id="persona_age" value="${attr(d.age)}"></div><div class="field editor-wide"><label>身份 / 职业</label><textarea id="persona_identity" placeholder="职业、阵营、社会身份或在故事中的位置">${esc(d.identity)}</textarea></div><div class="field editor-wide"><label>身份描述</label><textarea id="persona_description" placeholder="希望角色明确知道的客观资料与关系事实">${esc(d.description)}</textarea></div><div class="field editor-wide"><label>头像 URL（可选）</label><input id="persona_image_url" value="${attr(String(d.image||'').startsWith('data:')?'':d.image)}" placeholder="https://..."></div></div><div class="editor-inline-actions"><button onclick="pickPersonaImage()">上传本机图片</button><button onclick="clearPersonaImage()">移除头像</button></div>`}
function personaProfilePage(d){return `<div class="editor-section-title"><span>02</span><div><b>人格与经历</b><small>这些内容只随当前选中的 USER 身份进入会话</small></div></div><div class="editor-grid"><div class="field editor-wide"><label>性格</label><textarea id="persona_personality" placeholder="稳定性格、情绪倾向、矛盾点与处事方式">${esc(d.personality)}</textarea></div><div class="field editor-wide"><label>个人经历</label><textarea id="persona_background" placeholder="成长背景、重要事件、已知事实">${esc(d.background)}</textarea></div><div class="field editor-wide"><label>外貌与气质</label><textarea id="persona_appearance" placeholder="外貌、穿着、气质与显著特征">${esc(d.appearance)}</textarea></div><div class="field"><label>偏好</label><textarea id="persona_likes" placeholder="喜欢的事物与互动方式">${esc(d.likes)}</textarea></div><div class="field"><label>不喜欢</label><textarea id="persona_dislikes" placeholder="反感、雷点或希望避免的内容">${esc(d.dislikes)}</textarea></div></div>`}
function personaInteractionPage(d){return `<div class="editor-section-title"><span>03</span><div><b>互动设定</b><small>定义 USER 如何表达，以及角色应如何理解双方关系</small></div></div><div class="editor-grid"><div class="field editor-wide"><label>表达习惯</label><textarea id="persona_speechStyle" placeholder="语气、措辞、交流节奏与称呼习惯">${esc(d.speechStyle)}</textarea></div><div class="field editor-wide"><label>希望与角色的关系</label><textarea id="persona_relationship" placeholder="关系定位、相处模式和希望角色如何称呼自己">${esc(d.relationship)}</textarea></div><div class="field editor-wide"><label>互动边界</label><textarea id="persona_boundaries" placeholder="角色不能替 USER 说话、行动或决定；也可补充其他边界">${esc(d.boundaries)}</textarea></div><div class="field editor-wide"><label>当前目标</label><textarea id="persona_goals" placeholder="当前想完成的事、长期目标或剧情动机">${esc(d.goals)}</textarea></div><div class="field editor-wide"><label>补充信息</label><textarea id="persona_notes" placeholder="只在使用这张面具的聊天中生效">${esc(d.notes)}</textarea></div></div>`}
function renderPersonaEditor(){const d=personaEditorDraft,e=document.getElementById('personaEditorBody'),title=document.getElementById('personaEditorTitle');if(!d||!e)return;if(title)title.textContent=d.__new?'新建 USER':'USER 设定';const pages={identity:personaIdentityPage,profile:personaProfilePage,interaction:personaInteractionPage};e.innerHTML=`<div class="editor-hero persona-editor-hero"><div class="editor-avatar">${d.image?`<img src="${attr(d.image)}" alt="">`:'<span>◈</span>'}</div><div><small>USER PERSONA</small><h2>${esc(d.name||'新的用户面具')}</h2><p>完整定义聊天中的你，并可按会话单独绑定</p></div><button onclick="pickPersonaImage()">更换头像</button></div><div class="editor-tabs persona-tabs">${Object.entries(PERSONA_TABS).map(([key,label])=>`<button class="${personaEditorTab===key?'on':''}" onclick="switchPersonaEditorTab('${key}')">${label}</button>`).join('')}</div><div class="editor-page">${pages[personaEditorTab](d)}${d.__new?'':`<div class="editor-danger-zone"><b>USER 管理</b><button onclick="setDefaultPersona('${d.id}')">设为默认</button><button class="danger" onclick="deletePersona('${d.id}')">删除面具</button></div>`}</div>`}
function savePersonaEditor(){const d=personaEditorDraft;if(!d)return;collectPersonaEditorPage();if(!d.name)return toast('请填写面具名称');const isNew=d.__new,id=d.id;delete d.__new;if(isNew)data.personas.push(normalizePersona(d));else{const i=data.personas.findIndex(p=>p.id===id);if(i<0)return;data.personas[i]=normalizePersona(d)}if(!data.activePersonaId)data.activePersonaId=id;save();personaEditorDraft=null;personaEditorTab='identity';show('personaManager');renderPersonaManager();toast(isNew?'USER 设定已创建':'USER 设定已保存')}
function pickPersonaImage(){collectPersonaEditorPage();const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;personaEditorDraft.image=await readImageFile(file);renderPersonaEditor();toast('USER 头像已选择')}catch(error){errorDetail(error,'USER 头像读取失败')}};input.click()}
function clearPersonaImage(){if(!personaEditorDraft)return;collectPersonaEditorPage();personaEditorDraft.image='';renderPersonaEditor()}
function setDefaultPersona(id){if(!data.personas.some(p=>p.id===id))return;data.activePersonaId=id;save();if(personaEditorDraft?.id===id)toast('已设为默认用户面具');else{renderPersonaManager();toast('默认用户面具已更新')}}
function deletePersona(id){if(data.personas.length<=1)return toast('至少保留一张用户面具');if(!confirm('删除这张用户面具？已绑定会话将改为跟随默认面具。'))return;data.personas=data.personas.filter(p=>p.id!==id);if(data.activePersonaId===id)data.activePersonaId=data.personas[0].id;for(const cfg of Object.values(data.chatSettings||{}))if(cfg?.personaId===id)cfg.personaId='';save();personaEditorDraft=null;show('personaManager');renderPersonaManager();toast('用户面具已删除')}
function clearChat(id=currentChat){if(!id)return;if(!confirm('清空当前入口的全部聊天记录？'))return;data.chats[id]=[];save();if(currentChat===id)renderMessages();closeModal();renderChats();toast('当前聊天记录已清空')}
function clearCharacterConversations(id){if(!confirm('同时清空这个角色的线上与线下聊天记录？'))return;data.chats[id]=[];data.chats[offlineChatId(id)]=[];delete data.chatSummaries?.[id];delete data.chatSummaries?.[offlineChatId(id)];scheduleNextProactive(id,true);save();closeModal();if(directCharacterId(currentChat)===id)renderMessages();renderChats();toast('线上与线下记录已清空')}

/* ---------- chat: FIXED openChat ---------- */
function openChat(id,mode='online'){
  groupPendingSpeaker=null;
  const g=data.groups.find(x=>x.id===id);
  currentChat=g?id:directChatId(id,mode);
  data.chats[currentChat]??=[];
  const ava=document.getElementById('chatAvatar');
  ava.innerHTML='';
  const sub=document.getElementById('chatSub');
  const picker=document.getElementById('speakerPicker');
  if(g){
   const members=g.memberIds.map(mid=>data.characters.find(x=>x.id===mid)).filter(Boolean);
   if(!members.length)return;
   document.getElementById('chatName').textContent=g.name;
   if(sub)sub.textContent=`群聊 · ${members.length} 人`;
   ava.classList.remove('avatar');ava.classList.add('avatar-stack');
   ava.innerHTML=members.slice(0,3).map(c=>avatar(c)).join('');
   if(picker){picker.style.display='flex';renderSpeakerPicker(g)}
  }else{
   const c=data.characters.find(x=>x.id===id);
   if(!c)return;
   chatListMode=mode==='offline'?'offline':'online';
   document.getElementById('chatName').textContent=c.name;
   if(sub)sub.textContent=mode==='offline'?'线下相遇 · 面对面剧情':'线上消息 · 手机聊天';
   ava.classList.remove('avatar-stack');ava.classList.add('avatar');
   if(c.image){const im=document.createElement('img');im.src=c.image;im.alt='';im.loading='lazy';ava.appendChild(im)}
   if(picker)picker.style.display='none';
  }
  const input=document.getElementById('messageInput');if(input)input.placeholder=g?'发送群聊消息…':(mode==='offline'?'描述你在线下说的话或行动…':'输入线上消息…');
  show('chat');
  applyChatBackground();
  renderMessages();
}
function openChatFromChatId(chatId){
 if(isGroupChatId(chatId))return openChat(chatId);
 const characterId=directCharacterId(chatId);if(data.characters.some(character=>character.id===characterId))openChat(characterId,chatModeForId(chatId));
}

function renderMessages(){
 const e=document.getElementById('messages'),arr=data.chats[currentChat]||[];
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有消息</div>`;return}
 const g=data.groups.find(x=>x.id===currentChat);
 e.innerHTML=arr.map((m,i)=>{
  const speakerName=(g&&m.role==='assistant')?(data.characters.find(c=>c.id===m.speaker)?.name||''):'';
  const label=speakerName||(m.proactive?'主动来信':'');
  return `<div class="msg ${m.role==='user'?'me':''}" data-idx="${i}" oncontextmenu="return showMsgMenu(event,${i})" ontouchstart="touchStartMsg(event,${i})" ontouchend="touchEndMsg(event)"><div>${label?`<div class="msg-speaker">${esc(label)}</div>`:''}<div class="bubble" onclick="showMsgMenu(event,${i})">${esc(m.text)}${m.edited?'<span style="opacity:.4;font-size:8px;margin-left:4px">(已编辑)</span>':''}</div></div><span class="msg-time">${esc(m.time||'')}</span></div>`;
 }).join('');
 const s=e.parentElement;if(s)s.scrollTop=s.scrollHeight}

/* ---------- message menu ---------- */
let msgTouchTimer=null;
function touchStartMsg(e,idx){msgTouchTimer=setTimeout(()=>{showMsgMenu(e,idx)},600)}
function touchEndMsg(e){clearTimeout(msgTouchTimer)}

function showMsgMenu(e,idx){e.preventDefault();e.stopPropagation();msgMenuTarget=idx;
 const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;
 modal(`<h2>消息操作</h2><div class="about-meta" style="margin:0 16px 14px"><div class="meta-row" style="padding:14px;cursor:pointer" onclick="readMessage(${idx})"><span>朗读消息</span><span class="muted">声音模型 ›</span></div><div class="meta-row" style="padding:14px;cursor:pointer" onclick="copyMessage(${idx})"><span>复制文本</span><span class="muted">›</span></div><div class="meta-row" style="padding:14px;cursor:pointer" onclick="editMessage(${idx})"><span>编辑消息</span><span class="muted">›</span></div><div class="meta-row" style="padding:14px;cursor:pointer;color:#cf8488" onclick="deleteMessage(${idx})"><span>删除消息</span><span class="muted">›</span></div></div><div class="form-actions"><button onclick="closeModal()">取消</button></div>`);
 return false}

function copyMessage(idx){const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;navigator.clipboard?.writeText(m.text).then(()=>toast('已复制到剪贴板')).catch(()=>{const ta=document.createElement('textarea');ta.value=m.text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('已复制')});closeModal()}
function editMessage(idx){const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;closeModal();setTimeout(()=>{modal(`<h2>编辑消息</h2><div class="field"><textarea id="editMsgText">${esc(m.text)}</textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveEditMessage(${idx})">保存</button></div>`)},50)}
function saveEditMessage(idx){const text=document.getElementById('editMsgText').value;if(!text.trim())return toast('内容不能为空');const arr=data.chats[currentChat];if(arr&&arr[idx]){arr[idx].text=text.trim();arr[idx].edited=true;save();renderMessages();toast('已编辑')}closeModal()}
function deleteMessage(idx){if(!confirm('删除这条消息？'))return;const arr=data.chats[currentChat];if(arr){arr.splice(idx,1);save();renderMessages();toast('已删除')}closeModal()}

function normalizeSpeechBase(base){
 let value=String(base||'').trim().replace(/\/+$/,'');
 if(/\/audio\/speech$/i.test(value))return value;
 value=value.replace(/\/chat\/completions$/i,'');
 if(/\/v1$/i.test(value))return value+'/audio/speech';
 return value+'/audio/speech';
}
async function readMessage(idx){
 const message=(data.chats[currentChat]||[])[idx];if(!message)return;
 if(!validModel('voice')){closeModal();openView('settings');return toast('请先配置独立的声音模型')}
 const profile=modelProfile('voice');if(profile.provider!=='openai'){closeModal();return errorDetail(Error('当前朗读链路需要 OpenAI 兼容的 /audio/speech 接口；不会占用主聊天模型。'),'声音模型接口不兼容')}
 closeModal();toast('声音模型正在生成语音…');const controller=withTimeout(Number(data.settings.timeout)||60000);
 try{
  const response=await fetch(normalizeSpeechBase(profile.base),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+profile.key},signal:controller.signal,body:JSON.stringify({model:profile.model,input:message.text,voice:profile.voice||'alloy',response_format:'mp3'})});
  if(!response.ok){let detail='';try{detail=await response.text()}catch{}throw Error(`HTTP ${response.status} ${response.statusText}\n${detail}`)}
  const blob=await response.blob();if(!blob.size)throw Error('声音模型返回了空音频');
  const url=URL.createObjectURL(blob),audio=new Audio(url);audio.onended=()=>URL.revokeObjectURL(url);audio.onerror=()=>{URL.revokeObjectURL(url);errorDetail(Error('浏览器无法播放返回的音频'),'语音播放失败')};await audio.play();
 }catch(error){if(error?.name==='AbortError')errorDetail(error,'声音生成超时或已取消');else errorDetail(error,'声音模型调用失败')}
 finally{releaseController(controller)}
}

/* ---------- API : multi-provider (OpenAI / Anthropic Claude / Google Gemini) ---------- */
function normalizeBase(base){let b=String(base||'').trim().replace(/\/+$/, '');if(!b)return '';if(/\/chat\/completions$/i.test(b))return b;return b+'/chat/completions'}
function normalizeAnthropicBase(base){let b=String(base||'').trim().replace(/\/+$/, '');if(!b)return '';if(/\/v1\/messages$/i.test(b))return b;if(/\/v1$/i.test(b))return b+'/messages';return b+'/v1/messages'}
function normalizeGeminiBase(base){let b=String(base||'').trim().replace(/\/+$/, '');return b||'https://generativelanguage.googleapis.com'}
function extractContent(j){const c=j?.choices?.[0]?.message?.content;if(typeof c==='string')return c;if(Array.isArray(c))return c.map(x=>typeof x==='string'?x:x?.text||'').join('');if(typeof j?.output_text==='string')return j.output_text;if(Array.isArray(j?.output))return j.output.flatMap(x=>x?.content||[]).map(x=>x?.text||'').join('');return ''}
function extractAnthropicContent(j){if(Array.isArray(j?.content))return j.content.filter(x=>x?.type==='text').map(x=>x.text||'').join('');return ''}
function extractGeminiContent(j){const parts=j?.candidates?.[0]?.content?.parts;if(Array.isArray(parts))return parts.map(p=>p?.text||'').join('');return ''}
function extractProviderContent(provider,j){if(provider==='anthropic')return extractAnthropicContent(j);if(provider==='gemini')return extractGeminiContent(j);return extractContent(j)}

/* 三家 API 的 Prompt 缓存策略：
   - OpenAI(GPT)：命中前缀自动缓存（≥1024 tokens 自动生效），这里额外传 prompt_cache_key 让同一角色的请求稳定路由到同一缓存分区。
   - Anthropic(Claude)：显式 cache_control，把 system 提示词和"历史消息中除最后一条外"的部分标记为可缓存断点。
   - Google(Gemini)：2.5 系列模型对稳定的 system_instruction + 历史前缀有隐式缓存，这里保持结构稳定以提升命中率。 */
function buildProviderRequest({provider,base,key,model,system,history,temperature,maxTokens,cacheKey,enableCache}){
 const temp=Math.max(0,Number(temperature)||0);
 if(provider==='anthropic'){
  const t=Math.min(1,temp);
  const msgs=history.map((m,i)=>{
   const block={type:'text',text:m.content};
   if(enableCache&&history.length>1&&i===history.length-2)block.cache_control={type:'ephemeral'};
   return {role:m.role==='assistant'?'assistant':'user',content:[block]};
  });
  const sys=enableCache?[{type:'text',text:system,cache_control:{type:'ephemeral'}}]:[{type:'text',text:system}];
  return {
   url:normalizeAnthropicBase(base),
   headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','anthropic-beta':'prompt-caching-2024-07-31'},
   body:{model,system:sys,messages:msgs,temperature:t,max_tokens:Math.max(64,Number(maxTokens)||2048)}
  };
 }
 if(provider==='gemini'){
  const url=`${normalizeGeminiBase(base)}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  return {
   url,
   headers:{'Content-Type':'application/json'},
   body:{
    system_instruction:{parts:[{text:system}]},
    contents:history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),
    generationConfig:{temperature:Math.min(2,temp),maxOutputTokens:Math.max(64,Number(maxTokens)||2048)}
   }
  };
 }
 return {
  url:normalizeBase(base),
  headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
  body:{model,messages:[{role:'system',content:system},...history],temperature:Math.min(2,temp),max_tokens:Math.max(64,Number(maxTokens)||2048),...(enableCache&&cacheKey?{prompt_cache_key:cacheKey}:{})}
 };
}

function withTimeout(ms){
 const c=new AbortController();
 const t=Math.min(180000,Math.max(1000,Number(ms)||60000));
 c.__timer=setTimeout(()=>{try{c.abort()}catch{}},t);
 abortController=c;
 return c;
}
function releaseController(c){if(c?.__timer)clearTimeout(c.__timer);if(abortController===c)abortController=null}
async function syncScreenWakeLock(){
 const shouldHold=data.settings.screenWakeLockEnabled!==false&&busy&&document.visibilityState==='visible'&&'wakeLock' in navigator;
 if(!shouldHold){if(wakeLockSentinel){try{await wakeLockSentinel.release()}catch{}wakeLockSentinel=null}return}
 if(wakeLockSentinel)return;
 try{
  const lock=await navigator.wakeLock.request('screen');wakeLockSentinel=lock;
  lock.addEventListener('release',()=>{if(wakeLockSentinel===lock)wakeLockSentinel=null});
 }catch{}
}
function stopGeneration(){if(abortController){abortController.abort();abortController=null;activeBackgroundTaskId='';busy=false;setBusy(false);toast('已停止生成')}}
function setBusy(v){
 busy=v;
 const btn=document.querySelector('.send');if(btn){btn.disabled=false;btn.textContent=v?'■':'↑';btn.title=v?'停止生成':'发送'}
 const retry=document.getElementById('regenerateBtn');if(retry)retry.disabled=v;
 const input=document.getElementById('messageInput');if(input)input.disabled=v;
 void syncScreenWakeLock();
}

function notificationCapability(){return 'Notification' in window&&'serviceWorker' in navigator&&document.body?.dataset.singleFile!=='true'}
function shouldUseBackgroundNotification(){return data.settings.backgroundNotificationEnabled===true&&notificationCapability()&&Notification.permission==='granted'}
async function ensureBackgroundNotificationPermission(){
 if(!notificationCapability())return false;
 if(Notification.permission==='granted')return true;
 if(Notification.permission==='denied')return false;
 try{return await Notification.requestPermission()==='granted'}catch{return false}
}

async function backgroundWorker(){
 if(document.body?.dataset.singleFile==='true'||!('serviceWorker' in navigator))return null;
 try{
  await navigator.serviceWorker.ready;
  for(let attempt=0;attempt<24;attempt++){
   const registration=await navigator.serviceWorker.getRegistration('/');
   const candidates=[registration?.active,navigator.serviceWorker.controller].filter(Boolean);
   const worker=candidates.find(candidate=>candidate.state==='activated'&&/\/sw-v34\.js(?:$|\?)/.test(candidate.scriptURL||''));
   if(worker)return worker;
   await new Promise(resolve=>setTimeout(resolve,250));
  }
 }catch{}
 return null;
}
async function acknowledgeBackgroundResult(taskId){
 if(!taskId)return;const worker=await backgroundWorker();worker?.postMessage({type:'POKEJI_ACK_BACKGROUND_RESULT',taskId});
}
async function relayProviderRequest(req,{taskId,meta,signal,timeoutMs}){
 const worker=await backgroundWorker();if(!worker)throw Error('后台接力服务尚未就绪，请刷新页面后重试');
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();let settled=false;
  const finish=(fn,value)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',onAbort);try{channel.port1.close()}catch{}fn(value)};
  const onAbort=()=>{worker.postMessage({type:'POKEJI_CANCEL_BACKGROUND_FETCH',taskId});finish(reject,new DOMException('请求已取消','AbortError'))};
  if(signal?.aborted)return onAbort();
  signal?.addEventListener('abort',onAbort,{once:true});
  channel.port1.onmessage=event=>{
   const message=event.data;if(message?.type!=='POKEJI_BACKGROUND_RESULT'||message.taskId!==taskId)return;
   const result=message.result||{};
   if(!result.ok)finish(reject,Error(result.error||`HTTP ${result.status||0} ${result.statusText||''}`));
   else finish(resolve,result);
  };
  channel.port1.onmessageerror=()=>finish(reject,Error('后台接力返回了无法读取的数据'));
  worker.postMessage({type:'POKEJI_BACKGROUND_FETCH',taskId,request:{url:req.url,headers:req.headers,body:JSON.stringify(req.body)},meta,timeoutMs},[channel.port2]);
 });
}
function parseProviderResponse(provider,text){
 let json;try{json=JSON.parse(text)}catch(error){throw Error(`API 返回了无法解析的 JSON：${error.message}`)}
 const output=extractProviderContent(provider,json);if(!output)throw Error(`API 返回为空\n${JSON.stringify(json,null,2)}`);return output;
}
async function invokeModel(kind,{system,history,temperature=0,maxTokens=1024,cacheKey='',signal,background=false,backgroundTaskId='',backgroundMeta=null}={}){
 const p=modelProfile(kind);if(!validModel(kind))throw Error(`${kind} 模型未完整配置`);
 const req=buildProviderRequest({provider:p.provider,base:p.base,key:p.key,model:p.model,system,history,temperature,maxTokens,cacheKey,enableCache:data.settings.promptCache!==false});
 if(background&&data.settings.backgroundRelayEnabled!==false&&document.body?.dataset.singleFile!=='true'){
  const taskId=backgroundTaskId||('bg_'+crypto.randomUUID());
  activeBackgroundTaskId=taskId;
  try{
   const result=await relayProviderRequest(req,{taskId,meta:{...(backgroundMeta||{}),kind,provider:p.provider},signal,timeoutMs:Number(data.settings.timeout)||60000});
   return parseProviderResponse(p.provider,result.text||'');
  }catch(error){if(!/后台接力服务尚未就绪/.test(error?.message||''))throw error;activeBackgroundTaskId=''}
 }
 const res=await fetch(req.url,{method:'POST',headers:req.headers,signal,body:JSON.stringify(req.body)});
 if(!res.ok){let detail='';try{detail=await res.text()}catch{}throw Error(`HTTP ${res.status} ${res.statusText}\n${detail}`)}
 return parseProviderResponse(p.provider,await res.text());
}
async function claimBackgroundResults(){
 if(data.settings.backgroundRelayEnabled===false)return[];const worker=await backgroundWorker();if(!worker)return[];
 return new Promise(resolve=>{
  const channel=new MessageChannel();let done=false;
  const finish=results=>{if(done)return;done=true;clearTimeout(timer);try{channel.port1.close()}catch{}resolve(Array.isArray(results)?results:[])};
  const timer=setTimeout(()=>finish([]),3000);
  channel.port1.onmessage=event=>{if(event.data?.type==='POKEJI_BACKGROUND_RESULTS')finish(event.data.results)};
  channel.port1.onmessageerror=()=>finish([]);
  worker.postMessage({type:'POKEJI_CLAIM_BACKGROUND_RESULTS'},[channel.port2]);
 });
}
async function recoverBackgroundResults(){
 const results=await claimBackgroundResults();if(!results.length)return;
 let changed=false,restored=0,failed=0;
 for(const result of results){
  const taskId=String(result?.taskId||''),meta=result?.meta||{};if(!taskId)continue;
  const duplicate=Object.values(data.chats||{}).some(messages=>Array.isArray(messages)&&messages.some(message=>message.backgroundTaskId===taskId));
  if(duplicate){await acknowledgeBackgroundResult(taskId);continue}
  if(!['chat','proactive'].includes(meta.operation)){await acknowledgeBackgroundResult(taskId);continue}
  const chatId=String(meta.chatId||''),messages=data.chats?.[chatId];
  if(!Array.isArray(messages)){await acknowledgeBackgroundResult(taskId);continue}
  if(!result.ok){data.notifications.unshift({text:`后台回复失败：${String(result.error||result.statusText||'请求未完成').slice(0,120)}`,time:'刚刚',type:'chat'});failed++;changed=true;await acknowledgeBackgroundResult(taskId);continue}
  try{
   const rawReply=parseProviderResponse(meta.provider||'openai',result.text||'');parseState(rawReply);
   const reply=applyRegexPipeline(rawReply,'AI 回复').replace(/<state>[\s\S]*?<\/state>/gi,'').trim();
   const message={role:'assistant',text:reply||rawReply,time:time(),backgroundTaskId:taskId,restoredFromBackground:true,proactive:meta.operation==='proactive'};
   const group=meta.groupId&&data.groups.find(item=>item.id===meta.groupId);
   if(group){message.speaker=meta.speakerId||'';group.turnIndex=(group.turnIndex+1)%Math.max(1,group.memberIds.length)}
   if(meta.operation==='proactive'&&meta.speakerId)scheduleNextProactive(meta.speakerId,true);
   messages.push(message);data.notifications.unshift({text:`${meta.notificationName||'AI'}已在后台完成回复`,time:'刚刚',type:'chat'});restored++;changed=true;
  }catch(error){data.notifications.unshift({text:`后台回复无法恢复：${redactSensitive(error.message||String(error)).slice(0,120)}`,time:'刚刚',type:'chat'});failed++;changed=true}
  await acknowledgeBackgroundResult(taskId);
 }
 if(changed){save();if(currentChat)renderMessages();renderNotifications();renderChats();if(restored)toast(`已恢复 ${restored} 条后台回复`);else if(failed)toast('后台任务未完成，请查看通知')}
}
async function testAPI(showMsg=true){const c=withTimeout(Number(data.settings.timeout)||60000);try{await invokeModel('chat',{system:'You are a connection test.',history:[{role:'user',content:'Reply with OK only.'}],temperature:0,maxTokens:64,signal:c.signal});if(showMsg)toast('主聊天模型连接成功');return true}catch(e){if(showMsg)errorDetail(e,'API 测试失败');return false}finally{releaseController(c)}}

function getRegexFlags(r){let f=r.flags||'g';if(typeof f==='string')return [...new Set(f.replace(/[^dgimsuvy]/g,''))].join('');return 'g'}
function applyRegexPipeline(text,target='AI 回复'){let out=String(text??'');for(const r of (data.engine.regexRules||[]).filter(x=>x.enabled!==false)){if(r.target&&r.target!==target&&r.target!=='全部消息')continue;try{out=out.replace(new RegExp(r.pattern,getRegexFlags(r)),r.replace??'')}catch{}}return out}
function regexPreflight(text){return applyRegexPipeline(text,'用户消息')}
function parseState(raw){const match=String(raw||'').match(/<state>([\s\S]*?)<\/state>/i);if(!match)return;for(const line of match[1].split(/\r?\n/)){const m=line.match(/^\s*([^=:#]+?)\s*[=:]\s*(.*?)\s*$/);if(m)data.engine.state[m[1].trim()]=m[2].trim()}}
function ruleMatches(r,input){if(r.enabled===false)return false;const hay=String(input||'').toLowerCase();const trig=String(r.trigger||'').trim();if(!trig)return true;const st=data.engine.state||{};if(trig.startsWith('/')&&trig.lastIndexOf('/')>0){const k=trig.lastIndexOf('/');try{return new RegExp(trig.slice(1,k),trig.slice(k+1)||'i').test(input)}catch{return false}}const parts=trig.split(/[|,，、]/).map(x=>x.trim().toLowerCase()).filter(Boolean);return parts.some(p=>hay.includes(p)||JSON.stringify(st).toLowerCase().includes(p))}
function template(s,ctx){return String(s??'').replace(/\{\{\s*(world|state|memory|character|message|role|user|persona)\s*\}\}/gi,(_,k)=>ctx[k.toLowerCase()]??'')}
function characterContext(c={}){return [`名称：${c.name||'未命名'}`,c.nickname&&`昵称：${c.nickname}`,c.pronouns&&`称谓：${c.pronouns}`,c.tags&&`标签：${c.tags}`,c.bio&&`身份概要：${c.bio}`,c.personality&&`性格：${c.personality}`,c.background&&`过往经历：${c.background}`,c.appearance&&`外貌与气质：${c.appearance}`,c.speechStyle&&`说话方式：${c.speechStyle}`,c.relationship&&`与用户关系：${c.relationship}`,c.scenario&&`当前情境：${c.scenario}`,c.exampleDialogue&&`对话示例：\n${c.exampleDialogue}`,c.boundaries&&`边界与禁区：${c.boundaries}`,c.systemPrompt&&`角色专属指令：${c.systemPrompt}`].filter(Boolean).join('\n')}
function semanticWorldLayer(item){const scope=item.__engineRule?'global':(item.scope||'global'),activation=item.activation||'persistent',scopeLayer=scope==='group'?4:scope==='character'?2:0;return scopeLayer+(activation==='trigger'?1:0)}
function compileSemanticLayers(items,formatter,limit=10000){
 const prepared=items.map((item,index)=>({item,index,layer:semanticWorldLayer(item),raw:String(formatter(item)||'').trim()})).filter(x=>x.raw);
 const retained=[];let used=0;
 for(const entry of prepared.slice().sort((a,b)=>b.layer-a.layer||a.index-b.index)){const remaining=limit-used;if(remaining<80)break;entry.chunk=entry.raw.length>remaining?entry.raw.slice(0,Math.max(0,remaining-18))+'\n【按上下文预算截断】':entry.raw;retained.push(entry);used+=entry.chunk.length+2;if(entry.raw.length>remaining)break}
 return retained.sort((a,b)=>a.layer-b.layer||a.index-b.index).map(x=>x.chunk).join('\n\n');
}
function compileOrderedModules(items,formatter,limit=10000){const chunks=[];let used=0;for(const item of items){const raw=String(formatter(item)||'').trim();if(!raw)continue;const remaining=limit-used;if(remaining<80)break;const chunk=raw.length>remaining?raw.slice(0,Math.max(0,remaining-18))+'\n【按上下文预算截断】':raw;chunks.push(chunk);used+=chunk.length+2;if(raw.length>remaining)break}return chunks.join('\n\n')}
function worldScopeMatches(w,character,userMessage='',chatId=currentChat){
 if(w.enabled===false)return false;const scope=w.scope||'global',targets=Array.isArray(w.targetIds)?w.targetIds:[],group=data.groups.find(g=>g.id===chatId);
 const inScope=scope==='global'||(scope==='character'&&!!character&&targets.includes(character.id))||(scope==='group'&&!!group&&targets.includes(group.id));
 if(!inScope)return false;if((w.activation||'persistent')==='persistent')return true;return !!String(w.trigger||'').trim()&&ruleMatches(w,userMessage);
}
function worldScopeLabel(w){return w.scope==='character'?'角色绑定':w.scope==='group'?'分组绑定':'全局'}
function buildEngineContext(character,userMessage='',chatId=currentChat){
 const st=data.engine.state||{},persona=activePersonaFor(chatId),charText=characterContext(character),personaText=personaContext(persona);
 const baseTemplate={state:JSON.stringify(st),message:userMessage,character:charText,role:charText,user:personaText,persona:personaText};
 const books=(data.worlds||[]).filter(w=>worldScopeMatches(w,character,userMessage,chatId));
 const rules=(data.engine.worldRules||[]).filter(r=>(r.activation||'persistent')==='persistent'||ruleMatches(r,userMessage)).map(r=>({...r,__engineRule:true}));
 const worldText=compileSemanticLayers([...books,...rules],entry=>entry.__engineRule?`【世界规则：${entry.name}】\n${template(entry.content,baseTemplate)}`:`【世界书：${entry.name}】\n${template(entry.desc||'',baseTemplate)}`,12000);
 const memories=(data.memories||[]).slice(0,30).map(m=>`【记忆:${m.title}】${m.text}`).join('\n');
 const base={world:worldText||'当前没有命中的世界规则。',state:JSON.stringify(st,null,2),memory:memories||'暂无记忆',character:charText,role:charText,user:personaText,persona:personaText,message:userMessage};
 const preset=compileOrderedModules((data.engine.presetModules||[]).filter(m=>m.enabled!==false),m=>`【${m.kind||'自定义'}：${m.name}】\n${template(m.content,base)}`,10000);
 return {...base,preset};
}
function buildSystemPrompt(c,userMessage='',chatId=currentChat){
 const x=buildEngineContext(c,userMessage,chatId);
 return `这是普通的沉浸式角色聊天。应用名称、图标、界面主题和视觉装饰均属于界面元信息，不属于对话上下文，不得据此推断任何剧情、活动、物品或玩法。只根据用户消息、角色资料、USER 设定、世界书、记忆与预设回复。\n当前角色和 USER 身份均完全来自本机资料。\n\n【当前角色】\n${x.character}\n\n【USER 设定】\n${x.persona}\n角色必须把用户理解为该身份，但不得代替用户说话、行动、作决定或补写用户未表达的想法。\n\n【动态世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【执行原则】\n世界书已按全局、角色绑定、分组绑定以及常驻、普通触发完成本地筛选；不属于当前会话的内容不得进入本次请求。预设按用户排列顺序编译。保持角色连续性，不虚构不存在的外部数据。`;
}
function buildOfflineSystemPrompt(c,userMessage='',chatId=currentChat){
 const x=buildEngineContext(c,userMessage,chatId);
 return `这是“线下相遇”入口中的面对面沉浸式剧情。应用界面、手机图标和线上聊天形式均不属于剧情。只根据用户输入、角色资料、USER 设定、世界书、记忆与预设继续现场互动。\n\n【当前角色】\n${x.character}\n\n【USER 设定】\n${x.persona}\n角色必须把用户理解为该身份，但绝不能代替 USER 说话、行动、思考、感受或作决定。\n\n【现场世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【线下表达规则】\n以面对面场景继续，可以描写角色自身的动作、神态、语气与必要环境反馈；角色说话与叙事保持自然连贯。不得把回复写成手机消息提示，不得补写 USER 未表达的行为和内心。`;
}
function buildGroupSystemPrompt(g,activeChar,userMessage=''){
 const x=buildEngineContext(activeChar,userMessage,g.id);
 const roster=g.memberIds.map(id=>data.characters.find(c=>c.id===id)).filter(Boolean).map(m=>`- ${m.name}：${characterContext(m).slice(0,420)}`).join('\n');
 return `这是普通的沉浸式角色群聊“${g.name}”。应用名称、图标、界面主题和视觉装饰均属于界面元信息，不属于对话上下文。所有人物资料均来自本机。\n\n【群聊成员】\n${roster}\n\n本轮只以【${activeChar.name}】的身份回复：只输出该角色本人的发言内容，不替其他角色或 USER 说话、行动或作决定，也不要添加角色名前缀。\n\n【当前发言角色】\n${x.character}\n\n【USER 设定】\n${x.persona}\n角色必须把用户理解为该身份，但不得替 USER 补写未表达的想法、动作或决定。\n\n【动态世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【执行原则】\n世界书已按当前群聊、当前发言角色和触发条件完成本地筛选。保持人物关系与对话连续性，不虚构不存在的外部数据。`;
}

async function refreshConversationSummary(chatId,signal,force=false){
 const keep=Math.max(2,Number(data.settings.summaryKeepTurns)||12),arr=data.chats[chatId]||[];
 if(!force&&data.settings.summaryAutoEnabled===false)return data.chatSummaries[chatId]?.text||'';
 if(!validModel('summary')){if(force)throw Error('记忆摘要工具模型未完整配置');return data.chatSummaries[chatId]?.text||''}
 let cutoff=arr.length-keep*2;if(force&&cutoff<=0)cutoff=arr.length;
 const old=arr.slice(0,cutoff);if(cutoff<=0||!old.length)return data.chatSummaries[chatId]?.text||'';
 const fingerprint=`${old.length}:${old.at(-1)?.time||''}:${old.at(-1)?.text?.slice(-40)||''}`;
 if(data.chatSummaries[chatId]?.fingerprint===fingerprint)return data.chatSummaries[chatId].text;
 const transcript=old.map(m=>`${m.role==='user'?'用户':'AI'}：${m.text}`).join('\n');
 const summary=await invokeModel('summary',{system:'你是独立的对话记忆摘要工具。忠实压缩人物、事实、关系、承诺、偏好、未完成事项与时间线；不续写，不对话。',history:[{role:'user',content:`已有摘要：\n${data.chatSummaries[chatId]?.text||'无'}\n\n待压缩对话：\n${transcript}`}],temperature:0.1,maxTokens:1200,signal});
 data.chatSummaries[chatId]={text:summary.trim(),fingerprint,updatedAt:new Date().toISOString()};save();return summary.trim();
}
function queueConversationSummary(chatId){
 if(data.settings.summaryAutoEnabled===false||!validModel('summary')||summaryTasks.has(chatId))return;
 summaryTasks.add(chatId);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(180000,Math.max(10000,Number(data.settings.timeout)||60000)));
 refreshConversationSummary(chatId,controller.signal).catch(error=>{if(error?.name!=='AbortError')console.warn(redactSensitive(`自动摘要稍后重试：${error?.message||error}`))}).finally(()=>{clearTimeout(timer);summaryTasks.delete(chatId)});
}
async function createNarrativeRandomEvent({chatId,group,activeChar,userMessage,signal}){
 if(data.settings.randomEventsEnabled!==true)return '';
 const chance=Math.min(100,Math.max(0,Number(data.settings.randomEventChance)||0));
 if(chance<=0||Math.random()*100>=chance)return '';
 if(!validModel('random'))throw Error('随机事件已开启，但随机事件模型未完整配置');
 const recent=(data.chats[chatId]||[]).slice(-10).map(m=>`${m.role==='user'?'用户':(data.characters.find(c=>c.id===m.speaker)?.name||activeChar.name)}：${m.text}`).join('\n');
 const engine=buildEngineContext(activeChar,userMessage,chatId);
 const scope=group?`群聊：${group.name}`:`私聊角色：${activeChar.name}`;
 const taskId='random_'+crypto.randomUUID();let event;
 try{
  event=await invokeModel('random',{
   system:'你是独立的角色剧情随机事件工具。只生成一条能自然进入当前情境的偶发事件，不扮演角色、不输出对话、不解释机制、不提及应用界面或品牌。事件必须与角色设定和世界规则兼容，避免强行改写既有事实。只输出事件描述。',
   history:[{role:'user',content:`${scope}\n角色资料：\n${characterContext(activeChar)}\n用户面具：\n${personaContext(activePersonaFor(chatId))}\n当前世界：${engine.world}\n世界状态：${engine.state}\n最近对话：\n${recent||'无'}\n用户刚刚说：${userMessage}`}],
   temperature:1,maxTokens:360,cacheKey:`pokeji_random_${activeChar.id}`,signal,background:true,backgroundTaskId:taskId,backgroundMeta:{operation:'auxiliary',chatId,speakerId:activeChar.id,groupId:group?.id||'',mode:group?'group':chatModeForId(chatId),notificationName:activeChar.name,showNotification:false,startedAt:new Date().toISOString()}
  });
  await acknowledgeBackgroundResult(taskId);
 }catch(error){await acknowledgeBackgroundResult(taskId);throw error}
 finally{if(activeBackgroundTaskId===taskId)activeBackgroundTaskId=''}
 const text=String(event||'').trim().slice(0,1200);if(!text)throw Error('随机事件模型返回为空');
 const events=Array.isArray(data.engine.state.events)?data.engine.state.events:[];
 events.unshift({id:'event_'+crypto.randomUUID(),chatId,characterId:activeChar.id,text,at:new Date().toISOString()});
 data.engine.state.events=events.slice(0,30);save();return text;
}

function proactiveDelayRange(){
 let min=Math.min(1440,Math.max(1,Number(data.settings.proactiveMinMinutes)||60));
 let max=Math.min(1440,Math.max(1,Number(data.settings.proactiveMaxMinutes)||180));
 if(min>max)[min,max]=[max,min];
 return{min,max};
}
function scheduleNextProactive(characterId,reset=false){
 data.proactiveSchedule??={};
 const character=data.characters.find(item=>item.id===characterId);
 if(!character?.proactiveEnabled){delete data.proactiveSchedule[characterId];return false}
 const existing=Number(data.proactiveSchedule[characterId]);
 if(!reset&&Number.isFinite(existing)&&existing>0)return false;
 const {min,max}=proactiveDelayRange(),minutes=min+Math.random()*(max-min);
 data.proactiveSchedule[characterId]=Date.now()+Math.round(minutes*60000);
 return true;
}
function primeProactiveSchedules(reset=false){
 data.proactiveSchedule??={};let changed=false;
 const liveIds=new Set(data.characters.filter(character=>character.proactiveEnabled).map(character=>character.id));
 for(const id of Object.keys(data.proactiveSchedule))if(!liveIds.has(id)){delete data.proactiveSchedule[id];changed=true}
 if(data.settings.proactiveEnabled===true)for(const id of liveIds)changed=scheduleNextProactive(id,reset)||changed;
 return changed;
}
function startProactiveScheduler(){
 clearInterval(proactiveTimer);proactiveTimer=null;
 if(primeProactiveSchedules(false))save();
 proactiveTimer=setInterval(()=>{void checkProactiveMessages()},30000);
 setTimeout(()=>{void checkProactiveMessages()},2200);
}
async function generateProactiveMessage(character){
 if(!character?.proactiveEnabled||proactiveBusy||busy||!validAPI())return;
 const chatId=directChatId(character.id,'online'),s=data.settings;
 data.chats[chatId]??=[];
 proactiveBusy=true;setBusy(true);scheduleNextProactive(character.id,true);save();
 const controller=withTimeout(Number(s.timeout)||60000);let backgroundTaskId='';
 try{
  let system=buildSystemPrompt(character,'',chatId);
  const summary=data.chatSummaries?.[chatId]?.text;if(summary)system+=`\n\n【自动记忆摘要】\n${summary}`;
  system+=`\n\n【主动来信任务】\n现在是角色主动联系 USER 的时机。结合最近对话、人物关系与当前情境，自然发出一条新的线上消息。只输出角色实际发送的消息；不要提及任务、计时器、频率、系统或应用。不要代替 USER 回复。`;
  const history=data.chats[chatId].slice(-Math.max(4,Number(s.maxHistory)||40)).map(message=>({role:message.role==='assistant'?'assistant':'user',content:message.text}));
  history.push({role:'user',content:'【内部触发】请现在以角色身份主动发来一条自然的线上消息。'});
  backgroundTaskId='proactive_'+crypto.randomUUID();
  const rawReply=await invokeModel('chat',{system,history,temperature:s.temperature,maxTokens:s.maxTokens,cacheKey:`pokeji_chat_online_${character.id}`,signal:controller.signal,background:true,backgroundTaskId,backgroundMeta:{operation:'proactive',chatId,speakerId:character.id,groupId:'',mode:'online',notificationName:character.name,showNotification:shouldUseBackgroundNotification(),startedAt:new Date().toISOString()}});
  parseState(rawReply);
  const reply=applyRegexPipeline(rawReply,'AI 回复').replace(/<state>[\s\S]*?<\/state>/gi,'').trim();
  data.chats[chatId].push({role:'assistant',text:reply||rawReply,time:time(),backgroundTaskId,proactive:true});
  data.notifications.unshift({text:`${character.name}主动发来消息`,time:'刚刚',type:'chat'});
  scheduleNextProactive(character.id,true);save();if(currentChat===chatId)renderMessages();renderChats();renderNotifications();
  await acknowledgeBackgroundResult(backgroundTaskId);
 }catch(error){
  if(backgroundTaskId)await acknowledgeBackgroundResult(backgroundTaskId);
  data.notifications.unshift({text:`${character.name}的主动来信未完成：${redactSensitive(error?.message||String(error)).slice(0,100)}`,time:'刚刚',type:'chat'});
  scheduleNextProactive(character.id,true);save();renderNotifications();
  if(error?.name==='AbortError')toast('已停止主动来信生成');
 }finally{
  if(activeBackgroundTaskId===backgroundTaskId)activeBackgroundTaskId='';
  releaseController(controller);proactiveBusy=false;setBusy(false);
 }
}
async function checkProactiveMessages(){
 if(data.settings.proactiveEnabled!==true||proactiveBusy||busy||!validAPI())return;
 if(primeProactiveSchedules(false))save();
 const now=Date.now(),due=data.characters.filter(character=>character.proactiveEnabled&&Number(data.proactiveSchedule?.[character.id])<=now).sort((a,b)=>Number(data.proactiveSchedule[a.id])-Number(data.proactiveSchedule[b.id]))[0];
 if(!due)return;
 const input=document.getElementById('messageInput');
 if(currentChat===due.id&&input?.value.trim()){data.proactiveSchedule[due.id]=Date.now()+5*60000;save();return}
 await generateProactiveMessage(due);
}

async function sendMessage(){
 if(busy){stopGeneration();return}
 if(!validAPI()){toast('API 未配置');openView('settings');return}
 const input=document.getElementById('messageInput'),raw=input.value.trim();if(!raw||!currentChat)return;
 const chatId=currentChat,text=regexPreflight(raw);data.chats[chatId]??=[];data.chats[chatId].push({role:'user',text,time:time()});save();input.value='';renderMessages();setBusy(true);
 const s=data.settings,group=data.groups.find(x=>x.id===chatId),mode=group?'group':chatModeForId(chatId);
 const controller=withTimeout(Number(s.timeout)||60000);
 let backgroundTaskId='';
 try{
  let system,activeChar,notifName;
  if(group){
   const speakerId=groupPendingSpeaker||group.memberIds[group.turnIndex%group.memberIds.length];
   activeChar=data.characters.find(x=>x.id===speakerId);
   if(!activeChar)throw Error('群聊成员数据异常，请检查角色是否已被删除');
   system=buildGroupSystemPrompt(group,activeChar,text);
   notifName=`${group.name} · ${activeChar.name}`;
  }else{
   activeChar=directCharacterForChat(chatId);
   if(!activeChar)throw Error('角色不存在');
   system=mode==='offline'?buildOfflineSystemPrompt(activeChar,text,chatId):buildSystemPrompt(activeChar,text,chatId);
   notifName=activeChar.name;
   if(mode==='online'&&activeChar.proactiveEnabled){scheduleNextProactive(activeChar.id,true);save()}
  }
  const summary=data.chatSummaries?.[chatId]?.text||'';
  if(summary)system+=`\n\n【自动记忆摘要】\n${summary}`;
  try{
   const randomEvent=await createNarrativeRandomEvent({chatId,group,activeChar,userMessage:text,signal:controller.signal});
   if(randomEvent)system+=`\n\n【本轮随机剧情事件｜高优先级】\n${randomEvent}\n请让事件自然进入当前剧情，并保持角色身份与既有连续性。不要说明事件来自工具。`;
  }catch(eventError){
   if(eventError?.name==='AbortError')throw eventError;
   errorDetail(eventError,'随机事件模型异常');
  }
  const history=data.chats[chatId].slice(-Math.max(4,Number(s.maxHistory)||40)).map(m=>{
   if(m.role==='user')return{role:'user',content:m.text};
   if(group){const spk=data.characters.find(x=>x.id===m.speaker);return{role:'assistant',content:`[${spk?spk.name:'角色'}] ${m.text}`}}
   return{role:'assistant',content:m.text};
  });
  backgroundTaskId='chat_'+crypto.randomUUID();
  const rawReply=await invokeModel('chat',{system,history,temperature:s.temperature,maxTokens:s.maxTokens,cacheKey:'pokeji_chat_'+(group?group.id+'_'+activeChar.id:mode+'_'+activeChar.id),signal:controller.signal,background:true,backgroundTaskId,backgroundMeta:{operation:'chat',chatId,speakerId:activeChar.id,groupId:group?.id||'',mode,notificationName:notifName,showNotification:shouldUseBackgroundNotification(),startedAt:new Date().toISOString()}});
  parseState(rawReply);
  const reply=applyRegexPipeline(rawReply,'AI 回复').replace(/<state>[\s\S]*?<\/state>/gi,'').trim();
  const msg={role:'assistant',text:reply||rawReply,time:time(),backgroundTaskId};
  if(group){msg.speaker=activeChar.id;group.turnIndex=(group.turnIndex+1)%group.memberIds.length;groupPendingSpeaker=null;renderSpeakerPicker(group)}
  data.chats[chatId].push(msg);data.notifications.unshift({text:`${notifName}回复了你`,time:'刚刚',type:'chat'});if(!group&&mode==='online'&&activeChar.proactiveEnabled)scheduleNextProactive(activeChar.id,true);save();if(currentChat===chatId)renderMessages();
  await acknowledgeBackgroundResult(backgroundTaskId);
  queueConversationSummary(chatId);
 }catch(err){if(backgroundTaskId)await acknowledgeBackgroundResult(backgroundTaskId);if(err.name==='AbortError'){errorDetail(err,'请求超时或已停止生成');}else{errorDetail(err,'API / 内部异常');}renderMessages()}
 finally{if(activeBackgroundTaskId===backgroundTaskId)activeBackgroundTaskId='';releaseController(controller);setBusy(false)}
}

async function regenerateLast(){
 if(busy||!currentChat)return;const arr=data.chats[currentChat]||[];
 if(arr.at(-1)?.role!=='assistant')return toast('末尾没有可撤回的 AI 回复');
 if(arr.at(-1)?.proactive){const character=directCharacterForChat(currentChat);if(!character?.proactiveEnabled)return toast('请先在角色绑定中允许主动来信');arr.pop();save();renderMessages();await generateProactiveMessage(character);return}
 arr.pop();save();renderMessages();
 const lastUser=[...arr].reverse().find(m=>m.role==='user');if(!lastUser)return toast('缺少用户消息');
 document.getElementById('messageInput').value=lastUser.text;
 const idx=arr.lastIndexOf(lastUser);arr.splice(idx,1);save();await sendMessage();
}

/* ---------- feed ---------- */
function newPost(){if(!data.characters.length)return toast('请先创建角色');modal(`<h2>发布动态</h2><div class="field"><label>发布角色</label><select id="pc">${data.characters.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>动态内容</label><textarea id="pt" placeholder="内容由你填写，不会自动生成。"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createPost()">发布</button></div>`)}
function createPost(){const text=document.getElementById('pt').value.trim();if(!text)return toast('请输入内容');data.posts.unshift({id:'p_'+crypto.randomUUID(),char:document.getElementById('pc').value,text,time:'刚刚',likes:0});save();closeModal();renderFeed()}
function renderFeed(){const e=document.getElementById('feedList');if(!data.posts.length){e.innerHTML='<div class="empty"><div class="big">◌</div>还没有动态</div>';return}e.innerHTML=data.posts.map(p=>{const c=data.characters.find(x=>x.id===p.char);if(!c)return '';return `<article class="feed-card card"><div class="feed-top">${avatar(c)}<div><b>${esc(c.name)}</b><div class="muted">${esc(p.time)}</div></div></div><div class="feed-text">${esc(p.text)}</div><div class="feed-actions"><button onclick="like('${p.id}')">♡ ${p.likes||0}</button></div></article>`}).join('')||'<div class="empty">暂无动态</div>'}
function like(id){const p=data.posts.find(x=>x.id===id);if(!p)return;p.likes=(p.likes||0)+1;save();renderFeed()}
function renderNotifications(){const e=document.getElementById('notificationList');if(!data.notifications.length){e.innerHTML='<div class="empty"><div class="big">◈</div>暂无通知</div>';return}e.innerHTML=data.notifications.map(n=>`<div class="row card" style="margin-bottom:9px"><span>${n.type==='chat'?'♡':'◌'}</span><div style="flex:1">${esc(n.text)}<div class="muted" style="margin-top:3px">${esc(n.time)}</div></div></div>`).join('')}
function clearNotifications(){data.notifications=[];save();renderNotifications();toast('已清空')}

/* ---------- world & memory ---------- */
function worldTargetPicker(scope='global',selected=[]){return `<div class="field world-targets" id="worldCharacterTargets" style="display:${scope==='character'?'block':'none'}"><label>绑定角色（可多选）</label><div class="target-checks">${data.characters.length?data.characters.map(c=>`<label><input class="world-character-target" type="checkbox" value="${attr(c.id)}" ${selected.includes(c.id)?'checked':''}>${esc(c.name)}</label>`).join(''):'<small>还没有角色</small>'}</div></div><div class="field world-targets" id="worldGroupTargets" style="display:${scope==='group'?'block':'none'}"><label>绑定分组（可多选）</label><div class="target-checks">${data.groups.length?data.groups.map(g=>`<label><input class="world-group-target" type="checkbox" value="${attr(g.id)}" ${selected.includes(g.id)?'checked':''}>${esc(g.name)}</label>`).join(''):'<small>还没有群聊分组</small>'}</div></div>`}
function worldEditorFields(w={scope:'global',activation:'persistent',targetIds:[],enabled:true}){return `<div class="field"><label>名称</label><input id="wn" value="${attr(w.name||'')}"></div><div class="field"><label>作用范围</label><select id="ws" onchange="updateWorldEditorVisibility()"><option value="global" ${w.scope==='global'?'selected':''}>全局 · 所有私聊与群聊</option><option value="character" ${w.scope==='character'?'selected':''}>角色绑定 · 指定角色</option><option value="group" ${w.scope==='group'?'selected':''}>分组绑定 · 指定群聊</option></select></div>${worldTargetPicker(w.scope,w.targetIds||[])}<div class="field"><label>激活方式</label><select id="wa" onchange="updateWorldEditorVisibility()"><option value="persistent" ${w.activation!=='trigger'?'selected':''}>常驻 · 对应范围内每轮生效</option><option value="trigger" ${w.activation==='trigger'?'selected':''}>普通 · 命中条件时才生效</option></select></div><div class="field" id="worldTriggerField" style="display:${w.activation==='trigger'?'block':'none'}"><label>触发条件</label><input id="wt" value="${attr(w.trigger||'')}" placeholder="关键词、逗号分隔或 /正则/i"></div><div class="field"><label>内容</label><textarea id="wd" placeholder="支持 {{state}} {{message}} {{character}} {{user}}">${esc(w.desc||'')}</textarea></div>`}
function updateWorldEditorVisibility(){const scope=document.getElementById('ws')?.value,activation=document.getElementById('wa')?.value;const chars=document.getElementById('worldCharacterTargets'),groups=document.getElementById('worldGroupTargets'),trigger=document.getElementById('worldTriggerField');if(chars)chars.style.display=scope==='character'?'block':'none';if(groups)groups.style.display=scope==='group'?'block':'none';if(trigger)trigger.style.display=activation==='trigger'?'block':'none'}
function collectWorldEditor(){const scope=document.getElementById('ws').value,activation=document.getElementById('wa').value,targetSelector=scope==='character'?'.world-character-target:checked':scope==='group'?'.world-group-target:checked':'';return{name:document.getElementById('wn').value.trim(),scope,activation,targetIds:targetSelector?[...document.querySelectorAll(targetSelector)].map(el=>el.value):[],trigger:document.getElementById('wt')?.value.trim()||'',desc:document.getElementById('wd').value}}
function validateWorldEntry(w){if(!w.name){toast('请填写名称');return false}if(w.scope!=='global'&&!w.targetIds.length){toast(w.scope==='character'?'请选择绑定角色':'请选择绑定分组');return false}if(w.activation==='trigger'&&!w.trigger){toast('普通条目需要填写触发条件');return false}return true}
function newWorld(){modal(`<h2>创建世界书条目</h2><div class="note" style="padding:0 16px 14px">范围决定条目能进入哪些会话；常驻每轮进入，普通只有命中条件才进入。</div>${worldEditorFields()}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createWorld()">创建</button></div>`)}
function createWorld(){const w=collectWorldEditor();if(!validateWorldEntry(w))return;data.worlds.push({...w,id:'w_'+crypto.randomUUID(),enabled:true});save();closeModal();renderWorld();toast('世界书条目已创建')}
function worldTargetNames(w){if(w.scope==='character')return (w.targetIds||[]).map(id=>data.characters.find(c=>c.id===id)?.name).filter(Boolean).join('、')||'未绑定角色';if(w.scope==='group')return (w.targetIds||[]).map(id=>data.groups.find(g=>g.id===id)?.name).filter(Boolean).join('、')||'未绑定分组';return '全部会话'}
function renderWorld(){const e=document.getElementById('worldList');if(!data.worlds.length){e.innerHTML='<div class="empty"><div class="big">✦</div>还没有世界书条目</div>';return}e.innerHTML=data.worlds.slice().sort((a,b)=>semanticWorldLayer(a)-semanticWorldLayer(b)).map(w=>`<div class="card world-card" onclick="editWorld('${w.id}')"><div class="module-head"><b>${esc(w.name)}</b><span class="pill">${w.enabled===false?'已停用':'已启用'}</span></div><div class="world-card-meta"><span>${esc(worldScopeLabel(w))}</span><span>${w.activation==='trigger'?'普通触发':'常驻'}</span></div><div class="muted">范围：${esc(worldTargetNames(w))}</div>${w.activation==='trigger'?`<div class="muted">触发：${esc(w.trigger)}</div>`:''}<div class="muted world-card-copy">${esc(w.desc||'')}</div></div>`).join('')}
function editWorld(id){const w=data.worlds.find(x=>x.id===id);if(!w)return;modal(`<h2>编辑世界书条目</h2>${worldEditorFields(w)}<div class="field"><label><input id="we" type="checkbox" style="width:auto" ${w.enabled!==false?'checked':''}> 启用条目</label></div><div class="form-actions"><button class="danger" onclick="deleteWorld('${id}')">删除</button><button class="primary" onclick="updateWorld('${id}')">保存</button></div>`)}
function updateWorld(id){const w=data.worlds.find(x=>x.id===id);if(!w)return;const updated=collectWorldEditor();if(!validateWorldEntry(updated))return;Object.assign(w,updated,{enabled:document.getElementById('we').checked});delete w.global;delete w.priority;delete w.weight;save();closeModal();renderWorld();toast('世界书范围与激活方式已保存')}
function deleteWorld(id){if(!confirm('删除这个世界书条目？'))return;data.worlds=data.worlds.filter(w=>w.id!==id);save();closeModal();renderWorld();toast('已删除')}
function newMemory(){modal(`<h2>保存记忆</h2><div class="field"><label>标题</label><input id="mn"></div><div class="field"><label>内容</label><textarea id="mt"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createMemory()">保存</button></div>`)}
function createMemory(){const n=document.getElementById('mn').value.trim();if(!n)return toast('请填写标题');data.memories.unshift({id:'m_'+crypto.randomUUID(),title:n,text:document.getElementById('mt').value,time:'刚刚'});save();closeModal();renderMemory()}
function chatDisplayName(id){const character=directCharacterForChat(id);if(character)return `${character.name}${chatModeForId(id)==='offline'?' · 线下':' · 线上'}`;const group=data.groups.find(x=>x.id===id);return group?.name||'已删除会话'}
function renderMemory(){
 const e=document.getElementById('memoryList'),summaries=Object.entries(data.chatSummaries||{}).filter(([,value])=>value?.text);
 const summaryHtml=summaries.length?`<div class="group-title" style="margin:4px 0 10px">会话摘要</div>${summaries.map(([id,value])=>`<div class="card" style="padding:15px;margin-bottom:10px" onclick="viewConversationSummary('${attr(id)}')"><div class="module-head"><b>${esc(chatDisplayName(id))}</b><span class="pill">摘要模型</span></div><div class="muted memory-clamp" style="line-height:1.7;margin-top:7px">${esc(value.text)}</div><div class="muted" style="margin-top:7px">${esc(value.updatedAt?new Date(value.updatedAt).toLocaleString('zh-CN'):'')}</div></div>`).join('')}`:'';
 const manualHtml=data.memories.length?`<div class="group-title" style="margin:18px 0 10px">手动记忆</div>${data.memories.map(m=>`<div class="card" style="padding:15px;margin-bottom:10px" onclick="editMemory('${attr(m.id)}')"><b>${esc(m.title)}</b><div class="muted" style="line-height:1.7;margin-top:7px">${esc(m.text)}</div><div class="muted" style="margin-top:7px">${esc(m.time||'')}</div></div>`).join('')}`:'';
 e.innerHTML=summaryHtml+manualHtml||'<div class="empty"><div class="big">⌁</div>还没有保存的记忆或会话摘要</div>';
}
function manualSummaryPicker(){
 const chats=Object.entries(data.chats||{}).filter(([,messages])=>Array.isArray(messages)&&messages.length);
 if(!chats.length)return toast('还没有可摘要的会话');
 modal(`<h2>手动生成摘要</h2><div class="note">使用独立的记忆摘要工具模型，不占用主聊天模型额度。</div><div class="summary-picker">${chats.map(([id,messages])=>`<button onclick="manualSummarizeChat('${attr(id)}')"><b>${esc(chatDisplayName(id))}</b><span>${messages.length} 条消息</span></button>`).join('')}</div>`);
}
async function manualSummarizeChat(id){
 closeModal();const controller=withTimeout(Number(data.settings.timeout)||60000);toast('正在调用记忆摘要工具模型…');
 try{await refreshConversationSummary(id,controller.signal,true);renderMemory();toast('会话摘要已更新')}catch(error){if(error?.name==='AbortError')errorDetail(error,'摘要请求超时或已取消');else errorDetail(error,'手动摘要失败')}finally{releaseController(controller)}
}
function viewConversationSummary(id){const value=data.chatSummaries?.[id];if(!value)return;modal(`<h2>${esc(chatDisplayName(id))}</h2><div class="preview" style="margin:0 16px 14px;max-height:50vh">${esc(value.text)}</div><div class="form-actions"><button class="danger" onclick="deleteConversationSummary('${attr(id)}')">删除摘要</button><button class="primary" onclick="closeModal()">完成</button></div>`)}
function deleteConversationSummary(id){if(!confirm('删除这份会话摘要？原聊天记录不会被删除。'))return;delete data.chatSummaries[id];save();closeModal();renderMemory();toast('摘要已删除')}
function editMemory(id){const memory=data.memories.find(x=>x.id===id);if(!memory)return;modal(`<h2>编辑记忆</h2><div class="field"><label>标题</label><input id="mn" value="${attr(memory.title)}"></div><div class="field"><label>内容</label><textarea id="mt">${esc(memory.text)}</textarea></div><div class="form-actions"><button class="danger" onclick="deleteMemory('${attr(id)}')">删除</button><button class="primary" onclick="updateMemory('${attr(id)}')">保存</button></div>`)}
function updateMemory(id){const memory=data.memories.find(x=>x.id===id);if(!memory)return;memory.title=document.getElementById('mn').value.trim()||memory.title;memory.text=document.getElementById('mt').value;save();closeModal();renderMemory();toast('记忆已保存')}
function deleteMemory(id){if(!confirm('删除这条记忆？'))return;data.memories=data.memories.filter(x=>x.id!==id);save();closeModal();renderMemory();toast('记忆已删除')}

/* ---------- engine ---------- */
function engineTab(tab){['world','preset','regex','preview'].forEach(x=>document.getElementById('tab'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('on',x===tab));const e=document.getElementById('engineBody');if(tab==='world')renderEngineWorld(e);if(tab==='preset')renderEnginePreset(e);if(tab==='regex')renderEngineRegex(e);if(tab==='preview')renderEnginePreview(e)}
function renderEngineWorld(e){const rules=data.engine.worldRules||[],st=data.engine.state||{};e.innerHTML=`<div class="engine-card"><h3>♠ &nbsp;动态世界</h3><p>这里的规则属于全局动态层。常驻规则每轮进入，普通规则只有命中关键词、状态或正则时才进入请求。</p><div class="engine-flow"><div class="flowbox"><b>世界状态</b><span>地点：${esc(st.location||'未设置')}<br>天气：${esc(st.weather||'未设置')}<br>时间：${esc(st.time||'未设置')}</span></div><div class="flowbox"><b>当前规则</b><span>${rules.filter(x=>x.enabled!==false).length} 条</span></div></div><button class="primary" style="margin-top:10px" onclick="newWorldRule()">＋ 新建世界规则</button></div><div class="engine-card"><h3>♠ &nbsp;世界规则</h3>${rules.length?rules.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${r.enabled===false?'停用':(r.activation==='trigger'?'普通触发':'常驻')}</span></div><small>${r.activation==='trigger'?esc(r.trigger||'尚未填写触发条件'):'所有会话每轮生效'}</small><div class="muted" style="margin-top:6px">${esc(r.content||'')}</div><div style="margin-top:9px;display:flex;gap:7px"><button class="icon-btn" onclick="editWorldRule(${i})">⋯</button><button class="icon-btn" onclick="toggleWorldRule(${i})">◉</button></div></div>`).join(''):'<div class="empty">还没有世界规则。</div>'}</div>`}
function engineWorldRuleFields(r={activation:'persistent'}){return `<div class="field"><label>名称</label><input id="erN" value="${attr(r.name||'')}"></div><div class="field"><label>激活方式</label><select id="erA" onchange="updateEngineWorldRuleVisibility()"><option value="persistent" ${r.activation!=='trigger'?'selected':''}>常驻 · 每轮生效</option><option value="trigger" ${r.activation==='trigger'?'selected':''}>普通 · 命中条件时生效</option></select></div><div class="field" id="engineWorldTrigger" style="display:${r.activation==='trigger'?'block':'none'}"><label>触发条件</label><input id="erT" value="${attr(r.trigger||'')}" placeholder="词语、逗号分隔或 /正则/i"></div><div class="field"><label>注入内容</label><textarea id="erC" placeholder="支持 {{state}} {{message}} {{character}} {{user}}">${esc(r.content||'')}</textarea></div>`}
function updateEngineWorldRuleVisibility(){const field=document.getElementById('engineWorldTrigger');if(field)field.style.display=document.getElementById('erA')?.value==='trigger'?'block':'none'}
function newWorldRule(){modal(`<h2>世界规则</h2><div class="note" style="padding:0 16px 14px">选择常驻或普通触发，系统会在发送请求前完成筛选。</div>${engineWorldRuleFields()}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveWorldRule()">保存</button></div>`)}
function saveWorldRule(idx=null){const activation=document.getElementById('erA').value,r={name:document.getElementById('erN').value.trim(),activation,trigger:document.getElementById('erT')?.value.trim()||'',content:document.getElementById('erC').value,enabled:true};if(!r.name)return toast('请填写名称');if(activation==='trigger'&&!r.trigger)return toast('普通规则需要填写触发条件');if(idx===null)data.engine.worldRules.push(r);else data.engine.worldRules[idx]={...data.engine.worldRules[idx],...r};save();closeModal();engineTab('world')}
function editWorldRule(i){const r=data.engine.worldRules[i];modal(`<h2>编辑世界规则</h2>${engineWorldRuleFields(r)}<div class="form-actions"><button class="danger" onclick="data.engine.worldRules.splice(${i},1);save();closeModal();engineTab('world')">删除</button><button class="primary" onclick="saveWorldRule(${i})">保存</button></div>`)}
function toggleWorldRule(i){data.engine.worldRules[i].enabled=data.engine.worldRules[i].enabled===false;save();engineTab('world')}
function renderEnginePreset(e){const ms=data.engine.presetModules||[];e.innerHTML=`<div class="engine-card"><h3>♣ &nbsp;预设编译器</h3><p>启用的模块按这里显示的顺序拼进系统上下文；越靠上越先进入，并在预算不足时先保留。支持 {{world}}、{{state}}、{{memory}}、{{character}}、{{user}}、{{message}}。</p><div class="engine-flow"><div class="flowbox"><b>启用</b><span>排除停用模块</span></div><div class="flowbox"><b>顺序</b><span>按列表实际编译</span></div><div class="flowbox"><b>系统层</b><span>发送最终文本</span></div><div class="flowbox"><b>正则</b><span>前后处理 + 状态</span></div></div><button class="primary" style="margin-top:10px" onclick="newPresetModule()">＋ 新建模块</button></div><div class="engine-card"><h3>♣ &nbsp;模块顺序</h3>${ms.length?ms.map((m,i)=>`<div class="module"><div class="module-head"><b>${esc(m.name)}</b><span class="pill">${m.enabled===false?'停用':'启用'}</span></div><small>${esc(m.kind||'自定义')} · 可用箭头调整真实编译顺序</small><div style="margin-top:7px;color:#777;font-size:11px">${esc(m.content||'')}</div><div style="margin-top:8px;display:flex;gap:6px"><button class="icon-btn" onclick="movePreset(${i},-1)">↑</button><button class="icon-btn" onclick="movePreset(${i},1)">↓</button><button class="icon-btn" onclick="editPreset(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有预设模块。</div>'}</div>`}
function presetFields(m={kind:'身份层'}){return `<div class="field"><label>名称</label><input id="pmN" value="${attr(m.name||'')}"></div><div class="field"><label>类型</label><select id="pmK">${['身份层','世界层','角色层','行为规则','风格层','输出格式','记忆层','动态上下文','自定义'].map(x=>`<option ${x===m.kind?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>内容</label><textarea id="pmC" placeholder="可使用 {{world}} {{state}} {{memory}} {{character}} {{user}} {{message}}">${esc(m.content||'')}</textarea></div>`}
function newPresetModule(){modal(`<h2>预设模块</h2><div class="note" style="padding:0 16px 14px">保存后可在模块列表用上下箭头调整实际编译顺序。</div>${presetFields()}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="savePreset()">保存</button></div>`)}
function savePreset(idx=null){const m={name:document.getElementById('pmN').value.trim(),kind:document.getElementById('pmK').value,content:document.getElementById('pmC').value,enabled:true};if(!m.name)return toast('请填写名称');if(idx===null)data.engine.presetModules.push(m);else data.engine.presetModules[idx]={...data.engine.presetModules[idx],...m};save();closeModal();engineTab('preset')}
function editPreset(i){const m=data.engine.presetModules[i];modal(`<h2>编辑预设模块</h2>${presetFields(m)}<div class="form-actions"><button class="danger" onclick="data.engine.presetModules.splice(${i},1);save();closeModal();engineTab('preset')">删除</button><button class="primary" onclick="savePreset(${i})">保存</button></div>`)}
function movePreset(i,d){const a=data.engine.presetModules,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();engineTab('preset')}
function renderEngineRegex(e){const rs=data.engine.regexRules||[];e.innerHTML=`<div class="engine-card"><h3>♦ &nbsp;正则处理管线</h3><p>规则可以分别作用于用户消息、AI 回复、全部消息或状态解析。AI 回复会先解析状态，再清理展示标签。</p><div class="engine-flow"><div class="flowbox"><b>用户输入</b><span>预处理</span></div><div class="flowbox"><b>API</b><span>上下文编译</span></div><div class="flowbox"><b>AI 输出</b><span>后处理</span></div><div class="flowbox"><b>状态</b><span>反馈世界</span></div></div><button class="primary" style="margin-top:10px" onclick="newRegexRule()">＋ 新建规则</button></div><div class="engine-card"><h3>♦ &nbsp;规则链</h3>${rs.length?rs.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${esc(r.target||'AI 回复')}</span></div><small>${r.enabled===false?'停用':'启用'} · 顺序 ${i+1}</small><div class="muted" style="margin-top:6px">/${esc(r.pattern)}/${esc(r.flags||'g')} → ${esc(r.replace||'')}</div><div style="margin-top:8px"><button class="icon-btn" onclick="editRegex(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有正则规则。</div>'}</div>`}
function newRegexRule(){modal(`<h2>正则规则</h2><div class="field"><label>名称</label><input id="rxN"></div><div class="field"><label>匹配模式</label><input id="rxP" placeholder="例如：<state>([\\s\\S]*?)</state>"></div><div class="field"><label>替换内容</label><input id="rxR"></div><div class="field"><label>处理对象</label><select id="rxT"><option>AI 回复</option><option>用户消息</option><option>全部消息</option><option>状态解析</option></select></div><div class="field"><label>Flags</label><input id="rxG" value="g" placeholder="g / gi / gm / gis"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveRegex()">保存</button></div>`)}
function saveRegex(idx=null){const r={name:document.getElementById('rxN').value.trim(),pattern:document.getElementById('rxP').value,replace:document.getElementById('rxR').value,target:document.getElementById('rxT').value,flags:document.getElementById('rxG').value||'g',enabled:true};if(!r.name||!r.pattern)return toast('名称和匹配模式不能为空');try{new RegExp(r.pattern,getRegexFlags(r))}catch{return toast('正则表达式无效')}if(idx===null)data.engine.regexRules.push(r);else data.engine.regexRules[idx]={...data.engine.regexRules[idx],...r};save();closeModal();engineTab('regex')}
function editRegex(i){const r=data.engine.regexRules[i];modal(`<h2>编辑正则规则</h2><div class="field"><label>名称</label><input id="rxN" value="${attr(r.name)}"></div><div class="field"><label>匹配模式</label><input id="rxP" value="${attr(r.pattern)}"></div><div class="field"><label>替换内容</label><input id="rxR" value="${attr(r.replace||'')}"></div><div class="field"><label>处理对象</label><select id="rxT">${['AI 回复','用户消息','全部消息','状态解析'].map(x=>`<option ${x===r.target?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Flags</label><input id="rxG" value="${attr(r.flags||'g')}"></div><div class="form-actions"><button class="danger" onclick="data.engine.regexRules.splice(${i},1);save();closeModal();engineTab('regex')">删除</button><button class="primary" onclick="saveRegex(${i})">保存</button></div>`)}
function renderEnginePreview(e){const g=currentChat&&data.groups.find(x=>x.id===currentChat),c=g?data.characters.find(x=>x.id===g.memberIds[g.turnIndex%g.memberIds.length]):currentChat&&directCharacterForChat(currentChat);const last=(currentChat&&data.chats[currentChat]?.filter(x=>x.role==='user').at(-1)?.text)||'';const x=c?buildEngineContext(c,last,currentChat):null;const prompt=c?(g?buildGroupSystemPrompt(g,c,last):(chatModeForId(currentChat)==='offline'?buildOfflineSystemPrompt(c,last,currentChat):buildSystemPrompt(c,last,currentChat))):'尚未进入聊天。创建角色并输入消息后，这里会显示本次上下文编译结果。';e.innerHTML=`<div class="engine-card"><h3>♥ &nbsp;上下文预览</h3><p>下面就是发送给 API 的系统内容预览，不会自动发送。</p>${x?`<div class="preview">USER PERSONA\n${esc(x.persona)}\n\nWORLD\n${esc(x.world)}\n\nSTATE\n${esc(x.state)}\n\nMEMORY\n${esc(x.memory)}\n\nPRESET\n${esc(x.preset)}</div>`:''}<div class="preview">${esc(prompt)}</div></div><div class="engine-card"><h3>♥ &nbsp;真实编译闭环</h3><div class="engine-flow"><div class="flowbox"><b>范围</b><span>全局 / 角色 / 分组</span></div><div class="flowbox"><b>激活</b><span>常驻 / 普通触发</span></div><div class="flowbox"><b>系统层</b><span>只发送命中内容</span></div><div class="flowbox"><b>正则</b><span>前后处理</span></div></div><div class="arrow">↻ 状态反馈 → 下一次世界检索</div></div>`}

/* ---------- settings ---------- */
const PROVIDER_HINTS={openai:'例：https://api.openai.com/v1 （或任意 OpenAI 兼容中转地址）',anthropic:'例：https://api.anthropic.com （原生 Claude Messages API）',gemini:'例：https://generativelanguage.googleapis.com （原生 Gemini API）'};
const MODEL_LABELS={chat:'主聊天模型',random:'随机事件模型',voice:'声音模型',vision:'图片识别模型',summary:'记忆摘要工具模型'};
function updateProviderHint(){}
function renderModelProfiles(){const e=document.getElementById('modelProfiles');if(!e)return;e.innerHTML=Object.entries(MODEL_LABELS).map(([k,label])=>{const p=modelProfile(k);return `<div class="setting" onclick="editModelProfile('${k}')"><span><b>${label}</b><small style="display:block">${esc(p.model||'未配置')} · ${esc(p.provider)}</small></span><span class="muted">独立 ›</span></div>`}).join('')}
function editModelProfile(kind){const p=modelProfile(kind);modal(`<h2>${MODEL_LABELS[kind]}</h2><div class="note">此项使用独立 API 配置，不占用其他模型的 Key 或调用链。${kind==='voice'?'朗读使用 OpenAI 兼容 /audio/speech 链路。':''}</div><div class="field"><label>服务商</label><select id="mpProvider">${[['openai','OpenAI 兼容'],['anthropic','Claude 原生'],['gemini','Gemini 原生']].map(([v,n])=>`<option value="${v}" ${p.provider===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>API Base URL</label><input id="mpBase" value="${attr(p.base||'')}"></div><div class="field"><label>API Key</label><input id="mpKey" type="password" value="${attr(p.key||'')}"></div><div class="field"><label>模型</label><input id="mpModel" value="${attr(p.model||'')}"></div>${kind==='voice'?`<div class="field"><label>声音名称 / Voice ID</label><input id="mpVoice" value="${attr(p.voice||'alloy')}" placeholder="alloy"></div>`:''}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveModelProfile('${kind}')">保存</button></div>`)}
function saveModelProfile(kind){data.models[kind]={provider:document.getElementById('mpProvider').value,base:document.getElementById('mpBase').value.trim(),key:document.getElementById('mpKey').value.trim(),model:document.getElementById('mpModel').value.trim(),voice:document.getElementById('mpVoice')?.value.trim()||data.models[kind]?.voice||'alloy'};save();closeModal();renderModelProfiles();toast(`${MODEL_LABELS[kind]}已保存`)}
function loadSettings(){
 applyAppearance();renderModelProfiles();updateInstallStatus();
 ['temperature'].forEach(k=>{const el=document.getElementById(k);if(el)el.value=data.settings[k]??''});
 const mh=document.getElementById('maxHistory');if(mh)mh.value=data.settings.maxHistory??40;
 const sk=document.getElementById('summaryKeepTurns');if(sk)sk.value=data.settings.summaryKeepTurns??12;
 const sa=document.getElementById('summaryAutoEnabled');if(sa)sa.checked=data.settings.summaryAutoEnabled!==false;
 const mt=document.getElementById('maxTokens');if(mt)mt.value=data.settings.maxTokens??2048;
 const to=document.getElementById('timeout');if(to)to.value=Math.round((data.settings.timeout??60000)/1000);
 const pc=document.getElementById('promptCache');if(pc)pc.checked=data.settings.promptCache!==false;
 const br=document.getElementById('backgroundRelayEnabled');if(br){br.checked=data.settings.backgroundRelayEnabled!==false;br.disabled=document.body?.dataset.singleFile==='true'}
 const bn=document.getElementById('backgroundNotificationEnabled');if(bn){bn.checked=data.settings.backgroundNotificationEnabled===true;bn.disabled=!notificationCapability()}
 const wl=document.getElementById('screenWakeLockEnabled');if(wl){wl.checked=data.settings.screenWakeLockEnabled!==false;wl.disabled=!('wakeLock' in navigator)}
 const bs=document.getElementById('backgroundRelayStatus');if(bs)bs.textContent=document.body?.dataset.singleFile==='true'?'部署资源包后启用':'请求中可切到后台';
 const bns=document.getElementById('backgroundNotificationStatus');if(bns)bns.textContent=!notificationCapability()?'当前环境不可用':Notification.permission==='granted'?'通知权限已允许':Notification.permission==='denied'?'通知权限已被拒绝':'开启时会请求通知权限';
 const fs=document.getElementById('fullscreenEnabled');if(fs)fs.checked=data.settings.fullscreenEnabled===true;
 const re=document.getElementById('randomEventsEnabled');if(re)re.checked=data.settings.randomEventsEnabled===true;
 const rc=document.getElementById('randomEventChance');if(rc)rc.value=Math.min(100,Math.max(0,Number(data.settings.randomEventChance)||0));
 const pe=document.getElementById('proactiveEnabled');if(pe)pe.checked=data.settings.proactiveEnabled===true;
 const pmin=document.getElementById('proactiveMinMinutes');if(pmin)pmin.value=proactiveDelayRange().min;
 const pmax=document.getElementById('proactiveMaxMinutes');if(pmax)pmax.value=proactiveDelayRange().max;
 const di=document.getElementById('dynamicIslandEnabled');if(di)di.checked=data.settings.dynamicIslandEnabled!==false;
 const fontLabel=document.getElementById('fontSettingLabel');if(fontLabel)fontLabel.textContent=(data.settings.customFont?.label||'系统字体')+' ›';
}
async function saveSettings(){
 data.settings={...data.settings,
  temperature:document.getElementById('temperature').value||.8,
  maxHistory:Math.min(100,Math.max(4,Number(document.getElementById('maxHistory')?.value)||40)),
  summaryKeepTurns:Math.min(100,Math.max(2,Number(document.getElementById('summaryKeepTurns')?.value)||12)),
  summaryAutoEnabled:document.getElementById('summaryAutoEnabled')?.checked!==false,
  maxTokens:Math.min(32000,Math.max(64,Number(document.getElementById('maxTokens')?.value)||2048)),
  timeout:Math.min(180000,Math.max(10000,(Number(document.getElementById('timeout')?.value)||60)*1000)),
  promptCache:document.getElementById('promptCache')?document.getElementById('promptCache').checked:true
 };
 save();
 if(!validAPI()){toast('已保存本机设置；请完整填写 API 后测试');return}
 await testAPI(true)
}
async function saveRuntimeSettings(){
 const relay=document.getElementById('backgroundRelayEnabled'),wake=document.getElementById('screenWakeLockEnabled'),notification=document.getElementById('backgroundNotificationEnabled');
 if(relay)data.settings.backgroundRelayEnabled=relay.checked===true;
 if(wake)data.settings.screenWakeLockEnabled=wake.checked===true;
 if(notification){
  if(notification.checked){const granted=await ensureBackgroundNotificationPermission();data.settings.backgroundNotificationEnabled=granted;notification.checked=granted;if(!granted)toast('未取得通知权限，后台通知未开启')}
  else data.settings.backgroundNotificationEnabled=false;
 }
 save();void syncScreenWakeLock();loadSettings();toast('后台运行设置已保存');
}
function showBackgroundCapability(){
 modal(`<h2>后台运行能力</h2><div class="note">开启“后台请求接力”后，聊天与主动来信的最终 API 请求会交给 Service Worker，并由 waitUntil 尽力完成。即使页面被系统回收，已完成的结果也会在下次打开时恢复到原会话。<br><br>“生成常驻通知”会在请求期间显示通知，并在完成或失败后更新；它能提高可见性，但浏览器和 Android 仍可终止进程。静音音频不是可靠的后台保活，因此没有使用。需要绝对长期常驻时，仍必须做带 Android 前台服务的原生应用。<br><br>主动来信的定时器在应用仍存活时运行；若系统彻底关闭应用，会在下次打开时检查逾期任务，而不是伪装成精确后台定时。</div><div class="form-actions"><button class="primary" onclick="closeModal()">知道了</button></div>`);
}
function downloadJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportSJ(){const copy=JSON.parse(JSON.stringify(data));for(const p of Object.values(copy.models||{}))delete p.key;downloadJSON({format:'pokeji-data',version:VERSION,exportedAt:new Date().toISOString(),data:copy},'pokeji-data-'+Date.now()+'.json');toast('最终资料已导出（API Key 未包含）')}
function importSJ(ev){const file=ev.target.files?.[0];if(!file)return;file.text().then(txt=>{try{const obj=JSON.parse(txt);if(!['pokeji-data','private-ai-data','pokeji'].includes(obj?.format)||!obj.data)throw Error('这不是扑克机最终资料文件');if(!confirm('最终资料导入会覆盖当前业务数据，继续吗？'))return;const keys=Object.fromEntries(Object.entries(data.models||{}).map(([k,p])=>[k,p.key]));data=normalize(obj.data);Object.entries(keys).forEach(([k,v])=>{if(v)data.models[k].key=v});save();location.reload()}catch(e){errorDetail(e,'资料导入失败')}}).finally(()=>{ev.target.value=''})}
function exportData(){exportSJ()}
function importData(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=ev=>importSJ(ev);i.click()}
function exportThemes(){downloadJSON({format:'pokeji-themes',version:1,themes:data.settings.themes||[]},'pokeji-themes-'+Date.now()+'.json');toast('主题样式已导出')}
function importThemes(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=async()=>{try{const obj=JSON.parse(await i.files[0].text());if(!['pokeji-themes','private-ai-themes'].includes(obj.format)||!Array.isArray(obj.themes))throw Error('这不是扑克机主题文件');const ids=new Set((data.settings.themes||[]).map(t=>t.id));for(const t of obj.themes){const copy={...t,id:ids.has(t.id)?'theme_'+crypto.randomUUID():t.id};data.settings.themes.push(copy);ids.add(copy.id)}save();toast(`已追加 ${obj.themes.length} 个主题`)}catch(e){errorDetail(e,'主题导入失败')}};i.click()}
function addTheme(){modal(`<h2>新增主题</h2><div class="note">新增主题只会追加，不覆盖已有主题。</div><div class="field"><label>主题名称</label><input id="thName"></div><div class="field"><label>强调色</label><input id="thAccent" type="color" value="#c9a35c"></div><div class="field"><label>背景色</label><input id="thBg" type="color" value="#eee9e4"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveTheme()">追加并启用</button></div>`)}
function saveTheme(){const name=document.getElementById('thName').value.trim();if(!name)return toast('请填写主题名称');const t={id:'theme_'+crypto.randomUUID(),name,vars:{'--gold':document.getElementById('thAccent').value,'--paper':document.getElementById('thBg').value}};data.settings.themes.push(t);data.settings.activeTheme=t.id;save();applyAppearance();closeModal();toast('新主题已追加')}
function chooseAppIcon(){const i=document.createElement('input');i.type='file';i.accept='image/png,image/jpeg,image/webp';i.onchange=async()=>{try{data.settings.appIcon=await readImageFile(i.files[0]);save();applyAppearance();toast('应用内图标已更新；已安装 PWA 的系统图标需重新安装应用') }catch(e){errorDetail(e,'图标设置失败')}};i.click()}
function saveRandomEventSettings(){
 data.settings.randomEventsEnabled=document.getElementById('randomEventsEnabled')?.checked===true;
 data.settings.randomEventChance=Math.min(100,Math.max(0,Number(document.getElementById('randomEventChance')?.value)||0));
 save();
}
function saveProactiveSettings(){
 const enabled=document.getElementById('proactiveEnabled')?.checked===true;
 let min=Math.min(1440,Math.max(1,Number(document.getElementById('proactiveMinMinutes')?.value)||60));
 let max=Math.min(1440,Math.max(1,Number(document.getElementById('proactiveMaxMinutes')?.value)||180));
 if(min>max)[min,max]=[max,min];
 data.settings.proactiveEnabled=enabled;data.settings.proactiveMinMinutes=min;data.settings.proactiveMaxMinutes=max;
 if(enabled)primeProactiveSchedules(true);else data.proactiveSchedule={};
 save();startProactiveScheduler();loadSettings();toast(enabled?'主动来信频率已启用':'主动来信已关闭');
}
function editDynamicIsland(){
 const cfg=cleanIslandConfig();
 modal(`<h2>自定义灵动岛</h2><div class="field"><label><input id="diEnabled" type="checkbox" style="width:auto" ${data.settings.dynamicIslandEnabled!==false?'checked':''}> 显示灵动岛</label></div><div class="field"><label>收起文字</label><input id="diCompact" maxlength="18" value="${attr(cfg.compactText)}"></div><div class="field"><label>展开标题</label><input id="diTitle" maxlength="24" value="${attr(cfg.title)}"></div><div class="field"><label>展开副标题</label><input id="diSubtitle" maxlength="36" value="${attr(cfg.subtitle)}"></div><div class="field"><label>符号</label><input id="diSymbol" maxlength="6" value="${attr(cfg.symbol)}"></div><div class="field"><label>强调色</label><input id="diAccent" type="color" value="${attr(cfg.accent)}"></div><div class="field"><label>尺寸</label><select id="diSize"><option value="compact" ${cfg.size==='compact'?'selected':''}>紧凑</option><option value="standard" ${cfg.size==='standard'?'selected':''}>标准</option><option value="wide" ${cfg.size==='wide'?'selected':''}>宽</option></select></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveDynamicIsland()">保存</button></div>`);
}
function saveDynamicIsland(){
 const fallback=defaultDynamicIsland();
 data.settings.dynamicIslandEnabled=document.getElementById('diEnabled')?.checked!==false;
 data.settings.dynamicIsland=cleanIslandConfig({
  compactText:document.getElementById('diCompact')?.value.trim()||fallback.compactText,
  title:document.getElementById('diTitle')?.value.trim()||fallback.title,
  subtitle:document.getElementById('diSubtitle')?.value.trim()||fallback.subtitle,
  symbol:document.getElementById('diSymbol')?.value.trim()||fallback.symbol,
  accent:document.getElementById('diAccent')?.value||fallback.accent,
  size:document.getElementById('diSize')?.value||fallback.size
 });
 save();applyDynamicIsland();closeModal();loadSettings();toast('灵动岛已更新');
}
async function saveAppearanceSettings(){
 const fullscreen=document.getElementById('fullscreenEnabled'),island=document.getElementById('dynamicIslandEnabled');
 if(fullscreen)data.settings.fullscreenEnabled=fullscreen.checked===true;
 if(island)data.settings.dynamicIslandEnabled=island.checked===true;
 save();applyDynamicIsland();
 if(data.settings.fullscreenEnabled&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen()}catch(e){errorDetail(e,'无法进入全屏')}}else if(!data.settings.fullscreenEnabled&&document.fullscreenElement){try{await document.exitFullscreen()}catch(e){errorDetail(e,'无法退出全屏')}}
}
async function checkForUpdates(){
 if(document.body?.dataset.singleFile==='true')return toast('单文件是预览版，请部署 V34 资源包更新');
 if(!('serviceWorker' in navigator))return toast('当前浏览器不支持离线更新');
 toast('正在检查更新…');
 try{
  let registration=await navigator.serviceWorker.getRegistration();
  if(!registration)registration=await navigator.serviceWorker.register('/sw-v34.js',{scope:'/',updateViaCache:'none'});
  await registration.update();
  if(registration.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});toast('发现更新，正在应用…')}
  else toast('已完成更新检查');
 }catch(error){errorDetail(error,'检查更新失败')}
}
function resetData(){if(confirm('确定清空本机全部数据吗？此操作不可恢复。')){[STORE,...LEGACY_STORES].forEach(k=>localStorage.removeItem(k));location.reload()}}
function chatInfo(){const g=data.groups.find(x=>x.id===currentChat);if(g)return editGroup(g.id);const c=directCharacterForChat(currentChat);if(!c)return;editCharacter(c.id,'profile','chat')}

/* ---------- about ---------- */
function about(){
  modal(`
    <div class="about-sheet">
      <div class="about-icon">♠</div>
      <div class="about-title">扑克机</div>
      <div class="about-version">Version ${VERSION}</div>
      <div class="about-divider"></div>
      <div class="about-desc">
        <p>API 驱动的虚拟手机式 AI 空间。</p>
        <p>没有内置角色，没有内置聊天，没有预设 AI 内容。角色、聊天、世界、记忆、预设与正则均属于本机数据。</p>
      </div>
      <div class="about-meta">
        <div class="meta-row"><span>数据格式版本</span><span>V${VERSION}</span></div>
        <div class="meta-row"><span>存储引擎</span><span>localStorage</span></div>
        <div class="meta-row"><span>渲染引擎</span><span>Vanilla JS</span></div>
        <div class="meta-row"><span>界面风格</span><span>Noir Maison</span></div>
      </div>
      <div class="form-actions" style="margin-top:18px">
        <button class="primary" style="width:100%" onclick="closeModal()">完成</button>
      </div>
    </div>
  `);
}

function modal(x){document.getElementById('modalContent').innerHTML=x;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;installRequestState='idle';clearTimeout(installWatchdog);updateInstallStatus()});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;installRequestState='installed';clearTimeout(installWatchdog);updateInstallStatus();toast('扑克机已安装到桌面')});
window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',updateInstallStatus);
document.addEventListener('visibilitychange',()=>{void syncScreenWakeLock();void checkProactiveMessages();if(document.visibilityState==='visible'&&!busy)void recoverBackgroundResults()});
window.addEventListener('beforeunload',()=>{if(busy&&abortController&&!activeBackgroundTaskId)abortController.abort()});
window.addEventListener('error',e=>{if(e.error)errorDetail(e.error,'未捕获的内部异常')});
window.addEventListener('unhandledrejection',e=>errorDetail(e.reason instanceof Error?e.reason:Error(String(e.reason)),'未处理的异步异常'));
startProactiveScheduler();
