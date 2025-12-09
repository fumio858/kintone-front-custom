# Kintone DOM依存関係概要

このドキュメントは、KintoneカスタマイズがDOM（Document Object Model）にどのように依存しているかをまとめたものです。Kintoneのアップデートによるレイアウト変更やクラス名変更の際に影響範囲を特定するための技術資料として使用します。

## 共通機能 (`src/common`)

### `add_navigation_links.js`
- **DOM操作の概要**: Kintoneヘッダーのブックマークボタンの隣に、カスタムナビゲーションリンクをアイコン付きで複数挿入します。
- **主要メソッド**: `document.getElementById`, `document.querySelector`, `document.createElement`, `document.createElementNS` (SVG描画のため), `textContent`, `style`
- **対象セレクタ/ID**: `ga-header-appmenu-list-ocean` (ブックマークボタンの親), `#custom-nav-style` (スタイルタグの重複防止用ID)

### `replace_standard_notification_icon.js`
- **DOM操作の概要**: ヘッダーの標準通知アイコンをカスタムSVGアイコンに置換します。
- **主要メソッド**: `document.querySelector`
- **対象セレクタ/ID**: `.gaia-header-notification`

---

## ポータル (`src/portal`)

### `portal_calendar.js`
- **DOM操作の概要**: ポータルトップの右側コンテナに、タスクアプリのカレンダービューを`iframe`として埋め込みます。
- **主要メソッド**: `document.createElement`, `document.querySelector`, `style`
- **対象セレクタ/ID**: `.ocean-portal-body-right`

### `portal_links.js`
- **DOM操作の概要**: 特定のスペースID内に、リンク集アプリから取得したデータを用いてアイコン付きのリンクカード一覧を動的に生成・描画します。
- **主要メソッド**: `document.getElementById`, `document.createElement`, `innerHTML`, `textContent`, `style`
- **対象セレクタ/ID**: `link-collection-area` (設定ファイルで定義), `#cns-root`

### `portal_notifications.js`
- **DOM操作の概要**: お知らせアプリの内容から、タブ切り替え・検索機能付きの通知掲示板を動的に生成します。タブ、検索ボックス、詳細表示エリアなど、多数の要素を生成・操作します。
- **主要メソッド**: `document.getElementById`, `document.createElement`, `innerHTML`, `textContent`, `style`, `addEventListener`, `querySelector`, `querySelectorAll`
- **対象セレクタ/ID**: `portal-notifications-area` (設定ファイルで定義), `#cns-root`, `#notice-search`, `.tab-pane` など多数

---

## レコード詳細（遅延実行） (`src/record-deferred`)

### `comment-reactions.js`
- **DOM操作の概要**: 各コメントの下部に、絵文字リアクションボタン、押したユーザーのアイコン、引用ボタンを動的に追加します。引用ボタンはコメント本文を取得し、コメント入力欄に挿入します。
- **主要メソッド**: `document.createElement`, `document.querySelector`, `querySelectorAll`, `innerHTML`, `textContent`, `style`, `addEventListener`
- **対象セレクタ/ID**: `.itemlist-item-gaia`, `.commentlist-body-gaia`, `.text11.itemlist-footer-gaia`, `.ocean-ui-editor-field.editable`, `#sidebar-list-gaia`

### `commentPanel-launcher.js`
- **DOM操作の概要**: コメント投稿フォームの横に「＋タスク追加」ボタンを設置します。
- **主要メソッド**: `document.getElementById`, `document.querySelector`, `document.createElement`, `style`, `innerHTML`, `addEventListener`
- **対象セレクタ/ID**: `.ocean-ui-comments-commentform-form`, `.ocean-ui-comments-commentarea`, `#comment-task-launcher`

### `linkify_case_number.js`
- **DOM操作の概要**: 一覧画面の特定フィールド（`case_id`）の値を取得し、そのセル内容をSalesforceへのハイパーリンクに書き換えます。
- **主要メソッド**: `kintone.app.getFieldElements` (DOM要素取得), `innerHTML`, `createElement`, `textContent`, `style`
- **対象セレクタ/ID**: `case_id`フィールド

### `process_management_popup.js`
- **DOM操作の概要**: コメント投稿ボタンを監視し、クリック時にステータス変更を促すポップアップ（SweetAlert）を表示します。現在のステータスやアクションボタンのテキストをDOMから読み取ってポップアップ内に表示します。
- **主要メソッド**: `document.createElement('script')`, `document.querySelector`, `querySelectorAll`, `innerText`, `addEventListener`, `getElementById`
- **対象セレクタ/ID**: `.ocean-ui-comments-commentform-submit`, `.gaia-app-statusbar-statusmenu`, `.gaia-app-statusbar-action`

### `save_last_comment_datetime.js`
- **DOM操作の概要**: コメント欄のDOM変更を`MutationObserver`で監視し、新しいコメントが追加されたことを検知します。
- **主要メソッド**: `document.querySelector`, `window.addEventListener`
- **対象セレクタ/ID**: `#sidebar-list-gaia`

### `scroll_to_error.js`
- **DOM操作の概要**: レコード保存時にエラーが発生した場合、最初のエラー箇所（`.input-error-cybozu`クラスを持つ要素）まで画面をスクロールさせます。
- **主要メソッド**: `document.querySelector`
- **対象セレクタ/ID**: `.input-error-cybozu`

### `task_app.js`
- **DOM操作の概要**: スペースフィールド内にタスク追加・一覧表示用のUIパネル全体を動的に生成します。コンテナ、ボタン、リストなどの要素を全面的に`createElement`で構築し、表示/非表示を`style.display`で制御します。
- **主要メソッド**: `document.querySelector`, `document.createElement`, `style`, `innerHTML`, `textContent`, `addEventListener`, `document.addEventListener`
- **対象セレクタ/ID**: `[data-mirror-of="user-js-taskPanel"]`, `.ocean-ui-comments-commentform-form`, `#record-gaia`

---

## レコード詳細（優先実行） (`src/record-priority`)

### `detail-custom.js`
- **DOM操作の概要**: レコード詳細画面のヘッダーレイアウトを全面的に書き換えます。標準のステータスバーやアクションボタンを取得し、自前で生成したカスタムヘッダー領域内に移動・再配置します。
- **主要メソッド**: `document.querySelector`, `querySelectorAll`, `createElement`, `innerHTML`, `textContent`, `style`
- **対象セレクタ/ID**: `.container-gaia`, `.gaia-argoui-app-toolbar`, `.gaia-app-statusbar`, `.control-gaia .gaia-app-statusbar-statusmenu`, `.gaia-app-statusbar-action`

---

## タスクアプリ (`src/task`)

### `calendar_customization.js`
- **DOM操作の概要**: カレンダー表示で、各タスク（イベント）のDOM要素を取得し、タスクの「分野」に応じて背景色などのスタイルを直接変更します。
- **主要メソッド**: `document.querySelector`, `querySelectorAll`, `style`
- **対象セレクタ/ID**: `.calendar-gaia`, `.calendar-record-gaia`

### `dynamic_related_records.js`
- **DOM操作の概要**: スペースフィールド内に、関連レコードの一覧を動的に生成して表示します。また、別のケースでは`iframe`を生成して埋め込みます。
- **主要メソッド**: `kintone.app.record.getSpaceElement`, `document.getElementById`, `document.createElement`, `innerHTML`, `textContent`, `style`
- **対象セレクタ/ID**: 指定されたスペースID, `record-gaia`
