import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Calculate password strength
    if (form.password) {
      let strength = 0;
      if (form.password.length >= 8) strength += 25;
      if (form.password.length >= 12) strength += 15;
      if (/[a-z]/.test(form.password)) strength += 15;
      if (/[A-Z]/.test(form.password)) strength += 15;
      if (/[0-9]/.test(form.password)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(form.password)) strength += 15;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [form.password]);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: undefined,
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await API.post("/api/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setMsg("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.msg || "Registration failed. Please try again.";
      setMsg(errorMsg);
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "from-red-500 to-red-600";
    if (passwordStrength < 70) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-emerald-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .initial-hidden {
          opacity: 0;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .shimmer {
          background: linear-gradient(
            to right,
            #3b82f6 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #06b6d4 75%,
            #3b82f6 100%
          );
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Left Panel - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-100 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white opacity-30 animate-float shadow-2xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-white opacity-30 animate-float shadow-2xl" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-40 w-40 h-40 rounded-full bg-white opacity-30 animate-float shadow-2xl" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Logo */}
          <div className={`mb-8 ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}>
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform duration-500">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>

          {/* Brand Text */}
          <div className={`text-center mb-12 ${mounted ? 'animate-fadeInUp delay-100' : 'initial-hidden'}`}>
            <h1 className="text-7xl font-black mb-4 tracking-tight">
              <span className="shimmer">Join ClubHub</span>
            </h1>
            <p className="text-2xl font-bold text-gray-800 mb-6">
              Start Your Campus Journey
            </p>
            <p className="text-lg text-gray-700 max-w-md leading-relaxed">
              Connect with clubs, discover events, and make the most of your university experience
            </p>
          </div>

          {/* Benefits List */}
          <div className={`space-y-4 max-w-md w-full ${mounted ? 'animate-fadeIn delay-300' : 'initial-hidden'}`}>
            <div className="flex items-center gap-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Free Forever</p>
                <p className="text-sm text-gray-600">No credit card required</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Instant Access</p>
                <p className="text-sm text-gray-600">Start exploring immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Secure & Private</p>
                <p className="text-sm text-gray-600">Your data is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-cyan-200 rounded-full filter blur-3xl opacity-20"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className={`lg:hidden flex justify-center mb-8 ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>

          {/* Welcome Text */}
          <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">
              Create Account
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of students on <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ClubHub</span>
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div className={`${mounted ? 'animate-slideInRight delay-100' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  className={`w-full p-4 pl-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    validationErrors.name
                      ? 'border-red-500'
                      : focusedField === 'name' 
                      ? 'border-blue-500 scale-[1.01] shadow-lg shadow-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="John Doe"
                  required
                  aria-label="Full Name"
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  validationErrors.name ? 'text-red-500' : focusedField === 'name' ? 'text-blue-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {validationErrors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className={`${mounted ? 'animate-slideInRight delay-200' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  className={`w-full p-4 pl-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    validationErrors.email
                      ? 'border-red-500'
                      : focusedField === 'email' 
                      ? 'border-purple-500 scale-[1.01] shadow-lg shadow-purple-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your.email@university.edu"
                  required
                  aria-label="Email Address"
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  validationErrors.email ? 'text-red-500' : focusedField === 'email' ? 'text-purple-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className={`${mounted ? 'animate-slideInRight delay-300' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`w-full p-4 pl-12 pr-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    validationErrors.password
                      ? 'border-red-500'
                      : focusedField === 'password' 
                      ? 'border-pink-500 scale-[1.01] shadow-lg shadow-pink-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password"
                  required
                  aria-label="Password"
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  validationErrors.password ? 'text-red-500' : focusedField === 'password' ? 'text-pink-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Password Strength</span>
                    <span className={`text-xs font-bold ${
                      passwordStrength < 40 ? 'text-red-600' : passwordStrength < 70 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()} transition-all duration-500 rounded-full`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className={`${mounted ? 'animate-slideInRight delay-400' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`w-full p-4 pl-12 pr-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    validationErrors.confirmPassword
                      ? 'border-red-500'
                      : focusedField === 'confirmPassword' 
                      ? 'border-cyan-500 scale-[1.01] shadow-lg shadow-cyan-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Re-enter your password"
                  required
                  aria-label="Confirm Password"
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  validationErrors.confirmPassword ? 'text-red-500' : focusedField === 'confirmPassword' ? 'text-cyan-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className={`w-full py-5 rounded-2xl text-white font-black text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br from-blue-400 to-cyan-400 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              } ${mounted ? 'animate-scaleIn delay-500' : 'initial-hidden'}`}
              disabled={loading}
              aria-label="Create Account"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating your account...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 tracking-wide">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create My Account
                </span>
              )}
            </button>
          </form>

          {/* Success or error message */}
          {msg && (
            <div className={`mt-6 p-4 rounded-2xl animate-fadeIn border-2 shadow-lg ${
              msg.includes("successfully") 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300" 
                : "bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-300"
            }`}>
              <div className="flex items-center gap-3">
                {msg.includes("successfully") ? (
                  <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="font-bold">{msg}</span>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className={`flex items-center my-8 ${mounted ? 'animate-fadeIn delay-500' : 'initial-hidden'}`}>
            <div className="flex-1 border-t-2 border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-bold tracking-wider">ALREADY HAVE AN ACCOUNT?</span>
            <div className="flex-1 border-t-2 border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className={`w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${mounted ? 'animate-fadeIn delay-500' : 'initial-hidden'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In Instead
          </button>

          {/* Footer */}
          <div className={`text-center mt-8 ${mounted ? 'animate-fadeIn delay-500' : 'initial-hidden'}`}>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secured with JWT Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
