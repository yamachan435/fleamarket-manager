'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

export default function LabelPrintPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    initializeSet()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    loadSelectedProducts()
  }, [initializing])

  const initializeSet = async () => {
    try {
      const { data: existingSets, error: fetchError } = await (supabase as any)
        .from('label_print_sets')
        .select('id')
        .limit(1)

      if (fetchError) {
        console.error('Error fetching sets:', fetchError)
        return
      }

      if (!existingSets || existingSets.length === 0) {
        const { error: insertError } = await (supabase as any)
          .from('label_print_sets')
          .insert({ name: 'デフォルト' })

        if (insertError) {
          console.error('Error creating default set:', insertError)
          return
        }
      }
    } catch (error) {
      console.error('Unexpected error initializing set:', error)
    } finally {
      setInitializing(false)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_number', { ascending: true })

      if (error) {
        console.error('Error loading products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Unexpected error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedProducts = async () => {
    if (initializing) return

    try {
      const { data: sets, error: setError } = await (supabase as any)
        .from('label_print_sets')
        .select('id')
        .limit(1)

      if (setError || !sets || sets.length === 0) {
        console.error('Error fetching set:', setError)
        setSelectedProducts([])
        return
      }

      const setId = sets[0].id as string

      const { data: items, error: itemsError } = await (supabase as any)
        .from('label_print_items')
        .select('product_id')
        .eq('set_id', setId)

      if (itemsError || !items || items.length === 0) {
        setSelectedProducts([])
        return
      }

      const productIds = ((items || []) as any[]).map(item => item.product_id)

      const { data: productDetails, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .order('product_number', { ascending: true })

      if (productsError) {
        console.error('Error fetching selected products:', productsError)
      } else {
        setSelectedProducts(productDetails || [])
      }
    } catch (error) {
      console.error('Unexpected error loading selected products:', error)
      setSelectedProducts([])
    }
  }

  const handleProductClick = async (product: Product) => {
    if (selectedProducts.some(p => p.id === product.id)) {
      return
    }

    const { data: sets, error: setError } = await (supabase as any)
      .from('label_print_sets')
      .select('id')
      .limit(1)

    if (setError || !sets || sets.length === 0) {
      console.error('Error fetching set:', setError)
      alert('セットの取得に失敗しました')
      return
    }

    const { error: insertError } = await (supabase as any)
      .from('label_print_items')
      .insert({ set_id: sets[0].id, product_id: product.id })

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('Product already selected')
      } else {
        console.error('Error adding product:', insertError)
        alert('商品の追加に失敗しました')
      }
      return
    }

    setSelectedProducts(prev => [...prev, product].sort((a, b) => a.product_number - b.product_number))
  }

  const handleClear = async () => {
    if (!confirm('選択中の商品を全てクリアしますか？')) {
      return
    }

    const { data: sets, error: setError } = await (supabase as any)
      .from('label_print_sets')
      .select('id')
      .limit(1)

    if (setError || !sets || sets.length === 0) {
      console.error('Error fetching set:', setError)
      alert('セットの取得に失敗しました')
      return
    }

    const { error: deleteError } = await (supabase as any)
      .from('label_print_items')
      .delete()
      .eq('set_id', sets[0].id)

    if (deleteError) {
      console.error('Error clearing items:', deleteError)
      alert('クリアに失敗しました')
      return
    }

    setSelectedProducts([])
  }

  const handleCopyApiData = async () => {
    try {
      const res = await fetch('/api/label-print', { cache: 'no-store' })
      const json = await res.json()
      const text = JSON.stringify(json, null, 2)
      await navigator.clipboard.writeText(text)
      alert('APIレスポンスをクリップボードにコピーしました')
    } catch (error) {
      console.error('Error copying data:', error)
      alert('コピーに失敗しました')
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">初期化中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">ラベル印刷</h2>
        <button
          onClick={handleCopyApiData}
          disabled={selectedProducts.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          APIデータをコピー
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">
            選択中: {selectedProducts.length}件
          </h3>
          <button
            onClick={handleClear}
            disabled={selectedProducts.length === 0}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            クリア
          </button>
        </div>
        {selectedProducts.length === 0 ? (
          <p className="p-4 text-gray-500 text-center text-sm">商品が選択されていません</p>
        ) : (
          <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
            {selectedProducts.map((product) => (
              <li key={product.id} className="px-4 py-2 flex justify-between items-center">
                <div>
                  <span className="text-sm font-mono text-gray-900 mr-3">
                    {String(product.product_number).padStart(4, '0')}
                  </span>
                  <span className="text-sm text-gray-700">{product.name}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  201{String(product.product_number).padStart(4, '0')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">商品一覧（クリックで追加）</h3>
        {loading ? (
          <p className="text-center text-gray-500 py-4">読み込み中...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-4">商品がありません</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[50vh] overflow-y-auto">
            {products.map((product) => {
              const isSelected = selectedProducts.some(p => p.id === product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={isSelected}
                  className={`w-full px-4 py-2 flex justify-between items-center text-left disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-gray-100 text-gray-400'
                      : 'hover:bg-blue-50 text-gray-900'
                  }`}
                >
                  <div>
                    <span className="text-sm font-mono mr-3">
                      {String(product.product_number).padStart(4, '0')}
                    </span>
                    <span className="text-sm">{product.name}</span>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-gray-400">選択済</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}