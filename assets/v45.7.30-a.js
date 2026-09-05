/* =========================================================
   POKEJI V45.7.30 · repair layer
   Appended to the existing V45.7.28 refinement file.
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45729RepairLoaded)return;
  window.__pokejiV45729RepairLoaded=true;

  const S=(value,fallback='')=>String(value??fallback);
  const O=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const L=value=>Array.isArray(value)?value:[];
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AT=value=>typeof attr==='function'?attr(S(value)):E(value);
  const A=value=>`decodeURIComponent('${encodeURIComponent(S(value)).replace(/'/g,'%27')}')`;
  const NOW=()=>new Date().toISOString();
  const ID=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}`;
  const tell=text=>{try{toast(text)}catch{}};
  const persist=()=>{try{return save()}catch(error){console.warn('V45.7.30 save failed',error);return false}};
  const currentPersona=chatId=>{try{return activePersonaFor(chatId||currentChat)}catch{return L(data.personas)[0]||null}};
  const currentCharacter=chatId=>{try{return directCharacterForChat(chatId||currentChat)}catch{return null}};
  const currentGroup=chatId=>{try{return groupForChat(chatId||currentChat)}catch{return null}};
  const canonical=chatId=>{try{return canonicalChatId(chatId||currentChat)}catch{return S(chatId||currentChat)}};
  const parsedThread=chatId=>{try{return parsePersonaThreadId(chatId)}catch{return null}};
  const safeImage=value=>{try{return typeof safeImageSrc==='function'?safeImageSrc(value):/^(?:https:\/\/|data:image\/)/i.test(S(value))?S(value):''}catch{return''}};
  const modelReady=kind=>{try{return typeof validModel==='function'&&validModel(kind)}catch{return false}};
  const newController=()=>{try{return withTimeout(Number(data.settings?.timeout)||60000)}catch{return new AbortController()}};
  const releaseControllerSafe=controller=>{try{releaseController?.(controller)}catch{}};

  data.runtime=O(data.runtime);
  data.runtime.v45729=O(data.runtime.v45729);
  const runtime=data.runtime.v45729;
  data.settings=O(data.settings);

  /* ---------------------------------------------------------
     1. Chat wallpaper repair
     --------------------------------------------------------- */
  function cssImage(value){
    const src=safeImage(value);if(!src)return'';
    return `url("${src.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\)/g,'\\)')}")`;
  }
  function setImportant(node,property,value){try{node?.style?.setProperty(property,value,'important')}catch{}}
  function paintChatBackground(chatId=currentChat){
    const chat=document.getElementById('chat');if(!chat)return;
    let settings=null;try{settings=getChatSettings(chatId)}catch{}
    const image=safeImage(settings?.background),mode=settings?.backgroundMode==='image'?'image':'overlay';
    chat.dataset.v45729Wallpaper=image?'image':'default';
    chat.dataset.v45729WallpaperMode=mode;
    if(image){
      const url=cssImage(image),opacity=Math.min(.85,Math.max(0,Number(settings?.backgroundOpacity)>=0?Number(settings.backgroundOpacity):.38));
      chat.classList.add('has-custom-bg');
      setImportant(chat,'background-image',url);setImportant(chat,'background-size','cover');setImportant(chat,'background-position','center');setImportant(chat,'background-repeat','no-repeat');
      chat.style.setProperty('--v45729-wallpaper',url);chat.style.setProperty('--background-overlay-opacity',String(opacity));
      const scroll=chat.querySelector(':scope > .scroll'),messages=chat.querySelector(':scope > .scroll > .messages');
      setImportant(scroll,'background-color','transparent');setImportant(scroll,'background-image','none');
      setImportant(messages,'background-color','transparent');setImportant(messages,'background-image','none');
      setImportant(chat.querySelector(':scope > .chat-head'),'background-color',`rgba(255,255,255,${Math.max(.72,1-opacity*.42)})`);
      setImportant(chat.querySelector(':scope > .composer'),'background-color',`rgba(255,255,255,${Math.max(.78,1-opacity*.28)})`);
    }else{
      chat.classList.remove('has-custom-bg');chat.style.removeProperty('--v45729-wallpaper');chat.style.setProperty('--background-overlay-opacity','0');
      for(const property of ['background-image','background-size','background-position','background-repeat'])chat.style.removeProperty(property);
      const scroll=chat.querySelector(':scope > .scroll'),messages=chat.querySelector(':scope > .scroll > .messages');
      for(const node of [scroll,messages,chat.querySelector(':scope > .chat-head'),chat.querySelector(':scope > .composer')])for(const property of ['background-color','background-image'])node?.style?.removeProperty(property);
    }
  }
  window.v45729PaintChatBackground=paintChatBackground;
  window.applyChatBackground=paintChatBackground;
  try{applyChatBackground=paintChatBackground}catch{}

  function readImageFileSafe(file){
    return new Promise((resolve,reject)=>{
      if(!file||!S(file.type).toLowerCase().startsWith('image/'))return reject(Error('请选择图片文件'));
      const reader=new FileReader();reader.onerror=()=>reject(reader.error||Error('图片读取失败'));
      reader.onload=()=>{
        const raw=S(reader.result);
        try{
          const image=new Image();image.onload=()=>{
            try{
              const w0=image.naturalWidth||image.width||1,h0=image.naturalHeight||image.height||1,max=1800,scale=Math.min(1,max/Math.max(w0,h0)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w0*scale));canvas.height=Math.max(1,Math.round(h0*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('无法创建图片画布');ctx.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.84));
            }catch{resolve(raw)}
          };image.onerror=()=>resolve(raw);image.src=raw;
        }catch{resolve(raw)}
      };reader.readAsDataURL(file);
    });
  }
  window.v45729ReadImageFile=readImageFileSafe;
  async function saveWallpaperSource(source,chatId=currentChat){
    const value=safeImage(source);if(!value)return false;
    const settings=getChatSettings(chatId);settings.background=value;settings.backgroundMode='overlay';if(!Number.isFinite(Number(settings.backgroundOpacity)))settings.backgroundOpacity=.38;persist();
    if(canonical(chatId)===canonical(currentChat))paintChatBackground(chatId);return true;
  }
  function wallpaperTarget(){return S(runtime.backgroundTarget||currentChat)}
  function wallpaperMenu(chatId=wallpaperTarget()){
    if(!chatId)return tell('请先进入一条聊天');runtime.backgroundTarget=chatId;
    modal(`<div class="v45729-tool-sheet"><header><small>CHAT WALLPAPER</small><h2>聊天背景</h2><p>私聊按角色×当前面具保存，群聊按群聊×当前面具保存；不会影响主桌面。</p></header><div class="v45729-tool-actions"><button onclick="v45729PickChatWallpaper(${A(chatId)})"><b>上传图片</b><small>从本机选择图片</small></button><button onclick="v45729PasteChatWallpaper(${A(chatId)})"><b>粘贴剪贴板图片 / 填写 HTTPS 地址</b><small>无法读取时不会伪装成功</small></button><button onclick="v45729ClearChatWallpaper(${A(chatId)})"><b>恢复默认纯色</b><small>真正清除当前聊天的背景图片</small></button></div><div class="form-actions"><button class="primary" onclick="closeModal()">完成</button></div></div>`);
  }
  window.v45729PickChatWallpaper=function(chatId=wallpaperTarget()){
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{await saveWallpaperSource(await readImageFileSafe(file),chatId);closeModal();tell('当前聊天背景已更换')}catch(error){errorDetail?.(error,'聊天背景读取失败')}};input.click();
  };
  window.v45729PasteChatWallpaper=async function(chatId=wallpaperTarget()){
    try{if(navigator.clipboard?.read){for(const item of await navigator.clipboard.read()){const type=item.types.find(t=>/^image\//i.test(t));if(type){await saveWallpaperSource(await readImageFileSafe(await item.getType(type)),chatId);closeModal();return tell('已使用剪贴板图片作为聊天背景')}}}}catch{}
    modal(`<h2>填写聊天背景地址</h2><div class="note">只接受 HTTPS 图片地址。目标站点的跨域策略可能影响显示，但程序不会把失败说成成功。</div><div class="field"><label>HTTPS 图片 URL</label><input id="v45729WallpaperUrl" inputmode="url" placeholder="https://..."></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45729SaveWallpaperUrl(${A(chatId)})">保存</button></div>`);
  };
  window.v45729SaveWallpaperUrl=async function(chatId=wallpaperTarget()){
    const value=S(document.getElementById('v45729WallpaperUrl')?.value).trim();if(!/^https:\/\//i.test(value))return tell('请填写 HTTPS 图片地址');await saveWallpaperSource(value,chatId);closeModal();tell('聊天背景地址已保存');
  };
  window.v45729ClearChatWallpaper=function(chatId=wallpaperTarget()){
    try{const settings=getChatSettings(chatId);settings.background='';settings.backgroundMode='overlay';persist();if(canonical(chatId)===canonical(currentChat))paintChatBackground(chatId);closeModal();tell('已恢复当前聊天默认纯色背景')}catch(error){errorDetail?.(error,'恢复聊天背景失败')}
  };
  window.chooseChatBackground=()=>wallpaperMenu();try{chooseChatBackground=window.chooseChatBackground}catch{}
  const baseOpenChat=window.openChat;
  if(typeof baseOpenChat==='function'&&!baseOpenChat.__v45729Wallpaper){const wrapped=function(...args){runtime.backgroundTarget='';const result=baseOpenChat.apply(this,args);setTimeout(()=>paintChatBackground(currentChat),0);return result};wrapped.__v45729Wallpaper=true;window.openChat=wrapped;try{openChat=wrapped}catch{}}
  const baseEditGroup=window.editGroup;
  if(typeof baseEditGroup==='function'&&!baseEditGroup.__v45729Wallpaper){const wrapped=function(id,...args){runtime.backgroundTarget=typeof groupChatId==='function'?groupChatId(id):S(id);return baseEditGroup.apply(this,[id,...args])};wrapped.__v45729Wallpaper=true;window.editGroup=wrapped;try{editGroup=wrapped}catch{}}
  const baseCharacterBackground=window.chooseCharacterChatBackground;
  if(typeof baseCharacterBackground==='function'&&!baseCharacterBackground.__v45729Wallpaper){
    const wrapped=function(){const draft=typeof characterEditorDraft!=='undefined'?characterEditorDraft:null;if(!draft?.id||draft.__new)return tell('请先保存人物');const target=typeof characterEditorReturn!=='undefined'&&characterEditorReturn==='chat'&&currentCharacter()?.id===draft.id?currentChat:directChatId(draft.id,draft.boundPersonaId||selectedPersonaIdForEntity(draft.id));runtime.backgroundTarget=target;return wallpaperMenu(target)};
    wrapped.__v45729Wallpaper=true;window.chooseCharacterChatBackground=wrapped;try{chooseCharacterChatBackground=wrapped}catch{}
  }
  paintChatBackground(currentChat);

  /* ---------------------------------------------------------
     2. Session-time and reverse-phone surface guard
     --------------------------------------------------------- */
  function dedupeSurface(id){const rows=[...document.querySelectorAll(`#${id}`)];if(rows.length>1)rows.slice(0,-1).forEach(node=>{try{node.remove()}catch{}});return document.getElementById(id)}
  function clearOtherSurfaces(except=''){
    dedupeSurface('v454Stage');dedupeSurface('v455ReverseStage');
    for(const id of ['v454Stage','v455ReverseStage'])if(id!==except){const node=document.getElementById(id);if(node){node.hidden=true;node.innerHTML='';node.style.removeProperty('display')}}
  }
  function styleSurface(root,type){
    if(!root)return;root.hidden=false;
    for(const [property,value] of [['position','absolute'],['inset','0'],['z-index','2200'],['display','flex'],['flex-direction','column'],['overflow','hidden'],['background-color','#ffffff'],['background-image','none'],['color','#151719'],['opacity','1'],['visibility','visible']])setImportant(root,property,value);
    const body=root.querySelector(type==='time'?'.v454-stage-scroll':'.v455-reverse-body'),head=root.querySelector(type==='time'?'.v454-stage-head':'.v455-reverse-head');
    if(body){setImportant(body,'background-color','#ffffff');setImportant(body,'background-image','none');setImportant(body,'color','#151719');setImportant(body,'overflow','auto');setImportant(body,'flex','1 1 auto');}
    if(head){setImportant(head,'background-color','#ffffff');setImportant(head,'background-image','none');setImportant(head,'color','#151719');setImportant(head,'border-bottom','1px solid #dfe2e5');}
    for(const node of root.querySelectorAll('.v454-stage-hero,.v454-panel,.v454-time-card,.v454-route-note,.v455-reverse-hero,.v455-reverse-live,.v455-reverse-entry,.v455-reverse-decision,.v455-reverse-preference,.v455-reverse-note,.v455-reverse-permission')){setImportant(node,'opacity','1');setImportant(node,'visibility','visible');setImportant(node,'background-image','none');}
    for(const node of root.querySelectorAll('input,textarea,select,button')){setImportant(node,'opacity','1');setImportant(node,'visibility','visible');}
  }
  window.v45729FixRouteSurfaces=function(){const timeRoot=dedupeSurface('v454Stage'),reverseRoot=dedupeSurface('v455ReverseStage');if(timeRoot&&!timeRoot.hidden)styleSurface(timeRoot,'time');if(reverseRoot&&!reverseRoot.hidden)styleSurface(reverseRoot,'reverse')};
  for(const name of ['v454OpenStage','v455OpenReversePhone','v454CloseStage','v455CloseReverseStage']){
    const base=window[name];if(typeof base!=='function'||base.__v45729SurfaceGuard)continue;
    const wrapped=function(...args){if(name.includes('Open'))clearOtherSurfaces(name.startsWith('v454')?'v454Stage':'v455ReverseStage');const out=base.apply(this,args);setTimeout(window.v45729FixRouteSurfaces,0);return out};wrapped.__v45729SurfaceGuard=true;window[name]=wrapped;try{globalThis[name]=wrapped}catch{}
  }
  clearOtherSurfaces();window.v45729FixRouteSurfaces();
  const surfaceObserver=new MutationObserver(()=>{try{dedupeSurface('v454Stage');dedupeSurface('v455ReverseStage');window.v45729FixRouteSurfaces()}catch{}});try{surfaceObserver.observe(document.body,{childList:true,subtree:true})}catch{}

  /* ---------------------------------------------------------
     3. Safe browser recorder: press-and-hold and click toggle
     --------------------------------------------------------- */
  const recorder={state:'idle',target:'',stream:null,media:null,chunks:[],speech:null,speechText:'',startedAt:0,startPromise:null,stopPromise:null,pressTimer:null,suppressClickUntil:0};
  function recorderInput(target){return target==='lesson'?document.getElementById('v457LessonInput'):target==='call'?document.getElementById('v45729CallInput'):document.getElementById('v45729VoiceTranscript')}
  function recorderButton(target){return target==='lesson'?document.getElementById('v457HoldToTalk'):target==='call'?document.getElementById('v45729CallRecordButton'):document.getElementById('v45729ChatRecordButton')}
  function recorderVisual(target,on){const button=recorderButton(target);button?.classList.toggle('is-listening',!!on);button?.setAttribute('aria-pressed',on?'true':'false')}
  function recorderMime(){const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];return types.find(type=>window.MediaRecorder?.isTypeSupported?.(type))||''}
  function startSpeech(target,lang){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return;
    try{
      const speech=new Recognition();recorder.speech=speech;speech.lang=lang||'zh-CN';speech.continuous=true;speech.interimResults=true;
      speech.onresult=event=>{let text='';for(let i=0;i<event.results.length;i++)text+=S(event.results[i]?.[0]?.transcript);recorder.speechText=text.trim();const input=recorderInput(target);if(input&&recorder.speechText)input.value=recorder.speechText};
      speech.onerror=event=>{if(!['aborted','no-speech'].includes(event.error))tell('语音识别未完成，但录音仍会保留')};
      speech.onend=()=>{if(recorder.state==='active'&&recorder.speech===speech)setTimeout(()=>{try{if(recorder.state==='active'&&recorder.speech===speech)speech.start()}catch{}},80)};
      speech.start();
    }catch{recorder.speech=null}
  }
  async function startRecording(target='lesson',{lang='zh-CN'}={}){
    if(recorder.state==='active'||recorder.state==='starting')return false;
    recorder.state='starting';recorder.target=target;recorder.chunks=[];recorder.speechText='';recorder.startedAt=Date.now();recorder.startPromise=null;recorder.stopPromise=null;recorderVisual(target,true);
    recorder.startPromise=(async()=>{
      if(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder){
        try{recorder.stream=await navigator.mediaDevices.getUserMedia({audio:true});const mime=recorderMime();recorder.media=new MediaRecorder(recorder.stream,mime?{mimeType:mime}:undefined);recorder.media.ondataavailable=event=>{if(event.data?.size)recorder.chunks.push(event.data)};recorder.media.start(120)}catch(error){recorder.stream=null;recorder.media=null;console.warn('V45.7.30 microphone',error);tell('无法取得麦克风，将只尝试语音识别；也可以直接输入')}
      }
      if(!recorder.media&&!(window.SpeechRecognition||window.webkitSpeechRecognition)){recorder.state='idle';recorder.target='';recorderVisual(target,false);return false}
      recorder.state='active';startSpeech(target,lang);return true;
    })();
    return recorder.startPromise;
  }
  function blobData(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(S(reader.result));reader.onerror=()=>reject(reader.error||Error('录音读取失败'));reader.readAsDataURL(blob)})}
  async function stopRecording(){
    if(recorder.state==='idle')return null;if(recorder.stopPromise)return recorder.stopPromise;
    const target=recorder.target,start=recorder.startedAt;recorder.state='stopping';
    recorder.stopPromise=(async()=>{
      try{await recorder.startPromise}catch{}
      let audioData='',mimeType=S(recorder.media?.mimeType||'audio/webm');
      try{
        if(recorder.speech){recorder.speech.onend=null;try{recorder.speech.stop()}catch{}recorder.speech=null}
        recorder.stream?.getTracks?.().forEach(track=>track.stop());
        if(recorder.chunks.length){const blob=new Blob(recorder.chunks,{type:mimeType});if(blob.size<=3*1024*1024)audioData=await blobData(blob);else tell('录音超过 3MB，本次只保留转写')}
      }catch(error){console.warn('V45.7.30 stop recorder',error)}
      const result={target,audioData,mimeType,duration:Math.max(0,Date.now()-start),transcript:S(recorder.speechText).trim()};recorder.state='idle';recorder.target='';recorder.stream=null;recorder.media=null;recorder.chunks=[];recorder.startedAt=0;recorder.startPromise=null;recorder.stopPromise=null;recorderVisual(target,false);return result;
    })();
    return recorder.stopPromise;
  }
  function storeRecording(result,target){if(!result)return;runtime.lastRecording=result;runtime.lastRecordingTarget=target;if(target==='lesson')runtime.lastLessonRecording=result;if(target==='call')runtime.lastCallRecording=result;if(target==='chat')runtime.lastChatRecording=result}
  function buttonTarget(button){const id=S(button?.id);return id==='v45729CallRecordButton'?'call':id==='v45729ChatRecordButton'?'chat':'lesson'}
  window.v45729StartRecorder=startRecording;window.v45729StopRecorder=stopRecording;
  window.v457SpeechDown=function(event){event?.preventDefault?.();const button=event?.currentTarget,target=buttonTarget(button);if(recorder.state!=='idle')return;clearTimeout(recorder.pressTimer);recorder.pressTimer=setTimeout(()=>{recorder.pressTimer=null;void startRecording(target,{lang:target==='lesson'?(window.v45729LearningLanguage||'zh-CN'):'zh-CN'})},220);button?.setPointerCapture?.(event?.pointerId)};
  window.v457SpeechUp=function(event){event?.preventDefault?.();const button=event?.currentTarget,target=recorder.target||buttonTarget(button),pending=!!recorder.pressTimer;clearTimeout(recorder.pressTimer);recorder.pressTimer=null;recorder.suppressClickUntil=Date.now()+500;if(pending){if(recorder.state!=='idle')void stopRecording().then(result=>{storeRecording(result,target);const input=recorderInput(target);if(input&&result?.transcript)input.value=result.transcript});else void startRecording(target,{lang:target==='lesson'?(window.v45729LearningLanguage||'zh-CN'):'zh-CN'});return}if(recorder.state!=='idle')void stopRecording().then(result=>{storeRecording(result,target);const input=recorderInput(target);if(input&&result?.transcript)input.value=result.transcript})};
  function decorateRecorder(button,target){
    if(!button||button.dataset.v45729Recorder==='1')return;button.dataset.v45729Recorder='1';button.removeAttribute('onpointerdown');button.removeAttribute('onpointerup');button.removeAttribute('onpointercancel');button.removeAttribute('onclick');
    button.addEventListener('pointerdown',event=>window.v457SpeechDown(event));button.addEventListener('pointerup',event=>window.v457SpeechUp(event));button.addEventListener('pointercancel',event=>window.v457SpeechUp(event));button.addEventListener('lostpointercapture',event=>{if(recorder.state!=='idle')window.v457SpeechUp(event)});button.addEventListener('click',event=>{if(Date.now()<recorder.suppressClickUntil){event.preventDefault();return}event.preventDefault();if(recorder.state==='idle')void startRecording(target,{lang:target==='lesson'?(window.v45729LearningLanguage||'zh-CN'):'zh-CN'});else void stopRecording().then(result=>{storeRecording(result,target);const input=recorderInput(target);if(input&&result?.transcript)input.value=result.transcript})});button.title='按住录音，松开结束；点击开始 / 停止';
  }
  function decorateRecorders(root=document){decorateRecorder(root.querySelector?.('#v457HoldToTalk'),'lesson');decorateRecorder(root.querySelector?.('#v45729CallRecordButton'),'call');decorateRecorder(root.querySelector?.('#v45729ChatRecordButton'),'chat')}
  decorateRecorders();window.v45729DecorateRecorders=decorateRecorders;const recorderObserver=new MutationObserver(()=>{try{decorateRecorders()}catch{}});try{recorderObserver.observe(document.body,{childList:true,subtree:true})}catch{}
  function learningSession(){try{const persona=currentPersona(),root=O(data.learningV452),state=O(root.personas?.[persona?.id||data.activePersonaId]),session=O(state.liveSessions)?.[state.activeSessionId];return session?{state,session}:null}catch{return null}}
  const baseLessonSend=window.v457SendLesson;
  if(typeof baseLessonSend==='function'&&!baseLessonSend.__v45729Recorder){const wrapped=async function(...args){const recording=runtime.lastLessonRecording||null,result=await baseLessonSend.apply(this,args);if(recording){const found=learningSession(),last=L(found?.session?.messages).slice().reverse().find(row=>row.role==='learner');if(last){Object.assign(last,{recorded:true,audioData:S(recording.audioData),mimeType:S(recording.mimeType),duration:Number(recording.duration)||0});persist()}runtime.lastLessonRecording=null}return result};wrapped.__v45729Recorder=true;window.v457SendLesson=wrapped;try{v457SendLesson=wrapped}catch{}}
  window.addEventListener?.('pagehide',()=>{if(recorder.state!=='idle')void stopRecording()});

  /* ---------------------------------------------------------
     5. Character voice-call route survives normalization/editing
     --------------------------------------------------------- */
  const baseCharacterBinding=window.characterBindingPage;
  if(typeof baseCharacterBinding==='function'&&!baseCharacterBinding.__v45729VoiceRoute){
    const wrapped=function(d){let html=baseCharacterBinding.apply(this,arguments);const configs=Object.values(O(data.apiConfigs)).filter(cfg=>cfg?.capability==='voice');const field=`<div class="field editor-wide v45729-character-voice"><label>语音通话专属语音线路</label><select id="char_voiceCallApiConfigId"><option value="">不播放语音，只生成文字回复</option>${configs.map(cfg=>`<option value="${AT(cfg.id)}" ${S(d.voiceCallApiConfigId)===S(cfg.id)?'selected':''}>${E(cfg.name||cfg.model||'未命名语音线路')}</option>`).join('')}</select><small>只在“语音通话”形式中使用；没有专属线路时不回退全局声音线路。</small></div>`;const pos=html.indexOf('<div class="binding-cards">');return pos>=0?html.slice(0,pos)+field+html.slice(pos):html+field};wrapped.__v45729VoiceRoute=true;window.characterBindingPage=wrapped;try{characterBindingPage=wrapped}catch{}
  }
  const baseCollectCharacter=window.collectCharacterEditorPage;
  if(typeof baseCollectCharacter==='function'&&!baseCollectCharacter.__v45729VoiceRoute){const wrapped=function(){const out=baseCollectCharacter.apply(this,arguments);try{const input=document.getElementById('char_voiceCallApiConfigId');if(input&&characterEditorDraft)characterEditorDraft.voiceCallApiConfigId=S(input.value)}catch{}return out};wrapped.__v45729VoiceRoute=true;window.collectCharacterEditorPage=wrapped;try{collectCharacterEditorPage=wrapped}catch{}}
  const baseSaveCharacter=window.saveCharacterEditor;
  if(typeof baseSaveCharacter==='function'&&!baseSaveCharacter.__v45729VoiceRoute){const wrapped=function(...args){let id='';try{id=S(characterEditorDraft?.id)}catch{}const voice=S(document.getElementById('char_voiceCallApiConfigId')?.value);const out=baseSaveCharacter.apply(this,args);if(id){const row=data.characters?.find(item=>S(item.id)===id);if(row){row.voiceCallApiConfigId=voice;persist()}}return out};wrapped.__v45729VoiceRoute=true;window.saveCharacterEditor=wrapped;try{saveCharacterEditor=wrapped}catch{}}

  /* ---------------------------------------------------------
     6. Custom font global application
     --------------------------------------------------------- */
  function applyCustomFont(){
    const font=O(data.settings?.customFont);if(!font.family)return;
    let face='';if(font.url)face=`@font-face{font-family:"${font.family}";src:url("${font.url}")}`;else if(font.file)face=`@font-face{font-family:"${font.family}";src:url("${font.file}")}`;
    const css=`${face}html,body,input,textarea,button,select,.bubble,.message-item,#chat,#history,.view,*{font-family:"${font.family}",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}`;
    let style=document.getElementById('v45729CustomFont');if(!style){style=document.createElement('style');style.id='v45729CustomFont';document.head.appendChild(style)}style.textContent=css;
  }
  applyCustomFont();const baseSaveData=window.save;if(typeof baseSaveData==='function'&&!baseSaveData.__v45729Font){const wrapped=function(...args){const out=baseSaveData.apply(this,args);setTimeout(applyCustomFont,50);return out};wrapped.__v45729Font=true;window.save=wrapped;try{save=wrapped}catch{}}

})();
