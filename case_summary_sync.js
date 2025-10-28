(function() {
  'use strict';

  // ==== 設定ここから ====
  const TARGET_APPS = [22, 26, 55]; // 監視対象アプリ
  const AGGREGATE_APP_ID = 58; // 集計アプリのIDに置き換えてください

  // 集計先フィールドコード
  const FIELD_APP_ID = 'app_id';
  const FIELD_RECORD_ID = 'record_id';
  const FIELD_CASE_GROUP = 'case_group';
  const FIELD_STAFF = 'staff';
  // ==== 設定ここまで ====

  // 対象アプリのみ動作
  if (!TARGET_APPS.includes(kintone.app.getId())) return;

  // 登録・更新時イベント
  const events = [
    'app.record.create.submit.success',
    'app.record.edit.submit.success'
  ];

  kintone.events.on(events, async (event) => {
    try {
      const record = event.record;
      const appId = kintone.app.getId();
      const recordId = event.recordId;

      // 集計用データ作成
      const data = {
        [FIELD_APP_ID]: { value: String(appId) },
        [FIELD_RECORD_ID]: { value: String(recordId) },
        [FIELD_CASE_GROUP]: { value: record.case_group?.value || '' },
        [FIELD_STAFF]: { value: record.staff?.value || '' },
      };

      // 集計アプリに保存
      await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
        app: AGGREGATE_APP_ID,
        record: data
      });

      console.log('✅ 集計アプリに登録しました:', data);
    } catch (err) {
      console.error('❌ 集計アプリ登録エラー:', err);
    }

    return event;
  });
})();
