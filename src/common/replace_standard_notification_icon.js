(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const TARGET_SELECTOR = 'a[href="/k/#/ntf/mention"]';
  const NEW_SVG_PATH = 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280 320-200v-80L480-520 160-720v80l320 200Z';
  const NEW_VIEW_BOX = '0 -960 960 960';
  const ADDED_FLAG = 'customNotificationIconReplaced';


  /**
   * 標準の通知アイコンをカスタムアイコンに置き換える
   */
  function replaceNotificationIcon(obs) {
    // 既に置き換え済みなら何もしない
    if (document.body.dataset[ADDED_FLAG]) {
      if (obs) obs.disconnect();
      return;
    }

    const targetLink = document.querySelector(TARGET_SELECTOR);

    if (targetLink) {
      const svgElement = targetLink.querySelector('svg');
      const pathElement = targetLink.querySelector('svg path');

      if (svgElement && pathElement) {
        // viewBoxとpathを更新
        svgElement.setAttribute('viewBox', NEW_VIEW_BOX);
        pathElement.setAttribute('d', NEW_SVG_PATH);

        // 処理完了のフラグを立て、Observerを停止
        document.body.dataset[ADDED_FLAG] = 'true';
        if (obs) obs.disconnect();
        console.log('Standard notification icon has been replaced.');
      }
    }
  }

  // ==============================
  // 🚀 初期化処理
  // ==============================

  // ヘッダーは非同期で描画されるため、DOMの変更を監視する
  const observer = new MutationObserver((mutations, obs) => {
    // セレクタに合致する要素が出現したら処理を実行
    if (document.querySelector(TARGET_SELECTOR)) {
      replaceNotificationIcon(obs);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

})();
