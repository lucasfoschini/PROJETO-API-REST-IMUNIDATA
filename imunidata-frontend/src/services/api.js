import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:8080/' : 'https://imunidata-back.onrender.com/';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const vacinacaoService = {
  /** Busca todos ou filtra por vacina e/ou estado */
  listar: (vacina = '', estado = '', dose = '') => {
    const params = {};
    if (vacina) params.vacina = vacina;
    if (estado) params.estado = estado;
    if (dose) params.dose = dose;
    return api.get('/api/vacinacao', { params });
  },

  buscarPorId: (id) => api.get(`/api/vacinacao/${id}`),

  cadastrar: (dados) => api.post('/api/vacinacao', dados),

  atualizar: (id, dados) => api.put(`/api/vacinacao/${id}`, dados),

  excluir: (id) => api.delete(`/api/vacinacao/${id}`),

  resumoPorEstado: () => api.get('/api/vacinacao/resumo/por-estado'),

  resumoPorVacina: () => api.get('/api/vacinacao/resumo/por-vacina'),

  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/vacinacao/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
