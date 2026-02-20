import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const translateText = async (text, model = 'nllb') => {
  const response = await api.post(`/translate?model=${model}`, { text });
  return response.data;
};

export const textToSpeech = async (text) => {
  const response = await api.post('/tts', { text }, { responseType: 'blob' });
  return response.data;
};

export const speechToText = async (audioFile) => {
  const formData = new FormData();
  formData.append('file', audioFile);
  const response = await api.post('/speech', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const evaluateModel = async (model) => {
  const response = await api.get(`/evaluate?model=${model}`);
  return response.data;
};

export const compareModels = async () => {
  const response = await api.get('/compare');
  return response.data;
};

export const getModels = async () => {
  const response = await api.get('/models');
  return response.data;
};

export const getDataset = async () => {
  const response = await api.get('/dataset');
  return response.data;
};

export const getHistory = async (limit = 50) => {
  const response = await api.get(`/history?limit=${limit}`);
  return response.data;
};

export const clearHistory = async () => {
  const response = await api.delete('/history');
  return response.data;
};

export default api;

