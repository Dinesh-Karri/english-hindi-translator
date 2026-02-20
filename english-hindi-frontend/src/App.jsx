import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Translation from './pages/Translation';
import Statistics from './pages/Statistics';
import Dataset from './pages/Dataset';
import Mentor from './pages/Mentor';
import About from './pages/About';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/translate" element={<Translation />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/dataset" element={<Dataset />} />
                <Route path="/mentor" element={<Mentor />} />
                <Route path="/about" element={<About />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="footer">
              <p>Copyright © 2025 AutoLingo. Made with ❤️ for AI Translation</p>
              <div className="footer-links">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://researchgate.net" target="_blank" rel="noopener noreferrer">ResearchGate</a>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
