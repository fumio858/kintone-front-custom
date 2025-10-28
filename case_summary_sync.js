(function() {
  'use strict';

  const TARGET_APPS = [22, 26, 55];
  const AGGREGATE_APP_ID = 99; // ← 集計アプリのIDに置き換え

  const FIELD_APP_ID = 'app_id';
  const FIELD_RECORD_ID = 'record_id';
  const FIELD_CASE_GROUP = 'case_group';
  const FIELD_STAFF = 'staff';

  if (!TARGET_APPS.includes(kintone.app.getId())) return;

  const events = [
    'app.record.create.submit.success',
    'app.record.edit.submit.success'
  ];

  kintone.events.on(events, async (event) => {
    try {
      const record = event.record;
      const appId = kintone.app.getId();
      const recordId = event.recordId;

      // ✅ staffがユーザー選択フィールドの場合
      const staffValue = Array.isArray(record[FIELD_STAFF]?.value)
        ? record[FIELD_STAFF].value.map(u => ({ code: u.code }))
        : [];

      // ✅ case_groupが文字列の場合
      const caseGroupValue = record[FIELD_CASE_GROUP]?.value || '';

      // ✅ record_idが数値フィールドならNumber()に変換
      const recordData = {
        [FIELD_APP_ID]: { value: String(appId) },
        [FIELD_RECORD_ID]: { value: String(recordId) },
        [FIELD_CASE_GROUP]: { value: caseGroupValue },
        [FIELD_STAFF]: { value: staffValue },
      };

      console.log('送信データ:', recordData);

      await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
        app: AGGREGATE_APP_ID,
        record: recordData
      });

      console.log('✅ 集計アプリに登録しました');
    } catch (err) {
      console.error('❌ 集計アプリ登録エラー:', err);
    }

    return event;
  });
})();
