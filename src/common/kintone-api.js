export const kUrl = (p) => kintone.api.url(p.endsWith('.json') ? p : `${p}.json`, true);
