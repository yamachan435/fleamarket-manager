import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
//     const scope = encodeURIComponent('https://www.googleapis.com/auth/drive')
    const scope = 'https://www.googleapis.com/auth/drive'

    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth credentials')
      return NextResponse.json(
        { error: 'Google OAuth認証情報が設定されていません' },
        { status: 500 }
      )
    }

    // 状態パラメータ（CSRF対策）
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15)
    })).toString('base64url')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scope)
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Auth initiation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: '認証の開始に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}