import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await API.post("/api/login", { email, password });
      const { token, role, user } = res.data;

      if (selectedRole && role !== selectedRole) {
        setMsg(
          `This account is registered as a ${role}. Switch to "${role}" mode to continue.`
        );
        setLoading(false);
        return;
      }

      localStorage.setItem("clubhub_token", token);
      localStorage.setItem("clubhub_role", role);
      if (user?.email) {
        localStorage.setItem("clubhub_user_email", user.email);
      } else {
        localStorage.removeItem("clubhub_user_email");
      }

      if (onLogin) onLogin(role, user);
      setMsg("Login successful!");

      setTimeout(() => {
        if (role === "leader") {
          navigate("/leader");
        } else if (role === "university") {
          navigate("/university");
        } else {
          navigate("/participant");
        }
      }, 800);

    } catch (err) {
      const backendMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Invalid credentials. Please try again.";
      setMsg(backendMsg);
      setLoading(false);
    }
  };

  const roleConfig = {
    participant: {
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-100 via-cyan-50 to-blue-100",
      borderColor: "border-blue-500",
      hoverBg: "hover:bg-blue-50",
      focusColor: "border-blue-500 shadow-blue-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Student",
      description: "Discover clubs, RSVP for events, connect with community"
    },
    leader: {
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-100 via-pink-50 to-purple-100",
      borderColor: "border-purple-500",
      hoverBg: "hover:bg-purple-50",
      focusColor: "border-purple-500 shadow-purple-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "Club Leader",
      description: "Organize events, track analytics, engage members"
    },
    university: {
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-100 via-purple-50 to-indigo-100",
      borderColor: "border-indigo-500",
      hoverBg: "hover:bg-indigo-50",
      focusColor: "border-indigo-500 shadow-indigo-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "University",
      description: "Oversee clubs, approve proposals, manage campus"
    }
  };

  const currentConfig = roleConfig[selectedRole];

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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
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
      `}</style>

      {/* Left Panel - Brand Showcase */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentConfig.bgGradient} relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Logo */}
          <div className={`mb-10 ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}>
            <div className="relative">
              {/* Main Logo Circle */}
              <div className={`w-32 h-32 bg-gradient-to-br ${currentConfig.gradient} rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden`}>
                {/* Connecting dots pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Center hub */}
                  <div className="absolute w-8 h-8 bg-white rounded-full z-10 shadow-lg"></div>
                  
                  {/* Connecting lines and nodes */}
                  <svg className="w-full h-full absolute" viewBox="0 0 100 100">
                    {/* Lines connecting to center */}
                    <line x1="50" y1="50" x2="30" y2="25" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="70" y2="25" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="25" y2="50" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="75" y2="50" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="30" y2="75" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="70" y2="75" stroke="white" strokeWidth="2" opacity="0.6"/>
                    
                    {/* Outer nodes representing people/clubs */}
                    <circle cx="30" cy="25" r="5" fill="white" opacity="0.9"/>
                    <circle cx="70" cy="25" r="5" fill="white" opacity="0.9"/>
                    <circle cx="25" cy="50" r="5" fill="white" opacity="0.9"/>
                    <circle cx="75" cy="50" r="5" fill="white" opacity="0.9"/>
                    <circle cx="30" cy="75" r="5" fill="white" opacity="0.9"/>
                    <circle cx="70" cy="75" r="5" fill="white" opacity="0.9"/>
                  </svg>
                </div>
              </div>
              
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentConfig.gradient} rounded-full blur-xl opacity-30 -z-10`}></div>
            </div>
          </div>

          {/* Brand Text */}
          <div className={`text-center mb-12 ${mounted ? 'animate-fadeInUp delay-100' : 'initial-hidden'}`}>
            <h1 className="text-6xl font-black mb-4 tracking-tight text-gray-900">
              Student ClubHub
            </h1>
            <p className="text-2xl font-bold text-gray-800 mb-6">
              Your Campus, Connected
            </p>
            <p className="text-lg text-gray-700 max-w-md leading-relaxed">
              The ultimate platform for student organizations, event management, and campus engagement
            </p>
          </div>

          {/* Features List */}
          <div className={`space-y-4 max-w-md w-full ${mounted ? 'animate-fadeIn delay-300' : 'initial-hidden'}`}>
            <div className="flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`w-14 h-14 bg-gradient-to-br ${currentConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Instant Event Access</p>
                <p className="text-sm text-gray-600">RSVP and manage events in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`w-14 h-14 bg-gradient-to-br ${currentConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Smart Analytics</p>
                <p className="text-sm text-gray-600">Track engagement and insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className={`w-14 h-14 bg-gradient-to-br ${currentConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">QR Technology</p>
                <p className="text-sm text-gray-600">Seamless check-in experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white relative">
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className={`lg:hidden flex justify-center mb-8 ${mounted ? 'animate-scaleIn' : 'initial-hidden'}`}>
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${currentConfig.gradient} rounded-full flex items-center justify-center shadow-xl relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-6 h-6 bg-white rounded-full z-10"></div>
                  <svg className="w-full h-full absolute" viewBox="0 0 100 100">
                    <line x1="50" y1="50" x2="30" y2="25" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="70" y2="25" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="25" y2="50" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="75" y2="50" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="30" y2="75" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <line x1="50" y1="50" x2="70" y2="75" stroke="white" strokeWidth="2" opacity="0.6"/>
                    <circle cx="30" cy="25" r="4" fill="white" opacity="0.9"/>
                    <circle cx="70" cy="25" r="4" fill="white" opacity="0.9"/>
                    <circle cx="25" cy="50" r="4" fill="white" opacity="0.9"/>
                    <circle cx="75" cy="50" r="4" fill="white" opacity="0.9"/>
                    <circle cx="30" cy="75" r="4" fill="white" opacity="0.9"/>
                    <circle cx="70" cy="75" r="4" fill="white" opacity="0.9"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">
              Welcome Back!
            </h2>
            <p className="text-lg text-gray-600">
              Sign in to access your <span className="font-bold text-gray-900">campus dashboard</span>
            </p>
          </div>

          {/* Role Selector */}
          <div className={`mb-8 ${mounted ? 'animate-slideInLeft delay-100' : 'opacity-100'}`}>
            <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(roleConfig).map(([role, config]) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`relative p-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 border-2 ${
                      isSelected
                        ? `scale-110 shadow-2xl border-transparent bg-gradient-to-br ${config.gradient} text-white`
                        : `bg-white ${config.borderColor} ${config.hoverBg} shadow-md hover:shadow-lg text-gray-900`
                    }`}
                  >
                    <div className={`flex justify-center mb-2 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {config.icon}
                    </div>
                    <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {config.title}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className={`${mounted ? 'animate-slideInRight delay-200' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  className={`w-full p-4 pl-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    focusedField === 'email' 
                      ? `${currentConfig.focusColor} scale-[1.01] shadow-lg` 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your.email@university.edu"
                  required
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'email' ? currentConfig.gradient.includes('blue') ? 'text-blue-500' : currentConfig.gradient.includes('purple') ? 'text-purple-500' : 'text-indigo-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div className={`${mounted ? 'animate-slideInRight delay-300' : 'initial-hidden'}`}>
              <label className="block mb-2 text-gray-900 font-bold text-sm uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full p-4 pl-12 pr-12 bg-white border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium shadow-sm ${
                    focusedField === 'password' 
                      ? `${currentConfig.focusColor} scale-[1.01] shadow-lg` 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                />
                <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'password' ? currentConfig.gradient.includes('blue') ? 'text-blue-500' : currentConfig.gradient.includes('purple') ? 'text-purple-500' : 'text-indigo-500' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
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
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className={`w-full py-5 rounded-2xl text-white font-black text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br ${currentConfig.gradient} ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              } ${mounted ? 'animate-scaleIn delay-400' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing you in...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 tracking-wide">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Student ClubHub
                </span>
              )}
            </button>
          </form>

          {/* Error or success message */}
          {msg && (
            <div className={`mt-6 p-4 rounded-2xl animate-fadeIn border-2 shadow-lg ${
              msg.includes("successful") 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300" 
                : "bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-300"
            }`}>
              <div className="flex items-center gap-3">
                {msg.includes("successful") ? (
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

          {/* Register Button - Only for participants */}
          {selectedRole === "participant" && (
            <>
              <div className={`flex items-center my-8 ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
                <div className="flex-1 border-t-2 border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500 font-bold tracking-wider">OR</span>
                <div className="flex-1 border-t-2 border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className={`w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Student Account
              </button>
            </>
          )}

          {/* Info message for leader/university */}
          {selectedRole !== "participant" && (
            <div className={`mt-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-lg ${mounted ? 'animate-fadeIn delay-400' : 'initial-hidden'}`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
                    {selectedRole === "leader" ? "Leader Access" : "Admin Access"}
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {selectedRole === "leader" 
                      ? "Leader credentials are automatically generated when your club proposal receives university approval. Check your proposal status for access details."
                      : "University administrator accounts are provisioned by system administrators. Contact your IT security department for authorized access."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`text-center mt-8 ${mounted ? 'animate-fadeIn delay-500' : 'initial-hidden'}`}>
            <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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

