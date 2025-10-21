(function() {
  'use strict';

  // ==== 設定ここから ====
  const CASE_TYPE_FIELD_CODE = 'case_type'; // 現在のレコードの分野フィールド
  // const RELATED_RECORDS_SPACE_FIELD_CODE = 'related_records_space'; // スペースフィールドは使用しない
  const CURRENT_RECORD_CASE_ID_FIELD = 'case_id'; // 現在のレコードのcase_idフィールド

  // 分野の値と、関連レコードを取得するアプリIDの対応
  const CASE_TYPE_TO_APP_ID_MAP = {
    '刑事事件': 22,
    '交通事故': 26,
    '刑事交通以外': 55,
  };

  const DISPLAY_FIELD_CODE = '案件事件名'; // iframeなので直接は使わない
  const IFRAME_HEIGHT = '50vh'; // iframeの高さ

  // ==== 設定ここまで ====

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  kintone.events.on(['app.record.detail.show'], async (event) => {
    const record = event.record;
    const currentRecordId = kintone.app.record.getId();
    const currentCaseType = record[CASE_TYPE_FIELD_CODE]?.value;
    const currentRecordCaseId = record[CURRENT_RECORD_CASE_ID_FIELD]?.value;

    const recordGaia = document.getElementById('record-gaia');
    if (!recordGaia) {
      console.warn('#record-gaia 要素が見つかりません。');
      return event;
    }

    // メッセージ表示用のコンテナを作成
    const messageContainerId = 'related-records-message-container';
    let messageContainer = document.getElementById(messageContainerId);
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = messageContainerId;
      messageContainer.style.padding = '10px';
      messageContainer.style.marginTop = '10px';
      messageContainer.style.border = '1px solid #e3e7e8';
      messageContainer.style.borderRadius = '6px';
      messageContainer.style.backgroundColor = '#f7f9fa';
      recordGaia.insertAdjacentElement('afterend', messageContainer);
    }
    messageContainer.innerHTML = ''; // クリア

    // iframe表示用のコンテナを作成
    const iframeContainerId = 'related-records-iframe-container';
    let iframeContainer = document.getElementById(iframeContainerId);
    if (!iframeContainer) {
      iframeContainer = document.createElement('div');
      iframeContainer.id = iframeContainerId;
      iframeContainer.style.marginTop = '10px'; // #record-gaiaとの間に余白
      recordGaia.insertAdjacentElement('afterend', iframeContainer);
    }
    iframeContainer.innerHTML = ''; // クリア

    if (!currentCaseType) {
      messageContainer.innerHTML = '<p style="color:#c00;">分野が設定されていません。関連案件を表示できません。</p>';
      return event;
    }

    if (!currentRecordCaseId) {
      messageContainer.innerHTML = '<p style="color:#c00;">現在のレコードのcase_idが設定されていません。関連案件を表示できません。</p>';
      return event;
    }

    const targetAppId = CASE_TYPE_TO_APP_ID_MAP[currentCaseType];

    if (!targetAppId) {
      messageContainer.innerHTML = `<p>分野 '${currentCaseType}' に対応するアプリが見つかりません。</p>`;
      return event;
    }

    // 関連レコードの取得 (iframeのURLを生成するためにレコードIDが必要)
    try {
      messageContainer.innerHTML = '<p>関連案件の情報を読み込み中...</p>';
      const query = `$id = "${currentRecordCaseId}"`;
      
      // Debug logs
      console.log('現在のレコードID:', currentRecordId);
      console.log('現在の分野:', currentCaseType);
      console.log('現在のレコードのcase_id:', currentRecordCaseId);
      console.log('対象アプリID:', targetAppId);
      console.log('検索クエリ:', query);

      const resp = await kintone.api(kUrl('/k/v1/records'), 'GET', {
        app: targetAppId,
        query: query,
        fields: ['$id']
      });

      const relatedRecords = resp.records || [];

      if (relatedRecords.length === 0) {
        messageContainer.innerHTML = `<p>関連案件は見つかりませんでした。</p>`;
      } else {
        const relatedRecordId = relatedRecords[0].$id.value;
        const iframeUrl = `${location.origin}/k/${targetAppId}/show#record=${relatedRecordId}`;

        const iframe = document.createElement('iframe');
        iframe.src = iframeUrl;
        iframe.width = '100%';
        iframe.height = IFRAME_HEIGHT;
        iframe.style.border = 'none';
        iframe.style.display = 'block';

        iframeContainer.innerHTML = ''; // メッセージコンテナとは別にiframeコンテナを使用
        iframeContainer.appendChild(iframe);
        messageContainer.innerHTML = ''; // 成功したらメッセージをクリア
        console.log(`関連案件をiframeで表示しました: ${iframeUrl}`);
      }
    } catch (e) {
      console.error('関連レコード取得エラー:', e);
      messageContainer.innerHTML = `<p style="color:#c00;">関連案件の取得中にエラーが発生しました: ${e.message || JSON.stringify(e)}</p>`;
    }

    return event;
  });
})();