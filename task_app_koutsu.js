// ==== 設定ここから ====
// タスクアプリID
const TASK_APP_ID = 31; // ←タスクアプリのIDに置き換え

// フィールドコード定義（案件/タスク）
const F_CASE_ID = '事案ID';     // 案件アプリの「事案ID」
const T_CASE_ID = '事案ID';     // タスクアプリの「事案ID」
const T_TITLE = '件名';       // タスク.件名（文字列(1行)）
const T_DUE = '期限';       // タスク.期限（日付）
const T_OWNER = '担当者';     // タスク.担当者（ユーザー選択）
const T_STATUS = 'タスクステータス'; // タスク.ステータス（ドロップダウン：未着手/進行中/完了）

// 案件アプリ側のスペース要素ID
const SPACE_ID = 'taskPanel';
// ==== 設定ここまで ====

(function () {
  'use strict';

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);
  const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  kintone.events.on(['app.record.detail.show'], async (event) => {
    const rec = event.record;

    // スペース取得
    const space = kintone.app.record.getSpaceElement(SPACE_ID);
    if (!space) {
      alert(`スペース要素ID「${SPACE_ID}」が見つかりません。レイアウトにスペースを置いて要素ID=${SPACE_ID}を設定してください。`);
      return event;
    }
    space.innerHTML = '';

    // ラッパー
    const wrap = document.createElement('div');
    wrap.classList.add('k-task-panel');
    wrap.style.padding = '12px';
    wrap.style.border = '1px solid #ddd';
    wrap.style.borderRadius = '8px';
    wrap.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <strong>タスク</strong>
        <button id="task-refresh" type="button">再読込</button>
        <span style="margin-left:auto;"></span>
      </div>
      <div id="task-list" style="display:flex; flex-direction:column; gap:6px;"></div>
      <hr/>
      <style>
        /* 左=件名（高さMAX）、右=縦積みの操作列。SPでは1列 */
        .task-add-row{
          display:grid;
          grid-template-columns: 1fr 260px; /* 右の幅を固定→右内の3つの横幅がピタッと揃う */
          gap:12px;
          align-items:stretch;
          margin-top:4px;
        }
        .task-add-left textarea{
          width:100%;
          height:100%;            /* 右列の高さに合わせてMAXに伸びる */
          min-height:120px;       /* 低くなりすぎ防止 */
          resize:vertical;
          padding:10px;
          box-sizing:border-box;
        }
        .task-add-right{
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .task-add-right > *{
          width:100%;             /* セレクト/日付/ボタンの幅を揃える */
          box-sizing:border-box;
        }
        .task-add-right button{
          height:36px;            /* 入力と高さ感を揃える（好みで調整） */
        }
        @media (max-width: 640px){
          .task-add-row{ grid-template-columns: 1fr; }
        }
        .k-task-panel .task-add-right .task-owner,
        .k-task-panel .task-add-right .task-due{
          padding: 8px 4px;       /* 上下8px / 左右4px */
          min-height: 36px;       /* ボタンと高さ感を揃える */
          box-sizing: border-box; /* 幅ズレ防止 */
        }
      </style>

      <div class="task-add-row">
        <div class="task-add-left">
          <textarea id="task-title" placeholder="件名を入力" rows="4"></textarea>
        </div>

        <div class="task-add-right">
          <!-- ▼ class追加。idはJSで使うので残す -->
          <select id="task-owner" class="task-owner">
            <option value="" disabled selected>担当者を選択</option>
          </select>

          <!-- ▼ 日付にもclass付与（見た目揃える用） -->
          <input id="task-due" type="date" class="task-due">

          <button id="task-add" type="button">＋ 追加</button>
        </div>
      </div>
    `;
    space.appendChild(wrap);

    // 案件ID確認（空なら案内だけ）
    const caseId = (rec[F_CASE_ID]?.value || '').trim();
    const listEl = wrap.querySelector('#task-list');
    const chkToday = wrap.querySelector('#task-filter-today');
    const selOwner = wrap.querySelector('#task-owner');

    if (!caseId) {
      listEl.innerHTML = `<div style="color:#c00;">案件側フィールド「${F_CASE_ID}」が空です。値を入れるとタスクを表示・追加できます。</div>`;
      return event;
    }

    // 担当者セレクトにユーザーを入れる（まずは自分）
    await (async function populateOwnerSelect() {
      const login = kintone.getLoginUser();
      selOwner.innerHTML = `<option value="${login.code}">${login.name}（自分）</option>`;
      try {
        let offset = 0, size = 100;
        while (true) {
          const resp = await kintone.api(kUrl('/v1/users'), 'GET', { offset, size });
          const users = resp.users || [];
          for (const u of users) {
            if (!u.valid || u.code === login.code) continue;
            const opt = document.createElement('option');
            opt.value = u.code;
            opt.textContent = u.name;
            selOwner.appendChild(opt);
          }
          if (users.length < size) break;
          offset += size;
        }
        // 既定は自分に
        selOwner.value = login.code;
      } catch (e) {
        console.warn('ユーザー一覧取得に失敗（権限の可能性）: ', e);
        // 自分のみでもOK
      }
    })();

    // --- 追加/置換：ヘルパー ---
    function todayLocalYMD() {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    }
    function normalizeYMD(s) {
      // 'YYYY-MM-DD' / 'YYYY-MM-DDTHH:mm:ssZ' / 余計な空白 → 'YYYYMMDD'（数値比較用）
      if (!s) return '';
      const a = String(s).trim();
      const ymd = a.slice(0, 10);               // 'YYYY-MM-DD'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
      return ymd.replace(/-/g, '');             // 'YYYYMMDD'
    }
    function toYmdNum(s) {
      const n = normalizeYMD(s);
      return n ? Number(n) : NaN;
    }

    // --- 差し替え：render() ---
    async function render() {
      listEl.textContent = '読込中…';
      let records = await fetchTasks();

      // ▼ デバッグ（必要なければ外してOK）
      // console.log('[render] before', records.length, { chk: chkToday.checked, today: todayLocalYMD() });

      if (chkToday.checked) {
        const todayNum = toYmdNum(todayLocalYMD());
        records = records.filter(r => {
          const dueRaw = r?.[T_DUE]?.value || '';
          const dueNum = toYmdNum(dueRaw);
          const status = (r?.[T_STATUS]?.value || '').trim();

          if (!Number.isFinite(dueNum)) return false; // 期限なし/不正は除外
          if (status === '完了') return false;        // 完了は除外
          return dueNum <= todayNum;                  // 今日(含む)以前のみ
        });
      }

      listEl.innerHTML = '';
      if (!records.length) {
        listEl.textContent = '対象タスクはありません。';
        return;
      }
      for (const r of records) listEl.appendChild(row(r));
    }

    async function fetchTasks() {
      const c = (caseId || '').trim();
      const cEsc = c.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); // エスケープ
      // 事案ID一致のみで取得。期限昇順（期限なしは末尾）
      const query = `${T_CASE_ID} = "${cEsc}" order by ${T_DUE} asc`;
   
      try {
        const resp = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: TASK_APP_ID, query
        });
        if ((resp.records || []).length === 0 && /^[0-9]+$/.test(c)) {
          const resp2 = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
            app: TASK_APP_ID, query: `${T_CASE_ID} = ${c} order by ${T_DUE} asc`
          });
          return resp2.records || [];
        }
        return resp.records || [];
      } catch (e) {
        console.error('タスク取得エラー', e);
        listEl.innerHTML = `<div style="color:#c00;">タスク取得でエラー：${e?.message || JSON.stringify(e)}</div>`;
        return [];
      }
    }

    function row(tRec) {
      const id = tRec.$id.value;
      const title = tRec[T_TITLE]?.value || '(無題)';
      const due = tRec[T_DUE]?.value || '';
      const status = tRec[T_STATUS]?.value || '';

      // 追加：担当者名を取得（ユーザー選択は配列）
      const owners = Array.isArray(tRec[T_OWNER]?.value)
        ? tRec[T_OWNER].value.map(u => u.name || u.code).join(', ')
        : '';

      const div = document.createElement('div');
      div.style.display = 'grid';
      div.style.gridTemplateColumns = '1fr auto auto auto';
      div.style.gap = '8px';
      div.style.alignItems = 'center';
      div.style.padding = '6px 8px';
      div.style.background = '#fafafa';
      div.style.borderRadius = '6px';
      div.innerHTML = `
        <div>
          <div style="font-weight:600">${title}</div>
          <div style="font-size:12px;color:#666">
            状態: ${status || '—'} / 担当: ${owners || '—'} / 期限: ${due || '—'}
          </div>
        </div>
        <button data-act="start" type="button">進行中</button>
        <button data-act="done" type="button">完了</button>
        <a href="${location.origin}/k/${TASK_APP_ID}/show#record=${id}" target="_blank">開く</a>
      `;
      div.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const newStatus = btn.dataset.act === 'start' ? '進行中' : '完了';
        try {
          await kintone.api(kUrl('/k/v1/record'), 'PUT', {
            app: TASK_APP_ID,
            id,
            record: { [T_STATUS]: { value: newStatus } }
          });
          render();
        } catch (e2) {
          console.error('更新エラー', e2);
          alert('タスク更新に失敗しました。権限やフィールド設定をご確認ください。');
        }
      });
      return div;
    }

    async function render() {
      listEl.textContent = '読込中…';
      let records = await fetchTasks();
      listEl.innerHTML = '';
      if (!records.length) {
        listEl.textContent = '対象タスクはありません。';
        return;
      }
      for (const r of records) listEl.appendChild(row(r));
    }

    // 追加ボタン
    wrap.querySelector('#task-add').addEventListener('click', async () => {
      const title = (wrap.querySelector('#task-title').value || '').trim();
      const due = (wrap.querySelector('#task-due').value || '').trim(); // 空なら空文字で送る
      const owner = wrap.querySelector('#task-owner').value || kintone.getLoginUser().code;
      if (!title) return alert('件名を入力してください');

      // 同一案件×同名タスク重複チェック（必要なければこの3行を削ってOK）
      const dupQ = `${T_CASE_ID} = "${esc(caseId)}" and ${T_TITLE} = "${esc(title)}" limit 1`;
      const dup = await kintone.api(kUrl('/k/v1/records'), 'GET', { app: TASK_APP_ID, query: dupQ });
      if ((dup.records || []).length) return alert('この案件に同名のタスクが既にあります。件名を変えてください。');

      const record = {
        [T_CASE_ID]: { value: caseId },
        [T_TITLE]: { value: title },
        [T_DUE]: { value: due || "" }, // 既定値抑止のため空は空文字を送る
        [T_OWNER]: { value: [{ code: owner }] },
        [T_STATUS]: { value: '未着手' }
      };

      try {
        await kintone.api(kUrl('/k/v1/record'), 'POST', { app: TASK_APP_ID, record });
        wrap.querySelector('#task-title').value = '';
        wrap.querySelector('#task-due').value = '';
        // 追加後は担当者を自分に戻す
        const login = kintone.getLoginUser();
        if (login?.code) selOwner.value = login.code;
        render();
      } catch (e) {
        console.error('作成エラー', e);
        alert(
          'タスク作成に失敗しました。\n' +
          '・権限（タスクアプリに追加権限）があるか\n' +
          '・フィールドコード（事案ID/件名/期限/担当者/ステータス）が正しいか\n' +
          '・必須項目の未送信が無いか\n' +
          '・ドロップダウンの選択肢が「未着手/進行中/完了」と一致しているか\n\n' +
          '詳細: ' + (e.message || JSON.stringify(e))
        );
      }
    });

    wrap.querySelector('#task-refresh').addEventListener('click', render);

    // 初回描画
    render();

    return event;
  });
})();
