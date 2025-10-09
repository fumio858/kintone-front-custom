(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;

    // ====== ここは前回どおり：メインコンテナへクラス ======
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
    }

    // ====== ツールバーの最初のdivを取得 ======
    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    const firstDiv = toolbar?.querySelector('div:first-child');
    if (!firstDiv) return event;

    // ====== タイトル要素を用意（なければ作る） ======
    const TITLE_FIELD = 'タイトル';   // ← 実際のフィールドコードに合わせて変更
    const NOTES_FIELD = '特記事項';        // ← 実際のフィールドコードに合わせて変更
    const OVERVIEW_FIELD = '概要';         // ← 実際のフィールドコードに合わせて変更

    let titleEl = firstDiv.querySelector('.custom-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = 'custom-title';
      titleEl.textContent = (record[TITLE_FIELD]?.value ?? '(タイトル未設定)');
      firstDiv.appendChild(titleEl);
    }

    // ====== 見出しブロック（タイトル＋下段コンテンツ置き場） ======
    // すでにあれば再利用、なければ作ってタイトルを中へ移す
    let headerBox = firstDiv.querySelector('.custom-headerbox');
    if (!headerBox) {
      headerBox = document.createElement('div');
      headerBox.className = 'custom-headerbox';
      // headerBox を firstDiv の先頭に置く
      firstDiv.insertBefore(headerBox, firstDiv.firstChild);
      // タイトルを headerBox の先頭に移動
      headerBox.appendChild(titleEl);
    }

    // ====== 特記事項（付箋風） ======
    if (!headerBox.querySelector('.custom-sticky-note')) {
      const notesVal = (record[NOTES_FIELD]?.value ?? '').trim();
      if (notesVal) {
        const note = document.createElement('div');
        note.className = 'custom-sticky-note';
        note.textContent = notesVal;
        headerBox.appendChild(note);
      }
    }

    // ====== 概要（アコーディオン） ======
    if (!headerBox.querySelector('.custom-accordion')) {
      const overviewVal = (record[OVERVIEW_FIELD]?.value ?? '').trim();
      if (overviewVal) {
        // <details> でアコーディオン
        const details = document.createElement('details');
        details.className = 'custom-accordion';
        // 既定で閉じる（開きたい場合は details.open = true）

        const summary = document.createElement('summary');
        summary.className = 'custom-accordion-summary';
        summary.textContent = '概要';

        const body = document.createElement('div');
        body.className = 'custom-accordion-body';
        // 改行は <br> に
        body.innerHTML = overviewVal.replace(/\n/g, '<br>');

        details.appendChild(summary);
        details.appendChild(body);
        headerBox.appendChild(details);
      }
    }

    return event;
  });
})();
