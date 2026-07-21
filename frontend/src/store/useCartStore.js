import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cartItems: [],
  cartCount: 0,
  isLoading: false,

  setCartItems: (items) => set({ cartItems: items, cartCount: items.length }),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.cart)) {
          set({ cartItems: data.cart, cartCount: data.cart.length });
        }
      }
    } catch (err) {
      console.error('Error fetching cart in Zustand store:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (companyId) => {
    try {
      const response = await fetch(`/api/cart/${companyId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const currentItems = get().cartItems.filter(item => item.companyId !== companyId);
        set({ cartItems: currentItems, cartCount: currentItems.length });
      }
    } catch (err) {
      console.error('Error removing item in Zustand store:', err);
    }
  }
}));
