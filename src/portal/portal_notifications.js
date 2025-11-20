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
    BLANK_CATEGORY_NAME: '未分類', // カテゴリが空のときの表示名

    // --- カテゴリ表示順とフィルタリング ---
    // 表示したいカテゴリをこの配列で指定します。指定したカテゴリのみが表示され、この配列の順序で並びます。
    // ここにないカテゴリは表示されません。
    CATEGORY_ORDER: ['案件', '労務', '未分類'],
  };
  // ==================================
  // --- 設定ここまで ---
  // ==================================

  const STYLE_ID = `${CONFIG.AREA_ID}-styles`;

  function onPortalLoaded() {
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
      
      /* Tab Navigation */
      .${CONFIG.AREA_ID}-tab-nav {
        display: flex;
        margin: 0 1rem 1rem 1rem;
        justify-content: center; /* Center the tabs */
        gap: 10px; /* Add gap between buttons */
      }
      .${CONFIG.AREA_ID}-tab-button {
        padding: 8px 16px; /* Adjust padding for button look */
        cursor: pointer;
        border: none; /* Add border */
        border-radius: 50px; /* Add border-radius */
        background-color: transparent;
        font-size: 18px;
        font-weight: 700;
        color: #777;
        transition: all 0.2s ease;
        min-width: 140px; /* Ensure minimum width for buttons */
        text-align: center;
      }
      .${CONFIG.AREA_ID}-tab-button.active {
        font-weight: 700;
        background-color: #f0f0f0; /* Active background color */
      }

      /* Tab Content */
      .${CONFIG.AREA_ID}-tab-pane {
        display: none;
      }
      .${CONFIG.AREA_ID}-tab-pane.active {
        display: block;
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
        max-width: 500px;
        text-decoration: none;
      }
      .${CONFIG.AREA_ID}-card {
        width: 100%;
        min-height: 100px;
        border-radius: 16px;
        background: #fff;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 1.5rem;
        transition: all 0.2s ease-in-out;
        box-sizing: border-box;
        gap: 5px;
      }
      .${CONFIG.AREA_ID}-item-wrapper:hover .${CONFIG.AREA_ID}-card {
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
        width: 100%;
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  async function loadNotifications(area) {
    if (CONFIG.APP_ID === 0) {
      area.innerHTML = '<div style="color: red; font-weight: bold; padding: 1rem;">【設定エラー】お知らせアプリのIDが設定されていません。</div>';
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
      area.innerHTML = '<div style="color: red; padding: 1rem;">お知らせの読み込みに失敗しました。</div>';
      return;
    }

    const records = resp.records;
    const groups = {};
    records.forEach(r => {
      const category = (r[CONFIG.FIELD_CATEGORY] && r[CONFIG.FIELD_CATEGORY].value) || CONFIG.BLANK_CATEGORY_NAME;
      if (!groups[category]) groups[category] = [];
      groups[category].push(r);
    });

    area.innerHTML = "";
    const container = document.createElement("div");
    container.className = `${CONFIG.AREA_ID}-container`;

    const tabNav = document.createElement('div');
    tabNav.className = `${CONFIG.AREA_ID}-tab-nav`;

    const tabContent = document.createElement('div');
    tabContent.className = `${CONFIG.AREA_ID}-tab-content`;

    let firstActiveSet = false; // Flag to set the first active tab

    CONFIG.CATEGORY_ORDER.forEach(catName => {
      if (groups[catName]) { // Only create tab if there are notifications for this category
        // Create Tab Button
        const tabButton = document.createElement('button');
        tabButton.className = `${CONFIG.AREA_ID}-tab-button`;
        tabButton.textContent = catName;
        tabButton.dataset.category = catName;
        tabNav.appendChild(tabButton);

        // Create Tab Pane
        const tabPane = document.createElement('div');
        tabPane.className = `${CONFIG.AREA_ID}-tab-pane`;
        tabPane.dataset.category = catName;
        
        const wrap = document.createElement("div");
        wrap.className = `${CONFIG.AREA_ID}-wrap`;
        groups[catName].forEach(r => wrap.appendChild(createNotificationItem(r)));
        tabPane.appendChild(wrap);
        tabContent.appendChild(tabPane);

        // Set the first valid tab as active
        if (!firstActiveSet) {
          tabButton.classList.add('active');
          tabPane.classList.add('active');
          firstActiveSet = true;
        }
      }
    });

    container.append(tabNav, tabContent);
    area.appendChild(container);

    // Add Tab Click Logic
    tabNav.addEventListener('click', (e) => {
      const targetButton = e.target.closest(`.${CONFIG.AREA_ID}-tab-button`);
      if (!targetButton) return;

      const category = targetButton.dataset.category;

      // Update buttons
      tabNav.querySelectorAll(`.${CONFIG.AREA_ID}-tab-button`).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
      });

      // Update panes
      tabContent.querySelectorAll(`.${CONFIG.AREA_ID}-tab-pane`).forEach(pane => {
        pane.classList.toggle('active', pane.dataset.category === category);
      });
    });
  }

  function createNotificationItem(rec) {
    const wrapper = document.createElement('div');
    wrapper.className = `${CONFIG.AREA_ID}-item-wrapper`;

    const card = document.createElement('div');
    card.className = `${CONFIG.AREA_ID}-card`;

    const postingDateDiv = document.createElement('div');
    postingDateDiv.className = `${CONFIG.AREA_ID}-posting-date`;
    if (rec[CONFIG.FIELD_POSTING_DATE] && rec[CONFIG.FIELD_POSTING_DATE].value) {
      const date = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
      postingDateDiv.textContent = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }

    const titleDiv = document.createElement('div');
    titleDiv.className = `${CONFIG.AREA_ID}-title`;
    titleDiv.textContent = rec[CONFIG.FIELD_TITLE].value;

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
  
  onPortalLoaded();
})();