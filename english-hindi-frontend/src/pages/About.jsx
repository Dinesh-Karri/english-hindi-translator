import { motion } from 'framer-motion';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="about-wrapper"
      >
        <h1 className="page-title">🧮 About AutoLingo</h1>

        <section className="about-section">
          <h2>Project Overview</h2>
          <p>
            AutoLingo is an intelligent, multilingual AI translator that automatically converts 
            English text or speech into accurate Hindi translations using state-of-the-art 
            Transformer and Deep Learning models. The system ensures correct, natural, and 
            fluent Hindi output for any given English text.
          </p>
        </section>

        <section className="about-section">
          <h2>Objectives</h2>
          <ul>
            <li>Build a smart translation system using multiple AI models</li>
            <li>Compare performance of different translation models (NLLB, mT5, Marian, GRU)</li>
            <li>Evaluate translation quality using BLEU and METEOR metrics</li>
            <li>Provide a user-friendly interface with analytics dashboard</li>
            <li>Enable speech-to-text and text-to-speech capabilities</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Architecture</h2>
          <div className="architecture-diagram">
            <div className="arch-layer">
              <h3>Frontend (React + Vite)</h3>
              <p>User Interface, Charts, Authentication, Theme Toggle</p>
            </div>
            <div className="arch-arrow">↓</div>
            <div className="arch-layer">
              <h3>Backend (FastAPI)</h3>
              <p>REST API, Model Management, Translation Engine</p>
            </div>
            <div className="arch-arrow">↓</div>
            <div className="arch-layer">
              <h3>AI Models</h3>
              <p>NLLB, mT5, Marian, GRU (Hugging Face Transformers)</p>
            </div>
            <div className="arch-arrow">↓</div>
            <div className="arch-layer">
              <h3>Output</h3>
              <p>Hindi Translation + Audio + Metrics</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Tools & Technologies</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>Frontend</h3>
              <ul>
                <li>React</li>
                <li>Vite</li>
                <li>React Router</li>
                <li>Recharts</li>
                <li>Framer Motion</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            <div className="tool-card">
              <h3>Backend</h3>
              <ul>
                <li>FastAPI</li>
                <li>PyTorch</li>
                <li>Transformers (Hugging Face)</li>
                <li>gTTS</li>
                <li>SpeechRecognition</li>
                <li>Uvicorn</li>
              </ul>
            </div>
            <div className="tool-card">
              <h3>AI Models</h3>
              <ul>
                <li>NLLB (Meta AI)</li>
                <li>mT5 (Google)</li>
                <li>MarianMT (Helsinki NLP)</li>
                <li>GRU (Baseline)</li>
              </ul>
            </div>
            <div className="tool-card">
              <h3>Evaluation</h3>
              <ul>
                <li>BLEU Score</li>
                <li>METEOR Score</li>
                <li>Accuracy Metrics</li>
                <li>Latency Measurement</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Project Team</h2>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">👨‍💻</div>
              <h3>Development Team</h3>
              <p>Full Stack Development</p>
              <p>AI & NLP Research</p>
              <div className="team-links">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default About;

