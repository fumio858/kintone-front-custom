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
              const errorList = notifierHeader.querySelector('.record-edit-notify-error-message-body');
              if (errorList && errorList.firstElementChild) {
                const firstErrorLabelText = errorList.firstElementChild.textContent.trim();
                scrollToField(firstErrorLabelText);
                // observer.disconnect(); // 2回目以降も動作させるため、disconnectを削除
              }
            }
          });
        }
      });
    });

    // body要素の子要素の追加を監視
    observer.observe(document.body, { childList: true, subtree: true });

    return event;
  });

  /**
   * 指定されたラベルテキストを持つKintoneフィールド要素を見つけてスクロールする
   * @param {string} labelText - エラーメッセージから取得したフィールドのラベルテキスト
   */
  function scrollToField(labelText) {
    const fieldLabels = document.querySelectorAll('.control-label-gaia');
    for (const labelDiv of fieldLabels) {
      const actualLabelSpan = labelDiv.querySelector('.control-label-text-gaia');
      if (actualLabelSpan && actualLabelSpan.textContent.trim() === labelText) {
        let fieldElement = labelDiv.closest('.control-value-gaia') || labelDiv.closest('.control-gaia');
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }
    console.warn(`[scroll_to_error] フィールド「${labelText}」が見つかりませんでした。`);
  }

})();
