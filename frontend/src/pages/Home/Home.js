import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Take Control of Your Debts</h1>
          <p>Consolidate, track, and pay off your debts in one simple platform</p>
          
          {!user ? (
            <div className="cta-buttons">
              <Link to="/login" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          ) : (
            <div className="cta-buttons">
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
        <div className="hero-image">
          {/* Placeholder for an illustration */}
          <div className="illustration">📊</div>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Debt Manager?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Track All Debts</h3>
            <p>View all your debts in one place, including credit cards, loans, and bills.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Easy Payments</h3>
            <p>Make payments directly from the app and never miss a due date.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Smart Insights</h3>
            <p>Get personalized recommendations to pay off debts faster and save on interest.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Your Accounts</h3>
            <p>Securely link your credit cards, loans, and bank accounts.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>View Your Dashboard</h3>
            <p>See all your debts in one place with due dates and payment options.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Make Payments</h3>
            <p>Pay your debts directly through the app and track your progress.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Take Control of Your Debts?</h2>
        <p>Join thousands of users who have already simplified their debt management.</p>
        <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary">
          {user ? 'Go to Dashboard' : 'Get Started for Free'}
        </Link>
      </section>
    </div>
  );
};

export default Home;
