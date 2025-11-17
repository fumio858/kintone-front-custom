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

        // CSSで透明レイヤーを上にかぶせる
        row.style.position = 'relative';
        const overlay = document.createElement('div');
        overlay.className = 'row-click-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.right = 0;
        overlay.style.bottom = 0;
        overlay.style.cursor = 'pointer';
        overlay.style.zIndex = 1;
        overlay.style.background = 'transparent';

        // 行クリックで移動
        overlay.addEventListener('click', e => {
          // Ctrl or Cmdクリックなら別タブ
          if (e.metaKey || e.ctrlKey) {
            window.open(href, '_blank');
          } else {
            window.location.href = href;
          }
        });

        // 既存リンク・ボタンのクリックを優先させる
        row.querySelectorAll('a, button, input').forEach(el => {
          el.style.position = 'relative';
          el.style.zIndex = 2;
        });

        row.appendChild(overlay);
      });
    }, 500); // 500ms待つ。環境によっては調整が必要
  });
})();