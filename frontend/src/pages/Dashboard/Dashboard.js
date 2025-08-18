import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DebtCard from '../../components/DebtCard/DebtCard';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDebt: 0,
    totalMinPayment: 0,
    debtsCount: 0,
    nextPaymentDue: null
  });

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/debts');
        setDebts(response.data);
        
        // Calculate statistics
        const totalDebt = response.data.reduce((sum, debt) => sum + debt.currentBalance, 0);
        const totalMinPayment = response.data.reduce((sum, debt) => sum + debt.minimumPayment, 0);
        const nextPayment = response.data.length > 0 
          ? new Date(Math.min(...response.data.map(d => new Date(d.dueDate))))
          : null;
        
        setStats({
          totalDebt,
          totalMinPayment,
          debtsCount: response.data.length,
          nextPaymentDue: nextPayment
        });
      } catch (error) {
        console.error('Error fetching debts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  if (loading) {
    return <Loader fullPage message="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p>Here's an overview of your financial situation</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Debt</h3>
          <div className="stat-amount">${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p>Across {stats.debtsCount} {stats.debtsCount === 1 ? 'account' : 'accounts'}</p>
        </div>

        <div className="stat-card">
          <h3>Monthly Minimum</h3>
          <div className="stat-amount">${stats.totalMinPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p>Total minimum payments due</p>
        </div>

        <div className="stat-card">
          <h3>Next Payment Due</h3>
          <div className="stat-amount">
            {stats.nextPaymentDue ? (
              <>
                {stats.nextPaymentDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span className="stat-days">
                  (in {Math.ceil((stats.nextPaymentDue - new Date()) / (1000 * 60 * 60 * 24))} days)
                </span>
              </>
            ) : 'No payments due'}
          </div>
          <p>Next upcoming payment</p>
        </div>

        <div className="stat-card highlight">
          <h3>Pay Off Faster</h3>
          <div className="stat-amount">
            ${(stats.totalMinPayment * 1.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p>Pay 50% more to reduce interest</p>
          <Link to="/payments" className="stat-button">Make a Payment</Link>
        </div>
      </div>

      {/* Debts List */}
      <div className="debts-section">
        <div className="section-header">
          <h2>Your Debts</h2>
          <Link to="/debts/add" className="btn btn-primary">
            + Add Debt
          </Link>
        </div>

        {debts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Debts Found</h3>
            <p>You don't have any debts added yet. Add your first debt to get started.</p>
            <Link to="/debts/add" className="btn btn-primary">
              Add Your First Debt
            </Link>
          </div>
        ) : (
          <div className="debts-grid">
            {debts.map(debt => (
              <DebtCard key={debt.id} debt={debt} />
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="payments-section">
        <div className="section-header">
          <h2>Recent Payments</h2>
          <Link to="/payments" className="btn btn-text">
            View All
          </Link>
        </div>
        
        <div className="payments-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="payment-item">
              <div className="payment-info">
                <div className="payment-amount">$125.00</div>
                <div className="payment-details">
                  <div className="payment-creditor">Chase Credit Card</div>
                  <div className="payment-date">Aug 15, 2023</div>
                </div>
              </div>
              <div className="payment-status paid">Paid</div>
            </div>
          ))}
          
          <div className="view-more">
            <Link to="/payments">View all payment history →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
