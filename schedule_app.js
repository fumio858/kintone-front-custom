// ==== 設定ここから ====
const SCHEDULE_APP_ID = 45;
const SCHEDULE_S_DATE  = 'date';         // 予定日のフィールドコード
const SCHEDULE_S_TITLE = 'title';         // 予定タイトルのフィールドコード
const SCHEDULE_S_DESC  = 'description';   // 予定説明のフィールドコード
const SCHEDULE_S_USERS = 'attendees';     // ユーザー選択のフィールドコード
const SCHEDULE_SPACE_ID = 'schedulePanel';

// ▼ スケジュールアプリ側に追加した「案件ID／分野」フィールド
const SCHEDULE_S_CASE_ID_FIELD   = 'case_id';   // NEW: スケジュールアプリの案件ID
const SCHEDULE_S_CASE_TYPE_FIELD = 'case_type'; // NEW: スケジュールアプリの分野

// ▼ 元アプリ（呼び出し側）に存在する案件IDフィールドコード
const F_CASE_ID = 'case_id'; // NEW: 呼び出し元レコードから拾う

// ▼ 分野ラベル定義（タスクと同じ）
const SCHEDULE_CASE_TYPE = {          // NEW
  CRIMINAL: '刑事事件',
  TRAFFIC:  '交通事故',
  OTHER:    'その他',
};

// ▼ URLの k/{appId}/ に応じた分野マッピング
const SCHEDULE_APP_ID_TO_CASE_TYPE = { // NEW
  22: SCHEDULE_CASE_TYPE.CRIMINAL,
  26: SCHEDULE_CASE_TYPE.TRAFFIC,
  41: SCHEDULE_CASE_TYPE.OTHER,
};
// ==== 設定ここまで ====

(function () {
  'use strict';
  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  function todayLocalYMD() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  // NEW: 現在のアプリIDを取得（getId優先、ダメならURLから）
  function getCurrentAppId() {
    try {
      const id = kintone.app.getId();
      if (id) return Number(id);
    } catch (_) {}
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

  // ★ 任意のマウント先に描画する本体
  async function initSchedulePanel(mountEl, rec, recordId, appId) {
    if (!mountEl) return;

    // NEW: 分野ラベルと案件IDを決定
    const currentAppId   = getCurrentAppId();                               // NEW
    const caseTypeLabel  = SCHEDULE_APP_ID_TO_CASE_TYPE[currentAppId] ?? CASE_TYPE.OTHER; // NEW
    const caseId         = (rec?.[F_CASE_ID]?.value || '').toString().trim();    // NEW

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
        <strong>スケジュール登録</strong>
        <div style="margin-left:auto; display:flex; gap:6px;">
          <button id="sch-clear" type="button">入力クリア</button>
          <button id="sch-close" type="button" aria-label="閉じる（Esc）">キャンセル</button>
        </div>
      </div>
      <style>
        button { font-size:13px; }
        .k-schedule-form-left, .k-schedule-form-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .k-schedule-form-wrapper {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 12px;
        }
        .k-schedule-form-wrapper input[type="text"],
        .k-schedule-form-wrapper input[type="date"],
        .k-schedule-form-wrapper textarea,
        .k-schedule-form-wrapper select {
          border: 1px solid #e3e7e8;
          border-radius: 6px;
          width:100%; padding:8px; box-sizing:border-box;
        }
        .k-schedule-form-left textarea {
          flex-grow: 1;
          resize: vertical;
        }
        .k-schedule-actions button, #sch-clear, #sch-close {
          padding: .5rem .75rem;
          background: #fff;
          border-radius: 6px;
          border: 1px solid #e3e7e8;
          font-size: .9rem;
        }
        .k-schedule-form-wrapper input:focus,
        .k-schedule-form-wrapper textarea:focus,
        .k-schedule-form-wrapper select:focus,
        .k-schedule-actions button:focus,
        #sch-clear:focus,
        #sch-close:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(227,231,232,.4);
          border-color: #e3e7e8;
        }
        #sch-create {
          background-color: #3598db;
          color: #FFF;
          width: 100%;
        }
        #sch-close, #sch-clear {
          font-size: 12px;
          padding: 6px 10px;
        }
        #sch-close:hover, #sch-clear:hover { background: #f5f7f8; }
        @media (max-width:600px){
          .k-schedule-form-wrapper { grid-template-columns: 1fr; }
        }
      </style>
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

    const elDate  = wrap.querySelector('#sch-date');
    const elTitle = wrap.querySelector('#sch-title');
    const elDesc  = wrap.querySelector('#sch-desc');
    const elUsers = wrap.querySelector('#sch-users');

    elDate.value = todayLocalYMD();
    await populateUsersSelect(elUsers);

    // 便利アクション
    wrap.querySelector('#sch-clear').addEventListener('click', () => {
      elDate.value = todayLocalYMD();
      elTitle.value = '';
      elDesc.value = '';
      const login = kintone.getLoginUser();
      for (const o of elUsers.options) o.selected = (o.value === login.code);
    });

    // 予定登録
    const createBtn = wrap.querySelector('#sch-create'); // NEW
    createBtn.addEventListener('click', async () => {
      const date  = (elDate.value || '').trim();
      const title = (elTitle.value || '').trim();
      const desc  = (elDesc.value || '').trim();
      const users = Array.from(elUsers.selectedOptions).map(o => ({ code: o.value }));
      if (!date)  return alert('予定日（終日）を入力してください。');
      if (!title) return alert('予定のタイトルを入力してください。');

      // タスク側と揃えるなら、案件ID必須にするのがおすすめ
      if (!caseId) {
        return alert(`案件側フィールド「${F_CASE_ID}」が空です。値を入れてから登録してください。`);
      }

      // 二重クリック防止
      createBtn.disabled = true;                         // NEW
      const prev = createBtn.textContent;                // NEW
      createBtn.textContent = '登録中…';                // NEW

      try {
        await createSchedule({
          [SCHEDULE_S_DATE]:  { value: date },
          [SCHEDULE_S_TITLE]: { value: title },
          [SCHEDULE_S_DESC]:  { value: desc },
          [SCHEDULE_S_USERS]: { value: users },
          // ▼ ここで案件IDと分野をスケジュールアプリへ保存
          [SCHEDULE_S_CASE_ID_FIELD]:   { value: caseId },        // NEW
          [SCHEDULE_S_CASE_TYPE_FIELD]: { value: caseTypeLabel }, // NEW
        });
        alert('予定を登録しました。');
        elTitle.value = '';
        elDesc.value  = '';
        const login = kintone.getLoginUser();
        for (const o of elUsers.options) o.selected = (o.value === login.code);
      } catch (e) {
        console.error('予定登録エラー:', e);
        const msg = e?.message || (e?.errors && JSON.stringify(e.errors)) || e?.code || '不明なエラー';
        alert(`予定登録に失敗しました。\n${msg}`);
      } finally {
        createBtn.disabled = false;                      // NEW
        createBtn.textContent = prev;                    // NEW
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

  // Space 自動初期化（ランチャーが無くても出す／二重初期化ガード付き）
  kintone.events.on(['app.record.detail.show'], async (event) => {
    const space = kintone.app.record.getSpaceElement(SCHEDULE_SPACE_ID);
    if (!space) return event;
    if (!space.dataset.initedSchedulePanel) {
      space.dataset.initedSchedulePanel = '1';
      try {
        await window.userSchedulePanelInit(space);
      } catch (e) {
        console.warn('[schedule] auto init failed:', e);
      }
    }
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
