import { kUrl } from '../common/kintone-api';

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
async function getRecord(recordId) {
  const resp = await kintone.api(kUrl('/k/v1/record.json'), 'GET', {
    app: kintone.app.getId(),
    id: recordId
  });
  return resp.record;
}


async function saveLog(recordId, log, revision) {
  await kintone.api(kUrl('/k/v1/record.json'), 'PUT', {
    app: kintone.app.getId(),
    id: recordId,
    record: { [FIELD_CODE]: { value: JSON.stringify(log) } },
    revision: revision
  });
}

// ==============================
// 👤 ユーザー画像キャッシュ
// ==============================
async function loadAllUserPhotos() {
  if (Object.keys(photoCache).length) return;
  const resp = await kintone.api(kUrl('/v1/users.json'), 'GET', {});
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

  // ★「+タスク追加」ボタンを追加
  const btnAddTask = document.createElement('button');
  btnAddTask.className = 'cw-add-task-btn';
  btnAddTask.textContent = '＋タスク追加';
  Object.assign(btnAddTask.style, {
    fontSize: '11px',
    marginLeft: '8px',
    padding: '2px 8px',
    color: '#333',
    background: '#f7f7f7',
    border: '1px solid #e3e3e3',
    borderRadius: '4px',
    cursor: 'pointer'
  });

  btnAddTask.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // フォームにスクロール
    const form = document.querySelector('.ocean-ui-comments-commentform');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const commentElem = e.target.closest('.itemlist-item-gaia');
    // ================= デバッグログ追加 =================
    console.log('【デバッグ】1. commentElem (コメント全体):', commentElem);

    const commentBodyContainer = commentElem.querySelector('.commentlist-body-gaia');
    let commentText = '';
    if (commentBodyContainer) {
      const lineDivs = commentBodyContainer.querySelectorAll(':scope > div');

      if (lineDivs.length > 0) {
        // 複数行構造の場合 (内部にさらにdivがある)
        const lines = Array.from(lineDivs).map(div => {
          if (div.innerHTML.trim().toLowerCase() === '<br>') {
            return '';
          }
          return div.textContent || '';
        });
        commentText = lines.join('\n').trim();
      } else {
        // 単行構造の場合 (テキストが直接入っている)
        commentText = (commentBodyContainer.textContent || '').trim();
      }
    }
    
    // デバッグ用に取得したテキストをコンソールに出力
    console.log('【タスク追加】取得したコメントテキスト:', commentText);

    if (window.userTaskPanelInit) {
      window.userTaskPanelInit(null, { comment: commentText });
    }
  });
  bar.appendChild(btnAddTask);

  // ★「引用」ボタンを追加
  const btnQuote = document.createElement('button');
  btnQuote.className = 'cw-quote-btn';
  btnQuote.textContent = '引用';
  Object.assign(btnQuote.style, {
    fontSize: '11px',
    marginLeft: '4px',
    padding: '2px 8px',
    color: '#333',
    background: '#f7f7f7',
    border: '1px solid #e3e3e3',
    borderRadius: '4px',
    cursor: 'pointer'
  });
  bar.appendChild(btnQuote);


  wrapper.appendChild(userList);
  wrapper.appendChild(bar);

  const footer = commentElem.querySelector('.text11.itemlist-footer-gaia');
  if (footer && !footer.querySelector('.cw-reaction-wrapper')) footer.appendChild(wrapper);
}

// ==============================
// 🚀 初期化 & イベント処理
// ==============================
function attachQuoteClickHandler() {
  if (document.body.dataset.quoteHandlerAttached) return;
  document.body.dataset.quoteHandlerAttached = 'true';

  document.body.addEventListener('click', e => {
    if (!e.target.classList.contains('cw-quote-btn')) return;

    e.preventDefault();
    e.stopPropagation();

    // フォームにスクロール
    const form = document.querySelector('.ocean-ui-comments-commentform');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const commentElem = e.target.closest('.itemlist-item-gaia');
    // ================= デバッグログ追加 =================
    console.log('【デバッグ】1. commentElem (コメント全体):', commentElem);

    const commentBodyContainer = commentElem.querySelector('.commentlist-body-gaia');
    let commentText = '';
    if (commentBodyContainer) {
      const lineDivs = commentBodyContainer.querySelectorAll(':scope > div');

      if (lineDivs.length > 0) {
        // 複数行構造の場合 (内部にさらにdivがある)
        const lines = Array.from(lineDivs).map(div => {
          if (div.innerHTML.trim().toLowerCase() === '<br>') {
            return '';
          }
          return div.textContent || '';
        });
        commentText = lines.join('\n').trim();
      } else {
        // 単行構造の場合 (テキストが直接入っている)
        commentText = (commentBodyContainer.textContent || '').trim();
      }
    }

    // デバッグ用に取得したテキストをコンソールに出力
    console.log('【引用】取得したコメントテキスト:', commentText);

    if (!commentText) return;

    // より堅牢なセレクタでリッチテキストエディタを特定
    const editor = document.querySelector('.ocean-ui-editor-field.editable');
    if (editor) {
      // リッチテキストエディタの場合：insertHTMLでblockquoteを使う
      const quoteHtml = `<blockquote>${commentText.replace(/\n/g, '<br>')}</blockquote>`;
      editor.focus();
      document.execCommand('insertHTML', false, quoteHtml);
    } else {
      // フォールバック（通常テキストエリア）
      const quoteStr = `> ${commentText.split('\n').join('\n> ')}\n\n`;
      const textarea = document.querySelector('.ocean-ui-comments-commentform-textarea');
      if (textarea) {
        // カーソル位置に挿入
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + quoteStr + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + quoteStr.length;
        textarea.focus();
      }
    }
  });
}


function attachReactionClickHandler() {
  // ハンドラが重複しないようにガード
  if (document.body.dataset.reactionHandlerAttached) return;
  document.body.dataset.reactionHandlerAttached = 'true';

  document.body.addEventListener('click', async e => {
    if (!e.target.classList.contains('cw-react-btn')) return;

    const recordId = kintone.app.record.getId();
    const user = kintone.getLoginUser().email;
    const emoji = e.target.dataset.emoji;
    const commentId = e.target.dataset.commentId;

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const currentRecord = await getRecord(recordId);
        const log = JSON.parse(currentRecord[FIELD_CODE].value || '{}');
        const revision = currentRecord.$revision.value;

        const newLog = JSON.parse(JSON.stringify(log));
        newLog[commentId] = newLog[commentId] || {};

        const currentEntry = Object.entries(newLog[commentId]).find(([, users]) => Array.isArray(users) && users.includes(user));
        const currentEmoji = currentEntry ? currentEntry[0] : null;

        if (currentEmoji === emoji) {
          newLog[commentId][emoji] = (newLog[commentId][emoji] || []).filter(u => u !== user);
          if (newLog[commentId][emoji].length === 0) delete newLog[commentId][emoji];
        } else {
          if (currentEmoji) {
            newLog[commentId][currentEmoji] = (newLog[commentId][currentEmoji] || []).filter(u => u !== user);
            if (!newLog[commentId][currentEmoji].length) delete newLog[commentId][currentEmoji];
          }
          const list = newLog[commentId][emoji] || [];
          if (!list.includes(user)) list.push(user);
          newLog[commentId][emoji] = list;
        }

        await saveLog(recordId, newLog, revision);

        const parent = e.target.closest('.itemlist-item-gaia');
        if (parent) {
          const wrapper = parent.querySelector('.cw-reaction-wrapper');
          if (wrapper) wrapper.remove();
          await renderReactions(parent, commentId, newLog, user);
        }
        return;

      } catch (error) {
        if (error.code === 'CB_VA01' && i < MAX_RETRIES - 1) {
          console.warn(`Reaction conflict detected. Retrying... (${i + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 100 + (Math.random() * 200)));
        } else {
          console.error('Failed to save reaction:', error);
          alert('リアクションの保存に失敗しました。画面をリロードしてもう一度お試しください。');
          return;
        }
      }
    }
  });
}

async function initReactions(ev) {
  const recordId = ev.recordId;
  const user = kintone.getLoginUser().email;
  
  // 初回描画用のデータを取得
  const initialRecord = await getRecord(recordId);
  const initialLog = JSON.parse(initialRecord[FIELD_CODE].value || '{}');
  await loadAllUserPhotos();

  async function renderAllReactions(log) {
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

  await renderAllReactions(initialLog);

  const sidebarList = document.querySelector('#sidebar-list-gaia');
  if (sidebarList) {
    const observer = new MutationObserver(async (mutations) => {
      observer.disconnect();
      let shouldRerender = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.classList.contains('itemlist-item-gaia')) {
            shouldRerender = true;
            break;
          }
        }
        if (shouldRerender) break;
      }

      if (shouldRerender) {
        console.log('🆕 コメントエリア変化検知 → 再描画');
        const currentRecord = await getRecord(recordId);
        const currentLog = JSON.parse(currentRecord[FIELD_CODE].value || '{}');
        await renderAllReactions(currentLog);
      }

      observer.observe(sidebarList, { childList: true, subtree: true });
    });
    observer.observe(sidebarList, { childList: true, subtree: true });
    console.log('👀 コメント領域監視開始');
  }

  // クリック処理は一度だけ登録
  attachReactionClickHandler();
  attachQuoteClickHandler(); // ★引用ハンドラも登録
}

// ==============================
// 🎬 イベント登録
// ==============================
kintone.events.on('app.record.detail.show', initReactions);
