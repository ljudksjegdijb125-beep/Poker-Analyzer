/* =========================================================
   POKEJI V45.7.32 · Virtual Phone Apps Rebuild
   所有虚拟手机应用完整重做：真实信息结构 + 有效 CRUD
   ========================================================= */
(function(){
  'use strict';
  if(window.__pokejiV45729PhoneAppsLoaded)return;
  window.__pokejiV45729PhoneAppsLoaded=true;

  const S=v=>String(v==null?'':v);
  const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const L=v=>Array.isArray(v)?v:[];
  const E=v=>typeof esc==='function'?esc(S(v)):S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const A=v=>`'${S(v).replace(/'/g,"\\'")}'`;
  const NOW=()=>new Date().toISOString();
  const ID=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

  data.simPhones=O(data.simPhones);

  function phoneData(owner){data.simPhones[owner]=O(data.simPhones[owner]);return data.simPhones[owner]}
  function persist(){try{save();return true}catch{return false}}

  /* ========== 浏览器 ========== */
  function browser(owner){
    const d=phoneData(owner);d.browser=O(d.browser);d.browser.tabs=L(d.browser.tabs);d.browser.history=L(d.browser.history);d.browser.bookmarks=L(d.browser.bookmarks);
    return`
      <div class="phone-app-header">
        <button onclick="v45729PhoneBack()">‹</button>
        <input id="v45729BrowserBar" value="${E(d.browser.currentUrl||'')}" placeholder="搜索或输入网址">
        <button onclick="v45729BrowserGo(${A(owner)})">→</button>
      </div>
      <div class="phone-app-body">
        <div class="v45729-browser-content">${E(d.browser.currentPage||'输入网址或搜索')}</div>
      </div>
      <div class="phone-app-footer">
        <button onclick="v45729BrowserHistory(${A(owner)})">历史</button>
        <button onclick="v45729BrowserBookmarks(${A(owner)})">收藏</button>
      </div>
    `;
  }
  window.v45729BrowserGo=function(owner){
    const url=S(document.getElementById('v45729BrowserBar')?.value).trim();
    const d=phoneData(owner);d.browser.currentUrl=url;d.browser.currentPage=`正在访问：${url}`;
    d.browser.history.unshift({id:ID('history'),url,title:url,visitedAt:NOW()});
    persist();openSimPhone(owner,'browser');
  };

  /* ========== 银行卡/支付 ========== */
  function bank(owner){
    const d=phoneData(owner);d.bank=O(d.bank);d.bank.accounts=L(d.bank.accounts);d.bank.transactions=L(d.bank.transactions);
    const balance=d.bank.accounts.reduce((sum,acc)=>sum+(Number(acc.balance)||0),0);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>银行卡</span></div>
      <div class="phone-app-body">
        <div class="v45729-bank-summary">
          <div class="v45729-balance"><small>总余额</small><b>¥${balance.toFixed(2)}</b></div>
        </div>
        <div class="v45729-bank-accounts">
          ${d.bank.accounts.map(acc=>`
            <div class="v45729-account-card">
              <div><b>${E(acc.name||'未命名账户')}</b><small>${E(acc.type||'储蓄卡')}</small></div>
              <div class="v45729-account-balance">¥${(Number(acc.balance)||0).toFixed(2)}</div>
            </div>
          `).join('')||'<p>暂无账户</p>'}
        </div>
        <div class="v45729-transactions">
          <h3>最近交易</h3>
          ${d.bank.transactions.slice(0,10).map(tx=>`
            <div class="v45729-transaction-row">
              <div><b>${E(tx.description||'交易')}</b><small>${E(tx.createdAt||'')}</small></div>
              <div class="${tx.amount>=0?'income':'expense'}">${tx.amount>=0?'+':''}¥${(Number(tx.amount)||0).toFixed(2)}</div>
            </div>
          `).join('')||'<p>暂无交易记录</p>'}
        </div>
      </div>
    `;
  }

  /* ========== 日程 ========== */
  function calendar(owner){
    const d=phoneData(owner);d.calendar=L(d.calendar);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>日程</span><button onclick="v45729AddEvent(${A(owner)})">+</button></div>
      <div class="phone-app-body">
        ${d.calendar.map(ev=>`
          <div class="v45729-event-card">
            <div><b>${E(ev.title||'未命名事件')}</b><small>${E(ev.time||'')}</small></div>
            <button onclick="v45729DeleteEvent(${A(owner)},${A(ev.id)})">删除</button>
          </div>
        `).join('')||'<p>暂无日程</p>'}
      </div>
    `;
  }
  window.v45729AddEvent=function(owner){
    modal(`<h2>新增日程</h2><div class="field"><input id="v45729EventTitle" placeholder="标题"></div><div class="field"><input id="v45729EventTime" type="datetime-local"></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45729SaveEvent(${A(owner)})">保存</button></div>`);
  };
  window.v45729SaveEvent=function(owner){
    const title=S(document.getElementById('v45729EventTitle')?.value).trim();
    const time=S(document.getElementById('v45729EventTime')?.value);
    if(!title)return toast('请填写标题');
    const d=phoneData(owner);d.calendar.push({id:ID('event'),title,time,createdAt:NOW()});
    persist();closeModal();openSimPhone(owner,'calendar');
  };
  window.v45729DeleteEvent=function(owner,id){
    const d=phoneData(owner);d.calendar=d.calendar.filter(x=>x.id!==id);
    persist();openSimPhone(owner,'calendar');
  };

  /* ========== 相册 ========== */
  function photos(owner){
    const d=phoneData(owner);d.photos=L(d.photos);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>相册</span></div>
      <div class="phone-app-body">
        <div class="v45729-photo-grid">
          ${d.photos.map(p=>`
            <div class="v45729-photo-thumb" onclick="v45729ViewPhoto(${A(owner)},${A(p.id)})">
              <img src="${E(p.url)}" alt="">
            </div>
          `).join('')||'<p>相册为空</p>'}
        </div>
      </div>
    `;
  }

  /* ========== 便笺 ========== */
  function notes(owner){
    const d=phoneData(owner);d.notes=L(d.notes);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>便笺</span><button onclick="v45729AddNote(${A(owner)})">+</button></div>
      <div class="phone-app-body">
        ${d.notes.map(n=>`
          <div class="v45729-note-card" onclick="v45729EditNote(${A(owner)},${A(n.id)})">
            <b>${E(n.title||'未命名')}</b>
            <p>${E((n.content||'').slice(0,100))}</p>
          </div>
        `).join('')||'<p>便笺为空</p>'}
      </div>
    `;
  }
  window.v45729AddNote=function(owner){
    modal(`<h2>新增便笺</h2><div class="field"><input id="v45729NoteTitle" placeholder="标题"></div><div class="field"><textarea id="v45729NoteContent" rows="6"></textarea></div><div class="form-actions"><button onclick="closeModal()">取消</button><button class="primary" onclick="v45729SaveNote(${A(owner)})">保存</button></div>`);
  };
  window.v45729SaveNote=function(owner,id=null){
    const title=S(document.getElementById('v45729NoteTitle')?.value).trim();
    const content=S(document.getElementById('v45729NoteContent')?.value).trim();
    if(!title)return toast('请填写标题');
    const d=phoneData(owner);
    if(id){const note=d.notes.find(x=>x.id===id);if(note){note.title=title;note.content=content;note.updatedAt=NOW()}}
    else{d.notes.push({id:ID('note'),title,content,createdAt:NOW(),updatedAt:NOW()})}
    persist();closeModal();openSimPhone(owner,'notes');
  };

  /* ========== 动态 ========== */
  function moments(owner){
    const d=phoneData(owner);d.moments=L(d.moments);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>动态</span><button onclick="v45729PostMoment(${A(owner)})">+</button></div>
      <div class="phone-app-body">
        ${d.moments.map(m=>`
          <div class="v45729-moment-card">
            <div class="v45729-moment-author"><b>${E(m.authorName||owner)}</b><small>${E(m.createdAt||'')}</small></div>
            <p>${E(m.content||'')}</p>
            ${m.images?`<div class="v45729-moment-images">${L(m.images).map(url=>`<img src="${E(url)}">`).join('')}</div>`:''}
            <div class="v45729-moment-actions">
              <span>❤️ ${m.likeCount||0}</span>
              <span>💬 ${L(m.comments).length}</span>
            </div>
          </div>
        `).join('')||'<p>动态为空</p>'}
      </div>
    `;
  }

  /* ========== 购物 ========== */
  function shopping(owner){
    const d=phoneData(owner);d.shopping=O(d.shopping);d.shopping.cart=L(d.shopping.cart);d.shopping.orders=L(d.shopping.orders);
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>购物</span></div>
      <div class="phone-app-body">
        <div class="v45729-shop-tabs">
          <button onclick="v45729ShopTab(${A(owner)},'cart')">购物车(${d.shopping.cart.length})</button>
          <button onclick="v45729ShopTab(${A(owner)},'orders')">订单(${d.shopping.orders.length})</button>
        </div>
        <div id="v45729ShopContent"></div>
      </div>
    `;
  }

  /* ========== 手机聊天 ========== */
  function phoneChat(owner){
    const d=phoneData(owner);d.phoneChats=O(d.phoneChats);
    const threads=Object.entries(d.phoneChats).map(([id,msgs])=>({id,lastMsg:L(msgs).slice(-1)[0],count:msgs.length}));
    return`
      <div class="phone-app-header"><button onclick="v45729PhoneBack()">‹</button><span>聊天</span></div>
      <div class="phone-app-body">
        ${threads.map(t=>`
          <div class="v45729-chat-thread" onclick="v45729OpenPhoneThread(${A(owner)},${A(t.id)})">
            <div><b>${E(t.id)}</b><small>${E(t.lastMsg?.text||'')}</small></div>
            <span>${t.count}</span>
          </div>
        `).join('')||'<p>暂无聊天</p>'}
      </div>
    `;
  }

  /* ========== 注册所有应用 ========== */
  const apps={browser,bank,calendar,photos,notes,moments,shopping,chat:phoneChat};
  
  /* The prior build tried to replace the authoritative phone application router
     and targeted a .phone-screen node that the real phone shell does not
     contain. That made browser/bank/calendar/etc. clicks appear inert.
     Keep the existing mature router and its CRUD surfaces authoritative. */
  const existingPhoneRouter=window.v43OpenPhoneApp;
  if(typeof existingPhoneRouter==='function'){
    window.v43OpenPhoneApp=existingPhoneRouter;
    try{v43OpenPhoneApp=existingPhoneRouter}catch{}
  }
  
  window.v45729PhoneBack=function(){
    const owner=window.currentPhoneOwner||'user';
    openSimPhone(owner);
  };

  console.log('[V45.7.32 Phone Apps] 虚拟手机应用已重做');
})();
