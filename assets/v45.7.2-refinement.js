/* =========================================================
   POKEJI V45.7.8 · layered appearance and square stability
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV4572Loaded)return;
  window.__pokejiV4572Loaded=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const L=value=>Array.isArray(value)?value:[];
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const NOW=()=>new Date().toISOString();
  const ID=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const clamp=(value,min,max,fallback=min)=>{const number=Number(value);return Math.min(max,Math.max(min,Number.isFinite(number)?number:fallback))};
  const validHex=value=>/^#[0-9a-f]{6}$/i.test(S(value));
  const hex=(value,fallback)=>validHex(value)?S(value).toLowerCase():fallback;
  const rgb=value=>{const raw=hex(value,'#000000').slice(1);return[0,2,4].map(index=>parseInt(raw.slice(index,index+2),16))};
  const rgbHex=values=>'#'+values.map(value=>Math.max(0,Math.min(255,Math.round(value))).toString(16).padStart(2,'0')).join('');
  const mix=(first,second,amount)=>{const a=rgb(first),b=rgb(second),t=clamp(amount,0,1,0);return rgbHex(a.map((value,index)=>value+(b[index]-value)*t))};
  const rgba=(value,alpha)=>{const [r,g,b]=rgb(value);return`rgba(${r},${g},${b},${clamp(alpha,0,1,1)})`};
  const channel=value=>{const n=value/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)};
  const luminance=value=>{const [r,g,b]=rgb(value).map(channel);return .2126*r+.7152*g+.0722*b};
  const contrastRatio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const contrastText=background=>contrastRatio(background,'#111214')>=contrastRatio(background,'#fafaf8')?'#111214':'#fafaf8';
  function readableMuted(background){const text=contrastText(background);let result=text;for(let step=1;step<=24;step++){const candidate=mix(text,background,step/100);if(contrastRatio(background,candidate)<4.5)break;result=candidate}return result}

  const COLOR_FIELDS=[
    ['background','页面主色'],['panel','卡片层'],['panel2','次级卡片'],['header','顶部栏'],['dock','底栏'],
    ['accent','强调按钮'],['iconOuter','图标外层'],['icon','图标线条'],['input','输入区域'],
    ['bubbleMine','我的气泡'],['bubbleOther','对方气泡']
  ];
  const DEFAULT_COLORS={
    background:'#111114',panel:'#1d1d21',panel2:'#29292e',header:'#17171b',dock:'#202024',
    accent:'#c39a58',iconOuter:'#29292e',icon:'#e1bd79',input:'#29292e',bubbleMine:'#4a3a27',bubbleOther:'#27272c'
  };
  const fieldId=key=>`v472Color${key.charAt(0).toUpperCase()}${key.slice(1)}`;

  data.settings=O(data.settings);
  data.settings.beautyFactory={bubbleWidth:84,fontSize:14,bubbleRadius:18,bubblePadding:11,componentOpacity:.94,safeComponents:true,...O(data.settings.beautyFactory)};
  data.settings.beautyFactory.colors=O(data.settings.beautyFactory.colors);
  data.settings.beautyFactory.autoContrast=true;

  function currentTheme(){return L(data.settings.themes).find(item=>S(item.id)===S(data.settings.activeTheme))||null}
  function themeSeed(){
    const theme=currentTheme(),palette=O(theme?.palette),vars=O(theme?.vars),background=hex(palette.background||vars['--black']||vars['--paper'],DEFAULT_COLORS.background),panel=hex(palette.panel||vars['--panel'],DEFAULT_COLORS.panel),accent=hex(palette.accent||vars['--gold'],DEFAULT_COLORS.accent),text=contrastText(panel);
    return{
      background,panel,
      panel2:hex(palette.panel2||vars['--panel2'],mix(panel,text,.08)),
      header:hex(palette.header||vars['--v457-header'],mix(background,accent,.1)),
      dock:hex(palette.dock||vars['--v457-dock'],mix(background,panel,.62)),
      accent,
      iconOuter:hex(palette.iconOuter||vars['--v472-icon-outer'],mix(panel,contrastText(panel),.08)),
      icon:hex(palette.icon||vars['--theme-icon-color'],DEFAULT_COLORS.icon),
      input:hex(palette.input||vars['--v472-input'],mix(panel,contrastText(panel),.08)),
      bubbleMine:hex(palette.bubbleMine||vars['--v457-bubble-mine'],DEFAULT_COLORS.bubbleMine),
      bubbleOther:hex(palette.bubbleOther||vars['--v457-bubble-other'],DEFAULT_COLORS.bubbleOther)
    }
  }
  function resolvedColors(){const seed=themeSeed(),custom=O(data.settings.beautyFactory.colors),output={};for(const [key] of COLOR_FIELDS)output[key]=hex(custom[key],seed[key]);return output}
  function setRoot(name,value){document.documentElement.style.setProperty(name,value)}
  function applyColors(colors=resolvedColors()){
    const text={};for(const [key] of COLOR_FIELDS)text[key]=contrastText(colors[key]);
    const muted={background:readableMuted(colors.background),panel:readableMuted(colors.panel),panel2:readableMuted(colors.panel2),header:readableMuted(colors.header),dock:readableMuted(colors.dock),input:readableMuted(colors.input)};
    const variables={
      '--v472-bg':colors.background,'--v472-bg-text':text.background,'--v472-bg-muted':muted.background,
      '--v472-panel':colors.panel,'--v472-panel-text':text.panel,'--v472-panel-muted':muted.panel,
      '--v472-panel-2':colors.panel2,'--v472-panel-2-text':text.panel2,'--v472-panel-2-muted':muted.panel2,
      '--v472-header':colors.header,'--v472-header-text':text.header,'--v472-header-muted':muted.header,
      '--v472-dock':colors.dock,'--v472-dock-text':text.dock,'--v472-dock-muted':muted.dock,
      '--v472-accent':colors.accent,'--v472-accent-text':text.accent,
      '--v472-icon-outer':colors.iconOuter,'--v472-icon-outer-text':text.iconOuter,'--v472-icon':colors.icon,
      '--v472-input':colors.input,'--v472-input-text':text.input,'--v472-input-muted':muted.input,
      '--v472-bubble-mine':colors.bubbleMine,'--v472-bubble-mine-text':text.bubbleMine,
      '--v472-bubble-other':colors.bubbleOther,'--v472-bubble-other-text':text.bubbleOther,
      '--v472-line':rgba(text.panel,.22),'--v472-line-soft':rgba(text.panel,.12),
      '--black':colors.background,'--black2':colors.panel2,'--panel':colors.panel,'--panel2':colors.panel2,
      '--ivory':text.background,'--ivory2':muted.background,'--muted':muted.background,'--dim':muted.background,'--caption':muted.background,'--whisper':muted.background,
      '--gold':colors.accent,'--gold-hi':colors.icon,'--gold-lo':mix(colors.accent,'#000000',.28),'--line':rgba(text.panel,.22),'--line2':rgba(text.panel,.12),
      '--theme-icon-color':colors.icon,'--theme-home-top':colors.background,'--theme-home-bottom':mix(colors.background,colors.header,.42),
      '--accent':colors.accent,'--surface':colors.background,'--card':colors.panel,'--text':text.background,
      '--v457-header':colors.header,'--v457-dock':colors.dock,'--v457-bubble-mine':colors.bubbleMine,'--v457-bubble-other':colors.bubbleOther,
      '--v471-bg':colors.background,'--v471-panel':colors.panel,'--v471-panel-2':colors.panel2,'--v471-text':text.panel,'--v471-muted':muted.panel,
      '--v471-line':rgba(text.panel,.22),'--v471-accent':colors.accent,'--v471-accent-text':text.accent
    };
    for(const [name,value] of Object.entries(variables))setRoot(name,value);
    document.documentElement.dataset.v472Contrast='automatic';
    document.documentElement.dataset.v471Tone=luminance(colors.background)>.42?'light':'dark';
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',colors.background)
  }

  const baseBeautyApply=window.applyBeautyFactory;
  window.applyBeautyFactory=function(){if(typeof baseBeautyApply==='function')baseBeautyApply();applyColors()};

  function draftFromInputs(){
    const colors={},current=resolvedColors();for(const [key] of COLOR_FIELDS)colors[key]=hex(document.getElementById(fieldId(key))?.value,current[key]);
    const read=(id,fallback)=>{const value=Number(document.getElementById(id)?.value);return Number.isFinite(value)?value:fallback};
    return{colors,bubbleWidth:read('v472BubbleWidth',84),fontSize:read('v472FontSize',14),bubbleRadius:read('v472BubbleRadius',18),bubblePadding:read('v472BubblePadding',11),componentOpacity:read('v472ComponentOpacity',94)/100,safeComponents:document.getElementById('v472SafeComponents')?.checked!==false,homeOpacity:read('v472HomeOpacity',38)/100,chatOpacity:read('v472ChatOpacity',38)/100}
  }
  function setPreviewVariables(node,colors){if(!node)return;for(const [key,value] of Object.entries(colors)){node.style.setProperty(`--pv-${key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}`,value);node.style.setProperty(`--pv-${key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}-text`,contrastText(value))}}
  window.v472UpdateBeautyPreview=function(){
    const draft=draftFromInputs(),preview=document.getElementById('v472BeautyPreview');setPreviewVariables(preview,draft.colors);
    for(const [id,value,unit] of [['v472HomeOpacityValue',Math.round(draft.homeOpacity*100),'%'],['v472ChatOpacityValue',Math.round(draft.chatOpacity*100),'%'],['v472BubbleWidthValue',draft.bubbleWidth,'%'],['v472FontSizeValue',draft.fontSize,'px'],['v472BubbleRadiusValue',draft.bubbleRadius,'px'],['v472BubblePaddingValue',draft.bubblePadding,'px'],['v472ComponentOpacityValue',Math.round(draft.componentOpacity*100),'%']]){const node=document.getElementById(id);if(node)node.textContent=`${value}${unit}`}
    if(preview){preview.style.setProperty('--pv-bubble-width',`${draft.bubbleWidth}%`);preview.style.setProperty('--pv-font-size',`${draft.fontSize}px`);preview.style.setProperty('--pv-radius',`${draft.bubbleRadius}px`);preview.style.setProperty('--pv-padding',`${draft.bubblePadding}px`)}
  };
  function writeColorsToInputs(colors){for(const [key] of COLOR_FIELDS){const input=document.getElementById(fieldId(key));if(input)input.value=hex(colors[key],DEFAULT_COLORS[key])}v472UpdateBeautyPreview()}
  window.v472LoadThemeColors=function(){writeColorsToInputs(themeSeed());toast('已载入当前主题的分层颜色，保存后生效')};
  window.v472ResetBeautyDraft=function(){
    writeColorsToInputs(DEFAULT_COLORS);
    const values={v472BubbleWidth:84,v472FontSize:14,v472BubbleRadius:18,v472BubblePadding:11,v472ComponentOpacity:94,v472HomeOpacity:38,v472ChatOpacity:38};for(const [id,value] of Object.entries(values)){const input=document.getElementById(id);if(input)input.value=value}const safe=document.getElementById('v472SafeComponents');if(safe)safe.checked=true;v472UpdateBeautyPreview();toast('预览已恢复安全默认值，点击保存才会应用')
  };
  window.v472HomeImageOnly=function(){const input=document.getElementById('v472HomeOpacity');if(input)input.value=0;v472UpdateBeautyPreview()};
  window.v472ChatImageOnly=function(){const input=document.getElementById('v472ChatOpacity');if(input)input.value=0;v472UpdateBeautyPreview()};
  window.v472SaveBeauty=function(){
    const draft=draftFromInputs(),config=data.settings.beautyFactory;config.colors={...draft.colors};config.autoContrast=true;config.bubbleWidth=clamp(draft.bubbleWidth,58,100,84);config.fontSize=clamp(draft.fontSize,10,22,14);config.bubbleRadius=clamp(draft.bubbleRadius,0,30,18);config.bubblePadding=clamp(draft.bubblePadding,6,20,11);config.componentOpacity=clamp(draft.componentOpacity,.55,1,.94);config.safeComponents=draft.safeComponents;
    data.settings.homeBackgroundOpacity=clamp(draft.homeOpacity,0,.85,.38);data.settings.homeBackgroundMode=data.settings.homeBackgroundOpacity===0?'image':'overlay';
    if(currentChat&&typeof getChatSettings==='function'&&document.getElementById('v472ChatOpacity')){const settings=getChatSettings(currentChat);settings.backgroundOpacity=clamp(draft.chatOpacity,0,.85,.38);settings.backgroundMode=settings.backgroundOpacity===0?'image':'overlay'}
    try{save()}catch{}window.applyBeautyFactory();try{applyHomeBackground?.();applyChatBackground?.()}catch{}closeModal();toast('分层颜色、自动反色与美化尺寸已保存')
  };
  window.openBeautyFactory=function(){
    try{closeHomeEditor?.()}catch{}
    const config=data.settings.beautyFactory,colors=resolvedColors(),chatSettings=currentChat&&typeof getChatSettings==='function'?getChatSettings(currentChat):null;
    modal(`<div class="v472-beauty-factory"><header class="v472-beauty-head"><div><small>BEAUTY FACTORY · V45.7.8</small><h2>美化工厂</h2><p>每一层都可单独换色；所有文字会按所在底色自动切换为清晰的深色或浅色。</p></div><span>自动反色</span></header><section class="v472-preview-section"><div id="v472BeautyPreview" class="v472-beauty-preview"><header><b>页面顶部</b><small>文字自动反色</small></header><main><div class="v472-preview-icon"><i>♠</i><small>图标外层</small></div><article><b>卡片层</b><span>次级卡片与输入区域</span><label>输入预览</label></article><div class="v472-preview-bubbles"><p>对方气泡</p><p>我的气泡</p></div><button>强调按钮</button></main><footer><span>底栏</span><i>◇</i><i>♧</i><i>♤</i></footer></div><small>这里会即时显示图标、卡片、输入框、按钮和双方气泡的真实对比关系；预览不会提前改写已保存方案。</small></section><section><header><b>分层换色</b><small>包含图标外层；文字颜色无需手动挑选</small></header><div class="v472-color-grid">${COLOR_FIELDS.map(([key,label])=>`<label><span>${E(label)}</span><input id="${fieldId(key)}" type="color" value="${AT(colors[key])}" oninput="v472UpdateBeautyPreview()"></label>`).join('')}</div><div class="v472-inline-actions"><button onclick="v472LoadThemeColors()">载入当前主题</button><button onclick="openPaletteStudio()">图片取色 / 保存主题</button></div></section><section><header><b>壁纸层</b><small>透明度为 0 时不再用纯色遮盖图片</small></header><label class="v472-range"><span>主界面叠色透明度 <i id="v472HomeOpacityValue">${Math.round(clamp(data.settings.homeBackgroundOpacity,0,.85,.38)*100)}%</i></span><input id="v472HomeOpacity" type="range" min="0" max="85" value="${Math.round(clamp(data.settings.homeBackgroundOpacity,0,.85,.38)*100)}" oninput="v472UpdateBeautyPreview()"></label><div class="v472-inline-actions three"><button onclick="chooseHomeBackground()">选择主界面图片</button><button onclick="v472HomeImageOnly()">只用图片</button><button onclick="clearHomeBackground()">默认壁纸</button></div>${chatSettings?`<label class="v472-range"><span>当前聊天叠色透明度 <i id="v472ChatOpacityValue">${Math.round(clamp(chatSettings.backgroundOpacity,0,.85,.38)*100)}%</i></span><input id="v472ChatOpacity" type="range" min="0" max="85" value="${Math.round(clamp(chatSettings.backgroundOpacity,0,.85,.38)*100)}" oninput="v472UpdateBeautyPreview()"></label><div class="v472-inline-actions three"><button onclick="chooseChatBackground()">选择聊天图片</button><button onclick="v472ChatImageOnly()">只用图片</button><button onclick="clearChatBackground()">默认壁纸</button></div>`:''}</section><section><header><b>气泡、文字与安全组件</b><small>尺寸同样会在上方预览</small></header>${[['BubbleWidth','气泡最大宽度',58,100,clamp(config.bubbleWidth,58,100,84),'%'],['FontSize','聊天文字大小',10,22,clamp(config.fontSize,10,22,14),'px'],['BubbleRadius','气泡圆角',0,30,clamp(config.bubbleRadius,0,30,18),'px'],['BubblePadding','气泡内边距',6,20,clamp(config.bubblePadding,6,20,11),'px'],['ComponentOpacity','组件清晰度',55,100,Math.round(clamp(config.componentOpacity,.55,1,.94)*100),'%']].map(([id,label,min,max,value,unit])=>`<label class="v472-range"><span>${label} <i id="v472${id}Value">${value}${unit}</i></span><input id="v472${id}" type="range" min="${min}" max="${max}" value="${value}" oninput="v472UpdateBeautyPreview()"></label>`).join('')}<label class="v472-safe-toggle"><span><b>安全组件</b><small>只改变透明度和清晰度，不破坏桌面占格与拖动</small></span><input id="v472SafeComponents" type="checkbox" ${config.safeComponents!==false?'checked':''} onchange="v472UpdateBeautyPreview()"></label></section><div class="form-actions"><button onclick="closeModal()">取消</button><button onclick="v472ResetBeautyDraft()">恢复预设</button><button class="primary" onclick="v472SaveBeauty()">保存并应用</button></div></div>`);
    v472UpdateBeautyPreview()
  };

  function syncPalettePreview(){
    const preview=document.getElementById('v457PalettePreview');if(!preview)return;const values={background:document.getElementById('v457PaletteBackground')?.value||DEFAULT_COLORS.background,panel:document.getElementById('v457PalettePanel')?.value||DEFAULT_COLORS.panel,header:document.getElementById('v457PaletteHeader')?.value||DEFAULT_COLORS.header,dock:document.getElementById('v457PaletteDock')?.value||DEFAULT_COLORS.dock,accent:document.getElementById('v457PaletteAccent')?.value||DEFAULT_COLORS.accent,icon:document.getElementById('v457PaletteIcon')?.value||DEFAULT_COLORS.icon,bubbleMine:document.getElementById('v457PaletteBubbleMine')?.value||DEFAULT_COLORS.bubbleMine,bubbleOther:document.getElementById('v457PaletteBubbleOther')?.value||DEFAULT_COLORS.bubbleOther};
    for(const [key,value] of Object.entries(values))preview.style.setProperty(`--p-${key==='background'?'bg':key==='panel'?'card':key==='bubbleMine'?'mine':key==='bubbleOther'?'other':key}`,value);
    preview.style.setProperty('--p-bg-text',contrastText(values.background));preview.style.setProperty('--p-card-text',contrastText(values.panel));preview.style.setProperty('--p-head-text',contrastText(values.header));preview.style.setProperty('--p-dock-text',contrastText(values.dock));preview.style.setProperty('--p-accent-text',contrastText(values.accent));preview.style.setProperty('--p-mine-text',contrastText(values.bubbleMine));preview.style.setProperty('--p-other-text',contrastText(values.bubbleOther));
    const textInput=document.getElementById('v457PaletteText');if(textInput){const nextText=contrastText(values.background);if(textInput.value!==nextText)textInput.value=nextText;if(textInput.disabled!==true)textInput.disabled=true;const label=textInput.closest('label')?.querySelector('span'),labelText='主要文字 · 自动反色';if(label&&label.textContent!==labelText)label.textContent=labelText}
  }
  const basePalettePreview=window.v457PreviewPalette;if(typeof basePalettePreview==='function')window.v457PreviewPalette=function(...args){const result=basePalettePreview.apply(this,args);syncPalettePreview();return result};
  const basePaletteStudio=window.openPaletteStudio;if(typeof basePaletteStudio==='function')window.openPaletteStudio=function(...args){const result=basePaletteStudio.apply(this,args);setTimeout(syncPalettePreview,0);return result};

  function refreshFactoryEntry(){const button=document.querySelector('[data-v471-beauty] button'),label='分层颜色 / 尺寸 / 实时预览';if(button&&button.textContent!==label)button.textContent=label}
  for(const name of ['v457ActivateTheme','v457SavePalette','v457ResetTheme']){const base=window[name];if(typeof base==='function'&&!base.__v472Colors){const wrapped=function(...args){const result=base.apply(this,args);setTimeout(()=>{data.settings.beautyFactory.colors=name==='v457ResetTheme'?{}:{...themeSeed()};try{save()}catch{}applyColors()},0);return result};wrapped.__v472Colors=true;window[name]=wrapped}}

  /* ---------- Square data repair and compact tool placement ---------- */
  function arrayLike(value){if(Array.isArray(value))return value;if(value&&typeof value==='object')return Object.values(value);return[]}
  function normalizeMessage(message){if(typeof message==='string')return{id:ID('dm'),direction:'incoming',text:message,at:NOW(),read:false};const row=O(message);if(!S(row.text).trim())return null;row.id=S(row.id||ID('dm'));row.direction=row.direction==='outgoing'?'outgoing':'incoming';row.at=S(row.at||row.createdAt||NOW());row.read=row.read===true;row.text=S(row.text);return row}
  function activePersonaId(){try{return activePersonaFor(currentChat)?.id||data.activePersonaId||'persona_default'}catch{return data.activePersonaId||data.personas?.[0]?.id||'persona_default'}}
  function normalizeSquareData(persist=false){
    let changed=false,before='';if(persist)try{before=JSON.stringify([data.squareV452,data.squareSocialV4571])}catch{}
    data.squareV452=O(data.squareV452);data.squareV452.personas=O(data.squareV452.personas);data.squareSocialV4571=O(data.squareSocialV4571);data.squareSocialV4571.personas=O(data.squareSocialV4571.personas);
    const ids=new Set([...Object.keys(data.squareV452.personas),...Object.keys(data.squareSocialV4571.personas),activePersonaId()]);
    for(const id of ids){
      const social=data.squareSocialV4571.personas[id]=O(data.squareSocialV4571.personas[id]);
      const rawCreators=arrayLike(social.creators),creators=rawCreators.map(O).filter(item=>S(item.name).trim()).map(item=>{if(!item.id){item.id=ID('creator');changed=true}item.name=S(item.name).slice(0,60);item.handle=S(item.handle||item.name).replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g,'').slice(0,36)||`creator${Date.now()%10000}`;item.niche=S(item.niche||'生活');item.bio=S(item.bio);item.voice=S(item.voice);item.reason=S(item.reason);return item});if(creators.length!==rawCreators.length)changed=true;social.creators=creators;
      social.friends=[...new Set(arrayLike(social.friends).map(S).filter(Boolean))];social.blocked=[...new Set(arrayLike(social.blocked).map(S).filter(Boolean))];social.strangerInbox=arrayLike(social.strangerInbox).map(normalizeMessage).filter(Boolean);social.threads=O(social.threads);for(const [key,value] of Object.entries(social.threads)){const rows=arrayLike(value).map(normalizeMessage).filter(Boolean);if(!rows.length)delete social.threads[key];else social.threads[key]=rows}
      const creatorMap=new Map(creators.map(item=>[S(item.id),item])),square=data.squareV452.personas[id]=O(data.squareV452.personas[id]);
      for(const [bucket,format] of [['posts','post'],['shorts','short'],['longs','long'],['threads','thread']]){
        const source=arrayLike(square[bucket]),rows=source.map(O).filter(item=>item&&Object.keys(item).length).map(item=>{if(!item.id){item.id=ID(format);changed=true}item.format=format;item.title=S(item.title||item.content||'未命名内容');item.content=S(item.content||item.summary||item.article);item.summary=S(item.summary||item.content);item.participants=arrayLike(item.participants).map(S).filter(Boolean);item.comments=arrayLike(item.comments).map(comment=>typeof comment==='string'?{id:ID('comment'),authorType:'virtual',author:'路过的人',text:comment,at:NOW(),likes:0}:O(comment)).filter(comment=>S(comment.text).trim());item.visibility=['public','friends','private'].includes(item.visibility)?item.visibility:(item.private?'private':'public');item.private=item.visibility==='private';item.likes=Math.max(0,Number(item.likes)||0);item.views=Math.max(item.likes,Number(item.views)||0);item.shares=Math.max(0,Number(item.shares)||0);item.createdAt=S(item.createdAt||NOW());if(item.authorType==='creator'){const author=creatorMap.get(S(item.authorId));item.authorName=S(item.authorName||author?.name||'广场主播');item.author=S(item.author||item.authorName);if(item.authorId&&!item.participants.some(token=>token===`creator:${item.authorId}`))item.participants.unshift(`creator:${item.authorId}`)}if(format==='long'){item.article=S(item.article||item.content);item.chapters=arrayLike(item.chapters).map((chapter,index)=>typeof chapter==='string'?{title:`第 ${index+1} 幕`,text:chapter}:{title:S(chapter?.title||`第 ${index+1} 幕`),text:S(chapter?.text)});if(!item.chapters.length)item.chapters=[{title:item.title,text:item.content}]}return item});if(rows.length!==source.length)changed=true;square[bucket]=rows
      }
      square.drafts=arrayLike(square.drafts).map(O).filter(item=>Object.keys(item).length);square.viewHistory=arrayLike(square.viewHistory).map(O).filter(item=>item.id);square.liked=arrayLike(square.liked).map(S);square.saved=arrayLike(square.saved).map(S);square.tab=['short','feed','long','forum','profile'].includes(square.tab)?square.tab:'short'
    }
    if(persist&&before)try{changed=changed||before!==JSON.stringify([data.squareV452,data.squareSocialV4571])}catch{}
    if(persist&&changed)try{save()}catch{}return changed
  }
  function repairSquareTools(){
    const body=document.querySelector('.v452-app-square');if(!body)return;for(const old of body.querySelectorAll(':scope > .v4571-square-social-bar'))old.remove();
    const shell=body.querySelector(':scope > .v452-square'),tabs=shell?.querySelector(':scope > .v452-square-tabs');if(!shell||!tabs||shell.classList.contains('v453-profile-shell'))return;
    let tools=shell.querySelector(':scope > .v472-square-tools');if(!tools){tools=document.createElement('nav');tools.className='v472-square-tools';tools.innerHTML='<button onclick="v4571OpenSquareSocial()"><span>♧</span><b>主播与私信</b></button><button onclick="v4571GenerateSquareDiscovery()"><span>✦</span><b>生成发现页</b></button>';tabs.after(tools)}shell.classList.add('v472-square-tools-enabled')
  }
  function reportSquareError(error){console.error('V45.7.8 square recovery',error);if(typeof errorDetail==='function')errorDetail(error,'广场页面异常已拦截');else if(typeof toast==='function')toast('广场页面数据已修复，请重新打开')}
  function wrapSquare(name){const base=window[name];if(typeof base!=='function'||base.__v472Square)return;const wrapped=function(...args){normalizeSquareData();try{const result=base.apply(this,args);if(result&&typeof result.then==='function')return result.then(value=>{normalizeSquareData(true);setTimeout(repairSquareTools,0);return value}).catch(error=>{normalizeSquareData(true);reportSquareError(error)});setTimeout(repairSquareTools,0);return result}catch(error){normalizeSquareData(true);reportSquareError(error)}};wrapped.__v472Square=true;window[name]=wrapped}
  for(const name of ['v452SetSquareTab','v452OpenSquareSettings','v453OpenSquareProfile','v456OpenSquareManager','v452OpenShortArticle','v452OpenPostDetail','v452OpenLongDetail','v452OpenThread','v4571OpenSquareSocial','v4571OpenSquareInbox','v4571OpenCreator','v4571GenerateSquareCreators','v4571GenerateSquareDiscovery','v4571GenerateStrangerMessage'])wrapSquare(name);
  const baseCreatorChannel=window.v453OpenCreatorChannel;if(typeof baseCreatorChannel==='function')window.v453OpenCreatorChannel=function(token){const value=S(token);if(value.startsWith('creator:'))return window.v4571OpenCreator?.(value.slice(8));return baseCreatorChannel.apply(this,arguments)};

  let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refreshFactoryEntry();if(document.querySelector('.v452-app-square')){normalizeSquareData();repairSquareTools()}if(document.getElementById('v457PalettePreview'))syncPalettePreview()})});
  try{observer.observe(document.body,{childList:true,subtree:true})}catch{}
  normalizeSquareData(true);window.applyBeautyFactory();refreshFactoryEntry();repairSquareTools();
  window.addEventListener('pageshow',()=>{normalizeSquareData();window.applyBeautyFactory();repairSquareTools()});
})();

/* ---------- API manager and API library: one authoritative final layer ---------- */
(function(){
  'use strict';
  if(window.__pokejiV4572ApiLoaded)return;
  window.__pokejiV4572ApiLoaded=true;
  const S=(value,fallback='')=>String(value??fallback),O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{},L=value=>Array.isArray(value)?value:[];
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value),A=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`,NOW=()=>new Date().toISOString(),ID=()=>`api_${typeof v44UUID==='function'?v44UUID():Math.random().toString(36).slice(2)}`;
  const PROVIDERS={
    text:[['openai','OpenAI 兼容协议'],['anthropic','Claude 原生协议'],['gemini','Gemini 原生协议']],
    voice:[['openai','OpenAI 兼容 TTS'],['fish','Fish Audio'],['minimax','MiniMax']],
    image:[['openai_image','OpenAI 兼容生图'],['gemini_image','Gemini 原生生图'],['xai_image','xAI Images'],['novelai','NovelAI']]
  };
  const BRANDS=[['auto','自动识别'],['openai','OpenAI / GPT'],['anthropic','Anthropic / Claude'],['google','Google / Gemini'],['deepseek','DeepSeek'],['xai','xAI / Grok'],['qwen','通义 / Qwen'],['other','其他兼容模型']];
  const DEFAULT_PROVIDER={text:'openai',voice:'openai',image:'openai_image'};
  const capabilityFor=kind=>kind==='voice'?'voice':kind==='image'?'image':'text';
  function labels(){return{...(typeof V435_FUNCTION_LABELS!=='undefined'?V435_FUNCTION_LABELS:{}),chat:'主聊天',translation:'翻译',feed:'动态与广场',random:'随机事件',voice:'声音',vision:'图片识别',image:'生图',summary:'记忆摘要',characterCompletion:'人物补全',personaCompletion:'面具补全'}}
  function providerAllowed(capability,provider){return(PROVIDERS[capability]||PROVIDERS.text).some(([value])=>value===provider)}
  function providerOptions(capability,selected){const rows=PROVIDERS[capability]||PROVIDERS.text,value=providerAllowed(capability,selected)?selected:DEFAULT_PROVIDER[capability];return rows.map(([id,name])=>`<option value="${id}" ${id===value?'selected':''}>${name}</option>`).join('')}
  function brandOptions(selected='auto'){return BRANDS.map(([id,name])=>`<option value="${id}" ${id===selected?'selected':''}>${name}</option>`).join('')}
  function ready(cfg){return!!(cfg&&S(cfg.base).trim()&&S(cfg.key).trim()&&S(cfg.model).trim())}
  function host(value){try{return new URL(S(value)).host||'未填写地址'}catch{return S(value).replace(/^https?:\/\//,'').split('/')[0]||'未填写地址'}}
  function summary(cfg){const parts=[S(cfg.model||'未填写模型'),host(cfg.base)];if(!S(cfg.key).trim())parts.push('缺少密钥');return parts.join(' · ')}
  function cleanConfig(raw,id){
    const source=O(raw),capability=['text','voice','image'].includes(source.capability)?source.capability:'text',provider=providerAllowed(capability,source.provider)?source.provider:DEFAULT_PROVIDER[capability],cfg={...source};
    cfg.id=S(id||source.id||ID());cfg.name=S(source.name||'未命名线路').trim()||'未命名线路';cfg.capability=capability;cfg.provider=provider;cfg.modelBrand=capability==='text'?S(source.modelBrand||'auto'):'auto';cfg.base=S(source.base).trim();cfg.key=S(source.key||source.apiKey||source.token);cfg.model=S(source.model).trim();cfg.voice=S(source.voice||'alloy').trim()||'alloy';cfg.speed=Math.min(2,Math.max(.5,Number(source.speed)||1));cfg.signature=[cfg.capability,cfg.provider,cfg.base,cfg.key,cfg.model,cfg.voice].join('|');cfg.createdAt=S(source.createdAt||NOW());cfg.updatedAt=S(source.updatedAt||NOW());return cfg
  }
  function configMap(value){if(!Array.isArray(value))return O(value);const output={};for(const raw of value){if(!raw||typeof raw!=='object'||Array.isArray(raw))continue;let id=S(raw.id||ID());while(output[id])id=ID();output[id]=raw}return output}
  function migrateLegacyModels(){
    let changed=false;for(const [kind,raw] of Object.entries(data.models)){if(data.apiDisabledKinds[kind]===true)continue;const current=data.apiConfigs[S(data.modelBindings[kind])];if(current&&current.capability===capabilityFor(kind))continue;const profile=O(raw);if(!S(profile.base).trim()||!S(profile.key).trim()||!S(profile.model).trim())continue;
      const capability=capabilityFor(kind),candidate=cleanConfig({name:`${labels()[kind]||kind} · 旧配置`,capability,provider:profile.provider,base:profile.base,key:profile.key,model:profile.model,voice:profile.voice,speed:profile.speed,modelBrand:profile.modelBrand},ID());let id=Object.keys(data.apiConfigs).find(key=>data.apiConfigs[key]?.signature===candidate.signature);if(!id){id=candidate.id;data.apiConfigs[id]=candidate}data.modelBindings[kind]=id;changed=true
    }return changed
  }
  function repairApiLibrary({persist=false,runLegacy=false}={}){
    let before='';if(persist)try{before=JSON.stringify([data.apiConfigs,data.modelBindings,data.apiDisabledKinds,L(data.characters).map(person=>[person?.id,person?.chatApiConfigId])])}catch{}
    let changed=Array.isArray(data.apiConfigs);data.apiConfigs=configMap(data.apiConfigs);data.modelBindings=O(data.modelBindings);data.apiDisabledKinds=O(data.apiDisabledKinds);data.models=O(data.models);data.characters=L(data.characters);
    for(const [id,raw] of Object.entries(data.apiConfigs)){if(!raw||typeof raw!=='object'||Array.isArray(raw)){delete data.apiConfigs[id];changed=true;continue}const cleaned=cleanConfig(raw,id);if(JSON.stringify(raw)!==JSON.stringify(cleaned))changed=true;data.apiConfigs[id]=cleaned}
    if(runLegacy)try{changed=migrateLegacyModels()||changed}catch(error){console.warn('V45.7.8 legacy API migration skipped',error)}
    for(const [kind,id] of Object.entries(data.modelBindings)){const cfg=data.apiConfigs[id],expected=capabilityFor(kind);if(data.apiDisabledKinds[kind]===true||!cfg||cfg.capability!==expected){delete data.modelBindings[kind];if(!cfg||cfg.capability!==expected)data.apiDisabledKinds[kind]=true;changed=true}}
    for(const person of data.characters){if(person.chatApiConfigId){const cfg=data.apiConfigs[person.chatApiConfigId];if(!cfg||cfg.capability!=='text'){person.chatApiConfigId='';changed=true}}}
    if(persist&&before)try{changed=changed||before!==JSON.stringify([data.apiConfigs,data.modelBindings,data.apiDisabledKinds,data.characters.map(person=>[person?.id,person?.chatApiConfigId])])}catch{}
    if(persist&&changed)try{save()}catch{}return changed
  }
  window.v435EnsureApiLibrary=function(){repairApiLibrary({runLegacy:true})};try{v435EnsureApiLibrary=window.v435EnsureApiLibrary}catch{}

  window.renderModelProfiles=function(){
    repairApiLibrary({persist:true,runLegacy:true});const root=document.getElementById('modelProfiles');if(!root)return;const configs=Object.values(data.apiConfigs),complete=configs.filter(ready).length,allLabels=labels();
    const configRows=configs.length?configs.map(cfg=>`<button class="v472-api-row ${ready(cfg)?'ready':'incomplete'}" onclick="v435EditApiConfig(${A(cfg.id)})"><span class="api-kind">${cfg.capability==='voice'?'V':cfg.capability==='image'?'I':'T'}</span><span><b>${E(cfg.name)}</b><small>${E(summary(cfg))}</small></span><em>${ready(cfg)?'可用':'待补全'}</em><i>›</i></button>`).join(''):'<div class="api-library-empty"><b>还没有保存线路</b><small>新增后可分别绑定聊天、翻译、广场、声音、生图或补全。</small></div>';
    const bindingRows=Object.entries(allLabels).map(([kind,label])=>{const id=S(data.modelBindings[kind]),cfg=data.apiConfigs[id],valid=cfg&&cfg.capability===capabilityFor(kind)&&ready(cfg)&&data.apiDisabledKinds[kind]!==true;return`<button class="${valid?'bound':'unbound'}" onclick="v435BindFunction(${A(kind)})"><span><b>${E(label)}</b><small>${valid?E(`${cfg.name} · ${cfg.model}`):cfg&&!ready(cfg)?'所选线路尚未补全':'未使用'}</small></span><i>${valid?'更换':'选择'} ›</i></button>`}).join('');
    root.innerHTML=`<div class="api-library-head v472-api-head"><span><b>API 管理与配置库</b><small>${configs.length} 套已保存 · ${complete} 套可用</small></span><div><button onclick="v472AuditApiLibrary()">检查</button><button class="primary" onclick="v435EditApiConfig()">＋ 新增</button></div></div><div class="api-library-list v472-api-list">${configRows}</div><div class="api-bind-title"><b>功能绑定</b><small>每项只会显示能力类型兼容的线路</small></div><div class="api-bindings v472-api-bindings">${bindingRows}</div>`
  };try{renderModelProfiles=window.renderModelProfiles}catch{}

  window.v472AuditApiLibrary=function(){const changed=repairApiLibrary({persist:true,runLegacy:true});renderModelProfiles();toast(changed?'已修复失效绑定和旧线路数据':'API 配置库结构正常')};
  window.v435EditApiConfig=function(id=''){
    repairApiLibrary({runLegacy:true});const existing=id&&data.apiConfigs[id],cfg=existing||cleanConfig({name:'',capability:'text',provider:'openai',modelBrand:'auto',base:'',key:'',model:'',voice:'alloy',speed:1},'');
    modal(`<div class="v472-api-editor"><header><small>API MANAGER · V45.7.8</small><h2>${existing?'编辑线路':'新增线路'}</h2><p>地址、密钥和模型统一保存在这套线路中；密钥默认隐藏。改变能力类型后，不兼容的旧绑定会自动解除。</p></header><div class="field"><label>线路名称</label><input id="apiCfgName" autocomplete="off" value="${AT(existing?cfg.name:'')}" placeholder="例如：主聊天线路"></div><div class="v472-api-two"><div class="field"><label>能力类型</label><select id="apiCfgCapability" onchange="v472ApiCapabilityChanged()"><option value="text" ${cfg.capability==='text'?'selected':''}>文本 / 识图</option><option value="voice" ${cfg.capability==='voice'?'selected':''}>声音</option><option value="image" ${cfg.capability==='image'?'selected':''}>生图</option></select></div><div class="field"><label>请求协议</label><select id="mpProvider" onchange="modelProviderChanged()">${providerOptions(cfg.capability,cfg.provider)}</select></div></div><div id="v472ApiBrandField" class="field" style="display:${cfg.capability==='text'?'block':'none'}"><label>模型品牌（只作识别，不改变协议）</label><select id="apiModelBrand">${brandOptions(cfg.modelBrand)}</select></div><div class="field"><label>API Base URL</label><input id="mpBase" autocomplete="off" inputmode="url" value="${AT(cfg.base)}" placeholder="https://..."></div><div class="field"><label>API Key / Token</label><input id="mpKey" type="password" name="service-token-value" autocomplete="off" autocorrect="off" spellcheck="false" data-secret-key="true" data-lpignore="true" value="${AT(cfg.key)}"></div><div class="field"><label>模型名</label><div class="model-input-row"><input id="mpModel" autocomplete="off" value="${AT(cfg.model)}" placeholder="可手填，也可读取模型列表"><button id="mpFetchBtn" type="button" onclick="fetchAvailableModels()">获取并测试</button></div><div id="mpFetchedModels" class="model-fetch-result"></div></div><div id="apiVoiceFields" style="display:${cfg.capability==='voice'?'block':'none'}"><div class="v472-api-two"><div class="field"><label>Voice ID</label><input id="mpVoice" autocomplete="off" value="${AT(cfg.voice||'alloy')}"></div><div class="field"><label>语速</label><input id="mpSpeed" type="number" min="0.5" max="2" step="0.05" value="${AT(cfg.speed||1)}"></div></div></div><div class="v472-api-state"><i></i><span><b>保存前检查</b><small>允许暂存未完成线路；只有地址、密钥和模型都齐全时才可绑定调用。</small></span></div><div class="form-actions">${existing?`<button class="danger" onclick="v435DeleteApiConfig(${A(id)})">删除</button><button onclick="v472DuplicateApiConfig(${A(id)})">复制</button>`:''}<button onclick="closeModal()">取消</button><button class="primary" onclick="v435SaveApiConfig(${A(id)})">保存线路</button></div></div>`);
    setTimeout(()=>{try{window.v45HardenInputs?.();document.querySelector('#mpKey')?.setAttribute('type','password')}catch{}},0)
  };try{v435EditApiConfig=window.v435EditApiConfig}catch{}
  window.v472ApiCapabilityChanged=function(){const capability=document.getElementById('apiCfgCapability')?.value||'text',provider=document.getElementById('mpProvider'),current=provider?.value||'';if(provider)provider.innerHTML=providerOptions(capability,current);const brand=document.getElementById('v472ApiBrandField'),voice=document.getElementById('apiVoiceFields');if(brand)brand.style.display=capability==='text'?'block':'none';if(voice)voice.style.display=capability==='voice'?'block':'none';try{modelProviderChanged?.()}catch{}};
  window.v45ApiCapabilityChanged=window.v472ApiCapabilityChanged;window.v435ApiCapabilityChanged=window.v472ApiCapabilityChanged;try{v435ApiCapabilityChanged=window.v472ApiCapabilityChanged}catch{}
  window.v435SaveApiConfig=function(id=''){
    repairApiLibrary();const name=S(document.getElementById('apiCfgName')?.value).trim(),capability=S(document.getElementById('apiCfgCapability')?.value||'text');if(!name)return toast('请填写线路名称');
    const configId=id||ID(),previous=data.apiConfigs[configId],provider=S(document.getElementById('mpProvider')?.value||DEFAULT_PROVIDER[capability]),cfg=cleanConfig({id:configId,name,capability,provider,modelBrand:capability==='text'?S(document.getElementById('apiModelBrand')?.value||'auto'):'auto',base:S(document.getElementById('mpBase')?.value).trim(),key:S(document.getElementById('mpKey')?.value),model:S(document.getElementById('mpModel')?.value).trim(),voice:S(document.getElementById('mpVoice')?.value||previous?.voice||'alloy').trim(),speed:Number(document.getElementById('mpSpeed')?.value)||previous?.speed||1,createdAt:previous?.createdAt||NOW(),updatedAt:NOW()},configId);data.apiConfigs[configId]=cfg;
    let unbound=0;for(const [kind,bound] of Object.entries(data.modelBindings))if(bound===configId&&capabilityFor(kind)!==cfg.capability){delete data.modelBindings[kind];data.apiDisabledKinds[kind]=true;unbound++}if(cfg.capability!=='text')for(const person of data.characters)if(person.chatApiConfigId===configId){person.chatApiConfigId='';unbound++}
    try{save()}catch{}closeModal();renderModelProfiles();toast(`${ready(cfg)?'线路已保存并可绑定':'线路已暂存，补全地址、密钥和模型后方可调用'}${unbound?`；已解除 ${unbound} 个不兼容绑定`:''}`)
  };try{v435SaveApiConfig=window.v435SaveApiConfig}catch{}
  window.v472DuplicateApiConfig=function(id){const source=data.apiConfigs[id];if(!source)return;const copy=cleanConfig({...source,name:`${source.name} · 副本`,createdAt:NOW(),updatedAt:NOW()},ID());data.apiConfigs[copy.id]=copy;save();closeModal();renderModelProfiles();toast('已复制为独立线路')};
  window.v435DeleteApiConfig=function(id){const cfg=data.apiConfigs[id];if(!cfg)return;if(!confirm(`删除线路“${cfg.name}”？使用它的功能和人物专属线路会改为未绑定。`))return;delete data.apiConfigs[id];let affected=0;for(const [kind,bound] of Object.entries(data.modelBindings))if(bound===id){delete data.modelBindings[kind];data.apiDisabledKinds[kind]=true;affected++}for(const person of data.characters)if(person.chatApiConfigId===id){person.chatApiConfigId='';affected++}save();closeModal();renderModelProfiles();toast(`线路已删除${affected?`，并清理 ${affected} 个关联绑定`:''}`)};try{v435DeleteApiConfig=window.v435DeleteApiConfig}catch{}
  window.v435BindFunction=function(kind){
    repairApiLibrary({persist:true,runLegacy:true});const allLabels=labels(),capability=capabilityFor(kind),configs=Object.values(data.apiConfigs).filter(cfg=>cfg.capability===capability),current=S(data.modelBindings[kind]),usable=configs.filter(ready);
    modal(`<div class="v472-api-binding"><header><small>FUNCTION ROUTE</small><h2>绑定${E(allLabels[kind]||kind)}</h2><p>这里只列出“${capability==='voice'?'声音':capability==='image'?'生图':'文本'}”类型线路。未完成的线路会显示，但不能选中。</p></header><div class="api-binding-picker"><label><input type="radio" name="apiBinding" value="__none__" ${!current||data.apiDisabledKinds[kind]?'checked':''}><span><b>不使用此功能</b><small>不会自动调用旧线路</small></span></label>${configs.map(cfg=>`<label class="${ready(cfg)?'ready':'incomplete'}"><input type="radio" name="apiBinding" value="${AT(cfg.id)}" ${cfg.id===current&&data.apiDisabledKinds[kind]!==true?'checked':''} ${ready(cfg)?'':'disabled'}><span><b>${E(cfg.name)}</b><small>${E(summary(cfg))}</small></span><em>${ready(cfg)?'可用':'待补全'}</em></label>`).join('')}</div>${!configs.length?'<div class="note">还没有此能力类型的线路，可先新增一套。</div>':''}<div class="form-actions"><button onclick="closeModal();v435EditApiConfig()">新增线路</button><button onclick="closeModal()">取消</button><button class="primary" onclick="v435SaveBinding(${A(kind)})">保存绑定</button></div></div>`)
  };try{v435BindFunction=window.v435BindFunction}catch{}
  window.v435SaveBinding=function(kind){const id=document.querySelector('input[name="apiBinding"]:checked')?.value;if(!id)return toast('请选择一项');if(id==='__none__'){delete data.modelBindings[kind];data.apiDisabledKinds[kind]=true;if(data.models[kind])data.models[kind]={provider:'openai',base:'',key:'',model:'',voice:'alloy',speed:1}}else{const cfg=data.apiConfigs[id];if(!cfg||cfg.capability!==capabilityFor(kind)||!ready(cfg))return toast('这套线路尚未完成或能力类型不兼容');data.modelBindings[kind]=id;delete data.apiDisabledKinds[kind]}save();closeModal();renderModelProfiles();toast(`${labels()[kind]||kind}${id==='__none__'?'已停用':'已完成绑定'}`)};try{v435SaveBinding=window.v435SaveBinding}catch{}

  function resolvedCharacterConfig(){
    let characterId=S(data.runtime?.v4571?.activeCharacterId),group=null;
    if(!characterId&&typeof groupForChat==='function')try{group=groupForChat(typeof currentChat==='undefined'?'':currentChat)}catch{}
    if(!characterId&&group){const pending=typeof groupPendingSpeaker==='undefined'?'':S(groupPendingSpeaker);characterId=pending||S(L(group.memberIds)[Number(group.turnIndex)||0])}
    if(!characterId&&typeof directCharacterForChat==='function')try{characterId=S(directCharacterForChat(typeof currentChat==='undefined'?'':currentChat)?.id)}catch{}
    const person=L(data.characters).find(item=>S(item?.id)===characterId),cfg=person&&data.apiConfigs[S(person.chatApiConfigId)];
    return cfg?.capability==='text'&&ready(cfg)?cfg:null
  }
  function profileFromConfig(cfg,capability='text'){return{provider:cfg?.provider||DEFAULT_PROVIDER[capability],base:S(cfg?.base),key:S(cfg?.key),model:S(cfg?.model),voice:S(cfg?.voice||'alloy'),speed:Number(cfg?.speed)||1,modelBrand:S(cfg?.modelBrand||'auto')}}
  const priorModelProfile=window.modelProfile;
  window.modelProfile=function(kind='chat'){
    repairApiLibrary();const expected=capabilityFor(kind),personal=kind==='chat'?resolvedCharacterConfig():null;
    if(personal)return profileFromConfig(personal,'text');
    if(data.apiDisabledKinds[kind]===true)return profileFromConfig(null,expected);
    const id=S(data.modelBindings[kind]),cfg=data.apiConfigs[id];if(cfg&&cfg.capability===expected)return profileFromConfig(cfg,expected);
    return typeof priorModelProfile==='function'?priorModelProfile(kind):profileFromConfig(null,expected)
  };try{modelProfile=window.modelProfile}catch{}
  window.validModel=function(kind='chat'){const profile=window.modelProfile(kind);return!!(profile?.base&&profile?.key&&profile?.model)};try{validModel=window.validModel}catch{}window.validAPI=()=>window.validModel('chat');try{validAPI=window.validAPI}catch{}
  repairApiLibrary({persist:true,runLegacy:true});setTimeout(()=>window.renderModelProfiles(),0)
})();
