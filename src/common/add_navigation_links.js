(function () {
  'use strict';

  // ==============================
  // 😄 設定定義
  // ==============================
  const CUSTOM_LINKS = [
    {
      title: '刑事事件',
      href: 'https://atomfirm.cybozu.com/k/22/?view=13312806',
      // サイレンアイコン (ユーザー提供)
      svgPath: 'M160-200h640v-80H160v80Zm160-240h80v-120q0-33 23.5-56.5T480-640v-80q-66 0-113 47t-47 113v120Zm160 160Zm-200-80h400v-200q0-83-58.5-141.5T480-760q-83 0-141.5 58.5T280-560v200ZM160-120q-33 0-56.5-23.5T80-200v-80q0-33 23.5-56.5T160-360h40v-200q0-117 81.5-198.5T480-840q117 0 198.5 81.5T760-560v200h40q33 0 56.5 23.5T880-280v80q0 33-23.5 56.5T800-120H160Zm320-240Z',
      viewBox: '0 -960 960 960',
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
   * アイコンリンクのHTML要素を生成する
   * @param {object} link - CUSTOM_LINKSの要素
   * @returns {HTMLLIElement} - 生成されたli要素
   */
  function createIconLinkElement(link) {
    // kintoneの既存のHTML構造を模倣する
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; align-items: center;'; // 微調整

    const divContainer = document.createElement('div');
    // クラス名はkintoneのアップデートで変わりうるが、スタイル適用のため追従
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

    const bookmarkButton = document.querySelector(BOOKMARK_BUTTON_SELECTOR);
    if (!bookmarkButton) {
      // ブックマークボタンが見つからない場合は何もしない
      return;
    }

    // ブックマークボタンの親(li)の、さらに親(ul)を取得
    const targetList = bookmarkButton.closest('ul');
    const bookmarkListItem = bookmarkButton.closest('li');

    if (!targetList || !bookmarkListItem) {
      return;
    }

    // ブックマークの後ろにカスタムリンクを挿入
    // insertBefore(newNode, referenceNode) を使うため、逆順でループ
    [...CUSTOM_LINKS].reverse().forEach(link => {
      const newLinkElement = createIconLinkElement(link);
      targetList.insertBefore(newLinkElement, bookmarkListItem.nextSibling);
    });

    // 追加済みのフラグを立てる
    document.body.dataset[ADDED_FLAG] = 'true';
    console.log('Added custom navigation links.');
  }

  // ==============================
  // 🚀 初期化処理
  // ==============================

  // ヘッダーは非同期で描画されるため、DOMの変更を監視する
  const observer = new MutationObserver((mutations, obs) => {
    const navBar = document.querySelector(BOOKMARK_BUTTON_SELECTOR);
    if (navBar) {
      addCustomNavLinks();
      // 目的の要素を見つけたら監視を停止しても良いが、
      // 画面遷移でヘッダーが再描画される可能性を考慮し、監視を続ける
      // obs.disconnect(); 
    }
  });

  // body要素の子要素の変更を監視
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

})();
