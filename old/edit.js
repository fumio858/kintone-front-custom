(function () {
  "use strict";

  // ★★★ 変換したいフィールドコード ★★★
  const TARGET_FIELD = "content"; // ← あなたのリッチテキストフィールドコード

  const APP_ID = kintone.app.getId();

  if (!confirm("【注意】全レコードのHTMLを一括変換します。よろしいですか？")) return;

  async function fetchAllRecords() {
    const all = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
        app: APP_ID,
        fields: [TARGET_FIELD],
        query: `limit ${limit} offset ${offset}`
      });

      all.push(...resp.records);
      if (resp.records.length < limit) break;
      offset += limit;
    }

    return all;
  }

  function convertHtml(html) {
    if (!html) return "";

    // 安全に DOM としてパース
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // <div> の直前・直後の改行を整形
    // 基本方針：<div> ひとつを「段落」として扱い <br><br> に変換
    let out = temp.innerHTML
      .replace(/<\/div>\s*<div>/g, "<br><br>") // 段落区切り
      .replace(/<div>/g, "")                  // 開始タグ削除
      .replace(/<\/div>/g, "")                // 終了タグ削除
      .replace(/&nbsp;/g, " ");               // 余計な NBSP を除去

    return out.trim();
  }

  async function updateRecords(records) {
    const chunks = [];

    for (const r of records) {
      const oldHtml = r[TARGET_FIELD].value || "";
      const newHtml = convertHtml(oldHtml);
      if (oldHtml === newHtml) continue;

      chunks.push({
        id: r.$id.value,
        record: {
          [TARGET_FIELD]: { value: newHtml }
        }
      });
    }

    console.log("更新対象:", chunks.length);

    while (chunks.length > 0) {
      const part = chunks.splice(0, 100);
      await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", {
        app: APP_ID,
        records: part
      });
      console.log("更新:", part.length);
    }

    alert("全レコードの改行復元が完了しました！");
  }

  (async () => {
    const recs = await fetchAllRecords();
    await updateRecords(recs);
  })();

})();
