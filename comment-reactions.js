(function() {
  'use strict';

  const EMOJIS = ['😄', '😢', '❤️', '👌'];
  const FIELD_CODE = 'reaction_log';
  const EMOJI_MAP = {
    ':smile:': '😄',
    ':cry:': '😢',
    ':heart:': '❤️',
    ':ok:': '👌'
  };
  const photoCache = {};

  async function getLog(recordId) {
    const resp = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
      app: kintone.app.getId(),
      id: recordId
    });
    try {
      return JSON.parse(resp.record[FIELD_CODE].value || '{}');
    } catch {
      return {};
    }
  }

  async function saveLog(recordId, log) {
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: kintone.app.getId(),
      id: recordId,
      record: { [FIELD_CODE]: { value: JSON.stringify(log) } }
    });
  }

  // --- ユーザーアイコン取得（キャッシュ付き） ---
  async function getUserPhoto(email) {
    if (photoCache[email]) return photoCache[email];
    try {
      const resp = await kintone.api(kintone.api.url('/v1/user', true), 'GET', { code: email });
      const photoUrl = resp.user.photo.url || 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
      photoCache[email] = photoUrl;
      return photoUrl;
    } catch {
      return 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
    }
  }

  // --- コメント内の :smile: → 😄 変換 ---
  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
  }

  // --- ユーザー一覧をキャッシュして写真URLを参照 ---
  async function loadAllUserPhotos() {
    const resp = await kintone.api(kintone.api.url('/v1/users.json', true), 'GET', {});
    resp.users.forEach(u => {
      photoCache[u.email] = u.photo.url || 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
    });
  }

  // --- ユーザーアイコン取得 ---
  async function getUserPhoto(email) {
    if (!Object.keys(photoCache).length) {
      await loadAllUserPhotos();
    }
    return photoCache[email] || 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
  }

  // --- リアクションバー + ユーザー欄描画 ---
  async function renderReactions(commentElem, commentId, log, user) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cw-reaction-wrapper';

    // 左下：リアクションしたユーザーのサムネ
    const userList = document.createElement('div');
    userList.className = 'cw-reaction-users';

    const uniqueUsers = new Set();
    for (const emoji of Object.keys(log[commentId] || {})) {
      (log[commentId][emoji] || []).forEach(u => uniqueUsers.add(u));
    }

    for (const u of uniqueUsers) {
      const url = await getUserPhoto(u);
      const img = document.createElement('img');
      img.src = url;
      img.title = u;
      userList.appendChild(img);
    }

    // 右下：リアクションボタン群
    const bar = document.createElement('div');
    bar.className = 'cw-reactions';
    EMOJIS.forEach(e => {
      const users = (log[commentId]?.[e] || []);
      const count = users.length > 0 ? `<span>${users.length}</span>` : '';
      const active = users.includes(user) ? 'active' : '';
      const btn = document.createElement('button');
      btn.className = `cw-react-btn ${active}`;
      btn.dataset.emoji = e;
      btn.dataset.commentId = commentId;
      btn.innerHTML = `${e}${count}`;
      bar.appendChild(btn);
    });

    wrapper.appendChild(userList);
    wrapper.appendChild(bar);

    const footer = commentElem.querySelector('.text11.itemlist-footer-gaia');
    if (footer && !footer.querySelector('.cw-reaction-wrapper')) {
      footer.appendChild(wrapper);
    }
  }

  async function initReactions(ev) {
    const recordId = ev.recordId;
    const user = kintone.getLoginUser().email;
    const log = await getLog(recordId);

    const comments = document.querySelectorAll('.itemlist-item-gaia');
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const commentId = `comment_${i}`;
      const textElem = c.querySelector('.commentlist-body-gaia > div');
      if (textElem) replaceEmojiInCommentText(textElem);
      await renderReactions(c, commentId, log, user);
    }

    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;
      log[commentId] ??= {};
      log[commentId][emoji] ??= [];

      const users = log[commentId][emoji];
      const userIndex = users.indexOf(user);
      if (userIndex >= 0) {
        users.splice(userIndex, 1);
        e.target.classList.remove('active');
      } else {
        users.push(user);
        e.target.classList.add('active');
      }

      // カウント更新
      const countElem = e.target.querySelector('span');
      if (users.length > 0) {
        if (countElem) countElem.textContent = users.length;
        else e.target.insertAdjacentHTML('beforeend', `<span>${users.length}</span>`);
      } else if (countElem) {
        countElem.remove();
      }

      await saveLog(recordId, log);
      // 画像欄も再描画
      const parentComment = e.target.closest('.itemlist-item-gaia');
      const wrapper = parentComment.querySelector('.cw-reaction-wrapper');
      if (wrapper) wrapper.remove();
      await renderReactions(parentComment, commentId, log, user);
    });
  }

  kintone.events.on('app.record.detail.show', initReactions);
})();
