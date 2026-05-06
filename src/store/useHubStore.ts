import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartLine } from '../models/cart'

export type ThemeMode = 'light' | 'dark'
export type Language = 'en' | 'rw'

interface HubState {
  theme: ThemeMode
  language: Language
  notificationsEnabled: boolean
  wishlistIds: string[]
  cart: CartLine[]
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  setLanguage: (lang: Language) => void
  setNotificationsEnabled: (v: boolean) => void
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  addToCart: (line: CartLine) => void
  setCartQty: (productId: string, quantity: number) => void
  updateCartLine: (
    productId: string,
    patch: Partial<Pick<CartLine, 'sendAsGift' | 'giftMessage'>>,
  ) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

export function applyThemeClass(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      notificationsEnabled: true,
      wishlistIds: [],
      cart: [],

      setTheme: (mode) => {
        applyThemeClass(mode)
        set({ theme: mode })
      },

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        applyThemeClass(next)
        set({ theme: next })
      },

      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),

      toggleWishlist: (productId) =>
        set((s) => ({
          wishlistIds: s.wishlistIds.includes(productId)
            ? s.wishlistIds.filter((id) => id !== productId)
            : [...s.wishlistIds, productId],
        })),

      isWishlisted: (productId) => get().wishlistIds.includes(productId),

      addToCart: (line) =>
        set((s) => {
          const i = s.cart.findIndex((c) => c.productId === line.productId)
          if (i === -1) return { cart: [...s.cart, line] }
          const next = [...s.cart]
          const cur = next[i]!
          next[i] = {
            ...cur,
            quantity: cur.quantity + line.quantity,
            sendAsGift: line.sendAsGift || cur.sendAsGift,
            giftMessage: line.giftMessage || cur.giftMessage,
          }
          return { cart: next }
        }),

      setCartQty: (productId, quantity) =>
        set((s) => {
          if (quantity < 1) {
            return { cart: s.cart.filter((c) => c.productId !== productId) }
          }
          return {
            cart: s.cart.map((c) =>
              c.productId === productId ? { ...c, quantity } : c,
            ),
          }
        }),

      updateCartLine: (productId, patch) =>
        set((s) => ({
          cart: s.cart.map((c) =>
            c.productId === productId ? { ...c, ...patch } : c,
          ),
        })),

      removeFromCart: (productId) =>
        set((s) => ({
          cart: s.cart.filter((c) => c.productId !== productId),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'nyanja-gift-hub',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        notificationsEnabled: s.notificationsEnabled,
        wishlistIds: s.wishlistIds,
        cart: s.cart,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.theme)
      },
    },
  ),
)
