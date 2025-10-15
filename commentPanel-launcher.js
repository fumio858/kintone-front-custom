(function () {
  'use strict';

  const BASE_SCHEDULE_ID = 'user-js-schedulePanel';
  const BASE_TASK_ID     = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // リンク風UI用のボタン生成
  function createLink(iconSvg, text) {
    const link = document.createElement('button');
    link.type = 'button';
    link.innerHTML = `${iconSvg}<span style="margin-left:4px;">${text}</span>`;
    Object.assign(link.style, {
      fontSize: '13px', lineHeight: '1.5', fontWeight: '800',
      color: '#3598db', border: 'none', background: 'transparent',
      textAlign: 'left', cursor: 'pointer', display: 'flex',
      alignItems: 'center', padding: '2px 0',
    });
    link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
    link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
    return link;
  }

  const ICONS = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zm-2 8H5v-6h14v6z"/></svg>`,
    task:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.3 7.71l-1.41-1.41z"/></svg>`
  };

  // フォーム直後に「ミラー用の空コンテナ」を新規作成（常に作る＝複製先）
  function createMirrorContainerAfterForm(formEl, baseId) {
    const mirrorId = `${baseId}--mirror-${Date.now()}`;
    const el = document.createElement('div');
    el.id = mirrorId;
    el.dataset.mirrorOf = baseId;
    Object.assign(el.style, {
      marginTop: '12px', marginBottom: '12px',
      borderTop: '1px dashed #e5e7eb', paddingTop: '12px'
    });
    el.textContent = 'ロード中…';
    formEl.insertAdjacentElement('afterend', el);
    return el;
  }

  function ensureSinglePanel(formEl, baseId, initFnName, eventName) {
    // 既に mirror がある場合 → スクロールだけ
    const existing = document.querySelector(`[data-mirror-of="${baseId}"]`);
    if (existing) {
      existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  
    // 新規作成
    const mirror = document.createElement('div');
    mirror.id = `${baseId}--mirror`;
    mirror.dataset.mirrorOf = baseId;
    mirror.style.marginTop = '12px';
    mirror.style.borderTop = '1px dashed #e5e7eb';
    mirror.style.paddingTop = '12px';
    formEl.insertAdjacentElement('afterend', mirror);
  
    // 初期化
    if (typeof window[initFnName] === 'function') {
      window[initFnName](mirror);
    } else {
      document.dispatchEvent(new CustomEvent(eventName, {
        detail: { mountEl: mirror }
      }));
    }
    mirror.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }


  function injectButtonsOnce() {
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    const wrap = document.querySelector('.ocean-ui-comments-commentform-textarea-wrap');
    if (!form || !wrap) return false;
    if (document.querySelector('.kx-cmt-side-actions')) return true;

    // コメントテキストエリア右側にリンク群
    const lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.alignItems = 'flex-start';
    lane.style.gap = '8px';

    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    while (wrap.firstChild) left.appendChild(wrap.firstChild);

    const bar = document.createElement('div');
    bar.className = 'kx-cmt-side-actions';
    Object.assign(bar.style, {
      display: 'flex', flexDirection: 'column', gap: '6px',
      marginLeft: '8px', marginTop: '2px'
    });

    const btnSched = createLink(ICONS.calendar, 'スケジュール登録');
    const btnTask  = createLink(ICONS.task, 'タスク追加');
    bar.appendChild(btnSched);
    bar.appendChild(btnTask);

    lane.appendChild(left);
    lane.appendChild(bar);
    wrap.appendChild(lane);

    // クリック
    btnSched.addEventListener('click', () => {
      ensureSinglePanel(form, 'user-js-schedulePanel', 'userSchedulePanelInit', 'user-js-open-schedule');
    });
    
    btnTask.addEventListener('click', () => {
      ensureSinglePanel(form, 'user-js-taskPanel', 'userTaskPanelInit', 'user-js-open-task');
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
