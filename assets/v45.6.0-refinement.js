/* =========================================================
   POKEJI V45.7.0 · focused refinement layer
   - quiet activity center instead of notification noise
   - owner-scoped context memory and hierarchy inspector
   - natural interface wording without touching authored content
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV456RefinementLoaded)return;
  window.__pokejiV456RefinementLoaded=true;
  const V=window.V455||{};
  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const L=value=>Array.isArray(value)?value:[];
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const A=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  data.runtime=O(data.runtime);data.notifications=L(data.notifications);data.memories=L(data.memories);data.chatSummaries=O(data.chatSummaries);

  const BINDING_AREAS=[
    ['chat','聊天入口'],['group','群聊'],['feed','动态'],['square','广场'],['learning','语伴'],['story','番外']
  ];
  const BINDING_AREA_KEYS=BINDING_AREAS.map(([key])=>key);
  const BINDING_AREA_LABELS=Object.fromEntries(BINDING_AREAS);
  function normalizedAreas(value){const rows=L(value).map(S).filter(key=>BINDING_AREA_KEYS.includes(key));return rows.length?[...new Set(rows)]:['chat','group']}
  function itemAreas(item){return normalizedAreas(item?.areas)}
  function areaMatches(item,area){return itemAreas(item).includes(area)}
  for(const item of L(data.worlds))item.areas=itemAreas(item);
  data.engine=O(data.engine);data.engine.worldRules=L(data.engine.worldRules);data.engine.presetModules=L(data.engine.presetModules);data.engine.regexRules=L(data.engine.regexRules);
  for(const rows of [data.engine.worldRules,data.engine.presetModules,data.engine.regexRules])for(const item of rows)item.areas=itemAreas(item);

  function currentPersona(chatId=currentChat){try{return activePersonaFor(chatId)||data.personas?.find(item=>item.id===data.activePersonaId)||data.personas?.[0]}catch{return data.personas?.find(item=>item.id===data.activePersonaId)||data.personas?.[0]}}
  function currentPerson(chatId=currentChat){try{return directCharacterForChat(chatId)}catch{return null}}
  function currentGroup(chatId=currentChat){try{return groupForChat(chatId)}catch{return null}}
  function canonical(chatId){try{return canonicalChatId(chatId)}catch{return S(chatId)}}
  function formatStamp(value){if(!value)return'较早';try{return new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return S(value)}}

  /* ---------- quiet activity center ---------- */
  try{HOME_APP_CATALOG.contacts.label='人物';HOME_APP_CATALOG.notifications.label='近况'}catch{}
  const ACTIONABLE_ACTIVITY=/失败|未完成|无法|错误|超时|中断|权限|冷却|待处理|已恢复|恢复失败|需要处理|连接异常|未送达/i;
  function actionableRows(){
    const rows=[],seen=new Map();
    for(const item of L(data.notifications)){
      const text=S(item?.text).trim();if(!text||!ACTIONABLE_ACTIVITY.test(text))continue;
      const key=`${item.type||'other'}:${text.replace(/\d+/g,'#').slice(0,120)}`,known=seen.get(key);
      if(known){known.count++;continue}
      const row={...item,text,count:1};seen.set(key,row);rows.push(row);if(rows.length>=40)break;
    }
    return rows
  }
  function personaSquareCount(persona){const state=O(data.squareV452?.personas?.[persona?.id]);return['posts','shorts','longs','threads'].reduce((sum,key)=>sum+L(state[key]).length,0)}
  function personaPhoneStats(persona){const phone=O(data.simPhones?.personas?.[persona?.id]),unread=L(phone.conversations).reduce((sum,thread)=>sum+(Number(thread.unread)||0),0);return{contacts:L(phone.whitelist).length,unread,records:L(phone.conversations).reduce((sum,thread)=>sum+L(thread.messages).length,0)}}
  function personaChatStats(persona){const ids=Object.keys(data.chats||{}).filter(id=>{try{return parsePersonaThreadId(id)?.personaId===persona?.id}catch{return false}}),messages=ids.reduce((sum,id)=>sum+L(data.chats[id]).length,0);return{threads:ids.length,messages}}
  function renderActivityCenter(){
    installQuietNotifications();const root=document.getElementById('notificationList');if(!root)return;const persona=currentPersona(),alerts=actionableRows(),chat=personaChatStats(persona),phone=personaPhoneStats(persona),square=personaSquareCount(persona);
    root.innerHTML=`<section class="v456-activity-hero"><small>低打扰汇总</small><h2>${E(persona?.name||'我的')}近况</h2><p>普通回复、动态发布和手机查看不再逐条提醒；这里只集中展示可回看入口与真正需要处理的异常。</p></section><div class="v456-activity-stats"><button onclick="openView('chats')"><span>♡</span><b>${chat.threads}</b><small>对话 · ${chat.messages} 条消息</small></button><button onclick="v452OpenStandaloneApp('square')"><span>♧</span><b>${square}</b><small>广场内容</small></button><button onclick="openSimPhone('user')"><span>▤</span><b>${phone.contacts}</b><small>手机联系人 · ${phone.unread} 未读</small></button><button onclick="openView('engine');engineTab('preview')"><span>⌁</span><b>${Object.keys(data.chatSummaries||{}).length}</b><small>上下文摘要</small></button></div><section class="v456-activity-section"><header><div><b>需要留意</b><small>${alerts.length?`${alerts.length} 项合并提醒`:'当前没有待处理事项'}</small></div>${alerts.length?'<button onclick="clearNotifications()">清理</button>':''}</header>${alerts.length?`<div class="v456-activity-list">${alerts.map(item=>`<article><span>${item.type==='chat'?'♡':item.type==='feed'?'♧':'!'}</span><div><b>${E(item.text)}</b><small>${E(item.time||formatStamp(item.createdAt))}${item.count>1?` · 合并 ${item.count} 次`:''}</small></div></article>`).join('')}</div>`:'<div class="v456-activity-empty"><span>✓</span><b>一切平稳</b><p>有需要处理的生成失败、权限或连接问题时，会集中出现在这里。</p></div>'}</section><section class="v456-activity-note"><b>提醒形式已调整</b><p>回复和发布成功不会再堆成列表；聊天、广场和手机的数量直接汇总在上方，点卡片即可进入。</p></section>`;
    naturalizeInterface(root)
  }
  function installQuietNotifications(){
    const list=data.notifications;if(list.__v456Quiet)return;Object.defineProperty(list,'__v456Quiet',{value:true,configurable:true});
    Object.defineProperty(list,'unshift',{configurable:true,writable:true,value:function(...items){const kept=items.filter(item=>ACTIONABLE_ACTIVITY.test(S(item?.text)));for(const item of kept){item.createdAt=item.createdAt||NOW();const duplicate=this.find(row=>S(row?.text)===S(item.text)&&S(row?.type)===S(item.type));if(duplicate){duplicate.time=item.time||'刚刚';duplicate.createdAt=item.createdAt;duplicate.count=(Number(duplicate.count)||1)+1}else Array.prototype.unshift.call(this,item)}if(this.length>60)this.length=60;return this.length}})
  }
  installQuietNotifications();
  window.renderNotifications=renderActivityCenter;try{renderNotifications=renderActivityCenter}catch{}
  window.clearNotifications=function(){data.notifications=[];installQuietNotifications();save();renderActivityCenter();toast('已清理需要留意的近况')};try{clearNotifications=window.clearNotifications}catch{}

  /* ---------- scoped memory compiler ---------- */
  function memoryScope(item){if(item?.legacyUnassigned||item?.scope==='unassigned')return'unassigned';if(['global','persona','character','group','conversation'].includes(item?.scope))return item.scope;if(item?.chatId)return'conversation';if(item?.characterId)return'character';if(item?.groupId)return'group';if(item?.personaId)return'persona';return'global'}
  function memoryMatches(item,{chatId,persona,character,group}){
    const scope=memoryScope(item);if(scope==='unassigned')return false;
    if(scope==='global')return true;
    if(scope==='persona')return S(item.personaId)===S(persona?.id);
    if(scope==='character')return S(item.characterId)===S(character?.id)&&(!item.personaId||S(item.personaId)===S(persona?.id));
    if(scope==='group')return !!group&&S(item.groupId)===S(group?.id)&&(!item.personaId||S(item.personaId)===S(persona?.id));
    if(scope==='conversation')return canonical(item.chatId)===canonical(chatId);
    return false
  }
  function worldMemoryRows(character){const worlds=L(data.memoryWorldsV453).filter(world=>character&&L(world.characterIds).includes(character.id)),ids=new Set(worlds.map(world=>world.id));return L(data.memoryWorldEntriesV453).filter(item=>ids.has(item.worldId)).map(item=>({item,world:worlds.find(world=>world.id===item.worldId)}))}
  function memberGroups(character){return character?L(data.groups).filter(group=>L(group.memberIds).includes(character.id)):[]}
  function conversationPersonaId(chatId){try{const parsed=typeof parsePersonaThreadId==='function'?parsePersonaThreadId(chatId):null;if(parsed?.personaId)return S(parsed.personaId)}catch{}const tokens=S(chatId).split(/[:|]/);return data.personas?.find(persona=>tokens.includes(S(persona.id)))?.id||''}
  function samePersonaConversation(chatId,persona){const found=conversationPersonaId(chatId);return found?S(found)===S(persona?.id):canonical(chatId)===canonical(currentChat)}
  function messageSpeaker(message,character,persona){if(message?.role==='user')return persona?.name||'我';if(message?.speaker)return data.characters?.find(item=>item.id===message.speaker)?.name||character?.name||'对方';return character?.name||'对方'}
  function sourceConversationRow(sourceChatId,label,kind,character,persona){
    const summary=S(data.chatSummaries?.[sourceChatId]?.text).trim(),messages=L(data.chats?.[sourceChatId]).filter(message=>message&&!message.systemGreeting).slice(-8);if(!summary&&!messages.length)return null;
    const recent=messages.map(message=>`${messageSpeaker(message,character,persona)}：${S(message.text||message.prompt||(message.kind==='image'?'[图片]':'')).trim()||'[空消息]'}`).join('\n').slice(-2600);
    return{sourceChatId,label,kind,title:label,text:`${summary?`摘要：${summary.slice(0,2200)}`:'尚无摘要'}${recent?`\n近期片段：\n${recent}`:''}`}
  }
  function linkedConversationRows(chatId,character){
    const persona=currentPersona(chatId),group=currentGroup(chatId),rows=[];
    if(group){
      const privateId=directChatId(character.id,persona?.id),privateRow=sourceConversationRow(privateId,`${character.name}与${persona?.name||'当前面具'}的私信`,'private',character,persona);if(privateRow)rows.push(privateRow);
      for(const other of memberGroups(character).filter(item=>item.id!==group.id).slice(0,4)){const id=groupChatId(other.id,persona?.id),row=sourceConversationRow(id,`群聊「${other.name}」`,'group',character,persona);if(row)rows.push(row)}
    }else{
      for(const linked of memberGroups(character).slice(0,5)){const id=groupChatId(linked.id,persona?.id),row=sourceConversationRow(id,`群聊「${linked.name}」`,'group',character,persona);if(row)rows.push(row)}
    }
    return rows
  }
  function linkedManualRows(chatId,character){
    const persona=currentPersona(chatId),group=currentGroup(chatId),rows=[],linkedGroups=memberGroups(character).filter(item=>item.id!==group?.id),linkedGroupIds=new Set(linkedGroups.map(item=>item.id)),privateId=directChatId(character?.id,persona?.id);
    for(const item of L(data.memories)){
      if(memoryScope(item)==='unassigned'||(item.personaId&&S(item.personaId)!==S(persona?.id)))continue;
      const scope=memoryScope(item);let source=null;
      if(!group&&scope==='group'&&linkedGroupIds.has(S(item.groupId)))source=data.groups.find(row=>S(row.id)===S(item.groupId));
      if(!group&&scope==='conversation'&&samePersonaConversation(item.chatId,persona)){const sourceGroup=currentGroup(item.chatId);if(sourceGroup&&linkedGroupIds.has(S(sourceGroup.id)))source=sourceGroup}
      if(group&&scope==='conversation'&&canonical(item.chatId)===canonical(privateId))source={id:'private',name:`${character?.name||'当前人物'}与${persona?.name||'当前面具'}的私信`,private:true};
      if(group&&scope==='group'&&linkedGroupIds.has(S(item.groupId)))source=data.groups.find(row=>S(row.id)===S(item.groupId));
      if(group&&scope==='conversation'&&samePersonaConversation(item.chatId,persona)){const sourceGroup=currentGroup(item.chatId);if(sourceGroup&&linkedGroupIds.has(S(sourceGroup.id)))source=sourceGroup}
      if(!source)continue;rows.push({item,sourceLabel:source.private?source.name:`群聊「${source.name}」`,sourceKind:source.private?'private':'group'})
    }
    return rows
  }
  function scopedMemoryGroups(chatId,character){
    const persona=currentPersona(chatId),group=currentGroup(chatId),ctx={chatId,persona,character,group},matched=L(data.memories).filter(item=>memoryMatches(item,ctx));
    const buckets=[
      {key:'global',label:'共同长期记忆',priority:1,rows:matched.filter(item=>memoryScope(item)==='global')},
      {key:'persona',label:`${persona?.name||'当前面具'}的记忆`,priority:3,rows:matched.filter(item=>memoryScope(item)==='persona')},
      {key:'character',label:`${character?.name||'当前人物'}的记忆`,priority:5,rows:matched.filter(item=>memoryScope(item)==='character')},
      {key:'group',label:`${group?.name||'当前群聊'}的共同记忆`,priority:5,rows:matched.filter(item=>memoryScope(item)==='group')},
      {key:'linked-manual',label:'跨入口事实记忆（保留来源）',priority:4,rows:linkedManualRows(chatId,character)},
      {key:'linked-conversation',label:'跨入口会话记忆（保留来源）',priority:4,rows:linkedConversationRows(chatId,character)},
      {key:'conversation',label:'本段对话记忆',priority:7,rows:matched.filter(item=>memoryScope(item)==='conversation')},
      {key:'world',label:`${character?.name||'当前人物'}绑定的世界记忆`,priority:4,rows:worldMemoryRows(character)}
    ];return buckets.filter(bucket=>bucket.rows.length)
  }
  function memoryRowText(bucket,row){
    if(bucket.key==='world')return`【${row.world?.name||'世界'} · ${row.item?.title||'未命名'}】\n${S(row.item?.text)}`;
    if(bucket.key==='linked-manual')return`【来源：${row.sourceLabel}｜${row.item?.title||'未命名记忆'}】\n${S(row.item?.text)}\n（这是${row.sourceKind==='private'?'私信':'群聊'}中形成的事实，不得改写成当前入口刚刚发生。）`;
    if(bucket.key==='linked-conversation')return`【来源：${row.label}】\n${S(row.text)}\n（这是${row.kind==='private'?'私信':'群聊'}记录；只允许${row.kind==='private'?'当前发言人物本人':'实际参与该群聊的人物'}据此记得事实，不代表其他人自动知情。）`;
    return`【${row.title||'未命名记忆'}】\n${S(row.text)}`
  }
  function compileScopedMemory(chatId,character,limit=12000){
    const groups=scopedMemoryGroups(chatId,character),candidates=[];for(const [groupIndex,group] of groups.entries())for(const [rowIndex,row] of group.rows.entries()){const text=memoryRowText(group,row).trim();if(text)candidates.push({group,row,text:text.slice(0,4200),priority:group.priority,groupIndex,rowIndex})}
    let used=0;const kept=[];for(const entry of candidates.slice().sort((a,b)=>b.priority-a.priority||a.rowIndex-b.rowIndex)){const remaining=limit-used;if(remaining<100)break;const text=entry.text.length>remaining?entry.text.slice(0,Math.max(0,remaining-20))+'\n【本层按预算截断】':entry.text;kept.push({...entry,text});used+=text.length+4}
    const byGroup=new Map();for(const entry of kept.sort((a,b)=>a.groupIndex-b.groupIndex||a.rowIndex-b.rowIndex)){if(!byGroup.has(entry.group))byGroup.set(entry.group,[]);byGroup.get(entry.group).push(entry.text)}
    return[...byGroup].map(([group,rows])=>`【${group.label}】\n${rows.join('\n\n')}`).join('\n\n')
  }
  const baseEngineContext=typeof buildEngineContext==='function'?buildEngineContext:null;
  if(baseEngineContext){const scopedEngineContext=function(character,userMessage='',chatId=currentChat,mode='all'){const area=BINDING_AREA_KEYS.includes(mode)?mode:mode==='group'?'group':'chat',worlds=data.worlds,rules=data.engine.worldRules,presets=data.engine.presetModules;data.worlds=L(worlds).filter(item=>areaMatches(item,area)).map(item=>area==='group'&&item.mode==='online'?{...item,mode:'group'}:!['chat','group'].includes(area)?{...item,mode:'all'}:item);data.engine.worldRules=L(rules).filter(item=>areaMatches(item,area));data.engine.presetModules=L(presets).filter(item=>areaMatches(item,area));try{const result=baseEngineContext(character,userMessage,chatId,mode)||{},memory=compileScopedMemory(chatId,character);result.memory=memory||'当前人物、面具与会话组合没有可用的长期记忆。';result.bindingArea=area;data.runtime.v456LastContextScope={chatId:canonical(chatId),personaId:currentPersona(chatId)?.id||'',characterId:character?.id||'',groupId:currentGroup(chatId)?.id||'',mode,area,at:NOW()};return result}finally{data.worlds=worlds;data.engine.worldRules=rules;data.engine.presetModules=presets}};window.buildEngineContext=scopedEngineContext;try{buildEngineContext=scopedEngineContext}catch{}}

  /* ---------- stable final hierarchy contract ---------- */
  function hierarchyContract(chatId,mode,character,group){const persona=currentPersona(chatId),target=group?.name||character?.name||'当前对象';return`\n\n【上下文层次固定规则｜不得显示标题】\n当前组合：${persona?.name||'当前面具'} × ${target} × ${mode==='group'?'群聊':mode==='offline'?'线下相遇':'线上私聊'}。只读取当前面具下的资料。${character?.name||'当前发言人物'}可以记得自己实际参与过的私信与群聊，但每段跨入口资料必须保留“来自私信”或“来自某个群聊”的来源，不能把旧群聊误认成当前私信，也不能把私信内容说成群内共同经历。\n群聊隐私边界：私信记忆只属于当轮发言人物本人；其他成员不会因此自动知情。私信读取群聊记忆时，也只读取该人物真实参加过的群聊。严禁借用其他面具、无关人物或未参加群聊的资料。\n固定读取顺序：①当前时间与地点；②入口及输出格式；③${persona?.name||'我'}与${target}的身份和人称边界；④双方关系与黑名单状态；⑤本段已发生的电话和手机事实；⑥当前入口命中的世界书与预设；⑦共同→面具→人物/本群→带来源的跨入口事实→本会话长期记忆；⑧精确属于本会话的摘要、近期消息和本轮输入。\n冲突优先级：本轮明确输入 > 当前会话较新的真实事件 > 当前会话摘要与近期消息 > 当前人物或本群记忆 > 带来源的跨入口记忆 > 当前面具记忆 > 共同背景。来源标记、入口格式、身份边界和“不得替${persona?.name||'我'}行动”不允许被较低层内容覆盖。`}
  const hierarchyOnline=typeof buildSystemPrompt==='function'?buildSystemPrompt:null,hierarchyOffline=typeof buildOfflineSystemPrompt==='function'?buildOfflineSystemPrompt:null,hierarchyGroup=typeof buildGroupSystemPrompt==='function'?buildGroupSystemPrompt:null;
  if(hierarchyOnline){const wrapped=function(character,message='',chatId=currentChat){return hierarchyOnline(character,message,chatId)+hierarchyContract(chatId,'online',character,null)};window.buildSystemPrompt=wrapped;try{buildSystemPrompt=wrapped}catch{}}
  if(hierarchyOffline){const wrapped=function(character,message='',chatId=currentChat,sceneMode='direct'){return hierarchyOffline(character,message,chatId,sceneMode)+hierarchyContract(chatId,'offline',character,null)};window.buildOfflineSystemPrompt=wrapped;try{buildOfflineSystemPrompt=wrapped}catch{}}
  if(hierarchyGroup){const wrapped=function(group,character,message='',chatId=currentChat){return hierarchyGroup(group,character,message,chatId)+hierarchyContract(chatId,'group',character,group)};window.buildGroupSystemPrompt=wrapped;try{buildGroupSystemPrompt=wrapped}catch{}}

  /* ---------- six-area world / preset / regex bindings ---------- */
  function areaPicker(prefix,selected=['chat','group'],disabled=false){const chosen=normalizedAreas(selected);return`<div class="field v456-area-field"><label>使用位置（可多选）</label><div class="v456-area-picker">${BINDING_AREAS.map(([key,label])=>`<label><input class="v456-area-${AT(prefix)}" type="checkbox" value="${AT(key)}" ${chosen.includes(key)?'checked':''} ${disabled?'disabled':''}><span>${E(label)}</span></label>`).join('')}</div><small>只会进入勾选的位置；私信与线下归入“聊天入口”，群聊单独控制。</small></div>`}
  function readAreas(prefix){return[...document.querySelectorAll(`.v456-area-${prefix}:checked`)].map(input=>S(input.value)).filter(key=>BINDING_AREA_KEYS.includes(key))}
  function areaSummary(item){return itemAreas(item).map(key=>BINDING_AREA_LABELS[key]).join(' · ')}
  function requireAreas(areas){if(areas.length)return true;toast('请至少选择一个使用位置');return false}

  const oldWorldEditorFields=typeof worldEditorFields==='function'?worldEditorFields:null,oldCollectWorldEditor=typeof collectWorldEditor==='function'?collectWorldEditor:null;
  if(oldWorldEditorFields){const refined=function(item={}){const html=oldWorldEditorFields(item),picker=areaPicker('worldbook',itemAreas(item));return html.replace('<div class="field"><label>内容</label>',`${picker}<div class="field"><label>内容</label>`)};window.worldEditorFields=refined;try{worldEditorFields=refined}catch{}}
  if(oldCollectWorldEditor){const refined=function(){const value=oldCollectWorldEditor(),areas=readAreas('worldbook');return{...value,areas}};window.collectWorldEditor=refined;try{collectWorldEditor=refined}catch{}}
  const oldValidateWorldEntry=typeof validateWorldEntry==='function'?validateWorldEntry:null;
  if(oldValidateWorldEntry){const refined=function(item){if(!oldValidateWorldEntry(item))return false;return requireAreas(item.areas||[])};window.validateWorldEntry=refined;try{validateWorldEntry=refined}catch{}}
  window.renderWorld=function(){const root=document.getElementById('worldList');if(!root)return;if(!L(data.worlds).length){root.innerHTML='<div class="empty"><div class="big">✦</div>还没有世界书条目</div>';return}root.innerHTML=L(data.worlds).slice().sort((a,b)=>semanticWorldLayer(a)-semanticWorldLayer(b)).map(item=>`<div class="card world-card ${item.builtIn?'builtin-world-card':''}" onclick="editWorld('${AT(item.id)}')"><div class="module-head"><b>${E(item.name)}</b><span class="pill">${item.enabled===false?'已停用':item.builtIn?'内置启用':'已启用'}</span></div><div class="v456-area-badges">${itemAreas(item).map(key=>`<span>${E(BINDING_AREA_LABELS[key])}</span>`).join('')}</div><div class="world-card-meta"><span>${item.mode==='online'?'仅线上':item.mode==='offline'?'仅线下':'线上与线下'}</span><span>${E(worldScopeLabel(item))}</span><span>${item.activation==='trigger'?'普通触发':'常驻'}</span></div><div class="muted">范围：${E(worldTargetNames(item))}</div>${item.activation==='trigger'?`<div class="muted">触发：${E(item.trigger)}</div>`:''}<div class="muted world-card-copy">${E(item.desc||'')}</div></div>`).join('')};try{renderWorld=window.renderWorld}catch{}

  const oldEngineWorldFields=typeof engineWorldRuleFields==='function'?engineWorldRuleFields:null;
  if(oldEngineWorldFields){const refined=function(item={activation:'persistent'}){return oldEngineWorldFields(item).replace('<div class="field"><label>注入内容</label>',`${areaPicker('engineworld',itemAreas(item))}<div class="field"><label>注入内容</label>`)};window.engineWorldRuleFields=refined;try{engineWorldRuleFields=refined}catch{}}
  window.saveWorldRule=function(index=null){const activation=document.getElementById('erA')?.value||'persistent',areas=readAreas('engineworld'),previous=index===null?null:data.engine.worldRules[index],item={name:document.getElementById('erN')?.value.trim()||'',activation,trigger:document.getElementById('erT')?.value.trim()||'',content:document.getElementById('erC')?.value||'',areas,enabled:previous?previous.enabled!==false:true};if(!item.name)return toast('请填写名称');if(!requireAreas(areas))return;if(activation==='trigger'&&!item.trigger)return toast('普通规则需要填写触发条件');if(index===null)data.engine.worldRules.push(item);else data.engine.worldRules[index]={...previous,...item};save();closeModal();engineTab('world')};try{saveWorldRule=window.saveWorldRule}catch{}
  window.renderEngineWorld=function(root){if(!root)return;const rules=L(data.engine.worldRules),state=O(data.engine.state);root.innerHTML=`<div class="engine-card"><h3>♠ &nbsp;动态世界</h3><p>世界规则可以同时绑定多个位置。常驻规则在勾选位置每轮进入，普通规则还需要命中触发条件。</p><div class="engine-flow"><div class="flowbox"><b>世界状态</b><span>地点：${E(state.location||'未设置')}<br>天气：${E(state.weather||'未设置')}<br>时间：${E(state.time||'未设置')}</span></div><div class="flowbox"><b>当前规则</b><span>${rules.filter(item=>item.enabled!==false).length} 条</span></div></div><button class="primary" style="margin-top:10px" onclick="newWorldRule()">＋ 新建世界规则</button></div><div class="engine-card"><h3>♠ &nbsp;世界规则</h3>${rules.length?rules.map((item,index)=>`<div class="module"><div class="module-head"><b>${E(item.name)}</b><span class="pill">${item.enabled===false?'停用':item.activation==='trigger'?'普通触发':'常驻'}</span></div><div class="v456-area-badges">${itemAreas(item).map(key=>`<span>${E(BINDING_AREA_LABELS[key])}</span>`).join('')}</div><small>${item.activation==='trigger'?E(item.trigger||'尚未填写触发条件'):'在勾选位置每轮生效'}</small><div class="muted" style="margin-top:6px">${E(item.content||'')}</div><div style="margin-top:9px;display:flex;gap:7px"><button class="icon-btn" onclick="editWorldRule(${index})">⋯</button><button class="icon-btn" onclick="toggleWorldRule(${index})">◉</button></div></div>`).join(''):'<div class="empty">还没有世界规则。</div>'}</div>`};try{renderEngineWorld=window.renderEngineWorld}catch{}

  const oldPresetFields=typeof presetFields==='function'?presetFields:null;
  if(oldPresetFields){const refined=function(item={kind:'身份层'}){return oldPresetFields(item).replace('<div class="field"><label>内容</label>',`${areaPicker('preset',itemAreas(item))}<div class="field"><label>内容</label>`)};window.presetFields=refined;try{presetFields=refined}catch{}}
  window.savePreset=function(index=null){const areas=readAreas('preset'),previous=index===null?null:data.engine.presetModules[index],item={name:document.getElementById('pmN')?.value.trim()||'',kind:document.getElementById('pmK')?.value||'自定义',content:document.getElementById('pmC')?.value||'',areas,enabled:previous?previous.enabled!==false:true};if(!item.name)return toast('请填写名称');if(!requireAreas(areas))return;if(index===null)data.engine.presetModules.push(item);else data.engine.presetModules[index]={...previous,...item};save();closeModal();engineTab('preset')};try{savePreset=window.savePreset}catch{}
  window.renderEnginePreset=function(root){if(!root)return;const rows=L(data.engine.presetModules);root.innerHTML=`<div class="engine-card"><h3>♣ &nbsp;预设编译器</h3><p>每个模块可同时绑定聊天、群聊、动态、广场、语伴和番外；仍按列表顺序编译。</p><div class="engine-flow"><div class="flowbox"><b>位置</b><span>六类入口多选</span></div><div class="flowbox"><b>顺序</b><span>按列表实际编译</span></div><div class="flowbox"><b>停用</b><span>不会进入任何位置</span></div></div><button class="primary" style="margin-top:10px" onclick="newPresetModule()">＋ 新建模块</button></div><div class="engine-card"><h3>♣ &nbsp;模块顺序</h3>${rows.length?rows.map((item,index)=>`<div class="module"><div class="module-head"><b>${E(item.name)}</b><span class="pill">${item.enabled===false?'停用':'启用'}</span></div><div class="v456-area-badges">${itemAreas(item).map(key=>`<span>${E(BINDING_AREA_LABELS[key])}</span>`).join('')}</div><small>${E(item.kind||'自定义')} · 可用箭头调整真实编译顺序</small><div style="margin-top:7px;color:#777;font-size:11px">${E(item.content||'')}</div><div style="margin-top:8px;display:flex;gap:6px"><button class="icon-btn" onclick="movePreset(${index},-1)">↑</button><button class="icon-btn" onclick="movePreset(${index},1)">↓</button><button class="icon-btn" onclick="editPreset(${index})">⋯</button></div></div>`).join(''):'<div class="empty">还没有预设模块。</div>'}</div>`};try{renderEnginePreset=window.renderEnginePreset}catch{}

  function regexTargetOptions(selected='AI 回复'){return[['AI 回复','对方回复'],['用户消息','我的输入'],['全部消息','双方消息'],['状态解析','状态解析']].map(([value,label])=>`<option value="${AT(value)}" ${value===selected?'selected':''}>${E(label)}</option>`).join('')}
  function regexFields(item={target:'AI 回复',flags:'g'}){return`<div class="field"><label>名称</label><input id="rxN" value="${AT(item.name||'')}"></div><div class="field"><label>匹配模式</label><input id="rxP" value="${AT(item.pattern||'')}" placeholder="填写正则表达式"></div><div class="field"><label>替换内容</label><input id="rxR" value="${AT(item.replace||'')}"></div><div class="field"><label>处理对象</label><select id="rxT">${regexTargetOptions(item.target||'AI 回复')}</select></div><div class="field"><label>Flags</label><input id="rxG" value="${AT(item.flags||'g')}" placeholder="g / gi / gm / gis"></div>${areaPicker('regex',itemAreas(item))}`}
  window.newRegexRule=function(){modal(`<h2>正则规则</h2><div class="note" style="padding:0 16px 14px">同一条规则可以同时绑定多个位置；未勾选的位置不会执行。</div>${regexFields()}<div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="saveRegex()">保存</button></div>`)};try{newRegexRule=window.newRegexRule}catch{}
  window.editRegex=function(index){const item=data.engine.regexRules[index];if(!item)return;modal(`<h2>编辑正则规则</h2>${regexFields(item)}<div class="form-actions"><button class="danger" onclick="data.engine.regexRules.splice(${index},1);save();closeModal();engineTab('regex')">删除</button><button class="primary" onclick="saveRegex(${index})">保存</button></div>`)};try{editRegex=window.editRegex}catch{}
  window.saveRegex=function(index=null){const areas=readAreas('regex'),previous=index===null?null:data.engine.regexRules[index],item={name:document.getElementById('rxN')?.value.trim()||'',pattern:document.getElementById('rxP')?.value||'',replace:document.getElementById('rxR')?.value||'',target:document.getElementById('rxT')?.value||'AI 回复',flags:document.getElementById('rxG')?.value||'g',areas,enabled:previous?previous.enabled!==false:true};if(!item.name||!item.pattern)return toast('名称和匹配模式不能为空');if(!requireAreas(areas))return;try{new RegExp(item.pattern,typeof getRegexFlags==='function'?getRegexFlags(item):item.flags)}catch{return toast('正则表达式无效')}if(index===null)data.engine.regexRules.push(item);else data.engine.regexRules[index]={...previous,...item};save();closeModal();engineTab('regex')};try{saveRegex=window.saveRegex}catch{}
  window.renderEngineRegex=function(root){if(!root)return;const rows=L(data.engine.regexRules);root.innerHTML=`<div class="engine-card"><h3>♦ &nbsp;正则处理管线</h3><p>每条规则只在勾选位置执行；聊天入口与群聊分开，动态、广场、语伴和番外也互不误用。</p><div class="engine-flow"><div class="flowbox"><b>我的输入</b><span>发送前处理</span></div><div class="flowbox"><b>对方输出</b><span>生成后处理</span></div><div class="flowbox"><b>位置</b><span>六类入口筛选</span></div></div><button class="primary" style="margin-top:10px" onclick="newRegexRule()">＋ 新建规则</button></div><div class="engine-card"><h3>♦ &nbsp;规则链</h3>${rows.length?rows.map((item,index)=>`<div class="module"><div class="module-head"><b>${E(item.name)}</b><span class="pill">${E(item.target==='AI 回复'?'对方回复':item.target==='用户消息'?'我的输入':item.target==='全部消息'?'双方消息':item.target||'对方回复')}</span></div><div class="v456-area-badges">${itemAreas(item).map(key=>`<span>${E(BINDING_AREA_LABELS[key])}</span>`).join('')}</div><small>${item.enabled===false?'停用':'启用'} · 顺序 ${index+1}</small><div class="muted" style="margin-top:6px">/${E(item.pattern)}/${E(item.flags||'g')} → ${E(item.replace||'')}</div><div style="margin-top:8px"><button class="icon-btn" onclick="editRegex(${index})">⋯</button></div></div>`).join(''):'<div class="empty">还没有正则规则。</div>'}</div>`};try{renderEngineRegex=window.renderEngineRegex}catch{}

  function interfaceArea(){return currentGroup()?'group':'chat'}
  function areaRegex(text,target,area){let output=S(text);for(const item of data.engine.regexRules.filter(row=>row.enabled!==false&&areaMatches(row,area))){if(item.target&&item.target!==target&&item.target!=='全部消息')continue;try{output=output.replace(new RegExp(item.pattern,typeof getRegexFlags==='function'?getRegexFlags(item):item.flags||'g'),item.replace??'')}catch{}}return output}
  window.applyRegexPipeline=function(text,target='AI 回复',area=''){return areaRegex(text,target,area||interfaceArea())};try{applyRegexPipeline=window.applyRegexPipeline}catch{}

  function detectArea(kind,options={},meta={}){const source=`${S(meta?.purpose)}\n${S(options?.system)}\n${L(options?.history).map(item=>S(item?.content)).join('\n')}`;if(/side[- ]?story|番外|独立小说|小说篇章|小说续写/i.test(source))return'story';if(/语伴|学习外语|语言反馈|词库|学习反馈|纠正表达|人物陪练|角色陪练/i.test(source))return'learning';if(/广场|论坛回复|广场内容|面向广场/i.test(source))return'square';if(kind==='feed'||/发布一条[“\"]?动态|动态正文|动态页/i.test(source))return'feed';if(/沉浸式群聊|当前是正式群聊|群聊成员/i.test(source))return'group';return'chat'}
  function bindingEntities(options){const source=`${S(options?.system)}\n${L(options?.history).map(item=>S(item?.content)).join('\n')}`,characters=L(data.characters).filter(item=>source.includes(`character:${item.id}`)||(item.name&&source.includes(item.name))),groups=L(data.groups).filter(item=>source.includes(`group:${item.id}`)||(item.name&&source.includes(item.name))),activePerson=currentPerson(),activeGroup=currentGroup();if(!characters.length&&activePerson)characters.push(activePerson);if(!groups.length&&activeGroup)groups.push(activeGroup);return{source,characters,groups,persona:currentPersona()}}
  function bindingScopeMatches(item,entities){const scope=item?.scope||'global',targets=L(item?.targetIds);if(scope==='character')return entities.characters.some(character=>targets.includes(character.id));if(scope==='group')return entities.groups.some(group=>targets.includes(group.id));return true}
  function entryBindingText(area,options){
    const entities=bindingEntities(options),message=entities.source,character=entities.characters[0],persona=entities.persona,state=O(data.engine.state),characterText=character&&typeof characterContext==='function'?characterContext(character):'',personaText=persona&&typeof personaContext==='function'?personaContext(persona):'',context={state:JSON.stringify(state),message,character:characterText,role:characterText,user:personaText,persona:personaText};
    const books=L(data.worlds).filter(item=>item.enabled!==false&&areaMatches(item,area)&&bindingScopeMatches(item,entities)&&((item.activation||'persistent')==='persistent'||(typeof ruleMatches==='function'&&ruleMatches(item,message))));
    const rules=L(data.engine.worldRules).filter(item=>item.enabled!==false&&areaMatches(item,area)&&((item.activation||'persistent')==='persistent'||(typeof ruleMatches==='function'&&ruleMatches(item,message))));
    const formatter=item=>item.__engineRule?`【世界规则：${item.name}】\n${typeof template==='function'?template(item.content,context):S(item.content)}`:`【世界书：${item.name}】\n${typeof template==='function'?template(item.desc,context):S(item.desc)}`;
    const worldRows=[...books,...rules.map(item=>({...item,__engineRule:true}))],worldText=typeof compileSemanticLayers==='function'?compileSemanticLayers(worldRows,formatter,10000):worldRows.map(formatter).join('\n\n'),base={...context,world:worldText,memory:'',state:`${JSON.stringify(state,null,2)}`},presets=L(data.engine.presetModules).filter(item=>item.enabled!==false&&areaMatches(item,area)),presetText=typeof compileOrderedModules==='function'?compileOrderedModules(presets,item=>`【${item.kind||'自定义'}：${item.name}】\n${typeof template==='function'?template(item.content,base):S(item.content)}`,9000):presets.map(item=>S(item.content)).join('\n\n');
    if(!worldText&&!presetText)return'';return`\n\n【${BINDING_AREA_LABELS[area]}专用绑定｜内部内容，不得显示标题】\n${worldText||'当前没有命中的世界书或世界规则。'}${presetText?`\n\n【本位置预设】\n${presetText}`:''}\n这些内容只在${BINDING_AREA_LABELS[area]}生效；不得把绑定名称、编译过程或规则标题说给对方。`
  }
  function prepareAreaOptions(area,options={}){if(options.__v456EntryBindings===area)return options;const history=L(options.history).map(item=>{const target=item?.role==='assistant'?'AI 回复':'用户消息';return{...item,content:areaRegex(item?.content,target,area)}}),addition=entryBindingText(area,{...options,history});return{...options,system:S(options.system)+addition,history,__v456EntryBindings:area}}
  const oldInvokeModel=typeof invokeModel==='function'?invokeModel:null;
  if(oldInvokeModel){const refined=async function(kind,options={}){const area=detectArea(kind,options),external=!['chat','group'].includes(area),already=options.__v456EntryBindings===area,prepared=external?prepareAreaOptions(area,options):options,result=await oldInvokeModel(kind,prepared);return external&&!already?areaRegex(result,'AI 回复',area):result};window.invokeModel=refined;try{invokeModel=refined}catch{}}
  const oldStreamInvoke=typeof V.streamInvoke==='function'?V.streamInvoke:null;
  if(oldStreamInvoke){V.streamInvoke=async function(kind,options,onChunk,meta={}){const area=detectArea(kind,options,meta),external=!['chat','group'].includes(area),prepared=external?prepareAreaOptions(area,options):options,result=await oldStreamInvoke(kind,prepared,onChunk,meta);if(external&&result&&typeof result==='object')result.output=areaRegex(result.output,'AI 回复',area);return result};window.v455InvokeStreaming=V.streamInvoke}
  const oldSquareSave=window.v452SaveSquareComposer;if(typeof oldSquareSave==='function')window.v452SaveSquareComposer=function(kind,...args){if(kind==='user'){const title=document.getElementById('v452SquareTitle'),body=document.getElementById('v452SquareText');if(title)title.value=areaRegex(title.value,'用户消息','square');if(body)body.value=areaRegex(body.value,'用户消息','square')}return oldSquareSave.call(this,kind,...args)};
  const oldCreatePost=typeof createPost==='function'?createPost:null;if(oldCreatePost){const refined=function(...args){const body=document.getElementById('pt'),place=document.getElementById('pl');if(body)body.value=areaRegex(body.value,'用户消息','feed');if(place)place.value=areaRegex(place.value,'用户消息','feed');return oldCreatePost(...args)};window.createPost=refined;try{createPost=refined}catch{}}
  window.V456Bindings={areas:BINDING_AREAS,itemAreas,areaMatches,detectArea,entryBindingText,compileScopedMemory,scopedMemoryGroups};

  /* ---------- context hierarchy inspector ---------- */
  function contextView(){const raw=O(data.runtime.v456ContextView),activeGroup=currentGroup(),activePerson=currentPerson(),persona=currentPersona();return data.runtime.v456ContextView={scope:['character','persona','group'].includes(raw.scope)?raw.scope:(activeGroup?'group':'character'),characterId:S(raw.characterId||activePerson?.id||data.characters?.[0]?.id),personaId:S(raw.personaId||persona?.id||data.personas?.[0]?.id),groupId:S(raw.groupId||activeGroup?.id||data.groups?.[0]?.id),target:S(raw.target||''),mode:raw.mode==='offline'?'offline':'online'}}
  function validId(list,id){return L(list).some(item=>S(item.id)===S(id))}
  function resolveContextView(){const view=contextView();if(!validId(data.personas,view.personaId))view.personaId=data.personas?.[0]?.id||'';if(!validId(data.characters,view.characterId))view.characterId=data.characters?.[0]?.id||'';if(!validId(data.groups,view.groupId))view.groupId=data.groups?.[0]?.id||'';if(view.scope==='persona'){const candidates=[...L(data.characters).map(item=>`character:${item.id}`),...L(data.groups).map(item=>`group:${item.id}`)];if(!candidates.includes(view.target))view.target=candidates[0]||''}return view}
  function selectOptions(items,selected){return L(items).map(item=>`<option value="${AT(item.id)}" ${S(item.id)===S(selected)?'selected':''}>${E(item.name||'未命名')}</option>`).join('')}
  function contextSelectors(view){
    const tabs=`<nav class="v456-context-tabs">${[['character','按人物'],['persona','按面具'],['group','按群聊']].map(([key,label])=>`<button class="${view.scope===key?'on':''}" onclick="v456ContextSetScope('${key}')">${label}</button>`).join('')}</nav>`;
    let controls='';if(view.scope==='character')controls=`<label><span>查看人物</span><select onchange="v456ContextSet('characterId',this.value)">${selectOptions(data.characters,view.characterId)}</select></label><label><span>搭配面具</span><select onchange="v456ContextSet('personaId',this.value)">${selectOptions(data.personas,view.personaId)}</select></label><label><span>入口</span><select onchange="v456ContextSet('mode',this.value)"><option value="online" ${view.mode!=='offline'?'selected':''}>线上私聊</option><option value="offline" ${view.mode==='offline'?'selected':''}>线下相遇</option></select></label>`;
    if(view.scope==='group')controls=`<label><span>查看群聊</span><select onchange="v456ContextSet('groupId',this.value)">${selectOptions(data.groups,view.groupId)}</select></label><label><span>搭配面具</span><select onchange="v456ContextSet('personaId',this.value)">${selectOptions(data.personas,view.personaId)}</select></label>`;
    if(view.scope==='persona'){const targets=[...L(data.characters).map(item=>({id:`character:${item.id}`,name:`私聊 · ${item.name}`})),...L(data.groups).map(item=>({id:`group:${item.id}`,name:`群聊 · ${item.name}`}))];controls=`<label><span>查看面具</span><select onchange="v456ContextSet('personaId',this.value)">${selectOptions(data.personas,view.personaId)}</select></label><label><span>搭配对象</span><select onchange="v456ContextSet('target',this.value)">${selectOptions(targets,view.target)}</select></label>${view.target.startsWith('character:')?`<label><span>入口</span><select onchange="v456ContextSet('mode',this.value)"><option value="online" ${view.mode!=='offline'?'selected':''}>线上私聊</option><option value="offline" ${view.mode==='offline'?'selected':''}>线下相遇</option></select></label>`:''}`}
    return`${tabs}<div class="v456-context-selectors">${controls}</div>`
  }
  function contextSelection(view){let character=null,group=null;if(view.scope==='group')group=data.groups?.find(item=>item.id===view.groupId)||null;else if(view.scope==='persona'&&view.target.startsWith('group:'))group=data.groups?.find(item=>item.id===view.target.slice(6))||null;else{const id=view.scope==='persona'?view.target.slice(10):view.characterId;character=data.characters?.find(item=>item.id===id)||null}if(group&&!character){const id=L(group.memberIds)[Number(group.turnIndex)||0]||L(group.memberIds)[0];character=data.characters?.find(item=>item.id===id)||null}const chatId=group?groupChatId(group.id,view.personaId):character?directChatId(character.id,view.personaId):'',mode=group?'group':view.mode;return{character,group,chatId,mode,persona:data.personas?.find(item=>item.id===view.personaId)||currentPersona(chatId)}}
  function relationSummary(selection){if(!selection.character||selection.group||typeof V.relationFor!=='function')return'群聊不使用一对一黑名单状态';const r=V.relationFor(selection.character.id,selection.persona?.id);return r.userBlocksCharacter&&r.characterBlocksUser?'彼此互相拉黑':r.userBlocksCharacter?`${selection.persona?.name}拉黑了${selection.character.name}`:r.characterBlocksUser?`${selection.character.name}拉黑了${selection.persona?.name}`:'彼此没有拉黑'}
  function continuityPreview(selection){const summary=S(data.chatSummaries?.[selection.chatId]?.text).trim(),limit=Math.max(4,Number(data.settings.maxHistory)||24),messages=L(data.chats?.[selection.chatId]).slice(-limit),speaker=message=>{if(message.role==='user')return selection.persona?.name||'我';if(message.speaker)return data.characters?.find(item=>item.id===message.speaker)?.name||selection.character?.name||'对方';return selection.character?.name||'对方'},recent=messages.map(message=>`${speaker(message)}：${S(message.text||message.prompt||(message.kind==='image'?'[图片]':'')).trim()||'[空消息]'}`).join('\n');return`【本段摘要】\n${summary||'尚无摘要'}\n\n【近期消息】\n${recent||'尚无消息'}`}
  function contextLayerCards(selection,engine,prompt){const chats=L(data.chats?.[selection.chatId]),summary=S(data.chatSummaries?.[selection.chatId]?.text),groups=scopedMemoryGroups(selection.chatId,selection.character),linked=groups.filter(group=>group.key.startsWith('linked-')).reduce((sum,group)=>sum+group.rows.length,0),events=L(data.phoneV454?.events).filter(event=>canonical(event.chatId)===canonical(selection.chatId)&&event.remember),worldCount=(S(engine.world).match(/【(?:世界书|世界规则)/g)||[]).length;return[
    ['01','时间与入口',`${V.worldTime?.(selection.chatId)||new Date().toLocaleString('zh-CN')} · ${selection.mode==='group'?'群聊':selection.mode==='offline'?'线下相遇':'线上私聊'}`],
    ['02','身份与边界',`${selection.persona?.name||'当前面具'} × ${selection.group?.name||selection.character?.name||'未选择'}`],
    ['03','关系状态',relationSummary(selection)],
    ['04','手机事实',`${events.length} 条允许进入本段对话的事件`],
    ['05','世界与状态',`${worldCount} 个命中块 · ${S(engine.state).slice(0,100)}`],
    ['06','分层记忆',groups.length?groups.filter(group=>!group.key.startsWith('linked-')).map(group=>`${group.label} ${group.rows.length}`).join(' · '):'当前组合没有长期记忆'],
    ['07','跨入口互通',linked?`${linked} 个带来源的私信 / 群聊记忆块`:'暂时没有可互通的私信或群聊记录'],
    ['08','本段连续性',`${summary?'1 份摘要':'无摘要'} · 最近 ${Math.min(chats.length,Number(data.settings.maxHistory)||24)} / ${chats.length} 条消息`],
    ['09','最终系统内容',`${prompt.length.toLocaleString('zh-CN')} 字符 · 只读预览`]
  ]}
  function renderContextInspector(root){const view=resolveContextView(),selection=contextSelection(view);if(!selection.character){root.innerHTML=`<div class="engine-card"><h3>上下文分层查看</h3><p>请先建立至少一个人物；群聊也需要有可发言成员。</p>${contextSelectors(view)}</div>`;return}const latest=L(data.chats?.[selection.chatId]).filter(message=>message.role==='user').at(-1)?.text||'',engine=buildEngineContext(selection.character,latest,selection.chatId,selection.mode),prompt=selection.group?buildGroupSystemPrompt(selection.group,selection.character,latest,selection.chatId):selection.mode==='offline'?buildOfflineSystemPrompt(selection.character,latest,selection.chatId,'direct'):buildSystemPrompt(selection.character,latest,selection.chatId),cards=contextLayerCards(selection,engine,prompt),groups=scopedMemoryGroups(selection.chatId,selection.character),continuity=continuityPreview(selection);
    root.innerHTML=`<div class="engine-card v456-context-inspector"><header class="v456-context-head"><div><small>上下文层 · V45.6</small><h3>上下文分层查看</h3><p>按人物、面具或群聊切换；下方展示该组合实际读取到的层次与来源，不会自动发送。</p></div><span>只读</span></header>${contextSelectors(view)}<div class="v456-context-binding"><b>${E(selection.persona?.name||'当前面具')}</b><span>×</span><b>${E(selection.group?.name||selection.character?.name||'未选择')}</b><span>·</span><em>${selection.mode==='group'?'群聊':selection.mode==='offline'?'线下相遇':'线上私聊'}</em></div><div class="v456-context-layer-list">${cards.map(([index,title,copy])=>`<article><span>${index}</span><div><b>${E(title)}</b><small>${E(copy)}</small></div></article>`).join('')}</div><details class="v456-context-details" open><summary>查看分层记忆 (${groups.reduce((sum,group)=>sum+group.rows.length,0)})</summary><pre>${E(engine.memory)}</pre></details><details class="v456-context-details"><summary>查看本段摘要与近期消息</summary><pre>${E(continuity)}</pre></details><details class="v456-context-details"><summary>查看命中的世界与状态</summary><pre>${E(engine.world)}\n\n${E(engine.state)}</pre></details><details class="v456-context-details"><summary>查看最终系统内容</summary><pre>${E(prompt)}</pre></details></div><div class="engine-card v456-context-rule"><h3>固定层次与冲突规则</h3><div class="v456-context-flow"><span>时间</span><i>›</i><span>入口</span><i>›</i><span>身份</span><i>›</i><span>关系</span><i>›</i><span>手机</span><i>›</i><span>世界</span><i>›</i><span>记忆</span><i>›</i><span>近期消息</span></div><p>同一人物在当前面具下可以互通自己参与过的私信和群聊事实，但每段都会保留来源。群聊中的私信记忆只属于当轮发言人物，不会让其他成员凭空知情；其他面具与无关人物的内容仍在本机编译阶段排除。</p></div>`;naturalizeInterface(root)
  }
  window.v456ContextSetScope=function(scope){const view=contextView();view.scope=['character','persona','group'].includes(scope)?scope:'character';save();const root=document.getElementById('engineBody');if(root)renderContextInspector(root)};
  window.v456ContextSet=function(key,value){if(!['characterId','personaId','groupId','target','mode'].includes(key))return;const view=contextView();view[key]=S(value);save();const root=document.getElementById('engineBody');if(root)renderContextInspector(root)};
  window.renderEnginePreview=function(root){renderContextInspector(root||document.getElementById('engineBody'))};try{renderEnginePreview=window.renderEnginePreview}catch{}

  /* ---------- exact interface wording only; authored content is excluded ---------- */
  const UI_SAFE='button,label,.header,.group-title,.setting,.note,.muted,.empty,.chat-plus-title,.chat-plus-grid,.v455-sheet-note,.v452-overlay-note,.v453-memory-page-head,.v453-memory-hero,.data-hero,.data-panel-title,.character-studio-hero,.editor-section-title,.editor-danger-zone,.vphone-app-head,.v455-settings-list';
  const UI_UNSAFE='.bubble,.feed-item,.feed-text,.feed-comments,.chat-row-main,.character-list-row,.persona-card,.memory-card,.v451-memory-card,.v453-memory-card,.v453-world-card,.world-card,.v452-discover-card,.v452-long-card,.v452-short-card,.v452-thread-main,.v452-record-row,.v453-long-card,.v453-profile-tile,.v453-profile-long,.v453-profile-note,.v453-profile-identity,.v453-profile-list article,.v454-thread-msg,.v455-thread-bubble,.v455-comment-row,.v455-contact-row,.v455-conversation-row,.v455-moment-card,.v455-real-row,.v455-trash-row,.v452-square-detail-scroll article>p,.v456-context-details pre,[contenteditable="true"],[contenteditable="plaintext-only"]';
  function naturalText(value){
    const persona=currentPersona(),person=currentPerson(),mine=persona?.name||'我的面具',their=person?.name||'对方',names=[...L(data.characters),...L(data.personas),...L(data.groups),...L(data.mpcs)].map(item=>S(item?.name).trim()).filter(Boolean).sort((a,b)=>b.length-a.length),protectedNames=[];
    let text=S(value);for(const [index,name] of names.entries()){if(!text.includes(name))continue;const token=`\uE000${index}\uE001`;text=text.split(name).join(token);protectedNames.push([token,name])}
    const exact={'角色':'人物','角色设置':'人物设置','角色与设定':'人物与设定','新建角色':'新建人物','导入角色卡':'导入人物卡','搜索角色':'搜索名字','USER 设定':`${mine}的设定`,'当前 USER 面具':mine,'USER 面具':mine,'AI 对话':`${their} · 对话`,'AI 内心话':'未说出口的话','自动翻译 AI 消息':`自动翻译${their}的消息`,'角色动态':'人物近况','角色补全':'人物补全','AI 生成':'智能完善','AI 可覆盖状态短句':'可智能更新状态短句','剧情账户':'虚构账户','剧情天气':'场景天气','构思剧情':'构思片段','近期剧情':'近期发展','当前剧情':'当前发展','剧情记录':'发展记录','剧情数据':'故事资料'};
    if(exact[text.trim()])text=text.replace(text.trim(),exact[text.trim()]);
    text=text.replace(/\bUSER\b/g,mine).replace(/\bAI\b/g,'智能').replace(/独立用户面具|用户面具/g,'独立面具').replace(/与用户的关系|与用户关系/g,'双方关系').replace(/用户/g,'你').replace(/当前角色/g,their).replace(/角色/g,'人物').replace(/剧情/g,'故事');
    for(const [token,name] of protectedNames)text=text.split(token).join(name);return text
  }
  function naturalizeInterface(root=document){if(!root?.querySelectorAll)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,input,option,pre,code')||parent.closest(UI_UNSAFE)||!parent.closest(UI_SAFE))continue;const next=naturalText(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next}}
  window.v456NaturalizeInterface=naturalizeInterface;
  let wordingQueued=false;const observer=new MutationObserver(()=>{if(wordingQueued)return;wordingQueued=true;queueMicrotask(()=>{wordingQueued=false;naturalizeInterface(document)})});try{observer.observe(document.documentElement,{subtree:true,childList:true})}catch{}

  setTimeout(()=>{installQuietNotifications();try{renderNotifications()}catch{}try{renderHomeDesktop()}catch{}naturalizeInterface(document);save()},0);
})();
