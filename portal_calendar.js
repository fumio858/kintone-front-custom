(() => {
  'use strict';

  kintone.events.on('portal.show', () => {
    const calendarUrl = 'https://atomfirm.cybozu.com/k/23/?view=13312044'; // ← カレンダーのURL

    // iframe生成
    const iframe = document.createElement('iframe');
    iframe.src = calendarUrl;
    iframe.width = '100%';
    iframe.height = '600';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    // iframe.style.marginTop = '12px';
    iframe.style.padding = '0 0.5rem';
    iframe.style.boxSizing = 'border-box';

    // コンテナ生成
    const container = document.createElement('div');
    container.classList.add('portal-calendar-widget');
    container.appendChild(iframe);

    // 「未処理」と「スペース」の間を探す
    const rightColumn = document.querySelector('.ocean-portal-body-right');
    if (!rightColumn) {
      console.warn('⚠️ .ocean-portal-body-right が見つかりません');
      return;
    }

    const widgets = rightColumn.querySelectorAll('.ocean-portal-widget');
    let insertTarget = null;

    widgets.forEach((w, i) => {
      const titleEl = w.querySelector('.gaia-argoui-widget-title');
      const title = titleEl ? titleEl.textContent.trim() : '';
      if (title === '未処理') {
        // 次のウィジェットが「スペース」ならその前に挿入
        const nextWidget = widgets[i + 1];
        const nextTitle = nextWidget?.querySelector('.gaia-argoui-widget-title')?.textContent.trim();
        if (nextTitle === 'スペース') {
          insertTarget = nextWidget;
        }
      }
    });

    if (insertTarget) {
      insertTarget.insertAdjacentElement('beforebegin', container);
      console.log('✅ カレンダーを「未処理」と「スペース」の間に追加しました');
    } else {
      console.warn('⚠️ 「未処理」と「スペース」の位置が見つかりません');
    }
  });
})();
