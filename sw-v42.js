const CACHE_NAME = 'pokeji-v43.6';
const APP_ENTRY = '/index.html';
const BACKGROUND_DB = 'pokeji-background-v42';
const BACKGROUND_STORE = 'results';
const backgroundControllers = new Map();
const cancelledTasks = new Set();
const APP_SHELL = [
  '/',
  APP_ENTRY,
  '/assets/app.css?v=43.6',
  '/assets/app.js?v=43.6',
  '/manifest.webmanifest?v=42',
  '/assets/icon-192.png?v=42',
  '/assets/icon-512.png?v=42',
  '/assets/icons/apps/chat-a-heart.webp',
  '/assets/icons/apps/character-k-spade.webp',
  '/assets/icons/apps/group-q-club.webp',
  '/assets/icons/apps/moments-diamond.webp'
];

function openBackgroundDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKGROUND_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BACKGROUND_STORE)) db.createObjectStore(BACKGROUND_STORE, {keyPath: 'taskId'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('无法打开后台结果存储'));
  });
}

async function backgroundStore(mode, operation) {
  const db = await openBackgroundDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(BACKGROUND_STORE, mode);
      const store = tx.objectStore(BACKGROUND_STORE);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || tx.error || new Error('后台结果存储失败'));
    });
  } finally { db.close(); }
}

const putBackgroundResult = result => backgroundStore('readwrite', store => store.put(result));
const getBackgroundResults = () => backgroundStore('readonly', store => store.getAll());
const deleteBackgroundResult = taskId => backgroundStore('readwrite', store => store.delete(taskId));

function cleanBackgroundMeta(meta = {}) {
  return {
    operation: String(meta.operation || ''),
    chatId: String(meta.chatId || ''),
    speakerId: String(meta.speakerId || ''),
    groupId: String(meta.groupId || ''),
    mode: String(meta.mode || ''),
    sceneMode: String(meta.sceneMode || 'direct'),
    notificationName: String(meta.notificationName || '').slice(0, 120),
    showNotification: meta.showNotification === true,
    startedAt: String(meta.startedAt || ''),
    kind: String(meta.kind || ''),
    provider: String(meta.provider || 'openai')
  };
}

async function showTaskNotification(taskId, meta, state) {
  if (!meta.showNotification || !self.registration?.showNotification || cancelledTasks.has(taskId)) return;
  const name = meta.notificationName || 'AI';
  const details = state === 'working'
    ? {title: '扑克机正在生成', body: `${name}的回复正在生成；切到后台后仍会继续尝试。`}
    : state === 'completed'
      ? {title: `${name}已完成`, body: meta.operation === 'proactive' ? '收到一条主动来信，打开扑克机查看。' : '回复已生成，打开扑克机查看。'}
      : {title: `${name}生成未完成`, body: '打开扑克机可查看原因或重新生成。'};
  try {
    await self.registration.showNotification(details.title, {
      body: details.body,
      tag: `pokeji-generation-${taskId}`,
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      silent: true,
      renotify: true,
      requireInteraction: state === 'working',
      data: {url: APP_ENTRY, chatId: meta.chatId, mode: meta.mode, sceneMode: meta.sceneMode, taskId}
    });
  } catch {}
}

async function runBackgroundFetch(payload, port) {
  const taskId = String(payload?.taskId || '');
  const request = payload?.request || {};
  if (!taskId || !/^https?:\/\//i.test(String(request.url || ''))) {
    port?.postMessage({type: 'POKEJI_BACKGROUND_RESULT', taskId, result: {taskId, ok: false, error: '后台请求参数无效'}});
    return;
  }
  if (cancelledTasks.has(taskId)) {
    cancelledTasks.delete(taskId);
    return;
  }
  const controller = new AbortController();
  backgroundControllers.set(taskId, controller);
  const timeoutMs = Math.min(180000, Math.max(10000, Number(payload.timeoutMs) || 60000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const meta = cleanBackgroundMeta(payload.meta);
  let result;
  await showTaskNotification(taskId, meta, 'working');
  try {
    const response = await fetch(String(request.url), {
      method: 'POST',
      headers: request.headers || {},
      body: String(request.body || ''),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal
    });
    const text = await response.text();
    result = {
      taskId,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text,
      error: response.ok ? '' : `HTTP ${response.status} ${response.statusText}\n${text.slice(0, 4000)}`,
      meta,
      completedAt: new Date().toISOString()
    };
  } catch (error) {
    result = {
      taskId,
      ok: false,
      status: 0,
      statusText: '',
      text: '',
      error: error?.name === 'AbortError' ? '后台请求超时或已取消' : String(error?.message || error),
      meta,
      completedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timer);
    backgroundControllers.delete(taskId);
  }
  if (cancelledTasks.has(taskId)) {
    cancelledTasks.delete(taskId);
    try { await deleteBackgroundResult(taskId); } catch {}
    return;
  }
  try { await putBackgroundResult(result); } catch {}
  if (cancelledTasks.has(taskId)) {
    cancelledTasks.delete(taskId);
    try { await deleteBackgroundResult(taskId); } catch {}
    return;
  }
  await showTaskNotification(taskId, meta, result.ok ? 'completed' : 'failed');
  try { port?.postMessage({type: 'POKEJI_BACKGROUND_RESULT', taskId, result}); } catch {}
}

async function cacheOne(cache, url) {
  try {
    const response = await fetch(new Request(url, {cache: 'reload'}));
    if (!response.ok) return {url, ok: false, status: response.status};
    await cache.put(url, response.clone());
    return {url, ok: true};
  } catch (error) {
    return {url, ok: false, error: String(error)};
  }
}

async function warmAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.all(APP_SHELL.map(url => cacheOne(cache, url)));
  const failed = results.filter(result => !result.ok).map(result => result.url);
  const windows = await self.clients.matchAll({type: 'window'});
  windows.forEach(client => client.postMessage({type: 'PRECACHE_COMPLETE', failed}));
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('pokeji-v') && key !== CACHE_NAME).map(key => caches.delete(key)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const preload = event.request.mode === 'navigate' ? await event.preloadResponse : null;
      const response = preload || await fetch(event.request);
      if (response.ok) {
        try { await cache.put(event.request, response.clone()); } catch {}
      }
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await cache.match(APP_ENTRY)) || (await cache.match('/')) || new Response('扑克机暂时离线', {
          status: 503,
          headers: {'Content-Type': 'text/plain; charset=utf-8'}
        });
      }
      return Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type === 'SKIP_WAITING') self.skipWaiting();
  if (message.type === 'PRECACHE_APP') event.waitUntil(warmAppShell());
  if (message.type === 'POKEJI_BACKGROUND_FETCH') event.waitUntil(runBackgroundFetch(message, event.ports?.[0]));
  if (message.type === 'POKEJI_CANCEL_BACKGROUND_FETCH') {
    const taskId = String(message.taskId || '');
    if (taskId) cancelledTasks.add(taskId);
    backgroundControllers.get(taskId)?.abort();
    event.waitUntil(Promise.all([
      deleteBackgroundResult(taskId).catch(() => {}),
      self.registration.getNotifications({tag: `pokeji-generation-${taskId}`}).then(items => items.forEach(item => item.close())).catch(() => {})
    ]));
  }
  if (message.type === 'POKEJI_ACK_BACKGROUND_RESULT') event.waitUntil(deleteBackgroundResult(String(message.taskId || '')).catch(() => {}));
  if (message.type === 'POKEJI_CLAIM_BACKGROUND_RESULTS') event.waitUntil((async () => {
    let results = [];
    try { results = await getBackgroundResults(); } catch {}
    try { event.ports?.[0]?.postMessage({type: 'POKEJI_BACKGROUND_RESULTS', results}); } catch {}
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || APP_ENTRY, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      try { await existing.focus(); } catch {}
      try { existing.postMessage({type: 'POKEJI_NOTIFICATION_OPEN', chatId: String(event.notification.data?.chatId || ''), mode: String(event.notification.data?.mode || 'online'), sceneMode: String(event.notification.data?.sceneMode || 'direct')}); } catch {}
      return;
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
