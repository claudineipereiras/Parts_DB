import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, Map, Settings, Users, LogOut, Menu } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          Escooter Parts DB
        </div>
        
        <ul className="nav-menu">
          <li>
            <NavLink to="/parts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Package size={20} />
              Parts
            </NavLink>
          </li>
          <li>
            <NavLink to="/escooters" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Package size={20} style={{ opacity: 0.5 }} />
              Escooters
            </NavLink>
          </li>
          <li>
            <NavLink to="/diagrams" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Map size={20} />
              Diagrams
            </NavLink>
          </li>
        </ul>
        
        <div style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Settings
        </div>
        
        <ul className="nav-menu" style={{ flex: 0 }}>
          <li>
            <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Settings size={20} />
              System settings
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              User settings
            </NavLink>
          </li>
          <li style={{ marginTop: 'auto', paddingTop: '12px' }}>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="nav-item" 
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <LogOut size={20} color="var(--danger)" />
              <span style={{ color: 'var(--danger)' }}>Log out</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '360px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Log out</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You are leaving the system. Are you sure?</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger)' }} onClick={handleLogout}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
