const VACINAS = ['', 'BCG', 'Gripe', 'Polio', 'Pentavalente', 'Varicela', 'Hepatite B', 'Rotavírus', 'Pneumocócica'];
const ESTADOS = ['','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const DOSES = ['', '1ª Dose', '2ª Dose', '3ª Dose', 'Reforço'];

export default function Filtros({ vacina, estado, dose, onChange, onLimpar }) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>🔍 Filtrar por:</span>

      <select
        style={styles.select}
        value={vacina}
        onChange={(e) => onChange('vacina', e.target.value)}
      >
        <option value="">Vacinas</option>
        {VACINAS.filter(Boolean).map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <select
        style={styles.select}
        value={estado}
        onChange={(e) => onChange('estado', e.target.value)}
      >
        <option value="">Estados</option>
        {ESTADOS.filter(Boolean).map(uf => <option key={uf} value={uf}>{uf}</option>)}
      </select>

      <select
        style={styles.select}
        value={dose}
        onChange={(e) => onChange('dose', e.target.value)}
      >
        <option value="">Dose</option>
        {DOSES.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      {(vacina || estado || dose) && (
        <button style={styles.btnLimpar} onClick={onLimpar}>
          ✕ Limpar filtros
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    padding: '14px 20px',
    borderRadius: 10,
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  label: { fontWeight: 600, color: '#4a5568', fontSize: 14 },
  select: {
    padding: '7px 12px',
    border: '1px solid #cbd5e0',
    borderRadius: 6,
    fontSize: 14,
    background: '#f7fafc',
    cursor: 'pointer',
  },
  btnLimpar: {
    background: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  },
};
