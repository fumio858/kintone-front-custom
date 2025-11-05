(function() {
  'use strict';

  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    let isPopupProcessing = false; // 無限ループ防止フラグ

    // SweetAlert2ライブラリを動的にロード
    const loadSweetAlert = () => {
      if (window.Swal) {
        return Promise.resolve();
      }
      return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    // 担当者かどうかを判定する関数
    const isCurrentUserAssignee = () => {
      const loginUser = kintone.getLoginUser();
      const currentRecord = kintone.app.record.get().record;
      const mainLawyers = currentRecord.main_lawyer.value.map(u => u.code);
      const staffs = currentRecord.staff.value.map(u => u.code);
      return mainLawyers.includes(loginUser.code) || staffs.includes(loginUser.code);
    };

    // コメント欄の「書き込む」ボタンを監視する関数
    const observeCommentButton = () => {
      const targetNode = document.body;
      const observer = new MutationObserver((mutationsList, obs) => {
        const postButton = document.querySelector('.gaia-argoui-comment-post-button');
        if (postButton) {
          obs.disconnect(); // 監視を終了
          setupClickListener(postButton);
        }
      });
      observer.observe(targetNode, { childList: true, subtree: true });
    };

    // クリックイベントリスナーを設定する関数
    const setupClickListener = (button) => {
      button.addEventListener('click', async (e) => {
        if (isPopupProcessing) {
          return; // ポップアップ処理中は元のクリックイベントを許可
        }

        // コメントが空の場合は何もしない
        const commentInput = document.querySelector('.gaia-argoui-comment-textarea');
        if (!commentInput || !commentInput.value.trim()) {
          return;
        }

        // 担当者でなければ何もしない
        if (!isCurrentUserAssignee()) {
          return;
        }

        // デフォルトの送信動作をキャンセル
        e.preventDefault();
        e.stopPropagation();

        await loadSweetAlert();

        // 画面からステータスとアクション情報を取得
        const statusInfo = document.querySelector('.gaia-app-statusbar-statusmenu')?.innerText.replace(/\n/g, '<br>') || '';
        const actionElements = document.querySelectorAll('.gaia-app-statusbar-action');

        let actionButtonsHtml = '';
        actionElements.forEach((el, index) => {
          const actionLabel = el.querySelector('.gaia-app-statusbar-action-label')?.innerText;
          if (actionLabel) {
            actionButtonsHtml += `<button class="swal2-styled" id="swal-action-${index}" style="margin: 0 5px;">${actionLabel}</button>`;
          }
        });

        Swal.fire({
          title: 'ステータスを変更しますか？',
          html: `<div style="text-align: left; padding: 0 1em; margin-bottom: 1em;">${statusInfo}</div>` + actionButtonsHtml,
          showCancelButton: true,
          cancelButtonText: '変更しない',
          showConfirmButton: false, // デフォルトのOKボタンは非表示
          didOpen: () => {
            // 動的に生成したボタンにクリックイベントを設定
            actionElements.forEach((el, index) => {
              const swalBtn = document.getElementById(`swal-action-${index}`);
              if (swalBtn) {
                swalBtn.addEventListener('click', () => {
                  // 対応するkintoneのアクションボタンをクリック
                  el.click();
                  Swal.close();
                });
              }
            });
          }
        }).then(() => {
          // ポップアップが閉じた後（アクション実行 or キャンセル後）にコメントを送信
          isPopupProcessing = true;
          button.click();
          // 少し待ってからフラグを戻す
          setTimeout(() => { isPopupProcessing = false; }, 100);
        });
      });
    };

    // 実行開始
    observeCommentButton();

    return event;
  });
})();
