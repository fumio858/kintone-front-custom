(function() {
  'use strict';

  // ==== 設定ここから ====
  const CASE_TYPE_FIELD_CODE = 'case_type'; // 現在のレコードの分野フィールド
  const RELATED_RECORDS_SPACE_FIELD_CODE = 'related_records_space'; // 関連レコードを表示するスペースフィールド
  const CURRENT_RECORD_CASE_ID_FIELD = 'case_id'; // 現在のレコードのcase_idフィールド

  // 分野の値と、関連レコードを取得するアプリIDの対応
  const CASE_TYPE_TO_APP_ID_MAP = {
    '刑事事件': 22,
    '交通事故': 26,
    '刑事交通以外': 55,
  };

  const DISPLAY_FIELD_CODE = '案件事件名'; // 関連レコードから表示したいフィールド (今回はiframeなので直接は使わないが、取得はしておく)
  const IFRAME_HEIGHT = '50vh'; // iframeの高さ

  // ==== 設定ここまで ====

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  kintone.events.on(['app.record.detail.show'], async (event) => {
    const record = event.record;
    const currentRecordId = kintone.app.record.getId(); // 現在のレコードID (これは表示用)
    const currentCaseType = record[CASE_TYPE_FIELD_CODE]?.value; // 現在のレコードの分野
    const currentRecordCaseId = record[CURRENT_RECORD_CASE_ID_FIELD]?.value; // 現在のレコードのcase_idフィールドの値

    const spaceElement = kintone.app.record.getSpaceElement(RELATED_RECORDS_SPACE_FIELD_CODE);
    if (!spaceElement) {
      console.warn(`スペースフィールド '${RELATED_RECORDS_SPACE_FIELD_CODE}' が見つかりません。`);
      return event;
    }

    // スペースフィールドをクリア
    spaceElement.innerHTML = '';
    spaceElement.style.padding = '0'; // iframeなのでパディングは不要
    spaceElement.style.border = 'none'; // iframeなのでボーダーは不要
    spaceElement.style.backgroundColor = 'transparent'; // iframeなので背景色も不要

    if (!currentCaseType) {
      spaceElement.innerHTML = '<p style="color:#c00; padding:10px;">分野が設定されていません。関連レコードを表示できません。</p>';
      return event;
    }

    if (!currentRecordCaseId) {
      spaceElement.innerHTML = '<p style="color:#c00; padding:10px;">現在のレコードのcase_idが設定されていません。関連レコードを表示できません。</p>';
      return event;
    }

    const targetAppId = CASE_TYPE_TO_APP_ID_MAP[currentCaseType];

    if (!targetAppId) {
      spaceElement.innerHTML = `<p style="padding:10px;">分野 '${currentCaseType}' に対応するアプリが見つかりません。</p>`;
      return event;
    }

    // 関連レコードの取得 (iframeのURLを生成するためにレコードIDが必要)
    try {
      spaceElement.innerHTML = '<p style="padding:10px;">関連案件の情報を読み込み中...</p>';
      const query = `$id = "${currentRecordCaseId}"`; // 関連アプリのレコードIDが現在のレコードのcase_idと一致するものを検索
      
      // Debug logs (残しておくか削除するかはユーザーの判断)
      console.log('現在のレコードID:', currentRecordId);
      console.log('現在の分野:', currentCaseType);
      console.log('現在のレコードのcase_id:', currentRecordCaseId);
      console.log('対象アプリID:', targetAppId);
      console.log('検索クエリ:', query);

      const resp = await kintone.api(kUrl('/k/v1/records'), 'GET', {
        app: targetAppId,
        query: query,
        fields: ['$id'] // iframeなので$idのみでOK
      });

      const relatedRecords = resp.records || [];

      if (relatedRecords.length === 0) {
        spaceElement.innerHTML = `<p style="padding:10px;">関連案件は見つかりませんでした。</p>`;
      } else {
        const relatedRecordId = relatedRecords[0].$id.value; // 最初の関連レコードを使用
        const iframeUrl = `${location.origin}/k/${targetAppId}/show#record=${relatedRecordId}`;

        const iframe = document.createElement('iframe');
        iframe.src = iframeUrl;
        iframe.width = '100%';
        iframe.height = IFRAME_HEIGHT;
        iframe.style.border = 'none'; // iframeのボーダーをなくす
        iframe.style.display = 'block'; // ブロック要素として表示

        spaceElement.innerHTML = ''; // ローディングメッセージをクリア
        spaceElement.appendChild(iframe);
        console.log(`関連案件をiframeで表示しました: ${iframeUrl}`);
      }
    } catch (e) {
      console.error('関連レコード取得エラー:', e);
      spaceElement.innerHTML = `<p style="color:#c00; padding:10px;">関連案件の取得中にエラーが発生しました: ${e.message || JSON.stringify(e)}</p>`;
    }

    return event;
  });
})();
