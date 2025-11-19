(() => {
  "use strict";

  // 🔧 リンク集管理アプリID
  const APP_ID = 59; // ←ここだけ変更してください

  // ============================
  // 🔥 Portal4 の描画開始
  // ============================
  function onPortal4Loaded() {
    console.log("🔥 Portal 4 読み込み開始");

    const root = document.getElementById("cns-root");
    console.log("📌 cns-root =", root);

    if (!root) {
      console.log("⚠️ cns-root がまだ存在しないので 300ms 後に再試行");
      setTimeout(onPortal4Loaded, 300);
      return;
    }

    loadLinks(root);
  }

  // ============================
  // 📡 リンク集管理アプリからデータ取得
  // ============================
  async function loadLinks(root) {
    console.log("📡 レコード取得開始");

    // Google Material Icons 読み込み
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    let resp;

    try {
      resp = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        {
          app: APP_ID,
          query: "order by sort_order asc"
        }
      );
      console.log("📥 レコード取得成功:", resp.records.length, "件");
    } catch (e) {
      console.error("❌ レコード取得エラー:", e);
      return;
    }

    const records = resp.records;

    // カテゴリ分け
    const groups = {};
    records.forEach(r => {
      const c = r.category.value;
      if (!groups[c]) groups[c] = [];
      groups[c].push(r);
    });

    // ===== コンテナ =====
    const container = document.createElement("div");
    container.style.padding = "20px";

    // ===== カテゴリごと描画 =====
    Object.keys(groups).forEach(category => {
      const h3 = document.createElement("h3");
      h3.textContent = `▼ ${category}`;
      h3.style.margin = "20px 0 10px";
      container.appendChild(h3);

      // カード複数を入れるグリッド
      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.flexWrap = "wrap";
      wrap.style.gap = "12px";

      groups[category].forEach(r => wrap.appendChild(createAppleCard(r)));

      container.appendChild(wrap);
    });

    // ===== Portal4 に反映 =====
    root.innerHTML = "";
    root.appendChild(container);
    console.log("🎉 Portal 4 表示完了！");
  }

  // ============================
  // 🍎 Apple 風ブルーカード
  // ============================
  function createAppleCard(rec) {
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
    card.style.height = "120px";
    card.style.margin = "12px";
    card.style.padding = "20px";

    // Apple風丸角
    card.style.borderRadius = "20px";

    // ★ Apple Blue グラデーション背景
    card.style.background = "linear-gradient(135deg, #e6f3ff, #b6d8ff)";
    card.style.color = "#333";
    card.style.textDecoration = "none";
    card.style.transition = "background 0.2s ease";

    // hover（少し濃く）
    card.addEventListener("mouseover", () => {
      card.style.background = "linear-gradient(135deg, #d6ebff, #a6ceff)";
    });
    card.addEventListener("mouseout", () => {
      card.style.background = "linear-gradient(135deg, #e6f3ff, #b6d8ff)";
    });

    // アイコン
    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.textContent = rec.icon.value || "description";
    icon.style.fontSize = "40px";
    icon.style.marginBottom = "10px";

    // タイトル
    const text = document.createElement("div");
    text.textContent = rec.title.value;
    text.style.fontSize = "14px";
    text.style.fontWeight = "500";

    card.append(icon, text);

    return card;
  }

  // ============================
  // 🔄 URL変化監視 → Portal4だけ表示
  // ============================
  console.log("🛰 URL変化監視スタート");

  let lastHash = "";
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      console.log("🔄 Hash changed:", lastHash);

      const root = document.getElementById("cns-root");

      // Portal4 → 表示
      if (lastHash.includes("/portal/4")) {
        console.log("👉 Portal 4 に来たので表示");
        onPortal4Loaded();
        return;
      }

      // その他 → 非表示
      if (root) {
        console.log("🚫 Portal4 ではないので非表示にする");
        root.innerHTML = "";
      }
    }
  }, 300);

})();
