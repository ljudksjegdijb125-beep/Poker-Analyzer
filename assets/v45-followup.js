/* =========================================================
   POKEJI V45 · follow-up corrections
   Conversation compression is the only new memory-save action.
   Legacy unscoped manual records are kept out of prompts and shown as
   unassigned instead of being silently reclassified.
   ========================================================= */
(function(){
  if(window.__pokejiV45FollowupLoaded)return;
  window.__pokejiV45FollowupLoaded=true;
  const S=(v,f='')=>String(v??f),Q=v=>`decodeURIComponent('${encodeURIComponent(String(v??'')).replace(/'/g,'%27')}')`;
  let memoryFilter='all';
  data.memories=Array.isArray(data.memories)?data.memories:[];
  for(const m of data.memories)if(!m.scope&&!m.personaId&&!m.characterId&&!m.groupId&&!m.chatId)m.legacyUnassigned=true;
  /* Convert old hidden phone-event rows into ordinary message rows with a
     marker, so the linked phone/check/call record can appear in chat. */
  let migrated=false;
  for(const list of Object.values(data.chats||{}))for(const m of Array.isArray(list)?list:[]){if(m?.kind==='phoneEvent'){m.kind='message';m.phoneEvent=true;m.phoneEventType=m.phoneEventType||'phone';migrated=true}}
  if(migrated)save();

  function threadMeta(id){
    const p=parsePersonaThreadId(id),persona=p&&data.personas.find(x=>x.id===p.personaId),character=p?.kind==='direct'&&data.characters.find(x=>x.id===p.entityId),group=p?.kind==='group'&&data.groups.find(x=>x.id===p.entityId);
    return{p,persona,character,group,title:group?.name||character?.name||'会话',mask:persona?.name||'当前面具'};
  }
  function titleFor(id){const m=threadMeta(id);return`${m.title} · ${m.mask}`}
  function visibleSummary(id){
    if(memoryFilter==='all')return true;
    const m=threadMeta(id),current=threadMeta(currentChat),active=activePersonaFor(currentChat),currentEntity=groupForChat(currentChat)||directCharacterForChat(currentChat);
    if(memoryFilter==='mask')return !m.persona||m.persona.id===active.id;
    if(memoryFilter==='role')return !m.character||m.character.id===currentEntity?.id;
    if(memoryFilter==='conversation')return id===currentChat;
    return true;
  }
  function summaryCard(id,value){const m=threadMeta(id);return`<article class="card memory-card" onclick="viewConversationSummary(${Q(id)})"><div class="memory-card-top"><b>${esc(m.title)}</b><span class="memory-scope">${esc(m.mask)}</span></div><p>${esc(value?.text||'')}</p><div class="memory-card-foot"><span>压缩对话记忆 · ${esc(m.character?'角色':m.group?'群聊':'会话')}</span><time>${esc(value?.updatedAt?new Date(value.updatedAt).toLocaleString('zh-CN'):'')}</time></div></article>`}
  renderMemory=function(){
    const root=document.getElementById('memoryList');if(!root)return;
    const summaries=Object.entries(data.chatSummaries||{}).filter(([id,v])=>v?.text&&visibleSummary(id));
    const legacy=data.memories.filter(m=>m.legacyUnassigned).length;
    root.innerHTML=`<div class="memory-dashboard"><section class="memory-hero"><small>压缩对话记忆</small><h2>对话记忆</h2><p>“保存记忆”就是压缩一段对话。原始聊天记录不会删除；每个角色、群聊和 USER 面具的压缩摘要独立保存。</p><div class="memory-scope-switch"><button class="${memoryFilter==='all'?'on':''}" onclick="v45MemoryFilter('all')">全部</button><button class="${memoryFilter==='mask'?'on':''}" onclick="v45MemoryFilter('mask')">当前面具</button><button class="${memoryFilter==='role'?'on':''}" onclick="v45MemoryFilter('role')">当前角色</button><button class="${memoryFilter==='conversation'?'on':''}" onclick="v45MemoryFilter('conversation')">本会话</button></div></section></div><div class="memory-role-banner">点击右上角 ＋ 压缩当前对话；点击 ◎ 从列表选择其他会话压缩。${legacy?`<br><small>有 ${legacy} 条旧版未归属资料未参与注入，可在“待归类旧资料”中查看。</small>`:''}</div><div class="memory-section-title"><span>压缩后的对话</span><small>${summaries.length} 份</small></div>${summaries.length?summaries.map(([id,v])=>summaryCard(id,v)).join(''):'<div class="empty memory-empty"><div class="big">⌁</div>还没有压缩摘要<br><small>进入聊天后点击记忆页右上角 ＋</small></div>'}${legacy?`<div class="memory-section-title"><span>待归类旧资料</span><small>${legacy} 条 · 不会注入</small></div><div class="memory-legacy-note">这些是旧版本手动记忆。为避免误套到错误角色，它们不会自动进入任何请求；请通过压缩当前会话重新建立准确摘要。</div>`:''}`;
  };
  window.v45MemoryFilter=function(filter){memoryFilter=['all','mask','role','conversation'].includes(filter)?filter:'all';renderMemory()};
  function compress(id=currentChat){
    if(typeof v45CompressConversation==='function')return v45CompressConversation(id);
    if(!id)return toast('请先进入聊天');
    if(!validModel('summary'))return toast('请先绑定记忆摘要模型');
    const c=withTimeout(Number(data.settings.timeout)||60000);toast('正在压缩当前对话…');refreshConversationSummary(id,c.signal,true).then(()=>{renderMemory();toast('对话压缩完成')}).catch(e=>errorDetail(e,'对话压缩失败')).finally(()=>releaseController(c));
  }
  window.v45CompressCurrentConversation=()=>compress(currentChat);
  /* Wallet has a small dedicated form so a user can enter a card-like
     record instead of having to invent a generic note. */
  const baseEdit=editSimPhoneItem;
  editSimPhoneItem=function(owner,index,appKey='notes'){
    if(appKey!=='wallet')return baseEdit(owner,index,appKey);
    const store=phoneOwnerStore(owner),raw=index>=0?store.items[index]:{},item=normalizeSimPhoneItem(raw),meta=raw||{};
    modal(`<h2>${index>=0?'编辑银行卡 / 账单':'添加银行卡 / 账单'}</h2><div class="note">这是当前 USER 面具下的网站虚拟资料，可被角色在“反查手机”时看到；不会读取真实银行卡。</div><div class="field"><label>银行或账户名称</label><input id="v45BankName" value="${attr(meta.bankName||item.title||'')}" placeholder="例如：某银行 / 电子钱包"></div><div class="field"><label>卡片昵称</label><input id="v45BankTitle" value="${attr(meta.cardTitle||'')}" placeholder="例如：日常账户"></div><div class="field"><label>卡号尾号（可选）</label><input id="v45BankLast4" inputmode="numeric" maxlength="4" value="${attr(meta.last4||'')}" placeholder="仅填写后四位"></div><div class="field"><label>余额或账单金额</label><input id="v45BankBalance" value="${attr(meta.balance||'')}" placeholder="例如：¥ 8,240.50"></div><div class="field"><label>备注 / 最近交易</label><textarea id="v45BankNotes" placeholder="填写需要在剧情中出现的虚拟内容">${esc(meta.notes||item.content||'')}</textarea></div><div class="form-actions">${index>=0?`<button class="danger" onclick="deleteSimPhoneItem(${Q(owner)},${index},'wallet')">删除</button>`:''}<button onclick="openSimPhoneApp(${Q(owner)},'wallet')">取消</button><button class="primary" onclick="v45SaveBankCard(${Q(owner)},${index})">保存</button></div>`);
  };
  window.v45SaveBankCard=function(owner,index){
    const bank=document.getElementById('v45BankName')?.value.trim(),title=document.getElementById('v45BankTitle')?.value.trim(),last4=document.getElementById('v45BankLast4')?.value.trim(),balance=document.getElementById('v45BankBalance')?.value.trim(),notes=document.getElementById('v45BankNotes')?.value.trim();if(!bank&&!title&&!notes)return toast('至少填写账户名称、昵称或备注');
    const items=phoneOwnerStore(owner).items,old=index>=0?items[index]:{},item=normalizeSimPhoneItem({id:old?.id,app:'wallet',action:'银行卡',title:title||bank,content:[last4&&`卡号尾号 ${last4}`,balance&&`余额/金额 ${balance}`,notes].filter(Boolean).join('；'),bankName:bank,cardTitle:title,last4,balance,notes});Object.assign(item,{bankName:bank,cardTitle:title,last4,balance,notes});if(index<0)items.unshift(item);else items[index]=item;save();openSimPhoneApp(owner,'wallet');toast('虚拟银行卡内容已保存');
  };
  /* Call modal must not leave its full-screen class on the next ordinary sheet. */
  newMemory=function(){return compress(currentChat)};
  function compactMemoryRender(){
    const root=document.getElementById('memoryList');if(!root)return;
    const summaries=Object.entries(data.chatSummaries||{}).filter(([id,v])=>v?.text&&visibleSummary(id));
    const legacy=data.memories.filter(m=>m.legacyUnassigned).length;
    const tabs=[['all','全部'],['mask','当前面具'],['role','当前角色'],['conversation','本会话']];
    root.innerHTML=`<div class="section"><div class="note">记忆保存 = 压缩对话。原始聊天记录保留不变；摘要按角色、群聊和 USER 面具的会话分别保存。</div><div class="memory-scope-switch">${tabs.map(([k,label])=>`<button class="${memoryFilter===k?'on':''}" onclick="v45MemoryFilter('${k}')">${label}</button>`).join('')}</div></div><div class="group-title" style="margin:4px 16px 10px">压缩后的对话记忆 <small>${summaries.length} 份</small></div>${summaries.length?summaries.map(([id,v])=>summaryCard(id,v)).join(''):'<div class="empty memory-empty"><div class="big">⌁</div>还没有压缩摘要<br><small>进入聊天后点击右上角 ＋ 开始压缩</small></div>'}${legacy?`<div class="group-title" style="margin:18px 16px 10px">旧版待归类资料 <small>${legacy} 条</small></div><div class="memory-legacy-note">旧版未指定角色或面具的资料不会注入请求；请重新压缩对应对话。</div>`:''}`;
  }
  renderMemory=compactMemoryRender;
  renderMemory();
})();