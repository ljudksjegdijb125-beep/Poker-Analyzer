/* =========================================================
   扑克机 · V14.4 ENGINE CORE
   API-only / local-first / no built-in characters
   ========================================================= */
const STORE='pokeji_api_only_v4';
const LEGACY_STORE='pokeji_api_only_v3';
const VERSION=15;
let data=load();
let currentChat=null;
let abortController=null;
let busy=false;
let msgMenuTarget=null;
let homePage=0, homeTouchX=0;

function blank(){return{
 settings:{apiBase:'',apiKey:'',apiModel:'',temperature:.8,maxHistory:40,timeout:60000},
 characters:[],chats:{},posts:[],notifications:[],worlds:[],memories:[],
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
 d.characters=Array.isArray(x.characters)?x.characters:[];
 d.chats=x.chats&&typeof x.chats==='object'&&!Array.isArray(x.chats)?x.chats:{};
 d.posts=Array.isArray(x.posts)?x.posts:[];d.notifications=Array.isArray(x.notifications)?x.notifications:[];
 d.worlds=Array.isArray(x.worlds)?x.worlds:[];d.memories=Array.isArray(x.memories)?x.memories:[];
 d.engine={...d.engine,...(x.engine||{})};
 d.engine.worldRules=Array.isArray(d.engine.worldRules)?d.engine.worldRules:[];
 d.engine.presetModules=Array.isArray(d.engine.presetModules)?d.engine.presetModules:[];
 d.engine.regexRules=Array.isArray(d.engine.regexRules)?d.engine.regexRules:[];
 d.engine.state={...blank().engine.state,...(d.engine.state||{})};
 return d;
}
function load(){try{
 const raw=localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE);
 if(!raw)return blank();
 return normalize(JSON.parse(raw));
}catch{return blank()}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch(e){toast('本地存储空间不足，请先导出数据');return false}}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(x){return esc(x).replace(/`/g,'&#96;')}
function time(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
function toast(t){const e=document.getElementById('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove('show'),2200)}
function applyHomeBackground(){
  const home=document.querySelector('#home .p12-home');
  if(!home)return;
  const bg=data.settings?.homeBackground||'';
  home.style.backgroundImage=bg?`linear-gradient(rgba(7,7,10,.38),rgba(7,7,10,.52)),url("${bg}")`:'';
  home.classList.toggle('has-custom-bg',!!bg);
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
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{data.settings.homeBackground=await readImageFile(file);save();applyHomeBackground();toast('主界面背景已更换')}catch{toast('图片读取失败')}};
  input.click();
}
function clearHomeBackground(){data.settings.homeBackground='';save();applyHomeBackground();toast('已恢复主界面背景')}
function chooseChatBackground(){
  if(!currentChat)return;
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{getChatSettings(currentChat).background=await readImageFile(file);save();applyChatBackground();toast('聊天背景已更换')}catch{toast('图片读取失败')}};
  input.click();
}
function clearChatBackground(){if(!currentChat)return;getChatSettings(currentChat).background='';save();applyChatBackground();toast('已恢复聊天背景')}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active')}
function openView(id){show(id);if(id==='home')applyHomeBackground();if(id==='engine')engineTab('world');if(id==='chats')renderChats();if(id==='contacts')renderContacts();if(id==='feed')renderFeed();if(id==='notifications')renderNotifications();if(id==='world')renderWorld();if(id==='memory')renderMemory();if(id==='settings')loadSettings()}
function unlock(){show('home');clock();applyHomeBackground()}
function clock(){const d=new Date(),t=d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),days=['日','一','二','三','四','五','六'];document.getElementById('statusTime').textContent=t;document.getElementById('lockTime').textContent=t;document.getElementById('lockDate').textContent=`${d.getMonth()+1}月${d.getDate()}日 星期${days[d.getDay()]}`;const h=document.getElementById('homeClock');if(h)h.textContent=t;const hl=document.getElementById('homeClockLarge');if(hl)hl.textContent=t;const hd=document.getElementById('homeDate');if(hd)hd.textContent=`${d.getMonth()+1}月${d.getDate()}日 · 星期${days[d.getDay()]}`}
function setHomePage(n){const pages=[...document.querySelectorAll('.p12-page')];if(!pages.length)return;homePage=Math.max(0,Math.min(n,pages.length-1));pages.forEach((el,i)=>el.classList.toggle('active',i===homePage));const dots=document.getElementById('homeDots');if(dots)dots.innerHTML=pages.map((_,i)=>i===homePage?'<b>●</b>':'○').join(' ')}
function openHomeEditor(){document.getElementById('homeEditor')?.classList.add('on')}
function closeHomeEditor(){document.getElementById('homeEditor')?.classList.remove('on')}
function initHomeGestures(){const desk=document.getElementById('homeDesk');if(!desk)return;desk.addEventListener('touchstart',e=>{homeTouchX=e.touches[0].clientX},{passive:true});desk.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-homeTouchX;if(Math.abs(dx)>45)setHomePage(homePage+(dx<0?1:-1))},{passive:true})}

setInterval(clock,1000);clock();applyHomeBackground();initHomeGestures();

/* ---------- boot ---------- */
(function(){
  const boot=document.getElementById('bootScreen');
  if(!boot)return;
  setTimeout(()=>{boot.classList.add('done');setTimeout(()=>{if(boot.parentNode)boot.parentNode.removeChild(boot)},750);},2800);
})();

function avatar(c){const a=document.createElement('div');a.className='avatar';if(c.image){const im=document.createElement('img');im.src=c.image;im.alt='';im.loading='lazy';a.appendChild(im)}return a.outerHTML}

/* ---------- chats & contacts ---------- */
function renderChats(){const e=document.getElementById('chatList'),q=(document.getElementById('chatSearch')?.value||'').toLowerCase();const arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q));if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有聊天<br>请先创建角色。API 只在真正发送消息时使用。</div>`;return}e.innerHTML=arr.map(c=>{const m=(data.chats[c.id]||[]).at(-1);return `<div class="row card" style="margin:0 16px 9px;cursor:pointer" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px">${esc(m?.text||'尚未开始聊天')}</div></div><span class="muted">${esc(m?.time||'')}</span></div>`}).join('')}

function renderContacts(q=''){const e=document.getElementById('contactList'),arr=data.characters.filter(c=>(c.name||'').toLowerCase().includes(q.toLowerCase()));if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♧</div>还没有角色<br>创建角色后才会出现在这里。</div>`;return}e.innerHTML=arr.map(c=>`<div class="row card" style="margin:0 16px 9px;cursor:pointer" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.status||'')}</div></div><button class="icon-btn" onclick="event.stopPropagation();editCharacter('${c.id}')">⋯</button></div>`).join('')}

function validAPI(){const s=data.settings;return !!(s.apiBase&&s.apiKey&&s.apiModel)}
function requireAPI(){if(!validAPI()){toast('请先在设置中配置 API');openView('settings');return false}return true}

/* ---------- character CRUD ---------- */
function newCharacter(){modal(`<h2>创建角色</h2><div class="field"><label>角色名称</label><input id="cn" placeholder="你的角色名称"></div><div class="field"><label>状态</label><input id="cs" placeholder="短状态"></div><div class="field"><label>角色设定</label><textarea id="cb" placeholder="身份、性格、经历、说话方式、边界等。"></textarea></div><div class="field"><label>头像 URL（可选）</label><input id="ci" placeholder="https://..."></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createCharacter()">创建</button></div>`)}
function createCharacter(){const name=document.getElementById('cn').value.trim();if(!name)return toast('请填写角色名称');const id='c_'+crypto.randomUUID();data.characters.push({id,name,status:document.getElementById('cs').value.trim(),bio:document.getElementById('cb').value.trim(),image:document.getElementById('ci').value.trim()});data.chats[id]=[];data.chatSettings[id]={background:''};save();closeModal();renderContacts();toast('角色已创建')}
function editCharacter(id){const c=data.characters.find(x=>x.id===id);if(!c)return;modal(`<h2>角色资料</h2><div class="field"><label>名称</label><input id="cn" value="${attr(c.name)}"></div><div class="field"><label>状态</label><input id="cs" value="${attr(c.status||'')}"></div><div class="field"><label>角色设定</label><textarea id="cb">${esc(c.bio||'')}</textarea></div><div class="field"><label>头像 URL</label><input id="ci" value="${attr(c.image||'')}"></div><div class="form-actions"><button class="danger" onclick="deleteCharacter('${id}')">删除</button><button onclick="clearChat('${id}')">清空聊天</button><button class="primary" onclick="updateCharacter('${id}')">保存</button></div>`)}
function updateCharacter(id){const c=data.characters.find(x=>x.id===id);if(!c)return;c.name=document.getElementById('cn').value.trim()||c.name;c.status=document.getElementById('cs').value.trim();c.bio=document.getElementById('cb').value;c.image=document.getElementById('ci').value.trim();save();closeModal();renderContacts();renderChats();toast('已保存')}
function deleteCharacter(id){if(!confirm('删除角色以及本机保存的该角色聊天记录？'))return;data.characters=data.characters.filter(c=>c.id!==id);delete data.chats[id];delete data.chatSettings?.[id];save();closeModal();renderContacts();renderChats()}
function clearChat(id=currentChat){if(!id)return;if(!confirm('清空这个角色的全部聊天记录？'))return;data.chats[id]=[];save();if(currentChat===id)renderMessages();closeModal();renderChats();toast('聊天记录已清空')}

/* ---------- chat: FIXED openChat ---------- */
function openChat(id){
  currentChat=id;
  const c=data.characters.find(x=>x.id===id);
  if(!c)return;
  document.getElementById('chatName').textContent=c.name;
  const ava=document.getElementById('chatAvatar');
  ava.innerHTML='';
  if(c.image){const im=document.createElement('img');im.src=c.image;im.alt='';im.loading='lazy';ava.appendChild(im)}
  show('chat');
  renderMessages();
  if(!validAPI())toast('可以先聊天；发送消息前需要配置 API');
}

function renderMessages(){const e=document.getElementById('messages'),arr=data.chats[currentChat]||[];if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有消息<br>配置 API 后发送第一条消息。</div>`;return}
 e.innerHTML=arr.map((m,i)=>`<div class="msg ${m.role==='user'?'me':''}" data-idx="${i}" oncontextmenu="return showMsgMenu(event,${i})" ontouchstart="touchStartMsg(event,${i})" ontouchend="touchEndMsg(event)"><div class="bubble" onclick="showMsgMenu(event,${i})">${esc(m.text)}${m.edited?'<span style="opacity:.4;font-size:8px;margin-left:4px">(已编辑)</span>':''}</div><span class="msg-time">${esc(m.time||'')}</span></div>`).join('');
 const s=e.parentElement;if(s)s.scrollTop=s.scrollHeight}

/* ---------- message menu ---------- */
let msgTouchTimer=null;
function touchStartMsg(e,idx){msgTouchTimer=setTimeout(()=>{showMsgMenu(e,idx)},600)}
function touchEndMsg(e){clearTimeout(msgTouchTimer)}

function showMsgMenu(e,idx){e.preventDefault();e.stopPropagation();msgMenuTarget=idx;
 const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;
 modal(`<h2>消息操作</h2><div class="about-meta" style="margin:0 16px 14px"><div class="meta-row" style="padding:14px;cursor:pointer" onclick="copyMessage(${idx})"><span>📋 复制文本</span><span class="muted">›</span></div><div class="meta-row" style="padding:14px;cursor:pointer" onclick="editMessage(${idx})"><span>✎ 编辑消息</span><span class="muted">›</span></div><div class="meta-row" style="padding:14px;cursor:pointer;color:#cf8488" onclick="deleteMessage(${idx})"><span>🗑 删除消息</span><span class="muted">›</span></div></div><div class="form-actions"><button onclick="closeModal()">取消</button></div>`);
 return false}

function copyMessage(idx){const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;navigator.clipboard?.writeText(m.text).then(()=>toast('已复制到剪贴板')).catch(()=>{const ta=document.createElement('textarea');ta.value=m.text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('已复制')});closeModal()}
function editMessage(idx){const arr=data.chats[currentChat]||[];const m=arr[idx];if(!m)return;closeModal();setTimeout(()=>{modal(`<h2>编辑消息</h2><div class="field"><textarea id="editMsgText">${esc(m.text)}</textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveEditMessage(${idx})">保存</button></div>`)},50)}
function saveEditMessage(idx){const text=document.getElementById('editMsgText').value;if(!text.trim())return toast('内容不能为空');const arr=data.chats[currentChat];if(arr&&arr[idx]){arr[idx].text=text.trim();arr[idx].edited=true;save();renderMessages();toast('已编辑')}closeModal()}
function deleteMessage(idx){if(!confirm('删除这条消息？'))return;const arr=data.chats[currentChat];if(arr){arr.splice(idx,1);save();renderMessages();toast('已删除')}closeModal()}

/* ---------- API ---------- */
function normalizeBase(base){let b=String(base||'').trim().replace(/\/+$/, '');if(!b)return '';if(/\/chat\/completions$/i.test(b))return b;return b+'/chat/completions'}
function extractContent(j){const c=j?.choices?.[0]?.message?.content;if(typeof c==='string')return c;if(Array.isArray(c))return c.map(x=>typeof x==='string'?x:x?.text||'').join('');if(typeof j?.output_text==='string')return j.output_text;if(Array.isArray(j?.output))return j.output.flatMap(x=>x?.content||[]).map(x=>x?.text||'').join('');return ''}
function withTimeout(ms){const c=new AbortController();abortController=c;return c}
function stopGeneration(){if(abortController){abortController.abort();abortController=null;busy=false;setBusy(false);toast('已停止生成')}}
function setBusy(v){busy=v;const btn=document.querySelector('.send');if(btn){btn.disabled=v;btn.textContent=v?'■':'↑';btn.title=v?'停止生成':'发送'}const input=document.getElementById('messageInput');if(input)input.disabled=v}

async function testAPI(showMsg=true){const s=data.settings;if(!s.apiBase||!s.apiKey||!s.apiModel){if(showMsg)toast('请完整填写 API Base URL、Key 和模型');return false}const c=withTimeout(Number(s.timeout)||60000);try{const res=await fetch(normalizeBase(s.apiBase),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},signal:c.signal,body:JSON.stringify({model:s.apiModel,messages:[{role:'user',content:'Reply with OK only.'}],temperature:0,max_tokens:8})});if(!res.ok)throw Error('HTTP '+res.status);const j=await res.json();if(!extractContent(j))throw Error('empty');if(showMsg)toast('API 连接成功');return true}catch(e){if(e.name==='AbortError')return false;if(showMsg)toast('API 测试失败：'+(e.message||'请求错误'));return false}finally{if(abortController===c)abortController=null}}

function getRegexFlags(r){let f=r.flags||'g';if(typeof f==='string')return [...new Set(f.replace(/[^dgimsuvy]/g,''))].join('');return 'g'}
function applyRegexPipeline(text,target='AI 回复'){let out=String(text??'');for(const r of (data.engine.regexRules||[]).filter(x=>x.enabled!==false)){if(r.target&&r.target!==target&&r.target!=='全部消息')continue;try{out=out.replace(new RegExp(r.pattern,getRegexFlags(r)),r.replace??'')}catch{}}return out}
function regexPreflight(text){return applyRegexPipeline(text,'用户消息')}
function parseState(raw){const match=String(raw||'').match(/<state>([\s\S]*?)<\/state>/i);if(!match)return;for(const line of match[1].split(/\r?\n/)){const m=line.match(/^\s*([^=:#]+?)\s*[=:]\s*(.*?)\s*$/);if(m)data.engine.state[m[1].trim()]=m[2].trim()}}
function ruleMatches(r,input){if(r.enabled===false)return false;const hay=String(input||'').toLowerCase();const trig=String(r.trigger||'').trim();if(!trig)return true;const st=data.engine.state||{};if(trig.startsWith('/')&&trig.lastIndexOf('/')>0){const k=trig.lastIndexOf('/');try{return new RegExp(trig.slice(1,k),trig.slice(k+1)||'i').test(input)}catch{return false}}const parts=trig.split(/[|,，、]/).map(x=>x.trim().toLowerCase()).filter(Boolean);return parts.some(p=>hay.includes(p)||JSON.stringify(st).toLowerCase().includes(p))}
function template(s,ctx){return String(s??'').replace(/\{\{\s*(world|state|memory|character|message|role)\s*\}\}/gi,(_,k)=>ctx[k.toLowerCase()]??'')}
function buildEngineContext(character,userMessage=''){
 const st=data.engine.state||{};
 const rules=(data.engine.worldRules||[]).filter(r=>ruleMatches(r,userMessage)).sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
 const worldText=rules.map(r=>`【世界规则:${r.name}｜优先级${r.priority??0}】\n${template(r.content,{state:JSON.stringify(st),message:userMessage,character:character?.name||'',role:character?.bio||''})}`).join('\n\n');
 const memories=(data.memories||[]).slice(0,30).map(m=>`【记忆:${m.title}】${m.text}`).join('\n');
 const base={world:worldText||'当前没有命中的世界规则。',state:JSON.stringify(st,null,2),memory:memories||'暂无记忆',character:character?.bio||'',role:character?.bio||'',message:userMessage};
 const preset=(data.engine.presetModules||[]).filter(m=>m.enabled!==false).slice().sort((a,b)=>(Number(b.weight)||0)-(Number(a.weight)||0)).map(m=>`【${m.kind||'自定义'}:${m.name}|权重${m.weight??0}】\n${template(m.content,base)}`).join('\n\n');
 return {...base,preset,world:worldText||'当前没有命中的世界规则。'};
}
function buildSystemPrompt(c,userMessage=''){
 const x=buildEngineContext(c,userMessage);
 return `你正在"扑克机"中与用户进行沉浸式角色对话。\n你不是预置角色；当前角色资料完全来自用户。\n\n【角色】\n${c.name}\n${c.bio||'无'}\n\n【动态世界】\n${x.world}\n\n【世界状态】\n${x.state}\n\n【本地记忆】\n${x.memory}\n\n【预设编译结果】\n${x.preset||'无'}\n\n【执行原则】\n世界规则决定当前可用背景；预设模块负责组合与优先级；正则负责请求前处理、回复后处理和状态反馈。保持连续性，不虚构不存在的外部数据。`;
}

async function sendMessage(){
 if(busy){stopGeneration();return}
 if(!validAPI()){toast('API 未配置');openView('settings');return}
 const input=document.getElementById('messageInput'),raw=input.value.trim();if(!raw||!currentChat)return;
 const text=regexPreflight(raw);data.chats[currentChat]??=[];data.chats[currentChat].push({role:'user',text,time:time()});save();input.value='';renderMessages();setBusy(true);
 const c=data.characters.find(x=>x.id===currentChat),s=data.settings;
 const controller=withTimeout(Number(s.timeout)||60000);
 try{
  const history=data.chats[currentChat].slice(-Math.max(4,Number(s.maxHistory)||40)).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
  const system=buildSystemPrompt(c,text);
  const body={model:s.apiModel,messages:[{role:'system',content:system},...history],temperature:Math.min(2,Math.max(0,Number(s.temperature)||.8))};
  const res=await fetch(normalizeBase(s.apiBase),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},signal:controller.signal,body:JSON.stringify(body)});
  if(!res.ok){let detail='';try{detail=await res.text()}catch{}throw Error('HTTP '+res.status+(detail?' · '+detail.slice(0,160):''))}
  const j=await res.json();const rawReply=extractContent(j);if(!rawReply)throw Error('empty response');
  parseState(rawReply);
  const reply=applyRegexPipeline(rawReply,'AI 回复').replace(/<state>[\s\S]*?<\/state>/gi,'').trim();
  data.chats[currentChat].push({role:'assistant',text:reply||rawReply,time:time()});data.notifications.unshift({text:`${c.name}回复了你`,time:'刚刚',type:'chat'});save();renderMessages();
 }catch(err){if(err.name==='AbortError'){toast('已停止生成');}else{toast('API 请求失败：'+(err.message||'请检查地址、Key 和模型'));renderMessages()}}
 finally{if(abortController===controller)abortController=null;setBusy(false)}
}

/* ---------- feed ---------- */
function newPost(){if(!data.characters.length)return toast('请先创建角色');modal(`<h2>发布动态</h2><div class="field"><label>发布角色</label><select id="pc">${data.characters.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>动态内容</label><textarea id="pt" placeholder="内容由你填写，不会自动生成。"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createPost()">发布</button></div>`)}
function createPost(){const text=document.getElementById('pt').value.trim();if(!text)return toast('请输入内容');data.posts.unshift({id:'p_'+crypto.randomUUID(),char:document.getElementById('pc').value,text,time:'刚刚',likes:0});save();closeModal();renderFeed()}
function renderFeed(){const e=document.getElementById('feedList');if(!data.posts.length){e.innerHTML='<div class="empty"><div class="big">◌</div>还没有动态<br>这里不会预置任何角色内容。</div>';return}e.innerHTML=data.posts.map(p=>{const c=data.characters.find(x=>x.id===p.char);if(!c)return '';return `<article class="feed-card card"><div class="feed-top">${avatar(c)}<div><b>${esc(c.name)}</b><div class="muted">${esc(p.time)}</div></div></div><div class="feed-text">${esc(p.text)}</div><div class="feed-actions"><button onclick="like('${p.id}')">♡ ${p.likes||0}</button><button onclick="toast('评论功能将在下一版接入')">○ 评论</button></div></article>`}).join('')||'<div class="empty">暂无动态</div>'}
function like(id){const p=data.posts.find(x=>x.id===id);if(!p)return;p.likes=(p.likes||0)+1;save();renderFeed()}
function renderNotifications(){const e=document.getElementById('notificationList');if(!data.notifications.length){e.innerHTML='<div class="empty"><div class="big">♢</div>暂无通知</div>';return}e.innerHTML=data.notifications.map(n=>`<div class="row card" style="margin-bottom:9px"><span>${n.type==='chat'?'♡':'◌'}</span><div style="flex:1">${esc(n.text)}<div class="muted" style="margin-top:3px">${esc(n.time)}</div></div></div>`).join('')}
function clearNotifications(){data.notifications=[];save();renderNotifications();toast('已清空')}

/* ---------- world & memory ---------- */
function newWorld(){modal(`<h2>创建世界</h2><div class="field"><label>名称</label><input id="wn"></div><div class="field"><label>描述</label><textarea id="wd"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createWorld()">创建</button></div>`)}
function createWorld(){const n=document.getElementById('wn').value.trim();if(!n)return toast('请填写名称');data.worlds.push({id:'w_'+crypto.randomUUID(),name:n,desc:document.getElementById('wd').value});save();closeModal();renderWorld()}
function renderWorld(){const e=document.getElementById('worldList');if(!data.worlds.length){e.innerHTML='<div class="empty"><div class="big">✦</div>还没有世界设定</div>';return}e.innerHTML=data.worlds.map(w=>`<div class="card" style="padding:15px;margin-bottom:10px"><b>${esc(w.name)}</b><div class="muted" style="line-height:1.7;margin-top:7px">${esc(w.desc||'')}</div></div>`).join('')}
function newMemory(){modal(`<h2>保存记忆</h2><div class="field"><label>标题</label><input id="mn"></div><div class="field"><label>内容</label><textarea id="mt"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createMemory()">保存</button></div>`)}
function createMemory(){const n=document.getElementById('mn').value.trim();if(!n)return toast('请填写标题');data.memories.unshift({id:'m_'+crypto.randomUUID(),title:n,text:document.getElementById('mt').value,time:'刚刚'});save();closeModal();renderMemory()}
function renderMemory(){const e=document.getElementById('memoryList');if(!data.memories.length){e.innerHTML='<div class="empty"><div class="big">⌁</div>还没有保存的记忆</div>';return}e.innerHTML=data.memories.map(m=>`<div class="card" style="padding:15px;margin-bottom:10px"><b>${esc(m.title)}</b><div class="muted" style="line-height:1.7;margin-top:7px">${esc(m.text)}</div><div class="muted" style="margin-top:7px">${esc(m.time||'')}</div></div>`).join('')}

/* ---------- engine ---------- */
function engineTab(tab){['world','preset','regex','preview'].forEach(x=>document.getElementById('tab'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('on',x===tab));const e=document.getElementById('engineBody');if(tab==='world')renderEngineWorld(e);if(tab==='preset')renderEnginePreset(e);if(tab==='regex')renderEngineRegex(e);if(tab==='preview')renderEnginePreview(e)}
function renderEngineWorld(e){const rules=data.engine.worldRules||[],st=data.engine.state||{};e.innerHTML=`<div class="engine-card"><h3>♠ &nbsp;动态世界</h3><p>世界规则不再全部无条件塞进 Prompt。每条规则可以按关键词、状态或正则触发，并按优先级参与本次上下文。</p><div class="engine-flow"><div class="flowbox"><b>世界状态</b><span>地点：${esc(st.location||'未设置')}<br>天气：${esc(st.weather||'未设置')}<br>时间：${esc(st.time||'未设置')}</span></div><div class="flowbox"><b>当前规则</b><span>${rules.filter(x=>x.enabled!==false).length} 条</span></div></div><button class="primary" style="margin-top:10px" onclick="newWorldRule()">＋ 新建世界规则</button></div><div class="engine-card"><h3>♠ &nbsp;世界规则</h3>${rules.length?rules.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${r.enabled===false?'停用':'启用'} · ${r.priority??0}</span></div><small>${esc(r.trigger||'始终')}</small><div class="muted" style="margin-top:6px">${esc(r.content||'')}</div><div style="margin-top:9px;display:flex;gap:7px"><button class="icon-btn" onclick="editWorldRule(${i})">⋯</button><button class="icon-btn" onclick="toggleWorldRule(${i})">◉</button></div></div>`).join(''):'<div class="empty">还没有世界规则。</div>'}</div>`}
function newWorldRule(){modal(`<h2>世界规则</h2><div class="field"><label>名称</label><input id="erN"></div><div class="field"><label>触发条件</label><input id="erT" placeholder="留空=始终；也可写词语或 /正则/i"></div><div class="field"><label>注入内容</label><textarea id="erC" placeholder="支持 {{state}} {{message}} {{character}}"></textarea></div><div class="field"><label>优先级</label><input id="erP" type="number" value="80"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveWorldRule()">保存</button></div>`)}
function saveWorldRule(idx=null){const r={name:document.getElementById('erN').value.trim(),trigger:document.getElementById('erT').value.trim(),content:document.getElementById('erC').value,priority:Number(document.getElementById('erP').value)||80,enabled:true};if(!r.name)return toast('请填写名称');if(idx===null)data.engine.worldRules.push(r);else data.engine.worldRules[idx]={...data.engine.worldRules[idx],...r};save();closeModal();engineTab('world')}
function editWorldRule(i){const r=data.engine.worldRules[i];modal(`<h2>编辑世界规则</h2><div class="field"><label>名称</label><input id="erN" value="${attr(r.name)}"></div><div class="field"><label>触发条件</label><input id="erT" value="${attr(r.trigger||'')}"></div><div class="field"><label>注入内容</label><textarea id="erC">${esc(r.content||'')}</textarea></div><div class="field"><label>优先级</label><input id="erP" type="number" value="${r.priority||80}"></div><div class="form-actions"><button class="danger" onclick="data.engine.worldRules.splice(${i},1);save();closeModal();engineTab('world')">删除</button><button class="primary" onclick="saveWorldRule(${i})">保存</button></div>`)}
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
function loadSettings(){applyHomeBackground();['apiBase','apiKey','apiModel','temperature','maxHistory','timeout'].forEach(k=>{const el=document.getElementById(k);if(el)el.value=data.settings[k]??''})}
async function saveSettings(){data.settings={...data.settings,apiBase:document.getElementById('apiBase').value.trim(),apiKey:document.getElementById('apiKey').value.trim(),apiModel:document.getElementById('apiModel').value.trim(),temperature:document.getElementById('temperature').value||.8,maxHistory:Math.min(100,Math.max(4,Number(document.getElementById('maxHistory')?.value)||40)),timeout:Math.min(180000,Math.max(10000,Number(document.getElementById('timeout')?.value)||60000))};save();if(!validAPI()){toast('已保存本机设置；请完整填写 API 后测试');return}await testAPI(true)}
function exportSJ(){const copy=JSON.parse(JSON.stringify(data));if(copy.settings){delete copy.settings.apiKey;delete copy.settings.key;delete copy.settings.token}const blob=new Blob([JSON.stringify({format:'pokeji',version:VERSION,exportedAt:new Date().toISOString(),data:copy},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pokeji-data-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('数据已导出（API Key 未包含）')}
function importSJ(ev){const file=ev.target.files?.[0];if(!file)return;file.text().then(txt=>{try{const obj=JSON.parse(txt);if(obj?.format!=='pokeji'||!obj.data)throw Error('invalid');const incoming=normalize(obj.data);if(!Array.isArray(incoming.characters)||typeof incoming.chats!=='object')throw Error('invalid');if(!confirm('导入将覆盖当前本机数据。API Key 不会从文件恢复。继续吗？'))return;const oldKey=data.settings?.apiKey;data=incoming;if(oldKey)data.settings.apiKey=oldKey;save();location.reload()}catch(e){toast('无法导入：文件格式不正确')}}).finally(()=>{ev.target.value=''})}
function exportData(){exportSJ()}
function importData(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=ev=>importSJ(ev);i.click()}
function resetData(){if(confirm('确定清空本机全部数据吗？此操作不可恢复。')){localStorage.removeItem(STORE);localStorage.removeItem(LEGACY_STORE);location.reload()}}
function chatInfo(){const c=data.characters.find(x=>x.id===currentChat);if(!c)return;modal(`<h2>${esc(c.name)}</h2><div class="note"><b>状态</b><br>${esc(c.status||'未填写')}<br><br><b>角色设定</b><br>${esc(c.bio||'未填写')}</div><div class="group" style="margin:14px 0"><div class="group-title">聊天外观</div><div class="setting" onclick="chooseChatBackground()"><span>更换聊天背景</span><span class="muted">图片 ›</span></div><div class="setting" onclick="clearChatBackground()"><span>恢复默认聊天背景</span><span class="muted">›</span></div></div><div class="form-actions"><button onclick="closeModal()">关闭</button><button class="danger" onclick="clearChat('${c.id}')">清空聊天</button></div>`)}

/* ---------- about ---------- */
function about(){
  modal(`
    <div class="about-sheet">
      <div class="about-icon">♠</div>
      <div class="about-title">扑克机</div>
      <div class="about-version">Version 15 · Build ${VERSION}</div>
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
window.addEventListener('beforeunload',()=>{if(busy&&abortController)abortController.abort()});
