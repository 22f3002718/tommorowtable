import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Wallet, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/orders', icon: Wallet, label: 'Wallet', scrollTo: 'wallet' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                active ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
