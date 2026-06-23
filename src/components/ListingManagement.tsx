'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Listing, Product, Promotion, ListingWithDetails } from '@/types'

const PLATFORMS = [
  'メルカリ',
  'ラクマ',
  'ヤフオク',
  'フリマ',
  'ミクモ',
  'オタマケ',
]

export default function ListingManagement() {
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [platform, setPlatform] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      setSelectedProduct(product || null)
      const promotion = promotions.find(p => p.product_id === selectedProductId)
      setSelectedPromotion(promotion || null)
    } else {
      setSelectedProduct(null)
      setSelectedPromotion(null)
    }
  }, [selectedProductId, products, promotions])

  const loadInitialData = async () => {
    const [productsRes, promotionsRes, listingsRes] = await Promise.all([
      (supabase as any).from('products').select('*').in('status', ['出品中', '販売中']).order('name', { ascending: true }),
      (supabase as any).from('promotions').select('*').order('created_at', { ascending: false }),
      (supabase as any)
        .from('listings')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false }),
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (promotionsRes.data) setPromotions(promotionsRes.data)
    if (listingsRes.data) setListings(listingsRes.data as ListingWithDetails[])
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !platform || !price) return

    setLoading(true)

    const { data, error } = await (supabase as any)
      .from('listings')
      .insert([{
        product_id: selectedProductId,
        platform,
        price: parseInt(price),
        url: url || null,
      }])
      .select('*, product:products(*)')
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      alert('出品の作成に失敗しました')
    } else {
      setListings([data as ListingWithDetails, ...listings])
      
      // Update product status to 販売中
      const { error: statusError } = await (supabase as any)
        .from('products')
        .update({ status: '販売中' })
        .eq('id', selectedProductId)
      
      if (statusError) {
        console.error('Error updating product status:', statusError)
      } else {
        setProducts(products.filter(p => p.id !== selectedProductId))
      }
      
      resetForm()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この出品を削除しますか？')) return

    const { error } = await (supabase as any)
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting listing:', error)
      alert('出品の削除に失敗しました')
    } else {
      setListings(listings.filter(l => l.id !== id))
    }
  }

  const resetForm = () => {
    setSelectedProductId('')
    setPlatform('')
    setPrice('')
    setUrl('')
    setSelectedProduct(null)
    setSelectedPromotion(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('コピーしました')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">出品</h2>

      {/* Product Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          商品 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => handleProductSelect(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        >
          <option value="">商品を選択してください</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Product Info */}
      {selectedProduct && selectedPromotion && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-sm text-gray-700 whitespace-nowrap">タイトル:</span>
              <span className="text-sm text-gray-700 flex-1 break-all">{selectedPromotion.title}</span>
              <button
                onClick={() => copyToClipboard(selectedPromotion.title)}
                className="px-3 py-2 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded whitespace-nowrap"
              >
                コピー
              </button>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm text-gray-700 whitespace-nowrap">説明:</span>
              <span className="text-sm text-gray-700 flex-1 break-all">{selectedPromotion.description}</span>
              <button
                onClick={() => copyToClipboard(selectedPromotion.description)}
                className="px-3 py-2 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded whitespace-nowrap"
              >
                コピー
              </button>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm text-gray-700 whitespace-nowrap">標準売価:</span>
              <span className="text-sm text-gray-700 flex-1">¥{selectedPromotion.standard_price.toLocaleString()}</span>
              <button
                onClick={() => copyToClipboard(selectedPromotion.standard_price.toString())}
                className="px-3 py-2 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded whitespace-nowrap"
              >
                コピー
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            媒体 <span className="text-red-500">*</span>
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          >
            <option value="">媒体を選択してください</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            売価（円） <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="売価を入力"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
            {selectedPromotion && (
              <button
                type="button"
                onClick={() => setPrice(selectedPromotion.standard_price.toString())}
                className="px-3 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm whitespace-nowrap flex-shrink-0"
                title="標準売価をコピー"
              >
                コピー
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !selectedProductId || !platform || !price}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            出品を追加
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            クリア
          </button>
        </div>
      </form>

      {/* List */}
      <div className="border border-gray-200 rounded-lg">
        {listings.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">出品がありません</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <li key={listing.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {listing.product?.name || '不明な商品'}
                    </h3>
                    {listing.promotion && (
                      <p className="text-sm text-gray-600 mt-1">
                        {listing.promotion.title}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
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
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded ml-4"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}