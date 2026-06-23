'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, ProductImage, Promotion, ListingWithDetails } from '@/types'
import { useRouter } from 'next/navigation'

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [showDetail, setShowDetail] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('この商品を削除しますか？')) return

    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      alert('商品の削除に失敗しました')
    } else {
      setProducts(products.filter(p => p.id !== id))
      if (showDetail) {
        setShowDetail(false)
        setSelectedProduct(null)
      }
    }
  }

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product)
    setShowDetail(true)
    
    // Load related data
    const [imagesRes, promotionsRes, listingsRes] = await Promise.all([
      (supabase as any).from('product_images').select('*').eq('product_id', product.id).order('display_order', { ascending: true }),
      (supabase as any).from('promotions').select('*').eq('product_id', product.id),
      (supabase as any).from('listings').select('*, product:products(*)').eq('product_id', product.id).order('created_at', { ascending: false }),
    ])

    if (imagesRes.data) setImages(imagesRes.data)
    if (promotionsRes.data) setPromotions(promotionsRes.data)
    if (listingsRes.data) setListings(listingsRes.data as ListingWithDetails[])
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
      <h2 className="text-2xl font-bold mb-4">商品管理</h2>

      {showDetail && selectedProduct ? (
        <div>
          <button
            onClick={() => {
              setShowDetail(false)
              setSelectedProduct(null)
              setImages([])
              setPromotions([])
              setListings([])
            }}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 戻る
          </button>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">{selectedProduct.name}</h3>
            
            <div className="mb-4">
              <span className={`text-sm rounded-md px-3 py-1 ${getStatusColor(selectedProduct.status)}`}>
                {selectedProduct.status}
              </span>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">商品番号</h4>
              <p className="text-gray-700">{String(selectedProduct.product_number).padStart(4, '0')}</p>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">画像</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <img
                      key={image.id}
                      src={image.drive_url}
                      alt={selectedProduct.name}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Promotion Info */}
            {promotions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">販促情報</h4>
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{promotion.title}</h5>
                    <p className="text-sm text-gray-700 mt-1">{promotion.description}</p>
                    <p className="text-sm font-bold text-blue-600 mt-2">
                      標準売価: ¥{promotion.standard_price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Listings */}
            {listings.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">出品一覧</h4>
                <div className="space-y-2">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">媒体:</span> {listing.platform}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            ¥{listing.price.toLocaleString()}
                          </p>
                          {listing.url && (
                            <a
                              href={listing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {listing.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteProduct(selectedProduct.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <p className="text-center text-gray-500 py-8">読み込み中...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">商品がありません</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm rounded-md px-3 py-1 ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProduct(product.id)
                        }}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
