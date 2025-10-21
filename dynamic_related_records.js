(function() {
  'use strict';

  // ==== 設定ここから ====
  // 現在のアプリ（タスク/スケジュール）のIDはkintone.app.getId()で取得
  const CASE_TYPE_FIELD_CODE = 'case_type'; // 現在のレコードの分野フィールド
  const RELATED_RECORDS_SPACE_FIELD_CODE = 'related_records_space'; // 関連レコードを表示するスペースフィールド

  // 分野の値と、関連レコードを取得するアプリIDの対応
  const CASE_TYPE_TO_APP_ID_MAP = {
    '刑事事件': 22,
    '交通事故': 26,
    '刑事交通以外': 55,
  };

  const DISPLAY_FIELD_CODE = '案件事件名'; // 関連レコードから表示したいフィールド

  // ==== 設定ここまで ====

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  kintone.events.on(['app.record.detail.show'], async (event) => {
    const record = event.record;
    const currentRecordId = kintone.app.record.getId(); // 現在のレコードID
    const currentCaseType = record[CASE_TYPE_FIELD_CODE]?.value; // 現在のレコードの分野

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

    const targetAppId = CASE_TYPE_TO_APP_ID_MAP[currentCaseType];

    if (!targetAppId) {
      spaceElement.innerHTML = `<p>分野 '${currentCaseType}' に対応するアプリが見つかりません。</p>`;
      return event;
    }

    console.log('現在のレコードID:', currentRecordId);
    console.log('現在の分野:', currentCaseType);
    console.log('対象アプリID:', targetAppId);
    console.log('検索クエリ:', query); // query変数の直後
    
    // 関連レコードの取得
    try {
      spaceElement.innerHTML = '<p>関連レコードを読み込み中...</p>';
      const query = `case_id = "${currentRecordId}" order by $id asc`; // case_idが現在のレコードIDと一致するものを検索
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
          li.style.marginBottom = '5px';
          li.style.padding = '5px';
          li.style.backgroundColor = '#fff';
          li.style.border = '1px solid #eee';
          li.style.borderRadius = '4px';

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
