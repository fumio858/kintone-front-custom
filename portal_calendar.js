(() => {
  'use strict';

  kintone.events.on('portal.show', () => {
    const calendarUrl = 'https://atomfirm.cybozu.com/k/23/?view=13312044'; // ← カレンダーのURLに変更

    // iframe生成
    const iframe = document.createElement('iframe');
    iframe.src = calendarUrl;
    iframe.width = '100%';
    iframe.height = '800';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.marginTop = '12px';
    iframe.style.borderRadius = '8px';

    // コンテナ生成（見た目調整用）
    const container = document.createElement('div');
    container.classList.add('portal-calendar-widget');
    container.appendChild(iframe);

    // 挿入先を探す
    const widget = document.querySelector('.ocean-portal-body-left .ocean-portal-widget');
    if (widget) {
      widget.insertAdjacentElement('afterend', container);
      console.log('✅ カレンダーを追加しました');
    } else {
      console.warn('⚠️ .ocean-portal-widget が見つかりません');
    }
  });
})();
