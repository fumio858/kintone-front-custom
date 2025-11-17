// ==== レコード一覧画面で行全体をクリック可能 ====
(function() {
  'use strict';
  kintone.events.on('app.record.index.show', function() {
    // 新UIではDOMの構築が遅延することがあるため、少し待ってから実行
    setTimeout(() => {
      // すでに処理済みならスキップ
      if (document.querySelector('tr[data-testid="recordlist-table-body-tr"][data-click-enhanced]')) {
        return;
      }

      document.querySelectorAll('tr[data-testid="recordlist-table-body-tr"]').forEach(row => {
        const href = row.querySelector('a[href*="/show#record="]')?.href;
        if (!href) return;

        // 属性を付けて2重処理防止
        row.setAttribute('data-click-enhanced', 'true');
        row.style.cursor = 'pointer'; // カーソルを行全体に適用

        row.addEventListener('click', e => {
          // クリックされた要素がインタラクティブな要素（またはその子孫）の場合、何もしない
          // これにより、リンクやボタンのデフォルトの動作が維持される
          if (e.target.closest('a, button, input, [role="button"]')) {
            return;
          }

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