(function() {
  'use strict';

  // 一覧表示イベント
  kintone.events.on('app.record.index.show', function(event) {
    const records = event.records;

    // 一覧に顧客名フィールドが存在しない場合はスキップ
    if (!records || records.length === 0) return event;

    // テーブル内の「顧客名」セルを順に探してリンクに変換
    records.forEach(record => {
      const customerName = record.customer_name.value;
      const url = record.sflink.value; // ←「リンク」フィールドのフィールドコードに合わせて変更！

      // 顧客名セルを取得
      const cell = kintone.app.getFieldElements('case_number');
      if (!cell) return;

      // 各セルに対応してリンクを埋め込み
      cell.forEach((el, idx) => {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = customerName;
        a.target = '_blank'; // 新しいタブで開く（必要に応じて削除）
        a.style.color = '#0056B3'; // リンクっぽく見せる
        a.style.textDecoration = 'underline';
        el.textContent = ''; // 元の文字を消して
        el.appendChild(a);   // クリック可能に
      });
    });

    return event;
  });
})();
