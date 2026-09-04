/* =========================================================
   POKEJI V45.7.32 · focused repair layer
   Additive only. The established desktop, chat shell, phone shell and VN
   renderer are preserved; this layer fixes only verified behavior.
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45731RepairLoaded)return;
  window.__pokejiV45731RepairLoaded=true;

  const S=(v,f='')=>String(v??f), O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{}, L=v=>Array.isArray(v)?v:[], NOW=()=>new Date().toISOString(), ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}`, A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`, tell=t=>{try{toast(t)}catch{}}, persist=()=>{try{return save()}catch{return false}};
  data.runtime=O(data.runtime);data.runtime.v45731=O(data.runtime.v45731);

  /* ---------- structured-output guard ---------- */
  function balanced(source,open='{',close='}'){
    const text=S(source);let start=-1,depth=0,inString=false,escaped=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(start<0){if(ch===open)start=i;else continue}
      if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue}
      if(ch==='"'){inString=true;continue}
      if(ch===open)depth++;else if(ch===close&&--depth===0)return text.slice(start,i+1);
    }
    return'';
  }
  function stripFence(v){return S(v).trim().replace(/^```(?:json|JSON)?\s*/,'').replace(/\s*```$/,'').trim()}
  function readJSON(v,shape='object'){
    if(v&&typeof v==='object')return v;
    const text=stripFence(v),candidate=shape==='array'?balanced(text,'[',']'):balanced(text);
    if(!candidate)return null;try{return JSON.parse(candidate)}catch{return null}
  }
  function plain(v,keys=['reply','text','content','message','narration','description','output','brief']){
    if(v&&typeof v==='object'){for(const key of keys)if(typeof v[key]==='string'&&v[key].trim())return S(v[key]).replace(/<[^>]*>/g,'').trim();return''}
    const parsed=readJSON(v,'object');if(parsed)return plain(parsed,keys);return stripFence(v).replace(/<[^>]*>/g,'').trim();
  }
  const structuredRequest=options=>{
    const system=S(options?.system),positive=/严格(?:只)?输出\s*(?:JSON|合法\s*JSON|JSON\s*(?:对象|数组))|只输出\s*(?:一个\s*)?(?:合法\s*)?JSON|输出\s*JSON\s*(?:对象|数组)|response_format|结构化/i.test(system),negative=/(?:不输出|不要输出|不得输出)\s*(?:标题[、，,]\s*)?JSON|不是\s*(?:一个\s*)?JSON|无需输出\s*JSON/i.test(system);
    return positive&&!negative;
  };
  const structuredText=v=>/^(?:\{|\[)/.test(stripFence(v));
  function fallbackStructured(raw,options){
    const ctx=S(options?.activityArea)+' '+S(options?.system);
    if(/关系网/.test(ctx))return'[]';
    if(/协调/.test(ctx))return'{\"turns\":[],\"space\":\"\"}';
    if(/临时\s*N?PC/i.test(ctx))return'{\"name\":\"\",\"description\":\"\",\"position\":\"\"}';
    if(/语伴|语言课堂|词典/.test(ctx))return'{\"reply\":\"\",\"tip\":\"\",\"correction\":\"\",\"vocabulary\":[]}';
    if(/动态/.test(ctx))return'{\"text\":\"\",\"location\":\"\",\"imagePrompt\":\"\"}';
    if(/幻梦馆|做梦/.test(ctx))return'{\"narration\":\"\",\"reply\":\"\",\"scenes\":[],\"gist\":\"\",\"tags\":[],\"knot\":\"\"}';
    if(/文游|视觉小说/.test(ctx))return'{\"title\":\"\",\"narration\":\"\",\"dialogue\":[],\"choices\":[],\"imagePrompt\":\"\",\"oocReactions\":[],\"generatedCastUpdates\":[],\"endingProposal\":{\"reached\":false,\"reason\":\"\",\"title\":\"\"}}';
    return'{\"text\":\"\"}';
  }
  const originalInvoke=window.invokeModel;
  if(typeof originalInvoke==='function'){
    const guarded=async function(kind,options={}){
      const raw=await originalInvoke.call(this,kind,options);
      if(structuredRequest(options)){if(readJSON(raw,'object')||readJSON(raw,'array'))return raw;return fallbackStructured(raw,options)}
      return structuredText(raw)?(plain(raw)||'本次回应没有可显示的文字，请重试。'):raw;
    };
    guarded.__pokejiV45731StructuredGuard=true;window.invokeModel=guarded;try{invokeModel=guarded}catch{}
  }
  function dynamicPost(raw){const row=readJSON(raw,'object');return row?{text:plain(row,['text','content','message','reply']),location:S(row.location).trim(),imagePrompt:S(row.imagePrompt||row.visual).trim()}:{text:plain(raw),location:'',imagePrompt:''}}
  window.v45731ReadJSON=readJSON;window.v45731PlainText=plain;window.parseGeneratedPost=dynamicPost;try{parseGeneratedPost=dynamicPost}catch{}

  /* Dynamic and language-partner records are repaired after their existing
     handlers complete. No page layout or data model is replaced. */
  const postBase=window.generateCharacterPost;
  if(typeof postBase==='function'&&!postBase.__pokejiV45731){const wrapped=async function(...args){const out=await postBase.apply(this,args);try{const pid=typeof feedPersona==='function'?feedPersona()?.id:data.activePersonaId;for(const row of L(data.posts).filter(x=>x.personaId===pid))if(structuredText(row.text))row.text=plain(row.text)||'动态没有完整生成，请重试。';persist()}catch{}return out};wrapped.__pokejiV45731=true;window.generateCharacterPost=wrapped;try{generateCharacterPost=wrapped}catch{}}
  const lessonBase=window.v457SendLesson;
  if(typeof lessonBase==='function'&&!lessonBase.__pokejiV45731){const wrapped=async function(...args){const out=await lessonBase.apply(this,args);try{const p=activePersonaFor(currentChat),st=O(data.learningV452?.personas?.[p?.id||data.activePersonaId]),session=O(st.liveSessions)?.[st.activeSessionId];for(const row of L(session?.messages))if(row.role!=='learner'){if(structuredText(row.text))row.text=plain(row.text)||'课堂回应没有完整生成，请重试。';if(structuredText(row.tip))row.tip=plain(row.tip,['tip','text','content']);if(structuredText(row.correction))row.correction=plain(row.correction,['correction','text','content']);row.vocabulary=L(row.vocabulary).map(x=>structuredText(x)?plain(x):S(x)).filter(Boolean).slice(0,3)}persist()}catch{}return out};wrapped.__pokejiV45731=true;window.v457SendLesson=wrapped;try{v457SendLesson=wrapped}catch{}}
  function cleanSocial(){try{const pid=activePersonaFor(currentChat)?.id||data.activePersonaId,st=O(data.squareSocialV4571?.personas?.[pid]);for(const rows of Object.values(O(st.threads)))for(const row of L(rows))if(structuredText(row.text))row.text=plain(row.text)||'私信没有完整生成，请重试。';persist()}catch{}}
  for(const name of ['v4571SendCreatorDM','v4571GenerateStrangerMessage']){const base=window[name];if(typeof base!=='function'||base.__pokejiV45731)continue;const wrapped=async function(...args){const out=await base.apply(this,args);cleanSocial();return out};wrapped.__pokejiV45731=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch{}}

  /* ---------- exact context cleanup ---------- */
  let wipeChat='',wipeTab='record',wipeCharacter='',wipePersona='';
  const norm=v=>{try{return canonicalChatId(v||currentChat)}catch{return S(v||currentChat)}}, parse=v=>{try{return parsePersonaThreadId(v)}catch{return null}}, charFor=v=>{try{return directCharacterForChat(v)}catch{return null}}, personaFor=v=>{try{return activePersonaFor(v)}catch{return L(data.personas)[0]||null}}, direct=(c,p)=>{try{return directChatId(c,p)}catch{return''}};
  function relatedKeys(cid,pid,includeGroups=true){
    const out=new Set(),d=direct(cid,pid);if(d)out.add(d);
    if(includeGroups)for(const g of L(data.groups))if(L(g.memberIds).includes(cid)){try{out.add(groupChatId(g.id,pid))}catch{}}
    for(const k of Object.keys(O(data.chats))){const p=parse(k);if(!p||p.personaId!==S(pid))continue;if(p.kind==='direct'&&p.entityId===S(cid))out.add(k);if(includeGroups&&p.kind==='group'){const g=L(data.groups).find(x=>S(x.id)===S(p.entityId));if(g&&L(g.memberIds).includes(cid))out.add(k)}}return[...out];
  }
  function belongs(row,keys,cid){if(!row||typeof row!=='object')return false;const k=norm(row.chatId||row.conversationId||row.sourceChatId||'');if(k&&keys.includes(k))return true;return[row.characterId,row.contactId,row.owner,row.targetId,row.recipientId,row.phoneOwner].some(x=>S(x)===S(cid))}
  function purgePhones(cid,pid,keys){
    let n=0;const sim=O(data.simPhones),cs=O(sim.characters?.[cid]),us=O(sim.personas?.[pid]);
    if(Object.keys(cs).length){n+=L(cs.items).length+L(cs.timeline).length+L(cs.conversations).reduce((a,t)=>a+L(t.messages).length,0);cs.items=[];cs.timeline=[];cs.conversations=[];cs.trash=[];cs.realAppsV455={}}
    if(Object.keys(us).length){for(const field of ['items','timeline']){const b=L(us[field]).length;us[field]=L(us[field]).filter(x=>!belongs(x,keys,cid));n+=b-us[field].length}for(const t of L(us.conversations)){const b=L(t.messages).length;if(S(t.contactId)===S(cid)||keys.includes(norm(t.chatId||'')))t.messages=[];else t.messages=L(t.messages).filter(x=>!belongs(x,keys,cid));n+=b-L(t.messages).length}}
    for(const [container,field] of [[data,'phoneLinks'],[data,'calls'],[data,'voiceCallsV45729']])if(Array.isArray(container[field])){const b=container[field].length;container[field]=container[field].filter(x=>!belongs(x,keys,cid));n+=b-container[field].length}
    if(Array.isArray(data.phoneV454?.events)){const b=data.phoneV454.events.length;data.phoneV454.events=data.phoneV454.events.filter(x=>!belongs(x,keys,cid));n+=b-data.phoneV454.events.length}
    for(const [k,row] of Object.entries(O(data.phoneV454?.reverse)))if(belongs({...row,chatId:k},keys,cid)){delete data.phoneV454.reverse[k];n++}
    for(const k of Object.keys(O(data.phonePageReplies)))if(keys.some(x=>k.includes(x))||k.includes(S(cid))){delete data.phonePageReplies[k];n++}
    data.runtime.phoneViewMarks=O(data.runtime.phoneViewMarks);for(const k of Object.keys(data.runtime.phoneViewMarks))if(keys.some(x=>k.includes(x))||k.includes(S(cid))){delete data.runtime.phoneViewMarks[k];n++}
    return n;
  }
  function purgeRelations(cid,pid){
    let n=0;for(const [k,row] of Object.entries(O(data.blockRelationsV455))){const p=parse(k);if((S(row?.characterId)===S(cid)&&S(row?.personaId)===S(pid))||(p?.kind==='direct'&&p.entityId===S(cid)&&p.personaId===S(pid))){delete data.blockRelationsV455[k];n++}}
    for(const scope of Object.values(O(data.relationshipGraphV45729?.scopes))){if(S(scope?.personaId)!==S(pid))continue;const name=L(data.characters).find(x=>S(x.id)===S(cid))?.name,ids=new Set(L(scope.nodes).filter(x=>S(x.id)===S(cid)||S(x.sourceKey).endsWith(`:${cid}`)||S(x.name)===S(name)).map(x=>S(x.id)));if(ids.size){scope.nodes=L(scope.nodes).filter(x=>!ids.has(S(x.id)));scope.edges=L(scope.edges).filter(x=>!ids.has(S(x.from))&&!ids.has(S(x.to)));n+=ids.size}}return n;
  }
  function purgeScenes(cid,keys){let n=0;for(const root of [O(data.offlineScenesV45729),O(data.sceneParticipantsV45729)])for(const k of keys)if(Object.prototype.hasOwnProperty.call(root,k)){delete root[k];n++}const rt=O(data.runtime.v45729);for(const name of ['offlinePlans','participantCandidates'])if(rt[name])for(const k of keys)if(Object.prototype.hasOwnProperty.call(rt[name],k)){delete rt[name][k];n++}if(Array.isArray(data.musicV45729?.companions)){const b=data.musicV45729.companions.length;data.musicV45729.companions=data.musicV45729.companions.filter(x=>!belongs(x,keys,cid));n+=b-data.musicV45729.companions.length}return n}
  function purgeMemories(cid,pid,keys,sourced,manual){const b=L(data.memories).length;data.memories=L(data.memories).filter(x=>{const hit=S(x?.characterId)===S(cid)||keys.includes(norm(x?.chatId||''));if(!hit)return true;if(x?.personaId&&S(x.personaId)!==S(pid))return true;return S(x?.source)?!sourced:!manual});return b-data.memories.length}
  function runWipe(){
    const picked=[...document.querySelectorAll('.v45731-wipe:checked,.v45726-wipe:checked')].map(x=>x.value);if(!picked.length)return tell('还没有勾选任何一项');const cid=wipeCharacter||charFor(wipeChat)?.id;if(!cid)return tell('当前人物不存在');const pid=wipePersona||personaFor(wipeChat)?.id||data.activePersonaId,keys=relatedKeys(cid,pid,picked.includes('groups')),done=[];
    if(wipeTab==='record'){
      for(const k of keys){const b=L(data.chats?.[k]).length;if(k!==wipeChat&&picked.includes('groups'))data.chats[k]=[];else data.chats[k]=L(data.chats?.[k]).filter(m=>!picked.includes(m?.mode==='offline'?'offline':'online'));const r=b-L(data.chats[k]).length;if(r)done.push(`消息 ${r} 条`)}
      if(picked.includes('translation'))for(const k of keys)delete data.translationCache?.[k];
    }else{
      if(picked.includes('summary'))for(const k of keys)delete data.chatSummaries?.[k];
      if(picked.includes('timeline')){for(const k of keys){delete data.chatTimelines?.[k];delete data.chatTimeHistory?.[k];delete data.timeV454?.conversations?.[k]}if(Array.isArray(data.timeV454?.events))data.timeV454.events=data.timeV454.events.filter(x=>!belongs(x,keys,cid));done.push('时间线与时间账本')}
      if(picked.includes('phone'))done.push(`查手机／反查记录 ${purgePhones(cid,pid,keys)} 条`);
      if(picked.includes('calls')&&!picked.includes('phone'))done.push(`电话／语音通话 ${purgePhones(cid,pid,keys)} 条`);
      if(picked.includes('relations'))done.push(`拉黑关系与关系网 ${purgeRelations(cid,pid)} 条`);
      if(picked.includes('scene'))done.push(`场景与陪听状态 ${purgeScenes(cid,keys)} 条`);
      if(picked.includes('sourced')||picked.includes('manual'))done.push(`记忆条目 ${purgeMemories(cid,pid,keys,picked.includes('sourced'),picked.includes('manual'))} 条`);
      for(const k of keys)if(data.chatSettings?.[k]){delete data.chatSettings[k].reversePhoneGranted;delete data.chatSettings[k].reversePhoneGrantedAt}
    }
    persist();closeModal?.();try{if(keys.includes(norm(currentChat)))renderMessages?.();renderChats?.();renderMemory?.()}catch{}tell(`已清理：${done.join('、')||'无'}`);
  }
  function openWipe(chatId,tab){wipeChat=norm(chatId||currentChat);wipeTab=tab==='memory'?'memory':'record';const c=charFor(wipeChat);if(!c)return tell('请先进入一段单独人物聊天');wipeCharacter=c.id;wipePersona=personaFor(wipeChat)?.id||data.activePersonaId;const old=window.v45726OpenWipe;if(typeof old==='function'){old(wipeChat,wipeTab);const sheet=document.querySelector('#modalContent .v45726-wipe');if(sheet&&!sheet.dataset.v45731){sheet.dataset.v45731='1';const note=document.createElement('div');note.className='v45731-wipe-note';note.textContent=wipeTab==='memory'?'本页同时清理查手机、反查、电话、语音通话、拉黑关系、关系网与页面回应缓存。':'记录页只处理可见消息；隐性上下文请在清理记忆中处理。';sheet.querySelector('.note')?.after(note);sheet.querySelector('button.danger')?.setAttribute('onclick','v45731RunWipe')}return}return null}
  window.v45731OpenWipe=openWipe;window.v45731RunWipe=runWipe;window.v45726OpenWipe=openWipe;window.v45726RunWipe=runWipe;window.v45726WipeFor=function(cid,tab){let pid='';try{pid=selectedPersonaIdForEntity(cid)}catch{pid=data.activePersonaId}return openWipe(direct(cid,pid),tab)};window.clearChat=window.clearChat||function(k){return openWipe(k||currentChat,'record')};try{clearChat=window.clearChat;v45726RunWipe=runWipe}catch{}

  /* ---------- requested placement ---------- */
  function registerApp(key,label,view,svg){try{if(!HOME_APP_CATALOG[key])HOME_APP_CATALOG[key]={label,view,glyph:'',rank:'',suit:''};if(!HOME_GLYPH_SVGS[key])HOME_GLYPH_SVGS[key]=svg}catch{}}
  registerApp('music','音乐库','music','<path d="M10 21V7l11-2v14"/><circle cx="7.5" cy="21" r="3"/><circle cx="18.5" cy="19" r="3"/>');
  registerApp('audioLibrary','音频库','audioLibrary','<path d="M8 5h9l5 5v17H8z"/><path d="M17 5v6h5M11 16h8M11 20h6"/>');
  function addHomeApp(key){if(!Array.isArray(data.homeDesktop?.items)||data.homeDesktop.items.some(x=>x.kind==='app'&&x.app===key))return false;let page=Math.max(0,Number(data.homeDesktop.pageCount||1)-1),slot=typeof findHomeSlot==='function'?findHomeSlot(page,1,1):null;if(!slot&&Number(data.homeDesktop.pageCount||1)<12){data.homeDesktop.pageCount++;page=data.homeDesktop.pageCount-1;slot=findHomeSlot(page,1,1)}if(!slot)return false;data.homeDesktop.items.push({id:`app_${key}_${ID('home')}`,kind:'app',app:key,page,x:slot.x,y:slot.y,w:1,h:1});return true}
  let homeChanged=addHomeApp('music');homeChanged=addHomeApp('audioLibrary')||homeChanged;if(homeChanged){persist();try{renderHomeDesktop?.()}catch{}}
  const openViewBase=window.openView;if(typeof openViewBase==='function'&&!openViewBase.__pokejiV45731Placement){const routed=function(view,...args){if(view==='music'){data.runtime.v45729.musicTab='songs';return window.v45729OpenMusic?.()}if(view==='audioLibrary'){data.runtime.v45729.musicTab='effects';return window.v45729OpenMusic?.()}return openViewBase.call(this,view,...args)};routed.__pokejiV45731Placement=true;window.openView=routed;try{openView=routed}catch{}}
  document.querySelectorAll('#settings [data-v45729-framework]').forEach(x=>x.remove());
  const bindingBase=window.characterBindingPage;if(typeof bindingBase==='function'&&!bindingBase.__pokejiV45731Relationship){const wrapped=function(d){const html=bindingBase.apply(this,arguments);if(!d||d.__new)return html;return `${html}<section class="v45731-character-relationship"><div><b>关系网</b><small>当前人物、面具和世界范围内的关系</small></div><button onclick="v45731OpenRelationship(${A(d.id)})">查看 ›</button></section>`};wrapped.__pokejiV45731Relationship=true;window.characterBindingPage=wrapped;try{characterBindingPage=wrapped}catch{}}
  window.v45731OpenRelationship=function(cid){const pid=(()=>{try{return selectedPersonaIdForEntity(cid)}catch{return data.activePersonaId}})();return window.v45729OpenRelationshipGraph?.(`${pid}::world_default`)};

  /* ---------- wallpaper restoration after palette actions ---------- */
  const repaint=()=>{try{window.v45729PaintChatBackground?.(currentChat)}catch{}};
  for(const name of ['applyAppearance','applyBeautyFactory','v472SaveBeauty','v457ActivateTheme','v457SavePalette','v457ResetTheme']){const base=window[name];if(typeof base!=='function'||base.__pokejiV45731Wallpaper)continue;const wrapped=function(...args){const out=base.apply(this,args),done=()=>{repaint();try{window.v45729EnsureApiOrb?.()}catch{}};if(out&&typeof out.finally==='function')return out.finally(done);setTimeout(done,0);return out};wrapped.__pokejiV45731Wallpaper=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch{}}
  repaint();persist();
})();

/* =========================================================
   POKEJI V45.7.32 · final repair / placement layer
   - structured-response boundary for every model-backed surface
   - memory/record cleanup reaches phone, reverse-phone and relations
   - music library and audio library are separate home-routed pages
   - relationship graph lives in an individual character's binding page
   The existing two desktop pages and phone desktop shell are not rebuilt.
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45732FinalLayer)return;
  window.__pokejiV45732FinalLayer=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}`;
  const tell=v=>{try{toast(v)}catch{}};
  const keep=()=>{try{return save()}catch{return false}};
  const textOf=v=>S(v).replace(/<[^>]*>/g,'').trim();
  /* The previous relationship wrapper referenced A() without
     exporting it. Keep the old wrapper compatible while this version
     continues to use the existing editor structure. */
  if(typeof window.A!=='function')window.A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;

  /* ---------------------------------------------------------
     1. One response boundary for all structured model surfaces
     --------------------------------------------------------- */
  function stripFence(v){return S(v).trim().replace(/^```\s*(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()}
  function balancedJson(v,open='{',close='}'){
    const text=S(v),startAt=text.indexOf(open);if(startAt<0)return'';
    let depth=0,inString=false,escaped=false;
    for(let i=startAt;i<text.length;i++){
      const ch=text[i];
      if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue}
      if(ch==='"'){inString=true;continue}
      if(ch===open)depth++;
      else if(ch===close&&--depth===0)return text.slice(startAt,i+1);
    }
    return'';
  }
  function parseStructured(value,shape='object'){
    if(value&&typeof value==='object'){
      if(shape==='array')return Array.isArray(value)?value:null;
      return !Array.isArray(value)?value:null;
    }
    const text=stripFence(value),candidate=shape==='array'?balancedJson(text,'[',']'):balancedJson(text,'{','}');
    if(!candidate)return null;
    try{const out=JSON.parse(candidate);return shape==='array'?(Array.isArray(out)?out:null):(!Array.isArray(out)?out:null)}catch{return null}
  }
  function extractQuotedField(value,keys){
    const text=stripFence(value);
    for(const key of keys){
      const escapedKey=String(key).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const match=new RegExp('"?'+escapedKey+'"?\\s*:\\s*"','i').exec(text);if(!match)continue;
      let i=match.index+match[0].length,out='',escaped=false;
      for(;i<text.length;i++){
        const ch=text[i];
        if(escaped){out+=ch;escaped=false;continue}
        if(ch==='\\'){escaped=true;continue}
        if(ch==='"')break;
        out+=ch;
      }
      if(out.trim())return out.trim();
    }
    return'';
  }
  function jsonShapeText(v){
    const t=stripFence(v);
    return /^(?:\{|\[)/.test(t)||/"(?:reply|text|content|message|narration|description|title|term|decision|turns|scenes|vocabulary)"\s*:/i.test(t);
  }
  function plainText(value,keys=['reply','text','content','message','narration','description','output','brief']){
    if(value&&typeof value==='object'){
      for(const key of keys){const item=value[key];if(typeof item==='string'&&item.trim())return plainText(item,keys)}
      return'';
    }
    const source=stripFence(value),parsed=parseStructured(source,'object');
    if(parsed){for(const key of keys){const item=parsed[key];if(typeof item==='string'&&item.trim())return plainText(item,keys)}return''}
    if(jsonShapeText(source))return extractQuotedField(source,keys);
    return textOf(source);
  }
  function structuredRequest(options={}){
    const system=S(options.system),format=S(options.responseFormat||options.response_format||''),text=`${system} ${format}`;
    const positive=/严格(?:只)?输出\s*(?:JSON|合法\s*JSON|JSON\s*(?:对象|数组))|只输出\s*(?:一个\s*)?(?:合法\s*)?JSON|输出\s*JSON\s*(?:对象|数组)|response_format|结构化/i.test(text);
    const negative=/(?:不输出|不要输出|不得输出)\s*(?:标题[、，,]\s*)?JSON|不是\s*(?:一个\s*)?JSON|无需输出\s*JSON/i.test(text);
    return positive&&!negative;
  }
  function sanitizeStructured(value){
    const textFields=new Set(['text','content','reply','message','narration','description','brief','tip','correction','summary','reason','title','location','imagePrompt','term','pronunciation','meaning','example','exampleMeaning','memoryTip','evidence','space']);
    if(Array.isArray(value))return value.map(item=>sanitizeStructured(item));
    if(value&&typeof value==='object'){const out={};for(const [key,item] of Object.entries(value)){if(typeof item==='string'&&textFields.has(key)&&jsonShapeText(item))out[key]=plainText(item,[key,'reply','text','content','message','narration','description','brief'])||'';else out[key]=sanitizeStructured(item)}return out}
    return value;
  }
  function fallbackFor(options={}){
    const ctx=`${S(options.activityArea)} ${S(options.system)}`;
    if(/关系网/.test(ctx))return[];
    if(/线下.*协调|多人.*协调/.test(ctx))return{turns:[],space:''};
    if(/临时\s*N?PC/i.test(ctx))return{name:'',description:'',brief:'',position:''};
    if(/动态|广场/.test(ctx))return{text:'',location:'',imagePrompt:'',title:'',content:''};
    if(/语伴|语言课堂|词典|学习/.test(ctx))return{reply:'',tip:'',correction:'',vocabulary:[],term:'',pronunciation:'',meaning:'',example:'',exampleMeaning:'',memoryTip:''};
    if(/反查|决定|decision|授权/.test(ctx))return{decision:'hesitate',reply:''};
    if(/文游|视觉小说/.test(ctx))return{title:'',narration:'',dialogue:[],choices:[],imagePrompt:'',visualChanged:false,oocReactions:[],generatedCastUpdates:[],endingProposal:{reached:false,reason:'',title:''}};
    if(/番外|章节|长篇/.test(ctx))return{title:'',content:'',summary:'',timeText:''};
    if(/幻梦馆|梦境|做梦/.test(ctx))return{narration:'',reply:'',scenes:[],gist:'',tags:[],knot:''};
    return{text:''};
  }
  const baseInvoke=window.invokeModel;
  if(typeof baseInvoke==='function'&&!baseInvoke.__pokejiV45732Boundary){
    const guarded=async function(kind,options={}){
      const raw=await baseInvoke.call(this,kind,options);
      if(structuredRequest(options)){
        const systemText=`${S(options.system)} ${S(options.responseFormat||'')}`;
        const shape=/(?:JSON\s*数组|输出\s*(?:一个\s*)?数组|array\s*(?:of|response))/i.test(systemText)&&!/(?:JSON\s*对象|合法\s*JSON\s*对象|输出\s*(?:一个\s*)?对象)/i.test(systemText)?'array':'object';
        const parsed=parseStructured(raw,shape),safe=parsed===null?fallbackFor(options):sanitizeStructured(parsed);
        return JSON.stringify(safe);
      }
      if(raw&&typeof raw==='object')return plainText(raw);
      if(jsonShapeText(raw))return plainText(raw)||'本次回应没有可显示的文字，请重试。';
      return raw;
    };
    guarded.__pokejiV45732Boundary=true;window.invokeModel=guarded;try{invokeModel=guarded}catch{}
  }
  window.v45732ReadJSON=parseStructured;
  window.v45732PlainText=plainText;
  window.v45732StructuredText=jsonShapeText;
  window.v45732CleanText=function(value,keys){return plainText(value,keys)};
  const safeGeneratedPost=function(raw){const row=parseStructured(raw,'object');return row?{text:plainText(row,['text','content','message','reply']),location:S(row.location).trim(),imagePrompt:S(row.imagePrompt||row.visual).trim()}:{text:plainText(raw),location:'',imagePrompt:''}};
  window.parseGeneratedPost=safeGeneratedPost;try{parseGeneratedPost=safeGeneratedPost}catch{}

  function cleanStoredText(value,keys){
    const source=S(value);if(!jsonShapeText(source))return source;
    return plainText(source,keys)||'';
  }
  function cleanExistingStructuredData(){
    let changed=false;
    for(const row of L(data.posts))if(row&&jsonShapeText(row.text)){const next=cleanStoredText(row.text,['text','content','message','reply']);row.text=next||'动态内容未能解析，请重新生成。';changed=true}
    for(const persona of Object.values(O(data.learningV452?.personas)))for(const session of Object.values(O(persona?.liveSessions)))for(const row of L(session?.messages)){
      if(row.role!=='learner'&&jsonShapeText(row.text)){row.text=cleanStoredText(row.text,['reply','text','content','message'])||'课堂回应未能解析，请重试。';changed=true}
      for(const key of ['tip','correction'])if(jsonShapeText(row?.[key])){row[key]=cleanStoredText(row[key],[key,'text','content','reply']);changed=true}
      if(Array.isArray(row?.vocabulary)){const next=row.vocabulary.map(x=>jsonShapeText(x)?cleanStoredText(x,['text','term','word']):S(x)).filter(Boolean);if(JSON.stringify(next)!==JSON.stringify(row.vocabulary)){row.vocabulary=next;changed=true}}
    }
    for(const bucket of Object.values(O(data.squareV452?.personas)))for(const key of ['posts','shorts','longs','threads'])for(const row of L(bucket?.[key]))if(row&&jsonShapeText(row.content||row.text)){const field=row.content!==undefined?'content':'text',next=cleanStoredText(row[field],['content','text','message','reply']);row[field]=next||'内容未能解析，请重新生成。';changed=true}
    for(const bucket of Object.values(O(data.squareSocialV4571?.personas)))for(const rows of Object.values(O(bucket?.threads)))for(const row of L(rows))if(row&&jsonShapeText(row.text)){row.text=cleanStoredText(row.text,['text','content','message','reply'])||'私信内容未能解析，请重试。';changed=true}
    for(const row of L(data.voiceCallsV45729))for(const item of L(row?.transcript))if(item&&jsonShapeText(item.text)){item.text=cleanStoredText(item.text,['reply','text','content','message'])||'通话回应未能解析，请重试。';changed=true}
    if(changed)keep();
  }
  cleanExistingStructuredData();

  const postBase=window.generateCharacterPost;
  if(typeof postBase==='function'&&!postBase.__pokejiV45732Clean){
    const wrapped=async function(...args){const out=await postBase.apply(this,args);try{const pid=typeof feedPersona==='function'?feedPersona()?.id:data.activePersonaId;for(const row of L(data.posts).filter(x=>x.personaId===pid))if(jsonShapeText(row.text)){row.text=cleanStoredText(row.text,['text','content','message','reply'])||'动态内容未能解析，请重试。'}keep()}catch{}return out};
    wrapped.__pokejiV45732Clean=true;window.generateCharacterPost=wrapped;try{generateCharacterPost=wrapped}catch{}
  }
  const lessonBase=window.v457SendLesson;
  if(typeof lessonBase==='function'&&!lessonBase.__pokejiV45732Clean){
    const wrapped=async function(...args){const out=await lessonBase.apply(this,args);try{const p=typeof activePersonaFor==='function'?activePersonaFor(currentChat):null,root=O(data.learningV452?.personas?.[p?.id||data.activePersonaId]);for(const session of Object.values(O(root.liveSessions)))for(const row of L(session?.messages))if(row.role!=='learner'&&jsonShapeText(row.text))row.text=cleanStoredText(row.text,['reply','text','content','message'])||'课堂回应未能解析，请重试。';keep()}catch{}return out};
    wrapped.__v45732Clean=true;window.v457SendLesson=wrapped;try{v457SendLesson=wrapped}catch{}
  }

  /* ---------------------------------------------------------
     2. Separate home-routed music and audio-library pages
     --------------------------------------------------------- */
  data.musicV45729=O(data.musicV45729);data.musicV45729.songs=L(data.musicV45729.songs);data.musicV45729.effects=L(data.musicV45729.effects);data.musicV45729.companions=L(data.musicV45729.companions);data.musicV45729.netease=O(data.musicV45729.netease);
  data.runtime=O(data.runtime);data.runtime.v45732=O(data.runtime.v45732);
  const mstore=()=>data.musicV45729;
  function ensureLibraryView(id,title){
    let view=document.getElementById(id);if(view)return view;
    view=document.createElement('section');view.id=id;view.className='view app-view';
    view.innerHTML=`<div class="header"><button class="back" onclick="openView('home')">‹</button><h1>${E(title)}</h1><button class="icon-btn" onclick="openView('home')">⌂</button></div><div class="scroll"><div id="${id}Body"></div></div>`;
    document.getElementById('screen')?.appendChild(view);return view;
  }
  function audioCard(row,kind){
    const title=S(row.title||'未命名'),sub=kind==='effect'?(row.notes||row.source||'本机音效'):(row.artist||row.source||'本机歌曲');
    return`<article class="v45732-audio-card"><div class="v45732-audio-copy"><b>${E(title)}</b><small>${E(sub)}</small>${row.lyrics?'<i>含歌词</i>':''}${row.unavailable?'<i>地址不可直接播放</i>':''}</div>${row.src?`<audio controls preload="none" src="${AT(row.src)}"></audio>`:'<span class="v45732-no-audio">未提供音频</span>'}<div class="v45732-audio-actions"><button onclick="v45732EditAudio(${A(kind)},${A(row.id)})">编辑</button><button onclick="v45732DeleteAudio(${A(kind)},${A(row.id)})" aria-label="删除">删除</button></div></article>`;
  }
  function libraryActions(kind){return`<div class="v45732-library-actions"><label class="v45732-file-button">导入<input type="file" accept="audio/*,.json,.m3u,.m3u8" onchange="v45732ImportAudio(event,${A(kind)})"></label><button onclick="v45732AddAudioUrl(${A(kind)})">HTTPS 地址</button>${kind==='song'?'<button class="primary" onclick="v45729OpenMusicCompanion()">音乐陪听</button>':''}</div>`}
  function activeCompanion(){const id=S(data.runtime?.v45729?.activeMusicCompanionId);return mstore().companions.find(row=>S(row.id)===id&&row.active!==false)||null}
  function companionPanelV32(session){
    return`<section class="v45732-companion-panel"><header><div><small>音乐陪听 · ${E(session.targetName||'当前对象')}</small><h3>${E(session.songTitle||'未命名歌曲')}</h3></div><button onclick="v45729FinishCompanion()">结束</button></header><div class="v45732-companion-note">歌词与赏析属于艺术表达，不是真实发生的事件；普通播放不会进入角色上下文。</div><main>${L(session.turns).map(row=>`<article class="${row.role==='user'?'mine':''}"><b>${row.role==='user'?'我':E(session.targetName||'对方')}</b><p>${E(row.text)}</p></article>`).join('')||'<div class="v45732-companion-empty">可以从一首歌开始聊。</div>'}</main><footer><input id="v45729CompanionInput" placeholder="聊聊这首歌…"><button class="primary" onclick="v45729CompanionSend()">发送</button></footer></section>`;
  }
  function musicLibraryPage(){
    const rows=mstore().songs,session=activeCompanion();
    return`<div class="v45732-library-page v45732-music-page"><header class="v45732-library-hero"><small>MUSIC LIBRARY</small><h2>${session?'音乐陪听':'音乐库'}</h2><p>${session?'当前陪听只在这个独立会话中注入歌曲、歌词与赏析；结束后不再继续注入。':'歌曲独立保存。普通播放不会进入角色上下文；只有开始音乐陪听时才会注入歌曲与歌词。'}</p></header><nav class="v45732-library-nav"><button class="${session?'':'on'}" onclick="v45732OpenMusicLibrary()">歌曲库 <em>${rows.length}</em></button><button class="${session?'on':''}" onclick="v45729OpenMusicCompanion()">音乐陪听</button><button onclick="v45732OpenNetease()">连接器</button></nav>${session?companionPanelV32(session):`${libraryActions('song')}<section class="v45732-library-list">${rows.map(x=>audioCard(x,'song')).join('')||'<div class="v45732-library-empty"><b>还没有歌曲</b><span>导入本机音频，或记录一个 HTTPS 音频地址。</span></div>'}</section>`}</div>`;
  }
  function audioLibraryPage(){
    const rows=mstore().effects;
    return`<div class="v45732-library-page v45732-effect-page"><header class="v45732-library-hero"><small>AUDIO LIBRARY</small><h2>音频库</h2><p>环境声、动作声和提示声单独管理，不会混入歌曲库，也不会自动写入聊天上下文。</p></header><nav class="v45732-library-nav"><button class="on">音效资料 <em>${rows.length}</em></button><button onclick="v45732OpenNetease()">连接器说明</button></nav>${libraryActions('effect')}<section class="v45732-library-list">${rows.map(x=>audioCard(x,'effect')).join('')||'<div class="v45732-library-empty"><b>还没有音效</b><span>导入环境声、动作声或提示音；没有地址时只保存资料，不伪装播放。</span></div>'}</section></div>`;
  }
  function openMusicV32(){ensureLibraryView('music','音乐库');document.getElementById('musicBody').innerHTML=musicLibraryPage();show('music');window.v45729EnsureApiOrb?.()}
  function openAudioV32(){ensureLibraryView('audioLibrary','音频库');document.getElementById('audioLibraryBody').innerHTML=audioLibraryPage();show('audioLibrary');window.v45729EnsureApiOrb?.()}
  function rerenderLibrary(){if(document.getElementById('audioLibrary')?.classList.contains('active'))openAudioV32();else openMusicV32()}
  window.v45732OpenMusicLibrary=openMusicV32;window.v45732OpenAudioLibrary=openAudioV32;window.v45729OpenMusic=openMusicV32;
  window.v45729MusicTab=function(tab){data.runtime.v45732.musicTab=S(tab||'songs');keep();return tab==='effects'?openAudioV32():openMusicV32()};
  /* The existing companion engine remains the data/AI implementation. Only
     redirect its repaint back to the new music-library surface so starting,
     sending and ending a companion session never falls into the old generic
     page. */
  for(const name of ['v45729StartCompanion','v45729CompanionSend','v45729FinishCompanion']){
    const base=window[name];if(typeof base!=='function'||base.__pokejiV45732LibraryBridge)continue;
    const bridged=async function(...args){const result=base.apply(this,args);if(result&&typeof result.then==='function')await result;openMusicV32();return result};
    bridged.__pokejiV45732LibraryBridge=true;window[name]=bridged;try{globalThis[name]=bridged}catch{}
  }
  window.v45732AddAudioUrl=function(kind){
    const isEffect=S(kind)==='effect';modal(`<h2>添加 HTTPS ${isEffect?'音效':'歌曲'}</h2><div class="field"><label>名称</label><input id="v45732AudioTitle"></div><div class="field"><label>音频地址</label><input id="v45732AudioUrl" inputmode="url" placeholder="https://..."></div><div class="field"><label>${isEffect?'说明':'歌词 / 说明'}</label><textarea id="v45732AudioNotes"></textarea></div>${isEffect?'':'<div class="field"><label>歌词 HTTPS 地址（不自动抓取）</label><input id="v45732AudioLyricsUrl" inputmode="url"></div>'}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45732SaveAudioUrl(${A(kind)})">保存</button></div>`);
  };
  window.v45732SaveAudioUrl=function(kind){const type=S(kind)==='effect'?'effect':'song',src=S(document.getElementById('v45732AudioUrl')?.value).trim();if(!/^https:\/\//i.test(src))return tell('只接受 HTTPS 音频地址');const row={id:ID(type),kind,title:S(document.getElementById('v45732AudioTitle')?.value).trim()||src.split('/').pop()||'未命名',artist:'',src,lyrics:type==='song'?S(document.getElementById('v45732AudioNotes')?.value):'',notes:S(document.getElementById('v45732AudioNotes')?.value),lyricsUrl:S(document.getElementById('v45732AudioLyricsUrl')?.value),source:'USER 添加',unavailable:false,createdAt:NOW(),updatedAt:NOW()};mstore()[type==='effect'?'effects':'songs'].unshift(row);keep();closeModal();type==='effect'?openAudioV32():openMusicV32();tell(`${type==='effect'?'音效':'歌曲'}已保存`)};
  window.v45732ImportAudio=async function(event,kind){
    const type=S(kind)==='effect'?'effect':'song',file=event?.target?.files?.[0];if(!file)return;
    try{
      const rows=[];
      if(/\.json$/i.test(file.name)){const raw=await file.text(),parsed=parseStructured(raw,'object')||parseStructured(raw,'array');const list=Array.isArray(parsed)?parsed:(type==='effect'?(parsed?.effects||parsed?.sfx||parsed?.items):(parsed?.songs||parsed?.tracks||parsed?.music||parsed?.items));for(const x of L(list)){const src=typeof x==='string'?x:S(x?.src||x?.url||x?.audio);rows.push({id:ID(type),kind,type,title:S(typeof x==='string'?x.split('/').pop():x?.title||x?.name||'未命名'),artist:S(x?.artist),src:/^https:\/\//i.test(src)?src:'',lyrics:S(x?.lyrics||x?.lyric),notes:S(x?.notes),source:'USER 导入',unavailable:!!src&&!/^https:\/\//i.test(src),createdAt:NOW(),updatedAt:NOW()})}}
      else if(/^audio\//i.test(file.type)||/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(file.name)){const reader=new FileReader();const src=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(S(reader.result));reader.onerror=()=>reject(reader.error||Error('读取失败'));reader.readAsDataURL(file)});rows.push({id:ID(type),kind:type,title:file.name.replace(/\.[^.]+$/,''),artist:'',src,lyrics:'',notes:'',source:'本机文件',unavailable:false,createdAt:NOW(),updatedAt:NOW()})}
      else if(/\.m3u8?$/i.test(file.name)){for(const src of (await file.text()).split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')))rows.push({id:ID(type),kind:type,title:src.split('/').pop()||'未命名',artist:'',src:/^https:\/\//i.test(src)?src:'',lyrics:'',notes:'',source:'M3U 导入',unavailable:!/^https:\/\//i.test(src),createdAt:NOW(),updatedAt:NOW()})}
      else throw Error('暂不支持此文件格式');
      if(!rows.length)throw Error('文件中没有可保存的音频资料');mstore()[type==='effect'?'effects':'songs'].unshift(...rows);keep();type==='effect'?openAudioV32():openMusicV32();tell(`已导入 ${rows.length} 项${type==='effect'?'音效':'歌曲'}`);
    }catch(error){errorDetail?.(error,`${type==='effect'?'音效':'歌曲'}导入失败`)}finally{if(event?.target)event.target.value=''}
  };
  window.v45732EditAudio=function(kind,id){const key=S(kind)==='effect'?'effects':'songs',row=mstore()[key].find(x=>S(x.id)===S(id));if(!row)return;modal(`<h2>编辑${key==='effects'?'音效':'歌曲'}</h2><div class="field"><label>名称</label><input id="v45732EditAudioTitle" value="${AT(row.title||'')}"></div><div class="field"><label>艺术家 / 说明</label><input id="v45732EditAudioArtist" value="${AT(row.artist||'')}"></div><div class="field"><label>音频地址</label><input id="v45732EditAudioUrl" value="${AT(row.src||'')}" placeholder="https://... 或保留本机音频"></div><div class="field"><label>${key==='effects'?'说明':'歌词 / 说明'}</label><textarea id="v45732EditAudioNotes">${E(key==='effects'?(row.notes||''):(row.lyrics||row.notes||''))}</textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45732SaveAudio(${A(kind)},${A(id)})">保存</button></div>`)};
  window.v45732SaveAudio=function(kind,id){const key=S(kind)==='effect'?'effects':'songs',row=mstore()[key].find(x=>S(x.id)===S(id));if(!row)return;const src=S(document.getElementById('v45732EditAudioUrl')?.value).trim(),notes=S(document.getElementById('v45732EditAudioNotes')?.value);if(src&&!/^(?:https:\/\/|data:audio\/)/i.test(src))return tell('音频地址只能是 HTTPS 或本机已导入的音频');row.title=S(document.getElementById('v45732EditAudioTitle')?.value).trim()||row.title;row.artist=S(document.getElementById('v45732EditAudioArtist')?.value).trim();row.src=src;row.notes=notes;if(key==='songs')row.lyrics=notes;row.updatedAt=NOW();keep();closeModal();key==='effects'?openAudioV32():openMusicV32();tell('音频资料已更新')};
  window.v45732DeleteAudio=function(kind,id){const key=S(kind)==='effect'?'effects':'songs',rows=mstore()[key],i=rows.findIndex(x=>S(x.id)===S(id));if(i<0)return;if(!confirm(`删除这项${key==='effects'?'音效':'歌曲'}资料？`))return;rows.splice(i,1);keep();key==='effects'?openAudioV32():openMusicV32()};
  window.v45732OpenNetease=function(){const music=mstore();modal(`<h2>网易云连接器</h2><div class="note">当前只保存连接器参数和状态，不代表已经授权、已经连通或能够读取网易云内容。</div><div class="field"><label>Client ID</label><input id="v45732NeteaseClient" value="${AT(music.netease.clientId||'')}"></div><div class="field"><label>HTTPS 授权地址</label><input id="v45732NeteaseAuth" value="${AT(music.netease.authorizeUrl||'')}"></div><div class="field"><label>Redirect URI</label><input id="v45732NeteaseRedirect" value="${AT(music.netease.redirectUri||'')}"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45732SaveNetease()">保存连接器</button></div><p class="v45732-connector-status">状态：${E(music.netease.status||'未连接')}</p>`)};
  window.v45732SaveNetease=function(){const m=mstore();m.netease.clientId=S(document.getElementById('v45732NeteaseClient')?.value);m.netease.authorizeUrl=S(document.getElementById('v45732NeteaseAuth')?.value);m.netease.redirectUri=S(document.getElementById('v45732NeteaseRedirect')?.value);m.netease.status='未连接';keep();closeModal();rerenderLibrary();tell('连接器参数已保存；当前仍未连接')};

  /* Only place the two explicitly requested library icons on the existing home.
     The existing home grid/page layout is not rearranged. */
  function registerHomeLibraryApps(){
    try{
      HOME_APP_CATALOG.music={...(HOME_APP_CATALOG.music||{}),label:'音乐库',view:'music',glyph:'',rank:'',suit:''};
      HOME_APP_CATALOG.audioLibrary={...(HOME_APP_CATALOG.audioLibrary||{}),label:'音频库',view:'audioLibrary',glyph:'',rank:'',suit:''};
      HOME_GLYPH_SVGS.music=HOME_GLYPH_SVGS.music||'<path d="M10 21V7l11-2v14"/><circle cx="7.5" cy="21" r="3"/><circle cx="18.5" cy="19" r="3"/>';
      HOME_GLYPH_SVGS.audioLibrary=HOME_GLYPH_SVGS.audioLibrary||'<path d="M8 5h9l5 5v17H8z"/><path d="M17 5v6h5M11 16h8M11 20h6"/>';
      const items=L(data.homeDesktop?.items),add=key=>{if(items.some(x=>x.kind==='app'&&x.app===key))return false;let page=Math.max(0,Number(data.homeDesktop.pageCount||1)-1),slot=typeof findHomeSlot==='function'?findHomeSlot(page,1,1):null;if(!slot&&Number(data.homeDesktop.pageCount||1)<12){data.homeDesktop.pageCount++;page=data.homeDesktop.pageCount-1;slot=findHomeSlot(page,1,1)}if(!slot)return false;items.push({id:ID(`home_${key}`),kind:'app',app:key,page,x:slot.x,y:slot.y,w:1,h:1});return true};
      const changed=add('music')||add('audioLibrary');if(changed){data.homeDesktop.items=items;keep();try{renderHomeDesktop?.()}catch{}}
    }catch{}
  }
  registerHomeLibraryApps();
  const baseOpenView=window.openView;
  if(typeof baseOpenView==='function'&&!baseOpenView.__pokejiV45732LibraryRoute){
    const routed=function(id,...args){if(id==='music')return openMusicV32();if(id==='audioLibrary')return openAudioV32();return baseOpenView.apply(this,[id,...args])};
    routed.__pokejiV45732LibraryRoute=true;window.openView=routed;try{openView=routed}catch{}
  }
  ensureLibraryView('music','音乐库');ensureLibraryView('audioLibrary','音频库');

  /* ---------------------------------------------------------
     3. Relationship graph belongs to an individual character page
     --------------------------------------------------------- */
  window.v45732OpenRelationship=function(characterId){
    const personaId=(()=>{try{return selectedPersonaIdForEntity(characterId)}catch{return data.activePersonaId}})();
    return window.v45729OpenRelationshipGraph?.(`${personaId}::world_default`);
  };
  const baseBinding=window.characterBindingPage;
  if(typeof baseBinding==='function'&&!baseBinding.__pokejiV45732Relationship){
    const wrapped=function(d){
      let html=S(baseBinding.apply(this,arguments));
      if(/v45731-character-relationship/.test(html))html=html.replace(/v45731-character-relationship/g,'v45732-character-relationship').replace(/v45731OpenRelationship/g,'v45732OpenRelationship');
      else if(d&&!d.__new)html+=`<section class="v45732-character-relationship"><div><b>关系网</b><small>只记录${E(d.name||'此人物')}在当前面具 × 当前世界中的关系</small></div><button onclick="v45732OpenRelationship(${A(d.id)})">查看 ›</button></section>`;
      return html;
    };
    wrapped.__v45732Relationship=true;window.characterBindingPage=wrapped;try{characterBindingPage=wrapped}catch{}
  }
  document.querySelectorAll('#settings [data-v45729-framework],#settings [data-v45732-framework]').forEach(x=>x.remove());

  /* ---------------------------------------------------------
     4. Exact cleanup: visible records and every hidden context ledger
     --------------------------------------------------------- */
  let wipeChat='',wipeTab='record',wipeCharacter='',wipePersona='';
  const canonical=v=>{try{return canonicalChatId(v||'')}catch{return S(v||'')}};
  const parsed=v=>{try{return parsePersonaThreadId(v)}catch{return null}};
  const direct=(cid,pid)=>{try{return directChatId(cid,pid)}catch{return''}};
  const charFor=id=>{try{return directCharacterForChat(id)}catch{return null}};
  const personaFor=id=>{try{return activePersonaFor(id)||data.personas?.find(x=>x.id===data.activePersonaId)||data.personas?.[0]}catch{return data.personas?.find(x=>x.id===data.activePersonaId)||data.personas?.[0]}};
  function relatedKeys(cid,pid,includeGroups){
    const set=new Set(),d=direct(cid,pid);if(d)set.add(d);
    for(const key of Object.keys(O(data.chats))){const p=parsed(key);if(!p||S(p.personaId)!==S(pid))continue;if(p.kind==='direct'&&S(p.entityId)===S(cid))set.add(key);if(includeGroups&&p.kind==='group'){const g=L(data.groups).find(x=>S(x.id)===S(p.entityId));if(g&&L(g.memberIds).some(x=>S(x)===S(cid)))set.add(key)}}
    return[...set].map(canonical);
  }
  function idMatches(value,cid,pid,keys){const v=S(value);return!!v&&(v===S(cid)||v===S(pid)||keys.includes(canonical(v))||keys.some(k=>k&&v.includes(k)))}
  function belongs(row,cid,pid,keys){
    if(!row||typeof row!=='object')return false;
    for(const key of ['chatId','conversationId','sourceChatId','threadId','sourceConversationId'])if(idMatches(row[key],cid,pid,keys))return true;
    for(const key of ['characterId','contactId','targetId','recipientId','phoneOwner','ownerId','speakerId','entityId'])if(S(row[key])===S(cid))return true;
    if(S(row.personaId)===S(pid))return keys.length===1&&idMatches(row.chatId||row.conversationId,cid,pid,keys);
    if(S(row.contactToken).includes(S(cid))||S(row.outboundIdentity).includes(S(cid)))return true;
    return false;
  }
  function filterNested(value,predicate){
    if(Array.isArray(value))return value.filter(item=>!predicate(item)).map(item=>filterNested(item,predicate));
    if(value&&typeof value==='object'){const out={};for(const [key,item] of Object.entries(value))out[key]=filterNested(item,predicate);return out}
    return value;
  }
  function purgeOnePhoneStore(store,cid,pid,keys,whole){
    if(!store||typeof store!=='object')return 0;let removed=0;
    if(whole){for(const key of ['items','timeline','conversations','trash']){if(Array.isArray(store[key])){removed+=store[key].length;store[key]=[]}}for(const key of ['realAppsV455','realAppsV457'])if(store[key]){const before=JSON.stringify(store[key]);store[key]=Array.isArray(store[key])?[]:{};if(before!==JSON.stringify(store[key]))removed++}return removed}
    for(const key of ['items','timeline','trash'])if(Array.isArray(store[key])){const before=store[key].length;store[key]=store[key].filter(row=>!belongs(row,cid,pid,keys)&&!belongs(row?.snapshot,cid,pid,keys));removed+=before-store[key].length}
    if(Array.isArray(store.conversations)){
      const next=[];for(const thread of store.conversations){const threadHit=belongs(thread,cid,pid,keys)||S(thread.contactId)===S(cid)||S(thread.contactToken).includes(S(cid));if(threadHit){removed+=1+L(thread.messages).length;continue}const before=L(thread.messages).length;thread.messages=L(thread.messages).filter(row=>!belongs(row,cid,pid,keys));removed+=before-thread.messages.length;next.push(thread)}store.conversations=next;
    }
    for(const key of ['realAppsV455','realAppsV457'])if(store[key]){const before=JSON.stringify(store[key]);store[key]=filterNested(store[key],row=>belongs(row,cid,pid,keys));if(before!==JSON.stringify(store[key]))removed++}
    return removed;
  }
  function isReverseEvent(row){return /reverse|反查|授权|permission/i.test(`${S(row?.operation)} ${S(row?.type)} ${S(row?.details?.summary)}`)}
  function purgePhoneData(cid,pid,keys){
    let removed=0;const sim=O(data.simPhones),characters=O(sim.characters),personas=O(sim.personas);
    /* A character phone is a character-owned dataset. A USER phone is
       shared by the current persona, so only this contact's threads/items
       are removed. */
    if(characters[cid])removed+=purgeOnePhoneStore(characters[cid],cid,pid,keys,true);
    if(personas[pid])removed+=purgeOnePhoneStore(personas[pid],cid,pid,keys,false);
    if(Array.isArray(data.phoneLinks)){const before=data.phoneLinks.length;data.phoneLinks=data.phoneLinks.filter(row=>!belongs(row,cid,pid,keys));removed+=before-data.phoneLinks.length}
    if(data.phonePageReplies&&typeof data.phonePageReplies==='object'&&!Array.isArray(data.phonePageReplies))for(const k of Object.keys(data.phonePageReplies))if(keys.some(x=>k.includes(x))||k.includes(S(cid))){delete data.phonePageReplies[k];removed++}
    if(Array.isArray(data.phoneV454?.events)){const before=data.phoneV454.events.length;data.phoneV454.events=data.phoneV454.events.filter(row=>isReverseEvent(row)||!belongs(row,cid,pid,keys));removed+=before-data.phoneV454.events.length}
    data.runtime=O(data.runtime);if(data.runtime.phoneViewMarks&&typeof data.runtime.phoneViewMarks==='object')for(const k of Object.keys(data.runtime.phoneViewMarks))if(keys.some(x=>k.includes(x))||k.includes(S(cid))){delete data.runtime.phoneViewMarks[k];removed++}
    return removed;
  }
  function purgeReverseData(cid,pid,keys){
    let removed=0;
    if(data.phoneV454?.reverse&&typeof data.phoneV454.reverse==='object')for(const k of Object.keys(data.phoneV454.reverse)){const row=data.phoneV454.reverse[k];if(keys.includes(canonical(k))||belongs({...row,chatId:k},cid,pid,keys)){delete data.phoneV454.reverse[k];removed++}}
    if(data.phoneV454?.reversePrefs&&typeof data.phoneV454.reversePrefs==='object'&&data.phoneV454.reversePrefs[cid]){delete data.phoneV454.reversePrefs[cid];removed++}
    if(Array.isArray(data.phoneV454?.events)){const before=data.phoneV454.events.length;data.phoneV454.events=data.phoneV454.events.filter(row=>isReverseEvent(row)?!belongs(row,cid,pid,keys):true);removed+=before-data.phoneV454.events.length}
    for(const key of keys)if(data.chatSettings?.[key]){delete data.chatSettings[key].reversePhoneGranted;delete data.chatSettings[key].reversePhoneGrantedAt}
    try{if(window.v435PhoneSession){window.v435PhoneSession.replies={};window.v435PhoneSession.connectionId=''}}catch{}
    return removed;
  }
  function purgeCalls(cid,pid,keys){
    let removed=0;
    for(const field of ['calls','voiceCallsV45729'])if(Array.isArray(data[field])){const before=data[field].length;data[field]=data[field].filter(row=>!belongs(row,cid,pid,keys));removed+=before-data[field].length}
    return removed;
  }
  function purgeRelations(cid,pid){
    let removed=0;
    if(data.blockRelationsV455&&typeof data.blockRelationsV455==='object')for(const key of Object.keys(data.blockRelationsV455)){const row=data.blockRelationsV455[key],p=parsed(key);if((S(row?.characterId)===S(cid)&&S(row?.personaId)===S(pid))||(p?.kind==='direct'&&S(p.entityId)===S(cid)&&S(p.personaId)===S(pid))){delete data.blockRelationsV455[key];removed++}}
    for(const scope of Object.values(O(data.relationshipGraphV45729?.scopes))){if(S(scope?.personaId)!==S(pid))continue;const ids=new Set(L(scope.nodes).filter(row=>S(row?.id)===S(cid)||S(row?.characterId)===S(cid)||S(row?.sourceKey).endsWith(`:${cid}`)).map(row=>S(row.id)));if(ids.size){const before=L(scope.nodes).length;scope.nodes=L(scope.nodes).filter(row=>!ids.has(S(row.id)));scope.edges=L(scope.edges).filter(row=>!ids.has(S(row.from))&&!ids.has(S(row.to)));removed+=before-scope.nodes.length}}
    if(Array.isArray(data.phoneV454?.events)){const before=data.phoneV454.events.length;data.phoneV454.events=data.phoneV454.events.filter(row=>!/block|拉黑|黑名单|relationship|关系/i.test(`${S(row?.operation)} ${S(row?.type)} ${S(row?.details?.summary)}`)||!belongs(row,cid,pid,[direct(cid,pid)]));removed+=before-data.phoneV454.events.length}
    return removed;
  }
  function purgeTimeline(cid,pid,keys){
    let removed=0;for(const root of [data.chatTimelines,data.chatTimeHistory,data.timeV454?.conversations])if(root&&typeof root==='object')for(const k of Object.keys(root))if(keys.includes(canonical(k))){delete root[k];removed++}
    if(Array.isArray(data.timeV454?.events)){const before=data.timeV454.events.length;data.timeV454.events=data.timeV454.events.filter(row=>!belongs(row,cid,pid,keys));removed+=before-data.timeV454.events.length}
    return removed;
  }
  function purgeScenes(cid,pid,keys){
    let removed=0;for(const root of [data.offlineScenesV45729,data.sceneParticipantsV45729])if(root&&typeof root==='object')for(const k of Object.keys(root))if(keys.includes(canonical(k))){delete root[k];removed++}
    const rt=O(data.runtime?.v45729);for(const field of ['offlinePlans','participantCandidates'])if(rt[field]&&typeof rt[field]==='object')for(const k of Object.keys(rt[field]))if(keys.includes(canonical(k))){delete rt[field][k];removed++}
    if(Array.isArray(data.musicV45729?.companions)){const before=data.musicV45729.companions.length;data.musicV45729.companions=data.musicV45729.companions.filter(row=>!belongs(row,cid,pid,keys));removed+=before-data.musicV45729.companions.length}
    return removed;
  }
  function memoryMatches(row,cid,pid,keys){
    const characterHit=S(row?.characterId)===S(cid),chatHit=!!S(row?.chatId)&&keys.includes(canonical(row.chatId));
    if(!characterHit&&!chatHit)return false;
    return !S(row?.personaId)||S(row.personaId)===S(pid);
  }
  function purgeMemoryRows(cid,pid,keys,picked){
    if(!Array.isArray(data.memories))return 0;const before=data.memories.length;
    data.memories=data.memories.filter(row=>{
      if(!memoryMatches(row,cid,pid,keys))return true;
      const source=S(row?.source),label=`${source} ${S(row?.title)} ${S(row?.text)}`;
      if(picked.includes('sourced')&&source)return false;
      if(picked.includes('manual')&&!source)return false;
      if(picked.includes('phone')&&/phone|手机|反查|查手机|reverse/i.test(label))return false;
      if(picked.includes('relations')&&/block|拉黑|黑名单|relation|关系/i.test(label))return false;
      if(picked.includes('calls')&&/call|通话|语音/i.test(label))return false;
      if(picked.includes('scene')&&/scene|offline|music|陪听|场景/i.test(label))return false;
      return true;
    });return before-data.memories.length;
  }
  function openWipeV32(chatId,tab='record'){
    wipeChat=canonical(chatId||currentChat);wipeTab=tab==='memory'?'memory':'record';const person=charFor(wipeChat);if(!person)return tell('请先进入一段单独人物聊天');wipeCharacter=person.id;wipePersona=personaFor(wipeChat)?.id||data.activePersonaId;const keys=relatedKeys(wipeCharacter,wipePersona,tab==='record'&&false);
    const recordRows=[['online','线上消息','当前私聊中的线上气泡、图片、语音与表情包',L(data.chats?.[wipeChat]).filter(x=>x?.mode!=='offline').length,true],['offline','线下相遇','当前私聊中的线下正文、旁白与内心话',L(data.chats?.[wipeChat]).filter(x=>x?.mode==='offline').length,true],['groups','群聊里的发言','此人物在当前面具群聊中的共同记录（默认不动）',0,false],['translation','译文缓存','当前会话的翻译缓存',Object.keys(O(data.translationCache?.[wipeChat])).length,true]];
    const memoryRows=[['summary','对话摘要','记忆页中的本段会话压缩摘要',data.chatSummaries?.[wipeChat]?1:0,true],['phone','手机记录','查手机、被反查时留下的手机内容与页面回应缓存',0,true],['reverse','反查邀请与授权','邀请、角色决定、授权连接与反查状态',0,true],['calls','电话与语音通话','现有打电话和独立语音通话的记录',0,true],['timeline','时间线与时间账本','等待、移动、世界时间推进和相关账本',0,true],['relations','拉黑关系与关系网','双方黑名单历史、关系边和当前人物关系节点',0,true],['scene','场景与音乐状态','线上/线下参与者计划、场景状态和陪听状态',0,true],['sourced','带来源记忆','番外、幻梦馆、语伴、广场等带来源条目（默认不动）',0,false],['manual','手写记忆','你手动保存的记忆（默认不动）',0,false]];
    const rows=tab==='memory'?memoryRows:recordRows;
    modal(`<div class="v45732-wipe"><header><small>${tab==='memory'?'MEMORY CLEANUP':'RECORD CLEANUP'}</small><h2>${tab==='memory'?'清理记忆':'清理记录'} · ${E(person.name)}</h2><p>当前面具「${E(personaFor(wipeChat)?.name||'未命名')}」。${tab==='memory'?'这里只清理会回到后续上下文的隐性资料；普通聊天气泡另在“清理记录”处理。':'这里只清理可见聊天记录；查手机、反查和关系事实在“清理记忆”中单独处理。'}</p></header><div class="v45732-wipe-list">${rows.map(([key,title,copy,count,checked])=>`<label><input type="checkbox" class="v45732-wipe" value="${AT(key)}" ${checked?'checked':''}><span><b>${E(title)}</b><small>${E(copy)}</small></span><i>${count?E(count):''}</i></label>`).join('')}</div><div class="v45732-wipe-note"><b>${tab==='memory'?'这次会清掉哪些“看不见但还会被记住”的东西？':'记录与记忆是两套独立数据。'}</b><p>${tab==='memory'?'已明确拆开手机、反查、拉黑关系、关系网、电话、时间线和场景状态；清理后也会从对应提示词和页面回应缓存中移除。带来源与手写记忆只有主动勾选才删除。':'删除聊天气泡不会自动删除摘要、手机事件、反查授权、电话、时间线或关系黑名单；需要进入清理记忆后选择对应项目。'}</p></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="danger" onclick="v45732RunWipe()">${tab==='memory'?'清理所选记忆':'清理所选记录'}</button></div></div>`);
  }
  function runWipeV32(){
    const picked=[...document.querySelectorAll('.v45732-wipe:checked')].map(x=>S(x.value));if(!picked.length)return tell('还没有勾选任何一项');const cid=wipeCharacter||charFor(wipeChat)?.id;if(!cid)return tell('当前人物不存在');const pid=wipePersona||personaFor(wipeChat)?.id||data.activePersonaId,keys=relatedKeys(cid,pid,picked.includes('groups')),done=[];
    if(wipeTab==='record'){
      for(const key of keys){const before=L(data.chats?.[key]).length;if(key!==wipeChat&&picked.includes('groups'))data.chats[key]=[];else data.chats[key]=L(data.chats?.[key]).filter(row=>!picked.includes(row?.mode==='offline'?'offline':'online'));const n=before-data.chats[key].length;if(n)done.push(`消息 ${n} 条`)}
      if(picked.includes('groups'))done.push(`群聊记录已一并清理`);
      if(picked.includes('translation'))for(const key of keys)delete data.translationCache?.[key];
    }else{
      if(picked.includes('summary'))for(const key of keys)delete data.chatSummaries?.[key];
      if(picked.includes('phone'))done.push(`手机记录 ${purgePhoneData(cid,pid,keys)} 项`);
      if(picked.includes('reverse'))done.push(`反查邀请与授权 ${purgeReverseData(cid,pid,keys)} 项`);
      if(picked.includes('calls'))done.push(`电话记录 ${purgeCalls(cid,pid,keys)} 项`);
      if(picked.includes('timeline'))done.push(`时间线 ${purgeTimeline(cid,pid,keys)} 项`);
      if(picked.includes('relations'))done.push(`拉黑关系与关系网 ${purgeRelations(cid,pid)} 项`);
      if(picked.includes('scene'))done.push(`场景状态 ${purgeScenes(cid,pid,keys)} 项`);
      const memoryKinds=['sourced','manual','phone','reverse','calls','relations','scene'];
      if(picked.some(key=>memoryKinds.includes(key)))done.push(`记忆条目 ${purgeMemoryRows(cid,pid,keys,picked)} 条`);
      for(const key of keys)if(data.chatSettings?.[key]){delete data.chatSettings[key].reversePhoneGranted;delete data.chatSettings[key].reversePhoneGrantedAt}
      if(picked.includes('relations'))for(const key of keys){const relation=data.chatSettings?.[key];if(relation){delete relation.reversePhoneGranted;delete relation.reversePhoneGrantedAt}}
    }
    keep();try{closeModal();if(keys.includes(canonical(currentChat))){renderMessages?.();applyChatBackground?.()}renderChats?.();renderGroups?.();renderMemory?.()}catch{}tell(`已清理：${done.join('、')||'无'}`);
  }
  window.v45732OpenWipe=openWipeV32;window.v45732RunWipe=runWipeV32;window.v45731OpenWipe=openWipeV32;window.v45731RunWipe=runWipeV32;window.v45726OpenWipe=openWipeV32;window.v45726RunWipe=runWipeV32;
  window.v45726WipeFor=function(cid,tab){let pid='';try{pid=selectedPersonaIdForEntity(cid)}catch{pid=data.activePersonaId}return openWipeV32(direct(cid,pid),tab)};
  window.clearChat=function(id){return openWipeV32(id||currentChat,'record')};window.clearCharacterConversations=function(id){return openWipeV32(direct(id,selectedPersonaIdForEntity(id))||currentChat,'record')};
  try{clearChat=window.clearChat;clearCharacterConversations=window.clearCharacterConversations;v45726OpenWipe=openWipeV32;v45726RunWipe=runWipeV32}catch{}

  /* ---------------------------------------------------------
     5. Wallpaper repaint after palette/theme and route changes
     --------------------------------------------------------- */
  function repaintWallpaper(){try{const chat=document.getElementById('chat');if(!chat)return;const settings=typeof getChatSettings==='function'?getChatSettings(currentChat):null,image=typeof safeImageSrc==='function'?safeImageSrc(settings?.background):'';const set=(node,prop,value)=>node?.style?.setProperty(prop,value,'important');set(chat,'background-color','var(--pk-background,#ffffff)');if(image){const url=`url("${image.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\)/g,'\\)')}")`;set(chat,'background-image',url);set(chat,'background-size','cover');set(chat,'background-position','center');set(chat,'background-repeat','no-repeat');set(chat.querySelector(':scope > .scroll'),'background-color','transparent');set(chat.querySelector(':scope > .scroll'),'background-image','none')}else{set(chat,'background-image','none');set(chat,'background-color','var(--pk-background,#ffffff)');set(chat.querySelector(':scope > .scroll'),'background-color','var(--pk-background,#ffffff)');set(chat.querySelector(':scope > .scroll'),'background-image','none')}set(chat.querySelector(':scope > .chat-head'),'background-color','var(--pk-header,#f6f7f8)');set(chat.querySelector(':scope > .composer'),'background-color','var(--pk-header,#f6f7f8)');}catch{}}
  window.v45732PaintChatBackground=repaintWallpaper;window.v45729PaintChatBackground=repaintWallpaper;window.applyChatBackground=repaintWallpaper;try{applyChatBackground=repaintWallpaper}catch{}
  const baseOpenChat=window.openChat;if(typeof baseOpenChat==='function'&&!baseOpenChat.__pokejiV45732Wallpaper){const wrapped=function(...args){const out=baseOpenChat.apply(this,args);setTimeout(repaintWallpaper,0);return out};wrapped.__pokejiV45732Wallpaper=true;window.openChat=wrapped;try{openChat=wrapped}catch{}}
  for(const name of ['applyAppearance','applySelectedTheme','v457ActivateTheme','v457ResetTheme','v472SaveBeauty','v472SavePalette']){const base=window[name];if(typeof base!=='function'||base.__pokejiV45732Wallpaper)continue;const wrapped=function(...args){const out=base.apply(this,args),done=()=>{repaintWallpaper();try{window.v45729EnsureApiOrb?.()}catch{}};if(out&&typeof out.finally==='function')return out.finally(done);setTimeout(done,0);return out};wrapped.__pokejiV45732Wallpaper=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch{}}
  repaintWallpaper();
})();

/* Keep framework-only settings links out of 设置 after each route render. */
(function(){
  'use strict';
  function removeMisplacedFramework(){
    document.querySelectorAll('#settings [data-v45729-framework],#settings [data-v45732-framework]').forEach(node=>{try{node.remove()}catch{}});
  }
  removeMisplacedFramework();
  const base=window.openView;
  if(typeof base==='function'&&!base.__pokejiV45732PlacementClean){
    const wrapped=function(id,...args){const out=base.apply(this,[id,...args]);setTimeout(removeMisplacedFramework,0);return out};
    wrapped.__pokejiV45732PlacementClean=true;window.openView=wrapped;try{openView=wrapped}catch{}
  }
  const observer=new MutationObserver(removeMisplacedFramework);
  try{observer.observe(document.body,{childList:true,subtree:true})}catch{}
})();
