(function() {
  'use strict';

  kintone.events.on('app.record.index.show', function(event) {
    console.log('🟢 一覧イベント発火');
    const records = event.records;
    if (!records || records.length === 0) {
      console.warn('⚠️ recordsが空です。');
      return event;
    }

    // 一覧上の「事件番号」セルを取得
    const cells = kintone.app.getFieldElements('case_title');
    console.log('📦 取得したセル要素:', cells);

    if (!cells || cells.length === 0) {
      console.warn('⚠️ 事件番号フィールドのセルが見つかりません。');
      return event;
    }

    records.forEach((record, idx) => {
      const caseTitle = record.case_title?.value;
      const url = record.sflink?.value;

      if (!caseTitle || !url) return;
      const cell = cells[idx];
      if (!cell) return;

      // ✅ 一覧DOM構造に合わせて中の span を取得
      const span = cell.querySelector('span');
      if (!span) {
        console.warn(`⚠️ ${idx + 1}件目: spanが見つかりません`);
        return;
      }

      // リンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.textContent = caseTitle;
      a.target = '_blank';
      a.style.color = '#3598db';
      a.style.textDecoration = 'underline';
      a.style.position = 'relative';
      a.style.zIndex = '2';

      // 元のテキストを置換
      span.textContent = '';
      span.appendChild(a);

      console.log(`✅ ${idx + 1}件目: リンク化成功 → ${url}`);
    });

    console.log('🏁 全処理完了');
    return event;
  });
})();
