/* =========================================================
   扑克机 · V29 ENGINE CORE
   API-only / local-first / no built-in characters
   ========================================================= */
const STORE='pokeji_api_only_v29';
const LEGACY_STORES=['pokeji_api_only_v28','pokeji_api_only_v27','pokeji_api_only_v26','pokeji_api_only_v25','pokeji_api_only_v24','pokeji_api_only_v23','pokeji_api_only_v22','pokeji_api_only_v21','pokeji_api_only_v20','pokeji_api_only_v19','pokeji_api_only_v18','private_ai_space_v18','pokeji_api_only_v4','pokeji_api_only_v3'];
const VERSION=29;
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
let msgMenuTarget=null;
let homePage=0, homeTouchX=0,homeTouchY=0,homeEditMode=false,homePointerDrag=null;
let groupPendingSpeaker=null;
let islandTimer=null;
let characterImageDraft='';
let characterOriginalImage='';

function emptyModel(){return{provider:'openai',base:'',key:'',model:'',weight:100,voice:'alloy'}}
function defaultDynamicIsland(){return{compactText:'POKEJI',title:'扑克机',subtitle:'私人空间',symbol:'♠',accent:'#eeda9f',size:'standard'}}
function blank(){return{
 settings:{apiProvider:'openai',apiBase:'',apiKey:'',apiModel:'',temperature:.8,maxHistory:40,summaryKeepTurns:12,summaryAutoEnabled:true,timeout:60000,maxTokens:2048,promptCache:true,fullscreenEnabled:false,randomEventsEnabled:false,randomEventChance:15,dynamicIslandEnabled:true,dynamicIsland:defaultDynamicIsland(),appIcon:'',homeAvatar:'',homeAppIcons:{},homeLayoutRevision:2,customFont:{source:'',label:''},themes:[],activeTheme:''},
 models:{chat:emptyModel(),random:emptyModel(),voice:emptyModel(),vision:emptyModel(),summary:emptyModel()},
 characters:[],chats:{},chatSettings:{},chatSummaries:{},groups:[],posts:[],notifications:[],worlds:[],memories:[],
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
 for(const k of Object.keys(d.models))d.models[k]={...emptyModel(),...(d.models[k]||{})};
 if(!d.models.chat.base&&d.settings.apiBase)d.models.chat={provider:d.settings.apiProvider||'openai',base:d.settings.apiBase||'',key:d.settings.apiKey||'',model:d.settings.apiModel||'',weight:100};
 d.characters=Array.isArray(x.characters)?x.characters:[];
 d.chats=x.chats&&typeof x.chats==='object'&&!Array.isArray(x.chats)?x.chats:{};
 d.chatSummaries=x.chatSummaries&&typeof x.chatSummaries==='object'?x.chatSummaries:{};
 d.chatSettings=x.chatSettings&&typeof x.chatSettings==='object'&&!Array.isArray(x.chatSettings)?x.chatSettings:{};
 d.groups=Array.isArray(x.groups)?x.groups:[];
 d.posts=Array.isArray(x.posts)?x.posts:[];d.notifications=Array.isArray(x.notifications)?x.notifications:[];
 d.worlds=Array.isArray(x.worlds)?x.worlds:[];d.memories=Array.isArray(x.memories)?x.memories:[];
 d.homeDesktop=Number(x.settings?.homeLayoutRevision)===2?normalizeHomeDesktop(x.homeDesktop):defaultHomeDesktop();
 d.settings.homeLayoutRevision=2;
 d.engine={...d.engine,...(x.engine||{})};
 d.engine.worldRules=Array.isArray(d.engine.worldRules)?d.engine.worldRules:[];
 d.engine.presetModules=Array.isArray(d.engine.presetModules)?d.engine.presetModules:[];
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
 modal(`<h2>系统安装未完成</h2><div class="note">网页安装条件已经通过，Chrome 也已接收安装请求；当前卡住的是 Android 的 WebAPK/桌面快捷方式服务。请先在应用抽屉搜索“扑克机”。若没有，请允许 Chrome 创建桌面快捷方式后重新打开本页。</div><div class="form-actions"><button onclick="closeModal()">关闭</button><button class="primary" onclick="location.reload()">重新检测</button></div>`);
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
 const icon=data.settings?.appIcon||'./assets/icon-192.png?v=29';
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
  data.chatSettings[id]??={background:''};
  return data.chatSettings[id];
}
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
function renderChats(){const e=document.getElementById('chatList'),q=(document.getElementById('chatSearch')?.value||'').toLowerCase();const arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q));if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有聊天<br>请先创建角色。</div>`;return}e.innerHTML=arr.map(c=>{const m=(data.chats[c.id]||[]).at(-1);return `<div class="row card" style="margin:0 16px 9px;cursor:pointer" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px">${esc(m?.text||'尚未开始聊天')}</div></div><span class="muted">${esc(m?.time||'')}</span></div>`}).join('')}

function renderContacts(q=''){const e=document.getElementById('contactList'),arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q.toLowerCase()));if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">◌</div>还没有角色<br>创建角色后才会出现在这里。</div>`;return}e.innerHTML=arr.map(c=>`<div class="row card" style="margin:0 16px 9px;cursor:pointer" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.status||'')}</div></div><button class="icon-btn" onclick="event.stopPropagation();editCharacter('${c.id}')">⋯</button></div>`).join('')}

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
 modal(`<h2>群聊设置</h2><div class="field"><label>群聊名称</label><input id="gn" value="${attr(g.name)}"></div><div class="field"><label>成员</label><div class="muted" style="line-height:1.9">${g.memberIds.map(mid=>data.characters.find(c=>c.id===mid)?.name).filter(Boolean).join('、')||'成员已被删除'}</div></div><div class="group" style="margin:14px 0"><div class="group-title">聊天外观</div><div class="setting" onclick="chooseChatBackground()"><span>更换聊天背景</span><span class="muted">图片 ›</span></div><div class="setting" onclick="clearChatBackground()"><span>恢复默认聊天背景</span><span class="muted">›</span></div></div><div class="form-actions"><button class="danger" onclick="deleteGroup('${id}')">解散群聊</button><button onclick="clearChat('${id}')">清空聊天</button><button class="primary" onclick="updateGroup('${id}')">保存</button></div>`);
}
function updateGroup(id){const g=data.groups.find(x=>x.id===id);if(!g)return;g.name=document.getElementById('gn').value.trim()||g.name;save();closeModal();renderGroups();toast('已保存')}
function deleteGroup(id){if(!confirm('解散这个群聊？聊天记录也会被删除。'))return;data.groups=data.groups.filter(g=>g.id!==id);delete data.chats[id];delete data.chatSettings?.[id];if(currentChat===id)currentChat=null;save();closeModal();renderGroups();openView('groups')}
function renderSpeakerPicker(g){
 const el=document.getElementById('speakerPicker');if(!el)return;
 const chips=[`<button class="chip ${groupPendingSpeaker===null?'on':''}" onclick="pickSpeaker(null)">自动轮流</button>`]
  .concat(g.memberIds.map(id=>{const c=data.characters.find(x=>x.id===id);if(!c)return'';return `<button class="chip ${groupPendingSpeaker===id?'on':''}" onclick="pickSpeaker('${id}')">${esc(c.name)}</button>`}));
 el.innerHTML=chips.join('');
}
function pickSpeaker(id){groupPendingSpeaker=id;const g=data.groups.find(x=>x.id===currentChat);if(g)renderSpeakerPicker(g)}
function backFromChat(){const g=data.groups.find(x=>x.id===currentChat);openView(g?'groups':'chats')}

function modelProfile(kind='chat'){return data.models?.[kind]||emptyModel()}
function validModel(kind='chat'){const p=modelProfile(kind);return !!(p.base&&p.key&&p.model)}
function validAPI(){return validModel('chat')}
function requireAPI(){if(!validAPI()){toast('请先在设置中配置 API');openView('settings');return false}return true}

/* ---------- character CRUD ---------- */
function newCharacter(){characterImageDraft='';characterOriginalImage='';modal(`<h2>创建角色</h2><div class="field"><label>角色名称</label><input id="cn" placeholder="你的角色名称"></div><div class="field"><label>状态</label><input id="cs" placeholder="短状态"></div><div class="field"><label>角色设定</label><textarea id="cb" placeholder="身份、性格、经历、说话方式、边界等。"></textarea></div><div class="field"><label>头像 URL（可选）</label><input id="ci" placeholder="https://..."></div><div class="form-actions"><button onclick="pickCharacterImage()">上传头像</button><button onclick="closeModal()">取消</button><button class="primary" onclick="createCharacter()">创建</button></div>`)}
function createCharacter(){const name=document.getElementById('cn').value.trim();if(!name)return toast('请填写角色名称');const id='c_'+crypto.randomUUID();data.characters.push({id,name,status:document.getElementById('cs').value.trim(),bio:document.getElementById('cb').value.trim(),image:characterImageDraft||document.getElementById('ci').value.trim()});data.chats[id]=[];getChatSettings(id);save();closeModal();renderContacts();toast('角色已创建')}
function editCharacter(id){const c=data.characters.find(x=>x.id===id);if(!c)return;characterImageDraft='';characterOriginalImage=c.image||'';modal(`<h2>角色资料</h2><div class="field"><label>名称</label><input id="cn" value="${attr(c.name)}"></div><div class="field"><label>状态</label><input id="cs" value="${attr(c.status||'')}"></div><div class="field"><label>角色设定</label><textarea id="cb">${esc(c.bio||'')}</textarea></div><div class="field"><label>头像 URL</label><input id="ci" value="${attr(c.image?.startsWith('data:')?'':c.image||'')}"></div><div class="form-actions"><button onclick="pickCharacterImage()">上传头像</button><button class="danger" onclick="deleteCharacter('${id}')">删除</button><button onclick="clearChat('${id}')">清空聊天</button><button class="primary" onclick="updateCharacter('${id}')">保存</button></div>`)}
function updateCharacter(id){const c=data.characters.find(x=>x.id===id);if(!c)return;c.name=document.getElementById('cn').value.trim()||c.name;c.status=document.getElementById('cs').value.trim();c.bio=document.getElementById('cb').value;const url=document.getElementById('ci').value.trim();c.image=characterImageDraft||url||characterOriginalImage;save();closeModal();renderContacts();renderChats();toast('已保存')}
function pickCharacterImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;characterImageDraft=await readImageFile(file);toast('头像图片已选择，保存后生效')}catch(error){errorDetail(error,'角色头像读取失败')}};input.click()}
function deleteCharacter(id){if(!confirm('删除角色以及本机保存的该角色聊天记录？'))return;data.characters=data.characters.filter(c=>c.id!==id);delete data.chats[id];delete data.chatSettings?.[id];save();closeModal();renderContacts();renderChats()}
function clearChat(id=currentChat){if(!id)return;if(!confirm('清空这个角色的全部聊天记录？'))return;data.chats[id]=[];save();if(currentChat===id)renderMessages();closeModal();renderChats();toast('聊天记录已清空')}

/* ---------- chat: FIXED openChat ---------- */
function openChat(id){
  currentChat=id;
  groupPendingSpeaker=null;
  const g=data.groups.find(x=>x.id===id);
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
   document.getElementById('chatName').textContent=c.name;
   if(sub)sub.textContent='AI 对话';
   ava.classList.remove('avatar-stack');ava.classList.add('avatar');
   if(c.image){const im=document.createElement('img');im.src=c.image;im.alt='';im.loading='lazy';ava.appendChild(im)}
   if(picker)picker.style.display='none';
  }
  show('chat');
  applyChatBackground();
  renderMessages();
}

function renderMessages(){
 const e=document.getElementById('messages'),arr=data.chats[currentChat]||[];
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有消息</div>`;return}
 const g=data.groups.find(x=>x.id===currentChat);
 e.innerHTML=arr.map((m,i)=>{
  const speakerName=(g&&m.role==='assistant')?(data.characters.find(c=>c.id===m.speaker)?.name||''):'';
  return `<div class="msg ${m.role==='user'?'me':''}" data-idx="${i}" oncontextmenu="return showMsgMenu(event,${i})" ontouchstart="touchStartMsg(event,${i})" ontouchend="touchEndMsg(event)"><div>${speakerName?`<div class="msg-speaker">${esc(speakerName)}</div>`:''}<div class="bubble" onclick="showMsgMenu(event,${i})">${esc(m.text)}${m.edited?'<span style="opacity:.4;font-size:8px;margin-left:4px">(已编辑)</span>':''}</div></div><span class="msg-time">${esc(m.time||'')}</span></div>`;
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
function priorityDirective(percent=100){const p=Math.min(100,Math.max(0,Number(percent)||0));const tier=p>=90?'HIGHEST':p>=70?'HIGH':p>=40?'NORMAL':'LOW';return `[CONTEXT_PRIORITY tier=${tier} normalized=${(p/100).toFixed(2)}]`;}
function buildProviderRequest({provider,base,key,model,system,history,temperature,maxTokens,cacheKey,enableCache,priorityPercent=100}){
 const temp=Math.max(0,Number(temperature)||0);
 system=`${priorityDirective(priorityPercent)}\n${system}`;
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
function stopGeneration(){if(abortController){abortController.abort();abortController=null;busy=false;setBusy(false);toast('已停止生成')}}
function setBusy(v){busy=v;const btn=document.querySelector('.send');if(btn){btn.disabled=v;btn.textContent=v?'■':'↑';btn.title=v?'停止生成':'发送'}const input=document.getElementById('messageInput');if(input)input.disabled=v}

async function invokeModel(kind,{system,history,temperature=0,maxTokens=1024,cacheKey='',signal}={}){
 const p=modelProfile(kind);if(!validModel(kind))throw Error(`${kind} 模型未完整配置`);
 const req=buildProviderRequest({provider:p.provider,base:p.base,key:p.key,model:p.model,system,history,temperature,maxTokens,cacheKey,enableCache:data.settings.promptCache!==false,priorityPercent:p.weight});
 const res=await fetch(req.url,{method:'POST',headers:req.headers,signal,body:JSON.stringify(req.body)});
 if(!res.ok){let detail='';try{detail=await res.text()}catch{}throw Error(`HTTP ${res.status} ${res.statusText}\n${detail}`)}
 let j;try{j=await res.json()}catch(e){throw Error(`API 返回了无法解析的 JSON：${e.message}`)}
 const out=extractProviderContent(p.provider,j);if(!out)throw Error(`API 返回为空\n${JSON.stringify(j,null,2)}`);return out;
}
async function testAPI(showMsg=true){const c=withTimeout(Number(data.settings.timeout)||60000);try{await invokeModel('chat',{system:'You are a connection test.',history:[{role:'user',content:'Reply with OK only.'}],temperature:0,maxTokens:64,signal:c.signal});if(showMsg)toast('主聊天模型连接成功');return true}catch(e){if(showMsg)errorDetail(e,'API 测试失败');return false}finally{releaseController(c)}}

function getRegexFlags(r){let f=r.flags||'g';if(typeof f==='string')return [...new Set(f.replace(/[^dgimsuvy]/g,''))].join('');return 'g'}
function applyRegexPipeline(text,target='AI 回复'){let out=String(text??'');for(const r of (data.engine.regexRules||[]).filter(x=>x.enabled!==false)){if(r.target&&r.target!==target&&r.target!=='全部消息')continue;try{out=out.replace(new RegExp(r.pattern,getRegexFlags(r)),r.replace??'')}catch{}}return out}
function regexPreflight(text){return applyRegexPipeline(text,'用户消息')}
function parseState(raw){const match=String(raw||'').match(/<state>([\s\S]*?)<\/state>/i);if(!match)return;for(const line of match[1].split(/\r?\n/)){const m=line.match(/^\s*([^=:#]+?)\s*[=:]\s*(.*?)\s*$/);if(m)data.engine.state[m[1].trim()]=m[2].trim()}}
function ruleMatches(r,input){if(r.enabled===false)return false;const hay=String(input||'').toLowerCase();const trig=String(r.trigger||'').trim();if(!trig)return true;const st=data.engine.state||{};if(trig.startsWith('/')&&trig.lastIndexOf('/')>0){const k=trig.lastIndexOf('/');try{return new RegExp(trig.slice(1,k),trig.slice(k+1)||'i').test(input)}catch{return false}}const parts=trig.split(/[|,，、]/).map(x=>x.trim().toLowerCase()).filter(Boolean);return parts.some(p=>hay.includes(p)||JSON.stringify(st).toLowerCase().includes(p))}
function template(s,ctx){return String(s??'').replace(/\{\{\s*(world|state|memory|character|message|role)\s*\}\}/gi,(_,k)=>ctx[k.toLowerCase()]??'')}
function buildEngineContext(character,userMessage=''){
 const st=data.engine.state||{};
 const rules=(data.engine.worldRules||[]).filter(r=>r.global||ruleMatches(r,userMessage)).sort((a,b)=>(b.global?10000:Number(b.priority)||0)-(a.global?10000:Number(a.priority)||0));
 const books=(data.worlds||[]).filter(w=>w.enabled!==false&&(w.global||ruleMatches(w,userMessage))).sort((a,b)=>(b.global?10000:Number(b.priority)||0)-(a.global?10000:Number(a.priority)||0));
 const bookText=books.map(w=>`【${w.global?'全局世界书':'世界书'}:${w.name}｜${w.global?'强制最高优先级':`优先级${w.priority??70}`}】\n${template(w.desc||'',{state:JSON.stringify(st),message:userMessage,character:character?.name||'',role:character?.bio||''})}`);
 const worldText=[...bookText,...rules.map(r=>`【${r.global?'全局规则':'世界规则'}:${r.name}｜${r.global?'强制最高优先级':`优先级${r.priority??0}`}】\n${template(r.content,{state:JSON.stringify(st),message:userMessage,character:character?.name||'',role:character?.bio||''})}`)].join('\n\n');
 const memories=(data.memories||[]).slice(0,30).map(m=>`【记忆:${m.title}】${m.text}`).join('\n');
 const base={world:worldText||'当前没有命中的世界规则。',state:JSON.stringify(st,null,2),memory:memories||'暂无记忆',character:character?.bio||'',role:character?.bio||'',message:userMessage};
 const preset=(data.engine.presetModules||[]).filter(m=>m.enabled!==false).slice().sort((a,b)=>(Number(b.weight)||0)-(Number(a.weight)||0)).map(m=>`【${m.kind||'自定义'}:${m.name}|UI ${m.weight??0}%|${priorityDirective(m.weight)}】\n${template(m.content,base)}`).join('\n\n');
 return {...base,preset,world:worldText||'当前没有命中的世界规则。'};
}
function buildSystemPrompt(c,userMessage=''){
 const x=buildEngineContext(c,userMessage);
 return `这是普通的沉浸式角色聊天。应用名称、图标、界面主题和视觉装饰均属于界面元信息，不属于对话上下文，不得据此推断任何剧情、活动、物品或玩法。只根据用户消息、角色资料、世界书、记忆与预设回复。\n你不是预置角色；当前角色资料完全来自用户。\n\n【角色】\n${c.name}\n${c.bio||'无'}\n\n【动态世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【执行原则】\n世界规则决定当前可用背景；预设模块负责组合与优先级；正则负责请求前处理、回复后处理和状态反馈。保持连续性，不虚构不存在的外部数据。`;
}
function buildGroupSystemPrompt(g,activeChar,userMessage=''){
 const x=buildEngineContext(activeChar,userMessage);
 const roster=g.memberIds.map(id=>data.characters.find(c=>c.id===id)).filter(Boolean).map(m=>`- ${m.name}：${(m.bio||'（无设定）').slice(0,140)}`).join('\n');
 return `这是普通的沉浸式角色群聊“${g.name}”。应用名称、图标、界面主题和视觉装饰均属于界面元信息，不属于对话上下文，不得据此推断任何剧情、活动、物品或玩法。只根据用户消息、角色资料、世界书、记忆与预设回复。所有角色资料完全来自用户。\n\n【群聊成员】\n${roster}\n\n本轮只以【${activeChar.name}】的身份回复：只输出该角色本人的发言内容，不要替其他角色说话或替他们做决定，也不要在回复里加角色名前缀（界面会自动显示发言人）。\n\n【当前发言角色】\n${activeChar.name}\n${activeChar.bio||'无'}\n\n【动态世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【执行原则】\n保持人物关系与对话连续性，不虚构不存在的外部数据。`;
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
async function createNarrativeRandomEvent({chatId,group,activeChar,userMessage,signal}){
 if(data.settings.randomEventsEnabled!==true)return '';
 const chance=Math.min(100,Math.max(0,Number(data.settings.randomEventChance)||0));
 if(chance<=0||Math.random()*100>=chance)return '';
 if(!validModel('random'))throw Error('随机事件已开启，但随机事件模型未完整配置');
 const recent=(data.chats[chatId]||[]).slice(-10).map(m=>`${m.role==='user'?'用户':(data.characters.find(c=>c.id===m.speaker)?.name||activeChar.name)}：${m.text}`).join('\n');
 const engine=buildEngineContext(activeChar,userMessage);
 const scope=group?`群聊：${group.name}`:`私聊角色：${activeChar.name}`;
 const event=await invokeModel('random',{
  system:'你是独立的角色剧情随机事件工具。只生成一条能自然进入当前情境的偶发事件，不扮演角色、不输出对话、不解释机制、不提及应用界面或品牌。事件必须与角色设定和世界规则兼容，避免强行改写既有事实。只输出事件描述。',
  history:[{role:'user',content:`${scope}\n角色资料：${activeChar.bio||'无'}\n当前世界：${engine.world}\n世界状态：${engine.state}\n最近对话：\n${recent||'无'}\n用户刚刚说：${userMessage}`}],
  temperature:1,maxTokens:360,cacheKey:`pokeji_random_${activeChar.id}`,signal
 });
 const text=String(event||'').trim().slice(0,1200);if(!text)throw Error('随机事件模型返回为空');
 const events=Array.isArray(data.engine.state.events)?data.engine.state.events:[];
 events.unshift({id:'event_'+crypto.randomUUID(),chatId,characterId:activeChar.id,text,at:new Date().toISOString()});
 data.engine.state.events=events.slice(0,30);save();return text;
}

async function sendMessage(){
 if(busy){stopGeneration();return}
 if(!validAPI()){toast('API 未配置');openView('settings');return}
 const input=document.getElementById('messageInput'),raw=input.value.trim();if(!raw||!currentChat)return;
 const text=regexPreflight(raw);data.chats[currentChat]??=[];data.chats[currentChat].push({role:'user',text,time:time()});save();input.value='';renderMessages();setBusy(true);
 const s=data.settings,group=data.groups.find(x=>x.id===currentChat);
 const controller=withTimeout(Number(s.timeout)||60000);
 try{
  let system,activeChar,notifName;
  if(group){
   const speakerId=groupPendingSpeaker||group.memberIds[group.turnIndex%group.memberIds.length];
   activeChar=data.characters.find(x=>x.id===speakerId);
   if(!activeChar)throw Error('群聊成员数据异常，请检查角色是否已被删除');
   system=buildGroupSystemPrompt(group,activeChar,text);
   notifName=`${group.name} · ${activeChar.name}`;
  }else{
   activeChar=data.characters.find(x=>x.id===currentChat);
   if(!activeChar)throw Error('角色不存在');
   system=buildSystemPrompt(activeChar,text);
   notifName=activeChar.name;
  }
  const summary=await refreshConversationSummary(currentChat,controller.signal);
  if(summary)system+=`\n\n【自动记忆摘要】\n${summary}`;
  try{
   const randomEvent=await createNarrativeRandomEvent({chatId:currentChat,group,activeChar,userMessage:text,signal:controller.signal});
   if(randomEvent)system+=`\n\n【本轮随机剧情事件｜高优先级】\n${randomEvent}\n请让事件自然进入当前剧情，并保持角色身份与既有连续性。不要说明事件来自工具。`;
  }catch(eventError){
   if(eventError?.name==='AbortError')throw eventError;
   errorDetail(eventError,'随机事件模型异常');
  }
  const history=data.chats[currentChat].slice(-Math.max(4,Number(s.maxHistory)||40)).map(m=>{
   if(m.role==='user')return{role:'user',content:m.text};
   if(group){const spk=data.characters.find(x=>x.id===m.speaker);return{role:'assistant',content:`[${spk?spk.name:'角色'}] ${m.text}`}}
   return{role:'assistant',content:m.text};
  });
  const rawReply=await invokeModel('chat',{system,history,temperature:s.temperature,maxTokens:s.maxTokens,cacheKey:'pokeji_chat_'+(group?group.id+'_'+activeChar.id:activeChar.id),signal:controller.signal});
  parseState(rawReply);
  const reply=applyRegexPipeline(rawReply,'AI 回复').replace(/<state>[\s\S]*?<\/state>/gi,'').trim();
  const msg={role:'assistant',text:reply||rawReply,time:time()};
  if(group){msg.speaker=activeChar.id;group.turnIndex=(group.turnIndex+1)%group.memberIds.length;groupPendingSpeaker=null;renderSpeakerPicker(group)}
  data.chats[currentChat].push(msg);data.notifications.unshift({text:`${notifName}回复了你`,time:'刚刚',type:'chat'});save();renderMessages();
 }catch(err){if(err.name==='AbortError'){errorDetail(err,'请求超时或已停止生成');}else{errorDetail(err,'API / 内部异常');}renderMessages()}
 finally{releaseController(controller);setBusy(false)}
}

async function regenerateLast(){
 if(busy||!currentChat)return;const arr=data.chats[currentChat]||[];
 if(arr.at(-1)?.role!=='assistant')return toast('末尾没有可撤回的 AI 回复');
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
function newWorld(){modal(`<h2>创建世界书条目</h2><div class="field"><label>名称</label><input id="wn"></div><div class="field"><label>触发条件</label><input id="wt" placeholder="留空=始终；支持关键词、逗号分隔或 /正则/i"></div><div class="field"><label>内容</label><textarea id="wd" placeholder="支持 {{state}} {{message}} {{character}}"></textarea></div><div class="field"><label>优先级百分比</label><input id="wp" type="range" min="0" max="100" value="70" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>70%</small></div><div class="field"><label><input id="wg" type="checkbox" style="width:auto"> 常驻 / 全局（全部会话强制最高优先级）</label></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createWorld()">创建</button></div>`)}
function createWorld(){const n=document.getElementById('wn').value.trim();if(!n)return toast('请填写名称');data.worlds.push({id:'w_'+crypto.randomUUID(),name:n,trigger:document.getElementById('wt').value.trim(),desc:document.getElementById('wd').value,priority:Number(document.getElementById('wp').value)||70,global:document.getElementById('wg').checked,enabled:true});save();closeModal();renderWorld()}
function renderWorld(){const e=document.getElementById('worldList');if(!data.worlds.length){e.innerHTML='<div class="empty"><div class="big">✦</div>还没有世界书条目</div>';return}e.innerHTML=data.worlds.map(w=>`<div class="card" style="padding:15px;margin-bottom:10px" onclick="editWorld('${w.id}')"><div class="module-head"><b>${esc(w.name)}</b><span class="pill">${w.enabled===false?'已停用':(w.global?'全局常驻':`优先级 ${w.priority??70}`)}</span></div><div class="muted" style="margin-top:5px">触发：${esc(w.global?'全部会话':w.trigger||'始终')}</div><div class="muted" style="line-height:1.7;margin-top:7px">${esc(w.desc||'')}</div></div>`).join('')}
function editWorld(id){const w=data.worlds.find(x=>x.id===id);if(!w)return;modal(`<h2>编辑世界书条目</h2><div class="field"><label>名称</label><input id="wn" value="${attr(w.name)}"></div><div class="field"><label>触发条件</label><input id="wt" value="${attr(w.trigger||'')}"></div><div class="field"><label>内容</label><textarea id="wd">${esc(w.desc||'')}</textarea></div><div class="field"><label>优先级百分比</label><input id="wp" type="range" min="0" max="100" value="${w.priority??70}" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>${w.priority??70}%</small></div><div class="field"><label><input id="we" type="checkbox" style="width:auto" ${w.enabled!==false?'checked':''}> 启用条目</label></div><div class="field"><label><input id="wg" type="checkbox" style="width:auto" ${w.global?'checked':''}> 常驻 / 全局</label></div><div class="form-actions"><button class="danger" onclick="deleteWorld('${id}')">删除</button><button class="primary" onclick="updateWorld('${id}')">保存</button></div>`)}
function updateWorld(id){const w=data.worlds.find(x=>x.id===id);if(!w)return;w.name=document.getElementById('wn').value.trim()||w.name;w.trigger=document.getElementById('wt').value.trim();w.desc=document.getElementById('wd').value;w.priority=Number(document.getElementById('wp').value)||70;w.enabled=document.getElementById('we').checked;w.global=document.getElementById('wg').checked;save();closeModal();renderWorld();toast('世界书条目已进入上下文规则')}
function deleteWorld(id){if(!confirm('删除这个世界书条目？'))return;data.worlds=data.worlds.filter(w=>w.id!==id);save();closeModal();renderWorld();toast('已删除')}
function newMemory(){modal(`<h2>保存记忆</h2><div class="field"><label>标题</label><input id="mn"></div><div class="field"><label>内容</label><textarea id="mt"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createMemory()">保存</button></div>`)}
function createMemory(){const n=document.getElementById('mn').value.trim();if(!n)return toast('请填写标题');data.memories.unshift({id:'m_'+crypto.randomUUID(),title:n,text:document.getElementById('mt').value,time:'刚刚'});save();closeModal();renderMemory()}
function chatDisplayName(id){const character=data.characters.find(x=>x.id===id);if(character)return character.name;const group=data.groups.find(x=>x.id===id);return group?.name||'已删除会话'}
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
function renderEngineWorld(e){const rules=data.engine.worldRules||[],st=data.engine.state||{};e.innerHTML=`<div class="engine-card"><h3>♠ &nbsp;动态世界</h3><p>世界规则不再全部无条件塞进 Prompt。每条规则可以按关键词、状态或正则触发，并按优先级参与本次上下文。</p><div class="engine-flow"><div class="flowbox"><b>世界状态</b><span>地点：${esc(st.location||'未设置')}<br>天气：${esc(st.weather||'未设置')}<br>时间：${esc(st.time||'未设置')}</span></div><div class="flowbox"><b>当前规则</b><span>${rules.filter(x=>x.enabled!==false).length} 条</span></div></div><button class="primary" style="margin-top:10px" onclick="newWorldRule()">＋ 新建世界规则</button></div><div class="engine-card"><h3>♠ &nbsp;世界规则</h3>${rules.length?rules.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${r.enabled===false?'停用':'启用'} · ${r.priority??0}</span></div><small>${esc(r.trigger||'始终')}</small><div class="muted" style="margin-top:6px">${esc(r.content||'')}</div><div style="margin-top:9px;display:flex;gap:7px"><button class="icon-btn" onclick="editWorldRule(${i})">⋯</button><button class="icon-btn" onclick="toggleWorldRule(${i})">◉</button></div></div>`).join(''):'<div class="empty">还没有世界规则。</div>'}</div>`}
function newWorldRule(){modal(`<h2>世界规则</h2><div class="field"><label>名称</label><input id="erN"></div><div class="field"><label>触发条件</label><input id="erT" placeholder="留空=始终；也可写词语或 /正则/i"></div><div class="field"><label>注入内容</label><textarea id="erC" placeholder="支持 {{state}} {{message}} {{character}}"></textarea></div><div class="field"><label>权重（UI 百分比）</label><input id="erP" type="range" min="0" max="100" value="80" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>80%</small></div><div class="field"><label><input id="erG" type="checkbox" style="width:auto"> 常驻 / 全局（强制最高优先级）</label></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveWorldRule()">保存</button></div>`)}
function saveWorldRule(idx=null){const r={name:document.getElementById('erN').value.trim(),trigger:document.getElementById('erT').value.trim(),content:document.getElementById('erC').value,priority:Number(document.getElementById('erP').value)||80,global:document.getElementById('erG').checked,enabled:true};if(!r.name)return toast('请填写名称');if(idx===null)data.engine.worldRules.push(r);else data.engine.worldRules[idx]={...data.engine.worldRules[idx],...r};save();closeModal();engineTab('world')}
function editWorldRule(i){const r=data.engine.worldRules[i];modal(`<h2>编辑世界规则</h2><div class="field"><label>名称</label><input id="erN" value="${attr(r.name)}"></div><div class="field"><label>触发条件</label><input id="erT" value="${attr(r.trigger||'')}"></div><div class="field"><label>注入内容</label><textarea id="erC">${esc(r.content||'')}</textarea></div><div class="field"><label>权重（UI 百分比）</label><input id="erP" type="range" min="0" max="100" value="${r.priority||80}" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>${r.priority||80}%</small></div><div class="field"><label><input id="erG" type="checkbox" style="width:auto" ${r.global?'checked':''}> 常驻 / 全局</label></div><div class="form-actions"><button class="danger" onclick="data.engine.worldRules.splice(${i},1);save();closeModal();engineTab('world')">删除</button><button class="primary" onclick="saveWorldRule(${i})">保存</button></div>`)}
function toggleWorldRule(i){data.engine.worldRules[i].enabled=data.engine.worldRules[i].enabled===false;save();engineTab('world')}
function renderEnginePreset(e){const ms=data.engine.presetModules||[];e.innerHTML=`<div class="engine-card"><h3>♣ &nbsp;预设编译器</h3><p>预设模块按权重编译，并支持 {{world}}、{{state}}、{{memory}}、{{character}}、{{message}}。它不是一段固定 Prompt。</p><div class="engine-flow"><div class="flowbox"><b>世界</b><span>检索触发</span></div><div class="flowbox"><b>预设</b><span>权重编译</span></div><div class="flowbox"><b>API</b><span>唯一 AI 来源</span></div><div class="flowbox"><b>正则</b><span>前后处理 + 状态</span></div></div><button class="primary" style="margin-top:10px" onclick="newPresetModule()">＋ 新建模块</button></div><div class="engine-card"><h3>♣ &nbsp;模块顺序</h3>${ms.length?ms.map((m,i)=>`<div class="module"><div class="module-head"><b>${esc(m.name)}</b><span class="pill">权重 ${m.weight??0}</span></div><small>${esc(m.kind||'自定义')} · ${m.enabled===false?'停用':'启用'}</small><div style="margin-top:7px;color:#777;font-size:11px">${esc(m.content||'')}</div><div style="margin-top:8px;display:flex;gap:6px"><button class="icon-btn" onclick="movePreset(${i},-1)">↑</button><button class="icon-btn" onclick="movePreset(${i},1)">↓</button><button class="icon-btn" onclick="editPreset(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有预设模块。</div>'}</div>`}
function newPresetModule(){modal(`<h2>预设模块</h2><div class="field"><label>名称</label><input id="pmN"></div><div class="field"><label>类型</label><select id="pmK"><option>身份层</option><option>世界层</option><option>角色层</option><option>行为规则</option><option>风格层</option><option>输出格式</option><option>记忆层</option><option>动态上下文</option><option>自定义</option></select></div><div class="field"><label>权重</label><input id="pmW" type="number" value="80"></div><div class="field"><label>内容</label><textarea id="pmC" placeholder="可使用 {{world}} {{state}} {{memory}} {{character}} {{message}}"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="savePreset()">保存</button></div>`)}
function savePreset(idx=null){const m={name:document.getElementById('pmN').value.trim(),kind:document.getElementById('pmK').value,weight:Number(document.getElementById('pmW').value)||80,content:document.getElementById('pmC').value,enabled:true};if(!m.name)return toast('请填写名称');if(idx===null)data.engine.presetModules.push(m);else data.engine.presetModules[idx]={...data.engine.presetModules[idx],...m};save();closeModal();engineTab('preset')}
function editPreset(i){const m=data.engine.presetModules[i];modal(`<h2>编辑预设模块</h2><div class="field"><label>名称</label><input id="pmN" value="${attr(m.name)}"></div><div class="field"><label>类型</label><select id="pmK">${['身份层','世界层','角色层','行为规则','风格层','输出格式','记忆层','动态上下文','自定义'].map(x=>`<option ${x===m.kind?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>权重</label><input id="pmW" type="number" value="${m.weight??80}"></div><div class="field"><label>内容</label><textarea id="pmC">${esc(m.content||'')}</textarea></div><div class="form-actions"><button class="danger" onclick="data.engine.presetModules.splice(${i},1);save();closeModal();engineTab('preset')">删除</button><button class="primary" onclick="savePreset(${i})">保存</button></div>`)}
function movePreset(i,d){const a=data.engine.presetModules,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();engineTab('preset')}
function renderEngineRegex(e){const rs=data.engine.regexRules||[];e.innerHTML=`<div class="engine-card"><h3>♦ &nbsp;正则处理管线</h3><p>规则可以分别作用于用户消息、AI 回复、全部消息或状态解析。AI 回复会先解析状态，再清理展示标签。</p><div class="engine-flow"><div class="flowbox"><b>用户输入</b><span>预处理</span></div><div class="flowbox"><b>API</b><span>上下文编译</span></div><div class="flowbox"><b>AI 输出</b><span>后处理</span></div><div class="flowbox"><b>状态</b><span>反馈世界</span></div></div><button class="primary" style="margin-top:10px" onclick="newRegexRule()">＋ 新建规则</button></div><div class="engine-card"><h3>♦ &nbsp;规则链</h3>${rs.length?rs.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${esc(r.target||'AI 回复')}</span></div><small>${r.enabled===false?'停用':'启用'} · 顺序 ${i+1}</small><div class="muted" style="margin-top:6px">/${esc(r.pattern)}/${esc(r.flags||'g')} → ${esc(r.replace||'')}</div><div style="margin-top:8px"><button class="icon-btn" onclick="editRegex(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有正则规则。</div>'}</div>`}
function newRegexRule(){modal(`<h2>正则规则</h2><div class="field"><label>名称</label><input id="rxN"></div><div class="field"><label>匹配模式</label><input id="rxP" placeholder="例如：<state>([\\s\\S]*?)</state>"></div><div class="field"><label>替换内容</label><input id="rxR"></div><div class="field"><label>处理对象</label><select id="rxT"><option>AI 回复</option><option>用户消息</option><option>全部消息</option><option>状态解析</option></select></div><div class="field"><label>Flags</label><input id="rxG" value="g" placeholder="g / gi / gm / gis"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveRegex()">保存</button></div>`)}
function saveRegex(idx=null){const r={name:document.getElementById('rxN').value.trim(),pattern:document.getElementById('rxP').value,replace:document.getElementById('rxR').value,target:document.getElementById('rxT').value,flags:document.getElementById('rxG').value||'g',enabled:true};if(!r.name||!r.pattern)return toast('名称和匹配模式不能为空');try{new RegExp(r.pattern,getRegexFlags(r))}catch{return toast('正则表达式无效')}if(idx===null)data.engine.regexRules.push(r);else data.engine.regexRules[idx]={...data.engine.regexRules[idx],...r};save();closeModal();engineTab('regex')}
function editRegex(i){const r=data.engine.regexRules[i];modal(`<h2>编辑正则规则</h2><div class="field"><label>名称</label><input id="rxN" value="${attr(r.name)}"></div><div class="field"><label>匹配模式</label><input id="rxP" value="${attr(r.pattern)}"></div><div class="field"><label>替换内容</label><input id="rxR" value="${attr(r.replace||'')}"></div><div class="field"><label>处理对象</label><select id="rxT">${['AI 回复','用户消息','全部消息','状态解析'].map(x=>`<option ${x===r.target?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Flags</label><input id="rxG" value="${attr(r.flags||'g')}"></div><div class="form-actions"><button class="danger" onclick="data.engine.regexRules.splice(${i},1);save();closeModal();engineTab('regex')">删除</button><button class="primary" onclick="saveRegex(${i})">保存</button></div>`)}
function renderEnginePreview(e){const c=currentChat&&data.characters.find(x=>x.id===currentChat);const last=(currentChat&&data.chats[currentChat]?.filter(x=>x.role==='user').at(-1)?.text)||'';const x=c?buildEngineContext(c,last):null;const prompt=c?buildSystemPrompt(c,last):'尚未进入聊天。创建角色并输入消息后，这里会显示本次上下文编译结果。';e.innerHTML=`<div class="engine-card"><h3>♥ &nbsp;上下文预览</h3><p>发送给 API 前的本地编译结果，不会自动发送。</p>${x?`<div class="preview">WORLD\n${esc(x.world)}\n\nSTATE\n${esc(x.state)}\n\nMEMORY\n${esc(x.memory)}\n\nPRESET\n${esc(x.preset)}</div>`:''}<div class="preview">${esc(prompt)}</div></div><div class="engine-card"><h3>♥ &nbsp;闭环</h3><div class="engine-flow"><div class="flowbox"><b>世界</b><span>触发与状态</span></div><div class="flowbox"><b>预设</b><span>模板与权重</span></div><div class="flowbox"><b>API</b><span>唯一 AI 来源</span></div><div class="flowbox"><b>正则</b><span>前后处理</span></div></div><div class="arrow">↻ 状态反馈 → 下一次世界检索</div></div>`}

/* ---------- settings ---------- */
const PROVIDER_HINTS={openai:'例：https://api.openai.com/v1 （或任意 OpenAI 兼容中转地址）',anthropic:'例：https://api.anthropic.com （原生 Claude Messages API）',gemini:'例：https://generativelanguage.googleapis.com （原生 Gemini API）'};
const MODEL_LABELS={chat:'主聊天模型',random:'随机事件模型',voice:'声音模型',vision:'图片识别模型',summary:'记忆摘要工具模型'};
function updateProviderHint(){}
function renderModelProfiles(){const e=document.getElementById('modelProfiles');if(!e)return;e.innerHTML=Object.entries(MODEL_LABELS).map(([k,label])=>{const p=modelProfile(k);return `<div class="setting" onclick="editModelProfile('${k}')"><span><b>${label}</b><small style="display:block">${esc(p.model||'未配置')} · ${esc(p.provider)} · ${p.weight}%</small></span><span class="muted">独立 ›</span></div>`}).join('')}
function editModelProfile(kind){const p=modelProfile(kind);modal(`<h2>${MODEL_LABELS[kind]}</h2><div class="note">此项使用独立 API 配置，不占用其他模型的 Key 或调用链。百分比会转换成归一化优先级指令并实际传入请求。${kind==='voice'?'朗读使用 OpenAI 兼容 /audio/speech 链路。':''}</div><div class="field"><label>服务商</label><select id="mpProvider">${[['openai','OpenAI 兼容'],['anthropic','Claude 原生'],['gemini','Gemini 原生']].map(([v,n])=>`<option value="${v}" ${p.provider===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>API Base URL</label><input id="mpBase" value="${attr(p.base||'')}"></div><div class="field"><label>API Key</label><input id="mpKey" type="password" value="${attr(p.key||'')}"></div><div class="field"><label>模型</label><input id="mpModel" value="${attr(p.model||'')}"></div>${kind==='voice'?`<div class="field"><label>声音名称 / Voice ID</label><input id="mpVoice" value="${attr(p.voice||'alloy')}" placeholder="alloy"></div>`:''}<div class="field"><label>权重百分比</label><input id="mpWeight" type="range" min="0" max="100" value="${p.weight??100}" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>${p.weight??100}%</small></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveModelProfile('${kind}')">保存</button></div>`)}
function saveModelProfile(kind){data.models[kind]={provider:document.getElementById('mpProvider').value,base:document.getElementById('mpBase').value.trim(),key:document.getElementById('mpKey').value.trim(),model:document.getElementById('mpModel').value.trim(),weight:Number(document.getElementById('mpWeight').value),voice:document.getElementById('mpVoice')?.value.trim()||data.models[kind]?.voice||'alloy'};save();closeModal();renderModelProfiles();toast(`${MODEL_LABELS[kind]}已保存`)}
function loadSettings(){
 applyAppearance();renderModelProfiles();updateInstallStatus();
 ['temperature'].forEach(k=>{const el=document.getElementById(k);if(el)el.value=data.settings[k]??''});
 const mh=document.getElementById('maxHistory');if(mh)mh.value=data.settings.maxHistory??40;
 const sk=document.getElementById('summaryKeepTurns');if(sk)sk.value=data.settings.summaryKeepTurns??12;
 const sa=document.getElementById('summaryAutoEnabled');if(sa)sa.checked=data.settings.summaryAutoEnabled!==false;
 const mt=document.getElementById('maxTokens');if(mt)mt.value=data.settings.maxTokens??2048;
 const to=document.getElementById('timeout');if(to)to.value=Math.round((data.settings.timeout??60000)/1000);
 const pc=document.getElementById('promptCache');if(pc)pc.checked=data.settings.promptCache!==false;
 const fs=document.getElementById('fullscreenEnabled');if(fs)fs.checked=data.settings.fullscreenEnabled===true;
 const re=document.getElementById('randomEventsEnabled');if(re)re.checked=data.settings.randomEventsEnabled===true;
 const rc=document.getElementById('randomEventChance');if(rc)rc.value=Math.min(100,Math.max(0,Number(data.settings.randomEventChance)||0));
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
 if(document.body?.dataset.singleFile==='true')return toast('单文件是预览版，请部署 V29 资源包更新');
 if(!('serviceWorker' in navigator))return toast('当前浏览器不支持离线更新');
 toast('正在检查更新…');
 try{
  let registration=await navigator.serviceWorker.getRegistration();
  if(!registration)registration=await navigator.serviceWorker.register('./sw.js?v=29',{scope:'./',updateViaCache:'none'});
  await registration.update();
  if(registration.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});toast('发现更新，正在应用…')}
  else toast('已完成更新检查');
 }catch(error){errorDetail(error,'检查更新失败')}
}
function resetData(){if(confirm('确定清空本机全部数据吗？此操作不可恢复。')){[STORE,...LEGACY_STORES].forEach(k=>localStorage.removeItem(k));location.reload()}}
function chatInfo(){const g=data.groups.find(x=>x.id===currentChat);if(g)return editGroup(g.id);const c=data.characters.find(x=>x.id===currentChat);if(!c)return;modal(`<h2>${esc(c.name)}</h2><div class="note"><b>状态</b><br>${esc(c.status||'未填写')}<br><br><b>角色设定</b><br>${esc(c.bio||'未填写')}</div><div class="group" style="margin:14px 0"><div class="group-title">聊天外观</div><div class="setting" onclick="chooseChatBackground()"><span>更换聊天背景</span><span class="muted">图片 ›</span></div><div class="setting" onclick="clearChatBackground()"><span>恢复默认聊天背景</span><span class="muted">›</span></div></div><div class="form-actions"><button onclick="closeModal()">关闭</button><button class="danger" onclick="clearChat('${c.id}')">清空聊天</button></div>`)}

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
        <p>不会提供酒馆格式导入。</p>
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
window.addEventListener('beforeunload',()=>{if(busy&&abortController)abortController.abort()});
window.addEventListener('error',e=>{if(e.error)errorDetail(e.error,'未捕获的内部异常')});
window.addEventListener('unhandledrejection',e=>errorDetail(e.reason instanceof Error?e.reason:Error(String(e.reason)),'未处理的异步异常'));
