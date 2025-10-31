(function() {
  'use strict';

  // ==== 設定ここから ====
  // このスクリプトはタスクアプリ（ID: 23）に設定します

  // 関連元レコードの情報を格納するフィールド
  const SRC_RECORD_APP_TYPE_FIELD = 'case_type'; // 分野 (e.g., '刑事事件')
  const SRC_RECORD_ID_FIELD = 'case_id';       // 関連元レコードのID

  // タスクアプリ内のフィールド
  const TASK_TITLE_FIELD = '件名';
  const TASK_STATUS_FIELD = 'タスクステータス';
  const TASK_APP_ID = 23; // このアプリ自身のID

  // 分野名から、関連元アプリIDへの変換表
  const CASE_TYPE_TO_APP_ID_MAP = {
    '刑事事件': 22,
    '交通事故': 26,
    '刑事交通以外': 55,
  };
  // ==== 設定ここまで ====

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  /**
   * 関連元レコードにコメントを投稿する共通関数
   * @param {object} record - タスクアプリのレコードオブジェクト
   * @param {string} commentText - 投稿するコメント
   */
  async function postCommentToSourceRecord(record, commentText) {
    const caseType = record[SRC_RECORD_APP_TYPE_FIELD]?.value;
    const sourceRecordId = record[SRC_RECORD_ID_FIELD]?.value;
    const sourceAppId = CASE_TYPE_TO_APP_ID_MAP[caseType];

    if (!sourceAppId || !sourceRecordId) {
      console.warn('[task-trigger] 関連元のアプリIDまたはレコードIDが見つからないため、コメントをスキップしました。', { caseType, sourceRecordId });
      return;
    }

    try {
      await kintone.api(kUrl('/k/v1/record/comment'), 'POST', {
        app: sourceAppId,
        record: sourceRecordId,
        comment: { text: commentText }
      });
      console.log(`[task-trigger] 関連元レコード (app: ${sourceAppId}, record: ${sourceRecordId}) にコメントを投稿しました。`);
    } catch (e) {
      console.error('[task-trigger] 関連元レコードへのコメント投稿に失敗しました。', e);
      // ここでのエラーはユーザーに通知しない
    }
  }

  /**
   * 関連レコード表示用のiframeをリロードする
   */
  function reloadRelatedRecordIframe() {
    // dynamic_related_records.js が生成したiframeを探す
    const iframeContainer = document.getElementById('custom-iframe-container');
    if (iframeContainer) {
      const iframe = iframeContainer.querySelector('iframe');
      if (iframe) {
        console.log('[task-trigger] Reloading related record iframe after 500ms.');
        // 500ms待ってからリロードし、kintoneのコメント反映を待つ
        setTimeout(() => {
          iframe.src = iframe.src; // srcを再設定してリロード
        }, 500);
      }
    }
  }

  // --- イベントハンドラー ---

  // 1. タスク作成時
  kintone.events.on('app.record.create.submit.success', async (event) => {
    const record = event.record;
    const taskTitle = record[TASK_TITLE_FIELD]?.value;
    const taskUrl = `${location.origin}/k/${TASK_APP_ID}/show#record=${event.recordId}`;

    const comment = `タスクが作成されました。

` +
                    `件名: ${taskTitle}

` +
                    `▼タスク詳細
${taskUrl}`;

    await postCommentToSourceRecord(record, comment);

    // iframeをリロード
    reloadRelatedRecordIframe();

    return event;
  });

  // 2. タスク編集時（ステータス変更を検知）
  kintone.events.on('app.record.edit.submit.success', async (event) => {
    const record = event.record;
    const previous = event.previous;

    const oldStatus = previous[TASK_STATUS_FIELD]?.value;
    const newStatus = record[TASK_STATUS_FIELD]?.value;

    // ステータスが変更された場合のみコメント
    if (oldStatus !== newStatus) {
      const taskTitle = record[TASK_TITLE_FIELD]?.value;
      const taskUrl = `${location.origin}/k/${TASK_APP_ID}/show#record=${event.recordId}`;

      const comment = `タスクのステータスが「${oldStatus || '（空）'}」から「${newStatus}」に変更されました。

` +
                      `件名: ${taskTitle}

` +
                      `▼タスク詳細
${taskUrl}`;

      await postCommentToSourceRecord(record, comment);

      // iframeをリロード
      reloadRelatedRecordIframe();
    }

    return event;
  });

})();
