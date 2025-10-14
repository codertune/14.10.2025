import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ShoppingCart, Menu, X, LogOut, Settings, BarChart3, AlertTriangle, Info, CheckCircle, AlertCircle, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from './AuthModal';
import Cart from './Cart';
import AdminSetup from './AdminSetup';
import NotificationBell from './NotificationBell';

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminSetupOpen, setIsAdminSetupOpen] = useState(false);
  const { user, logout, creditSettings } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-md">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                Smart Process Flow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-cyan-600 bg-cyan-50'
                      : 'text-gray-700 hover:text-cyan-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-cyan-600 transition-all duration-200 hover:scale-110"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                    {cartItems.length}
                  </span>
                )}
              </button>

              {/* Notifications - Only show when logged in */}
              {user && <NotificationBell userId={user.id} />}

              {/* User menu */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                    {!user.isAdmin && (
                      <div className="hidden sm:block bg-cyan-100 text-cyan-800 text-xs font-semibold px-2 py-1 rounded">
                        {Number(user.credits).toFixed(2)} credits
                      </div>
                    )}
                    {user.isAdmin && (
                      <div className="hidden sm:block bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                        Admin
                      </div>
                    )}
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/dashboard?tab=profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="inline h-4 w-4 mr-2" />
                        Account Settings
                      </Link>
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Settings className="inline h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Sign In
                </button>
              )}

              {/* Admin Setup Button (only show when not logged in or not admin) */}
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'text-cyan-600 bg-cyan-50'
                        : 'text-gray-700 hover:text-cyan-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-cyan-600 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* System Notification */}
      {creditSettings.systemNotification?.enabled && 
       creditSettings.systemNotification.message && 
       (creditSettings.systemNotification.showToAll || user?.isAdmin) && (
        <div className={`border-b-2 px-4 py-3 ${getNotificationColors(creditSettings.systemNotification.type)}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(creditSettings.systemNotification.type)}
              <span className="font-medium text-sm md:text-base">
                {creditSettings.systemNotification.message}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Cart */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

    </>
  );
}