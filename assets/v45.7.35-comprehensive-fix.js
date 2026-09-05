/* =========================================================
   POKEJI V45.7.35 · 全面UI和功能修复
   - 修复桌面图标布局（Dock固定在底部）
   - 全局字体统一应用
   - 修复输入法遮挡问题
   - 修复广场重叠问题
   - 完全重构文游UI
   - 增强音乐陪听功能
   - 优化关系网界面
   - 美化语音通话界面
   - 优化生图界面
   ========================================================= */
(function(){'use strict';
if(window.__pokejiV45735ComprehensiveFix)return;
window.__pokejiV45735ComprehensiveFix=true;

const S=(v,f='')=>String(v??f);
const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const L=v=>Array.isArray(v)?v:[];
const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'"','\'':'&#39;'}[c]));

// ==================== 修复1: 桌面图标布局 - Dock固定底部 ====================
function fixHomeLayout() {
  // 确保dock始终在底部
  const style = document.createElement('style');
  style.id = 'v45735-home-layout-fix';
  style.textContent = `
    /* 桌面布局修复 */
    .p12-home {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
    }
    
    .p12-pages {
      flex: 1 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }
    
    .p12-page {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      grid-auto-rows: minmax(80px, auto) !important;
      gap: 20px 14px !important;
      padding: 16px 22px 20px !important;
      align-content: start !important;
    }
    
    /* Dock固定在底部 */
    .p12-dock {
      position: fixed !important;
      left: 17px !important;
      right: 17px !important;
      bottom: calc(25px + env(safe-area-inset-bottom)) !important;
      z-index: 100 !important;
      margin: 0 !important;
    }
    
    .p12-dots {
      position: fixed !important;
      bottom: calc(100px + env(safe-area-inset-bottom)) !important;
      z-index: 99 !important;
    }
    
    /* 小组件定位 */
    .p12-app {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 7px !important;
    }
    
    /* 2x2组件占据2行2列 */
    .p12-widget-2x2 {
      grid-column: span 2 !important;
      grid-row: span 2 !important;
    }
  `;
  
  if (!document.getElementById('v45735-home-layout-fix')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复2: 全局字体统一 ====================
function applyGlobalFont() {
  const style = document.createElement('style');
  style.id = 'v45735-global-font';
  style.textContent = `
    /* 全局字体统一 */
    * {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", 
                   "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", 
                   "Microsoft YaHei", "Segoe UI", Roboto, sans-serif !important;
    }
    
    /* 聊天气泡字体 */
    .bubble,
    .msg,
    .messages,
    #messageInput,
    .composer input,
    .composer textarea {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", 
                   "PingFang SC", "Noto Sans CJK SC", sans-serif !important;
    }
    
    /* 标题使用衬线字体 */
    h1, h2, h3, .v455-story-title, .feed-author b {
      font-family: "SF Pro Display", "PingFang SC", -apple-system, sans-serif !important;
    }
    
    /* 关系网字体 */
    .relationship-node,
    .relationship-label,
    .relation-card {
      font-family: -apple-system, "PingFang SC", sans-serif !important;
    }
  `;
  
  if (!document.getElementById('v45735-global-font')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复3: 输入法遮挡问题 ====================
function fixKeyboardOverlay() {
  const composer = document.querySelector('.composer');
  if (!composer) return;
  
  // 监听焦点事件
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('focus', () => {
      // 延迟滚动，确保键盘已弹出
      setTimeout(() => {
        const messages = document.querySelector('.messages');
        if (messages) {
          messages.scrollTop = messages.scrollHeight;
        }
        
        // 隐藏可能泄露的代码
        document.querySelectorAll('script').forEach(script => {
          script.style.display = 'none';
        });
      }, 300);
    });
  }
  
  // 添加样式防止内容泄露
  const style = document.createElement('style');
  style.id = 'v45735-keyboard-fix';
  style.textContent = `
    /* 输入法弹起时的处理 */
    .composer {
      background: rgba(11,11,12,.98) !important;
      backdrop-filter: blur(20px) !important;
      z-index: 1000 !important;
    }
    
    /* 隐藏可能泄露的元素 */
    body > script,
    body > style:not([id]) {
      display: none !important;
    }
    
    /* 消息区域自动调整 */
    .messages {
      padding-bottom: calc(100px + env(safe-area-inset-bottom)) !important;
      scroll-behavior: smooth !important;
    }
  `;
  
  if (!document.getElementById('v45735-keyboard-fix')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复4: 广场重叠问题（彻底修复）====================
function fixFeedOverlap() {
  const style = document.createElement('style');
  style.id = 'v45735-feed-overlap-fix';
  style.textContent = `
    /* 广场布局彻底修复 */
    .feed {
      display: flex !important;
      flex-direction: column !important;
      gap: 0 !important;
    }
    
    .feed-item {
      display: grid !important;
      grid-template-columns: 43px 1fr !important;
      grid-template-rows: auto auto !important;
      column-gap: 11px !important;
      row-gap: 8px !important;
      padding: 16px !important;
      margin: 0 !important;
      border-bottom: 1px solid rgba(255,255,255,.075) !important;
      position: relative !important;
      isolation: isolate !important;
      background: transparent !important;
    }
    
    .feed-item + .feed-item {
      border-top: none !important;
    }
    
    .feed-author {
      display: contents !important;
    }
    
    .feed-author .avatar {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 43px !important;
      height: 43px !important;
      margin: 0 !important;
      position: relative !important;
    }
    
    .feed-author > div {
      grid-column: 2 !important;
      grid-row: 1 !important;
      padding-right: 35px !important;
      position: relative !important;
    }
    
    .feed-more {
      position: absolute !important;
      top: 16px !important;
      right: 16px !important;
      grid-column: unset !important;
      grid-row: unset !important;
    }
    
    .feed-body {
      grid-column: 2 !important;
      grid-row: 2 !important;
      width: 100% !important;
      position: relative !important;
    }
    
    /* 防止内容溢出 */
    .feed-text,
    .feed-images,
    .feed-actions {
      max-width: 100% !important;
      overflow: visible !important;
    }
  `;
  
  if (!document.getElementById('v45735-feed-overlap-fix')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复5: 文游UI完全重构 ====================
function reconstructVisualNovelUI() {
  const style = document.createElement('style');
  style.id = 'v45735-vn-reconstruct';
  style.textContent = `
    /* 文游界面完全重构 */
    .v455-story-page {
      background: linear-gradient(180deg, #0a0a0d 0%, #1a1a1f 100%) !important;
      min-height: 100vh !important;
      animation: fadeIn 0.3s ease !important;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* 文游头部 */
    .v455-story-head {
      background: linear-gradient(145deg, rgba(255,215,120,0.12), rgba(255,195,80,0.03)) !important;
      border-bottom: 2px solid rgba(255,215,120,0.2) !important;
      padding: 20px 18px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
    }
    
    .v455-story-title {
      font-size: 24px !important;
      font-weight: 600 !important;
      color: #fff5e6 !important;
      margin: 0 0 12px 0 !important;
      letter-spacing: 0.5px !important;
      text-shadow: 0 2px 8px rgba(255,215,120,0.3) !important;
    }
    
    .v455-story-meta {
      display: flex !important;
      gap: 16px !important;
      flex-wrap: wrap !important;
      font-size: 12px !important;
      color: #d4b896 !important;
    }
    
    .v455-story-meta span {
      padding: 4px 10px !important;
      background: rgba(255,215,120,0.1) !important;
      border-radius: 12px !important;
      border: 1px solid rgba(255,215,120,0.2) !important;
    }
    
    /* 文游内容区 */
    .v455-story-content {
      padding: 28px 22px !important;
      margin: 20px 16px !important;
      background: rgba(26,26,31,0.9) !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255,215,120,0.15) !important;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.3), 
                  0 8px 32px rgba(0,0,0,0.4) !important;
      color: #f0e6d6 !important;
      font-size: 16px !important;
      line-height: 2 !important;
      letter-spacing: 0.3px !important;
    }
    
    /* 文游按钮组 */
    .v455-story-actions {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
      gap: 12px !important;
      padding: 0 16px 24px !important;
    }
    
    .v455-story-actions button {
      padding: 16px 20px !important;
      border-radius: 14px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: linear-gradient(145deg, rgba(255,215,120,0.15), rgba(255,215,120,0.05)) !important;
      border: 2px solid rgba(255,215,120,0.3) !important;
      color: #ffd778 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
      letter-spacing: 0.5px !important;
    }
    
    .v455-story-actions button:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(255,215,120,0.3) !important;
    }
    
    .v455-story-actions button:active {
      transform: scale(0.98) !important;
    }
    
    .v455-story-actions button.primary {
      background: linear-gradient(145deg, #ffd778, #ffb347) !important;
      color: #1a1a1f !important;
      border-color: transparent !important;
      font-weight: 700 !important;
      box-shadow: 0 6px 20px rgba(255,215,120,0.4) !important;
    }
    
    /* 文游列表卡片 */
    .v455-story-card {
      background: linear-gradient(145deg, rgba(255,215,120,0.08), rgba(26,26,31,0.95)) !important;
      border: 2px solid rgba(255,215,120,0.25) !important;
      border-radius: 18px !important;
      padding: 20px !important;
      margin: 0 16px 16px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
      overflow: hidden !important;
      position: relative !important;
    }
    
    .v455-story-card::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 3px !important;
      background: linear-gradient(90deg, #ffd778, #ffb347, #ffd778) !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    }
    
    .v455-story-card:hover::before {
      opacity: 1 !important;
    }
    
    .v455-story-card:active {
      transform: scale(0.99) !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
    }
  `;
  
  if (!document.getElementById('v45735-vn-reconstruct')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复6: 音乐陪听功能增强 ====================
function enhanceMusicCompanion() {
  const style = document.createElement('style');
  style.id = 'v45735-music-enhance';
  style.textContent = `
    /* 音乐陪听界面 */
    .music-companion-widget {
      background: linear-gradient(145deg, rgba(120,80,200,0.15), rgba(80,40,160,0.05)) !important;
      border: 2px solid rgba(140,100,220,0.3) !important;
      border-radius: 20px !important;
      padding: 24px !important;
      box-shadow: 0 8px 32px rgba(80,40,160,0.3) !important;
    }
    
    .music-cover {
      width: 200px !important;
      height: 200px !important;
      border-radius: 16px !important;
      margin: 0 auto 20px !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;
      animation: musicRotate 20s linear infinite !important;
      animation-play-state: paused !important;
    }
    
    .music-cover.playing {
      animation-play-state: running !important;
    }
    
    @keyframes musicRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .music-info {
      text-align: center !important;
      margin-bottom: 20px !important;
    }
    
    .music-title {
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #e8d4ff !important;
      margin-bottom: 8px !important;
    }
    
    .music-artist {
      font-size: 14px !important;
      color: #b8a0d0 !important;
    }
    
    .music-controls {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 24px !important;
      margin-top: 20px !important;
    }
    
    .music-controls button {
      width: 56px !important;
      height: 56px !important;
      border-radius: 50% !important;
      background: linear-gradient(145deg, rgba(180,140,255,0.3), rgba(140,100,220,0.2)) !important;
      border: 2px solid rgba(180,140,255,0.4) !important;
      color: #e8d4ff !important;
      font-size: 24px !important;
      transition: all 0.3s ease !important;
    }
    
    .music-controls button.play-pause {
      width: 72px !important;
      height: 72px !important;
      background: linear-gradient(145deg, #b48cff, #8c64dc) !important;
      box-shadow: 0 8px 24px rgba(140,100,220,0.5) !important;
    }
    
    .music-progress {
      margin-top: 24px !important;
    }
    
    .music-progress-bar {
      height: 4px !important;
      background: rgba(180,140,255,0.2) !important;
      border-radius: 2px !important;
      overflow: hidden !important;
    }
    
    .music-progress-fill {
      height: 100% !important;
      background: linear-gradient(90deg, #b48cff, #8c64dc) !important;
      transition: width 0.3s ease !important;
    }
    
    .music-time {
      display: flex !important;
      justify-content: space-between !important;
      margin-top: 8px !important;
      font-size: 12px !important;
      color: #9880b0 !important;
    }
  `;
  
  if (!document.getElementById('v45735-music-enhance')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复7: 关系网界面优化 ====================
function enhanceRelationshipGraph() {
  const style = document.createElement('style');
  style.id = 'v45735-relationship-enhance';
  style.textContent = `
    /* 关系网界面优化 */
    .relationship-graph {
      background: linear-gradient(145deg, #0f1318 0%, #1a1f28 100%) !important;
      padding: 24px !important;
      border-radius: 16px !important;
      min-height: 400px !important;
    }
    
    .relationship-node {
      background: linear-gradient(145deg, rgba(100,150,250,0.15), rgba(60,110,210,0.05)) !important;
      border: 2px solid rgba(100,150,250,0.35) !important;
      border-radius: 14px !important;
      padding: 16px !important;
      box-shadow: 0 4px 16px rgba(60,110,210,0.3) !important;
      font-family: -apple-system, "PingFang SC", sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      color: #c8d8ff !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
    }
    
    .relationship-node:hover {
      transform: scale(1.05) !important;
      box-shadow: 0 8px 24px rgba(100,150,250,0.5) !important;
      border-color: rgba(100,150,250,0.6) !important;
    }
    
    .relationship-node.main {
      background: linear-gradient(145deg, rgba(255,180,120,0.2), rgba(255,140,80,0.1)) !important;
      border-color: rgba(255,180,120,0.5) !important;
      color: #ffe4d0 !important;
      font-size: 16px !important;
    }
    
    .relationship-link {
      stroke: rgba(100,150,250,0.4) !important;
      stroke-width: 2px !important;
      fill: none !important;
      transition: all 0.3s ease !important;
    }
    
    .relationship-link:hover {
      stroke: rgba(100,150,250,0.8) !important;
      stroke-width: 3px !important;
    }
    
    .relationship-label {
      background: rgba(20,25,35,0.95) !important;
      border: 1px solid rgba(100,150,250,0.3) !important;
      border-radius: 8px !important;
      padding: 6px 12px !important;
      font-family: -apple-system, "PingFang SC", sans-serif !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #a8b8d8 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
    }
    
    /* 关系分类标签 */
    .relationship-category {
      display: inline-flex !important;
      align-items: center !important;
      padding: 6px 14px !important;
      background: rgba(100,150,250,0.12) !important;
      border: 1px solid rgba(100,150,250,0.25) !important;
      border-radius: 16px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      color: #a8b8d8 !important;
      margin: 4px !important;
    }
    
    .relationship-category::before {
      content: '●' !important;
      margin-right: 6px !important;
      font-size: 8px !important;
    }
    
    .relationship-category.family::before { color: #ff8c8c !important; }
    .relationship-category.friend::before { color: #8cd4ff !important; }
    .relationship-category.work::before { color: #8cffb4 !important; }
    .relationship-category.romance::before { color: #ff8cdc !important; }
  `;
  
  if (!document.getElementById('v45735-relationship-enhance')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复8: 语音通话界面 ====================
function enhanceVoiceCallUI() {
  const style = document.createElement('style');
  style.id = 'v45735-voice-call-enhance';
  style.textContent = `
    /* 语音通话界面 */
    .voice-call-screen {
      background: linear-gradient(180deg, #1a1f2e 0%, #0f1318 100%) !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      padding: 60px 24px 40px !important;
    }
    
    .voice-call-avatar-container {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      margin-top: 60px !important;
    }
    
    .voice-call-avatar {
      width: 140px !important;
      height: 140px !important;
      border-radius: 50% !important;
      border: 4px solid rgba(100,150,250,0.3) !important;
      box-shadow: 0 0 0 12px rgba(100,150,250,0.1),
                  0 16px 48px rgba(0,0,0,0.6) !important;
      margin-bottom: 32px !important;
      animation: voiceCallPulse 2s ease-in-out infinite !important;
    }
    
    @keyframes voiceCallPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 12px rgba(100,150,250,0.1); }
      50% { transform: scale(1.02); box-shadow: 0 0 0 16px rgba(100,150,250,0.15); }
    }
    
    .voice-call-name {
      font-size: 28px !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      margin-bottom: 12px !important;
      text-shadow: 0 2px 12px rgba(0,0,0,0.5) !important;
    }
    
    .voice-call-status {
      font-size: 16px !important;
      color: #8ca8d8 !important;
      margin-bottom: 8px !important;
    }
    
    .voice-call-duration {
      font-size: 20px !important;
      font-weight: 500 !important;
      color: #6496fa !important;
      font-variant-numeric: tabular-nums !important;
    }
    
    /* 通话控制按钮 */
    .voice-call-controls {
      display: flex !important;
      justify-content: center !important;
      gap: 32px !important;
      margin-bottom: 40px !important;
    }
    
    .voice-call-btn {
      width: 72px !important;
      height: 72px !important;
      border-radius: 50% !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 28px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      cursor: pointer !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
    }
    
    .voice-call-btn.mute {
      background: linear-gradient(145deg, rgba(100,150,250,0.25), rgba(60,110,210,0.15)) !important;
      color: #8ca8d8 !important;
    }
    
    .voice-call-btn.mute.active {
      background: linear-gradient(145deg, #6496fa, #4876d8) !important;
      color: #ffffff !important;
    }
    
    .voice-call-btn.speaker {
      background: linear-gradient(145deg, rgba(100,200,150,0.25), rgba(60,160,110,0.15)) !important;
      color: #8cd8b8 !important;
    }
    
    .voice-call-btn.speaker.active {
      background: linear-gradient(145deg, #64c896, #3ca86e) !important;
      color: #ffffff !important;
    }
    
    .voice-call-btn.hang-up {
      background: linear-gradient(145deg, #ff6b6b, #ee5555) !important;
      color: #ffffff !important;
      width: 80px !important;
      height: 80px !important;
      font-size: 32px !important;
    }
    
    .voice-call-btn:active {
      transform: scale(0.95) !important;
    }
    
    /* 音频波形动画 */
    .voice-wave {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      height: 60px !important;
      margin: 32px 0 !important;
    }
    
    .voice-wave-bar {
      width: 4px !important;
      background: linear-gradient(180deg, #6496fa, #4876d8) !important;
      border-radius: 2px !important;
      animation: voiceWave 1.2s ease-in-out infinite !important;
    }
    
    .voice-wave-bar:nth-child(1) { animation-delay: 0s; height: 20px; }
    .voice-wave-bar:nth-child(2) { animation-delay: 0.1s; height: 32px; }
    .voice-wave-bar:nth-child(3) { animation-delay: 0.2s; height: 40px; }
    .voice-wave-bar:nth-child(4) { animation-delay: 0.3s; height: 28px; }
    .voice-wave-bar:nth-child(5) { animation-delay: 0.4s; height: 36px; }
    
    @keyframes voiceWave {
      0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
      50% { transform: scaleY(1.2); opacity: 1; }
    }
  `;
  
  if (!document.getElementById('v45735-voice-call-enhance')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复9: 生图界面优化 ====================
function enhanceImageGenerationUI() {
  const style = document.createElement('style');
  style.id = 'v45735-image-gen-enhance';
  style.textContent = `
    /* 生图界面优化 */
    .image-gen-panel {
      background: linear-gradient(145deg, #1a1520 0%, #0f0a15 100%) !important;
      border-radius: 20px !important;
      padding: 24px !important;
      margin: 16px !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;
      border: 2px solid rgba(200,150,255,0.2) !important;
    }
    
    .image-gen-header {
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      margin-bottom: 24px !important;
    }
    
    .image-gen-icon {
      width: 48px !important;
      height: 48px !important;
      border-radius: 12px !important;
      background: linear-gradient(145deg, rgba(200,150,255,0.2), rgba(160,100,220,0.1)) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 24px !important;
      color: #c896ff !important;
    }
    
    .image-gen-title {
      font-size: 20px !important;
      font-weight: 600 !important;
      color: #e8d4ff !important;
    }
    
    .image-gen-prompt {
      background: rgba(30,25,35,0.8) !important;
      border: 2px solid rgba(200,150,255,0.25) !important;
      border-radius: 14px !important;
      padding: 16px !important;
      margin-bottom: 20px !important;
      min-height: 120px !important;
      color: #d8c4f0 !important;
      font-size: 15px !important;
      line-height: 1.6 !important;
      resize: vertical !important;
      transition: all 0.3s ease !important;
    }
    
    .image-gen-prompt:focus {
      border-color: rgba(200,150,255,0.5) !important;
      box-shadow: 0 0 0 4px rgba(200,150,255,0.1) !important;
    }
    
    .image-gen-options {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      margin-bottom: 20px !important;
    }
    
    .image-gen-option {
      background: rgba(30,25,35,0.6) !important;
      border: 1px solid rgba(200,150,255,0.2) !important;
      border-radius: 12px !important;
      padding: 14px !important;
    }
    
    .image-gen-option label {
      display: block !important;
      font-size: 12px !important;
      color: #b8a0d0 !important;
      margin-bottom: 8px !important;
      font-weight: 500 !important;
    }
    
    .image-gen-option select,
    .image-gen-option input {
      width: 100% !important;
      background: rgba(40,35,50,0.8) !important;
      border: 1px solid rgba(200,150,255,0.2) !important;
      border-radius: 8px !important;
      padding: 10px !important;
      color: #d8c4f0 !important;
      font-size: 14px !important;
    }
    
    .image-gen-actions {
      display: flex !important;
      gap: 12px !important;
    }
    
    .image-gen-btn {
      flex: 1 !important;
      padding: 16px !important;
      border-radius: 14px !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      border: none !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
    }
    
    .image-gen-btn.primary {
      background: linear-gradient(145deg, #c896ff, #a064dc) !important;
      color: #1a1520 !important;
      box-shadow: 0 6px 20px rgba(200,150,255,0.4) !important;
    }
    
    .image-gen-btn.secondary {
      background: rgba(200,150,255,0.15) !important;
      border: 2px solid rgba(200,150,255,0.3) !important;
      color: #c896ff !important;
    }
    
    /* 生成进度 */
    .image-gen-progress {
      margin-top: 20px !important;
      padding: 20px !important;
      background: rgba(30,25,35,0.6) !important;
      border-radius: 14px !important;
      text-align: center !important;
    }
    
    .image-gen-spinner {
      width: 48px !important;
      height: 48px !important;
      margin: 0 auto 16px !important;
      border: 4px solid rgba(200,150,255,0.2) !important;
      border-top-color: #c896ff !important;
      border-radius: 50% !important;
      animation: spin 1s linear infinite !important;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* 生成结果 */
    .image-gen-result {
      margin-top: 20px !important;
      border-radius: 16px !important;
      overflow: hidden !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
    }
    
    .image-gen-result img {
      width: 100% !important;
      display: block !important;
      border-radius: 16px !important;
    }
  `;
  
  if (!document.getElementById('v45735-image-gen-enhance')) {
    document.head.appendChild(style);
  }
}

// ==================== 修复10: 线下参与者界面优化 ====================
function enhanceOfflineParticipantsUI() {
  const style = document.createElement('style');
  style.id = 'v45735-offline-participants-enhance';
  style.textContent = `
    /* 线下参与者界面 */
    .offline-participants {
      padding: 20px 16px !important;
    }
    
    .participant-card {
      background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)) !important;
      border: 2px solid rgba(255,255,255,0.1) !important;
      border-radius: 16px !important;
      padding: 18px !important;
      margin-bottom: 14px !important;
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
    }
    
    .participant-card:active {
      transform: scale(0.98) !important;
      background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)) !important;
    }
    
    .participant-avatar {
      width: 56px !important;
      height: 56px !important;
      border-radius: 14px !important;
      border: 2px solid rgba(255,255,255,0.15) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      flex-shrink: 0 !important;
    }
    
    .participant-info {
      flex: 1 !important;
      min-width: 0 !important;
    }
    
    .participant-name {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      margin-bottom: 6px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    
    .participant-status {
      font-size: 13px !important;
      color: rgba(255,255,255,0.6) !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .participant-status::before {
      content: '' !important;
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      background: #4ade80 !important;
      box-shadow: 0 0 8px rgba(74,222,128,0.6) !important;
    }
    
    .participant-actions {
      display: flex !important;
      gap: 8px !important;
    }
    
    .participant-action-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: 10px !important;
      background: rgba(255,255,255,0.08) !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      color: rgba(255,255,255,0.8) !important;
      font-size: 18px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s ease !important;
    }
    
    .participant-action-btn:active {
      transform: scale(0.95) !important;
      background: rgba(255,255,255,0.12) !important;
    }
  `;
  
  if (!document.getElementById('v45735-offline-participants-enhance')) {
    document.head.appendChild(style);
  }
}

// ==================== 初始化所有修复 ====================
function initAllFixes() {
  try {
    // 依次应用所有修复
    fixHomeLayout();
    applyGlobalFont();
    fixKeyboardOverlay();
    fixFeedOverlap();
    reconstructVisualNovelUI();
    enhanceMusicCompanion();
    enhanceRelationshipGraph();
    enhanceVoiceCallUI();
    enhanceImageGenerationUI();
    enhanceOfflineParticipantsUI();
    
    console.log('✓ POKEJI V45.7.35 全面修复补丁已加载');
    
    // DOM加载完成后再次应用
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          fixHomeLayout();
          applyGlobalFont();
        }, 100);
      });
    }
    
  } catch(e) {
    console.error('V45.7.35修复初始化失败:', e);
  }
}

// 立即执行
initAllFixes();

// 监听页面切换，重新应用修复
const originalOpenView = window.openView;
if (typeof originalOpenView === 'function') {
  window.openView = function(viewId) {
    const result = originalOpenView.apply(this, arguments);
    setTimeout(() => {
      if (viewId === 'feed') {
        fixFeedOverlap();
      } else if (viewId === 'home') {
        fixHomeLayout();
      }
    }, 50);
    return result;
  };
}

})();