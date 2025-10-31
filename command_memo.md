# dist再生成
npx webpack
npm run build

# 保存するたび生成
npx webpack --watch

# まとめてプッシュ
git add -A && git commit -m "まとめコミット" && git push