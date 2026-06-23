# デプロイガイド

このドキュメントでは、フリマ管理アプリを本番環境にデプロイする手順を説明します。

## 目次

1. [デプロイ先の選定](#デプロイ先の選定)
2. [事前準備](#事前準備)
3. [Netlifyへのデプロイ](#netlifyへのデプロイ)
4. [Google OAuthの本番設定](#google-oauthの本番設定)
5. [Supabaseの本番設定](#supabaseの本番設定)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## デプロイ先の選定

### 推奨: Netlify

このプロジェクトはNext.jsで構築されており、**Netlify**でも問題なくデプロイ可能です。

**理由:**
- 無料プランあり（個人利用の場合）
- 自動的なHTTPS対応
- カスタムドメイン対応
- プレビュー環境の提供
- シンプルなUIで操作が容易

**無料プランの制限:**
- ビルド時間: 300分/月
- 帯域幅: 100GB/月
- この規模のアプリなら十分

### その他の選択肢

- **Vercel**: Next.js開発元提供、無制限ビルド時間（Hobbyプラン）
- **Railway**: シンプルなデプロイ、無料枠あり
- **Cloudflare Pages**: 高速なエッジ配信

---

## 事前準備

### 必要なアカウント

1. **Netlifyアカウント**
2. **Supabaseアカウント**（本番データベース）
3. **Google Cloud Platformアカウント**（Google Drive API用）

### リポジトリの準備

GitHub、GitLab、またはBitbucketにリポジトリをプッシュしてください。

```bash
git remote add origin <your-repository-url>
git push -u origin main
```

---

## Netlifyへのデプロイ

### 方法1: Netlify CLIを使用（推奨）

#### 1. Netlify CLIのインストール

```bash
npm install -g netlify-cli
```

#### 2. ログイン

```bash
netlify login
```

#### 3. サイトの初期化

```bash
netlify init
```

以下の質問に答えます：

- **What would you like to do?** → `Create & configure a new site`
- **Choose a name for your site** → 任意の名前（またはデフォルト）
- **Team** → アカウントを選択
- **Build command** → `npm run build`
- **Directory to deploy** → `.next`
- **Netlify functions folder** → `netlify/functions`（任意、Enterでスキップ可）

#### 4. 環境変数の設定

```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-supabase-url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-supabase-anon-key"
netlify env:set GOOGLE_OAUTH_CLIENT_ID "your-client-id"
netlify env:set GOOGLE_OAUTH_CLIENT_SECRET "your-client-secret"
netlify env:set GOOGLE_OAUTH_REDIRECT_URI "https://your-site.netlify.app/api/auth/google/callback"
netlify env:set GOOGLE_DRIVE_FOLDER_ID "your-folder-id"
```

#### 5. デプロイの実行

```bash
netlify deploy --prod
```

### 方法2: Netlifyダッシュボードを使用

#### 1. Netlifyにログイン

https://app.netlify.com/ にアクセスしてログイン

#### 2. 新規サイトの作成

1. 「Add new site」→「Import an existing project」をクリック
2. GitHub/GitLab/Bitbucketからリポジトリを選択
3. リポジトリをインポート

#### 3. ビルド設定の確認

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Base directory**: （空白のまま）

#### 4. 環境変数の設定

「Site settings」→「Environment variables」→「Add a variable」で以下を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 本番Supabase URL | Supabaseダッシュボードで確認 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番Supabase匿名キー | Supabaseダッシュボードで確認 |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth クライアントID | GCPで作成 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth クライアントシークレット | GCPで作成 |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://<your-site>.netlify.app/api/auth/google/callback` | 本番用リダイレクトURI |
| `GOOGLE_DRIVE_FOLDER_ID` | Google DriveフォルダID | オプション |

**重要**: 環境変数を追加したら、「Production」スコープを選択してください。

#### 5. デプロイの実行

「Deploy site」ボタンをクリック

デプロイには2〜3分程度かかります。完了すると、Netlifyからドメインが発行されます（例: `https://your-site.netlify.app`）

---

## Google OAuthの本番設定

### 1. 本番用リダイレクトURIの追加

GCPコンソールでOAuth 2.0クライアントIDの設定を更新します。

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「APIとサービス」→「認証情報」
3. 作成したOAuth 2.0クライアントIDをクリック
4. 「承認済みリダイレクト URI」に以下を追加：

```
https://<your-site>.netlify.app/api/auth/google/callback
```

**例:**
```
https://fleamarket-manager.netlify.app/api/auth/google/callback
```

5. 「保存」をクリック

### 2. テストユーザーの設定（開発中の場合）

本番環境では、OAuth同意画面を「本番」に公開する必要があります。

1. GCPコンソール「APIとサービス」→「OAuth 同意画面」
2. 「公開ステータス」セクションで「アプリを公開」をクリック
3. 必要な情報を入力して公開

**注意**: 公開するには、Googleによる審査が必要な場合があります（スコープによっては）。

### 3. 環境変数の更新

Netlifyの環境変数 `GOOGLE_OAUTH_REDIRECT_URI` を本番用に更新：

```
https://<your-site>.netlify.app/api/auth/google/callback
```

---

## Supabaseの本番設定

### 1. 本番プロジェクトの作成

1. [Supabase](https://supabase.com/)にログイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、地域を設定
4. 「Create new project」をクリック

### 2. データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 以下のSQLを実行：

```sql
-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_number TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 販促テーブル
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  standard_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 出品テーブル
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  media TEXT NOT NULL,
  price INTEGER NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 取引テーブル
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_name TEXT,
  quantity INTEGER DEFAULT 1,
  total_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Google Drive トークンテーブル
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  token_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security の有効化
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成（開発用：全ての操作を許可）
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on promotions" ON promotions FOR ALL USING (true);
CREATE POLICY "Allow all operations on listings" ON listings FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on google_drive_tokens" ON google_drive_tokens FOR ALL USING (true);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_product_id ON listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_created_at ON google_drive_tokens(created_at);
```

3. 「Run」をクリックして実行

### 3. 環境変数の取得

1. Supabaseダッシュボード「Settings」→「API」
2. 以下をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Netlifyへの環境変数設定

取得した値をNetlifyの環境変数に設定：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

---

## 動作確認

### 1. デプロイ後のアクセス

Netlifyから発行されたドメインにアクセス：

```
https://<your-site>.netlify.app
```

### 2. Google Drive認証のテスト

1. ブラウザで以下にアクセス：

```
https://<your-site>.netlify.app/api/auth/google
```

2. Googleの認証画面が表示される
3. ログインして許可
4. トップページにリダイレクトされ、成功メッセージが表示される

### 3. 基本機能のテスト

- 商品の登録
- 画像のアップロード（Google Drive連携）
- 販促情報の登録
- 出品情報の登録
- 取引の記録

### 4. スマートフォンからのアクセス

スマートフォンのブラウザでNetlifyドメインにアクセス：

```
https://<your-site>.netlify.app
```

レスポンシブデザインにより、スマートフォンでも利用可能です。

---

## トラブルシューティング

### デプロイが失敗する

**確認事項:**
1. ローカルで `npm run build` が成功するか確認
2. 環境変数が正しく設定されているか確認
3. Netlifyのビルドログを確認

```bash
# ローカルでビルドテスト
npm run build
```

### Google OAuth認証が失敗する

**確認事項:**
1. リダイレクトURIが完全に一致しているか
   - GCPの設定: `https://<your-site>.netlify.app/api/auth/google/callback`
   - 環境変数: `https://<your-site>.netlify.app/api/auth/google/callback`
2. Google Drive APIが有効化されているか
3. OAuth同意画面が「本番」に公開されているか

### 画像が表示されない

**確認事項:**
1. `next.config.js`の `images.remotePatterns` にGoogle Driveのドメインが含まれているか
2. Google Driveの画像URLが正しいか
3. 画像の共有設定が「リンクを知っている人なら閲覧可能」になっているか

### データベースエラーが発生する

**確認事項:**
1. SupabaseのSQL Editorでテーブルが正しく作成されているか
2. 環境変数のSupabase URLとキーが正しいか
3. Supabaseダッシュボードの「Table Editor」でデータを確認

### トークンのリフレッシュが失敗する

**確認事項:**
1. `google_drive_tokens`テーブルにトークンが保存されているか
2. リフレッシュトークンの有効期限が切れていないか
3. Google OAuthのクライアントIDとシークレットが正しいか

---

## カスタムドメインの設定（オプション）

Netlifyでカスタムドメインを使用する場合：

1. Netlifyダッシュボード「Domain settings」→「Add custom domain」
2. カスタムドメインを入力
3. DNS設定を更新（Netlifyの指示に従う）
4. Google OAuthのリダイレクトURIも更新

---

## 継続的デプロイの設定

Netlifyは自動的に継続的デプロイを提供します：

- **mainブランチへのプッシュ** → 本番環境に自動デプロイ
- **その他のブランチ** → プレビュー環境にデプロイ

### プレビュー環境のテスト

Pull Requestを作成すると、自動的にプレビュー環境が生成されます。本番デプロイ前にテストできます。

---

## コストについて

### Netlify

- **Freeプラン（無料）**:
  - 個人利用の場合
  - カスタムドメイン対応
  - HTTPS自動対応
  - 制限: 300分/月のビルド時間、100GB/月の帯域幅

- **Proプラン（$19/月）**:
  - 商用利用の場合
  - 無制限のビルド時間
  - チーム機能

### Supabase

- **Freeプラン（無料）**:
  - 500MBのデータベース
  - 1GBのファイルストレージ
  - 2GBの帯域幅

- **Proプラン（$25/月）**:
  - 8GBのデータベース
  - 100GBのファイルストレージ
  - 無制限のAPIリクエスト

### Google Drive API

- **無料枠**: 1日あたりのリクエスト数に制限あり
- 通常の利用では無料で十分

---

## セキュリティのベストプラクティス

### 1. 環境変数の管理

- ✅ Netlifyの環境変数機能を使用（`.env.local`をGitにコミットしない）
- ✅ 機密情報をクライアントサイドに露出させない
- ✅ 定期的にトークンをローテーション

### 2. Supabaseのセキュリティ

- ✅ Row Level Security (RLS) を有効化
- ✅ 本番環境では適切なポリシーを設定（開発用の「全て許可」は使わない）
- ✅ APIキーを定期的にローテーション

### 3. Google OAuthのセキュリティ

- ✅ リダイレクトURIを本番用に厳密に設定
- ✅ テストユーザーの削除（本番公開時）
- ✅ スコープを最小限に

---

## メンテナンス

### 定期タスク

1. **Supabaseのバックアップ**: 週次でデータベースをエクスポート
2. **Netlifyのログ確認**: エラーがないか定期的に確認
3. **Google OAuthトークンの確認**: トークンが正常にリフレッシュされているか確認

### モニタリング

- Netlify Analyticsでパフォーマンスを監視
- Supabaseダッシュボードでデータベースの使用状況を監視
- エラーログを定期的に確認

---

## 次のステップ

1. ✅ デプロイが完了したら、スマートフォンでアクセスして動作確認
2. ✅ 必要に応じてカスタムドメインを設定
3. ✅ 本番用のRLSポリシーを厳格化
4. ✅ バックアップ戦略を実装

---

## サポート

問題が発生した場合は：

1. Netlifyのビルドログを確認
2. Supabaseのログを確認
3. ブラウザの開発者ツールでエラーを確認
4. このドキュメントのトラブルシューティングセクションを参照

---

## 参考リンク

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Documentation](https://supabase.com/docs)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)