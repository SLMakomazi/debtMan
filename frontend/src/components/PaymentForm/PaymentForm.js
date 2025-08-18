import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './PaymentForm.css';

const PaymentForm = () => {
  const { debtId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [debt, setDebt] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });

  useEffect(() => {
    const fetchDebt = async () => {
      if (debtId) {
        try {
          const response = await api.get(`/debts/${debtId}`);
          setDebt(response.data);
          setFormData(prev => ({
            ...prev,
            amount: response.data.minimumPayment.toFixed(2)
          }));
        } catch (error) {
          toast.error('Failed to load debt details');
          console.error('Error fetching debt:', error);
        }
      }
    };

    fetchDebt();
  }, [debtId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const paymentData = {
        debtId: debtId || null,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        cardDetails: formData.paymentMethod === 'credit_card' ? {
          number: formData.cardNumber,
          expiry: formData.expiryDate,
          cvv: formData.cvv
        } : null,
        saveCard: formData.saveCard
      };

      await api.post('/payments', paymentData);
      
      toast.success('Payment processed successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (debtId && !debt) {
    return <div className="loading">Loading debt information...</div>;
  }

  return (
    <div className="payment-form-container">
      <h2>{debt ? `Payment for ${debt.creditorName}` : 'Make a Payment'}</h2>
      
      <form onSubmit={handleSubmit} className="payment-form">
        {debt && (
          <div className="form-group">
            <label>Current Balance</label>
            <div className="form-control-static">
              ${debt.currentBalance.toFixed(2)}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="amount">Payment Amount ($)</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="credit_card">Credit/Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="saved_card">Saved Card</option>
          </select>
        </div>
        
        {formData.paymentMethod === 'credit_card' && (
          <>
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  required
                />
              </div>
            </div>
            
            <div className="form-group form-check">
              <input
                type="checkbox"
                id="saveCard"
                name="saveCard"
                checked={formData.saveCard}
                onChange={handleChange}
                className="form-check-input"
              />
              <label htmlFor="saveCard" className="form-check-label">
                Save card for future payments
              </label>
            </div>
          </>
        )}
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Make Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
