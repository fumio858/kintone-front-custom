const EMOJIS = ['👍', '❤️', '😆', '😭', '🎉'];

function attachReactions() {
  document.querySelectorAll('.ocean-ui-comments-comment').forEach(comment => {
    if (comment.querySelector('.cw-reactions')) return; // 二重防止

    const bar = document.createElement('div');
    bar.className = 'cw-reactions';
    bar.innerHTML = EMOJIS.map(e => `<button class="cw-react-btn">${e}</button>`).join('');
    comment.appendChild(bar);
  });
}
