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
      svgPath: 'M10 1C10 0.446875 9.55315 0 9 0C8.44685 0 7.99998 0.446875 7.99998 1C7.99998 1.55313 8.44685 2 9 2C9.55315 2 10 1.55313 10 1ZM6 4C6.55313 4 7 3.55312 7 3C7 2.44687 6.55313 2 6 2C5.44688 2 5 2.44687 5 3C5 3.55312 5.44688 4 6 4ZM4.75 5C4.33438 5 4 5.33438 4 5.75V6.25C4 6.28125 4.00312 6.30938 4.00625 6.34062C1.67187 7.1625 0 9.38747 0 12C0 15.3125 2.6875 18 6 18C9.3125 18 12 15.3125 12 12C12 9.38434 10.3281 7.1625 7.99372 6.34062C7.99685 6.3125 7.99998 6.28125 7.99998 6.25V5.75C7.99998 5.33438 7.66563 5 7.25 5H4.75ZM2 12C2 9.79059 3.79063 7.99998 6 7.99998C8.20941 7.99998 10 9.79059 10 12C10 14.2094 8.20941 16 6 16C3.79063 16 2 14.2094 2 12ZM16 12C16 14.0906 14.3969 15.8063 12.3562 15.9844C11.9093 16.6969 11.3438 17.3313 10.6875 17.8562C11.1094 17.95 11.55 18 12 18C15.3125 18 18 15.3125 18 12C18 9.38434 16.3281 7.1625 13.9937 6.34062C13.9969 6.3125 14 6.28125 14 6.25V5.75C14 5.33438 13.6656 5 13.25 5H10.75C10.3657 5 10.05 5.2875 10.0063 5.65937C10.9532 6.25937 11.7594 7.06563 12.3562 8.01563C14.4 8.19689 16 9.90939 16 12ZM12 4C12.5531 4 13 3.55312 13 3C13 2.44687 12.5531 2 12 2C11.4469 2 11 2.44687 11 3C11 3.55312 11.4469 4 12 4Z',
      viewBox: '0 0 18 18',
    },
    {
      title: '交通事故',
      href: 'https://atomfirm.cybozu.com/k/26/?view=13312808',
      // 車アイコン (ユーザー提供)
      svgPath: 'M4.225 2.66875L3.40938 5H12.5906L11.775 2.66875C11.6344 2.26875 11.2563 2 10.8313 2H5.16875C4.74375 2 4.36562 2.26875 4.225 2.66875ZM1.2375 5.15L2.3375 2.00938C2.75938 0.80625 3.89375 0 5.16875 0H10.8313C12.1063 0 13.2406 0.80625 13.6625 2.00938L14.7625 5.15C15.4875 5.45 16 6.16562 16 7V13C16 13.5531 15.5531 14 15 14H14C13.4469 14 13 13.5531 13 13V12H3V13C3 13.5531 2.55313 14 2 14H1C0.446875 14 0 13.5531 0 13V7C0 6.16562 0.5125 5.45 1.2375 5.15ZM4 8.5C4 7.94687 3.55313 7.5 3 7.5C2.44687 7.5 2 7.94687 2 8.5C2 9.05313 2.44687 9.5 3 9.5C3.55313 9.5 4 9.05313 4 8.5ZM13 9.5C13.5531 9.5 14 9.05313 14 8.5C14 7.94687 13.5531 7.5 13 7.5C12.4469 7.5 12 7.94687 12 8.5C12 9.05313 12.4469 9.5 13 9.5Z',
      viewBox: '0 0 16 14',
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