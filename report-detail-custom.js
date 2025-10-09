(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    // メインコンテナにカスタムクラス付与
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
      console.log('✅ report-front-custom クラスを追加しました');
    }

    return event;
  });
})();
