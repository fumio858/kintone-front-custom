(function(PLUGIN_ID) {
    'use strict';

    const config = kintone.plugin.app.getConfig(PLUGIN_ID);
    const apiTokens = config.api_tokens ? JSON.parse(config.api_tokens) : {};

    const tableBody = document.getElementById('api-token-table-body');
    const addRowButton = document.getElementById('add-row-button');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');

    // 設定の読み込みと表示
    function loadConfig() {
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
        if (Object.keys(apiTokens).length > 0) {
            for (const appId in apiTokens) {
                if (Object.prototype.hasOwnProperty.call(apiTokens, appId)) {
                    addRow(appId, apiTokens[appId]);
                }
            }
        } else {
            addRow('', '');
        }
    }

    // テーブルに行を追加する関数
    function addRow(appId = '', token = '') {
        const row = tableBody.insertRow();
        row.className = 'kintoneplugin-table-row';

        // アプリID入力欄
        const appIdCell = row.insertCell();
        const appIdInput = document.createElement('input');
        appIdInput.type = 'number';
        appIdInput.className = 'kintoneplugin-input-text';
        appIdInput.value = appId;
        appIdInput.min = '1';
        appIdInput.placeholder = 'アプリID';
        appIdCell.appendChild(appIdInput);

        // APIトークン入力欄
        const tokenCell = row.insertCell();
        const tokenInput = document.createElement('input');
        tokenInput.type = 'text';
        tokenInput.className = 'kintoneplugin-input-text';
        tokenInput.value = token;
        tokenInput.placeholder = 'APIトークン';
        tokenCell.appendChild(tokenInput);

        // 削除ボタン
        const deleteCell = row.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'kintoneplugin-button-normal';
        deleteButton.textContent = '削除';
        deleteButton.onclick = function() {
            tableBody.removeChild(row);
        };
        deleteCell.appendChild(deleteButton);
    }

    // イベントリスナー
    addRowButton.addEventListener('click', () => addRow());

    saveButton.addEventListener('click', () => {
        const newApiTokens = {};
        const rows = tableBody.querySelectorAll('.kintoneplugin-table-row');
        let hasError = false;

        rows.forEach(row => {
            const appIdInput = row.cells[0].querySelector('input');
            const tokenInput = row.cells[1].querySelector('input');
            const appId = appIdInput.value.trim();
            const token = tokenInput.value.trim();

            if (appId && token) {
                if (newApiTokens[appId]) {
                    alert(`アプリID「${appId}」が重複しています。`);
                    hasError = true;
                }
                newApiTokens[appId] = token;
            } else if (appId || token) {
                alert('アプリIDとAPIトークンは両方入力してください。');
                hasError = true;
            }
        });

        if (hasError) return;

        kintone.plugin.app.setConfig({ api_tokens: JSON.stringify(newApiTokens) }, () => {
            alert('設定を保存しました。');
            history.back();
        });
    });

    cancelButton.addEventListener('click', () => {
        history.back();
    });

    // 初期表示
    loadConfig();

})(kintone.$PLUGIN_ID);