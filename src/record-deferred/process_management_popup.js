(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
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
        const postButton = document.querySelector('.ocean-ui-comments-commentform-submit');
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

        const commentInput = document.querySelector('.ocean-ui-comments-commentform-textarea');
        if (!commentInput || !commentInput.value.trim() || !isCurrentUserAssignee()) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        await loadSweetAlert();

        let statusInfo = document.querySelector('.gaia-app-statusbar-statusmenu')?.innerText.replace(/\n/g, '<br>') || '';
        statusInfo = statusInfo.replace(/ステータスの履歴/g, '');

        const actionElements = document.querySelectorAll('.gaia-app-statusbar-action');

        let actionButtonsHtml = '';
        actionElements.forEach((el, index) => {
          const actionLabel = el.querySelector('.gaia-app-statusbar-action-label')?.innerText;
          if (actionLabel) {
            actionButtonsHtml += `<button class="swal2-styled" id="swal-action-${index}" style="margin: .5rem;border: 1px solid #e3e7e8; background-color: #f7f9fa; box-shadow: 1px 1px 1px #fff inset; color: #3498db; border-solid: 1px;">${actionLabel}</button>`;
          }
        });

        Swal.fire({
          title: 'ステータスを変更しますか？',
          html: `<div style="text-align: left; padding: 0 1em; margin-bottom: 1em; text-align: center; background-color: #c7c7c745; color: #000000; padding: 1rem; line-height: 2; letter-spacing: 0.05rem; font-size: 1.3rem; border-color: #FFF; border-width: thick;">${statusInfo}</div>` + actionButtonsHtml,
          footer: `<div style="display: flex; justify-content: center; align-items: center; padding-top: 1rem;">
            <button class="swal2-styled" id="swal-comment-only" style="background-color: #3598db; color: #FFF;">コメントのみ送信</button>
            <a href="#" id="swal-cancel-link" style="color: #777; text-decoration: none; margin-left: auto;right: 1rem; position: absolute; bottom: 1rem; font-size: .8rem;">キャンセル</a>
          </div>`,
          showCancelButton: false,
          showConfirmButton: false,
          width: '50%',
          didOpen: () => {
            // ステータス変更ボタンのイベントリスナー
            actionElements.forEach((el, index) => {
              const swalBtn = document.getElementById(`swal-action-${index}`);
              if (swalBtn) {
                swalBtn.addEventListener('click', () => {
                  // 1. ステータス変更
                  el.click();

                  // 2. 画面更新を監視してコメント送信
                  const statusObserver = new MutationObserver(() => {
                    statusObserver.disconnect();
                    isPopupProcessing = true;
                    button.click(); // コメント送信
                    setTimeout(() => { isPopupProcessing = false; }, 100);
                  });
                  const statusTarget = document.querySelector('.gaia-app-statusbar-statusmenu');
                  if (statusTarget) {
                    statusObserver.observe(statusTarget, { childList: true, subtree: true });
                  }

                  Swal.close();
                });
              }
            });

            // コメントのみ送信ボタンのイベントリスナー (フッター内のボタン)
            const commentOnlyBtn = document.getElementById('swal-comment-only');
            if (commentOnlyBtn) {
              commentOnlyBtn.addEventListener('click', () => {
                isPopupProcessing = true;
                button.click(); // コメント送信
                setTimeout(() => { isPopupProcessing = false; }, 100);
                Swal.close();
              });
            }

            // 新しいキャンセルリンクのイベントリスナー
            const cancelLink = document.getElementById('swal-cancel-link');
            if (cancelLink) {
              cancelLink.addEventListener('click', (e) => {
                e.preventDefault(); // リンクのデフォルト動作をキャンセル
                Swal.close();
              });
            }
          }
        });
      });
    };

    // 実行開始
    observeCommentButton();

    return event;
  });
})();
