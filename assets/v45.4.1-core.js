/* =========================================================
   POKEJI V45.4.1 · shared refinement core
   - data-safe migration helpers
   - owner-scoped real phone application stores
   - removal of obsolete visible phone-view artifacts
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV455CoreLoaded)return;
  window.__pokejiV455CoreLoaded=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const A=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const uid=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}`;
  const clone=value=>{try{return JSON.parse(JSON.stringify(value))}catch{return value}};
  const saveData=()=>{try{save()}catch{}};

  data.runtime=O(data.runtime);
  data.phoneV454=O(data.phoneV454);
  data.phoneV454.events=Array.isArray(data.phoneV454.events)?data.phoneV454.events:[];data.phoneV454.reverse=O(data.phoneV454.reverse);data.phoneV454.reversePrefs=O(data.phoneV454.reversePrefs);
  data.simPhones=O(data.simPhones);data.simPhones.personas=O(data.simPhones.personas);data.simPhones.characters=O(data.simPhones.characters);
  data.blockRelationsV455=O(data.blockRelationsV455);

  function chatKey(chatId=currentChat){try{return canonicalChatId(chatId)}catch{return S(chatId)}}
  function personaFor(chatId=currentChat){try{return activePersonaFor(chatId)||data.personas?.find(x=>x.id===data.activePersonaId)||data.personas?.[0]}catch{return data.personas?.find(x=>x.id===data.activePersonaId)||data.personas?.[0]}}
  function directCharacter(chatId=currentChat){try{return directCharacterForChat(chatId)}catch{return null}}
  function currentWorld(chatId=currentChat){
    const character=directCharacter(chatId),group=typeof groupForChat==='function'?groupForChat(chatId):null,worlds=Array.isArray(data.memoryWorldsV453)?data.memoryWorldsV453:[];
    if(group){const ids=Array.isArray(group.memberIds)?group.memberIds:[];return worlds.find(w=>(w.groupIds||[]).includes(group.id))||worlds.find(w=>ids.some(id=>(w.characterIds||[]).includes(id)))||null}
    return worlds.find(w=>character&&(w.characterIds||[]).includes(character.id))||null;
  }
  function worldTime(chatId=currentChat){
    const key=chatKey(chatId),timeline=O(data.timeV454?.conversations?.[key]);
    if(timeline.mode==='custom')return S(timeline.custom?.text||'未设置世界时间');
    if(timeline.mode==='calendar'){
      const cal=O(timeline.calendar),elapsed=Math.max(0,Date.now()-(Number(cal.anchorRealMs)||Date.now()));let ms=Number(cal.anchorWorldMs)||Date.now();
      if(cal.flow==='realtime')ms+=elapsed;else if(cal.flow==='rate')ms+=elapsed*Math.max(0,Number(cal.rate)||1);
      return new Date(ms).toLocaleString('zh-CN',{hour12:false,year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'2-digit',minute:'2-digit'});
    }
    try{const legacy=v438Timeline(key);if(legacy?.mode==='virtual')return new Date(Number(legacy.virtualTimeMs)||Date.now()).toLocaleString('zh-CN',{hour12:false,year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'2-digit',minute:'2-digit'})}catch{}
    return new Date().toLocaleString('zh-CN',{hour12:false,year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'2-digit',minute:'2-digit'});
  }
  function phoneSession(){try{return v435PhoneSession||{mode:'browse',owner:'user',chatId:currentChat,characterId:'',permission:'none',replies:{}}}catch{return{mode:'browse',owner:'user',chatId:currentChat,characterId:'',permission:'none',replies:{}}}}
  function ownerEntity(owner,chatId=currentChat){if(owner==='user')return personaFor(chatId);return data.characters?.find(x=>x.id===owner)||data.mpcs?.find(x=>x.id===owner)||null}
  function ownerName(owner,chatId=currentChat){return ownerEntity(owner,chatId)?.name||(owner==='user'?'当前面具':'对方')}
  function actualActor(session=phoneSession()){
    if(session.mode==='check')return'user';
    if(session.mode==='reverse')return S(session.characterId||directCharacter(session.chatId)?.id||'');
    return'user';
  }
  function permissionAtLeast(required='read',session=phoneSession()){
    if(session.mode!=='reverse')return true;const levels={none:0,read:1,send:2,edit:3};return(levels[session.permission]||0)>=(levels[required]||0)
  }
  function canCreate(owner,session=phoneSession()){if(session.mode==='reverse')return permissionAtLeast('edit',session);if(session.mode==='check')return true;return owner==='user'}
  function canSend(owner,session=phoneSession()){if(session.mode==='reverse')return permissionAtLeast('send',session);if(session.mode==='check')return true;return owner==='user'}

  function ownerStore(owner='user',chatId=currentChat){
    let store=null;
    try{if(typeof phoneOwnerStore==='function')store=phoneOwnerStore(owner)}catch{}
    if(!store){
      if(owner==='user'){const personaId=personaFor(chatId)?.id||data.activePersonaId||'persona_default';store=data.simPhones.personas[personaId]=O(data.simPhones.personas[personaId])}
      else store=data.simPhones.characters[owner]=O(data.simPhones.characters[owner]);
    }
    store.items=Array.isArray(store.items)?store.items:[];
    store.conversations=Array.isArray(store.conversations)?store.conversations:[];
    store.timeline=Array.isArray(store.timeline)?store.timeline:[];
    store.trash=Array.isArray(store.trash)?store.trash:[];
    store.contacts=Array.isArray(store.contacts)?store.contacts:[];
    store.whitelist=Array.isArray(store.whitelist)?store.whitelist:[];
    store.phoneSettings={trashRetention:30,wallpaper:'',appearance:'dark',...O(store.phoneSettings)};
    if(!store.v455ConversationMigration){
      const grouped=new Map();for(const item of store.items.filter(item=>item&&item.app==='messages')){const key=S(item.threadId||item.conversationId||item.contactId||item.title||'legacy_messages');if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(item)}
      for(const [key,items] of grouped){if(store.conversations.some(thread=>thread.legacyKey===key))continue;const title=S(items[0]?.title||'未命名会话');store.conversations.push({id:uid('phone_thread'),legacyKey:key,title,kind:'direct',contactId:S(items[0]?.contactId||''),contactToken:S(items[0]?.contactToken||''),pinned:false,unread:0,proactiveEnabled:false,createdAt:S(items[0]?.createdAt||NOW()),updatedAt:S(items.at(-1)?.updatedAt||items.at(-1)?.createdAt||NOW()),messages:items.map(item=>({id:S(item.messageId||item.id||uid('phone_message')),type:S(item.type||'text'),direction:item.direction==='incoming'?'incoming':'outgoing',text:S(item.content||item.title||''),localText:S(item.content||item.title||''),remoteText:S(item.remoteContent||item.content||item.title||''),worldTimeText:S(item.worldTimeText||item.createdAt||''),createdAt:S(item.createdAt||NOW()),actualActor:S(item.actualActor||''),displayActor:S(item.displayActor||''),senderId:S(item.senderId||''),senderName:S(item.senderName||''),remoteSynced:item.remoteSynced!==false,editHistory:array(item.editHistory),modifyHistory:array(item.modifyHistory)}))})}
      store.v455ConversationMigration=true;
    }
    ensureRealApps(store,owner,chatId);
    return store;
  }

  function emptyRealApps(){return{
    moments:[],gallery:{photos:[],albums:[]},wallet:{accounts:[],transactions:[],bills:[]},
    notes:[],market:{orders:[],cart:[],favorites:[]},browser:{bookmarks:[],history:[],reading:[]},
    schedule:[],music:{tracks:[],playlists:[],recent:[]},maps:{places:[],routes:[],visits:[]},
    weather:{location:'',condition:'',temperature:'',feelsLike:'',updatedAt:'',forecast:[]}
  }}
  function array(value){return Array.isArray(value)?value:[]}
  function parseAmount(value){const match=S(value).replace(/,/g,'').match(/([+-]?)\s*[¥￥]?\s*(\d+(?:\.\d+)?)/);if(!match)return null;const n=Number(match[2]);if(!Number.isFinite(n))return null;return match[1]==='-'?-n:n}
  function extractImage(item){const candidates=[item?.image,item?.src,item?.url,S(item?.content).match(/(?:data:image\/[^;]+;base64,[A-Za-z0-9+/=]+|https?:\/\/\S+)/i)?.[0]];for(const source of candidates){if(!source)continue;try{const safe=typeof safeImageSrc==='function'?safeImageSrc(source):S(source);if(safe)return safe}catch{}}return''}
  function legacyBase(item,app){return{id:S(item.id||uid(app)),legacyItemId:S(item.id),createdAt:S(item.createdAt||item.time||NOW()),updatedAt:S(item.updatedAt||item.createdAt||NOW()),source:S(item.source||'旧版资料迁移')}}
  function migrateLegacyItems(real,items,owner){
    for(const item of items){if(!item||item.__v455Migrated)continue;const app=S(item.app),title=S(item.title||item.action||'未命名'),content=S(item.content),base=legacyBase(item,app);
      if(app==='moments'&&!real.moments.some(x=>x.legacyItemId===item.id))real.moments.push({...base,text:content||title,images:extractImage(item)?[extractImage(item)]:[],visibility:'联系人',likes:Math.max(0,Number(item.likes)||0),liked:false,comments:[]});
      if(app==='gallery'&&!real.gallery.photos.some(x=>x.legacyItemId===item.id))real.gallery.photos.push({...base,title,note:content,src:extractImage(item),albumId:'recent',takenAt:S(item.worldTimeText||item.createdAt||''),place:S(item.location||'')});
      if(app==='wallet'){
        const amount=parseAmount(content||title),balance=/余额|账户概览/.test(`${title}${content}`);
        if(balance&&!real.wallet.accounts.some(x=>x.legacyItemId===item.id))real.wallet.accounts.push({...base,name:title||`${ownerName(owner)}的虚构账户`,last4:S(item.last4||''),balance:amount??0,currency:'CNY'});
        else if(!real.wallet.transactions.some(x=>x.legacyItemId===item.id))real.wallet.transactions.push({...base,title,amount:Math.abs(amount??0),direction:(amount??0)>=0?'income':'expense',category:S(item.action||'旧版账目'),counterparty:'',worldTimeText:S(item.worldTimeText||item.createdAt||'')});
      }
      if(app==='notes'&&!real.notes.some(x=>x.legacyItemId===item.id))real.notes.push({...base,title,body:content,kind:/清单|待办/.test(item.action)?'checklist':'text',items:[],pinned:false,archived:false});
      if(app==='market'&&!real.market.orders.some(x=>x.legacyItemId===item.id))real.market.orders.push({...base,product:title,amount:Math.abs(parseAmount(content)||0),quantity:1,status:S(item.status||item.action||'记录'),logistics:content,address:''});
      if(app==='browser'&&!real.browser.bookmarks.some(x=>x.legacyItemId===item.id))real.browser.bookmarks.push({...base,title,url:S(item.url||''),group:S(item.action||'书签'),note:content});
      if(app==='schedule'&&!real.schedule.some(x=>x.legacyItemId===item.id))real.schedule.push({...base,title,start:S(item.start||item.worldTimeText||item.createdAt||''),end:S(item.end||''),location:S(item.location||''),reminder:S(item.reminder||''),note:content,completed:false});
      if(app==='music'&&!real.music.tracks.some(x=>x.legacyItemId===item.id))real.music.tracks.push({...base,title,artist:S(item.artist||content),album:S(item.album||''),playlist:S(item.action||'最近播放'),favorite:false});
      if(app==='maps'&&!real.maps.places.some(x=>x.legacyItemId===item.id))real.maps.places.push({...base,name:title,address:S(item.address||content),label:S(item.action||'地点'),note:content});
      if(app==='weather'&&!real.weather.condition){real.weather.location=S(item.location||title);real.weather.condition=content||S(item.action);real.weather.updatedAt=base.createdAt}
    }
  }
  function ensureRealApps(store,owner,chatId=currentChat){
    const raw=O(store.realAppsV455),defaults=emptyRealApps(),real=store.realAppsV455={...defaults,...raw};
    real.moments=array(real.moments);real.gallery={...defaults.gallery,...O(real.gallery)};real.gallery.photos=array(real.gallery.photos);real.gallery.albums=array(real.gallery.albums);
    real.wallet={...defaults.wallet,...O(real.wallet)};real.wallet.accounts=array(real.wallet.accounts);real.wallet.transactions=array(real.wallet.transactions);real.wallet.bills=array(real.wallet.bills);
    real.notes=array(real.notes);real.market={...defaults.market,...O(real.market)};real.market.orders=array(real.market.orders);real.market.cart=array(real.market.cart);real.market.favorites=array(real.market.favorites);
    real.browser={...defaults.browser,...O(real.browser)};real.browser.bookmarks=array(real.browser.bookmarks);real.browser.history=array(real.browser.history);real.browser.reading=array(real.browser.reading);
    real.schedule=array(real.schedule);real.music={...defaults.music,...O(real.music)};real.music.tracks=array(real.music.tracks);real.music.playlists=array(real.music.playlists);real.music.recent=array(real.music.recent);
    real.maps={...defaults.maps,...O(real.maps)};real.maps.places=array(real.maps.places);real.maps.routes=array(real.maps.routes);real.maps.visits=array(real.maps.visits);
    real.weather={...defaults.weather,...O(real.weather)};real.weather.forecast=array(real.weather.forecast);
    if(!real.migratedLegacyItemsV455){migrateLegacyItems(real,store.items,owner);real.migratedLegacyItemsV455=true;real.migratedAt=NOW()}
    for(const thread of store.conversations){thread.messages=array(thread.messages);thread.title=S(thread.title||'未命名会话');thread.kind=thread.kind==='group'?'group':'direct';thread.updatedAt=S(thread.updatedAt||thread.createdAt||NOW());for(const message of thread.messages){message.id=S(message.id||uid('phone_message'));message.localText=S(message.localText??message.text);message.remoteText=S(message.remoteText??message.text??message.localText);message.direction=message.direction==='incoming'?'incoming':'outgoing'}}
    return real;
  }

  function entityFromToken(token){const [kind,id]=S(token).split(':');if(kind==='character')return data.characters?.find(x=>x.id===id)||null;if(kind==='mpc')return data.mpcs?.find(x=>x.id===id)||null;if(kind==='group')return data.groups?.find(x=>x.id===id)||null;if(kind==='persona')return data.personas?.find(x=>x.id===id)||null;return data.characters?.find(x=>x.id===token)||data.mpcs?.find(x=>x.id===token)||null}
  function avatarMarkup(entity,fallback='·',className='v455-phone-avatar'){
    let src='';try{src=typeof safeImageSrc==='function'?safeImageSrc(entity?.image):S(entity?.image)}catch{}const initial=S(entity?.name||fallback||'·').trim().slice(0,1)||'·';
    return`<span class="${className}">${src?`<img src="${AT(src)}" alt="">`:`<b>${E(initial)}</b>`}</span>`
  }
  function appName(key){try{return V43_PHONE_APPS?.[key]?.name||SIM_APP_CATALOG?.[key]?.name||key}catch{return key}}
  function setPhoneContent(html){if(typeof v43PhoneSetContent==='function')v43PhoneSetContent(html);else{const modalEl=document.getElementById('modal'),content=document.getElementById('modalContent');if(content)content.innerHTML=html;modalEl?.classList.add('show','phone-fullscreen')}}
  function phoneStatus(){try{return v43PhoneStatus()}catch{return'<div class="vphone-status"><span></span><span><i></i><b>▮▮▮</b></span></div>'}}
  function currentCharacterForSession(session=phoneSession()){return data.characters?.find(x=>x.id===session.characterId)||directCharacter(session.chatId)||null}

  function obsoletePhoneMessage(message){
    if(!message||!message.phoneEvent)return false;const type=S(message.phoneEventType||message.kind),text=S(message.text);
    if(type==='call')return false;
    if(['phone-view','phone-open','phone-page-open','phone-app-open'].includes(type))return true;
    return /^(?:我查看了.+的.+(?:页面)?[。.]?|.+查看了我的.+(?:页面)?[。.]?|我打开了.+的手机[。.]?|我打开了自己的手机，并让.+查看[。.]?|已允许.+查看网站内的模拟手机)/.test(text);
  }
  function obsoleteTimelineEvent(event){const op=S(event?.operation||event?.type);return['phone-app-open','phone-page-open','phone-view','phone-open'].includes(op)}
  function cleanObsoletePhoneArtifacts(){
    let changed=false,removed=0;
    for(const [chatId,list] of Object.entries(data.chats||{})){if(!Array.isArray(list))continue;const kept=list.filter(message=>{const drop=obsoletePhoneMessage(message);if(drop){removed++;changed=true}return!drop});if(kept.length!==list.length)data.chats[chatId]=kept}
    if(Array.isArray(data.phoneLinks)&&data.phoneLinks.length){removed+=data.phoneLinks.length;data.phoneLinks=[];changed=true}
    if(data.runtime.phoneViewMarks&&Object.keys(data.runtime.phoneViewMarks).length){data.runtime.phoneViewMarks={};changed=true}
    if(Array.isArray(data.phoneV454.events)){const before=data.phoneV454.events.length;data.phoneV454.events=data.phoneV454.events.filter(event=>!obsoleteTimelineEvent(event));removed+=before-data.phoneV454.events.length;changed=changed||before!==data.phoneV454.events.length}
    for(const stores of [data.simPhones.personas,data.simPhones.characters])for(const store of Object.values(stores||{})){if(!store||!Array.isArray(store.timeline))continue;const before=store.timeline.length;store.timeline=store.timeline.filter(event=>!obsoleteTimelineEvent(event));removed+=before-store.timeline.length;changed=changed||before!==store.timeline.length}
    data.runtime.v455ObsoletePhoneCleanup={done:true,removed,at:NOW()};if(changed)saveData();return removed
  }
  cleanObsoletePhoneArtifacts();
  const linkedObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[]){if(node.nodeType!==1)continue;if(node.matches?.('.v452-linked-records'))node.remove();node.querySelectorAll?.('.v452-linked-records').forEach(x=>x.remove())}});
  try{linkedObserver.observe(document.documentElement,{subtree:true,childList:true})}catch{}

  function relationKeyFor(characterId,personaId=personaFor()?.id){if(!characterId||!personaId)return'';try{return directChatId(characterId,personaId)}catch{return`persona_chat::${personaId}::${characterId}`}}
  function relationFor(characterId=directCharacter()?.id,personaId=personaFor()?.id){const key=relationKeyFor(characterId,personaId);if(!key)return null;const raw=O(data.blockRelationsV455[key]);return data.blockRelationsV455[key]={key,characterId:S(characterId),personaId:S(personaId),userBlocksCharacter:raw.userBlocksCharacter===true,characterBlocksUser:raw.characterBlocksUser===true,characterCanBlockUser:raw.characterCanBlockUser===true,userBlockedAt:S(raw.userBlockedAt),characterBlockedAt:S(raw.characterBlockedAt),userReason:S(raw.userReason),characterReason:S(raw.characterReason),history:array(raw.history),updatedAt:S(raw.updatedAt||NOW())}}

  const V={S,O,E,AT,A,NOW,uid,clone,save:saveData,chatKey,personaFor,directCharacter,currentWorld,worldTime,phoneSession,ownerEntity,ownerName,actualActor,permissionAtLeast,canCreate,canSend,ownerStore,ensureRealApps,entityFromToken,avatarMarkup,appName,setPhoneContent,phoneStatus,currentCharacterForSession,cleanObsoletePhoneArtifacts,relationKeyFor,relationFor,parseAmount,extractImage,array};
  window.V455=V;
  window.v455CleanObsoletePhoneArtifacts=cleanObsoletePhoneArtifacts;
  saveData();
})();
