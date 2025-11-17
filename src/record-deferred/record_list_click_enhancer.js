// ==== レコード一覧画面で行全体をクリック可能 ====
(function() {
  'use strict';
  console.log('record_list_click_enhancer.js: スクリプト読み込み完了');

  // 行を処理する関数
  const enhanceRows = (targetNode) => {
    // targetNode 内の未処理の行を探す
    const rows = targetNode.querySelectorAll('tr[data-testid="recordlist-table-body-tr"]:not([data-click-enhanced])');
    if (rows.length === 0) return;

    console.log(`record_list_click_enhancer.js: ${rows.length} 件の新しい行を処理します`);

    rows.forEach((row, index) => {
      const href = row.querySelector('a[href*="/show#record="]')?.href;
      if (!href) {
        console.log(`record_list_click_enhancer.js: ${index + 1} 番目の行で href が見つかりませんでした`);
        return;
      }

      row.setAttribute('data-click-enhanced', 'true');
      row.style.cursor = 'pointer';

      row.addEventListener('click', e => {
        const interactiveElement = e.target.closest('a, button, input, [role="button"]');
        if (interactiveElement) {
          console.log('record_list_click_enhancer.js: インタラクティブ要素がクリックされたため、遷移をキャンセルします', interactiveElement);
          return;
        }

        console.log('record_list_click_enhancer.js: 行クリックによるページ遷移を実行します');
        if (e.metaKey || e.ctrlKey) {
          window.open(href, '_blank');
        } else {
          window.location.href = href;
        }
      });
    });
  };

  kintone.events.on('app.record.index.show', function() {
    console.log('record_list_click_enhancer.js: app.record.index.show イベント発火');

    // レコード一覧のテーブル（またはその親）が出現するのを監視
    const observer = new MutationObserver((mutationsList, obs) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 追加されたノードの中に、またはその子孫にテーブルのtbodyがあるかチェック
          const tableBody = document.querySelector('tbody.sc-dyzjNT');
          if (tableBody) {
            console.log('record_list_click_enhancer.js: テーブル(tbody.sc-dyzjNT)を検出しました');
            enhanceRows(tableBody);
            // ページネーションなどで再描画される場合も考慮し、監視は止めない
          }
        }
      }
      // ページネーションやソートによる再描画に対応するため、tbodyの中身の変更も監視
      const tableBody = document.querySelector('tbody.sc-dyzjNT');
      if (tableBody) {
        enhanceRows(tableBody);
      }
    });

    // document.body全体を監視対象とする
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 念のため、監視開始前にすでに要素が存在する場合も処理
    const initialTableBody = document.querySelector('tbody.sc-dyzjNT');
    if (initialTableBody) {
      console.log('record_list_click_enhancer.js: 初期状態でテーブル(tbody.sc-dyzjNT)を検出しました');
      enhanceRows(initialTableBody);
    } else {
      console.log('record_list_click_enhancer.js: 初期状態ではテーブルが見つかりません。監視を開始します。');
    }
  });
})();