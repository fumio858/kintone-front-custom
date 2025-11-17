(function() {
  'use strict';

  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    const userList = record.viewable_users.value; // ← ユーザー選択フィールド名を指定

    // コンテナ作成
    const container = document.createElement('div');
    container.style.margin = '1em 0';
    container.innerHTML = '<h3>👥 このレコードを閲覧できるユーザー</h3>';

    const ul = document.createElement('ul');
    userList.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u.name;
      ul.appendChild(li);
    });

    container.appendChild(ul);

    // 任意のスペースや場所に挿入
    kintone.app.record.getSpaceElement('view_users_space').appendChild(container);

    return event;
  });
})();
