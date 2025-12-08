import { kUrl } from '../common/kintone-api';
import { TASK_APP_ID, APP_ID_TO_CASE_TYPE, TASK_CASE_TYPE } from '../common/kintone-constants';

'use strict';

// ==== 設定ここから ====
const TARGET_APP_IDS = [TASK_APP_ID]; // タスクアプリのID
const CASE_TYPE_FIELD_CODE = 'case_type'; // 分野フィールドのフィールドコード
const TASK_STATUS_FIELD_CODE = 'task_status'; // タスクステータスフィールドのフィールドコード
const TASK_STATUS_COMPLETED = '完了';
const COMPLETED_CLASS = 'task-completed';
const CASE_ID_FIELD_CODE = 'case_id'; // ★追加: 案件IDを格納するフィールド

// 分野に応じた色定義
const CATEGORY_COLORS = {
  [TASK_CASE_TYPE.CRIMINAL]: '#FFDCDC',
  [TASK_CASE_TYPE.TRAFFIC]: '#DCEEFF',
  [TASK_CASE_TYPE.OTHER]: '#fff4ce',
  '': '#F0F0F0',
  'その他': '#F0F0F0'
};

// ★追加: 分野名から、関連元アプリIDへの変換表
const CASE_TYPE_TO_APP_ID_MAP = Object.fromEntries(
  Object.entries(APP_ID_TO_CASE_TYPE).map(([appId, caseType]) => [caseType, Number(appId)])
);
// ==== 設定ここまで ====

kintone.events.on(['app.record.index.show'], async (event) => {
  const calendarContainer = document.querySelector('.calendar-gaia');
  if (!calendarContainer) return event;

  console.log('Calendar view detected. Applying color coding and link modification...');

  const calendarItems = document.querySelectorAll('.calendar-record-gaia');
  if (calendarItems.length === 0) return event;

  const appRecordIds = new Map();
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

  if (appRecordIds.size === 0) return event;

  const recordsDataMap = new Map();

  for (const [appId, recordIdsSet] of appRecordIds.entries()) {
    const idsArray = Array.from(recordIdsSet);
    if (idsArray.length === 0) continue;

    try {
      const query = `$id in (${idsArray.join(',')})`;
      const resp = await kintone.api(kUrl('/k/v1/records.json'), 'GET', {
        app: appId,
        query: query,
        // ★変更: 案件IDフィールドも取得
        fields: ['$id', CASE_TYPE_FIELD_CODE, TASK_STATUS_FIELD_CODE, CASE_ID_FIELD_CODE]
      });

      (resp.records || []).forEach(record => {
        const key = `${appId}_${record.$id.value}`;
        // ★変更: 案件IDも保存
        recordsDataMap.set(key, {
          caseType: record[CASE_TYPE_FIELD_CODE]?.value || '',
          taskStatus: record[TASK_STATUS_FIELD_CODE]?.value,
          caseId: record[CASE_ID_FIELD_CODE]?.value
        });
      });
    } catch (e) {
      console.error(`カレンダーアイテム取得エラー (App ID: ${appId}):`, e);
    }
  }

  calendarItems.forEach(item => {
    const anchor = item.querySelector('a');
    if (anchor) {
      const match = anchor.href.match(/\/k\/(\d+)\/show#record=(\d+)/);
      if (match && match[1] && match[2]) {
        const appId = parseInt(match[1], 10);
        const recordId = match[2];
        const key = `${appId}_${recordId}`;

        const recordData = recordsDataMap.get(key);
        if (!recordData) return;

        // ★変更: caseIdも取得
        const { caseType, taskStatus, caseId } = recordData;
        const color = CATEGORY_COLORS[caseType] || CATEGORY_COLORS['その他'];

        if (color) {
          item.style.backgroundColor = color;
          item.style.padding = '2px 6px';
          item.style.margin = '2px';
          item.style.borderRadius = '3px';
          item.style.listStyle = 'none';
        }

        if (taskStatus === TASK_STATUS_COMPLETED) {
          item.classList.add(COMPLETED_CLASS);
        }

        // --- ★ここからリンク書き換え処理 ---
        const caseAppId = CASE_TYPE_TO_APP_ID_MAP[caseType];
        if (caseAppId && caseId) {
          anchor.href = `/k/${caseAppId}/show#record=${caseId}`;
          console.log(`Link rewritten for task ${recordId} to case ${caseId} in app ${caseAppId}`);
        }
        // --- リンク書き換え処理ここまで ---
      }
    }
  });
  console.log('Color coding and link modification applied successfully.');

  return event;
});