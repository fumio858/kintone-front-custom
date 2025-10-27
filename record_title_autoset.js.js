/**
 * kintone保存時にタイトルへ「担当：◯◯」を自動付与するスクリプト
 * ------------------------------------------------------------
 * 前提フィールド（フィールドコードは必要に応じて変更）
 *   - staff       : ユーザー選択（複数可） … 担当事務員
 *   - staff_text  : 文字列（1行）            … 担当者名の表示用コピー
 *   - case_title  : 文字列（1行）            … 元のタイトル（案件名など）
 *   - title_display: 文字列（1行）           … 出力タイトル（これを「レコードのタイトル」に指定）
 */
(function () {
  'use strict';

  // ★必要ならここを書き換え
  const F = {
    STAFF_USER: 'staff',        // ユーザー選択（複数可）
    STAFF_TEXT: 'staff_text',   // 表示用テキスト
    BASE_TITLE: 'case_title',   // 元タイトル
    TITLE_OUT:  'title_display' // 出力タイトル
  };

  // 複数ユーザーを「・」で結合して氏名文字列を返す
  function namesFromUserSelect(vals) {
    if (!Array.isArray(vals) || !vals.length) return '';
    return vals.map(v => v && v.name).filter(Boolean).join('・');
  }

  // タイトルを組み立て（担当が空なら括弧を付けない）
  function buildTitle(base, staffText) {
    const b = (base || '').trim();
    const s = (staffText || '').trim();
    return s ? `${b}（担当：${s}）` : b;
  }

  // 計算して event.record に反映
  function setComputed(event) {
    const r = event.record || {};
    // フィールドが無い環境でも落ちないようガード
    if (!r[F.STAFF_TEXT] || !r[F.TITLE_OUT]) return event;

    const staffText = r[F.STAFF_TEXT] ? namesFromUserSelect(r[F.STAFF_USER]?.value) : '';
    r[F.STAFF_TEXT].value = staffText;

    const baseTitle = r[F.BASE_TITLE] ? (r[F.BASE_TITLE].value || '') : '';
    r[F.TITLE_OUT].value = buildTitle(baseTitle, staffText);

    return event;
  }

  // 画面表示やフィールド変更でプレビュー反映
  kintone.events.on([
    'app.record.create.show',
    'app.record.edit.show',
    `app.record.create.change.${F.STAFF_USER}`,
    `app.record.edit.change.${F.STAFF_USER}`,
    `app.record.create.change.${F.BASE_TITLE}`,
    `app.record.edit.change.${F.BASE_TITLE}`
  ], setComputed);

  // 保存時（確定反映）
  kintone.events.on([
    'app.record.create.submit',
    'app.record.edit.submit'
  ], setComputed);

})();
