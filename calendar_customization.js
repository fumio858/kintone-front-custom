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
      // return event; // Don't return here, still need to adjust height even if no tasks
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
      // return event; // Don't return here, still need to adjust height even if no tasks
    }

    const idsArray = Array.from(recordIds);
    if (idsArray.length > 0) { // Only fetch if there are IDs
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
                item.style.margin = '2px'; // 見栄え調整
                item.style.borderRadius = '3px'; // 見栄え調整
              }
            }
          }
        });
        console.log('Color coding applied successfully.');

      } catch (e) {
        console.error('カレンダータスクの色付けエラー:', e);
      }
    }


    // カレンダー行の高さ調整
    adjustCalendarRowHeight();

    return event;
  });

  // ウィンドウのリサイズ時にも高さを調整
  window.addEventListener('resize', adjustCalendarRowHeight);

  function adjustCalendarRowHeight() {
    const calendarContainer = document.querySelector('.calendar-gaia');
    if (!calendarContainer) return;

    const calendarMenu = document.querySelector('.calendar-menu-gaia');
    const calendarHeader = document.querySelector('.calendar-header-gaia');
    const calendarRows = document.querySelectorAll('.calendar-row-gaia');

    if (!calendarRows || calendarRows.length === 0) return;

    // kintoneのヘッダーやフッター、サイドバーなどを考慮した全体の利用可能高さを取得
    // window.innerHeightから、kintoneの固定ヘッダーやフッターの高さを引く
    // 正確な値は環境依存だが、ここでは概算で調整
    // kintoneのヘッダーは .gaia-header-md
    // kintoneのフッターは .gaia-footer-md (存在しない場合もある)
    const kintoneHeaderEl = document.querySelector('.gaia-header-md');
    const kintoneHeaderHeight = kintoneHeaderEl ? kintoneHeaderEl.offsetHeight : 0;

    // kintoneのフッターは通常ないが、念のため
    const kintoneFooterEl = document.querySelector('.gaia-footer-md');
    const kintoneFooterHeight = kintoneFooterEl ? kintoneFooterEl.offsetHeight : 0;

    const kintoneSpaceBelowCalendar = 20; // カレンダーの下に少し余白を持たせる

    let availableHeight = window.innerHeight - kintoneHeaderHeight - kintoneFooterHeight - kintoneSpaceBelowCalendar;

    // カレンダーメニューとヘッダーの高さを引く
    if (calendarMenu) availableHeight -= calendarMenu.offsetHeight;
    if (calendarHeader) availableHeight -= calendarHeader.offsetHeight;

    // 各行に割り当てる高さを計算
    // 最小高さを設定して、極端に小さくならないようにする
    const minRowHeight = 50; // 最小50px
    let rowHeight = Math.floor(availableHeight / calendarRows.length);
    if (rowHeight < minRowHeight) rowHeight = minRowHeight;


    // スタイルを適用
    // 既存のスタイルタグがあれば更新、なければ新規作成
    let styleTag = document.getElementById('calendar-row-height-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'calendar-row-height-style';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `.calendar-row-gaia { height: ${rowHeight}px !important; }`;

    console.log(`Calendar row height adjusted to ${rowHeight}px.`);
  }

})();