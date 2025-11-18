(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const FIELD_CODE = 'last_comment_datetime'; // 最終コメント日時を保存するフィールドコード

  // ==============================
  // 💾 レコード更新処理
  // ==============================
  async function updateLastCommentDatetime(recordId) {
    try {
      // コメントAPIを呼び出して最新のコメントを1件だけ取得
      const commentsResp = await kintone.api(kintone.api.url('/k/v1/record/comments', true), 'GET', {
        app: kintone.app.getId(),
        record: recordId,
        order: 'desc', // 新しい順で取得
        limit: 1       // 1件だけ取得
      });

      if (!commentsResp.comments || commentsResp.comments.length === 0) {
        console.warn(`[${FIELD_CODE}] No comments found for Record ID: ${recordId}.`);
        return;
      }

      const latestComment = commentsResp.comments[0];
      const datetime = latestComment.createdAt; // APIから直接ISO 8601形式の日時を取得

      // レコードの日時フィールドを更新
      await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
        app: kintone.app.getId(),
        id: recordId,
        record: {
          [FIELD_CODE]: { value: datetime }
        }
      });
      console.log(`[${FIELD_CODE}] Updated to: ${datetime} (Record ID: ${recordId})`);
    } catch (error) {
      console.error(`[${FIELD_CODE}] Failed to update last comment datetime for Record ID: ${recordId}`, error);
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
        console.log(`[${FIELD_CODE}] New comment detected. Fetching latest comment from API...`);
        // APIで日時を取得するため、DOM要素を渡す必要はなくなった
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

  // commentPanel-launcher.js が提供するカスタムイベントにもフック
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