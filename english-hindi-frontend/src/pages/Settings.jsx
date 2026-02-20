import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaMoon, FaSun } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="settings-wrapper"
      >
        <h1 className="page-title">⚙️ Settings</h1>

        <div className="settings-section">
          <h2>Theme</h2>
          <div className="theme-toggle">
            <label>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="toggle-slider">
                {theme === 'dark' ? <FaMoon /> : <FaSun />}
              </span>
              <span className="toggle-label">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>About</h2>
          <p>AutoLingo v1.0.0</p>
          <p>AI-Powered English → Hindi Translation System</p>
          <p style={{ marginTop: '1rem' }}>Made with ❤️ for AI-Powered Translation</p>
          <div className="developer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://researchgate.net" target="_blank" rel="noopener noreferrer">ResearchGate</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

