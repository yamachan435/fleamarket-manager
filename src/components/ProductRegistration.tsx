'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ProductImage } from '@/types'

export default function ProductRegistration() {
  const [productName, setProductName] = useState('')
  const [imageInputs, setImageInputs] = useState<{ id: string; file: File | null }[]>([
    { id: '1', file: null }
  ])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [successProduct, setSuccessProduct] = useState<any>(null)

  const addImageInput = () => {
    const newId = Date.now().toString()
    setImageInputs([...imageInputs, { id: newId, file: null }])
  }

  const removeImageInput = (id: string) => {
    if (imageInputs.length > 1) {
      setImageInputs(imageInputs.filter(input => input.id !== id))
    }
  }

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    const wasEmpty = imageInputs.find(input => input.id === id)?.file === null

    setImageInputs(prev => {
      const updated = prev.map(input =>
        input.id === id ? { ...input, file } : input
      )

      // 新規にファイルが選択された場合、自動的に次の入力欄を追加
      if (file && wasEmpty) {
        return [...updated, { id: Date.now().toString(), file: null }]
      }

      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) return

    setLoading(true)

    try {
      // 1. 商品を作成（product_numberはDBで自動生成）
      const { data: product, error: productError } = await (supabase as any)
        .from('products')
        .insert([{ name: productName }])
        .select()
        .single()

      if (productError) {
        console.error('Error creating product:', productError)
        alert('商品の登録に失敗しました')
        setLoading(false)
        return
      }

      // 2. 画像をアップロード
      const validInputs = imageInputs.filter(input => input.file !== null)
      
      if (validInputs.length > 0) {
        setUploading(true)
        
        for (let i = 0; i < validInputs.length; i++) {
          const input = validInputs[i]
          const file = input.file!
          
          if (file.size > 10 * 1024 * 1024) {
            alert(`ファイル「${file.name}」は10MB以下にしてください`)
            continue
          }

          setUploadProgress(`アップロード中... (${i + 1}/${validInputs.length})`)

          const formData = new FormData()
          formData.append('file', file)
          formData.append('productId', product.id)
          formData.append('productNumber', String(product.product_number).padStart(4, '0'))

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'アップロードに失敗しました')
          }

          // 画像情報をDBに保存
          const { error: imageError } = await (supabase as any)
            .from('product_images')
            .insert([
              {
                product_id: product.id,
                drive_url: result.driveUrl,
                drive_file_id: result.fileId,
                display_order: i,
              },
            ])

          if (imageError) {
            console.error('Error saving image info:', imageError)
            alert(`画像「${file.name}」の保存に失敗しました`)
          }
        }

        setUploading(false)
        setUploadProgress('')
      }

      // 3. 成功
      setSuccessProduct(product)
      setProductName('')
      setImageInputs([{ id: '1', file: null }])
      setFormKey(prev => prev + 1)

      // 3秒後に成功メッセージを非表示
      setTimeout(() => {
        setSuccessProduct(null)
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">商品登録</h2>

      {/* 登録完了メッセージ */}
      {successProduct && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          登録完了（商品ID: {String(successProduct.product_number).padStart(4, '0')}）
        </div>
      )}

      <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
        {/* 商品名入力 */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            商品名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="商品名を入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || uploading}
            required
          />
        </div>

        {/* 画像アップロード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            画像（任意）
          </label>
          
          {imageInputs.map((input, index) => (
            <div key={input.id} className="flex gap-2 mb-2">
              <input
                key={`${input.id}-${formKey}`}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(input.id, e)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                disabled={loading || uploading}
              />
              {imageInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageInput(input.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading || uploading}
                >
                  削除
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addImageInput}
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || uploading}
          >
            + 画像を追加
          </button>

          <p className="text-xs text-gray-500 mt-1">
            Google Driveに自動アップロードされます（1枚あたり最大10MB）
          </p>
        </div>

        {/* アップロード進捗 */}
        {uploading && (
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{uploadProgress}</span>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading || uploading || !productName.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading || uploading ? '登録中...' : '商品を登録'}
        </button>
      </form>
    </div>
  )
}