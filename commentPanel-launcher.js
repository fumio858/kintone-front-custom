(function () {
  'use strict';

  // ====== 設定 ======
  const SCHEDULE_PANEL_ID = 'user-js-schedulePanel';
  const TASK_PANEL_ID = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック（他JSとの整合）
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // --- SVGアイコン ---
  const ICONS = {
    calendar: `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24">
        <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zm-2 8H5v-6h14v6z"/>
      </svg>`,
    task: `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24">
        <path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.3 7.71l-1.41-1.41z"/>
      </svg>`
  };

  // --- ボタンバー生成（リンク風） ---
  function createButtonBar() {
    const bar = document.createElement('div');
    bar.className = 'kx-cmt-side-actions';
    bar.style.display = 'flex';
    bar.style.flexDirection = 'column';
    bar.style.gap = '6px';
    bar.style.marginLeft = '8px';
    bar.style.marginTop = '2px';

    const createLink = (iconSvg, text) => {
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
      link.classList.add('kx-cmt-action-link');
      link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
      link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
      return link;
    };

    const btnSched = createLink(ICONS.calendar, 'スケジュール登録');
    const btnTask  = createLink(ICONS.task, 'タスク追加');

    bar.appendChild(btnSched);
    bar.appendChild(btnTask);

    return { bar, btnSched, btnTask };
  }

  // --- コメントフォーム下に挿入するパネルを用意 ---
  function ensurePanelContainer(formEl, id) {
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement('div');
    el.id = id;
    el.style.marginTop = '12px';
    el.style.marginBottom = '12px';
    el.style.borderTop = '1px dashed #e5e7eb';
    el.style.paddingTop = '12px';
    formEl.insertAdjacentElement('afterend', el);
    return el;
  }

  function injectButtonsOnce() {
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    const wrap = document.querySelector('.ocean-ui-comments-commentform-textarea-wrap');
    if (!form || !wrap) return false;
    if (document.querySelector('.kx-cmt-side-actions')) return true;

    // flexで横並び
    const lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.alignItems = 'flex-start';
    lane.style.gap = '8px';

    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    while (wrap.firstChild) left.appendChild(wrap.firstChild);

    const { bar, btnSched, btnTask } = createButtonBar();

    lane.appendChild(left);
    lane.appendChild(bar);
    wrap.appendChild(lane);

    btnSched.addEventListener('click', () => {
      const el = ensurePanelContainer(form, SCHEDULE_PANEL_ID);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    btnTask.addEventListener('click', () => {
      const el = ensurePanelContainer(form, TASK_PANEL_ID);
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
