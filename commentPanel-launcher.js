(function () {
  'use strict';

  const SCHEDULE_PANEL_ID = 'user-js-schedulePanel';
  const TASK_PANEL_ID     = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // アイコンSVG
  const ICONS = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zm-2 8H5v-6h14v6z"/></svg>`,
    task: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.3 7.71l-1.41-1.41z"/></svg>`
  };

  function createLink(iconSvg, text) {
    const link = document.createElement('button');
    link.type = 'button';
    link.innerHTML = `${iconSvg}<span style="margin-left:4px;">${text}</span>`;
    Object.assign(link.style, {
      fontSize: '13px',
      lineHeight: '1.5',
      fontWeight: '800',
      color: '#3598db',
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      padding: '2px 0',
    });
    link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
    link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
    return link;
  }

  function ensurePanelContainer(formEl, id) {
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement('div');
    el.id = id;
    el.style.marginTop = '12px';
    el.style.marginBottom = '12px';
    el.style.borderTop = '1px dashed #e5e7eb';
    el.style.paddingTop = '12px';
    el.textContent = 'ロード中…';

    // 同じ階層（フォームの直後）に挿入
    formEl.insertAdjacentElement('afterend', el);
    return el;
  }

  function injectButtonsOnce() {
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    const wrap = document.querySelector('.ocean-ui-comments-commentform-textarea-wrap');
    if (!form || !wrap) return false;
    if (document.querySelector('.kx-cmt-side-actions')) return true;

    // テキストエリア右側に縦並びのリンクを配置
    const lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.alignItems = 'flex-start';
    lane.style.gap = '8px';
    lane.style.marginBottom = '1rem';

    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    while (wrap.firstChild) left.appendChild(wrap.firstChild);

    const bar = document.createElement('div');
    bar.className = 'kx-cmt-side-actions';
    Object.assign(bar.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginLeft: '8px',
      marginTop: '2px',
    });

    const btnSched = createLink(ICONS.calendar, 'スケジュール登録');
    const btnTask  = createLink(ICONS.task, 'タスク追加');
    bar.appendChild(btnSched);
    bar.appendChild(btnTask);

    lane.appendChild(left);
    lane.appendChild(bar);
    wrap.appendChild(lane);

    // 挿入動作
    btnSched.addEventListener('click', () => {
      const el = ensurePanelContainer(form, SCHEDULE_PANEL_ID);
      // ここで他JSを呼び出す or カスタムイベント発火
      document.dispatchEvent(new CustomEvent('user-js-open-schedule', {
        detail: { mountEl: el, mountId: SCHEDULE_PANEL_ID }
      }));
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    btnTask.addEventListener('click', () => {
      const el = ensurePanelContainer(form, TASK_PANEL_ID);
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
