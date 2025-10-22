(function() {
  'use strict';

  const EMOJIS = ['👍', '❤️', '😆', '😢'];
  const FIELD_CODE = 'reaction_log'; // 文字列(複数行) フィールドを1つ用意
  const EMOJI_MAP = {
    ':smile:': '😄',
    ':cry:': '😢',
    ':heart:': '❤️',
    ':ok:': '👌'
  };

  // --- reaction_log を取得 ---
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

  // --- reaction_log を保存 ---
  async function saveLog(recordId, log) {
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: kintone.app.getId(),
      id: recordId,
      record: { [FIELD_CODE]: { value: JSON.stringify(log) } }
    });
  }

  // --- コメント本文の絵文字置換 (:smile: → 😄) ---
  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
  }

  // --- リアクションバー描画 ---
  function renderReactions(comment, commentId, log, user) {
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

    comment.appendChild(bar);
  }

  // --- コメントDOMを監視し反映 ---
  async function initReactions(ev) {
    const recordId = ev.recordId;
    const user = kintone.getLoginUser().email;
    const log = await getLog(recordId);

    const comments = document.querySelectorAll('.ocean-ui-comments-comment');
    comments.forEach((c, i) => {
      const commentId = `comment_${i}`;
      const text = c.querySelector('.ocean-ui-comments-comment-text');
      if (text) replaceEmojiInCommentText(text);
      if (!c.querySelector('.cw-reactions')) renderReactions(c, commentId, log, user);
    });

    // --- リアクションクリック処理 ---
    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;
      log[commentId] ??= {};
      log[commentId][emoji] ??= [];
      if (log[commentId][emoji].includes(user)) {
        log[commentId][emoji] = log[commentId][emoji].filter(u => u !== user);
      } else {
        log[commentId][emoji].push(user);
      }
      await saveLog(recordId, log);
      location.reload(); // 再描画
    });
  }

  kintone.events.on('app.record.detail.show', initReactions);
})();
