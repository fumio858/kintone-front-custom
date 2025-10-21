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

  const DISPLAY_FIELD_CODE = 'タイトル'; // 関連レコードから表示したいフィールド

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
    spaceElement.style.padding = '10px';
    spaceElement.style.border = '1px solid #e3e7e8';
    spaceElement.style.borderRadius = '6px';
    spaceElement.style.backgroundColor = '#f7f9fa';

    if (!currentCaseType) {
      spaceElement.innerHTML = '<p style="color:#c00;">分野が設定されていません。関連レコードを表示できません。</p>';
      return event;
    }

    if (!currentRecordCaseId) {
      spaceElement.innerHTML = '<p style="color:#c00;">現在のレコードのcase_idが設定されていません。関連レコードを表示できません。</p>';
      return event;
    }

    const targetAppId = CASE_TYPE_TO_APP_ID_MAP[currentCaseType];

    if (!targetAppId) {
      spaceElement.innerHTML = `<p>分野 '${currentCaseType}' に対応するアプリが見つかりません。</p>`;
      return event;
    }

    // 関連レコードの取得
    try {
      spaceElement.innerHTML = '<p>関連レコードを読み込み中...</p>';
      // クエリを修正: 関連アプリのレコードIDが現在のレコードのcase_idと一致するものを検索
      const query = `$id = "${currentRecordCaseId}"`; // レコードIDは数値だが、kintone APIは文字列として受け入れる
      
      // Debug logs
      console.log('現在のレコードID:', currentRecordId); // For context
      console.log('現在の分野:', currentCaseType);
      console.log('現在のレコードのcase_id:', currentRecordCaseId); // New log
      console.log('対象アプリID:', targetAppId);
      console.log('検索クエリ:', query); // New log

      const resp = await kintone.api(kUrl('/k/v1/records'), 'GET', {
        app: targetAppId,
        query: query,
        fields: ['$id', DISPLAY_FIELD_CODE] // レコードIDと表示フィールドを取得
      });

      const relatedRecords = resp.records || [];

      if (relatedRecords.length === 0) {
        spaceElement.innerHTML = `<p>関連レコードは見つかりませんでした。</p>`;
      } else {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        ul.style.margin = '0';

        relatedRecords.forEach(relRecord => {
          const li = document.createElement('li');
          li.style.padding = '5px';

          const recordId = relRecord.$id.value;
          const displayValue = relRecord[DISPLAY_FIELD_CODE]?.value || '(タイトルなし)';
          const link = document.createElement('a');
          link.href = `${location.origin}/k/${targetAppId}/show#record=${recordId}`;
          link.target = '_blank'; // 新しいタブで開く
          link.textContent = displayValue;
          link.style.textDecoration = 'none';
          link.style.color = '#3598db';

          li.appendChild(link);
          ul.appendChild(li);
        });
        spaceElement.innerHTML = ''; // ローディングメッセージをクリア
        spaceElement.appendChild(ul);
      }
    } catch (e) {
      console.error('関連レコード取得エラー:', e);
      spaceElement.innerHTML = `<p style="color:#c00;">関連レコードの取得中にエラーが発生しました: ${e.message || JSON.stringify(e)}</p>`;
    }

    return event;
  });
})();