import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDownload } from 'react-icons/fa';
import { getDataset } from '../services/api';
import './Dataset.css';

const Dataset = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataset();
  }, []);

  const loadDataset = async () => {
    try {
      const data = await getDataset();
      setDataset(data.dataset || []);
    } catch (error) {
      console.error('Error loading dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csv = [
      ['English', 'Hindi'],
      ...dataset.map(item => [item.english, item.hindi])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation_dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading-container">Loading dataset...</div>;
  }

  return (
    <div className="dataset-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dataset-wrapper"
      >
        <div className="dataset-header">
          <h1 className="page-title">📚 Evaluation Dataset</h1>
          <button onClick={handleDownloadCSV} className="btn btn-primary">
            <FaDownload /> Download CSV
          </button>
        </div>

        <div className="dataset-info">
          <p>Total Samples: <strong>{dataset.length}</strong></p>
          <p>This dataset is used to evaluate translation models for accuracy and performance.</p>
        </div>

        <div className="dataset-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>English</th>
                <th>Hindi</th>
              </tr>
            </thead>
            <tbody>
              {dataset.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.english}</td>
                  <td>{item.hindi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dataset;

