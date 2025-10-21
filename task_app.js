// ==== 設定ここから ====
const TASK_APP_ID = 23;
const TASK_F_CASE_ID = 'case_id';
const TASK_T_CASE_ID = 'case_id';
const TASK_T_TITLE = '件名';
const TASK_T_DUE = '期限';
const TASK_T_OWNER = '担当者';
const TASK_T_STATUS = 'タスクステータス';
const TASK_SPACE_ID = 'taskPanel';

// ▼ タスクアプリ側の「分野」フィールドのフィールドコード
const TASK_T_CASE_TYPE_FIELD = 'case_type';

// ▼ 分野ラベル定義（要望どおりの定数名で用意）
const TASK_CASE_TYPE = { // NEW
  CRIMINAL: '刑事事件',
  TRAFFIC: '交通事故',
  OTHER: '刑事交通以外',
};

// ▼ 「どのアプリから登録しているか」→ 分野ラベル の対応表
//    k/22=刑事事件, k/26=交通事故, k/41=その他
const APP_ID_TO_CASE_TYPE = { // NEW
  22: TASK_CASE_TYPE.CRIMINAL,
  26: TASK_CASE_TYPE.TRAFFIC,
  55: TASK_CASE_TYPE.OTHER,
};
// ==== 設定ここまで ====

(function () {
  'use strict';

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);
  const esc = (s = '') => String(s).replace(/\\/g, '\\').replace(/"/g, '\"');

  // NEW: 現在のアプリIDを安全に取得（kintone.app.getId()優先、だめならURL解析）
  function getCurrentAppId() {
    try {
      const id = kintone.app.getId();
      if (id) return Number(id);
    } catch (_) { }
    const m = location.pathname.match(/\/k\/(\d+)\//);
    return m ? Number(m[1]) : NaN;
  }

  // --- フォールバックで mount を見つける（カレンダー互換 + さらに堅牢） ---
  function resolveMountEl(mountEl) {
    if (mountEl && mountEl.nodeType === 1) return mountEl;
    // 1) ランチャーの mirror 既存？
    const mirror = document.querySelector('[data-mirror-of="user-js-taskPanel"]');
    if (mirror) return mirror;
    // 2) Space フィールド
    const space = kintone.app.record.getSpaceElement(TASK_SPACE_ID);
    if (space) return space;
    // 3) コメントフォームの直後に mirror を自作（最終フォールバック）
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    if (form) {
      const m = document.createElement('div');
      m.dataset.mirrorOf = 'user-js-taskPanel';
      Object.assign(m.style, { marginTop: '12px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' });
      form.insertAdjacentElement('afterend', m);
      return m;
    }
    // 4) 最後の手段：レコード詳細の末尾
    const container = document.querySelector('#record-gaia, .contents-gaia, body');
    const m2 = document.createElement('div');
    m2.dataset.mirrorOf = 'user-js-taskPanel';
    container.appendChild(m2);
    return m2;
  }

  // ★ 任意のマウント先に描画する本体（呼ばれたら“必ず表示”）
  async function initTaskPanel(mountEl, rec) {
    try {
      mountEl = resolveMountEl(mountEl);
      if (!mountEl) return console.warn('[task] mountEl not found');

      mountEl.style.display = ''; // ← 非表示解除（カレンダー方式）
      mountEl.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.classList.add('k-task-panel');
      wrap.style.padding = '12px';
      wrap.style.background = '#E9F1F8';
      wrap.style.display = '';

      wrap.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <strong>タスク追加</strong>
          <div style="margin-left:auto; display:flex; gap:6px;">
            <button id="task-show-list" type="button">タスク一覧</button>
            <button id="task-close" type="button" aria-label="閉じる（Esc）">キャンセル</button>
          </div>
        </div>
        <style>
          button{ font-size:13px; }
          .k-task-panel input, .k-task-panel textarea, .k-task-panel select {
            border: 1px solid #e3e7e8; border-radius: 6px;
          }
          .k-task-panel input:focus, .k-task-panel textarea:focus, .k-task-panel select:focus, .k-task-panel button:focus {
            outline: none; box-shadow: 0 0 0 3px rgba(227,231,232,.4); border-color: #e3e7e8;
          }
          #task-show-list, #task-close { border: 1px solid #e3e7e8; background:#fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; }
          #task-show-list:hover, #task-close:hover { background: #f5f7f8; }
          .task-add-row{ display:grid; grid-template-columns: 1fr 260px; gap:12px; align-items:stretch; margin-top:8px; }
          .task-add-left textarea{ width:100%; height:100%; min-height:120px; resize:vertical; padding:10px; box-sizing:border-box; }
          .task-add-right{ display:flex; flex-direction:column; gap:8px; }
          .task-add-right > *{ width:100%; box-sizing:border-box; }
          .task-add-right button{ height:36px; background:#3598db; color:#fff; border-radius: 6px;font-size: .9rem; border: none;}
          .task-add-right button:hover{ background:#1182ce;}
          @media (max-width: 640px){ .task-add-row{ grid-template-columns: 1fr; } }
          .k-task-panel .task-add-right .task-owner, .k-task-panel .task-add-right .task-due{ padding:8px 4px; min-height:36px; box-sizing:border-box; }
        </style>

        <div id="task-list" style="display:none; flex-direction:column; gap:6px; margin-bottom:12px;"></div>
        <div class="task-add-row">
          <div class="task-add-left">
            <textarea id="task-title" placeholder="件名を入力" rows="4"></textarea>
          </div>
          <div class="task-add-right">
            <select id="task-owner" class="task-owner">
              <option value="" disabled selected>担当者を選択</option>
            </select>
            <input id="task-due" type="date" class="task-due">
            <button id="task-add" type="button">＋ タスクを追加</button>
          </div>
        </div>
        `;
      mountEl.appendChild(wrap);

      const listEl = wrap.querySelector('#task-list');
      const selOwner = wrap.querySelector('#task-owner');

      // ▼ この画面のアプリIDから分野ラベルを決定
      const currentAppId = getCurrentAppId(); // NEW
      const caseTypeLabel = APP_ID_TO_CASE_TYPE[currentAppId] || ''; // NEW

      // 案件ID（空でも UI は表示し、メッセージを出す）
      const caseId = (rec?.[TASK_F_CASE_ID]?.value || '').trim();
      if (!caseId) {
        listEl.innerHTML = `<div style="color:#c00;">案件側フィールド「${TASK_F_CASE_ID}」が空です。値を入れるとタスクを表示・追加できます。</div>`;
      }

      // 担当者セレクト
      await (async function populateOwnerSelect() {
        const login = kintone.getLoginUser();
        selOwner.innerHTML = ''; // 一旦クリア
        const me = document.createElement('option');
        me.value = login.code;
        me.textContent = `${login.name}（自分）`;
        selOwner.appendChild(me);

        try {
          let offset = 0, size = 100;
          while (true) {
            const resp = await kintone.api(kUrl('/v1/users'), 'GET', { offset, size });
            const users = resp.users || [];
            for (const u of users) {
              if (!u.valid || u.code === login.code) continue;
              const opt = document.createElement('option');
              opt.value = u.code; opt.textContent = u.name;
              selOwner.appendChild(opt);
            }
            if (users.length < size) break;
            offset += size;
          }
          selOwner.value = login.code;
        } catch (e) {
          console.warn('[task] ユーザー一覧取得失敗:', e);
        }
      })();

      // 取得系
      async function fetchTasks() {
        if (!caseId) return [];
        const cEsc = caseId.replace(///g, '\\').replace(/"/g, '\"');

        // ★現在のアプリの分野（case_type）で絞り込む条件を追加
        const caseTypeFilter = caseTypeLabel ? ` and ${TASK_T_CASE_TYPE_FIELD} = "${esc(caseTypeLabel)}"` : '';

        const query = `${TASK_T_CASE_ID} = "${cEsc}"${caseTypeFilter} order by ${TASK_T_DUE} asc`;
        try {
          const resp = await kintone.api(kUrl('/k/v1/records.json'), 'GET', { app: TASK_APP_ID, query });
          if ((resp.records || []).length === 0 && /^[0-9]+$/.test(caseId)) {
            const fallbackQuery = `${TASK_T_CASE_ID} = ${caseId}${caseTypeFilter} order by ${TASK_T_DUE} asc`;
            const resp2 = await kintone.api(kUrl('/k/v1/records.json'), 'GET', { app: TASK_APP_ID, query: fallbackQuery });
            return resp2.records || [];
          }
          return resp.records || [];
        } catch (e) {
          console.error('[task] タスク取得エラー', e);
          listEl.innerHTML = `<div style="color:#c00;">タスク取得でエラー：${e?.message || JSON.stringify(e)}</div>`;
          return [];
        }
      }

      function row(tRec) {
        const id = tRec.$id.value;
        const title = tRec[TASK_T_TITLE]?.value || '(無題)';
        const due = tRec[TASK_T_DUE]?.value || '';
        const status = tRec[TASK_T_STATUS]?.value || '';
        const owners = Array.isArray(tRec[TASK_T_OWNER]?.value) ? tRec[TASK_T_OWNER].value.map(u => u.name || u.code).join(', ') : '';

        const div = document.createElement('div');
        Object.assign(div.style, {
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: '8px',
          alignItems: 'center',
          padding: '6px 8px',
          background: 'transparent',
          borderBottom: 'dotted 1px #bcced5',
        });
        div.innerHTML = `
          <div>
            <div style="font-weight:600">${title}</div>
            <div style="font-size:12px;color:#666">状態: ${status || '—'} / 担当: ${owners || '—'} / 期限: ${due || '—'}</div>
          </div>
          <button data-act="start" type="button" title="進行中にする">進行中</button>
          <button data-act="done" type="button" title="完了にする">完了</button>
          <a href="${location.origin}/k/${TASK_APP_ID}/show#record=${id}" target="_blank">開く</a>`;
        div.addEventListener('click', async (e) => {
          const btn = e.target.closest('button'); if (!btn) return;
          const newStatus = btn.dataset.act === 'start' ? '進行中' : '完了';
          try {
            await kintone.api(kUrl('/k/v1/record'), 'PUT', { app: TASK_APP_ID, id, record: { [TASK_T_STATUS]: { value: newStatus } } });
            render();
          } catch (e2) { console.error('[task] 更新エラー', e2); alert('タスク更新に失敗しました。'); }
        });
        return div;
      }

      async function render() {
        listEl.textContent = '読込中…';
        const records = await fetchTasks();
        listEl.innerHTML = '';
        if (!records.length) { listEl.textContent = '対象タスクはありません。'; return; }
        for (const r of records) listEl.appendChild(row(r));
      }

      const addBtn = wrap.querySelector('#task-add');

      addBtn.addEventListener('click', async () => {
        const title = (wrap.querySelector('#task-title').value || '').trim();
        const due = (wrap.querySelector('#task-due').value || '').trim();
        const owner = wrap.querySelector('#task-owner').value || kintone.getLoginUser().code;

        if (!title) return alert('件名を入力してください');
        if (!caseId) return alert(`案件側フィールド「${TASK_F_CASE_ID}」が空です。値を入れてから追加してください。`);

        // 重複チェック（必要なら分野も入れる）
        const dupQ = `${TASK_T_CASE_ID} = "${esc(caseId)}" and ${TASK_T_TITLE} = "${esc(title)}" limit 1`;
        try {
          const dup = await kintone.api(kUrl('/k/v1/records'), 'GET', { app: TASK_APP_ID, query: dupQ });
          if ((dup.records || []).length) return alert('この案件に同名のタスクが既にあります。件名を変えてください。');
        } catch (e) {
          console.warn('[task] 重複確認に失敗（続行）:', e);
        }

        // 作成ペイロード
        const record = {
          [TASK_T_CASE_ID]: { value: caseId },
          [TASK_T_TITLE]: { value: title },
          [TASK_T_DUE]: { value: due || '' },
          [TASK_T_OWNER]: { value: [{ code: owner }] },
          [TASK_T_STATUS]: { value: '未着手' },
          [TASK_T_CASE_TYPE_FIELD]: { value: caseTypeLabel || '' },
        };

        // 二重クリック防止
        addBtn.disabled = true;
        const prevText = addBtn.textContent;
        addBtn.textContent = '作成中…';

        try {
          // ★ ここでPOSTして、成功したらアラート
          const resp = await kintone.api(kUrl('/k/v1/record'), 'POST', { app: TASK_APP_ID, record });
          // resp には {id, revision} が返る
          alert(`タスクを作成しました（#${resp.id}）。`);

          // フォームリセット
          wrap.querySelector('#task-title').value = '';
          wrap.querySelector('#task-due').value = '';
          const login = kintone.getLoginUser();
          if (login?.code) selOwner.value = login.code;

          // 一覧を更新
          await render();
        } catch (e) {
          console.error('[task] 作成エラー', e);
          // kintoneの典型エラーをできるだけ表示
          const msg =
            e?.message ||
            e?.errors && JSON.stringify(e.errors) ||
            e?.code || '不明なエラー';
          alert(`タスク作成に失敗しました。\n${msg}`);
        } finally {
          addBtn.disabled = false;
          addBtn.textContent = prevText;
        }
      });

      const showListBtn = wrap.querySelector('#task-show-list');
      let isListLoaded = false;
      showListBtn.addEventListener('click', () => {
        const isHidden = listEl.style.display === 'none';
        if (isHidden) {
          listEl.style.display = 'flex';
          showListBtn.textContent = '一覧を隠す';
          if (!isListLoaded) {
            render();
            isListLoaded = true;
          }
        } else {
          listEl.style.display = 'none';
          showListBtn.textContent = 'タスク一覧';
        }
      });

      // —— キャンセル（Esc対応 / カレンダー同様） —— //
      const doHide = () => {
        wrap.style.display = 'none';
        mountEl.dispatchEvent(new CustomEvent('taskPanel:hidden', { bubbles: false }));
      };
      wrap.querySelector('#task-close').addEventListener('click', doHide);
      const onKey = (ev) => {
        if (ev.key === 'Escape' && wrap.style.display !== 'none') doHide();
      };
      document.addEventListener('keydown', onKey);
      mountEl.addEventListener('taskPanel:hidden', () => {
        document.removeEventListener('keydown', onKey);
      });

      // 初期描画はしない

    } catch (err) {
      console.error('[task] initTaskPanel fatal:', err);
    }
  }

  // イベント経由
  document.addEventListener('user-js-open-task', async (e) => {
    try {
      const mountEl = e?.detail?.mountEl || null;
      const recObj = kintone.app.record.get();
      const rec = recObj && recObj.record ? recObj.record : {};
      await initTaskPanel(mountEl, rec);
    } catch (err) {
      console.error('[task] event handler error:', err);
    }
  });

  // Space 自動初期化（ランチャーが無くても出す／二重初期化ガード付き）
  kintone.events.on(['app.record.detail.show'], async (event) => {
    const space = kintone.app.record.getSpaceElement(TASK_SPACE_ID);
    if (!space) return event;
    if (!space.dataset.initedTaskPanel) {
      space.dataset.initedTaskPanel = '1';
      try {
        await window.userTaskPanelInit(space);
      } catch (e) {
        console.warn('[task] auto init failed:', e);
      }
    }
    return event;
  });

  // 直呼びにも対応（ランチャーの直呼びパス）
  window.userTaskPanelInit = async function (mountEl) {
    const recObj = kintone.app.record.get();
    const rec = recObj && recObj.record ? recObj.record : {};
    await initTaskPanel(mountEl, rec);
  };
})();
