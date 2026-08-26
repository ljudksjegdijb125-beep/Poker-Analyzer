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
  /* V45.4.1: opening or viewing a phone page is not a visible record. */
  function addLinkedRecord(){return null}
  function linkedRows(){return[]}
  function injectLinkedRows(){document.querySelectorAll('.v452-linked-records').forEach(element=>element.remove())}
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