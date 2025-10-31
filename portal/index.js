function importAll(r) {
  r.keys().forEach(r);
}

// このフォルダ内のすべての .js を再帰的に読み込む
importAll(require.context('./', true, /\.js$/));