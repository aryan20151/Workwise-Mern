import { create } from 'zustand';
import { toast } from '../utils/toast';

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
      } else {
        toast.error('Failed to load application cart');
      }
    } catch (err) {
      console.error('Error fetching cart in Zustand store:', err);
      toast.error('Network error loading job applications');
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (companyId) => {
    const previousItems = get().cartItems;
    try {
      const response = await fetch(`/api/cart/${companyId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const currentItems = previousItems.filter(item => item.companyId !== companyId);
        set({ cartItems: currentItems, cartCount: currentItems.length });
        toast.success('Application removed from cart');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove application');
      }
    } catch (err) {
      console.error('Error removing item in Zustand store:', err);
      toast.error('Error deleting application. Please try again.');
    }
  }
}));

