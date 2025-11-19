(() => {
  "use strict";

  const APP_ID = 59;
  const LINKS_AREA_ID = "portal-links-area";
  const STYLE_ID = "portal-links-custom-styles";

  const CATEGORY_COLOR = {
    "マニュアル": { icon: "#4c7eff" },
    "業務関連シート": { icon: "#3db652" },
    "便利ツール": { icon: "#e8b65d" },
    "その他": { icon: "#777" }
  };

  function onPortal4Loaded() {
    const root = document.getElementById("cns-root");
    if (!root) return setTimeout(onPortal4Loaded, 300);

    let linksArea = document.getElementById(LINKS_AREA_ID);
    if (!linksArea) {
      linksArea = document.createElement("div");
      linksArea.id = LINKS_AREA_ID;
      root.prepend(linksArea);
    }

    loadLinks(linksArea);
  }

  // ======================
  // 🎨 CSS
  // ======================
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      #${LINKS_AREA_ID} { margin-bottom: 40px; }

      .pl-container { padding: 10px; }

      .pl-category-title {
        font-size: 16px;
        font-weight: 600;
        padding: 1rem;
        margin-top: 1rem;
        color: #868686;
      }

      .pl-category-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 0 1rem;
        margin-bottom: 1rem;
      }

      .pl-item-wrapper {
        width: 180px;
        text-decoration: none;
      }

      .pl-card {
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

      .pl-item-wrapper:hover .pl-card {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      }

      .pl-icon {
        font-size: 42px!important;
        margin-bottom: 8px;
      }

      .pl-text {
        height: calc(13px * 1.5 * 2); /* 2行分の高さを計算して固定 */
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden; /* はみ出し防止 */
      }
      .pl-text-inner {
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

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ======================
  // 📡 Load Records
  // ======================
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
        query: "order by sort_order asc",
      });
    } catch (e) {
      console.error(e);
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

    const ORDER = ['マニュアル', '業務関連シート', '便利ツール', 'その他'];
    const done = new Set();

    ORDER.forEach(cat => {
      if (!groups[cat]) return;
      container.appendChild(createCategory(cat, groups[cat]));
      done.add(cat);
    });

    Object.keys(groups)
      .filter(c => !done.has(c))
      .sort()
      .forEach(c => container.appendChild(createCategory(c, groups[c])));

    linksArea.appendChild(container);
  }

  function createCategory(name, items) {
    const box = document.createElement("div");

    const title = document.createElement("div");
    title.className = "pl-category-title";
    title.textContent = name;
    box.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = "pl-category-wrap";

    items.forEach(r => wrap.appendChild(createLinkItem(r, name)));

    box.appendChild(wrap);
    return box;
  }

  // ======================
  // 🍎 Item Card
  // ======================
  function createLinkItem(rec, category) {
    const color = CATEGORY_COLOR[category] || { icon: "#333" };

    const wrapper = document.createElement("a");
    wrapper.className = "pl-item-wrapper";
    wrapper.href = rec.url.value;
    wrapper.target = "_blank";

    const card = document.createElement("div");
    card.className = "pl-card";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined pl-icon";
    icon.style.color = color.icon;
    icon.textContent = rec.icon.value || "description";

    const text = document.createElement("div");
    text.className = "pl-text";
    const textInner = document.createElement("span");
    textInner.className = "pl-text-inner";
    textInner.textContent = rec.title.value;
    text.appendChild(textInner);

    card.append(icon, text);
    wrapper.append(card);

    return wrapper;
  }

  // ======================
  // 🔄 Portal 4 Only
  // ======================
  let lastHash = "";
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;

      const area = document.getElementById(LINKS_AREA_ID);
      if (lastHash.includes("/portal/4")) {
        onPortal4Loaded();
      } else if (area) {
        area.remove();
      }
    }
  }, 300);
})();
