(function() {
  'use strict';

  // モーダルコンポーネントを管理するオブジェクト
  window.kintoneModal = {
    _modalOverlay: null,
    _modalContent: null,
    _modalIframe: null,
    _closeButton: null,
    _onCloseCallback: null, // モーダルが閉じられたときに実行するコールバック

    // モーダルを初期化し、DOMに追加
    init: function() {
      if (this._modalOverlay) return; // 既に初期化済み

      // モーダルオーバーレイ
      this._modalOverlay = document.createElement('div');
      this._modalOverlay.id = 'kintone-custom-modal-overlay';
      Object.assign(this._modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'none', // 初期状態では非表示
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '10000', // kintoneのUIより手前に表示
      });

      // モーダルコンテンツボックス
      this._modalContent = document.createElement('div');
      this._modalContent.id = 'kintone-custom-modal-content';
      Object.assign(this._modalContent.style, {
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        width: '90%', // 幅を調整
        height: '90%', // 高さを調整
        maxWidth: '1200px', // 最大幅
        maxHeight: '800px', // 最大高さ
        display: 'flex',
        flexDirection: 'column',
      });

      // 閉じるボタン
      this._closeButton = document.createElement('button');
      this._closeButton.id = 'kintone-custom-modal-close-button';
      this._closeButton.textContent = '×';
      Object.assign(this._closeButton.style, {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        fontSize: '18px',
        cursor: 'pointer',
        zIndex: '10001', // ボタンがiframeの上に表示されるように
      });
      this._closeButton.addEventListener('click', this.close.bind(this));

      // iframe
      this._modalIframe = document.createElement('iframe');
      this._modalIframe.id = 'kintone-custom-modal-iframe';
      Object.assign(this._modalIframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0 0 8px 8px', // 下部の角丸
        flexGrow: '1', // 残りのスペースを埋める
      });

      // DOM構築
      this._modalContent.appendChild(this._closeButton);
      this._modalContent.appendChild(this._modalIframe);
      this._modalOverlay.appendChild(this._modalContent);
      document.body.appendChild(this._modalOverlay);

      // Escキーで閉じる
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._modalOverlay.style.display === 'flex') {
          this.close();
        }
      });
    },

    // モーダルを開く
    open: function(url, onCloseCallback = null) {
      this.init(); // 念のため初期化
      this._modalIframe.src = url;
      this._modalOverlay.style.display = 'flex';
      this._onCloseCallback = onCloseCallback; // コールバックを保存
    },

    // モーダルを閉じる
    close: function() {
      if (!this._modalOverlay) return;
      this._modalOverlay.style.display = 'none';
      this._modalIframe.src = 'about:blank'; // iframeの内容をクリア
      if (this._onCloseCallback && typeof this._onCloseCallback === 'function') {
        this._onCloseCallback(); // コールバックを実行
      }
      this._onCloseCallback = null; // コールバックをクリア
    }
  };

  // kintoneのDOMがロードされた後にモーダルを初期化
  kintone.events.on(['app.record.detail.show', 'app.record.edit.show', 'app.record.create.show', 'app.record.index.show'], function(event) {
    window.kintoneModal.init();
    return event;
  });

})();
