import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/CompleteRegistration.css';

const CompleteRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    idNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { completeOAuthRegistration } = useAuth();
  
  // Get token from location state or URL
  const token = location.state?.token || new URLSearchParams(location.search).get('token');

  useEffect(() => {
    // Redirect if no token is found
    if (!token) {
      toast.error('Invalid registration link. Please try again.');
      navigate('/register');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || 
        !formData.idNumber || !formData.dateOfBirth || !formData.address || 
        !formData.city || !formData.postalCode) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!/^[0-9]{13}$/.test(formData.idNumber)) {
      setError('Please enter a valid 13-digit ID number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (!token) {
        throw new Error('Invalid or expired registration link');
      }

      // Call the completeOAuthRegistration function from AuthContext
      const success = await completeOAuthRegistration({
        ...formData,
        // Ensure date is in the correct format for the backend
        dateOfBirth: new Date(formData.dateOfBirth).toISOString().split('T')[0]
      });
      
      if (success) {
        // Redirect to dashboard is handled in the AuthContext
        toast.success('Registration completed successfully!');
      }
      
    } catch (err) {
      console.error('Registration completion error:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-registration-container">
      <div className="complete-registration-form">
        <h2>Complete Your Registration</h2>
        <p className="subtitle">Please provide the following information to complete your account setup</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="e.g., 0123456789"
                pattern="[0-9]{10}"
                required
              />
              <small>10-digit number without spaces or special characters</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="idNumber">ID Number *</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="e.g., 9001011234089"
                pattern="[0-9]{13}"
                required
              />
              <small>13-digit South African ID number</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Street Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="postalCode">Postal Code *</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteRegistration;
