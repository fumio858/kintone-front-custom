(function () {
  'use strict';

  // レコード詳細画面表示時に実行
  kintone.events.on('app.record.detail.show', function () {
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
      console.log('✅ report-front-custom クラスを追加しました');
    }
    return event;
  });

})();
