/* =========================================================
   POKEJI V45.7.34 · 全面Bug修复补丁
   - 修复广场排版左右不对齐问题
   - 修复入梦功能无法直接生成
   - 修复白屏问题
   - 优化文游界面
   ========================================================= */
(function(){'use strict';
if(window.__pokejiV45734BugFix)return;
window.__pokejiV45734BugFix=true;

const S=(v,f='')=>String(v??f);
const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const L=v=>Array.isArray(v)?v:[];
const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'"','\'':'&#39;'}[c]));

// ==================== 修复1: 广场排版对齐问题 ====================
function fixFeedAlignment() {
  const style = document.getElementById('v45734-feed-fix');
  if (style) return;
  
  const css = document.createElement('style');
  css.id = 'v45734-feed-fix';
  css.textContent = `
    /* 修复广场布局对齐 */
    .feed-item {
      display: grid !important;
      grid-template-columns: 43px 1fr !important;
      grid-template-rows: auto auto !important;
      column-gap: 11px !important;
      row-gap: 0 !important;
      align-items: start !important;
    }
    
    .feed-author {
      display: contents !important;
    }
    
    .feed-author .avatar {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 43px !important;
      height: 43px !important;
      align-self: start !important;
    }
    
    .feed-author > div {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
      align-self: center !important;
      padding-right: 30px !important;
    }
    
    .feed-more {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      align-self: start !important;
      margin-top: 0 !important;
    }
    
    .feed-body {
      grid-column: 2 !important;
      grid-row: 2 !important;
      min-width: 0 !important;
      margin-top: 0 !important;
      width: 100% !important;
    }
    
    .feed-text {
      margin: 8px 0 10px !important;
      width: 100% !important;
    }
    
    .feed-images {
      display: grid !important;
      width: 100% !important;
      max-width: 264px !important;
    }
    
    .feed-images.count-1 {
      grid-template-columns: 1fr !important;
      max-width: 242px !important;
    }
    
    .feed-images.count-2,
    .feed-images.count-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      max-width: 220px !important;
    }
    
    .feed-images.count-3,
    .feed-images.count-5,
    .feed-images.count-6,
    .feed-images.count-7,
    .feed-images.count-8,
    .feed-images.count-9 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      max-width: 264px !important;
    }
  `;
  document.head.appendChild(css);
}

// ==================== 修复2: 入梦功能直接生成 ====================
// 拦截并增强原有的文游创建和启动逻辑
const originalV4571SaveNewVN = window.v4571SaveNewVN;
if (typeof originalV4571SaveNewVN === 'function' && !originalV4571SaveNewVN.__v45734) {
  window.v4571SaveNewVN = function(...args) {
    const result = originalV4571SaveNewVN.apply(this, args);
    
    // 自动开始生成首章
    setTimeout(() => {
      try {
        const games = L(data.visualNovelsV4571?.games);
        const newest = games[games.length - 1];
        if (newest && newest.id && !newest.chapters?.length) {
          // 直接进入生成界面
          if (typeof v4571StartFirstChapter === 'function') {
            v4571StartFirstChapter(newest.id);
          } else if (typeof v4571VNMenu === 'function') {
            v4571VNMenu(newest.id);
          }
        }
      } catch(e) {
        console.warn('自动启动首章失败:', e);
      }
    }, 100);
    
    return result;
  };
  window.v4571SaveNewVN.__v45734 = true;
}

// 新增：直接开始首章的便捷函数
window.v4571StartFirstChapter = function(gameId) {
  try {
    const games = L(data.visualNovelsV4571?.games);
    const game = games.find(g => S(g.id) === S(gameId));
    if (!game) return;
    
    // 如果没有章节，自动创建第一章
    if (!game.chapters || !game.chapters.length) {
      game.chapters = [{
        id: `chapter_${Date.now()}`,
        title: '第一章',
        content: '',
        createdAt: new Date().toISOString()
      }];
      data.visualNovelsV4571.activeId = game.id;
      data.visualNovelsV4571.activeChapterId = game.chapters[0].id;
      
      if (typeof save === 'function') save();
    }
    
    // 进入文游界面并开始生成
    if (typeof openVisualNovel === 'function') {
      openVisualNovel(game.id);
      
      // 延迟触发生成
      setTimeout(() => {
        if (typeof v4571GenerateChapter === 'function') {
          v4571GenerateChapter();
        }
      }, 300);
    }
  } catch(e) {
    console.error('启动首章失败:', e);
  }
};

// ==================== 修复3: 白屏问题修复 ====================
// 增强错误捕获和界面恢复
function setupWhiteScreenProtection() {
  let errorCount = 0;
  const MAX_ERRORS = 3;
  
  window.addEventListener('error', function(e) {
    errorCount++;
    
    if (errorCount >= MAX_ERRORS) {
      // 尝试恢复界面
      setTimeout(() => {
        const screen = document.getElementById('screen');
        const views = document.querySelectorAll('.view');
        
        // 确保至少有一个view是active的
        const hasActive = Array.from(views).some(v => v.classList.contains('active'));
        if (!hasActive && views.length > 0) {
          // 尝试打开home view
          const home = document.getElementById('home');
          if (home && typeof openView === 'function') {
            openView('home');
          }
        }
        
        errorCount = 0; // 重置计数
      }, 500);
    }
  }, true);
  
  // 检测view切换失败
  const observer = new MutationObserver(() => {
    const views = document.querySelectorAll('.view.active');
    if (views.length === 0) {
      console.warn('检测到没有active的view，尝试恢复');
      setTimeout(() => {
        const home = document.getElementById('home');
        if (home && !home.classList.contains('active')) {
          home.classList.add('active');
        }
      }, 100);
    }
  });
  
  const screen = document.getElementById('screen');
  if (screen) {
    observer.observe(screen, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// ==================== 修复4: 优化文游界面 ====================
function enhanceVisualNovelUI() {
  const style = document.getElementById('v45734-vn-enhance');
  if (style) return;
  
  const css = document.createElement('style');
  css.id = 'v45734-vn-enhance';
  css.textContent = `
    /* 文游界面优化 */
    .v455-story-page {
      background: linear-gradient(145deg, #0a0a0d 0%, #151519 100%) !important;
    }
    
    .v455-story-header {
      background: linear-gradient(145deg, rgba(201,163,92,0.08), rgba(201,163,92,0.02)) !important;
      border-bottom: 1px solid rgba(201,163,92,0.15) !important;
      padding: 16px !important;
    }
    
    .v455-story-title {
      font-size: 22px !important;
      font-family: Georgia, "Songti SC", serif !important;
      color: #f4efe4 !important;
      margin-bottom: 8px !important;
    }
    
    .v455-story-meta {
      font-size: 11px !important;
      color: #9d8557 !important;
      display: flex !important;
      gap: 12px !important;
      align-items: center !important;
    }
    
    .v455-story-content {
      padding: 20px 18px !important;
      line-height: 1.9 !important;
      font-size: 15px !important;
      color: #e7dfd0 !important;
      background: rgba(0,0,0,0.2) !important;
      border-radius: 12px !important;
      margin: 16px !important;
    }
    
    .v455-story-actions {
      display: flex !important;
      gap: 10px !important;
      padding: 0 16px 16px !important;
    }
    
    .v455-story-actions button {
      flex: 1 !important;
      padding: 12px !important;
      border-radius: 12px !important;
      font-size: 13px !important;
      background: linear-gradient(145deg, rgba(201,163,92,0.12), rgba(201,163,92,0.05)) !important;
      border: 1px solid rgba(201,163,92,0.25) !important;
      color: #d9b76d !important;
      transition: all 0.2s !important;
    }
    
    .v455-story-actions button:active {
      transform: scale(0.97) !important;
      background: linear-gradient(145deg, rgba(201,163,92,0.18), rgba(201,163,92,0.08)) !important;
    }
    
    .v455-story-actions button.primary {
      background: linear-gradient(145deg, #c9a35c, #8a6c37) !important;
      color: #0d0b07 !important;
      font-weight: 600 !important;
      border-color: transparent !important;
    }
    
    /* 文游列表优化 */
    .v455-story-list {
      padding: 12px 16px !important;
    }
    
    .v455-story-card {
      background: linear-gradient(145deg, rgba(238,218,159,0.06), rgba(238,218,159,0.015)) !important;
      border: 1px solid rgba(224,201,148,0.18) !important;
      border-radius: 16px !important;
      padding: 16px !important;
      margin-bottom: 12px !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
      transition: all 0.2s !important;
    }
    
    .v455-story-card:active {
      transform: scale(0.98) !important;
      border-color: rgba(224,201,148,0.3) !important;
    }
    
    .v455-story-card-title {
      font-size: 17px !important;
      font-family: Georgia, "Songti SC", serif !important;
      color: #f4efe4 !important;
      margin-bottom: 8px !important;
    }
    
    .v455-story-card-desc {
      font-size: 12px !important;
      color: #9d8557 !important;
      line-height: 1.6 !important;
      margin-bottom: 10px !important;
    }
    
    .v455-story-card-meta {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-size: 10px !important;
      color: #756e5f !important;
    }
    
    /* 文游创建界面优化 */
    .v455-story-creator {
      padding: 16px !important;
    }
    
    .v455-story-creator .field {
      margin-bottom: 16px !important;
    }
    
    .v455-story-creator label {
      display: block !important;
      font-size: 12px !important;
      color: #c9b57f !important;
      margin-bottom: 8px !important;
      font-weight: 600 !important;
    }
    
    .v455-story-creator input,
    .v455-story-creator textarea {
      width: 100% !important;
      padding: 12px !important;
      border: 1px solid rgba(224,201,148,0.25) !important;
      border-radius: 10px !important;
      background: rgba(17,16,13,0.6) !important;
      color: #e7dfd0 !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
    }
    
    .v455-story-creator input:focus,
    .v455-story-creator textarea:focus {
      border-color: rgba(224,201,148,0.45) !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(201,163,92,0.1) !important;
    }
    
    .v455-story-creator textarea {
      min-height: 120px !important;
      resize: vertical !important;
    }
  `;
  document.head.appendChild(css);
}

// ==================== 修复5: 增强错误提示 ====================
function enhanceErrorMessages() {
  const originalErrorDetail = window.errorDetail;
  if (typeof originalErrorDetail === 'function' && !originalErrorDetail.__v45734) {
    window.errorDetail = function(error, context) {
      // 对常见错误提供更友好的提示
      let message = error?.message || String(error);
      let friendlyContext = context;
      
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        friendlyContext = '网络连接失败';
        message = '无法连接到API服务器，请检查网络连接和API配置';
      } else if (message.includes('JSON') || message.includes('parse')) {
        friendlyContext = 'API返回格式错误';
        message = 'API返回的数据格式不正确，请检查API配置是否正确';
      } else if (message.includes('timeout')) {
        friendlyContext = '请求超时';
        message = 'API请求超时，请检查网络或增加超时时间设置';
      }
      
      return originalErrorDetail.call(this, {
        ...error,
        message: message
      }, friendlyContext);
    };
    window.errorDetail.__v45734 = true;
  }
}

// ==================== 初始化所有修复 ====================
function initAllFixes() {
  try {
    fixFeedAlignment();
    setupWhiteScreenProtection();
    enhanceVisualNovelUI();
    enhanceErrorMessages();
    
    // 标记修复已完成
    console.log('✓ POKEJI V45.7.34 Bug修复补丁已加载');
    
    // 立即检查并修复当前页面
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        fixFeedAlignment();
        enhanceVisualNovelUI();
      });
    } else {
      setTimeout(() => {
        fixFeedAlignment();
        enhanceVisualNovelUI();
      }, 100);
    }
  } catch(e) {
    console.error('Bug修复初始化失败:', e);
  }
}

// 立即执行初始化
initAllFixes();

// 监听页面切换，重新应用修复
if (typeof openView === 'function') {
  const originalOpenView = window.openView;
  window.openView = function(viewId) {
    const result = originalOpenView.apply(this, arguments);
    setTimeout(() => {
      if (viewId === 'feed') {
        fixFeedAlignment();
      }
    }, 50);
    return result;
  };
}

})();
