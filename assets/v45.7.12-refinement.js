/* V45.7.12: shared selector escaper. Some installed WebViews lack CSS.escape,
   and a missing one used to throw inside the regex binding sheets. */
window.__pokejiCssEscape=window.__pokejiCssEscape||function(value){
  const text=String(value??'');
  try{if(window.CSS&&typeof window.CSS.escape==='function')return window.CSS.escape(text)}catch{}
  return text.replace(/[^a-zA-Z0-9_-]/g,ch=>'\\'+ch);
};
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
    /* V45.7.17 keeps the saved setting but intentionally paints no wallpaper. */
    paintDefaultBackground();
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
    for(const input of document.querySelectorAll(`.v45710-target[data-regex="${window.__pokejiCssEscape(regexId)}"]`)){
      input.disabled=!on;input.closest('label')?.classList.toggle('off',!on);
      if(on&&![...document.querySelectorAll(`.v45710-target[data-regex="${window.__pokejiCssEscape(regexId)}"]`)].some(node=>node.checked)&&input.value==='ai')input.checked=true;
    }
  };
  window.v45710ToggleTarget=function(regexId,target,on){
    const inputs=[...document.querySelectorAll(`.v45710-target[data-regex="${window.__pokejiCssEscape(regexId)}"]`)];
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
      const targets=[...document.querySelectorAll(`.v45710-target[data-regex="${window.__pokejiCssEscape(regexId)}"]:checked`)].map(node=>S(node.value));
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
      ${lines.length?`<div class="v457-learning-section-title" style="margin-top:12px"><div><small>行式录入</small><b>已录入的行</b></div><span>${lines.length}</span></div>${lines.slice(-40).reverse().map(row=>`<article class="v45710-line-entry">
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
      const marker='<div class="v457-learning-section-title"><div><small>个人词典</small>';
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

/* =========================================================
   V45.7.12 · 文游规则绑定改成四个独立平铺入口
   世界书 / 预设 / 世界规则 / 正则，各自一行，直接显示已绑定内容。
   替换 V45.7.10 那个靠注入按钮的做法。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiBindRows)return;
  window.__pokejiBindRows=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};

  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;

  const TARGETS=[['ai','文游 AI 输出'],['narration','场景旁白'],['dialogue','角色对白'],['user','USER 输入']];
  /* 老 WebView 可能没有 CSS.escape，这里自带一个够用的转义 */
  const cssEsc=v=>{
    const text=S(v);
    return window.__pokejiCssEscape(text);
  };

  const SHORT={ai:'AI 输出',narration:'旁白',dialogue:'对白',user:'我的输入'};

  const sourceWorlds=()=>L(data.worlds).filter(w=>w&&w.enabled!==false).map(w=>({id:S(w.id),name:S(w.name||'未命名世界书'),note:`${w.scope==='character'?'人物绑定':w.scope==='group'?'群聊绑定':'全局'} · ${w.activation==='trigger'?'命中触发':'常驻'}`,desc:S(w.desc||'')}));
  const sourcePresets=()=>L(data.engine?.presetModules).filter(p=>p&&p.enabled!==false).map(p=>({id:S(p.id||p.name),name:S(p.name||'未命名预设'),note:S(p.kind||'自定义'),desc:S(p.content||'').slice(0,80)}));
  const sourceRules=()=>L(data.engine?.worldRules).filter(r=>r&&r.enabled!==false).map(r=>({id:S(r.id||r.name),name:S(r.name||'未命名规则'),note:(r.activation||'persistent')==='trigger'?'命中触发':'常驻',desc:S(r.content||'').slice(0,80)}));
  const sourceRegex=()=>L(data.engine?.regexRules).filter(r=>r&&r.enabled!==false).map(r=>({id:S(r.id||r.pattern),name:S(r.name||'未命名正则'),pattern:S(r.pattern||''),replace:S(r.replace??''),flags:S(r.flags||'g')}));
  const SOURCE={world:sourceWorlds,preset:sourcePresets,rule:sourceRules};
  const FIELD={world:'worldIds',preset:'presetIds',rule:'worldRuleIds'};
  const META={
    world:['书','世界书','选中的世界书会成为这部文游的独立设定来源。'],
    preset:['预','预设','预设影响这部文游的叙述风格和结构，不影响主聊天。'],
    rule:['则','世界规则','规则是硬约束，生成每一幕都会遵守。']
  };

  function binding(game){
    if(!game)return null;
    game.ruleBindings=O(game.ruleBindings);
    for(const key of ['worldIds','presetIds','worldRuleIds','regexIds'])game.ruleBindings[key]=L(game.ruleBindings[key]).map(S);
    game.ruleBindings.regexTargets=O(game.ruleBindings.regexTargets);
    game.ruleSnapshot=O(game.ruleSnapshot);
    for(const key of ['worlds','presets','worldRules','regex'])game.ruleSnapshot[key]=L(game.ruleSnapshot[key]);
    return game.ruleBindings;
  }
  function snapshot(game){
    const bind=binding(game);
    const pick=(rows,ids)=>rows.filter(r=>ids.includes(r.id));
    game.ruleSnapshot={
      worlds:pick(sourceWorlds(),bind.worldIds),
      presets:pick(sourcePresets(),bind.presetIds),
      worldRules:pick(sourceRules(),bind.worldRuleIds),
      regex:pick(sourceRegex(),bind.regexIds).map(r=>({...r,targets:L(bind.regexTargets[r.id]).length?bind.regexTargets[r.id]:['ai']})),
      createdAt:NOW()
    };
    game.ruleBindingUpdatedAt=NOW();
    persist();
  }

  /* ---------- 四行入口 ---------- */
  function nameOf(kind,id){return SOURCE[kind]().find(r=>r.id===id)?.name||id}
  function rowsMarkup(game){
    const bind=binding(game),snap=game.ruleSnapshot;
    const line=(kind,glyph,label,ids)=>{
      const names=ids.map(id=>nameOf(kind,id));
      return `<button class="v45712-bind-row ${ids.length?'is-bound':''}" onclick="v45712BindPick(${A(game.id)},'${kind}')">
        <i>${glyph}</i><span><b>${label}</b><small>${ids.length?E(names.join(' · ')):'未绑定'}</small></span>
        <em>${ids.length}</em><u>›</u></button>`;
    };
    const regexSummary=bind.regexIds.length
      ?bind.regexIds.map(id=>{
          const row=sourceRegex().find(r=>r.id===id);
          const targets=L(bind.regexTargets[id]).length?bind.regexTargets[id]:['ai'];
          return `${row?.name||id}（${targets.map(t=>SHORT[t]||t).join('、')}）`;
        }).join(' · ')
      :'未绑定 · 每条可单独选作用对象';
    const total=bind.worldIds.length+bind.presetIds.length+bind.worldRuleIds.length+bind.regexIds.length;
    return `<section class="v45712-bind">
      <header><b>规则绑定</b><small>${total?`已绑定 ${total} 项`:'尚未绑定'}</small></header>
      ${line('world','书','世界书',bind.worldIds)}
      ${line('preset','预','预设',bind.presetIds)}
      ${line('rule','则','世界规则',bind.worldRuleIds)}
      <button class="v45712-bind-row ${bind.regexIds.length?'is-bound':''}" onclick="v45712BindRegex(${A(game.id)})">
        <i>正</i><span><b>正则</b><small>${E(regexSummary)}</small></span>
        <em>${bind.regexIds.length}</em><u>›</u></button>
    </section>
    <section class="v45712-bind">
      <header><b>本部文游的快照</b><small>${snap.createdAt?`生成于 ${E(new Date(snap.createdAt).toLocaleString('zh-CN'))}`:'尚未生成'}</small></header>
      <div class="v45712-bind-note">快照是绑定那一刻的独立副本。主线世界书改了、正则删了，这部文游照旧运行，不会中途变样。</div>
      <div class="v45712-bind-two">
        <button onclick="v45712BindResync(${A(game.id)})">跟进主线</button>
        <button onclick="v45712BindSnapshot(${A(game.id)})">查看快照内容</button>
      </div>
    </section>`;
  }
  window.v45712BindRows=rowsMarkup;

  window.v45712BindPick=function(gameId,kind){
    const game=gameById(gameId);if(!game)return;
    const bind=binding(game),rows=SOURCE[kind](),ids=bind[FIELD[kind]];
    const [,label,note]=META[kind];
    modal(`<div class="v45712-bind-sheet"><h2>绑定${label}</h2>
      <div class="note">${note}绑定后会做一次快照；之后主线怎么改，这部文游都不会被悄悄改变。</div>
      ${rows.length?`<div class="v45712-bind-list">${rows.map(r=>`<label class="v45712-bind-pick">
        <input type="checkbox" class="v45712-bind-box" value="${AT(r.id)}" ${ids.includes(r.id)?'checked':''}>
        <span>${E(r.name)}<em>${E(r.note)}${r.desc?` · ${E(r.desc)}`:''}</em></span></label>`).join('')}</div>`
        :`<div class="v45712-bind-empty">规则页里还没有启用的${label}。</div>`}
      <div class="form-actions"><button onclick="v45712BindBack(${A(gameId)})">返回</button><button class="primary" onclick="v45712BindSave(${A(gameId)},'${kind}')">保存并快照</button></div></div>`);
  };
  window.v45712BindSave=function(gameId,kind){
    const game=gameById(gameId);if(!game)return;
    const bind=binding(game);
    bind[FIELD[kind]]=[...document.querySelectorAll('.v45712-bind-box:checked')].map(n=>S(n.value));
    snapshot(game);
    window.v45712BindBack(gameId);
    say(`已保存并生成新快照：${META[kind][1]} ${bind[FIELD[kind]].length} 项`);
  };

  window.v45712BindRegex=function(gameId){
    const game=gameById(gameId);if(!game)return;
    const bind=binding(game),rows=sourceRegex();
    modal(`<div class="v45712-bind-sheet"><h2>绑定正则</h2>
      <div class="note">每条单独选作用对象：可以只处理文游 AI 的输出，也可以把场景旁白和角色对白分开控制，还能只清理你自己的输入。每条至少保留一个作用对象。</div>
      ${rows.length?rows.map(r=>{
        const on=bind.regexIds.includes(r.id);
        const targets=L(bind.regexTargets[r.id]).length?bind.regexTargets[r.id]:['ai'];
        return `<div class="v45712-bind-rx">
          <div class="head"><b>${E(r.name)}</b><label><input type="checkbox" class="v45712-rx-box" value="${AT(r.id)}" ${on?'checked':''} onchange="v45712RxToggle(${A(r.id)},this.checked)">启用</label></div>
          <div class="code">${E(r.pattern||'（未填写表达式）')}${r.replace?` → ${E(r.replace)}`:' → （删除）'}</div>
          <div class="targets">${TARGETS.map(([t,text])=>`<label class="${on?'':'is-off'}"><input type="checkbox" class="v45712-rx-target" data-rx="${AT(r.id)}" value="${t}" ${targets.includes(t)?'checked':''} ${on?'':'disabled'} onchange="v45712RxGuard(${A(r.id)},'${t}',this)">${text}</label>`).join('')}</div>
        </div>`;
      }).join(''):'<div class="v45712-bind-empty">规则页里还没有启用的正则。</div>'}
      <div class="form-actions"><button onclick="v45712BindBack(${A(gameId)})">返回</button><button class="primary" onclick="v45712RxSave(${A(gameId)})">保存并快照</button></div></div>`);
  };
  window.v45712RxToggle=function(rxId,on){
    const boxes=[...document.querySelectorAll(`.v45712-rx-target[data-rx="${cssEsc(rxId)}"]`)];
    for(const box of boxes){box.disabled=!on;box.closest('label')?.classList.toggle('is-off',!on)}
    if(on&&!boxes.some(b=>b.checked)){const ai=boxes.find(b=>b.value==='ai');if(ai)ai.checked=true}
  };
  window.v45712RxGuard=function(rxId,target,node){
    const boxes=[...document.querySelectorAll(`.v45712-rx-target[data-rx="${cssEsc(rxId)}"]`)];
    if(!node.checked&&!boxes.some(b=>b.checked)){node.checked=true;say('每条正则至少保留一个作用对象')}
  };
  window.v45712RxSave=function(gameId){
    const game=gameById(gameId);if(!game)return;
    const bind=binding(game);
    bind.regexIds=[...document.querySelectorAll('.v45712-rx-box:checked')].map(n=>S(n.value));
    bind.regexTargets={};
    for(const id of bind.regexIds){
      const picked=[...document.querySelectorAll(`.v45712-rx-target[data-rx="${cssEsc(id)}"]:checked`)].map(n=>S(n.value));
      bind.regexTargets[id]=picked.length?picked:['ai'];
    }
    snapshot(game);window.v45712BindBack(gameId);
    say(`已保存并生成新快照：正则 ${bind.regexIds.length} 条`);
  };
  window.v45712BindResync=function(gameId){
    const game=gameById(gameId);if(!game)return;
    snapshot(game);window.v45712BindBack(gameId);
    say('已按主线当前内容重新生成快照');
  };
  window.v45712BindSnapshot=function(gameId){
    const game=gameById(gameId);if(!game)return;
    const snap=O(game.ruleSnapshot);
    const block=(label,rows)=>`<section class="v45712-bind"><header><b>${label}</b><small>${rows.length} 项</small></header>${rows.length?rows.map(t=>`<div class="v45712-bind-note">${E(t)}</div>`).join(''):'<div class="v45712-bind-empty">未绑定</div>'}</section>`;
    modal(`<div class="v45712-bind-sheet"><h2>快照内容</h2>
      <div class="note">${snap.createdAt?`生成于 ${E(new Date(snap.createdAt).toLocaleString('zh-CN'))}。`:''}这是绑定那一刻的独立副本，与主线当前内容无关。</div>
      ${block('世界书',L(snap.worlds).map(r=>r.name))}
      ${block('预设',L(snap.presets).map(r=>r.name))}
      ${block('世界规则',L(snap.worldRules).map(r=>r.name))}
      ${block('正则',L(snap.regex).map(r=>`${r.name} → 作用于 ${L(r.targets).map(t=>SHORT[t]||t).join('、')}`))}
      <div class="form-actions"><button class="primary" onclick="v45712BindBack(${A(gameId)})">返回</button></div></div>`);
  };
  window.v45712BindBack=function(gameId){closeModal();setTimeout(()=>{try{v4571VNMenu(gameId)}catch{}},0)};
})();

/* =========================================================
   V45.7.12 · 文游设置面板重排，容纳四个绑定入口
   接管 v4571VNMenu 的呈现，保留它原有的三个动作。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiVNMenuRows)return;
  window.__pokejiVNMenuRows=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;

  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;
  const person=id=>L(data.characters).find(c=>S(c.id)===S(id))||L(data.mpcs).find(c=>S(c.id)===S(id))||null;

  const base=typeof window.v4571VNMenu==='function'?window.v4571VNMenu:null;
  const wrapped=function(id){
    const game=gameById(id);
    if(!game)return base?base.call(this,id):undefined;
    const stats=L(game.stage?.stats);
    const items=L(game.stage?.items);
    const saves=L(game.stage?.saves);
    modal(`<div class="v45712-bind-sheet">
      <h2>${E(game.title||'文游')}</h2>
      <div class="note">这里的四个入口各自独立多选。绑定时会对所选内容做一次快照，之后主线怎么改都不影响这部文游。</div>
      ${typeof window.v45712BindRows==='function'?window.v45712BindRows(game):''}
      <section class="v45712-bind">
        <header><b>这部文游</b><small>${L(game.scenes).length} 幕</small></header>
        <div class="v45712-bind-plain"><span>游玩形式</span><b>${game.playMode==='companion'?`共同游玩 · ${E(person(game.companionId)?.name||'同伴')}`:'人物入戏'}</b></div>
        <div class="v45712-bind-plain"><span>相处记忆</span><b>${game.contextMode==='linked'?'读取并带来源写回':'完全独立'}</b></div>
        <div class="v45712-bind-plain"><span>画面</span><b>${game.imageEnabled?'开启':'关闭'}</b></div>
        <div class="v45712-bind-plain"><span>数值条</span><b>${stats.length?E(stats.map(s=>s.name).join(' · ')):'纯剧情向 · 不使用'}</b></div>
        <div class="v45712-bind-plain"><span>道具</span><b>${items.length?`${items.length} 件`:'暂无'}</b></div>
        <div class="v45712-bind-plain"><span>存档</span><b>${saves.length?`${saves.length} / 4 槽位`:'尚未存档'}</b></div>
      </section>
      <div class="v45712-bind-two">
        <button onclick="v45712VNStatSheet(${A(id)})">数值条设置</button>
        <button onclick="v45712VNItems(${A(id)})">道具栏</button>
      </div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
        <button onclick="v4571RegenerateVNScene(${A(id)})">重做当前幕</button>
        <button class="danger" onclick="v4571DeleteVN(${A(id)})">删除存档</button>
      </div>
    </div>`);
  };
  window.v4571VNMenu=wrapped;try{v4571VNMenu=wrapped}catch{}
})();

/* =========================================================
   V45.7.12 · 文游改成视觉小说呈现
   立绘＋背景＋底部对话框＋顶部数值条＋右上四按钮。
   只替换呈现层与存档/道具/数值，生成逻辑仍用原 generateScene。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiVNStage)return;
  window.__pokejiVNStage=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const img=v=>{try{return typeof safeImageSrc==='function'?safeImageSrc(v):S(v)}catch{return''}};

  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;
  const activeGame=()=>gameById(S(data.visualNovelsV4571?.activeId));
  const person=id=>L(data.characters).find(c=>S(c.id)===S(id))||L(data.mpcs).find(c=>S(c.id)===S(id))||null;

  const PRESETS={
    classic:[{name:'生命值',cur:100,max:100,color:'#c96a5e'},{name:'精神值',cur:70,max:100,color:'#7d94c0'}],
    emotion:[{name:'好感度',cur:20,max:100,color:'#c98ba0'},{name:'信任',cur:35,max:100,color:'#8fae95'},{name:'理智',cur:80,max:100,color:'#8b93b8'}],
    survive:[{name:'体力',cur:80,max:100,color:'#c9a05e'},{name:'饱食',cur:60,max:100,color:'#a9b072'},{name:'警觉',cur:50,max:100,color:'#9d7fb0'}],
    none:[]
  };
  const SWATCH=['#c96a5e','#7d94c0','#8fae95','#c9a05e','#9d7fb0','#c98ba0'];
  const PRESET_LABEL={classic:'经典两条',emotion:'情感向',survive:'生存向',none:'不用数值'};

  /* ---------- data shape ---------- */
  function ensureStage(game){
    if(!game||typeof game!=='object')return game;
    const fresh=!game.stage;
    game.stage=O(game.stage);
    if(fresh&&!Array.isArray(game.stage.stats))game.stage.stats=PRESETS.classic.map(s=>({...s,id:ID('stat')}));
    game.stage.stats=L(game.stage.stats).map(s=>({
      id:S(s?.id)||ID('stat'),name:S(s?.name||'数值'),
      max:Math.max(1,Number(s?.max)||100),
      cur:Math.max(0,Math.min(Math.max(1,Number(s?.max)||100),Number(s?.cur)||0)),
      color:S(s?.color)||SWATCH[0]
    })).slice(0,4);
    game.stage.items=L(game.stage.items);
    game.stage.saves=L(game.stage.saves);
    game.stage.statPreset=S(game.stage.statPreset||(game.stage.stats.length?'custom':'none'));
    return game;
  }
  window.v45712VNStats=id=>ensureStage(gameById(id))?.stage?.stats||[];

  /* ---------- stage ---------- */
  function statsBar(game){
    const stats=L(game.stage.stats);
    if(!stats.length)return '';
    return `<div class="v45712-vn-stats">${stats.map(s=>{
      const pct=Math.max(0,Math.min(100,s.cur/Math.max(1,s.max)*100));
      return `<div class="v45712-vn-stat"><div class="top"><b>${E(s.name)}</b><span>${s.cur}/${s.max}</span></div><div class="bar"><i style="width:${pct}%;background:#697077"></i></div></div>`;
    }).join('')}</div>`;
  }
  function stageMarkup(game,scene){
    const cast=L(game.participantIds).map(person).filter(Boolean);
    const lead=cast[0];
    const face=img(scene?.image)||img(game.cover);
    const portrait=img(lead?.image);
    return `<div class="v45712-vn-stage">
      ${face?`<div class="v45712-vn-bg" style="background-image:url(${AT(face)})"></div>`:'<div class="v45712-vn-bg is-blank"></div>'}
      <div class="v45712-vn-air"></div>
      <div class="v45712-vn-figure">
        ${portrait?`<img src="${AT(portrait)}" alt="">`:'<div class="v45712-vn-figure-body"></div>'}
        <span class="v45712-vn-figure-tag">${E(lead?.name||'人物')}</span>
      </div>
      ${scene?.title?`<div class="v45712-vn-place">${E(scene.title)}</div>`:''}
    </div>`;
  }
  function dialogueMarkup(scene){
    const lines=L(scene?.dialogue).filter(x=>S(x?.text).trim());
    if(!lines.length)return '';
    const first=lines[0];
    return `<div class="v45712-vn-speaker">${E(first.speaker||'')}</div>
      <div class="v45712-vn-lines">${lines.map((line,i)=>`<p class="${i?'more':''}">${i?`<em>${E(line.speaker||'')}</em>`:''}${E(line.text)}</p>`).join('')}</div>`;
  }
  /* V45.7.30：文游主流程改为 USER 自己输入，不再输出选项按钮。
     三种输入类型：对白进对话框、动作进正文叙述、剧情方向只做隐藏提示。 */
  const V45730_TYPES={dialogue:['对白','说出口的话，进入底部对话框'],action:['动作','角色行动与正文叙述段'],direction:['剧情方向','只控制后续，不显示为正文']};
  function v45730Type(game){const key=S(game?.stage?.inputType);return Object.hasOwn(V45730_TYPES,key)?key:'dialogue'}
  function v45730InputBar(game){
    const active=v45730Type(game);
    return `<div class="v45730-vn-input">
      <div class="v45730-vn-types">${Object.entries(V45730_TYPES).map(([key,[label,hint]])=>`<button class="${key===active?'on':''}" onclick="v45730VNInputType(${A(game.id)},'${key}')" title="${E(hint)}">${E(label)}</button>`).join('')}</div>
      <div class="v45730-vn-line"><textarea id="v45730VNInput" rows="2" placeholder="${E(V45730_TYPES[active][1])}"></textarea><button onclick="v45730VNSend(${A(game.id)})" aria-label="继续">↑</button></div>
      <small class="v45730-vn-hint">AI 写到需要你回应的位置就会停下，不会替你决定动作、心理或感受。</small>
    </div>`;
  }
  function v45730UserEcho(game){
    const row=O(game?.stage?.lastUserInput);const text=S(row.text).trim();
    if(!text||row.type==='direction')return'';
    const mine=S(L(data.personas).find(p=>p.id===data.activePersonaId)?.name||L(data.personas)[0]?.name||'我');
    return row.type==='action'
      ?`<p class="v45730-vn-echo-action">${E(text)}</p>`
      :`<div class="v45730-vn-echo-say"><small>${E(mine)}</small><span>${E(text)}</span></div>`;
  }
  window.v45730VNInputType=function(id,type){const game=games().find(x=>x.id===id);if(!game)return;ensureStage(game);game.stage.inputType=Object.hasOwn(V45730_TYPES,type)?type:'dialogue';try{save()}catch{}try{v45712VNRepaint()}catch{}};
  window.v45730VNSend=function(id){
    const game=games().find(x=>x.id===id);if(!game)return;
    const text=S(document.getElementById('v45730VNInput')?.value).trim();
    if(!text)return toast('先写下这一回合你要做的事');
    ensureStage(game);const type=v45730Type(game);
    game.stage.lastUserInput={type,text,at:new Date().toISOString()};
    try{save()}catch{}
    const tagged=type==='dialogue'?`【我的对白】${text}`:type==='action'?`【我的动作】${text}`:`【剧情方向｜隐藏提示，不得写成正文，也不得复述这条指令】${text}`;
    if(typeof v4571ChooseVN==='function')v4571ChooseVN(tagged);
  };

  function stageRender(game,scene,busyNow){
    ensureStage(game);
    const step=`第 ${L(game.scenes).length} 幕`;
    return `<section class="v45712-vn-shell">
      ${statsBar(game)}
      <div class="v45712-vn-menu">
        <button onclick="v45712VNSaves(${A(game.id)})" aria-label="存档">▤</button>
        <button onclick="v45712VNLoads(${A(game.id)})" aria-label="读档">▥</button>
        <button onclick="v45712VNItems(${A(game.id)})" aria-label="道具">◈</button>
        <button onclick="v45712VNStatSheet(${A(game.id)})" aria-label="数值设置">⚙</button>
        <button onclick="v4571VNMenu(${A(game.id)})" aria-label="更多">⋯</button>
      </div>
      <button class="v45712-vn-back" onclick="v4571VNBack()" aria-label="返回">‹</button>
      ${stageMarkup(game,scene)}
      <div class="v45712-vn-box">
        ${scene?.narration?`<p class="v45712-vn-narr">${E(scene.narration)}</p>`:''}
        ${dialogueMarkup(scene)}
        ${v45730UserEcho(game)}
        ${scene?.companionComment?`<div class="v45712-vn-aside"><small>${E(person(game.companionId)?.name||'同伴')}</small>${E(scene.companionComment)}</div>`:''}
        <div class="v45712-vn-next"><span>${E(step)}</span><i>▾</i></div>
        ${busyNow?'<div class="v45712-vn-wait"><i></i><span>正在生成下一幕…</span></div>':`
          ${v45730InputBar(game)}`}
      </div>
    </section>`;
  }
  /* 替换原 renderPlayer 的输出，但仍复用它的时机与状态 */
  window.v45712VNStageMarkup=stageRender;

  /* ---------- saves ---------- */
  const SLOTS=4;
  function slotRows(game,mode){
    ensureStage(game);
    const saves=L(game.stage.saves);
    const rows=[];
    for(let i=1;i<=SLOTS;i++){
      const row=saves.find(s=>Number(s.slot)===i);
      if(!row){
        rows.push(`<button class="v45712-vn-slot is-empty" onclick="${mode==='save'?`v45712VNDoSave(${A(game.id)},${i})`:`v45712VNEmptySlot()`}">
          <div class="thumb">空</div><div class="main"><b>槽位 ${i} · 空</b><p>${mode==='save'?'点这里存入当前进度':'没有可读取的存档'}</p></div></button>`);
        continue;
      }
      rows.push(`<button class="v45712-vn-slot" onclick="${mode==='save'?`v45712VNDoSave(${A(game.id)},${i})`:`v45712VNDoLoad(${A(game.id)},${i})`}">
        <div class="thumb">${row.image?`<img src="${AT(row.image)}" alt="">`:E(S(row.title||'幕').slice(0,3))}</div>
        <div class="main">
          <b>槽位 ${i} · ${E(row.title||`第 ${row.sceneCount} 幕`)}</b>
          <p>${E(S(row.note).slice(0,72)||'没有摘要')}</p>
          <small>${E(row.atText||'')} · ${E(row.statText||'未使用数值')}</small>
        </div></button>`);
    }
    return rows.join('');
  }
  window.v45712VNSaves=function(id){
    const game=ensureStage(gameById(id));if(!game)return;
    modal(`<div class="v45712-vn-sheet"><h2>存档</h2>
      <div class="note">每个槽位记住那一幕的完整状态：数值、道具和已经做过的选择。覆盖前会问一次。</div>
      <div class="v45712-vn-slots">${slotRows(game,'save')}</div>
      <div class="form-actions"><button onclick="closeModal()">关闭</button></div></div>`);
  };
  window.v45712VNLoads=function(id){
    const game=ensureStage(gameById(id));if(!game)return;
    modal(`<div class="v45712-vn-sheet"><h2>读档</h2>
      <div class="note">读档会回到那一幕的开头。之后的进展仍然留在原来的槽位里，不会被清掉。</div>
      <div class="v45712-vn-slots">${slotRows(game,'load')}</div>
      <div class="form-actions"><button onclick="closeModal()">关闭</button></div></div>`);
  };
  window.v45712VNEmptySlot=function(){say('这个槽位还是空的')};
  window.v45712VNDoSave=function(id,slot){
    const game=ensureStage(gameById(id));if(!game)return;
    const saves=L(game.stage.saves);
    const exist=saves.find(s=>Number(s.slot)===Number(slot));
    if(exist&&!confirm(`覆盖槽位 ${slot} 的存档？`))return;
    const scene=L(game.scenes).at(-1);
    const row={
      slot:Number(slot),
      sceneCount:L(game.scenes).length,
      title:S(scene?.title||`第 ${L(game.scenes).length} 幕`),
      note:S(scene?.narration||'').slice(0,120),
      image:S(scene?.image||''),
      atText:(()=>{try{return new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return''}})(),
      statText:L(game.stage.stats).map(s=>`${s.name} ${s.cur}`).join(' · '),
      stats:L(game.stage.stats).map(s=>({...s})),
      items:L(game.stage.items).map(i=>({...i})),
      scenes:L(game.scenes).map(s=>({...s})),
      at:NOW()
    };
    game.stage.saves=[...saves.filter(s=>Number(s.slot)!==Number(slot)),row];
    persist();closeModal();say(`已存入槽位 ${slot}`);
  };
  window.v45712VNDoLoad=function(id,slot){
    const game=ensureStage(gameById(id));if(!game)return;
    const row=L(game.stage.saves).find(s=>Number(s.slot)===Number(slot));
    if(!row)return say('这个槽位还是空的');
    if(!confirm(`读取槽位 ${slot}？当前进度会先自动存到「最近一次」，不会丢。`))return;
    /* 读档前把当前进度落到一个保留槽，避免覆盖式丢失 */
    game.stage.autoSave={
      sceneCount:L(game.scenes).length,
      stats:L(game.stage.stats).map(s=>({...s})),
      items:L(game.stage.items).map(i=>({...i})),
      scenes:L(game.scenes).map(s=>({...s})),
      at:NOW()
    };
    game.scenes=L(row.scenes).map(s=>({...s}));
    game.stage.stats=L(row.stats).map(s=>({...s}));
    game.stage.items=L(row.items).map(i=>({...i}));
    game.updatedAt=NOW();persist();closeModal();
    try{v4571OpenVN(game.id)}catch{}
    say(`已回到槽位 ${slot} 的那一幕，之后的进展仍留在原槽位`);
  };
})();

/* =========================================================
   V45.7.12 · 文游道具栏、数值条编辑，以及接进原播放器
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiVNStage2)return;
  window.__pokejiVNStage2=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};

  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;
  const SWATCH=['#c96a5e','#7d94c0','#8fae95','#c9a05e','#9d7fb0','#c98ba0'];
  const PRESETS={
    classic:[{name:'生命值',cur:100,max:100,color:'#c96a5e'},{name:'精神值',cur:70,max:100,color:'#7d94c0'}],
    emotion:[{name:'好感度',cur:20,max:100,color:'#c98ba0'},{name:'信任',cur:35,max:100,color:'#8fae95'},{name:'理智',cur:80,max:100,color:'#8b93b8'}],
    survive:[{name:'体力',cur:80,max:100,color:'#c9a05e'},{name:'饱食',cur:60,max:100,color:'#a9b072'},{name:'警觉',cur:50,max:100,color:'#9d7fb0'}],
    none:[]
  };
  const ensure=id=>{const g=gameById(id);if(g&&!g.stage)g.stage={stats:[],items:[],saves:[],statPreset:'none'};if(g){g.stage.stats=L(g.stage.stats);g.stage.items=L(g.stage.items);g.stage.saves=L(g.stage.saves)}return g};

  /* ---------- 道具栏：格子式，说明＋使用 ---------- */
  const CELLS=8;
  window.v45712VNItems=function(id){
    const game=ensure(id);if(!game)return;
    const items=L(game.stage.items);
    const cells=[];
    for(let i=0;i<Math.max(CELLS,items.length);i++){
      const it=items[i];
      cells.push(it
        ?`<button class="${it.usable===false?'is-locked':''}" onclick="v45712VNItemDetail(${A(id)},${A(it.id)})">
            <span>${E(it.glyph||'◈')}</span>${E(S(it.name).slice(0,6))}${Number(it.count)>1?`<em>×${Number(it.count)}</em>`:''}</button>`
        :'<button class="is-blank" onclick="v45712VNAddItem(\''+AT(id)+'\')" aria-label="空格子"><span>＋</span></button>');
    }
    modal(`<div class="v45712-vn-sheet"><h2>道具栏</h2>
      <div class="note">故事里获得的东西会自动进这里。点一个看说明；灰掉的现在用不了。</div>
      <div class="v45712-vn-inv">${cells.join('')}</div>
      <div id="v45712VNItemDetail"><div class="note" style="margin-top:10px">点一个道具看说明。</div></div>
      <div class="form-actions"><button onclick="closeModal()">关闭</button><button onclick="v45712VNAddItem(${A(id)})">手动添加</button></div></div>`);
  };
  window.v45712VNItemDetail=function(gameId,itemId){
    const game=ensure(gameId);if(!game)return;
    const it=L(game.stage.items).find(x=>S(x.id)===S(itemId));if(!it)return;
    const box=document.getElementById('v45712VNItemDetail');if(!box)return;
    box.innerHTML=`<div class="v45712-vn-item">
        <span>${E(it.glyph||'◈')}</span>
        <div><b>${E(it.name)}${Number(it.count)>1?` ×${Number(it.count)}`:''}</b><p>${E(it.desc||'没有写说明。')}</p></div>
      </div>
      <div class="v45712-vn-item-tools">
        ${it.usable===false?'<button disabled>现在用不了</button>':`<button onclick="v45712VNUseItem(${A(gameId)},${A(itemId)})">在这一幕使用</button>`}
        <button onclick="v45712VNEditItem(${A(gameId)},${A(itemId)})">编辑</button>
        <button class="danger" onclick="v45712VNDropItem(${A(gameId)},${A(itemId)})">丢掉</button>
      </div>`;
  };
  window.v45712VNUseItem=function(gameId,itemId){
    const game=ensure(gameId);if(!game)return;
    const it=L(game.stage.items).find(x=>S(x.id)===S(itemId));if(!it)return;
    closeModal();
    const text=`我使用了「${it.name}」${it.desc?`（${it.desc}）`:''}`;
    try{v4571ChooseVN(text)}catch{say('无法在这一幕使用')}
    say(`已使用「${it.name}」，这一幕会因此改变`);
  };
  window.v45712VNAddItem=function(gameId){
    const game=ensure(gameId);if(!game)return;
    modal(`<div class="v45712-vn-sheet"><h2>添加道具</h2>
      <div class="field"><label>名称</label><input id="v45712ItemName" placeholder="例如：她的折伞"></div>
      <div class="field"><label>符号</label><input id="v45712ItemGlyph" value="◈" maxlength="2"></div>
      <div class="field"><label>说明</label><textarea id="v45712ItemDesc" placeholder="它是什么、从哪来、为什么留着"></textarea></div>
      <div class="field"><label>数量</label><input id="v45712ItemCount" type="number" min="1" value="1"></div>
      <label class="v45712-vn-check"><input type="checkbox" id="v45712ItemUsable" checked><span>现在可以使用</span></label>
      <div class="form-actions"><button onclick="v45712VNItems(${A(gameId)})">返回</button><button class="primary" onclick="v45712VNSaveItem(${A(gameId)},'')">保存</button></div></div>`);
  };
  window.v45712VNEditItem=function(gameId,itemId){
    const game=ensure(gameId);if(!game)return;
    const it=L(game.stage.items).find(x=>S(x.id)===S(itemId));if(!it)return;
    modal(`<div class="v45712-vn-sheet"><h2>编辑道具</h2>
      <div class="field"><label>名称</label><input id="v45712ItemName" value="${AT(it.name)}"></div>
      <div class="field"><label>符号</label><input id="v45712ItemGlyph" value="${AT(it.glyph||'◈')}" maxlength="2"></div>
      <div class="field"><label>说明</label><textarea id="v45712ItemDesc">${E(it.desc||'')}</textarea></div>
      <div class="field"><label>数量</label><input id="v45712ItemCount" type="number" min="1" value="${Number(it.count)||1}"></div>
      <label class="v45712-vn-check"><input type="checkbox" id="v45712ItemUsable" ${it.usable===false?'':'checked'}><span>现在可以使用</span></label>
      <div class="form-actions"><button onclick="v45712VNItems(${A(gameId)})">返回</button><button class="primary" onclick="v45712VNSaveItem(${A(gameId)},${A(itemId)})">保存</button></div></div>`);
  };
  window.v45712VNSaveItem=function(gameId,itemId){
    const game=ensure(gameId);if(!game)return;
    const name=S(document.getElementById('v45712ItemName')?.value).trim();
    if(!name)return say('请填写道具名称');
    const row={
      id:S(itemId)||ID('vnitem'),
      name,glyph:S(document.getElementById('v45712ItemGlyph')?.value||'◈').slice(0,2),
      desc:S(document.getElementById('v45712ItemDesc')?.value).trim(),
      count:Math.max(1,Number(document.getElementById('v45712ItemCount')?.value)||1),
      usable:document.getElementById('v45712ItemUsable')?.checked!==false,
      at:NOW()
    };
    game.stage.items=itemId
      ?L(game.stage.items).map(x=>S(x.id)===S(itemId)?row:x)
      :[...L(game.stage.items),row];
    persist();window.v45712VNItems(gameId);say(itemId?'道具已更新':'道具已添加');
  };
  window.v45712VNDropItem=function(gameId,itemId){
    const game=ensure(gameId);if(!game)return;
    const it=L(game.stage.items).find(x=>S(x.id)===S(itemId));if(!it)return;
    if(!confirm(`丢掉「${it.name}」？`))return;
    game.stage.items=L(game.stage.items).filter(x=>S(x.id)!==S(itemId));
    persist();window.v45712VNItems(gameId);say('已丢掉');
  };

  /* ---------- 数值条：预设或完全自定义，允许一条都不留 ---------- */
  window.v45712VNStatSheet=function(id){
    const game=ensure(id);if(!game)return;
    modal(`<div class="v45712-vn-sheet"><h2>数值条</h2>
      <div class="note">可以直接用预设，也可以完全自己定义。故事推进时由 AI 按剧情增减，跨过阈值可能触发不同分支。一条都不留也可以，那这部文游就是纯剧情向，顶部不显示任何条。</div>
      <div class="v45712-vn-presets">
        ${Object.entries({classic:['经典两条','生命值 · 精神值'],emotion:['情感向','好感度 · 信任 · 理智'],survive:['生存向','体力 · 饱食 · 警觉'],none:['不用数值','纯剧情，隐藏顶部条']})
          .map(([key,[title,sub]])=>`<button onclick="v45712VNApplyPreset(${A(id)},'${key}')"><b>${title}</b><small>${sub}</small></button>`).join('')}
      </div>
      <div id="v45712VNStatEditor">${statEditor(game)}</div>
      <div class="form-actions"><button onclick="v45712VNAddStat(${A(id)})">＋ 新增一条</button><button class="primary" onclick="closeModal()">完成</button></div></div>`);
  };
  function statEditor(game){
    const stats=L(game.stage.stats);
    if(!stats.length)return '<div class="note">当前没有数值条。这部文游会是纯剧情向，顶部不显示任何条。</div>';
    return stats.map((s,i)=>`<div class="v45712-vn-stat-edit">
      <div class="head"><i style="background:#697077"></i>
        <input value="${AT(s.name)}" placeholder="数值名称" oninput="v45712VNStatField(${A(game.id)},${i},'name',this.value)">
        <button onclick="v45712VNRemoveStat(${A(game.id)},${i})" aria-label="删除">×</button></div>
      <div class="fields">
        <label><span>当前值</span><input type="number" value="${s.cur}" oninput="v45712VNStatField(${A(game.id)},${i},'cur',this.value)"></label>
        <label><span>上限</span><input type="number" value="${s.max}" oninput="v45712VNStatField(${A(game.id)},${i},'max',this.value)"></label>
      </div>
      <div class="swatches">${SWATCH.map(c=>`<button class="${c===s.color?'on':''}" style="background:#dfe2e5" onclick="v45712VNStatField(${A(game.id)},${i},'color','${c}')" aria-label="颜色"></button>`).join('')}</div>
    </div>`).join('');
  }
  function refreshStatEditor(game){
    const box=document.getElementById('v45712VNStatEditor');
    if(box)box.innerHTML=statEditor(game);
    try{if(typeof window.v45712VNRepaint==='function')window.v45712VNRepaint()}catch{}
  }
  window.v45712VNStatField=function(id,index,field,value){
    const game=ensure(id);if(!game)return;
    const s=L(game.stage.stats)[index];if(!s)return;
    if(field==='name')s.name=S(value);
    else if(field==='color'){s.color=S(value);}
    else{
      const n=Number(value)||0;
      if(field==='max')s.max=Math.max(1,n);
      else s.cur=n;
      s.max=Math.max(1,Number(s.max)||100);
      s.cur=Math.max(0,Math.min(s.max,Number(s.cur)||0));
    }
    game.stage.statPreset='custom';persist();
    if(field==='color'||field==='max')refreshStatEditor(game);
    else try{window.v45712VNRepaint?.()}catch{}
  };
  window.v45712VNAddStat=function(id){
    const game=ensure(id);if(!game)return;
    if(L(game.stage.stats).length>=4)return say('最多四条，再多顶部会挤');
    game.stage.stats=[...L(game.stage.stats),{id:ID('stat'),name:'新数值',cur:50,max:100,color:SWATCH[L(game.stage.stats).length%SWATCH.length]}];
    game.stage.statPreset='custom';persist();refreshStatEditor(game);
  };
  window.v45712VNRemoveStat=function(id,index){
    const game=ensure(id);if(!game)return;
    game.stage.stats=L(game.stage.stats).filter((_,i)=>i!==index);
    game.stage.statPreset=L(game.stage.stats).length?'custom':'none';
    persist();refreshStatEditor(game);
  };
  window.v45712VNApplyPreset=function(id,key){
    const game=ensure(id);if(!game)return;
    game.stage.stats=L(PRESETS[key]).map(s=>({...s,id:ID('stat')}));
    game.stage.statPreset=key;persist();refreshStatEditor(game);
    say(key==='none'?'已关闭数值条，顶部不再显示':`已套用预设：${game.stage.stats.map(s=>s.name).join(' · ')}`);
  };

  /* ---------- AI 按剧情推数值 ---------- */
  window.v45712VNApplyDelta=function(game,deltas){
    if(!game?.stage)return[];
    const moved=[];
    for(const row of L(deltas)){
      const name=S(row?.name).trim(),delta=Number(row?.delta);
      if(!name||!Number.isFinite(delta)||!delta)continue;
      const stat=L(game.stage.stats).find(s=>S(s.name).trim()===name);
      if(!stat)continue;
      const before=stat.cur;
      stat.cur=Math.max(0,Math.min(Math.max(1,Number(stat.max)||100),before+delta));
      if(stat.cur!==before)moved.push(`${stat.name} ${delta>0?'+':''}${stat.cur-before}`);
    }
    return moved;
  };
  window.v45712VNGrantItems=function(game,rows){
    if(!game?.stage)return[];
    const added=[];
    for(const row of L(rows)){
      const name=S(row?.name).trim();if(!name)continue;
      const exist=L(game.stage.items).find(x=>S(x.name).trim()===name);
      if(exist){exist.count=Math.max(1,(Number(exist.count)||1)+(Number(row?.count)||1));added.push(`${name} ×${Number(row?.count)||1}`);continue}
      game.stage.items=[...L(game.stage.items),{
        id:ID('vnitem'),name,glyph:S(row?.glyph||'◈').slice(0,2),
        desc:S(row?.desc).trim(),count:Math.max(1,Number(row?.count)||1),
        usable:row?.usable!==false,at:NOW()
      }];
      added.push(name);
    }
    return added;
  };
})();

/* =========================================================
   V45.7.12 · 把视觉小说舞台接到原播放器上
   原 renderPlayer 负责时机与状态，这里只换掉它画出来的东西。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiVNStage3)return;
  window.__pokejiVNStage3=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};

  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;
  const activeGame=()=>gameById(S(data.visualNovelsV4571?.activeId));

  /* 舞台重画：原播放器每次改状态都会重设 root().innerHTML，
     我们在它之后立刻替换成视觉小说版式。 */
  function repaint(){
    const root=document.getElementById('v4571VNRoot');
    const game=activeGame();
    if(!root||!game)return false;
    /* 库列表页不接管 */
    if(root.querySelector('.v4571-vn-library'))return false;
    const scene=L(game.scenes).at(-1)||null;
    const busyNow=!!root.querySelector('.v4571-vn-generating,.v4571-vn-loading');
    if(typeof window.v45712VNStageMarkup!=='function')return false;
    const keep=document.getElementById('v4571VNCustomChoice')?.value||'';
    root.innerHTML=window.v45712VNStageMarkup(game,scene,busyNow);
    const input=document.getElementById('v4571VNCustomChoice');
    if(input&&keep)input.value=keep;
    return true;
  }
  window.v45712VNRepaint=repaint;

  /* 观察 root 的变化，原播放器一重画我们就跟着换版式 */
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;
      const root=document.getElementById('v4571VNRoot');
      if(!root)return;
      if(root.querySelector('.v45712-vn-shell'))return;   /* 已是新版式 */
      repaint();
    });
  });
  function watch(){
    const view=document.getElementById('visualNovel');
    if(!view)return;
    try{observer.observe(view,{childList:true,subtree:true})}catch{}
  }
  const baseOpen=typeof window.openVisualNovel==='function'?window.openVisualNovel:null;
  if(baseOpen&&!baseOpen.__stage){
    const wrapped=function(...args){const r=baseOpen.apply(this,args);setTimeout(watch,0);return r};
    wrapped.__stage=true;window.openVisualNovel=wrapped;try{openVisualNovel=wrapped}catch{}
  }
  const baseOpenVN=typeof window.v4571OpenVN==='function'?window.v4571OpenVN:null;
  if(baseOpenVN&&!baseOpenVN.__stage){
    const wrapped=function(...args){const r=baseOpenVN.apply(this,args);setTimeout(()=>{watch();repaint()},0);return r};
    wrapped.__stage=true;window.v4571OpenVN=wrapped;try{v4571OpenVN=wrapped}catch{}
  }
  setTimeout(watch,0);

  /* ---------- 让 AI 真的会推数值和给道具 ---------- */
  const baseInvoke=typeof window.invokeModel==='function'?window.invokeModel:null;
  if(baseInvoke&&!baseInvoke.__vnStage){
    const wrapped=async function(kind,options={}){
      if(options?.activityArea!=='文游')return baseInvoke.call(this,kind,options);
      const game=activeGame();
      const stats=L(game?.stage?.stats);
      const items=L(game?.stage?.items);
      let enhanced=options;
      if(game){
        const statText=stats.length
          ?`本作使用这些数值条，当前值如下：${stats.map(s=>`${s.name} ${s.cur}/${s.max}`).join('，')}。\n请在 JSON 里额外给出 "stats":[{"name":"数值名","delta":整数,"why":"一句原因"}]，只填真正该变化的项，名称必须完全一致；没有变化就给空数组。变化要由本幕实际发生的事推动，不要每幕都动，也不要凭空归零或拉满。`
          :'本作不使用数值条，不要输出 stats 字段，也不要在正文里编造血条、精神值之类的数字。';
        const itemText=items.length
          ?`${persona()}目前持有：${items.map(i=>`${i.name}${Number(i.count)>1?`×${i.count}`:''}`).join('，')}。若本幕确实得到新东西，用 "items":[{"name":"","glyph":"一个符号","desc":"它是什么","count":1}]。`
          :'若本幕确实得到可以留下的东西，用 "items":[{"name":"","glyph":"一个符号","desc":"它是什么","count":1}]。';
        enhanced={...options,system:`${S(options.system)}\n${statText}\n${itemText}`};
      }
      const raw=await baseInvoke.call(this,kind,enhanced);
      if(!game)return raw;
      try{
        const text=S(raw),start=text.indexOf('{'),end=text.lastIndexOf('}');
        if(start>=0&&end>start){
          const row=O(JSON.parse(text.slice(start,end+1)));
          const moved=window.v45712VNApplyDelta?.(game,row.stats)||[];
          const added=window.v45712VNGrantItems?.(game,row.items)||[];
          if(moved.length||added.length){
            persist();
            setTimeout(()=>{
              repaint();
              const parts=[];
              if(moved.length)parts.push(moved.join('，'));
              if(added.length)parts.push(`获得 ${added.join('、')}`);
              say(parts.join(' · '));
            },30);
          }
        }
      }catch{}
      return raw;
    };
    wrapped.__vnStage=true;window.invokeModel=wrapped;try{invokeModel=wrapped}catch{}
  }
  function persona(){
    try{return activePersonaFor(typeof currentChat!=='undefined'?currentChat:'')?.name||'你'}catch{return'你'}
  }
})();

/* =========================================================
   V45.7.12 · 手机购物应用真实结构
   首页瀑布流 → 商品详情 → 购物清单 → 购物车 → 订单物流。
   清单与购物车保持两个独立入口。
   只接管 market 一个应用；桌面、顶栏、图标一律不动。
   状态与数据都放在 window.__pokejiShopState / __pokejiShopStore，
   动作段与视图段共用同一份，不各自持有副本。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiShopViewsReady)return;
  window.__pokejiShopViewsReady=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const money=n=>Number(n||0).toFixed(2);
  const V=()=>window.V455||null;

  const TINT=['#f1f3f4','#eceeef','#e7eaec','#f3f4f5','#e9ebed','#f5f6f7'];
  const tint=i=>TINT[Math.abs(Number(i)||0)%TINT.length];
  const state=()=>window.__pokejiShopState||{owner:'user',route:'home',goodId:'',specIndex:0,orderTab:'全部'};
  const store=()=>window.__pokejiShopStore?.()||{goods:[],list:[],cart:[],orders:[],favorites:[]};

  /* ---------- 首次进入时铺一份可用的商品与记录 ---------- */
  window.v45712ShopSeed=function(){
    const base=store();
    if(!base.seeded){
      base.goods=[
        {id:ID('good'),name:'长柄自动伞 · 加固十骨 抗风暴雨',price:89,was:139,sold:'2.4万',rate:'98%',shop:'雨具官方旗舰店',tags:['包邮','7天无理由'],specs:['藏青 / 长柄','雅灰 / 长柄','米白 / 长柄'],height:132,tone:0,desc:'伞骨十根，风大也不容易翻。收起来偏重。'},
        {id:ID('good'),name:'纯棉短袖 T 恤 宽松基础款 三色可选',price:59,was:99,sold:'8.7万',rate:'97%',shop:'棉纺工坊',tags:['满2件减20'],specs:['白 / L','雾灰 / L','墨绿 / L'],height:158,tone:1,desc:'纯棉，洗后略缩。宽松版型。'},
        {id:ID('good'),name:'机械键盘 87 键 客制化轴体 白光',price:329,was:459,sold:'6231',rate:'99%',shop:'键盘实验室',tags:['分期免息'],specs:['红轴','茶轴','静音轴'],height:120,tone:2,desc:'热插拔轴座，可自行换轴。'},
        {id:ID('good'),name:'保温杯 500ml 316 不锈钢 长效锁温',price:79,was:128,sold:'1.9万',rate:'98%',shop:'家用好物',tags:['包邮'],specs:['雾白 / 500ml','石墨 / 500ml'],height:146,tone:3,desc:'六小时后仍然烫口。杯口偏窄。'},
        {id:ID('good'),name:'降噪耳机 主动降噪 长续航 通话清晰',price:249,was:399,sold:'3.2万',rate:'96%',shop:'声学旗舰店',tags:['限时直降'],specs:['夜黑','珠白'],height:126,tone:4,desc:'地铁里能压掉大部分低频。'},
        {id:ID('good'),name:'笔记本 A5 硬壳 方格内页 两本装',price:26,was:45,sold:'5.6万',rate:'99%',shop:'文具铺子',tags:['凑单神器'],specs:['方格','横线','空白'],height:152,tone:5,desc:'纸张偏厚，钢笔不透。'}
      ];
      base.list=[
        {id:ID('sl'),name:'长柄自动伞',note:'雨季前要买',price:89,done:false,tone:0,createdAt:NOW()},
        {id:ID('sl'),name:'保温杯 500ml',note:'旧的漏水了',price:79,done:false,tone:3,createdAt:NOW()}
      ];
      base.orders=[{
        id:ID('order'),no:String(Date.now()).slice(-13),status:'待收货',
        name:base.goods[3].name,spec:base.goods[3].specs[0],price:base.goods[3].price,qty:1,tone:3,
        address:'（未填写收件信息）',
        track:[{text:'已签收',at:'',done:false},{text:'派送中 · 骑手已取件',at:'今天 09:12',done:true},{text:'到达本市转运中心',at:'今天 04:40',done:true},{text:'已从仓库发出',at:'昨天 21:08',done:true},{text:'商家已接单',at:'昨天 19:55',done:true}],
        createdAt:NOW()
      }];
      base.seeded=true;persist();
    }
    /* 旧的 realApps.market.orders 不丢，合并成真实订单 */
    if(!base.legacyMerged){
      try{
        const real=V()?.ownerStore?.(state().owner);
        const legacy=L(real?.realApps?.market?.orders||real?.market?.orders);
        for(const row of legacy){
          if(!row||base.orders.some(o=>S(o.legacyId)===S(row.id)))continue;
          const status=S(row.status);
          base.orders.push({
            id:ID('order'),legacyId:S(row.id),
            no:String(row.id||'').slice(-13)||String(Date.now()).slice(-13),
            status:status==='运输中'?'待收货':['待付款','已完成','退款'].includes(status)?status:'已完成',
            name:S(row.product||'旧订单'),spec:'',price:Number(row.amount)||0,
            qty:Math.max(1,Number(row.quantity)||1),tone:2,address:S(row.address||''),
            track:S(row.logistics)?[{text:S(row.logistics),at:'',done:true}]:[],
            createdAt:S(row.createdAt||NOW())
          });
        }
      }catch{}
      base.legacyMerged=true;persist();
    }
  };

  /* ---------- 外壳 ---------- */
  function paint(html){
    try{V()?.setPhoneContent?.(`<div class="vphone vphone-app v455-phone-shell v45712-shop">${html}</div>`)}catch{}
    setTimeout(()=>{try{window.v453ShieldTextFields?.(document.querySelector('.v455-phone-shell'))}catch{}},0);
  }
  function topBar(hint,back){
    const count=store().cart.reduce((n,l)=>n+(Number(l.qty)||1),0);
    return `<div class="v45712-shop-top">
      <button class="back" onclick="${back?`v45712ShopGo('${back}')`:`v43PhoneDesktop(${A(state().owner)})`}" aria-label="返回">‹</button>
      <div class="search"><i>⌕</i><span>${E(hint)}</span></div>
      <button class="cart" onclick="v45712ShopGo('cart')" aria-label="购物车">⛬${count?`<b>${count}</b>`:''}</button>
    </div>`;
  }
  function tabs(current){
    const rows=[['home','推荐'],['list','清单'],['cart','购物车'],['orders','订单'],['fav','收藏']];
    return `<div class="v45712-shop-tabs">${rows.map(([key,label])=>
      `<button class="${key===current?'on':''}" onclick="v45712ShopGo('${key}')">${label}</button>`).join('')}</div>`;
  }
  window.v45712ShopGo=function(next){
    if(next==='fav'){
      const favs=store().favorites.length;
      return say(favs?`收藏夹里有 ${favs} 件，稍后开放独立页面`:'还没有收藏任何商品');
    }
    state().route=S(next);window.v45712ShopRepaint();
    const body=document.querySelector('.v45712-shop-body');if(body)body.scrollTop=0;
  };
  window.v45712ShopOpen=function(id){const s=state();s.goodId=S(id);s.specIndex=0;s.route='detail';window.v45712ShopRepaint()};
  window.v45712ShopSpec=function(i){state().specIndex=Number(i)||0;window.v45712ShopRepaint()};

  window.v45712ShopRepaint=function(){
    const s=state(),base=store(),views=window.__pokejiShopViews||{};
    if(s.route==='detail')return paint(detailView());
    if(s.route==='list')return paint(views.list?.(base,topBar,tabs,tint)||'');
    if(s.route==='cart')return paint(views.cart?.(base,topBar,tabs,tint)||'');
    if(s.route==='orders')return paint(views.orders?.(base,topBar,tabs,tint,s.orderTab)||'');
    return paint(homeView());
  };

  function homeView(){
    const base=store();
    return `${topBar('搜索商品、店铺')}${tabs('home')}
    <main class="vphone-app-body v45712-shop-body">
      <div class="v45712-shop-banner"><div><b>雨季必备专场</b><small>伞具、防水鞋套、除湿盒 最高直降 40%</small></div><span>去看看</span></div>
      ${base.goods.length?`<div class="v45712-shop-goods">${base.goods.map(g=>`
        <button class="v45712-good" onclick="v45712ShopOpen(${A(g.id)})">
          <div class="img" style="height:${Number(g.height)||130}px;background:${tint(g.tone)}">商品图</div>
          <div class="body">
            <p class="title">${E(g.name)}</p>
            ${L(g.tags).length?`<div class="tags">${g.tags.map(t=>`<span>${E(t)}</span>`).join('')}</div>`:''}
            <div class="price"><b><i>¥</i>${Number(g.price)}</b>${g.was?`<del>¥${Number(g.was)}</del>`:''}</div>
            <div class="foot"><span>${E(g.sold||'')}人已买</span><span>好评 ${E(g.rate||'')}</span></div>
          </div>
        </button>`).join('')}</div>`:'<div class="v45712-shop-empty"><b>还没有商品</b><small>这部手机的购物应用是空的。</small></div>'}
    </main>`;
  }
  function detailView(){
    const base=store(),s=state();
    const g=base.goods.find(x=>S(x.id)===S(s.goodId))||base.goods[0];
    if(!g)return homeView();
    const specs=L(g.specs).length?g.specs:['默认'];
    const index=Math.min(s.specIndex,specs.length-1);
    const faved=base.favorites.includes(S(g.id));
    return `${topBar('搜索店内商品','home')}
    <main class="vphone-app-body v45712-shop-body is-detail">
      <div class="v45712-detail-hero" style="background:${tint(g.tone)}">商品主图<em>1 / 6</em></div>
      <div class="v45712-detail-price">
        <div class="main"><b><i>¥</i>${Number(g.price)}</b>${g.was?`<del>¥${Number(g.was)}</del>`:''}<span>限时</span></div>
        <small>已有 ${E(g.sold||'')} 人购买 · 好评率 ${E(g.rate||'')}</small>
      </div>
      <div class="v45712-detail-block">
        <p class="name">${E(g.name)}</p>
        <p class="sub">${L(g.tags).join(' · ')}${g.desc?` · ${E(g.desc)}`:''}</p>
        <div class="specs">${specs.map((row,i)=>`<button class="${i===index?'on':''}" onclick="v45712ShopSpec(${i})">${E(row)}</button>`).join('')}</div>
      </div>
      <div class="v45712-detail-block">
        <div class="rows">
          <div><i>规格</i><span>${E(specs[index])}</span></div>
          <div><i>配送</i><span>预计明天送达 · 免运费</span></div>
          <div><i>服务</i><span>7天无理由 · 坏损包退</span></div>
          <div><i>店铺</i><span>${E(g.shop||'')}</span></div>
        </div>
      </div>
      <div class="v45712-detail-block">
        <div class="review-head"><b>评价</b><small>好评 ${E(g.rate||'')}</small></div>
        <div class="review"><div class="top"><span>${E(S(g.shop).slice(0,1)||'买')}</span><b>匿名买家</b><small>本周</small></div><p>${E(g.desc||'和描述一致。')}</p></div>
      </div>
    </main>
    <div class="v45712-shop-bar">
      <button class="ico" onclick="v45712ShopToList(${A(g.id)})"><span>☰</span>加清单</button>
      <button class="ico ${faved?'is-on':''}" onclick="v45712ShopFav(${A(g.id)})"><span>${faved?'♥':'♡'}</span>${faved?'已收藏':'收藏'}</button>
      <div class="buy">
        <button class="cartbtn" onclick="v45712ShopToCart(${A(g.id)})">加入购物车</button>
        <button class="now" onclick="v45712ShopBuyNow(${A(g.id)})">立即购买</button>
      </div>
    </div>`;
  }
})();

/* =========================================================
   V45.7.12 · 购物应用：清单、购物车、订单，以及全部动作
   清单与购物车保持两个独立入口。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiShopApp2)return;
  window.__pokejiShopApp2=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const money=n=>Number(n||0).toFixed(2);

  /* 与前一段共用同一份状态，通过 window 暴露的桥接函数取 */
  const bridge=()=>window.__pokejiShopBridge||null;

  window.__pokejiShopViews={
    list(shop,topBar,tabs,tint){
      const pending=shop.list.filter(l=>!l.done);
      const total=pending.reduce((n,l)=>n+(Number(l.price)||0),0);
      return `${topBar('搜索清单里的东西','home')}${tabs('list')}
      <main class="vphone-app-body v45712-shop-body">
        <div class="v45712-list-head">
          <div><b>购物清单</b><small>勾掉表示已经买了 · ${pending.length} 项待买</small></div>
          <em><i>¥</i>${money(total)}</em>
        </div>
        ${shop.list.length?shop.list.map(l=>`<div class="v45712-list-item ${l.done?'is-done':''}">
          <input type="checkbox" ${l.done?'checked':''} onchange="v45712ShopListDone(${A(l.id)},this.checked)" aria-label="已买">
          <div class="thumb" style="background:${tint(l.tone)}">图</div>
          <div><b>${E(l.name)}</b><small>${E(l.note||'')}</small></div>
          <strong>${Number(l.price)?`¥${Number(l.price)}`:'—'}</strong>
          <button onclick="v45712ShopListRemove(${A(l.id)})" aria-label="删除">×</button>
        </div>`).join(''):'<div class="v45712-shop-empty"><b>清单还是空的</b><small>看到想买的，在商品页点「加清单」，或者直接在下面写一行。</small></div>'}
        <div class="v45712-list-add">
          <input id="v45712ListInput" placeholder="想买什么，直接写一行…" onkeydown="if(event.key==='Enter'){event.preventDefault();v45712ShopListAdd()}">
          <button onclick="v45712ShopListAdd()">添加</button>
        </div>
        <div class="v45712-shop-note">清单只记你想买的东西，不会自动下单。勾掉的会留在下面，方便回头看买过什么。</div>
      </main>`;
    },
    cart(shop,topBar,tabs,tint){
      const groups=[];
      for(const line of shop.cart){
        const key=S(line.shop||'其他');
        let group=groups.find(g=>g.shop===key);
        if(!group){group={shop:key,lines:[]};groups.push(group)}
        group.lines.push(line);
      }
      const checked=shop.cart.filter(l=>l.checked!==false);
      const total=checked.reduce((n,l)=>n+(Number(l.price)||0)*(Number(l.qty)||1),0);
      let cut=0;
      for(const group of groups){
        const rows=group.lines.filter(l=>l.checked!==false);
        const sum=rows.reduce((n,l)=>n+(Number(l.price)||0)*(Number(l.qty)||1),0);
        const qty=rows.reduce((n,l)=>n+(Number(l.qty)||1),0);
        if(sum>=99)cut+=15;
        else if(qty>=2)cut+=20;
      }
      return `${topBar('搜索购物车','home')}${tabs('cart')}
      <main class="vphone-app-body v45712-shop-body">
        ${groups.length?groups.map(group=>`<div class="v45712-cart-shop">
          <div class="head"><i>▣</i><span>${E(group.shop)}</span></div>
          ${group.lines.map(l=>`<div class="v45712-cart-line">
            <input type="checkbox" ${l.checked!==false?'checked':''} onchange="v45712ShopCartCheck(${A(l.id)},this.checked)" aria-label="选择">
            <div class="thumb" style="background:${tint(l.tone)}">图</div>
            <div>
              <b>${E(l.name)}</b>
              ${l.spec?`<small>${E(l.spec)}</small>`:''}
              <div class="foot"><strong>¥${money(l.price)}</strong>
                <div class="stepper">
                  <button onclick="v45712ShopCartQty(${A(l.id)},-1)" aria-label="减少">−</button>
                  <span>${Number(l.qty)||1}</span>
                  <button onclick="v45712ShopCartQty(${A(l.id)},1)" aria-label="增加">＋</button>
                </div>
                <button class="drop" onclick="v45712ShopCartRemove(${A(l.id)})" aria-label="移除">×</button>
              </div>
            </div>
          </div>`).join('')}
        </div>`).join(''):'<div class="v45712-shop-empty"><b>购物车是空的</b><small>在商品页点「加入购物车」。</small></div>'}
        ${cut?`<div class="v45712-shop-cut">店铺优惠已减 ¥${money(cut)}</div>`:''}
      </main>
      <div class="v45712-cart-total">
        <div><b><i>合计 ¥</i>${money(Math.max(0,total-cut))}</b><small>已选 ${checked.reduce((n,l)=>n+(Number(l.qty)||1),0)} 件${cut?` · 已优惠 ¥${money(cut)}`:''}</small></div>
        <button onclick="v45712ShopCheckout()">结算</button>
      </div>`;
    },
    orders(shop,topBar,tabs,tint,orderTab){
      const tabsRow=['全部','待付款','待发货','待收货','已完成'];
      const rows=shop.orders.filter(o=>orderTab==='全部'||S(o.status)===orderTab);
      return `${topBar('搜索订单','home')}
      <div class="v45712-order-tabs">${tabsRow.map(t=>`<button class="${t===orderTab?'on':''}" onclick="v45712ShopOrderTab('${t}')">${t}</button>`).join('')}</div>
      <main class="vphone-app-body v45712-shop-body">
        ${rows.length?rows.map(o=>`<div class="v45712-order">
          <div class="head"><b>订单号 ${E(o.no)}</b><em>${E(o.status)}</em></div>
          <div class="goods">
            <div class="thumb" style="background:${tint(o.tone)}">图</div>
            <div><b>${E(o.name)}</b><small>${E(o.spec||'')}${o.spec?' · ':''}×${Number(o.qty)||1}</small></div>
            <strong>¥${money((Number(o.price)||0)*(Number(o.qty)||1))}</strong>
          </div>
          ${L(o.track).length?`<div class="v45712-track">${o.track.map(t=>`<div class="step ${t.done?'is-on':''}"><b>${E(t.text)}</b>${t.at?`<small>${E(t.at)}</small>`:''}</div>`).join('')}</div>`:''}
          <div class="foot">
            ${o.status==='待付款'?`<button class="primary" onclick="v45712ShopPay(${A(o.id)})">付款</button>`:''}
            ${o.status==='待收货'?`<button onclick="v45712ShopNudge(${A(o.id)})">催一下</button><button class="primary" onclick="v45712ShopReceive(${A(o.id)})">确认收货</button>`:''}
            ${o.status==='已完成'?`<button onclick="v45712ShopAgain(${A(o.id)})">再买一次</button>`:''}
            <button class="drop" onclick="v45712ShopOrderRemove(${A(o.id)})">删除</button>
          </div>
        </div>`).join(''):'<div class="v45712-shop-empty"><b>这个状态下还没有订单</b><small>换个状态看看。</small></div>'}
      </main>`;
    }
  };
})();

/* =========================================================
   V45.7.12 · 购物应用动作与接管入口
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiShopApp3)return;
  window.__pokejiShopApp3=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const money=n=>Number(n||0).toFixed(2);
  const V=()=>window.V455||null;
  const TINT=['#f1f3f4','#eceeef','#e7eaec','#f3f4f5','#e9ebed','#f5f6f7'];
  const tint=i=>TINT[Math.abs(Number(i)||0)%TINT.length];

  const state={owner:'user',route:'home',goodId:'',specIndex:0,orderTab:'全部'};
  window.__pokejiShopState=state;

  function shopStore(){
    const helper=V();
    let base=null;
    try{base=helper?.ownerStore?.(state.owner)||null}catch{}
    if(base){base.shopV45712=O(base.shopV45712);base=base.shopV45712}
    else{
      data.shopV45712=O(data.shopV45712);
      data.shopV45712[state.owner]=O(data.shopV45712[state.owner]);
      base=data.shopV45712[state.owner];
    }
    base.goods=L(base.goods);base.list=L(base.list);base.cart=L(base.cart);
    base.orders=L(base.orders);base.favorites=L(base.favorites);
    return base;
  }
  window.__pokejiShopStore=shopStore;

  function canEdit(){
    try{
      const session=V()?.phoneSession?.();
      if(!session||session.mode==='browse')return true;
      return V()?.permissionAtLeast?.(session.permission,'edit')!==false;
    }catch{return true}
  }
  function requireEdit(){if(canEdit())return true;say('当前连接权限只能查看，不能改动');return false}
  const repaint=()=>{try{window.v45712ShopRepaint?.()}catch{}};

  /* ---------- 清单 ---------- */
  window.v45712ShopListDone=function(id,done){
    if(!requireEdit())return repaint();
    const row=shopStore().list.find(l=>S(l.id)===S(id));if(!row)return;
    row.done=done===true;row.updatedAt=NOW();persist();repaint();
  };
  window.v45712ShopListRemove=function(id){
    if(!requireEdit())return;
    const store=shopStore(),row=store.list.find(l=>S(l.id)===S(id));if(!row)return;
    if(!confirm(`从清单里删掉「${row.name}」？`))return;
    store.list=store.list.filter(l=>S(l.id)!==S(id));persist();repaint();say('已从清单删除');
  };
  window.v45712ShopListAdd=function(){
    if(!requireEdit())return;
    const input=document.getElementById('v45712ListInput');
    const value=S(input?.value).trim();
    if(!value)return say('先写一行想买的东西');
    const store=shopStore();
    store.list.unshift({id:ID('sl'),name:value,note:'手动添加',price:0,done:false,tone:store.list.length,createdAt:NOW()});
    persist();repaint();say('已加入清单');
  };
  window.v45712ShopToList=function(goodId){
    if(!requireEdit())return;
    const store=shopStore(),good=store.goods.find(g=>S(g.id)===S(goodId));if(!good)return;
    if(store.list.some(l=>S(l.name)===S(good.name)))return say('清单里已经有它了');
    store.list.unshift({id:ID('sl'),name:S(good.name),note:'从商品页加入',price:Number(good.price)||0,done:false,tone:Number(good.tone)||0,createdAt:NOW()});
    persist();say('已加入购物清单');
  };
  window.v45712ShopFav=function(goodId){
    if(!requireEdit())return;
    const store=shopStore();
    if(store.favorites.includes(S(goodId))){store.favorites=store.favorites.filter(x=>x!==S(goodId));persist();return say('已取消收藏')}
    store.favorites.push(S(goodId));persist();say('已收藏');
  };

  /* ---------- 购物车 ---------- */
  window.v45712ShopToCart=function(goodId){
    if(!requireEdit())return;
    const store=shopStore(),good=store.goods.find(g=>S(g.id)===S(goodId));if(!good)return;
    const specs=L(good.specs).length?good.specs:['默认'];
    const spec=specs[Math.min(state.specIndex,specs.length-1)];
    const exist=store.cart.find(l=>S(l.goodId)===S(goodId)&&S(l.spec)===S(spec));
    if(exist)exist.qty=(Number(exist.qty)||1)+1;
    else store.cart.push({id:ID('ci'),goodId:S(goodId),name:S(good.name),spec:S(spec),price:Number(good.price)||0,qty:1,checked:true,shop:S(good.shop),tone:Number(good.tone)||0,createdAt:NOW()});
    persist();repaint();say('已加入购物车');
  };
  window.v45712ShopCartQty=function(id,delta){
    if(!requireEdit())return repaint();
    const row=shopStore().cart.find(l=>S(l.id)===S(id));if(!row)return;
    row.qty=Math.max(1,(Number(row.qty)||1)+Number(delta));persist();repaint();
  };
  window.v45712ShopCartCheck=function(id,checked){
    if(!requireEdit())return repaint();
    const row=shopStore().cart.find(l=>S(l.id)===S(id));if(!row)return;
    row.checked=checked===true;persist();repaint();
  };
  window.v45712ShopCartRemove=function(id){
    if(!requireEdit())return;
    const store=shopStore(),row=store.cart.find(l=>S(l.id)===S(id));if(!row)return;
    if(!confirm(`把「${row.name}」移出购物车？`))return;
    store.cart=store.cart.filter(l=>S(l.id)!==S(id));persist();repaint();say('已移出购物车');
  };
  window.v45712ShopCheckout=function(){
    if(!requireEdit())return;
    const store=shopStore();
    const rows=store.cart.filter(l=>l.checked!==false);
    if(!rows.length)return say('先选中要结算的商品');
    for(const row of rows){
      store.orders.unshift({
        id:ID('order'),no:String(Date.now()).slice(-13),status:'待发货',
        name:S(row.name),spec:S(row.spec),price:Number(row.price)||0,qty:Number(row.qty)||1,tone:Number(row.tone)||0,
        address:'（未填写收件信息）',
        track:[{text:'商家已接单',at:'刚刚',done:true}],
        createdAt:NOW()
      });
    }
    store.cart=store.cart.filter(l=>l.checked===false);
    persist();state.route='orders';state.orderTab='全部';repaint();
    say(`已下单 ${rows.length} 笔，可在订单里看状态`);
  };

  /* ---------- 订单 ---------- */
  window.v45712ShopOrderTab=function(tab){state.orderTab=S(tab);repaint()};
  window.v45712ShopBuyNow=function(goodId){
    if(!requireEdit())return;
    const store=shopStore(),good=store.goods.find(g=>S(g.id)===S(goodId));if(!good)return;
    const specs=L(good.specs).length?good.specs:['默认'];
    store.orders.unshift({
      id:ID('order'),no:String(Date.now()).slice(-13),status:'待付款',
      name:S(good.name),spec:S(specs[Math.min(state.specIndex,specs.length-1)]),
      price:Number(good.price)||0,qty:1,tone:Number(good.tone)||0,
      address:'（未填写收件信息）',track:[],createdAt:NOW()
    });
    persist();state.route='orders';state.orderTab='待付款';repaint();say('已创建订单，待付款');
  };
  window.v45712ShopPay=function(id){
    if(!requireEdit())return;
    const row=shopStore().orders.find(o=>S(o.id)===S(id));if(!row)return;
    row.status='待发货';row.track=[{text:'商家已接单',at:'刚刚',done:true}];
    persist();repaint();say(`已付款 ¥${money((Number(row.price)||0)*(Number(row.qty)||1))}`);
  };
  window.v45712ShopNudge=function(id){
    const row=shopStore().orders.find(o=>S(o.id)===S(id));if(!row)return;
    say('已催一下，物流那边不一定会快');
  };
  window.v45712ShopReceive=function(id){
    if(!requireEdit())return;
    const row=shopStore().orders.find(o=>S(o.id)===S(id));if(!row)return;
    row.status='已完成';
    row.track=[{text:'已签收',at:'刚刚',done:true},...L(row.track).map(t=>({...t,done:true}))];
    persist();repaint();say('已确认收货');
  };
  window.v45712ShopAgain=function(id){
    if(!requireEdit())return;
    const store=shopStore(),row=store.orders.find(o=>S(o.id)===S(id));if(!row)return;
    const good=store.goods.find(g=>S(g.name)===S(row.name));
    store.cart.push({id:ID('ci'),goodId:S(good?.id||''),name:S(row.name),spec:S(row.spec),price:Number(row.price)||0,qty:1,checked:true,shop:S(good?.shop||'店铺'),tone:Number(row.tone)||0,createdAt:NOW()});
    persist();state.route='cart';repaint();say('已加入购物车');
  };
  window.v45712ShopOrderRemove=function(id){
    if(!requireEdit())return;
    const store=shopStore(),row=store.orders.find(o=>S(o.id)===S(id));if(!row)return;
    if(!confirm(`删除订单「${row.name}」？`))return;
    store.orders=store.orders.filter(o=>S(o.id)!==S(id));persist();repaint();say('订单已删除');
  };

  /* ---------- 只拦截 market，不碰桌面 ---------- */
  const baseOpenApp=typeof window.v43OpenPhoneApp==='function'?window.v43OpenPhoneApp:null;
  if(baseOpenApp&&!baseOpenApp.__shop){
    const wrapped=function(nextOwner,key,...rest){
      if(S(key)!=='market')return baseOpenApp.call(this,nextOwner,key,...rest);
      state.owner=S(nextOwner||'user');state.route='home';state.goodId='';state.specIndex=0;state.orderTab='全部';
      try{v43ActivePhoneOwner=state.owner}catch{}
      window.v45712ShopSeed?.();
      window.v45712ShopRepaint?.();
    };
    wrapped.__shop=true;
    window.v43OpenPhoneApp=wrapped;window.openSimPhoneApp=wrapped;
    try{v43OpenPhoneApp=wrapped;openSimPhoneApp=wrapped}catch{}
  }
})();

/* =========================================================
   V45.7.12 · 幻梦馆
   梦来自角色自己。观梦只读旁观，入梦以 USER 自身进入。
   两种方式角色都不知道 USER 来过；入梦结束时由 USER 决定
   角色自己还记不记得这场梦的内容。默认非正史，只做快照。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiDreamHall)return;
  window.__pokejiDreamHall=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const img=v=>{try{return typeof safeImageSrc==='function'?safeImageSrc(v):S(v)}catch{return''}};

  function store(){
    data.dreamHallV45712=O(data.dreamHallV45712);
    data.dreamHallV45712.dreams=L(data.dreamHallV45712.dreams);
    return data.dreamHallV45712;
  }
  function dreamById(id){return store().dreams.find(d=>S(d.id)===S(id))||null}
  function person(id){
    return L(data.characters).find(c=>S(c.id)===S(id))||L(data.mpcs).find(c=>S(c.id)===S(id))||null;
  }
  function personaNow(){
    try{return activePersonaFor(typeof currentChat!=='undefined'?currentChat:'')}
    catch{return L(data.personas).find(p=>S(p.id)===S(data.activePersonaId))||L(data.personas)[0]||null}
  }
  let busy=false,active='',mode='watch',revealed=1;

  /* ---------- view host ---------- */
  function ensureView(){
    let view=document.getElementById('dreamHall');
    if(view)return view;
    view=document.createElement('section');
    view.id='dreamHall';view.className='view v45712-dream-view';
    view.innerHTML='<div id="dreamHallRoot"></div>';
    document.getElementById('screen')?.appendChild(view);
    return view;
  }
  function root(){ensureView();return document.getElementById('dreamHallRoot')}

  window.openDreamHall=function(){ensureView();try{show('dreamHall')}catch{}renderHall()};
  try{HOME_APP_CATALOG.dreamHall={label:'幻梦馆',view:'dreamHall',glyph:'☾',rank:'D',suit:'♠'}}catch{}
  const baseOpenView=typeof window.openView==='function'?window.openView:null;
  if(baseOpenView&&!baseOpenView.__dream){
    const wrapped=function(id,...rest){if(id==='dreamHall')return window.openDreamHall();return baseOpenView.call(this,id,...rest)};
    wrapped.__dream=true;window.openView=wrapped;try{openView=wrapped}catch{}
  }

  /* ---------- hall ---------- */
  function whenText(d){
    const stamp=S(d.worldTimeText)||(()=>{try{return new Date(d.createdAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return''}})();
    return `${stamp} · ${E(person(d.characterId)?.name||d.characterName||'某人')}自己做的梦`;
  }
  function renderHall(){
    active='';
    const dreams=store().dreams.slice().sort((a,b)=>S(b.createdAt).localeCompare(S(a.createdAt)));
    root().innerHTML=`<section class="v45712-dream-hall">
      <header class="v45712-dream-head">
        <button onclick="openView('home')" aria-label="返回">‹</button>
        <div><small>幻梦馆</small><b>幻梦馆</b></div>
        <button onclick="v45712NewDream()" aria-label="生成新的梦">＋</button>
      </header>
      <main>
        <section class="v45712-dream-lead">
          <small>角色自生的梦</small>
          <h1>他们自己做的梦</h1>
          <p>这里的梦都由角色自己生成，来自他们的经历、心结和没说出口的东西。你可以走进去，也可以只在外面看。两种方式他们事后都不会知道你来过。</p>
        </section>
        ${dreams.length?`<div class="v45712-dream-list">${dreams.map(dreamCard).join('')}</div>`
          :`<div class="v45712-dream-empty"><span>☾</span><b>还没有记录到梦</b><p>选一个人物，让他做一场自己的梦。梦会取材于你们相处过的事和他自己的心结。</p><button onclick="v45712NewDream()">让谁做一场梦</button></div>`}
        <div class="v45712-dream-foot">梦默认不算正史，只单独做快照，不会写进主聊天、动态或手机。要让它真的影响主线，需要在梦里单独确认一次。</div>
      </main>
    </section>`;
  }
  function dreamCard(d){
    const who=person(d.characterId),face=img(who?.image);
    return `<article class="v45712-dream-card">
      <div class="v45712-dream-card-top">
        <i>${face?`<img src="${AT(face)}" alt="">`:E(S(who?.name||'梦').trim().slice(0,1)||'梦')}</i>
        <div><b>${E(who?.name||d.characterName||'某人')}的梦</b><small>${whenText(d)}</small></div>
        <button onclick="v45712DeleteDream(${A(d.id)})" aria-label="删除这场梦">×</button>
      </div>
      <p>${E(S(d.gist).slice(0,180))}</p>
      ${L(d.tags).length?`<div class="v45712-dream-tags">${d.tags.slice(0,5).map(t=>`<span>${E(t)}</span>`).join('')}</div>`:''}
      ${d.visitedEnter||d.visitedWatch?`<div class="v45712-dream-seen">${d.visitedEnter?'你进过这场梦':'你看过这场梦'}${d.rememberMode?` · ${{full:'他记得内容',fragment:'他只记得片段',none:'他完全不记得'}[d.rememberMode]||''}`:''}</div>`:''}
      <div class="v45712-dream-modes">
        <button class="enter" onclick="v45712Enter(${A(d.id)})"><b>入梦</b><small>以你自己的身份进去，能说话能行动</small></button>
        <button class="watch" onclick="v45712Watch(${A(d.id)})"><b>观梦</b><small>只在外面看，不能干预</small></button>
      </div>
    </article>`;
  }

  /* ---------- create ---------- */
  window.v45712NewDream=function(){
    const people=[...L(data.characters),...L(data.mpcs)].filter(c=>c&&c.id);
    if(!people.length)return say('先创建一个人物');
    modal(`<div class="v45712-dream-create">
      <h2>让谁做一场梦</h2>
      <div class="note">梦由这个人物自己做，取材于他的经历、你们相处过的事和他自己的心结。他不会知道这场梦被记录下来。</div>
      <div class="field"><label>做梦的人</label><select id="v45712DreamWho">${people.map(c=>`<option value="${AT(c.id)}">${E(c.name||'未命名')}</option>`).join('')}</select></div>
      <div class="field"><label>梦的方向（可留空）</label><textarea id="v45712DreamSeed" placeholder="想让这场梦围绕什么：某件旧事、某种恐惧、某个反复出现的画面。留空则由他自己的处境决定。"></textarea></div>
      <div class="field"><label>梦的气质</label><select id="v45712DreamTone">
        <option value="natural">照他自己的状态来</option>
        <option value="uneasy">不安 · 压抑</option>
        <option value="warm">温和 · 眷恋</option>
        <option value="absurd">荒诞 · 错位</option>
        <option value="grief">失落 · 告别</option>
      </select></div>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45712GenerateDream()">生成这场梦</button></div>
    </div>`);
  };
  window.v45712GenerateDream=async function(){
    if(busy)return say('正在生成，请稍候');
    const characterId=S(document.getElementById('v45712DreamWho')?.value);
    const seed=S(document.getElementById('v45712DreamSeed')?.value).trim();
    const tone=S(document.getElementById('v45712DreamTone')?.value||'natural');
    const who=person(characterId);
    if(!who)return say('请选择做梦的人');
    if(typeof validModel==='function'&&!validModel('chat'))return say('请先配置主聊天线路');
    closeModal();busy=true;say(`正在等${who.name}入睡…`);
    const controller=typeof withTimeout==='function'?withTimeout(Math.max(60000,Number(data.settings?.timeout)||60000)):null;
    try{
      const toneText={natural:'按他此刻真实的状态，不刻意加强任何情绪',uneasy:'不安、压抑，有说不清的威胁感',warm:'温和、眷恋，但仍有梦特有的失真',absurd:'荒诞、错位，逻辑不连贯却有内在情绪',grief:'失落、告别，某样东西已经不在了'}[tone];
      const raw=await invokeModel('chat',{
        characterId,activityArea:'幻梦馆',
        system:`你要写的是${who.name}自己做的一场梦，梦的主人就是他本人。梦遵循梦的逻辑：场景可以突变，因果可以断裂，但情绪必须始终连贯，并且指向他真实的心结。\n严格禁止：把梦写成他清醒时的自述；出现任何观察者、系统、界面或"有人在看这场梦"的暗示；替${personaNow()?.name||'USER'}行动或让他知道有人会进入这场梦。\n气质要求：${toneText}。\n只输出 JSON：{"gist":"120 字以内的梦境概述，第三人称","tags":["3 到 5 个短标签，如 反复出现 / 积水 / 醒来后哭过"],"scenes":["4 到 6 段梦境正文，每段 60 到 140 字，按梦的推进顺序，最后一段是梦断掉或他醒来的瞬间"],"knot":"这场梦真正指向的心结，一句话，不写进正文"}`,
        history:[{role:'user',content:`【做梦的人】\n${typeof characterContext==='function'?characterContext(who):JSON.stringify({name:who.name,persona:who.persona||who.desc||''})}\n【梦的方向】\n${seed||'由他自己的处境决定'}\n【他与${personaNow()?.name||'USER'}的相处】\n${recentContext(characterId)}`}],
        temperature:.95,maxTokens:1800,signal:controller?.signal
      });
      const text=S(raw),start=text.indexOf('{'),end=text.lastIndexOf('}');
      const row=start>=0&&end>start?O(JSON.parse(text.slice(start,end+1))):{};
      const scenes=L(row.scenes).map(S).map(s=>s.trim()).filter(Boolean);
      if(!scenes.length)throw Error('这场梦没有生成出内容，请重试');
      const dream={
        id:ID('dream'),characterId,characterName:S(who.name),
        gist:S(row.gist).trim()||scenes[0].slice(0,120),
        tags:L(row.tags).map(S).filter(Boolean).slice(0,5),
        knot:S(row.knot).trim(),
        scenes,turns:[],
        canon:false,rememberMode:'',visitedWatch:false,visitedEnter:false,
        personaId:S(personaNow()?.id||data.activePersonaId),
        worldTimeText:(()=>{try{return typeof v454WorldTimeText==='function'?v454WorldTimeText():''}catch{return''}})(),
        createdAt:NOW()
      };
      store().dreams.unshift(dream);persist();renderHall();
      say(`${who.name}做了一场梦`);
    }catch(error){
      try{errorDetail(error,'梦境生成失败')}catch{say('梦境生成失败')}
    }finally{busy=false;try{releaseController?.(controller)}catch{}}
  };
  function recentContext(characterId){
    try{
      const persona=personaNow();
      const chatId=typeof directChatId==='function'?directChatId(characterId,persona?.id):'';
      const rows=L(data.chats?.[chatId]).filter(m=>m&&m.text&&!m.phoneEvent).slice(-14);
      if(!rows.length)return '还没有明显的相处记录。';
      return rows.map(m=>`${m.role==='user'?(persona?.name||'我'):(person(characterId)?.name||'他')}：${S(m.text).slice(0,120)}`).join('\n').slice(0,2200);
    }catch{return '还没有明显的相处记录。'}
  }
  window.v45712DeleteDream=function(id){
    const d=dreamById(id);if(!d)return;
    if(!confirm('删除这场梦？相关的快照也会一起删除。'))return;
    store().dreams=store().dreams.filter(row=>S(row.id)!==S(id));
    persist();renderHall();say('这场梦已删除');
  };
})();

/* =========================================================
   V45.7.12 · 幻梦馆 · 观梦与入梦
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiDreamModes)return;
  window.__pokejiDreamModes=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const persist=()=>{try{save()}catch{}};
  const say=t=>{try{toast(t)}catch{}};
  const img=v=>{try{return typeof safeImageSrc==='function'?safeImageSrc(v):S(v)}catch{return''}};

  const store=()=>{data.dreamHallV45712=O(data.dreamHallV45712);data.dreamHallV45712.dreams=L(data.dreamHallV45712.dreams);return data.dreamHallV45712};
  const dreamById=id=>store().dreams.find(d=>S(d.id)===S(id))||null;
  const person=id=>L(data.characters).find(c=>S(c.id)===S(id))||L(data.mpcs).find(c=>S(c.id)===S(id))||null;
  function personaNow(){
    try{return activePersonaFor(typeof currentChat!=='undefined'?currentChat:'')}
    catch{return L(data.personas).find(p=>S(p.id)===S(data.activePersonaId))||L(data.personas)[0]||null}
  }
  const root=()=>document.getElementById('dreamHallRoot');
  let active='',revealed=1,busy=false;

  /* ---------- 观梦：只读，无输入框，色调更冷 ---------- */
  window.v45712Watch=function(id){
    const d=dreamById(id);if(!d)return;
    active=S(id);revealed=1;
    if(!d.visitedWatch){d.visitedWatch=true;persist()}
    renderWatch();
  };
  function renderWatch(){
    const d=dreamById(active);if(!d)return;
    const who=person(d.characterId);
    const total=L(d.scenes).length;
    const done=revealed>=total;
    root().innerHTML=`<section class="v45712-dream-scene is-watch">
      <div class="v45712-dream-band">
        <i>◌</i><span>观梦 · 你只是旁观者，无法干预，也不会留下任何痕迹</span>
        <button onclick="v45712LeaveDream()" aria-label="离开">×</button>
      </div>
      <div class="v45712-dream-view" id="v45712DreamView">
        <p class="v45712-dream-meta">${E(who?.name||d.characterName||'某人')}的梦 · 第 ${Math.min(revealed,total)} / ${total} 段</p>
        ${L(d.scenes).slice(0,revealed).map(text=>`<p class="v45712-dream-para">${E(text)}</p>`).join('')}
        ${done?`<p class="v45712-dream-end">梦断在这里。${E(who?.name||'他')}醒了，不会知道有人看过。</p>`:''}
      </div>
      <div class="v45712-dream-foot">
        <div class="v45712-dream-only">
          <span>这场梦不接受你的介入。<br>${done?'你只是看完了它。':'你只能继续看下去。'}</span>
          <button onclick="${done?'v45712LeaveDream()':'v45712WatchNext()'}">${done?'看完了':'继续看'}</button>
        </div>
      </div>
    </section>`;
  }
  window.v45712WatchNext=function(){
    const d=dreamById(active);if(!d)return;
    if(revealed<L(d.scenes).length)revealed++;
    renderWatch();
    const view=document.getElementById('v45712DreamView');
    if(view)view.scrollTop=view.scrollHeight;
  };
  window.v45712LeaveDream=function(){active='';try{window.openDreamHall()}catch{}};

  /* ---------- 入梦：USER 以自身进入，可说话可行动 ---------- */
  window.v45712Enter=function(id){
    const d=dreamById(id);if(!d)return;
    active=S(id);
    d.turns=L(d.turns);
    if(!d.visitedEnter){d.visitedEnter=true;persist()}
    if(!d.turns.length){
      /* 第一段由梦本身的开头承接，USER 的到来写成一段旁白 */
      d.turns.push({id:ID('turn'),kind:'narration',text:L(d.scenes)[0]||'',at:NOW()});
      d.turns.push({id:ID('turn'),kind:'narration',text:`你进来的时候，梦还在继续。${E(person(d.characterId)?.name||'他')}抬头，看见的是你——在梦里，这件事并不需要解释。`,at:NOW()});
      persist();
    }
    renderEnter();
  };
  function turnMarkup(turn){
    if(turn.kind==='mine')return `<p class="v45712-dream-para is-mine">${E(turn.text)}</p>`;
    if(turn.kind==='said')return `<p class="v45712-dream-para is-said">${E(turn.text)}</p>`;
    return `<p class="v45712-dream-para">${E(turn.text)}</p>`;
  }
  function renderEnter(){
    const d=dreamById(active);if(!d)return;
    const who=person(d.characterId);
    root().innerHTML=`<section class="v45712-dream-scene is-enter">
      <div class="v45712-dream-band">
        <i>◍</i><span>入梦 · 你以自己的身份在梦里，说的话和做的事${E(who?.name||'他')}都会回应</span>
        <button onclick="v45712LeaveDream()" aria-label="离开">×</button>
      </div>
      <div class="v45712-dream-view" id="v45712DreamView">
        <p class="v45712-dream-meta">你进入了${E(who?.name||d.characterName||'某人')}的梦${d.knot?` · 梦的底色：${E(d.knot)}`:''}</p>
        ${L(d.turns).map(turnMarkup).join('')}
        ${busy?'<p class="v45712-dream-waiting"><i></i>梦在往下走…</p>':''}
      </div>
      <div class="v45712-dream-foot">
        <div class="v45712-dream-tools">
          <button onclick="v45712AddNarration()">加旁白</button>
          <button onclick="v45712EndDream()">结束这场梦</button>
          <button onclick="v45712LeaveDream()">离开</button>
        </div>
        <div class="v45712-dream-input">
          <input id="v45712DreamSay" placeholder="说一句话，或写下你的动作…" onkeydown="if(event.key==='Enter'){event.preventDefault();v45712Say()}">
          <button onclick="v45712Say()" aria-label="发送">↑</button>
        </div>
      </div>
    </section>`;
    const view=document.getElementById('v45712DreamView');
    if(view)view.scrollTop=view.scrollHeight;
  }
  window.v45712AddNarration=function(){
    const d=dreamById(active);if(!d)return;
    const text=prompt('写一段旁白，描述梦里此刻的环境或你的动作：');
    if(!S(text).trim())return;
    d.turns.push({id:ID('turn'),kind:'narration',text:S(text).trim(),at:NOW()});
    persist();renderEnter();
  };
  window.v45712Say=async function(){
    if(busy)return say('梦还在往下走');
    const d=dreamById(active);if(!d)return;
    const input=document.getElementById('v45712DreamSay');
    const value=S(input?.value).trim();
    if(!value)return say('说一句话，或写下你的动作');
    if(typeof validModel==='function'&&!validModel('chat'))return say('请先配置主聊天线路');
    if(input)input.value='';
    d.turns.push({id:ID('turn'),kind:'mine',text:value,at:NOW()});
    persist();busy=true;renderEnter();
    const who=person(d.characterId),me=personaNow()?.name||'我';
    const controller=typeof withTimeout==='function'?withTimeout(Math.max(60000,Number(data.settings?.timeout)||60000)):null;
    try{
      const raw=await invokeModel('chat',{
        characterId:d.characterId,activityArea:'幻梦馆',
        system:`这是${who?.name||'他'}自己的梦，梦的主人是他。${me}此刻以自己的身份出现在这场梦里，${who?.name||'他'}能看见他、能与他说话。\n梦的逻辑：场景可以突变，因果可以断裂，情绪必须连贯，并始终指向他的心结「${d.knot||'未明说的东西'}」。\n严格禁止：让${who?.name||'他'}意识到这是被观看的梦、意识到有系统或界面、或说出"你进入了我的梦"这类元叙述；不得替${me}说话或行动；不得把梦写成清醒时的谈话。\n只输出 JSON：{"narration":"梦里此刻的环境与动作，60 到 140 字","reply":"${who?.name||'他'}的台词，可为空字符串"}`,
        history:[
          ...L(d.scenes).slice(0,2).map(text=>({role:'assistant',content:text})),
          ...L(d.turns).slice(-10).map(t=>({role:t.kind==='mine'?'user':'assistant',content:S(t.text)}))
        ],
        temperature:.92,maxTokens:900,signal:controller?.signal
      });
      const text=S(raw),start=text.indexOf('{'),end=text.lastIndexOf('}');
      const row=start>=0&&end>start?O(JSON.parse(text.slice(start,end+1))):{};
      const narration=S(row.narration).trim(),reply=S(row.reply).trim();
      if(narration)d.turns.push({id:ID('turn'),kind:'narration',text:narration,at:NOW()});
      if(reply)d.turns.push({id:ID('turn'),kind:'said',text:reply,at:NOW()});
      if(!narration&&!reply)d.turns.push({id:ID('turn'),kind:'narration',text:S(text).replace(/[{}"]/g,'').trim().slice(0,300)||'梦沉了一下，什么也没有发生。',at:NOW()});
      d.updatedAt=NOW();persist();
    }catch(error){
      try{errorDetail(error,'梦里的回应失败')}catch{say('梦里的回应失败')}
    }finally{busy=false;renderEnter();try{releaseController?.(controller)}catch{}}
  };

  /* ---------- 结束入梦：由 USER 决定角色自己记不记得 ---------- */
  window.v45712EndDream=function(){
    const d=dreamById(active);if(!d)return;
    const who=person(d.characterId),name=E(who?.name||'他');
    modal(`<div class="v45712-dream-wake">
      <h2>${name}醒来之后</h2>
      <div class="note">不管你选哪个，${name}都<b>不会</b>知道你进过这场梦。你决定的只是：这场梦的内容他自己还记不记得。</div>
      <label class="v45712-dream-pick"><input type="radio" name="v45712Remember" value="full" checked><div><b>${name}记得这场梦</b><small>醒来后带着梦里的情绪和印象，之后可能提起「做了个奇怪的梦」，但梦里那个人是谁他说不清。</small></div></label>
      <label class="v45712-dream-pick"><input type="radio" name="v45712Remember" value="fragment"><div><b>只记得片段</b><small>记得几个画面和一种说不出的感觉，具体发生什么想不起来。</small></div></label>
      <label class="v45712-dream-pick"><input type="radio" name="v45712Remember" value="none"><div><b>${name}完全不记得</b><small>醒来一片空白，这场梦只留在你这边。</small></div></label>
      <div class="v45712-dream-warn">这场梦默认不算正史，只做快照保存。要让它真的影响主线，请勾下面这一项。</div>
      <label class="v45712-dream-pick"><input type="checkbox" id="v45712DreamCanon"><div><b>纳入正史</b><small>这场梦会成为已发生的事实，写入他的记忆并可能影响之后的相处。不勾就只是快照。</small></div></label>
      <div class="form-actions"><button onclick="closeModal()">再待一会</button><button class="primary" onclick="v45712SaveWake()">结束并保存</button></div>
    </div>`);
  };
  window.v45712SaveWake=function(){
    const d=dreamById(active);if(!d)return;
    const pick=S(document.querySelector('input[name="v45712Remember"]:checked')?.value||'full');
    const canon=document.getElementById('v45712DreamCanon')?.checked===true;
    d.rememberMode=pick;d.canon=canon;d.endedAt=NOW();
    d.snapshot={turns:L(d.turns).length,rememberMode:pick,canon,at:NOW()};
    if(pick!=='none')writeDreamMemory(d,pick,canon);
    persist();closeModal();
    const who=person(d.characterId),name=who?.name||'他';
    const label={full:`${name}会记得这场梦的内容`,fragment:`${name}只记得片段`,none:`${name}完全不记得`}[pick];
    active='';try{window.openDreamHall()}catch{}
    say(`已保存${canon?'并纳入正史':'快照'} · ${label}；他不会知道你进过他的梦`);
  };
  /* 写记忆时必须标注来源是梦，且不能包含"有人进来过"这件事 */
  function writeDreamMemory(dream,pick,canon){
    try{
      data.memories=L(data.memories);
      const who=person(dream.characterId);
      const detail=pick==='fragment'
        ?`只记得几个画面：${L(dream.tags).slice(0,3).join('、')||S(dream.gist).slice(0,60)}；醒来后说不清具体发生了什么。`
        :`${S(dream.gist)}\n梦里出现过一个人，${who?.name||'他'}醒来后想不起那是谁。`;
      const row={
        id:ID('memory'),scope:'character',characterId:dream.characterId,
        personaId:dream.personaId,source:'dream-hall',sourceDreamId:dream.id,
        title:`一场自己做的梦${canon?'':'（未纳入正史）'}`,
        text:`${detail}\n这是${who?.name||'他'}自己做的梦，不是真实发生的事。他不知道有任何人看过或进入过这场梦。`,
        canon,createdAt:NOW()
      };
      data.memories.unshift(row);
    }catch(error){console.warn('V45.7.12 梦境记忆写入失败',error)}
  }
})();

/* =========================================================
   V45.7.12 · 幻梦馆桌面入口
   按桌面上真实存在的图标判断，不用"已添加过"标记，
   避免和文游图标当初一样被排列重置清掉后再也补不回来。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiDreamEntry)return;
  window.__pokejiDreamEntry=true;
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  function addEntry(){
    try{
      if(typeof normalizeHomeDesktop!=='function')return;
      data.homeDesktop=normalizeHomeDesktop(data.homeDesktop);
      const items=Array.isArray(data.homeDesktop.items)?data.homeDesktop.items:[];
      if(items.some(item=>item&&item.kind==='app'&&item.app==='dreamHall'))return;
      data.homeDesktop.pageCount=Math.max(2,Number(data.homeDesktop.pageCount)||2);
      let slot=null;
      const order=[1,0,...Array.from({length:data.homeDesktop.pageCount},(_,i)=>i)];
      for(const page of order){
        if(slot)break;
        const used=new Set(items.filter(item=>item&&item.page===page).map(item=>`${item.x}:${item.y}`));
        for(let y=0;y<4&&!slot;y++)for(let x=0;x<4;x++)if(!used.has(`${x}:${y}`)){slot={page,x,y};break}
      }
      if(!slot){
        data.homeDesktop.pageCount=Math.min(12,data.homeDesktop.pageCount+1);
        slot={page:data.homeDesktop.pageCount-1,x:0,y:0};
      }
      data.homeDesktop.items.push({id:ID('app_dreamHall'),kind:'app',app:'dreamHall',page:slot.page,x:slot.x,y:slot.y,w:1,h:1});
      try{save()}catch{}
      try{renderHomeDesktop?.()}catch{}
    }catch(error){console.warn('V45.7.12 幻梦馆桌面入口添加失败',error)}
  }
  setTimeout(addEntry,0);
})();

/* =========================================================
   V45.7.17 · 持久会话时间线
   时间不是只给“本轮请求”的一次性提示：每条已保存消息都带有
   当时的会话时间，并在后续请求的历史上下文中按原顺序重新注入。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45717TemporalContinuity)return;
  window.__pokejiV45717TemporalContinuity=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const L=value=>Array.isArray(value)?value:[];
  const NOW=()=>new Date().toISOString();
  const finite=value=>Number.isFinite(Number(value))?Number(value):null;

  function canonical(id){try{return typeof canonicalChatId==='function'?canonicalChatId(id):S(id)}catch{return S(id)}}
  function dateText(ms){
    const value=finite(ms);if(value===null)return'';
    try{return new Date(value).toLocaleString('zh-CN',{hour12:false,year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return new Date(value).toISOString()}
  }
  function fallbackSnapshot(chatId){
    const now=Date.now();return{mode:'real',text:dateText(now),timeMs:now,worldId:'',totalElapsedSeconds:0,lastElapsedSeconds:0,source:'fallback'};
  }
  function snapshot(chatId=currentChat){
    try{const value=window.v454GetTimeSnapshot?.(chatId);if(value&&typeof value==='object')return{mode:S(value.mode||'real'),text:S(value.text||dateText(Date.now())),timeMs:finite(value.timeMs),worldId:S(value.worldId||''),totalElapsedSeconds:Number(value.totalElapsedSeconds)||0,lastElapsedSeconds:Number(value.lastElapsedSeconds)||0,source:'conversation-clock'}}catch{}
    return fallbackSnapshot(chatId);
  }
  function messageId(message,index){
    if(!message||typeof message!=='object')return'';
    if(!S(message.id).trim())message.id=`legacy_time_${index}_${Math.random().toString(36).slice(2,9)}`;
    return S(message.id);
  }
  function oldMessageTime(message){
    const row=O(message),ctx=O(row.timeContext),v454=O(row.timeV454);
    const text=S(row.worldTimeText||ctx.text||v454.worldTimeText||row.timestampText||'').trim();
    const ms=finite(row.timeMs)??finite(ctx.timeMs)??finite(row.timelineAtMs)??finite(v454.timeMs)??(row.createdAt&&Number.isFinite(Date.parse(row.createdAt))?Date.parse(row.createdAt):null);
    const mode=S(row.timelineMode||ctx.mode||v454.mode||'');
    if(text)return{text,ms,mode:mode||'recorded',source:S(ctx.source||'recorded')};
    if(S(row.time).trim())return{text:S(row.time).trim(),ms,mode:mode||'legacy',source:'legacy-display'};
    if(ms!==null)return{text:dateText(ms),ms,mode:mode||'legacy',source:'legacy-date'};
    return{text:'时间未记录',ms:null,mode:mode||'unknown',source:'missing'};
  }
  function applyMessageTime(message,chatId,forcedSnapshot=null,force=false){
    if(!message||typeof message!=='object')return false;
    const before=JSON.stringify({worldTimeText:message.worldTimeText,timeMs:message.timeMs,timelineMode:message.timelineMode,timeContext:message.timeContext});
    const existing=oldMessageTime(message),snap=forcedSnapshot||snapshot(chatId);
    const isFresh=force===true;
    const info=isFresh?{text:S(snap.text||dateText(Date.now())),ms:finite(snap.timeMs),mode:S(snap.mode||'real'),source:'captured'}:existing;
    if(isFresh||!S(message.worldTimeText||message.timeContext?.text).trim()){
      if(info.text)message.worldTimeText=info.text;
      if(info.ms!==null)message.timeMs=info.ms;
      message.timelineMode=info.mode;
      if(!S(message.createdAt).trim())message.createdAt=NOW();
      message.sentAt=S(message.sentAt||message.createdAt);
    }else{
      if(existing.text&&existing.text!=='时间未记录')message.worldTimeText=existing.text;
      if(existing.ms!==null&&finite(message.timeMs)===null)message.timeMs=existing.ms;
      if(!S(message.timelineMode).trim())message.timelineMode=existing.mode;
    }
    const text=S(message.worldTimeText||info.text||'时间未记录');
    message.timeContext={mode:S(message.timelineMode||info.mode||'unknown'),text,timeMs:finite(message.timeMs),worldId:S(message.timeContext?.worldId||snap.worldId||''),source:isFresh?'captured':existing.source||'recorded',updatedAt:S(message.timeContext?.updatedAt||NOW())};
    const after=JSON.stringify({worldTimeText:message.worldTimeText,timeMs:message.timeMs,timelineMode:message.timelineMode,timeContext:message.timeContext});
    return before!==after;
  }
  function speakerFor(chatId,message){
    try{
      if(message?.role==='user')return activePersonaFor(chatId)?.name||'USER';
      if(message?.speaker){const found=data.characters?.find(item=>S(item.id)===S(message.speaker));if(found)return found.name||'角色'}
      return directCharacterForChat(chatId)?.name||'角色';
    }catch{return message?.role==='user'?'USER':'角色'}
  }
  function modeFor(message,chatId){
    if(message?.mode==='offline')return message.sceneMode==='story'?'线下·分镜':'线下';
    if(message?.mode==='group'||(typeof groupForChat==='function'&&groupForChat(chatId)))return'群聊';
    return'线上';
  }
  function excerpt(value,max=260){return S(value).replace(/\s+/g,' ').trim().slice(0,max)}

  function ensureDataHistory(){
    data.runtime=O(data.runtime);
    data.chatTimeHistory=data.chatTimeHistory&&typeof data.chatTimeHistory==='object'&&!Array.isArray(data.chatTimeHistory)?data.chatTimeHistory:{};
  }
  function syncChatTemporalHistory(chatId){
    ensureDataHistory();
    const key=canonical(chatId),rows=L(data.chats?.[key]),old=L(data.chatTimeHistory[key]),oldMap=new Map(old.map(item=>[S(item.messageId),item]).filter(item=>item[0]));
    const liveIds=new Set(),next=[];let changed=false;
  rows.forEach((message,index)=>{
      if(!message||typeof message!=='object')return;
      const id=messageId(message,index);liveIds.add(id);
      const pending=O(window.__v45717PendingSend),forcePending=S(pending.chatId)===key&&index>=Number(pending.before||0)&&message.role==='user';
      if(applyMessageTime(message,key,forcePending?pending.snapshot:null,forcePending))changed=true;
      const ctx=O(message.timeContext),previous=oldMap.get(id),entry={...(previous||{}),messageId:id,role:S(message.role||'assistant'),speaker:S(message.speaker||''),mode:modeFor(message,key),sceneMode:S(message.sceneMode||''),worldTimeText:S(message.worldTimeText||ctx.text||'时间未记录'),timeMs:finite(message.timeMs)??finite(ctx.timeMs),timelineMode:S(message.timelineMode||ctx.mode||''),text:excerpt(message.text,260),createdAt:S(message.createdAt||ctx.updatedAt||''),updatedAt:S(previous?.updatedAt||ctx.updatedAt||NOW())};
      if(!previous||JSON.stringify(previous)!==JSON.stringify(entry))changed=true;next.push(entry);oldMap.delete(id);
    });
    /* Deleting a chat message also removes its temporal excerpt; it must not
       survive as a phantom fact in a later prompt. */
    const retained=next.filter(item=>liveIds.has(item.messageId));
    if(JSON.stringify(old)!==JSON.stringify(retained))changed=true;
    data.chatTimeHistory[key]=retained.slice(-800);
    return changed;
  }
  function syncAllTemporalHistory(){
    ensureDataHistory();let changed=false;
    for(const key of Object.keys(O(data.chats)))changed=syncChatTemporalHistory(key)||changed;
    if(changed){data.runtime.v45717TemporalHistoryVersion=1;try{save()}catch{}}
    return changed;
  }

  function temporalRows(chatId,limit=100){
    const key=canonical(chatId),changed=syncChatTemporalHistory(key);if(changed)try{save()}catch{}
    const messages=L(data.chats?.[key]),byId=new Map(messages.map((message,index)=>[messageId(message,index),message]));
    const ledger=L(data.chatTimeHistory?.[key]);
    const rows=ledger.map(entry=>{const message=byId.get(S(entry.messageId));return{entry,message}});
    return rows.slice(-Math.max(1,Math.min(160,Number(limit)||100)));
  }
  /* V45.7.21：时间线降噪。
     时间仍然全量保存在 chatTimeHistory / 消息本体里，跨日、等待、睡眠、移动、
     自定义世界历法的判断能力一个都不减；只是不再把每条历史都铺进提示词。
     判定「有意义的时间节点」：跨日、间隔≥20 分钟、时间模式切换、线上线下切换、
     以及最近两条。其余消息由普通历史承担，时间不重复出现。 */
  /* =========================================================
     V45.7.22 · 时间从「通知」改成「常识」
     用户反馈两件事，其实同一个病根：
       ① 前几小时说要睡觉，几小时后回来，角色还问「你不是要睡觉吗」
       ② 一给时间就句句提时间，人味没了
     原因是旧写法给的是原始读数（当前时间＋累计经过＋区块标题【以此为准】），
     模型把它当成刚收到的通知，于是要回应它；同时历史里 USER 最后一句
     「我去睡了」没有任何东西说明它已经过期，所以那句话一直是「最新状态」。
     改法：给结论，不给读数。
       · 一行自然语言的此刻感（带时段词），读起来像本来就知道的事
       · USER 的状态声明超过合理时长，直接在那条消息上标「已结束」
       · 不要求角色提时间，只允许它按性格自行决定在意或不在意
     ========================================================= */
  const V45722_PERIODS=[[5,'凌晨'],[9,'早上'],[11,'上午'],[13,'中午'],[17,'下午'],[19,'傍晚'],[24,'晚上']];
  function periodWord(ms){
    const hour=new Date(Number(ms)||Date.now()).getHours();
    for(const [limit,word] of V45722_PERIODS)if(hour<limit)return word;
    return'晚上';
  }
  function clockWord(ms){
    const date=new Date(Number(ms)||Date.now());
    const pad=value=>String(value).padStart(2,'0');
    return`${periodWord(date.getTime())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function dayWord(ms,nowMs){
    const date=new Date(Number(ms)||Date.now()),now=new Date(Number(nowMs)||Date.now());
    const dayMs=24*60*60*1000;
    const startOf=value=>{const d=new Date(value);d.setHours(0,0,0,0);return d.getTime()};
    const diff=Math.round((startOf(now)-startOf(date))/dayMs);
    if(diff===0)return'';
    if(diff===1)return'昨天';
    if(diff===2)return'前天';
    if(diff>2&&diff<7)return`${diff}天前`;
    return`${date.getMonth()+1}月${date.getDate()}日`;
  }

  /* USER 声明过的状态：超过合理时长就当它已经结束。
     阈值按「这件事正常要做多久」定，不是随便取的数字。 */
  const V45722_STATES=[
    {key:'sleep',test:/(去睡|睡了|睡觉|晚安|洗漱睡|躺下|眯一会|补个觉|睡一下)/,short:3,long:5,
     shortText:'睡了一会儿，可能刚醒',longText:'睡了一整觉，现在应该已经醒了'},
    {key:'shower',test:/(洗澡|冲个澡|去洗漱|泡澡)/,short:40/60,long:2,
     shortText:'应该洗完了',longText:'早就洗完了'},
    {key:'meal',test:/(吃饭|去吃|吃个饭|点外卖|做饭|吃晚饭|吃午饭|吃早饭)/,short:1,long:3,
     shortText:'应该吃完了',longText:'早就吃完了'},
    {key:'out',test:/(出门|出去一下|上班|上课|去公司|去学校|要走了|下楼)/,short:2,long:8,
     shortText:'可能还在外面，也可能回来了',longText:'早该回来了'},
    {key:'busy',test:/(开会|忙一下|有事|处理一下|加班)/,short:1,long:4,
     shortText:'应该忙完了',longText:'早就忙完了'}
  ];
  function stateExpiry(message,nowMs){
    if(!message||message.role!=='user')return'';
    const text=S(message.text);if(!text)return'';
    const at=finite(message.timeMs);if(at===null||at===undefined)return'';
    const hours=(Number(nowMs)-at)/3600000;
    if(!(hours>0))return'';
    for(const state of V45722_STATES){
      if(!state.test.test(text))continue;
      if(hours>=state.long)return`［这句话是 ${describeGap(hours)} 前说的，${state.longText}］`;
      if(hours>=state.short)return`［这句话是 ${describeGap(hours)} 前说的，${state.shortText}］`;
      return'';
    }
    return'';
  }
  function describeGap(hours){
    if(hours<1)return`${Math.round(hours*60)} 分钟`;
    if(hours<24)return`${Math.round(hours)} 小时`;
    const days=Math.round(hours/24);
    return`${days} 天`;
  }
  window.v45722StateExpiry=stateExpiry;
  window.v45722ClockWord=clockWord;

  /* 一行此刻感，替代原来那个多行读数区块。
     不带【】标题、不带模式名、不带累计秒数，读起来像常识而不是通知。 */
  window.v45722AmbientTime=function(chatId=currentChat){
    try{
      const now=Date.now();
      const rows=L(data.chats?.[canonical(chatId)]);
      const date=new Date(now);
      const head=`此刻是 ${date.getMonth()+1}月${date.getDate()}日 星期${'日一二三四五六'[date.getDay()]} ${clockWord(now)}。`;
      let last=null;
      for(let index=rows.length-1;index>=0;index--){const at=finite(rows[index]?.timeMs);if(at!==null&&at!==undefined){last=at;break}}
      if(last===null)return head;
      const gapHours=(now-last)/3600000;
      if(gapHours<1)return head;
      const day=dayWord(last,now);
      return`${head}你们上次说话是${day?day+' ':''}${clockWord(last)}。`;
    }catch{return''}
  };
  const V45721_GAP_MS=20*60*1000;
  function dayKey(ms){const value=finite(ms);if(value===null||value===undefined)return'';const date=new Date(value);return`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
  function significantRows(rows){
    const marks=new Set();
    for(let index=0;index<rows.length;index++){
      const cur=rows[index],prev=index>0?rows[index-1]:null;
      if(!prev){marks.add(index);continue}
      if(index>=rows.length-2){marks.add(index);continue}
      const curMs=finite(cur.message?.timeMs)??finite(cur.entry?.timeMs),prevMs=finite(prev.message?.timeMs)??finite(prev.entry?.timeMs);
      if(curMs!==null&&curMs!==undefined&&prevMs!==null&&prevMs!==undefined){
        if(Math.abs(curMs-prevMs)>=V45721_GAP_MS){marks.add(index);continue}
        if(dayKey(curMs)&&dayKey(curMs)!==dayKey(prevMs)){marks.add(index);continue}
      }
      const curMode=S(cur.message?.timelineMode||cur.entry?.timelineMode),prevMode=S(prev.message?.timelineMode||prev.entry?.timelineMode);
      if(curMode&&prevMode&&curMode!==prevMode){marks.add(index);continue}
      const curScene=S(cur.entry?.mode||''),prevScene=S(prev.entry?.mode||'');
      if(curScene&&prevScene&&curScene!==prevScene)marks.add(index);
    }
    return rows.filter((_,index)=>marks.has(index));
  }
  /* 供 app.js 历史映射使用：只在需要时给出一行短标签，其余返回空串。 */
  window.v45721TimeLabel=function(message,index,rows){
    try{
      const list=L(rows);if(!list.length)return'';
      /* V45.7.22：USER 声明过的状态若已过期，直接标在那条消息上。
         这样「我去睡了」不会再作为最新状态被继承，角色也就不会
         隔了一整夜还问「你不是要睡觉吗」。 */
      const expiry=stateExpiry(message,Date.now());
      const time=S(message?.worldTimeText||message?.timeContext?.text||message?.time||'');
      if(expiry)return time?`[${time}]${expiry} `:`${expiry} `;
      if(!time)return'';
      if(index>=list.length-2)return`[${time}] `;
      const prev=list[index-1];if(!prev)return`[${time}] `;
      const curMs=finite(message?.timeMs),prevMs=finite(prev?.timeMs);
      if(curMs!==null&&curMs!==undefined&&prevMs!==null&&prevMs!==undefined){
        if(Math.abs(curMs-prevMs)>=V45721_GAP_MS)return`[${time}] `;
        if(dayKey(curMs)&&dayKey(curMs)!==dayKey(prevMs))return`[${time}] `;
        return'';
      }
      const curMode=S(message?.timelineMode||message?.timeContext?.mode),prevMode=S(prev?.timelineMode||prev?.timeContext?.mode);
      if(curMode&&prevMode&&curMode!==prevMode)return`[${time}] `;
      return'';
    }catch{return''}
  };
  function buildTemporalContext(chatId=currentChat,{limit=100,maxChars=3200}={}){
    const rows=significantRows(temporalRows(chatId,limit));if(!rows.length)return'';
    /* V45.7.22：普通短聊不再出现这个区块。
       历史消息上的稀疏时间标签已经把「对话的形状」表达清楚了，
       这里只在真的存在跨日或长间隔断点时才补一份节点表，避免重复注入。 */
    const spans=[];
    for(let index=1;index<rows.length;index++){
      const cur=finite(rows[index].message?.timeMs)??finite(rows[index].entry?.timeMs);
      const prev=finite(rows[index-1].message?.timeMs)??finite(rows[index-1].entry?.timeMs);
      if(cur===null||cur===undefined||prev===null||prev===undefined)continue;
      if(Math.abs(cur-prev)>=6*60*60*1000||dayKey(cur)!==dayKey(prev))spans.push(index);
    }
    if(!spans.length)return'';
    const selected=[];let used=0;
    for(let index=rows.length-1;index>=0;index--){
      const {entry,message}=rows[index],time=S(message?.worldTimeText||message?.timeContext?.text||entry.worldTimeText||'时间未记录');
      const role=message?speakerFor(chatId,message):(entry.role==='user'?'USER':entry.speaker||'角色');
      const text=excerpt(message?.text??entry.text,80)||'（非文字记录）';
      const line=`- ${time} ${role}：${text}`;
      if(used+line.length>maxChars){if(selected.length)break;continue}selected.unshift(line);used+=line.length+1;
    }
    if(!selected.length)return'';
    return`【时间节点｜后台事实，不要复述】
只列出间隔较大或跨日的节点，用来判断“刚才、昨晚、睡了一觉、等了几小时”这类相对关系。旧状态不会自动延续到现在。不要向对方报时或解释这份记录。
${selected.join('\n')}`;
  }
  window.v45717BuildTemporalContext=buildTemporalContext;
  /* Other generators (动态、广场、语伴) ask the shared clock helper for
     “current time”. Give them the current clock plus the same durable history,
     so a side surface cannot silently forget that the previous node happened
     hours earlier. */
  const baseClockContext=window.v438TimeContext;
  if(typeof baseClockContext==='function'&&!baseClockContext.__v45717Temporal){
    const wrappedClock=function(chatId=currentChat){const current=S(baseClockContext.call(this,chatId));let inPrompt=false;try{inPrompt=Boolean(v438PromptChatId)}catch{}if(inPrompt)return current;const block=buildTemporalContext(chatId);return block?`${current}\n\n${block}`:current};
    wrappedClock.__v45717Temporal=true;window.v438TimeContext=wrappedClock;try{v438TimeContext=wrappedClock}catch{}
  }
  window.v45717FormatMessageTime=function(message,chatId){applyMessageTime(message,chatId);return S(message?.worldTimeText||message?.timeContext?.text||message?.time||'时间未记录')};

  function injectTemporalPrompt(base,chatId){
    const text=S(base),block=buildTemporalContext(chatId);if(!block||text.includes('【时间节点｜后台事实，不要复述】'))return text;
    const insertion=['\n\n【会话时间｜','\n\n【会话时间感｜','\n\n【执行原则】'].map(item=>text.indexOf(item)).filter(index=>index>=0);
    const at=insertion.length?Math.min(...insertion):text.length;
    return text.slice(0,at)+'\n\n'+block+text.slice(at);
  }

  /* Every shared context object receives the durable timeline. Main chat
     builders already expose it through their clock section; their fallback
     wrapper below detects that copy and does not duplicate it. */
  const baseEngine=window.buildEngineContext||((typeof buildEngineContext==='function')?buildEngineContext:null);
  if(baseEngine&&!baseEngine.__v45717Temporal){
    const wrappedEngine=function(...args){
      const result=baseEngine.apply(this,args),chatId=args[2]||currentChat;
      if(result&&typeof result==='object'){
        const block=buildTemporalContext(chatId);let inPrompt=false;try{inPrompt=Boolean(v438PromptChatId)}catch{}
        if(block){result.temporal=block;if(!inPrompt&&!S(result.state).includes('【时间节点｜后台事实，不要复述】'))result.state=`${S(result.state)}\n\n${block}`}
      }
      return result;
    };
    wrappedEngine.__v45717Temporal=true;window.buildEngineContext=wrappedEngine;try{buildEngineContext=wrappedEngine}catch{}
  }

  function wrapBuilder(name,chatIndex){
    const base=window[name];if(typeof base!=='function'||base.__v45717Temporal)return;
    const wrapped=function(...args){const chatId=args[chatIndex]||currentChat;return injectTemporalPrompt(base.apply(this,args),chatId)};
    wrapped.__v45717Temporal=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch{}
  }
  wrapBuilder('buildSystemPrompt',2);
  wrapBuilder('buildOfflineSystemPrompt',2);
  wrapBuilder('buildGroupSystemPrompt',3);

  /* Stamp USER messages at the moment sendMessage starts, and assistant
     messages after the response parser has advanced a virtual clock. */
  const baseCommit=window.commitAssistantReply;
  if(typeof baseCommit==='function'&&!baseCommit.__v45717Temporal){
    const wrappedCommit=function(chatId,raw,options={}){const indexes=baseCommit.apply(this,arguments)||[],key=canonical(chatId),snap=snapshot(key);for(const index of indexes){const message=L(data.chats?.[key])[index];if(message)applyMessageTime(message,key,snap,true)}syncChatTemporalHistory(key);try{save()}catch{}return indexes};
    wrappedCommit.__v45717Temporal=true;window.commitAssistantReply=wrappedCommit;try{commitAssistantReply=wrappedCommit}catch{}
  }
  const baseSend=window.sendMessage;
  if(typeof baseSend==='function'&&!baseSend.__v45717Temporal){
    const wrappedSend=async function(payload=null){
      const key=canonical(currentChat),before=L(data.chats?.[key]).length,snap=snapshot(key),pending={chatId:key,before,snapshot:snap};window.__v45717PendingSend=pending;let result;
      try{result=await baseSend.apply(this,arguments);return result}
      finally{
        const rows=L(data.chats?.[key]);
        rows.slice(before).forEach(message=>{if(message?.role==='user')applyMessageTime(message,key,snap,true);else applyMessageTime(message,key)});
        syncChatTemporalHistory(key);try{save()}catch{}if(window.__v45717PendingSend===pending)delete window.__v45717PendingSend;
      }
    };
    wrappedSend.__v45717Temporal=true;window.sendMessage=wrappedSend;try{sendMessage=wrappedSend}catch{}
  }

  /* Keep summary generation chronological as well, even when a caller asks
     for a compact summary after older turns have left the normal history
     window. The main transcript still remains the source of message text. */
  const baseSummary=window.refreshConversationSummary;
  if(typeof baseSummary==='function'&&!baseSummary.__v45717Temporal){
    const wrappedSummary=function(chatId,...args){syncChatTemporalHistory(chatId);return baseSummary.call(this,chatId,...args)};
    wrappedSummary.__v45717Temporal=true;window.refreshConversationSummary=wrappedSummary;try{refreshConversationSummary=wrappedSummary}catch{}
  }

  syncAllTemporalHistory();
})();

/* =========================================================
   POKEJI V45.7.21 · 世界书 DOCX / TXT 本地导入
   世界书是小手机自己的活人感 / 网聊感资料系统，只有它支持文件导入。
   世界规则页面不加任何导入入口，也不共用这里的数据。

   规则（用户已确认）：
   - 整份文件生成一个新的世界书条目；
   - 默认草稿 / 停用，由用户自己决定关键词、触发方式和绑定；
   - DOCX 只读取正文段落与标题层级，不读表格、图片；
   - TXT 保留正文换行与空行结构；
   - 不自动编造关键词、触发条件或绑定对象；
   - 全部本地解析，不上传文件，不调用任何 API；
   - 解析失败明确报错，绝不显示“导入成功”。
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45721WorldImport)return;
  window.__pokejiV45721WorldImport=true;

  const S=(value,fallback='')=>String(value??fallback);
  const say=(text)=>{try{if(typeof toast==='function')return toast(text)}catch{}try{console.log(text)}catch{}};

  /* 部分老 WebView 没有 TextDecoder（和当年缺 CSS.escape 一样）。
     这里给一个手写 UTF-8 解码兜底，保证导入不会因为环境缺失直接失败。 */
  const hasDecoder=(()=>{try{return typeof TextDecoder==='function'&&!!new TextDecoder('utf-8')}catch{return false}})();
  function decodeUtf8Manual(bytes){
    const view=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
    let out='',index=0;
    while(index<view.length){
      const byte=view[index++];
      if(byte<0x80){out+=String.fromCharCode(byte);continue}
      if(byte>=0xc0&&byte<0xe0&&index<view.length){
        out+=String.fromCharCode(((byte&0x1f)<<6)|(view[index++]&0x3f));continue;
      }
      if(byte>=0xe0&&byte<0xf0&&index+1<view.length){
        out+=String.fromCharCode(((byte&0x0f)<<12)|((view[index++]&0x3f)<<6)|(view[index++]&0x3f));continue;
      }
      if(byte>=0xf0&&index+2<view.length){
        const code=((byte&0x07)<<18)|((view[index++]&0x3f)<<12)|((view[index++]&0x3f)<<6)|(view[index++]&0x3f);
        const offset=code-0x10000;
        out+=String.fromCharCode(0xd800+(offset>>10),0xdc00+(offset&0x3ff));continue;
      }
      out+='\uFFFD';
    }
    return out;
  }
  function decodeWith(label,bytes,fatal){
    if(!hasDecoder){
      if(label&&!/^utf-?8$/i.test(label))throw Error('当前浏览器只能按 UTF-8 读取，请把文件另存为 UTF-8');
      return decodeUtf8Manual(bytes);
    }
    return new TextDecoder(label||'utf-8',fatal?{fatal:true}:undefined).decode(bytes);
  }

  /* ---------- TXT：UTF-8 / BOM 优先，失败再试常见中文编码 ---------- */
  function decodeText(bytes){
    const view=new Uint8Array(bytes);
    let body=view;
    if(view.length>=3&&view[0]===0xEF&&view[1]===0xBB&&view[2]===0xBF)body=view.subarray(3);
    if(view.length>=2&&view[0]===0xFF&&view[1]===0xFE)return decodeWith('utf-16le',view.subarray(2)).replace(/\r\n?/g,'\n');
    if(view.length>=2&&view[0]===0xFE&&view[1]===0xFF)return decodeWith('utf-16be',view.subarray(2)).replace(/\r\n?/g,'\n');
    let text='';
    try{text=decodeWith('utf-8',body,true)}
    catch{
      for(const label of ['gb18030','gbk','big5']){
        try{const attempt=decodeWith(label,body);if(attempt&&!/\uFFFD/.test(attempt.slice(0,4000))){text=attempt;break}}catch{}
      }
      if(!text)text=decodeWith('utf-8',body);
    }
    /* 统一换行，保留空行结构 */
    return text.replace(/\r\n?/g,'\n').replace(/\u0000/g,'');
  }

  /* ---------- DOCX：本地读 ZIP 中央目录，只取 word/document.xml ---------- */
  const u16=(view,at)=>view.getUint16(at,true);
  const u32=(view,at)=>view.getUint32(at,true);

  async function inflateRaw(bytes){
    if(window.pako&&typeof window.pako.inflateRaw==='function')return new Uint8Array(window.pako.inflateRaw(bytes));
    if(typeof DecompressionStream==='function'){
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    throw Error('当前浏览器无法解压 DOCX，请改用 TXT');
  }

  async function readDocumentXml(buffer){
    const bytes=new Uint8Array(buffer),view=new DataView(buffer);
    if(bytes.length<22||u32(view,0)!==0x04034b50)throw Error('这不是有效的 DOCX 文件');
    /* 找 End of central directory */
    let eocd=-1;
    for(let at=bytes.length-22;at>=0&&at>bytes.length-66000;at--){if(u32(view,at)===0x06054b50){eocd=at;break}}
    if(eocd<0)throw Error('DOCX 结构损坏，找不到目录');
    let cursor=u32(view,eocd+16);
    const count=u16(view,eocd+10);
    for(let index=0;index<count;index++){
      if(cursor+46>bytes.length||u32(view,cursor)!==0x02014b50)break;
      const flags=u16(view,cursor+8),method=u16(view,cursor+10),compressedSize=u32(view,cursor+20),
            nameLength=u16(view,cursor+28),extraLength=u16(view,cursor+30),commentLength=u16(view,cursor+32),
            localOffset=u32(view,cursor+42),name=decodeWith('utf-8',bytes.slice(cursor+46,cursor+46+nameLength));
      cursor+=46+nameLength+extraLength+commentLength;
      if(name!=='word/document.xml')continue;
      if(flags&1)throw Error('DOCX 有密码保护，无法导入');
      if(localOffset+30>bytes.length||u32(view,localOffset)!==0x04034b50)throw Error('DOCX 正文条目损坏');
      const localNameLength=u16(view,localOffset+26),localExtraLength=u16(view,localOffset+28),
            start=localOffset+30+localNameLength+localExtraLength,raw=bytes.slice(start,start+compressedSize);
      if(raw.length>32*1024*1024)throw Error('DOCX 正文超过 32MB，请拆分后导入');
      const content=method===0?raw:method===8?await inflateRaw(raw):null;
      if(!content)throw Error('DOCX 使用了不支持的压缩方式');
      return decodeWith('utf-8',content);
    }
    throw Error('DOCX 里找不到正文 word/document.xml');
  }

  function unescapeXml(text){
    return S(text).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
      .replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,code)=>String.fromCharCode(Number(code)))
      .replace(/&amp;/g,'&');
  }

  /* 只取正文段落与标题层级；表格与图片按规则跳过。 */
  function parseDocx(xml){
    const bodyMatch=S(xml).match(/<w:body[\s\S]*?<\/w:body>/);
    let body=bodyMatch?bodyMatch[0]:S(xml);
    /* 去掉表格块：不读取表格 */
    body=body.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g,'');
    const lines=[];
    const paragraphs=body.match(/<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)||[];
    for(const paragraph of paragraphs){
      const style=(paragraph.match(/<w:pStyle[^>]*w:val="([^"]*)"/)||[])[1]||'';
      let level=0;
      const heading=S(style).match(/^(?:Heading|heading|标题\s*)(\d)/)||S(style).match(/^[Hh](\d)$/);
      if(heading)level=Math.max(1,Math.min(6,Number(heading[1])||1));
      else if(/^(Title|标题)$/i.test(style))level=1;
      else if(/^Subtitle$/i.test(style))level=2;
      let text='';
      const chunks=paragraph.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>/g)||[];
      for(const chunk of chunks){
        if(/^<w:tab/.test(chunk)){text+='\t';continue}
        if(/^<w:br/.test(chunk)){text+='\n';continue}
        text+=unescapeXml(chunk.replace(/^<w:t(?:\s[^>]*)?>/,'').replace(/<\/w:t>$/,''));
      }
      text=text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trimEnd();
      if(!text.trim()){lines.push('');continue}
      lines.push(level?`${'#'.repeat(level)} ${text.trim()}`:text);
    }
    /* 合并多余空行，但保留段落之间的一个空行 */
    const out=[];
    for(const line of lines){
      if(!line&&!out.length)continue;
      if(!line&&!out[out.length-1])continue;
      out.push(line);
    }
    while(out.length&&!out[out.length-1])out.pop();
    return out.join('\n');
  }

  function baseName(name){return S(name).replace(/\.[^.]+$/,'').trim()||'导入的世界书'}

  /* ---------- 写入世界书数据（不碰 data.engine.worldRules） ---------- */
  function addWorldEntry(name,content,sourceLabel){
    const entry={
      id:'w_'+(typeof v44UUID==='function'?v44UUID():Date.now().toString(36)),
      name:S(name).slice(0,80),
      desc:content,
      mode:'all',
      scope:'global',
      targetIds:[],
      activation:'persistent',
      trigger:'',
      enabled:false,          /* 默认草稿 / 停用：由用户自己决定关键词、触发与绑定后再启用 */
      importedFrom:sourceLabel,
      importedAt:new Date().toISOString()
    };
    if(!Array.isArray(data.worlds))data.worlds=[];
    data.worlds.push(entry);
    try{save()}catch{}
    try{if(typeof renderWorld==='function')renderWorld()}catch{}
    return entry;
  }

  window.v45721ImportWorldFile=async function(event){
    const input=event?.target,file=input?.files&&input.files[0];
    if(!file)return;
    const name=S(file.name),extension=(name.match(/\.([^.]+)$/)||[])[1]?.toLowerCase()||'';
    try{
      if(file.size>40*1024*1024)throw Error('文件超过 40MB，请拆分后导入');
      let content='',label='';
      if(extension==='txt'){content=decodeText(await file.arrayBuffer());label='TXT'}
      else if(extension==='docx'){content=parseDocx(await readDocumentXml(await file.arrayBuffer()));label='DOCX'}
      else throw Error('只支持 .docx 和 .txt');
      if(!S(content).trim())throw Error(`${label} 里没有可读正文，未创建条目`);
      const entry=addWorldEntry(baseName(name),content,label);
      say(`已导入《${entry.name}》：${label} 正文 ${content.length} 字，默认停用`);
      if(typeof modal==='function'&&typeof editWorld==='function')editWorld(entry.id);
    }catch(error){
      const detail=S(error&&error.message||error)||'未知原因';
      say(`导入失败：${detail}`);
      try{console.warn('世界书导入失败：'+detail)}catch{}
    }finally{
      if(input)input.value='';
    }
  };

  /* ---------- 只在现有「世界书」页面顶部加一个小入口 ---------- */
  function mountEntry(){
    const view=document.getElementById('world');if(!view)return;
    const actions=view.querySelector('.header .actions');if(!actions)return;
    if(actions.querySelector('.v45721-world-import'))return;
    const label=document.createElement('label');
    label.className='icon-btn v45721-world-import';
    label.title='导入 DOCX / TXT 到世界书';
    label.setAttribute('aria-label','导入 DOCX 或 TXT 文件到世界书');
    label.innerHTML='⇧<input type="file" accept=".docx,.txt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onchange="v45721ImportWorldFile(event)">';
    actions.insertBefore(label,actions.firstChild);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountEntry,{once:true});
  else mountEntry();
  /* 视图重绘后补挂，只做存在性检查，不重排页面。
     用微任务合并，避免 V45.7.10 那种「观察者与写入互喂」的高频回调。 */
  let pending=false;
  const observer=new MutationObserver(()=>{
    if(pending)return;pending=true;
    queueMicrotask(()=>{pending=false;try{mountEntry()}catch{}});
  });
  try{observer.observe(document.body||document.documentElement,{childList:true,subtree:true})}catch{}
})();


/* =========================================================
   POKEJI V45.7.26 · 本轮新增（追加进现有文件，不新增文件）
   ① 清理拆成「清理记录」与「清理记忆」两栏
   ② 广场四种内容都带关注／发现二级切换
   ③ 广场生成内置平台风格提示词（带避嫌约束）
   ④ 广场主播与文游角色可转为人物页里的正式人物
   ⑤ 文游剧情角色／场景 NPC 生成、本作角色表、完结升级
   ⑥ 文游数值条与道具由 AI 按剧情生成
   ⑦ 文游横屏（橙光式 AVG 版式）／竖屏双模式
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45726)return;window.__pokejiV45726=true;
  const S=(v,f='')=>String(v??f),O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v),AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const NOW=()=>new Date().toISOString();
  const keep=()=>{try{save()}catch{}};
  const tell=t=>{try{toast(t)}catch{}};
  const num=v=>Number(v)||0;

  data.runtime=O(data.runtime);data.runtime.v45726=O(data.runtime.v45726);
  const rt=()=>{const r=data.runtime.v45726;r.squareView=O(r.squareView);return r};

  function personaNow(){try{return activePersonaFor(currentChat)}catch{return data.personas?.find(p=>p.id===data.activePersonaId)||data.personas?.[0]}}
  function socialState(){
    data.squareSocialV4571=O(data.squareSocialV4571);data.squareSocialV4571.personas=O(data.squareSocialV4571.personas);
    const id=personaNow()?.id||data.activePersonaId||'persona_default';
    const v=data.squareSocialV4571.personas[id]=O(data.squareSocialV4571.personas[id]);
    v.creators=L(v.creators);v.friends=L(v.friends);v.blocked=L(v.blocked);v.following=L(v.following);return v;
  }
  function squareStore(){
    data.squareV452=O(data.squareV452);data.squareV452.personas=O(data.squareV452.personas);
    const id=personaNow()?.id||data.activePersonaId||'persona_default';
    const v=data.squareV452.personas[id]=O(data.squareV452.personas[id]);
    for(const k of ['posts','shorts','longs','threads','drafts','viewHistory'])v[k]=L(v[k]);
    return v;
  }

  /* =======================================================
     ③ 平台风格提示词 · 只描述内容形态，明确避嫌
     ======================================================= */
  const SAFE_RULE=[
    '【内容边界｜必须遵守】',
    '一 只写日常、爱好、手作、学习、吃喝、宠物、旅行、影音书评、生活观察这类普通内容。',
    '二 不要出现真实平台名、真实公司名、真实公众人物、真实事件、真实地名以外的可指认信息。',
    '三 不涉及政治、宗教、民族、国家、领土、军事、灾难、暴力、色情、赌博、毒品、医疗诊断、投资建议、违法与灰产。',
    '四 不做人身攻击、不引战、不带脏话、不写擦边或性暗示、不写自伤内容。',
    '五 不写手机号、地址、身份证、账号密码等个人信息，出现的联系方式一律虚构且明显不可用。',
    '六 全部内容都是虚构的，不假装是真实新闻或真实爆料。'
  ].join('\n');
  const PLATFORM={
    feed:'【内容形态｜图文笔记】一到两句钩子开头，正文分短段，口语化，允许 emoji 与「｜」分隔，结尾三到六个话题标签。像生活方式社区里的图文笔记：探店、开箱、手作过程、学习方法、穿搭、食谱、收纳。标题短、具体、有画面。',
    short:'【内容形态｜短视频】一句抓人的开场白，正文是这条视频里实际发生的事，节奏快、口语、有转折或反差。结尾一句互动引导。配一句画面描述说明镜头里能看到什么。不要写运镜术语和脚本格式。',
    long:'【内容形态｜长视频】有正式标题和简介，分若干幕，每幕一个小标题加一段内容，像知识区、生活区或故事区的中长视频。整体有起承转合，最后一幕给结论或回味。不要伪造播放器、弹幕、进度条。',
    forum:'【内容形态｜论坛主题】一个明确的讨论标题，正文提出真实困惑、经验或对比，允许分点。语气像论坛长贴，会自问自答、会承认自己不确定。方便别人逐层回复。'
  };
  let styleKind='';
  const baseInvoke=window.invokeModel;
  if(typeof baseInvoke==='function'){
    window.invokeModel=function(kind,options={}){
      let opts=options;
      const extra=[];
      if(styleKind&&PLATFORM[styleKind])extra.push(PLATFORM[styleKind],SAFE_RULE);
      if(vnNarrative)extra.push(vnNarrative);
      if(extra.length)opts={...options,system:`${S(options.system)}\n\n${extra.join('\n\n')}`};
      return baseInvoke.call(this,kind,opts);
    };
    try{invokeModel=window.invokeModel}catch{}
  }
  function withStyle(kind,fn){styleKind=S(kind);try{const out=fn();if(out&&typeof out.finally==='function')return out.finally(()=>{styleKind=''});styleKind='';return out}catch(e){styleKind='';throw e}}
  for(const name of ['v4571GenerateSquareDiscovery','v4571GenerateSquareCreators']){
    const base=window[name];
    if(typeof base==='function')window[name]=function(...args){return withStyle(currentType(),()=>base.apply(this,args))};
  }

  /* =======================================================
     ② 广场：四种内容 × 关注／发现
     ======================================================= */
  const TYPES=[['feed','图文'],['short','短视频'],['long','长视频'],['forum','论坛']];
  const TYPE_KEYS=TYPES.map(t=>t[0]);
  function currentType(){const t=S(squareStore().tab||'short');return TYPE_KEYS.includes(t)?t:'short'}
  function viewOf(type){return rt().squareView[type]==='follow'?'follow':'find'}
  window.v45726SquareView=function(type,view){
    rt().squareView[S(type)]=view==='follow'?'follow':'find';keep();
    if(typeof v452SetSquareTab==='function')v452SetSquareTab(S(type));
    setTimeout(paintSquare,30);
  };
  window.v45726ToggleFollow=function(id){
    const st=socialState(),key=S(id);
    st.following=st.following.includes(key)?st.following.filter(x=>x!==key):[...st.following,key];
    keep();tell(st.following.includes(key)?'已关注':'已取消关注');setTimeout(paintSquare,20);
  };
  function followed(){return socialState().following}
  function itemAuthorId(item){return S(item.authorId||item.creatorId||item.authorToken||'')}
  function creatorName(id){const c=socialState().creators.find(x=>S(x.id)===S(id));return c?S(c.name):''}
  /* V45.7.28：关注与发现只做数据筛选，绝不替换四种内容的原渲染器。 */
  function rowsForType(type){
    const store=squareStore();
    return type==='feed'?L(store.posts):type==='short'?L(store.shorts):type==='long'?L(store.longs):L(store.threads);
  }
  function isFollowedItem(item){
    return !!item&&item.authorType!=='user'&&followed().includes(itemAuthorId(item));
  }
  function originalNodes(main,type){
    if(type==='feed')return [...main.querySelectorAll('.v452-discover-card')];
    if(type==='short')return [...main.querySelectorAll('.v452-short-card')];
    if(type==='long'){
      const mature=[...main.querySelectorAll('.v453-long-card')];
      return mature.length?mature:[...main.querySelectorAll('.v452-long-card')];
    }
    return [...main.querySelectorAll('.v452-thread-list>button')];
  }
  function applyOriginalFilter(main,type,view){
    for(const old of main.querySelectorAll(':scope > .v45728-square-filter-empty'))old.remove();
    const rows=rowsForType(type),nodes=originalNodes(main,type);
    let visible=0;
    nodes.forEach((node,index)=>{
      const show=view!=='follow'||isFollowedItem(rows[index]);
      node.hidden=!show;node.classList.toggle('v45728-filter-hidden',!show);
      if(show)visible++;
    });
    main.dataset.v45728Filter=`${type}:${view}`;
    if(view==='follow'&&nodes.length&&visible===0){
      const empty=document.createElement('div');
      empty.className='v452-square-empty v45728-square-filter-empty';
      const label=TYPES.find(row=>row[0]===type)?.[1]||'内容';
      empty.innerHTML=`<span>◇</span><b>关注的人还没有${E(label)}</b><p>这里只筛选原来的${E(label)}页面，不会改成另一套列表。可以先去「主播与私信」关注主播。</p>`;
      main.appendChild(empty);
    }
  }
  /* V45.7.27 修：广场一进就整页卡死。
     原因不是 z-index 也不是数据，是 MutationObserver ↔ innerHTML 互喂：
     回调里无条件写 seg.innerHTML → 产生新的 childList 记录 → 回调再跑，
     微任务队列永不为空，主线程被锁死（与 V45.7.10 的 API 页卡死是同一个坑）。
     三道闸：① 写入前先算目标 HTML，一致就不写（幂等）；
             ② 重入锁 painting；③ 写 DOM 期间断开 observer，写完吃掉自己造成的记录再接回。 */
  let squareObserver=null,painting=false,paintQueued=false;
  function setHTML(node,html){if(node&&node.innerHTML!==html){node.innerHTML=html;return true}return false}
  function paintSquareInner(){
    const body=document.querySelector('.v452-app-square');if(!body)return;
    const shell=body.querySelector(':scope > .v452-square');if(!shell||shell.classList.contains('v453-profile-shell'))return;
    const tabs=shell.querySelector(':scope > .v452-square-tabs');if(!tabs)return;
    const type=currentType(),view=viewOf(type);
    /* 页签按用户确认的顺序与叫法重排，onclick 仍走原函数 */
    const wanted=TYPES.map(([key,label])=>`<button class="${type===key?'on':''}" onclick="v452SetSquareTab('${key}')">${label}</button>`).join('');
    setHTML(tabs,wanted);tabs.dataset.v45726=type;
    /* 二级切换只占自己的固定行；原来的主播工具条和四种内容 DOM 都不动。 */
    let seg=shell.querySelector(':scope > .v45726-seg');
    if(!seg){seg=document.createElement('nav');seg.className='v45726-seg';tabs.after(seg)}
    shell.classList.add('v45728-square-filter-enabled');
    setHTML(seg,`<button class="${view==='follow'?'on':''}" onclick="v45726SquareView('${type}','follow')">关注</button>`
      +`<button class="${view==='find'?'on':''}" onclick="v45726SquareView('${type}','find')">发现</button>`
      +`<small>只筛选当前${E(TYPES.find(row=>row[0]===type)?.[1]||'内容')}</small>`);
    const main=shell.querySelector(':scope > .v452-square-view');if(!main)return;
    delete main.dataset.v45726;
    applyOriginalFilter(main,type,view);
  }
  function paintSquare(){
    if(painting)return;
    painting=true;
    try{squareObserver&&squareObserver.disconnect()}catch{}
    try{paintSquareInner()}catch(e){try{console.warn('v45726 paintSquare',e)}catch{}}
    finally{
      painting=false;
      try{if(squareObserver){squareObserver.takeRecords();squareObserver.observe(observerHost(),{childList:true,subtree:true})}}catch{}
    }
  }
  function schedulePaint(){
    if(paintQueued||painting)return;paintQueued=true;
    setTimeout(()=>{paintQueued=false;if(document.querySelector('.v452-app-square'))paintSquare()},60);
  }
  window.v45726PaintSquare=paintSquare;
  for(const name of ['v452SetSquareTab','v452OpenPhoneApp','v43OpenPhoneApp']){
    const base=window[name];
    if(typeof base==='function')window[name]=function(...args){const out=base.apply(this,args);schedulePaint();return out};
  }
  function observerHost(){return document.getElementById('modalContent')||document.body}
  try{
    squareObserver=new MutationObserver(()=>{if(!painting&&document.querySelector('.v452-app-square'))schedulePaint()});
    squareObserver.observe(observerHost(),{childList:true,subtree:true});
  }catch{}

  window.v45726FollowGenerate=async function(type){
    const creators=socialState().creators.filter(c=>followed().includes(S(c.id)));
    if(!creators.length)return tell('还没有关注任何主播，可以先去发现页关注');
    if(typeof validModel==='function'&&!validModel('feed')&&!validModel('chat'))return tell('请先配置广场生成或主聊天线路');
    const who=creators[Math.floor(Math.random()*creators.length)],label=TYPES.find(t=>t[0]===type)?.[1]||'内容';
    tell(`${who.name}正在准备一条${label}…`);
    const controller=typeof withTimeout==='function'?withTimeout(num(data.settings.timeout)||60000):{signal:undefined};
    try{
      const raw=await withStyle(type,()=>invokeModel(validModel('feed')?'feed':'chat',{
        system:`你现在是广场里的内容创作者「${who.name}」（@${S(who.handle||'creator')}），领域是${S(who.niche||'生活')}。简介：${S(who.bio||'')}。\n只输出 JSON：{"title":"标题","content":"正文","visual":"这条内容的画面描述","tags":["标签"]}。不要输出解释。`,
        history:[{role:'user',content:`按你自己的性格和领域，发一条${label}。`}],
        temperature:num(data.settings.temperature)||.9,maxTokens:900,signal:controller.signal
      }));
      const text=typeof stripReplyTags==='function'?stripReplyTags(S(raw)):S(raw);
      let obj={};try{obj=JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||'{}')}catch{}
      const item={id:ID('square'),authorType:'creator',authorId:S(who.id),authorName:S(who.name),
        title:S(obj.title||`${who.name}的${label}`),content:S(obj.content||text).slice(0,2000),
        summary:S(obj.content||'').slice(0,140),article:S(obj.content||''),visual:S(obj.visual||''),
        tags:L(obj.tags).map(S).slice(0,6),likes:0,shares:0,views:0,comments:[],createdAt:NOW()};
      const store=squareStore();
      if(type==='feed')store.posts.unshift(item);
      else if(type==='short')store.shorts.unshift(item);
      else if(type==='long'){item.chapters=[{title:'第 1 幕',text:item.content}];store.longs.unshift(item)}
      else store.threads.unshift({...item,board:'综合讨论'});
      keep();
      try{if(typeof window.v452SetSquareTab==='function')window.v452SetSquareTab(type)}catch{}
      setTimeout(paintSquare,80);tell(`${who.name}发了一条${label}`);
    }catch(error){tell(error?.name==='AbortError'?'生成已取消':'这条内容没生成成功')}
    finally{try{releaseController(controller)}catch{}}
  };

  /* =======================================================
     ④ 转为人物页里的正式人物（广场主播与文游角色共用）
     ======================================================= */
  let draft=null;
  window.v45726Promote=async function(kind,id){
    const src=kind==='creator'?creatorSource(id):castSource(id);
    if(!src)return tell('找不到这个对象');
    if(typeof validAPI==='function'&&!validAPI())return tell('请先配置主聊天模型');
    tell('正在整理资料草稿…');
    const controller=typeof withTimeout==='function'?withTimeout(num(data.settings.timeout)||60000):{signal:undefined};
    try{
      const raw=await invokeModel('chat',{
        system:`把下面这个对象整理成一份可以直接用的人物资料。只输出 JSON：{"name":"聊天里叫的名字","relation":"身份与关系","personality":"性格与说话方式","impression":"写进记忆的初始印象"}。\n资料必须只依据给出的来源，不要编造没有依据的经历。${SAFE_RULE}`,
        history:[{role:'user',content:src.brief}],temperature:.7,maxTokens:700,signal:controller.signal});
      const text=typeof stripReplyTags==='function'?stripReplyTags(S(raw)):S(raw);
      let obj={};try{obj=JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||'{}')}catch{}
      draft={kind,id,source:src.label,name:S(obj.name||src.name),relation:S(obj.relation||''),personality:S(obj.personality||''),impression:S(obj.impression||'')};
      promoteEditor();
    }catch(error){tell(error?.name==='AbortError'?'已取消':'草稿没生成成功，可以手动填写');draft={kind,id,source:src.label,name:src.name,relation:'',personality:'',impression:''};promoteEditor()}
    finally{try{releaseController(controller)}catch{}}
  };
  function creatorSource(id){
    const st=socialState(),c=st.creators.find(x=>S(x.id)===S(id));if(!c)return null;
    const dm=L(O(st.threads)[S(id)]).length;
    return {name:S(c.name),label:`广场主播 · ${S(c.name)}（@${S(c.handle||'creator')}）`,
      brief:`来源：广场主播。昵称：${S(c.name)}。账号：@${S(c.handle||'')}。领域：${S(c.niche||'')}。简介：${S(c.bio||'')}。与我的关系：${st.friends.includes(S(id))?'已经是好友':'只关注过'}，广场私信 ${dm} 条。`};
  }
  function castSource(id){
    for(const g of L(data.visualNovelsV4571?.games)){
      const row=L(g.stage?.cast).find(x=>S(x.id)===S(id));
      if(row)return {name:S(row.name),label:`文游《${S(g.title)}》· ${row.kind==='npc'?'场景 NPC':'剧情角色'}`,
        brief:`来源：文游《${S(g.title)}》，身份是${row.kind==='npc'?'场景 NPC':'剧情角色'}。名字：${S(row.name)}。设定：${S(row.brief)}。第 ${num(row.act)||1} 幕登场，共 ${num(row.lines)} 句对白。这部文游的开局：${S(g.premise)}`};
    }
    return null;
  }
  function promoteEditor(){
    if(!draft)return;
    modal(`<div class="v45726-draft"><h2>转为正式人物</h2>
      <div class="v45726-source"><b>来源：${E(draft.source)}</b><span>确认后写进人物页，出现在聊天列表里可以直接私聊，也能进群聊与虚拟手机联系人。原来的身份和记录都保留。</span></div>
      <div class="field"><label>名字</label><input id="v45726Name" value="${AT(draft.name)}"></div>
      <div class="field"><label>身份与关系</label><textarea id="v45726Relation" style="min-height:76px">${E(draft.relation)}</textarea></div>
      <div class="field"><label>性格与说话方式</label><textarea id="v45726Personality" style="min-height:96px">${E(draft.personality)}</textarea></div>
      <div class="field"><label>初始印象（写进记忆）</label><textarea id="v45726Impression" style="min-height:66px">${E(draft.impression)}</textarea></div>
      <div class="note">不确认就不写入，也不会先建一个空人物。</div>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45726PromoteSave()">确认写入</button></div></div>`);
  }
  window.v45726PromoteSave=function(){
    if(!draft)return;
    const name=S(document.getElementById('v45726Name')?.value).trim();
    if(!name)return tell('请填写名字');
    const relation=S(document.getElementById('v45726Relation')?.value).trim();
    const personality=S(document.getElementById('v45726Personality')?.value).trim();
    const impression=S(document.getElementById('v45726Impression')?.value).trim();
    data.characters=L(data.characters);
    const person={id:ID('char'),name,description:relation,personality,
      bio:relation,createdAt:NOW(),origin:draft.source,originKind:draft.kind};
    data.characters.unshift(person);
    if(impression){
      data.memories=L(data.memories);
      data.memories.unshift({id:ID('memory'),characterId:person.id,personaId:personaNow()?.id||'',
        text:impression,source:draft.source,createdAt:NOW()});
    }
    if(draft.kind==='cast'){
      for(const g of L(data.visualNovelsV4571?.games)){
        const row=L(g.stage?.cast).find(x=>S(x.id)===S(draft.id));
        if(row){row.promotedTo=person.id;break}
      }
    }
    keep();draft=null;closeModal();
    try{renderCharacters?.()}catch{}
    try{renderChats?.()}catch{}
    tell(`${name}已写进人物页`);
  };
  /* 主播卡上补一个转正式入口：只在已是好友时出现
     V45.7.27 修：这里原本也是「observer 无条件写 innerHTML」的互喂结构，
     打开广场关系页同样会锁死主线程。改成幂等写入＋重入锁＋写前断开 observer。 */
  let cardObserver=null,cardPainting=false,cardQueued=false;
  function paintCreatorCardsInner(){
    for(const card of document.querySelectorAll('.v4571-creator-card')){
      const btn=card.querySelector('footer button[onclick*="v4571ToggleCreatorFriend"]');
      const idMatch=S(btn?.getAttribute('onclick')).match(/'([^']+)'|decodeURIComponent\('([^']*)'\)/);
      let cid='';try{cid=decodeURIComponent(S(idMatch?.[2]??idMatch?.[1]))}catch{cid=S(idMatch?.[2]??idMatch?.[1])}
      const isFriend=/已是好友/.test(S(btn?.textContent));
      let row=card.querySelector(':scope > .v45726-promote');
      if(isFriend&&cid){
        if(!row){row=document.createElement('div');row.className='v45726-promote';card.appendChild(row)}
        const on=followed().includes(cid);
        setHTML(row,`<p><b>转为正式人物</b>可以继续在广场里私信，也可以写进人物页、在聊天里正式私聊。</p>`
          +`<button onclick="v45726ToggleFollow(${A(cid)})">${on?'已关注':'关注'}</button>`
          +`<button class="primary" onclick="v45726Promote('creator',${A(cid)})">转为正式</button>`);
      }else if(row)row.remove();
    }
  }
  function paintCreatorCards(){
    if(cardPainting)return;
    cardPainting=true;
    try{cardObserver&&cardObserver.disconnect()}catch{}
    try{paintCreatorCardsInner()}catch(e){try{console.warn('v45726 creatorCards',e)}catch{}}
    finally{
      cardPainting=false;
      try{if(cardObserver){cardObserver.takeRecords();cardObserver.observe(observerHost(),{childList:true,subtree:true})}}catch{}
    }
  }
  try{
    cardObserver=new MutationObserver(()=>{
      if(cardPainting||cardQueued||!document.querySelector('.v4571-creator-card'))return;
      cardQueued=true;setTimeout(()=>{cardQueued=false;paintCreatorCards()},60);
    });
    cardObserver.observe(observerHost(),{childList:true,subtree:true});
  }catch{}

  /* =======================================================
     ⑤⑥⑦ 文游：角色表、AI 生成数值与道具、横竖屏
     ======================================================= */
  const vnGames=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  function vnGame(id){return vnGames().find(g=>S(g.id)===S(id||data.visualNovelsV4571?.activeId))||null}
  function vnStage(id){
    const g=vnGame(id);if(!g)return null;
    g.stage=O(g.stage);g.stage.stats=L(g.stage.stats);g.stage.items=L(g.stage.items);
    g.stage.saves=L(g.stage.saves);g.stage.cast=L(g.stage.cast);
    g.stage.orient=g.stage.orient==='landscape'?'landscape':'portrait';
    return g.stage;
  }
  let vnNarrative='';
  const NARRATIVE=[
    '【叙事要求｜视觉小说，不是聊天】',
    '一 每一幕都要有完整的场景：先交代环境（光线、声音、气味、温度、周围有什么人在做什么），再写人物的动作与身体细节，再写对白，最后落到当下的心理或余味。',
    '二 对白要带说话时的动作、停顿和语气，不要连续甩台词。旁白与对白的比例接近，不要整幕只有对话。',
    '三 用长句和短句交替，段落之间留出呼吸。不要写成「角色：台词」的剧本格式，也不要写成聊天气泡。',
    '四 选项是这一刻真的能做出的具体行动或话，四个方向要有明显差别，不要都是同一种态度的换句话说。',
    '五 只推进到下一个有意义的节点就停，不要一幕写完整个故事。'
  ].join('\n');
  function vnActive(){try{return !!document.querySelector('#v4571VNRoot .v4571-vn-player, .v4571-vn-player')}catch{return false}}

  /* --- 横屏／竖屏 ---
     V45.7.27 重做。上一版为什么「横竖屏一模一样」：
     样式全写在 .v4571-vn-scene / .v4571-vn-player 这套类名上，
     但 v45.7.12 的 repaint 会把 root.innerHTML 整个换成 .v45712-vn-* 版式，
     那些元素在运行时根本不存在 → 19 条规则 0 条命中。
     现在：① 样式改挂真实类名；② 竖屏设备也要真的看到横屏，
     先试 screen.orientation.lock('landscape')，锁不上就把舞台旋转 90°。 */
  let orientObserver=null,orientBusy=false,orientQueued=false;
  window.v45726VNOrient=function(id,mode){
    const stage=vnStage(id);if(!stage)return;
    stage.orient=mode==='landscape'?'landscape':mode==='portrait'?'portrait':(stage.orient==='landscape'?'portrait':'landscape');
    keep();
    if(stage.orient==='landscape'){
      void lockLandscape().then(locked=>{
        applyOrient();
        tell(locked?'已切到横屏 · 视觉小说版式':'已切到横屏 · 请把手机横过来看');
      });
    }else{
      unlockOrientation();applyOrient();tell('已切回竖屏');
    }
  };
  async function lockLandscape(){
    try{
      const so=screen&&screen.orientation;
      if(!so||typeof so.lock!=='function')return false;
      const el=document.getElementById('phone')||document.documentElement;
      if(!document.fullscreenElement&&el.requestFullscreen){try{await el.requestFullscreen()}catch{}}
      await so.lock('landscape');
      return true;
    }catch{return false}
  }
  function unlockOrientation(){
    try{screen&&screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch{}
  }
  /* 竖屏设备上把舞台整体转 90°，宽高互换后内部就是真正的宽幅画面 */
  function sizeRotation(shell,land){
    if(!shell)return;
    if(!land){
      if(shell.dataset.rot!=='0'){shell.dataset.rot='0';shell.style.removeProperty('width');shell.style.removeProperty('height')}
      return;
    }
    const host=document.getElementById('screen')||document.getElementById('phone')||document.documentElement;
    const w=Math.round(host.clientWidth||window.innerWidth||360);
    const h=Math.round(host.clientHeight||window.innerHeight||640);
    if(w>=h){/* 设备已经是横的，不需要旋转 */
      if(shell.dataset.rot!=='0'){shell.dataset.rot='0';shell.style.removeProperty('width');shell.style.removeProperty('height')}
      return;
    }
    const want=`${h}px`,wantH=`${w}px`;
    if(shell.dataset.rot!=='90')shell.dataset.rot='90';
    if(shell.style.width!==want)shell.style.width=want;
    if(shell.style.height!==wantH)shell.style.height=wantH;
  }
  function applyOrient(){
    if(orientBusy)return;
    orientBusy=true;
    try{orientObserver&&orientObserver.disconnect()}catch{}
    try{applyOrientInner()}catch(e){try{console.warn('v45726 applyOrient',e)}catch{}}
    finally{
      orientBusy=false;
      try{if(orientObserver){orientObserver.takeRecords();orientObserver.observe(document.body,{childList:true,subtree:true})}}catch{}
    }
  }
  function applyOrientInner(){
    const g=vnGame();if(!g)return;
    const stage=vnStage(g.id);if(!stage)return;
    const root=document.getElementById('v4571VNRoot');if(!root)return;
    const land=stage.orient==='landscape';
    const view=document.getElementById('visualNovel');
    for(const node of [root,view])if(node&&node.classList.contains('v45726-vn-land')!==land)node.classList.toggle('v45726-vn-land',land);
    if(document.documentElement.classList.contains('v45726-vn-land-on')!==land)document.documentElement.classList.toggle('v45726-vn-land-on',land);
    const shell=root.querySelector('.v45712-vn-shell');
    sizeRotation(shell,land);
    /* 常驻切换按钮：幂等，textContent 一致就不写，否则会自己喂 observer */
    let btn=root.querySelector(':scope > .v45726-vn-orient');
    if(!btn){
      btn=document.createElement('button');btn.className='v45726-vn-orient';
      btn.setAttribute('aria-label','切换横竖屏');root.appendChild(btn);
    }
    const label=land?'竖':'横';
    if(btn.textContent!==label)btn.textContent=label;
    btn.onclick=e=>{e.stopPropagation();window.v45726VNOrient(g.id)};
    /* 横屏时输入框藏起来（CSS），补一个「自己写」按钮走正向浮层 */
    const box=root.querySelector('.v45712-vn-box');
    const custom=root.querySelector('.v45712-vn-custom');
    let say=root.querySelector('.v45726-vn-saybtn');
    if(land&&box&&custom){
      if(!say){say=document.createElement('button');say.className='v45726-vn-saybtn';say.textContent='✎ 自己写一个选择';custom.after(say)}
      say.onclick=e=>{e.stopPropagation();window.v45726VNSay(g.id)};
    }else if(say)say.remove();
  }
  window.v45726ApplyVNOrient=applyOrient;
  const baseRepaint=window.v45712VNRepaint;
  if(typeof baseRepaint==='function'){
    window.v45712VNRepaint=function(...args){const out=baseRepaint.apply(this,args);setTimeout(applyOrient,10);return out};
  }
  function scheduleOrient(){
    if(orientQueued||orientBusy)return;orientQueued=true;
    setTimeout(()=>{orientQueued=false;if(document.querySelector('#v4571VNRoot .v45712-vn-shell,.v4571-vn-player'))applyOrient()},60);
  }
  try{
    orientObserver=new MutationObserver(()=>{if(!orientBusy)scheduleOrient()});
    orientObserver.observe(document.body,{childList:true,subtree:true});
  }catch{}
  try{
    window.addEventListener('resize',scheduleOrient);
    window.addEventListener('orientationchange',()=>setTimeout(scheduleOrient,120));
  }catch{}
  /* 横屏时输入不放在旋转层里打字，改成弹一个正向浮层 */
  window.v45726VNSay=function(id){
    const g=vnGame(id);if(!g)return;
    modal(`<div class="v45726-vn-say"><h2>自己决定下一步</h2>
      <div class="note compact">写你要做的事或要说的话，这一幕会顺着它往下走。</div>
      <textarea id="v45726VNSayText" placeholder="推开门，先看清屋里有几个人…"></textarea>
      <div class="form-actions"><button onclick="closeModal()">取消</button>
        <button class="primary" onclick="v45726VNSaySend()">继续</button></div></div>`);
    setTimeout(()=>{try{document.getElementById('v45726VNSayText')?.focus()}catch{}},80);
  };
  window.v45726VNSaySend=function(){
    const text=S(document.getElementById('v45726VNSayText')?.value).trim();
    if(!text)return tell('还没写内容');
    closeModal();
    const input=document.getElementById('v4571VNCustomChoice');
    if(input){input.value=text;try{return window.v4571CustomVNChoice()}catch{}}
    try{return window.v4571ChooseVN(text)}catch{}
  };

  /* --- AI 生成数值条与道具 --- */
  window.v45726VNAutoStats=async function(id,silent){
    const g=vnGame(id),stage=vnStage(id);if(!g||!stage)return;
    if(typeof validAPI==='function'&&!validAPI()){if(!silent)tell('请先配置主聊天模型');return}
    if(!silent)tell('正在按剧情设计数值条与初始道具…');
    const controller=typeof withTimeout==='function'?withTimeout(num(data.settings.timeout)||60000):{signal:undefined};
    try{
      const scenes=L(g.scenes).slice(-2).map(s=>S(s.text||s.body||'')).join('\n').slice(0,1200);
      const raw=await invokeModel('chat',{
        system:`你在为一部视觉小说设计仪表盘。依据它的题材与开局，决定这部作品真正需要哪些数值，以及主角开场会带着哪些道具。\n只输出 JSON：{"stats":[{"name":"名称","cur":数字,"max":数字,"reason":"为什么需要这条"}],"items":[{"name":"道具名","glyph":"一个符号","desc":"它是什么、能做什么","count":数字}]}\n规则：数值最多四条，可以零条（纯剧情向就返回空数组）；名称贴合题材，不要一律生命值精神值；道具最多六件，必须是这个开局里主角合理会有的东西。${SAFE_RULE}`,
        history:[{role:'user',content:`标题：${S(g.title)}\n开局：${S(g.premise)}\n发展方向：${S(g.direction||'未指定')}\n已发生：${scenes||'还没开始'}`}],
        temperature:.8,maxTokens:900,signal:controller.signal});
      const text=typeof stripReplyTags==='function'?stripReplyTags(S(raw)):S(raw);
      let obj={};try{obj=JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||'{}')}catch{}
      const SW=['#c96a5e','#7d94c0','#8fae95','#c9a05e'];
      const stats=L(obj.stats).slice(0,4).map((s,i)=>{
        const max=Math.max(1,num(s.max)||100);
        return {id:ID('stat'),name:S(s.name||`数值${i+1}`).slice(0,8),max,cur:Math.max(0,Math.min(max,num(s.cur))),color:SW[i%SW.length],reason:S(s.reason||'')};
      });
      const items=L(obj.items).slice(0,6).map(it=>({id:ID('item'),name:S(it.name||'道具').slice(0,10),
        glyph:S(it.glyph||'◈').slice(0,2),desc:S(it.desc||''),count:Math.max(1,num(it.count)||1),usable:true,fromAI:true}));
      if(stats.length){stage.stats=stats;stage.statPreset='ai'}else{stage.stats=[];stage.statPreset='none'}
      if(items.length)stage.items=[...items,...L(stage.items).filter(x=>!x.fromAI)];
      stage.statsAuto=true;keep();
      try{window.v45712VNRepaint?.()}catch{}
      if(!silent)tell(stats.length?`已生成 ${stats.length} 条数值、${items.length} 件道具`:'这部按纯剧情向处理，不显示数值条');
    }catch(error){if(!silent)tell(error?.name==='AbortError'?'已取消':'没生成成功，可以手动设置')}
    finally{try{releaseController(controller)}catch{}}
  };
  const baseNewVN=window.v4571SaveNewVN;
  if(typeof baseNewVN==='function'){
    window.v4571SaveNewVN=function(...args){
      const out=baseNewVN.apply(this,args);
      setTimeout(()=>{const g=vnGame();if(g&&!vnStage(g.id)?.statsAuto)void window.v45726VNAutoStats(g.id,true)},900);
      return out;
    };
  }

  /* --- 剧情角色 / 场景 NPC --- */
  window.v45726VNCast=function(id){
    const g=vnGame(id),stage=vnStage(id);if(!g||!stage)return;
    const roles=stage.cast.filter(x=>x.kind!=='npc'),npcs=stage.cast.filter(x=>x.kind==='npc');
    const row=x=>`<article class="v45726-role ${x.kind==='npc'?'is-npc':''}">
      <span>${E(S(x.name||'？').slice(0,1))}</span>
      <div><b>${E(x.name)}</b><small>${x.promotedTo?'已成为正式人物 · ':''}第 ${num(x.act)||1} 幕登场 · ${num(x.lines)} 句对白<br>${E(S(x.brief).slice(0,60))}</small></div>
      <i class="${x.kind==='npc'?'npc':''}">${x.kind==='npc'?'NPC':'剧情角色'}</i></article>`;
    modal(`<div class="v45726-vn-cast"><h2>本作人物</h2>
      <div class="note">《${E(g.title)}》· ${L(g.scenes).length} 幕。这里的人只存在这次文游的存档里，跟着存档保存与读取，不写世界书、不自动变正式人物。</div>
      <div class="v45726-vn-gen">
        <button onclick="v45726VNMakeCast(${A(g.id)},'role')"><span>◈</span><div><b>生成剧情角色</b><small>有名有姓、会反复出现、有对白</small></div><i>›</i></button>
        <button onclick="v45726VNMakeCast(${A(g.id)},'npc')"><span>◌</span><div><b>生成场景 NPC</b><small>店主、路人、守卫这类功能性配角</small></div><i>›</i></button>
      </div>
      <div class="v45726-roster-title"><b>剧情角色</b><small>${roles.length} 位</small></div>
      ${roles.map(row).join('')||'<div class="note compact">还没有本作生成的剧情角色。</div>'}
      <div class="v45726-roster-title"><b>场景 NPC</b><small>${npcs.length} 位</small></div>
      ${npcs.map(row).join('')||'<div class="note compact">还没有场景 NPC。</div>'}
      <div class="form-actions"><button onclick="v45726VNEnding(${A(g.id)})">完结并挑选留下的人</button><button class="primary" onclick="closeModal()">完成</button></div></div>`);
  };
  window.v45726VNMakeCast=async function(id,kind){
    const g=vnGame(id),stage=vnStage(id);if(!g||!stage)return;
    if(typeof validAPI==='function'&&!validAPI())return tell('请先配置主聊天模型');
    tell(kind==='npc'?'正在生成这一幕的配角…':'正在生成剧情角色…');
    const controller=typeof withTimeout==='function'?withTimeout(num(data.settings.timeout)||60000):{signal:undefined};
    try{
      const scenes=L(g.scenes).slice(-2).map(s=>S(s.text||s.body||'')).join('\n').slice(0,1200);
      const known=stage.cast.map(x=>S(x.name)).join('、')||'无';
      const raw=await invokeModel('chat',{
        system:kind==='npc'
          ?`为当前这一幕生成一位场景 NPC：店主、路人、守卫、服务生这类功能性配角，只服务这一幕，不需要复杂背景。只输出 JSON：{"name":"称呼","brief":"他是谁、在做什么、说话什么调子"}。${SAFE_RULE}`
          :`为这部视觉小说生成一位剧情角色：有名有姓、会反复出现、有自己的立场和对白。只输出 JSON：{"name":"姓名","brief":"身份、与主角的关系、动机、说话方式"}。${SAFE_RULE}`,
        history:[{role:'user',content:`标题：${S(g.title)}\n开局：${S(g.premise)}\n发展方向：${S(g.direction||'未指定')}\n已有人物：${known}\n最近剧情：${scenes||'刚开局'}`}],
        temperature:.9,maxTokens:600,signal:controller.signal});
      const text=typeof stripReplyTags==='function'?stripReplyTags(S(raw)):S(raw);
      let obj={};try{obj=JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||'{}')}catch{}
      const person={id:ID(kind==='npc'?'vnnpc':'vnrole'),kind:kind==='npc'?'npc':'role',
        name:S(obj.name||(kind==='npc'?'路人':'新角色')).slice(0,12),brief:S(obj.brief||text).slice(0,400),
        act:L(g.scenes).length||1,lines:0,createdAt:NOW()};
      stage.cast=[...stage.cast,person];keep();
      window.v45726VNCast(g.id);
      tell(`${person.name}已加入本作人物`);
    }catch(error){tell(error?.name==='AbortError'?'已取消':'没生成成功')}
    finally{try{releaseController(controller)}catch{}}
  };
  window.v45726VNEnding=function(id){
    const g=vnGame(id),stage=vnStage(id);if(!g||!stage)return;
    const rows=stage.cast.filter(x=>!x.promotedTo);
    if(!rows.length)return tell('这部文游还没有可以留下的人物');
    modal(`<div class="v45726-vn-ending"><h2>《${E(g.title)}》完结</h2>
      <div class="note">${L(g.scenes).length} 幕，${rows.filter(x=>x.kind!=='npc').length} 位剧情角色，${rows.filter(x=>x.kind==='npc').length} 位场景 NPC。要把谁留下来，成为人物页里的正式人物？配角也可以留。</div>
      <div class="v45726-pick">${rows.map(x=>`<label><input type="checkbox" class="v45726-pick-one" value="${AT(x.id)}" ${x.kind!=='npc'?'checked':''}>
        <div><b>${E(x.name)}</b><small>${E(S(x.brief).slice(0,70))}</small></div>
        <i class="${x.kind==='npc'?'npc':''}">${x.kind==='npc'?'NPC':'剧情角色'}</i></label>`).join('')}</div>
      <div class="note compact">选完之后逐个生成资料草稿、逐个确认写入，中途可以放弃剩下的。不选就什么都不写入，存档照旧保留。</div>
      <div class="form-actions"><button onclick="closeModal()">都不留</button><button class="primary" onclick="v45726VNEndingRun()">生成草稿</button></div></div>`);
  };
  let promoteQueue=[];
  window.v45726VNEndingRun=function(){
    promoteQueue=[...document.querySelectorAll('.v45726-pick-one:checked')].map(x=>x.value);
    if(!promoteQueue.length)return tell('还没有勾选任何人');
    closeModal();nextPromote();
  };
  function nextPromote(){const id=promoteQueue.shift();if(!id)return tell('已处理完');void window.v45726Promote('cast',id)}
  const basePromoteSave=window.v45726PromoteSave;
  window.v45726PromoteSave=function(){const out=basePromoteSave.apply(this,arguments);if(promoteQueue.length)setTimeout(nextPromote,400);return out};
  /* 文游菜单里补两个入口 */
  const baseVNMenu=window.v4571VNMenu;
  if(typeof baseVNMenu==='function'){
    window.v4571VNMenu=function(...args){
      const out=baseVNMenu.apply(this,args);
      setTimeout(()=>{
        const box=document.querySelector('#modalContent .about-meta, #modalContent .v4571-vn-menu, #modalContent');
        const g=vnGame();if(!box||!g||box.querySelector('.v45726-menu-row'))return;
        const wrap=document.createElement('div');wrap.className='v45726-menu-row';
        wrap.innerHTML=`<button onclick="closeModal();v45726VNCast(${A(g.id)})">本作人物 · 生成剧情角色与 NPC</button>
          <button onclick="v45726VNAutoStats(${A(g.id)})">让 AI 重新设计数值与道具</button>
          <button onclick="closeModal();v45726VNOrient(${A(g.id)})">切换横屏／竖屏</button>`;
        box.appendChild(wrap);
      },40);
      return out;
    };
  }
  /* 文游进行中给场景生成注入叙事要求 */
  for(const name of ['v4571ChooseVN','v4571CustomVNChoice','v4571RegenerateVNScene','v45712Say','v45712AddNarration']){
    const base=window[name];
    if(typeof base==='function')window[name]=function(...args){
      vnNarrative=NARRATIVE;
      const done=()=>{vnNarrative=''};
      try{const out=base.apply(this,args);
        if(out&&typeof out.finally==='function')return out.finally(done);
        setTimeout(done,4000);return out;
      }catch(e){done();throw e}
    };
  }

  /* =======================================================
     ① 清理记录 / 清理记忆
     ======================================================= */
  let wipeTab='record',wipeChat='';
  function chatCharacter(chatId){
    try{const parsed=parsePersonaThreadId(chatId);if(parsed?.kind==='direct')return data.characters.find(c=>c.id===parsed.entityId)||null}catch{}
    try{return directCharacterForChat(chatId)||null}catch{return null}
  }
  function countMode(chatId,mode){
    return L(data.chats?.[chatId]).filter(m=>{
      if(!m)return false;
      if(mode==='offline')return m.mode==='offline';
      if(mode==='online')return m.mode!=='offline';
      return true;
    }).length;
  }
  function groupChatIds(person){
    const persona=personaNow();
    return L(data.groups).filter(g=>L(g.memberIds).includes(person?.id))
      .map(g=>{try{return groupChatId(g.id,persona?.id)}catch{return ''}}).filter(Boolean);
  }
  function phoneCount(person){
    let n=0;
    try{const store=O(data.simPhones);
      for(const key of Object.keys(store)){
        const owner=O(store[key]);n+=L(owner.items).length;
      }
    }catch{}
    return n;
  }
  function memoryRows(person){
    const persona=personaNow();
    return L(data.memories).filter(m=>m&&S(m.characterId)===S(person?.id)&&(!m.personaId||S(m.personaId)===S(persona?.id)));
  }
  /* V45.7.27：人物设置页改成两个并排按钮，各自点进各自的页。
     入口收下的是人物 id，这里换算成当前面具下的私信 chatId。 */
  window.v45726WipeFor=function(characterId,tab){
    let chatId='';try{chatId=directChatId(characterId)}catch{}
    return window.v45726OpenWipe(chatId||currentChat,tab);
  };
  window.v45726OpenWipe=function(chatId,tab){
    wipeChat=S(chatId||currentChat);wipeTab=tab==='memory'?'memory':'record';
    const person=chatCharacter(wipeChat);if(!person)return tell('请先进入一个人物的聊天');
    const persona=personaNow(),gids=groupChatIds(person);
    const sourced=memoryRows(person).filter(m=>S(m.source)),manual=memoryRows(person).filter(m=>!S(m.source));
    const body=wipeTab==='record'?`
      <div class="v45726-wipe-list">
        <label><input type="checkbox" class="v45726-wipe" value="online" checked><div><b>线上消息</b><small>普通聊天气泡、语音、图片、表情包</small></div><i>${countMode(wipeChat,'online')} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="offline" checked><div><b>线下相遇</b><small>剧情段落、旁白、内心话</small></div><i>${countMode(wipeChat,'offline')} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="groups"><div><b>群聊里的发言</b><small>${E(person.name)}在 ${gids.length} 个群里的记录，与其他成员共用</small></div><i>${gids.reduce((n,k)=>n+L(data.chats?.[k]).length,0)} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="translation" checked><div><b>译文缓存</b><small>翻译过的句子</small></div><i>${Object.keys(O(data.translationCache?.[wipeChat])).length||0} 条</i></label>
      </div>
      <div class="v45726-wipe-why"><b>清完记录之后，TA 还是会记得</b>
        <p>因为记忆是另一套数据：压缩摘要、你查过的手机内容、通话记录、时间线都还在，它们仍然会进提示词。</p>
        <p>要让 TA 真的不记得，回到人物设置页点旁边那个「清理记忆」。</p></div>`
      :`
      <div class="v45726-wipe-list">
        <label><input type="checkbox" class="v45726-wipe" value="summary" checked><div><b>压缩记忆（对话摘要）</b><small>记忆页里${E(person.name)}与${E(persona?.name||'当前面具')}那条摘要</small></div><i>${data.chatSummaries?.[wipeChat]?1:0} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="phone" checked><div><b>手机记录</b><small>你查过的手机内容、被反查时留下的记录</small></div><i>${phoneCount(person)} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="calls" checked><div><b>通话记录</b><small>拨号、接听、拒接与通话内容</small></div><i>${L(data.calls).filter(c=>S(c.characterId)===S(person.id)).length} 通</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="timeline" checked><div><b>时间线与时间账本</b><small>过了多久、上次见面是什么时候</small></div><i>${(data.chatTimelines?.[wipeChat]?1:0)+(data.chatTimeHistory?.[wipeChat]?1:0)} 组</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="sourced"><div><b>带来源的记忆条目</b><small>标注来自番外、幻梦馆、语伴课堂、广场的那些</small></div><i>${sourced.length} 条</i></label>
        <label><input type="checkbox" class="v45726-wipe" value="manual"><div><b>手写记忆</b><small>你自己在记忆页写的，不随聊天清空</small></div><i>${manual.length} 条</i></label>
      </div>
      <div class="v45726-wipe-why"><b>之前清空之后还记得，就是这里</b>
        <p>旧版「清空线上与线下」只清了聊天消息、摘要、时间线和译文，手机记录与通话记录都留着，所以用查手机看过的内容照样会进提示词。</p>
        <p>现在这四项默认勾上。带来源的条目和手写记忆默认不勾，那是你自己的资料，清了不可恢复。</p></div>`;
    modal(`<div class="v45726-wipe"><h2>${wipeTab==='record'?'清理记录':'清理记忆'} · ${E(person.name)}</h2>
      <div class="note">当前面具「${E(persona?.name||'未命名')}」下的${E(person.name)}。${wipeTab==='record'?'这一页只清聊天里看得见的消息。':'这一页只清会被塞回提示词的痕迹。'}其他面具不受影响。</div>
      ${body}
      <div class="form-actions"><button onclick="closeModal()">取消</button>
        <button class="danger" onclick="v45726RunWipe()">${wipeTab==='record'?'清理所选记录':'清理所选记忆'}</button></div></div>`);
  };
  window.v45726RunWipe=function(){
    const picked=[...document.querySelectorAll('.v45726-wipe:checked')].map(x=>x.value);
    if(!picked.length)return tell('还没有勾选任何一项');
    const person=chatCharacter(wipeChat);if(!person)return;
    const done=[];
    if(wipeTab==='record'){
      const keepOnline=!picked.includes('online'),keepOffline=!picked.includes('offline');
      if(!keepOnline||!keepOffline){
        const before=L(data.chats?.[wipeChat]).length;
        data.chats[wipeChat]=L(data.chats?.[wipeChat]).filter(m=>{
          if(!m)return false;
          const offline=m.mode==='offline';
          if(offline&&picked.includes('offline'))return false;
          if(!offline&&picked.includes('online'))return false;
          return true;
        });
        done.push(`消息 ${before-L(data.chats[wipeChat]).length} 条`);
      }
      if(picked.includes('groups')){
        let n=0;for(const key of groupChatIds(person)){n+=L(data.chats?.[key]).length;data.chats[key]=[]}
        done.push(`群聊 ${n} 条`);
      }
      if(picked.includes('translation')&&data.translationCache){delete data.translationCache[wipeChat];done.push('译文缓存')}
    }else{
      if(picked.includes('summary')&&data.chatSummaries){delete data.chatSummaries[wipeChat];done.push('对话摘要')}
      if(picked.includes('timeline')){
        if(data.chatTimelines)delete data.chatTimelines[wipeChat];
        if(data.chatTimeHistory)delete data.chatTimeHistory[wipeChat];
        done.push('时间线');
      }
      if(picked.includes('calls')){
        const before=L(data.calls).length;
        data.calls=L(data.calls).filter(c=>S(c.characterId)!==S(person.id));
        done.push(`通话 ${before-data.calls.length} 通`);
      }
      if(picked.includes('phone')){
        let n=0;
        try{
          const store=O(data.simPhones);
          for(const key of Object.keys(store)){
            const owner=O(store[key]);const items=L(owner.items);
            const kept=items.filter(it=>S(it?.characterId)!==S(person.id)&&S(it?.owner)!==S(person.id)&&S(key)!==S(person.id));
            n+=items.length-kept.length;owner.items=kept;
          }
          if(S(data.simPhones?.[person.id]))delete data.simPhones[person.id];
          else if(O(data.simPhones)[person.id]){n+=L(data.simPhones[person.id].items).length;delete data.simPhones[person.id]}
        }catch{}
        try{data.runtime.phoneViewMarks=O(data.runtime.phoneViewMarks);
          for(const k of Object.keys(data.runtime.phoneViewMarks))if(k.includes(S(person.id)))delete data.runtime.phoneViewMarks[k];
        }catch{}
        done.push(`手机记录 ${n} 条`);
      }
      if(picked.includes('sourced')||picked.includes('manual')){
        const persona=personaNow();
        const before=L(data.memories).length;
        data.memories=L(data.memories).filter(m=>{
          if(!m||S(m.characterId)!==S(person.id))return true;
          if(m.personaId&&S(m.personaId)!==S(persona?.id))return true;
          const hasSource=!!S(m.source);
          if(hasSource&&picked.includes('sourced'))return false;
          if(!hasSource&&picked.includes('manual'))return false;
          return true;
        });
        done.push(`记忆条目 ${before-data.memories.length} 条`);
      }
    }
    keep();closeModal();
    try{if(currentChat===wipeChat)renderMessages?.()}catch{}
    try{renderChats?.()}catch{}
    try{renderMemory?.()}catch{}
    tell(`已清理：${done.join('、')||'无'}`);
  };
  /* 接管原来的两个清空入口 */
  window.clearChat=function(id){return window.v45726OpenWipe(S(id||currentChat),'record')};
  window.clearCharacterConversations=function(id){
    let chatId='';try{chatId=directChatId(id)}catch{}
    return window.v45726OpenWipe(chatId||currentChat,'record');
  };
  try{clearChat=window.clearChat;clearCharacterConversations=window.clearCharacterConversations}catch{}
})();


/* =========================================================
   V45.7.28 · 广场保留原组件后的文游最终层
   四种参与来源／戏外戏内分层／整张场景图／文字图回退／杀青名单
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45728VN)return;
  window.__pokejiV45728VN=true;

  const S=(v,f='')=>String(v??f);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=v=>typeof attr==='function'?attr(S(v)):E(v);
  const A=v=>`decodeURIComponent('${encodeURIComponent(S(v)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const keep=()=>{try{save()}catch{}};
  const tell=t=>{try{toast(t)}catch{}};
  const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch{return v}};
  const safeImg=v=>{try{return typeof safeImageSrc==='function'?safeImageSrc(v):S(v)}catch{return''}};
  const personaNow=()=>{try{return activePersonaFor(currentChat)}catch{return L(data.personas).find(p=>S(p.id)===S(data.activePersonaId))||L(data.personas)[0]||null}};
  const allEntities=()=>{
    const map=new Map();
    for(const row of [...L(data.characters),...L(data.mpcs)])if(row&&row.id&&!map.has(S(row.id)))map.set(S(row.id),row);
    return [...map.values()];
  };
  const entity=id=>allEntities().find(row=>S(row.id)===S(id))||null;
  const games=()=>{data.visualNovelsV4571=O(data.visualNovelsV4571);data.visualNovelsV4571.games=L(data.visualNovelsV4571.games);return data.visualNovelsV4571.games};
  const gameById=id=>games().find(g=>S(g.id)===S(id))||null;
  const activeGame=()=>gameById(S(data.visualNovelsV4571?.activeId));
  const normalizeMode=v=>['self','borrow','none'].includes(v)?v:'self';
  const normalizeTurn=v=>['outside','inside','both'].includes(v)?v:'both';
  const participantName=p=>S(entity(p.characterId)?.name||p.name||'人物');

  const legacy={
    create:window.v4571CreateVN,
    saveNew:window.v4571SaveNewVN,
    choose:window.v4571ChooseVN,
    custom:window.v4571CustomVNChoice,
    menu:window.v4571VNMenu,
    open:window.v4571OpenVN,
    delete:window.v4571DeleteVN,
    invoke:window.invokeModel,
    saveSlot:window.v45712VNDoSave,
    loadSlot:window.v45712VNDoLoad,
    promote:window.v45726Promote,
    ending:window.v45726VNEnding
  };

  function ensureGame(g){
    if(!g)return null;
    g.stage=O(g.stage);g.stage.stats=L(g.stage.stats);g.stage.items=L(g.stage.items);g.stage.saves=L(g.stage.saves);g.stage.cast=L(g.stage.cast);
    const fresh=!g.v45728;
    g.v45728=O(g.v45728);
    const v=g.v45728;
    if(fresh||!Array.isArray(v.participants)){
      const map=new Map();
      for(const id of L(g.participantIds).map(S).filter(Boolean))map.set(id,{characterId:id,outside:false,insideMode:'self',role:{}});
      if(g.companionId){
        const id=S(g.companionId),row=map.get(id)||{characterId:id,outside:false,insideMode:'none',role:{}};
        row.outside=true;map.set(id,row);
      }
      v.participants=[...map.values()];
    }
    v.participants=L(v.participants).map(row=>{
      const p=O(row),role=O(p.role);
      return {characterId:S(p.characterId||p.id),outside:p.outside===true,insideMode:normalizeMode(p.insideMode),role:{name:S(role.name),identity:S(role.identity),brief:S(role.brief)}};
    }).filter(p=>p.characterId&&entity(p.characterId));
    if(v.allowGeneratedRoles===undefined)v.allowGeneratedRoles=true;
    if(v.allowGeneratedNpcs===undefined)v.allowGeneratedNpcs=true;
    if(v.imageWanted===undefined)v.imageWanted=g.imageEnabled===true||L(g.scenes).some(scene=>safeImg(scene?.image));
    if(v.visualAuto===undefined)v.visualAuto=true;
    if(v.nonCanon===undefined)v.nonCanon=true;
    if(v.turnMode===undefined)v.turnMode=v.participants.some(p=>p.outside)?'both':'inside';
    v.turnMode=normalizeTurn(v.turnMode);
    v.generatedCast=L(v.generatedCast);
    v.referenceDescriptions=O(v.referenceDescriptions);
    v.dismissedEndings=L(v.dismissedEndings);
    if(!v.createdAt)v.createdAt=g.createdAt||NOW();
    if(g.contextMode==='linked'&&!v.legacyLinked)v.legacyLinked=true;
    /* 新规则：默认非正史，旧引擎不得在每一幕把戏内遭遇写回现实记忆。 */
    g.contextMode='isolated';
    g.imageEnabled=false; /* 画面由本层按“场景显著变化”统一管理。 */
    syncLegacyShape(g);
    mergeStageCast(g);
    return g;
  }
  function syncLegacyShape(g){
    const v=g.v45728||{},inside=L(v.participants).filter(p=>p.insideMode!=='none'),outside=L(v.participants).filter(p=>p.outside);
    g.participantIds=[...new Set(inside.map(p=>S(p.characterId)).filter(Boolean))];
    g.companionId=S(outside[0]?.characterId||'');
    g.playMode=outside.length?'companion':'cast';
  }
  function mergeStageCast(g){
    const v=g.v45728;if(!v)return;
    for(const raw of L(g.stage?.cast)){
      if(!raw||raw.promotedTo)continue;
      const name=S(raw.name).trim();if(!name)continue;
      let row=v.generatedCast.find(x=>S(x.id)===S(raw.id)||S(x.name).trim()===name);
      if(!row){row={id:S(raw.id)||ID('vn_cast'),name,kind:raw.kind==='npc'?'npc':'story',createdAt:raw.createdAt||NOW()};v.generatedCast.push(row)}
      row.brief=S(row.brief||raw.brief);row.lines=Math.max(Number(row.lines)||0,Number(raw.lines)||0);row.firstAct=Math.min(Number(row.firstAct)||999,Number(raw.act)||999);row.promotedTo=S(row.promotedTo||raw.promotedTo);
    }
  }
  for(const g of games())ensureGame(g);
  keep();

  function entityContext(row){
    if(!row)return'';
    try{if(typeof characterContext==='function')return characterContext(row)}catch{}
    return [row.name,row.bio,row.personality,row.background,row.appearance,row.speechStyle,row.relationship].filter(Boolean).join('\n');
  }
  function participantPrompt(g){
    const v=ensureGame(g).v45728,blocks=[];
    for(const p of v.participants){
      const ch=entity(p.characterId),name=participantName(p),layers=[];
      if(p.outside)layers.push(`戏外陪玩：${name}知道自己正在和 USER 玩一部文游，可以讨论、表达偏好，但最终选择只能由 USER 决定；戏外内容不能被戏内人物知道。`);
      if(p.insideMode==='self')layers.push(`戏内本人进入：${name}保留原姓名、关系、经历、性格与认知，以本人身份进入故事。`);
      if(p.insideMode==='borrow')layers.push(`戏内借角色入戏：借用${name}的性格、外貌和说话方式，扮演新身份“${p.role.name||'待定身份'}”。戏中身份资料：${p.role.identity||p.role.brief||'按开局生成'}。戏中身份不知道自己在演，也看不到任何戏外讨论；戏内称呼必须使用戏中身份，不得叫${name}。`);
      blocks.push(`【现有人物：${name}】\n${layers.join('\n')}\n人物资料：\n${entityContext(ch)}`);
    }
    if(v.allowGeneratedRoles)blocks.push('允许剧情自然生成有名有姓、跨幕行动并有对白的剧情角色；完结前只属于本作。');
    if(v.allowGeneratedNpcs)blocks.push('允许剧情自然生成店主、路人、守卫等场景 NPC；完结前只属于本作。');
    return blocks.join('\n\n');
  }
  function generatedCastPrompt(g){
    const rows=L(g.v45728?.generatedCast).filter(row=>!row.promotedTo);
    if(!rows.length)return'目前还没有登记的剧情生成角色。';
    return rows.map(row=>`${row.id}｜${row.name}｜${row.kind==='npc'?'场景 NPC':'剧情角色'}｜${row.brief||''}｜当前状态=${row.currentState||'未知'}`).join('\n');
  }
  function parseJson(raw){
    if(raw&&typeof raw==='object')return O(raw);
    let text=S(raw);try{if(typeof stripReplyTags==='function')text=stripReplyTags(text)}catch{}
    try{return O(JSON.parse(text))}catch{}
    const match=text.match(/\{[\s\S]*\}/);if(match)try{return O(JSON.parse(match[0]))}catch{}
    return {};
  }
  function sceneText(g,limit=12){
    const rows=L(g.scenes).slice(-limit);
    return rows.map((scene,index)=>`第 ${L(g.scenes).length-rows.length+index+1} 幕｜${S(scene.title)}\n旁白：${S(scene.narration)}\n对白：${L(scene.dialogue).map(line=>`${S(line.speaker)}：${S(line.text)}`).join('\n')}\nUSER选择：${S(scene.selectedChoice||'尚未选择')}`).join('\n\n').slice(-36000);
  }

  /* ---------- 创建：戏外开关与戏内身份分别保存 ---------- */
  function participantRows(selected=[]){
    const byId=new Map(L(selected).map(row=>[S(row.characterId),row]));
    const rows=allEntities();
    if(!rows.length)return'<div class="v45728-vn-no-people">还没有已建立人物。仍可只开启“剧情生成人物／NPC”开始。</div>';
    return rows.map(ch=>{
      const old=O(byId.get(S(ch.id))),used=!!byId.get(S(ch.id)),outside=old.outside===true,mode=normalizeMode(old.insideMode||'self'),role=O(old.role);
      return `<article class="v45728-vn-person-row ${used?'':'is-off'}" data-character="${AT(ch.id)}">
        <header><label><input type="checkbox" class="v45728-use" ${used?'checked':''} onchange="v45728VNUseChanged(this)"><span>${E(S(ch.name||'人物').slice(0,1))}</span><b>${E(ch.name||'未命名人物')}</b></label><small>每位单独设置</small></header>
        <div class="v45728-vn-layer"><label><input type="checkbox" class="v45728-outside" ${outside?'checked':''}><span><b>戏外陪玩</b><small>讨论并表达偏好，最终由 USER 决定</small></span></label></div>
        <div class="v45728-vn-layer"><span><b>戏内参与</b><small>与戏外严格分层</small></span><select class="v45728-inside" onchange="v45728VNModeChanged(this)"><option value="self" ${mode==='self'?'selected':''}>角色本人进入</option><option value="borrow" ${mode==='borrow'?'selected':''}>借角色入戏</option><option value="none" ${mode==='none'?'selected':''}>不进入戏内</option></select></div>
        <div class="v45728-borrow ${mode==='borrow'?'on':''}"><input class="v45728-role-name" value="${AT(role.name)}" placeholder="戏中姓名／身份名"><textarea class="v45728-role-identity" placeholder="戏中身份、经历和在故事里的位置；戏中本人不知道在演">${E(role.identity||role.brief)}</textarea></div>
      </article>`;
    }).join('');
  }
  function createModal(){
    const imageReady=typeof validModel==='function'&&validModel('image');
    modal(`<div class="v45728-vn-create"><h2>创建文游</h2>
      <div class="v45728-create-note"><b>四种参与来源可以混用</b><span>戏外陪玩是独立开关；同一人物进入戏内时，再选本人入戏、借角色入戏或不进入戏内。</span></div>
      <div class="field"><label>标题</label><input id="v4571VNTitle" placeholder="给这部故事起名"></div>
      <div class="field"><label>开局设定</label><textarea id="v4571VNPremise" placeholder="时间、地点、身份、最初发生了什么"></textarea></div>
      <div class="field"><label>指定发展方向</label><textarea id="v4571VNDirection" placeholder="主题、矛盾、目标、禁区或想体验的题材"></textarea></div>
      <section class="v45728-create-section"><header><b>现有人物</b><small>可同时开启戏外与戏内</small></header><div class="v45728-vn-people">${participantRows()}</div></section>
      <section class="v45728-create-section"><header><b>剧情自然生成人物</b><small>完结前只属于本作</small></header>
        <label class="v45728-create-toggle"><span><b>剧情角色</b><small>有名有姓、跨幕、有对白</small></span><input id="v45728GeneratedRoles" type="checkbox" checked></label>
        <label class="v45728-create-toggle"><span><b>场景 NPC</b><small>店主、路人、守卫等功能人物</small></span><input id="v45728GeneratedNpcs" type="checkbox" checked></label>
      </section>
      <section class="v45728-create-section"><header><b>舞台画面</b><small>无图片模型会自动回退文字图</small></header>
        <label class="v45728-create-toggle"><span><b>按场景生成整张画面</b><small>背景、人物和动作融为一张图；人物图片只作为参考</small></span><input id="v45728ImageWanted" type="checkbox" ${imageReady?'checked':''}></label>
      </section>
      <div hidden><input type="radio" name="v4571VNMode" id="v45728LegacyCast" value="cast" checked><input type="radio" name="v4571VNMode" id="v45728LegacyCompanion" value="companion"><input id="v4571VNCompanion"><input id="v4571VNImage" type="checkbox"><input id="v4571VNLinked" type="checkbox"><div id="v45728LegacyPeople"></div></div>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45728SaveNewVN()">创建并生成第一幕</button></div>
    </div>`);
  }
  window.v45728VNUseChanged=function(input){input?.closest('.v45728-vn-person-row')?.classList.toggle('is-off',!input.checked)};
  window.v45728VNModeChanged=function(select){select?.closest('.v45728-vn-person-row')?.querySelector('.v45728-borrow')?.classList.toggle('on',select.value==='borrow')};
  function collectParticipants(scope=document){
    return [...scope.querySelectorAll('.v45728-vn-person-row')].filter(row=>row.querySelector('.v45728-use')?.checked).map(row=>({
      characterId:S(row.dataset.character),outside:row.querySelector('.v45728-outside')?.checked===true,insideMode:normalizeMode(row.querySelector('.v45728-inside')?.value),
      role:{name:S(row.querySelector('.v45728-role-name')?.value).trim(),identity:S(row.querySelector('.v45728-role-identity')?.value).trim()}
    }));
  }
  function validateParticipants(parts,allowRoles,allowNpcs){
    for(const p of parts){
      if(!p.outside&&p.insideMode==='none'){tell(`${participantName(p)}既没有开启戏外，也没有进入戏内`);return false}
      if(p.insideMode==='borrow'&&!p.role.name){tell(`请填写${participantName(p)}借角色入戏时的戏中姓名或身份名`);return false}
    }
    if(!parts.length&&!allowRoles&&!allowNpcs){tell('至少选择一位现有人物，或允许剧情生成人物／NPC');return false}
    return true;
  }
  let pendingCreate=null;
  function saveNew(){
    if(typeof legacy.saveNew!=='function')return tell('文游创建入口不可用');
    const title=S(document.getElementById('v4571VNTitle')?.value).trim(),premise=S(document.getElementById('v4571VNPremise')?.value).trim();
    if(!title||!premise)return tell('请填写标题和开局设定');
    const parts=collectParticipants(),allowRoles=document.getElementById('v45728GeneratedRoles')?.checked===true,allowNpcs=document.getElementById('v45728GeneratedNpcs')?.checked===true;
    if(!validateParticipants(parts,allowRoles,allowNpcs))return;
    const outside=parts.filter(p=>p.outside),inside=parts.filter(p=>p.insideMode!=='none');
    const legacyPeople=document.getElementById('v45728LegacyPeople');if(legacyPeople)legacyPeople.innerHTML=inside.map(p=>`<input class="v4571-vn-person" type="checkbox" value="${AT(p.characterId)}" checked>`).join('');
    const castRadio=document.getElementById('v45728LegacyCast'),compRadio=document.getElementById('v45728LegacyCompanion');if(castRadio)castRadio.checked=!outside.length;if(compRadio)compRadio.checked=!!outside.length;
    const companion=document.getElementById('v4571VNCompanion');if(companion)companion.value=S(outside[0]?.characterId||'');
    const oldImage=document.getElementById('v4571VNImage'),oldLinked=document.getElementById('v4571VNLinked');if(oldImage)oldImage.checked=false;if(oldLinked)oldLinked.checked=false;
    pendingCreate={participants:clone(parts),allowGeneratedRoles:allowRoles,allowGeneratedNpcs:allowNpcs,imageWanted:document.getElementById('v45728ImageWanted')?.checked===true,visualAuto:true,nonCanon:true,turnMode:outside.length?'both':'inside',generatedCast:[],referenceDescriptions:{},dismissedEndings:[],createdAt:NOW()};
    const before=new Set(games().map(g=>S(g.id)));
    const out=legacy.saveNew.call(this);
    const created=games().find(g=>!before.has(S(g.id)));
    if(created){created.v45728=clone(pendingCreate);ensureGame(created);try{window.v45710VNSnapshot?.(created.id)}catch{}keep()}
    pendingCreate=null;
    return out;
  }
  window.v4571CreateVN=createModal;window.v45728SaveNewVN=saveNew;window.v4571SaveNewVN=saveNew;
  try{v4571CreateVN=createModal;v4571SaveNewVN=saveNew}catch{}

  function editorModal(g){
    ensureGame(g);const v=g.v45728;
    modal(`<div class="v45728-vn-create"><h2>${E(g.title)} · 参与方式</h2><div class="v45728-create-note"><b>每位人物单独设置</b><span>戏外反应不进正文，戏内人物不可见；戏内可选本人进入或借角色入戏。</span></div><div class="v45728-vn-people">${participantRows(v.participants)}</div>
      <section class="v45728-create-section"><label class="v45728-create-toggle"><span><b>允许剧情角色</b><small>完结后才可加入人物</small></span><input id="v45728GeneratedRoles" type="checkbox" ${v.allowGeneratedRoles?'checked':''}></label><label class="v45728-create-toggle"><span><b>允许场景 NPC</b><small>完结后才可加入人物</small></span><input id="v45728GeneratedNpcs" type="checkbox" ${v.allowGeneratedNpcs?'checked':''}></label></section>
      <div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45728SaveParticipants(${A(g.id)})">保存</button></div></div>`);
  }
  window.v45728EditParticipants=id=>{const g=gameById(id);if(g)editorModal(g)};
  window.v45728SaveParticipants=function(id){
    const g=ensureGame(gameById(id));if(!g)return;
    const parts=collectParticipants(),roles=document.getElementById('v45728GeneratedRoles')?.checked===true,npcs=document.getElementById('v45728GeneratedNpcs')?.checked===true;
    if(!validateParticipants(parts,roles,npcs))return;
    g.v45728.participants=parts;g.v45728.allowGeneratedRoles=roles;g.v45728.allowGeneratedNpcs=npcs;if(!parts.some(p=>p.outside)&&g.v45728.turnMode!=='inside')g.v45728.turnMode='inside';syncLegacyShape(g);keep();closeModal();renderStage(false);tell('参与方式已保存');
  };

  /* ---------- 文游模型输出补充：分层反应、画面变化、角色表、结局建议 ---------- */
  const pendingMeta=new Map();
  function turnInstruction(g){
    const mode=normalizeTurn(g.v45728.turnMode),outside=g.v45728.participants.filter(p=>p.outside);
    if(mode==='outside')return'本回合只处理戏外讨论，不应生成新场景。';
    if(mode==='inside')return'本回合只推进戏内故事；oocReactions 必须为空。';
    return outside.length?'本回合同时推进戏内故事，并为每位开启戏外陪玩的现有人物生成独立戏外反应；戏外内容不可出现在 narration 或 dialogue 中。':'本回合只推进戏内故事。';
  }
  function extraPrompt(g){
    const outside=g.v45728.participants.filter(p=>p.outside).map(p=>`${p.characterId}｜${participantName(p)}`).join('\n')||'无';
    return `\n\n【V45.7.28 本文游参与规则｜优先级高】\n${participantPrompt(g)}\n\n【本回合层级】\n${turnInstruction(g)}\n开启戏外陪玩的对象：\n${outside}\nUSER 永远拥有最终选择权；戏外人物只讨论、提出偏好，不能替 USER 点击选择。戏内人物可以依据性格自主行动、表达犹豫、改变计划或主动采取符合自身动机的行动，但不能替 USER 决定 USER 的选择。\n\n【视觉小说叙事】\n每一幕先写具体环境（光线、声音、气味、温度与周围行动），再写人物动作和身体细节，再写对白与心理余味；对白要带动作、停顿和语气。旁白与对白比例接近，不要连续甩台词，不要写成“角色：台词”的剧本，也不要写成聊天气泡。每一幕只推进到下一个有意义的节点，选择必须是当下真正能做出的不同方向。\n\n【场景画面】\nimagePrompt 必须描述一整张完整剧情场景：地点、背景、所有在场人物、人物动作、距离、光线与氛围融为一张图。禁止“透明立绘”“角色站在背景前”“单人证件照”或任何 UI、文字、对话框。已有角色图片只作为人物一致性参考。另输出 visualChanged（布尔值）：只有地点、主要在场人物、时间段、关键动作或氛围构图发生显著改变时才为 true；普通对话延续必须为 false。\n\n【剧情生成角色与 NPC】\n目前登记：\n${generatedCastPrompt(g)}\n如果本幕自然出现新的有名剧情角色或场景 NPC，或旧角色状态改变，输出 generatedCastUpdates 数组；每项 {id,name,kind:"story|npc",brief,currentState,relationships,keyChoice,injury,items,endingWhere}。没有变化就输出空数组。\n\n【结局判断】\n只在主要矛盾确实收束、人物去向已经明确时输出 endingProposal:{reached:true,reason,title}；否则 reached=false。AI 只能提出完结，绝不能自动完结。\n\n在原有 JSON 字段之外追加："oocReactions":[{"characterId":"现有人物ID","text":"戏外反应","preference":"偏好但不替USER决定"}],"visualChanged":false,"visualChangeReason":"原因","generatedCastUpdates":[],"endingProposal":{"reached":false,"reason":"","title":""}。仍然只输出一个合法 JSON 对象。`;
  }
  if(typeof legacy.invoke==='function'){
    const wrapped=async function(kind,options={}){
      if(options?.activityArea!=='文游')return legacy.invoke.call(this,kind,options);
      /* 创建函数会在旧引擎发起请求后的同一调用栈补上 v45728；让出一个微任务再读取。 */
      await Promise.resolve();
      const g=ensureGame(activeGame());if(!g)return legacy.invoke.call(this,kind,options);
      const before=L(g.scenes).length,mode=g.v45728.turnMode;
      const enhanced={...options,system:S(options.system)+extraPrompt(g)};
      const raw=await legacy.invoke.call(this,kind,enhanced);
      pendingMeta.set(S(g.id),{raw:parseJson(raw),before,mode,at:Date.now(),tries:0});
      setTimeout(()=>enrichPending(g.id),0);
      return raw;
    };
    wrapped.__v45728=true;window.invokeModel=wrapped;try{invokeModel=wrapped}catch{}
  }
  function mergeGeneratedUpdates(g,updates,scene){
    const v=g.v45728,knownInside=new Set(v.participants.map(p=>p.insideMode==='borrow'?S(p.role.name).trim():participantName(p)).filter(Boolean));
    const personaName=S(personaNow()?.name).trim();
    const rows=L(updates).map(O);
    /* 模型没返回角色表时，至少从新出现的对白姓名建立待补全记录。 */
    for(const line of L(scene?.dialogue)){
      const name=S(line?.speaker).trim();
      if(!name||knownInside.has(name)||name===personaName||['我','USER','用户','旁白'].includes(name))continue;
      if(!rows.some(row=>S(row.name).trim()===name))rows.push({name,kind:/路人|店员|守卫|司机|服务员|老板|看守|NPC/i.test(name)?'npc':'story',brief:'由本幕对白自然出现'});
    }
    for(const raw of rows){
      const name=S(raw.name).trim();if(!name)continue;
      let row=v.generatedCast.find(x=>(raw.id&&S(x.id)===S(raw.id))||S(x.name).trim()===name);
      if(!row){row={id:S(raw.id)||ID('vn_cast'),name,kind:raw.kind==='npc'?'npc':'story',createdAt:NOW(),firstScene:L(g.scenes).length};v.generatedCast.push(row)}
      row.kind=raw.kind==='npc'?'npc':row.kind||'story';
      for(const key of ['brief','currentState','relationships','keyChoice','injury','items','endingWhere'])if(S(raw[key]).trim())row[key]=S(raw[key]).trim();
      row.lines=(Number(row.lines)||0)+L(scene?.dialogue).filter(line=>S(line?.speaker).trim()===name).length;row.lastScene=L(g.scenes).length;
      let old=L(g.stage.cast).find(x=>S(x.id)===S(row.id)||S(x.name).trim()===name);
      if(!old){old={id:row.id,name:row.name,kind:row.kind==='npc'?'npc':'role',brief:row.brief||'',act:row.firstScene||L(g.scenes).length,lines:row.lines,createdAt:row.createdAt};g.stage.cast.push(old)}
      else{old.brief=row.brief||old.brief;old.lines=row.lines;old.kind=row.kind==='npc'?'npc':'role'}
    }
  }
  function allowedOoc(g,raw,scene,mode){
    if(mode==='inside')return [];
    const outside=g.v45728.participants.filter(p=>p.outside),byId=new Map(outside.map(p=>[S(p.characterId),p]));
    const out=[];
    for(const item of L(raw.oocReactions).map(O)){
      let p=byId.get(S(item.characterId));if(!p&&item.name)p=outside.find(x=>participantName(x)===S(item.name));if(!p)continue;
      const text=S(item.text).trim();if(!text)continue;out.push({characterId:p.characterId,text:text.slice(0,1200),preference:S(item.preference).slice(0,400),at:NOW()});
    }
    if(!out.length&&S(scene?.companionComment).trim()&&outside[0])out.push({characterId:outside[0].characterId,text:S(scene.companionComment).slice(0,1200),preference:'',at:NOW()});
    return out;
  }
  function rememberPlayed(g){
    data.memories=L(data.memories);const user=personaNow()?.name||'USER';
    for(const p of g.v45728.participants.filter(row=>row.outside)){
      let m=data.memories.find(row=>row.source==='visual-novel-play'&&S(row.sourceGameId)===S(g.id)&&S(row.characterId)===S(p.characterId));
      if(!m){m={id:ID('memory'),source:'visual-novel-play',sourceGameId:g.id,characterId:p.characterId,personaId:g.personaId||personaNow()?.id||'',title:`一起玩过文游 · ${g.title}`,createdAt:NOW()};data.memories.unshift(m)}
      m.text=`${participantName(p)}记得与${user}一起玩过文游《${g.title}》。这是共同游玩的虚构故事；${participantName(p)}知道自己在戏外陪玩，不会把戏内身份、伤病、关系或遭遇当成现实。当前玩到第 ${L(g.scenes).length} 幕${g.v45728.endedAt?'，已经完结':'。'}`;m.updatedAt=NOW();
    }
  }
  function endingMeta(raw){
    const e=O(raw.endingProposal);return {reached:e.reached===true||raw.endingReached===true,reason:S(e.reason||raw.endingReason),title:S(e.title||raw.endingTitle)};
  }
  function enrichPending(id){
    const key=S(id),pending=pendingMeta.get(key),g=ensureGame(gameById(key));if(!pending||!g)return;
    if(L(g.scenes).length<=pending.before){if(pending.tries++<20)setTimeout(()=>enrichPending(id),40);else pendingMeta.delete(key);return}
    pendingMeta.delete(key);const scene=L(g.scenes).at(-1),raw=O(pending.raw);if(!scene)return;
    scene.v45728=O(scene.v45728);scene.v45728.turnMode=pending.mode;scene.v45728.ooc=allowedOoc(g,raw,scene,pending.mode);
    scene.companionComment='';
    scene.v45728.visualChanged=typeof raw.visualChanged==='boolean'?raw.visualChanged:null;scene.v45728.visualChangeReason=S(raw.visualChangeReason);
    const ending=endingMeta(raw);if(ending.reached&&!g.v45728.dismissedEndings.includes(S(scene.id)))scene.v45728.endingProposal=ending;
    mergeGeneratedUpdates(g,raw.generatedCastUpdates||raw.storyCast||raw.castUpdates,scene);rememberPlayed(g);keep();renderStage(false);void ensureSceneVisual(g,scene,false);
  }

  async function referenceDescriptions(g){
    const cache=g.v45728.referenceDescriptions;
    for(const p of g.v45728.participants.filter(row=>row.insideMode!=='none')){
      if(cache[p.characterId])continue;const ch=entity(p.characterId),fallback=S(ch?.appearance||ch?.imagePrompt||ch?.description||ch?.bio).slice(0,700),image=safeImg(ch?.image);
      cache[p.characterId]=fallback;
      if(image&&typeof validModel==='function'&&validModel('vision')&&typeof describeStickerWithVision==='function'){
        try{const seen=await describeStickerWithVision(image);if(S(seen).trim())cache[p.characterId]=`${fallback?fallback+'；':''}参考图识别：${S(seen).trim()}`.slice(0,1000)}catch{}
      }
    }
    keep();return cache;
  }
  function imagePromptFor(g,scene,refs){
    const people=g.v45728.participants.filter(p=>p.insideMode!=='none').map(p=>{
      const label=p.insideMode==='borrow'?(p.role.name||participantName(p)):participantName(p);return `${label}：${S(refs[p.characterId]||entity(p.characterId)?.appearance||'按人物资料保持一致')}`;
    }).join('\n');
    return `为原创视觉小说《${g.title}》生成一整张完整场景插画。\n本幕：${scene.title}\n画面描述：${scene.imagePrompt||scene.narration}\n在场人物参考：\n${people||'按剧情生成的人物'}\n要求：背景、人物、动作、人物之间的距离与环境光线必须融为同一张画面；人物自然处在环境中。不要透明立绘，不要角色站在空背景前，不要证件照，不要 UI、文字、字幕、边框或对话框。画面要能承载上层旁白，主体不要全部挤在底部。`;
  }
  function previousScene(g,scene){const index=L(g.scenes).findIndex(row=>row===scene||S(row.id)===S(scene.id));return index>0?g.scenes[index-1]:null}
  async function ensureSceneVisual(g,scene,force){
    ensureGame(g);scene.v45728=O(scene.v45728);if(scene.v45728.visualBusy)return;
    if(!force&&scene.v45728.visualAttempted){if(!safeImg(scene.image))renderStage(false);return}
    scene.v45728.visualAttempted=true;
    if(safeImg(scene.image)&&!force){scene.v45728.visualKind='generated';keep();renderStage(false);return}
    if(!g.v45728.imageWanted){scene.v45728.visualKind='text';scene.v45728.fallbackReason='已选择文字图';keep();renderStage(false);return}
    if(typeof validModel!=='function'||!validModel('image')){scene.v45728.visualKind='text';scene.v45728.fallbackReason='没有可用的图片模型';keep();renderStage(false);return}
    const prev=previousScene(g,scene),changed=force||!prev||scene.v45728.visualChanged===true;
    if(!changed&&safeImg(prev?.image)){
      scene.image=prev.image;scene.v45728.visualKind='reused';scene.v45728.reusedFrom=S(prev.id);scene.v45728.fallbackReason='';keep();renderStage(false);return;
    }
    if(!changed&&prev&&!safeImg(prev.image)){
      scene.v45728.visualKind='text';scene.v45728.fallbackReason='场景延续，沿用文字图';keep();renderStage(false);return;
    }
    scene.v45728.visualBusy=true;scene.v45728.fallbackReason='场景图生成中';keep();renderStage(true);
    try{
      const refs=await referenceDescriptions(g),prompt=imagePromptFor(g,scene,refs);
      if(typeof generateImageFromProfile!=='function')throw Error('图片生成函数不可用');
      const image=await generateImageFromProfile(prompt,{source:'visual-novel',character:entity(g.v45728.participants.find(p=>p.insideMode!=='none')?.characterId),persona:personaNow()});
      if(!safeImg(image))throw Error('图片模型没有返回可显示画面');scene.image=image;scene.imagePrompt=scene.imagePrompt||prompt;scene.v45728.visualKind='generated';scene.v45728.fallbackReason='';scene.imageError='';if(!g.cover)g.cover=image;
    }catch(error){scene.image='';scene.imageError=S(error?.message||'画面生成失败');scene.v45728.visualKind='text';scene.v45728.fallbackReason='生图失败：已回退文字图'}
    finally{scene.v45728.visualBusy=false;keep();renderStage(false)}
  }
  window.v45728RegenerateSceneImage=function(id){
    const g=ensureGame(gameById(id)),scene=L(g?.scenes).at(-1);if(!g||!scene)return;
    if(typeof validModel!=='function'||!validModel('image'))return tell('没有可用图片模型，当前继续显示文字图');
    g.v45728.imageWanted=true;scene.image='';scene.v45728=O(scene.v45728);scene.v45728.visualChanged=true;keep();void ensureSceneVisual(g,scene,true);
  };
  window.v45728ToggleImageWanted=function(id){const g=ensureGame(gameById(id));if(!g)return;g.v45728.imageWanted=!g.v45728.imageWanted;const scene=L(g.scenes).at(-1);if(scene&&!safeImg(scene.image)){scene.v45728=O(scene.v45728);scene.v45728.visualAttempted=false}keep();closeModal();renderStage(false);tell(g.v45728.imageWanted?'已开启场景图；场景明显变化时自动生成':'已切换为文字图；已有场景图缓存不会删除')};

  /* ---------- 真正的舞台：整张图、画面旁白、底部只放对白 ---------- */
  function wrapLines(text,max=18,limit=7){
    const clean=S(text).replace(/\s+/g,' ').trim(),out=[];let line='';
    for(const ch of clean){line+=ch;if(line.length>=max){out.push(line);line='';if(out.length>=limit)break}}
    if(line&&out.length<limit)out.push(line);return out;
  }
  function xml(v){return S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
  function textImageData(g,scene){
    const title=wrapLines(scene?.title||g.title,12,2),body=wrapLines(scene?.imagePrompt||scene?.narration||'这一幕还没有画面描述',19,8);
    const titleSvg=title.map((line,i)=>`<text x="66" y="${150+i*48}" font-size="34" fill="#f2eee3" font-family="serif">${xml(line)}</text>`).join('');
    const bodySvg=body.map((line,i)=>`<text x="68" y="${300+i*40}" font-size="23" fill="#d4d7d4" font-family="serif">${xml(line)}</text>`).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#74878e"/><stop offset=".52" stop-color="#40565f"/><stop offset="1" stop-color="#18252b"/></linearGradient><radialGradient id="r"><stop stop-color="#e7dcc0" stop-opacity=".25"/><stop offset="1" stop-color="#e7dcc0" stop-opacity="0"/></radialGradient></defs><rect width="900" height="1200" fill="url(#g)"/><circle cx="690" cy="170" r="210" fill="url(#r)"/><path d="M0 830 240 610l160 140 170-230 330 310v370H0z" fill="#1e3036" opacity=".72"/><rect x="45" y="68" width="810" height="1064" rx="8" fill="#111a1f" fill-opacity=".2" stroke="#eee3c7" stroke-opacity=".32"/><text x="67" y="105" font-size="18" fill="#eee3c7" fill-opacity=".65" font-family="sans-serif" letter-spacing="5">TEXT SCENE · 本地文字图</text>${titleSvg}<line x1="68" y1="258" x2="832" y2="258" stroke="#eee3c7" stroke-opacity=".2"/>${bodySvg}<text x="68" y="1080" font-size="18" fill="#ffffff" fill-opacity=".48" font-family="sans-serif">无图片模型或生图失败时自动回退</text></svg>`;
    return`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function statsMarkup(g){
    const rows=L(g.stage?.stats).slice(0,4);if(!rows.length)return'';
    return `<div class="v45728-stats">${rows.map(row=>{const max=Math.max(1,Number(row.max)||100),cur=Math.max(0,Number(row.cur)||0),pct=Math.min(100,cur/max*100);return`<div><header><b>${E(row.name||'数值')}</b><span>${cur}/${max}</span></header><i><em style="width:${pct}%;background:${AT(row.color||'#d9c89f')}"></em></i></div>`}).join('')}</div>`;
  }
  function dialogueMarkup(scene){
    const rows=L(scene?.dialogue).filter(line=>S(line?.text).trim());
    if(!rows.length)return'<div class="v45728-dialogue-empty">这一幕没有角色对白</div>';
    return rows.map((line,index)=>`<p class="${index?'more':''}">${index||rows.length>1?`<b>${E(line.speaker||'角色')}</b>`:''}<span>${E(line.text)}</span></p>`).join('');
  }
  function oocRows(g,scene){
    const outside=g.v45728.participants.filter(p=>p.outside),saved=L(scene?.v45728?.ooc),map=new Map(saved.map(row=>[S(row.characterId),row]));
    return outside.map(p=>({p,row:map.get(S(p.characterId))}));
  }
  function oocMarkup(g,scene){
    const rows=oocRows(g,scene);if(!rows.length)return'';
    return `<button class="v45728-ooc-trigger" onclick="v45728ToggleOoc()">戏外陪玩 <i>${rows.filter(x=>x.row?.text).length||rows.length}</i></button><aside class="v45728-ooc-panel" id="v45728OocPanel"><header><div><small>戏外陪玩</small><b>不进入正文 · 戏内人物不可见</b></div><button onclick="v45728ToggleOoc(false)">×</button></header>${rows.map(({p,row})=>`<article><span>${E(participantName(p).slice(0,1))}</span><div><b>${E(participantName(p))}</b><p>${E(row?.text||'还没有戏外反应。选择“戏外”或“同时”后，可以先和 TA 讨论。')}</p>${row?.preference?`<small>偏好：${E(row.preference)}</small>`:''}</div></article>`).join('')}<footer>陪玩者只记得和你玩过这部故事，不把戏内遭遇当现实。</footer></aside>`;
  }
  function turnMarkup(g){
    const outside=g.v45728.participants.some(p=>p.outside);if(!outside)return'';const mode=g.v45728.turnMode;
    return `<nav class="v45728-turn"><span>本回合</span>${[['outside','戏外'],['inside','戏内'],['both','同时']].map(([id,label])=>`<button class="${mode===id?'on':''}" onclick="v45728SetTurnMode(${A(g.id)},'${id}')">${label}</button>`).join('')}</nav>`;
  }
  function sourceLabel(g,scene){
    if(scene?.v45728?.visualBusy)return'场景图生成中';
    if(safeImg(scene?.image))return scene?.v45728?.visualKind==='reused'?'场景图 · 沿用上一幕':'场景图 · 已缓存';
    return`文字图 · ${scene?.v45728?.fallbackReason||(!g.v45728.imageWanted?'已选择本地':'自动回退')}`;
  }
  function sceneVisual(g,scene){
    const source=safeImg(scene?.image)||textImageData(g,scene||{}),kind=safeImg(scene?.image)?'generated':'text';
    return `<div class="v45728-visual ${kind}"><img src="${AT(source)}" alt="${AT(scene?.title||g.title)}"><div class="v45728-visual-shade"></div></div>`;
  }
  function endingBanner(g,scene){
    const e=O(scene?.v45728?.endingProposal);if(!e.reached||g.v45728.endedAt)return'';
    return `<button class="v45728-ending-banner" onclick="v45728EndingPrompt(${A(g.id)},false)"><small>AI 认为故事已到结局</small><b>${E(e.title||'查看完结建议')}</b><span>由你确认 ›</span></button>`;
  }
  function stageHtml(g,scene,busy){
    const orient=g.stage.orient==='landscape'?'landscape':'portrait',step=`第 ${Math.max(1,L(g.scenes).length)} 幕`,first=L(scene?.dialogue).find(line=>S(line?.text).trim()),custom=S(document.getElementById('v4571VNCustomChoice')?.value);
    return `<section class="v45728-vn-shell is-${orient}"><i class="v45712-vn-shell v45728-observer-marker" hidden></i>
      ${sceneVisual(g,scene)}<div class="v45728-vignette"></div>
      <header class="v45728-stage-head"><button onclick="v4571VNBack()" aria-label="返回">‹</button><div><small>${E(step)}</small><b>${E(scene?.title||g.title)}</b></div><nav><button onclick="v45712VNSaves(${A(g.id)})" title="存档">▤</button><button onclick="v45712VNLoads(${A(g.id)})" title="读档">↶</button><button onclick="v45712VNItems(${A(g.id)})" title="道具">◇</button><button onclick="v45712VNStatSheet(${A(g.id)})" title="数值">▥</button><button onclick="v4571VNMenu(${A(g.id)})" title="更多">⋯</button></nav></header>
      ${statsMarkup(g)}<div class="v45728-place">${E(scene?.title||'场景')}</div>
      <div class="v45728-source"><span>${E(sourceLabel(g,scene))}</span><button onclick="v45728RegenerateSceneImage(${A(g.id)})" title="重新生成本幕画面">↻</button><button onclick="v45728SaveVisual(${A(g.id)})" title="保存当前画面">↓</button></div>
      ${scene?.narration?`<aside class="v45728-narration"><small>旁白 · 写在画面上</small>${S(scene.narration).split(/\n\n+/).filter(Boolean).slice(0,5).map(text=>`<p>${E(text)}</p>`).join('')}</aside>`:''}
      ${oocMarkup(g,scene)}${endingBanner(g,scene)}
      <div class="v45728-choices">${busy?'<div class="v45728-wait"><i></i><span>正在生成下一幕…</span></div>':''}</div>
      ${turnMarkup(g)}
      <section class="v45728-dialogue"><span class="v45728-speaker">${E(first?.speaker||'对白')}</span><div class="v45728-lines">${v45730TurnEcho(g)}${dialogueMarkup(scene)}</div><footer>${v45730TypeBar(g)}<span>${E(step)} · ${String(L(g.scenes).length).padStart(2,'0')}</span><div><input id="v4571VNCustomChoice" value="${AT(custom)}" placeholder="${E(V45730_TYPE_HINT[v45730TypeOf(g)])}"><button onclick="v45728SubmitVN()">继续</button></div><i>▾</i></footer></section>
      <button class="v45728-orient" onclick="v45728VNOrient(${A(g.id)})">${orient==='landscape'?'竖屏':'横屏'}</button>
    </section>`;
  }
  let rendering=false,lastBusy=false;
  function renderStage(busy=lastBusy){
    const root=document.getElementById('v4571VNRoot'),g=ensureGame(activeGame());if(!root||!g||root.querySelector('.v4571-vn-library,.v45728-wrap'))return false;
    if(rendering)return false;rendering=true;lastBusy=!!busy;
    try{
      const scene=L(g.scenes).at(-1)||null;root.innerHTML=stageHtml(g,scene,lastBusy);
      if(scene&&!lastBusy&&g.v45728.imageWanted&&!safeImg(scene.image)){
        scene.v45728=O(scene.v45728);
        if(!scene.v45728.visualAttempted&&!scene.v45728.visualBusy)setTimeout(()=>void ensureSceneVisual(g,scene,false),0);
      }
      return true;
    }finally{rendering=false}
  }
  window.v45728RenderVN=renderStage;
  window.v45728ToggleOoc=function(force){const panel=document.getElementById('v45728OocPanel');if(panel)panel.classList.toggle('open',typeof force==='boolean'?force:!panel.classList.contains('open'))};
  window.v45728SetTurnMode=function(id,mode){const g=ensureGame(gameById(id));if(!g)return;g.v45728.turnMode=normalizeTurn(mode);keep();renderStage(false)};
  window.v45728VNOrient=function(id){
    const g=ensureGame(gameById(id));if(!g)return;g.stage.orient=g.stage.orient==='landscape'?'portrait':'landscape';keep();
    if(g.stage.orient==='landscape'){
      try{const so=screen?.orientation;if(so?.lock){const el=document.getElementById('phone')||document.documentElement;Promise.resolve(!document.fullscreenElement&&el.requestFullscreen?el.requestFullscreen():null).then(()=>so.lock('landscape')).catch(()=>tell('请把手机横过来查看宽屏舞台'))}else tell('请把手机横过来查看宽屏舞台')}catch{tell('请把手机横过来查看宽屏舞台')}
    }else try{screen?.orientation?.unlock?.()}catch{}
    renderStage(false);
  };
  window.v45728SaveVisual=function(id){
    const g=ensureGame(gameById(id)),scene=L(g?.scenes).at(-1);if(!g||!scene)return;const generated=safeImg(scene.image),source=generated||textImageData(g,scene),a=document.createElement('a'),ext=generated&&/^data:image\/(?:jpeg|jpg)/i.test(generated)?'jpg':generated?'png':'svg';a.href=source;a.download=`${S(g.title||'文游').replace(/[\\/:*?"<>|]/g,'_')}-${S(scene.title||'场景').replace(/[\\/:*?"<>|]/g,'_')}.${ext}`;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();tell('已尝试保存当前画面');
  };

  /* ---------- 戏外不推进剧情；戏内／同时才由 USER 最终提交选择 ---------- */
  let oocBusy=false;
  async function generateOocOnly(g,text){
    const outside=g.v45728.participants.filter(p=>p.outside);if(!outside.length)return tell('没有开启戏外陪玩的角色');
    if(oocBusy)return tell('戏外陪玩者还在讨论');
    if(typeof validModel==='function'&&!validModel('chat')&&!outside.some(p=>window.v4571CharacterModelReady?.(p.characterId)))return tell('请先配置主聊天线路或陪玩人物的专属线路');
    const scene=L(g.scenes).at(-1);oocBusy=true;tell('戏外陪玩者正在讨论…');
    try{
      const raw=await legacy.invoke('chat',{activityArea:'文游戏外',characterId:outside[0].characterId,system:`这是视觉小说《${g.title}》的戏外陪玩区。下列人物知道自己在和 USER 玩文游；他们只能讨论剧情、表达偏好，不能替 USER 做最终选择，也不能把戏外内容传给戏内人物。只输出 JSON：{"oocReactions":[{"characterId":"ID","text":"反应","preference":"偏好"}]}。\n${participantPrompt(g)}`,history:[{role:'user',content:`当前场景：${scene?.title}\n旁白：${scene?.narration}\n可选方向：${L(scene?.choices).join('；')}\nUSER 在戏外说：${text}`}],temperature:.82,maxTokens:1200});
      const obj=parseJson(raw);scene.v45728=O(scene.v45728);scene.v45728.ooc=allowedOoc(g,obj,scene,'outside');rememberPlayed(g);keep();renderStage(false);
    }catch(error){tell(error?.name==='AbortError'?'戏外讨论已停止':'戏外讨论没有生成成功')}finally{oocBusy=false}
  }
  /* V45.7.30：主流程取消选项按钮，改为 USER 自己写；三种输入类型分别处理显示与注入。 */
  const V45730_TYPE_LABEL={dialogue:'对白',action:'动作',direction:'剧情方向'};
  const V45730_TYPE_HINT={dialogue:'写下你这一回合说出口的话…',action:'写下你的动作或行动…',direction:'只控制后续走向，不会写成正文…'};
  function v45730TypeOf(g){const key=S(g?.v45728?.inputType);return Object.hasOwn(V45730_TYPE_LABEL,key)?key:'dialogue'}
  function v45730TypeBar(g){const active=v45730TypeOf(g);return`<nav class="v45730-turn-types">${Object.entries(V45730_TYPE_LABEL).map(([key,label])=>`<button class="${key===active?'on':''}" onclick="v45730VNType(${A(g.id)},'${key}')" title="${E(V45730_TYPE_HINT[key])}">${E(label)}</button>`).join('')}</nav>`}
  function v45730TurnEcho(g){
    const row=g?.v45728?.lastUserTurn;if(!row)return'';
    const text=S(row.text).trim();if(!text||row.type==='direction')return'';
    const mine=S(L(data.personas).find(p=>S(p.id)===S(data.activePersonaId))?.name||L(data.personas)[0]?.name||'我');
    return row.type==='action'
      ?`<p class="v45730-turn-action">${E(text)}</p>`
      :`<p class="v45730-turn-say"><b>${E(mine)}</b>${E(text)}</p>`;
  }
  window.v45730VNType=function(id,type){const g=ensureGame(activeGame());if(!g||S(g.id)!==S(id))return;g.v45728.inputType=Object.hasOwn(V45730_TYPE_LABEL,type)?type:'dialogue';keep();renderStage()};
  window.v45728ChooseVN=function(choice){
    const g=ensureGame(activeGame());if(!g||typeof legacy.choose!=='function')return;const mode=g.v45728.turnMode;
    if(mode==='outside')return void generateOocOnly(g,`我正在考虑这个选择：${S(choice)}。你怎么看？`);
    g.v45728.pendingTurnMode=mode;keep();return legacy.choose.call(this,choice);
  };
  window.v45728SubmitVN=function(){const input=document.getElementById('v4571VNCustomChoice'),text=S(input?.value).trim(),g=ensureGame(activeGame());if(!text)return tell('先写下想说的话、动作或讨论内容');if(!g)return;const type=v45730TypeOf(g);if(g.v45728.turnMode==='outside'){if(input)input.value='';return void generateOocOnly(g,text)}g.v45728.lastUserTurn={type,text,at:new Date().toISOString()};keep();if(input)input.value='';const tagged=type==='action'?`【我的动作】${text}`:type==='direction'?`【剧情方向｜隐藏提示，不写成正文，也不复述这条指令】${text}`:`【我的对白】${text}`;window.v45728ChooseVN(tagged)};

  /* ---------- 结局只提议；确认后进入杀青名单 ---------- */
  window.v45728EndingPrompt=function(id,manual){
    const g=ensureGame(gameById(id));if(!g)return;const scene=L(g.scenes).at(-1),proposal=O(scene?.v45728?.endingProposal);
    modal(`<div class="v45728-ending-confirm"><small>${manual?'手动完结':'AI 的完结建议'}</small><h2>${E(proposal.title||g.title)}</h2><p>${E(proposal.reason||'确认后结束当前剧情推进并进入杀青名单。已有存档、场景、数值和道具都会保留。')}</p><div class="note">AI 只能提出完结。只有你确认后才会真正结束；取消后仍可继续下一幕。</div><div class="form-actions"><button onclick="v45728DismissEnding(${A(g.id)})">继续故事</button><button class="primary" onclick="v45728ConfirmEnding(${A(g.id)})">确认完结并杀青</button></div></div>`);
  };
  window.v45728DismissEnding=function(id){const g=ensureGame(gameById(id)),scene=L(g?.scenes).at(-1);if(scene){scene.v45728=O(scene.v45728);g.v45728.dismissedEndings.push(S(scene.id));delete scene.v45728.endingProposal}keep();closeModal();renderStage(false)};
  window.v45728ConfirmEnding=function(id){const g=ensureGame(gameById(id));if(!g)return;g.v45728.endedAt=NOW();g.v45728.endingSceneId=S(L(g.scenes).at(-1)?.id);g.v45728.endingSummary=S(L(g.scenes).at(-1)?.narration).slice(0,1200);rememberPlayed(g);mergeStageCast(g);keep();closeModal();window.v45728OpenWrap(g.id)};

  function existingCastMarkup(g){
    return g.v45728.participants.map(p=>{const mode=p.insideMode==='borrow'?`借角色入戏：${p.role.name||'戏中身份'}`:p.insideMode==='self'?'角色本人进入':'不进入戏内',tags=[p.outside?'戏外陪玩':'',mode].filter(Boolean);return`<article class="v45728-existing-cast"><span>${E(participantName(p).slice(0,1))}</span><div><b>${E(participantName(p))}</b><div>${tags.map(tag=>`<i>${E(tag)}</i>`).join('')}</div><p>${p.outside?'只记得和 USER 玩过这部故事，不把戏内遭遇当现实。':''}${p.insideMode==='self'?'本作默认非正史；只有另行确认纳入正史后，戏内经历才写入本人现实记忆。':''}${p.insideMode==='borrow'?'戏中身份不知道在演；其遭遇不会变成现有人物的现实经历。':''}</p></div></article>`}).join('')||'<div class="v45728-wrap-empty">本作没有现有人物参与。</div>';
  }
  function castCard(g,row){
    const complete=!!row.completedProfile,p=O(row.completedProfile);
    return `<article class="v45728-cast-card ${complete?'completed':''}"><header><span>${E(S(row.name||'角').slice(0,1))}</span><div><b>${E(row.name||'未命名角色')}</b><small>第 ${Number(row.firstScene)||1} 幕登场 · ${Number(row.lines)||0} 句对白</small></div><i>${row.kind==='npc'?'场景 NPC':'剧情角色'}</i></header><div class="v45728-cast-evidence">${E(row.brief||row.currentState||'需要依据完整剧情补全资料。')}</div>${complete?`<div class="v45728-cast-profile"><b>已依据完整剧情补全</b><p>${E(p.summary||p.experience||p.currentState||'')}</p></div><div class="v45728-cast-actions"><button onclick="v45728EditCast(${A(g.id)},${A(row.id)})">编辑</button>${row.promotedTo?'<button disabled>已加入人物</button>':`<button class="primary" onclick="v45728AddCast(${A(g.id)},${A(row.id)})">加入人物</button>`}</div>`:`<button class="v45728-complete" onclick="v45728CompleteCast(${A(g.id)},${A(row.id)})">✦ 一键补全本作经历与当前状况</button>`}</article>`;
  }
  function wrapHtml(g){
    mergeStageCast(g);const rows=L(g.v45728.generatedCast).filter(row=>!row.promotedTo||row.completedProfile);
    return `<section class="v45728-wrap"><i class="v45712-vn-shell v45728-observer-marker" hidden></i><header class="v45728-wrap-head"><button onclick="v4571VNBack()">‹</button><div><small>THE END</small><b>杀青名单</b></div><button onclick="v4571VNMenu(${A(g.id)})">⋯</button></header><main><section class="v45728-wrap-hero"><small>已由 USER 确认完结</small><h1>${E(g.title)}</h1><p>${E(g.v45728.endingSummary||'本作已经完结。')}</p><div><span>${L(g.scenes).length} 幕</span><span>${g.v45728.participants.length+rows.length} 位出场人物</span><span>${g.v45728.canon?'已纳入正史':'默认非正史'}</span></div></section><h2>现有人物参与</h2><div class="v45728-existing-list">${existingCastMarkup(g)}</div><div class="v45728-wrap-title"><h2>剧情生成角色与 NPC</h2><small>先补全，再编辑、加入</small></div>${rows.length?rows.map(row=>castCard(g,row)).join(''):'<div class="v45728-wrap-empty">没有待处理的剧情生成角色或 NPC。</div>'}<h2>正史处理</h2><button class="v45728-canon" onclick="v45728CanonPreview(${A(g.id)})"><span><b>${g.v45728.canon?'已纳入现有人物正史':'将本作纳入现有人物正史'}</b><small>只影响“本人入戏”的现有人物；借角色入戏仍然是演过的故事</small></span><i>${g.v45728.canon?'已完成':'影响预览 ›'}</i></button></main></section>`;
  }
  function renderWrap(g){const root=document.getElementById('v4571VNRoot');if(root&&g)root.innerHTML=wrapHtml(g)}
  window.v45728OpenWrap=function(id){const g=ensureGame(gameById(id));if(!g)return;if(!g.v45728.endedAt)return window.v45728EndingPrompt(g.id,true);data.visualNovelsV4571.activeId=g.id;keep();try{show('visualNovel')}catch{}renderWrap(g)};

  async function completeCast(id,castId){
    const g=ensureGame(gameById(id)),row=g?.v45728.generatedCast.find(x=>S(x.id)===S(castId));if(!g||!row||!g.v45728.endedAt)return tell('只有完结后的剧情角色与 NPC 才能补全');
    if(typeof validModel==='function'&&!validModel('chat'))return tell('请先配置主聊天线路');tell(`正在依据全部剧情补全${row.name}…`);
    try{
      const raw=await legacy.invoke('chat',{activityArea:'文游杀青',system:'你负责从一部已经完结的文游中整理一名角色。只能依据给出的完整剧情，不得编造戏外经历。只输出 JSON：{"name":"","identity":"身份","personality":"性格与说话方式","experience":"完整经历","relationships":"与各人的关系","keyChoices":"关键选择","injuries":"伤病","items":"持有物品","endingWhere":"结局去向","currentState":"当前状态","summary":"可直接写入人物页的完整摘要"}。',history:[{role:'user',content:`作品：${g.title}\n待补全对象：${JSON.stringify(row)}\n完整剧情：\n${sceneText(g,80)}`}],temperature:.45,maxTokens:2200});
      const obj=parseJson(raw);row.completedProfile={name:S(obj.name||row.name),identity:S(obj.identity),personality:S(obj.personality),experience:S(obj.experience),relationships:S(obj.relationships),keyChoices:S(obj.keyChoices),injuries:S(obj.injuries),items:S(obj.items),endingWhere:S(obj.endingWhere),currentState:S(obj.currentState),summary:S(obj.summary||obj.experience||row.brief),completedAt:NOW()};keep();renderWrap(g);
    }catch(error){tell(error?.name==='AbortError'?'补全已停止':'角色资料补全失败')}
  }
  window.v45728CompleteCast=(id,castId)=>void completeCast(id,castId);
  window.v45728EditCast=function(id,castId){
    const g=ensureGame(gameById(id)),row=g?.v45728.generatedCast.find(x=>S(x.id)===S(castId)),p=O(row?.completedProfile);if(!g||!row||!p.completedAt)return tell('请先一键补全');
    modal(`<div class="v45728-cast-editor"><h2>编辑杀青资料 · ${E(row.name)}</h2>${[['name','名字',p.name||row.name],['identity','身份',p.identity],['personality','性格与说话方式',p.personality],['experience','完整经历',p.experience],['relationships','关系',p.relationships],['keyChoices','关键选择',p.keyChoices],['injuries','伤病',p.injuries],['items','持有物品',p.items],['endingWhere','结局去向',p.endingWhere],['currentState','当前状态',p.currentState],['summary','人物摘要',p.summary]].map(([key,label,value],index)=>`<div class="field"><label>${label}</label>${index?`<textarea data-cast-field="${key}">${E(value)}</textarea>`:`<input data-cast-field="${key}" value="${AT(value)}">`}</div>`).join('')}<div class="form-actions"><button onclick="closeModal();v45728OpenWrap(${A(g.id)})">取消</button><button class="primary" onclick="v45728SaveCastEdit(${A(g.id)},${A(row.id)})">保存</button></div></div>`);
  };
  window.v45728SaveCastEdit=function(id,castId){const g=ensureGame(gameById(id)),row=g?.v45728.generatedCast.find(x=>S(x.id)===S(castId));if(!g||!row)return;const p=O(row.completedProfile);for(const input of document.querySelectorAll('[data-cast-field]'))p[S(input.dataset.castField)]=S(input.value).trim();if(!p.name)return tell('请填写名字');row.name=p.name;row.completedProfile=p;keep();closeModal();window.v45728OpenWrap(g.id);tell('杀青资料已保存')};
  window.v45728AddCast=function(id,castId){
    const g=ensureGame(gameById(id)),row=g?.v45728.generatedCast.find(x=>S(x.id)===S(castId)),p=O(row?.completedProfile);if(!g||!row||!p.completedAt)return tell('请先一键补全并确认资料');if(row.promotedTo)return tell('已经加入人物');
    if(!confirm(`将“${p.name||row.name}”加入人物？整部《${g.title}》会成为 TA 的真实经历。`))return;
    data.characters=L(data.characters);const person={id:ID('char'),name:S(p.name||row.name),description:S(p.identity),bio:S(p.summary||p.experience),personality:S(p.personality),background:S(p.experience),relationship:S(p.relationships),status:S(p.currentState),origin:`文游《${g.title}》杀青名单`,originKind:'visual-novel-cast',sourceGameId:g.id,createdAt:NOW()};data.characters.unshift(person);data.memories=L(data.memories);data.memories.unshift({id:ID('memory'),characterId:person.id,personaId:g.personaId||personaNow()?.id||'',source:'visual-novel-promoted',sourceGameId:g.id,title:`真实经历 · ${g.title}`,text:`《${g.title}》是${person.name}的真实过去。\n身份：${p.identity}\n完整经历：${p.experience}\n关系：${p.relationships}\n关键选择：${p.keyChoices}\n伤病：${p.injuries}\n物品：${p.items}\n结局去向：${p.endingWhere}\n当前状态：${p.currentState}\n\n本作场景记录：\n${sceneText(g,80).slice(0,22000)}`,createdAt:NOW()});row.promotedTo=person.id;const stageRow=L(g.stage.cast).find(x=>S(x.id)===S(row.id)||S(x.name)===S(row.name));if(stageRow)stageRow.promotedTo=person.id;keep();try{renderCharacters?.();renderChats?.()}catch{}renderWrap(g);tell(`${person.name}已加入人物`);
  };
  window.v45728CanonPreview=function(id){
    const g=ensureGame(gameById(id));if(!g||!g.v45728.endedAt)return;const direct=g.v45728.participants.filter(p=>p.insideMode==='self');
    modal(`<div class="v45728-canon-preview"><h2>纳入正史 · 影响预览</h2><div class="note">只有“角色本人进入”的现有人物会把戏内经历写入现实记忆。戏外陪玩只记得一起玩过；借角色入戏仍然只是一段演过的故事。剧情生成角色加入人物后本来就把本作视为真实过去。</div>${direct.length?direct.map(p=>`<article><b>${E(participantName(p))}</b><p>写入《${E(g.title)}》的完整本人经历、关键选择、关系和结局状态。</p></article>`).join(''):'<div class="v45728-wrap-empty">本作没有“本人入戏”的现有人物，不会改写现有人物现实经历。</div>'}<div class="form-actions"><button onclick="closeModal()">保持非正史</button>${g.v45728.canon?'<button disabled>已经纳入正史</button>':`<button class="primary" onclick="v45728ApplyCanon(${A(g.id)})">继续并再次确认</button>`}</div></div>`);
  };
  window.v45728ApplyCanon=function(id){
    const g=ensureGame(gameById(id));if(!g||g.v45728.canon)return;if(!confirm(`最后确认：把《${g.title}》写入“本人入戏”角色的现实记忆？`))return;
    data.memories=L(data.memories);for(const p of g.v45728.participants.filter(row=>row.insideMode==='self')){let m=data.memories.find(row=>row.source==='visual-novel-canon'&&S(row.sourceGameId)===S(g.id)&&S(row.characterId)===S(p.characterId));if(!m){m={id:ID('memory'),source:'visual-novel-canon',sourceGameId:g.id,characterId:p.characterId,personaId:g.personaId||personaNow()?.id||'',title:`正史经历 · ${g.title}`,createdAt:NOW()};data.memories.unshift(m)}m.text=`《${g.title}》已由 USER 确认纳入正史。${participantName(p)}以本人身份真实经历了本作。\n${sceneText(g,80)}`;m.updatedAt=NOW()}
    g.v45728.canon=true;g.v45728.nonCanon=false;keep();closeModal();renderWrap(g);tell('已纳入“本人入戏”角色的正史记忆');
  };

  /* ---------- 设置菜单、存读档与旧入口的兼容 ---------- */
  window.v4571VNMenu=function(id){
    const g=ensureGame(gameById(id));if(!g)return;const scene=L(g.scenes).at(-1);
    modal(`<div class="v45728-vn-menu"><h2>${E(g.title)}</h2><div class="about-meta"><div class="meta-row"><span>场景</span><span>${L(g.scenes).length} 幕</span></div><div class="meta-row"><span>参与者</span><span>${g.v45728.participants.length} 位 · 可混合四种来源</span></div><div class="meta-row"><span>正史</span><span>${g.v45728.canon?'已纳入':'默认非正史'}</span></div><div class="meta-row"><span>画面</span><span>${g.v45728.imageWanted?'整张场景图＋自动回退':'文字图'}</span></div></div><div class="v45728-menu-grid"><button onclick="closeModal();v45728EditParticipants(${A(g.id)})">参与方式</button><button onclick="closeModal();v45710OpenVNBinding(${A(g.id)})">规则绑定</button><button onclick="closeModal();v45726VNCast(${A(g.id)})">本作人物</button><button onclick="closeModal();v45712VNItems(${A(g.id)})">道具</button><button onclick="closeModal();v45712VNStatSheet(${A(g.id)})">数值</button><button onclick="v45728ToggleImageWanted(${A(g.id)})">${g.v45728.imageWanted?'切到文字图':'开启场景图'}</button><button onclick="closeModal();v45728RegenerateSceneImage(${A(g.id)})">重做画面</button></div><div class="form-actions"><button onclick="closeModal()">关闭</button><button onclick="closeModal();${g.v45728.endedAt?`v45728OpenWrap(${A(g.id)})`:`v45728EndingPrompt(${A(g.id)},true)`}">${g.v45728.endedAt?'杀青名单':'手动完结'}</button><button onclick="closeModal();v4571RegenerateVNScene(${A(g.id)})">重做当前幕</button><button class="danger" onclick="v4571DeleteVN(${A(g.id)})">删除存档</button></div></div>`);
  };
  try{v4571VNMenu=window.v4571VNMenu}catch{}
  window.v45726VNEnding=id=>window.v45728EndingPrompt(id,true);
  if(typeof legacy.promote==='function'){
    window.v45726Promote=function(kind,id){
      if(kind==='cast'){
        const g=games().find(game=>L(game.stage?.cast).some(row=>S(row.id)===S(id))||L(game.v45728?.generatedCast).some(row=>S(row.id)===S(id)));
        if(!g||!ensureGame(g).v45728.endedAt)return tell('剧情角色与 NPC 只有完结进入杀青名单后才能加入人物');
        const row=g.v45728.generatedCast.find(item=>S(item.id)===S(id));
        if(!row?.completedProfile?.completedAt)return tell('请先在杀青名单中一键补全本作经历与当前状况');
        return window.v45728OpenWrap(g.id);
      }
      return legacy.promote.apply(this,arguments);
    };
  }
  if(typeof legacy.saveSlot==='function'){
    window.v45712VNDoSave=function(id,slot){const g=ensureGame(gameById(id)),out=legacy.saveSlot.apply(this,arguments);const row=L(g?.stage?.saves).find(s=>Number(s.slot)===Number(slot));if(row&&g){row.v45728=clone(g.v45728);row.cast=clone(g.stage.cast);keep()}return out};
  }
  if(typeof legacy.loadSlot==='function'){
    window.v45712VNDoLoad=function(id,slot){const g=ensureGame(gameById(id)),row=L(g?.stage?.saves).find(s=>Number(s.slot)===Number(slot)),extra=row?{v:clone(row.v45728),cast:clone(row.cast)}:null,out=legacy.loadSlot.apply(this,arguments);if(g&&extra){if(extra.v)g.v45728=extra.v;if(extra.cast)g.stage.cast=extra.cast;ensureGame(g);keep();setTimeout(()=>renderStage(false),30)}return out};
  }

  function patchLibrary(root){
    const library=root?.querySelector('.v4571-vn-library');if(!library||library.dataset.v45728==='true')return;library.dataset.v45728='true';
    const hero=library.querySelector('.v4571-vn-hero');if(hero){const small=hero.querySelector('small'),title=hero.querySelector('h1'),p=hero.querySelector('p');if(small)small.textContent='VISUAL STORY';if(title)title.textContent='把人物放进一场可以选择的故事';if(p)p.textContent='整张场景图、画面旁白、戏外陪玩、戏内角色与剧情生成角色共同推进；默认非正史。'}
    const sorted=games().slice().sort((a,b)=>S(b.updatedAt).localeCompare(S(a.updatedAt)));[...library.querySelectorAll('.v4571-vn-list>article')].forEach((card,index)=>{const g=ensureGame(sorted[index]),small=card.querySelector('section>small');if(g&&small){const outside=g.v45728.participants.filter(p=>p.outside).length,inside=g.v45728.participants.filter(p=>p.insideMode!=='none').length;small.textContent=`${outside?`戏外 ${outside} · `:''}戏内 ${inside} · ${L(g.scenes).length} 幕`}});
  }
  let observer=null,queued=false;
  function inspect(){
    const root=document.getElementById('v4571VNRoot');if(!root)return;
    if(root.querySelector('.v4571-vn-library'))return patchLibrary(root);
    if(root.querySelector('.v45728-wrap,.v45728-vn-shell'))return;
    const busy=!!root.querySelector('.v4571-vn-generating,.v4571-vn-loading,.v45712-vn-wait');
    renderStage(busy);
  }
  function watch(){
    const view=document.getElementById('visualNovel');if(!view)return;
    try{observer?.disconnect()}catch{}observer=new MutationObserver(()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;inspect()},0)});observer.observe(view,{childList:true,subtree:true});inspect();
  }
  setTimeout(watch,0);
  const baseOpenVisual=window.openVisualNovel;if(typeof baseOpenVisual==='function'){
    const open=function(...args){const out=baseOpenVisual.apply(this,args);setTimeout(watch,0);return out};window.openVisualNovel=open;try{openVisualNovel=open}catch{}
  }
  if(typeof legacy.open==='function'){
    window.v4571OpenVN=function(id){const out=legacy.open.apply(this,arguments),g=ensureGame(gameById(id));setTimeout(()=>{if(g?.v45728?.endedAt)window.v45728OpenWrap(g.id);else watch()},0);return out};
    try{v4571OpenVN=window.v4571OpenVN}catch{}
  }
  window.v4571VNBack=function(){const root=document.getElementById('v4571VNRoot');if(root?.querySelector('.v45728-vn-shell,.v45728-wrap'))return window.openVisualNovel?.();try{return openView('home')}catch{}};
  try{v4571VNBack=window.v4571VNBack}catch{}
  /* V45.7.27 的旋转兜底不再使用：锁不住方向时只提示用户横放，不旋转竖屏壳。 */
  window.v45726VNOrient=window.v45728VNOrient;
  window.v45712VNRepaint=()=>renderStage(lastBusy);
})();
