(function () {
  'use strict';

  // ==================================
  // ★★★ 設定 ★★★
  // ==================================
  const CONFIG = {
    // お知らせを掲載するアプリのID
    APP_ID: 61, // ※※※ お知らせアプリのIDに変更してください ※※※

    // 表示を切り替えるフィールド（"公開する" のような値を持つドロップダウンやチェックボックスを想定）
    SHOW_FLAG_FIELD: 'is_show',
    SHOW_FLAG_VALUE: '公開する', // 公開するための値
    // 公開する際のソート順
    QUERY_ORDER: 'order by $id desc',

    // お知らせを公開するポータルのスペースID
    AREA_ID: 'portal-notifications-area',
    // ポータルが複数ある場合、特定のポータルにのみ公開するためのハッシュ (例: '#/portal/4')
    // 空文字 '' にすると、どのポータルでも表示しようとします。
    TARGET_PORTAL_HASH_PART: '/portal/5',

    // --- 表示フィールド ---
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
      .${CONFIG.AREA_ID}-title-header {
        font-size: 18px;
        font-weight: 600;
        padding: 1rem;
        color: #686868;
        border-bottom: 2px solid #ff9800;
        margin: 0 1rem 1rem 1rem;
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
        query: `${CONFIG.SHOW_FLAG_FIELD} in ("${CONFIG.SHOW_FLAG_VALUE}") ${CONFIG.QUERY_ORDER}`,
      });
    } catch (e) {
      console.error(e);
      area.innerHTML = `<div style="color: red; padding: 1rem;">お知らせの読み込みに失敗しました。</div>`;
      return;
    }

    area.innerHTML = '';
    const container = document.createElement('div');
    container.className = `${CONFIG.AREA_ID}-container`;

    const title = document.createElement('div');
    title.className = `${CONFIG.AREA_ID}-title-header`;
    title.textContent = 'お知らせ';
    container.appendChild(title);

    const wrap = document.createElement('div');
    wrap.className = `${CONFIG.AREA_ID}-wrap`;

    resp.records.forEach(r => wrap.appendChild(createNotificationItem(r)));
    
    container.appendChild(wrap);
    area.appendChild(container);
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
