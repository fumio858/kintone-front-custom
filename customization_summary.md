# Kintoneカスタマイズ機能概要

このドキュメントは、現在適用されているKintoneのJavaScriptカスタマイズの機能概要をまとめたものです。デバッグや改修時の参考資料として使用してください。

## 共通機能 (`src/common`)

### `add_navigation_links.js`
- **機能**: Kintoneのグローバルナビゲーションに、複数のアプリやポータルへのカスタムアイコンリンクを追加します。
- **設定**: `CUSTOM_LINKS` 配列にリンク先、タイトル、SVGアイコンを定義します。
- **トリガー**: 全てのページで実行され、ヘッダーの描画を監視してリンクを挿入します。

### `replace_standard_notification_icon.js`
- **機能**: ヘッダーの標準の通知アイコン（自分宛）を、カスタムのSVGアイコン（封筒）に置き換えます。
- **トリガー**: 全てのページで実行され、ヘッダーの描画を監視してアイコンを置換します。

---

## ポータル (`src/portal`)

### `portal_calendar.js`
- **機能**: ポータルの右カラムに、タスクアプリ（ID: 23）のカレンダービューをiframeで埋め込み表示します。
- **トリガー**: ポータル表示時 (`portal.show`)。

### `portal_links.js`
- **機能**: リンク集アプリ（ID: 59）からデータを取得し、特定のポータル（`/portal/4`）にアイコン付きのリンクカード一覧をカテゴリ別に表示します。
- **トリガー**: URLのハッシュが `/portal/4` を含む場合に実行されます。

### `portal_notifications.js`
- **機能**: お知らせアプリ（ID: 61）の情報を取得し、特定のポータル（`/portal/5`）に2カラムの通知掲示板を生成します。左側で通知一覧のカテゴリ分けと検索、右側で詳細表示が可能です。
- **トリガー**: URLのハッシュが `/portal/5` を含む場合に実行されます。

---

## レコード詳細（遅延実行） (`src/record-deferred`)

### `auto_fill_same_person.js`
- **機能**: 「被疑者と相談者が同じ」チェックボックスがONの時、被疑者の氏名・フリガナを契約者情報へ自動入力します。
- **イベント**: `app.record.create.change.*`, `app.record.edit.change.*`

### `case_summary_sync.js`
- **機能**: 対象アプリ（ID: 22, 26, 55）のレコードが作成・更新された際に、集計用アプリ（ID: 58）にその内容を同期（作成または更新）します。
- **イベント**: `app.record.create.submit.success`, `app.record.edit.submit.success`

### `comment-reactions.js`
- **機能**: レコード詳細のコメント欄に絵文字リアクション機能を追加します。リアクションの情報はレコードの特定フィールド（`reaction_log`）にJSON形式で保存されます。
- **イベント**: `app.record.detail.show`

### `commentPanel-launcher.js`
- **機能**: コメントフォームの横に「タスク追加」ボタンを設置します。ボタンを押すと、コメント内容を引用してタスク作成パネル（`task_app.js`）を開きます。
- **イベント**: `app.record.detail.show`

### `linkify_case_number.js`
- **機能**: レコード一覧画面で、「事件番号」フィールドの文字列をSalesforceへのリンクに変換します。
- **イベント**: `app.record.index.show`

### `process_management_popup.js`
- **機能**: レコード担当者がコメントを投稿する際、ステータス変更を促すポップアップを表示します。これにより、ステータスの更新漏れを防ぎます。
- **イベント**: `app.record.detail.show`

### `save_last_comment_datetime.js`
- **機能**: レコードに新しいコメントが投稿された際、その投稿日時を「最終コメント日時」フィールドに自動で記録します。
- **イベント**: `app.record.detail.show`、`urlchanged`（カスタムイベント）

### `scroll_to_error.js`
- **機能**: レコード保存時にバリデーションエラーが発生した場合、画面を最初のエラーフィールドまで自動でスクロールさせます。
- **イベント**: `app.record.create.show`, `app.record.edit.show`

### `task_app.js`
- **機能**: レコード詳細画面にタスク追加用のパネルUIを提供します。このパネルから、表示中のレコードに関連するタスクをタスクアプリ（ID: 23）に登録できます。
- **イベント**: `app.record.detail.show`（スペースフィールドへの描画）、グローバル関数 `window.userTaskPanelInit` の呼び出し

### `title_autoset.js`
- **機能**: 「担当者」と「元のタイトル」フィールドを基に、`[元のタイトル]（担当：[担当者名]）`という形式でレコードのタイトルを自動生成・更新します。
- **イベント**: `app.record.create.show`, `app.record.edit.show`, `app.record.create.submit`, `app.record.edit.submit`および関連フィールドの変更時。

---

## レコード詳細（優先実行） (`src/record-priority`)

### `detail-custom.js`
- **機能**: レコード詳細画面のヘッダーレイアウトを大幅に変更します。ステータス表示やプロセス管理のアクションボタンをツールバー内に移動させ、タイトルや特記事項、概要をまとめたカスタムヘッダー領域を生成します。
- **イベント**: `app.record.detail.show`

---

## タスクアプリ (`src/task`)

### `calendar_customization.js`
- **機能**: タスクアプリ（ID: 23）のカレンダー表示をカスタマイズします。タスクの「分野」に応じて背景色を変更し、完了タスクには横線を引きます。また、カレンダー上のタスクのリンク先を、タスク自身ではなく関連する案件レコード詳細画面に変更します。
- **イベント**: `app.record.index.show`

### `dynamic_related_records.js`
- **機能**: 
    1.  案件レコード詳細画面に、関連するタスクアプリ（ID: 23）のレコード情報を一覧表示します。
    2.  タスクアプリのレコード詳細画面に、関連する案件レコードをiframeで埋め込み表示します。
- **イベント**: `app.record.detail.show`
