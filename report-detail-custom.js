(function () {
  'use strict';

  const TITLE_FIELD = 'タイトル';
  const NOTES_FIELD = '特記事項';
  const OVERVIEW_FIELD = '概要';

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;
    const recordId = kintone.app.record.getId(); // 現在のレコードID

    // ====== ここは前回どおり：メインコンテナへクラス ======
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
    }

    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    const firstDiv = toolbar?.querySelector('div:first-child');
    if (!firstDiv) return event;

    // 親ボックス（なければ作る）
    let headerBox = firstDiv.querySelector('.custom-headerbox');
    if (!headerBox) {
      headerBox = document.createElement('div');
      headerBox.className = 'custom-headerbox';
      firstDiv.insertBefore(headerBox, firstDiv.firstChild);
    }

    // すでに同じレコードIDを描画済みなら何もしない（不要ならこのifごと削除OK）
    if (headerBox.dataset.recordId === String(recordId)) {
      return event;
    }
    headerBox.dataset.recordId = String(recordId);

    // 中身を作り直す（毎回更新）
    headerBox.innerHTML = '';

    // タイトル
    const titleEl = document.createElement('div');
    titleEl.className = 'custom-title';
    titleEl.textContent = (record[TITLE_FIELD]?.value ?? '(タイトル未設定)');
    headerBox.appendChild(titleEl);

    // 特記事項（付箋風）
    const notesVal = (record[NOTES_FIELD]?.value ?? '').trim();
    if (notesVal) {
      const note = document.createElement('div');
      note.className = 'custom-sticky-note';
      note.textContent = notesVal;
      headerBox.appendChild(note);
    }

    // 概要（アコーディオン）
    const overviewVal = (record[OVERVIEW_FIELD]?.value ?? '').trim();
    if (overviewVal) {
      const details = document.createElement('details');
      details.className = 'custom-accordion'; // 既定は閉じる。開きたければ details.open = true;

      const summary = document.createElement('summary');
      summary.className = 'custom-accordion-summary';
      summary.textContent = '概要';

      const body = document.createElement('div');
      body.className = 'custom-accordion-body';
      body.innerHTML = overviewVal.replace(/\n/g, '<br>');

      details.appendChild(summary);
      details.appendChild(body);
      headerBox.appendChild(details);
    }

    return event;
  });
})();
