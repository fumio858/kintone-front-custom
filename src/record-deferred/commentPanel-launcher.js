(function () {
  'use strict';

  const BASE_TASK_ID = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック（他JS互換）
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // Kintone標準風ボタンを生成（「書き込む」ボタンのスタイルを借用）
  function createKintoneButton(text, id) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'ocean-ui-comments-commentform-cancel'; // キャンセルボタンのクラスを使用
    button.style.marginLeft = '2rem'; // マージンを2remに変更
    button.style.marginTop = '1rem';
    button.style.float = 'right';
    button.style.display = 'none'; // ★ デフォルトで非表示

    // アイコン情報
    const svgPath = 'm424-318 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z';
    const viewBox = '0 -960 960 960';

    // ボタンにSVGアイコンとテキストをセット
    button.innerHTML = `
      <svg viewBox="${viewBox}" style="width: 1em; height: 1em; fill: currentColor; margin-right: 0.4em; vertical-align: middle;">
        <path d="${svgPath}"></path>
      </svg>
      <span>${text}</span>
    `;

    // アイコンとテキストを中央揃えにする
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.visibility = 'hidden'; // ★ visibilityで表示制御

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
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    if (!form) return false;

    const launcherId = 'comment-task-launcher';
    if (document.getElementById(launcherId)) return true; // 既に存在すれば何もしない

    const btnTask = createKintoneButton('タスク追加', launcherId);
    form.appendChild(btnTask); // 先にDOMに追加

    // クリックイベント
    btnTask.addEventListener('click', (e) => {
      e.preventDefault();
      let commentText = '';
      const richEditor = form.querySelector('.ocean-ui-editor-field.editable');
      if (richEditor) {
        commentText = richEditor.innerText;
      } else {
        const textarea = form.querySelector('.ocean-ui-comments-commentform-textarea');
        if (textarea) commentText = textarea.value;
      }
      ensureSinglePanel(form, BASE_TASK_ID, 'userTaskPanelInit', 'user-js-open-task', commentText);
    });

    // --- 表示制御ロジック ---
    const commentArea = document.querySelector('.ocean-ui-comments-commentarea');
    if (!commentArea) return true; // 監視対象がなければ終了

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('ocean-ui-comments-commentform-open')) {
            btnTask.style.visibility = 'visible';
          } else {
            btnTask.style.visibility = 'hidden';
          }
        }
      }
    });

    observer.observe(commentArea, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: false,
    });

    // 初期状態のチェック
    if (commentArea.classList.contains('ocean-ui-comments-commentform-open')) {
      btnTask.style.visibility = 'visible';
    }

    // SPA遷移で監視が止まらないように、切断処理は含めない
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
