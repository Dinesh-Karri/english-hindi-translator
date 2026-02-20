import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVolumeUp, FaMicrophone, FaCopy, FaDownload, FaStop } from 'react-icons/fa';
import { translateText, textToSpeech, getModels } from '../services/api';
import './Translation.css';

const Translation = () => {
  const [englishText, setEnglishText] = useState('');
  const [hindiText, setHindiText] = useState('');
  const [selectedModel, setSelectedModel] = useState('nllb');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [recording, setRecording] = useState(false);
  const [bleuScore, setBleuScore] = useState(null);
  const [meteorScore, setMeteorScore] = useState(null);
  const [modelUsed, setModelUsed] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);
  const [playingEnglish, setPlayingEnglish] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await getModels();
      setModels(Object.keys(data.models || {}));
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleTranslate = async () => {
    if (!englishText.trim()) return;

    setLoading(true);
    setHindiText('');
    setBleuScore(null);
    setMeteorScore(null);
    try {
      const result = await translateText(englishText, selectedModel);
      if (result.error) {
        setHindiText(`Error: ${result.error}`);
      } else {
        setHindiText(result.translation || '');
        setTimeTaken(result.time_taken || 0);
        setModelUsed(result.model_used || selectedModel);
        // Live metrics from backend
        if (result.bleu !== undefined) setBleuScore(result.bleu);
        if (result.meteor !== undefined) setMeteorScore(result.meteor);
      }
    } catch (error) {
      setHindiText(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Speaker: Play Hindi translation using backend TTS (gTTS) ───
  const handlePlayAudio = async () => {
    if (!hindiText.trim() || playingAudio) return;

    try {
      setPlayingAudio(true);
      const audioBlob = await textToSpeech(hindiText);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.play();
    } catch (error) {
      setPlayingAudio(false);
      alert('Error playing audio: ' + error.message);
    }
  };

  // ─── Speaker: Play English input using browser SpeechSynthesis ───
  const handlePlayEnglish = () => {
    if (!englishText.trim() || playingEnglish) return;

    try {
      setPlayingEnglish(true);
      const utterance = new SpeechSynthesisUtterance(englishText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setPlayingEnglish(false);
      utterance.onerror = () => setPlayingEnglish(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setPlayingEnglish(false);
      alert('Speech synthesis not supported in this browser.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(hindiText);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([hindiText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Mic: Web Speech API for real-time speech recognition ───
  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setEnglishText(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setRecording(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions.');
      }
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return '#10b981';
    if (score >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.7) return 'Excellent';
    if (score >= 0.4) return 'Good';
    if (score >= 0.2) return 'Fair';
    return 'Low';
  };

  return (
    <div className="translation-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="translation-wrapper"
      >
        <h1 className="page-title">🌐 English → Hindi Translation</h1>

        <div className="model-selector">
          <label>Select Model:</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map(model => (
              <option key={model} value={model}>{model.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="translation-panels">
          <div className="input-panel">
            <h3>English Input</h3>
            <textarea
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              placeholder="Type or speak English text..."
              rows="8"
            />
            <div className="input-actions">
              <button
                className={`btn btn-mic ${recording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {recording ? <FaStop /> : <FaMicrophone />} {recording ? 'Stop Recording' : 'Start Mic'}
              </button>
              <button
                className="btn btn-secondary btn-speak-english"
                onClick={handlePlayEnglish}
                disabled={!englishText.trim() || playingEnglish}
              >
                <FaVolumeUp /> {playingEnglish ? 'Playing...' : 'Listen'}
              </button>
            </div>
          </div>

          <div className="output-panel">
            <h3>Hindi Translation</h3>
            <div className="output-box">
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <span>Translating...</span>
                </div>
              ) : (
                <div className="hindi-text">{hindiText || 'Translation will appear here...'}</div>
              )}
            </div>
            {timeTaken > 0 && (
              <div className="stats">
                <span>⏱️ Time: {timeTaken}s</span>
                <span>🤖 Model: {(modelUsed || selectedModel).toUpperCase()}</span>
              </div>
            )}
            <div className="output-actions">
              <button onClick={handleTranslate} className="btn btn-primary" disabled={loading || !englishText.trim()}>
                {loading ? 'Translating...' : 'Translate'}
              </button>
              <button onClick={handlePlayAudio} className="btn btn-secondary" disabled={!hindiText || playingAudio}>
                <FaVolumeUp /> {playingAudio ? 'Playing...' : 'Play Audio'}
              </button>
              <button onClick={handleCopy} className="btn btn-secondary" disabled={!hindiText}>
                <FaCopy /> Copy
              </button>
              <button onClick={handleDownload} className="btn btn-secondary" disabled={!hindiText}>
                <FaDownload /> Download
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Section */}
        <AnimatePresence>
          {(bleuScore !== null || meteorScore !== null) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="live-metrics-section"
            >
              <h3 className="metrics-title">📊 Live Translation Metrics</h3>
              <div className="metrics-grid">
                {bleuScore !== null && (
                  <motion.div
                    className="metric-card"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <div className="metric-label">BLEU Score</div>
                    <div
                      className="metric-value"
                      style={{ color: getScoreColor(bleuScore) }}
                    >
                      {(bleuScore * 100).toFixed(2)}%
                    </div>
                    <div className="metric-bar">
                      <motion.div
                        className="metric-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(bleuScore * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: getScoreColor(bleuScore) }}
                      />
                    </div>
                    <div className="metric-quality" style={{ color: getScoreColor(bleuScore) }}>
                      {getScoreLabel(bleuScore)}
                    </div>
                  </motion.div>
                )}
                {meteorScore !== null && (
                  <motion.div
                    className="metric-card"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  >
                    <div className="metric-label">METEOR Score</div>
                    <div
                      className="metric-value"
                      style={{ color: getScoreColor(meteorScore) }}
                    >
                      {(meteorScore * 100).toFixed(2)}%
                    </div>
                    <div className="metric-bar">
                      <motion.div
                        className="metric-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(meteorScore * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: getScoreColor(meteorScore) }}
                      />
                    </div>
                    <div className="metric-quality" style={{ color: getScoreColor(meteorScore) }}>
                      {getScoreLabel(meteorScore)}
                    </div>
                  </motion.div>
                )}
                <motion.div
                  className="metric-card"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <div className="metric-label">Latency</div>
                  <div className="metric-value" style={{ color: timeTaken < 3 ? '#10b981' : timeTaken < 8 ? '#f59e0b' : '#ef4444' }}>
                    {timeTaken}s
                  </div>
                  <div className="metric-bar">
                    <motion.div
                      className="metric-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((1 / (timeTaken || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: timeTaken < 3 ? '#10b981' : timeTaken < 8 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <div className="metric-quality" style={{ color: timeTaken < 3 ? '#10b981' : timeTaken < 8 ? '#f59e0b' : '#ef4444' }}>
                    {timeTaken < 3 ? 'Fast' : timeTaken < 8 ? 'Moderate' : 'Slow'}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Translation;
