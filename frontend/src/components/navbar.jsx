// Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import '../assets/css/navbar.css';
import { useAuthStore } from '../store/useAuthStore';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { authUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/autoliv') {
    return (
      <header className={`navbar ${menuOpen ? 'menu-open' : ''}`}>
        <div className="navbar-container">
          <a
            href="#home"
            className="navbar-logo"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('home');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <img src={logo} alt="Company Logo" />
          </a>

          <div
            className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>

          <nav className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
            <ul>
              {['home', 'about', 'services', 'products', 'contact'].map((section) => (
                <li key={section}>
                  <a
                    href={`#${section}`}
                    className={`nav-link ${activeSection === section ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(section);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      setActiveSection(section);
                      setMenuOpen(false);
                    }}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-actions">
            <Link to="/signin" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>
    );
  }
  if (!authUser) return null; // Only show admin navbar if logged in

  const getNavItems = () => {
    const role = authUser?.role;
    
    if (role === 'admin') {
      return [
        { path: '/Home', label: 'Dashboard' },
        { path: '/fabrication', label: 'Fabrication' },
        { path: '/production', label: 'Production' },
        { path: '/adminpage', label: 'Add Products' },
        { path: '/stockmanagement', label: 'Manage Stock' },
        { path: '/admin', label: 'Manage Employees' },
        { path: '/reporting', label: 'Reporting' },
      ];
    }
    
    if (role === 'manager') {
      return [
        { path: '/stockmanagement', label: 'Manage Stock' },
        { path: '/fabrication', label: 'Fabrication' },
        { path: '/production', label: 'Production' },
        { path: '/reporting', label: 'Reporting' },
      ];
    }
    
    // Default for operator and others
    return [
      { path: '/fabrication', label: 'Fabrication' },
      { path: '/reporting', label: 'Reporting' },
    ];
  };

  const navItems = getNavItems();

  const getHomePath = () => {
    const role = authUser?.role;
    if (role === 'admin') return '/Home';
    if (role === 'manager') return '/stockmanagement';
    return '/fabrication';
  };

  return (
    <header className={`navbar ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to={getHomePath()} className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="Company Logo" />
        </Link>

        <div
          className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        <nav className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-actions">
          <div className="user-profile-wrapper">
            <Link to="/profile" className="user-profile-btn">
              <div className="profile-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="profile-info">
                <span className="profile-name">{authUser?.name || 'User'}</span>
                <span className="profile-role">{authUser?.role || 'Admin'}</span>
              </div>
              <i className="fas fa-chevron-down dropdown-arrow"></i>
            </Link>
            
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item">
                <i className="fas fa-user"></i>
                <span>My Profile</span>
              </Link>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item logout-btn"
                onClick={() => {
                  logout();
                  navigate('/signin');
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;