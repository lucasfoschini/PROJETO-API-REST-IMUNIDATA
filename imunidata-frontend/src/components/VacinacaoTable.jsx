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
    BCG: '#48bb78',
    Gripe: '#4299e1',
    Polio: '#ed8936',
    Pentavalente: '#9f7aea',
    Varicela: '#f687b3',
    'Hepatite B': '#667eea',
    Rotavírus: '#fc8181',
    Pneumocócica: '#68d391',
  };
  return cores[vacina] || '#a0aec0';
}

const styles = {
  wrapper: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' },
  header: { padding: '14px 20px', borderBottom: '1px solid #e2e8f0' },
  total: { fontSize: 13, color: '#718096', fontWeight: 600 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead: { background: '#2b6cb0' },
  th: { padding: '12px 16px', color: '#fff', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center' },
  trPar: { background: '#fff' },
  trImpar: { background: '#f7fafc' },
  td: { padding: '10px 16px', borderBottom: '1px solid #e2e8f0', color: '#2d3748', textAlign: 'center' },
  badge: {
    background: '#ebf4ff',
    color: '#2b6cb0',
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
  },
  acoes: { display: 'flex', gap: 6, justifyContent: 'center' },
  btnEditar: { background: '#ecc94b', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  btnExcluir: { background: '#fc8181', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  loading: { textAlign: 'center', padding: 40, color: '#718096', fontSize: 16 },
  vazio: {
    textAlign: 'center',
    padding: 40,
    color: '#a0aec0',
    fontSize: 15,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  btnCancelar: {
    background: '#e2e8f0',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#4a5568',
  },
  btnConfirmar: {
    background: '#fb5050',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#fff',
  },
};
