(function() {
  'use strict';

  // ==== 設定ここから ====
  const TASK_APP_ID = 23; // タスクアプリのID
  const CASE_TYPE_FIELD_CODE = 'case_type'; // 分野フィールドのフィールドコード

  // 分野に応じた色定義
  const CATEGORY_COLORS = {
    '刑事事件': '#FFDCDC', // 薄い赤
    '交通事故': '#DCEEFF', // 薄い青
    '刑事交通以外': '#DCFFDC', // 薄い緑
    '': '#F0F0F0', // 分野が空の場合のデフォルト色
    'その他': '#F0F0F0' // その他、または未定義の場合
  };
  // ==== 設定ここまで ====

  // kintone API URLヘルパー
  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  // カレンダービューが表示されたときに実行
  kintone.events.on(['app.record.index.show'], async (event) => {
    // カレンダービューかどうかを判定
    // HTML構造からカレンダービューの特定の要素が存在するかで判断
    const calendarContainer = document.querySelector('.calendar-gaia');
    if (!calendarContainer) {
      return event; // カレンダービューでなければ何もしない
    }

    console.log('Calendar view detected. Applying color coding...');

    const taskItems = document.querySelectorAll('.calendar-record-gaia');
    if (taskItems.length === 0) {
      console.log('No task items found on calendar.');
      return event;
    }

    const recordIds = new Set();
    taskItems.forEach(item => {
      const anchor = item.querySelector('a');
      if (anchor) {
        const match = anchor.href.match(/record=(\d+)/);
        if (match && match[1]) {
          recordIds.add(match[1]);
        }
      }
    });

    if (recordIds.size === 0) {
      console.log('No record IDs found from calendar items.');
      return event;
    }

    const idsArray = Array.from(recordIds);
    console.log(`Fetching details for ${idsArray.length} records.`);

    try {
      // レコードを一括取得
      const query = `$id in (${idsArray.join(',')})`;
      const resp = await kintone.api(kUrl('/k/v1/records'), 'GET', {
        app: TASK_APP_ID,
        query: query,
        fields: ['$id', CASE_TYPE_FIELD_CODE] // 必要なフィールドのみ取得
      });

      const recordsMap = new Map();
      (resp.records || []).forEach(record => {
        recordsMap.set(record.$id.value, record[CASE_TYPE_FIELD_CODE]?.value || '');
      });

      // 各タスクアイテムに色を適用
      taskItems.forEach(item => {
        const anchor = item.querySelector('a');
        if (anchor) {
          const match = anchor.href.match(/record=(\d+)/);
          if (match && match[1]) {
            const recordId = match[1];
            const caseType = recordsMap.get(recordId);
            const color = CATEGORY_COLORS[caseType] || CATEGORY_COLORS['その他']; // デフォルト色も考慮

            if (color) {
              item.style.backgroundColor = color;
              item.style.padding = '2px 4px'; // 見栄え調整
              item.style.borderRadius = '3px'; // 見栄え調整
            }
          }
        }
      });
      console.log('Color coding applied successfully.');

    } catch (e) {
      console.error('カレンダータスクの色付けエラー:', e);
    }

    return event;
  });
})();
