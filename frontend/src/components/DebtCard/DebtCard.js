import React from 'react';
import { Link } from 'react-router-dom';
import './DebtCard.css';

const DebtCard = ({ debt }) => {
  const {
    id,
    creditorName,
    originalAmount,
    currentBalance,
    interestRate,
    minimumPayment,
    dueDate,
    status
  } = debt;

  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'Active',
      paid: 'Paid',
      overdue: 'Overdue',
      in_collection: 'In Collection'
    };

    const statusClass = {
      active: 'status-active',
      paid: 'status-paid',
      overdue: 'status-overdue',
      in_collection: 'status-collection'
    };

    return (
      <span className={`status-badge ${statusClass[status] || ''}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  return (
    <div className="debt-card">
      <div className="debt-card-header">
        <h3>{creditorName}</h3>
        {getStatusBadge(status)}
      </div>
      
      <div className="debt-card-details">
        <div className="debt-detail">
          <span className="label">Current Balance:</span>
          <span className="value">${currentBalance.toFixed(2)}</span>
        </div>
        
        <div className="debt-detail">
          <span className="label">Original Amount:</span>
          <span className="value">${originalAmount.toFixed(2)}</span>
        </div>
        
        <div className="debt-detail">
          <span className="label">Interest Rate:</span>
          <span className="value">{interestRate}%</span>
        </div>
        
        <div className="debt-detail">
          <span className="label">Minimum Payment:</span>
          <span className="value">${minimumPayment.toFixed(2)}</span>
        </div>
        
        <div className="debt-detail">
          <span className="label">Due Date:</span>
          <span className="value">{new Date(dueDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="debt-card-actions">
        <Link to={`/debts/${id}`} className="btn btn-primary">
          View Details
        </Link>
        <Link to={`/payments/new?debtId=${id}`} className="btn btn-secondary">
          Make Payment
        </Link>
      </div>
    </div>
  );
};

export default DebtCard;
