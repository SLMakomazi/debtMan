import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';
import './Payments.css';

const Payments = () => {
  useAuth(); // Authentication context is available if needed
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPaid: 0,
    paymentsCount: 0,
    upcomingPayments: 0
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to fetch payments
        // const response = await api.get('/payments');
        // setPayments(response.data);
        
        // Mock data for now
        const mockPayments = [
          {
            id: 1,
            amount: 125.00,
            status: 'completed',
            date: '2023-08-15T10:30:00Z',
            creditorName: 'Chase Credit Card',
            paymentMethod: '•••• 4532',
            reference: 'PAY-789012'
          },
          {
            id: 2,
            amount: 89.99,
            status: 'scheduled',
            date: '2023-08-20T00:00:00Z',
            creditorName: 'Student Loan',
            paymentMethod: 'Bank Account',
            reference: 'PAY-789013'
          },
          {
            id: 3,
            amount: 45.50,
            status: 'failed',
            date: '2023-08-10T14:15:00Z',
            creditorName: 'Utility Bill',
            paymentMethod: '•••• 9821',
            reference: 'PAY-789014',
            failureReason: 'Insufficient funds'
          },
          {
            id: 4,
            amount: 210.00,
            status: 'completed',
            date: '2023-07-30T09:45:00Z',
            creditorName: 'Auto Loan',
            paymentMethod: 'Bank Account',
            reference: 'PAY-789015'
          },
          {
            id: 5,
            amount: 75.00,
            status: 'scheduled',
            date: '2023-09-01T00:00:00Z',
            creditorName: 'Credit One',
            paymentMethod: '•••• 1234',
            reference: 'PAY-789016'
          }
        ];
        
        setPayments(mockPayments);
        
        // Calculate stats
        const completedPayments = mockPayments.filter(p => p.status === 'completed');
        const totalPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const upcomingPayments = mockPayments.filter(p => p.status === 'scheduled').length;
        
        setStats({
          totalPaid,
          paymentsCount: completedPayments.length,
          upcomingPayments
        });
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(payment => payment.status === filter);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { text: 'Completed', class: 'status-completed' },
      scheduled: { text: 'Scheduled', class: 'status-scheduled' },
      failed: { text: 'Failed', class: 'status-failed' },
      pending: { text: 'Pending', class: 'status-pending' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return <Loader fullPage message="Loading your payments..." />;
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>Payments</h1>
        <Link to="/payments/new" className="btn btn-primary">
          + New Payment
        </Link>
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
                <div className="table-cell">Amount</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Reference</div>
                <div className="table-cell">Actions</div>
              </div>
            </div>
            <div className="table-body">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="table-row">
                  <div className="table-cell" data-label="Date & Time">
                    {formatDate(payment.date)}
                  </div>
                  <div className="table-cell" data-label="Description">
                    <div className="payment-description">
                      <div className="payment-creditor">{payment.creditorName}</div>
                      <div className="payment-method">{payment.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="table-cell amount" data-label="Amount">
                    ${payment.amount.toFixed(2)}
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
