(() => {
  "use strict";

  const APP_ID = 59; // ←リンク集管理アプリID
  const LINKS_AREA_ID = "portal-links-area";
  const STYLE_ID = "portal-links-custom-styles";
  const CATEGORY_COLOR = {
    "マニュアル": {
      bg: "linear-gradient(135deg, #e8f0ff, #d2e1ff)",
      border: "rgba(50, 100, 200, 0.3)",
      icon: "#2b5bd7"
    },
    "業務関連シート": {
      bg: "linear-gradient(135deg, #e8ffe8, #ccf5d1)",
      border: "rgba(70, 170, 70, 0.3)",
      icon: "#1c7c2d"
    },
    "便利ツール": {
      bg: "linear-gradient(135deg, #fff4e3, #ffe3b8)",
      border: "rgba(200, 150, 50, 0.3)",
      icon: "#d88a00"
    },
    "その他": {
      bg: "linear-gradient(135deg, #f0f0f0, #e5e5e5)",
      border: "rgba(120,120,120,0.2)",
      icon: "#444"
    }
  };

  
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
        font-size: 16px;
        font-weight: 600;
        padding: 1rem;
        margin-top: 1rem;
        color: #222;
      }
      .pl-category-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: flex-start;
        margin-bottom: 1rem;
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
        font-size: 48px!important;
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

    // ハードコードされたカテゴリ順
    const CATEGORY_ORDER = ['マニュアル', '業務関連シート', '便利ツール', 'その他'];
    const processedCategories = new Set(); // 処理済みのカテゴリを追跡

    // 定義された順序でカテゴリを描画
    CATEGORY_ORDER.forEach(category => {
      if (groups[category]) { // そのカテゴリが存在する場合のみ
        const h3 = document.createElement("div");
        h3.className = "pl-category-title";
        h3.textContent = category;
        container.appendChild(h3);

        const wrap = document.createElement("div");
        wrap.className = "pl-category-wrap";
        groups[category].forEach(r => wrap.appendChild(createLinkItem(r, category)));
        container.appendChild(wrap);
        processedCategories.add(category);
      }
    });

    // CATEGORY_ORDER に含まれないカテゴリを描画 (アルファベット順など)
    Object.keys(groups)
      .filter(category => !processedCategories.has(category))
      .sort() // 残りのカテゴリはアルファベット順にソート
      .forEach(category => {
        const h3 = document.createElement("div");
        h3.className = "pl-category-title";
        h3.textContent = category;
        container.appendChild(h3);

        const wrap = document.createElement("div");
        wrap.className = "pl-category-wrap";
        groups[category].forEach(r => wrap.appendChild(createLinkItem(r, category)));
        container.appendChild(wrap);
      });

    linksArea.appendChild(container);
  }

  // ============================
  // 🍎 リンク要素（カード＋テキスト）
  // ============================
  function createLinkItem(rec, category) {
    const wrapper = document.createElement("a");
    wrapper.className = "pl-item-wrapper";
    wrapper.href = rec.url.value;
    wrapper.target = "_blank";
  
    const card = document.createElement("div");
    card.className = "pl-card";
  
    // ⭐ カテゴリカラー取得（なければデフォルト色）
    const color = CATEGORY_COLOR[category] || {
      bg: "linear-gradient(135deg, #ffffff, #f9f9f9)",
      border: "rgba(0,0,0,0.08)",
      icon: "#333"
    };
  
    // ⭐ カラー適用
    card.style.background = color.bg;
    card.style.border = `1px solid ${color.border}`;
  
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined pl-icon";
    icon.textContent = rec.icon.value || "description";
  
    // アイコン色変更
    icon.style.color = color.icon;
  
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