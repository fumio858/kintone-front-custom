// ==== 設定ここから ====
const SCHEDULE_APP_ID = 45;
const S_DATE  = 'date';          // 予定日のフィールドコード
const S_TITLE = 'title';         // 予定タイトルのフィールドコード
const S_DESC  = 'description';   // 予定説明のフィールドコード
const S_USERS = 'attendees';     // ユーザー選択のフィールドコード
const SPACE_ID = 'schedulePanel';
const COMMENT_FETCH_LIMIT = 10;
// ==== 設定ここまで ====

(function () {
  'use strict';
  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  function todayLocalYMD() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  async function populateUsersSelect(selectEl) {
    const login = kintone.getLoginUser();
    selectEl.innerHTML = '';
    const me = document.createElement('option');
    me.value = login.code;
    me.textContent = `${login.name}（自分）`;
    me.selected = true;
    selectEl.appendChild(me);
    try {
      let offset = 0, size = 100;
      while (true) {
        const res = await kintone.api(kUrl('/v1/users'), 'GET', { offset, size });
        const users = res.users || [];
        for (const u of users) {
          if (!u.valid || u.code === login.code) continue;
          const opt = document.createElement('option');
          opt.value = u.code;
          opt.textContent = u.name;
          selectEl.appendChild(opt);
        }
        if (users.length < size) break;
        offset += size;
      }
    } catch (e) {
      console.warn('ユーザー一覧取得失敗:', e);
    }
  }

  async function fetchComments(appId, recordId, limit = 10) {
    try {
      const res = await kintone.api(kUrl('/k/v1/record/comments'), 'GET', {
        app: appId, record: recordId, order: 'desc', offset: 0, limit
      });
      return res.comments || [];
    } catch (e) {
      console.error('コメント取得失敗:', e);
      return [];
    }
  }

  function extractCommentText(c) { return (c.text || '').trim(); }

  async function createSchedule(record) {
    return kintone.api(kUrl('/k/v1/record'), 'POST', { app: SCHEDULE_APP_ID, record });
  }

  // ★ 任意のマウント先に描画する本体
  async function initSchedulePanel(mountEl, rec, recordId, appId) {
    if (!mountEl) return;

    // Space が非表示指定されている可能性に備えて必ず表示状態へ
    mountEl.style.display = '';
    mountEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.classList.add('k-schedule-panel');
    wrap.style.padding = '12px';
    wrap.style.background = '#f7f9fa';
    wrap.style.display = ''; // 念のため可視

    wrap.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <strong>予定登録</strong>
        <span style="margin-left:auto; font-size:12px; color:#666;">スレッドの内容から予定を作成できます</span>
        <div style="display:flex; gap:6px;">
          <button id="sch-refresh" type="button">再読込</button>
          <button id="sch-close" type="button" aria-label="閉じる（Esc）">キャンセル</button>
        </div>
      </div>
      <style>
        button{ font-size:13px; }
        .k-schedule-form input[type="text"],
        .k-schedule-form input[type="date"],
        .k-schedule-form textarea,
        .k-schedule-form select{
          border: 1px solid #e3e7e8;
          border-radius: 6px;
        }
        .k-schedule-actions button {
          padding: 6px 10px;
          background: #fff;
        }
        .k-schedule-form input:focus,
        .k-schedule-form textarea:focus,
        .k-schedule-form select:focus,
        .k-schedule-actions button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(227,231,232,.4);
          border-color: #e3e7e8;
        }
        #sch-refresh,
        .k-schedule-cmt-acts button,
        .k-schedule-actions button {
          border: 1px solid #e3e7e8;
          font-size: 12px;
          border-radius: 6px;
        }
        #sch-close{
          border: 1px solid #e3e7e8;
          background: #fff;
          font-size: 12px;
          border-radius: 6px;
          padding: 6px 10px;
        }
        #sch-close:hover{ background: #f5f7f8; }
        .k-schedule-grid{ display:grid; grid-template-columns: 1fr 320px; gap:12px; }
        @media (max-width:800px){ .k-schedule-grid{ grid-template-columns:1fr; } }
        .k-schedule-form{ display:flex; flex-direction:column; gap:8px; }
        .k-schedule-form input[type="text"],
        .k-schedule-form input[type="date"],
        .k-schedule-form textarea,
        .k-schedule-form select{
          width:100%; padding:8px; box-sizing:border-box;
        }
        .k-schedule-comments{
          display:flex; flex-direction:column; gap:8px;
          max-height:420px; overflow:auto;
          border-left:1px dashed #e5e7eb; padding-left:12px; font-size: 12px;
        }
        .k-schedule-cmt{ background:#fafafa; border-radius:6px; padding:8px; display:flex; gap:8px; }
        .k-schedule-cmt-acts{ display:flex; flex-direction: column; gap:6px; }
        .k-schedule-cmt pre{
          white-space:pre-wrap; word-break:break-word; margin:0;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .k-schedule-actions{ display:flex; gap:8px; }
      </style>
      <div class="k-schedule-grid">
        <div class="k-schedule-form">
          <label>予定日（終日） <input id="sch-date" type="date"></label>
          <label>予定のタイトル <input id="sch-title" type="text" placeholder="例）打ち合わせ（顧問先）"></label>
          <label>予定の説明 <textarea id="sch-desc" rows="6" placeholder="スレッドの本文を取込ボタンで貼り付けできます"></textarea></label>
          <label>参加者（複数選択可） <select id="sch-users" multiple size="6"></select></label>
          <div class="k-schedule-actions">
            <button id="sch-create" type="button">＋ 予定を登録</button>
            <button id="sch-clear" type="button">入力クリア</button>
          </div>
        </div>
        <div>
          <div style="font-weight:600; margin-bottom:6px;">スレッド（最近 ${COMMENT_FETCH_LIMIT} 件）</div>
          <div id="sch-cmts" class="k-schedule-comments"></div>
        </div>
      </div>
    `;
    mountEl.appendChild(wrap);

    const elDate = wrap.querySelector('#sch-date');
    const elTitle = wrap.querySelector('#sch-title');
    const elDesc = wrap.querySelector('#sch-desc');
    const elUsers = wrap.querySelector('#sch-users');
    const elCmts = wrap.querySelector('#sch-cmts');

    elDate.value = todayLocalYMD();
    await populateUsersSelect(elUsers);

    async function renderComments() {
      elCmts.textContent = '読込中…';
      const cmts = await fetchComments(appId, recordId, COMMENT_FETCH_LIMIT);
      elCmts.innerHTML = '';
      if (!cmts.length) { elCmts.textContent = 'コメントはありません。'; return; }
      cmts.forEach(cmt => {
        const box = document.createElement('div');
        box.className = 'k-schedule-cmt';
        const body = extractCommentText(cmt);
        const at = cmt.createdAt?.replace('T', ' ').replace('Z', '') || '';
        box.innerHTML = `
          <div style="flex:1;">
            <div style="font-size:10px; color:#666; margin-bottom:4px;">${at}</div>
            <pre>${body || '(本文なし)'}</pre>
          </div>
          <div class="k-schedule-cmt-acts">
            <button type="button" data-act="paste-title">タイトルに</button>
            <button type="button" data-act="paste-desc">説明に</button>
          </div>`;
        box.addEventListener('click', (e) => {
          const btn = e.target.closest('button'); if (!btn) return;
          const act = btn.dataset.act; const firstLine = (body.split(/\r?\n/)[0] || '').trim();
          if (act === 'paste-title' && firstLine) elTitle.value = firstLine.slice(0, 255);
          if (act === 'paste-desc') elDesc.value = (elDesc.value ? (elDesc.value + '\n\n') : '') + body;
        });
        elCmts.appendChild(box);
      });
    }
    await renderComments();

    // 便利アクション
    wrap.querySelector('#sch-refresh').addEventListener('click', renderComments);
    wrap.querySelector('#sch-clear').addEventListener('click', () => {
      elDate.value = todayLocalYMD();
      elTitle.value = '';
      elDesc.value = '';
      const login = kintone.getLoginUser();
      for (const o of elUsers.options) o.selected = (o.value === login.code);
    });

    // 予定登録
    wrap.querySelector('#sch-create').addEventListener('click', async () => {
      const date = (elDate.value || '').trim();
      const title = (elTitle.value || '').trim();
      const desc = (elDesc.value || '').trim();
      const users = Array.from(elUsers.selectedOptions).map(o => ({ code: o.value }));
      if (!date) return alert('予定日（終日）を入力してください。');
      if (!title) return alert('予定のタイトルを入力してください。');
      try {
        await createSchedule({
          [S_DATE]: { value: date },
          [S_TITLE]: { value: title },
          [S_DESC]: { value: desc },
          [S_USERS]: { value: users }
        });
        alert('予定を登録しました（アプリID: ' + SCHEDULE_APP_ID + '）。');
        elTitle.value = '';
        elDesc.value = '';
        const login = kintone.getLoginUser();
        for (const o of elUsers.options) o.selected = (o.value === login.code);
      } catch (e) {
        console.error('予定登録エラー:', e);
        alert('予定登録に失敗しました。');
      }
    });

    // —— キャンセル（非表示にするだけ） —— //
    const doHide = () => {
      wrap.style.display = 'none'; // 中身を隠すだけ。再度 init を呼べば復活
      mountEl.dispatchEvent(new CustomEvent('schedulePanel:hidden', { bubbles: false }));
    };
    wrap.querySelector('#sch-close').addEventListener('click', doHide);

    // Esc でも閉じる
    const onKey = (ev) => {
      if (ev.key === 'Escape' && wrap.style.display !== 'none') doHide();
    };
    document.addEventListener('keydown', onKey);
    // 非表示になったら Esc リスナ解除（メモリリーク防止）
    mountEl.addEventListener('schedulePanel:hidden', () => {
      document.removeEventListener('keydown', onKey);
    });
  }

  // ★ ここまで本体

  // 既存：Spaceに描画（従来どおり）
  kintone.events.on(['app.record.detail.show'], async (event) => {
    const space = kintone.app.record.getSpaceElement(SPACE_ID);
    if (!space) return event;

    // ここで非表示にしている場合、ランチャーから表示する時は init 内で display を戻します
    space.style.display = 'none';
    return event;
  });

  // 追加：ランチャーから呼べるフック
  window.userSchedulePanelInit = async function (mountEl) {
    const recObj = kintone.app.record.get();
    const rec = recObj && recObj.record ? recObj.record : {};
    const appId = kintone.app.getId();
    const recordId = recObj && recObj.record ? (recObj.recordId || kintone.app.record.getId()) : kintone.app.record.getId();
    await initSchedulePanel(mountEl, rec, recordId, appId);
  };
})();
