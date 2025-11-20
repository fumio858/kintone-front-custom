(function () {
  'use strict';

  // ==================================
  // ★★★ 設定 ★★★
  // ==================================
  const CONFIG = {
    // リンクを掲載するアプリのID
    APP_ID: 59, // ※必要に応じてリンク集アプリのIDに変更してください

    // リンク一覧を表示するポータルのスペースID
    AREA_ID: 'portal-links-area',
    // ポータルが複数ある場合、特定のポータルにのみ表示するためのハッシュ (例: '#/portal/4')
    // 空文字 '' にすると、どのポータルでも表示しようとします。
    TARGET_PORTAL_HASH_PART: '/portal/4',

    // --- 表示フィールド ---
    FIELD_CATEGORY: 'category',
    FIELD_URL: 'url',
    FIELD_ICON: 'icon',
    FIELD_TITLE: 'title',
    FIELD_SORT_ORDER: 'sort_order',

    // --- デザイン ---
    CATEGORY_ORDER: ['マニュアル', '業務関連シート', '便利ツール', 'その他'],
    CATEGORY_COLOR: {
      "マニュアル": { icon: "#4c7eff" },
      "業務関連シート": { icon: "#3db652" },
      "便利ツール": { icon: "#e8b65d" },
      "その他": { icon: "#777" }
    },
    DEFAULT_ICON: 'description',
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

    loadLinks(area);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${CONFIG.AREA_ID} { margin-bottom: 40px; background-color: #e8e8e8;}
      .${CONFIG.AREA_ID}-container { padding: 10px; }
      .${CONFIG.AREA_ID}-category-title {
        font-size: 16px;
        font-weight: 600;
        padding: 1rem;
        margin-top: 1rem;
        color: #686868;
      }
      .${CONFIG.AREA_ID}-category-wrap {
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

  async function loadLinks(area) {
    if (CONFIG.APP_ID === 0 || !CONFIG.APP_ID) {
      area.innerHTML = `<div style="color: red; font-weight: bold; padding: 1rem;">【設定エラー】リンク集アプリのIDが設定されていません。</div>`;
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
        query: `order by ${CONFIG.FIELD_SORT_ORDER} asc`,
      });
    } catch (e) {
      console.error(e);
      area.innerHTML = `<div style="color: red; padding: 1rem;">リンクの読み込みに失敗しました。</div>`;
      return;
    }

    const records = resp.records;
    const groups = {};
    records.forEach(r => {
      const category = r[CONFIG.FIELD_CATEGORY].value;
      if (!groups[category]) groups[category] = [];
      groups[category].push(r);
    });

    area.innerHTML = "";
    const container = document.createElement("div");
    container.className = `${CONFIG.AREA_ID}-container`;

    const doneCategories = new Set();

    CONFIG.CATEGORY_ORDER.forEach(catName => {
      if (groups[catName]) {
        container.appendChild(createCategory(catName, groups[catName]));
        doneCategories.add(catName);
      }
    });

    Object.keys(groups)
      .filter(c => !doneCategories.has(c))
      .sort()
      .forEach(c => container.appendChild(createCategory(c, groups[c])));

    area.appendChild(container);
  }

  function createCategory(name, items) {
    const box = document.createElement("div");

    const title = document.createElement("div");
    title.className = `${CONFIG.AREA_ID}-category-title`;
    title.textContent = name;
    box.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = `${CONFIG.AREA_ID}-category-wrap`;

    items.forEach(r => wrap.appendChild(createLinkItem(r, name)));

    box.appendChild(wrap);
    return box;
  }

  function createLinkItem(rec, category) {
    const color = CONFIG.CATEGORY_COLOR[category] || { icon: "#333" };

    const wrapper = document.createElement("a");
    wrapper.className = `${CONFIG.AREA_ID}-item-wrapper`;
    wrapper.href = rec[CONFIG.FIELD_URL].value;
    wrapper.target = "_blank";

    const card = document.createElement("div");
    card.className = `${CONFIG.AREA_ID}-card`;

    const icon = document.createElement("span");
    icon.className = `material-symbols-outlined ${CONFIG.AREA_ID}-icon`;
    icon.style.color = color.icon;
    icon.textContent = (rec[CONFIG.FIELD_ICON] && rec[CONFIG.FIELD_ICON].value) || CONFIG.DEFAULT_ICON;

    const text = document.createElement("div");
    text.className = `${CONFIG.AREA_ID}-text`;
    const textInner = document.createElement("span");
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