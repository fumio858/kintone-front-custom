// ==== 設定ここから ====
const SCHEDULE_APP_ID = 45;
const SCHEDULE_S_DATE  = 'date';
const SCHEDULE_S_TITLE = 'title';
const SCHEDULE_S_DESC  = 'description';
const SCHEDULE_S_USERS = 'attendees';
const SCHEDULE_SPACE_ID = 'schedulePanel';

// ▼ スケジュールアプリ側に追加した「案件ID／分野」フィールド
const SCHEDULE_S_CASE_ID_FIELD   = 'case_id';
const SCHEDULE_S_CASE_TYPE_FIELD = 'case_type';

// ▼ 元アプリ（呼び出し側）に存在する案件IDフィールドコード
const SCHEDULE_F_CASE_ID = 'case_id'; // ★RENAME: 旧 F_CASE_ID 衝突回避

// ▼ 分野ラベル定義
const SCHEDULE_CASE_TYPE = {
  CRIMINAL: '刑事事件',
  TRAFFIC:  '交通事故',
  OTHER:    '刑事交通以外',
};

// ▼ URLの k/{appId}/ に応じた分野マッピング
const SCHEDULE_APP_ID_TO_CASE_TYPE = {
  22: SCHEDULE_CASE_TYPE.CRIMINAL,
  26: SCHEDULE_CASE_TYPE.TRAFFIC,
  55: SCHEDULE_CASE_TYPE.OTHER,
};
// ==== 設定ここまで ====

(function () {
  'use strict';
  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);
  const esc = (s='') => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); // NEW: クエリ用

  function todayLocalYMD() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function getCurrentAppId() {
    try { const id = kintone.app.getId(); if (id) return Number(id); } catch(_) {}
    const m = location.pathname.match(/\/k\/(\d+)\//);
    return m ? Number(m[1]) : NaN;
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

  async function createSchedule(record) {
    return kintone.api(kUrl('/k/v1/record'), 'POST', { app: SCHEDULE_APP_ID, record });
  }

  // NEW: 一覧取得
  async function fetchSchedules(caseId, caseTypeLabel) {
    try {
      let query = '';
      if (caseId) {
        const c = esc(caseId);
        query = `${SCHEDULE_S_CASE_ID_FIELD} = "${c}"`;
        if (caseTypeLabel) {
          query += ` and ${SCHEDULE_S_CASE_TYPE_FIELD} = "${esc(caseTypeLabel)}"`;
        }
        query += ` order by ${SCHEDULE_S_DATE} asc`;
      } else {
        query = `order by ${SCHEDULE_S_DATE} desc limit 50`; // 案件IDなし時は直近50件
      }
      const resp = await kintone.api(kUrl('/k/v1/records.json'), 'GET', { app: SCHEDULE_APP_ID, query });
      return resp.records || [];
    } catch (e) {
      console.error('[schedule] 取得エラー:', e);
      return [];
    }
  }

  // NEW: 一覧の1行
  function scheduleRow(r) {
    const id = r.$id.value;
    const d  = r[SCHEDULE_S_DATE]?.value || '—';
    const t  = r[SCHEDULE_S_TITLE]?.value || '(無題)';
    const users = Array.isArray(r[SCHEDULE_S_USERS]?.value) ? r[SCHEDULE_S_USERS].value.map(u => u.name || u.code).join(', ') : '—';
    const div = document.createElement('div');
    Object.assign(div.style, {display:'grid', gridTemplateColumns:'1fr auto', gap:'8px', padding:'6px 8px', alignItems:'center', background:'#fafafa', borderBottom :'dotted 1px #e4e1e1'});
    div.innerHTML = `
      <div>
        <div style="font-weight:600">${t}</div>
        <div style="font-size:12px;color:#666">日付: ${d} / 参加: ${users}</div>
      </div>
      <a href="${location.origin}/k/${SCHEDULE_APP_ID}/show#record=${id}" target="_blank">開く</a>
    `;
    return div;
  }

  // --- フォールバックで mount を見つける（カレンダー互換 + さらに堅牢） ---
  function resolveMountEl(mountEl) {
    if (mountEl && mountEl.nodeType === 1) return mountEl;
    // 1) ランチャーの mirror 既存？
    const mirror = document.querySelector('[data-mirror-of="user-js-schedulePanel"]');
    if (mirror) return mirror;
    // 2) Space フィールド
    const space = kintone.app.record.getSpaceElement(SCHEDULE_SPACE_ID);
    if (space) return space;
    // 3) コメントフォームの直後に mirror を自作（最終フォールバック）
    const form = document.querySelector('.ocean-ui-comments-commentform-form');
    if (form) {
      const m = document.createElement('div');
      m.dataset.mirrorOf = 'user-js-schedulePanel';
      Object.assign(m.style, { marginTop: '12px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' });
      form.insertAdjacentElement('afterend', m);
      return m;
    }
    // 4) 最後の手段：レコード詳細の末尾
    const container = document.querySelector('#record-gaia, .contents-gaia, body');
    const m2 = document.createElement('div');
    m2.dataset.mirrorOf = 'user-js-schedulePanel';
    container.appendChild(m2);
    return m2;
  }

  // ★ 任意のマウント先に描画する本体
  async function initSchedulePanel(mountEl, rec, recordId, appId) {
    try {
      mountEl = resolveMountEl(mountEl);
      if (!mountEl) return console.warn('[schedule] mountEl not found');

      const currentAppId  = getCurrentAppId();
      const caseTypeLabel = SCHEDULE_APP_ID_TO_CASE_TYPE[currentAppId] ?? SCHEDULE_CASE_TYPE.OTHER;
      const caseId        = (rec?.[SCHEDULE_F_CASE_ID]?.value || '').toString().trim();

      mountEl.style.display = '';
      mountEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.classList.add('k-schedule-panel');
    wrap.style.padding = '12px';
    wrap.style.background = '#f7f9fa';
    wrap.style.display = '';

    wrap.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <strong>スケジュール登録</strong>
        <div style="margin-left:auto; display:flex; gap:6px;">
          <button id="sch-show-list" type="button">スケジュール一覧</button> <!-- NEW -->
          <button id="sch-clear" type="button">入力クリア</button>
          <button id="sch-close" type="button" aria-label="閉じる（Esc）">キャンセル</button>
        </div>
      </div>
      <style>
        button { font-size:13px; }
        .k-schedule-form-left, .k-schedule-form-right { display:flex; flex-direction:column; gap:8px; }
        .k-schedule-form-wrapper { display:grid; grid-template-columns: 1fr 260px; gap:12px; }
        .k-schedule-form-wrapper input[type="text"], .k-schedule-form-wrapper input[type="date"],
        .k-schedule-form-wrapper textarea, .k-schedule-form-wrapper select {
          border:1px solid #e3e7e8; border-radius:6px; width:100%; padding:8px; box-sizing:border-box;
        }
        .k-schedule-form-left textarea { flex-grow:1; resize:vertical; }
        .k-schedule-actions button, #sch-clear, #sch-close, #sch-show-list {
          padding:.5rem .75rem; background:#fff; border-radius:6px; border:1px solid #e3e7e8; font-size:.9rem;
        }
        .k-schedule-form-wrapper input:focus, .k-schedule-form-wrapper textarea:focus,
        .k-schedule-form-wrapper select:focus, .k-schedule-actions button:focus,
        #sch-clear:focus, #sch-close:focus, #sch-show-list:focus {
          outline:none; box-shadow:0 0 0 3px rgba(227,231,232,.4); border-color:#e3e7e8;
        }
        #sch-create { background-color:#3598db; color:#FFF; width:100%; }
        #sch-create:hover { background-color:#1182ce; }
        #sch-close, #sch-clear, #sch-show-list { font-size:12px; padding:6px 10px; }
        #sch-close:hover, #sch-clear:hover, #sch-show-list:hover { background:#f5f7f8; }
        @media (max-width:600px){ .k-schedule-form-wrapper { grid-template-columns:1fr; } }
      </style>

      <div id="sch-list" style="display:none; flex-direction:column; gap:6px; margin-bottom:12px;"></div> <!-- NEW -->

      <div class="k-schedule-form-wrapper">
        <div class="k-schedule-form-left">
            <label>予定のタイトル <input id="sch-title" type="text" placeholder="例）打ち合わせ"></label>
            <label style="display:flex; flex-direction:column; flex-grow:1;">予定の説明 <textarea id="sch-desc" placeholder="予定の詳細やメモを入力"></textarea></label>
        </div>
        <div class="k-schedule-form-right">
            <label>予定日（終日） <input id="sch-date" type="date"></label>
            <label>参加者（複数選択可） <select id="sch-users" multiple size="8"></select></label>
            <div class="k-schedule-actions">
              <button id="sch-create" type="button">＋ 予定を登録</button>
            </div>
        </div>
      </div>
    `;
    mountEl.appendChild(wrap);

    const listEl = wrap.querySelector('#sch-list');        // NEW
    const btnShowList = wrap.querySelector('#sch-show-list'); // NEW

    const elDate  = wrap.querySelector('#sch-date');
    const elTitle = wrap.querySelector('#sch-title');
    const elDesc  = wrap.querySelector('#sch-desc');
    const elUsers = wrap.querySelector('#sch-users');

    elDate.value = todayLocalYMD();
    await populateUsersSelect(elUsers);

    // NEW: 一覧トグル＋初回ロード
    let listLoaded = false;
    async function renderList() {
      listEl.textContent = '読込中…';
      const records = await fetchSchedules(caseId, caseTypeLabel);
      listEl.innerHTML = '';
      if (!records.length) {
        listEl.textContent = caseId ? 'この案件の予定はありません。' : '予定が見つかりません。';
        return;
      }
      for (const r of records) listEl.appendChild(scheduleRow(r));
    }
    btnShowList.addEventListener('click', async () => {
      const hidden = listEl.style.display === 'none';
      if (hidden) {
        listEl.style.display = 'flex';
        btnShowList.textContent = '一覧を隠す';
        if (!listLoaded) { await renderList(); listLoaded = true; }
      } else {
        listEl.style.display = 'none';
        btnShowList.textContent = 'スケジュール一覧';
      }
    });

    // 便利アクション
    wrap.querySelector('#sch-clear').addEventListener('click', () => {
      elDate.value = todayLocalYMD();
      elTitle.value = '';
      elDesc.value = '';
      const login = kintone.getLoginUser();
      for (const o of elUsers.options) o.selected = (o.value === login.code);
    });

    // 予定登録
    const createBtn = wrap.querySelector('#sch-create');
    createBtn.addEventListener('click', async () => {
      const date  = (elDate.value || '').trim();
      const title = (elTitle.value || '').trim();
      const desc  = (elDesc.value || '').trim();
      const users = Array.from(elUsers.selectedOptions).map(o => ({ code: o.value }));
      if (!date)  return alert('予定日（終日）を入力してください。');
      if (!title) return alert('予定のタイトルを入力してください。');
      if (!caseId) return alert(`案件側フィールド「${SCHEDULE_F_CASE_ID}」が空です。値を入れてから登録してください。`);

      createBtn.disabled = true;
      const prev = createBtn.textContent;
      createBtn.textContent = '登録中…';

      try {
        await createSchedule({
          [SCHEDULE_S_DATE]:  { value: date },
          [SCHEDULE_S_TITLE]: { value: title },
          [SCHEDULE_S_DESC]:  { value: desc },
          [SCHEDULE_S_USERS]: { value: users },
          [SCHEDULE_S_CASE_ID_FIELD]:   { value: caseId },
          [SCHEDULE_S_CASE_TYPE_FIELD]: { value: caseTypeLabel },
        });
        alert('予定を登録しました。');
        elTitle.value = '';
        elDesc.value  = '';
        const login = kintone.getLoginUser();
        for (const o of elUsers.options) o.selected = (o.value === login.code);

        // NEW: 一覧開いてたら再読込
        if (listEl.style.display !== 'none') { await renderList(); }
      } catch (e) {
        console.error('予定登録エラー:', e);
        const msg = e?.message || (e?.errors && JSON.stringify(e.errors)) || e?.code || '不明なエラー';
        alert(`予定登録に失敗しました。\n${msg}`);
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = prev;
      }
    });

    // —— キャンセル（非表示にするだけ） —— //
    const doHide = () => {
      wrap.style.display = 'none';
      mountEl.dispatchEvent(new CustomEvent('schedulePanel:hidden', { bubbles: false }));
    };
    wrap.querySelector('#sch-close').addEventListener('click', doHide);

    const onKey = (ev) => { if (ev.key === 'Escape' && wrap.style.display !== 'none') doHide(); };
    document.addEventListener('keydown', onKey);
    mountEl.addEventListener('schedulePanel:hidden', () => { document.removeEventListener('keydown', onKey); });
    } catch (err) {
      console.error('[schedule] initSchedulePanel fatal:', err);
    }
  }

  // Space 自動初期化（ランチャーが無くても出す／二重初期化ガード付き）
  kintone.events.on(['app.record.detail.show'], async (event) => {
    const space = kintone.app.record.getSpaceElement(SCHEDULE_SPACE_ID);
    if (!space) return event;
    if (!space.dataset.initedSchedulePanel) {
      space.dataset.initedSchedulePanel = '1';
      try { await window.userSchedulePanelInit(space); } catch (e) { console.warn('[schedule] auto init failed:', e); }
    }
    return event;
  });

  // ランチャーから呼べるフック
  window.userSchedulePanelInit = async function (mountEl) {
    const recObj = kintone.app.record.get();
    const rec = recObj && recObj.record ? recObj.record : {};
    const appId = kintone.app.getId();
    const recordId = recObj && recObj.record ? (recObj.recordId || kintone.app.record.getId()) : kintone.app.record.getId();
    await initSchedulePanel(mountEl, rec, recordId, appId);
  };
})();
