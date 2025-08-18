import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Payments from './pages/Payments/Payments';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login/Login';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import './App.css';

function AppRoutes() {
  const location = useLocation();
  
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <Payments />
              </PrivateRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
