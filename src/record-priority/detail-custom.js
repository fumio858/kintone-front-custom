(function () {
  'use strict';

  const TITLE_FIELD = 'case_title';
  const NOTES_FIELD = 'special_notes';
  const OVERVIEW_FIELD = 'description';

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;
    const recordId = kintone.app.record.getId(); // 現在のレコードID

    const container = document.querySelector('.container-gaia');
    if (container) {
      // FOUC対策：一度ロード済みクラスを削除し、カスタムクラスを付与
      container.classList.remove('custom-header-loaded');
      if (!container.classList.contains('report-front-custom')) {
        container.classList.add('report-front-custom');
      }
    }

    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    const firstDiv = toolbar?.querySelector('div:first-child');
    if (!firstDiv) {
      if (container) container.classList.add('custom-header-loaded'); // 表示を確定
      return event;
    }

    // 親ボックス（なければ作る）
    let headerBox = firstDiv.querySelector('.custom-headerbox');
    if (!headerBox) {
      headerBox = document.createElement('div');
      headerBox.className = 'custom-headerbox';
      firstDiv.insertBefore(headerBox, firstDiv.firstChild);
    }

    // すでに同じレコードIDを描画済みなら何もしない
    if (headerBox.dataset.recordId === String(recordId)) {
      if (container) container.classList.add('custom-header-loaded'); // 表示を確定
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

    // 特記事項と概要のコンテナ
    const infoGrid = document.createElement('div');
    infoGrid.className = 'custom-info-grid';

    const notesVal = (record[NOTES_FIELD]?.value ?? '').trim();
    const overviewVal = (record[OVERVIEW_FIELD]?.value ?? '').trim();

    // コンテナを追加（どちらかの値が存在する場合のみ）
    if (notesVal || overviewVal) {
      headerBox.appendChild(infoGrid);
    }

    // 特記事項
    if (notesVal) {
      const notesItem = document.createElement('div');
      notesItem.className = 'custom-info-item';
      // HTMLとして挿入するため、改行を<br>に変換
      notesItem.innerHTML = `<span class="custom-info-label">⚠️ 特記：</span><span class="custom-info-value custom-notes-value">${notesVal.replace(/\n/g, '<br>')}</span>`;
      infoGrid.appendChild(notesItem);
    }

    // 概要
    if (overviewVal) {
      const overviewItem = document.createElement('div');
      overviewItem.className = 'custom-info-item';
      // HTMLとして挿入するため、改行を<br>に変換
      overviewItem.innerHTML = `<span class="custom-info-label">📄 概要：</span><span class="custom-info-value">${overviewVal.replace(/\n/g, '<br>')}</span>`;
      infoGrid.appendChild(overviewItem);
    }

    // FOUC対策：処理完了を通知するクラスを付与
    if (container) container.classList.add('custom-header-loaded');

    // --- プロセス管理ボタンの移動処理 ---
    const moveStatusBar = () => {
      const statusBar = document.querySelector('.gaia-app-statusbar');
      const toolbarMenu = document.querySelector('.gaia-argoui-app-toolbar-menu');

      if (statusBar && toolbarMenu) {
        // toolbarMenuの末尾にstatusBarを移動
        toolbarMenu.appendChild(statusBar);
      }
    };

    // MutationObserverで要素の出現を待つ
    const observer = new MutationObserver((mutations, obs) => {
      const statusBar = document.querySelector('.gaia-app-statusbar');
      if (statusBar) {
        moveStatusBar();
        obs.disconnect(); // 目的の要素を見つけたら監視を終了
      }
    });

    // 監視を開始
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return event;
  });
})();
