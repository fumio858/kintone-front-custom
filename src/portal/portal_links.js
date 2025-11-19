(() => {
  "use strict";

  const APP_ID = 59; // ←リンク集管理アプリID
  const LINKS_AREA_ID = "portal-links-area";
  const STYLE_ID = "portal-links-custom-styles";

  // ============================
  // 🔥 Portal 4 の描画開始
  // ============================
  function onPortal4Loaded() {
    const root = document.getElementById("cns-root");
    if (!root) {
      setTimeout(onPortal4Loaded, 300);
      return;
    }

    let linksArea = document.getElementById(LINKS_AREA_ID);
    if (!linksArea) {
      linksArea = document.createElement("div");
      linksArea.id = LINKS_AREA_ID;
      root.prepend(linksArea);
    }

    loadLinks(linksArea);
  }

  // ============================
  // 🎨 スタイル定義と注入
  // ============================
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${LINKS_AREA_ID} {
        margin-bottom: 40px;
      }
      .pl-container {
        padding: 10px;
      }
      .pl-category-title {
        font-size: 18px;
        font-weight: 600;
        margin: 26px 1rem 14px;
        padding-bottom: 8px;
        border-bottom: 2px solid #f0f0f0;
      }
      .pl-category-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: flex-start;
      }
      .pl-item-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 140px;
        margin: 12px;
        text-decoration: none;
      }
      .pl-card {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100px;
        height: 100px;
        border-radius: 22px;
        background: linear-gradient(135deg, #ffffff, #f9f9f9);
        border: 1px solid rgba(0,0,0,0.08);
        transition: all 0.2s ease-in-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .pl-item-wrapper:hover .pl-card {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        border-color: rgba(0,0,0,0.12);
      }
      .pl-icon {
        font-size: 48px;
        color: #333;
      }
      .pl-text {
        margin-top: 12px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        color: #444;
        text-align: center;
        transition: color 0.2s ease-in-out;
      }
      .pl-item-wrapper:hover .pl-text {
        color: #007bff;
      }
    `;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ============================
  // 📡 リンク集読み込み
  // ============================
  async function loadLinks(linksArea) {
    injectStyles();

    if (!document.getElementById("mat-icon-font")) {
      const link = document.createElement("link");
      link.id = "mat-icon-font";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    let resp;
    try {
      resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
        app: APP_ID,
        query: "order by sort_order asc"
      });
    } catch (e) {
      console.error("エラー:", e);
      return;
    }

    const records = resp.records;
    const groups = {};
    records.forEach(r => {
      const c = r.category.value;
      if (!groups[c]) groups[c] = [];
      groups[c].push(r);
    });

    linksArea.innerHTML = "";
    const container = document.createElement("div");
    container.className = "pl-container";

    Object.keys(groups).forEach(category => {
      const h3 = document.createElement("div");
      h3.className = "pl-category-title";
      h3.textContent = category;
      container.appendChild(h3);

      const wrap = document.createElement("div");
      wrap.className = "pl-category-wrap";
      groups[category].forEach(r => wrap.appendChild(createLinkItem(r)));
      container.appendChild(wrap);
    });

    linksArea.appendChild(container);
  }

  // ============================
  // 🍎 リンク要素（カード＋テキスト）
  // ============================
  function createLinkItem(rec) {
    const wrapper = document.createElement("a");
    wrapper.className = "pl-item-wrapper";
    wrapper.href = rec.url.value;
    wrapper.target = "_blank";

    const card = document.createElement("div");
    card.className = "pl-card";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined pl-icon";
    icon.textContent = rec.icon.value || "description";
    card.appendChild(icon);

    const text = document.createElement("div");
    text.className = "pl-text";
    text.textContent = rec.title.value;

    wrapper.append(card, text);
    return wrapper;
  }

  // ============================
  // 🔄 URL変化を監視し Portal4 のみ表示
  // ============================
  let lastHash = "";
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;

      const root = document.getElementById("cns-root");
      const linksArea = document.getElementById(LINKS_AREA_ID);

      if (lastHash.includes("/portal/4")) {
        onPortal4Loaded();
      } else {
        if (linksArea) linksArea.remove();
      }
    }
  }, 300);

})();