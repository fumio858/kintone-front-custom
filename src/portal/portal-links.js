(() => {
  "use strict";

  kintone.events.on("portal.show", async (event) => {
    console.log("🔥 portal.show 発火:", event);

    // =========================================
    // ① ポータルIDチェック
    // =========================================
    const hash = location.hash;
    console.log("📌 location.hash =", hash);

    if (!hash.includes("/portal/4")) {
      console.log("🚫 ポータル4ではないので処理停止");
      return;
    }
    console.log("✅ ポータル4判定OK");

    // =========================================
    // ② 配置先取得（cns-root）
    // =========================================
    const root = document.getElementById("cns-root");
    console.log("📌 cns-root =", root);

    if (!root) {
      console.log("⚠️ cns-root が見つからない");
      return;
    }
    console.log("✅ cns-root 取得OK");

    // =========================================
    // ③ アプリID設定
    // =========================================
    const APP_ID = 59; // ← あとで置き換える
    console.log("📌 使用するアプリID =", APP_ID);

    // =========================================
    // ④ Material Icons 読み込み
    // =========================================
    console.log("📌 Material Icons読み込み開始");
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // =========================================
    // ⑤ レコード取得開始
    // =========================================
    console.log("📡 レコード取得開始...");
    let resp;
    try {
      resp = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        { app: APP_ID, query: "order by sort_order asc" }
      );
      console.log("📥 レコード取得成功:", resp);
    } catch (err) {
      console.error("❌ レコード取得エラー:", err);
      return;
    }

    const records = resp.records;
    console.log("📌 records =", records);

    if (!records || records.length === 0) {
      console.log("⚠️ レコード0件");
      return;
    }
    console.log(`✅ レコード${records.length}件`);

    // =========================================
    // ⑥ カテゴリごとにグループ化
    // =========================================
    const groups = {};
    records.forEach((rec) => {
      const cat = rec.category.value;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(rec);
    });
    console.log("📌 グループ化結果:", groups);

    // =========================================
    // ⑦ コンテナ作成
    // =========================================
    const container = document.createElement("div");
    container.style.padding = "20px";
    console.log("📌 コンテナ作成OK");

    // =========================================
    // ⑧ 描画開始
    // =========================================
    console.log("🧱 描画開始");
    Object.keys(groups).forEach((category) => {
      console.log("▶ カテゴリ:", category);

      const title = document.createElement("h3");
      title.textContent = `▼ ${category}`;
      title.style.marginTop = "20px";
      container.appendChild(title);

      groups[category].forEach((rec) => {
        console.log("  ⮑ レコード:", rec);

        const a = document.createElement("a");
        a.href = rec.url.value;
        a.target = "_blank";
        a.style.display = "flex";
        a.style.alignItems = "center";
        a.style.padding = "8px 12px";
        a.style.margin = "4px 0";
        a.style.background = "#fff";
        a.style.border = "1px solid #ddd";
        a.style.borderRadius = "6px";
        a.style.textDecoration = "none";
        a.style.color = "#333";

        const icon = document.createElement("span");
        icon.className = "material-icons";
        icon.textContent = rec.icon.value || "description";
        icon.style.marginRight = "10px";
        a.appendChild(icon);

        const text = document.createElement("span");
        text.textContent = rec.title.value;
        a.appendChild(text);

        container.appendChild(a);
      });
    });

    // =========================================
    // ⑨ cns-root に追加
    // =========================================
    root.appendChild(container);
    console.log("🎉 レンダリング完了！");

  });
})();
