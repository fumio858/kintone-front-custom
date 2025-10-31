(() => {
  'use strict';

  kintone.events.on('portal.show', () => {
    const calendarUrl = 'https://atomfirm.cybozu.com/k/23/?view=13312044'; // ← カレンダーのURL

    // iframe生成
    const iframe = document.createElement('iframe');
    iframe.src = calendarUrl;
    iframe.width = '100%';
    iframe.height = '560';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.padding = '0 0.5rem';
    iframe.style.boxSizing = 'border-box';

    // コンテナ生成
    const container = document.createElement('div');
    container.classList.add('portal-calendar-widget');
    container.appendChild(iframe);

    // 「スペース」ウィジェットを探してその上に挿入
    const spaceWidget = document.querySelector(
      '.ocean-portal-body-right .ocean-portal-widget .gaia-argoui-widget-title'
    );

    let targetWidget = null;
    document.querySelectorAll('.ocean-portal-body-right .gaia-argoui-widget-title').forEach(el => {
      if (el.textContent.trim() === 'スペース') {
        targetWidget = el.closest('.ocean-portal-widget');
      }
    });

    if (targetWidget) {
      targetWidget.insertAdjacentElement('beforebegin', container);
      console.log('✅ カレンダーを「スペース」の上に追加しました');
    } else {
      console.warn('⚠️ 「スペース」ウィジェットが見つかりませんでした');
    }
  });
})();
