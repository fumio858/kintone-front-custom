(function () {
  'use strict';

  // ==================================
  // ★★★ 設定 ★★★
  // ==================================
  const CONFIG = {
    // お知らせを掲載するアプリのID
    APP_ID: 61, // ※※※ お知らせアプリのIDに変更してください ※※※

    // 表示を切り替えるフィールド（"表示する" のような値を持つドロップダウンやチェックボックスを想定）
    SHOW_FLAG_FIELD: 'is_show',
    // 表示する際のソート順
    QUERY_ORDER: 'order by $id desc',

    // お知らせを表示するポータルのスペースID
    AREA_ID: 'portal-notifications-area',
    // ポータルが複数ある場合、特定のポータルにのみ表示するためのハッシュ (例: '#/portal/4')
    // 空文字 '' にすると、どのポータルでも表示しようとします。
    TARGET_PORTAL_HASH_PART: '/portal/5',

    // --- 表示フィールド ---
    FIELD_TITLE: 'title', // タイトル
    FIELD_ICON: 'icon',   // Material Icon の名前が入るフィールド
    
    // --- デザイン ---
    DEFAULT_ICON: 'campaign', // アイコンフィールドが空の場合のデフォルトアイコン
    ICON_COLOR: '#ff9800',
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
      .${CONFIG.AREA_ID}-title {
        font-size: 18px;
        font-weight: 600;
        padding: 1rem;
        color: #686868;
        border-bottom: 2px solid ${CONFIG.ICON_COLOR};
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
        width: 180px;
        text-decoration: none;
      }
      .${CONFIG.AREA_ID}-card {
        width: 100%;
        height: 140px;
        border-radius: 22px;
        background: #fff;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        padding: 1rem;
        transition: all 0.2s ease-in-out;
        box-sizing: border-box;
      }
      .${CONFIG.AREA_ID}-item-wrapper:hover .${CONFIG.AREA_ID}-card {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      }
      .${CONFIG.AREA_ID}-icon {
        font-size: 42px!important;
        margin-bottom: 8px;
        color: ${CONFIG.ICON_COLOR};
      }
      .${CONFIG.AREA_ID}-text {
        height: calc(13px * 1.5 * 2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .${CONFIG.AREA_ID}-text-inner {
        font-size: 14.5px;
        font-weight: 500;
        color: #444;
        text-align: center;
        line-height: 1.4;
        overflow-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
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

    if (!document.getElementById('mat-icon-font')) {
      const link = document.createElement('link');
      link.id = 'mat-icon-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    let resp;
    try {
      resp = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: CONFIG.APP_ID,
        query: `${CONFIG.SHOW_FLAG_FIELD} = "表示する" ${CONFIG.QUERY_ORDER}`,
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
    title.className = `${CONFIG.AREA_ID}-title`;
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

    const icon = document.createElement('span');
    icon.className = `material-symbols-outlined ${CONFIG.AREA_ID}-icon`;
    icon.textContent = (rec[CONFIG.FIELD_ICON] && rec[CONFIG.FIELD_ICON].value) || CONFIG.DEFAULT_ICON;

    const text = document.createElement('div');
    text.className = `${CONFIG.AREA_ID}-text`;
    const textInner = document.createElement('span');
    textInner.className = `${CONFIG.AREA_ID}-text-inner`;
    textInner.textContent = rec[CONFIG.FIELD_TITLE].value;
    text.appendChild(textInner);

    card.append(icon, text);
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
