(function () {
  "use strict";

  const CONFIG = {
    APP_ID: 61,
    HIDE_FLAG_FIELD: "is_hidden",
    HIDE_FLAG_VALUE: "非公開にする",
    QUERY_ORDER: "order by posting_date desc",
    AREA_ID: "portal-notifications-area",
    TARGET_PORTAL_HASH_PART: "/portal/5",
    FIELD_CATEGORY: "category",
    FIELD_TITLE: "title",
    FIELD_CONTENT: "content",
    FIELD_POSTING_DATE: "posting_date",
    BLANK_CATEGORY_NAME: "未分類",
    CATEGORY_ORDER: ["事務員通知", "弁護士通知", "全体通知"]
  };

  const STYLE_ID = CONFIG.AREA_ID + "-styles";

  //==================================================
  //  初期ロード
  //==================================================
  function onPortalLoaded() {
    if (
      CONFIG.TARGET_PORTAL_HASH_PART &&
      !location.hash.includes(CONFIG.TARGET_PORTAL_HASH_PART)
    ) {
      const oldArea = document.getElementById(CONFIG.AREA_ID);
      if (oldArea) oldArea.remove();
      return;
    }

    const root = document.getElementById("cns-root");
    if (!root) return setTimeout(onPortalLoaded, 300);

    let area = document.getElementById(CONFIG.AREA_ID);
    if (!area) {
      area = document.createElement("div");
      area.id = CONFIG.AREA_ID;
      root.prepend(area);
    }

    loadNotifications(area);
  }

  //==================================================
  //  CSS 注入
  //==================================================
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${CONFIG.AREA_ID} {
        box-sizing: border-box;
      }

      /* 2カラムレイアウト */
      .portal-layout {
        display: flex;
      }
      .portal-left {
        width: 400px;
        padding:1rem;
        background-color: #eee;
      }
      .portal-right {
        width: 75%;
        background: #fff;
        padding: 3rem;
        min-height: 500px;
      }

      /* Tabs */
      .tab-nav {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 20px;
      }
      .tab-btn {
        padding: 8px 16px;
        background: transparent;
        border-radius: 50px;
        border: none;
        cursor: pointer;
        color: #555;
        font-weight: 500;
        transition: .2s;
        font-size: 14px;
        line-height: 1;
        width:28%;
      }
      .tab-btn.active {
        background: #dcdcdc;
        border-color: #4b4b4b;
      }

      /* 一覧カード */
      .notice-item {
        background: #fff;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,0.1);
        padding: 14px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: .15s;
      }
      .notice-item:hover {
        background: #f0f0f0;
      }

      .notice-date {
        font-size: 11px;
        color: #777;
      }
      .notice-title {
        font-size: 16px;
        font-weight: bold;
        margin: 6px 0;
      }
      .notice-excerpt {
        font-size: 13px;
        color: #555;
        line-height: 1.45;
      }
      /* 詳細側 */
      .detail-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .detail-date {
        font-size: 14px;
        color: #999;
        margin-bottom: 20px;
      }
      .detail-body {
        font-size: 15px;
        line-height: 1.65;
        color: #444;
      }
      .detail-body img {
        max-width: 100%;
        height: auto;
      }
    `;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  //==================================================
  //  お知らせ読み込み
  //==================================================
  async function loadNotifications(area) {
    injectStyles();

    let resp;
    try {
      resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
        app: CONFIG.APP_ID,
        query: `${CONFIG.HIDE_FLAG_FIELD} not in ("${CONFIG.HIDE_FLAG_VALUE}") ${CONFIG.QUERY_ORDER}`
      });
    } catch (e) {
      console.error(e);
      area.innerHTML = "<div style='color:red'>お知らせ読み込み失敗</div>";
      return;
    }

    const records = resp.records;

    // カテゴリごとに分類
    const groups = {};
    records.forEach(r => {
      const category =
        (r[CONFIG.FIELD_CATEGORY] && r[CONFIG.FIELD_CATEGORY].value) ||
        CONFIG.BLANK_CATEGORY_NAME;
      if (!groups[category]) groups[category] = [];
      groups[category].push(r);
    });

    // HTML本体構築
    area.innerHTML = "";
    const layout = document.createElement("div");
    layout.className = "portal-layout";

    //===============================
    // 左：一覧
    //===============================
    const left = document.createElement("div");
    left.className = "portal-left";

    /** Tabs */
    const tabNav = document.createElement("div");
    tabNav.className = "tab-nav";

    /** Content area for each tab */
    const tabContent = document.createElement("div");

    let firstCategory = null;

    CONFIG.CATEGORY_ORDER.forEach(cat => {
      if (!groups[cat]) return;

      if (!firstCategory) firstCategory = cat;

      // tab button
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.textContent = cat;
      btn.dataset.cat = cat;
      tabNav.appendChild(btn);

      // tab pane
      const pane = document.createElement("div");
      pane.className = "tab-pane";
      pane.dataset.cat = cat;

      groups[cat].forEach(r => {
        pane.appendChild(createNoticeItem(r));
      });

      tabContent.appendChild(pane);
    });

    left.appendChild(tabNav);
    left.appendChild(tabContent);

    //===============================
    // 右：詳細
    //===============================
    const right = document.createElement("div");
    right.className = "portal-right";
    right.id = "notice-detail";

    layout.append(left, right);
    area.appendChild(layout);

    // 最初のカテゴリをアクティブ
    activateTab(firstCategory);

    // 初回表示：最新のお知らせを詳細に表示
    const firstRecord = records[0];
    if (firstRecord) showDetail(firstRecord);

    // クリックイベント設定
    tabNav.addEventListener("click", e => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activateTab(btn.dataset.cat);
    });
  }

  //==================================================
  //  一覧アイテムを生成
  //==================================================
  function createNoticeItem(rec) {
    const div = document.createElement("div");
    div.className = "notice-item";

    const date = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
    const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;

    const contentHTML = rec[CONFIG.FIELD_CONTENT].value || "";
    const text = contentHTML.replace(/<[^>]+>/g, "");
    const excerpt = text.length > 70 ? text.slice(0, 70) + "…" : text;

    div.innerHTML = `
      <div class="notice-date">${dateStr}</div>
      <div class="notice-title">${rec[CONFIG.FIELD_TITLE].value}</div>
      <div class="notice-excerpt">${excerpt}</div>
    `;

    div.addEventListener("click", () => showDetail(rec));

    return div;
  }

  //==================================================
  //  詳細表示
  //==================================================
  function showDetail(rec) {
    const el = document.getElementById("notice-detail");
    if (!el) return;

    const date = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
    const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;

    el.innerHTML = `
      <div class="detail-title">${rec[CONFIG.FIELD_TITLE].value}</div>
      <div class="detail-date">${dateStr}</div>
      <div class="detail-body">${rec[CONFIG.FIELD_CONTENT].value}</div>
    `;
  }

  //==================================================
  //  タブ切り替え
  //==================================================
  function activateTab(cat) {
    document
      .querySelectorAll(".tab-btn")
      .forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
    document
      .querySelectorAll(".tab-pane")
      .forEach(p => (p.style.display = p.dataset.cat === cat ? "block" : "none"));
  }

  //==================================================
  //  URLハッシュ監視（Portal切替対応）
  //==================================================
  let lastHash = "";
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      onPortalLoaded();
    }
  }, 300);

  onPortalLoaded();
})();
