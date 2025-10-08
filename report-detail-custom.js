(function () {
  'use strict';

  kintone.events.on('app.record.detail.show', function (event) {
    // メインコンテナにカスタムクラス付与
    const container = document.querySelector('.container-gaia');
    if (container && !container.classList.contains('report-front-custom')) {
      container.classList.add('report-front-custom');
      console.log('✅ report-front-custom クラスを追加しました');
    }

    // record-gaia を取得
    const recordEl = document.getElementById('record-gaia');
    if (!recordEl) return event;

    // すでにボタンがあれば何もしない（多重生成防止）
    if (document.getElementById('expand-record-btn')) return event;

    // ▼ 初期高さ設定
    recordEl.style.height = '20rem';
    recordEl.style.overflow = 'hidden';
    recordEl.style.transition = 'height 0.3s ease';

    // ▼ 開くボタン作成
    const btn = document.createElement('button');
    btn.id = 'expand-record-btn';
    btn.textContent = 'もっと見る';
    btn.style.display = 'block';
    btn.style.margin = '1rem auto';
    btn.style.padding = '0.5rem 1rem';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '6px';
    btn.style.background = '#f5f5f5';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    btn.style.lineHeight = '1';
    btn.style.transition = 'all 0.2s ease';
    btn.onmouseover = () => (btn.style.background = '#e9e9e9');
    btn.onmouseout = () => (btn.style.background = '#f5f5f5');

    // ▼ recordElの後に挿入
    recordEl.insertAdjacentElement('afterend', btn);

    // ▼ クリックイベント
    let expanded = false;
    btn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        recordEl.style.height = 'auto';
        recordEl.style.overflow = 'visible';
        btn.textContent = '閉じる';
      } else {
        recordEl.style.height = '20rem';
        recordEl.style.overflow = 'hidden';
        btn.textContent = 'もっと見る';
      }
    });

    return event;
  });
})();
