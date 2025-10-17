(function () {
  'use strict';

  // ▼ URLに「portal」が含まれる時だけ実行
  if (!location.href.includes('portal')) return;

  const PICKER = '.ocean-portal-ntflist';
  const RIGHT_COL = '.ocean-portal-body-right';
  const MOVE_WIDGET_WHOLE = true;
  const MAX_WAIT_MS = 10000;

  function moveOnce() {
    const right = document.querySelector(RIGHT_COL);
    const ntfInner = document.querySelector(PICKER);
    if (!right || !ntfInner) return false;
    const target = MOVE_WIDGET_WHOLE
      ? (ntfInner.closest('.ocean-portal-widget') || ntfInner)
      : ntfInner;
    if (target.dataset.__moved_to_right === '1') return true;
    right.prepend(target);
    target.dataset.__moved_to_right = '1';
    target.style.marginTop = '0';
    return true;
  }

  if (moveOnce()) return;
  const obs = new MutationObserver(() => {
    if (moveOnce()) obs.disconnect();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), MAX_WAIT_MS);
})();
