(() => {
  "use strict";

  const APP_ID = 59; // ←リンク集管理アプリID
  const LINKS_AREA_ID = "portal-links-area";

  // ============================
  // 🔥 Portal 4 の描画開始
  // ============================
  function onPortal4Loaded() {
    const root = document.getElementById("cns-root");
    if (!root) {
      setTimeout(onPortal4Loaded, 300);
      return;
    }

    // ⭐ 既存ウィジェットの「上」に専用エリアを作成
    let linksArea = document.getElementById(LINKS_AREA_ID);

    if (!linksArea) {
      linksArea = document.createElement("div");
      linksArea.id = LINKS_AREA_ID;
      linksArea.style.marginBottom = "40px"; // 既存ウィジェットとの距離
      root.prepend(linksArea); // ←←★ ここがポイント！
    }

    loadLinks(linksArea);
  }

  // ============================
  // 📡 リンク集読み込み
  // ============================
  async function loadLinks(linksArea) {

    // Material Icons 読み込み（1回だけ）
    if (!document.getElementById("mat-icon-font")) {
      const link = document.createElement("link");
      link.id = "mat-icon-font";
      link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    let resp;
    try {
      resp = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        { app: APP_ID, query: "order by sort_order asc" }
      );
    } catch (e) {
      console.error("エラー:", e);
      return;
    }

    const records = resp.records;

    // カテゴリ別にグループ化
    const groups = {};
    records.forEach(r => {
      const c = r.category.value;
      if (!groups[c]) groups[c] = [];
      groups[c].push(r);
    });

    // ------------------------
    // ⭐ 専用エリアだけ更新
    // ------------------------
    linksArea.innerHTML = "";

    const container = document.createElement("div");
    container.style.padding = "10px";

    // カテゴリごとに描画
    Object.keys(groups).forEach(category => {
      const h3 = document.createElement("div");
      h3.textContent = category;
      h3.style.fontSize = "18px";
      h3.style.fontWeight = "600";
      h3.style.margin = "26px 1rem 14px";
      container.appendChild(h3);

      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexWrap = "wrap";
      wrap.style.gap = "12px";

      groups[category].forEach(r => wrap.appendChild(createWhiteCard(r)));

      container.appendChild(wrap);
    });

    linksArea.appendChild(container);
  }

  // ============================
  // 🍎 白カード（Apple風）
  // ============================
  function createWhiteCard(rec) {
    const card = document.createElement("a");
    card.href = rec.url.value;
    card.target = "_blank";

    // レイアウト
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "center";
    card.style.alignItems = "center";
    card.style.textAlign = "center";

    // サイズ
    card.style.width = "180px";
    card.style.height = "100px";
    card.style.margin = "12px";
    card.style.padding = "20px";

    // 丸角
    card.style.borderRadius = "20px";

    // 白ライトグラデ
    card.style.background = "linear-gradient(135deg, #ffffff, #f7f7f7)";
    card.style.border = "1px solid rgba(0,0,0,0.12)";
    card.style.color = "#333";
    card.style.textDecoration = "none";
    card.style.transition = "background 0.2s ease, border-color 0.2s ease";

    card.addEventListener("mouseover", () => {
      card.style.background = "linear-gradient(135deg, #f9f9f9, #ededed)";
      card.style.borderColor = "rgba(0,0,0,0.2)";
    });
    card.addEventListener("mouseout", () => {
      card.style.background = "linear-gradient(135deg, #ffffff, #f7f7f7)";
      card.style.borderColor = "rgba(0,0,0,0.12)";
    });

    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.textContent = rec.icon.value || "description";
    icon.style.fontSize = "52px";
    icon.style.marginBottom = "12px";

    const text = document.createElement("div");
    text.textContent = rec.title.value;
    text.style.fontSize = "15px";
    text.style.fontWeight = "500";
    text.style.lineHeight = "1.6";

    card.append(icon, text);

    return card;
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
        // ⭐ Portal4でない時 → 専用エリアだけ消す
        if (linksArea) linksArea.remove();
      }
    }
  }, 300);

})();
