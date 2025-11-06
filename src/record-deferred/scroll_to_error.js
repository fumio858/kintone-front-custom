(function() {
  'use strict';

  // エラー通知が表示されたら、最初のエラー項目までスクロールする
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            // エラー通知のヘッダーを検出
            if (node.nodeType === 1 && node.matches('.notifier-header-cybozu')) {
              const errorList = node.querySelector('.record-edit-notify-error-message-body');
              if (errorList && errorList.firstElementChild) {
                const firstErrorLabelText = errorList.firstElementChild.textContent.trim();
                scrollToField(firstErrorLabelText);
                observer.disconnect(); // 一度スクロールしたら監視を停止
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
      // ラベルテキストが一致するか確認
      if (labelDiv.textContent.trim() === labelText) {
        // ラベルの親要素（フィールド全体を囲む要素）を見つける
        // KintoneのDOM構造は複雑なため、親を辿って適切な要素を探す
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
