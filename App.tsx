
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import SellerPage from './pages/SellerPage.js'; // New import for QR display page
import BuyerPage from './pages/BuyerPage.js';
import QrDisplayPage from './pages/QrDisplayPage.js'; // New import for QR display page

const Navbar = () => {
  const location = useLocation();
  const getLinkClass = (path) => { // Removed type
    return location.pathname === path
      ? 'bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium';
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-white font-bold text-xl">QR Pay</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className={getLinkClass('/')}>
              Seller
            </Link>
            <Link to="/buyer" className={getLinkClass('/buyer')}>
              Buyer
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App = () => { // Removed type
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<SellerPage />} />
            <Route path="/buyer" element={<BuyerPage />} />
            <Route path="/qr-display" element={<QrDisplayPage />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white text-center p-4">
          © 2024 QR Payment App
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;