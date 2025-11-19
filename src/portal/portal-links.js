(() => {
  "use strict";

  kintone.events.on("portal.show", async () => {
    // ============================
    // ① ポータルIDチェック
    // ============================
    const hash = location.hash;
    if (!hash.includes("/portal/4")) {
      return; // ポータル4以外では動かさない
    }

    // ============================
    // ② 配置先を指定（cns-root）
    // ============================
    const root = document.getElementById("cns-root");
    if (!root) return;

    // ============================
    // ③ リンク集管理アプリID
    // ============================
    const APP_ID = 59;

    // ============================
    // ④ Google Material Icons読み込み
    // ============================
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // ============================
    // ⑤ レコード取得
    // ============================
    const resp = await kintone.api(
      kintone.api.url("/k/v1/records", true),
      "GET",
      { app: APP_ID, query: "order by sort_order asc" }
    );
    const records = resp.records;

    // ============================
    // ⑥ カテゴリごとにグループ化
    // ============================
    const groups = {};
    records.forEach((rec) => {
      const cat = rec.category.value;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(rec);
    });

    // ============================
    // ⑦ コンテナ作成（ポータル4用）
    // ============================
    const container = document.createElement("div");
    container.style.padding = "20px";

    // ============================
    // ⑧ 描画
    // ============================
    Object.keys(groups).forEach((category) => {
      const title = document.createElement("h3");
      title.textContent = `▼ ${category}`;
      title.style.marginTop = "20px";
      container.appendChild(title);

      groups[category].forEach((rec) => {
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

        a.addEventListener("mouseover", () => (a.style.background = "#f7f7f7"));
        a.addEventListener("mouseout", () => (a.style.background = "#fff"));

        container.appendChild(a);
      });
    });

    // ============================
    // ⑨ ポータル4(root) に追加
    // ============================
    root.appendChild(container);
  });
})();
