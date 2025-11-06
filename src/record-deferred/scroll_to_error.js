(function() {
  'use strict';

  console.log('[scroll_to_error] スクリプトが読み込まれました。');

  // エラー通知が表示されたら、最初のエラー項目までスクロールする
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
    // URLに'/edit'が含まれない場合は処理しない
    if (!location.pathname.includes('/edit')) {
      return event;
    }

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            // 追加されたノードが要素でない場合はスキップ
            if (node.nodeType !== 1) return;

            // 追加されたノード自体がエラー通知ヘッダーか、その子孫にエラー通知ヘッダーが含まれるかを確認
            const notifierHeader = node.matches('.notifier-header-cybozu') ? node : node.querySelector('.notifier-header-cybozu');

            if (notifierHeader) {
              // エラー通知を検出したら、最初のエラーフィールドにスクロール
              const firstErrorField = document.querySelector('.input-error-cybozu');
              if (firstErrorField) {
                const fieldElement = firstErrorField.closest('.control-value-gaia') || firstErrorField.closest('.control-gaia');
                if (fieldElement) {
                  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  console.warn('[scroll_to_error] エラーフィールドの親要素が見つかりませんでした。', firstErrorField);
                }
              } else {
                console.warn('[scroll_to_error] エラー通知は表示されたが、.input-error-cybozu が見つかりませんでした。');
              }
              // observer.disconnect(); // 2回目以降も動作させるため、disconnectを削除
            }
          });
        }
      });
    });

    // body要素の子要素の追加を監視
    observer.observe(document.body, { childList: true, subtree: true });

    return event;
  });

  // scrollToField 関数は不要になったため削除

})();
