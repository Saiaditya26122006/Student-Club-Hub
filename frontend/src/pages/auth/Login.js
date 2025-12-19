import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Loader from "../../components/Loader";
import "../../styles/LoginForm.css";
import "../../styles/NewtonsCradle.css";
import "../../styles/DesignSystem.css";

export default function Login({ onLogin, initialMode = "login" }) {
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState(initialMode);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Common state
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // Track which OAuth provider is loading

  useEffect(() => {
    setMounted(true);
    
    // Load Google OAuth script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
      };
      document.body.appendChild(script);
    }
    
    // Load Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  // Handle mode switch with animation
  const switchMode = (newMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setMsg("");
      setValidationErrors({});
    }
  };

  // Login handler
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

  // Register handler
  const validateRegisterForm = () => {
    const errors = {};

    if (registerForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (registerForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
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

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);

    try {
      await API.post("/api/register", {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });

      setMsg("Account created successfully! Please login.");
      setTimeout(() => {
        switchMode("login");
        setEmail(registerForm.email);
        setRegisterForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.msg ||
        "Registration failed. Please try again.";
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // OAuth Handlers
  const handleGoogleLogin = async () => {
    setOauthLoading("google");
    setMsg("");
    
    try {
      // Get Google Client ID from environment variable
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                       '1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0.apps.googleusercontent.com';
      
      // Debug: Log to console (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Google Client ID:', clientId ? 'Found' : 'Missing');
      }
      
      if (!clientId || clientId === 'your_google_client_id_here') {
        setMsg("Google OAuth is not configured. Please contact administrator.");
        setOauthLoading(null);
        return;
      }

      // Use direct popup OAuth (more reliable than One Tap)
      // One Tap can cause issues with localhost, so we'll use popup directly
      openGooglePopup();
    } catch (error) {
      console.error("Google login error:", error);
      setMsg("Failed to initiate Google login. Please try again.");
      setOauthLoading(null);
    }
  };

  const openGooglePopup = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                     '1401930180-5pakr3jnjlckt95jsgn2hus3kvsbv5v0.apps.googleusercontent.com';
    
    // Use callback page as redirect URI
    const redirectUri = `${window.location.origin}/google-oauth-callback.html`;
    const scope = 'email profile';
    const responseType = 'token';
    
    // Build OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `include_granted_scopes=true`;
    
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(authUrl, 'Google Login', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (!popup) {
      setMsg("Please allow popups for this site to use Google login.");
      setOauthLoading(null);
      return;
    }
    
    // Listen for OAuth callback using postMessage
    const messageListener = (event) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        if (popup && !popup.closed) popup.close();
        
        const { accessToken, userInfo } = event.data;
        handleOAuthCallback('google', accessToken, {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider_id: userInfo.id
        });
      } else if (event.data && event.data.type === 'GOOGLE_OAUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        if (popup && !popup.closed) popup.close();
        setMsg(event.data.error || "Google authentication failed. Please check your Google Cloud Console settings.");
        setOauthLoading(null);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Timeout handler
    const timeout = setTimeout(() => {
      window.removeEventListener('message', messageListener);
      setOauthLoading(null);
      setMsg("Google login timed out. Please try again.");
      if (popup && !popup.closed) popup.close();
    }, 60000); // 60 seconds
    
    // Clean up timeout when message is received
    const originalListener = messageListener;
    window.addEventListener('message', (event) => {
      if (event.origin === window.location.origin && 
          event.data && (event.data.type === 'GOOGLE_OAUTH_SUCCESS' || event.data.type === 'GOOGLE_OAUTH_ERROR')) {
        clearTimeout(timeout);
        originalListener(event);
      }
    });
  };

  const handleGoogleCallback = async (response) => {
    try {
      // This is called by Google Identity Services One Tap
      const credential = response.credential;
      
      // Decode JWT token to get user info (faster than API call)
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const tokenData = JSON.parse(jsonPayload);
        
        // Use token data directly (faster)
        await handleOAuthCallback('google', credential, {
          email: tokenData.email,
          name: tokenData.name,
          picture: tokenData.picture,
          provider_id: tokenData.sub
        });
      } catch (decodeError) {
        // Fallback to API call if decoding fails
        const tokenResponse = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
        const tokenData = await tokenResponse.json();
        
        await handleOAuthCallback('google', credential, {
          email: tokenData.email,
          name: tokenData.name,
          picture: tokenData.picture,
          provider_id: tokenData.sub
        });
      }
    } catch (error) {
      console.error("Google callback error:", error);
      setMsg("Google authentication failed. Please try again.");
      setOauthLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setOauthLoading("facebook");
    setMsg("");
    
    try {
      if (window.FB) {
        window.FB.login(async (response) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            await handleOAuthCallback('facebook', accessToken);
          } else {
            setMsg("Facebook login was cancelled.");
            setOauthLoading(null);
          }
        }, { scope: 'email,public_profile' });
      } else {
        setMsg("Facebook SDK not loaded. Please refresh the page.");
        setOauthLoading(null);
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      setMsg("Failed to initiate Facebook login. Please try again.");
      setOauthLoading(null);
    }
  };

  const handleLinkedInLogin = async () => {
    setOauthLoading("linkedin");
    setMsg("");
    
    try {
      const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID || '';
      const redirectUri = encodeURIComponent(window.location.origin);
      const scope = encodeURIComponent('openid profile email');
      const state = Math.random().toString(36).substring(7);
      
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`,
        'LinkedIn Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Note: LinkedIn requires server-side token exchange
      // For now, we'll use a simplified approach
      setMsg("LinkedIn OAuth requires server-side configuration. Please use email/password or other providers.");
      setOauthLoading(null);
    } catch (error) {
      console.error("LinkedIn login error:", error);
      setMsg("Failed to initiate LinkedIn login. Please try again.");
      setOauthLoading(null);
    }
  };

  const handleOAuthCallback = async (provider, accessToken, userInfo = null) => {
    try {
      setLoading(true);
      
      // OAuth is only allowed for participants
      if (selectedRole !== "participant") {
        setMsg("Social login is only available for participants. Leaders and universities must use their assigned credentials.");
        setLoading(false);
        setOauthLoading(null);
        return;
      }
      
      // If userInfo is provided, use it; otherwise fetch from provider
      let finalUserInfo = userInfo;
      if (!finalUserInfo && provider === 'google') {
        const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        finalUserInfo = await response.json();
      } else if (!finalUserInfo && provider === 'facebook') {
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        finalUserInfo = await response.json();
        if (finalUserInfo.picture && finalUserInfo.picture.data) {
          finalUserInfo.picture = finalUserInfo.picture.data.url;
        }
      }
      
      // Send to backend - force participant role for OAuth
      const res = await API.post(`/api/oauth/${provider}`, {
        access_token: accessToken,
        email: finalUserInfo?.email || '',
        name: finalUserInfo?.name || '',
        profile_image: finalUserInfo?.picture || finalUserInfo?.picture?.url || '',
        provider_id: finalUserInfo?.id || finalUserInfo?.sub || '',
        role: "participant" // OAuth users are always participants
      });
      
      const { token, role, user } = res.data;
      
      localStorage.setItem("clubhub_token", token);
      localStorage.setItem("clubhub_role", role);
      if (user?.email) {
        localStorage.setItem("clubhub_user_email", user.email);
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
      
    } catch (error) {
      console.error("OAuth callback error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.msg ||
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`;
      setMsg(errorMsg);
    } finally {
      setLoading(false);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .slide-panel {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          left: 0;
        }
        
        .slide-panel.login {
          transform: translateX(0%);
        }
        
        .slide-panel.register {
          transform: translateX(100%);
        }
        
        .content-fade {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>

      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '600px' }}>
        {/* Sliding Blue Panel */}
        <div
          className={`absolute inset-y-0 slide-panel ${mode} z-10`}
          style={{
            width: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="h-full flex flex-col items-center justify-center p-12 text-white content-fade">
            {mode === "login" ? (
              <>
                <h2 className="text-4xl font-bold mb-4 text-center">Welcome Back!</h2>
                <p className="text-lg text-center mb-8 opacity-90 max-w-sm">
                  Stay connected by logging in with your credentials and continue your experience
                </p>
                <button
                  onClick={() => switchMode("register")}
                  className="px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg"
                >
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-4 text-center">Hey There!</h2>
                <p className="text-lg text-center mb-8 opacity-90 max-w-sm">
                  Begin your amazing journey by creating an account with us today.
                </p>
                <button
                  onClick={() => switchMode("login")}
                  className="px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg"
                >
                  SIGN IN
                </button>
              </>
            )}
          </div>
        </div>

        {/* White Panel - Login Form (Left when login mode, Right when register mode) */}
        <div
          className={`absolute inset-y-0 transition-all duration-600 ${
            mode === "login" ? "right-0" : "left-0"
          }`}
          style={{ width: '50%' }}
        >
          <div className="h-full bg-white p-12 flex flex-col justify-center content-fade">
            {mode === "login" ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Sign In</h1>

                {/* Role Selector */}
                <div className="flex gap-2 mb-6 justify-center">
                  {['participant', 'leader', 'university'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedRole === role
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Social Login - Only for participants */}
                {selectedRole === "participant" && (
                  <>
                    <div className="flex justify-center gap-4 mb-6">
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Login with Facebook"
                      >
                        {oauthLoading === "facebook" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#1877F2' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Login with Google"
                      >
                        {oauthLoading === "google" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#4285F4' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleLinkedInLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Login with LinkedIn"
                      >
                        {oauthLoading === "linkedin" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#0077B5' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0077B5">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or use your account</span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                  <div className="flex justify-end">
                    <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                      Forgot your password?
                    </a>
                  </div>

                  {msg && (
                    <div className={`p-3 rounded-lg text-sm ${
                      msg.includes("successful") 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="newtons-cradle" style={{ '--uib-size': '20px', '--uib-color': 'white' }}>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                        </div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      "SIGN IN"
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <span className="text-gray-600 text-sm">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Sign Up
                      </button>
                    </span>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Create Account</h1>

                {/* Social Login - Only for participants */}
                {selectedRole === "participant" && (
                  <>
                    <div className="flex justify-center gap-4 mb-6">
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sign up with Facebook"
                      >
                        {oauthLoading === "facebook" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#1877F2' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sign up with Google"
                      >
                        {oauthLoading === "google" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#4285F4' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleLinkedInLogin}
                        disabled={oauthLoading !== null}
                        className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sign up with LinkedIn"
                      >
                        {oauthLoading === "linkedin" ? (
                          <div className="newtons-cradle" style={{ '--uib-size': '24px', '--uib-color': '#0077B5' }}>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                            <div className="newtons-cradle__dot"></div>
                          </div>
                        ) : (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0077B5">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or use your email for registration</span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Full Name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                      validationErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-600">{validationErrors.name}</p>
                  )}

                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="Email Address"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600">{validationErrors.email}</p>
                  )}

                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Password"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors pr-12 ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterPassword ? (
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
                  {validationErrors.password && (
                    <p className="text-sm text-red-600">{validationErrors.password}</p>
                  )}

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Confirm Password"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors pr-12 ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}

                  {msg && (
                    <div className={`p-3 rounded-lg text-sm ${
                      msg.includes("successfully") 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="newtons-cradle" style={{ '--uib-size': '20px', '--uib-color': 'white' }}>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                          <div className="newtons-cradle__dot"></div>
                        </div>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      "SIGN UP"
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <span className="text-gray-600 text-sm">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Sign In
                      </button>
                    </span>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
