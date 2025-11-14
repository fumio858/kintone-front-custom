// move_portal_notify_to_right.js
// (function () {
//   'use strict';

//   // ----- 設定 -----
//   const PICKER = '.ocean-portal-ntflist';       // 移動したい中身
//   const RIGHT_COL = '.ocean-portal-body-right';  // 右カラム
//   const MOVE_WIDGET_WHOLE = true;                // ウィジェット枠ごと動かす（推奨）
//   const MAX_WAIT_MS = 10000;

//   // ポータルURL判定（/#/portal でマッチ）
//   const isPortal = () => /\/k\/#\/portal(?:$|[/?#])/i.test(location.href);

//   let mo; // MutationObserver（使い回し）

//   function moveOnce() {
//     if (!isPortal()) return false;

//     const right = document.querySelector(RIGHT_COL);
//     const ntfInner = document.querySelector(PICKER);
//     if (!right || !ntfInner) return false;

//     const target = MOVE_WIDGET_WHOLE
//       ? (ntfInner.closest('.ocean-portal-widget') || ntfInner)
//       : ntfInner;

//     if (target.dataset.__moved_to_right === '1') return true; // 2重移動ガード

//     // 右カラム直下の先頭へ移動（末尾にしたい場合は append に変更）
//     right.prepend(target);
//     target.dataset.__moved_to_right = '1';
//     target.style.marginTop = '0';
//     return true;
//   }

//   // ポータル描画完了を待ちながら一度だけ移動
//   function ensureMovedOnceWithObserver() {
//     if (mo) { mo.disconnect(); mo = null; }

//     if (moveOnce()) return;

//     mo = new MutationObserver(() => {
//       if (moveOnce()) {
//         mo && mo.disconnect();
//         mo = null;
//       }
//     });
//     mo.observe(document.documentElement, { childList: true, subtree: true });
//     setTimeout(() => { mo && mo.disconnect(); mo = null; }, MAX_WAIT_MS);
//   }

//   // Reactの再描画直後は要素が入れ替わることがあるので、数回リトライ
//   function burstRetry() {
//     let tries = 0;
//     const timer = setInterval(() => {
//       if (!isPortal()) { clearInterval(timer); return; }
//       if (moveOnce() || ++tries >= 40) clearInterval(timer); // 最大 ~10秒（40*250ms）
//     }, 250);
//   }

//   // 入口：初回ロード時
//   function onLoadOrRouteChange() {
//     if (!isPortal()) return;
//     // すぐ試しつつ、描画待ちとリトライの二段構え
//     ensureMovedOnceWithObserver();
//     burstRetry();
//   }

//   // 初回ロード
//   window.addEventListener('load', onLoadOrRouteChange);
//   // ルーティング（/#/... の変更）でも実行
//   window.addEventListener('hashchange', onLoadOrRouteChange);

//   // SPA内の初期実行（DOMContentLoaded後でも今すぐ）
//   onLoadOrRouteChange();
// })();
