import React, { useState, useEffect, useRef } from 'react';
import NebulaLogo from './NebulaLogo';
import AdminLogin from './AdminLogin';
import './LoginForm.css';

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef(null);

  // Add keyboard shortcut for admin login (Alt + O)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret tap gesture for mobile admin access (5 taps on logo within 2 seconds)
  const handleLogoTap = () => {
    setTapCount(prev => prev + 1);
    
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    // Set new timeout to reset tap count
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000); // 2 second window
  };

  // Trigger admin login when 5 taps detected
  useEffect(() => {
    if (tapCount >= 5) {
      setTapCount(0);
      setShowAdminLogin(true);
    }
  }, [tapCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email/password combo
      const userData = {
        id: Date.now(),
        email: formData.email,
        name: formData.email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${formData.email.split('@')[0]}&background=667eea&color=fff`,
        plan: 'free',
        recordingsCount: 0,
        storageUsed: 0,
        maxStorage: 1024 // 1GB for free plan
      };
      
      onLogin(userData);
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form">
      <div className="login-header">
        <div 
          className="logo-tap-container" 
          onClick={handleLogoTap}
          style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
        >
          <NebulaLogo size={64} color="#667eea" animated={true} />
          {/* Tap counter indicator */}
          {tapCount > 0 && tapCount < 5 && (
            <div className="tap-indicator">{tapCount}/5</div>
          )}
        </div>
        <h2>Welcome back</h2>
        <p>Sign in to your Nebula Screen Capture account</p>
      </div>

      {errors.general && (
        <div className="error-banner">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Remember me
          </label>
          <button type="button" className="link-button">
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner-small">
              <NebulaLogo size={20} color="#ffffff" animated={true} />
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link-button">
            Sign up
          </button>
        </p>
      </div>

      <div className="demo-credentials">
        <h4>Demo Credentials</h4>
        <p><strong>Email:</strong> demo@nebula.com</p>
        <p><strong>Password:</strong> demo123</p>
      </div>

      {showAdminLogin && (
        <AdminLogin
          onClose={() => setShowAdminLogin(false)}
          onAdminLogin={onLogin}
        />
      )}
    </div>
  );
};

export default LoginForm;