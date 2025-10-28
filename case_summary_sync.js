(function () {
  'use strict';

  const TARGET_APPS = [22, 26, 55];
  const AGGREGATE_APP_ID = 58;

  const FIELD_APP_ID = 'app_id';
  const FIELD_RECORD_ID = 'record_id';
  const FIELD_CASE_GROUP = 'case_group';
  const FIELD_STAFF = 'staff'; // 文字列（1行）

  if (!TARGET_APPS.includes(kintone.app.getId())) return;

  const events = ['app.record.create.submit.success', 'app.record.edit.submit.success'];

  kintone.events.on(events, async (event) => {
    try {
      const record = event.record;
      const appId = kintone.app.getId();
      const recordId = event.recordId;

      // スタッフ名（カンマ区切り）
      const staffNames = (record[FIELD_STAFF]?.value || [])
        .map(u => u.name)
        .join(', ');

      // 共通データ
      const recordData = {
        [FIELD_APP_ID]: { value: String(appId) },
        [FIELD_RECORD_ID]: { value: String(recordId) },
        [FIELD_CASE_GROUP]: { value: record[FIELD_CASE_GROUP]?.value || '' },
        [FIELD_STAFF]: { value: staffNames },
      };

      // --- 既存チェック ---
      const query = `${FIELD_APP_ID} = "${appId}" and ${FIELD_RECORD_ID} = "${recordId}"`;
      const resp = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: AGGREGATE_APP_ID,
        query: query
      });

      if (resp.records.length > 0) {
        // 既存 → 更新
        const existingId = resp.records[0].$id.value;
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: AGGREGATE_APP_ID,
          id: existingId,
          record: recordData
        });
        console.log(`🌀 更新しました（ID:${existingId}）`);
      } else {
        // 新規 → 追加
        await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
          app: AGGREGATE_APP_ID,
          record: recordData
        });
        console.log('✅ 新規登録しました');
      }

    } catch (err) {
      console.error('❌ 集計アプリ登録エラー:', err);
    }

    return event;
  });
})();
