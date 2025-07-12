
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import BackgroundBubbles from '../components/BackgroundBubbles';
import StartScreen from '../components/StartScreen';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showMainContent, setShowMainContent] = useState(false);

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
      return;
    }
    if (!phoneNumber || !password) {
      toast.error('Please enter both phone number and password');
      return;
    }

    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login({ phoneNumber: formattedPhone, password });
      console.log('Login API result:', result);
      if (result && typeof result === 'object' && result.success) {
        setShowMainContent(true);
        setTimeout(() => {
          setShowMainContent(false);
          navigate('/', { replace: true });
        }, 2000);
      } else if (result && typeof result === 'object' && result.message) {
        toast.error(result.message);
      } else {
        toast.error('Login failed: Unexpected server response.');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
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
       {/* Logo Section - Bigger and Properly Spaced */}
<div className="flex flex-col items-center pt-4"> {/* Top spacing */}
  <img
    src={logo}
    alt="Ful2Win Logo"
    className="h-[120px] md:h-[150px] w-auto mb-2" 
  />
  <p className="text-red-500 text-sm font-semibold text-center mb-8"> {/* Increased gap below text */}
    Entertainment. <span className="text-yellow-300">Earning.</span>{' '}
    <span className="text-pink-400">Fame</span>
  </p>
</div>

         <div className="bg-white rounded-t-3xl px-6 py-8 w-full max-w-md mx-auto shadow-xl">


            <h2 className="text-2xl font-semibold text-gray-700 mb-5">Hello Again!</h2>
            <p className="text-gray-500 mb-5">Login to continue</p>

            <form onSubmit={handleLogin} autoComplete='off'>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit phone number"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-blue-300"
                  maxLength="10"
                  required
                  autoComplete='off'
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-blue-300"
                  required
                  autoComplete='new-password'
                />
              </div>

              <div className="flex items-center mb-4 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  className="mr-2"
                  required
                />
                <label className="text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link> and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-white ${
                  isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-sm mt-4 text-gray-500">
              Don’t have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;