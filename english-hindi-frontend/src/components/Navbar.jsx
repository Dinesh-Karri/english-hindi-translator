import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaHome, FaLanguage, FaChartBar, FaBook, FaUser, FaInfoCircle, FaHistory, FaCog, FaMoon, FaSun, FaSignOutAlt, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const menuRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🌐</span>
          <span className="logo-text">AutoLingo</span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-menu desktop-menu">
          <Link to="/" className="nav-link">
            <FaHome /> <span>Home</span>
          </Link>
          <Link to="/translate" className="nav-link">
            <FaLanguage /> <span>Translate</span>
          </Link>
          <Link to="/statistics" className="nav-link">
            <FaChartBar /> <span>Statistics</span>
          </Link>
          <Link to="/history" className="nav-link">
            <FaHistory /> <span>History</span>
          </Link>
          
          {/* More Dropdown */}
          <div className="dropdown-container" ref={moreRef}>
            <button 
              className="nav-link dropdown-trigger"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
            >
              <FaBars /> <span>More</span> <FaChevronDown className="chevron" />
            </button>
            {isMoreOpen && (
              <div className="dropdown-menu">
                <Link to="/dataset" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
                  <FaBook /> Dataset
                </Link>
                <Link to="/mentor" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
                  <FaUser /> Mentor
                </Link>
                <Link to="/about" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
                  <FaInfoCircle /> About
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
                  <FaCog /> Settings
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="navbar-actions">
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">{user?.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                <FaSignOutAlt /> <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu" ref={menuRef}>
          <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaHome /> Home
          </Link>
          <Link to="/translate" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaLanguage /> Translate
          </Link>
          <Link to="/statistics" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaChartBar /> Statistics
          </Link>
          <Link to="/history" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaHistory /> History
          </Link>
          <Link to="/dataset" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaBook /> Dataset
          </Link>
          <Link to="/mentor" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaUser /> Mentor
          </Link>
          <Link to="/about" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaInfoCircle /> About
          </Link>
          <Link to="/settings" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            <FaCog /> Settings
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

