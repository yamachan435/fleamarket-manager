'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, ListingWithDetails } from '@/types'

export default function TransactionComplete() {
  const [products, setProducts] = useState<Product[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      loadListings(selectedProductId)
    } else {
      setListings([])
    }
  }, [selectedProductId])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('status', '取引中')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const loadListings = async (productId: string) => {
    const { data, error } = await (supabase as any)
      .from('listings')
      .select('*, product:products(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading listings:', error)
    } else {
      setListings(data || [])
    }
  }

  const handleCompleteTransaction = async (productId: string) => {
    if (!confirm('この取引を完了しますか？')) return

    const { error } = await (supabase as any)
      .from('products')
      .update({ status: '完了' })
      .eq('id', productId)

    if (error) {
      console.error('Error updating status:', error)
      alert('状態の更新に失敗しました')
    } else {
      setProducts(products.filter(p => p.id !== productId))
      setSelectedProductId('')
      setListings([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '準備中':
        return 'bg-gray-100 text-gray-800'
      case '出品中':
        return 'bg-blue-100 text-blue-800'
      case '販売中':
        return 'bg-green-100 text-green-800'
      case '取引中':
        return 'bg-yellow-100 text-yellow-800'
      case '完了':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">取引完了</h2>

      {loading ? (
        <p className="text-center text-gray-500 py-8">読み込み中...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500 py-8">取引中の商品がありません</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">商品一覧</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedProductId === product.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(product.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <span className={`text-xs rounded-md px-2 py-1 ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listings for Selected Product */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">出品一覧</h3>
            </div>
            {!selectedProductId ? (
              <p className="p-4 text-gray-500 text-center">商品を選択してください</p>
            ) : listings.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">出品がありません</p>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {listings.map((listing) => (
                  <div key={listing.id} className="p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">媒体:</span>
                        <span className="text-sm text-gray-900 ml-2">{listing.platform}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">売価:</span>
                        <span className="text-lg font-bold text-blue-600 ml-2">
                          ¥{listing.price.toLocaleString()}
                        </span>
                      </div>
                      {listing.url && (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline block"
                        >
                          {listing.url}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Transaction Button */}
      {selectedProductId && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => handleCompleteTransaction(selectedProductId)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            完了
          </button>
        </div>
      )}
    </div>
  )
}
