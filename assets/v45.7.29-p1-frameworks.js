/* =========================================================
   POKEJI V45.7.29 · P1 Framework Modules
   关系网 / 语音通话 / 音乐陪听 / API 悬浮球 / 聊天工具统一入口
   ========================================================= */
(function(){
  'use strict';
  
  if(window.__pokejiV45729P1Loaded)return;
  window.__pokejiV45729P1Loaded=true;
  
  const S=value=>String(value==null?'':value);
  const L=value=>Array.isArray(value)?value:[];
  const O=value=>(value&&typeof value==='object'&&!Array.isArray(value))?value:{};
  const NOW=()=>new Date().toISOString();
  const ID=prefix=>`${prefix}_${typeof v44UUID==='function'?v44UUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}`;
  const E=value=>typeof esc==='function'?esc(S(value)):S(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const A=value=>typeof attr==='function'?attr(S(value)):E(value);
  
  // ========== 1. 关系网框架 ==========
  
  function initRelationshipGraph() {
    data.relationshipGraphV45729 = O(data.relationshipGraphV45729);
    data.relationshipGraphV45729.scopes = O(data.relationshipGraphV45729.scopes);
  }
  
  function relationshipScopeKey(personaId, worldId) {
    return `${S(personaId)}::${S(worldId)}`;
  }
  
  function getRelationshipScope(personaId, worldId) {
    initRelationshipGraph();
    const key = relationshipScopeKey(personaId, worldId);
    if (!data.relationshipGraphV45729.scopes[key]) {
      data.relationshipGraphV45729.scopes[key] = {
        personaId: S(personaId),
        worldId: S(worldId),
        nodes: [],
        edges: [],
        pendingDrafts: [],
        updatedAt: NOW()
      };
    }
    return data.relationshipGraphV45729.scopes[key];
  }
  
  function openRelationshipGraph() {
    const persona = typeof activePersona === 'function' ? activePersona() : data.personas?.[0];
    const world = data.currentWorld || 'default';
    if (!persona) {
      toast('请先创建或选择一个面具');
      return;
    }
    
    const scope = getRelationshipScope(persona.id, world);
    
    modal(`
      <div class="v45729-rg-sheet">
        <header>
          <small>RELATIONSHIP GRAPH</small>
          <h2>关系网</h2>
          <p>当前范围：${E(persona.name)} × ${E(world === 'default' ? '默认世界' : world)}</p>
        </header>
        
        <div class="v45729-framework-notice">
          <b>⚠️ 框架阶段</b>
          <p>关系网数据模型已建立，节点和关系线的基础 CRUD 可用；图形化布局和自动推断将在后续版本完成。</p>
        </div>
        
        <div class="v45729-rg-nodes">
          <h3>节点 (${scope.nodes.length})</h3>
          ${scope.nodes.length ? scope.nodes.map((node, i) => `
            <div class="v45729-rg-node-card">
              <div>
                <b>${E(node.name)}</b>
                <small>${E(node.type)} · ${E(node.source)}</small>
              </div>
              <button onclick="v45729EditRelationshipNode(${i})">编辑</button>
              <button onclick="v45729DeleteRelationshipNode(${i})">删除</button>
            </div>
          `).join('') : '<div class="v45729-framework-empty">暂无节点</div>'}
        </div>
        
        <div class="v45729-rg-edges">
          <h3>关系线 (${scope.edges.length})</h3>
          ${scope.edges.length ? scope.edges.map((edge, i) => `
            <div class="v45729-rg-edge-card">
              <span>${E(edge.from)} → ${E(edge.to)}: ${E(edge.label)}</span>
              <button onclick="v45729DeleteRelationshipEdge(${i})">删除</button>
            </div>
          `).join('') : '<div class="v45729-framework-empty">暂无关系线</div>'}
        </div>
        
        <div class="v45729-framework-actions">
          <button onclick="v45729AddRelationshipNode()">＋ 添加节点</button>
          <button onclick="v45729AddRelationshipEdge()">＋ 添加关系线</button>
          <button onclick="v45729GenerateRelationshipDrafts()">✦ AI 生成草稿</button>
        </div>
        
        <div class="form-actions">
          <button class="primary" onclick="closeModal()">完成</button>
        </div>
      </div>
    `);
  }
  
  window.v45729OpenRelationshipGraph = openRelationshipGraph;
  
  // 添加节点
  window.v45729AddRelationshipNode = function() {
    modal(`
      <h2>添加节点</h2>
      <div class="field"><label>名称</label><input id="v45729RgNodeName"></div>
      <div class="field"><label>类型</label>
        <select id="v45729RgNodeType">
          <option value="person">人物</option>
          <option value="place">地点</option>
          <option value="organization">组织</option>
          <option value="group">群聊</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div class="field"><label>来源</label><input id="v45729RgNodeSource" value="手动添加"></div>
      <div class="field"><label>描述</label><textarea id="v45729RgNodeDesc"></textarea></div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
        <button class="primary" onclick="v45729SaveRelationshipNode()">保存</button>
      </div>
    `);
  };
  
  window.v45729SaveRelationshipNode = function(index = -1) {
    const persona = typeof activePersona === 'function' ? activePersona() : data.personas?.[0];
    const world = data.currentWorld || 'default';
    const scope = getRelationshipScope(persona.id, world);
    
    const name = document.getElementById('v45729RgNodeName')?.value.trim();
    const type = document.getElementById('v45729RgNodeType')?.value || 'person';
    const source = document.getElementById('v45729RgNodeSource')?.value.trim() || '手动添加';
    const description = document.getElementById('v45729RgNodeDesc')?.value.trim();
    
    if (!name) {
      toast('请填写节点名称');
      return;
    }
    
    const node = {
      id: ID('rg_node'),
      name,
      type,
      source,
      description,
      createdAt: NOW(),
      updatedAt: NOW()
    };
    
    if (index >= 0 && index < scope.nodes.length) {
      node.id = scope.nodes[index].id;
      node.createdAt = scope.nodes[index].createdAt;
      scope.nodes[index] = node;
    } else {
      scope.nodes.push(node);
    }
    
    scope.updatedAt = NOW();
    try { save(); } catch {}
    closeModal();
    openRelationshipGraph();
  };
  
  // ========== 2. 独立语音通话框架 ==========
  
  function initVoiceCalls() {
    data.voiceCallsV45729 = L(data.voiceCallsV45729);
  }
  
  function startVoiceCall(targetId, targetType = 'character') {
    initVoiceCalls();
    
    const call = {
      id: ID('voice_call'),
      chatId: currentChat,
      characterId: targetType === 'character' ? targetId : null,
      groupId: targetType === 'group' ? targetId : null,
      direction: 'outgoing',
      status: 'connected',
      startedAt: NOW(),
      connectedAt: NOW(),
      endedAt: null,
      transcript: [],
      startMarker: `【语音通话开始】${NOW()}`,
      endMarker: null,
      dedicatedVoiceRouteId: null,
      error: null,
      fallback: null
    };
    
    data.voiceCallsV45729.push(call);
    try { save(); } catch {}
    
    // 注入开始标记到聊天历史
    if (data.chats[currentChat]) {
      data.chats[currentChat].push({
        id: ID('call_start'),
        role: 'system',
        kind: 'event',
        text: call.startMarker,
        time: typeof time === 'function' ? time() : '',
        createdAt: call.startedAt
      });
    }
    
    return call;
  }
  
  function endVoiceCall(callId) {
    const call = data.voiceCallsV45729?.find(c => c.id === callId);
    if (!call) return;
    
    call.status = 'ended';
    call.endedAt = NOW();
    call.endMarker = `【语音通话结束】${call.endedAt}`;
    
    try { save(); } catch {}
    
    // 注入结束标记到聊天历史
    if (data.chats[currentChat]) {
      data.chats[currentChat].push({
        id: ID('call_end'),
        role: 'system',
        kind: 'event',
        text: call.endMarker,
        time: typeof time === 'function' ? time() : '',
        createdAt: call.endedAt
      });
    }
  }
  
  window.v45729OpenVoiceCall = function() {
    if (!currentChat) {
      toast('请先打开一个聊天');
      return;
    }
    
    const character = data.characters?.find(c => c.id === currentChat) || 
                     data.characters?.find(c => directChatId && directChatId(c.id) === currentChat);
    
    if (!character) {
      toast('当前不支持群聊语音通话（第一阶段）');
      return;
    }
    
    const activeCall = data.voiceCallsV45729?.find(c => c.chatId === currentChat && c.status === 'connected');
    
    if (activeCall) {
      // 显示通话界面
      modal(`
        <div class="v45729-voice-call-sheet">
          <header>
            <small>VOICE CALL</small>
            <h2>与 ${E(character.name)} 的语音通话</h2>
            <p>开始时间：${new Date(activeCall.connectedAt).toLocaleTimeString()}</p>
          </header>
          
          <div class="v45729-framework-notice">
            <b>📞 转写模式</b>
            <p>首版以转写为主，支持输入框直接输入和浏览器录音（需权限）。只有配置了角色专属语音线路时才播放声音。</p>
          </div>
          
          <div class="v45729-call-transcript">
            ${activeCall.transcript.length ? activeCall.transcript.map(entry => `
              <div class="v45729-call-entry ${entry.role}">
                <small>${entry.role === 'user' ? 'YOU' : E(character.name)}</small>
                <p>${E(entry.text)}</p>
              </div>
            `).join('') : '<div class="v45729-framework-empty">通话记录为空</div>'}
          </div>
          
          <div class="v45729-call-input-area">
            <textarea id="v45729CallInput" placeholder="输入转写或直接说话..." rows="2"></textarea>
            <div class="v45729-call-actions">
              <button id="v45729CallRecordButton" type="button">🎤 录音</button>
              <button onclick="v45729SendCallMessage()">发送</button>
            </div>
          </div>
          
          <div class="form-actions">
            <button class="danger" onclick="v45729EndVoiceCall('${A(activeCall.id)}')">挂断</button>
          </div>
        </div>
      `);
      
      // 绑定录音按钮
      setTimeout(() => {
        const btn = document.getElementById('v45729CallRecordButton');
        if (btn && window.v457SpeechDown && window.v457SpeechUp) {
          btn.addEventListener('pointerdown', window.v457SpeechDown);
          btn.addEventListener('pointerup', window.v457SpeechUp);
          btn.addEventListener('pointercancel', window.v457SpeechUp);
        }
      }, 100);
    } else {
      // 开始通话
      const call = startVoiceCall(character.id, 'character');
      toast('语音通话已开始');
      v45729OpenVoiceCall(); // 重新打开界面
    }
  };
  
  window.v45729SendCallMessage = function() {
    const input = document.getElementById('v45729CallInput');
    const text = input?.value.trim();
    if (!text) return;
    
    const activeCall = data.voiceCallsV45729?.find(c => c.chatId === currentChat && c.status === 'connected');
    if (!activeCall) return;
    
    activeCall.transcript.push({
      role: 'user',
      text,
      timestamp: NOW()
    });
    
    // 添加到聊天历史
    if (data.chats[currentChat]) {
      data.chats[currentChat].push({
        id: ID('call_message'),
        role: 'user',
        kind: 'voice',
        transcript: text,
        text: `【语音条｜转写】${text}`,
        time: typeof time === 'function' ? time() : '',
        createdAt: NOW()
      });
    }
    
    try { save(); } catch {}
    input.value = '';
    
    // 触发 AI 回复
    if (typeof sendMessage === 'function') {
      sendMessage();
    }
  };
  
  window.v45729EndVoiceCall = function(callId) {
    endVoiceCall(callId);
    toast('通话已结束');
    closeModal();
    if (typeof renderMessages === 'function') {
      renderMessages();
    }
  };
  
  // ========== 3. 音乐/音效/陪听框架 ==========
  
  function initMusic() {
    data.musicV45729 = O(data.musicV45729);
    data.musicV45729.songs = L(data.musicV45729.songs);
    data.musicV45729.effects = L(data.musicV45729.effects);
    data.musicV45729.playlists = L(data.musicV45729.playlists);
    data.musicV45729.history = L(data.musicV45729.history);
    data.musicV45729.companions = L(data.musicV45729.companions);
    data.musicV45729.settings = O(data.musicV45729.settings);
    data.musicV45729.settings.narrationEffectsEnabled = 
      data.musicV45729.settings.narrationEffectsEnabled !== false;
    data.musicV45729.netease = O(data.musicV45729.netease);
    data.musicV45729.netease.status = data.musicV45729.netease.status || '未连接';
  }
  
  window.v45729OpenMusicLibrary = function() {
    initMusic();
    const songs = data.musicV45729.songs;
    
    modal(`
      <div class="v45729-music-sheet">
        <header>
          <small>MUSIC LIBRARY</small>
          <h2>歌曲库</h2>
          <p>本机音频 + HTTPS 地址，不与音效混用</p>
        </header>
        
        <div class="v45729-framework-notice">
          <b>🎵 框架阶段</b>
          <p>歌曲库数据模型已建立，支持手动添加、JSON 导入、基础编辑和删除。普通播放不进上下文，音乐陪听才注入歌词。</p>
        </div>
        
        <div class="v45729-music-list">
          ${songs.length ? songs.map((song, i) => `
            <div class="v45729-music-card">
              <div>
                <b>${E(song.title)}</b>
                <small>${E(song.artist || '未知艺术家')}</small>
              </div>
              <button onclick="v45729PlaySong(${i})">播放</button>
              <button onclick="v45729EditSong(${i})">编辑</button>
              <button onclick="v45729DeleteSong(${i})">删除</button>
            </div>
          `).join('') : '<div class="v45729-framework-empty">歌曲库为空</div>'}
        </div>
        
        <div class="v45729-framework-actions">
          <button onclick="v45729AddSong()">＋ 添加歌曲</button>
          <button onclick="v45729ImportMusicJSON()">导入 JSON 档案</button>
          <button onclick="v45729OpenMusicCompanion()">🎼 音乐陪听</button>
        </div>
        
        <div class="form-actions">
          <button onclick="v45729OpenEffectsLibrary()">音效库</button>
          <button onclick="v45729OpenNeteaseSettings()">网易云设置</button>
          <button class="primary" onclick="closeModal()">完成</button>
        </div>
      </div>
    `);
  };
  
  window.v45729AddSong = function() {
    modal(`
      <h2>添加歌曲</h2>
      <div class="field"><label>歌曲名</label><input id="v45729SongTitle"></div>
      <div class="field"><label>艺术家</label><input id="v45729SongArtist"></div>
      <div class="field"><label>专辑</label><input id="v45729SongAlbum"></div>
      <div class="field"><label>HTTPS 音频地址</label><input id="v45729SongUrl" placeholder="https://..."></div>
      <div class="field"><label>歌词</label><textarea id="v45729SongLyrics" rows="8"></textarea></div>
      <div class="field"><label>赏析 / 背景</label><textarea id="v45729SongNotes" rows="3"></textarea></div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
        <button class="primary" onclick="v45729SaveSong()">保存</button>
      </div>
    `);
  };
  
  window.v45729SaveSong = function(index = -1) {
    initMusic();
    
    const title = document.getElementById('v45729SongTitle')?.value.trim();
    const artist = document.getElementById('v45729SongArtist')?.value.trim();
    const album = document.getElementById('v45729SongAlbum')?.value.trim();
    const url = document.getElementById('v45729SongUrl')?.value.trim();
    const lyrics = document.getElementById('v45729SongLyrics')?.value.trim();
    const notes = document.getElementById('v45729SongNotes')?.value.trim();
    
    if (!title) {
      toast('请填写歌曲名');
      return;
    }
    
    const song = {
      id: ID('song'),
      title,
      artist,
      album,
      url,
      lyrics,
      notes,
      createdAt: NOW(),
      updatedAt: NOW()
    };
    
    if (index >= 0 && index < data.musicV45729.songs.length) {
      song.id = data.musicV45729.songs[index].id;
      song.createdAt = data.musicV45729.songs[index].createdAt;
      data.musicV45729.songs[index] = song;
    } else {
      data.musicV45729.songs.push(song);
    }
    
    try { save(); } catch {}
    closeModal();
    v45729OpenMusicLibrary();
  };
  
  window.v45729OpenEffectsLibrary = function() {
    initMusic();
    const effects = data.musicV45729.effects;
    
    modal(`
      <div class="v45729-effects-sheet">
        <header>
          <small>SOUND EFFECTS</small>
          <h2>音效库</h2>
          <p>环境声、动作声、提示声，不与歌曲混用</p>
        </header>
        
        <div class="v45729-framework-notice">
          <b>🔊 框架阶段</b>
          <p>音效库与歌曲库独立分开；支持搭配旁白朗读，可单独开关。</p>
        </div>
        
        <div class="v45729-effects-list">
          ${effects.length ? effects.map((effect, i) => `
            <div class="v45729-effect-card">
              <div>
                <b>${E(effect.name)}</b>
                <small>${E(effect.category || '未分类')}</small>
              </div>
              <button onclick="v45729PlayEffect(${i})">试听</button>
              <button onclick="v45729DeleteEffect(${i})">删除</button>
            </div>
          `).join('') : '<div class="v45729-framework-empty">音效库为空</div>'}
        </div>
        
        <div class="v45729-framework-actions">
          <button onclick="v45729AddEffect()">＋ 添加音效</button>
        </div>
        
        <div class="form-actions">
          <button onclick="v45729OpenMusicLibrary()">返回歌曲库</button>
          <button class="primary" onclick="closeModal()">完成</button>
        </div>
      </div>
    `);
  };
  
  window.v45729OpenNeteaseSettings = function() {
    initMusic();
    const netease = data.musicV45729.netease;
    
    modal(`
      <div class="v45729-netease-sheet">
        <header>
          <small>NETEASE CLOUD MUSIC</small>
          <h2>网易云音乐连接器</h2>
          <p>状态：${E(netease.status)}</p>
        </header>
        
        <div class="v45729-framework-notice">
          <b>⚠️ 框架阶段 - 未连接</b>
          <p>当前只提供授权设置页和连接器框架。真实接入需要 USER 提供自己的后端或 Serverless 适配层。</p>
          <p>静态前端不会内置应用密钥，也不会声称已经连接。</p>
        </div>
        
        <div class="field">
          <label>Client ID</label>
          <input id="v45729NeteaseClientId" value="${A(netease.clientId || '')}" placeholder="由 USER 提供">
        </div>
        
        <div class="field">
          <label>授权 URL</label>
          <input id="v45729NeteaseAuthUrl" value="${A(netease.authorizeUrl || '')}" placeholder="https://...">
        </div>
        
        <div class="field">
          <label>回调 URI</label>
          <input id="v45729NeteaseRedirect" value="${A(netease.redirectUri || '')}" placeholder="https://...">
        </div>
        
        <div class="form-actions">
          <button onclick="v45729SaveNeteaseSettings()">保存设置</button>
          <button onclick="v45729TestNeteaseConnection()">测试连接</button>
          <button class="primary" onclick="closeModal()">关闭</button>
        </div>
      </div>
    `);
  };
  
  window.v45729SaveNeteaseSettings = function() {
    initMusic();
    const netease = data.musicV45729.netease;
    
    netease.clientId = document.getElementById('v45729NeteaseClientId')?.value.trim() || '';
    netease.authorizeUrl = document.getElementById('v45729NeteaseAuthUrl')?.value.trim() || '';
    netease.redirectUri = document.getElementById('v45729NeteaseRedirect')?.value.trim() || '';
    
    try { save(); } catch {}
    toast('网易云设置已保存（仍未连接）');
  };
  
  window.v45729TestNeteaseConnection = function() {
    toast('⚠️ 网易云连接器尚未实现，需要 USER 提供后端适配');
  };
  
  // ========== 4. API 悬浮球框架 ==========
  
  function createApiFloatingBall() {
    if (document.getElementById('v45729ApiBall')) return;
    
    const ball = document.createElement('div');
    ball.id = 'v45729ApiBall';
    ball.className = 'v45729-api-ball';
    ball.innerHTML = '⚙️';
    ball.onclick = () => window.v45729ToggleApiBallPanel();
    
    document.body.appendChild(ball);
  }
  
  window.v45729ShowApiBall = function() {
    createApiFloatingBall();
    document.getElementById('v45729ApiBall').style.display = 'block';
  };
  
  window.v45729HideApiBall = function() {
    const ball = document.getElementById('v45729ApiBall');
    if (ball) ball.style.display = 'none';
  };
  
  window.v45729ToggleApiBallPanel = function() {
    const character = data.characters?.find(c => c.id === currentChat) || 
                     data.characters?.find(c => directChatId && directChatId(c.id) === currentChat);
    const group = data.groups?.find(g => g.id === currentChat) ||
                 data.groups?.find(g => groupChatId && groupChatId(g.id) === currentChat);
    
    const target = character || group;
    
    modal(`
      <div class="v45729-api-ball-sheet">
        <header>
          <small>API STATUS</small>
          <h2>线路状态</h2>
          <p>当前页面：${currentView || '未知'}</p>
        </header>
        
        <div class="v45729-api-status">
          <div class="v45729-status-item">
            <b>当前对话</b>
            <p>${target ? E(target.name) : '无'}</p>
          </div>
          
          <div class="v45729-status-item">
            <b>主聊天线路</b>
            <p>${typeof validModel === 'function' && validModel('chat') ? '✓ 已配置' : '✗ 未配置'}</p>
          </div>
          
          <div class="v45729-status-item">
            <b>专属线路</b>
            <p>${character?.apiBindings?.chat ? '✓ 已绑定' : '无'}</p>
          </div>
          
          <div class="v45729-status-item">
            <b>协调线路</b>
            <p>${data.runtime?.coordinatorRouteId || '未设置'}</p>
          </div>
        </div>
        
        <div class="v45729-framework-actions">
          <button onclick="v435BindFunction?.('chat')">配置主线路</button>
          <button onclick="show?.('settings')">全局 API 管理</button>
        </div>
        
        <div class="form-actions">
          <button class="primary" onclick="closeModal()">关闭</button>
        </div>
      </div>
    `);
  };
  
  // ========== 5. 聊天工具统一入口 ==========
  
  /**
   * 统一图片入口 - 上传图片 / AI 生图
   */
  window.v45729OpenImageMenu = function() {
    modal(`
      <h2>图片</h2>
      <div class="v45729-tool-menu">
        <button onclick="v45729UploadImage()">
          <b>📤 上传图片</b>
          <small>从本机选择图片</small>
        </button>
        <button onclick="v45729GenerateImage()">
          <b>✨ AI 生成图片</b>
          <small>需要配置图片生成模型</small>
        </button>
      </div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
      </div>
    `);
  };
  
  window.v45729UploadImage = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          
          // 添加到聊天历史
          if (data.chats[currentChat]) {
            data.chats[currentChat].push({
              id: ID('image_message'),
              role: 'user',
              kind: 'image',
              image: dataUrl,
              caption: '',
              visionStatus: '未配置识图模型',
              text: '[图片]',
              time: typeof time === 'function' ? time() : '',
              createdAt: NOW()
            });
            
            try { save(); } catch {}
            if (typeof renderMessages === 'function') {
              renderMessages();
            }
            toast('图片已上传（未识图）');
          }
        };
        reader.readAsDataURL(file);
        closeModal();
      } catch (error) {
        toast('图片上传失败');
        console.error(error);
      }
    };
    input.click();
  };
  
  window.v45729GenerateImage = function() {
    closeModal();
    // 调用现有生图功能
    if (typeof window.generateImage === 'function') {
      window.generateImage();
    } else {
      toast('生图功能未找到');
    }
  };
  
  /**
   * 假语音条入口 - 手动输入转写 / 浏览器录音
   */
  window.v45729OpenVoiceMessageMenu = function() {
    modal(`
      <h2>语音条</h2>
      <div class="v45729-tool-menu">
        <button onclick="v45729ManualVoiceTranscript()">
          <b>⌨️ 手动输入转写</b>
          <small>自己填写语音条内容</small>
        </button>
        <button onclick="v45729RecordVoiceMessage()">
          <b>🎤 浏览器录音</b>
          <small>需要麦克风权限</small>
        </button>
      </div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
      </div>
    `);
  };
  
  window.v45729ManualVoiceTranscript = function() {
    modal(`
      <h2>手动输入语音条转写</h2>
      <div class="field">
        <label>转写内容</label>
        <textarea id="v45729VoiceTranscript" rows="4" placeholder="输入这条语音条的文字内容..."></textarea>
      </div>
      <div class="form-actions">
        <button onclick="closeModal()">取消</button>
        <button class="primary" onclick="v45729SendVoiceMessage()">发送</button>
      </div>
    `);
  };
  
  window.v45729SendVoiceMessage = function() {
    const transcript = document.getElementById('v45729VoiceTranscript')?.value.trim();
    if (!transcript) {
      toast('请输入转写内容');
      return;
    }
    
    if (data.chats[currentChat]) {
      data.chats[currentChat].push({
        id: ID('voice_message'),
        role: 'user',
        kind: 'voice',
        transcript,
        text: `【语音条｜转写】${transcript}`,
        time: typeof time === 'function' ? time() : '',
        createdAt: NOW()
      });
      
      try { save(); } catch {}
      if (typeof renderMessages === 'function') {
        renderMessages();
      }
      closeModal();
      toast('语音条已发送');
    }
  };
  
  window.v45729RecordVoiceMessage = function() {
    closeModal();
    toast('⚠️ 浏览器录音功能需要在实际聊天页面调用录音适配层');
    // 实际应该打开聊天页面并触发录音按钮
  };
  
  console.log('[V45.7.29 P1] Framework modules loaded');
})();
