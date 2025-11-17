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

    console.log('🔍 最初のレコードの内容:', records[0]);

    const cells = kintone.app.getFieldElements('case_title');
    console.log('📦 取得したセル要素:', cells);

    if (!cells || cells.length === 0) {
      console.warn('⚠️ 事件番号フィールドのセルが見つかりません。');
      return event;
    }

    records.forEach((record, idx) => {
      console.log(`🔸 ${idx + 1}件目の処理開始`);
      const caseTitle = record.case_title?.value;
      const url = record.sflink?.value;

      console.log('🧾 事件番号:', caseTitle, '🔗 URL:', url);

      if (!caseTitle || !url) return;

      const cell = cells[idx];
      if (!cell) return;

      // ✅ 内部のdiv.value-gaiaを取得して書き換え
      const valueDiv = cell.querySelector('.value-gaia');
      if (!valueDiv) return;

      const a = document.createElement('a');
      a.href = url;
      a.textContent = caseTitle;
      a.target = '_blank';
      a.style.color = '#3598db';
      a.style.textDecoration = 'underline';
      a.style.position = 'relative';
      a.style.zIndex = '2';

      // ここだけ変更：textContentで消すのではなく、divの中身を置換
      valueDiv.innerHTML = '';
      valueDiv.appendChild(a);

      console.log(`✅ ${idx + 1}件目: リンク化成功 → ${url}`);
    });

    console.log('🏁 全処理完了');
    return event;
  });
})();
