(function() {
  'use strict';

  // 一覧表示イベント
  kintone.events.on('app.record.index.show', function(event) {
    const records = event.records;
    if (!records || records.length === 0) return event;

    // 一覧上の「事件番号」セルを取得
    const cells = kintone.app.getFieldElements('case_number');
    if (!cells || cells.length === 0) return event;

    records.forEach((record, idx) => {
      const caseNumber = record.case_number?.value;
      const url = record.sflink?.value;
      if (!caseNumber || !url) return;

      const cell = cells[idx];
      if (!cell) return;

      // ✅ td直下のdivを取得
      const innerDiv = cell.querySelector('div');
      if (!innerDiv) return;

      // ✅ divの中身だけクリアしてリンク挿入
      innerDiv.innerHTML = '';

      const a = document.createElement('a');
      a.href = url;
      a.textContent = caseNumber;
      a.target = '_blank';
      a.style.color = '#3598db';
      a.style.zIndex = '2';
      a.style.position = 'relative';
      a.style.textDecoration = 'underline';

      innerDiv.appendChild(a);
    });

    return event;
  });
})();
