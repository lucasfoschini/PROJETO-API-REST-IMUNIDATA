import { useState } from 'react';
import { vacinacaoService } from '../services/api';

const VACINAS = ['BCG', 'Gripe', 'Polio', 'Pentavalente', 'Varicela', 'Hepatite B', 'Rotavírus', 'Pneumocócica'];
const DOSES = ['1ª Dose', '2ª Dose', '3ª Dose', 'Reforço'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const campoVazio = {
  municipio: '',
  estado: '',
  vacina: '',
  dose: '',
  quantidadeAplicada: '',
  dataRegistro: '',
};

export default function VacinacaoForm({ onSalvo, registroParaEditar, aoFecharEdicao }) {
  const editando = !!registroParaEditar;

  const [form, setForm] = useState(
    editando
      ? { ...registroParaEditar, quantidadeAplicada: String(registroParaEditar.quantidadeAplicada) }
      : campoVazio
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const payload = {
      ...form,
      quantidadeAplicada: Number(form.quantidadeAplicada),
    };

    try {
      if (editando) {
        await vacinacaoService.atualizar(registroParaEditar.id, payload);
      } else {
        await vacinacaoService.cadastrar(payload);
      }
      onSalvo();
      if (!editando) setForm(campoVazio);
      if (aoFecharEdicao) aoFecharEdicao();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.titulo}>
        {editando ? '✏️ Editar Registro' : '➕ Novo Registro de Vacinação'}
      </h2>

      {erro && <div style={styles.erro}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          <div style={styles.campo}>
            <label style={styles.label}>Município *</label>
            <input
              style={styles.input}
              name="municipio"
              value={form.municipio}
              onChange={handleChange}
              placeholder="Ex: São Paulo"
              required
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Estado (UF) *</label>
            <select style={styles.input} name="estado" value={form.estado} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Tipo de Vacina *</label>
            <select style={styles.input} name="vacina" value={form.vacina} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {VACINAS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Dose *</label>
            <select style={styles.input} name="dose" value={form.dose} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {DOSES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Quantidade Aplicada *</label>
            <input
              style={styles.input}
              name="quantidadeAplicada"
              type="number"
              min="1"
              value={form.quantidadeAplicada}
              onChange={handleChange}
              placeholder="Ex: 500"
              required
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Data do Registro *</label>
            <input
              style={styles.input}
              name="dataRegistro"
              type="date"
              value={form.dataRegistro}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={styles.botoes}>
          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Salvando...' : editando ? '💾 Atualizar' : '💾 Cadastrar'}
          </button>
          {editando && (
            <button type="button" style={styles.btnSecondary} onClick={aoFecharEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: 24,
  },
  titulo: { margin: '0 0 20px', fontSize: 18, color: '#1a365d' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  campo: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#4a5568' },
  input: {
    padding: '8px 12px',
    border: '1px solid #cbd5e0',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  erro: {
    background: '#fff5f5',
    color: '#c53030',
    border: '1px solid #fc8181',
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 14,
  },
  botoes: { display: 'flex', gap: 12, marginTop: 20 },
  btnPrimary: {
    background: '#2b6cb0',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: 6,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
