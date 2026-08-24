/* =========================================================
   POKEJI V45.2 · linked phone records and small stability fixes
   ========================================================= */
(function(){
  if(window.__pokejiV452Loaded)return;
  window.__pokejiV452Loaded=true;
  const S=(v,f='')=>String(v??f),Q=v=>`decodeURIComponent('${encodeURIComponent(String(v??'')).replace(/'/g,'%27')}')`;
  data.phoneLinks=Array.isArray(data.phoneLinks)?data.phoneLinks:[];
  data.runtime=data.runtime&&typeof data.runtime==='object'?data.runtime:{};
  data.runtime.phoneViewMarks=data.runtime.phoneViewMarks&&typeof data.runtime.phoneViewMarks==='object'?data.runtime.phoneViewMarks:{};
  let changed=false;
  for(const list of Object.values(data.chats||{}))for(const m of Array.isArray(list)?list:[]){if(m?.kind==='voice'&&!m.transcript){m.transcript=S(m.text);changed=true}}
  if(changed)save();

  function getPhoneSession(){try{return v435PhoneSession||{mode:'browse',owner:'',chatId:currentChat}}catch{return{mode:'browse',owner:'',chatId:currentChat}}}
  function phoneCharacter(){const group=groupForChat(currentChat);return group?data.characters.find(c=>c.id===group.memberIds[group.turnIndex%Math.max(1,group.memberIds.length)]):directCharacterForChat(currentChat)}
  function addChatPhoneRecord(message,role='user',type='phone',direction='outgoing'){
    if(!currentChat)return;
    data.chats[currentChat]??=[];
    data.chats[currentChat].push({id:'msg_'+v44UUID(),role:role==='assistant'?'assistant':'user',kind:'message',phoneEvent:true,phoneEventType:type,phoneDirection:direction,text:S(message),time:time(),mode:groupForChat(currentChat)?'group':currentChatMode,sceneMode:currentOfflineStyle});
    save();renderMessages();
  }
  function addLinkedRecord(owner,key){
    const session=getPhoneSession();if(!currentChat||!['check','reverse'].includes(session.mode))return;
    const character=phoneCharacter(),characterId=character?.id||'',target=owner==='user'?characterId:'user',mark=`${currentChat}|${session.mode}|${owner}|${key}`;
    const exists=data.phoneLinks.some(x=>x.mark===mark);if(!exists){data.phoneLinks.unshift({id:'plink_'+v44UUID(),mark,chatId:currentChat,personaId:activePersonaFor(currentChat)?.id||'',owner,target,app:key,mode:session.mode,time:time(),text:session.mode==='check'?`我查看了${character?.name||'角色'}的${V43_PHONE_APPS[key]?.name||key}。`:`${character?.name||'角色'}查看了我的${V43_PHONE_APPS[key]?.name||key}。`});data.phoneLinks=data.phoneLinks.slice(0,300);save()}
    if(!data.runtime.phoneViewMarks[mark]){data.runtime.phoneViewMarks[mark]=Date.now();addChatPhoneRecord(data.phoneLinks.find(x=>x.mark===mark).text,session.mode==='check'?'user':'assistant','phone-view',session.mode==='check'?'outgoing':'incoming')}
  }
  function linkedRows(owner,key){
    const session=getPhoneSession(),persona=activePersonaFor(currentChat)?.id||'';
    return data.phoneLinks.filter(x=>x.chatId===currentChat&&x.personaId===persona&&(x.owner===owner||x.target===owner)&&(x.app===key||!key)).slice(0,30);
  }
  function injectLinkedRows(owner,key){
    const body=document.querySelector('.vphone-app-body');if(!body)return;
    body.querySelector('.v452-linked-records')?.remove();const rows=linkedRows(owner,key);if(!rows.length)return;
    const section=document.createElement('section');section.className='v452-linked-records';section.innerHTML=`<div class="v452-linked-title">已连接到本会话</div>${rows.map(row=>`<button class="v452-linked-row" onclick="closePhone()"><span>${row.mode==='check'?'▣':'◈'}</span><div><b>${esc(row.text)}</b><small>${esc(row.time||'')}</small></div><i>↗</i></button>`).join('')}`;body.appendChild(section);
  }
  const baseOpenApp=typeof v43OpenPhoneApp==='function'?v43OpenPhoneApp:null;
  if(baseOpenApp){
    v43OpenPhoneApp=function(owner,key){const result=baseOpenApp(owner,key);setTimeout(()=>{addLinkedRecord(owner,key);injectLinkedRows(owner,key)},30);return result};
    openSimPhoneApp=v43OpenPhoneApp;
  }
  const baseClose=closeModal;
  closeModal=function(){document.getElementById('modal')?.classList.remove('call-fullscreen');return baseClose()};
  if(typeof closePhone==='function'){
    const oldClosePhone=closePhone;closePhone=function(){document.getElementById('modal')?.classList.remove('call-fullscreen');return oldClosePhone()};
  }
  /* Keep the automatic spoken-text line even for older messages loaded from storage. */
  const oldRenderMessages=renderMessages;
  renderMessages=function(){const result=oldRenderMessages();for(const list of Object.values(data.chats||{}))for(const m of Array.isArray(list)?list:[])if(m?.kind==='voice'&&!m.transcript)m.transcript=S(m.text);return result};
})();