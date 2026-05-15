import { useState } from 'react';
import { vacinacaoService } from '../services/api';

export default function VacinacaoTable({ registros, onEditar, onExcluir, loading }) {
  const [registroParaExcluir, setRegistroParaExcluir] = useState(null);

  const handleExcluir = (id) => {
    setRegistroParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!registroParaExcluir) return;
    try {
      await vacinacaoService.excluir(registroParaExcluir);
      setRegistroParaExcluir(null);
      onExcluir();
    } catch (err) {
      if (err.response?.status === 404) {
        alert('Registro não encontrado (404 Not Found).');
      } else {
        alert('Erro ao excluir o registro.');
      }
      setRegistroParaExcluir(null);
    }
  };

  const cancelarExclusao = () => {
    setRegistroParaExcluir(null);
  };

  if (loading) {
    return <div style={styles.loading}>Carregando registros...</div>;
  }

  if (registros.length === 0) {
    return (
      <div style={styles.vazio}>
        Nenhum registro encontrado para os filtros aplicados.
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.total}>{registros.length} registro(s) encontrado(s)</span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Município</th>
              <th style={styles.th}>UF</th>
              <th style={styles.th}>Vacina</th>
              <th style={styles.th}>Dose</th>
              <th style={styles.th}>Qtd. Aplicada</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, idx) => (
              <tr key={r.id} style={idx % 2 === 0 ? styles.trPar : styles.trImpar}>
                <td style={styles.td}>{r.municipio}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <span style={styles.badge}>{r.estado}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.vacinaBadge, background: corVacina(r.vacina) }}>
                    {r.vacina}
                  </span>
                </td>
                <td style={styles.td}>{r.dose}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {r.quantidadeAplicada.toLocaleString('pt-BR')}
                </td>
                <td style={styles.td}>
                  {new Date(r.dataRegistro + 'T00:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td style={styles.td}>
                  <div style={styles.acoes}>
                    <button style={styles.btnEditar} onClick={() => onEditar(r)}>✏️</button>
                    <button style={styles.btnExcluir} onClick={() => handleExcluir(r.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {registroParaExcluir && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0, color: '#fb5050' }}>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir permanentemente o registro de vacinação?</p>
            <div style={styles.modalActions}>
              <button style={styles.btnCancelar} onClick={cancelarExclusao}>Cancelar</button>
              <button style={styles.btnConfirmar} onClick={confirmarExclusao}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function corVacina(vacina) {
  const cores = {
    BCG: '#22c55e',
    Gripe: '#0ea5e9',
    Polio: '#f97316',
    Pentavalente: '#0f766e',
    Varicela: '#f43f5e',
    'Hepatite B': '#f59e0b',
    Rotavírus: '#ef4444',
    Pneumocócica: '#84cc16',
  };
  return cores[vacina] || '#a0aec0';
}

const styles = {
  wrapper: { background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid var(--stroke)' },
  header: { padding: '14px 20px', borderBottom: '1px solid var(--stroke)', background: 'rgba(15, 118, 110, 0.04)' },
  total: { fontSize: 13, color: 'var(--muted)', fontWeight: 600 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', minWidth: 920, borderCollapse: 'collapse', fontSize: 14 },
  thead: { background: 'linear-gradient(90deg, #0f172a, #0f766e)' },
  th: { padding: '12px 16px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center' },
  trPar: { background: '#fff' },
  trImpar: { background: '#f8fafc' },
  td: { padding: '10px 16px', borderBottom: '1px solid var(--stroke)', color: '#1f2937', textAlign: 'center' },
  badge: {
    background: '#ecfeff',
    color: '#0f766e',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 12,
  },
  vacinaBadge: {
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 12,
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.12)',
  },
  acoes: { display: 'flex', gap: 6, justifyContent: 'center' },
  btnEditar: { background: '#fbbf24', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 },
  btnExcluir: { background: '#f87171', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 },
  loading: { textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 16 },
  vazio: {
    textAlign: 'center',
    padding: 40,
    color: 'var(--muted)',
    fontSize: 15,
    background: 'var(--card)',
    borderRadius: 18,
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--stroke)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--card)',
    padding: '24px',
    borderRadius: '14px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: 'var(--shadow-md)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  btnCancelar: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#334155',
  },
  btnConfirmar: {
    background: '#ef4444',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#fff',
  },
};
