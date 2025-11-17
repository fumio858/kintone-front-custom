(function() {
  'use strict';

  // 1️⃣ 保存時に全員を設定
  kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], function(event) {
    const record = event.record;

    // viewable_usersフィールドを全員に設定
    record.viewable_users.value = [{ code: 'everyone' }]; // everyone = 全ユーザー

    return event;
  });

  // 2️⃣ 詳細画面で閲覧可能ユーザーを表示
  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    const userList = record.viewable_users.value;

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

    // スペースに挿入
    const space = kintone.app.record.getSpaceElement('view_users_space');
    if (space) space.appendChild(container);

    return event;
  });
})();
