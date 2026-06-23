import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error from Google:', error)
      return NextResponse.redirect(
        new URL(`/?error=auth_denied&message=${encodeURIComponent('認証が拒否されました')}`, request.url)
      )
    }

    if (!code) {
      console.error('No authorization code received')
      return NextResponse.redirect(
        new URL('/?error=no_code&message=' + encodeURIComponent('認証コードが取得できませんでした'), request.url)
      )
    }

    // 状態パラメータの検証（CSRF対策）
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
        const timestamp = stateData.timestamp as number
        // 5分以上経過している場合は拒否
        if (Date.now() - timestamp > 5 * 60 * 1000) {
          console.error('State parameter expired')
          return NextResponse.redirect(
            new URL('/?error=state_expired&message=' + encodeURIComponent('セッションの有効期限が切れました'), request.url)
          )
        }
      } catch (e) {
        console.error('Invalid state parameter:', e)
        return NextResponse.redirect(
          new URL('/?error=invalid_state&message=' + encodeURIComponent('無効なセッションです'), request.url)
        )
      }
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth credentials')
      return NextResponse.redirect(
        new URL('/?error=config_error&message=' + encodeURIComponent('OAuth設定が不完全です'), request.url)
      )
    }

    // トークン取得
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)

    const tokenResponse = await oauth2Client.getToken(code)
    const tokens = tokenResponse.tokens

    if (!tokens.access_token) {
      console.error('No access token received')
      return NextResponse.redirect(
        new URL('/?error=no_token&message=' + encodeURIComponent('アクセストークンの取得に失敗しました'), request.url)
      )
    }

    // トークンをSupabaseに保存
    const supabase = getSupabaseClient()

    const { error: dbError } = await supabase
      .from('google_drive_tokens')
      .upsert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope || null,
        token_type: tokens.token_type || 'Bearer',
        updated_at: new Date().toISOString(),
      } as any)

    if (dbError) {
      console.error('Failed to save tokens to database:', dbError)
      return NextResponse.redirect(
        new URL('/?error=db_error&message=' + encodeURIComponent('トークンの保存に失敗しました'), request.url)
      )
    }

    console.log('OAuth tokens saved successfully')

    return NextResponse.redirect(
      new URL('/?success=auth&message=' + encodeURIComponent('Google Driveの認証が完了しました'), request.url)
    )
  } catch (error) {
    console.error('Callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL('/?error=callback_failed&message=' + encodeURIComponent(`認証処理でエラーが発生しました: ${errorMessage}`), request.url)
    )
  }
}