export type ProductCategory =
  | 'gift-packages'
  | 'clothes'
  | 'shoes'
  | 'accessories'

export interface ProductReview {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category: ProductCategory
  priceRwf: number
  compareAtRwf?: number
  images: string[]
  description: string
  bundleItems?: string[]
  rating: number
  reviewCount: number
  popularity: number
  featured?: boolean
  trending?: boolean
  reviews?: ProductReview[]
  /** Units available to sell; 0 = out of stock */
  stockQuantity: number
}

export const CATEGORY_LABELS: Record<ProductCategory, { label: string }> = {
  'gift-packages': { label: 'Gift Packages' },
  clothes: { label: 'Clothes' },
  shoes: { label: 'Shoes' },
  accessories: { label: 'Accessories' },
}
