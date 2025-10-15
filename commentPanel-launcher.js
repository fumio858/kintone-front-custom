(function () {
  'use strict';

  // ====== 設定 ======
  const SCHEDULE_PANEL_ID = 'schedulePanel';
  const TASK_PANEL_ID = 'taskPanel';

  // Spaceが無くてもID直指定のdivを返すフォールバック（他JSからも効くように早期パッチ）
  const _origGetSpace = kintone.app.record.getSpaceElement;
  kintone.app.record.getSpaceElement = function (spaceId) {
    return _origGetSpace.call(this, spaceId) || document.getElementById(spaceId) || null;
  };

  // ボタンバーのDOMを作る
  function createButtonBar() {
    const bar = document.createElement('div');
    bar.className = 'kx-cmt-side-actions';
    bar.style.display = 'flex';
    bar.style.flexDirection = 'column';
    bar.style.gap = '8px';
    bar.style.marginLeft = '8px';

    const btnSched = document.createElement('button');
    btnSched.type = 'button';
    btnSched.textContent = 'スケジュール登録';
    btnSched.className = 'kx-btn-schedule';
    btnSched.style.padding = '8px 10px';

    const btnTask = document.createElement('button');
    btnTask.type = 'button';
    btnTask.textContent = 'タスク追加';
    btnTask.className = 'kx-btn-task';
    btnTask.style.padding = '8px 10px';

    bar.appendChild(btnSched);
    bar.appendChild(btnTask);
    return { bar, btnSched, btnTask };
  }

  // コメントフォーム直下にコンテナを確実に用意
  function ensurePanelContainer(formEl, id) {
    // すでに存在すればそれを使う
    let el = document.getElementById(id);
    if (el) return el;

    // フォームの直後に差し込む
    el = document.createElement('div');
    el.id = id;
    el.style.marginTop = '12px';
    el.style.marginBottom = '12px';
    el.style.borderTop = '1px dashed #e5e7eb';
    el.style.paddingTop = '12px';

    // コメントフォームの「すぐ下」に置きたいので、親の直後へ
    formEl.insertAdjacentElement('afterend', el);
    return el;
  }

  function injectButtonsOnce() {
    // コメント入力フォーム
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    const wrap = document.querySelector('.ocean-ui-comments-commentform-textarea-wrap');
    const textarea = document.querySelector('.ocean-ui-comments-commentform-textarea');

    if (!form || !wrap || !textarea) return false;
    if (document.querySelector('.kx-cmt-side-actions')) return true; // 二重挿入防止

    // テキストエリアと横並びにするためのラッパ調整
    // 既にFlexでなければFlex化（65vw調整はユーザーCSSに依存させる）
    const lane = document.createElement('div');
    lane.style.display = 'flex';
    lane.style.alignItems = 'stretch';
    lane.style.gap = '8px';

    // 既存のテキストエリアwrapの中身をlaneへ移す
    // （wrap直下のtextarea/エディタ領域を lane の左ブロックへ）
    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    while (wrap.firstChild) left.appendChild(wrap.firstChild);

    // ボタンバー
    const { bar, btnSched, btnTask } = createButtonBar();

    lane.appendChild(left);
    lane.appendChild(bar);
    wrap.appendChild(lane);

    // クリック時：コンテナ生成 → スクロール
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

  // レコード詳細表示ごとに実行（SPA遷移にも対応）
  kintone.events.on('app.record.detail.show', () => {
    // DOM生成は少し遅れて行うと安定（ツールバー等の描画後）
    const tryInject = () => {
      if (injectButtonsOnce()) return;
      // 未描画なら少し待って再試行
      setTimeout(tryInject, 150);
    };
    tryInject();
  });
})();
