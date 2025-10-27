// == Global Search に「担当事務員」を表示 ==================================
(function () {
  'use strict';

  // ▼ 対象ページ（全体検索）
  if (!location.pathname.startsWith('/k/') || !document.querySelector('[data-testid="keywordSearchResult"]')) return;

  // ▼ 取得候補フィールド（上から優先）
  const CANDIDATE_FIELDS = ['担当事務員', '担当者', 'tanto', 'staff', 'handler'];

  // ▼ 表示用CSS
  const style = document.createElement('style');
  style.textContent = `
    .kf-staff-badge{margin-left:.5em;font-size:12px;opacity:.85;white-space:nowrap}
    .kf-staff-badge::before{content:"｜"}
  `;
  document.head.appendChild(style);

  // ▼ 1) 検索結果から appId / recordId を吸い上げ（重複排除）
  function collectTargets() {
    const container = document.querySelector('[data-testid="keywordSearchResult"]');
    if (!container) return [];

    const items = Array.from(container.querySelectorAll('[data-testid="keywordSearchResult-doc-title"] a[href*="/k/"][href*="record="]'));
    const targets = [];
    for (const a of items) {
      const href = a.getAttribute('href') || '';
      const mApp  = href.match(/\/k\/(\d+)\//);
      const mRec  = href.match(/record=(\d+)/);
      if (!mApp || !mRec) continue;
      const appId = mApp[1];
      const recordId = mRec[1];

      // “by ユーザー”要素
      const footer = a.closest('div')?.parentElement?.querySelector('[data-testid="kwywordSearchResult-doc-footer"], [data-testid="keywordSearchResult-doc-footer"]');
      if (!footer) continue;
      const creatorEl = footer.querySelector('a[href^="/k/#/people/user"]');
      if (!creatorEl) continue;

      // 既に付与済はスキップ
      if (footer.querySelector(`.kf-staff-badge[data-app="${appId}"][data-id="${recordId}"]`)) continue;

      targets.push({ appId, recordId, footer, creatorEl });
    }
    return targets;
  }

  // ▼ 2) app単位で ids バッチ取得 → 候補フィールドのうち存在するもので氏名を作る
  async function fetchStaffMapByApp(appId, ids) {
    // まずは最初の1件で「どのフィールド名が存在するか」探る
    const peek = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
      app: appId,
      id: ids[0],
    });
    const chosen = CANDIDATE_FIELDS.find(f => f in peek.record) || null;
    if (!chosen) return {}; // 見つからない

    // まとめ取得（最大500件想定）
    const resp = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
      app: appId,
      ids,
      fields: [chosen]
    });

    const map = {};
    for (const r of resp.records) {
      const val = r[chosen]?.value;
      let nameText = '';
      if (Array.isArray(val)) {
        // ユーザー選択（複数）想定
        nameText = val.map(v => v && v.name).filter(Boolean).join('・');
      } else if (val && typeof val === 'object' && 'name' in val) {
        // ユーザー選択（単数）や関連型の保険
        nameText = val.name || '';
      } else if (typeof val === 'string') {
        nameText = val;
      }
      map[String(r.$id.value)] = nameText || '';
    }
    return map;
  }

  // ▼ 3) DOMに差し込む
  function paintStaff(target, staffName) {
    if (!staffName) return;
    const badge = document.createElement('span');
    badge.className = 'kf-staff-badge';
    badge.dataset.app = target.appId;
    badge.dataset.id  = target.recordId;
    badge.textContent = `担当事務員：${staffName}`;
    // “by ユーザー”リンクの直後に付与
    target.creatorEl.insertAdjacentElement('afterend', badge);
  }

  // ▼ 4) 全体処理（デバウンス＋MO対応）
  let timer = null;
  async function process() {
    const targets = collectTargets();
    if (targets.length === 0) return;

    // appごとにまとめてAPI
    const byApp = new Map();
    for (const t of targets) {
      if (!byApp.has(t.appId)) byApp.set(t.appId, []);
      byApp.get(t.appId).push(t);
    }

    for (const [appId, arr] of byApp.entries()) {
      // 未処理だけのIDを抽出
      const ids = Array.from(new Set(arr.map(t => t.recordId)));
      try {
        const staffMap = await fetchStaffMapByApp(appId, ids);
        for (const t of arr) {
          paintStaff(t, staffMap[t.recordId] || '');
        }
      } catch (e) {
        // 失敗しても他アプリ分は続行
        // console.warn('fetchStaffMap error', appId, e);
      }
    }
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(process, 200); // 軽いデバウンス
  }

  // 初回＋変更監視（検索条件変更・無限スクロール対応）
  schedule();
  const mo = new MutationObserver(schedule);
  mo.observe(document.body, { childList: true, subtree: true });

})();
