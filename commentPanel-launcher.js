(function () {
  'use strict';

  const SCHEDULE_PANEL_ID = 'user-js-schedulePanel';
  const TASK_PANEL_ID     = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // コメントフォームの親（スレッド領域）を推定
  function pickThreadContainer(formEl) {
    return formEl.closest('.ocean-ui-comments')   // まずスレッド全体の枠
        || formEl.parentElement                   // ダメならフォームの親
        || formEl;                                // 最後はフォーム自体
  }

  // パネルの置き場所を用意（スレッド内のフォーム直下を優先）
  function ensurePanelContainer(formEl, id) {
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement('div');
    el.id = id;
    el.style.marginTop = '12px';
    el.style.marginBottom = '12px';
    el.style.borderTop = '1px dashed #e5e7eb';
    el.style.paddingTop = '12px';
    el.textContent = 'ロード中…'; // 見える目印（後で上書きされる想定）

    const threadBox = pickThreadContainer(formEl);
    // フォーム直後を狙う
    if (formEl.nextElementSibling) {
      formEl.insertAdjacentElement('afterend', el);
    } else {
      threadBox.appendChild(el);
    }
    return el;
  }

  // ボタンUI（テキストリンク風＋アイコン）
  const ICONS = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zm-2 8H5v-6h14v6z"/></svg>`,
    task:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.3 7.71l-1.41-1.41z"/></svg>`
  };

  function createLink(iconSvg, text) {
    const link = document.createElement('button');
    link.type = 'button';
    link.innerHTML = `${iconSvg}<span style="margin-left:4px;">${text}</span>`;
    link.style.fontSize = '13px';
    link.style.lineHeight = '1.5';
    link.style.fontWeight = '800';
    link.style.color = '#3598db';
    link.style.border = 'none';
    link.style.background = 'transparent';
    link.style.textAlign = 'left';
    link.style.cursor = 'pointer';
    link.style.display = 'flex';
    link.style.alignItems = 'center';
    link.style.padding = '2px 0';
    link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
    link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
    return link;
  }

  function injectButtonsOnce() {
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    const wrap = document.querySelector('.ocean-ui-comments-commentform-textarea-wrap');
    if (!form || !wrap) return false;
    if (document.querySelector('.kx-cmt-side-actions')) return true;

    // テキストエリア右側に縦並びリンクを配置
    const lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.alignItems = 'flex-start';
    lane.style.gap = '8px';

    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    while (wrap.firstChild) left.appendChild(wrap.firstChild);

    const bar = document.createElement('div');
    bar.className = 'kx-cmt-side-actions';
    bar.style.display = 'flex';
    bar.style.flexDirection = 'column';
    bar.style.gap = '6px';
    bar.style.marginLeft = '8px';
    bar.style.marginTop = '2px';

    const btnSched = createLink(ICONS.calendar, 'スケジュール登録');
    const btnTask  = createLink(ICONS.task, 'タスク追加');
    bar.appendChild(btnSched);
    bar.appendChild(btnTask);

    lane.appendChild(left);
    lane.appendChild(bar);
    wrap.appendChild(lane);

    // クリック時の処理：コンテナ用意 → 初期化呼び出し/イベント発火 → スクロール
    btnSched.addEventListener('click', () => {
      const el = ensurePanelContainer(form, SCHEDULE_PANEL_ID);
      // ① グローバル関数があれば直呼び出し
      if (typeof window.userSchedulePanelInit === 'function') {
        window.userSchedulePanelInit(el);
      }
      // ② カスタムイベントでも通知（どちらでも拾えるように）
      document.dispatchEvent(new CustomEvent('user-js-open-schedule', {
        detail: { mountEl: el, mountId: SCHEDULE_PANEL_ID }
      }));
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    btnTask.addEventListener('click', () => {
      const el = ensurePanelContainer(form, TASK_PANEL_ID);
      if (typeof window.userTaskPanelInit === 'function') {
        window.userTaskPanelInit(el);
      }
      document.dispatchEvent(new CustomEvent('user-js-open-task', {
        detail: { mountEl: el, mountId: TASK_PANEL_ID }
      }));
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return true;
  }

  kintone.events.on('app.record.detail.show', () => {
    const tryInject = () => {
      if (injectButtonsOnce()) return;
      setTimeout(tryInject, 150);
    };
    tryInject();
  });
})();
