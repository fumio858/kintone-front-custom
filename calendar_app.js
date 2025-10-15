// ==== 設定ここから ====
// 予定アプリID（Googleカレンダーと同期しているアプリ）
const SCHEDULE_APP_ID = 45;

// 予定アプリのフィールドコード
const S_DATE  = '予定日';          // 日付（終日）: 'YYYY-MM-DD'
const S_TITLE = '予定のタイトル';   // テキスト(1行)
const S_DESC  = '予定の説明';       // テキスト(複数行OK)
const S_USERS = '参加者';          // ユーザー選択（複数可 推奨）

// スペース要素ID（このスペースにUIを描画します）
const SPACE_ID = 'schedulePanel';

// 右側に表示するスレッド（コメント）取得数
const COMMENT_FETCH_LIMIT = 10;
// ==== 設定ここまで ====


(function () {
  'use strict';

  const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);

  // 日付の既定値（ローカル今日）
  function todayLocalYMD() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  }

  // ユーザー一覧を <select multiple> に流し込み
  async function populateUsersSelect(selectEl) {
    // 既定で自分を先頭に
    const login = kintone.getLoginUser();
    selectEl.innerHTML = '';
    const optMe = document.createElement('option');
    optMe.value = login.code;
    optMe.textContent = `${login.name}（自分）`;
    optMe.selected = true;
    selectEl.appendChild(optMe);

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
      console.warn('ユーザー一覧取得に失敗（権限の可能性）: ', e);
    }
  }

  // レコードのコメントを新しい順で取得
  async function fetchComments(appId, recordId, limit = 10) {
    try {
      const res = await kintone.api(kUrl('/k/v1/record/comments'), 'GET', {
        app: appId,
        record: recordId,
        order: 'desc',
        offset: 0,
        limit
      });
      return res.comments || [];
    } catch (e) {
      console.error('コメント取得失敗: ', e);
      return [];
    }
  }

  // コメントの本文抽出（引用/改行整形など最低限）
  function extractCommentText(cmt) {
    // cmt.text はプレーンテキスト。必要があれば整形
    return (cmt.text || '').trim();
  }

  // 予定を作成
  async function createSchedule(record) {
    // record = { [S_DATE]: {value:'YYYY-MM-DD'}, [S_TITLE]:{value:'..'}, [S_DESC]:{value:'..'}, [S_USERS]:{value:[{code:'...'}]} }
    return kintone.api(kUrl('/k/v1/record'), 'POST', {
      app: SCHEDULE_APP_ID,
      record
    });
  }

  // メイン描画
  kintone.events.on(['app.record.detail.show'], async (event) => {
    const rec = event.record;
    const recordId = event.recordId;       // 今開いている元レコードのID
    const appId = kintone.app.getId();     // 今開いている元アプリのID

    const space = kintone.app.record.getSpaceElement(SPACE_ID);
    if (!space) {
      alert(`スペース要素ID「${SPACE_ID}」が見つかりません。レイアウトにスペースを置いて要素ID=${SPACE_ID}を設定してください。`);
      return event;
    }
    space.innerHTML = '';

    // ラッパー
    const wrap = document.createElement('div');
    wrap.classList.add('k-schedule-panel');
    wrap.style.padding = '12px';
    wrap.style.border = '1px solid #ddd';
    wrap.style.borderRadius = '8px';
    wrap.style.background = '#fff';

    wrap.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <strong>予定登録（アプリID: ${SCHEDULE_APP_ID}）</strong>
        <button id="sch-refresh" type="button">コメント再読込</button>
        <span style="margin-left:auto; font-size:12px; color:#666;">スレッドの内容から予定を作成できます</span>
      </div>

      <style>
        .k-schedule-grid{
          display:grid;
          grid-template-columns: 1fr 320px;
          gap:12px;
        }
        @media (max-width: 800px){
          .k-schedule-grid{ grid-template-columns: 1fr; }
        }
        .k-schedule-form{
          display:flex; flex-direction:column; gap:8px;
        }
        .k-schedule-form input[type="text"],
        .k-schedule-form input[type="date"],
        .k-schedule-form textarea,
        .k-schedule-form select{
          width:100%;
          padding:8px;
          box-sizing:border-box;
        }
        .k-schedule-comments{
          display:flex; flex-direction:column; gap:8px;
          max-height:420px; overflow:auto; border-left:1px dashed #e5e7eb; padding-left:12px;
        }
        .k-schedule-cmt{
          background:#fafafa; border-radius:6px; padding:8px; display:flex; gap:8px;
        }
        .k-schedule-cmt-acts{ display:flex; align-items:flex-start; gap:6px; }
        .k-schedule-cmt pre{
          white-space:pre-wrap; word-break:break-word; margin:0;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .k-schedule-actions{ display:flex; gap:8px; }
      </style>

      <div class="k-schedule-grid">
        <!-- 左：入力フォーム -->
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

        <!-- 右：スレッド最近10件 -->
        <div>
          <div style="font-weight:600; margin-bottom:6px;">スレッド（最近 ${COMMENT_FETCH_LIMIT} 件）</div>
          <div id="sch-cmts" class="k-schedule-comments"></div>
        </div>
      </div>
    `;
    space.appendChild(wrap);

    // 既定値
    const elDate = wrap.querySelector('#sch-date');
    const elTitle = wrap.querySelector('#sch-title');
    const elDesc = wrap.querySelector('#sch-desc');
    const elUsers = wrap.querySelector('#sch-users');
    const elCmts = wrap.querySelector('#sch-cmts');

    elDate.value = todayLocalYMD();
    await populateUsersSelect(elUsers);

    // コメント描画
    async function renderComments() {
      elCmts.textContent = '読込中…';
      const cmts = await fetchComments(appId, recordId, COMMENT_FETCH_LIMIT);
      elCmts.innerHTML = '';
      if (!cmts.length) {
        elCmts.textContent = 'コメントはありません。';
        return;
      }
      cmts.forEach((cmt) => {
        const box = document.createElement('div');
        box.className = 'k-schedule-cmt';
        const body = extractCommentText(cmt);
        const author = cmt.createdBy?.name || cmt.createdBy?.code || '（不明）';
        const at = cmt.createdAt?.replace('T',' ').replace('Z','') || '';
        box.innerHTML = `
          <div style="flex:1;">
            <div style="font-size:12px; color:#666; margin-bottom:4px;">${author} / ${at}</div>
            <pre>${body || '(本文なし)'}</pre>
          </div>
          <div class="k-schedule-cmt-acts">
            <button type="button" data-act="paste-title">タイトルに</button>
            <button type="button" data-act="paste-desc">説明に</button>
            <button type="button" data-act="both">タイトル＋説明</button>
          </div>
        `;
        box.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const act = btn.dataset.act;
          if (act === 'paste-title') {
            // 1行目をタイトルに
            const firstLine = (body.split(/\r?\n/)[0] || '').trim();
            if (firstLine) elTitle.value = firstLine.slice(0, 255);
          } else if (act === 'paste-desc') {
            elDesc.value = (elDesc.value ? (elDesc.value + '\n\n') : '') + body;
          } else if (act === 'both') {
            const firstLine = (body.split(/\r?\n/)[0] || '').trim();
            if (firstLine) elTitle.value = firstLine.slice(0, 255);
            elDesc.value = (elDesc.value ? (elDesc.value + '\n\n') : '') + body;
          }
        });
        elCmts.appendChild(box);
      });
    }

    await renderComments();

    // ボタン動作
    wrap.querySelector('#sch-refresh').addEventListener('click', renderComments);
    wrap.querySelector('#sch-clear').addEventListener('click', () => {
      elDate.value = todayLocalYMD();
      elTitle.value = '';
      elDesc.value = '';
      // 参加者は自分だけ選択状態に戻す
      const login = kintone.getLoginUser();
      for (const o of elUsers.options) o.selected = (o.value === login.code);
    });

    wrap.querySelector('#sch-create').addEventListener('click', async () => {
      const date = (elDate.value || '').trim();
      const title = (elTitle.value || '').trim();
      const desc = (elDesc.value || '').trim();
      const users = Array.from(elUsers.selectedOptions).map(o => ({ code: o.value }));

      if (!date) return alert('予定日（終日）を入力してください。');
      if (!title) return alert('予定のタイトルを入力してください。');

      const record = {
        [S_DATE]:  { value: date },
        [S_TITLE]: { value: title },
        [S_DESC]:  { value: desc },
        [S_USERS]: { value: users }
      };

      try {
        await createSchedule(record);
        alert('予定を登録しました（アプリID: ' + SCHEDULE_APP_ID + '）。');
        // クリア
        elTitle.value = '';
        elDesc.value = '';
        const login = kintone.getLoginUser();
        for (const o of elUsers.options) o.selected = (o.value === login.code);
      } catch (e) {
        console.error('予定登録エラー: ', e);
        alert(
          '予定登録に失敗しました。\n' +
          '・アプリIDやフィールドコードが正しいか\n' +
          '・権限（予定アプリに追加権限）があるか\n' +
          '・フィールド型の不一致がないか\n\n' +
          '詳細: ' + (e?.message || JSON.stringify(e))
        );
      }
    });

    return event;
  });
})();
