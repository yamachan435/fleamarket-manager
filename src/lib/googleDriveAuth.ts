import { OAuth2Client } from 'google-auth-library'
import { getSupabaseClient } from './supabase'

export interface TokenInfo {
  access_token: string
  refresh_token: string | null
  expiry_date: number | null
  scope: string | null
  token_type: string
}

/**
 * データベースから最新のトークン情報を取得
 */
export async function getTokenFromDb(): Promise<TokenInfo | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('google_drive_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Failed to fetch token from database:', error)
      return null
    }

    const tokenData = data as any

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null,
      scope: tokenData.scope,
      token_type: tokenData.token_type || 'Bearer',
    }
  } catch (error) {
    console.error('Error fetching token from database:', error)
    return null
  }
}

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenInfo | null> {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials for token refresh')
      return null
    }

    const oauth2Client = new OAuth2Client(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const refreshResponse = await oauth2Client.refreshAccessToken()

    if (!refreshResponse) {
      console.error('No response from refresh token request')
      return null
    }

    const credentials = refreshResponse.credentials || refreshResponse

    if (!credentials || !credentials.access_token) {
      console.error('No access token in refresh response')
      return null
    }

    const newToken: TokenInfo = {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date ? 
        (typeof credentials.expiry_date === 'number' ? 
          credentials.expiry_date : 
          new Date(credentials.expiry_date).getTime()) : 
        null,
      scope: credentials.scope || null,
      token_type: credentials.token_type || 'Bearer',
    }

    // データベースを更新
    await saveTokenToDb(newToken)

    return newToken
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return null
  }
}

/**
 * トークンをデータベースに保存/更新
 */
export async function saveTokenToDb(token: TokenInfo): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('google_drive_tokens')
      .upsert({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expiry_date: token.expiry_date ? new Date(token.expiry_date).toISOString() : null,
        scope: token.scope,
        token_type: token.token_type,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to save token to database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving token to database:', error)
    return false
  }
}

/**
 * 有効なアクセストークンを取得（必要に応じてリフレッシュ）
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    console.log('=== getValidAccessToken called ===')
    const token = await getTokenFromDb()

    if (!token) {
      console.error('No token found in database')
      return null
    }

    console.log('Token expiry_date:', token.expiry_date)
    console.log('Token refresh_token:', token.refresh_token ? 'exists' : 'null')

    // トークンの有効期限をチェック（5分のマージンを持つ）
    const now = Date.now()
    const expiryTime = token.expiry_date || 0
    const margin = 5 * 60 * 1000 // 5分

    console.log('Current time:', now)
    console.log('Expiry time:', expiryTime)
    console.log('Time difference:', expiryTime - now)
    console.log('Margin:', margin)

    if (expiryTime - now > margin) {
      // トークンはまだ有効
      console.log('Access token is still valid')
      return token.access_token
    }

    // トークンの有効期限が切れている、または切れそう
    if (!token.refresh_token) {
      console.error('Access token expired and no refresh token available')
      return null
    }

    console.log('Access token expired, refreshing...')
    const newToken = await refreshAccessToken(token.refresh_token)

    if (!newToken) {
      console.error('Failed to refresh access token')
      return null
    }

    console.log('Access token refreshed successfully')
    return newToken.access_token
  } catch (error) {
    console.error('Error getting valid access token:', error)
    return null
  }
}

/**
 * 認証済みOAuth2Clientを作成
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client | null> {
  try {
    const accessToken = await getValidAccessToken()

    if (!accessToken) {
      console.error('No valid access token available')
      return null
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth credentials')
      return null
    }

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    return oauth2Client
  } catch (error) {
    console.error('Error creating authenticated client:', error)
    return null
  }
}