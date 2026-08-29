/* =========================================================
   POKEJI V45.7.11 · incremental fixes and in-place UI additions
   - conversation-owned chat background
   - visual novel rule binding inside the existing 文游 settings sheet
   - line-based entry inside the existing 语伴 dictionary page
   No page is rebuilt; existing routes, classes and visuals are reused.
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45710Loaded)return;
  window.__pokejiV45710Loaded=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const L=value=>Array.isArray(value)?value:[];
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const A=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=text=>{try{toast(text)}catch{}};
  const imageOf=value=>{try{return typeof safeImageSrc==='function'?safeImageSrc(value):S(value)}catch{return''}};

  /* =========================================================
     1 · Chat background belongs to the conversation only
     A private chat is one character under one mask; a group chat is one group
     under one mask. Restoring the default really clears the stored image.
     ========================================================= */
  function conversationSettings(chatId){
    try{return chatId&&typeof getChatSettings==='function'?getChatSettings(chatId):null}catch{return null}
  }
  function paintDefaultBackground(){
    const chat=document.getElementById('chat');if(!chat)return;
    chat.style.removeProperty('background-image');
    chat.style.removeProperty('background-size');
    chat.style.removeProperty('background-position');
    chat.style.removeProperty('background-repeat');
    chat.classList.remove('has-custom-bg');
    if(chat.style.getPropertyValue('--background-overlay-opacity')!=='0')chat.style.setProperty('--background-overlay-opacity','0');
  }
  function paintConversationBackground(){
    const chat=document.getElementById('chat');if(!chat)return;
    const settings=conversationSettings(typeof currentChat!=='undefined'?currentChat:'');
    const src=imageOf(settings?.background);
    if(!src){paintDefaultBackground();return}
    chat.classList.add('has-custom-bg');
    chat.style.backgroundSize='cover';chat.style.backgroundPosition='center';chat.style.backgroundRepeat='no-repeat';
    /* Some installed WebViews reject the layered gradient form; keep a plain fallback. */
    if(!S(chat.style.backgroundImage).trim())try{chat.style.backgroundImage=`url(${src})`}catch{}
  }
  const baseApplyChatBackground=typeof window.applyChatBackground==='function'?window.applyChatBackground:null;
  if(baseApplyChatBackground&&!baseApplyChatBackground.__v45710){
    const wrapped=function(...args){const result=baseApplyChatBackground.apply(this,args);paintConversationBackground();return result};
    wrapped.__v45710=true;window.applyChatBackground=wrapped;try{applyChatBackground=wrapped}catch{}
  }
  const baseClearChatBackground=typeof window.clearChatBackground==='function'?window.clearChatBackground:null;
  if(baseClearChatBackground&&!baseClearChatBackground.__v45710){
    const wrapped=function(...args){const result=baseClearChatBackground.apply(this,args);paintDefaultBackground();return result};
    wrapped.__v45710=true;window.clearChatBackground=wrapped;try{clearChatBackground=wrapped}catch{}
  }

  /* The character editor labelled this "当前面具背景". There is no mask-level
     background: it is this character's private chat under the current mask. */
  const baseBindingPage=typeof window.characterBindingPage==='function'?window.characterBindingPage:null;
  if(baseBindingPage&&!baseBindingPage.__v45710){
    const wrapped=function(draft){
      let html=baseBindingPage.call(this,draft);
      const settings=(()=>{
        try{
          if(draft?.__new)return null;
          const personaId=draft?.boundPersonaId||selectedPersonaIdForEntity(draft.id);
          return getChatSettings(directChatId(draft.id,personaId));
        }catch{return null}
      })();
      const label=`<b>与${E(draft?.name||'此人')}的私信背景</b><small>${draft?.__new?'保存后可设置':(settings?.background?'已设置图片 · 可恢复默认纯色':'当前使用主题默认纯色')}</small>`;
      html=html.replace(/<b>当前面具背景<\/b><small>[^<]*<\/small>/,label);
      if(!draft?.__new)html=html.replace(
        /(<button [^>]*onclick="chooseCharacterChatBackground\(\)">[\s\S]*?<\/button>)/,
        `$1<button onclick="v45710ClearCharacterBackground(${A(draft.id)})"><span>▤</span><b>恢复默认纯色</b><small>${settings?.background?'清除这条私信的背景图片':'已经是默认纯色'}</small></button>`
      );
      return html;
    };
    wrapped.__v45710=true;window.characterBindingPage=wrapped;try{characterBindingPage=wrapped}catch{}
  }
  window.v45710ClearCharacterBackground=function(characterId){
    try{
      const draft=typeof characterEditorDraft!=='undefined'?characterEditorDraft:null;
      const personaId=draft?.boundPersonaId||selectedPersonaIdForEntity(characterId);
      const chatId=directChatId(characterId,personaId),settings=getChatSettings(chatId);
      if(!settings?.background)return say('这条私信已经在使用默认纯色');
      settings.background='';settings.backgroundMode='overlay';persist();
      if(typeof currentChat!=='undefined'&&currentChat===chatId)paintDefaultBackground();
      if(typeof renderCharacterEditor==='function')renderCharacterEditor();
      say('已恢复这条私信的默认纯色背景');
    }catch(error){console.warn('V45.7.11 背景恢复失败',error)}
  };

  /* Group settings sheet: same wording correction, background stays per group per mask. */
  const baseEditGroup=typeof window.editGroup==='function'?window.editGroup:null;
  if(baseEditGroup&&!baseEditGroup.__v45710){
    const wrapped=function(id,...rest){
      const result=baseEditGroup.call(this,id,...rest);
      setTimeout(()=>{
        const title=[...document.querySelectorAll('#modalContent .group-title')].find(node=>S(node.textContent).trim()==='当前面具外观');
        if(title)title.textContent='本群聊背景';
      },0);
      return result;
    };
    wrapped.__v45710=true;window.editGroup=wrapped;try{editGroup=wrapped}catch{}
  }

  /* =========================================================
     2 · Visual novel rule binding, added into the existing settings sheet
     ========================================================= */
  const REGEX_TARGETS=[['ai','文游 AI 输出'],['narration','场景旁白'],['dialogue','角色对白'],['user','USER 输入']];
  function games(){data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games}
  function gameById(id){return games().find(item=>S(item.id)===S(id))||null}
  function availableWorlds(){return L(data.worlds).filter(item=>item&&item.enabled!==false).map(item=>({id:S(item.id),name:S(item.name||'未命名世界书'),note:`${item.scope==='character'?'人物绑定':item.scope==='group'?'群聊绑定':'全局'} · ${item.activation==='trigger'?'命中触发':'常驻'}`,desc:S(item.desc||'')}))}
  function availablePresets(){return L(data.engine?.presetModules).filter(item=>item&&item.enabled!==false).map(item=>({id:S(item.id||item.name),name:S(item.name||'未命名预设'),note:S(item.kind||'自定义'),content:S(item.content||'')}))}
  function availableRules(){return L(data.engine?.worldRules).filter(item=>item&&item.enabled!==false).map(item=>({id:S(item.id||item.name),name:S(item.name||'未命名规则'),note:(item.activation||'persistent')==='trigger'?'命中触发':'常驻',content:S(item.content||'')}))}
  function availableRegex(){return L(data.engine?.regexRules).filter(item=>item&&item.enabled!==false).map(item=>({id:S(item.id||item.pattern),name:S(item.name||'未命名正则'),pattern:S(item.pattern||''),replace:S(item.replace??''),flags:S(item.flags||'g')}))}

  function ensureBinding(game){
    if(!game||typeof game!=='object')return game;
    const first=!game.ruleBindings;
    game.ruleBindings=O(game.ruleBindings);
    for(const key of ['worldIds','presetIds','worldRuleIds','regexIds'])game.ruleBindings[key]=L(game.ruleBindings[key]).map(S);
    game.ruleBindings.regexTargets=O(game.ruleBindings.regexTargets);
    game.ruleSnapshot=O(game.ruleSnapshot);
    for(const key of ['worlds','presets','worldRules','regex'])game.ruleSnapshot[key]=L(game.ruleSnapshot[key]);
    if(first&&!game.ruleSnapshot.createdAt)captureSnapshot(game,{worldIds:availableWorlds().map(r=>r.id),presetIds:availablePresets().map(r=>r.id),worldRuleIds:availableRules().map(r=>r.id),regexIds:[]});
    return game;
  }
  /* A snapshot is an independent copy taken when the binding is saved, so later
     edits to the main world books or presets never silently change this game. */
  function captureSnapshot(game,selection){
    const pickedWorlds=new Set(L(selection.worldIds).map(S));
    const pickedPresets=new Set(L(selection.presetIds).map(S));
    const pickedRules=new Set(L(selection.worldRuleIds).map(S));
    const pickedRegex=new Set(L(selection.regexIds).map(S));
    const targets=O(selection.regexTargets);
    game.ruleBindings={
      worldIds:[...pickedWorlds],presetIds:[...pickedPresets],worldRuleIds:[...pickedRules],regexIds:[...pickedRegex],
      regexTargets:Object.fromEntries([...pickedRegex].map(id=>[id,L(targets[id]).length?L(targets[id]).map(S):['ai']]))
    };
    game.ruleSnapshot={
      worlds:availableWorlds().filter(row=>pickedWorlds.has(row.id)),
      presets:availablePresets().filter(row=>pickedPresets.has(row.id)),
      worldRules:availableRules().filter(row=>pickedRules.has(row.id)),
      regex:availableRegex().filter(row=>pickedRegex.has(row.id)).map(row=>({...row,targets:game.ruleBindings.regexTargets[row.id]||['ai']})),
      createdAt:NOW()
    };
    game.ruleBindingUpdatedAt=NOW();
    return game;
  }
  window.v45710VNSnapshot=id=>ensureBinding(gameById(id))?.ruleSnapshot||null;

  function bindingRows(rows,key,selected,emptyText){
    if(!rows.length)return`<div class="v45710-bind-empty">${E(emptyText)}</div>`;
    return rows.map(row=>`<label class="v45710-bind-row"><input type="checkbox" class="v45710-bind" data-kind="${key}" value="${AT(row.id)}" ${selected.includes(row.id)?'checked':''}><span>${E(row.name)}<em>${E(row.note)}</em></span></label>`).join('');
  }
  function regexRows(rows,binding){
    if(!rows.length)return`<div class="v45710-bind-empty">规则页里还没有启用的正则。</div>`;
    return rows.map(row=>{
      const on=binding.regexIds.includes(row.id),targets=L(binding.regexTargets[row.id]).length?binding.regexTargets[row.id]:['ai'];
      const preview=`${row.pattern||'（未填写表达式）'}${row.replace?` → ${row.replace}`:''}`;
      return`<div class="v45710-regex-item">
        <div class="v45710-regex-head"><b>${E(row.name)}</b><label><input type="checkbox" class="v45710-bind" data-kind="regexIds" value="${AT(row.id)}" ${on?'checked':''} onchange="v45710ToggleRegex(${A(row.id)},this.checked)">启用</label></div>
        <div class="v45710-regex-code">${E(preview)}</div>
        <div class="v45710-regex-targets">${REGEX_TARGETS.map(([id,label])=>`<label class="${on?'':'off'}"><input type="checkbox" class="v45710-target" data-regex="${AT(row.id)}" value="${id}" ${targets.includes(id)?'checked':''} ${on?'':'disabled'} onchange="v45710ToggleTarget(${A(row.id)},'${id}',this.checked)">${E(label)}</label>`).join('')}</div>
      </div>`;
    }).join('');
  }
  window.v45710OpenVNBinding=function(id){
    const game=ensureBinding(gameById(id));if(!game)return;
    const binding=game.ruleBindings,snap=game.ruleSnapshot;
    modal(`<div class="v45710-vn-binding"><h2>${E(game.title||'文游')} · 规则绑定</h2>
      <div class="note">每部文游独立多选绑定。保存时会对所选内容做一次快照；之后主线里的世界书、预设、世界规则或正则怎么改，这部文游都不会被悄悄改变。需要跟进主线时回到这里重新绑定。</div>
      <section class="v45710-bind-group"><header><b>世界书</b><small>已选 ${binding.worldIds.length} / ${availableWorlds().length}</small></header>${bindingRows(availableWorlds(),'worldIds',binding.worldIds,'还没有启用的世界书。')}</section>
      <section class="v45710-bind-group"><header><b>预设</b><small>已选 ${binding.presetIds.length} / ${availablePresets().length}</small></header>${bindingRows(availablePresets(),'presetIds',binding.presetIds,'规则页里还没有启用的预设。')}</section>
      <section class="v45710-bind-group"><header><b>世界规则</b><small>已选 ${binding.worldRuleIds.length} / ${availableRules().length}</small></header>${bindingRows(availableRules(),'worldRuleIds',binding.worldRuleIds,'规则页里还没有启用的世界规则。')}</section>
      <section class="v45710-bind-group"><header><b>正则</b><small>每条单独选作用对象</small></header><div class="v45710-lines-note">可以只处理文游 AI 输出，也可以把场景旁白和角色对白分开控制；每条至少保留一个作用对象。</div>${regexRows(availableRegex(),binding)}</section>
      <div class="v45710-snapshot"><b>当前快照</b><small>${snap.createdAt?`生成于 ${E(new Date(snap.createdAt).toLocaleString('zh-CN'))}`:'尚未生成快照'} · 世界书 ${snap.worlds.length} · 预设 ${snap.presets.length} · 世界规则 ${snap.worldRules.length} · 正则 ${snap.regex.length}</small></div>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button onclick="v45710OpenVNMenuAgain(${A(game.id)})">返回文游设置</button><button class="primary" onclick="v45710SaveVNBinding(${A(game.id)})">保存并重新绑定</button></div></div>`);
  };
  window.v45710ToggleRegex=function(regexId,on){
    for(const input of document.querySelectorAll(`.v45710-target[data-regex="${CSS.escape(S(regexId))}"]`)){
      input.disabled=!on;input.closest('label')?.classList.toggle('off',!on);
      if(on&&![...document.querySelectorAll(`.v45710-target[data-regex="${CSS.escape(S(regexId))}"]`)].some(node=>node.checked)&&input.value==='ai')input.checked=true;
    }
  };
  window.v45710ToggleTarget=function(regexId,target,on){
    const inputs=[...document.querySelectorAll(`.v45710-target[data-regex="${CSS.escape(S(regexId))}"]`)];
    if(!on&&!inputs.some(node=>node.checked)){
      const restore=inputs.find(node=>node.value===target);if(restore)restore.checked=true;
      say('每条正则至少保留一个作用对象');
    }
  };
  window.v45710SaveVNBinding=function(id){
    const game=ensureBinding(gameById(id));if(!game)return;
    const selection={worldIds:[],presetIds:[],worldRuleIds:[],regexIds:[],regexTargets:{}};
    for(const input of document.querySelectorAll('.v45710-bind:checked')){
      const kind=S(input.dataset.kind);if(selection[kind])selection[kind].push(S(input.value));
    }
    for(const regexId of selection.regexIds){
      const targets=[...document.querySelectorAll(`.v45710-target[data-regex="${CSS.escape(regexId)}"]:checked`)].map(node=>S(node.value));
      selection.regexTargets[regexId]=targets.length?targets:['ai'];
    }
    captureSnapshot(game,selection);persist();closeModal();
    say(`已保存绑定并生成新快照：世界书 ${game.ruleSnapshot.worlds.length} · 预设 ${game.ruleSnapshot.presets.length} · 世界规则 ${game.ruleSnapshot.worldRules.length} · 正则 ${game.ruleSnapshot.regex.length}`);
  };
  window.v45710OpenVNMenuAgain=function(id){closeModal();setTimeout(()=>window.v4571VNMenu?.(id),0)};

  /* Add the entry into the existing 文游 settings sheet, without rebuilding it. */
  const baseVNMenu=typeof window.v4571VNMenu==='function'?window.v4571VNMenu:null;
  if(baseVNMenu&&!baseVNMenu.__v45710){
    const wrapped=function(id,...rest){
      const result=baseVNMenu.call(this,id,...rest);
      setTimeout(()=>{
        const game=ensureBinding(gameById(id));if(!game)return;
        const meta=document.querySelector('#modalContent .about-meta'),actions=document.querySelector('#modalContent .form-actions');
        const snap=game.ruleSnapshot,total=snap.worlds.length+snap.presets.length+snap.worldRules.length+snap.regex.length;
        if(meta&&!meta.querySelector('[data-v45710-rules]'))
          meta.insertAdjacentHTML('beforeend',`<div class="meta-row" data-v45710-rules="true"><span>规则绑定</span><span>${total?`${total} 项 · 已快照`:'尚未绑定'}</span></div>`);
        if(actions&&!actions.querySelector('[data-v45710-bind]')){
          const button=document.createElement('button');
          button.dataset.v45710Bind='true';button.textContent='规则绑定';
          button.onclick=()=>{closeModal();window.v45710OpenVNBinding(id)};
          actions.insertBefore(button,actions.firstChild);
        }
      },0);
      return result;
    };
    wrapped.__v45710=true;window.v4571VNMenu=wrapped;try{v4571VNMenu=wrapped}catch{}
  }
  /* New games start bound to whatever is active at creation time. */
  const baseSaveNewVN=typeof window.v4571SaveNewVN==='function'?window.v4571SaveNewVN:null;
  if(baseSaveNewVN&&!baseSaveNewVN.__v45710){
    const wrapped=function(...args){
      const before=new Set(games().map(item=>S(item.id)));
      const result=baseSaveNewVN.apply(this,args);
      const created=games().find(item=>!before.has(S(item.id)));
      if(created){ensureBinding(created);persist()}
      return result;
    };
    wrapped.__v45710=true;window.v4571SaveNewVN=wrapped;try{v4571SaveNewVN=wrapped}catch{}
  }

  /* Bound rules must actually reach the request, and regex must respect its target. */
  function activeGame(){const id=S(data.visualNovelsV4571?.activeId);return id?ensureBinding(gameById(id)):null}
  function snapshotPrompt(game){
    const snap=game?.ruleSnapshot;if(!snap)return'';
    const blocks=[];
    if(snap.worlds.length)blocks.push(`【本文游绑定的世界书】\n${snap.worlds.map(row=>`《${row.name}》\n${row.desc}`).join('\n\n')}`);
    if(snap.worldRules.length)blocks.push(`【本文游绑定的世界规则】\n${snap.worldRules.map(row=>`${row.name}：${row.content}`).join('\n')}`);
    if(snap.presets.length)blocks.push(`【本文游绑定的预设】\n${snap.presets.map(row=>`${row.name}：${row.content}`).join('\n')}`);
    if(!blocks.length)return'';
    return`\n\n${blocks.join('\n\n')}\n这些内容是创建这部文游时的独立快照，只在本文游生效。`;
  }
  function regexFlags(row){const raw=S(row.flags||'g');const cleaned=[...new Set(raw.replace(/[^dgimsuvy]/g,''))].join('');return cleaned||'g'}
  function applyBoundRegex(text,target){
    const game=activeGame();if(!game)return S(text);
    let output=S(text);
    for(const row of L(game.ruleSnapshot?.regex)){
      const targets=L(row.targets).length?row.targets:['ai'];
      if(!targets.includes(target))continue;
      try{output=output.replace(new RegExp(row.pattern,regexFlags(row)),row.replace??'')}catch{}
    }
    return output;
  }
  window.v45710ApplyVNRegex=applyBoundRegex;
  const baseInvoke=typeof window.invokeModel==='function'?window.invokeModel:null;
  if(baseInvoke&&!baseInvoke.__v45710){
    const wrapped=async function(kind,options={}){
      if(options?.activityArea!=='文游')return baseInvoke.call(this,kind,options);
      const game=activeGame(),extra=snapshotPrompt(game);
      const enhanced={...options};
      if(extra)enhanced.system=S(options.system)+extra;
      if(game&&L(game.ruleSnapshot?.regex).length){
        const last=L(enhanced.history).at(-1);
        if(last&&typeof last.content==='string'){
          const cleaned=applyBoundRegex(last.content,'user');
          if(cleaned!==last.content)enhanced.history=[...L(enhanced.history).slice(0,-1),{...last,content:cleaned}];
        }
      }
      const raw=await baseInvoke.call(this,kind,enhanced);
      if(!game||!L(game.ruleSnapshot?.regex).length)return raw;
      /* Whole output first, then narration and dialogue separately inside the JSON. */
      let text=applyBoundRegex(S(raw),'ai');
      try{
        const start=text.indexOf('{'),end=text.lastIndexOf('}');
        if(start>=0&&end>start){
          const row=JSON.parse(text.slice(start,end+1));
          if(typeof row.narration==='string')row.narration=applyBoundRegex(row.narration,'narration');
          if(Array.isArray(row.dialogue))row.dialogue=row.dialogue.map(line=>line&&typeof line==='object'?{...line,text:applyBoundRegex(S(line.text),'dialogue')}:line);
          text=text.slice(0,start)+JSON.stringify(row)+text.slice(end+1);
        }
      }catch{}
      return text;
    };
    wrapped.__v45710=true;window.invokeModel=wrapped;try{invokeModel=wrapped}catch{}
  }

  /* =========================================================
     3 · Line-based entry inside the existing 语伴 dictionary page
     ========================================================= */
  function learningStore(){
    data.learningV452=O(data.learningV452);data.learningV452.personas=O(data.learningV452.personas);
    let personaId='persona_default';
    try{personaId=activePersonaFor(typeof currentChat!=='undefined'?currentChat:'')?.id||data.activePersonaId||'persona_default'}catch{personaId=S(data.activePersonaId||'persona_default')}
    const state=data.learningV452.personas[personaId]=O(data.learningV452.personas[personaId]);
    state.words=L(state.words);state.review=L(state.review);
    state.v45710=O(state.v45710);
    state.v45710.lines=L(state.v45710.lines);
    state.v45710.draft=S(state.v45710.draft);
    state.v45710.drillMode=['dst','src','write'].includes(state.v45710.drillMode)?state.v45710.drillMode:'dst';
    if(!state.v45710.migrated){migrateDictionary(state)}
    return state;
  }
  /* Existing dictionary entries are kept and converted into line records. */
  function migrateDictionary(state){
    const seen=new Set(state.v45710.lines.map(row=>S(row.src)+'\u0000'+S(row.dst)));
    let moved=0;
    for(const word of state.words){
      const src=S(word?.word||word?.term||word?.value||word?.src).trim();
      const dst=S(word?.meaning||word?.definition||word?.translation||word?.dst).trim();
      if(!src&&!dst)continue;
      const key=src+'\u0000'+dst;if(seen.has(key))continue;seen.add(key);
      state.v45710.lines.push({id:ID('line'),src,dst,raw:src||dst,source:'旧词典迁移',createdAt:S(word?.createdAt||NOW()),reviewCount:Math.max(0,Number(word?.reviewCount)||0),legacyId:S(word?.id||'')});
      moved++;
    }
    state.v45710.migrated=true;state.v45710.migratedAt=NOW();state.v45710.migratedCount=moved;
    if(moved)persist();
    return moved;
  }
  function splitLine(line){
    const raw=S(line).trim();if(!raw)return null;
    const parts=raw.split(/\t|｜|\|/).map(part=>part.trim()).filter(Boolean);
    if(parts.length>=2)return{src:parts[0],dst:parts.slice(1).join(' '),raw,missing:''};
    const cjk=/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(parts[0]);
    return cjk?{src:'',dst:parts[0],raw,missing:'src'}:{src:parts[0],dst:'',raw,missing:'dst'};
  }
  function parseDraft(text){return S(text).split(/\r?\n/).map(splitLine).filter(Boolean)}
  window.v45710LineStats=function(){
    const state=learningStore(),area=document.getElementById('v45710LineDraft');
    const rows=parseDraft(area?area.value:state.v45710.draft);
    const total=document.getElementById('v45710LineTotal'),missing=document.getElementById('v45710LineMissing');
    if(total)total.textContent=String(rows.length);
    if(missing)missing.textContent=String(rows.filter(row=>row.missing).length);
    if(area){state.v45710.draft=area.value;persist()}
    return rows;
  };
  function linePanelMarkup(state){
    const rows=parseDraft(state.v45710.draft),lines=state.v45710.lines;
    const missing=rows.filter(row=>row.missing).length;
    return`<section class="v45710-lines">
      <header><b>行式录入</b><small>共 ${lines.length} 条词条</small></header>
      <div class="v45710-lines-note"><b>一行一条。</b>用 TAB 分隔原文与译文，也支持「｜」或竖线；只写一侧时，缺的那侧可以交给 AI 补全。原始行始终保留，补全结果先预览再写入。</div>
      <textarea id="v45710LineDraft" placeholder="I'll take the late bus.\t我坐末班车。&#10;It's pouring outside.&#10;听起来像有人在敲窗。" oninput="v45710LineStats()">${E(state.v45710.draft)}</textarea>
      <div class="v45710-lines-meta">当前 <b id="v45710LineTotal">${rows.length}</b> 行 · 待补全 <b id="v45710LineMissing">${missing}</b> 行${state.v45710.migratedCount?` · 已从旧词典迁移 ${state.v45710.migratedCount} 条`:''}</div>
      <div class="v45710-lines-actions">
        <button onclick="v45710WriteLines(false)">直接写入</button>
        <button class="primary" onclick="v45710CompleteLines()">AI 补全缺失侧</button>
      </div>
      ${lines.length?`<div class="v45710-lines-actions wide" style="margin-top:7px"><button onclick="v45710OpenDrill()">开始复习 · ${lines.filter(row=>row.src&&row.dst).length} 条可用</button></div>`:''}
      ${lines.length?`<div class="v457-learning-section-title" style="margin-top:12px"><div><small>LINE ENTRIES</small><b>已录入的行</b></div><span>${lines.length}</span></div>${lines.slice(-40).reverse().map(row=>`<article class="v45710-line-entry">
          <div class="src">${E(row.src||'（待补原文）')}</div>
          <div class="dst${row.dst?'':' pending'}">${E(row.dst||'待补译文')}</div>
          <div class="tools"><button onclick="v45710CompleteOne(${A(row.id)})">补全这条</button><button onclick="v45710QueueLine(${A(row.id)})">加入复习</button><button onclick="v45710DeleteLine(${A(row.id)})">删除</button></div>
        </article>`).join('')}`:''}
    </section>`;
  }
  /* Append into the existing dictionary panel instead of replacing it. */
  const baseDictionaryPanel=typeof window.dictionaryPanel==='function'?window.dictionaryPanel:(typeof dictionaryPanel==='function'?dictionaryPanel:null);
  if(baseDictionaryPanel&&!baseDictionaryPanel.__v45710){
    const wrapped=function(state,...rest){
      const html=baseDictionaryPanel.call(this,state,...rest);
      let extra='';
      try{extra=linePanelMarkup(learningStore())}catch(error){console.warn('V45.7.11 行式录入渲染失败',error)}
      if(!extra)return html;
      const marker='<div class="v457-learning-section-title"><div><small>PERSONAL DICTIONARY</small>';
      return html.includes(marker)?html.replace(marker,extra+marker):html.replace(/<\/div>\s*$/,extra+'</div>');
    };
    wrapped.__v45710=true;window.dictionaryPanel=wrapped;try{dictionaryPanel=wrapped}catch{}
  }

  function refreshLearning(){try{if(typeof renderLearning==='function')renderLearning()}catch{}}
  window.v45710WriteLines=function(silent){
    const state=learningStore(),rows=parseDraft(state.v45710.draft);
    if(!rows.length)return say('还没有可写入的行');
    const seen=new Set(state.v45710.lines.map(row=>S(row.src)+'\u0000'+S(row.dst)));
    let added=0;
    for(const row of rows){
      const key=S(row.src)+'\u0000'+S(row.dst);if(seen.has(key))continue;seen.add(key);
      state.v45710.lines.push({id:ID('line'),src:row.src,dst:row.dst,raw:row.raw,source:'行式录入',createdAt:NOW(),reviewCount:0});
      added++;
    }
    state.v45710.draft='';persist();refreshLearning();
    if(!silent)say(`已写入 ${added} 条；原始行保持不变`);
    return added;
  };
  window.v45710DeleteLine=function(id){
    const state=learningStore(),index=state.v45710.lines.findIndex(row=>S(row.id)===S(id));
    if(index<0)return;
    if(!confirm('删除这一条行记录？旧词典里的原始条目不会被删除。'))return;
    state.v45710.lines.splice(index,1);persist();refreshLearning();say('已删除这条行记录');
  };
  window.v45710QueueLine=function(id){
    const state=learningStore(),row=state.v45710.lines.find(item=>S(item.id)===S(id));
    if(!row)return;
    state.v45710.queue=L(state.v45710.queue);
    if(!state.v45710.queue.includes(row.id))state.v45710.queue.push(row.id);
    persist();say('已加入复习队列');
  };

  function completionReady(){
    try{if(typeof validModel==='function'&&validModel('translation'))return'translation'}catch{}
    try{if(typeof validModel==='function'&&validModel('chat'))return'chat'}catch{}
    return'';
  }
  async function requestCompletion(rows,languageLabel){
    const kind=completionReady();
    if(!kind)throw Error('请先在课堂设置里绑定翻译线路，或配置主聊天线路');
    const controller=typeof withTimeout==='function'?withTimeout(Number(data.settings?.timeout)||60000):null;
    try{
      const payload=rows.map((row,index)=>`${index+1}. ${row.missing==='dst'?`原文：${row.src}`:`译文：${row.dst}`}`).join('\n');
      const raw=await invokeModel(kind,{
        system:`你是${languageLabel}学习资料整理者。下面每一行只给出了一侧内容，请补出缺失的另一侧：给出原文时补自然译文，给出译文时补地道原文。严格只输出 JSON 数组，每项为 {"index":序号,"filled":"补出的那一侧"}；不要解释，不要改写已给出的一侧。`,
        history:[{role:'user',content:`学习语言：${languageLabel}\n需要补全的行：\n${payload}`}],
        temperature:.2,maxTokens:1200,signal:controller?.signal
      });
      const text=S(raw),start=text.indexOf('['),end=text.lastIndexOf(']');
      if(start<0||end<=start)throw Error('返回内容无法识别，请重试');
      return L(JSON.parse(text.slice(start,end+1)));
    }finally{try{releaseController?.(controller)}catch{}}
  }
  function languageLabel(){
    try{const state=learningStore();return typeof languageName==='function'?languageName(state.language):S(state.language||'英语')}catch{return'英语'}
  }
  let pendingCompletion=[];
  window.v45710CompleteLines=async function(){
    const state=learningStore(),rows=parseDraft(state.v45710.draft).filter(row=>row.missing);
    if(!rows.length)return say('没有待补全的行');
    say('正在补全缺失的一侧…');
    try{
      const filled=await requestCompletion(rows,languageLabel());
      pendingCompletion=rows.map((row,index)=>{
        const hit=filled.find(item=>Number(item?.index)===index+1)||filled[index];
        return{...row,filled:S(hit?.filled).trim()};
      }).filter(row=>row.filled);
      if(!pendingCompletion.length)return say('没有得到可用的补全结果');
      showCompletionPreview();
    }catch(error){try{errorDetail(error,'补全失败')}catch{say('补全失败')}}
  };
  function showCompletionPreview(){
    modal(`<h2>补全结果预览</h2>
      <div class="note">只补缺失的一侧，原始行保持不变。取消勾选的行会按原样写入。</div>
      <div style="padding:0 16px 4px">${pendingCompletion.map((row,index)=>`<div class="v45710-preview-row">
        <label><input type="checkbox" class="v45710-accept" data-index="${index}" checked>写入这一行</label>
        <div class="v45710-preview-line"><small>原始行</small>${E(row.raw)}</div>
        <div class="v45710-preview-line filled"><small>补出${row.missing==='dst'?'译文':'原文'}</small>${E(row.filled)}</div>
      </div>`).join('')}</div>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45710ApplyCompletion()">写入所选</button></div>`);
  }
  window.v45710ApplyCompletion=function(){
    const state=learningStore(),accepted=new Set([...document.querySelectorAll('.v45710-accept:checked')].map(node=>Number(node.dataset.index)));
    const seen=new Set(state.v45710.lines.map(row=>S(row.src)+'\u0000'+S(row.dst)));
    let added=0;
    pendingCompletion.forEach((row,index)=>{
      const src=row.missing==='src'?(accepted.has(index)?row.filled:''):row.src;
      const dst=row.missing==='dst'?(accepted.has(index)?row.filled:''):row.dst;
      const key=S(src)+'\u0000'+S(dst);if(seen.has(key))return;seen.add(key);
      state.v45710.lines.push({id:ID('line'),src,dst,raw:row.raw,source:accepted.has(index)?'AI 补全':'行式录入',aiFilled:accepted.has(index)?row.missing:'',createdAt:NOW(),reviewCount:0});
      added++;
    });
    /* Lines that were already complete in the draft still need writing. */
    for(const row of parseDraft(state.v45710.draft).filter(row=>!row.missing)){
      const key=S(row.src)+'\u0000'+S(row.dst);if(seen.has(key))continue;seen.add(key);
      state.v45710.lines.push({id:ID('line'),src:row.src,dst:row.dst,raw:row.raw,source:'行式录入',createdAt:NOW(),reviewCount:0});
      added++;
    }
    pendingCompletion=[];state.v45710.draft='';persist();closeModal();refreshLearning();
    say(`已写入 ${added} 条；原始行保持不变`);
  };
  window.v45710CompleteOne=async function(id){
    const state=learningStore(),row=state.v45710.lines.find(item=>S(item.id)===S(id));
    if(!row)return;
    if(row.src&&row.dst)return say('这一条已经两侧完整');
    say('正在补全这一条…');
    try{
      const missing=row.src?'dst':'src';
      const filled=await requestCompletion([{src:row.src,dst:row.dst,missing}],languageLabel());
      const value=S(filled[0]?.filled).trim();if(!value)return say('没有得到可用的补全结果');
      if(missing==='dst')row.dst=value;else row.src=value;
      row.aiFilled=missing;row.updatedAt=NOW();persist();refreshLearning();say('已补全并写入');
    }catch(error){try{errorDetail(error,'补全失败')}catch{say('补全失败')}}
  };

  /* Sentence drill: mask one side, or write the whole line from listening. */
  window.v45710OpenDrill=function(){
    const state=learningStore(),pool=state.v45710.lines.filter(row=>row.src&&row.dst);
    if(!pool.length)return say('先录入至少一条两侧完整的句子');
    const queue=L(state.v45710.queue).map(id=>pool.find(row=>S(row.id)===S(id))).filter(Boolean);
    const rows=queue.length?queue:pool.slice(-20);
    state.v45710.drillIndex=Math.min(Number(state.v45710.drillIndex)||0,rows.length-1);
    renderDrill(rows);
  };
  function renderDrill(rows){
    const state=learningStore(),mode=state.v45710.drillMode,index=Math.max(0,Math.min(Number(state.v45710.drillIndex)||0,rows.length-1)),row=rows[index];
    if(!row)return say('没有可复习的句子');
    const masked=(text,on)=>on?`<span class="v45710-mask" onclick="this.classList.toggle('show')">${E(text)}</span>`:E(text);
    modal(`<h2>句子复习</h2>
      <div class="v45710-drill-modes">
        <button class="${mode==='dst'?'on':''}" onclick="v45710SetDrill('dst')">遮译文</button>
        <button class="${mode==='src'?'on':''}" onclick="v45710SetDrill('src')">遮原文</button>
        <button class="${mode==='write'?'on':''}" onclick="v45710SetDrill('write')">听写</button>
      </div>
      <div style="padding:0 16px">
        <article class="v45710-line-entry">
          <div class="src">${masked(row.src,mode==='src')}</div>
          <div class="dst">${masked(row.dst,mode==='dst'||mode==='write')}</div>
          <div class="v45710-lines-meta" style="margin-top:7px">${E(row.source||'行式录入')} · 已复习 ${Math.max(0,Number(row.reviewCount)||0)} 次 · 第 ${index+1} / ${rows.length} 条</div>
        </article>
        ${mode==='write'?`<div class="field" style="margin-top:9px"><label>写下你听到的句子</label><input id="v45710Dictation" placeholder="按听到的内容拼写…"></div><div class="v45710-lines-actions wide"><button onclick="v45710CheckDictation(${A(row.id)})">对照原句</button></div>`:''}
      </div>
      <div class="form-actions"><button onclick="v45710GradeDrill(${A(row.id)},'again')">再练一次</button><button onclick="v45710GradeDrill(${A(row.id)},'ok')">想起来了</button><button class="primary" onclick="v45710GradeDrill(${A(row.id)},'known')">熟练</button></div>`);
    window.__v45710DrillRows=rows;
  }
  window.v45710SetDrill=function(mode){
    const state=learningStore();
    state.v45710.drillMode=['dst','src','write'].includes(mode)?mode:'dst';persist();
    renderDrill(L(window.__v45710DrillRows));
  };
  window.v45710CheckDictation=function(id){
    const state=learningStore(),row=state.v45710.lines.find(item=>S(item.id)===S(id)),typed=S(document.getElementById('v45710Dictation')?.value).trim();
    if(!row)return;
    if(!typed)return say('先写下你听到的内容');
    const normalise=text=>S(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    say(normalise(typed)===normalise(row.src)?'完全一致':`原句：${row.src}`);
  };
  window.v45710GradeDrill=function(id,grade){
    const state=learningStore(),row=state.v45710.lines.find(item=>S(item.id)===S(id));
    if(row){
      row.reviewCount=Math.max(0,Number(row.reviewCount)||0)+1;
      row.lastGrade=grade;row.lastReviewedAt=NOW();
      if(grade==='known')state.v45710.queue=L(state.v45710.queue).filter(queued=>S(queued)!==S(id));
    }
    const rows=L(window.__v45710DrillRows);
    state.v45710.drillIndex=((Number(state.v45710.drillIndex)||0)+1)%Math.max(1,rows.length);
    persist();
    if(rows.length)renderDrill(rows);else closeModal();
  };

  /* Character practice reuses the existing classroom; bound lines feed the prompt. */
  const basePracticeLines=typeof window.v457StartLesson==='function'?window.v457StartLesson:null;
  if(basePracticeLines&&!basePracticeLines.__v45710){
    const wrapped=function(...args){
      try{
        const state=learningStore(),rows=state.v45710.lines.filter(row=>row.src&&row.dst).slice(-6);
        state.v45710.practiceHint=rows.map(row=>`${row.src} / ${row.dst}`).join('\n');
        persist();
      }catch{}
      return basePracticeLines.apply(this,args);
    };
    wrapped.__v45710=true;window.v457StartLesson=wrapped;try{v457StartLesson=wrapped}catch{}
  }

  setTimeout(()=>{try{learningStore();paintConversationBackground()}catch{}},0);
})();
