import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 認証チェック
  const queryPassword = request.nextUrl.searchParams.get('password')
  const labelApiPassword = process.env.LABEL_API_PASSWORD
  const authToken = request.cookies.get('auth_token')?.value

  const isQueryPasswordValid = queryPassword === labelApiPassword
  const isCookieAuthenticated = authToken === 'authenticated'

  if (!isQueryPasswordValid && !isCookieAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    // 最初のセットを取得（なければnull）
    const { data: sets, error: setError } = await (supabase as any)
      .from('label_print_sets')
      .select('id')
      .limit(1)

    if (setError) {
      console.error('Error fetching label_print_sets:', setError)
      return NextResponse.json(
        { error: 'Failed to fetch sets' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // セットが存在しない場合は空配列を返す
    const setId = sets?.[0]?.id as string | undefined
    if (!setId) {
      return NextResponse.json({ data: [] }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // セットに含まれる商品を取得
    const { data: items, error: itemsError } = await (supabase as any)
      .from('label_print_items')
      .select('product_id')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching label_print_items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const productIds = ((items || []) as any[]).map(item => item.product_id)
    if (productIds.length === 0) {
      return NextResponse.json({ data: [] }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // 商品情報を取得
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_number, name')
      .in('id', productIds)
      .order('created_at', { ascending: true })

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // レスポンス形式に変換
    const data = (products || []).map((product: any) => ({
      product_number: String(product.product_number).padStart(4, '0'),
      product_name: product.name,
      store_code: `201${String(product.product_number).padStart(4, '0')}`,
    }))

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Unexpected error in label-print API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
