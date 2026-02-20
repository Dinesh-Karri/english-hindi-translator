import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaDownload } from 'react-icons/fa';
import { getHistory, clearHistory } from '../services/api';
import './History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await clearHistory();
        setHistory([]);
        alert('History cleared successfully!');
      } catch (error) {
        alert('Error clearing history: ' + error.message);
      }
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      alert('No history to export');
      return;
    }

    const csv = [
      ['English', 'Hindi', 'Model', 'Time (s)', 'Date'],
      ...history.map(item => [
        item.english,
        item.hindi,
        item.model,
        item.time_taken,
        item.timestamp
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading-container">Loading history...</div>;
  }

  return (
    <div className="history-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="history-wrapper"
      >
        <div className="history-header">
          <h1 className="page-title">🕰 Translation History</h1>
          <div className="history-actions">
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <FaDownload /> Export CSV
            </button>
            <button onClick={handleClearHistory} className="btn btn-danger">
              <FaTrash /> Clear History
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-history">
            <p>No translation history yet. Start translating to see your history here!</p>
          </div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>English</th>
                  <th>Hindi</th>
                  <th>Model</th>
                  <th>Time (s)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.english}</td>
                    <td>{item.hindi}</td>
                    <td><span className="model-badge">{item.model.toUpperCase()}</span></td>
                    <td>{item.time_taken}</td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default History;

