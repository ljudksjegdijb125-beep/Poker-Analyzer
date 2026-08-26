/* =========================================================
   POKEJI V45.3.1 · data-safe repair and additive UI layer
   - does not remove chat history, tools, phone stores or existing features
   - loaded after every historical compatibility layer
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV453RepairLoaded)return;
  window.__pokejiV453RepairLoaded=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const Q=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`;
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const NOW=()=>new Date().toISOString();
  const uid=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}`;
  const afterPaint=callback=>requestAnimationFrame(()=>requestAnimationFrame(callback));

  data.settings=O(data.settings);data.runtime=O(data.runtime);data.memories=Array.isArray(data.memories)?data.memories:[];
  data.memoryWorldsV453=Array.isArray(data.memoryWorldsV453)?data.memoryWorldsV453:[];
  data.memoryWorldEntriesV453=Array.isArray(data.memoryWorldEntriesV453)?data.memoryWorldEntriesV453:[];
  data.learningV452=O(data.learningV452);data.learningV452.personas=O(data.learningV452.personas);
  data.squareV452=O(data.squareV452);data.squareV452.personas=O(data.squareV452.personas);

  /* ---------- Android Chrome autofill/password-bar compatibility ---------- */
  function editorText(element,multiline){
    const raw=multiline?(element.innerText??element.textContent):element.textContent;
    return S(raw).replace(/\u00a0/g,' ').replace(/\r/g,'').replace(multiline?/\n$/g:/[\r\n]+/g,'');
  }
  function setEditorText(element,value){element.textContent=S(value)}
  function insertPlainText(text){
    const selection=getSelection();if(!selection?.rangeCount)return;
    selection.deleteFromDocument();const range=selection.getRangeAt(0),node=document.createTextNode(S(text));range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
  }
  function bindSafeEditor(element,{value='',placeholder='',multiline=false,disabled=false,readOnly=false,type='text',name=''}={}){
    if(!element||element.dataset.v453Bound==='1')return element;
    element.dataset.v453Bound='1';element.dataset.v453SafeEditor='1';element.dataset.placeholder=S(placeholder);element.dataset.originalType=S(type||'text');
    if(name)element.dataset.originalName=S(name);
    element.classList.add('v453-safe-editor');element.classList.toggle('v453-single-line',!multiline);element.setAttribute('role','textbox');element.setAttribute('aria-multiline',multiline?'true':'false');
    let isDisabled=!!disabled,isReadOnly=!!readOnly,lastValue=S(value),maxLength=Number(element.getAttribute('maxlength'))||0;
    const applyEditable=()=>{const locked=isDisabled||isReadOnly;element.setAttribute('contenteditable',locked?'false':'plaintext-only');element.setAttribute('aria-disabled',isDisabled?'true':'false');element.setAttribute('aria-readonly',isReadOnly?'true':'false');element.tabIndex=isDisabled?-1:0};
    const define=(key,descriptor)=>{try{Object.defineProperty(element,key,{configurable:true,...descriptor})}catch{}};
    define('value',{get:()=>editorText(element,multiline),set:newValue=>{lastValue=S(newValue);setEditorText(element,lastValue)}});
    define('placeholder',{get:()=>element.dataset.placeholder||'',set:newValue=>{element.dataset.placeholder=S(newValue)}});
    define('disabled',{get:()=>isDisabled,set:newValue=>{isDisabled=!!newValue;applyEditable()}});
    define('readOnly',{get:()=>isReadOnly,set:newValue=>{isReadOnly=!!newValue;applyEditable()}});
    define('type',{get:()=>S(type||'text'),set:()=>{}});define('name',{get:()=>'',set:()=>{}});define('autocomplete',{get:()=>'off',set:()=>{}});
    define('maxLength',{get:()=>maxLength||-1,set:newValue=>{maxLength=Math.max(0,Number(newValue)||0)}});
    element.select=()=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range)};
    setEditorText(element,lastValue);applyEditable();
    element.addEventListener('paste',event=>{if(isDisabled||isReadOnly)return;event.preventDefault();insertPlainText(event.clipboardData?.getData('text/plain')||'')});
    element.addEventListener('beforeinput',event=>{if(!maxLength||event.inputType?.startsWith('delete'))return;const selected=getSelection()?.toString().length||0;if(element.value.length-selected+S(event.data).length>maxLength)event.preventDefault()});
    element.addEventListener('keydown',event=>{if(!multiline&&event.key==='Enter'&&!event.isComposing&&!event.defaultPrevented){event.preventDefault();element.dispatchEvent(new Event('change',{bubbles:true}))}});
    element.addEventListener('focus',()=>{lastValue=element.value});
    element.addEventListener('blur',()=>{if(element.value!==lastValue){lastValue=element.value;element.dispatchEvent(new Event('change',{bubbles:true}))}});
    return element;
  }
  function textControlCandidate(element){
    if(!element||element.nodeType!==1||element.dataset?.v453SafeEditor==='1'||element.matches?.('[data-v453-native-text]'))return false;
    if(element.tagName==='TEXTAREA')return true;if(element.tagName!=='INPUT')return false;
    const type=S(element.getAttribute('type')||'text').toLowerCase();return['text','search','url','email','tel','number','password'].includes(type);
  }
  function replaceTextControl(control){
    if(!textControlCandidate(control))return control;
    const multiline=control.tagName==='TEXTAREA',value=control.value,placeholder=control.getAttribute('placeholder')||'',type=control.getAttribute('type')||'text',name=control.getAttribute('name')||'',wasFocused=document.activeElement===control;
    const editor=document.createElement('div');
    for(const attribute of [...control.attributes]){
      if(['type','name','value','autocomplete','placeholder','readonly','disabled'].includes(attribute.name.toLowerCase()))continue;
      try{editor.setAttribute(attribute.name,attribute.value)}catch{}
    }
    if(control.id)editor.id=control.id;if(control.className)editor.className=control.className;
    editor.setAttribute('inputmode',control.getAttribute('inputmode')||(type==='url'?'url':type==='email'?'email':type==='tel'?'tel':type==='number'?'decimal':'text'));
    editor.setAttribute('enterkeyhint',control.getAttribute('enterkeyhint')||(!multiline?'done':'enter'));
    control.replaceWith(editor);
    bindSafeEditor(editor,{value,placeholder,multiline,disabled:control.disabled,readOnly:control.readOnly,type,name});
    if(editor.id==='v451WriterText'){
      editor.addEventListener('input',()=>{const count=document.getElementById('v451WriterCount');if(count)count.textContent=`${editor.value.length} 字`;if(currentChat){data.runtime.chatDrafts=O(data.runtime.chatDrafts);data.runtime.chatDrafts[currentChat]=editor.value;save()}});
    }
    if(wasFocused)setTimeout(()=>editor.focus(),0);return editor;
  }
  function shieldTree(root=document){
    if(!root)return;const controls=[];
    if(textControlCandidate(root))controls.push(root);
    if(root.querySelectorAll)controls.push(...root.querySelectorAll('input,textarea'));
    for(const control of controls)replaceTextControl(control);
    const message=document.getElementById('messageInput');if(message?.isContentEditable&&message.dataset.v453Bound!=='1')bindSafeEditor(message,{value:message.textContent||message.value||'',placeholder:message.dataset.placeholder||message.getAttribute('placeholder')||'输入消息…',multiline:false,type:'text'});
  }
  window.v453ShieldTextFields=shieldTree;

  /* Convert modal fields synchronously, before the old attribute observer runs. */
  const baseModal=typeof window.modal==='function'?window.modal:null;
  if(baseModal){
    const safeModal=function(html){const result=baseModal(html);shieldTree(document.getElementById('modalContent'));return result};
    window.modal=safeModal;try{modal=safeModal}catch{}
  }

  /* ---------- stable visual viewport and system navigation safe area ---------- */
  function syncViewport(){
    const viewport=window.visualViewport,height=Math.max(320,Math.round(viewport?.height||window.innerHeight||document.documentElement.clientHeight));
    document.documentElement.style.setProperty('--v453-app-height',`${height}px`);
    const keyboard=Math.max(0,Math.round((window.innerHeight||height)-height-(viewport?.offsetTop||0)));document.body?.classList.toggle('v453-keyboard-open',keyboard>120);
  }
  syncViewport();window.addEventListener('resize',syncViewport,{passive:true});window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});

  /* ---------- chat shell invariant ---------- */
  function createMessageEditor(){
    const editor=document.createElement('div');editor.id='messageInput';editor.className='v453-safe-editor v453-single-line';editor.dataset.placeholder='输入消息…';bindSafeEditor(editor,{placeholder:'输入消息…',multiline:false});
    editor.addEventListener('input',()=>{try{updateComposerState()}catch{}});editor.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();try{sendMessage()}catch{}}});return editor;
  }
  function repairChatShell(){
    const chat=document.getElementById('chat');if(!chat)return;
    chat.querySelectorAll('.chat-fullscreen-btn,#regenerateBtn').forEach(element=>element.remove());chat.classList.remove('chat-fullscreen');document.body?.classList.remove('chat-in-fullscreen');
    let composer=chat.querySelector(':scope>.composer')||chat.querySelector('.composer');
    if(!composer){composer=document.createElement('div');composer.className='composer';chat.appendChild(composer)}
    composer.hidden=false;composer.removeAttribute('aria-hidden');
    let plus=document.getElementById('chatPlusBtn');if(!plus){plus=document.createElement('button');plus.id='chatPlusBtn';plus.className='composer-tool composer-plus';plus.type='button';plus.textContent='＋';plus.title='聊天工具';plus.onclick=()=>showChatPlusMenu();composer.prepend(plus)}
    let input=document.getElementById('messageInput');if(!input){input=createMessageEditor();composer.appendChild(input)}else if(input.isContentEditable&&input.dataset.v453Bound!=='1')bindSafeEditor(input,{value:input.textContent||input.value||'',placeholder:input.dataset.placeholder||'输入消息…',multiline:false});
    let writer=document.getElementById('v451WriteBtn');if(!writer){writer=document.createElement('button');writer.id='v451WriteBtn';writer.type='button';writer.className='composer-tool';writer.textContent='✎';writer.title='全屏写字';writer.setAttribute('aria-label','全屏写字');writer.onclick=()=>window.v451OpenWriter?.();composer.insertBefore(writer,input)}
    let send=composer.querySelector('.send');if(!send){send=document.createElement('button');send.className='send';send.type='button';send.textContent='↑';send.onclick=()=>sendMessage();composer.appendChild(send)}
    if(plus.parentNode===composer&&composer.firstElementChild!==plus)composer.prepend(plus);
    if(writer.parentNode!==composer||writer.nextElementSibling!==input)composer.insertBefore(writer,input);
    if(send.parentNode!==composer)composer.appendChild(send);if(input.parentNode!==composer||input.nextElementSibling!==send)composer.insertBefore(input,send);
    input.hidden=false;input.removeAttribute('aria-hidden');composer.dataset.v453Stable='1';
  }
  window.v453RepairChatShell=repairChatShell;
  const baseOpenChat=typeof window.openChat==='function'?window.openChat:null;
  if(baseOpenChat){const stableOpenChat=function(...args){repairChatShell();const result=baseOpenChat.apply(this,args);repairChatShell();afterPaint(repairChatShell);return result};window.openChat=stableOpenChat;try{openChat=stableOpenChat}catch{}}
  const baseRenderMessages=typeof window.renderMessages==='function'?window.renderMessages:null;
  if(baseRenderMessages){const stableRenderMessages=function(...args){repairChatShell();const result=baseRenderMessages.apply(this,args);repairChatShell();return result};window.renderMessages=stableRenderMessages;try{renderMessages=stableRenderMessages}catch{}}

  /* Only regenerate moves into +. Full-screen writing stays beside the composer. */
  function reverseReady(chatId=currentChat){
    let key=S(chatId);try{key=canonicalChatId(chatId)}catch{}const intent=O(data.runtime.v452ReversePhoneIntents?.[key]);return['ready','connected'].includes(intent.status);
  }
  window.showChatPlusMenu=function(){
    if(!currentChat)return;const group=typeof groupForChat==='function'?groupForChat(currentChat):null,character=!group&&directCharacterForChat(currentChat);let timeline={mode:'real'};try{timeline=v438Timeline(currentChat)||timeline}catch{}
    const reverseHint=reverseReady(currentChat)?'TA 已提出查看，进入连接':'等待 TA 在聊天中提出查看';
    modal(`<div class="chat-plus-sheet"><div class="chat-plus-title"><small>CHAT TOOLS</small><h2>${group?'群聊工具':E(character?.name||'聊天工具')}</h2></div><div class="chat-plus-grid"><button onclick="closeModal();regenerateLast()"><span>↻</span><b>重新生成</b><small>重试上一条回复</small></button><button onclick="showStickerPicker()"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('sticker'):'☺'}</span><b>表情包</b><small>表情与图片</small></button><button onclick="showImageGenerator()"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('image'):'▧'}</span><b>AI 生图</b><small>使用已配置的生图模型</small></button><button onclick="showTimeSenseSettings()"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('schedule'):'◷'}</span><b>现实 / 虚拟时间</b><small>当前：${timeline.mode==='virtual'?'虚拟时间':'现实时间'}</small></button>${group?'':`<button onclick="${currentChatMode==='offline'?`closeModal();openChat(${Q(character?.id)},'online')`:`showOfflineEntryChoices(${Q(character?.id)})`}"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('mode'):'⇄'}</span><b>${currentChatMode==='offline'?'返回线上':'线下相遇'}</b><small>切换聊天场景</small></button><button onclick="openCheckPhone()"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('eye'):'◉'}</span><b>查手机</b><small>查看 TA 的应用内容</small></button><button onclick="openReversePhone()"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('reverse'):'↻'}</span><b>反查手机</b><small>${E(reverseHint)}</small></button><button onclick="v45StartCall('outgoing')"><span>☎</span><b>打电话</b><small>拨出一通电话</small></button>`}<button onclick="openSimPhone('user')"><span class="tool-svg">${typeof v435Svg==='function'?v435Svg('chat'):'▤'}</span><b>我的手机</b><small>直接打开，不触发反查</small></button></div></div>`);
  };
  try{showChatPlusMenu=window.showChatPlusMenu}catch{}

  /* ---------- three reply mechanisms; AI decides the automatic middle mode ---------- */
  const aiReplyTimers=new Map(),aiReplyTokens=new Map();
  data.runtime.v453ReplyAI=O(data.runtime.v453ReplyAI);
  const baseQueueReply=window.v451QueueReply;
  function clearAIDecision(chatId){clearTimeout(aiReplyTimers.get(chatId));aiReplyTimers.delete(chatId);aiReplyTokens.set(chatId,(aiReplyTokens.get(chatId)||0)+1)}
  function pendingUserTurn(chatId){const messages=Array.isArray(data.chats?.[chatId])?data.chats[chatId]:[];let lastAssistant=-1;for(let index=messages.length-1;index>=0;index--)if(messages[index]?.role==='assistant'&&!messages[index]?.phoneEvent){lastAssistant=index;break}return messages.slice(lastAssistant+1).filter(message=>message?.role==='user'&&!message.phoneEvent).slice(-12)}
  function explicitHold(messages){const text=messages.slice(-3).map(message=>S(message.text)).join('\n');return /(?:等等|等一下|等会|先别回|我还没说完|让我继续|稍等|wait\b|hold on|one sec|not done)/i.test(text)}
  function setReplyDecisionStatus(text){if(currentChat===data.runtime.v453ReplyAI.activeChat)try{setGenerationState('typing',text)}catch{}}
  function scheduleAIDecision(chatId,delay=1100){clearTimeout(aiReplyTimers.get(chatId));const token=(aiReplyTokens.get(chatId)||0)+1;aiReplyTokens.set(chatId,token);aiReplyTimers.set(chatId,setTimeout(()=>{aiReplyTimers.delete(chatId);void runAIDecision(chatId,token)},delay))}
  async function runAIDecision(chatId,token=aiReplyTokens.get(chatId)){
    const pending=data.runtime.pendingReplyChats?.[chatId];if(!pending||data.settings.replyTriggerMode!=='debounce'||token!==aiReplyTokens.get(chatId))return;
    if(currentChat!==chatId){data.runtime.v453ReplyAI[chatId]={...O(data.runtime.v453ReplyAI[chatId]),waitingForReturn:true};save();return}
    if(typeof busy!=='undefined'&&busy){scheduleAIDecision(chatId,900);return}
    const messages=pendingUserTurn(chatId);if(!messages.length)return;const state=data.runtime.v453ReplyAI[chatId]=O(data.runtime.v453ReplyAI[chatId]),startedAt=Number(state.startedAt)||Number(pending.queuedAt)||Date.now(),elapsed=Math.max(0,Date.now()-startedAt),attempt=(Number(state.attempt)||0)+1,fingerprint=messages.map(message=>message.id||message.text).join('|');Object.assign(state,{startedAt,attempt,fingerprint,checkedAt:Date.now()});data.runtime.v453ReplyAI.activeChat=chatId;save();setReplyDecisionStatus('AI 正在判断你是否已经表达完整…');
    const kind=typeof validModel==='function'&&validModel('summary')?'summary':'chat',controller=withTimeout(Math.min(30000,Number(data.settings.timeout)||60000));let decision='';
    try{const raw=await invokeModel(kind,{system:'你只判断 USER 的这一轮连续消息是否已经表达完整、现在是否自然地期待对方回复。结合语义判断，不要仅看标点。只输出 REPLY 或 WAIT：完整问题、陈述、请求、情绪表达输出 REPLY；明显半句话、列举未完、明确说先别回复或还要继续时输出 WAIT。不得回答消息内容。',history:[{role:'user',content:`连续消息：\n${messages.map((message,index)=>`${index+1}. ${S(message.text)}`).join('\n')}\n\n距离第一条待回复消息已过去 ${Math.round(elapsed/1000)} 秒；这是第 ${attempt} 次判断。`}],temperature:0,maxTokens:12,signal:controller.signal});decision=/\bWAIT\b/i.test(S(raw))?'WAIT':/\bREPLY\b/i.test(S(raw))?'REPLY':''}catch(error){console.warn('V45.3.1 reply decision fallback',S(error?.message||error))}finally{releaseController(controller)}
    if(token!==aiReplyTokens.get(chatId)||!data.runtime.pendingReplyChats?.[chatId])return;if(currentChat!==chatId){state.waitingForReturn=true;save();return}const latestFingerprint=pendingUserTurn(chatId).map(message=>message.id||message.text).join('|');if(latestFingerprint!==fingerprint){scheduleAIDecision(chatId,900);return}
    const hold=explicitHold(messages);if(decision==='REPLY'||(!decision&&!hold)||(!hold&&attempt>=2&&elapsed>=6500)){state.lastDecision='REPLY';save();setReplyDecisionStatus('AI 判断本轮已经表达完整，正在回复…');return window.v451ReplyNow?.(chatId)}
    state.lastDecision='WAIT';save();setReplyDecisionStatus(hold?'AI 判断你明确还要继续，正在等你输入…':'AI 判断这轮可能还没说完，继续短暂等待…');if(!hold)scheduleAIDecision(chatId,Math.max(2600,5000-elapsed));
  }
  window.v453RunReplyDecisionNow=chatId=>{const id=chatId||currentChat;if(id)scheduleAIDecision(id,0)};
  if(typeof baseQueueReply==='function')window.v451QueueReply=function(chatId,mode='debounce'){
    if(mode!=='debounce'){clearAIDecision(chatId);return baseQueueReply(chatId,mode)}
    clearTimeout(aiReplyTimers.get(chatId));const result=baseQueueReply(chatId,'manual');if(data.runtime.pendingReplyChats?.[chatId])data.runtime.pendingReplyChats[chatId].mode='debounce';data.runtime.v453ReplyAI[chatId]={startedAt:Number(data.runtime.v453ReplyAI[chatId]?.startedAt)||Date.now(),attempt:0,lastDecision:'PENDING'};save();if(currentChat===chatId){try{setGenerationState('typing','消息已发送，AI 将判断本轮是否表达完整…')}catch{}const send=document.querySelector('#chat .send');if(send)send.title='发送后由 AI 判断本轮是否完整再回复'}scheduleAIDecision(chatId,1100);return result
  };
  const baseSaveReplyTrigger=window.saveReplyTriggerSetting;
  if(typeof baseSaveReplyTrigger==='function')window.saveReplyTriggerSetting=function(){const value=document.getElementById('replyTriggerMode')?.value,result=baseSaveReplyTrigger();if(value!=='debounce')for(const chatId of aiReplyTimers.keys())clearAIDecision(chatId);return result};
  const openChatBeforeAI=window.openChat;if(typeof openChatBeforeAI==='function'){
    const openChatWithAIDecision=function(...args){const result=openChatBeforeAI.apply(this,args);const chatId=currentChat;if(chatId&&data.settings.replyTriggerMode==='debounce'&&data.runtime.pendingReplyChats?.[chatId])scheduleAIDecision(chatId,700);return result};window.openChat=openChatWithAIDecision;try{openChat=openChatWithAIDecision}catch{}
  }

  /* ---------- memory: independent entrances and Android-style entity tabs ---------- */
  const MEMORY_LABELS={world:'世界记忆',global:'全局记忆',persona:'USER 面具记忆',character:'角色记忆',group:'群聊记忆',conversation:'本会话记忆',unassigned:'待归类资料'};
  const MEMORY_COPY={world:'独立世界档案、绑定角色与世界书中的长期事实',global:'所有角色与 USER 面具都能使用的长期事实',persona:'只属于当前 USER 面具的身份、偏好与资料',character:'每个角色拥有自己的独立关系记忆页',group:'每个群聊拥有自己的共同上下文页面',conversation:'当前角色与当前 USER 面具的会话摘要',unassigned:'旧版没有可靠归属的资料，默认不注入'};
  function memoryScope(memory){if(memory?.legacyUnassigned||memory?.scope==='unassigned')return'unassigned';if(['global','persona','character','group','conversation'].includes(memory?.scope))return memory.scope;if(memory?.chatId)return'conversation';if(memory?.characterId)return'character';if(memory?.groupId)return'group';if(memory?.personaId)return'persona';return'global'}
  function currentPersona(){try{return activePersonaFor(currentChat)}catch{return data.personas?.find(item=>item.id===data.activePersonaId)||data.personas?.[0]}}
  function summaryMeta(chatId){
    let parsed=null;try{parsed=parsePersonaThreadId(chatId)}catch{}const persona=parsed&&data.personas?.find(item=>item.id===parsed.personaId),character=parsed?.kind==='direct'&&data.characters?.find(item=>item.id===parsed.entityId),group=parsed?.kind==='group'&&data.groups?.find(item=>item.id===parsed.entityId);return{parsed,persona,character,group,label:group?.name||character?.name||'本会话'};
  }
  function memoryCard(memory){const scope=memoryScope(memory),target=scope==='persona'?(data.personas?.find(item=>item.id===memory.personaId)?.name||'USER 面具'):scope==='character'?(data.characters?.find(item=>item.id===memory.characterId)?.name||'角色'):scope==='group'?(data.groups?.find(item=>item.id===memory.groupId)?.name||'群聊'):scope==='conversation'?'本会话':scope==='unassigned'?'待归类':'全局';return`<button class="v453-memory-card" onclick="editMemory(${Q(memory.id)})"><header><b>${E(memory.title||'未命名记忆')}</b><span>${E(target)}</span></header><p>${E(memory.text||'')}</p><footer>${E(memory.time||memory.updatedAt||'')}</footer></button>`}
  function summaryCard(chatId,value){const meta=summaryMeta(chatId);return`<button class="v453-memory-card" onclick="viewConversationSummary(${Q(chatId)})"><header><b>${E(meta.label)}</b><span>${E(meta.persona?.name||'当前面具')}</span></header><p>${E(value?.text||'')}</p><footer>${E(value?.updatedAt?new Date(value.updatedAt).toLocaleString('zh-CN'):'会话摘要')}</footer></button>`}
  function memoryCount(scope){
    const persona=currentPersona();if(scope==='world')return data.memoryWorldsV453.length;if(scope==='conversation')return currentChat&&data.chatSummaries?.[currentChat]?.text?1:0;if(scope==='persona')return data.memories.filter(item=>memoryScope(item)==='persona'&&S(item.personaId)===S(persona?.id)).length;if(scope==='unassigned')return data.memories.filter(item=>memoryScope(item)==='unassigned').length;return data.memories.filter(item=>memoryScope(item)===scope).length;
  }
  function memoryEntriesPage(){
    const persona=currentPersona(),ctx=typeof v45CurrentEntity==='function'?v45CurrentEntity(currentChat):{};const entries=[['world','◇'],['global','◎'],['persona','我'],['character','♠'],['group','♣'],['conversation','⌁'],['unassigned','…']];
    return`<div class="v453-memory-shell"><section class="v453-memory-hero"><small>MEMORY OWNERSHIP · V45.3.1</small><h2>记忆中心</h2><p>每个分区都是独立入口和独立页面；原始聊天记录始终保留。</p><div class="v453-memory-current">当前：${E(ctx.character?.name||ctx.group?.name||'未进入会话')} · ${E(persona?.name||'当前面具')}</div></section><section class="v453-memory-auto"><div><b>自动记忆压缩</b><small>${data.settings.summaryAutoEnabled===false?'当前关闭':'当前开启'} · 最近保留 ${Number(data.settings.summaryKeepTurns)||12} 轮</small></div><span>${typeof validModel==='function'&&validModel('summary')?'● 摘要模型已绑定':'○ 摘要模型未绑定'}</span></section><div class="v453-memory-entry-title"><b>独立分区</b><span>点击进入单独页面</span></div><div class="v453-memory-entries">${entries.map(([scope,icon])=>`<button class="v453-memory-entry" onclick="v453OpenMemoryPartition('${scope}')"><span>${icon}</span><span><b>${MEMORY_LABELS[scope]}</b><small>${MEMORY_COPY[scope]}</small><em>${memoryCount(scope)} ${scope==='world'?'个档案':scope==='conversation'?'份摘要':'条'}</em></span><i>›</i></button>`).join('')}</div></div>`;
  }
  function androidTabs(items,selected,handler,label){return`<div class="v453-android-tabs" role="tablist" aria-label="${E(label)}">${items.map(item=>`<button role="tab" aria-selected="${item.id===selected?'true':'false'}" class="${item.id===selected?'on':''}" onclick="${handler}(${Q(item.id)})">${E(item.name||'未命名')}</button>`).join('')}</div>`}
  function scopedMemories(scope,targetId=''){
    const persona=currentPersona();return data.memories.filter(item=>{const type=memoryScope(item);if(type!==scope)return false;if(scope==='persona')return S(item.personaId)===S(persona?.id);if(scope==='character')return S(item.characterId)===S(targetId);if(scope==='group')return S(item.groupId)===S(targetId);if(scope==='conversation')return S(item.chatId)===S(currentChat);return true});
  }
  function scopedSummaries(scope,targetId=''){
    const persona=currentPersona();return Object.entries(data.chatSummaries||{}).filter(([id,value])=>{if(!value?.text)return false;const meta=summaryMeta(id);if(scope==='conversation')return S(id)===S(currentChat);if(scope==='persona')return S(meta.persona?.id)===S(persona?.id);if(scope==='character')return S(meta.character?.id)===S(targetId)&&(!persona?.id||S(meta.persona?.id)===S(persona.id));if(scope==='group')return S(meta.group?.id)===S(targetId)&&(!persona?.id||S(meta.persona?.id)===S(persona.id));return false});
  }
  function partitionPage(scope){
    if(scope==='world')return worldArchiveListPage();const runtime=data.runtime;let targetId='',tabs='';
    if(scope==='character'){
      const characters=data.characters||[];if(!characters.some(item=>item.id===runtime.v453MemoryRoleId))runtime.v453MemoryRoleId=(typeof directCharacterForChat==='function'?directCharacterForChat(currentChat)?.id:'')||characters[0]?.id||'';targetId=runtime.v453MemoryRoleId;tabs=characters.length?androidTabs(characters,targetId,'v453SwitchMemoryRole','角色切换条'):'';
    }else if(scope==='group'){
      const groups=data.groups||[];if(!groups.some(item=>item.id===runtime.v453MemoryGroupId))runtime.v453MemoryGroupId=(typeof groupForChat==='function'?groupForChat(currentChat)?.id:'')||groups[0]?.id||'';targetId=runtime.v453MemoryGroupId;tabs=groups.length?androidTabs(groups,targetId,'v453SwitchMemoryGroup','群聊切换条'):'';
    }
    const memories=scopedMemories(scope,targetId),summaries=['persona','character','group','conversation'].includes(scope)?scopedSummaries(scope,targetId):[],targetName=scope==='character'?(data.characters?.find(item=>item.id===targetId)?.name||'请选择角色'):scope==='group'?(data.groups?.find(item=>item.id===targetId)?.name||'请选择群聊'):scope==='persona'?(currentPersona()?.name||'当前面具'):scope==='conversation'?(summaryMeta(currentChat).label||'当前会话'):MEMORY_LABELS[scope];
    return`<div class="v453-memory-shell"><button class="v453-memory-back" onclick="v453OpenMemoryPartition('entries')">‹ 返回记忆入口</button><section class="v453-memory-page-head"><small>${E(scope.toUpperCase())} MEMORY</small><h2>${E(MEMORY_LABELS[scope])}</h2><p>${E(MEMORY_COPY[scope])}</p></section>${tabs}<div class="v453-memory-binding">当前查看：${E(targetName)}${scope==='character'||scope==='group'?` · ${E(currentPersona()?.name||'当前面具')}`:''}</div><div class="v453-memory-actions"><button onclick="manualSummaryPicker()">选择聊天压缩</button><button class="primary" onclick="v453NewScopedMemory('${scope}',${Q(targetId)})">＋ 新建此分区记忆</button></div>${summaries.length?`<div class="v453-memory-section-title"><b>会话摘要</b><small>${summaries.length} 份</small></div>${summaries.map(([id,value])=>summaryCard(id,value)).join('')}`:''}<div class="v453-memory-section-title"><b>手动记忆</b><small>${memories.length} 条</small></div>${memories.length?memories.map(memoryCard).join(''):`<div class="v453-memory-empty">这个独立页面还没有内容。<br>切换角色不会复制或混合其他角色的记忆。</div>`}</div>`;
  }
  function renderMemoryV453(){const root=document.getElementById('memoryList');if(!root)return;let page=S(data.runtime.v453MemoryPage||'entries');if(!['entries','world','global','persona','character','group','conversation','unassigned','world-detail'].includes(page))page='entries';root.innerHTML=page==='entries'?memoryEntriesPage():page==='world-detail'?worldArchiveDetailPage(data.runtime.v453MemoryWorldId):partitionPage(page);afterPaint(()=>{const selected=root.querySelector('.v453-android-tabs button.on');selected?.scrollIntoView?.({block:'nearest',inline:'center'})})}
  window.renderMemory=renderMemoryV453;try{renderMemory=renderMemoryV453}catch{}
  window.v453OpenMemoryPartition=function(scope){data.runtime.v453MemoryPage=['world','global','persona','character','group','conversation','unassigned','world-detail'].includes(scope)?scope:'entries';save();renderMemoryV453();document.querySelector('#memory>.scroll')?.scrollTo?.({top:0,behavior:'smooth'})};
  window.v453SwitchMemoryRole=function(id){if(!data.characters?.some(item=>item.id===id))return;data.runtime.v453MemoryRoleId=id;save();renderMemoryV453()};
  window.v453SwitchMemoryGroup=function(id){if(!data.groups?.some(item=>item.id===id))return;data.runtime.v453MemoryGroupId=id;save();renderMemoryV453()};
  window.v45MemoryTargetVisibility=function(){const scope=document.getElementById('v45MemoryScope')?.value,map={persona:'v45MemoryPersonaWrap',character:'v45MemoryCharacterWrap',group:'v45MemoryGroupWrap',conversation:'v45MemoryChatWrap'};for(const id of Object.values(map)){const element=document.getElementById(id);if(element)element.style.display='none'}const active=document.getElementById(map[scope]);if(active)active.style.display='block'};
  window.v453NewScopedMemory=function(scope,targetId=''){
    if(scope==='world')return v453NewWorldMemory(data.runtime.v453MemoryWorldId);if(typeof newMemory!=='function')return;
    newMemory();setTimeout(()=>{const scopeField=document.getElementById('v45MemoryScope');if(scopeField)scopeField.value=scope;const persona=document.getElementById('v45MemoryPersona');if(persona)persona.value=currentPersona()?.id||'';const character=document.getElementById('v45MemoryCharacter');if(character&&scope==='character')character.value=targetId;const group=document.getElementById('v45MemoryGroup');if(group&&scope==='group')group.value=targetId;const chat=document.getElementById('v45MemoryChat');if(chat&&scope==='conversation')chat.value=currentChat||'';v45MemoryTargetVisibility();shieldTree(document.getElementById('modalContent'))},0);
  };

  /* World-memory archives from the approved memory-file foundation. */
  function worldArchiveListPage(){
    const worlds=data.memoryWorldsV453;return`<div class="v453-memory-shell"><button class="v453-memory-back" onclick="v453OpenMemoryPartition('entries')">‹ 返回记忆入口</button><section class="v453-memory-page-head"><small>WORLD ARCHIVES</small><h2>世界记忆</h2><p>每个世界是独立档案，可绑定多个角色和多本现有世界书。</p></section><div class="v453-memory-actions"><button class="primary" onclick="v453EditWorldArchive()">＋ 新建世界档案</button></div><div class="v453-memory-section-title"><b>独立世界档案</b><small>${worlds.length} 个</small></div>${worlds.length?worlds.map(world=>{const count=data.memoryWorldEntriesV453.filter(item=>item.worldId===world.id).length;return`<button class="v453-world-card" onclick="v453OpenWorldArchive(${Q(world.id)})"><header><b>${E(world.name||'未命名世界')}</b><i>›</i></header><p>${E(world.description||'尚未填写世界说明')}</p><div class="v453-world-chips"><span>${(world.characterIds||[]).length} 个角色</span><span>${(world.worldbookIds||[]).length} 本世界书</span><span>${count} 条记忆</span></div></button>`}).join(''):`<div class="v453-memory-empty">还没有世界档案。<br>创建后再绑定相关角色和世界书。</div>`}</div>`;
  }
  function worldArchiveDetailPage(id){
    const world=data.memoryWorldsV453.find(item=>item.id===id);if(!world){data.runtime.v453MemoryPage='world';return worldArchiveListPage()}const entries=data.memoryWorldEntriesV453.filter(item=>item.worldId===id),roleNames=(data.characters||[]).filter(item=>(world.characterIds||[]).includes(item.id)).map(item=>item.name),bookNames=(data.worlds||[]).filter(item=>(world.worldbookIds||[]).includes(item.id)).map(item=>item.name);
    return`<div class="v453-memory-shell"><button class="v453-memory-back" onclick="v453OpenMemoryPartition('world')">‹ 返回世界档案</button><section class="v453-memory-page-head"><small>BOUND WORLD MEMORY</small><h2>${E(world.name)}</h2><p>${E(world.description||'这个世界尚未填写说明')}</p></section><div class="v453-world-chips">${roleNames.map(name=>`<span>角色 · ${E(name)}</span>`).join('')||'<span>尚未绑定角色</span>'}${bookNames.map(name=>`<span>世界书 · ${E(name)}</span>`).join('')||'<span>尚未绑定世界书</span>'}</div><div class="v453-memory-actions"><button onclick="v453EditWorldArchive(${Q(world.id)})">编辑世界</button><button class="primary" onclick="v453NewWorldMemory(${Q(world.id)})">＋ 新建世界记忆</button></div><div class="v453-memory-section-title"><b>世界事实与时间线</b><small>${entries.length} 条</small></div>${entries.length?entries.map(item=>`<button class="v453-memory-card" onclick="v453EditWorldMemory(${Q(item.id)})"><header><b>${E(item.title||'未命名记忆')}</b><span>世界记忆</span></header><p>${E(item.text||'')}</p><footer>${E(item.updatedAt?new Date(item.updatedAt).toLocaleString('zh-CN'):'')}</footer></button>`).join(''):`<div class="v453-memory-empty">这个世界还没有长期记忆。</div>`}</div>`;
  }
  window.v453OpenWorldArchive=function(id){if(!data.memoryWorldsV453.some(item=>item.id===id))return;data.runtime.v453MemoryWorldId=id;data.runtime.v453MemoryPage='world-detail';save();renderMemoryV453()};
  window.v453EditWorldArchive=function(id=''){
    const world=data.memoryWorldsV453.find(item=>item.id===id)||{name:'',description:'',characterIds:[],worldbookIds:[]};
    modal(`<h2>${id?'编辑世界档案':'新建世界档案'}</h2><div class="note">世界档案不会替代现有世界书；它只把相关角色、世界书和世界记忆绑定成独立范围。</div><div class="field"><label>世界名称</label><input id="v453WorldName" value="${AT(world.name||'')}" placeholder="填写世界名称"></div><div class="field"><label>世界说明</label><textarea id="v453WorldDescription" placeholder="时代、地点、基础规则和当前状态">${E(world.description||'')}</textarea></div><div class="field"><label>绑定角色（可多选）</label><div class="v453-check-list">${(data.characters||[]).map(item=>`<label><input class="v453WorldCharacter" type="checkbox" value="${AT(item.id)}" ${(world.characterIds||[]).includes(item.id)?'checked':''}>${E(item.name||'未命名角色')}</label>`).join('')||'<div class="note">还没有角色</div>'}</div></div><div class="field"><label>绑定现有世界书（可多选）</label><div class="v453-check-list">${(data.worlds||[]).map(item=>`<label><input class="v453WorldBook" type="checkbox" value="${AT(item.id)}" ${(world.worldbookIds||[]).includes(item.id)?'checked':''}>${E(item.name||'未命名世界书')}</label>`).join('')||'<div class="note">还没有世界书</div>'}</div></div><div class="form-actions">${id?`<button class="danger" onclick="v453DeleteWorldArchive(${Q(id)})">删除</button>`:''}<button onclick="closeModal()">取消</button><button class="primary" onclick="v453SaveWorldArchive(${Q(id)})">保存世界</button></div>`);
  };
  window.v453SaveWorldArchive=function(id=''){
    const name=document.getElementById('v453WorldName')?.value.trim(),description=document.getElementById('v453WorldDescription')?.value.trim()||'';if(!name)return toast('请填写世界名称');const characterIds=[...document.querySelectorAll('.v453WorldCharacter:checked')].map(input=>input.value),worldbookIds=[...document.querySelectorAll('.v453WorldBook:checked')].map(input=>input.value),world=data.memoryWorldsV453.find(item=>item.id===id);if(world)Object.assign(world,{name,description,characterIds,worldbookIds,updatedAt:NOW()});else data.memoryWorldsV453.unshift({id:uid('memory_world'),name,description,characterIds,worldbookIds,createdAt:NOW(),updatedAt:NOW()});save();closeModal();data.runtime.v453MemoryPage='world';renderMemoryV453();toast(world?'世界档案已保存':'世界档案已创建')
  };
  window.v453DeleteWorldArchive=function(id){const world=data.memoryWorldsV453.find(item=>item.id===id);if(!world||!confirm(`删除世界档案“${world.name}”及其世界记忆？现有世界书不会删除。`))return;data.memoryWorldsV453=data.memoryWorldsV453.filter(item=>item.id!==id);data.memoryWorldEntriesV453=data.memoryWorldEntriesV453.filter(item=>item.worldId!==id);save();closeModal();data.runtime.v453MemoryPage='world';renderMemoryV453();toast('世界档案已删除')};
  window.v453NewWorldMemory=function(worldId){const world=data.memoryWorldsV453.find(item=>item.id===worldId);if(!world)return;modal(`<h2>新建世界记忆</h2><div class="note">固定归属：${E(world.name)}。只会注入绑定到该世界的角色。</div><div class="field"><label>标题</label><input id="v453WorldMemoryTitle" placeholder="世界事实或时间线标题"></div><div class="field"><label>内容</label><textarea id="v453WorldMemoryText" placeholder="需要长期保留的世界事实、规则、事件或未完成事项"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v453SaveWorldMemory('',${Q(worldId)})">保存记忆</button></div>`)};
  window.v453EditWorldMemory=function(id){const item=data.memoryWorldEntriesV453.find(entry=>entry.id===id),world=data.memoryWorldsV453.find(entry=>entry.id===item?.worldId);if(!item||!world)return;modal(`<h2>编辑世界记忆</h2><div class="note">固定归属：${E(world.name)}</div><div class="field"><label>标题</label><input id="v453WorldMemoryTitle" value="${AT(item.title||'')}"></div><div class="field"><label>内容</label><textarea id="v453WorldMemoryText">${E(item.text||'')}</textarea></div><div class="form-actions"><button class="danger" onclick="v453DeleteWorldMemory(${Q(id)})">删除</button><button onclick="closeModal()">取消</button><button class="primary" onclick="v453SaveWorldMemory(${Q(id)},${Q(item.worldId)})">保存记忆</button></div>`)};
  window.v453SaveWorldMemory=function(id='',worldId=''){const title=document.getElementById('v453WorldMemoryTitle')?.value.trim(),text=document.getElementById('v453WorldMemoryText')?.value.trim();if(!title||!text)return toast('请填写标题和内容');const item=data.memoryWorldEntriesV453.find(entry=>entry.id===id);if(item)Object.assign(item,{title,text,updatedAt:NOW()});else data.memoryWorldEntriesV453.unshift({id:uid('world_memory'),worldId,title,text,createdAt:NOW(),updatedAt:NOW()});save();closeModal();data.runtime.v453MemoryWorldId=worldId;data.runtime.v453MemoryPage='world-detail';renderMemoryV453();toast(item?'世界记忆已保存':'世界记忆已创建')};
  window.v453DeleteWorldMemory=function(id){if(!confirm('删除这条世界记忆？'))return;data.memoryWorldEntriesV453=data.memoryWorldEntriesV453.filter(item=>item.id!==id);save();closeModal();renderMemoryV453();toast('世界记忆已删除')};

  /* Inject only world archives bound to the current character. Existing scoped memory remains untouched. */
  const baseBuildEngineContext=typeof window.buildEngineContext==='function'?window.buildEngineContext:null;
  if(baseBuildEngineContext){
    const buildWithWorldMemory=function(character,userMessage='',chatId=currentChat,mode='all'){const result=baseBuildEngineContext(character,userMessage,chatId,mode)||{},worlds=data.memoryWorldsV453.filter(world=>character&&(world.characterIds||[]).includes(character.id)),worldIds=new Set(worlds.map(world=>world.id)),entries=data.memoryWorldEntriesV453.filter(item=>worldIds.has(item.worldId));if(entries.length){const block=entries.slice(0,60).map(item=>{const world=worlds.find(entry=>entry.id===item.worldId);return`【世界记忆 · ${S(world?.name||'世界')} · ${S(item.title||'未命名')}】\n${S(item.text)}`}).join('\n\n');result.memory=[S(result.memory),block].filter(Boolean).join('\n\n')}return result};window.buildEngineContext=buildWithWorldMemory;try{buildEngineContext=buildWithWorldMemory}catch{}
  }

  /* ---------- Language Partner: common dictionary/book formats + manual/optional AI ---------- */
  function learningStore(){
    const persona=currentPersona(),id=persona?.id||data.activePersonaId||'persona_default',base={words:[],review:[],completed:0,streakDays:0,lastStudyDate:'',dailyGoal:12,voiceMode:'system',speed:1,history:[],feedback:'',tab:'words',practice:'',search:''};
    const state=data.learningV452.personas[id]=Object.assign(base,O(data.learningV452.personas[id]));state.words=Array.isArray(state.words)?state.words:[];return state;
  }
  function normalizeImportWord(raw){
    if(typeof raw==='string')raw={word:raw};raw=O(raw);const word=S(raw.word||raw.term||raw.headword||raw.text||raw.vocabulary||raw.expression).trim(),meaning=S(raw.meaning||raw.translation||raw.definition||raw.gloss||raw.description).trim(),example=S(raw.example||raw.sentence||raw.exampleSentence||raw.context).trim();if(!word)return null;return{id:S(raw.id||uid('word')),word:word.slice(0,300),meaning:meaning.slice(0,3000),example:example.slice(0,3000),notes:S(raw.notes||raw.note||'').slice(0,2000),source:S(raw.source||''),createdAt:S(raw.createdAt||NOW())};
  }
  function dedupeWords(words,limit=5000){const result=[],seen=new Set();for(const raw of words){const word=normalizeImportWord(raw);if(!word)continue;const key=word.word.toLocaleLowerCase().replace(/\s+/g,' ').trim();if(!key||seen.has(key))continue;seen.add(key);result.push(word);if(result.length>=limit)break}return result}
  function parseDelimited(text,delimiter=','){
    const rows=[];let row=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index],next=text[index+1];if(char==='"'&&quoted&&next==='"'){cell+='"';index++;continue}if(char==='"'){quoted=!quoted;continue}if(char===delimiter&&!quoted){row.push(cell);cell='';continue}if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')index++;row.push(cell);if(row.some(value=>S(value).trim()))rows.push(row);row=[];cell='';continue}cell+=char}row.push(cell);if(row.some(value=>S(value).trim()))rows.push(row);return rows
  }
  function rowsToWords(rows){
    if(!rows.length)return[];const first=rows[0].map(value=>S(value).trim().toLowerCase()),headerWords=['word','term','headword','text','vocabulary','expression'],hasHeader=first.some(value=>headerWords.includes(value))||first.some(value=>['meaning','translation','definition','gloss','example','sentence'].includes(value));if(hasHeader){const headers=rows.shift().map(value=>S(value).trim());return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,S(values[index]).trim()]))) }
    return rows.map(values=>({word:S(values[0]).trim(),meaning:S(values[1]).trim(),example:S(values[2]).trim()}));
  }
  function parseTextLines(text){
    const lines=S(text).replace(/^\uFEFF/,'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean),words=[];
    for(const line of lines){
      if(/^\s*(?:#|\/\/)/.test(line))continue;const tabs=line.split('\t');if(tabs.length>1){words.push({word:tabs[0],meaning:tabs[1]||'',example:tabs.slice(2).join('\t')});continue}
      const pair=line.match(/^(.{1,100}?)\s+(?:[-–—]|::|：)\s+(.+)$/);if(pair&&/[A-Za-z]/.test(pair[1])){words.push({word:pair[1],meaning:pair[2]});continue}
      if(line.length<=180&&/[A-Za-z]/.test(line))words.push({word:line});
    }
    return words;
  }
  function extractBookVocabulary(text){
    const words=parseTextLines(text).filter(item=>item.meaning||item.word.split(/\s+/).length<=8),counts=new Map();for(const match of S(text).matchAll(/\b[A-Za-z][A-Za-z'’-]{2,40}\b/g)){const original=match[0],key=original.toLowerCase();counts.set(key,{word:original,count:(counts.get(key)?.count||0)+1})}
    for(const item of [...counts.values()].sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,3500))words.push({word:item.word,notes:`正文出现 ${item.count} 次`});return dedupeWords(words,5000);
  }
  function parseHtmlDictionary(html){
    const documentNode=new DOMParser().parseFromString(S(html),'text/html'),result=[];
    const idxEntries=[...documentNode.getElementsByTagName('idx:entry')];
    for(const entry of idxEntries){const orth=entry.getElementsByTagName('idx:orth')[0],word=orth?.getAttribute('value')||orth?.textContent||entry.getAttribute('name')||'';if(!S(word).trim())continue;const clone=entry.cloneNode(true);for(const node of [...clone.getElementsByTagName('idx:orth')])node.remove();result.push({word,meaning:S(clone.textContent).replace(/\s+/g,' ').trim()})}
    for(const term of documentNode.querySelectorAll('dt')){const definition=term.nextElementSibling?.matches('dd')?term.nextElementSibling.textContent:'';result.push({word:term.textContent,meaning:definition})}
    for(const entry of documentNode.querySelectorAll('[data-word],[data-term],.dictionary-entry,.lexical-entry')){const word=entry.getAttribute('data-word')||entry.getAttribute('data-term')||entry.querySelector('.word,.term,.headword')?.textContent||'';if(word)result.push({word,meaning:entry.querySelector('.meaning,.definition,.translation,.gloss')?.textContent||entry.textContent})}
    if(result.length)return dedupeWords(result);return extractBookVocabulary(documentNode.body?.innerText||documentNode.documentElement?.textContent||'');
  }
  async function inflateRaw(bytes){if(window.pako?.inflateRaw)return new Uint8Array(window.pako.inflateRaw(bytes));if(!('DecompressionStream'in window))throw Error('当前浏览器不支持 EPUB 的 Deflate 解压');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer())}
  function u16le(view,offset){return view.getUint16(offset,true)}function u32le(view,offset){return view.getUint32(offset,true)}
  async function unzipReadableEntries(buffer){
    const bytes=new Uint8Array(buffer),view=new DataView(buffer);let eocd=-1;for(let index=Math.max(0,bytes.length-65557);index<=bytes.length-22;index++)if(u32le(view,index)===0x06054b50)eocd=index;if(eocd<0)throw Error('不是有效的 EPUB/ZIP 文件');const count=u16le(view,eocd+10),directoryOffset=u32le(view,eocd+16),decoder=new TextDecoder('utf-8'),legacyDecoder=new TextDecoder('windows-1252'),entries=[];let cursor=directoryOffset,total=0;
    for(let index=0;index<count&&cursor+46<=bytes.length;index++){
      if(u32le(view,cursor)!==0x02014b50)break;const flags=u16le(view,cursor+8),method=u16le(view,cursor+10),compressedSize=u32le(view,cursor+20),nameLength=u16le(view,cursor+28),extraLength=u16le(view,cursor+30),commentLength=u16le(view,cursor+32),localOffset=u32le(view,cursor+42),nameBytes=bytes.slice(cursor+46,cursor+46+nameLength),name=(flags&0x800?decoder:legacyDecoder).decode(nameBytes);cursor+=46+nameLength+extraLength+commentLength;if(flags&1)throw Error('文件包含加密内容，无法导入');if(!/\.(?:x?html?|xml|opf|ncx|txt|md)$/i.test(name))continue;if(localOffset+30>bytes.length||u32le(view,localOffset)!==0x04034b50)continue;const localNameLength=u16le(view,localOffset+26),localExtraLength=u16le(view,localOffset+28),start=localOffset+30+localNameLength+localExtraLength,compressed=bytes.slice(start,start+compressedSize);let content;if(method===0)content=compressed;else if(method===8)content=await inflateRaw(compressed);else continue;total+=content.length;if(total>24*1024*1024)throw Error('电子书解压后的正文超过 24MB，请拆分后导入');entries.push({name,bytes:content})
    }return entries;
  }
  async function parseEpub(buffer){const entries=await unzipReadableEntries(buffer);if(entries.some(entry=>/META-INF\/encryption\.xml$/i.test(entry.name)))throw Error('EPUB 含加密内容，不能绕过 DRM');const decoder=new TextDecoder('utf-8'),html=entries.filter(entry=>/\.x?html?$/i.test(entry.name)).map(entry=>decoder.decode(entry.bytes)).join('\n');if(html.trim())return parseHtmlDictionary(html);const text=entries.map(entry=>decoder.decode(entry.bytes)).join('\n');return extractBookVocabulary(text)}
  function be16(view,offset){return view.getUint16(offset,false)}function be32(view,offset){return view.getUint32(offset,false)}
  function palmDocInflate(input){
    const output=[];for(let index=0;index<input.length;){const value=input[index++];if(value===0){output.push(0);continue}if(value<=8){for(let count=0;count<value&&index<input.length;count++)output.push(input[index++]);continue}if(value<=0x7f){output.push(value);continue}if(value>=0xc0){output.push(0x20,value^0x80);continue}if(index>=input.length)break;const pair=(value<<8)|input[index++],distance=(pair>>3)&0x7ff,length=(pair&7)+3;if(!distance||distance>output.length)continue;for(let count=0;count<length;count++)output.push(output[output.length-distance])}return new Uint8Array(output)
  }
  function parseMobi(buffer){
    const bytes=new Uint8Array(buffer),view=new DataView(buffer);if(bytes.length<100)throw Error('MOBI 文件过小或已损坏');const recordTotal=be16(view,76);if(!recordTotal||78+recordTotal*8>bytes.length)throw Error('不是有效的 MOBI/PalmDB 文件');const offsets=[];for(let index=0;index<recordTotal;index++)offsets.push(be32(view,78+index*8));offsets.push(bytes.length);const first=offsets[0];if(first+16>bytes.length)throw Error('MOBI 头部不完整');const compression=be16(view,first),textLength=be32(view,first+4),textRecords=be16(view,first+8),encryption=be16(view,first+12);if(encryption!==0)throw Error('MOBI/AZW 含 DRM 或加密内容，不能导入');if(![1,2].includes(compression))throw Error(`暂不支持这种 MOBI 压缩方式（${compression}）；可先转换为 EPUB/TXT`);let encoding=65001;if(first+32<bytes.length&&String.fromCharCode(...bytes.slice(first+16,first+20))==='MOBI')encoding=be32(view,first+28);const chunks=[];let total=0;for(let index=1;index<=Math.min(textRecords,recordTotal-1);index++){const raw=bytes.slice(offsets[index],offsets[index+1]),chunk=compression===2?palmDocInflate(raw):raw;chunks.push(chunk);total+=chunk.length;if(total>30*1024*1024)throw Error('MOBI 解压后的正文超过 30MB，请拆分后导入')}const merged=new Uint8Array(Math.min(textLength||total,total));let cursor=0;for(const chunk of chunks){if(cursor>=merged.length)break;const part=chunk.slice(0,merged.length-cursor);merged.set(part,cursor);cursor+=part.length}const decoder=new TextDecoder(encoding===65001?'utf-8':'windows-1252'),text=decoder.decode(merged);return /<\/?(?:html|body|p|idx:entry|mbp:pagebreak)\b/i.test(text)?parseHtmlDictionary(text):extractBookVocabulary(text)
  }
  async function parseDictionaryFile(file){
    if(file.size>30*1024*1024)throw Error('单个文件请控制在 30MB 内');const name=S(file.name).toLowerCase(),extension=name.includes('.')?name.split('.').pop():'';
    if(['epub'].includes(extension))return parseEpub(await file.arrayBuffer());if(['mobi','azw','azw3'].includes(extension))return parseMobi(await file.arrayBuffer());
    const text=await file.text();if(extension==='json'){const parsed=JSON.parse(text);if(Array.isArray(parsed))return dedupeWords(parsed);if(Array.isArray(parsed.words))return dedupeWords(parsed.words);return dedupeWords(Object.entries(O(parsed)).map(([word,meaning])=>typeof meaning==='object'?{word,...meaning}:{word,meaning}))}
    if(extension==='jsonl'||extension==='ndjson'){return dedupeWords(text.split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return{word:line}}}))}
    if(extension==='csv')return dedupeWords(rowsToWords(parseDelimited(text,',')));if(extension==='tsv')return dedupeWords(rowsToWords(parseDelimited(text,'\t')));if(['html','htm','xhtml'].includes(extension)||/<\/?(?:html|body|idx:entry)\b/i.test(text))return parseHtmlDictionary(text);return dedupeWords(parseTextLines(text).length?parseTextLines(text):extractBookVocabulary(text));
  }
  window.v453ParseDictionaryFile=parseDictionaryFile;
  let pendingDictionaryWords=[];
  function dictionaryOverlay(html){const phone=document.querySelector('.vphone');if(!phone)return modal(html);document.querySelector('.v453-import-overlay')?.remove();const root=document.createElement('section');root.className='v453-import-overlay';root.innerHTML=`<div class="v453-import-sheet">${html}</div>`;phone.appendChild(root);shieldTree(root)}
  window.v453CloseDictionaryOverlay=function(){document.querySelector('.v453-import-overlay')?.remove()};
  function showDictionaryPreview(words,fileName='手动录入'){
    pendingDictionaryWords=dedupeWords(words);dictionaryOverlay(`<header><div><small>IMPORT PREVIEW</small><h2>确认导入词库</h2></div><button onclick="v453CloseDictionaryOverlay()">×</button></header><div class="v453-import-note">${E(fileName)} · 已识别 ${pendingDictionaryWords.length} 个不重复词条。逗号不会拆分完整词语或例句。</div><div class="v453-import-preview">${pendingDictionaryWords.slice(0,30).map(word=>`<article><b>${E(word.word)}</b><small>${E(word.meaning||'未填写释义')}${word.example?` · ${E(word.example)}`:''}</small></article>`).join('')||'<article>没有识别到词条</article>'}</div><label class="v453-import-toggle"><span><b>由 AI 补全空缺</b><small>补充释义与例句；关闭时只保存实际解析结果</small></span><input id="v453DictionaryAI" type="checkbox" ${typeof validModel==='function'&&(validModel('translation')||validModel('chat'))?'':'disabled'}></label><div id="v453ImportProgress" class="v453-import-progress"></div><div class="v453-import-actions"><button onclick="v453CloseDictionaryOverlay()">取消</button><button class="primary" onclick="v453CommitDictionaryImport()">导入 ${pendingDictionaryWords.length} 条</button></div>`)}
  window.v452ImportDictionary=async function(event){const file=event?.target?.files?.[0];if(!file)return;try{toast('正在本机解析词典文件…');const words=await parseDictionaryFile(file);showDictionaryPreview(words,file.name)}catch(error){errorDetail(error,'词典文件无法读取')}finally{if(event?.target)event.target.value=''}};
  window.v453OpenManualDictionary=function(){dictionaryOverlay(`<header><div><small>MANUAL ENTRY</small><h2>手动填写词条</h2></div><button onclick="v453CloseDictionaryOverlay()">×</button></header><div class="v453-import-note">默认一行一个完整词条；逗号保留。可用 Tab 依次填写“英文、释义、例句”。</div><div class="field"><label>词条内容</label><textarea id="v453ManualDictionary" placeholder="serendipity\ntake it for granted\t认为……理所当然\nby the way\t顺便说一句\tBy the way, are you free tomorrow?"></textarea></div><div class="v453-import-actions"><button onclick="v453CloseDictionaryOverlay()">取消</button><button class="primary" onclick="v453PreviewManualDictionary()">识别词条</button></div>`)};
  window.v453PreviewManualDictionary=function(){const text=document.getElementById('v453ManualDictionary')?.value||'',words=parseTextLines(text);if(!words.length)return toast('请先填写至少一个词条');showDictionaryPreview(words,'手动填写')};
  function parseJsonArray(raw){const text=S(raw),start=text.indexOf('['),end=text.lastIndexOf(']');if(start<0||end<=start)return[];try{const value=JSON.parse(text.slice(start,end+1));return Array.isArray(value)?value:[]}catch{return[]}}
  async function completeWordsWithAI(words){
    const missing=words.filter(word=>!word.meaning||!word.example);if(!missing.length)return words;const kind=typeof validModel==='function'&&validModel('translation')?'translation':'chat';if(!(typeof validModel==='function'&&validModel(kind)))return words;const limit=Math.min(300,missing.length);if(missing.length>limit&&!confirm(`本次有 ${missing.length} 个待补全词条。为避免一次消耗过多，只先补全前 ${limit} 个，继续吗？`))return words;const progress=document.getElementById('v453ImportProgress');
    for(let offset=0;offset<limit;offset+=20){const batch=missing.slice(offset,Math.min(limit,offset+20));if(progress)progress.textContent=`AI 正在补全 ${offset+1}–${Math.min(limit,offset+20)} / ${limit}`;const controller=withTimeout(Number(data.settings.timeout)||60000);try{const raw=await invokeModel(kind,{system:'你是本地词库补全工具。严格只输出 JSON 数组，每项包含 word、meaning、example；meaning 用简体中文，example 用自然英文。不得添加数组外文字。',history:[{role:'user',content:JSON.stringify(batch.map(word=>({word:word.word,meaning:word.meaning||'',example:word.example||''})))}],temperature:.2,maxTokens:2400,signal:controller.signal}),rows=parseJsonArray(raw);for(const row of rows){const target=batch.find(word=>word.word.toLowerCase()===S(row.word).toLowerCase());if(target){if(!target.meaning)target.meaning=S(row.meaning).trim();if(!target.example)target.example=S(row.example).trim()}}}finally{releaseController(controller)}}return words;
  }
  window.v453CommitDictionaryImport=async function(){if(!pendingDictionaryWords.length)return toast('没有可导入的词条');const ai=document.getElementById('v453DictionaryAI')?.checked===true,button=document.querySelector('.v453-import-actions .primary');if(button){button.disabled=true;button.textContent=ai?'正在补全…':'正在导入…'}try{const incoming=ai?await completeWordsWithAI(pendingDictionaryWords):pendingDictionaryWords,state=learningStore(),seen=new Set(state.words.map(word=>S(word.word||word.term).toLowerCase()));let added=0;for(const word of incoming)if(!seen.has(word.word.toLowerCase())){state.words.push(word);seen.add(word.word.toLowerCase());added++}save();v453CloseDictionaryOverlay();if(typeof v452SetLearningTab==='function')v452SetLearningTab('words');setTimeout(enhanceDictionaryPage,0);toast(added?`已导入 ${added} 个词条`:'没有发现可新增的词条')}catch(error){errorDetail(error,'词库导入失败')}finally{pendingDictionaryWords=[]}};
  function enhanceDictionaryPage(){
    const page=document.querySelector('.v452-app-learning .v452-learn-page'),tools=page?.querySelector('.v452-dictionary-tools');if(!page||!tools||page.querySelector('.v453-dictionary-actions'))return;const oldImport=tools.querySelector('.v452-import-button');if(oldImport)oldImport.style.display='none';tools.insertAdjacentHTML('afterend',`<div class="v453-dictionary-actions"><label>导入文件<input type="file" accept=".txt,.md,.csv,.tsv,.json,.jsonl,.ndjson,.html,.htm,.xhtml,.epub,.mobi,.azw,.azw3,text/plain,text/csv,application/json,application/epub+zip" onchange="v452ImportDictionary(event)"></label><button onclick="v453OpenManualDictionary()">手动填写</button></div><div class="v453-dictionary-formats"><b>支持常见未加密文件：</b> TXT、MD、CSV、TSV、JSON、JSONL、HTML、EPUB、MOBI、AZW/AZW3。带 DRM 的文件会明确拒绝，不会伪装导入成功。AI 补全可在每次导入时单独开关。</div>`);const note=page.querySelector('.v452-source-note');if(note)note.style.display='none';shieldTree(page)
  }
  const baseLearningTab=window.v452SetLearningTab;
  if(typeof baseLearningTab==='function')window.v452SetLearningTab=function(tab){const result=baseLearningTab(tab);if(tab==='words')setTimeout(enhanceDictionaryPage,0);return result};

  /* ---------- Square: mature long-video detail hierarchy ---------- */
  function squareStore(){const persona=currentPersona(),id=persona?.id||data.activePersonaId||'persona_default',base={posts:[],shorts:[],longs:[],threads:[],liked:[],saved:[],tab:'short'},state=data.squareV452.personas[id]=Object.assign(base,O(data.squareV452.personas[id]));for(const key of ['posts','shorts','longs','threads'])state[key]=Array.isArray(state[key])?state[key]:[];return state}
  function longItem(id){return squareStore().longs.find(item=>item.id===id)}
  function longAuthor(item){if(item.author)return S(item.author);if(item.authorType==='user')return currentPersona()?.name||'USER';const names=(item.participants||[]).map(token=>{const [kind,id]=S(token).split(':');return kind==='character'?data.characters?.find(entry=>entry.id===id)?.name:(data.mpcs||[]).find(entry=>entry.id===id)?.name}).filter(Boolean);return names.join(' / ')||'角色内容'}
  function longComments(item){item.comments=Array.isArray(item.comments)?item.comments.map(comment=>typeof comment==='string'?{id:uid('comment'),authorType:'role',author:'角色',text:comment,at:NOW(),likes:0}:comment).filter(Boolean):[];return item.comments}
  function longImage(item){try{return safeImageSrc(item.image)||''}catch{return /^(?:data:image\/|https:\/\/|blob:)/i.test(S(item.image))?S(item.image):''}}
  function longDuration(item){const chapters=Math.max(1,Array.isArray(item.chapters)?item.chapters.length:1),seconds=Math.max(180,chapters*126),minutes=Math.floor(seconds/60),rest=String(seconds%60).padStart(2,'0');return`${minutes}:${rest}`}
  function renderLongHub(){
    const state=squareStore();if(state.tab!=='long')return;const view=document.querySelector('.v452-app-square .v452-square-view');if(!view)return;view.classList.remove('immersive');view.innerHTML=`<section class="v453-long-hub"><header class="v453-long-hub-head"><div><small>LONG VIDEO</small><h2>长内容</h2></div><button onclick="v452OpenPublishChoice('long')">＋ 创建</button></header>${state.longs.length?state.longs.map(item=>`<button class="v453-long-card" onclick="v452OpenLongDetail(${Q(item.id)})"><div class="v453-long-thumb">${longImage(item)?`<img loading="lazy" src="${AT(longImage(item))}" alt="">`:'<i>◇</i>'}<span>${longDuration(item)}</span></div><div><b>${E(item.title||'未命名长内容')}</b><p>${E(item.summary||item.content||'')}</p><small>${E(longAuthor(item))} · ${Number(item.views)||0} 次观看 · ${Number(item.likes)||0} 赞 · ${longComments(item).length} 条评论</small></div></button>`).join(''):`<div class="v453-memory-empty">还没有长内容。<br>可以由 USER 发布，或让角色／MPC 依据剧情生成标题、正文和多幕内容。<div class="v453-memory-actions"><button class="primary" onclick="v452OpenPublishChoice('long')">创建第一条长内容</button></div></div>`}</section>`;shieldTree(view)
  }
  const playback={id:'',index:0,timer:0,playing:false};
  function stopLongPlayback(){clearInterval(playback.timer);playback.timer=0;playback.playing=false}
  function updateLongStage(item){
    const chapters=Array.isArray(item.chapters)&&item.chapters.length?item.chapters:[{title:item.title||'完整内容',text:item.content||''}],chapter=chapters[playback.index%chapters.length],title=document.getElementById('v453StageTitle'),mark=document.getElementById('v453StageMark'),progress=document.querySelector('.v453-video-progress');if(title)title.textContent=S(chapter.title||`第 ${playback.index+1} 幕`);if(mark)mark.textContent=String(playback.index+1).padStart(2,'0');if(progress)progress.style.setProperty('--v453-progress',`${Math.round((playback.index+1)/chapters.length*100)}%`);const button=document.getElementById('v453VideoPlay');if(button)button.textContent=playback.playing?'Ⅱ':'▶';
  }
  window.v453ToggleLongPlayback=function(id){const item=longItem(id);if(!item)return;const chapters=Array.isArray(item.chapters)&&item.chapters.length?item.chapters:[{}];if(playback.playing&&playback.id===id){stopLongPlayback();updateLongStage(item);return}stopLongPlayback();playback.id=id;playback.playing=true;updateLongStage(item);playback.timer=setInterval(()=>{playback.index++;if(playback.index>=chapters.length){playback.index=chapters.length-1;stopLongPlayback()}updateLongStage(item)},2400)};
  function renderLongDetail(id,{countView=false}={}){
    const item=longItem(id);if(!item)return;if(countView){item.views=Math.max(0,Number(item.views)||0)+1;item.lastViewedAt=NOW();save()}stopLongPlayback();playback.id=id;playback.index=0;const body=document.querySelector('.v452-app-square');if(!body)return;const chapters=Array.isArray(item.chapters)&&item.chapters.length?item.chapters:[{title:'完整内容',text:item.article||item.content||item.summary||''}],comments=longComments(item),recommendations=squareStore().longs.filter(entry=>entry.id!==id).slice(0,4),image=longImage(item),video=S(item.videoUrl||item.video||'');
    const stage=/^(?:https:\/\/|blob:|data:video\/)/i.test(video)?`<video controls playsinline preload="metadata" src="${AT(video)}"></video>`:`${image?`<img src="${AT(image)}" alt="">`:'<span class="v453-video-stage-mark" id="v453StageMark">01</span>'}<span class="v453-video-stage-tag" id="v453StageTitle">${E(chapters[0]?.title||'AI 多幕生成内容')}</span><button class="v453-video-play" id="v453VideoPlay" onclick="v453ToggleLongPlayback(${Q(id)})">▶</button><div class="v453-video-progress" style="--v453-progress:${Math.round(1/chapters.length*100)}%"><i></i><small><span>生成式多幕内容</span><span>${longDuration(item)}　字幕　设置　全屏</span></small></div>`;
    body.innerHTML=`<section class="v453-video-page"><header class="v453-video-top"><button onclick="v452SetSquareTab('long')">‹</button><b>长内容详情</b><button onclick="toast('分享入口已保留；不会自动外发')">↗</button></header><div class="v453-video-stage">${stage}</div><article class="v453-video-info"><button class="v453-video-ai" onclick="v453AICompleteLong(${Q(id)})">✦ AI 生成／完善标题、内容、评论与初始互动数</button><h1 class="v453-video-title">${E(item.title||'未命名长内容')}</h1><div class="v453-video-meta">${Number(item.views)||0} 次观看 · ${E(item.createdAt?new Date(item.createdAt).toLocaleString('zh-CN'):'刚刚')} · ${chapters.length} 幕</div><div class="v453-video-actions"><button class="${item.liked?'on':''}" onclick="v453ToggleLongLike(${Q(id)})">${item.liked?'已赞':'赞'} ${Number(item.likes)||0}</button><button onclick="toast('不喜欢只影响当前 USER 的推荐，不修改原内容')">不喜欢</button><button onclick="toast('分享入口已保留；不会自动外发')">分享</button><button onclick="v452ToggleDetailSave('long',${Q(id)})">${item.saved?'已收藏':'收藏'}</button></div><div class="v453-video-author"><span>${item.authorType==='user'?'我':'TA'}</span><div><b>${E(longAuthor(item))}</b><small>${(item.participants||[]).length||1} 位内容参与者</small></div><button>关注</button></div><section class="v453-video-description"><b>简介</b><p>${E(item.article||item.summary||item.content||'')}</p></section><button class="v453-video-comments" onclick="v452OpenSquareComments('long',${Q(id)})"><b>评论 ${comments.length}</b><small>${comments.length?`${E(comments[0].author||'角色')}：${E(comments[0].text||'')}`:'还没有评论，点击进入评论区'}</small></button><section class="v453-video-chapters"><h3>内容章节</h3>${chapters.map((chapter,index)=>`<article class="v453-video-chapter"><b>${String(index+1).padStart(2,'0')} · ${E(typeof chapter==='string'?chapter:chapter.title||`第 ${index+1} 幕`)}</b><p>${E(typeof chapter==='string'?'':chapter.text||'')}</p></article>`).join('')}</section>${item.authorType==='user'?`<div class="v453-memory-actions"><button onclick="v452OpenSquareEditor('long',${Q(id)},'edit')">编辑</button><button onclick="v452OpenSquareEditor('long',${Q(id)},'modify')">修改并保留记录</button></div>`:''}<div class="v453-video-next-title">接下来播放</div>${recommendations.map(entry=>`<button class="v453-video-next" onclick="v452OpenLongDetail(${Q(entry.id)})"><figure>${longImage(entry)?`<img loading="lazy" src="${AT(longImage(entry))}" alt="">`:'◇'}</figure><div><b>${E(entry.title||'未命名长内容')}</b><small>${E(longAuthor(entry))} · ${longDuration(entry)} · ${Number(entry.views)||0} 次观看</small></div></button>`).join('')||'<div class="v453-memory-empty">暂无更多长内容推荐</div>'}</article></section>`;shieldTree(body)
  }
  window.v452OpenLongDetail=function(id){renderLongDetail(id,{countView:true})};
  window.v453ToggleLongLike=function(id){const item=longItem(id);if(!item)return;item.liked=!item.liked;item.likes=Math.max(0,(Number(item.likes)||0)+(item.liked?1:-1));save();renderLongDetail(id)};
  function parseJsonObject(raw){const text=S(raw),start=text.indexOf('{'),end=text.lastIndexOf('}');if(start<0||end<=start)return{};try{return O(JSON.parse(text.slice(start,end+1)))}catch{return{}}}
  function participantForToken(token){const [kind,id]=S(token).split(':');if(kind==='character')return data.characters?.find(item=>item.id===id);if(kind==='mpc')return(data.mpcs||[]).find(item=>item.id===id);return null}
  window.v453AICompleteLong=async function(id){
    const item=longItem(id);if(!item)return;const modelKind=typeof validModel==='function'&&validModel('feed')?'feed':'chat';if(!(typeof validModel==='function'&&validModel(modelKind)))return toast('请先配置动态生成模型或主聊天模型');if(item.authorType==='user'&&!confirm('这会用 AI 完善 USER 长内容的标题、简介和章节；原文会写入修改记录。继续吗？'))return;const participants=(item.participants||[]).map(participantForToken).filter(Boolean),currentCharacter=typeof directCharacterForChat==='function'?directCharacterForChat(currentChat):null;if(!participants.length&&currentCharacter)participants.push(currentCharacter);const recent=(data.chats?.[currentChat]||[]).slice(-16).map(message=>`${message.role==='user'?'USER':'角色'}：${S(message.text)}`).join('\n'),controller=withTimeout(Number(data.settings.timeout)||60000),beforeUserContent=item.authorType==='user'?S(item.article||item.content||item.summary):'';toast('正在生成长内容标题、章节、评论和互动数据…');
    try{const raw=await invokeModel(modelKind,{system:'你是原创长内容编排器。把给定资料整理为成熟长视频详情所需的数据。不得替 USER 新增立场或行为，不得编造现实账号。严格只输出 JSON 对象：title、summary、article、chapters、comments、likes、views。chapters 为 1-8 个 {title,text}；comments 为 0-12 个 {author,text}，评论者只能使用给出的参与者名称；likes 和 views 为合理非负整数，views 不小于 likes。',history:[{role:'user',content:`当前标题：${item.title||''}\n当前正文：${item.content||item.article||''}\n参与者：${participants.map(entity=>entity.name||'参与者').join('、')||longAuthor(item)}\n参与者资料：${participants.map(entity=>JSON.stringify(entity)).join('\n')}\n近期剧情：${recent||'暂无'}`}],temperature:.65,maxTokens:3600,signal:controller.signal}),parsed=parseJsonObject(raw);if(S(parsed.title).trim())item.title=S(parsed.title).trim().slice(0,300);if(S(parsed.summary).trim())item.summary=S(parsed.summary).trim().slice(0,3000);if(S(parsed.article).trim())item.article=S(parsed.article).trim().slice(0,12000);if(Array.isArray(parsed.chapters)&&parsed.chapters.length)item.chapters=parsed.chapters.slice(0,8).map((chapter,index)=>({title:S(chapter?.title||`第 ${index+1} 幕`).slice(0,300),text:S(chapter?.text||'').slice(0,5000)}));if(Array.isArray(parsed.comments)&&participants.length){const allowed=new Set(participants.map(entity=>S(entity.name))),fallback=participants[0]?.name||'角色';item.comments=parsed.comments.slice(0,12).filter(row=>S(row?.text).trim()).map(row=>({id:uid('comment'),authorType:'role',author:allowed.has(S(row.author))?S(row.author):fallback,text:S(row.text).trim().slice(0,1200),at:NOW(),likes:0}))}item.likes=Math.max(0,Math.min(9999999,Math.round(Number(parsed.likes)||Number(item.likes)||0)));item.views=Math.max(item.likes,Math.min(99999999,Math.round(Number(parsed.views)||Number(item.views)||item.likes)));if(item.authorType==='user'){item.modifyHistory=Array.isArray(item.modifyHistory)?item.modifyHistory:[];item.modifyHistory.push({before:beforeUserContent,after:S(item.article||item.summary||item.content),reason:'USER 确认使用 AI 完善长内容',at:NOW()})}item.aiCompletedAt=NOW();save();renderLongDetail(id);toast('长内容与评论数据已生成并保存')}catch(error){errorDetail(error,'长内容 AI 生成失败')}finally{releaseController(controller)}
  };
  const baseSquareTab=window.v452SetSquareTab;
  if(typeof baseSquareTab==='function')window.v452SetSquareTab=function(tab){stopLongPlayback();const result=baseSquareTab(tab);if(tab==='long')setTimeout(renderLongHub,0);return result};
  const baseSquareSave=window.v452SaveSquareComposer;
  if(typeof baseSquareSave==='function')window.v452SaveSquareComposer=async function(kind){const before=new Set(squareStore().longs.map(item=>item.id)),result=await baseSquareSave(kind);const created=squareStore().longs.find(item=>!before.has(item.id));if(created){created.likes=Math.max(0,Number(created.likes)||0);created.views=Math.max(0,Number(created.views)||0);longComments(created);save()}setTimeout(()=>{if(squareStore().tab==='long')renderLongHub()},0);return result};

  /* Patch app-open paths without replacing either phone desktop. */
  const baseStandalone=window.v452OpenStandaloneApp;if(typeof baseStandalone==='function')window.v452OpenStandaloneApp=function(key){const result=baseStandalone(key);setTimeout(()=>{if(key==='learning')enhanceDictionaryPage();if(key==='square'&&squareStore().tab==='long')renderLongHub();shieldTree(document.querySelector('.vphone'))},0);return result};
  const baseRenderPhoneApp=window.v452RenderPhoneApp;if(typeof baseRenderPhoneApp==='function')window.v452RenderPhoneApp=function(owner,key){const result=baseRenderPhoneApp(owner,key);setTimeout(()=>{if(key==='learning')enhanceDictionaryPage();if(key==='square'&&squareStore().tab==='long')renderLongHub();shieldTree(document.querySelector('.vphone'))},0);return result};
  const basePhoneApp=window.v43OpenPhoneApp;if(typeof basePhoneApp==='function'){
    const safePhoneApp=function(owner,key){const result=basePhoneApp(owner,key);setTimeout(()=>{if(key==='learning')enhanceDictionaryPage();if(key==='square'&&squareStore().tab==='long')renderLongHub();shieldTree(document.querySelector('.vphone'))},0);return result};window.v43OpenPhoneApp=safePhoneApp;window.openSimPhoneApp=safePhoneApp;try{v43OpenPhoneApp=safePhoneApp;openSimPhoneApp=safePhoneApp}catch{}
  }

  /* ---------- restore/clear/import resilience ---------- */
  function repairDataShape(){
    data.settings=O(data.settings);data.runtime=O(data.runtime);data.characters=Array.isArray(data.characters)?data.characters:[];data.personas=Array.isArray(data.personas)&&data.personas.length?data.personas:[typeof defaultPersona==='function'?defaultPersona():{id:'persona_default',name:'我'}];data.chats=O(data.chats);data.chatSettings=O(data.chatSettings);data.chatSummaries=O(data.chatSummaries);data.memories=Array.isArray(data.memories)?data.memories:[];data.apiConfigs=O(data.apiConfigs);data.modelBindings=O(data.modelBindings);data.memoryWorldsV453=Array.isArray(data.memoryWorldsV453)?data.memoryWorldsV453:[];data.memoryWorldEntriesV453=Array.isArray(data.memoryWorldEntriesV453)?data.memoryWorldEntriesV453:[];data.learningV452=O(data.learningV452);data.learningV452.personas=O(data.learningV452.personas);data.squareV452=O(data.squareV452);data.squareV452.personas=O(data.squareV452.personas)
  }
  const baseImportCharacter=window.importCharacterCard;if(typeof baseImportCharacter==='function')window.importCharacterCard=function(...args){repairChatShell();const before=(data.characters||[]).length,result=baseImportCharacter.apply(this,args);let checks=0;const timer=setInterval(()=>{checks++;repairChatShell();if((data.characters||[]).length!==before||checks>240){clearInterval(timer);repairDataShape();repairChatShell()}},500);return result};
  const baseImportData=window.importSJ;if(typeof baseImportData==='function')window.importSJ=function(...args){repairDataShape();repairChatShell();return baseImportData.apply(this,args)};
  const baseResetData=window.resetData;if(typeof baseResetData==='function')window.resetData=function(...args){repairChatShell();return baseResetData.apply(this,args)};

  /* Keep exported data version clear while retaining every existing field. */
  const baseExport=window.exportSJ;if(typeof baseExport==='function')window.exportSJ=function(){try{const copy=JSON.parse(JSON.stringify(data));for(const profile of Object.values(copy.models||{}))if(profile&&typeof profile==='object')delete profile.key;for(const profile of Object.values(copy.apiConfigs||{}))if(profile&&typeof profile==='object'){delete profile.key;delete profile.apiKey;delete profile.token;delete profile.accessToken;delete profile.signature}if(copy.settings&&typeof copy.settings==='object'){delete copy.settings.apiKey;delete copy.settings.apiKeyToken}downloadJSON({format:'pokeji-data',version:'45.3.1',exportedAt:NOW(),data:copy},`pokeji-data-${Date.now()}.json`);toast('最终资料已导出（API Key 未包含）')}catch(error){errorDetail(error,'资料导出失败')}};

  /* One child-list observer only. No watched-attribute writes, so no recursive API freeze. */
  let mutationScheduled=false;
  const observer=new MutationObserver(records=>{if(mutationScheduled)return;mutationScheduled=true;queueMicrotask(()=>{mutationScheduled=false;for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)shieldTree(node);repairChatShell();if(document.querySelector('.v452-app-learning'))enhanceDictionaryPage();if(document.querySelector('.v452-app-square')&&squareStore().tab==='long'&&!document.querySelector('.v453-long-hub,.v453-video-page'))renderLongHub()})});
  observer.observe(document.body,{childList:true,subtree:true});

  repairDataShape();repairChatShell();shieldTree(document);syncViewport();
  window.addEventListener('pageshow',()=>{repairDataShape();repairChatShell();shieldTree(document);syncViewport()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){repairChatShell();syncViewport()}});
  setTimeout(()=>{repairChatShell();shieldTree(document);if(document.getElementById('memory')?.classList.contains('active'))renderMemoryV453()},0);
  setTimeout(()=>{repairChatShell();shieldTree(document)},800);
  save();
})();
