/* POKEJI V45.1 final behavior layer.
 * Keeps legacy data compatible while making input, reply timing, phone pages,
 * completion, memory presentation and cache diagnostics deterministic.
 */
(function(){
  if(window.__pokejiV451Loaded)return;
  window.__pokejiV451Loaded=true;
  const text=(value,fallback='')=>String(value??fallback);
  const obj=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const arg=value=>`decodeURIComponent('${encodeURIComponent(String(value??'')).replace(/'/g,'%27')}')`;
  const now=()=>new Date().toISOString();
  const validTrigger=new Set(['instant','debounce','manual']);

  data.settings=obj(data.settings);
  data.runtime=obj(data.runtime);
  let changed=false;
  if(!data.runtime.v451PhoneAutoPreferenceInitialized){
    /* V45 wrote the implicit default as true. Make the first V45.1 load opt-in. */
    data.settings.phoneAutoGenerate=false;
    data.runtime.v451PhoneAutoPreferenceInitialized=true;
    changed=true;
  }
  if(!validTrigger.has(data.settings.replyTriggerMode)){data.settings.replyTriggerMode='manual';changed=true}
  if(data.settings.phoneRealtimeReplyEnabled===undefined){data.settings.phoneRealtimeReplyEnabled=true;changed=true}
  if(data.settings.completionIncludeWorldbooks===undefined){data.settings.completionIncludeWorldbooks=true;changed=true}
  data.settings.completionWorldbookIds=Array.isArray(data.settings.completionWorldbookIds)?data.settings.completionWorldbookIds.map(String):[];
  data.runtime.pendingReplyChats=obj(data.runtime.pendingReplyChats);
  data.runtime.cacheDiagnosticsByKind=obj(data.runtime.cacheDiagnosticsByKind);
  data.runtime.phonePageReplies=obj(data.runtime.phonePageReplies);
  data.runtime.chatDrafts=obj(data.runtime.chatDrafts);
  if(changed)save();

  function announce(area,detail){
    data.runtime.changeLog=Array.isArray(data.runtime.changeLog)?data.runtime.changeLog:[];
    data.runtime.changeLog.unshift({area:text(area,'设置'),detail:text(detail),at:now()});
    data.runtime.changeLog=data.runtime.changeLog.slice(0,100);save();toast(`${area}已更新：${detail}`);
  }

  /* ---------- Android autofill hardening ---------- */
  /* V45.7.11: only write when the value actually differs. Unconditional writes fed
     the observers below and froze the API editor in an endless mutation loop. */
  const setProp=(node,key,value)=>{try{if(node&&node[key]!==value)node[key]=value}catch{}};
  const setAttr=(node,key,value)=>{try{if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value))}catch{}};
  function hardenInputs(root=document){
    const chat=root.querySelector?.('#messageInput')||document.getElementById('messageInput');
    if(chat){
      setProp(chat,'type','text');setProp(chat,'name','chat-message');setProp(chat,'autocomplete','off');setProp(chat,'autocapitalize','sentences');setProp(chat,'autocorrect','off');setProp(chat,'spellcheck',false);setProp(chat,'inputMode','text');
      setAttr(chat,'data-form-type','other');setAttr(chat,'data-lpignore','true');setAttr(chat,'data-1p-ignore','true');setAttr(chat,'data-bwignore','true');
    }
    const keys=root.querySelectorAll?.('#mpKey')||[];
    keys.forEach(key=>{
      setProp(key,'type',key.dataset.pokejiSecretRevealed==='true'?'text':'password');setProp(key,'name','api-token');setProp(key,'autocomplete','off');setProp(key,'autocapitalize','none');setProp(key,'autocorrect','off');setProp(key,'spellcheck',false);setProp(key,'inputMode','text');
      if(key.hasAttribute?.('data-form-type'))key.removeAttribute('data-form-type');setAttr(key,'data-lpignore','true');setAttr(key,'data-1p-ignore','true');setAttr(key,'data-bwignore','true');
    });
  }
  window.v45HardenInputs=hardenInputs;
  hardenInputs();
  /* V45.7.11: coalesce into one pass per task. Even if a future write is not
     idempotent, the observer can no longer chain microtasks without end. */
  let hardenQueued=false;
  const inputObserver=new MutationObserver(()=>{if(hardenQueued)return;hardenQueued=true;queueMicrotask(()=>{hardenQueued=false;hardenInputs()})});
  inputObserver.observe(document.getElementById('modal')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['type','name','autocomplete','style']});
  setInterval(hardenInputs,500);

  /* ---------- reply trigger modes ---------- */
  const replyTimers=new Map();
  function currentTrigger(){return validTrigger.has(data.settings.replyTriggerMode)?data.settings.replyTriggerMode:'debounce'}
  function pendingFor(chatId){return data.runtime.pendingReplyChats?.[chatId]||null}
  function updateReplyControls(){
    const mode=currentTrigger(),pending=!!pendingFor(currentChat),button=document.getElementById('v451ReplyNowBtn'),input=document.getElementById('messageInput'),send=document.querySelector('#chat .send');
    if(button){button.hidden=mode!=='manual';button.disabled=!pending||busy;button.title=pending?'让 AI 回复已发送的消息':'等待待回复消息';button.setAttribute('aria-label',button.title)}
    if(send&&!busy){send.title=mode==='manual'?'发送消息，不自动回复':mode==='debounce'?'发送后由 AI 判断表达完整再回复':'发送并立即回复'}
    if(input&&currentChat&&pending){input.dataset.pendingReply='true'}else if(input)delete input.dataset.pendingReply;
  }
  function showPendingStatus(chatId){
    if(currentChat!==chatId)return;
    const mode=currentTrigger();
    if(mode==='manual')setGenerationState?.('typing','消息已发送，点击 ↗ 让 AI 回复');
    else setGenerationState?.('typing','正在等待 AI 判断本轮是否表达完整…');
    updateReplyControls();
  }
  function replyNow(chatId=currentChat){
    if(!chatId||currentChat!==chatId)return toast('请回到对应会话再回复');
    if(!pendingFor(chatId))return toast('当前没有待回复消息');
    if(busy)return toast('上一轮回复仍在生成');
    clearTimeout(replyTimers.get(chatId));replyTimers.delete(chatId);
    data.runtime.pendingReplyChats[chatId]={...pendingFor(chatId),requestedAt:Date.now()};save();
    updateReplyControls();
    return sendMessage({__v451Resume:true,force:true});
  }
  window.v451ReplyNow=replyNow;
  function queueReply(chatId,mode=currentTrigger()){
    data.runtime.pendingReplyChats[chatId]={queuedAt:Date.now(),mode,chatId};save();
    clearTimeout(replyTimers.get(chatId));
    if(mode==='debounce')replyTimers.set(chatId,setTimeout(()=>{replyTimers.delete(chatId);void replyNow(chatId)},1200));
    showPendingStatus(chatId);
  }
  window.v451QueueReply=queueReply;
  window.saveReplyTriggerSetting=function(){
    const value=document.getElementById('replyTriggerMode')?.value;
    data.settings.replyTriggerMode=validTrigger.has(value)?value:'debounce';save();updateReplyControls();announce('聊天',`回复触发方式已改为${value==='manual'?'连发后手动回复':value==='debounce'?'AI 判断后自动回复':'每条立即回复'}`);
  };
  function ensureReplyButtons(){
    const composer=document.querySelector('#chat .composer');
    if(!composer)return;
    let button=document.getElementById('v451ReplyNowBtn');
    if(!button){
      button=document.createElement('button');button.id='v451ReplyNowBtn';button.className='composer-tool';button.type='button';button.textContent='↗';button.hidden=true;
      button.addEventListener('click',()=>void replyNow());
      const input=document.getElementById('messageInput');composer.insertBefore(button,input||null);
    }
    let writer=document.getElementById('v451WriteBtn');
    if(!writer){
      writer=document.createElement('button');writer.id='v451WriteBtn';writer.className='composer-tool';writer.type='button';writer.textContent='✎';writer.title='全屏写字';writer.setAttribute('aria-label','全屏写字');writer.addEventListener('click',openWriter);
      const input=document.getElementById('messageInput');composer.insertBefore(writer,input||null);
    }
    updateReplyControls();
  }
  const baseOpenChat=typeof openChat==='function'?openChat:null;
  if(baseOpenChat)openChat=function(...args){const result=baseOpenChat(...args);setTimeout(()=>{hardenInputs();ensureReplyButtons();updateReplyControls()},0);return result};
  const baseSetBusy=typeof setBusy==='function'?setBusy:null;
  if(baseSetBusy)setBusy=function(...args){const result=baseSetBusy(...args);setTimeout(updateReplyControls,0);return result};
  const baseLoadSettings=typeof loadSettings==='function'?loadSettings:null;
  if(baseLoadSettings)loadSettings=function(...args){const result=baseLoadSettings(...args);const trigger=document.getElementById('replyTriggerMode');if(trigger)trigger.value=currentTrigger();const phone=document.getElementById('phoneAutoGenerate');if(phone)phone.checked=data.settings.phoneAutoGenerate===true;const realtime=document.getElementById('phoneRealtimeReplyEnabled');if(realtime)realtime.checked=data.settings.phoneRealtimeReplyEnabled!==false;setTimeout(()=>{ensureReplyButtons();updateReplyControls()},0);return result};

  window.savePhoneAutoSetting=function(){
    data.settings.phoneAutoGenerate=document.getElementById('phoneAutoGenerate')?.checked===true;save();announce('虚拟手机',data.settings.phoneAutoGenerate?'自动联动已开启':'自动联动已关闭；仍可手动查手机或反查');
  };
  window.savePhoneRealtimeSetting=function(){
    data.settings.phoneRealtimeReplyEnabled=document.getElementById('phoneRealtimeReplyEnabled')?.checked===true;save();announce('虚拟手机',data.settings.phoneRealtimeReplyEnabled?'查手机实时回应已开启':'查手机实时回应已关闭');
  };

  /* ---------- full-screen writing editor ---------- */
  function writerMarkup(){
    return `<section id="v451Writer" class="v451-writer" aria-hidden="true"><header><button type="button" data-writer="close">取消</button><b>全屏写字</b><button type="button" data-writer="finish">完成</button></header><textarea id="v451WriterText" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="写下想发送的内容…"></textarea><footer><span id="v451WriterCount">0 字</span><button type="button" data-writer="send">发送</button></footer></section>`;
  }
  function ensureWriter(){
    if(document.getElementById('v451Writer'))return;
    const phone=document.getElementById('phone')||document.body;phone.insertAdjacentHTML('beforeend',writerMarkup());
    const root=document.getElementById('v451Writer'),area=document.getElementById('v451WriterText');
    root.querySelector('[data-writer="close"]').addEventListener('click',closeWriter);
    root.querySelector('[data-writer="finish"]').addEventListener('click',finishWriter);
    root.querySelector('[data-writer="send"]').addEventListener('click',sendFromWriter);
    area.addEventListener('input',()=>{document.getElementById('v451WriterCount').textContent=`${area.value.length} 字`;if(currentChat){data.runtime.chatDrafts[currentChat]=area.value;save()}});
  }
  function openWriter(){
    if(!currentChat)return toast('请先进入聊天');ensureWriter();const area=document.getElementById('v451WriterText'),draft=data.runtime.chatDrafts[currentChat]||document.getElementById('messageInput')?.value||'';area.value=draft;document.getElementById('v451WriterCount').textContent=`${draft.length} 字`;const root=document.getElementById('v451Writer');root.classList.add('open');root.setAttribute('aria-hidden','false');setTimeout(()=>area.focus(),40);
  }
  function closeWriter(){const root=document.getElementById('v451Writer');if(!root)return;root.classList.remove('open');root.setAttribute('aria-hidden','true')}
  function finishWriter(){const area=document.getElementById('v451WriterText'),input=document.getElementById('messageInput');if(input)input.value=area.value;if(currentChat){data.runtime.chatDrafts[currentChat]=area.value;save()}closeWriter();input?.focus({preventScroll:true});updateComposerState?.()}
  function sendFromWriter(){const area=document.getElementById('v451WriterText'),value=area.value.trim();if(!value)return toast('还没有写下内容');const input=document.getElementById('messageInput');if(input)input.value=value;if(currentChat)delete data.runtime.chatDrafts[currentChat];save();closeWriter();void sendMessage({force:true})}
  window.v451OpenWriter=openWriter;ensureWriter();ensureReplyButtons();

  /* ---------- phone page live replies ---------- */
  function phoneSession(){try{return v435PhoneSession||{mode:'browse',owner:'',chatId:currentChat,characterId:''}}catch{return{mode:'browse',owner:'',chatId:currentChat,characterId:''}}}
  function phoneCharacter(){const session=phoneSession(),id=session.characterId||directCharacterForChat(currentChat)?.id;return data.characters.find(item=>item.id===id)||directCharacterForChat(currentChat)}
  function phonePageName(key){return V43_PHONE_APPS?.[key]?.name||SIM_APP_CATALOG?.[key]?.name||key}
  function phonePageText(owner,key){
    try{
      const rows=typeof simulatedPhoneItems==='function'?simulatedPhoneItems(owner,currentChat).filter(item=>item.app===key).slice(0,24):[];
      return rows.map(item=>`${item.title||item.action||phonePageName(key)}：${item.content||''}`).join('\n')||'当前页面没有已保存内容';
    }catch{return'当前页面没有已保存内容'}
  }
  function phoneReplyBox(owner,key){
    if(!['check','reverse'].includes(phoneSession().mode))return null;
    const body=document.querySelector('.vphone-app-body');if(!body)return null;let box=document.getElementById('v451PhoneRealtimeReply');
    if(!box){box=document.createElement('section');box.id='v451PhoneRealtimeReply';box.className='v451-phone-reply';body.appendChild(box)}
    const incoming=phoneSession().mode==='reverse';box.dataset.mode=phoneSession().mode;box.innerHTML=`<div class="v451-phone-reply-body"><span class="v451-phone-reply-avatar">${esc(phoneCharacter()?.name?.slice(0,1)||'TA')}</span><span class="v451-phone-reply-text">…</span></div>`;return box;
  }
  async function requestPhoneReply(owner,key){
    if(data.settings.phoneRealtimeReplyEnabled===false)return;
    const session=phoneSession();if(!['check','reverse'].includes(session.mode)||session.chatId&&session.chatId!==currentChat)return;
    const character=phoneCharacter(),box=phoneReplyBox(owner,key);if(!character||!box||!validModel('chat'))return;
    const token=`${currentChat}|${session.mode}|${owner}|${key}|${Date.now()}`;data.runtime.phonePageRequestToken=token;
    const content=phonePageText(owner,key),persona=activePersonaFor(currentChat),direction=session.mode==='check'?`USER正在查看${character.name}的${phonePageName(key)}。角色知道对方正在看。`:`${character.name}正在查看USER的${phonePageName(key)}。角色根据看到的内容直接回应。`;
    const controller=withTimeout(Number(data.settings.timeout)||60000);
    try{
      const raw=await invokeModel('chat',{system:`你是${character.name}，正在进行一段沉浸式聊天。${direction}
只输出角色自然会说的一到两句短消息，不解释手机、页面、查询、工具、权限或系统，不替 USER 说话，不虚构页面中没有的内容。`,history:[{role:'user',content:`角色资料：\n${characterContext(character)}\nUSER：\n${personaContext(persona)}\n当前${phonePageName(key)}页面内容：\n${content}`}],temperature:.8,maxTokens:220,cacheKey:`pokeji_phone_page_${character.id}_${session.mode}_${key}`,signal:controller.signal});
      if(data.runtime.phonePageRequestToken!==token)return;
      const reply=stripReplyTags(raw).replace(/\s*<[^>]+>\s*/g,' ').trim().slice(0,600)||'……';
      const live=document.getElementById('v451PhoneRealtimeReply');if(live)live.querySelector('.v451-phone-reply-text').textContent=reply;
      data.runtime.phonePageReplies[`${currentChat}|${session.mode}|${owner}|${key}`]={text:reply,time:now()};save();
    }catch(error){const live=document.getElementById('v451PhoneRealtimeReply');if(live)live.querySelector('.v451-phone-reply-text').textContent=error?.name==='AbortError'?'回应已取消':'暂时没有得到回应'}finally{releaseController(controller)}
  }
  function wrapPhoneApp(){
    const base=typeof v43OpenPhoneApp==='function'?v43OpenPhoneApp:(typeof openSimPhoneApp==='function'?openSimPhoneApp:null);
    if(!base||base.__v451Wrapped)return;
    const wrapped=function(owner,key){const result=base(owner,key);setTimeout(()=>{phoneReplyBox(owner,key);void requestPhoneReply(owner,key)},45);return result};
    wrapped.__v451Wrapped=true;v43OpenPhoneApp=wrapped;openSimPhoneApp=wrapped;window.v43OpenPhoneApp=wrapped;window.openSimPhoneApp=wrapped;
  }
  wrapPhoneApp();

  /* ---------- memory dashboard ----------
   * Memory remains a separate app entry. This layer only supplies the
   * existing entry with finer filters; it does not merge it into phone UI.
   */
  let memoryFilter=data.runtime.v451MemoryFilter||'all';
  function memoryScope(memory){if(memory?.legacyUnassigned)return'unassigned';if(memory?.scope&&['global','persona','character','group','conversation','unassigned'].includes(memory.scope))return memory.scope;if(memory?.chatId)return'conversation';if(memory?.characterId)return'character';if(memory?.groupId)return'group';if(memory?.personaId)return'persona';return'global'}
  function memoryMatches(memory,filter){
    const scope=memoryScope(memory),ctx=typeof v45CurrentEntity==='function'?v45CurrentEntity(currentChat):{persona:activePersonaFor(currentChat),character:directCharacterForChat(currentChat),group:groupForChat(currentChat)};
    const persona=ctx.persona?.id||data.activePersonaId,character=ctx.character?.id,group=ctx.group?.id;
    if(filter==='all')return true;if(filter==='unassigned')return scope==='unassigned';if(filter==='mask')return scope==='global'||scope==='persona'&&String(memory.personaId)===String(persona);if(filter==='role')return scope==='global'||scope==='character'&&String(memory.characterId)===String(character);if(filter==='conversation')return scope==='global'||scope==='conversation'&&String(memory.chatId)===String(currentChat);return true;
  }
  function summaryVisible(id,filter){if(filter==='all')return true;if(filter==='unassigned')return false;const parsed=parsePersonaThreadId(id),current=parsePersonaThreadId(currentChat);if(filter==='conversation')return id===currentChat;if(!parsed||!current)return true;if(filter==='mask')return parsed.personaId===current.personaId;if(filter==='role')return parsed.entityId===current.entityId;return true}
  function memoryCard(memory){const scope=memoryScope(memory),ctx=typeof v45CurrentEntity==='function'?v45CurrentEntity(currentChat):{},target=scope==='persona'?(data.personas.find(x=>x.id===memory.personaId)?.name||'USER 面具'):scope==='character'?(data.characters.find(x=>x.id===memory.characterId)?.name||'角色'):scope==='group'?(data.groups.find(x=>x.id===memory.groupId)?.name||'群聊'):scope==='conversation'?'本会话':scope==='unassigned'?'待归类':'全局';return`<article class="card memory-card v451-memory-card" onclick="editMemory(${arg(memory.id)})"><div class="memory-card-top"><b>${esc(memory.title||'未命名记忆')}</b><span class="memory-scope">${esc(target)}</span></div><p>${esc(memory.text||'')}</p><div class="memory-card-foot"><span>${esc({global:'全局',persona:'USER 面具',character:'角色',group:'群聊',conversation:'本会话',unassigned:'待归类'}[scope]||'记忆')}</span><time>${esc(memory.time||memory.updatedAt||'')}</time></div></article>`}
  function summaryCard(id,value){const parsed=parsePersonaThreadId(id),character=parsed?.kind==='direct'&&data.characters.find(x=>x.id===parsed.entityId),group=parsed?.kind==='group'&&data.groups.find(x=>x.id===parsed.entityId),persona=parsed&&data.personas.find(x=>x.id===parsed.personaId);return`<article class="card memory-card v451-memory-card" onclick="viewConversationSummary(${arg(id)})"><div class="memory-card-top"><b>${esc(group?.name||character?.name||'本会话')}</b><span class="memory-scope">${esc(persona?.name||'当前面具')}</span></div><p>${esc(value.text||'')}</p><div class="memory-card-foot"><span>会话摘要</span><time>${esc(value.updatedAt?new Date(value.updatedAt).toLocaleString('zh-CN'):'')}</time></div></article>`}
  function renderMemoryV451(){
    const root=document.getElementById('memoryList');if(!root)return;const filters=[['all','全部'],['mask','当前面具'],['role','当前角色'],['conversation','本会话'],['unassigned','待归类']],summaries=Object.entries(data.chatSummaries||{}).filter(([id,value])=>value?.text&&summaryVisible(id,memoryFilter)),manual=(data.memories||[]).filter(memory=>memoryMatches(memory,memoryFilter));
    const ctx=typeof v45CurrentEntity==='function'?v45CurrentEntity(currentChat):{},hero=`<section class="memory-dashboard v451-memory-dashboard"><div class="memory-hero"><small>记忆架构 · V45.3</small><h2>分层记忆</h2><p>摘要、手动记忆、USER 面具与角色分区保存。原始聊天记录保留不变，只有命中的范围才会进入请求。</p><div class="memory-scope-switch">${filters.map(([key,label])=>`<button class="${memoryFilter===key?'on':''}" onclick="v451SetMemoryFilter('${key}')">${label}</button>`).join('')}</div></div></section>`;
    root.innerHTML=hero+`<div class="memory-role-banner">当前上下文：${esc(ctx.group?.name||ctx.character?.name||'未进入会话')} · USER 面具：${esc(ctx.persona?.name||'我')}<br><small>右上角 ＋ 仍用于压缩当前会话；旧版未归属资料不会自动注入。</small></div>${summaries.length?`<div class="memory-section-title"><span>会话摘要</span><small>${summaries.length} 份</small></div>${summaries.map(([id,value])=>summaryCard(id,value)).join('')}`:'<div class="memory-section-title"><span>会话摘要</span><small>0 份</small></div><div class="empty memory-empty">当前筛选范围没有摘要</div>'}<div class="memory-section-title"><span>手动记忆</span><small>${manual.length} 条</small></div>${manual.length?manual.map(memoryCard).join(''):'<div class="empty memory-empty">当前筛选范围没有手动记忆</div>'}`;
  }
  window.v451SetMemoryFilter=function(value){memoryFilter=['all','mask','role','conversation','unassigned'].includes(value)?value:'all';data.runtime.v451MemoryFilter=memoryFilter;save();renderMemoryV451()};
  /* Keep the pre-existing separated memory-entry renderer. V45.1 does not merge memory scopes into one dashboard. */

  /* ---------- completion worldbook context ---------- */
  function completionWorldbooks(characterId='',personaId=''){
    if(data.settings.completionIncludeWorldbooks===false)return[];
    const selected=new Set(data.settings.completionWorldbookIds||[]),all=Array.isArray(data.worlds)?data.worlds:[];
    return all.filter(world=>world&&world.enabled!==false&&(!selected.size?world.scope==='global'||world.scope==='character'&&(!characterId||world.targetIds?.includes(characterId))||world.scope==='persona'&&(!personaId||world.targetIds?.includes(personaId)):selected.has(String(world.id))));
  }
  function completionWorldbookText(characterId='',personaId=''){
    const rows=completionWorldbooks(characterId,personaId);if(!rows.length)return'（未带入世界书）';return rows.map(world=>`【${world.name||'世界书'}】\n${world.desc||world.content||''}`).join('\n\n').slice(0,10000);
  }
  window.openCompletionWorldbookSettings=function(){
    const rows=(data.worlds||[]).filter(world=>world&&world.enabled!==false),selected=new Set(data.settings.completionWorldbookIds||[]);modal(`<h2>补全带入世界书</h2><div class="note">开启后，角色补全和 USER 补全会把选中的世界书作为只读参考。不会修改世界书，也不会把世界书内容直接追加进角色设定。</div><div class="field"><label><input id="v451CompletionWorldbookEnabled" type="checkbox" style="width:auto" ${data.settings.completionIncludeWorldbooks!==false?'checked':''}> 启用世界书参考</label></div><div class="v451-worldbook-picker">${rows.length?rows.map(world=>`<label><input type="checkbox" class="v451-worldbook-check" value="${attr(world.id)}" ${selected.has(String(world.id))?'checked':''}><span><b>${esc(world.name||'未命名世界书')}</b><small>${esc(world.scope==='character'?'角色绑定':world.scope==='group'?'群聊绑定':world.scope==='persona'?'USER 绑定':'全局')}</small></span></label>`).join(''):'<div class="note">当前没有可用世界书。</div>'}</div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveCompletionWorldbookSettings()">保存</button></div>`);
  };
  window.saveCompletionWorldbookSettings=function(){data.settings.completionIncludeWorldbooks=document.getElementById('v451CompletionWorldbookEnabled')?.checked!==false;data.settings.completionWorldbookIds=[...document.querySelectorAll('.v451-worldbook-check:checked')].map(input=>input.value);save();closeModal();announce('补全','世界书参考已'+(data.settings.completionIncludeWorldbooks?'开启':'关闭'))};
  if(typeof v436CurrentCharacterForPrompt==='function'){const baseCharacterPrompt=v436CurrentCharacterForPrompt;v436CurrentCharacterForPrompt=function(draft){return`${baseCharacterPrompt(draft)}\n\n【补全参考世界书】\n${completionWorldbookText(draft?.id||'',draft?.boundPersonaId||data.activePersonaId)}`}}

  /* ---------- USER one-click additive completion ---------- */
  const PERSONA_FIELDS={identity:'身份 / 职业',description:'身份描述',personality:'性格',background:'个人经历',appearance:'外貌与气质',likes:'偏好',dislikes:'不喜欢',speechStyle:'表达习惯',relationship:'希望与角色的关系',boundaries:'互动边界',goals:'当前目标',notes:'补充信息'};
  function personaCompletionKind(){if(data.modelBindings?.personaCompletion&&validModel('personaCompletion'))return'personaCompletion';if(validModel('characterCompletion'))return'characterCompletion';return'chat'}
  function personaCompletionProfileReady(){return validModel(personaCompletionKind())}
  function parseCompletionObject(raw){try{if(typeof v436SafeJsonObject==='function')return v436SafeJsonObject(raw);const source=String(raw||''),start=source.indexOf('{'),end=source.lastIndexOf('}');return JSON.parse(source.slice(start,end+1))}catch(error){throw Error('USER 补全模型返回内容不是有效 JSON') }}
  function normalizePersonaPatch(raw,draft){const patch={};for(const key of Object.keys(PERSONA_FIELDS)){const value=text(raw?.[key]).trim(),current=text(draft?.[key]).trim();if(!value||current&&(current.includes(value)||value.includes(current)&&value.length<current.length*1.15))continue;patch[key]=value.slice(0,key==='notes'||key==='background'?1800:1000)}return patch}
  function personaPrompt(draft){return Object.entries(PERSONA_FIELDS).map(([key,label])=>`【${label}】\n${text(draft?.[key]).trim()||'（空）'}`).join('\n\n')}
  window.openPersonaCompletionModel=function(){if(typeof v435BindFunction==='function'){V435_FUNCTION_LABELS.personaCompletion='USER补全';v435BindFunction('personaCompletion')}else{openView('settings')}};
  window.runPersonaCompletion=async function(){
    if(typeof collectPersonaEditorPage==='function')collectPersonaEditorPage();const draft=personaEditorDraft;if(!draft?.name)return toast('请先填写 USER 面具名称');if(!personaCompletionProfileReady()){modal(`<h2>USER 补全模型未绑定</h2><div class="note">可以绑定独立的 USER 补全模型；如果没有单独绑定，会使用角色补全模型，再没有则使用主聊天模型。</div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="closeModal();openPersonaCompletionModel()">设置模型</button></div>`);return}if(busy)return toast('已有生成任务正在进行');setBusy(true);toast('正在分析 USER 设定…');const controller=withTimeout(Number(data.settings.timeout)||60000),kind=personaCompletionKind(),character=directCharacterForChat(currentChat),world=completionWorldbookText(character?.id||'',draft.id);
    try{const raw=await invokeModel(kind,{system:`你是 USER 面具设定补全编辑器。只提出追加式补充，不覆盖用户已经写好的内容。
不得改名、改头像、改默认状态、替 USER 做决定或添加重大且无依据的创伤、疾病、犯罪、婚恋、亲属死亡等事实。信息不足的字段返回空字符串。严格只输出 JSON 对象，键只能是：${Object.keys(PERSONA_FIELDS).join(', ')}。每个值只能写“可以追加的新内容”。`,history:[{role:'user',content:`USER 面具名称：${draft.name}\n\n${personaPrompt(draft)}\n\n【关联角色参考】\n${character?characterContext(character):'未进入角色会话'}\n\n【补全参考世界书】\n${world}`}],temperature:.35,maxTokens:2400,cacheKey:`pokeji_persona_completion_${draft.id}`,signal:controller.signal});const patch=normalizePersonaPatch(parseCompletionObject(raw),draft);if(!Object.keys(patch).length)return toast('现有 USER 设定已经较完整，没有可靠的新补充');window.__v451PersonaPatch=patch;modal(`<h2>确认追加 USER 补全</h2><div class="note">只会把勾选内容追加到原字段末尾；名称、头像和其他控制项不会改变。</div><div class="character-completion-list">${Object.entries(patch).map(([key,value])=>`<label><input class="v451-persona-check" type="checkbox" value="${attr(key)}" checked><span><b>${esc(PERSONA_FIELDS[key])}</b><small>${draft[key]?`原有：${esc(text(draft[key]).slice(0,180))}`:'原字段为空'}</small><em>追加：${esc(value)}</em></span></label>`).join('')}</div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="applyPersonaCompletion()">追加到 USER</button></div>`)}catch(error){if(error?.name==='AbortError')toast('USER 补全已取消或超时');else errorDetail(error,'USER 补全失败')}finally{releaseController(controller);setBusy(false)}
  };
  window.applyPersonaCompletion=function(){const draft=personaEditorDraft,patch=window.__v451PersonaPatch||{};if(!draft)return;let count=0;document.querySelectorAll('.v451-persona-check:checked').forEach(input=>{const key=input.value,value=text(patch[key]).trim();if(!PERSONA_FIELDS[key]||!value)return;const old=text(draft[key]).trim();draft[key]=old?`${old}\n\n${value}`:value;count++});delete window.__v451PersonaPatch;closeModal();renderPersonaEditor();toast(count?`已追加 ${count} 项 USER 补充；请检查后保存`:'没有选择补充内容')};
  const basePersonaRender=typeof renderPersonaEditor==='function'?renderPersonaEditor:null;
  if(basePersonaRender)renderPersonaEditor=function(...args){const result=basePersonaRender(...args),body=document.getElementById('personaEditorBody');if(body&&!body.querySelector('.v451-persona-completion-bar')){const hero=body.querySelector('.persona-editor-hero');if(hero)hero.insertAdjacentHTML('afterend',`<div class="character-completion-bar v451-persona-completion-bar"><span><b>USER 设定补全</b><small>只追加可靠内容，先预览再保存</small></span><button type="button" onclick="runPersonaCompletion()">✦ 一键补全</button></div><div class="character-completion-model-card v451-persona-model-card"><span><b>USER 补全模型</b><small>${personaCompletionProfileReady()?`已使用 ${esc(modelProfile(personaCompletionKind()).model)}`:'未绑定独立模型，点击设置'}</small></span><button type="button" onclick="openPersonaCompletionModel()">设置 ›</button></div>`)}return result};

  /* ---------- cache telemetry and request compatibility ---------- */
  function shortHash(value){let hash=2166136261;for(const ch of String(value||'')){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}return(`00000000${(hash>>>0).toString(16)}`).slice(-8)}
  function requestFingerprint(options){const system=text(options?.system),history=Array.isArray(options?.history)?options.history:[],stable=[system,...history.slice(0,-1).map(item=>`${item.role}:${item.content}`)].join('\n');return{hash:shortHash(stable),chars:stable.length,approxTokens:Math.ceil(stable.length/4)}}
  function cacheReason(kind,provider,diagnostic,fingerprint){
    if(diagnostic.hit>0)return`服务商已返回缓存命中（${diagnostic.hit} tokens）`;
    if(provider==='gemini')return'Gemini 原生接口的隐式缓存不保证返回命中字段，页面不会把“已发送”伪装成“已命中”。';
    if(provider==='openai'&&!/api\.openai\.com/i.test(text(modelProfile(kind).base)))return'当前是 OpenAI 兼容地址；页面会先发送稳定缓存 Key，若中转明确拒绝该参数则自动去掉并重试。是否命中仍取决于中转实现与 usage 回传。';
    if(fingerprint.approxTokens<1024)return`稳定前缀约 ${fingerprint.approxTokens} tokens，低于常见缓存门槛；继续累积稳定上下文后再观察。`;
    return'服务商响应没有返回可识别的缓存命中字段，需以服务商控制台或响应 usage 为准。';
  }
  function updateCacheLabelV451(){const el=document.getElementById('cacheDiagnosticsLabel'),d=data.runtime.cacheDiagnostics||{};if(!el)return;if(!d.at){el.textContent='等待主聊天 ›';return}el.textContent=d.hit>0?`主聊天已命中 ${d.hit} tokens ›`:d.created>0?'主聊天已建立缓存 ›':'主聊天未返回命中字段 ›'}
  const baseInvoke=typeof invokeModel==='function'?invokeModel:null;
  if(baseInvoke)invokeModel=async function(kind,options={}){const before=text(data.runtime.cacheDiagnostics?.at),provider=text(modelProfile(kind).provider,'openai'),fingerprint=requestFingerprint(options),started=Date.now();try{const result=await baseInvoke(kind,options),raw=obj(data.runtime.cacheDiagnostics),fresh=raw.at&&text(raw.at)!==before,d=fresh?{...raw}:{provider,hit:0,created:0,prompt:0,elapsed:Date.now()-started,streaming:false,reported:false,at:now()};d.kind=kind;d.provider=provider;d.cacheKey=text(options.cacheKey);d.stablePrefixHash=fingerprint.hash;d.stablePrefixChars=fingerprint.chars;d.approxTokens=fingerprint.approxTokens;d.reason=cacheReason(kind,provider,d,fingerprint);data.runtime.cacheDiagnosticsByKind[kind]=d;if(kind==='chat'||!data.runtime.cacheDiagnosticsByKind.chat)data.runtime.cacheDiagnostics=d;else if(data.runtime.cacheDiagnosticsByKind.chat)data.runtime.cacheDiagnostics=data.runtime.cacheDiagnosticsByKind.chat;save();updateCacheLabelV451();return result}catch(error){updateCacheLabelV451();throw error}};
  const baseBuild=typeof buildProviderRequest==='function'?buildProviderRequest:null;
  if(baseBuild)buildProviderRequest=function(options={}){const req=baseBuild(options);if(options.provider==='openai'&&!/api\.openai\.com/i.test(text(options.base))&&req?.body?.prompt_cache_key)delete req.body.prompt_cache_key;return req};
  window.showCacheDiagnostics=function(){const all=Object.entries(data.runtime.cacheDiagnosticsByKind||{}),d=data.runtime.cacheDiagnostics||{};if(!all.length&&!d.at)return modal('<h2>缓存诊断</h2><div class="note">还没有完成过主聊天请求。完成几轮聊天后再查看服务商返回的 usage。</div><div class="form-actions"><button class="primary" onclick="closeModal()">知道了</button></div>');const rows=all.map(([kind,value])=>`<div class="meta-row"><span>${esc(kind==='chat'?'主聊天':kind)}</span><span>${value.hit>0?`命中 ${value.hit}`:value.created>0?`建立 ${value.created}`:'未报告'}</span></div>`).join('');modal(`<h2>缓存诊断</h2><div class="about-meta">${rows}<div class="meta-row"><span>协议</span><span>${esc(d.provider||'')}</span></div><div class="meta-row"><span>稳定前缀</span><span>${esc(d.approxTokens||0)} tokens · ${esc(d.stablePrefixHash||'')}</span></div><div class="meta-row"><span>缓存 Key</span><span>${esc(d.cacheKey||'未设置')}</span></div></div><div class="note">${esc(d.reason||'缓存由服务商决定；页面只展示真实 usage。')}<br><br>OpenAI 官方通常按稳定前缀自动缓存；Claude 需要 cache_control；Gemini 隐式缓存不保证返回命中字段。兼容中转是否支持缓存，取决于中转协议和模型本身。</div><div class="form-actions"><button class="primary" onclick="closeModal()">完成</button></div>`)};

  /* ---------- settings and initial rendering ---------- */
  function refreshSettingsV451(){
    const trigger=document.getElementById('replyTriggerMode');if(trigger)trigger.value=currentTrigger();const phone=document.getElementById('phoneAutoGenerate');if(phone)phone.checked=data.settings.phoneAutoGenerate===true;const realtime=document.getElementById('phoneRealtimeReplyEnabled');if(realtime)realtime.checked=data.settings.phoneRealtimeReplyEnabled!==false;const label=document.getElementById('v451CompletionWorldbookLabel');if(label)label.textContent=data.settings.completionIncludeWorldbooks===false?'已关闭 ›':data.settings.completionWorldbookIds.length?`已选 ${data.settings.completionWorldbookIds.length} 本 ›`:'按角色与 USER 自动带入 ›';updateCacheLabelV451();ensureReplyButtons();hardenInputs()}
  refreshSettingsV451();
  window.addEventListener('resize',()=>{if(document.getElementById('v451Writer')?.classList.contains('open'))document.getElementById('v451WriterText')?.focus({preventScroll:true})});
  setTimeout(refreshSettingsV451,300);
})();
