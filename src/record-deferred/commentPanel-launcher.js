(function () {
  'use strict';

  const BASE_TASK_ID = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック（他JS互換）
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // Kintone標準風ボタンを生成
  function createKintoneButton(text, id) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'gaia-ui-actionmenu-cancel'; // kintoneのセカンダリボタンクラスを流用
    button.textContent = text;
    Object.assign(button.style, {
      marginLeft: '8px', // 隣のボタンとの間隔
    });
    return button;
  }

  // コメントフォーム直後に 1 個だけ作る（再表示/再初期化に対応）
  function ensureSinglePanel(formEl, baseId, initFnName, eventName, commentText) {
    const existing = document.querySelector(`[data-mirror-of="${baseId}"]`);
    const detail = { mountEl: null, comment: commentText };

    if (existing) {
      const panel = existing.querySelector('.k-schedule-panel, .k-task-panel');
      if (panel && panel.style.display === 'none') {
        panel.style.display = '';
      } else if (!panel) {
        detail.mountEl = existing;
        if (typeof window[initFnName] === 'function') {
          window[initFnName](detail.mountEl, { comment: detail.comment });
        } else {
          document.dispatchEvent(new CustomEvent(eventName, { detail }));
        }
      }
      existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const mirror = document.createElement('div');
    mirror.dataset.mirrorOf = baseId;
    mirror.style.marginTop = '12px';
    mirror.style.borderTop = '1px dashed #e5e7eb';
    mirror.style.paddingTop = '12px';
    formEl.insertAdjacentElement('afterend', mirror);

    detail.mountEl = mirror;
    if (typeof window[initFnName] === 'function') {
      window[initFnName](detail.mountEl, { comment: detail.comment });
    } else {
      document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    mirror.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function injectLauncherOnce() {
    const toolbar = document.querySelector('.ocean-ui-comments-commentform-toolbar');
    if (!toolbar) return false;

    const submitButton = toolbar.querySelector('.gaia-comment-submit');
    if (!submitButton) return false;

    const launcherId = 'comment-task-launcher';
    if (document.getElementById(launcherId)) return true; // 二重設置回避

    const btnTask = createKintoneButton('タスク追加', launcherId);

    // 「書き込む」ボタンの“前”に設置
    toolbar.insertBefore(btnTask, submitButton);

    // クリックでコメントフォームの直下へ挿入
    btnTask.addEventListener('click', () => {
      const form = document.querySelector('.ocean-ui-comments-commentform-form');
      const textarea = form ? form.querySelector('textarea') : null;
      const commentText = textarea ? textarea.value : '';
      ensureSinglePanel(form, BASE_TASK_ID, 'userTaskPanelInit', 'user-js-open-task', commentText);
    });

    return true;
  }

  const tryInject = () => {
    if (injectLauncherOnce()) return;
    setTimeout(tryInject, 150);
  };

  kintone.events.on('app.record.detail.show', () => {
    tryInject();
  });

  // --- URL変更監視（SPA対応） ---
  (function(history) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    let lastUrl = location.href;

    const dispatchUrlChange = (newUrl) => {
      if (newUrl && newUrl.toString() !== lastUrl) {
        lastUrl = newUrl.toString();
        window.dispatchEvent(new CustomEvent('urlchanged', { detail: { url: lastUrl } }));
      }
    };

    history.pushState = function(state, title, url) {
      const result = pushState.apply(history, [state, title, url]);
      dispatchUrlChange(url);
      return result;
    };

    history.replaceState = function(state, title, url) {
      const result = replaceState.apply(history, [state, title, url]);
      dispatchUrlChange(url);
      return result;
    };

    window.addEventListener('popstate', () => {
      dispatchUrlChange(location.href);
    });
  })(window.history);

  // URL変更時にもインジェクションを試みる
  window.addEventListener('urlchanged', (e) => {
    setTimeout(() => {
      // 既存のランチャーボタンを削除
      const existingLauncher = document.getElementById('comment-task-launcher');
      if (existingLauncher) {
        existingLauncher.remove();
      }

      // 既存のパネル（ミラー）も削除
      const taskMirror = document.querySelector('[data-mirror-of="user-js-taskPanel"]');
      if (taskMirror) {
        taskMirror.remove();
      }

      tryInject();
    }, 200);
  });
})();
