import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique string (can be a product ID or a custom bouquet ID)
  kind?: 'PRODUCT' | 'CUSTOM';
  productId?: string;
  maxQuantity?: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  description?: string;
  configuration?: unknown;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: (isOpen?: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isCartOpen: false,

      addItem: (newItem) => set((state) => {
        if (!Number.isSafeInteger(newItem.quantity ?? 1) || (newItem.quantity ?? 1) <= 0) return state;
        const maximum = Math.min(100, newItem.maxQuantity ?? 100);
        if (maximum <= 0) return state;
        const existingItem = state.items.find(item => item.id === newItem.id);
        if (existingItem) {
          // If item already exists, increase its quantity
          return {
            items: state.items.map(item =>
              item.id === newItem.id
                ? { ...item, ...newItem, quantity: Math.min(maximum, item.quantity + (newItem.quantity || 1)) }
                : item
            ),
            isCartOpen: true, // open cart when adding item
          };
        } else {
          // Otherwise, add new item to cart
          return {
            items: [...state.items, { ...newItem, quantity: Math.min(maximum, newItem.quantity || 1) }],
            isCartOpen: true,
          };
        }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: !Number.isSafeInteger(quantity) ? state.items : quantity <= 0
          ? state.items.filter(item => item.id !== id) // remove if quantity drops to 0
          : state.items.map(item => item.id === id ? { ...item, quantity: Math.min(100, item.maxQuantity ?? 100, quantity) } : item)
      })),

      clearCart: () => set({ items: [] }),

      toggleCart: (isOpen) => set((state) => ({
        isCartOpen: isOpen !== undefined ? isOpen : !state.isCartOpen
      })),
    }),
    {
      name: 'stemory-cart-storage',
      // We only want to persist items, not the cart's open/close state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
