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
    // kintoneの「日時」フィールドはISO 8601形式を期待します
    // 例: "2025-11-18T10:30:00Z"
    const datetime = now.toISOString();

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // 最新のrevisionを取得するために一度レコードを取得
        const currentRecord = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
          app: kintone.app.getId(),
          id: recordId
        });
        const revision = currentRecord.$revision.value;

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
          // 少し待ってからリトライ (指数バックオフ)
          await new Promise(resolve => setTimeout(resolve, 100 + (Math.random() * 200 * (i + 1))));
        } else {
          console.error(`[${FIELD_CODE}] Failed to update last comment datetime for Record ID: ${recordId}`, error);
          // ユーザーに通知する場合はここでalertなど
          return; // リトライ上限に達したか、他のエラーで終了
        }
      }
    }
  }

  // ==============================
  // 🚀 初期化 & イベント処理
  // ==============================
  function init() {
    const recordId = kintone.app.record.getId();
    if (!recordId) {
      console.warn(`[${FIELD_CODE}] Record ID not found. Skipping initialization.`);
      return;
    }

    const commentArea = document.querySelector('#sidebar-list-gaia');
    if (!commentArea) {
      console.warn(`[${FIELD_CODE}] Comment area (#sidebar-list-gaia) not found. Skipping initialization.`);
      return;
    }

    // MutationObserverが重複しないようにフラグで制御
    if (commentArea.dataset.lastCommentObserverAttached) {
      return;
    }
    commentArea.dataset.lastCommentObserverAttached = 'true';

    const observer = new MutationObserver((mutations) => {
      let newCommentAdded = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            // 新しいコメント要素が追加されたかチェック
            // .itemlist-item-gaia はコメント1つ1つの要素
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

    // コメントエリアの子要素の追加・削除を監視
    observer.observe(commentArea, {
      childList: true,
      subtree: true, // コメントがネストされる可能性も考慮
    });

    console.log(`[${FIELD_CODE}] Watching for new comments to update last comment datetime for Record ID: ${recordId}.`);
  }

  // レコード詳細画面表示時に初期化処理を実行
  kintone.events.on('app.record.detail.show', init);

})();
