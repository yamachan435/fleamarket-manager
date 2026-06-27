'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, ProductImage, Promotion, ListingWithDetails } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'

type StatusFilter = 'all' | '準備中' | '出品中' | '販売中' | '取引中' | '完了'

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [showDetail, setShowDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNavigatingInternal = useRef(false)

  // Handle browser back/forward for product detail
  useEffect(() => {
    const productId = searchParams.get('productId')
    if (productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        // Use setTimeout to break potential React re-render loop
        setTimeout(() => {
          isNavigatingInternal.current = false
          if (!isNavigatingInternal.current) {
            setSelectedProduct(product)
            setShowDetail(true)
            loadProductDetailData(product)
          }
        }, 0)
      }
    } else {
      setShowDetail(false)
      setSelectedProduct(null)
      setImages([])
      setPromotions([])
      setListings([])
    }
  }, [searchParams])
  
  const loadProductDetailData = async (product: Product) => {
    const [imagesRes, promotionsRes, listingsRes] = await Promise.all([
      (supabase as any).from('product_images').select('*').eq('product_id', product.id).order('display_order', { ascending: true }),
      (supabase as any).from('promotions').select('*').eq('product_id', product.id),
      (supabase as any).from('listings').select('*, product:products(*)').eq('product_id', product.id).order('created_at', { ascending: false }),
    ])

    if (imagesRes.data) setImages(imagesRes.data)
    if (promotionsRes.data) setPromotions(promotionsRes.data)
    if (listingsRes.data) setListings(listingsRes.data as ListingWithDetails[])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    } else if (!includeCompleted) {
      query = query.neq('status', '完了')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [statusFilter, includeCompleted])

  const handleStatusClick = (product: Product) => {
    switch (product.status) {
      case '準備中':
        router.push('/?tab=promotions&productId=' + product.id)
        break
      case '出品中':
      case '販売中':
        router.push('/?tab=listings&productId=' + product.id)
        break
      default:
        // 取引中、完了は遷移しない
        break
    }
  }

  const handleProductClick = async (product: Product) => {
    // Update URL to enable browser back/forward
    isNavigatingInternal.current = true
    router.push(`?tab=products&productId=${product.id}`, { scroll: false })
    
    setSelectedProduct(product)
    setShowDetail(true)
    loadProductDetailData(product)
  }

  const handleBackToList = () => {
    isNavigatingInternal.current = true
    router.push('?tab=products', { scroll: false })
    setShowDetail(false)
    setSelectedProduct(null)
    setImages([])
    setPromotions([])
    setListings([])
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
      <h2 className="text-xl font-bold mb-3">商品管理</h2>

      {showDetail && selectedProduct ? (
        <div>
          <button
            onClick={handleBackToList}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 戻る
          </button>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">{selectedProduct.name}</h3>
            
            <div className="mb-4">
              <button
                onClick={() => handleStatusClick(selectedProduct)}
                className={`text-sm rounded-md px-3 py-1 ${getStatusColor(selectedProduct.status)} hover:opacity-80 transition-opacity`}
                title="クリックして移動"
              >
                {selectedProduct.status}
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">商品番号</h4>
              <p className="text-gray-700 font-mono text-lg">{String(selectedProduct.product_number).padStart(4, '0')}</p>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">画像</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <a
                      key={image.id}
                      href={`https://drive.google.com/file/d/${image.drive_file_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={image.drive_url}
                        alt={selectedProduct.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
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
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
        ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Status Filter */}
          <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setStatusFilter('準備中')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === '準備中'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                準備中
              </button>
              <button
                onClick={() => setStatusFilter('出品中')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === '出品中'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                出品中
              </button>
              <button
                onClick={() => setStatusFilter('販売中')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === '販売中'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                販売中
              </button>
              <button
                onClick={() => setStatusFilter('取引中')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === '取引中'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                取引中
              </button>
              <button
                onClick={() => setStatusFilter('完了')}
                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                  statusFilter === '完了'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                完了
              </button>
              <label className="flex items-center gap-1 ml-auto">
                <input
                  type="checkbox"
                  checked={includeCompleted}
                  onChange={(e) => setIncludeCompleted(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-600">完了を含む</span>
              </label>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-8">読み込み中...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">商品がありません</p>
          ) : (
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-auto">
                    番号
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[120px] sm:max-w-none">
                    商品名
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-auto whitespace-nowrap">
                    状態
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
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 font-mono">
                        {String(product.product_number).padStart(4, '0')}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 max-w-[120px] sm:max-w-none">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs rounded-md px-2 py-0.5 ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
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
