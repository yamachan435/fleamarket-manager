# セットアップガイド

このアプリを使うためのセットアップ手順を説明します。

## 1. Supabaseのセットアップ（必須）

### 1.1 Supabaseアカウント作成
1. [Supabase](https://supabase.com/)にアクセス
2. GitHubアカウントでサインアップ（無料）

### 1.2 プロジェクト作成
1. 「New Project」をクリック
2. プロジェクト名を入力（例: `fleamarket-manager`）
3. データベースパスワードを設定（メモしておく）
4. リージョンは「Asia Pacific (Tokyo)」を選択
5. 「Create new project」をクリック

### 1.3 環境変数の設定
プロジェクト作成後、Settings > API から以下を取得：
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local`ファイルに貼り付けてください。

### 1.4 データベーステーブルの作成
1. Supabaseダッシュボードの「SQL Editor」を開く
2. 「New query」をクリック
3. `supabase/migrations/20240101000000_initial_schema.sql`の内容をコピーして貼り付け
4. 「Run」をクリックして実行
5. `supabase/migrations/20240101000001_add_oauth_tokens.sql`の内容をコピーして貼り付け
6. 「Run」をクリックして実行
7. `supabase/migrations/20240101000002_fix_promotion_relation.sql`の内容をコピーして貼り付け
8. 「Run」をクリックして実行

## 2. Google Drive APIのセットアップ（必須）

### 2.1 Google Cloud Consoleでプロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（例: `fleamarket-images`）

### 2.2 Google Drive APIを有効化
1. 左のメニューから「APIとサービス」>「ライブラリ」
2. 「Google Drive API」を検索
3. 「有効にする」をクリック

### 2.3 OAuth同意画面の設定
1. 「APIとサービス」>「OAuth 同意画面」
2. 「外部」を選択
3. 「作成」をクリック
4. アプリ名: 任意（例: `Fleamarket Manager`）
5. ユーザーサポートメール: 自分のメールアドレス
6. 「保存して次へ」をクリック
7. スコープの追加は不要（そのまま「次へ」）
8. テストユーザーとして**自分のGoogleメールアドレス**を追加
9. 「保存して次へ」をクリック

**重要**: 「外部」を選択すると「審査が必要」と表示されますが、テストユーザーとして自分を追加すれば審査なしで使えます。自分だけが使う分には問題ありません。

### 2.4 OAuth 2.0認証情報を作成
1. 「APIとサービス」>「認証情報」
2. 「認証情報を作成」>「OAuth クライアント ID」
3. アプリケーションの種類: 「ウェブアプリケーション」
4. 名前: 任意（例: `Fleamarket Manager`）
5. 「承認済みリダイレクト URI」に以下を追加:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. 「作成」をクリック
7. **クライアントID**と**クライアントシークレット**をメモ

### 2.5 アクセストークンとリフレッシュトークンを取得
[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)を使います：
1. 右上の歯車アイコンをクリック
2. 「Use your own OAuth credentials」にチェック
3. クライアントIDとクライアントシークレットを入力
4. 左のリストから「Google Drive API v3」>「https://www.googleapis.com/auth/drive.file」を選択
5. 「Authorize APIs」をクリック
6. 自分のGoogleアカウントでログイン
7. 「Exchange authorization code for tokens」をクリック
8. 表示された**アクセストークン**と**リフレッシュトークン**をコピー

### 2.6 Google Driveフォルダの作成（任意）
1. Google Driveを開く
2. 新しいフォルダを作成（例: `フリマ画像`）
3. フォルダを右クリック>「リンクを取得」
4. URLからフォルダIDを抽出（例: `https://drive.google.com/drive/folders/`**`1aBcD2EfGhIjKlMnOpQrStUvWxYz`**）

### 2.7 環境変数の設定
`.env.local`ファイルに以下を設定:
```env
GOOGLE_CLIENT_ID=取得したクライアントID
GOOGLE_CLIENT_SECRET=取得したクライアントシークレット
GOOGLE_REFRESH_TOKEN=取得したリフレッシュトークン
GOOGLE_ACCESS_TOKEN=取得したアクセストークン
GOOGLE_DRIVE_FOLDER_ID=フォルダID
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

## 3. アプリの起動

### 3.1 依存関係のインストール
```bash
cd /home/yama/fleamarket-manager
npm install
```

### 3.2 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 4. 使い方

### 商品管理
1. 「商品管理」タブを選択
2. 商品名を入力して「商品を追加」
3. 商品をクリックして選択
4. 「画像を追加」ボタンで画像をアップロード

### 販促管理
1. 「販促管理」タブを選択
2. タイトル、説明文、標準売価を入力
3. 「作成」ボタンで登録
4. コピーボタンで各項目をコピー可能

### 出品管理
1. 「出品管理」タブを選択
2. 商品を選択
3. 販促情報を選択（任意）
4. 媒体、売価、URLを入力
5. 「出品を追加」で登録

## トラブルシューティング

### 画像がアップロードできない場合
- SupabaseのStorageバケットが「Public」になっているか確認
- `.env.local`のSupabaseの値が正しいか確認

### データが表示されない場合
- SupabaseのSQL Editorでテーブルが作成されているか確認
- ブラウザのコンソールでエラーを確認