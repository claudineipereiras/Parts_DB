import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Users from './pages/Users';
import Parts from './pages/Parts';
import Escooters from './pages/Escooters';
import Diagrams from './pages/Diagrams';

// A simple PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const Dashboard = () => (
  <div>
    <h2>Welcome to Escooter Database</h2>
    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Select an option from the sidebar to begin.</p>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="parts" element={<Parts />} />
          <Route path="escooters" element={<Escooters />} />
          <Route path="diagrams" element={<Diagrams />} />
          <Route path="settings" element={<div>System Settings Coming Soon</div>} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
