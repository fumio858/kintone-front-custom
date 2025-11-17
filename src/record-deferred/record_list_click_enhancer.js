// ==== レコード一覧画面で行全体をクリック可能 ====
(function() {
  'use strict';
  console.log('record_list_click_enhancer.js: スクリプト読み込み完了');

  kintone.events.on('app.record.index.show', function() {
    console.log('record_list_click_enhancer.js: app.record.index.show イベント発火');

    // 新UIではDOMの構築が遅延することがあるため、少し待ってから実行
    setTimeout(() => {
      console.log('record_list_click_enhancer.js: setTimeout 内の処理を開始');

      // すでに処理済みならスキップ
      if (document.querySelector('tr[data-testid="recordlist-table-body-tr"][data-click-enhanced]')) {
        console.log('record_list_click_enhancer.js: すでに処理済みのためスキップします');
        return;
      }

      const rows = document.querySelectorAll('tr[data-testid="recordlist-table-body-tr"]');
      console.log(`record_list_click_enhancer.js: ${rows.length} 件の行が見つかりました`);

      rows.forEach((row, index) => {
        console.log(`record_list_click_enhancer.js: ${index + 1} 番目の行を処理中`);

        const href = row.querySelector('a[href*="/show#record="]')?.href;
        if (!href) {
          console.log(`record_list_click_enhancer.js: ${index + 1} 番目の行で href が見つかりませんでした`);
          return;
        }
        console.log(`record_list_click_enhancer.js: ${index + 1} 番目の行の href: ${href}`);

        // 属性を付けて2重処理防止
        row.setAttribute('data-click-enhanced', 'true');
        row.style.cursor = 'pointer'; // カーソルを行全体に適用

        row.addEventListener('click', e => {
          console.log(`record_list_click_enhancer.js: ${index + 1} 番目の行がクリックされました`);
          
          // クリックされた要素がインタラクティブな要素（またはその子孫）の場合、何もしない
          const interactiveElement = e.target.closest('a, button, input, [role="button"]');
          if (interactiveElement) {
            console.log('record_list_click_enhancer.js: インタラクティブ要素がクリックされたため、遷移をキャンセルします', interactiveElement);
            return;
          }

          console.log('record_list_click_enhancer.js: 行クリックによるページ遷移を実行します');
          // 上記以外（セルの余白など）がクリックされた場合にページ遷移
          if (e.metaKey || e.ctrlKey) {
            window.open(href, '_blank');
          } else {
            window.location.href = href;
          }
        });
      });
    }, 500); // 500ms待つ。環境によっては調整が必要
  });
})();