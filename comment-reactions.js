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

  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
  }

  function renderReactions(commentElem, commentId, log, user) {
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

    const footer = commentElem.querySelector('.text11.itemlist-footer-gaia');
    if (footer && !footer.querySelector('.cw-reactions')) {
      footer.appendChild(bar);
    }
  }

  async function initReactions(ev) {
    const recordId = ev.recordId;
    const user = kintone.getLoginUser().email;
    const log = await getLog(recordId);

    const comments = document.querySelectorAll('.itemlist-item-gaia');
    comments.forEach((c, i) => {
      const commentId = `comment_${i}`;
      const textElem = c.querySelector('.commentlist-body-gaia > div');
      if (textElem) replaceEmojiInCommentText(textElem);
      renderReactions(c, commentId, log, user);
    });

    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;
    
      log[commentId] ??= {};
      log[commentId][emoji] ??= [];
    
      const users = log[commentId][emoji];
      const userIndex = users.indexOf(user);
    
      // --- 自分のリアクションをトグル ---
      if (userIndex >= 0) {
        users.splice(userIndex, 1);
        e.target.classList.remove('active');
      } else {
        users.push(user);
        e.target.classList.add('active');
      }
    
      // --- カウント更新（リロードせず動的反映） ---
      const countElem = e.target.querySelector('span');
      if (users.length > 0) {
        if (countElem) countElem.textContent = users.length;
        else e.target.insertAdjacentHTML('beforeend', `<span>${users.length}</span>`);
      } else if (countElem) {
        countElem.remove();
      }
    
      // --- サーバー側にも保存 ---
      await saveLog(recordId, log);
    });    
  }

  kintone.events.on('app.record.detail.show', initReactions);
})();
