(function() {
  'use strict';

  // 「被疑者と相談者が同じ」にチェックが入ったとき
  kintone.events.on(
    [
      'app.record.create.change.same_person',
      'app.record.edit.change.same_person'
    ],
    function(event) {
      const record = event.record;
      const checked = record.same_person.value.includes('はい');

      if (checked) {
        // ✅ チェックON時：コピー
        record.contractor_name.value = record.suspect_name.value;
        record.contractor_name_kana.value = record.suspect_name_kana.value;
      } else {
        // ❎ チェックOFF時：「同一だった場合のみ」クリア
        if (
          record.contractor_name.value === record.suspect_name.value &&
          record.contractor_name_kana.value === record.suspect_name_kana.value
        ) {
          record.contractor_name.value = '';
          record.contractor_name_kana.value = '';
        }
      }

      return event;
    }
  );

  // 被疑者名またはふりがなが変更された時も自動で同期
  kintone.events.on(
    [
      'app.record.create.change.suspect_name',
      'app.record.create.change.suspect_name_kana',
      'app.record.edit.change.suspect_name',
      'app.record.edit.change.suspect_name_kana'
    ],
    function(event) {
      const record = event.record;
      const checked = record.same_person.value.includes('はい');

      if (checked) {
        record.contractor_name.value = record.suspect_name.value;
        record.contractor_name_kana.value = record.suspect_name_kana.value;
      }

      return event;
    }
  );
})();
