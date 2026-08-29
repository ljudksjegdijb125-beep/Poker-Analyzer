/* =========================================================
   POKEJI V45 · role/mask memory, input semantics, chat UX and API library
   This is an additive override layer. It deliberately preserves message
   history and the existing context-history pipeline.
   ========================================================= */
(function(){
  if(window.__pokejiV45Loaded)return;
  window.__pokejiV45Loaded=true;
  const V45='45.7.9';
  const v45Text=(v,f='')=>String(v??f);
  const v45Obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const v45Arg=v=>`decodeURIComponent('${encodeURIComponent(String(v??'')).replace(/'/g,'%27')}')`;
  const v45Now=()=>new Date().toISOString();
  const v45ScopeLabels={global:'全局记忆',persona:'USER 面具',character:'角色',group:'群聊',conversation:'本会话',unassigned:'待归类'};
  const v45Base={};
  function v45EnsureRuntime(){
    data.settings={...data.settings,streamingEnabled:data.settings?.streamingEnabled!==false,imagePromptGlobal:v45Text(data.settings?.imagePromptGlobal)};
    data.apiConfigs=v45Obj(data.apiConfigs);data.modelBindings=v45Obj(data.modelBindings);data.apiDisabledKinds=v45Obj(data.apiDisabledKinds);
    data.runtime=v45Obj(data.runtime);data.runtime.cacheDiagnostics=v45Obj(data.runtime.cacheDiagnostics);data.runtime.changeLog=Array.isArray(data.runtime.changeLog)?data.runtime.changeLog:[];
    data.memories=Array.isArray(data.memories)?data.memories:[];for(const m of data.memories){if(!m.scope&&!m.personaId&&!m.characterId&&!m.groupId&&!m.chatId)m.legacyUnassigned=true}
    for(const c of (data.characters||[])){c.imagePrompt=v45Text(c.imagePrompt);c.statusMode=['off','manual','ai'].includes(c.statusMode)?c.statusMode:'manual';c.aiStatus=v45Text(c.aiStatus)}
    for(const p of (data.personas||[]))p.imagePrompt=v45Text(p.imagePrompt);
  }
  v45EnsureRuntime();
  function v45Announce(area,detail){
    const item={area:v45Text(area,'设置'),detail:v45Text(detail),at:v45Now()};
    data.runtime.changeLog.unshift(item);data.runtime.changeLog=data.runtime.changeLog.slice(0,80);save();
    toast(`${item.area}已更新：${item.detail}`);
  }
  function v45Status(character){
    if(!character)return'';
    if(typeof v435CharacterStatus==='function')return v435CharacterStatus(character)||'';
    return character.statusMode==='off'?'':v45Text(character.aiStatus||character.status);
  }
  function v45CurrentEntity(chatId=currentChat){
    const parsed=parsePersonaThreadId(chatId),group=groupForChat(chatId),character=group?data.characters.find(c=>c.id===group.memberIds[group.turnIndex%Math.max(1,group.memberIds.length)]):directCharacterForChat(chatId);
    return{parsed,group,character,persona:activePersonaFor(chatId)};
  }
  function v45MemoryScope(m){
    if(m?.scope&&v45ScopeLabels[m.scope])return m.scope;
    if(m?.chatId)return'conversation';if(m?.characterId)return'character';if(m?.groupId)return'group';if(m?.personaId)return'persona';return m?.legacyUnassigned?'unassigned':'global';
  }
  function v45MemoryMatches(m,chatId=currentChat){
    const scope=v45MemoryScope(m),ctx=v45CurrentEntity(chatId),parsed=ctx.parsed,personaId=parsed?.personaId||ctx.persona?.id||data.activePersonaId,entityId=parsed?.entityId||ctx.character?.id||ctx.group?.id,canonical=chatId?canonicalChatId(chatId):'';
    if(scope==='unassigned')return false;if(scope==='global')return true;if(scope==='persona')return String(m.personaId||'')===String(personaId);if(scope==='character')return String(m.characterId||'')===String(ctx.character?.id||entityId);if(scope==='group')return String(m.groupId||'')===String(ctx.group?.id||entityId);return String(m.chatId||'')===String(canonical||chatId||'');
  }
  function v45MemoryForPrompt(chatId=currentChat){
    const entries=(data.memories||[]).filter(m=>v45MemoryMatches(m,chatId)).slice(0,60);
    return entries.map(m=>`【${v45ScopeLabels[v45MemoryScope(m)]||'记忆'}${m.title?` · ${m.title}`:''}】\n${v45Text(m.text)}`).join('\n\n')||'暂无当前范围的手动记忆';
  }
  function v45SummaryMeta(id,value={}){
    const parsed=parsePersonaThreadId(id),persona=parsed&&data.personas.find(p=>p.id===parsed.personaId),character=parsed?.kind==='direct'&&data.characters.find(c=>c.id===parsed.entityId),group=parsed?.kind==='group'&&data.groups.find(g=>g.id===parsed.entityId);
    return{parsed,persona,character,group,label:group?.name||character?.name||'会话',mask:persona?.name||'当前面具'};
  }

  /* ---------- no password-manager misclassification ---------- */
  function v45HardenInputs(){
    /* V45.7.11: idempotent writes only, so the modal observers cannot recurse. */
    const put=(node,key,value)=>{try{if(node&&node[key]!==value)node[key]=value}catch{}};
    const mark=(node,key,value)=>{try{if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value))}catch{}};
    const chatInput=document.getElementById('messageInput');
    if(chatInput){put(chatInput,'type','text');put(chatInput,'name','chat-message');put(chatInput,'autocomplete','off');put(chatInput,'autocapitalize','sentences');put(chatInput,'autocorrect','off');put(chatInput,'spellcheck',false);mark(chatInput,'inputmode','text');mark(chatInput,'data-form-type','other');mark(chatInput,'data-lpignore','true')}
    const key=document.getElementById('mpKey');
    if(key){
      /* Keep secrets masked unless the person explicitly pressed the reveal button. */
      put(key,'type',key.dataset.pokejiSecretRevealed==='true'?'text':'password');put(key,'name','api-token');put(key,'autocomplete','off');put(key,'autocapitalize','none');put(key,'autocorrect','off');put(key,'spellcheck',false);if(key.hasAttribute?.('data-form-type'))key.removeAttribute('data-form-type');mark(key,'data-lpignore','true');mark(key,'data-1p-ignore','true');mark(key,'data-bwignore','true');
    }
  }
  window.v45HardenInputs=v45HardenInputs;
  window.v45CurrentEntity=v45CurrentEntity;
  window.v45Status=v45Status;
  v45Base.modal=modal;
  modal=function(html){v45Base.modal(html);setTimeout(v45HardenInputs,0)};

  /* ---------- scoped memory context: preserve history, narrow only manual memory ---------- */
  v45Base.buildEngineContext=buildEngineContext;
  buildEngineContext=function(character,userMessage='',chatId=currentChat,mode='all'){
    const result=v45Base.buildEngineContext(character,userMessage,chatId,mode)||{};
    result.memory=v45MemoryForPrompt(chatId);
    return result;
  };
  v45Base.refreshConversationSummary=refreshConversationSummary;
  refreshConversationSummary=async function(chatId,signal,force=false){
    const result=await v45Base.refreshConversationSummary(chatId,signal,force),summary=data.chatSummaries?.[chatId];
    if(summary){const ctx=v45CurrentEntity(chatId),parsed=ctx.parsed;summary.personaId=parsed?.personaId||ctx.persona?.id||'';summary.characterId=parsed?.kind==='direct'?parsed.entityId:'';summary.groupId=parsed?.kind==='group'?parsed.entityId:'';summary.chatId=chatId;summary.updatedAt=summary.updatedAt||v45Now();save()}
    return result;
  };

  /* ---------- polished memory app ---------- */
  let v45MemoryFilter='all';
  function v45FilterMemory(m){
    if(v45MemoryFilter==='all')return true;
    const ctx=v45CurrentEntity(currentChat),scope=v45MemoryScope(m),parsed=parsePersonaThreadId(currentChat),personaId=parsed?.personaId||ctx.persona?.id;
    if(v45MemoryFilter==='unassigned')return scope==='unassigned';
    if(v45MemoryFilter==='persona')return scope==='global'||(scope==='persona'&&m.personaId===personaId);
    if(v45MemoryFilter==='character')return scope==='global'||(scope==='character'&&m.characterId===ctx.character?.id);
    if(v45MemoryFilter==='conversation')return v45MemoryMatches(m,currentChat);
    return true;
  }
  function v45SummaryVisible(id,value){
    const meta=v45SummaryMeta(id,value),ctx=v45CurrentEntity(currentChat),parsed=parsePersonaThreadId(currentChat),personaId=parsed?.personaId||ctx.persona?.id;
    if(v45MemoryFilter==='all')return true;if(v45MemoryFilter==='unassigned')return false;if(v45MemoryFilter==='persona')return !meta.persona||meta.persona.id===personaId;if(v45MemoryFilter==='character')return !meta.character||meta.character.id===ctx.character?.id;if(v45MemoryFilter==='conversation')return id===currentChat;return true;
  }
  function v45MemoryCard(m){
    const scope=v45MemoryScope(m),target=scope==='unassigned'?'待归类':scope==='persona'?(data.personas.find(p=>p.id===m.personaId)?.name||'面具'):scope==='character'?(data.characters.find(c=>c.id===m.characterId)?.name||'角色'):scope==='group'?(data.groups.find(g=>g.id===m.groupId)?.name||'群聊'):scope==='conversation'?'本会话':'全局';
    return`<article class="card memory-card" onclick="editMemory(${v45Arg(m.id)})"><div class="memory-card-top"><b>${esc(m.title||'未命名记忆')}</b><span class="memory-scope">${esc(target)}</span></div><p>${esc(m.text||'')}</p><div class="memory-card-foot"><span>${esc(v45ScopeLabels[scope]||'记忆')}</span><time>${esc(m.time||m.updatedAt||'')}</time></div></article>`;
  }
  function v45SummaryCard(id,value){
    const meta=v45SummaryMeta(id,value);return`<article class="card memory-card" onclick="viewConversationSummary(${v45Arg(id)})"><div class="memory-card-top"><b>${esc(meta.label)}</b><span class="memory-scope">${esc(meta.mask)}</span></div><p>${esc(value?.text||'')}</p><div class="memory-card-foot"><span>会话摘要 · ${esc(meta.character?'角色':meta.group?'群聊':'会话')}</span><time>${esc(value?.updatedAt?new Date(value.updatedAt).toLocaleString('zh-CN'):'')}</time></div></article>`;
  }
  renderMemory=function(){
    const e=document.getElementById('memoryList');if(!e)return;
    const ctx=v45CurrentEntity(currentChat),persona=ctx.persona,character=ctx.character;
    const filters=[['all','全部'],['persona','当前面具'],['character','当前角色'],['conversation','本会话'],['unassigned','待归类']];
    const summaries=Object.entries(data.chatSummaries||{}).filter(([id,v])=>v?.text&&v45SummaryVisible(id,v));
    const memories=(data.memories||[]).filter(v45FilterMemory);
    e.innerHTML=`<div class="memory-dashboard"><section class="memory-hero"><small>MEMORY ARCHITECTURE · V45</small><h2>分层记忆</h2><p>手动记忆按全局、USER 面具、角色、群聊和本会话分层；聊天历史仍完整保留，只是不再把不同范围的手动资料混在一起。</p><div class="memory-scope-switch">${filters.map(([key,label])=>`<button class="${v45MemoryFilter===key?'on':''}" onclick="v45SetMemoryFilter('${key}')">${label}</button>`).join('')}</div></section></div><div class="memory-role-banner">当前上下文：${esc(character?.name||ctx.group?.name||'未进入角色会话')} · USER 面具：${esc(persona?.name||'我')}<br><small>新增记忆时可以明确选择作用范围，避免误注入其他角色。</small></div>${summaries.length?`<div class="memory-section-title"><span>会话摘要</span><small>${summaries.length} 份</small></div>${summaries.map(([id,v])=>v45SummaryCard(id,v)).join('')}`:''}<div class="memory-section-title"><span>手动记忆</span><small>${memories.length} 条</small></div>${memories.length?memories.map(v45MemoryCard).join(''):'<div class="empty memory-empty"><div class="big">⌁</div>当前筛选范围还没有手动记忆<br><small>点击右上角 ＋ 新建一条</small></div>'}`;
  };
  window.v45SetMemoryFilter=function(filter){v45MemoryFilter=['all','persona','character','conversation','unassigned'].includes(filter)?filter:'all';renderMemory()};
  function v45MemoryTargetVisibility(){
    const scope=document.getElementById('v45MemoryScope')?.value;
    for(const id of ['v45MemoryPersonaWrap','v45MemoryCharacterWrap','v45MemoryGroupWrap','v45MemoryChatWrap']){const el=document.getElementById(id);if(el)el.style.display='none'}
    const map={persona:'v45MemoryPersonaWrap',character:'v45MemoryCharacterWrap',group:'v45MemoryGroupWrap',conversation:'v45MemoryChatWrap'};const el=document.getElementById(map[scope]);if(el)el.style.display='block';
  }
  function v45MemoryForm(memory={}){
    const ctx=v45CurrentEntity(currentChat),scope=v45MemoryScope(memory),personaId=memory.personaId||ctx.persona?.id||data.activePersonaId,characterId=memory.characterId||ctx.character?.id||'',groupId=memory.groupId||ctx.group?.id||'',chatId=memory.chatId||currentChat||'';
    const chats=Object.entries(data.chats||{}).filter(([,list])=>Array.isArray(list)&&list.length).map(([id])=>{const meta=v45SummaryMeta(id,{});return`<option value="${attr(id)}" ${id===chatId?'selected':''}>${esc(meta.label)} · ${esc(meta.mask)}</option>`}).join('');
    return`<div class="field"><label>标题</label><input id="v45MemoryTitle" value="${attr(memory.title||'')}" placeholder="例如：角色对某件事的长期偏好"></div><div class="field"><label>内容</label><textarea id="v45MemoryText" placeholder="只写希望在这个范围内长期保留的事实、偏好或未完成事项">${esc(memory.text||'')}</textarea></div><div class="field"><label>作用范围</label><select id="v45MemoryScope" onchange="v45MemoryTargetVisibility()"><option value="unassigned" ${scope==='unassigned'?'selected':''}>待归类 · 不注入任何会话</option><option value="global" ${scope==='global'?'selected':''}>全局 · 所有角色和面具</option><option value="persona" ${scope==='persona'?'selected':''}>USER 面具 · 只给这张面具</option><option value="character" ${scope==='character'?'selected':''}>角色 · 只给这个角色</option><option value="group" ${scope==='group'?'selected':''}>群聊 · 只给这个群</option><option value="conversation" ${scope==='conversation'?'selected':''}>本会话 · 只给当前角色与面具</option></select></div><div class="field" id="v45MemoryPersonaWrap"><label>USER 面具</label><select id="v45MemoryPersona">${(data.personas||[]).map(p=>`<option value="${attr(p.id)}" ${p.id===personaId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field" id="v45MemoryCharacterWrap"><label>角色</label><select id="v45MemoryCharacter"><option value="">请选择角色</option>${(data.characters||[]).map(c=>`<option value="${attr(c.id)}" ${c.id===characterId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field" id="v45MemoryGroupWrap"><label>群聊</label><select id="v45MemoryGroup"><option value="">请选择群聊</option>${(data.groups||[]).map(g=>`<option value="${attr(g.id)}" ${g.id===groupId?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div><div class="field" id="v45MemoryChatWrap"><label>会话</label><select id="v45MemoryChat"><option value="${attr(chatId)}" selected>${esc(v45SummaryMeta(chatId,{}).label||'当前会话')}</option>${chats}</select></div>`;
  }
  newMemory=function(){modal(`<h2>新建分层记忆</h2><div class="note" style="padding:0 16px 12px">默认定位到当前角色、当前 USER 面具和当前会话；你可以在作用范围里改成全局或其他层。</div>${v45MemoryForm({scope:'conversation',personaId:v45CurrentEntity().persona?.id,characterId:v45CurrentEntity().character?.id,groupId:v45CurrentEntity().group?.id,chatId:currentChat})}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="createMemory()">保存记忆</button></div>`);setTimeout(v45MemoryTargetVisibility,0)};
  createMemory=function(){const title=document.getElementById('v45MemoryTitle')?.value.trim(),text=document.getElementById('v45MemoryText')?.value.trim(),scope=document.getElementById('v45MemoryScope')?.value||'conversation';if(!title||!text)return toast('请填写标题和内容');const item={id:'m_'+v44UUID(),title,text,scope,time:'刚刚',updatedAt:v45Now(),personaId:document.getElementById('v45MemoryPersona')?.value||'',characterId:document.getElementById('v45MemoryCharacter')?.value||'',groupId:document.getElementById('v45MemoryGroup')?.value||'',chatId:document.getElementById('v45MemoryChat')?.value||''};if(scope==='global'){delete item.personaId;delete item.characterId;delete item.groupId;delete item.chatId}if(scope==='persona'){delete item.characterId;delete item.groupId;delete item.chatId}if(scope==='character'){delete item.personaId;delete item.groupId;delete item.chatId}if(scope==='group'){delete item.personaId;delete item.characterId;delete item.chatId}data.memories.unshift(item);save();closeModal();renderMemory();v45Announce('记忆',`已创建${v45ScopeLabels[scope]}`)};
  editMemory=function(id){const memory=(data.memories||[]).find(x=>x.id===id);if(!memory)return;modal(`<h2>编辑分层记忆</h2>${v45MemoryForm(memory)}<div class="form-actions"><button class="danger" onclick="deleteMemory(${v45Arg(id)})">删除</button><button onclick="closeModal()">取消</button><button class="primary" onclick="updateMemory(${v45Arg(id)})">保存</button></div>`);setTimeout(v45MemoryTargetVisibility,0)};
  updateMemory=function(id){const m=(data.memories||[]).find(x=>x.id===id);if(!m)return;const title=document.getElementById('v45MemoryTitle')?.value.trim(),text=document.getElementById('v45MemoryText')?.value.trim(),scope=document.getElementById('v45MemoryScope')?.value||v45MemoryScope(m);if(!title||!text)return toast('标题和内容不能为空');Object.assign(m,{title,text,scope,updatedAt:v45Now(),time:'刚刚',personaId:document.getElementById('v45MemoryPersona')?.value||'',characterId:document.getElementById('v45MemoryCharacter')?.value||'',groupId:document.getElementById('v45MemoryGroup')?.value||'',chatId:document.getElementById('v45MemoryChat')?.value||''});if(scope==='global'){delete m.personaId;delete m.characterId;delete m.groupId;delete m.chatId}if(scope==='persona'){delete m.characterId;delete m.groupId;delete m.chatId}if(scope==='character'){delete m.personaId;delete m.groupId;delete m.chatId}if(scope==='group'){delete m.personaId;delete m.characterId;delete m.chatId}save();closeModal();renderMemory();v45Announce('记忆',`已更新${v45ScopeLabels[scope]}`)};
  deleteMemory=function(id){if(!confirm('删除这条分层记忆？'))return;data.memories=data.memories.filter(x=>x.id!==id);save();closeModal();renderMemory();v45Announce('记忆','已删除一条记忆')};

  /* ---------- chat list, status short sentence and full-screen entry ---------- */
  renderChats=function(){
    const e=document.getElementById('chatList');if(!e)return;const q=v45Text(document.getElementById('chatSearch')?.value).toLowerCase(),arr=(data.characters||[]).filter(c=>v45Text(c.name).toLowerCase().includes(q));
    if(!arr.length){e.innerHTML=`<div class="empty"><div class="big">♡</div>${q?'没有匹配的角色':'还没有角色<br>请先创建角色。'}</div>`;return}
    e.innerHTML=arr.map(c=>{const chatId=directChatId(c.id),messages=data.chats?.[chatId]||[],m=[...messages].reverse().find(x=>x&&x.kind!=='phoneEvent'&&x.kind!=='thought'&&x.kind!=='narration'),preview=m?.text||v45Status(c)||'尚未开始聊天',badge=data.settings.proactiveEnabled===true&&c.proactiveEnabled?'<span class="chat-live-badge">主动</span>':'';return`<div class="row card chat-channel-row"><button class="chat-row-main" onclick="openChat(${v45Arg(c.id)})">${avatar(c)}<span class="chat-row-copy"><b>${esc(c.name)} ${badge}</b><span class="muted">${esc(preview)}</span></span><time>${esc(m?.time||'')}</time></button></div>`}).join('');
  };
  function v45UpdateChatHeader(){
    const sub=document.getElementById('chatSub'),status=document.getElementById('chatStatusLine');if(!sub||!status)return;const ctx=v45CurrentEntity(currentChat);
    if(ctx.group){const memberCount=ctx.group.memberIds?.length||0;sub.textContent=`群聊 · ${memberCount} 人`;const speaker=ctx.character;status.textContent=v45Status(speaker)||'群聊进行中';status.title=status.textContent;return}
    sub.textContent=currentChatMode==='offline'?(currentOfflineStyle==='story'?'线下相遇 · 剧情':'线下相遇'):'线上消息';status.textContent=v45Status(ctx.character);status.title=status.textContent;
  }
  v45Base.openChat=openChat;
  openChat=function(...args){v45Base.openChat(...args);v45HardenInputs();v45UpdateChatHeader()};
  v45Base.backFromChat=backFromChat;
  backFromChat=function(){document.getElementById('chat')?.classList.remove('chat-fullscreen');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});return v45Base.backFromChat()};
  window.toggleChatFullscreen=function(){const el=document.getElementById('chat');if(!el)return;const on=el.classList.toggle('chat-fullscreen');if(on){el.setAttribute('aria-label','全屏聊天');document.body.classList.add('chat-in-fullscreen')}else{document.body.classList.remove('chat-in-fullscreen');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})}const btn=document.querySelector('.chat-fullscreen-btn');if(btn){btn.textContent=on?'⤢':'⛶';btn.title=on?'退出全屏聊天':'全屏聊天'}setTimeout(()=>document.getElementById('messageInput')?.focus({preventScroll:true}),80)};
  v45Base.chatInfo=chatInfo;
  chatInfo=function(){
    const ctx=v45CurrentEntity(currentChat);if(ctx.group)return editGroup(ctx.group.id);if(!ctx.character)return;
    modal(`<h2>${esc(ctx.character.name)} · 会话入口</h2><div class="about-meta"><div class="meta-row"><span>当前入口</span><span>${currentChatMode==='offline'?'线下相遇':'线上消息'}</span></div><div class="meta-row"><span>当前状态</span><span>${esc(v45Status(ctx.character)||'未设置')}</span></div><div class="meta-row"><span>USER 面具</span><span>${esc(ctx.persona?.name||'我')}</span></div></div><div class="form-actions"><button onclick="closeModal();editCharacter(${v45Arg(ctx.character.id)},'profile','chat')">角色设置</button><button onclick="closeModal();v45OpenCurrentMemory()">本会话记忆</button></div>`);
  };
  window.v45OpenCurrentMemory=function(){v45MemoryFilter='conversation';openView('memory')};
  v45Base.parseAssistantSegments=parseAssistantSegments;
  parseAssistantSegments=function(raw,options={}){const result=v45Base.parseAssistantSegments(raw,options);v45UpdateChatHeader();return result};

  /* input defaults for already-rendered and future controls */
  v45HardenInputs();
  try{renderChats();renderMemory();}catch{}
})();
