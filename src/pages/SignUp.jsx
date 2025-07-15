import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import BackgroundBubbles from '../components/BackgroundBubbles';
import api from '../services/api';
import authService from '../services/authService';
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agree: false,
    referralCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isReferralCodeValid, setIsReferralCodeValid] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode
      }));
      validateReferralCode(refCode);
    }
  }, [searchParams]);
  
  const validateReferralCode = async (code) => {
    if (!code) {
      setIsReferralCodeValid(null);
      return;
    }
    
    try {
      setIsValidatingCode(true);
      const response = await api.get('/referrals/validate?code=${encodeURIComponent(code)}');
      
      if (response.data.valid) {
        setIsReferralCodeValid(true);
        toast.success('Valid referral code!');
      } else {
        setIsReferralCodeValid(false);
        toast.warning(response.data.message || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsReferralCodeValid(false);
      toast.error('Error validating referral code');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" }));//new sound effect
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  const handleReferralCodeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      referralCode: value
    }));
    
    if (value.trim()) {
      validateReferralCode(value);
    } else {
      setIsReferralCodeValid(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phoneNumber.match(phoneRegex)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.match(emailRegex)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;
    if (!formData.agree) {
      toast.error('Please agree to the terms and privacy policy');
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" }));//new add sound effect
      return;
    }
    try {
      setIsLoading(true);
      const userData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        referralCode: formData.referralCode
      };
     
      const result = await authService.register(userData);
      
      if (result?.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        toast.success(result.message || 'Registration successful!');
        navigate('/');
      } else {
        throw new Error(result?.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "universalError" }));//new add sound effect
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blueGradient flex flex-col justify-end">
      <BackgroundBubbles />
      
      {/* Premium Logo Section with same animation as Login */}
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
        
        <h2 className="text-2xl font-semibold text-gray-100 mb-1">Welcome!</h2>
        <p className="text-gray-200 mb-6">Sign up to continue</p>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative mb-6 group">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Full Name
            </label>
            <input
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-5 py-3 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
              placeholder="Enter your name"
              required
            />
            {errors.fullName && (
              <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="relative mb-6 group">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Phone Number
            </label>
            <input
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-5 py-3 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
              placeholder="Enter 10-digit number"
              required
            />
            {errors.phoneNumber && (
              <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Email */}
          <div className="relative mb-6 group">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-3 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
              placeholder="Enter your email"
              required
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative mb-6 group">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3 pr-12 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative mb-6 group">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-3 pr-12 border border-gray-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-transparent transition-all duration-300 placeholder-gray-300 bg-white/20 backdrop-blur-sm shadow-sm hover:border-gray-300/50 text-black"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Referral Code */}
          <div className="mt-2 mb-6">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowReferral(!showReferral)}
                className="text-blue-300 text-sm font-medium hover:underline"
              >
                {showReferral ? 'Hide referral code' : 'Have a referral code?'}
              </button>
              {showReferral && formData.referralCode && (
                <div className="flex items-center">
                  {isValidatingCode ? (
                    <span className="text-xs text-gray-300 flex items-center">
                      <FaSpinner className="animate-spin mr-1" /> Validating...
                    </span>
                  ) : isReferralCodeValid === true ? (
                    <span className="text-xs text-green-400 flex items-center">
                      <FaCheckCircle className="mr-1" /> Valid code
                    </span>
                  ) : isReferralCodeValid === false ? (
                    <span className="text-xs text-red-400">Invalid code</span>
                  ) : null}
                </div>
              )}
            </div>
            
            {showReferral && (
              <div className="mt-2 relative">
                <input
                  name="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={handleReferralCodeChange}
                  className={`w-full px-5 py-3 border ${
                    isReferralCodeValid === false 
                      ? 'border-red-400' 
                      : isReferralCodeValid === true 
                        ? 'border-green-400' 
                        : 'border-gray-300/30'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/70 bg-white/20 backdrop-blur-sm shadow-sm text-black`}
                  placeholder="Enter referral code (optional)"
                  disabled={isValidatingCode}
                />
                {isReferralCodeValid === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaCheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                )}
                {isReferralCodeValid === false && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaTimesCircle className="h-5 w-5 text-red-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start mb-6">
            <div className="flex items-center h-5">
              <input
                name="agree"
                type="checkbox"
                checked={formData.agree}
                onChange={handleChange}
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

          {/* Sign Up Button */}
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
                <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium hover:underline transition-colors">
            Login here
          </Link>
        </p>
      </div>

      {/* Add the animation keyframes */}
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

export default Signup;``