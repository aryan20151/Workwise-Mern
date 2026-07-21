import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiBriefcase } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const cartCount = useCartStore((state) => state.cartCount);
  const fetchCart = useCartStore((state) => state.fetchCart);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Re-fetch cart count on location change via Zustand store
  useEffect(() => {
    if (user) {
      fetchCart();
    }
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, user]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = (path) => {
    return `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
    }`;
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/homepage" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                WorkWise
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/homepage" className={linkClass('/homepage')}>
              Home
            </Link>
            <Link to="/companies" className={linkClass('/companies')}>
              Companies
            </Link>
            <Link to="/contact" className={linkClass('/contact')}>
              Contact
            </Link>

            {user ? (
              <>
                <Link
                  to="/cart"
                  className={`relative p-2 text-slate-600 hover:text-blue-600 transition-colors ${
                    isActive('/cart') ? 'text-blue-600' : ''
                  }`}
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative ml-2">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 text-slate-700 transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <FiUser className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-sm font-semibold max-w-[100px] truncate">
                      {user.username}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <FiUser className="w-4 h-4" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {user.username}
                          </p>
                        </div>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50/80 rounded-lg flex items-center gap-2.5 font-semibold transition-colors duration-150"
                        >
                          <FiLogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <FiShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Options */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <Link
            to="/homepage"
            className={`block px-4 py-2 rounded-lg text-base font-semibold ${
              isActive('/homepage') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
            }`}
          >
            Home
          </Link>
          <Link
            to="/companies"
            className={`block px-4 py-2 rounded-lg text-base font-semibold ${
              isActive('/companies') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
            }`}
          >
            Companies
          </Link>
          <Link
            to="/contact"
            className={`block px-4 py-2 rounded-lg text-base font-semibold ${
              isActive('/contact') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
            }`}
          >
            Contact
          </Link>

          {user ? (
            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="px-4 py-2 flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <FiUser className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Logged in as</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{user.username}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-base text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
              >
                <FiLogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-slate-100">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2 text-base font-semibold text-slate-700 border border-slate-200 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full text-center px-4 py-2 text-base font-semibold text-white bg-blue-600 rounded-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
