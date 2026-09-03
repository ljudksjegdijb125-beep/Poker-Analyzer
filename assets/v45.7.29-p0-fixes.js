/* =========================================================
   POKEJI V45.7.29 · P0 Bug Fixes
   ========================================================= */
(function(){
  'use strict';
  
  if(window.__pokejiV45729P0Loaded)return;
  window.__pokejiV45729P0Loaded=true;
  
  const S=value=>String(value==null?'':value);
  const L=value=>Array.isArray(value)?value:[];
  const O=value=>(value&&typeof value==='object'&&!Array.isArray(value))?value:{};
  
  // ========== P0-5: 统一安全 JSON 解析 ==========
  
  /**
   * 安全 JSON 解析器 - 防止原始 JSON 泄漏
   * @param {string} raw - 原始输入
   * @param {object} fallback - 失败时的回退值
   * @returns {object} 解析结果或回退值
   */
  function safeJsonParse(raw, fallback = null) {
    const text = S(raw).trim();
    if (!text) return fallback;
    
    // 尝试直接解析
    try {
      return JSON.parse(text);
    } catch {}
    
    // 尝试提取代码块中的 JSON
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {}
    }
    
    // 尝试提取第一个完整对象
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
    
    // 尝试提取第一个完整数组
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {}
    }
    
    // 所有解析都失败，返回回退值
    return fallback;
  }
  
  /**
   * 语伴专用宽松 JSON 解析器
   * - 成功返回对象
   * - 失败返回 {reply: 清理后的文本}
   * - 绝不泄漏原始 JSON 字符串
   */
  function parseJsonLooseSafe(raw) {
    const result = safeJsonParse(raw, null);
    if (result && typeof result === 'object') {
      return result;
    }
    
    // 失败时清理 HTML 标签、代码块和 JSON 字符，只保留纯文本
    const text = S(raw);
    
    // 移除代码块
    let cleaned = text.replace(/```[\s\S]*?```/g, '');
    
    // 移除 HTML 标签
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // 移除 JSON 对象和数组
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/\[[\s\S]*?\]/g, '');
    
    // 清理多余空白
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
    
    return { reply: cleaned || '(无法解析回复)' };
  }
  
  // 覆盖全局 parseJsonLoose
  window.parseJsonLoose = parseJsonLooseSafe;
  window.v45729SafeJsonParse = safeJsonParse;
  
  // ========== P0-3: 重复包装检测与修复 ==========
  
  /**
   * 包装函数时防止重复包装
   * @param {string} name - 函数名
   * @param {function} wrapper - 包装器函数
   * @param {string} marker - 标记属性名
   */
  function wrapFunctionOnce(name, wrapper, marker) {
    const base = window[name];
    if (typeof base !== 'function') return false;
    if (base[marker]) return false; // 已经包装过
    
    const wrapped = wrapper(base);
    wrapped[marker] = true;
    window[name] = wrapped;
    try { globalThis[name] = wrapped; } catch {}
    return true;
  }
  
  window.v45729WrapOnce = wrapFunctionOnce;
  
  // ========== P0-1/P0-2: 确保修复已加载 ==========
  
  // 检查聊天背景修复是否已加载
  if (typeof window.v45729PaintChatBackground !== 'function') {
    console.warn('[V45.7.29 P0] 聊天背景修复未加载，需要 v45.7.29-a.js');
  }
  
  // 检查路由表面修复是否已加载
  if (typeof window.v45729FixRouteSurfaces !== 'function') {
    console.warn('[V45.7.29 P0] 路由表面修复未加载，需要 v45.7.29-a.js');
  }
  
  // 检查录音适配是否已加载
  if (typeof window.v457SpeechDown !== 'function' || typeof window.v457SpeechUp !== 'function') {
    console.warn('[V45.7.29 P0] 录音适配未加载，需要 v45.7.29-a.js');
  }
  
  console.log('[V45.7.29 P0] Bug fixes loaded');
})();
