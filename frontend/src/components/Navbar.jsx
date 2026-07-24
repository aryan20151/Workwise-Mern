import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { useSavedJobsStore } from '../store/useSavedJobsStore';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiBriefcase, FiEdit3, FiBookmark } from 'react-icons/fi';

const MobileNavLink = ({ to, isActive, isSpecial, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? isSpecial
          ? 'bg-purple-100 text-purple-700'
          : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : isSpecial
        ? 'text-purple-700 hover:bg-purple-50'
        : 'text-slate-700 hover:bg-slate-100/80 hover:text-blue-600'
    }`}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const cartCount = useCartStore((state) => state.cartCount);
  const fetchCart = useCartStore((state) => state.fetchCart);
  
  const savedCount = useSavedJobsStore((state) => state.savedCount);
  const fetchSavedJobs = useSavedJobsStore((state) => state.fetchSavedJobs);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch cart & saved jobs counts when user changes
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchSavedJobs();
    }
  }, [user]);

  // Close menus on page navigation
  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    return `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/70'
    }`;
  };

  return (
    <nav className="bg-[#eef3f4] border-b border-slate-100 sticky top-0 z-50 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/homepage" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                WorkWise
              </span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION LINKS (lg breakpoint and above) */}
          {user && (
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link to="/homepage" className={linkClass('/homepage')}>
                Home
              </Link>
              <Link to="/requisitions" className={linkClass('/requisitions')}>
                Job Roles
              </Link>
              <Link to="/saved-requisitions" className={linkClass('/saved-requisitions')}>
                <span className="inline-flex items-center gap-1.5">
                  Saved Jobs
                  {savedCount > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                      isActive('/saved-requisitions') ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {savedCount}
                    </span>
                  )}
                </span>
              </Link>
              <Link to="/companies" className={linkClass('/companies')}>
                Companies
              </Link>
              <Link to="/contact" className={linkClass('/contact')}>
                Contact
              </Link>

              {user?.role === 'admin' && (
                <Link to="/manage-companies" className={linkClass('/manage-companies')}>
                  Companies Profile
                </Link>
              )}

              {(user?.role === 'employer' || user?.role === 'admin') && (
                <>
                  {user?.role === 'employer' && (
                    <Link to="/post-requisition" className={linkClass('/post-requisition')}>
                      Post Job
                    </Link>
                  )}
                  <Link to="/candidate-pipeline" className={linkClass('/candidate-pipeline')}>
                    Candidate Pipeline
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link to="/admin/master-setup" className={linkClass('/admin/master-setup')}>
                  Admin Setup
                </Link>
              )}
            </div>
          )}

          {/* DESKTOP USER MENU & CART (lg breakpoint and above) */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/cart"
                  title="View Cart"
                  className={`relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 rounded-xl transition-all ${
                    isActive('/cart') ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                    aria-expanded={dropdownOpen}
                    aria-label="User options menu"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        <FiUser className="w-4 h-4" />
                      </div>
                    )}
                    <span title={user.username} className="text-sm font-semibold max-w-[110px] truncate">
                      {user.username}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                      <div 
                        onClick={() => {
                          navigate('/profile');
                          setDropdownOpen(false);
                        }}
                        className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                        title="Click to Edit Profile"
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                            <FiUser className="w-4 h-4" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
                          <p title={user.username} className="text-sm font-bold text-slate-800 truncate">
                            {user.username}
                          </p>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full tracking-wide ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'employer'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role || 'jobseeker'}
                          </span>
                        </div>
                      </div>

                      <div className="p-1.5 space-y-0.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 font-semibold transition-colors duration-150 cursor-pointer"
                        >
                          <FiEdit3 className="w-4 h-4 text-blue-600" />
                          <span>Edit Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50/80 rounded-xl flex items-center gap-2.5 font-semibold transition-colors duration-150 cursor-pointer"
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE TOP CONTROLS (Below lg breakpoint) */}
          <div className="lg:hidden flex items-center gap-2">
            {user && (
              <Link
                to="/cart"
                title="View Cart"
                className={`relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all ${
                  isActive('/cart') ? 'text-blue-600 bg-blue-50' : ''
                }`}
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
              aria-expanded={isOpen}
              aria-label="Toggle Navigation Menu"
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {isOpen ? <FiX className="w-6 h-6 text-slate-800" /> : <FiMenu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU DRAWER OVERLAY */}
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="lg:hidden fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white border-t border-slate-100 shadow-2xl z-50 animate-in slide-in-from-top-3 duration-200 focus:outline-none">
            <div className="px-4 pt-3 pb-8 space-y-3">

              {user ? (
                <>
                  {/* Mobile User Profile Header Card */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-md shadow-blue-500/20 shrink-0">
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-base font-bold text-slate-800 truncate">{user.username}</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full tracking-wide ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'employer'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role || 'jobseeker'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-blue-600 hover:bg-white rounded-xl border border-blue-100 shadow-2xs transition-colors shrink-0"
                      title="Edit Profile"
                    >
                      <FiEdit3 className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Navigation Links for Mobile */}
                  <div className="space-y-1 pt-1">
                    <MobileNavLink to="/homepage" isActive={isActive('/homepage')} onClick={() => setIsOpen(false)}>
                      Home
                    </MobileNavLink>
                    <MobileNavLink to="/requisitions" isActive={isActive('/requisitions')} onClick={() => setIsOpen(false)}>
                      Job Roles / Requisitions
                    </MobileNavLink>
                    <MobileNavLink to="/saved-requisitions" isActive={isActive('/saved-requisitions')} onClick={() => setIsOpen(false)}>
                      <div className="flex items-center justify-between w-full">
                        <span>Saved Jobs</span>
                        {savedCount > 0 && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            isActive('/saved-requisitions') ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {savedCount}
                          </span>
                        )}
                      </div>
                    </MobileNavLink>
                    <MobileNavLink to="/companies" isActive={isActive('/companies')} onClick={() => setIsOpen(false)}>
                      Companies
                    </MobileNavLink>
                    <MobileNavLink to="/contact" isActive={isActive('/contact')} onClick={() => setIsOpen(false)}>
                      Contact
                    </MobileNavLink>

                    {user?.role === 'admin' && (
                      <MobileNavLink to="/manage-companies" isActive={isActive('/manage-companies')} onClick={() => setIsOpen(false)}>
                        Company Profiles
                      </MobileNavLink>
                    )}

                    {(user?.role === 'employer' || user?.role === 'admin') && (
                      <>
                        {user?.role === 'employer' && (
                          <MobileNavLink to="/post-requisition" isActive={isActive('/post-requisition')} onClick={() => setIsOpen(false)}>
                            Post Job
                          </MobileNavLink>
                        )}
                        <MobileNavLink to="/candidate-pipeline" isActive={isActive('/candidate-pipeline')} onClick={() => setIsOpen(false)}>
                          Candidate Pipeline
                        </MobileNavLink>
                      </>
                    )}

                    {user?.role === 'admin' && (
                      <MobileNavLink to="/admin/master-setup" isActive={isActive('/admin/master-setup')} isSpecial onClick={() => setIsOpen(false)}>
                        Admin Master Setup
                      </MobileNavLink>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <FiEdit3 className="w-5 h-5 text-blue-600" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <FiLogOut className="w-5 h-5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Unauthenticated Mobile Buttons */
                <div className="flex flex-col gap-2.5 py-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-3 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;

