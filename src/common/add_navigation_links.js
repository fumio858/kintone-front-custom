(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const CUSTOM_LINKS = [
    {
      title: '刑事事件',
      href: 'https://atomfirm.cybozu.com/k/22/?view=13312806',
      // 手錠アイコン (ユーザー提供)
      svgPath: 'M12.7778 1.27778C12.7778 0.571007 12.2068 0 11.5 0C10.7932 0 10.2222 0.571007 10.2222 1.27778C10.2222 1.98455 10.7932 2.55556 11.5 2.55556C12.2068 2.55556 12.7778 1.98455 12.7778 1.27778ZM7.66667 5.11111C8.37344 5.11111 8.94444 4.5401 8.94444 3.83333C8.94444 3.12656 8.37344 2.55556 7.66667 2.55556C6.9599 2.55556 6.38889 3.12656 6.38889 3.83333C6.38889 4.5401 6.9599 5.11111 7.66667 5.11111ZM6.06944 6.38889C5.53837 6.38889 5.11111 6.81615 5.11111 7.34722V7.98611C5.11111 8.02604 5.1151 8.06198 5.1191 8.10191C2.13628 9.15208 0 11.9951 0 15.3333C0 19.566 3.43403 23 7.66667 23C11.8993 23 15.3333 19.566 15.3333 15.3333C15.3333 11.9911 13.197 9.15208 10.2142 8.10191C10.2182 8.06597 10.2222 8.02604 10.2222 7.98611V7.34722C10.2222 6.81615 9.79497 6.38889 9.26389 6.38889H6.06944ZM2.55556 15.3333C2.55556 12.5102 4.84358 10.2222 7.66667 10.2222C10.4898 10.2222 12.7778 12.5102 12.7778 15.3333C12.7778 18.1564 10.4898 20.4444 7.66667 20.4444C4.84358 20.4444 2.55556 18.1564 2.55556 15.3333ZM20.4444 15.3333C20.4444 18.0047 18.396 20.1969 15.7885 20.4245C15.2175 21.3349 14.4948 22.1455 13.6563 22.8163C14.1953 22.9361 14.7583 23 15.3333 23C19.566 23 23 19.566 23 15.3333C23 11.9911 20.8637 9.15208 17.8809 8.10191C17.8849 8.06597 17.8889 8.02604 17.8889 7.98611V7.34722C17.8889 6.81615 17.4616 6.38889 16.9306 6.38889H13.7361C13.245 6.38889 12.8417 6.75625 12.7858 7.23142C13.9957 7.99809 15.0259 9.0283 15.7885 10.2422C18.4 10.4738 20.4444 12.662 20.4444 15.3333ZM15.3333 5.11111C16.0401 5.11111 16.6111 4.5401 16.6111 3.83333C16.6111 3.12656 16.0401 2.55556 15.3333 2.55556C14.6266 2.55556 14.0556 3.12656 14.0556 3.83333C14.0556 4.5401 14.6266 5.11111 15.3333 5.11111Z',
      viewBox: '-5 -5 33 33',
    },
    {
      title: '交通事故',
      href: 'https://atomfirm.cybozu.com/k/26/?view=13312808',
      // 車アイコン (ユーザー提供)
      svgPath: 'M240-200v40q0 17-11.5 28.5T200-120h-40q-17 0-28.5-11.5T120-160v-320l84-240q6-18 21.5-29t34.5-11h440q19 0 34.5 11t21.5 29l84 240v320q0 17-11.5 28.5T800-120h-40q-17 0-28.5-11.5T720-160v-40H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z',
      viewBox: '0 -960 960 960',
    },
  ];

  // kintoneのヘッダーはReactで描画されるため、クラス名が変わりやすい。
  // data-testid属性を持つ、比較的安定している要素を起点に探索する。
  const BOOKMARK_BUTTON_SELECTOR = '[data-testid="header-global-navigation-bookmark-button"]';
  const ADDED_FLAG = 'customNavLinksAdded';

  /**
   * カスタムナビゲーション用のCSSをheadに追加する
   */
  function addCustomNavStyles() {
    const styleId = 'custom-nav-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    // ホバー時の色を定義
    const hoverColors = {
      '刑事事件': '#e74c3c', // 赤色
      '交通事故': '#3498db', // 青色
    };

    // 各リンクに対応するCSSルールを生成
    const css = Object.entries(hoverColors).map(([title, color]) => `
      a[data-custom-nav-title="${title}"]:hover svg path {
        fill: ${color};
      }
    `).join('') + `
      /* 全てのカスタムリンクに共通のトランジション効果 */
      a[data-custom-nav-title] svg path {
        transition: fill 0.2s ease;
      }
    `;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * アイコンリンクのHTML要素を生成する
   * @param {object} link - CUSTOM_LINKSの要素
   * @returns {HTMLLIElement} - 生成されたli要素
   */
  function createIconLinkElement(link) {
    // kintoneの既存のHTML構造を模倣する
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; align-items: center;'; // 微調整

    const divContainer = document.createElement('div');
    divContainer.className = 'sc-jMWyIz dysIPP'; 

    const divButton = document.createElement('div');
    divButton.className = 'sc-jMWyIz dysIPP__button';

    const divIconContainer = document.createElement('div');
    divIconContainer.className = 'sc-ejqGWM dMGvGp__container';

    const a = document.createElement('a');
    a.className = 'sc-ejqGWM dMGvGp sc-ejqGWM dMGvGp__xxxLarge';
    a.href = link.href;
    a.title = link.title;
    a.setAttribute('aria-label', link.title);
    a.dataset.customNavTitle = link.title; // CSSで識別するためのdata属性

    const spanIcon = document.createElement('span');
    spanIcon.className = 'sc-gaZyOd hxeOmP';
    spanIcon.setAttribute('role', 'img');
    spanIcon.setAttribute('aria-label', link.title);

    const spanSvgWrapper = document.createElement('span');
    spanSvgWrapper.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '28');
    svg.setAttribute('height', '28');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', link.viewBox || '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', '#888888');
    path.setAttribute('d', link.svgPath);

    svg.appendChild(path);
    spanSvgWrapper.appendChild(svg);
    spanIcon.appendChild(spanSvgWrapper);
    a.appendChild(spanIcon);
    divIconContainer.appendChild(a);
    divButton.appendChild(divIconContainer);
    divContainer.appendChild(divButton);
    li.appendChild(divContainer);

    return li;
  }

  /**
   * ナビゲーションにカスタムリンクを追加する
   */
  function addCustomNavLinks() {
    // 既にリンクが追加されていたら何もしない
    if (document.body.dataset[ADDED_FLAG]) {
      return;
    }

    addCustomNavStyles(); // スタイルを注入

    const bookmarkButton = document.querySelector(BOOKMARK_BUTTON_SELECTOR);
    if (!bookmarkButton) {
      return;
    }

    const targetList = bookmarkButton.closest('ul');
    const bookmarkListItem = bookmarkButton.closest('li');

    if (!targetList || !bookmarkListItem) {
      return;
    }

    [...CUSTOM_LINKS].reverse().forEach(link => {
      const newLinkElement = createIconLinkElement(link);
      targetList.insertBefore(newLinkElement, bookmarkListItem.nextSibling);
    });

    document.body.dataset[ADDED_FLAG] = 'true';
    console.log('Added custom navigation links with hover effects.');
  }

  // ==============================
  // 🚀 初期化処理
  // ==============================

  // ヘッダーは非同期で描画されるため、DOMの変更を監視する
  const observer = new MutationObserver((mutations, obs) => {
    const navBar = document.querySelector(BOOKMARK_BUTTON_SELECTOR);
    if (navBar) {
      addCustomNavLinks();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

})();