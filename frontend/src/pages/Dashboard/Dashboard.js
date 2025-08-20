import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import api from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    // Account stats
    totalAccounts: 0,
    
    // Transaction stats
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalCredits: 0,
    totalDebits: 0,
    
    // Payment stats
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalPaid: 0,
    
    // Combined recent activities
    recentActivities: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader fullPage message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome back, {user?.firstName}!</h1>
      
      <div className="stats-grid">
        {/* Account Stats */}
        <div className="stat-card">
          <h3>Accounts</h3>
          <p className="stat-value">{formatNumber(stats.totalAccounts)}</p>
        </div>
        
        {/* Transaction Stats */}
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p className="stat-value">{formatNumber(stats.totalTransactions)}</p>
        </div>
        
        <div className="stat-card success">
          <h3>Completed Tx</h3>
          <p className="stat-value">{formatNumber(stats.completedTransactions)}</p>
        </div>
        
        <div className="stat-card warning">
          <h3>Pending Tx</h3>
          <p className="stat-value">{formatNumber(stats.pendingTransactions)}</p>
        </div>
        
        <div className="stat-card danger">
          <h3>Failed Tx</h3>
          <p className="stat-value">{formatNumber(stats.failedTransactions)}</p>
        </div>
        
        {/* Payment Stats */}
        <div className="stat-card">
          <h3>Total Payments</h3>
          <p className="stat-value">{formatNumber(stats.totalPayments)}</p>
        </div>
        
        <div className="stat-card success">
          <h3>Paid</h3>
          <p className="stat-value">{formatNumber(stats.completedPayments)}</p>
        </div>
        
        <div className="stat-card warning">
          <h3>Scheduled</h3>
          <p className="stat-value">{formatNumber(stats.pendingPayments)}</p>
        </div>
        
        <div className="stat-card danger">
          <h3>Failed</h3>
          <p className="stat-value">{formatNumber(stats.failedPayments)}</p>
        </div>
        
        {/* Amount Stats */}
        <div className="stat-card total-amount">
          <h3>Total Credits</h3>
          <p className="stat-value">{formatCurrency(stats.totalCredits)}</p>
        </div>
        
        <div className="stat-card total-amount">
          <h3>Total Debits</h3>
          <p className="stat-value">{formatCurrency(stats.totalDebits)}</p>
        </div>
        
        <div className="stat-card total-amount">
          <h3>Total Paid</h3>
          <p className="stat-value">{formatCurrency(stats.totalPaid)}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {stats.recentActivities?.length > 0 ? (
          <div className="activity-list">
            {stats.recentActivities.map((activity, index) => {
              const isPayment = activity.type === 'payment';
              const isTransaction = activity.type === 'transaction';
              const status = activity.status?.toLowerCase();
              const amount = isPayment ? activity.amount : activity.amount;
              const isCredit = isTransaction ? activity.transaction_type === 'credit' : false;
              const date = isPayment ? activity.payment_date : activity.transaction_date;
              const description = activity.description || (isPayment ? 'Payment' : 'Transaction');
              const institution = activity.institution || (isPayment ? 'Payment' : 'N/A');
              
              return (
                <div key={`${activity.type}-${activity.id || index}`} className={`activity-item ${status}`}>
                  <div className="activity-icon">
                    {status === 'completed' ? '✓' : status === 'failed' ? '✗' : '⏳'}
                  </div>
                  <div className="activity-details">
                    <span className="activity-name">
                      {description} ({institution})
                      {isPayment && (
                        <span className="activity-badge">Payment</span>
                      )}
                    </span>
                    <span className={`activity-amount ${isPayment ? 'payment' : isCredit ? 'credit' : 'debit'}`}>
                      {isPayment ? '' : (isCredit ? '+' : '-')}
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <span className="activity-date">
                    {date ? formatDate(date) : 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-activity">
            <p>No recent activity found</p>
            <p className="subtext">Your recent transactions and payments will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
