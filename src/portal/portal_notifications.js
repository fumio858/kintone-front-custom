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
    CATEGORY_ORDER: ["事務員", "弁護士", "全体"]
  };

  const STYLE_ID = CONFIG.AREA_ID + "-styles";

  //==================================================
  // CSS 注入（NEW＋検索対応版）
  //==================================================
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${CONFIG.AREA_ID} { box-sizing: border-box; }

      .portal-layout {
        display: flex;
        background-color: #eee;
        padding: 0 1rem;
        height: calc(100vh - 140px);
        overflow: hidden;
      }

      .portal-left {
        width: 380px;
        padding: 1rem 0.8rem;
        background-color: #eee;
        overflow-y: auto;
        border-right: 1px solid #ddd;
      }

      .search-box {
        width: 100%;
        margin: 8px 0 15px 0;
      }

      .search-box input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 50px;
        border: 1px solid #ccc;
        font-size: 14px;
        box-sizing: border-box;
      }

      .portal-right {
        flex: 1;
        background: #fff;
        padding: 3rem;
        margin: 1rem;
        min-height: 500px;
        overflow-y: auto;
        border-radius: 22px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.06);
      }

      .tab-nav {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 14px;
      }
      .tab-btn {
        padding: 10px 18px;
        background: transparent;
        border-radius: 50px;
        border: none;
        cursor: pointer;
        color: #777;
        font-weight: 600;
        transition: .2s;
        font-size: 13px;
        line-height: 1;
      }
      .tab-btn.active {
        background: #4b4b4b;
        color: #FFF;
      }

      .notice-item {
        padding: .6rem .8rem;
        cursor: pointer;
        border-radius: 8px;
        transition: .15s;
      }
      .notice-item:hover {
        background: #e0e0e0;
      }
      .notice-item.active {
        background: #f7f9f9;
      }

      .notice-topline {
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1;
      }

      .notice-date {
        font-size: 11px;
        color: #777;
      }

      .badge-new {
        background: #d9534f;
        color: #fff;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
        line-height: 1;
      }

      .notice-title {
        font-size: 15px;
        font-weight: 600;
        margin: 4px 0 2px;
        line-height: 1.35;
      }

      .detail-title {
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .detail-date {
        font-size: 14px;
        color: #999;
        margin-bottom: 1.2rem;
      }
      .detail-title::after {
        content: "";
        display: block;
        width: 60px;
        height: 2px;
        background: #ccc;
        margin-top: 12px;
      }
      .detail-body {
        font-size: 16px;
        line-height: 1.7;
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
  // 初期ロード
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
  // お知らせ読み込み
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

    // 判定用：今日
    const today = new Date();

    // カテゴリごとに分類
    const groups = {};
    records.forEach(r => {
      const category =
        (r[CONFIG.FIELD_CATEGORY] && r[CONFIG.FIELD_CATEGORY].value) ||
        CONFIG.BLANK_CATEGORY_NAME;

      if (!groups[category]) groups[category] = [];
      groups[category].push(r);
    });

    // HTML構築
    area.innerHTML = "";
    const layout = document.createElement("div");
    layout.className = "portal-layout";

    const left = document.createElement("div");
    left.className = "portal-left";

    const tabNav = document.createElement("div");
    tabNav.className = "tab-nav";

    //=== 検索ボックス
    const searchBox = document.createElement("div");
    searchBox.className = "search-box";
    searchBox.innerHTML = `
      <input id="notice-search" type="text" placeholder="検索（このタブ内のみ）">
    `;

    const tabContent = document.createElement("div");

    let firstCategory = null;

    CONFIG.CATEGORY_ORDER.forEach(cat => {
      if (!groups[cat]) return;
      if (!firstCategory) firstCategory = cat;

      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.textContent = cat + "通知";
      btn.dataset.cat = cat;
      tabNav.appendChild(btn);

      const pane = document.createElement("div");
      pane.className = "tab-pane";
      pane.dataset.cat = cat;

      groups[cat].forEach(r => {
        pane.appendChild(createNoticeItem(r, today));
      });

      tabContent.appendChild(pane);
    });

    left.appendChild(tabNav);
    left.appendChild(searchBox);
    left.appendChild(tabContent);

    const right = document.createElement("div");
    right.className = "portal-right";
    right.id = "notice-detail";

    layout.append(left, right);
    area.appendChild(layout);

    activateTab(firstCategory);

    const firstRecord = records[0];
    if (firstRecord) showDetail(firstRecord);

    //=== タブ切替
    tabNav.addEventListener("click", e => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activateTab(btn.dataset.cat);

      // タブ切替後検索結果をリセット
      document.getElementById("notice-search").value = "";
      applySearchFilter("");
    });

    //=== 検索機能
    const searchInput = document.getElementById("notice-search");
    searchInput.addEventListener("input", e => {
      applySearchFilter(e.target.value.trim().toLowerCase());
    });
  }

  //==================================================
  // 一覧アイテム生成（＋NEW判定）
  //==================================================
  function createNoticeItem(rec, today) {
    const div = document.createElement("div");
    div.className = "notice-item";

    const dateObj = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
    const diffDays = (today - dateObj) / 1000 / 60 / 60 / 24;
    const isNew = diffDays <= 7;

    const dateStr =
      `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    const contentHTML = rec[CONFIG.FIELD_CONTENT].value || "";
    const excerpt = contentHTML.replace(/<[^>]+>/g, "").slice(0, 80);

    div.dataset.search = `${rec[CONFIG.FIELD_TITLE].value} ${dateStr} ${excerpt}`.toLowerCase();

    div.innerHTML = `
      <div class="notice-topline">
        <div class="notice-date">${dateStr}</div>
        ${isNew ? `<span class="badge-new">NEW</span>` : ""}
      </div>
      <div class="notice-title">${rec[CONFIG.FIELD_TITLE].value}</div>
    `;

    div.addEventListener("click", () => {
      document.querySelectorAll(".notice-item").forEach(i => i.classList.remove("active"));
      div.classList.add("active");
      showDetail(rec);
    });

    return div;
  }

  //==================================================
  // 詳細表示
  //==================================================
  function showDetail(rec) {
    const el = document.getElementById("notice-detail");
    if (!el) return;

    const dateObj = new Date(rec[CONFIG.FIELD_POSTING_DATE].value);
    const dateStr =
      `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    el.innerHTML = `
      <div class="detail-title">${rec[CONFIG.FIELD_TITLE].value}</div>
      <div class="detail-date">${dateStr}</div>
      <div class="detail-body">${rec[CONFIG.FIELD_CONTENT].value}</div>
    `;
  }

  //==================================================
  // タブ切替
  //==================================================
  function activateTab(cat) {
    document
      .querySelectorAll(".tab-btn")
      .forEach(b => b.classList.toggle("active", b.dataset.cat === cat));

    document
      .querySelectorAll(".tab-pane")
      .forEach(p => {
        p.style.display = p.dataset.cat === cat ? "block" : "none";
      });
  }

  //==================================================
  // 検索フィルタ（選択中のタブだけ対象）
  //==================================================
  function applySearchFilter(query) {
    const activePane = document.querySelector('.tab-pane[style*="block"]');
    if (!activePane) return;

    const items = activePane.querySelectorAll(".notice-item");

    items.forEach(item => {
      const text = item.dataset.search || "";
      item.style.display = text.includes(query) ? "block" : "none";
    });
  }

  //==================================================
  // ハッシュ監視
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
