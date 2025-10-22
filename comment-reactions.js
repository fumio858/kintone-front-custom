(function () {
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

  // --- 全ユーザー情報をキャッシュ ---
  async function loadAllUserPhotos() {
    if (Object.keys(photoCache).length) return;
    const resp = await kintone.api(kintone.api.url('/v1/users.json', true), 'GET', {});
    resp.users.forEach(u => {
      const baseUrl = `https://${location.hostname}/api/user/photo.do/-/user.png?id=${u.id}&size=NORMAL`;
      photoCache[u.email] = {
        email: u.email,
        id: u.id,
        code: u.code,
        name: u.name,
        photoUrl: (u.photo && u.photo.url) ? u.photo.url : baseUrl
      };
    });
    console.log('✅ photoCache loaded:', photoCache);
  }

  async function getUserPhoto(email) {
    if (!Object.keys(photoCache).length) {
      await loadAllUserPhotos();
    }

    const userInfo = photoCache[email];
    if (userInfo && userInfo.photoUrl) {
      return userInfo.photoUrl;
    }

    return 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
  }

  // --- コメント内の :smile: → 😄 変換 ---
  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
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
      const imgWrap = document.createElement('div');
      imgWrap.className = 'cw-user-icon';
    
      const img = document.createElement('img');
      img.src = url;
      imgWrap.appendChild(img);
    
      // 🎯 押した絵文字を右下に表示
      const emojiBadge = document.createElement('span');
      emojiBadge.className = 'cw-emoji-badge';
    
      for (const [emoji, users] of Object.entries(log[commentId] || {})) {
        if (users.includes(u)) {
          emojiBadge.textContent = emoji;
          break;
        }
      }
      if (emojiBadge.textContent) imgWrap.appendChild(emojiBadge);
    
      userList.appendChild(imgWrap);
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
    await loadAllUserPhotos(); // ←ここで一括ロード済にしておく

    const comments = document.querySelectorAll('.itemlist-item-gaia');
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const commentId = `comment_${i}`;
      const textElem = c.querySelector('.commentlist-body-gaia > div');
      if (textElem) replaceEmojiInCommentText(textElem);
      await renderReactions(c, commentId, log, user);
    }

    // --- クリック時処理（1ユーザー1絵文字ルール） ---
    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;

      log[commentId] ??= {};

      // 既存のすべての絵文字から自分のリアクションを削除
      for (const eKey of Object.keys(log[commentId])) {
        log[commentId][eKey] = (log[commentId][eKey] || []).filter(u => u !== user);
      }

      // 新しい絵文字を登録（同じ絵文字再押しでキャンセル）
      const users = (log[commentId][emoji] ||= []);
      const already = users.includes(user);
      if (!already) users.push(user);

      // --- カウント更新 ---
      EMOJIS.forEach(eKey => {
        const btn = document.querySelector(`.cw-react-btn[data-comment-id="${commentId}"][data-emoji="${eKey}"]`);
        if (!btn) return;
        const ucount = (log[commentId][eKey] || []).length;
        const countElem = btn.querySelector('span');
        if (ucount > 0) {
          if (countElem) countElem.textContent = ucount;
          else btn.insertAdjacentHTML('beforeend', `<span>${ucount}</span>`);
          btn.classList.toggle('active', (log[commentId][eKey] || []).includes(user));
        } else if (countElem) countElem.remove();
      });

      await saveLog(recordId, log);

      // --- 再描画（絵文字バッジ付きサムネ） ---
      const parentComment = e.target.closest('.itemlist-item-gaia');
      const wrapper = parentComment.querySelector('.cw-reaction-wrapper');
      if (wrapper) wrapper.remove();
      await renderReactions(parentComment, commentId, log, user);
    });

  }

  kintone.events.on('app.record.detail.show', initReactions);
})();
