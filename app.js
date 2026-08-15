
const STORE='pokeji_api_only_v2';
let data=load();
let currentChat=null;
function blank(){return{settings:{apiBase:'',apiKey:'',apiModel:'',temperature:.8},characters:[],chats:{},posts:[],notifications:[],worlds:[],memories:[],engine:{worldRules:[],presetModules:[],regexRules:[],state:{location:'',time:'',weather:'',events:[]}}}}

function exportSJ(){
 const copy=JSON.parse(JSON.stringify(data));
 // Never export secret credentials by default.
 if(copy.settings){delete copy.settings.apiKey;delete copy.settings.key;delete copy.settings.token}
 const blob=new Blob([JSON.stringify({format:'pokeji',version:5,exportedAt:new Date().toISOString(),data:copy},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pokeji-data-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 toast('数据已导出');
}
function importSJ(ev){
 const file=ev.target.files?.[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{
   const obj=JSON.parse(reader.result);
   if(obj?.format!=='pokeji' || !obj.data)throw Error('invalid');
   const incoming=obj.data;
   if(!Array.isArray(incoming.characters)||!Array.isArray(incoming.chats))throw Error('invalid');
   const ok=confirm('检测到扑克机数据文件。\\n\\n确定后将覆盖当前本地数据。\\nAPI Key 不会从导出文件恢复。');
   if(!ok)return;
   const oldKey=data.settings?.apiKey;
   data=incoming;
   data.engine??={worldRules:[],presetModules:[],regexRules:[],state:{location:'',time:'',weather:'',events:[]}};
   data.settings??={};
   if(oldKey)data.settings.apiKey=oldKey;
   save();location.reload();
  }catch(e){toast('无法导入：文件格式不正确')}
  finally{ev.target.value=''}
 };
 reader.readAsText(file);
}

function load(){try{const x=JSON.parse(localStorage.getItem(STORE));if(x&&x.characters&&x.chats){x.engine??={worldRules:[],presetModules:[],regexRules:[],state:{location:'',time:'',weather:'',events:[]}};x.engine.worldRules??=[];x.engine.presetModules??=[];x.engine.regexRules??=[];x.engine.state??={location:'',time:'',weather:'',events:[]};return x}return blank()}catch{return blank()}}
function save(){localStorage.setItem(STORE,JSON.stringify(data))}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(x){return esc(x).replace(/`/g,'&#96;')}
function time(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove('show'),1800)}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active')}
function openView(id){show(id);if(id==='engine')engineTab('world');if(id==='chats')renderChats();if(id==='contacts')renderContacts();if(id==='feed')renderFeed();if(id==='notifications')renderNotifications();if(id==='world')renderWorld();if(id==='memory')renderMemory();if(id==='settings')loadSettings()}
function unlock(){show('home');clock()}
function clock(){const d=new Date(),t=d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),days=['日','一','二','三','四','五','六'];document.getElementById('statusTime').textContent=t;document.getElementById('lockTime').textContent=t;document.getElementById('lockDate').textContent=`${d.getMonth()+1}月${d.getDate()}日 星期${days[d.getDay()]}`;document.getElementById('homeDate').textContent=`${d.getMonth()+1}月${d.getDate()}日 · 星期${days[d.getDay()]}`}
setInterval(clock,1000);clock();

function avatar(c){const a=document.createElement('div');a.className='avatar';if(c.image){const im=document.createElement('img');im.src=c.image;a.appendChild(im)}return a.outerHTML}
function renderChats(){
 const e=document.getElementById('chatList'),q=(document.getElementById('chatSearch')?.value||'').toLowerCase();
 const arr=data.characters.filter(c=>c.name.toLowerCase().includes(q));
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有聊天<br>请先创建角色并配置 API。</div>`;return}
 e.innerHTML=arr.map(c=>{const m=(data.chats[c.id]||[]).at(-1);return `<div class="row card" style="margin:0 16px 9px" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px">${esc(m?.text||'尚未开始聊天')}</div></div><span class="muted">${esc(m?.time||'')}</span></div>`}).join('')
}
function renderContacts(q=''){
 const e=document.getElementById('contactList'),arr=data.characters.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
 if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♧</div>还没有角色<br>点击右上角 ＋ 创建你的第一个角色。</div>`;return}
 e.innerHTML=arr.map(c=>`<div class="row card" style="margin:0 16px 9px" onclick="openChat('${c.id}')">${avatar(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><div class="muted" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.status||'')}</div></div><button class="icon-btn" onclick="event.stopPropagation();editCharacter('${c.id}')">⋯</button></div>`).join('')
}
function requireAPI(){if(!validAPI()){toast('请先在设置中配置并测试 API');openView('settings');return false}return true}
function validAPI(){return !!(data.settings.apiBase&&data.settings.apiKey&&data.settings.apiModel)}
function newCharacter(){
 modal(`<h2>创建角色</h2><div class="field"><label>角色名称</label><input id="cn" placeholder="例如：某个角色"></div><div class="field"><label>状态</label><input id="cs" placeholder="显示在角色列表中的短状态"></div><div class="field"><label>角色设定</label><textarea id="cb" placeholder="身份、性格、经历、说话方式等。这里的数据会作为扑克机自己的角色资料。"></textarea></div><div class="field"><label>头像 URL（可选）</label><input id="ci" placeholder="https://..."></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createCharacter()">创建</button></div>`)
}
function createCharacter(){
 if(!requireAPI())return;const name=document.getElementById('cn').value.trim();if(!name)return toast('请填写角色名称');
 const id='c_'+crypto.randomUUID();data.characters.push({id,name,status:document.getElementById('cs').value.trim(),bio:document.getElementById('cb').value.trim(),image:document.getElementById('ci').value.trim()});data.chats[id]=[];save();closeModal();renderContacts();toast('角色已创建')
}
function editCharacter(id){const c=data.characters.find(x=>x.id===id);modal(`<h2>角色资料</h2><div class="field"><label>名称</label><input id="cn" value="${attr(c.name)}"></div><div class="field"><label>状态</label><input id="cs" value="${attr(c.status||'')}"></div><div class="field"><label>角色设定</label><textarea id="cb">${esc(c.bio||'')}</textarea></div><div class="field"><label>头像 URL</label><input id="ci" value="${attr(c.image||'')}"></div><div class="form-actions"><button class="danger" onclick="deleteCharacter('${id}')">删除</button><button class="primary" onclick="updateCharacter('${id}')">保存</button></div>`)}
function updateCharacter(id){const c=data.characters.find(x=>x.id===id);c.name=document.getElementById('cn').value.trim()||c.name;c.status=document.getElementById('cs').value.trim();c.bio=document.getElementById('cb').value;c.image=document.getElementById('ci').value.trim();save();closeModal();renderContacts();toast('已保存')}
function deleteCharacter(id){if(!confirm('删除角色以及本机保存的该角色聊天记录？'))return;data.characters=data.characters.filter(c=>c.id!==id);delete data.chats[id];save();closeModal();renderContacts();renderChats()}
function openChat(id){if(!requireAPI())return;const c=data.characters.find(x=>x.id===id);if(!c)return;currentChat=id;document.getElementById('chatName').textContent=c.name;document.getElementById('chatAvatar').outerHTML=avatar(c);show('chat');renderMessages()}
function renderMessages(){const e=document.getElementById('messages'),arr=data.chats[currentChat]||[];if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>还没有消息<br>发送第一条消息，AI 才会开始回应。</div>`;return}e.innerHTML=arr.map(m=>`<div class="msg ${m.role==='user'?'me':''}"><div class="bubble">${esc(m.text)}</div><span class="msg-time">${esc(m.time||'')}</span></div>`).join('');const s=e.parentElement;s.scrollTop=s.scrollHeight}
async function sendMessage(){
 if(!validAPI()){toast('API 未配置');return}const input=document.getElementById('messageInput'),text=input.value.trim();if(!text||!currentChat)return;
 data.chats[currentChat]??=[];data.chats[currentChat].push({role:'user',text,time:time()});save();input.value='';renderMessages();
 const c=data.characters.find(x=>x.id===currentChat);const s=data.settings;
 try{
  const base=s.apiBase.replace(/\/$/,'');const url=base.endsWith('/chat/completions')?base:base+'/chat/completions';
  const history=data.chats[currentChat].slice(-30).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
  const system=buildSystemPrompt(c);
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},body:JSON.stringify({model:s.apiModel,messages:[{role:'system',content:system},...history],temperature:Number(s.temperature)||.8})});
  if(!res.ok)throw Error('HTTP '+res.status);const j=await res.json();const rawReply=j.choices?.[0]?.message?.content;if(!rawReply)throw Error('empty');
  const reply=applyRegexPipeline(rawReply);
  // Optional state feedback: a deliberately generic parser for user-defined world rules.
  const stateMatch=rawReply.match(/<state>([\s\S]*?)<\/state>/i);if(stateMatch){for(const line of stateMatch[1].split(/\n/)){const m=line.match(/^\s*([^=:#]+)\s*[=:]\s*(.*?)\s*$/);if(m)data.engine.state[m[1].trim()]=m[2].trim();}}
  data.chats[currentChat].push({role:'assistant',text:reply,time:time()});data.notifications.unshift({text:`${c.name}回复了你`,time:'刚刚',type:'chat'});save();renderMessages();
 }catch(err){toast('API 请求失败：请检查地址、Key 和模型');renderMessages()}
}
function newPost(){if(!requireAPI())return;if(!data.characters.length)return toast('请先创建角色');modal(`<h2>发布动态</h2><div class="field"><label>发布角色</label><select id="pc">${data.characters.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>动态内容</label><textarea id="pt" placeholder="内容由你填写；此页面不会自动生成虚构动态。"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createPost()">发布</button></div>`)}
function createPost(){const text=document.getElementById('pt').value.trim();if(!text)return toast('请输入内容');data.posts.unshift({id:'p_'+crypto.randomUUID(),char:document.getElementById('pc').value,text,time:'刚刚',likes:0});save();closeModal();renderFeed()}
function renderFeed(){const e=document.getElementById('feedList');if(!data.posts.length){e.innerHTML=`<div class="empty"><div class="big">◌</div>还没有动态<br>这里不会预置任何角色内容。</div>`;return}e.innerHTML=data.posts.map(p=>{const c=data.characters.find(x=>x.id===p.char);if(!c)return '';return `<article class="feed-card card"><div class="feed-top">${avatar(c)}<div><b>${esc(c.name)}</b><div class="muted">${esc(p.time)}</div></div></div><div class="feed-text">${esc(p.text)}</div><div class="feed-actions"><button onclick="like('${p.id}')">♡ ${p.likes||0}</button><button onclick="toast('评论功能待接入')">○ 评论</button></div></article>`}).join('')||`<div class="empty">暂无动态</div>`}
function like(id){const p=data.posts.find(x=>x.id===id);p.likes=(p.likes||0)+1;save();renderFeed()}
function renderNotifications(){const e=document.getElementById('notificationList');if(!data.notifications.length){e.innerHTML='<div class="empty"><div class="big">♢</div>暂无通知</div>';return}e.innerHTML=data.notifications.map(n=>`<div class="row card" style="margin-bottom:9px"><span>${n.type==='chat'?'♡':'◌'}</span><div style="flex:1">${esc(n.text)}<div class="muted" style="margin-top:3px">${esc(n.time)}</div></div></div>`).join('')}
function clearNotifications(){data.notifications=[];save();renderNotifications();toast('已清空')}
function newWorld(){modal(`<h2>创建世界</h2><div class="field"><label>名称</label><input id="wn"></div><div class="field"><label>描述</label><textarea id="wd"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createWorld()">创建</button></div>`)}
function createWorld(){const n=document.getElementById('wn').value.trim();if(!n)return toast('请填写名称');data.worlds.push({id:'w_'+crypto.randomUUID(),name:n,desc:document.getElementById('wd').value});save();closeModal();renderWorld()}
function renderWorld(){const e=document.getElementById('worldList');if(!data.worlds.length){e.innerHTML='<div class="empty"><div class="big">✦</div>还没有世界设定</div>';return}e.innerHTML=data.worlds.map(w=>`<div class="card" style="padding:15px;margin-bottom:10px"><b>${esc(w.name)}</b><div class="muted" style="line-height:1.7;margin-top:7px">${esc(w.desc||'')}</div></div>`).join('')}
function newMemory(){modal(`<h2>保存记忆</h2><div class="field"><label>标题</label><input id="mn"></div><div class="field"><label>内容</label><textarea id="mt"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createMemory()">保存</button></div>`)}
function createMemory(){const n=document.getElementById('mn').value.trim();if(!n)return toast('请填写标题');data.memories.unshift({id:'m_'+crypto.randomUUID(),title:n,text:document.getElementById('mt').value,time:'刚刚'});save();closeModal();renderMemory()}
function renderMemory(){const e=document.getElementById('memoryList');if(!data.memories.length){e.innerHTML='<div class="empty"><div class="big">⌁</div>还没有保存的记忆</div>';return}e.innerHTML=data.memories.map(m=>`<div class="card" style="padding:15px;margin-bottom:10px"><b>${esc(m.title)}</b><div class="muted" style="line-height:1.7;margin-top:7px">${esc(m.text)}</div><div class="muted" style="margin-top:7px">${esc(m.time||'')}</div></div>`).join('')}

function engineTab(tab){
 ['world','preset','regex','preview'].forEach(x=>document.getElementById('tab'+x[0].toUpperCase()+x.slice(1)).classList.toggle('on',x===tab));
 const e=document.getElementById('engineBody');
 if(tab==='world')renderEngineWorld(e);
 if(tab==='preset')renderEnginePreset(e);
 if(tab==='regex')renderEngineRegex(e);
 if(tab==='preview')renderEnginePreview(e);
}
function renderEngineWorld(e){
 const rules=data.engine.worldRules||[], st=data.engine.state||{};
 e.innerHTML=`<div class="engine-card"><h3>♠ &nbsp;动态世界</h3><p>世界不是静态资料库。它可以根据消息、时间、地点和规则参与上下文组装，并把状态交给预设。</p>
 <div class="engine-flow"><div class="flowbox"><b>世界状态</b><span>地点：${esc(st.location||'未设置')}<br>天气：${esc(st.weather||'未设置')}<br>时间：${esc(st.time||'未设置')}</span></div><div class="flowbox"><b>激活条目</b><span>${rules.filter(x=>x.enabled!==false).length} 个</span></div></div>
 <button class="primary" style="margin-top:10px" onclick="newWorldRule()">＋ 新建世界规则</button></div>
 <div class="engine-card"><h3>♠ &nbsp;世界规则</h3>${rules.length?rules.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${r.enabled===false?'停用':'启用'}</span></div><small>${esc(r.trigger||'无触发条件')}</small><div class="muted" style="margin-top:6px">${esc(r.content||'')}</div><div style="margin-top:9px;display:flex;gap:7px"><button class="icon-btn" onclick="editWorldRule(${i})">⋯</button><button class="icon-btn" onclick="toggleWorldRule(${i})">◉</button></div></div>`).join(''):'<div class="empty">还没有世界规则。</div>'}</div>`;
}
function newWorldRule(){modal(`<h2>世界规则</h2><div class="field"><label>名称</label><input id="erN"></div><div class="field"><label>触发条件</label><input id="erT" placeholder="关键词、状态或简单条件"></div><div class="field"><label>注入内容</label><textarea id="erC"></textarea></div><div class="field"><label>优先级</label><input id="erP" type="number" value="80"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveWorldRule()">保存</button></div>`)}
function saveWorldRule(idx=null){const r={name:document.getElementById('erN').value.trim(),trigger:document.getElementById('erT').value.trim(),content:document.getElementById('erC').value,priority:Number(document.getElementById('erP').value)||80,enabled:true};if(!r.name)return toast('请填写名称');if(idx===null)data.engine.worldRules.push(r);else data.engine.worldRules[idx]={...data.engine.worldRules[idx],...r};save();closeModal();engineTab('world')}
function editWorldRule(i){const r=data.engine.worldRules[i];modal(`<h2>编辑世界规则</h2><div class="field"><label>名称</label><input id="erN" value="${attr(r.name)}"></div><div class="field"><label>触发条件</label><input id="erT" value="${attr(r.trigger||'')}"></div><div class="field"><label>注入内容</label><textarea id="erC">${esc(r.content||'')}</textarea></div><div class="field"><label>优先级</label><input id="erP" type="number" value="${r.priority||80}"></div><div class="form-actions"><button class="danger" onclick="data.engine.worldRules.splice(${i},1);save();closeModal();engineTab('world')">删除</button><button class="primary" onclick="saveWorldRule(${i})">保存</button></div>`)}
function toggleWorldRule(i){data.engine.worldRules[i].enabled=data.engine.worldRules[i].enabled===false;save();engineTab('world')}
function renderEnginePreset(e){
 const ms=data.engine.presetModules||[];
 e.innerHTML=`<div class="engine-card"><h3>♣ &nbsp;预设编译器</h3><p>预设由模块组成。世界状态、记忆和正则结果都可以进入编译过程，而不是固定成一段 Prompt。</p><div class="engine-flow"><div class="flowbox"><b>世界</b><span>动态注入</span></div><div class="flowbox"><b>预设</b><span>组合上下文</span></div><div class="flowbox"><b>API</b><span>生成回复</span></div><div class="flowbox"><b>正则</b><span>解析并反馈</span></div></div><button class="primary" style="margin-top:10px" onclick="newPresetModule()">＋ 新建模块</button></div>
<div class="engine-card"><h3>♣ &nbsp;模块顺序</h3>${ms.length?ms.map((m,i)=>`<div class="module"><div class="module-head"><b>${esc(m.name)}</b><span class="pill">权重 ${m.weight}</span></div><small>${esc(m.kind)} · ${m.enabled===false?'停用':'启用'}</small><div style="margin-top:7px;color:#777;font-size:11px">${esc(m.content||'')}</div><div style="margin-top:8px;display:flex;gap:6px"><button class="icon-btn" onclick="movePreset(${i},-1)">↑</button><button class="icon-btn" onclick="movePreset(${i},1)">↓</button><button class="icon-btn" onclick="editPreset(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有预设模块。</div>'}</div>`;
}
function newPresetModule(){modal(`<h2>预设模块</h2><div class="field"><label>名称</label><input id="pmN"></div><div class="field"><label>类型</label><select id="pmK"><option>身份层</option><option>世界层</option><option>角色层</option><option>行为规则</option><option>风格层</option><option>输出格式</option><option>记忆层</option><option>动态上下文</option><option>自定义</option></select></div><div class="field"><label>权重</label><input id="pmW" type="number" value="80"></div><div class="field"><label>内容</label><textarea id="pmC"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="savePreset()">保存</button></div>`)}
function savePreset(idx=null){const m={name:document.getElementById('pmN').value.trim(),kind:document.getElementById('pmK').value,weight:Number(document.getElementById('pmW').value)||80,content:document.getElementById('pmC').value,enabled:true};if(!m.name)return toast('请填写名称');if(idx===null)data.engine.presetModules.push(m);else data.engine.presetModules[idx]={...data.engine.presetModules[idx],...m};save();closeModal();engineTab('preset')}
function editPreset(i){const m=data.engine.presetModules[i];modal(`<h2>编辑预设模块</h2><div class="field"><label>名称</label><input id="pmN" value="${attr(m.name)}"></div><div class="field"><label>类型</label><select id="pmK">${['身份层','世界层','角色层','行为规则','风格层','输出格式','记忆层','动态上下文','自定义'].map(x=>`<option ${x===m.kind?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>权重</label><input id="pmW" type="number" value="${m.weight}"></div><div class="field"><label>内容</label><textarea id="pmC">${esc(m.content||'')}</textarea></div><div class="form-actions"><button class="danger" onclick="data.engine.presetModules.splice(${i},1);save();closeModal();engineTab('preset')">删除</button><button class="primary" onclick="savePreset(${i})">保存</button></div>`)}
function movePreset(i,d){const a=data.engine.presetModules,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();engineTab('preset')}
function renderEngineRegex(e){
 const rs=data.engine.regexRules||[];
 e.innerHTML=`<div class="engine-card"><h3>♦ &nbsp;正则处理管线</h3><p>API 原始输出先经过规则链，再决定显示内容与状态变化。规则也可以向世界状态反馈。</p><div class="engine-flow"><div class="flowbox"><b>API 原始输出</b><span>Raw</span></div><div class="flowbox"><b>规则链</b><span>${rs.length} 条</span></div><div class="flowbox"><b>世界反馈</b><span>状态解析</span></div><div class="flowbox"><b>最终消息</b><span>Display</span></div></div><button class="primary" style="margin-top:10px" onclick="newRegexRule()">＋ 新建规则</button></div>
<div class="engine-card"><h3>♦ &nbsp;规则链</h3>${rs.length?rs.map((r,i)=>`<div class="module"><div class="module-head"><b>${esc(r.name)}</b><span class="pill">${esc(r.target)}</span></div><small>${r.enabled===false?'停用':'启用'} · 顺序 ${i+1}</small><div class="muted" style="margin-top:6px">/${esc(r.pattern)}/ → ${esc(r.replace)}</div><div style="margin-top:8px"><button class="icon-btn" onclick="editRegex(${i})">⋯</button></div></div>`).join(''):'<div class="empty">还没有正则规则。</div>'}</div>`;
}
function newRegexRule(){modal(`<h2>正则规则</h2><div class="field"><label>名称</label><input id="rxN"></div><div class="field"><label>匹配模式</label><input id="rxP" placeholder="例如：<state>([\\s\\S]*?)</state>"></div><div class="field"><label>替换内容</label><input id="rxR"></div><div class="field"><label>处理对象</label><select id="rxT"><option>AI 回复</option><option>用户消息</option><option>全部消息</option><option>状态解析</option></select></div><div class="field"><label>全局匹配</label><select id="rxG"><option value="g">是</option><option value="">否</option></select></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveRegex()">保存</button></div>`)}
function saveRegex(idx=null){const r={name:document.getElementById('rxN').value.trim(),pattern:document.getElementById('rxP').value,replace:document.getElementById('rxR').value,target:document.getElementById('rxT').value,flags:document.getElementById('rxG').value,enabled:true};if(!r.name||!r.pattern)return toast('名称和匹配模式不能为空');try{new RegExp(r.pattern,r.flags||'')}catch{return toast('正则表达式无效')}if(idx===null)data.engine.regexRules.push(r);else data.engine.regexRules[idx]={...data.engine.regexRules[idx],...r};save();closeModal();engineTab('regex')}
function editRegex(i){const r=data.engine.regexRules[i];modal(`<h2>编辑正则规则</h2><div class="field"><label>名称</label><input id="rxN" value="${attr(r.name)}"></div><div class="field"><label>匹配模式</label><input id="rxP" value="${attr(r.pattern)}"></div><div class="field"><label>替换内容</label><input id="rxR" value="${attr(r.replace)}"></div><div class="field"><label>处理对象</label><select id="rxT">${['AI 回复','用户消息','全部消息','状态解析'].map(x=>`<option ${x===r.target?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>全局匹配</label><select id="rxG"><option value="g" ${r.flags?.includes('g')?'selected':''}>是</option><option value="" ${!r.flags?.includes('g')?'selected':''}>否</option></select></div><div class="form-actions"><button class="danger" onclick="data.engine.regexRules.splice(${i},1);save();closeModal();engineTab('regex')">删除</button><button class="primary" onclick="saveRegex(${i})">保存</button></div>`)}
function buildEngineContext(character){
 const st=data.engine.state||{}, world=(data.engine.worldRules||[]).filter(r=>r.enabled!==false).sort((a,b)=>(b.priority||0)-(a.priority||0));
 const worldText=world.map(r=>`【世界规则:${r.name}】${r.content}`).join('\\n');
 const memories=(data.memories||[]).slice(0,20).map(m=>`【记忆:${m.title}】${m.text}`).join('\\n');
 const preset=(data.engine.presetModules||[]).filter(m=>m.enabled!==false).map(m=>`【${m.kind}:${m.name}|权重${m.weight}】${m.content}`).join('\\n');
 return {worldText,memories,preset,state:JSON.stringify(st)};
}
function buildSystemPrompt(c){
 const x=buildEngineContext(c);
 return `你正在“扑克机”中与用户进行沉浸式角色对话。\\n角色：${c.name}\\n角色设定：${c.bio||'无'}\\n\\n【动态世界】\\n${x.worldText||'无'}\\n【世界状态】\\n${x.state}\\n【记忆】\\n${x.memories||'无'}\\n【预设模块】\\n${x.preset||'无'}\\n\\n请遵循角色、世界、记忆和预设规则，保持上下文连续。`;
}
function applyRegexPipeline(text){
 let out=text;
 for(const r of (data.engine.regexRules||[]).filter(x=>x.enabled!==false)){
  if(r.target==='用户消息')continue;
  try{out=out.replace(new RegExp(r.pattern,r.flags||''),r.replace||'')}catch{}
 }
 return out;
}
function renderEnginePreview(e){
 const c=currentChat&&data.characters.find(x=>x.id===currentChat);
 const prompt=c?buildSystemPrompt(c):'尚未进入聊天。创建角色并进入聊天后，这里会显示本次上下文编译结果。';
 e.innerHTML=`<div class="engine-card"><h3>♥ &nbsp;上下文预览</h3><p>这是发送给 API 前的本地编译结果。它不会自动发送。</p><div class="preview">${esc(prompt)}</div></div><div class="engine-card"><h3>♥ &nbsp;闭环</h3><div class="engine-flow"><div class="flowbox"><b>世界</b><span>检索与状态</span></div><div class="flowbox"><b>预设</b><span>组合与权重</span></div><div class="flowbox"><b>API</b><span>唯一 AI 来源</span></div><div class="flowbox"><b>正则</b><span>解析与反馈</span></div></div><div class="arrow">↻ 再次进入世界状态</div></div>`;
}

function loadSettings(){['apiBase','apiKey','apiModel','temperature'].forEach(k=>document.getElementById(k).value=data.settings[k]??'')}
async function saveSettings(){const s={apiBase:document.getElementById('apiBase').value.trim(),apiKey:document.getElementById('apiKey').value.trim(),apiModel:document.getElementById('apiModel').value.trim(),temperature:document.getElementById('temperature').value||.8};data.settings=s;save();if(!validAPI()){toast('请完整填写 API Base URL、Key 和模型');return}toast('API 配置已保存')}
function exportData(){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='pokeji-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importData(){const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const j=JSON.parse(await i.files[0].text());if(!j||!Array.isArray(j.characters)||!j.chats)throw 0;data=j;save();location.reload()}catch{toast('无效的扑克机数据文件')}};i.click()}
function resetData(){if(confirm('确定清空本机全部数据吗？此操作不可恢复。')){localStorage.removeItem(STORE);location.reload()}}
function chatInfo(){const c=data.characters.find(x=>x.id===currentChat);modal(`<h2>${esc(c.name)}</h2><div class="note"><b>状态</b><br>${esc(c.status||'未填写')}<br><br><b>角色设定</b><br>${esc(c.bio||'未填写')}</div><div class="form-actions"><button onclick="closeModal()">关闭</button></div>`)}
function about(){modal(`<h2>扑克机</h2><div class="note">API 驱动的虚拟手机式 AI 生活空间。首次使用不会自带角色、聊天记录或 AI 内容。所有角色与本地内容由用户创建；AI 回复来自用户配置的 API。扑克机不提供酒馆格式导入。</div><div class="form-actions"><button class="primary" onclick="closeModal()">完成</button></div>`)}
function modal(x){document.getElementById('modalContent').innerHTML=x;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}



function v8Clock(){
 const d=new Date(), h=d.getHours(), m=String(d.getMinutes()).padStart(2,'0');
 const t=(h%12||12)+':'+m;
 const days=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
 const mons=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
 document.getElementById('v8StatusTime').textContent=t;
 document.getElementById('v8LockTime').textContent=t;
 document.getElementById('v8LockDate').textContent=days[d.getDay()]+' · '+mons[d.getMonth()]+' '+d.getDate();
}
function v8Unlock(){document.getElementById('v8Lock').classList.add('hide')}
v8Clock();setInterval(v8Clock,1000);
