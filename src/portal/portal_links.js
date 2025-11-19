(() => {
  "use strict";

  // ============================
  // 🔧 設定：リンク集管理アプリID
  // ============================
  const APP_ID = 59; // ←ここを置き換えるだけでOK

  // ============================
  // 🔍 Portal4 で描画を開始する関数
  // ============================
  function onPortal4Loaded() {
    console.log("🔥 Portal 4 読み込み開始");

    const root = document.getElementById("cns-root");
    console.log("📌 cns-root =", root);

    // cns-root がまだ生成されていない場合は再試行
    if (!root) {
      console.log("⚠️ cns-root がまだ存在しないので 300ms 後に再試行");
      setTimeout(onPortal4Loaded, 300);
      return;
    }

    // 読み込み開始
    loadLinks(root);
  }

  // ============================
  // 📡 リンク集管理アプリからデータ取得して描画
  // ============================
  async function loadLinks(root) {
    console.log("📡 レコード取得開始");

    // Google Material Icons 読み込み
    console.log("📘 Material Icons 読み込み");
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

    // ============================
    // 🧱 カテゴリごとに仕分け
    // ============================
    const records = resp.records;
    console.log("📌 records =", records);

    const groups = {};
    records.forEach(r => {
      const cat = r.category.value;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    console.log("📦 グループ化結果:", groups);

    // ============================
    // 🧱 コンテナ作成
    // ============================
    const container = document.createElement("div");
    container.style.padding = "20px";
    console.log("📁 コンテナ作成OK");

    // ============================
    // 📝 カテゴリごとに描画
    // ============================
    Object.keys(groups).forEach(category => {
      console.log("▶ カテゴリ:", category);

      const h3 = document.createElement("h3");
      h3.textContent = `▼ ${category}`;
      h3.style.marginTop = "20px";
      container.appendChild(h3);

      groups[category].forEach(r => {
        console.log("  ⮑ レコード:", r);

        const a = document.createElement("a");
        a.href = r.url.value;
        a.target = "_blank";
        a.style.display = "flex";
        a.style.alignItems = "center";
        a.style.margin = "4px 0";
        a.style.padding = "8px 12px";
        a.style.background = "#fff";
        a.style.border = "1px solid #ddd";
        a.style.borderRadius = "6px";
        a.style.textDecoration = "none";
        a.style.color = "#333";

        // アイコン
        const icon = document.createElement("span");
        icon.className = "material-icons";
        icon.textContent = r.icon.value || "description";
        icon.style.marginRight = "10px";

        // タイトル
        const text = document.createElement("span");
        text.textContent = r.title.value;

        a.append(icon, text);
        container.appendChild(a);
      });
    });

    // ============================
    // 🎉 ポータル4に反映
    // ============================
    root.innerHTML = ""; // 既存内容クリア
    root.appendChild(container);
    console.log("🎉 Portal 4 表示完了！");
  }

  // ============================
  // 🔄 URL変化を監視して portal/4 に来たら実行
  // ============================
  console.log("🛰 URL変化監視スタート");
  let lastHash = "";
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      console.log("🔄 Hash changed:", lastHash);

      if (lastHash.includes("/portal/4")) {
        console.log("👉 Portal 4 に来たので実行します");
        onPortal4Loaded();
      }
    }
  }, 300);

})();
