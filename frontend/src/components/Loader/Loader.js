import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', fullPage = false, message = 'Loading...' }) => {
  const sizeClass = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  }[size] || 'loader-medium';

  if (fullPage) {
    return (
      <div className="full-page-loader">
        <div className={`loader ${sizeClass}`}></div>
        {message && <div className="loader-message">{message}</div>}
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={`loader ${sizeClass}`}></div>
      {message && <div className="loader-message">{message}</div>}
    </div>
  );
};

export default Loader;
