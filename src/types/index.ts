export type ProductStatus = '準備中' | '出品中' | '販売中' | '取引中' | '完了'

export interface Product {
  id: string
  name: string
  product_number: number
  status: ProductStatus
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  product_id: string
  title: string
  description: string
  standard_price: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface ProductImage {
  id: string
  product_id: string
  drive_file_id: string
  drive_url: string
  display_order: number
  created_at: string
}


export interface Listing {
  id: string
  product_id: string
  platform: string
  price: number
  url: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
}

export interface ListingWithDetails extends Listing {
  product: Product
  promotion: Promotion | null
}
