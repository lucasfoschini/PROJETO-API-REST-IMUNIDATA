import { useState } from 'react';
import { vacinacaoService } from '../services/api';

const VACINAS = ['BCG', 'Gripe', 'Polio', 'Pentavalente', 'Varicela', 'Hepatite B', 'Rotavírus', 'Pneumocócica'];
const DOSES = ['1ª Dose', '2ª Dose', 'Reforço'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const campoVazio = {
  municipio: '',
  estado: '',
  vacina: '',
  dose: '',
  quantidadeAplicada: '',
  dataRegistro: '',
};

export default function VacinacaoForm({ onSalvo, registroParaEditar, aoFecharEdicao, onFeedback }) {
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
      const mensagemSucesso = editando
        ? 'Registro atualizado com sucesso!'
        : 'Registro cadastrado com sucesso!';
      onSalvo(mensagemSucesso);
      if (!editando) setForm(campoVazio);
      if (aoFecharEdicao) aoFecharEdicao();
    } catch (err) {
      const mensagemErro = err.response?.data?.erro || 'Erro ao salvar. Verifique os dados.';
      setErro(mensagemErro);
      onFeedback?.(mensagemErro, 'erro');
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
    background: 'var(--card)',
    borderRadius: 18,
    padding: '24px 28px',
    border: '1px solid var(--stroke)',
    boxShadow: 'var(--shadow-md)',
    marginBottom: 24,
  },
  titulo: { margin: '0 0 20px', fontSize: 20, color: 'var(--ink)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },
  campo: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.3 },
  input: {
    padding: '10px 12px',
    border: '1px solid var(--stroke)',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fff',
  },
  erro: {
    background: '#fff5f5',
    color: '#b42318',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 14,
  },
  botoes: { display: 'flex', gap: 12, marginTop: 20 },
  btnPrimary: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '11px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    borderRadius: 10,
    padding: '11px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
