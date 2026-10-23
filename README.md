# ドラゴンクエスト・ダンジョンズ 〜勇者と不思議な洞穴〜

ドラクエ3風の勇者とモンスターが登場する、ブラウザで遊べるローグライク RPG です。
ランダム生成ダンジョン、ドット絵、装備による見た目変化、呪文・特技習得、レトロ BGM・SE を備えています。
ゲームは完全にクライアントサイドで動作し、API キーやサーバーは不要です。

## ローカルで動かす

**必要なもの:** Node.js 20.19 以上（推奨: 22 以上）

```bash
npm install
npm run dev
```

## Netlify Drop で公開する

1. 依存パッケージを入れてビルドします。

   ```bash
   npm install
   npm run build
   ```

2. `dist` フォルダが生成されます。このフォルダを [Netlify Drop](https://app.netlify.com/drop) の画面にドラッグ＆ドロップします。

   - `dist` フォルダをそのままドラッグして OK です。
   - アップロード用の zip を作る場合は、`dist` の中身（`index.html` など）が zip の直下に来るように圧縮してください。
   - 公開 URL は Netlify が自動で発行します。

ビルド設定は `netlify.toml` に定義済みです（`npm run build` → `dist` を公開）。
Git リポジトリと連携する場合も、そのまま Netlify に読み込ませるだけでデプロイできます。

## その他のコマンド

```bash
npm run preview   # ビルド結果をローカルで確認
npm run lint      # TypeScript の型チェック
```
