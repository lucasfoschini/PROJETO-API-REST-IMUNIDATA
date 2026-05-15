const VACINAS = ['', 'BCG', 'Gripe', 'Polio', 'Pentavalente', 'Varicela', 'Hepatite B', 'Rotavírus', 'Pneumocócica'];
const ESTADOS = ['','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const DOSES = ['', '1ª Dose', '2ª Dose', 'Reforço'];

export default function Filtros({ vacina, estado, dose, onChange, onLimpar }) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>🔍 Filtrar por:</span>

      <select
        style={styles.select}
        value={vacina}
        onChange={(e) => onChange('vacina', e.target.value)}
      >
        <option value="">Todas as vacinas</option>
        {VACINAS.filter(Boolean).map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <select
        style={styles.select}
        value={estado}
        onChange={(e) => onChange('estado', e.target.value)}
      >
        <option value="">Todos os estados</option>
        {ESTADOS.filter(Boolean).map(uf => <option key={uf} value={uf}>{uf}</option>)}
      </select>

      <select
        style={styles.select}
        value={dose}
        onChange={(e) => onChange('dose', e.target.value)}
      >
        <option value="">Todas as doses</option>
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
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '14px 18px',
    borderRadius: 16,
    border: '1px solid var(--stroke)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  label: { fontWeight: 600, color: 'var(--muted)', fontSize: 13, letterSpacing: 0.2 },
  select: {
    padding: '9px 12px',
    border: '1px solid var(--stroke)',
    borderRadius: 10,
    fontSize: 14,
    minWidth: 160,
    background: '#fff',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    cursor: 'pointer',
  },
  btnLimpar: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '9px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  },
};
