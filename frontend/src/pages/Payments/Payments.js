import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';
import { FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import './Payments.css';

const Payments = () => {
  useAuth(); // Authentication context is available if needed
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPaid: 0,
    paymentsCount: 0,
    upcomingPayments: 0
  });

  const fetchData = useCallback(async () => {
    const isRefreshing = refreshing;
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      
      // Fetch payments and stats in parallel
      const [paymentsRes, statsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats')
      ]);
      
      setPayments(paymentsRes.data || []);
      setStats({
        totalPaid: parseFloat(statsRes.data?.totalPaid) || 0,
        paymentsCount: parseInt(statsRes.data?.paymentsCount) || 0,
        upcomingPayments: parseInt(statsRes.data?.upcomingPayments) || 0
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load payment data. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(payment => payment.status === filter);
    
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { text: 'Completed', class: 'completed' },
      scheduled: { text: 'Scheduled', class: 'scheduled' },
      failed: { text: 'Failed', class: 'failed' },
      pending: { text: 'Pending', class: 'pending' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { text: status, class: 'default' };
    
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading && !refreshing) {
    return <Loader fullPage message="Loading your payments..." />;
  }
  
  if (error && !refreshing) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={handleRefresh} className="btn btn-text" disabled={refreshing}>
          {refreshing ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="page-subtitle">View and manage your payment history</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className="btn btn-icon"
            disabled={loading || refreshing}
            title="Refresh data"
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/payments/new" className="btn btn-primary">
            + New Payment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Paid</h3>
          <div className="stat-amount">
            ${stats.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p>Across {stats.paymentsCount} payments</p>
        </div>

        <div className="stat-card">
          <h3>Upcoming Payments</h3>
          <div className="stat-amount">{stats.upcomingPayments}</div>
          <p>Scheduled for the next 30 days</p>
        </div>

        <div className="stat-card highlight">
          <h3>Need Help?</h3>
          <p>Having issues with a payment? We're here to help.</p>
          <Link to="/contact" className="stat-button">
            Contact Support
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Payments
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={`filter-btn ${filter === 'scheduled' ? 'active' : ''}`}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </button>
        <button 
          className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
      </div>

      {/* Payments List */}
      <div className="payments-list">
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <h3>No Payments Found</h3>
            <p>You don't have any {filter === 'all' ? '' : filter} payments yet.</p>
            {filter !== 'all' && (
              <button 
                className="btn btn-text"
                onClick={() => setFilter('all')}
              >
                View All Payments
              </button>
            )}
          </div>
        ) : (
          <div className="payments-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">Date & Time</div>
                <div className="table-cell">Description</div>
                <div className="payment-amount"></div>
                <div className="payment-details">
                  <div className="payment-creditor"></div>
                  <div className="payment-date"></div>
                </div>
              </div>
            </div>
            <div className="table-body">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="table-row">
                  <div className="table-cell" data-label="Date & Time">
                    {formatDate(payment.date)}
                  </div>
                  <div className="table-cell" data-label="Description">
                    <div className={`payment-status ${payment.status}`}>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="payment-creditor">{payment.creditorName}</div>
                    <div className="payment-method">{payment.paymentMethod}</div>
                  </div>
                  <div className="table-cell amount" data-label="Amount">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="table-cell" data-label="Status">
                    {getStatusBadge(payment.status)}
                    {payment.failureReason && (
                      <div className="failure-reason">{payment.failureReason}</div>
                    )}
                  </div>
                  <div className="table-cell" data-label="Reference">
                    {payment.reference}
                  </div>
                  <div className="table-cell actions" data-label="Actions">
                    <button className="btn-icon" title="View details">
                      <span className="icon">🔍</span>
                    </button>
                    {payment.status === 'scheduled' && (
                      <button className="btn-icon" title="Cancel payment">
                        <span className="icon">❌</span>
                      </button>
                    )}
                    {payment.status === 'failed' && (
                      <button className="btn-text" title="Retry payment">
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
