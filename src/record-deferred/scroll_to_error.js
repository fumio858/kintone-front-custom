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
            // 追加されたノードが要素でない場合はスキップ
            if (node.nodeType !== 1) return;

            // デバッグ用に、追加されたノードのクラス名を出力
            console.log('[scroll_to_error] Added node className:', node.className);

            // 追加されたノード自体がエラー通知ヘッダーか、その子孫にエラー通知ヘッダーが含まれるかを確認
            const notifierHeader = node.matches('.notifier-header-cybozu') ? node : node.querySelector('.notifier-header-cybozu');

            if (notifierHeader) {
              console.log('[scroll_to_error] エラー通知を検出しました。', notifierHeader); // ★追加
              const errorList = notifierHeader.querySelector('.record-edit-notify-error-message-body');
              if (errorList && errorList.firstElementChild) {
                const firstErrorLabelText = errorList.firstElementChild.textContent.trim();
                console.log(`[scroll_to_error] 最初のエラー項目: ${firstErrorLabelText}`);
                scrollToField(firstErrorLabelText);
                observer.disconnect(); // 一度スクロールしたら監視を停止
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
    console.log(`[scroll_to_error] 「${labelText}」をスクロールターゲットとして探します。`);
    const fieldLabels = document.querySelectorAll('.control-label-gaia');
    for (const labelDiv of fieldLabels) {
      const actualLabelSpan = labelDiv.querySelector('.control-label-text-gaia');
      if (actualLabelSpan && actualLabelSpan.textContent.trim() === labelText) {
        let fieldElement = labelDiv.closest('.control-value-gaia') || labelDiv.closest('.control-gaia');
        if (fieldElement) {
          console.log('[scroll_to_error] スクロール対象の要素を見つけました。スクロールします。', fieldElement);
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }
    console.warn(`[scroll_to_error] フィールド「${labelText}」が見つかりませんでした。`);
  }

})();
