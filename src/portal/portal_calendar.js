import { TASK_APP_ID } from '../common/kintone-constants';

'use strict';

kintone.events.on('portal.show', () => {
  const calendarViewId = '13312044'; // カレンダービューのID
  const calendarUrl = `https://atomfirm.cybozu.com/k/${TASK_APP_ID}/?view=${calendarViewId}`;

  // iframe生成
  const iframe = document.createElement('iframe');
  iframe.src = calendarUrl;
  iframe.width = '100%';
  iframe.height = '800';
  iframe.style.border = '0';
  iframe.style.overflow = 'hidden';
  iframe.style.padding = '0 0.5rem';
  iframe.style.boxSizing = 'border-box';

  // コンテナ生成
  const container = document.createElement('div');
  container.classList.add('portal-calendar-widget');
  container.appendChild(iframe);

  // 右カラムコンテナ（ocean-portal-body-right）を取得
  const rightContainer = document.querySelector('.ocean-portal-body-right');

  if (rightContainer) {
    // 最後のウィジェットの後に挿入
    rightContainer.appendChild(container);
    console.log('✅ カレンダーを右カラムの末尾に追加しました');
  } else {
    console.warn('⚠️ .ocean-portal-body-right が見つかりませんでした');
  }
});
