(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const EMOJIS = ['😄', '😢', '❤️', '👌'];
  const FIELD_CODE = 'reaction_log';
  const EMOJI_MAP = { ':smile:': '😄', ':cry:': '😢', ':heart:': '❤️', ':ok:': '👌' };
  const photoCache = {};

  // ==============================
  // 🔁 リアクションログ取得・保存
  // ==============================
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

  // ==============================
  // 👤 ユーザー画像キャッシュ
  // ==============================
  async function loadAllUserPhotos() {
    if (Object.keys(photoCache).length) return;
    const resp = await kintone.api(kintone.api.url('/v1/users.json', true), 'GET', {});
    resp.users.forEach(u => {
      const baseUrl = `https://${location.hostname}/api/user/photo.do/-/user.png?id=${u.id}&size=NORMAL`;
      photoCache[u.email] = {
        name: u.name,
        photoUrl: (u.photo && u.photo.url) ? u.photo.url : baseUrl
      };
    });
  }

  async function getUserPhoto(email) {
    if (!Object.keys(photoCache).length) await loadAllUserPhotos();
    return photoCache[email]?.photoUrl || 'https://static.cybozu.com/kintone/v2.0/images/people/no_photo.png';
  }

  // ==============================
  // 🙂 コメント本文の絵文字置換
  // ==============================
  function replaceEmojiInCommentText(comment) {
    let html = comment.innerHTML;
    for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
      html = html.replaceAll(code, emoji);
    }
    comment.innerHTML = html;
  }

  // ==============================
  // 💬 各コメントへのリアクション描画
  // ==============================
  async function renderReactions(commentElem, commentId, log, user) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cw-reaction-wrapper';

    // 👥 押したユーザーのサムネ表示
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

      const badge = document.createElement('span');
      badge.className = 'cw-emoji-badge';
      for (const [emoji, users] of Object.entries(log[commentId] || {})) {
        if (users.includes(u)) badge.textContent = emoji;
      }
      if (badge.textContent) imgWrap.appendChild(badge);

      const tooltip = document.createElement('div');
      tooltip.className = 'cw-tooltip';
      tooltip.textContent = `${photoCache[u]?.name || u}`;
      imgWrap.appendChild(tooltip);
      userList.appendChild(imgWrap);
    }

    const bar = document.createElement('div');
    bar.className = 'cw-reactions';
    EMOJIS.forEach(e => {
      const users = (log[commentId]?.[e] || []);
      const count = users.length ? `<span>${users.length}</span>` : '';
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
    if (footer && !footer.querySelector('.cw-reaction-wrapper')) footer.appendChild(wrapper);
  }

  // ==============================
  // 🚀 初期化
  // ==============================
  async function initReactions(ev) {
    const recordId = ev.recordId;
    const user = kintone.getLoginUser().email;
    const log = await getLog(recordId);
    await loadAllUserPhotos();

    // 全コメント描画
    async function renderAllReactions() {
      const comments = document.querySelectorAll('.itemlist-item-gaia');
      for (const c of comments) {
        const link = c.querySelector('.itemlist-datetime-gaia a');
        const commentId = link?.href.match(/comment=(\d+)/)?.[1];
        if (!commentId) continue;
        const textElem = c.querySelector('.commentlist-body-gaia > div');
        if (textElem) replaceEmojiInCommentText(textElem);
        await renderReactions(c, commentId, log, user);
      }
    }

    // 初回描画
    await renderAllReactions();

    // ==============================
    // 👀 #sidebar-list-gaia 全体を監視
    // ==============================
    // 👀 コメント領域の監視処理
    const sidebarList = document.querySelector('#sidebar-list-gaia');
    if (sidebarList) {
      const observer = new MutationObserver(async mutations => {
        // 自分の描画で発火しないようにガード
        observer.disconnect();
        let shouldRerender = false;

        for (const m of mutations) {
          for (const node of m.addedNodes) {
            // コメント要素 (.itemlist-item-gaia) が追加された場合のみ反応
            if (node.nodeType === 1 && node.classList.contains('itemlist-item-gaia')) {
              shouldRerender = true;
              break;
            }
          }
          if (shouldRerender) break;
        }

        if (shouldRerender) {
          console.log('🆕 コメントエリア変化検知 → 再描画');
          await renderAllReactions();
        }

        // 再開（重要）
        observer.observe(sidebarList, { childList: true, subtree: true });
      });

      // 初回監視スタート
      observer.observe(sidebarList, { childList: true, subtree: true });
      console.log('👀 コメント領域監視開始');
    }

    // ==============================
    // 🎯 絵文字クリック処理
    // ==============================
    document.body.addEventListener('click', async e => {
      if (!e.target.classList.contains('cw-react-btn')) return;
      const emoji = e.target.dataset.emoji;
      const commentId = e.target.dataset.commentId;
      log[commentId] ??= {};

      // 現在の絵文字ユーザーリストを取得
      const users = (log[commentId][emoji] ||= []);
      const already = users.includes(user);

      if (already) {
        // ✅ 同じ絵文字をもう一度押したら解除
        log[commentId][emoji] = users.filter(u => u !== user);
      } else {
        // 他の絵文字を外してから追加
        for (const eKey of Object.keys(log[commentId])) {
          log[commentId][eKey] = (log[commentId][eKey] || []).filter(u => u !== user);
        }
        users.push(user);
      }

      await saveLog(recordId, log);

      const parent = e.target.closest('.itemlist-item-gaia');
      const wrapper = parent.querySelector('.cw-reaction-wrapper');
      if (wrapper) wrapper.remove();
      await renderReactions(parent, commentId, log, user);
    });
  }

  // ==============================
  // 🎬 イベント登録
  // ==============================
  kintone.events.on('app.record.detail.show', initReactions);
})();
