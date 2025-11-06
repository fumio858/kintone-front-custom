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

    // --- プロセス管理の移動とステータス表示の順序調整 ---
    const moveStatusBar = () => {
      const statusBar = document.querySelector('.gaia-app-statusbar');
      const toolbarMenu = document.querySelector('.gaia-argoui-app-toolbar-menu');

      // statusBarがtoolbarMenuの子要素でなければ移動
      if (statusBar && toolbarMenu && statusBar.parentNode !== toolbarMenu) {
        toolbarMenu.appendChild(statusBar);
        // Flexboxでレイアウトを調整
        statusBar.style.paddingLeft = '16px';
      }

      // ステータス表示（作業者など）をアクションボタンの上に移動
      if (statusBar) {
        const statusMenu = statusBar.querySelector('.gaia-app-statusbar-statusmenu');
        const actions = statusBar.querySelector('.gaia-app-statusbar-actions');

        // statusMenuとactionsが存在する場合、actionsの前にstatusMenuを配置
        if (statusMenu && actions) {
          statusBar.insertBefore(statusMenu, actions);
        }
      }
    };

    // MutationObserverでDOMの変更を常に監視
    const observer = new MutationObserver((mutations) => {
      // DOM変更があるたびに移動処理を試みる
      moveStatusBar();
    });

    // 監視を開始
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初回表示時にも一度実行
    moveStatusBar();

    return event;
  });
})();
