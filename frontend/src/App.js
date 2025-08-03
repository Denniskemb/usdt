import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  User, 
  LogOut, 
  Eye, 
  EyeOff,
  CreditCard,
  QrCode,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode.react';
import './App.css';

// Configure axios
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/profile');
      setCurrentUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      toast.error('Session expired, please login again');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      localStorage.setItem('token', response.data.access_token);
      setCurrentUser(response.data.user);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleSignup = async (userData) => {
    try {
      await api.post('/api/auth/signup', userData);
      toast.success('Account created successfully! Please login.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentPage('home');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPages onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-lg border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                USDT BANC
              </motion.h1>
            </div>
            
            <div className="flex items-center space-x-8">
              <NavButton 
                active={currentPage === 'home'} 
                onClick={() => setCurrentPage('home')}
                icon={<Home size={20} />}
                text="HOME"
              />
              <NavButton 
                active={currentPage === 'wallet'} 
                onClick={() => setCurrentPage('wallet')}
                icon={<Wallet size={20} />}
                text="WALLET"
              />
              <NavButton 
                active={currentPage === 'crypto'} 
                onClick={() => setCurrentPage('crypto')}
                icon={<TrendingUp size={20} />}
                text="CRYPTO INDEX"
              />
              
              <div className="flex items-center space-x-4 ml-8">
                <span className="text-gray-300">Welcome, {currentUser.name}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 px-3 py-2 rounded-lg text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && <HomePage key="home" />}
          {currentPage === 'wallet' && <WalletPage key="wallet" />}
          {currentPage === 'crypto' && <CryptoIndexPage key="crypto" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Navigation Button Component
const NavButton = ({ active, onClick, icon, text }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
      active 
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
        : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
    }`}
  >
    {icon}
    <span>{text}</span>
  </motion.button>
);

// Authentication Pages Component
const AuthPages = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    wallet_withdrawal_password: '',
    agree_terms: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      onLogin({ email: formData.email, password: formData.password });
    } else {
      const success = await onSignup(formData);
      if (success) {
        setIsLogin(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          wallet_withdrawal_password: '',
          agree_terms: false
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-cyan-500/30"
      >
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
            whileHover={{ scale: 1.05 }}
          >
            USDT BANC
          </motion.h1>
          <p className="text-gray-400">Your Trusted Gateway to Stable Crypto Finance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <div>
              <input
                type="password"
                placeholder="Wallet Withdrawal Password"
                value={formData.wallet_withdrawal_password}
                onChange={(e) => setFormData({...formData, wallet_withdrawal_password: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400"
                required={!isLogin}
              />
            </div>
          )}

          {!isLogin && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="agree_terms"
                checked={formData.agree_terms}
                onChange={(e) => setFormData({...formData, agree_terms: e.target.checked})}
                className="w-4 h-4 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500"
                required={!isLogin}
              />
              <label htmlFor="agree_terms" className="text-sm text-gray-400">
                I agree to the Terms & Conditions
              </label>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <button className="text-purple-400 hover:text-purple-300 text-sm">
              Forgot Password?
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const [purchaseData, setPurchaseData] = useState({
    amount: '',
    crypto_type: 'USDT',
    payment_method: 'credit_card'
  });

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/crypto/buy', {
        ...purchaseData,
        amount: parseFloat(purchaseData.amount),
        card_details: {} // Mock card details
      });
      toast.success('Crypto purchase successful!');
      setPurchaseData({ amount: '', crypto_type: 'USDT', payment_method: 'credit_card' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <motion.h2 
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Buy Cryptocurrency
        </motion.h2>
        <motion.p 
          className="text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Purchase USDT and other major cryptocurrencies instantly
        </motion.p>
      </div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/30"
        >
          <form onSubmit={handlePurchase} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={purchaseData.amount}
                  onChange={(e) => setPurchaseData({...purchaseData, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cryptocurrency
                </label>
                <select
                  value={purchaseData.crypto_type}
                  onChange={(e) => setPurchaseData({...purchaseData, crypto_type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                >
                  <option value="USDT">USDT (Tether)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BNB">Binance Coin (BNB)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={purchaseData.payment_method}
                onChange={(e) => setPurchaseData({...purchaseData, payment_method: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="visa">Visa</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-cyan-600 transition-all flex items-center justify-center space-x-2"
            >
              <CreditCard size={20} />
              <span>Purchase Cryptocurrency</span>
              <Sparkles size={20} />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Wallet Page Component
const WalletPage = () => {
  const [walletData, setWalletData] = useState(null);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    destination_address: '',
    withdrawal_password: ''
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/api/wallet');
      setWalletData(response.data.wallet);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/wallet/withdraw', {
        ...withdrawData,
        amount: parseFloat(withdrawData.amount)
      });
      toast.success('Withdrawal successful!');
      setWithdrawData({ amount: '', destination_address: '', withdrawal_password: '' });
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
    }
  };

  if (!walletData) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Your Wallet</h2>
        <p className="text-gray-400 text-lg">Manage your cryptocurrency holdings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wallet Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Wallet className="mr-2" size={24} />
            Wallet Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Balance</label>
              <div className="text-2xl font-bold text-green-400">${walletData.balance.toFixed(2)}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Wallet Address</label>
              <div className="text-sm text-white bg-gray-800/50 p-3 rounded-lg font-mono break-all">
                {walletData.address}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={walletData.address} size={150} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Send className="mr-2" size={24} />
            Withdraw Funds
          </h3>
          
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <input
                type="number"
                step="0.01"
                min="0"
                max={walletData.balance}
                placeholder="Amount to withdraw"
                value={withdrawData.amount}
                onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Destination wallet address"
                value={withdrawData.destination_address}
                onChange={(e) => setWithdrawData({...withdrawData, destination_address: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Withdrawal password"
                value={withdrawData.withdrawal_password}
                onChange={(e) => setWithdrawData({...withdrawData, withdrawal_password: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Withdraw Funds
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Crypto Index Page Component
const CryptoIndexPage = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptocurrencies();
  }, []);

  const fetchCryptocurrencies = async () => {
    try {
      const response = await api.get('/api/crypto/top10');
      setCryptos(response.data.cryptocurrencies);
    } catch (error) {
      toast.error('Failed to fetch cryptocurrency data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Crypto Index</h2>
        <p className="text-gray-400 text-lg">Top 10 cryptocurrencies by market cap</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cryptos.map((crypto, index) => (
          <motion.div
            key={crypto.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img src={crypto.image} alt={crypto.name} className="w-10 h-10" />
                <div>
                  <h3 className="text-white font-semibold">{crypto.name}</h3>
                  <p className="text-gray-400 text-sm uppercase">{crypto.symbol}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${
                crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.price_change_percentage_24h >= 0 ? 
                  <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />
                }
                <span className="text-sm font-medium">
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-semibold">
                  ${crypto.current_price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white">
                  ${(crypto.market_cap / 1e9).toFixed(2)}B
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume</span>
                <span className="text-white">
                  ${(crypto.total_volume / 1e6).toFixed(2)}M
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default App;