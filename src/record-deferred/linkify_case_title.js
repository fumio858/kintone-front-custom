(function() {
  'use strict';

  kintone.events.on('app.record.index.show', function(event) {
    console.log('🟢 一覧イベント発火');
    const records = event.records;
    console.log('📄 records:', records);

    if (!records || records.length === 0) {
      console.warn('⚠️ recordsが空です。');
      return event;
    }

    // ここでフィールドコードを確認（存在しない場合 undefined）
    console.log('🔍 最初のレコードの内容:', records[0]);

    // 一覧上の「事件番号」セルを取得
    const cells = kintone.app.getFieldElements('case_title');
    console.log('📦 取得したセル要素:', cells);

    if (!cells || cells.length === 0) {
      console.warn('⚠️ 事件番号フィールドのセルが見つかりません。フィールドコード "case_title" が正しいか確認してください。');
      return event;
    }

    // 各レコードを処理
    records.forEach((record, idx) => {
      console.log(`🔸 ${idx + 1}件目の処理開始`);
      const caseTitle = record.case_title?.value;
      const url = record.sflink?.value;

      console.log('🧾 事件番号:', caseTitle, '🔗 URL:', url);

      if (!caseTitle) {
        console.warn(`⚠️ ${idx + 1}件目: 事件番号が空です`);
        return;
      }
      if (!url) {
        console.warn(`⚠️ ${idx + 1}件目: URLが空です`);
        return;
      }

      const cell = cells[idx];
      if (!cell) {
        console.warn(`⚠️ ${idx + 1}件目: セルが取得できません`);
        return;
      }

      // リンクを作成して埋め込み
      const a = document.createElement('a');
      a.href = url;
      a.textContent = caseTitle;
      a.target = '_blank';
      a.style.color = '#0056B3';
      a.style.textDecoration = 'underline';

      // 元の文字をクリアしてリンク挿入
      cell.textContent = '';
      cell.appendChild(a);

      console.log(`✅ ${idx + 1}件目: リンク化成功 → ${url}`);
    });

    console.log('🏁 全処理完了');
    return event;
  });
})();
