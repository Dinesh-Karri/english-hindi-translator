import { motion } from 'framer-motion';
import './Mentor.css';

const Mentor = () => {
  return (
    <div className="mentor-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mentor-wrapper"
      >
        <h1 className="page-title">🧠 Mentor Information</h1>
        
        <div className="mentor-card">
          <div className="mentor-image">
            <div className="mentor-avatar">👨‍🏫</div>
          </div>
          <div className="mentor-info">
            <h2>Guided by: Dr. [Mentor Name]</h2>
            <p className="mentor-title">Professor, Department of CSE (Data Science)</p>
            <p className="mentor-institution">Narasaraopet Engineering College</p>
            <p className="mentor-description">
              "Guided with excellence and expertise in AI and NLP Research. 
              This project demonstrates the application of state-of-the-art 
              transformer models for multilingual translation systems."
            </p>
          </div>
        </div>

        <div className="project-info">
          <h3>Project Details</h3>
          <p>
            <strong>Project Name:</strong> AutoLingo: AI-Powered English → Hindi Translation System
          </p>
          <p>
            <strong>Institution:</strong> Narasaraopet Engineering College
          </p>
          <p>
            <strong>Department:</strong> Computer Science and Engineering (Data Science)
          </p>
          <p>
            <strong>Academic Year:</strong> 2024-2025
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Mentor;

