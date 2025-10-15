(function () {
  'use strict';

  const BASE_SCHEDULE_ID = 'user-js-schedulePanel';
  const BASE_TASK_ID     = 'user-js-taskPanel';

  // Spaceフィールドのフォールバック（他JS互換）
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // アイコン（そのまま使う／不要なら空文字でもOK）
  const ICONS = {
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zm-2 8H5v-6h14v6z"/></svg>`,
    task:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3598db" viewBox="0 0 24 24"><path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.3 7.71l-1.41-1.41z"/></svg>`
  };

  // テキストリンク（ボタン）生成：下線ナシ、hoverで色だけ濃く
  function createLink(iconSvg, text) {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'launcher-link';
    link.innerHTML = `${iconSvg ? iconSvg : ''}<span style="margin-left:${iconSvg ? 4 : 0}px;">${text}</span>`;
    Object.assign(link.style, {
      fontSize: '13px', lineHeight: '1', fontWeight: '800',
      color: '#3598db', border: 'none', background: 'transparent',
      textAlign: 'left', cursor: 'pointer', display: 'flex',
      alignItems: 'center', padding: '0'
    });
    return link;
  }

  // コメントフォーム直後に 1 個だけ作る
  function ensureSinglePanel(formEl, baseId, initFnName, eventName) {
    const existing = document.querySelector(`[data-mirror-of="${baseId}"]`);
    if (existing) {
      existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const mirror = document.createElement('div');
    mirror.dataset.mirrorOf = baseId;
    mirror.style.marginTop = '12px';
    mirror.style.borderTop = '1px dashed #e5e7eb';
    mirror.style.paddingTop = '12px';
    formEl.insertAdjacentElement('afterend', mirror);

    if (typeof window[initFnName] === 'function') {
      window[initFnName](mirror);
    } else {
      document.dispatchEvent(new CustomEvent(eventName, { detail: { mountEl: mirror } }));
    }
    mirror.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function injectLauncherOnce() {
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    if (!form) return false;
    if (document.querySelector('#comment-panel-launcher')) return true; // 二重設置回避

    // ランチャー行（フォームの“上”に横並びで置く）
    const bar = document.createElement('div');
    bar.id = 'comment-panel-launcher';
    Object.assign(bar.style, {
      display: 'flex', gap: '13px', alignItems: 'center', justifyContent : 'flex-end',
      marginBottom: '8px', userSelect: 'none'
    });

    // 文字色のホバー濃色（下線なし）
    const style = document.createElement('style');
    style.textContent = `
      #comment-panel-launcher .launcher-link { color:#3598db; transition: color .15s ease; }
      #comment-panel-launcher .launcher-link:hover { color:#217dbb; }
    `;
    document.head.appendChild(style);

    const btnSched = createLink(ICONS.calendar, 'スケジュール登録');
    const btnTask  = createLink(ICONS.task,     'タスク追加');

    bar.appendChild(btnSched);
    bar.appendChild(btnTask);

    // フォームの“直前”に設置
    form.parentElement.insertBefore(bar, form);

    // クリックでコメントフォームの直下へ挿入（各1個だけ）
    btnSched.addEventListener('click', () => {
      ensureSinglePanel(form, BASE_SCHEDULE_ID, 'userSchedulePanelInit', 'user-js-open-schedule');
    });
    btnTask.addEventListener('click', () => {
      ensureSinglePanel(form, BASE_TASK_ID, 'userTaskPanelInit', 'user-js-open-task');
    });

    return true;
  }

  kintone.events.on('app.record.detail.show', () => {
    const tryInject = () => {
      if (injectLauncherOnce()) return;
      setTimeout(tryInject, 150);
    };
    tryInject();
  });
})();
