(() => {
  'use strict';

  kintone.events.on('portal.show', (event) => {
    const calendarUrl = 'https://atomfirm.cybozu.com/k/23/'; // ← カレンダー一覧URLに差し替え

    const iframe = document.createElement('iframe');
    iframe.src = calendarUrl;
    iframe.width = '100%';
    iframe.height = '800';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';

    // すでにポータル要素がある場合にクリアしてから挿入
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '800px';
    container.appendChild(iframe);

    const portalEl = document.querySelector('.contents');
    portalEl.innerHTML = ''; // 既存ポータル要素を消す
    portalEl.appendChild(container);

    return event;
  });
})();
