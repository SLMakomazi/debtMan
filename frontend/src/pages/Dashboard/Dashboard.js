import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';
import api from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDebts: 0,
    paidDebts: 0,
    pendingDebts: 0,
    overdueDebts: 0,
    totalAmount: 0,
    recentPayments: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard');
        setStats(response.data);
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
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName || 'User'}</h1>
        <p>Here's an overview of your financial situation</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Debts</h3>
          <div className="stat-amount">{stats.totalDebts}</div>
        </div>
        <div className="stat-card">
          <h3>Paid</h3>
          <div className="stat-amount">{stats.paidDebts}</div>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <div className="stat-amount">{stats.pendingDebts}</div>
        </div>
        <div className="stat-card">
          <h3>Overdue</h3>
          <div className="stat-amount">{stats.overdueDebts}</div>
        </div>
        <div className="stat-card total-amount">
          <h3>Total Amount</h3>
          <div className="stat-amount">${stats.totalAmount?.toFixed(2)}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {stats.recentPayments?.length > 0 ? (
          <div className="activity-list">
            {stats.recentPayments.map((payment, index) => (
              <div key={index} className="activity-item">
                <div className="activity-details">
                  <span className="activity-name">{payment.description || 'Payment'}</span>
                  <span className="activity-amount">${payment.amount?.toFixed(2)}</span>
                </div>
                <span className="activity-date">
                  {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-activity">No recent activity found</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
