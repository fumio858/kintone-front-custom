(function () {
  'use strict';

  // ==================================
  // ★★★ 設定 ★★★
  // ==================================
  const CONFIG = {
    // お知らせを掲載するアプリのID
    APP_ID: 61, // ※※※ お知らせアプリのIDに変更してください ※※※

    // --- 絞り込み条件 ---
    // 「非公開」を設定するフィールド（チェックボックスなどを想定）
    HIDE_FLAG_FIELD: 'is_hidden',
    // 「非公開」にするための値
    HIDE_FLAG_VALUE: '非公開にする',

    // --- 並び順 ---
    // posting_dateフィールドで降順（新しいものが上）
    QUERY_ORDER: 'order by posting_date desc',

    // --- 表示場所 ---
    AREA_ID: 'portal-notifications-area',
    TARGET_PORTAL_HASH_PART: '/portal/5',

    // --- 表示フィールド ---
    FIELD_CATEGORY: 'category', // カテゴリ
    FIELD_TITLE: 'title', // タイトル
    FIELD_CONTENT: 'content', // リッチエディターフィールド
    FIELD_POSTING_DATE: 'posting_date', // 日時フィールド
  };
  // ==================================
  // --- 設定ここまで ---
  // ==================================

  const STYLE_ID = `${CONFIG.AREA_ID}-styles`;

  function onPortalLoaded() {
    // 指定のポータル以外では表示しない
    if (CONFIG.TARGET_PORTAL_HASH_PART && !location.hash.includes(CONFIG.TARGET_PORTAL_HASH_PART)) {
      const oldArea = document.getElementById(CONFIG.AREA_ID);
      if (oldArea) oldArea.remove();
      return;
    }
    
    const root = document.getElementById('cns-root');
    if (!root) return setTimeout(onPortalLoaded, 300);

    let area = document.getElementById(CONFIG.AREA_ID);
    if (!area) {
      area = document.createElement('div');
      area.id = CONFIG.AREA_ID;
      root.prepend(area);
    }

    loadNotifications(area);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${CONFIG.AREA_ID} { margin-bottom: 40px; }
      .${CONFIG.AREA_ID}-container { padding: 10px; }
      .${CONFIG.AREA_ID}-category-title {
        font-size: 18px;
        font-weight: 600;
        padding: 1rem;
        color: #686868;
        border-bottom: 2px solid #ff9800;
        margin: 1rem 1rem 1rem 1rem;
      }
      .${CONFIG.AREA_ID}-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 0 1rem;
        margin-bottom: 1rem;
      }
      .${CONFIG.AREA_ID}-item-wrapper {
        width: 100%;
        max-width: 400px;
        text-decoration: none;
      }
      .${CONFIG.AREA_ID}-card {
        width: 100%;
        min-height: 100px;
        border-radius: 8px;
        background: #fff;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 1rem;
        transition: all 0.2s ease-in-out;
        box-sizing: border-box;
        gap: 5px;
      }
      .${CONFIG.AREA_ID}-item-wrapper:hover .${CONFIG.AREA_ID}-card {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .${CONFIG.AREA_ID}-posting-date {
        font-size: 11px;
        color: #777;
        margin-bottom: 5px;
      }
      .${CONFIG.AREA_ID}-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        text-align: left;
        line-height: 1.4;
        margin-bottom: 5px;
      }
      .${CONFIG.AREA_ID}-content {
        font-size: 13px;
        color: #555;
        line-height: 1.5;
        overflow-wrap: break-word;
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  async function loadNotifications(area) {
    if (CONFIG.APP_ID === 0) {
      area.innerHTML = `<div style="color: red; font-weight: bold; padding: 1rem;">【設定エラー】お知らせアプリのIDが設定されていません。</div>`;
      return;
    }

    injectStyles();

    let resp;
    try {
      resp = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: CONFIG.APP_ID,
        query: `${CONFIG.HIDE_FLAG_FIELD} not in ("${CONFIG.HIDE_FLAG_VALUE}") ${CONFIG.QUERY_ORDER}`,
      });
    } catch (e) {
      console.error(e);
      area.innerHTML = `<div style="color: red; padding: 1rem;">お知らせの読み込みに失敗しました。</div>`;
      return;
    }

    const records = resp.records;
    const groups = {};
    records.forEach(r => {
      const category = r[CONFIG.FIELD_CATEGORY].value || 'その他'; // カテゴリが空の場合は「その他」に
      if (!groups[category]) groups[category] = [];
      groups[category].push(r);
    });

    area.innerHTML = "";
    const container = document.createElement("div");
    container.className = `${CONFIG.AREA_ID}-container`;

    // カテゴリの表示順を投稿日時の新しい順に動的に決定
    const categoryOrder = Object.keys(groups).sort((a, b) => {
      const latestA = new Date(groups[a][0][CONFIG.FIELD_POSTING_DATE].value).getTime();
      const latestB = new Date(groups[b][0][CONFIG.FIELD_POSTING_DATE].value).getTime();
      return latestB - latestA;
    });

    categoryOrder.forEach(catName => {
      if (groups[catName]) {
        container.appendChild(createCategory(catName, groups[catName]));
      }
    });

    area.appendChild(container);
  }

  function createCategory(name, items) {
    const box = document.createElement("div");

    const title = document.createElement("div");
    title.className = `${CONFIG.AREA_ID}-category-title`;
    title.textContent = name;
    box.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = `${CONFIG.AREA_ID}-wrap`;

    items.forEach(r => wrap.appendChild(createNotificationItem(r)));

    box.appendChild(wrap);
    return box;
  }

  function createNotificationItem(rec) {
    const wrapper = document.createElement('a');
    wrapper.className = `${CONFIG.AREA_ID}-item-wrapper`;
    wrapper.href = `/k/${CONFIG.APP_ID}/show?record=${rec.$id.value}`;
    wrapper.target = '_self';

    const card = document.createElement('div');
    card.className = `${CONFIG.AREA_ID}-card`;

    // 投稿日時
    const postingDateDiv = document.createElement('div');
    postingDateDiv.className = `${CONFIG.AREA_ID}-posting-date`;
    if (rec[CONFIG.FIELD_POSTING_DATE] && rec[CONFIG.FIELD_POSTING_DATE].value) {
      const date = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
      postingDateDiv.textContent = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }

    // タイトル
    const titleDiv = document.createElement('div');
    titleDiv.className = `${CONFIG.AREA_ID}-title`;
    titleDiv.textContent = rec[CONFIG.FIELD_TITLE].value;

    // コンテンツ (リッチエディター)
    const contentDiv = document.createElement('div');
    contentDiv.className = `${CONFIG.AREA_ID}-content`;
    if (rec[CONFIG.FIELD_CONTENT] && rec[CONFIG.FIELD_CONTENT].value) {
      contentDiv.innerHTML = rec[CONFIG.FIELD_CONTENT].value;
    }

    card.append(postingDateDiv, titleDiv, contentDiv);
    wrapper.append(card);

    return wrapper;
  }

  let lastHash = '';
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      onPortalLoaded();
    }
  }, 300);
  
  // 初期ロード
  onPortalLoaded();
})();