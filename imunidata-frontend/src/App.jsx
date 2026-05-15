import { useState, useEffect, useCallback } from 'react';
import VacinacaoTable from './components/VacinacaoTable';
import VacinacaoForm from './components/VacinacaoForm';
import Filtros from './components/Filtros';
import { vacinacaoService } from './services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Chart } from 'react-google-charts';

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroVacina, setFiltroVacina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDose, setFiltroDose] = useState('');
  const [resumoEstado, setResumoEstado] = useState({});
  const [resumoVacina, setResumoVacina] = useState({});
  const [registroEditando, setRegistroEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [aba, setAba] = useState('lista'); // 'lista' | 'cadastro' | 'resumo'

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [res, resEstado, resVacina] = await Promise.all([
        vacinacaoService.listar(filtroVacina, filtroEstado, filtroDose),
        vacinacaoService.resumoPorEstado(),
        vacinacaoService.resumoPorVacina(),
      ]);
      setRegistros(res.data);
      setResumoEstado(resEstado.data);
      setResumoVacina(resVacina.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroVacina, filtroEstado, filtroDose]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleFiltroChange = (campo, valor) => {
    if (campo === 'vacina') setFiltroVacina(valor);
    if (campo === 'estado') setFiltroEstado(valor);
    if (campo === 'dose') setFiltroDose(valor);
  };

  const handleEditar = (registro) => {
    setRegistroEditando(registro);
    setAba('cadastro');
    setMostrarFormulario(true);
  };

  const handleSalvo = () => {
    carregarDados();
    setRegistroEditando(null);
    setAba('lista');
  };

  const totalDoses = registros.reduce((acc, r) => acc + r.quantidadeAplicada, 0);

  const dadosGraficoPizza = Object.entries(resumoVacina)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const dadosMapaBrasil = [
    ['Estado', 'Doses Aplicadas'],
    ...Object.entries(resumoEstado).map(([estado, total]) => [`BR-${estado}`, total])
  ];

  const CORES_GRAFICO = ['#2b6cb0', '#48bb78', '#ecc94b', '#ed8936', '#9f7aea', '#fc8181', '#4299e1', '#68d391'];

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.titulo}>💉 ImuniData</h1>
          <p style={styles.subtitulo}>Sistema de Monitoramento de Cobertura Vacinal</p>
        </div>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{registros.length}</span>
            <span style={styles.statLabel}>Registros</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{totalDoses.toLocaleString('pt-BR')}</span>
            <span style={styles.statLabel}>Doses Aplicadas</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{Object.keys(resumoEstado).length}</span>
            <span style={styles.statLabel}>Estados</span>
          </div>
        </div>
      </header>

      {/* NAVEGAÇÃO */}
      <nav style={styles.nav}>
        {['lista', 'cadastro', 'resumo'].map((a) => (
          <button
            key={a}
            style={aba === a ? { ...styles.navBtn, ...styles.navBtnAtivo } : styles.navBtn}
            onClick={() => {
              setAba(a);
              if (a !== 'cadastro') setRegistroEditando(null);
            }}
          >
            {a === 'lista' ? '📋 Listagem' : a === 'cadastro' ? '➕ Cadastro' : '📊 Resumo'}
          </button>
        ))}
      </nav>

      {/* CONTEÚDO */}
      <main style={styles.main}>
        {/* ABA LISTAGEM */}
        {aba === 'lista' && (
          <>
            <Filtros
              vacina={filtroVacina}
              estado={filtroEstado}
              dose={filtroDose}
              onChange={handleFiltroChange}
              onLimpar={() => { setFiltroVacina(''); setFiltroEstado(''); setFiltroDose(''); }}
            />
            <VacinacaoTable
              registros={registros}
              loading={loading}
              onEditar={handleEditar}
              onExcluir={carregarDados}
            />
          </>
        )}

        {/* ABA CADASTRO */}
        {aba === 'cadastro' && (
          <VacinacaoForm
            onSalvo={handleSalvo}
            registroParaEditar={registroEditando}
            aoFecharEdicao={() => { setRegistroEditando(null); setAba('lista'); }}
          />
        )}

        {/* ABA RESUMO */}
        {aba === 'resumo' && (
          <div style={styles.resumoGrid}>
            <div style={styles.resumoCard}>
              <h3 style={styles.resumoTitulo}>📍 Doses por Estado</h3>

              <div style={{ width: '100%', aspectRatio: '1 / 1', maxHeight: '500px', margin: '0 auto 24px', overflow: 'hidden' }}>

                <Chart
                  chartType="GeoChart"
                  width="100%"
                  height="100%"
                  data={dadosMapaBrasil}
                  options={{
                    region: 'BR',
                    domain: 'BR',
                    displayMode: 'regions',
                    resolution: 'provinces',

                    colorAxis: { colors: ['#ebf4ff', '#2b6cb0'] },

                    backgroundColor: {
                      fill: '#ffffff'
                    },

                    datalessRegionColor: '#ffffff',
                    defaultColor: '#f7fafc',
                    keepAspectRatio: true,
                    legend: 'none',
                  }}
                />
              </div>

              <table style={styles.resumoTable}>
                <thead>
                  <tr>
                    <th style={styles.resumoTh}>Estado</th>
                    <th style={{ ...styles.resumoTh, textAlign: 'right' }}>Total de Doses</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resumoEstado)
                    .sort(([, a], [, b]) => b - a)
                    .map(([estado, total]) => (
                      <tr key={estado}>
                        <td style={styles.resumoTd}>
                          <span style={styles.badge}>{estado}</span>
                        </td>
                        <td style={{ ...styles.resumoTd, textAlign: 'right', fontWeight: 700, color: '#2b6cb0' }}>
                          {Number(total).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={styles.resumoCard}>
              <h3 style={styles.resumoTitulo}>💉 Doses por Vacina</h3>
              <table style={styles.resumoTable}>
                <thead>
                  <tr>
                    <th style={styles.resumoTh}>Vacina</th>
                    <th style={{ ...styles.resumoTh, textAlign: 'right' }}>Total de Doses</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resumoVacina)
                    .sort(([, a], [, b]) => b - a)
                    .map(([vacina, total]) => (
                      <tr key={vacina}>
                        <td style={styles.resumoTd}>{vacina}</td>
                        <td style={{ ...styles.resumoTd, textAlign: 'right', fontWeight: 700, color: '#2b6cb0' }}>
                          {Number(total).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <h3 style={{ ...styles.resumoTitulo, marginTop: '32px', textAlign: 'center' }}>Proporção por Vacina</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString('pt-BR') + ' doses'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        ImuniData © 2024 — Dados de cobertura vacinal baseados em OpenDataSUS
      </footer>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#edf2f7',
    fontFamily: "'Segoe UI', sans-serif"
  },
  header: {
    background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
    color: '#fff',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  titulo: { margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 },
  subtitulo: { margin: '4px 0 0', opacity: 0.8, fontSize: 14 },
  stats: { display: 'flex', gap: 16 },
  statCard: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '10px 18px',
    textAlign: 'center',
    backdropFilter: 'blur(4px)',
  },
  statNum: { display: 'block', fontSize: 22, fontWeight: 800 },
  statLabel: { display: 'block', fontSize: 11, opacity: 0.85, marginTop: 2 },
  nav: {
    background: '#fff',
    padding: '0 32px',
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    padding: '14px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#718096',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  navBtnAtivo: { color: '#2b6cb0', borderBottomColor: '#2b6cb0' },
  main: {
    flex: 1,
    width: '100%',
    boxSizing: 'border-box',
    padding: '24px 32px',
    maxWidth: 1200,
    margin: '0 auto'
  },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 },
  resumoCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  resumoTitulo: { margin: '0 0 16px', fontSize: 16, color: '#1a365d' },
  resumoTable: { width: '100%', borderCollapse: 'collapse' },
  resumoTh: {
    padding: '8px 12px',
    background: '#f7fafc',
    color: '#4a5568',
    fontWeight: 700,
    fontSize: 13,
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0',
  },
  resumoTd: { padding: '9px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14, color: '#2d3748' },
  badge: {
    background: '#ebf4ff',
    color: '#2b6cb0',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 12,
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#a0aec0',
    fontSize: 13,
    borderTop: '1px solid #e2e8f0',
    background: '#fff',
  },
};
