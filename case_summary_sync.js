(function() {
  'use strict';

  const TARGET_APPS = [22, 26, 55];
  const AGGREGATE_APP_ID = 58; // ← 集計アプリのID

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

      // ✅ 各値を適切な構造でセット
      const recordData = {
        [FIELD_APP_ID]: { value: String(appId) },
        [FIELD_RECORD_ID]: { value: String(recordId) },
        [FIELD_CASE_GROUP]: { value: record[FIELD_CASE_GROUP]?.value || '' },
        [FIELD_STAFF]: {
          value: (record[FIELD_STAFF]?.value || []).map(u => ({ code: u.code }))
        },
      };

      console.log('送信データ:', JSON.stringify(recordData, null, 2));

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
