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

    // --- プロセス管理とステータス表示の移動と維持 ---
    const moveElements = () => {
      const toolbarMenu = document.querySelector('.gaia-argoui-app-toolbar-menu');
      if (!toolbarMenu) return;

      // 1. アクションボタンを移動 (グローバルセレクタを維持)
      const statusBar = document.querySelector('.gaia-app-statusbar');
      if (statusBar && statusBar.parentNode !== toolbarMenu) {
        toolbarMenu.appendChild(statusBar);
        statusBar.style.paddingLeft = '16px';
      }

      // 2. ステータス表示を移動
      const statusMenu = document.querySelector('.control-gaia .gaia-app-statusbar-statusmenu');
      if (statusMenu && statusMenu.parentNode !== toolbarMenu) {
        // 移動先のアクションボタン(statusBar)は、ツールバー内にあるはず
        const movedStatusBar = toolbarMenu.querySelector('.gaia-app-statusbar');
        if (movedStatusBar) {
            toolbarMenu.insertBefore(statusMenu, movedStatusBar);
            // スタイルを調整
            statusMenu.style.paddingLeft = '16px';
            statusMenu.style.borderRight = '1px solid #e3e3e3';
            statusMenu.style.marginRight = '10px';
            statusMenu.style.paddingRight = '10px';
        }
      }

      // 3. アクションボタンのスタイルを調整
      const actionElements = document.querySelectorAll('.gaia-app-statusbar-action');
      actionElements.forEach(el => {
        const labelElement = el.querySelector('.gaia-app-statusbar-action-label');
        if (labelElement) {
          const title = labelElement.getAttribute('title');
          if (title === '現在の作業者を変更') {
            el.style.backgroundColor = '#ecf6fb';
            el.style.borderRadius = '8px';
            el.style.border = 'none';
          } else if (title === '案件終了') {
            el.style.backgroundColor = '#ffeeec';
            el.style.color = '#c0392b';
            el.style.borderColor = '#c0392b';
          }
        }
      });
    };

    // MutationObserverでDOMの変更を常に監視
    const observer = new MutationObserver(() => {
      moveElements();
    });

    // 監視を開始
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初回表示時にも一度実行
    moveElements();

    return event;
  });
})();
