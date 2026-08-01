import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique string (can be a product ID or a custom bouquet ID)
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  description?: string;
  configuration?: any;
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
        const existingItem = state.items.find(item => item.id === newItem.id);
        if (existingItem) {
          // If item already exists, increase its quantity
          return {
            items: state.items.map(item =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                : item
            ),
            isCartOpen: true, // open cart when adding item
          };
        } else {
          // Otherwise, add new item to cart
          return {
            items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }],
            isCartOpen: true,
          };
        }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter(item => item.id !== id) // remove if quantity drops to 0
          : state.items.map(item => item.id === id ? { ...item, quantity } : item)
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
