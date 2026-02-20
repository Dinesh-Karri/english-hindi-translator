import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLanguage, FaChartBar, FaBook, FaHistory } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hero-section"
      >
        <h1 className="hero-title">
          🌐 AutoLingo
        </h1>
        <p className="hero-subtitle">
          AI-Powered English → Hindi Translation System
        </p>
        <p className="hero-description">
          Transform English text into fluent Hindi instantly using cutting-edge AI translation models.
        </p>
        <div className="hero-buttons">
          <Link to="/translate" className="btn btn-primary">
            <FaLanguage /> Start Translation
          </Link>
          <Link to="/statistics" className="btn btn-secondary">
            <FaChartBar /> View Statistics
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="features-section"
      >
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FaLanguage className="feature-icon" />
            <h3>Multi-Model Translation</h3>
            <p>Choose from NLLB, mT5, Marian, or GRU models for accurate translations</p>
          </div>
          <div className="feature-card">
            <FaChartBar className="feature-icon" />
            <h3>Performance Analytics</h3>
            <p>Compare model accuracy, BLEU scores, and latency metrics</p>
          </div>
          <div className="feature-card">
            <FaBook className="feature-icon" />
            <h3>Evaluation Dataset</h3>
            <p>View and explore our curated English-Hindi translation dataset</p>
          </div>
          <div className="feature-card">
            <FaHistory className="feature-icon" />
            <h3>Translation History</h3>
            <p>Track your past translations and export them for reference</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;

