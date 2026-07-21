import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useCartStore } from '../store/useCartStore';
import { FiTrash2, FiVideo, FiFileText, FiPlusCircle, FiAlertCircle } from 'react-icons/fi';

const Cart = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const isLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const setCartItems = useCartStore((state) => state.setCartItems);

  const [error, setError] = useState('');

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCart();
  }, []);

  const handleRemoveItem = async (companyId) => {
    await removeItem(companyId);
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to withdraw all applications in your cart?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setCartItems([]);
        toast.success('All applications withdrawn successfully');
      } else {
        toast.error(data.error || 'Failed to clear application cart.');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('An error occurred while clearing applications.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-4rem)]">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Your Job Applications Cart
        </h1>
        <p className="mt-2 text-slate-500 text-sm">
          Keep track of your active job submissions, view uploaded files, or initiate video interviews.
        </p>
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Loading active applications...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl max-w-xl mx-auto text-center">
          <FiAlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-rose-800">Error Fetching Cart</p>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <button
            onClick={fetchCart}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cart Items List */}
      {!isLoading && !error && (
        <>
          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-slate-500 font-bold text-lg">Your cart is empty</p>
              <p className="text-slate-400 text-sm mt-1">You haven't submitted any applications yet.</p>
              <Link
                to="/companies"
                className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/10"
              >
                <FiPlusCircle className="w-4.5 h-4.5" />
                Browse and Apply
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-200"
                  >
                    <div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 mb-4 inline-block">
                        Active Application
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2 truncate">
                        {item.companyName}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mb-4">Ref ID: {item.companyId}</p>

                      <div className="space-y-2 border-t border-slate-100 pt-4 mb-5 text-sm text-slate-600 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Applicant:</span>
                          <span className="text-slate-700">{item.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="text-slate-700 truncate max-w-[160px]" title={item.email}>
                            {item.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Video Call button */}
                      <a
                        href="https://modern-meet.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-500/10 transition-colors"
                      >
                        <FiVideo className="w-4 h-4" />
                        Start a Video Call
                      </a>

                      {/* View Resume link */}
                      <a
                        href={`/uploads/${item.resumePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all"
                      >
                        <FiFileText className="w-4 h-4 text-slate-400" />
                        View Resume
                      </a>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.companyId)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition-colors mt-2"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        Withdraw Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-8 max-w-md mx-auto">
                <button
                  onClick={handleClearCart}
                  className="px-6 py-3 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-sm transition-colors flex-1"
                >
                  Clear All Cart Items
                </button>
                <Link
                  to="/companies"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors text-center shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 flex-1"
                >
                  Continue Applying
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cart;
