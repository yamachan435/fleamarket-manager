# フリマ管理アプリ

フリーマーケットの商品管理、販促管理、出品管理を行うWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase
- **画像保存**: Google Drive

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd fleamarket-manager
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
cp .env.local.example .env.local
```

必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `GOOGLE_CLIENT_ID`: Google Drive APIのクライアントID
- `GOOGLE_CLIENT_SECRET`: Google Drive APIのクライアントシークレット
- `GOOGLE_REDIRECT_URI`: Google OAuthのリダイレクトURI

### 4. Supabaseのセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. `supabase/migrations/20240101000000_initial_schema.sql`の内容をSupabaseのSQL Editorで実行
3. 環境変数にSupabaseのURLとキーを設定

### 5. Google Drive APIのセットアップ

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Google Drive APIを有効化
3. OAuth 2.0認証情報を作成
4. 環境変数にGoogle APIの認証情報を設定

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス

## 機能

### 商品管理
- 商品の登録・削除
- 商品ごとの画像管理（Google Driveと連携）
- 画像の表示・削除

### 販促管理
- 商品と1対1で紐付く販促情報（タイトル、説明文、標準売価）の登録・編集・削除
- コピーボタンによる簡単なコピー機能

### 出品管理
- 商品・販促情報・媒体・売価・URLの登録
- 商品選択時の販促情報自動表示
- 標準売価のショートカット設定
- コピーボタンによる出品情報のコピー支援

## 本番デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com/)にアカウントを作成
2. リポジトリをインポート
3. 環境変数を設定
4. デプロイ

詳細な手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### その他のホスティングサービス

- Netlify
- Cloudflare Pages
- Railway

## スマートフォンからのアクセス

デプロイ後、以下のURLにスマートフォンからアクセスできます：

```
https://<your-project>.vercel.app
```

レスポンシブデザインにより、スマートフォンでも快適に利用可能です。

## ライセンス

MIT