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

  // 🧩 グレー背景＋名前の最初の1文字アイコン生成
  function createInitialIcon(name) {
    const bgColor = '#ccc';
    const initials = (name || '?').charAt(0);
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.font = '36px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2 + 2);
    return canvas.toDataURL();
  }

  // --- 全ユーザー情報をキャッシュ ---
  async function loadAllUserPhotos() {
    if (Object.keys(photoCache).length) return;
    const resp = await kintone.api(kintone.api.url('/v1/users.json', true), 'GET', {});
    resp.users.forEach(u => {
      const hasPhoto = u.photo && u.photo.url;
      photoCache[u.email] = {
        email: u.email,
        id: u.id,
        code: u.code,
        name: u.name,
        photoUrl: hasPhoto ? u.photo.url : createInitialIcon(u.name)
      };
    });
    console.log('✅ photoCache loaded:', photoCache);
  }

  async function getUserPhoto(email) {
    if (!Object.keys(photoCache).length) {
      await loadAllUserPhotos();
    }
    const userInfo = photoCache[email];
    return userInfo?.photoUrl || createInitialIcon(userInfo?.name || '？');
  }

  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
  }

  // --- リアクションバー + サムネ描画 ---
  async function renderReactions(commentElem, commentId, log, user) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cw-reaction-wrapper';

    // 👤 サムネ表示
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
      img.style.objectFit = 'cover';
      imgWrap.appendChild(img);

      // 🎯 押した絵文字（右下に表示）
      const emojiBadge = document.createElement('span');
      emojiBadge.className = 'cw-emoji-badge';
      for (const [emoji, users] of Object.entries(log[commentId] || {})) {
        if (users.includes(u)) {
          emojiBadge.textContent = emoji;
          break;
        }
      }
      if (emojiBadge.textContent) imgWrap.appendChild(emojiBadge);

      // 💬 ツールチップ（名前＋絵文字）
      const tooltip = document.createElement('div');
      tooltip.className = 'cw-tooltip';
      const emojis = [];
      for (const [emoji, users] of Object.entries(log[commentId] || {})) {
        if (users.includes(u)) emojis.push(emoji);
      }
      const userInfo = photoCache[u]?.name || u;
      tooltip.textContent = `${userInfo} ${emojis.join(' ')}`;
      imgWrap.appendChild(tooltip);

      userList.appendChild(imgWrap);
    }

    // 😄 ボタン群
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

  // --- 初期化 ---
  async function initReactions(ev) {
    const recordId = ev.recordId;
    const user = kintone.getLoginUser().email;
    const log = await getLog(recordId);
    await loadAllUserPhotos();

    const comments = document.querySelectorAll('.itemlist-item-gaia');
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const commentId = `comment_${i}`;
      const textElem = c.querySelector('.commentlist-body-gaia > div');
      if (textElem) replaceEmojiInCommentText(textElem);
      await renderReactions(c, commentId, log, user);
    }

    // 🎯 クリック時
    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;

      log[commentId] ??= {};

      // すべての絵文字から自分を削除（1ユーザー1絵文字ルール）
      for (const eKey of Object.keys(log[commentId])) {
        log[commentId][eKey] = (log[commentId][eKey] || []).filter(u => u !== user);
      }

      // 新しい絵文字を追加（再押しで解除）
      const users = (log[commentId][emoji] ||= []);
      const already = users.includes(user);
      if (!already) users.push(user);

      await saveLog(recordId, log);

      // 再描画
      const parentComment = e.target.closest('.itemlist-item-gaia');
      const wrapper = parentComment.querySelector('.cw-reaction-wrapper');
      if (wrapper) wrapper.remove();
      await renderReactions(parentComment, commentId, log, user);
    });
  }

  kintone.events.on('app.record.detail.show', initReactions);
})();
