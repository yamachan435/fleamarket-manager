# Google Drive OAuth 2.0 セットアップ手順

このドキュメントに従って設定することで、Google Driveへのファイルアップロードが可能になります。

## 事前準備

- Googleアカウント（GCPで使用するもの）
- Supabaseアカウント（トークン保存用）

---

## ステップ1: Google Cloud Platform でプロジェクトを作成

1. https://console.cloud.google.com/ にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

---

## ステップ2: Google Drive API を有効化

1. 左側メニュー「APIとサービス」→「ライブラリ」
2. 「Google Drive API」を検索
3. 「有効にする」をクリック

---

## ステップ3: OAuth 同意画面を設定

1. 左側メニュー「APIとサービス」→「認証情報」
2. 画面上部の「OAuth 同意画面」タブをクリック
   - タブがない場合は「OAuth 同意画面を設定」ボタンをクリック
3. ユーザータイプを選択:
   - **外部**（個人利用の場合はこちら）
4. 「作成」をクリック
5. アプリ情報を入力:
   - アプリ名: FleaMarket Manager（任意）
   - ユーザーサポートメール: あなたのメールアドレス
   - 開発者連絡先情報: あなたのメールアドレス
6. 「保存して次へ」をクリック
7. スコープは何も入力せずに「保存して次へ」をクリック
   - （スコープは認証時に自動的に指定されます）
8. テストユーザーを追加:
   - 「テストユーザーを追加」をクリック
   - 使用するGoogleアカウントのメールアドレスを入力
   - 「保存して次へ」をクリック
9. アプリの公開状態:
   - **テスト版**を選択（個人利用の場合）
10. 「ダッシュボードに戻る」をクリック

---

## ステップ4: OAuth 2.0 クライアントIDを作成

1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: **ウェブアプリケーション**
4. 名前: FleaMarket Manager（任意）
5. 「承認済みリダイレクト URI」に追加:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. 「作成」をクリック
7. **クライアントID** と **クライアントシークレット** をコピー（後で使用）

---

## ステップ5: Supabase データベースをセットアップ

1. Supabaseダッシュボードにログイン
2. 「SQL Editor」を選択
3. 以下のSQLを貼り付けて実行:

```sql
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

ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on google_drive_tokens" ON google_drive_tokens FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_created_at ON google_drive_tokens(created_at);
```

---

## ステップ6: 環境変数を設定

プロジェクトルートに `.env.local` ファイルを作成し、以下を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase匿名キー

# Google Drive API (OAuth 2.0)
GOOGLE_OAUTH_CLIENT_ID=あなたのクライアントID
GOOGLE_OAUTH_CLIENT_SECRET=あなたのクライアントシークレット
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=（オプション）Google DriveフォルダID
```

### 各値の取得方法

- `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  - Supabaseダッシュボード「Settings」→「API」で確認

- `GOOGLE_OAUTH_CLIENT_ID` と `GOOGLE_OAUTH_CLIENT_SECRET`:
  - GCP「認証情報」ページで作成したOAuth 2.0クライアントIDの詳細を表示

- `GOOGLE_DRIVE_FOLDER_ID`（オプション）:
  - Google Driveでフォルダを作成
  - フォルダのURLからIDを抽出: `https://drive.google.com/drive/folders/{FOLDER_ID}`

---

## ステップ7: アプリケーションを起動

1. 依存関係をインストール:
   ```bash
   npm install
   ```

2. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

3. ブラウザでアクセス:
   ```
   http://localhost:3000
   ```

---

## ステップ8: Google Drive 認証を実行

1. ブラウザで以下にアクセス:
   ```
   http://localhost:3000/api/auth/google
   ```

2. Googleの認証画面が表示されるので、ログインして許可

3. 認証が完了すると、トークンがSupabaseに自動保存される

4. これでファイルアップロード機能が使用可能になる

---

## トラブルシューティング

### エラー: 「Some requested scopes were invalid」

**原因**: Google Drive APIが有効化されていない

**解決策**:
1. GCPコンソール「APIとサービス」→「ライブラリ」
2. 「Google Drive API」が「有効」になっているか確認
3. なっていない場合は「有効にする」をクリック

### エラー: 「Google OAuth認証情報が設定されていません」

**原因**: `.env.local` が正しく設定されていない

**解決策**: `.env.local` の内容を確認し、GCPで取得した認証情報を正しく入力

### エラー: リダイレクトURIの不一致

**原因**: GCPの設定と `.env.local` の `GOOGLE_OAUTH_REDIRECT_URI` が一致していない

**解決策**: 両方の値が完全に一致しているか確認（`http://localhost:3000/api/auth/google/callback`）

---

## 完了後の使い方

認証が完了すると、以下のエンドポイントでファイルアップロードが可能:

```
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- file: アップロードするファイル
- productId: （オプション）商品ID
```

レスポンス:
```json
{
  "fileId": "google-drive-file-id",
  "driveUrl": "https://lh3.googleusercontent.com/d/file-id"
}
```

---

## 注意事項

- トークンは自動的にリフレッシュされる（有効期限の5分前に更新）
- リフレッシュトークンはSupabaseに安全に保存
- 本番環境ではHTTPSを使用すること

```
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- file: アップロードするファイル
- productId: (オプション) 商品ID
```

レスポンス:
```json
{
  "fileId": "google-drive-file-id",
  "driveUrl": "https://lh3.googleusercontent.com/d/file-id"
}
```

## 10. メンテナンス

### 10.1 トークンの自動更新
- アクセストークンは自動的にリフレッシュされます（有効期限の5分前に更新）
- リフレッシュトークンはSupabaseに安全に保存

### 10.2 トークンの再認証
リフレッシュトークンが無効になった場合:
1. `/api/auth/google` にアクセス
2. 再度Google認証を実行

## サポート

問題が発生した場合は、サーバーログを確認してください。