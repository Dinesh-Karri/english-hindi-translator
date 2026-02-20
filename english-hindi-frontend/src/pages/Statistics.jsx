import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { compareModels } from '../services/api';
import './Statistics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Statistics = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const data = await compareModels();
      setComparisonData(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      // If 404, no translations yet — set empty state instead of null
      if (error.response && error.response.status === 404) {
        setComparisonData({ models: {}, best_model: null, summary: { total_models: 0, total_samples: 0 } });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading statistics...</div>;
  }

  if (!comparisonData) {
    return (
      <div className="statistics-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="statistics-wrapper"
        >
          <h1 className="page-title">📊 Statistics Dashboard</h1>
          <div className="empty-stats-card">
            <div className="empty-stats-icon">📈</div>
            <h2>No Translation Data Yet</h2>
            <p>Start translating sentences to see live model performance metrics here!</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Each translation generates BLEU, METEOR, accuracy, and latency scores.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={loadComparison}>
              Refresh
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const models = Object.keys(comparisonData.models || {});

  if (models.length === 0 || !models.some(m => comparisonData.models[m].total_samples > 0)) {
    return (
      <div className="statistics-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="statistics-wrapper"
        >
          <h1 className="page-title">📊 Statistics Dashboard</h1>
          <div className="empty-stats-card">
            <div className="empty-stats-icon">📈</div>
            <h2>No Translation Data Yet</h2>
            <p>Start translating sentences to see live model performance metrics here!</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Each translation generates BLEU, METEOR, accuracy, and latency scores.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  const chartData = models.map(model => ({
    name: model.toUpperCase(),
    accuracy: comparisonData.models[model].accuracy,
    bleu: (comparisonData.models[model].bleu * 100).toFixed(1),
    meteor: (comparisonData.models[model].meteor * 100).toFixed(1),
    latency: comparisonData.models[model].latency,
  }));

  const pieData = models.map(model => ({
    name: model.toUpperCase(),
    value: comparisonData.models[model].accuracy,
  }));

  return (
    <div className="statistics-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="statistics-wrapper"
      >
        <h1 className="page-title">📊 Statistics Dashboard</h1>

        {comparisonData.best_model && (
          <div className="best-model-card">
            <h2>🥇 Best Performing Model</h2>
            <div className="best-model-info">
              <span className="model-name">{comparisonData.best_model.name.toUpperCase()}</span>
              <span className="model-stats">
                Accuracy: {comparisonData.best_model.accuracy}% |
                BLEU: {(comparisonData.best_model.bleu * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Accuracy Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Response Time (Latency)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>BLEU Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>BLEU Score Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bleu" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metrics-table">
          <h3>Detailed Metrics</h3>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy (%)</th>
                <th>BLEU Score</th>
                <th>METEOR Score</th>
                <th>Latency (s)</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model}>
                  <td>{model.toUpperCase()}</td>
                  <td>{comparisonData.models[model].accuracy}</td>
                  <td>{(comparisonData.models[model].bleu * 100).toFixed(2)}%</td>
                  <td>{(comparisonData.models[model].meteor * 100).toFixed(2)}%</td>
                  <td>{comparisonData.models[model].latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;

