(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    const record = event.record;

    // --- メインコンテナにカスタムクラス付与 ---
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
      console.log('✅ report-front-custom クラスを追加しました');
    }

    // --- ツールバー直下の最初のdivに事案タイトルを挿入 ---
    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    const firstDiv = toolbar?.querySelector('div:first-child');

    if (firstDiv && !firstDiv.querySelector('.custom-title')) {
      const titleEl = document.createElement('div');
      titleEl.className = 'custom-title';
      titleEl.textContent = record['案件事件名'].value || '(タイトル未設定)';
      titleEl.style.fontSize = '1.1rem';
      titleEl.style.fontWeight = 'bold';
      titleEl.style.marginLeft = '12px';
      titleEl.style.color = '#333';
      titleEl.style.display = 'inline-block';
      titleEl.style.verticalAlign = 'middle';
      titleEl.style.lineHeight = '48px';

      firstDiv.appendChild(titleEl);
      console.log('🪶 事案タイトルをツールバーの最初のdivに追加しました');
    }

    return event;
  });

})();
