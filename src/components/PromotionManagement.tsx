
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Promotion, Product } from '@/types'
import { useSearchParams } from 'next/navigation'

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [standardPrice, setStandardPrice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCompleteChecked, setIsCompleteChecked] = useState(false)

  useEffect(() => {
    // Get productId from URL params
    const productId = searchParams.get('productId')
    if (productId) {
      setSelectedProductId(productId)
    }
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const [productsRes, promotionsRes] = await Promise.all([
      (supabase as any).from('products').select('*').eq('status', '準備中').order('name', { ascending: true }),
      (supabase as any)
        .from('promotions')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false }),
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (promotionsRes.data) setPromotions(promotionsRes.data)
  }

  useEffect(() => {
    if (selectedProductId) {
      const existingPromotion = promotions.find(p => p.product_id === selectedProductId)
      if (existingPromotion) {
        setEditingId(existingPromotion.id)
        setTitle(existingPromotion.title)
        setDescription(existingPromotion.description)
        setStandardPrice(existingPromotion.standard_price.toString())
      } else {
        setEditingId(null)
        setTitle('')
        setDescription('')
        setStandardPrice('')
      }
    } else {
      setEditingId(null)
      setTitle('')
      setDescription('')
      setStandardPrice('')
    }
  }, [selectedProductId, promotions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !title.trim() || !description.trim() || !standardPrice) return

    // Validate title length (max 40 characters)
    if (title.length > 40) {
      alert('タイトルは40文字以内で入力してください')
      return
    }

    setLoading(true)

    if (editingId) {
      const { error } = await (supabase as any)
        .from('promotions')
        .update({
          title,
          description,
          standard_price: parseInt(standardPrice),
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error updating promotion:', error)
        alert('販促情報の更新に失敗しました')
      } else {
        loadInitialData()
      }
    } else {
      const { data, error } = await (supabase as any)
        .from('promotions')
        .insert([{
          product_id: selectedProductId,
          title,
          description,
          standard_price: parseInt(standardPrice),
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating promotion:', error)
        alert('販促情報の作成に失敗しました')
      } else {
        setPromotions([data, ...promotions])
        setEditingId(data.id)
      }
    }

    // If completion checkbox is checked, update product status
    if (isCompleteChecked && selectedProductId) {
      const { error: statusError } = await (supabase as any)
        .from('products')
        .update({ status: '出品中' })
        .eq('id', selectedProductId)

      if (statusError) {
        console.error('Error updating status:', statusError)
        alert('状態の更新に失敗しました')
      } else {
        setProducts(products.filter(p => p.id !== selectedProductId))
        setSelectedProductId('')
        setEditingId(null)
        setTitle('')
        setDescription('')
        setStandardPrice('')
        setIsCompleteChecked(false)
      }
    }

    setLoading(false)
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedProductId('')
    setTitle('')
    setDescription('')
    setStandardPrice('')
    setIsCompleteChecked(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">販売準備</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          >
            <option value="">商品を選択してください</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {String(product.product_number).padStart(4, '0')} - {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明文 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明文を入力"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            標準売価（円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={standardPrice}
            onChange={(e) => setStandardPrice(e.target.value)}
            placeholder="標準売価を入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        {/* Preparation Complete Checkbox */}
        {selectedProductId && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completeCheck"
              checked={isCompleteChecked}
              onChange={(e) => setIsCompleteChecked(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="completeCheck" className="text-sm text-gray-700">
              準備完了
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !selectedProductId || !title.trim() || !description.trim() || !standardPrice}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingId ? '更新' : '作成'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

    </div>
  )
}