/* =========================================================
   POKEJI V45 · small functional additions
   Compression memory, safety app migration, linked virtual phone records,
   virtual calls and automatic voice transcripts.
   No global layout redesign.
   ========================================================= */
(function(){
  if(window.__pokejiV45PhoneCallLoaded)return;
  window.__pokejiV45PhoneCallLoaded=true;
  const T=(v,f='')=>String(v??f), A=v=>`decodeURIComponent('${encodeURIComponent(String(v??'')).replace(/'/g,'%27')}')`;
  const phoneSession=()=>{try{return v435PhoneSession||{mode:'browse',replies:{}}}catch{return{mode:'browse',replies:{}}}};
  data.calls=Array.isArray(data.calls)?data.calls:[];
  data.runtime=data.runtime&&typeof data.runtime==='object'?data.runtime:{};
  data.runtime.phoneViewMarks=data.runtime.phoneViewMarks&&typeof data.runtime.phoneViewMarks==='object'?data.runtime.phoneViewMarks:{};

  /* ---------- keep the second desktop page icon without changing layout ---------- */
  function ensureSafetyHomeIcon(){
    if(!data.homeDesktop||!Array.isArray(data.homeDesktop.items))data.homeDesktop=defaultHomeDesktop();
    if(!data.homeDesktop.items.some(item=>item.kind==='app'&&item.app==='safety')){
      data.homeDesktop.pageCount=Math.max(2,Number(data.homeDesktop.pageCount)||2);
      const slot=findHomeSlot(1,1,1);
      if(slot){data.homeDesktop.items.push({id:'app_safety_notice',kind:'app',app:'safety',page:1,x:slot.x,y:slot.y,w:1,h:1});save()}
    }
  }
  ensureSafetyHomeIcon();
  const baseHomeRender=renderHomeDesktop;
  renderHomeDesktop=function(){ensureSafetyHomeIcon();return baseHomeRender()};

  /* ---------- memory means compressing a conversation ---------- */
  function summaryTitle(chatId){
    const parsed=parsePersonaThreadId(chatId),character=parsed?.kind==='direct'?data.characters.find(c=>c.id===parsed.entityId):null,group=parsed?.kind==='group'?data.groups.find(g=>g.id===parsed.entityId):null,persona=parsed&&data.personas.find(p=>p.id===parsed.personaId);
    return`${group?.name||character?.name||'当前会话'} · ${persona?.name||'当前面具'}`;
  }
  async function compressConversation(chatId=currentChat){
    if(!chatId)return toast('请先进入一个聊天会话');
    const messages=data.chats?.[chatId]||[];if(!messages.length)return toast('当前会话还没有可压缩的对话');
    if(!validModel('summary')){modal(`<h2>记忆压缩模型未配置</h2><div class="note">“保存记忆”指压缩当前会话，不会新建一条脱离会话的手动记忆。请先在 API 配置库绑定“记忆摘要”模型。</div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="closeModal();openView('settings')">前往设置</button></div>`);return}
    const controller=withTimeout(Number(data.settings.timeout)||60000);toast(`正在压缩「${summaryTitle(chatId)}」…`);
    try{await refreshConversationSummary(chatId,controller.signal,true);renderMemory();toast(`已压缩当前对话 · ${summaryTitle(chatId)}`)}catch(error){if(error?.name==='AbortError')toast('对话压缩已取消或超时');else errorDetail(error,'对话压缩失败')}finally{releaseController(controller)}
  }
  window.v45CompressCurrentConversation=()=>void compressConversation(currentChat);
  const baseManualSummaryPicker=manualSummaryPicker;
  manualSummaryPicker=function(){
    const chats=Object.entries(data.chats||{}).filter(([,list])=>Array.isArray(list)&&list.length);
    if(!chats.length)return toast('还没有可压缩的会话');
    modal(`<h2>压缩对话并保存记忆</h2><div class="note">这里的“保存”会把选定会话压缩成摘要，按当前 USER 面具、角色或群聊会话分别保存；原始聊天记录不会删除。</div><div class="summary-picker">${chats.map(([id,list])=>`<button onclick="closeModal();v45CompressConversation(${A(id)})"><b>${esc(summaryTitle(id))}</b><span>${list.length} 条对话 · 压缩 ›</span></button>`).join('')}</div>`);
  };
  window.v45CompressConversation=compressConversation;
  const baseMemoryRender=renderMemory;
  renderMemory=function(){
    const result=baseMemoryRender();
    const root=document.getElementById('memoryList');if(root){const hero=root.querySelector('.memory-hero p');if(hero)hero.textContent='这里的记忆保存就是“压缩对话”：把当前角色与当前 USER 面具的聊天压缩成摘要。原始聊天记录仍完整保留。';const title=[...root.querySelectorAll('.memory-section-title span')].find(x=>x.textContent==='手动记忆');if(title)title.textContent='压缩后的对话记忆'}
    return result;
  };

  /* ---------- linked phone records ---------- */
  function currentPhoneCharacter(){
    const parsed=parsePersonaThreadId(currentChat),group=groupForChat(currentChat);return group?data.characters.find(c=>c.id===group.memberIds[group.turnIndex%Math.max(1,group.memberIds.length)]):directCharacterForChat(currentChat);
  }
  function appendPhoneRecord(text,role='assistant',meta={}){
    if(!currentChat)return null;data.chats[currentChat]??=[];
    const group=groupForChat(currentChat),message={id:'msg_'+v44UUID(),role:role==='user'?'user':'assistant',kind:'message',phoneEvent:true,phoneEventType:T(meta.type,'phone'),phoneDirection:T(meta.direction,''),text:T(text),time:time(),mode:group?'group':currentChatMode,sceneMode:currentOfflineStyle};
    data.chats[currentChat].push(message);save();if(typeof renderMessages==='function')renderMessages();return message;
  }
  function phonePageName(key){return V43_PHONE_APPS[key]?.name||SIM_APP_CATALOG[key]?.name||key}
  /* V45.4.1: ordinary phone entry and page viewing stay hidden and create no chat bubbles. */
  function recordPhonePage(){return null}
  function recordPhoneEntry(){return null}
  const baseCheck=typeof openCheckPhone==='function'?openCheckPhone:null;
  if(baseCheck)openCheckPhone=function(){const result=baseCheck();recordPhoneEntry('check');return result};
  const baseReverse=typeof openReversePhone==='function'?openReversePhone:null;
  if(baseReverse)openReversePhone=function(){const result=baseReverse();recordPhoneEntry('reverse');return result};

  /* Make every phone app page show clickable detail rows and an edit/add entry. */
  function phoneStoredRows(owner,key){
    const store=phoneOwnerStore(owner),items=Array.isArray(store.items)?store.items:[];return items.map((raw,index)=>({item:normalizeSimPhoneItem(raw),index})).filter(row=>row.item.app===key);
  }
  function phoneRowMarkup(owner,key,row){
    const item=row.item;return`<button class="v45-phone-row" onclick="v45PhoneItemDetail(${A(owner)},${row.index},${A(key)})"><span>${esc(item.action||phonePageName(key))}</span><div><b>${esc(item.title||'未命名内容')}</b><small>${esc(item.content||'')}</small></div><i>›</i></button>`;
  }
  function phoneAppBody(owner,key){
    const app=V43_PHONE_APPS[key]||{name:phonePageName(key),icon:'◇'},rows=phoneStoredRows(owner,key),session=phoneSession();recordPhonePage(owner,key);
    let body=rows.length?rows.map(row=>phoneRowMarkup(owner,key,row)).join(''):'<div class="vphone-empty">这里还没有可查看的内容</div>';
    if(key==='messages'){
      const historyRows=typeof v43PhoneChatRows==='function'?v43PhoneChatRows(owner):[];if(historyRows.length)body+=`<div class="v45-phone-history-title">聊天记录</div>`+historyRows.slice(0,20).map(row=>`<button class="v45-phone-row is-readonly"><span>${esc(row.initial||'聊')}</span><div><b>${esc(row.title)}</b><small>${esc(row.content)}</small></div><i>${esc(row.time||'')}</i></button>`).join('');
    }
    const addLabel=key==='wallet'?'＋ 添加银行卡 / 账单':`＋ 添加${app.name}内容`;
    return`${body}<div class="form-actions v45-phone-actions"><button onclick="editSimPhoneItem(${A(owner)},-1,${A(key)})">${addLabel}</button>${session.mode==='check'||session.mode==='reverse'?'<button class="primary" onclick="closePhone()">返回聊天</button>':''}</div>`;
  }
  window.v45PhoneItemDetail=function(owner,index,key){
    const store=phoneOwnerStore(owner),item=normalizeSimPhoneItem(store.items[index]);if(!item)return;
    modal(`<h2>${esc(item.title||item.action||phonePageName(key))}</h2><div class="about-meta"><div class="meta-row"><span>应用</span><span>${esc(phonePageName(item.app))}</span></div><div class="meta-row"><span>类型</span><span>${esc(item.action||'内容')}</span></div></div><div class="preview" style="margin:0 16px 14px;max-height:34vh">${esc(item.content||'暂无详细内容')}</div><div class="form-actions"><button onclick="closeModal();editSimPhoneItem(${A(owner)},${index},${A(key)})">编辑</button><button class="danger" onclick="deleteSimPhoneItem(${A(owner)},${index},${A(key)})">删除</button><button class="primary" onclick="closeModal()">完成</button></div>`);
  };
  const v45PhoneHeader=(owner,key)=>{const app=V43_PHONE_APPS[key]||{name:phonePageName(key),icon:'◇'};return`${v43PhoneStatus()}<header class="vphone-app-head"><button onclick="v43PhoneDesktop(${A(owner)})" aria-label="返回手机桌面">‹</button><h2>${app.name}</h2><button onclick="closePhone()" aria-label="退出手机">×</button></header>`};
  function v45OpenPhoneApp(owner,key){v43ActivePhoneOwner=owner;v43PhoneSetContent(`<div class="vphone vphone-app ${owner==='user'?'is-user':'is-character'}">${v45PhoneHeader(owner,key)}<main class="vphone-app-body">${phoneAppBody(owner,key)}</main></div>`)}
  v43OpenPhoneApp=v45OpenPhoneApp;openSimPhoneApp=v45OpenPhoneApp;

  /* ---------- phone event records are visible in the existing chat stream ---------- */
  const baseMessageMarkup=v43MessageItemMarkup;
  v43MessageItemMarkup=function(message,index,isLast,chatId){
    if(message.phoneEvent){
      const cls=message.phoneDirection==='incoming'?'is-incoming':'is-outgoing',icon=message.phoneEventType==='call'?'☎':'▣';
      return`<div class="message-item phone-record-item" data-message-id="${attr(message.id||'')}"><div class="phone-record ${cls}"><span>${icon}</span><div><small>${message.phoneEventType==='call'?'电话记录':'手机记录'}</small><p>${esc(message.text||'')}</p></div></div>${isLast?`<div class="message-footer"><span class="msg-time">${esc(message.time||'')}</span></div>`:''}</div>`;
    }
    let html=baseMessageMarkup(message,index,isLast,chatId);
    if(message.kind==='voice'&&T(message.transcript||message.text).trim()){
      /* V45.7.25：转文字必须是 .message-item 的直接子块，不能留在 .bubble-line
         这个 flex 行里（会被挤成右侧窄柱），也不能插进 .message-footer
         （会和时间挤在同一行）。这里优先插在 footer 之前，没有 footer 时补在末尾。 */
      const transcript=`<div class="voice-transcript"><small>语音转文字</small><span>${esc(message.transcript||message.text)}</span></div>`;
      const footer=html.match(/<div class="message-footer">[\s\S]*<\/div>\s*<\/div>\s*$/);
      html=footer?html.replace(footer[0],`${transcript}${footer[0]}`):html.replace(/<\/div>\s*$/,`${transcript}</div>`);
    }
    return html;
  };
  const baseCommit=commitAssistantReply;
  commitAssistantReply=function(chatId,raw,options={}){const indexes=baseCommit(chatId,raw,options);for(const index of indexes){const message=(data.chats[chatId]||[])[index];if(message?.kind==='voice')message.transcript=T(message.text)}save();return indexes};

  /* ---------- virtual call UI ---------- */
  let callState=null,callBusy=false;
  function callCharacter(chatId=currentChat){return directCharacterForChat(chatId)||currentPhoneCharacter()}
  function saveCall(){if(!callState)return;const index=data.calls.findIndex(c=>c.id===callState.id);if(index<0)data.calls.unshift(callState);else data.calls[index]=callState;save()}
  function callStatusText(){return callState?.status==='ringing'?'来电中':callState?.status==='connecting'?'正在连接…':callState?.status==='connected'?'通话中':'通话结束'}
  function renderCall(){
    if(!callState)return;const character=callCharacter(callState.chatId),name=character?.name||'角色',incoming=callState.direction==='incoming',transcript=callState.transcript||[];
    modal(`<div class="call-screen ${incoming?'is-incoming':'is-outgoing'}"><div class="call-topline"><span>${incoming?'来电':'拨号'}</span><button onclick="v45EndCall('cancel')">×</button></div><div class="call-person"><div class="call-avatar">${avatar(character)}</div><small>${esc(callStatusText())}</small><h2>${esc(name)}</h2><p>${esc(callState.reason||'')}</p></div><div class="call-transcript">${transcript.length?transcript.map(item=>`<div class="call-line ${item.role==='user'?'from-user':'from-ai'}"><b>${item.role==='user'?'我':esc(name)}</b><span>${esc(item.text)}</span></div>`).join(''):'<div class="call-empty">等待通话内容…</div>'}</div>${callState.status==='connected'?`<div class="call-composer"><input id="v45CallInput" autocomplete="off" placeholder="说点什么…" onkeydown="if(event.key==='Enter'){event.preventDefault();v45CallSend()}"/><button onclick="v45CallSend()">↑</button></div>`:''}<div class="call-actions">${callState.status==='ringing'&&incoming?`<button class="call-decline" onclick="v45DeclineCall()">拒接</button><button class="call-answer" onclick="v45AnswerCall()">接听</button>`:callState.status==='connected'?`<button class="call-hangup" onclick="v45EndCall('hangup')">结束通话</button>`:`<button class="call-hangup" onclick="v45EndCall('cancel')">取消</button>`}</div></div>`);document.getElementById('modal')?.classList.add('call-fullscreen');
  }
  function startCall(direction='outgoing',reason=''){
    if(!currentChat)return toast('请先进入一个角色聊天');const character=callCharacter(currentChat);if(!character)return toast('当前没有可通话的角色');
    if(callState)v45EndCall('replace');callState={id:'call_'+v44UUID(),chatId:currentChat,characterId:character.id,direction,status:direction==='incoming'?'ringing':'connecting',reason:T(reason),startedAt:Date.now(),transcript:[]};saveCall();appendPhoneRecord(direction==='incoming'?`${character.name}打来了电话。`:`我拨打了${character.name}。`,direction==='incoming'?'assistant':'user',{type:'call',direction});renderCall();
    if(direction!=='incoming')setTimeout(()=>{if(callState?.status==='connecting'){callState.status='connected';callState.connectedAt=Date.now();callState.transcript.push({role:'assistant',text:`${character.name}接通了电话。`});appendPhoneRecord(`${character.name}接通了电话。`,'assistant',{type:'call',direction:'incoming'});saveCall();renderCall()}},700);
  }
  window.v45StartCall=startCall;
  window.v45AnswerCall=function(){if(!callState)return;const character=callCharacter(callState.chatId);callState.status='connected';callState.connectedAt=Date.now();callState.transcript.push({role:'user',text:'接听'});appendPhoneRecord(`我接听了${character?.name||'角色'}的电话。`,'user',{type:'call',direction:'outgoing'});saveCall();renderCall()};
  window.v45DeclineCall=function(){if(!callState)return;const character=callCharacter(callState.chatId);appendPhoneRecord(`我拒接了${character?.name||'角色'}的电话。`,'user',{type:'call',direction:'outgoing'});callState.status='ended';callState.endedAt=Date.now();saveCall();closeModal();renderMessages()};
  window.v45EndCall=function(reason='hangup'){if(!callState)return;const character=callCharacter(callState.chatId),label=reason==='cancel'?'取消了电话':reason==='replace'?'结束了上一通电话':'结束了与'+(character?.name||'角色')+'的通话';appendPhoneRecord(label,reason==='hangup'?'user':'user',{type:'call',direction:'outgoing'});callState.status='ended';callState.endedAt=Date.now();saveCall();closeModal();renderMessages()};
  window.v45CallSend=async function(){
    if(!callState||callState.status!=='connected'||callBusy)return;const input=document.getElementById('v45CallInput'),value=input?.value.trim();if(!value)return;const character=callCharacter(callState.chatId);callBusy=true;callState.transcript.push({role:'user',text:value});appendPhoneRecord(`电话中：${value}`,'user',{type:'call',direction:'outgoing'});if(input)input.value='';renderCall();
    if(!validAPI()){callBusy=false;return toast('请先配置主聊天模型')}
    const controller=withTimeout(Number(data.settings.timeout)||60000);try{const history=(data.chats[callState.chatId]||[]).filter(m=>m&&m.text).slice(-20).map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.phoneEvent?`【此前手机/电话事件】${m.text}`:m.text}));history.push({role:'user',content:`【当前电话中，USER 说】${value}`});const baseContext=buildSystemPrompt(character,value,callState.chatId);const system=`${baseContext}\n\n【当前通话状态｜仅供模型理解，绝不能显示给 USER】\n你现在确实正在与 USER 通电话，而不是普通文字聊天。通话已接通；这件事属于当前剧情与关系连续性。请依据上面的角色性格、USER 身份、世界书、记忆、最近剧情、手机事件和当前时间来回应。只输出角色在电话里真正说出的自然口语，不要输出旁白、动作描写、标签、系统说明、“线上记录/线下记录/电话模式”或任何技术词。不要脱离当前关系突然变成客服；回复长度应符合角色此刻的情绪和说话习惯。`;const raw=await invokeModel('chat',{system,history,temperature:data.settings.temperature,maxTokens:Math.min(900,Number(data.settings.maxTokens)||900),signal:controller.signal});const reply=stripReplyTags(raw).replace(/^\s*(?:线上|线下|电话)(?:记录|模式)?\s*[：:]\s*/i,'').trim()||'……';callState.transcript.push({role:'assistant',text:reply});appendPhoneRecord(`电话中：${reply}`,'assistant',{type:'call',direction:'incoming'});saveCall();renderCall()}catch(error){toast(error?.name==='AbortError'?'电话回复已取消':'电话回复失败')}finally{releaseController(controller);callBusy=false}
  };

  /* The model may decide that an incoming call fits the scene. */
  const callInstruction='\n\n【电话行为】\n当且仅当当前情境确实适合角色打电话时，可以额外输出 <call_request direction="incoming" reason="简短原因"></call_request>。这会打开一通来电；不要每轮使用，也不要输出电话标签以外的技术说明。没有必要时不要打电话。';
  const baseBuildSystem=buildSystemPrompt,baseBuildOffline=buildOfflineSystemPrompt,baseBuildGroup=buildGroupSystemPrompt;
  buildSystemPrompt=function(...args){return baseBuildSystem(...args)+callInstruction};buildOfflineSystemPrompt=function(...args){return baseBuildOffline(...args)+callInstruction};buildGroupSystemPrompt=function(...args){return baseBuildGroup(...args)+callInstruction};
  const baseParse=parseAssistantSegments;
  parseAssistantSegments=function(raw,options={}){
    let source=T(raw),request=null;
    source=source.replace(/<(?:call_request|phone_call|call)\b([^>]*)>([\s\S]*?)<\/(?:call_request|phone_call|call)>/gi,(_,attrs,body)=>{request={reason:(String(attrs).match(/reason\s*=\s*["']([^"']*)/i)?.[1]||T(body).trim()).slice(0,240)};return''});
    source=source.replace(/<(?:call_request|phone_call|call)\b([^>]*)\s*\/\s*>/gi,(_,attrs)=>{request={reason:(String(attrs).match(/reason\s*=\s*["']([^"']*)/i)?.[1]||'角色想听见你的声音').slice(0,240)};return''});
    if(request)setTimeout(()=>startCall('incoming',request.reason),80);
    return baseParse(source,options);
  };

  /* Add only one extra tile to the existing plus sheet. */
  const baseTools=showChatPlusMenu;
  showChatPlusMenu=function(){
    if(!currentChat)return;const group=groupForChat(currentChat),character=!group&&directCharacterForChat(currentChat);modal(`<div class="chat-plus-sheet"><div class="chat-plus-title"><small>聊天工具</small><h2>${group?'群聊工具':esc(character?.name||'聊天工具')}</h2></div><div class="chat-plus-grid"><button onclick="showStickerPicker()"><span>☺</span><b>表情包</b><small>分类、上传与 URL</small></button><button onclick="showImageGenerator()"><span>✦</span><b>AI 生图</b><small>使用已设置的绘画提示词</small></button>${group?'':`<button onclick="${currentChatMode==='offline'?`closeModal();openChat('${attr(character.id)}','online')`:`showOfflineEntryChoices('${attr(character.id)}')`}"><span>◇</span><b>${currentChatMode==='offline'?'返回线上':'线下相遇'}</b><small>切换聊天场景</small></button><button onclick="openCheckPhone()"><span>▣</span><b>查手机</b><small>查看 TA 的应用内容</small></button><button onclick="openReversePhone()"><span>◈</span><b>反查手机</b><small>让 TA 查看我的手机</small></button><button onclick="v45StartCall('outgoing')"><span>☎</span><b>打电话</b><small>拨出一通电话</small></button>`}<button onclick="openSimPhone('user')"><span>⌁</span><b>我的手机</b><small>银行卡和应用内容</small></button></div></div>`)};

  /* Voice messages already contain the spoken text; expose it automatically. */
  const baseVoiceCommit=commitAssistantReply;
  commitAssistantReply=function(chatId,raw,options={}){const indexes=baseVoiceCommit(chatId,raw,options);for(const i of indexes){const m=(data.chats[chatId]||[])[i];if(m?.kind==='voice')m.transcript=T(m.text)}save();return indexes};
})();
