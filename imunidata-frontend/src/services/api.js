import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
};
