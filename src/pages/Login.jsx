import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import BackgroundBubbles from '../components/BackgroundBubbles';
import StartScreen from '../components/StartScreen';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
  
const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showMainContent, setShowMainContent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowMainContent(true);
      const timer = setTimeout(() => {
        setShowMainContent(false);
        navigate('/', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const validatePhoneNumber = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10 ? digitsOnly : null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!agree) {
      toast.error('Please agree to the terms and privacy policy');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" })); //sound
      return;
    }
    if (!phoneNumber || !password) {
      toast.error('Please enter both phone number and password');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" })); //sound
      return;
    }
    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      toast.error('Please enter a valid 10-digit phone number');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" })); //sound
      return;
    }
    try {
      setIsLoading(true);
      const result = await login({ phoneNumber: formattedPhone, password });
      if (result?.success) {
        setShowMainContent(true);
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } else {
        toast.error(result?.message || 'Login failed. Please try again.');
          window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" })); //sound
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" })); //sound
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blueGradient flex flex-col justify-end">
      <BackgroundBubbles />
      {showMainContent ? (
        <StartScreen />
      ) : (
        <>
          {/* Premium Logo Section */}
          <div className="flex flex-col items-center pt-6">
            {/* Logo with professional bounce animation */}
            <div className="animate-[bounceIn_2s_ease-out]">
              <img
                src={logo}
                alt="Ful2Win Logo"
                className="h-[140px] md:h-[170px] w-auto"
              />
            </div>
            
            {/* Tagline with delayed fade */}
            <p className="text-[#FFD700] text-base font-medium tracking-wider text-center mb-8
            animate-[fadeIn_1s_ease-out_0.5s_both]">
              Entertainment · Earning · Fame
            </p>
          </div>

          {/* Glass Morphism Form Container */}
          <div className="bg-white/15 rounded-t-3xl px-8 py-10 w-full max-w-md mx-auto 
              backdrop-blur-lg border border-white/30 
              shadow-[0_10px_50px_rgba(0,0,0,0.15)]">
            
            <h2 className="text-2xl font-semibold text-gray-100 mb-1">Hello Again!</h2>
            <p className="text-gray-200 mb-6">Login to continue</p>

            <form onSubmit={handleLogin} autoComplete='off'>
              {/* Phone Input */}
              <div className="relative mb-6 group">
                <label className="block text-sm font-medium text-gray-100 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-5 py-3 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
                  placeholder="Enter 10-digit number"
                  maxLength="10"
                  required
                  autoComplete='off'
                />
              </div>

              {/* Password Field */}
              <div className="relative mb-6 group">
                <label className="block text-sm font-medium text-gray-100 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3 pr-12 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
                    placeholder="Enter your password"
                    required
                    autoComplete='new-password'
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start mb-6">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="w-4 h-4 text-blue-400 border-gray-300 rounded focus:ring-blue-400"
                    required
                  />
                </div>
                <label className="ml-2 text-sm text-gray-200">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-300 hover:text-blue-200 hover:underline transition-colors">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-300 hover:text-blue-200 hover:underline transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl text-white font-medium tracking-wide ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg hover:shadow-blue-500/30 transition-all duration-300'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-gray-300">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-300 hover:text-blue-200 font-medium hover:underline transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </>
      )}
      <style jsx global>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Login;