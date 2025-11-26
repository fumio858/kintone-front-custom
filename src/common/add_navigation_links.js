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
      svgPath: 'M7.80273 5.27832C8.32426 5.27832 8.74506 5.69822 8.74512 6.21973V6.74121C11.2111 7.65881 12.9668 10.0311 12.9668 12.8174C12.9666 16.3966 10.0627 19.3008 6.4834 19.3008C2.90429 19.3006 0.000175871 16.3965 0 12.8174C0 10.0342 1.75648 7.65884 4.22266 6.74121V6.21973C4.22271 5.69829 4.64264 5.27844 5.16406 5.27832H7.80273ZM14.1367 5.27832C14.6581 5.27844 15.0781 5.69829 15.0781 6.21973V6.74121C17.5443 7.65873 19.3008 10.0309 19.3008 12.8174C19.3006 16.3965 16.3965 19.3006 12.8174 19.3008C12.3314 19.3008 11.8551 19.2468 11.3994 19.1455L11.0938 19.0771L11.3379 18.8818C12.0174 18.3382 12.6037 17.6812 13.0664 16.9434L13.1055 16.8799L13.1797 16.873C15.2567 16.6917 16.8895 14.9456 16.8896 12.8174C16.8896 10.6891 15.2603 8.94527 13.1797 8.76074L13.1055 8.75391L13.0664 8.69141C12.4484 7.70771 11.6126 6.87245 10.6318 6.25098L10.5527 6.2002L10.5635 6.10645C10.6186 5.63914 11.0156 5.27832 11.498 5.27832H14.1367ZM6.4834 8.74512C4.23427 8.74529 2.41113 10.5682 2.41113 12.8174C2.41131 15.0664 4.23438 16.8895 6.4834 16.8896C8.73257 16.8896 10.5555 15.0665 10.5557 12.8174C10.5557 10.5681 8.73267 8.74512 6.4834 8.74512ZM6.4834 2.11133C7.1501 2.11133 7.68945 2.65069 7.68945 3.31738C7.68928 3.98393 7.14999 4.52246 6.4834 4.52246C5.81696 4.52229 5.2785 3.98382 5.27832 3.31738C5.27832 2.65079 5.81685 2.1115 6.4834 2.11133ZM12.8174 2.11133C13.4839 2.1115 14.0225 2.65079 14.0225 3.31738C14.0223 3.98382 13.4838 4.52229 12.8174 4.52246C12.1508 4.52246 11.6115 3.98393 11.6113 3.31738C11.6113 2.65069 12.1507 2.11133 12.8174 2.11133ZM9.65039 0C10.3171 0 10.8555 0.539358 10.8555 1.20605C10.8554 1.8727 10.3171 2.41113 9.65039 2.41113C8.98373 2.41113 8.44537 1.8727 8.44531 1.20605C8.44531 0.539358 8.98369 1.28428e-07 9.65039 0Z',
      viewBox: '-2 -2 24 24',
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