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

    // --- ツールバーに事案タイトルを表示 ---
    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    if (toolbar && !toolbar.querySelector('.custom-title')) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'custom-title';
      titleDiv.textContent = record['案件事件名'].value || '(タイトル未設定)';
      titleDiv.style.fontSize = '1.1rem';
      titleDiv.style.fontWeight = 'bold';
      titleDiv.style.marginLeft = '12px';
      titleDiv.style.color = '#333';
      titleDiv.style.flexGrow = '1';
      toolbar.appendChild(titleDiv);
      console.log('🪶 事案タイトルをツールバーに追加しました');
    }

    return event;
  });

})();
