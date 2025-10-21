(function() {
  'use strict';

  // ==== 設定ここから ====
  const TARGET_APP_IDS = [23, 45]; // タスクアプリとスケジュールアプリのID
  const CASE_TYPE_FIELD_CODE = 'case_type'; // 分野フィールドのフィールドコード

  // 分野に応じた色定義
  const CATEGORY_COLORS = {
    '刑事事件': '#DCEEFF',
    '交通事故': '#FFDCDC',
    '刑事交通以外': '#fdfbc7',
    '': '#F0F0F0', // 分野が空の場合のデフォルト色
    'その他': '#F0F0F0' // その他、または未定義の場合
  };
  // ==== 設定ここまで ====

  // kintone API URLヘルパー
  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  // カレンダービューが表示されたときに実行
  kintone.events.on(['app.record.index.show'], async (event) => {
    const calendarContainer = document.querySelector('.calendar-gaia');
    if (!calendarContainer) {
      return event; // カレンダービューでなければ何もしない
    }

    console.log('Calendar view detected. Applying color coding...');

    const calendarItems = document.querySelectorAll('.calendar-record-gaia');
    if (calendarItems.length === 0) {
      console.log('No calendar items found.');
      return event;
    }

    // アプリIDごとにレコードIDを収集
    const appRecordIds = new Map(); // Map<appId, Set<recordId>>
    calendarItems.forEach(item => {
      const anchor = item.querySelector('a');
      if (anchor) {
        const match = anchor.href.match(/\/k\/(\d+)\/show#record=(\d+)/);
        if (match && match[1] && match[2]) {
          const appId = parseInt(match[1], 10);
          const recordId = match[2];

          if (TARGET_APP_IDS.includes(appId)) {
            if (!appRecordIds.has(appId)) {
              appRecordIds.set(appId, new Set());
            }
            appRecordIds.get(appId).add(recordId);
          }
        }
      }
    });

    if (appRecordIds.size === 0) {
      console.log('No relevant app record IDs found from calendar items.');
      return event;
    }

    // 取得したレコード情報を格納するマップ (key: appId_recordId, value: caseType)
    const recordsDataMap = new Map(); // Map<string, string>

    // 各アプリごとにレコードを一括取得
    for (const [appId, recordIdsSet] of appRecordIds.entries()) {
      const idsArray = Array.from(recordIdsSet);
      if (idsArray.length === 0) continue;

      console.log(`Fetching details for ${idsArray.length} records from App ID: ${appId}`);

      try {
        const query = `$id in (${idsArray.join(',')})`;
        const resp = await kintone.api(kUrl('/k/v1/records'), 'GET', {
          app: appId,
          query: query,
          fields: ['$id', CASE_TYPE_FIELD_CODE] // 必要なフィールドのみ取得
        });

        (resp.records || []).forEach(record => {
          const key = `${appId}_${record.$id.value}`;
          recordsDataMap.set(key, record[CASE_TYPE_FIELD_CODE]?.value || '');
        });
      } catch (e) {
        console.error(`カレンダーアイテム取得エラー (App ID: ${appId}):`, e);
      }
    }

    // 各カレンダーアイテムに色を適用
    calendarItems.forEach(item => {
      const anchor = item.querySelector('a');
      if (anchor) {
        const match = anchor.href.match(/\/k\/(\d+)\/show#record=(\d+)/);
        if (match && match[1] && match[2]) {
          const appId = parseInt(match[1], 10);
          const recordId = match[2];
          const key = `${appId}_${recordId}`;

          const caseType = recordsDataMap.get(key);
          const color = CATEGORY_COLORS[caseType] || CATEGORY_COLORS['その他']; // デフォルト色も考慮

          if (color) {
            item.style.backgroundColor = color;
            item.style.padding = '2px 4px'; // 見栄え調整
            item.style.margin = '2px'; // 見栄え調整
            item.style.borderRadius = '3px'; // 見栄え調整
          }
        }
      }
    });
    console.log('Color coding applied successfully for multiple apps.');

    return event;
  });
})();