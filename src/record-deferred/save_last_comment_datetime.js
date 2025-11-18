(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const FIELD_CODE = 'last_comment_datetime'; // 最終コメント日時を保存するフィールドコード
  const MAX_RETRIES = 5; // レコード更新時のリトライ回数

  // ==============================
  // 💾 レコード更新処理
  // ==============================
  async function updateLastCommentDatetime(recordId) {
    const now = new Date();
    const datetime = now.toISOString();

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // 最新のrevisionを取得するために一度レコードを取得
        const resp = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
          app: kintone.app.getId(),
          id: recordId
        });
        // 【修正点1】レスポンスオブジェクトの record プロパティから revision を取得
        const revision = resp.record.$revision.value;

        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: kintone.app.getId(),
          id: recordId,
          record: {
            [FIELD_CODE]: { value: datetime }
          },
          revision: revision
        });
        console.log(`[${FIELD_CODE}] Updated to: ${datetime} (Record ID: ${recordId})`);
        return; // 成功したら終了

      } catch (error) {
        // CB_VA01 はレコードの競合エラー
        if (error.code === 'CB_VA01' && i < MAX_RETRIES - 1) {
          console.warn(`[${FIELD_CODE}] Record conflict detected. Retrying... (${i + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 100 + (Math.random() * 200 * (i + 1))));
        } else {
          console.error(`[${FIELD_CODE}] Failed to update last comment datetime for Record ID: ${recordId}`, error);
          return;
        }
      }
    }
  }

  // ==============================
  // 🚀 初期化 & イベント処理
  // ==============================
  function init(retryCount = 0) {
    const MAX_INIT_RETRIES = 10;
    const RETRY_INTERVAL = 300;

    const recordId = kintone.app.record.getId();
    if (!recordId) return; // レコード詳細画面でなければ何もしない

    const commentArea = document.querySelector('#sidebar-list-gaia');
    if (!commentArea) {
      if (retryCount < MAX_INIT_RETRIES) {
        setTimeout(() => init(retryCount + 1), RETRY_INTERVAL);
      } else {
        console.warn(`[${FIELD_CODE}] Comment area not found after retries.`);
      }
      return;
    }

    // MutationObserverが重複しないようにフラグで制御
    if (commentArea.dataset.lastCommentObserverAttached === 'true') {
      return;
    }
    commentArea.dataset.lastCommentObserverAttached = 'true';

    const observer = new MutationObserver((mutations) => {
      let newCommentAdded = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.classList.contains('itemlist-item-gaia')) {
              newCommentAdded = true;
              break;
            }
          }
        }
        if (newCommentAdded) break;
      }

      if (newCommentAdded) {
        console.log(`[${FIELD_CODE}] New comment detected. Attempting to update last comment datetime...`);
        updateLastCommentDatetime(recordId);
      }
    });

    observer.observe(commentArea, {
      childList: true,
      subtree: true,
    });

    console.log(`[${FIELD_CODE}] Watching for new comments to update last comment datetime for Record ID: ${recordId}.`);
  }

  // レコード詳細画面表示時に初期化
  kintone.events.on('app.record.detail.show', init);

  // 【修正点2】commentPanel-launcher.js が提供するカスタムイベントにもフック
  window.addEventListener('urlchanged', () => {
    const commentArea = document.querySelector('#sidebar-list-gaia');
    if (commentArea) {
      // 画面遷移後、監視が再設定されるようにフラグを削除
      delete commentArea.dataset.lastCommentObserverAttached;
    }
    // 少し遅延させてから初期化処理を呼ぶ
    setTimeout(init, 500);
  });

})();