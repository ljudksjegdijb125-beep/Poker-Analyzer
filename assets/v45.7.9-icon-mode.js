/* =========================================================
   POKEJI V45.7.9 · reversible home icon display mode
   - image mode keeps existing and custom images
   - pure SVG mode changes display only and follows the theme
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV4579IconModeLoaded)return;
  window.__pokejiV4579IconModeLoaded=true;

  const IMAGE_MODE='image',SVG_MODE='svg';
  const SVG_FALLBACK='<rect x="6" y="6" width="20" height="20" rx="5"/><path d="M11 12h10M11 16h10M11 20h6"/>';
  const SVG_ICONS={
    chats:'<path d="M6 8.5h20v13H14l-6 4v-4H6z"/><path d="M11 13h10M11 17h7"/>',
    contacts:'<circle cx="16" cy="10.5" r="4.4"/><path d="M8.5 27c.7-6.1 3.2-9.1 7.5-9.1s6.8 3 7.5 9.1"/><path d="M6 5h4M22 5h4"/>',
    groups:'<circle cx="12" cy="11" r="3.6"/><circle cx="21.5" cy="12.5" r="3"/><path d="M5.5 25c.5-5.3 2.7-8 6.5-8s6 2.7 6.5 8M18 18.3c1-.7 2.1-1 3.5-1 3.3 0 5.2 2.2 5.7 6.7"/>',
    feed:'<circle cx="16" cy="16" r="10"/><path d="M16 6v20M6 16h20"/><circle cx="16" cy="16" r="3.2"/>',
    world:'<path d="M5 6.5A3.5 3.5 0 0 1 8.5 3H15v19H8.5A3.5 3.5 0 0 0 5 25V6.5Z"/><path d="M27 6.5A3.5 3.5 0 0 0 23.5 3H17v19h6.5A3.5 3.5 0 0 1 27 25V6.5Z"/><path d="M8 7h4M20 7h4"/>',
    memory:'<path d="M7 7.5A3.5 3.5 0 0 1 10.5 4H24v17.5A4.5 4.5 0 0 0 19.5 17H7V7.5Z"/><path d="M7 17h12.5A4.5 4.5 0 0 1 24 21.5V25H10.5A3.5 3.5 0 0 1 7 21.5V17Z"/><path d="M11 8h8M11 11h6M11 20h7"/>',
    engine:'<circle cx="16" cy="16" r="9.2"/><path d="m16 7.7 2.3 6 6 2.3-6 2.3-2.3 6-2.3-6-6-2.3 6-2.3 2.3-6Z"/><circle cx="16" cy="16" r="1.8"/>',
    settings:'<circle cx="16" cy="16" r="4.1"/><path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3M7.9 7.9l2.1 2.1M22 22l2.1 2.1M24.1 7.9 22 10M10 22l-2.1 2.1"/><circle cx="16" cy="16" r="9.1" stroke-dasharray="2 3"/>',
    safety:'<path d="M16 4 25 7v7.7c0 6.1-3.6 10.6-9 13.3-5.4-2.7-9-7.2-9-13.3V7l9-3Z"/><path d="m11.5 16 3 3 6-7"/>',
    learning:'<path d="M5 7.5A3.5 3.5 0 0 1 8.5 4H15v21H8.5A3.5 3.5 0 0 0 5 28V7.5Z"/><path d="M27 7.5A3.5 3.5 0 0 0 23.5 4H17v21h6.5A3.5 3.5 0 0 1 27 28V7.5Z"/><path d="M9 9h3M20 9h3M10 14h2M20 14h2"/>',
    square:'<rect x="5" y="5" width="9" height="9" rx="2"/><rect x="18" y="5" width="9" height="9" rx="2"/><rect x="5" y="18" width="9" height="9" rx="2"/><rect x="18" y="18" width="9" height="9" rx="2"/><path d="M16 8v16M8 16h16" opacity=".35"/>',
    sideStories:'<path d="M7 5h14l4 4v18H7z"/><path d="M21 5v5h5M11 14h10M11 18h10M11 22h6"/>',
    visualNovel:'<path d="m16 4 10 7-10 7L6 11l10-7Z"/><path d="M16 18v9M9 22h14"/><circle cx="9" cy="22" r="2"/><circle cx="23" cy="22" r="2"/>',
  dreamHall:'<path d="M21 6a10 10 0 1 0 5 12 8 8 0 0 1-5-12Z"/><circle cx="10" cy="9" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="12" cy="20" r="1"/>',
    notifications:'<path d="M8 23h16l-2-3v-5a6 6 0 0 0-12 0v5l-2 3Z"/><path d="M13 26h6"/>',
    dataCenter:'<path d="M7 6h18v20H7z"/><path d="M11 11h10M11 16h10M11 21h6"/>'
  };

  if(typeof HOME_GLYPH_SVGS==='object')Object.assign(HOME_GLYPH_SVGS,SVG_ICONS);
  data.settings=data.settings&&typeof data.settings==='object'?data.settings:{};
  const hadValidMode=data.settings.homeIconMode===IMAGE_MODE||data.settings.homeIconMode===SVG_MODE;
  /* V45.7.14: 默认改成纯色 SVG。一体化毛玻璃桌面需要墨线图标，
     图片图标是黑金照片，CSS 改不了它的颜色。
     用户原有的自定义图片一律保留在 data.settings.homeAppIcons 里，
     切回图片模式即可恢复，这里只改「默认值」。 */
  if(!hadValidMode)data.settings.homeIconMode=SVG_MODE;

  function currentMode(){return data.settings.homeIconMode===SVG_MODE?SVG_MODE:IMAGE_MODE}
  /* V45.7.14: 一次性迁移。老资料里已经存着 image，光改默认值到不了现有用户，
     所以这里做一次切换，并留标记不再重复执行。之后你手动切回图片，它不会再被改。 */
  (function(){
    try{
      data.runtime=data.runtime&&typeof data.runtime==='object'?data.runtime:{};
      if(data.runtime.v45714IconDefault)return;
      data.runtime.v45714IconDefault=true;
      if(data.settings.homeIconMode===IMAGE_MODE)data.settings.homeIconMode=SVG_MODE;
      try{save()}catch{}
    }catch{}
  })();
  function svgFor(key){return HOME_GLYPH_SVGS?.[key]||SVG_ICONS[key]||SVG_FALLBACK}
  function setText(node,value){if(node&&node.textContent!==value)node.textContent=value}
  function miniIcon(key,mode){
    const source=mode===IMAGE_MODE&&typeof homeAppIcon==='function'?homeAppIcon(key):'';
    if(source)return `<span class="v4579-icon-mini is-image"><img src="${attr(source)}" alt=""></span>`;
    return `<span class="v4579-icon-mini is-svg"><svg viewBox="0 0 32 32" aria-hidden="true">${svgFor(key)}</svg></span>`
  }

  const baseHomeItemMarkup=typeof homeItemMarkup==='function'?homeItemMarkup:null;
  if(baseHomeItemMarkup){
    const iconModeMarkup=function(item){
      if(item?.kind!=='app')return baseHomeItemMarkup(item);
      const app=HOME_APP_CATALOG[item.app];if(!app)return baseHomeItemMarkup(item);
      const style=`grid-column:${item.x+1}/span ${item.w};grid-row:${item.y+1}/span ${item.h};--widget-color:${safeColor(item.color)}`;
      const pure=currentMode()===SVG_MODE,source=pure?'':homeAppIcon(item.app),svg=svgFor(item.app);
      const icon=source
        ?`<span class="home-app-icon home-app-image"><img src="${attr(source)}" alt=""></span>`
        :`<span class="home-app-icon home-app-glyph v4579-home-svg${pure?' is-pure-svg':''}"><svg viewBox="0 0 32 32" aria-hidden="true">${svg}</svg></span>`;
      return `<button class="home-item home-app${homeEditMode?' is-editing':''}" style="${style}" data-home-id="${attr(item.id)}" aria-label="${attr(app.label)}" onpointerdown="homeItemPointerDown(event,'${attr(item.id)}')" onclick="activateHomeItem(event,'${attr(item.id)}')">${icon}<span class="home-app-label">${esc(app.label)}</span><i class="home-edit-badge">×</i></button>`
    };
    homeItemMarkup=iconModeMarkup;window.homeItemMarkup=iconModeMarkup;
  }

  function modeCardMarkup(){return `<section id="v4579HomeIconMode" class="v4579-icon-mode-card"><div class="v4579-icon-mode-head"><b>图标模式</b><small id="v4579IconModeStatus">图片图标</small></div><div class="v4579-icon-mode-segments"><button id="v4579ImageMode" type="button" onclick="v4579SetHomeIconMode('image')">图片图标</button><button id="v4579SvgMode" type="button" onclick="v4579SetHomeIconMode('svg')">纯色 SVG</button></div><p id="v4579IconModeCopy" class="v4579-icon-mode-copy"></p><div id="v4579IconModePreview" class="v4579-icon-mode-preview"></div><div class="v4579-icon-mode-note"><span>双模式保留：</span>切到纯色 SVG 只改变当前显示，不删除现有四张图片、以后新增的图片或逐个上传的自定义图标。</div></section>`}
  function colorRowMarkup(){return `<div id="v4579IconColorRow" class="p12-editor-row"><b>图标颜色</b><button type="button" onclick="openPaletteStudio()">跟随当前主题</button></div>`}
  function installEditorControl(){
    const editor=document.getElementById('homeEditor');if(!editor)return;
    if(!document.getElementById('v4579HomeIconMode')){
      const iconRow=[...editor.querySelectorAll('.p12-editor-row')].find(row=>row.querySelector('b')?.textContent.trim()==='桌面图标');
      const holder=document.createElement('div');holder.innerHTML=modeCardMarkup()+colorRowMarkup();
      const fragment=document.createDocumentFragment();while(holder.firstChild)fragment.appendChild(holder.firstChild);
      if(iconRow)iconRow.before(fragment);else editor.appendChild(fragment);
    }
  }
  function updateEditorControl(){
    installEditorControl();const mode=currentMode(),imageButton=document.getElementById('v4579ImageMode'),svgButton=document.getElementById('v4579SvgMode');
    imageButton?.classList.toggle('on',mode===IMAGE_MODE);svgButton?.classList.toggle('on',mode===SVG_MODE);
    imageButton?.setAttribute('aria-pressed',String(mode===IMAGE_MODE));svgButton?.setAttribute('aria-pressed',String(mode===SVG_MODE));
    setText(document.getElementById('v4579IconModeStatus'),mode===SVG_MODE?'纯色 SVG':'图片图标');
    const copy=document.getElementById('v4579IconModeCopy'),copyMode=copy?.dataset.mode;
    if(copy&&copyMode!==mode){copy.dataset.mode=mode;copy.innerHTML=mode===SVG_MODE?'<b>全部桌面应用统一显示内置 SVG。</b>颜色跟随当前主题，四张图片和自定义上传仍然保留。':'<b>有图片时优先显示图片。</b>没有配置图片的应用继续使用内置 SVG。'}
    const preview=document.getElementById('v4579IconModePreview');if(preview&&preview.dataset.mode!==mode){preview.dataset.mode=mode;preview.innerHTML=['chats','contacts','groups','feed'].map(key=>miniIcon(key,mode)).join('')}
    const home=document.getElementById('homeDesk');if(home)home.dataset.homeIconMode=mode;
  }

  window.v4579SetHomeIconMode=function(mode){
    const next=mode===SVG_MODE?SVG_MODE:IMAGE_MODE,changed=currentMode()!==next;
    data.settings.homeIconMode=next;
    if(changed){try{save()}catch{}try{renderHomeDesktop()}catch(error){console.warn('桌面图标模式刷新失败',error)}}
    updateEditorControl();
    if(changed&&typeof toast==='function')toast(next===SVG_MODE?'已切换纯色 SVG · 图片仍保留':'已切回图片图标');
  };

  const baseOpenHomeEditor=typeof openHomeEditor==='function'?openHomeEditor:null;
  if(baseOpenHomeEditor){
    const wrappedOpen=function(...args){installEditorControl();updateEditorControl();return baseOpenHomeEditor.apply(this,args)};
    openHomeEditor=wrappedOpen;window.openHomeEditor=wrappedOpen;
  }
  const baseRenderHomeDesktop=typeof renderHomeDesktop==='function'?renderHomeDesktop:null;
  if(baseRenderHomeDesktop){
    const wrappedRender=function(...args){const result=baseRenderHomeDesktop.apply(this,args);updateEditorControl();return result};
    renderHomeDesktop=wrappedRender;window.renderHomeDesktop=wrappedRender;
  }

  installEditorControl();updateEditorControl();
  if(!hadValidMode)try{save()}catch{}
  try{renderHomeDesktop()}catch(error){console.warn('V45.7.9 桌面图标模式初始化未完全完成',error)}
})();
