(function() {
  'use strict';

  console.log('[scroll_to_error] スクリプトが読み込まれました。'); // ★追加

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
    console.log('[scroll_to_error] レコード作成・編集画面のイベントを検知しました。'); // ★追加

    const observer = new MutationObserver(function(mutations) {
      console.log('[scroll_to_error] DOMの変更を検知しました。'); // ★追加

      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.matches('.notifier-header-cybozu')) {
              console.log('[scroll_to_error] エラー通知を検出しました。'); // ★追加
              const errorList = node.querySelector('.record-edit-notify-error-message-body');
              if (errorList && errorList.firstElementChild) {
                const firstErrorLabelText = errorList.firstElementChild.textContent.trim();
                console.log(`[scroll_to_error] 最初のエラー項目: ${firstErrorLabelText}`); // ★追加
                scrollToField(firstErrorLabelText);
                observer.disconnect();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[scroll_to_error] DOMの監視を開始しました。'); // ★追加

    return event;
  });

  function scrollToField(labelText) {
    console.log(`[scroll_to_error] 「${labelText}」をスクロールターゲットとして探します。`); // ★追加
    const fieldLabels = document.querySelectorAll('.control-label-gaia');
    for (const labelDiv of fieldLabels) {
      if (labelDiv.textContent.trim() === labelText) {
        let fieldElement = labelDiv.closest('.control-value-gaia') || labelDiv.closest('.control-gaia');
        if (fieldElement) {
          console.log('[scroll_to_error] スクロール対象の要素を見つけました。スクロールします。', fieldElement); // ★追加
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }
    console.warn(`[scroll_to_error] フィールド「${labelText}」が見つかりませんでした。`);
  }

})();
