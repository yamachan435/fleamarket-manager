'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import ProductRegistration from '@/components/ProductRegistration'
import ProductManagement from '@/components/ProductManagement'
import PromotionManagement from '@/components/PromotionManagement'
import ListingManagement from '@/components/ListingManagement'
import TransactionManagement from '@/components/TransactionManagement'
import TransactionComplete from '@/components/TransactionComplete'

type Tab = 'registration' | 'products' | 'promotions' | 'listings' | 'transactions' | 'transactions-complete'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('registration')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { id: 'registration' as Tab, label: '商品登録' },
    { id: 'products' as Tab, label: '商品管理' },
    { id: 'promotions' as Tab, label: '販売準備' },
    { id: 'listings' as Tab, label: '出品' },
    { id: 'transactions' as Tab, label: '取引' },
    { id: 'transactions-complete' as Tab, label: '取引完了' },
  ]

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">フリマ管理アプリ</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden px-4 py-2 bg-gray-200 rounded-lg"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block mb-6`}>
          <div className="flex flex-col md:flex-row gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsMenuOpen(false)
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'registration' && <ProductRegistration />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'promotions' && <PromotionManagement />}
          {activeTab === 'listings' && <ListingManagement />}
          {activeTab === 'transactions' && <TransactionManagement />}
          {activeTab === 'transactions-complete' && <TransactionComplete />}
        </div>
      </div>
    </main>
  )
}