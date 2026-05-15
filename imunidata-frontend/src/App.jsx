import { useState, useEffect, useCallback } from 'react';
import VacinacaoTable from './components/VacinacaoTable';
import VacinacaoForm from './components/VacinacaoForm';
import Filtros from './components/Filtros';
import { vacinacaoService } from './services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { Chart } from 'react-google-charts';

const FEEDBACK_DURATION_MS = 4000;

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroVacina, setFiltroVacina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDose, setFiltroDose] = useState('');
  const [resumoEstado, setResumoEstado] = useState({});
  const [resumoVacina, setResumoVacina] = useState({});
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [activeVacinaIndex, setActiveVacinaIndex] = useState(null);
  const [registroEditando, setRegistroEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [aba, setAba] = useState('lista'); // 'lista' | 'cadastro' | 'resumo'
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const exibirFeedback = useCallback((mensagem, tipo = 'sucesso') => {
    setFeedback({ mensagem, tipo });
  }, []);

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

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const processUpload = async (file) => {
    try {
      setLoading(true);
      await vacinacaoService.uploadCSV(file);
      alert('Arquivo importado com sucesso!');
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao importar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCSV = (event) => {
    const file = event.target.files[0];
    if (file) {
      processUpload(file);
      event.target.value = null;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processUpload(file);
    } else {
      alert('Por favor, selecione um arquivo .csv válido.');
    }
  };

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

  const formatarNumero = (valor) => Number(valor || 0).toLocaleString('pt-BR');

  const totalDoses = registros.reduce((acc, r) => acc + r.quantidadeAplicada, 0);

  const dadosGraficoPizza = Object.entries(resumoVacina)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const totalVacinas = dadosGraficoPizza.reduce((acc, item) => acc + item.value, 0);

  const mapaRows = Object.entries(resumoEstado)
    .map(([estado, total]) => {
      const totalNum = Number(total) || 0;
      const tooltip = `
        <div style="padding:10px 12px; min-width: 140px;">
          <div style="font-size:11px; color:#64748b; text-transform: uppercase; letter-spacing: 0.8px;">UF</div>
          <div style="font-size:16px; font-weight:700; color:#0f172a;">${estado}</div>
          <div style="margin-top:6px; font-size:11px; color:#64748b;">Doses aplicadas</div>
          <div style="font-size:15px; font-weight:700; color:#0f172a;">${formatarNumero(totalNum)}</div>
        </div>
      `;
      return [{ v: `BR-${estado}`, f: estado }, totalNum, tooltip];
    })
    .sort((a, b) => b[1] - a[1]);

  const destaqueMapa = estadoSelecionado || (mapaRows[0]
    ? { uf: mapaRows[0][0].f, total: mapaRows[0][1], label: 'Destaque nacional' }
    : null);

  const dadosMapaBrasil = [
    ['Estado', 'Doses', { type: 'string', role: 'tooltip', p: { html: true } }],
    ...mapaRows,
  ];

  const mapaOptions = {
    region: 'BR',
    displayMode: 'regions',
    resolution: 'provinces',
    colorAxis: { colors: ['#fef3c7', '#f59e0b', '#b45309'] },
    backgroundColor: 'transparent',
    datalessRegionColor: 'transparent',
    defaultColor: '#e2e8f0',
    keepAspectRatio: true,
    enableRegionInteractivity: true,
    legend: { position: 'bottom', textStyle: { color: '#475569', fontSize: 12 } },
    tooltip: { isHtml: true, textStyle: { color: '#0f172a', fontSize: 12 } },
  };

  const mapaChartEvents = [
    {
      eventName: 'select',
      callback: ({ chartWrapper }) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        if (!selection.length) {
          setEstadoSelecionado(null);
          return;
        }
        const row = selection[0].row;
        const rowData = dadosMapaBrasil[row + 1];
        if (!rowData) return;
        const uf = rowData[0].f;
        setEstadoSelecionado({ uf, total: rowData[1] });
      },
    },
  ];

  const handlePieEnter = (_, index) => setActiveVacinaIndex(index);
  const handlePieLeave = () => setActiveVacinaIndex(null);

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="rgba(15, 118, 110, 0.18)"
        />
      </g>
    );
  };

  const renderVacinaTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    const percent = totalVacinas ? (value / totalVacinas) * 100 : 0;
    return (
      <div style={styles.tooltipCard}>
        <div style={styles.tooltipLabel}>{name}</div>
        <div style={styles.tooltipValue}>{formatarNumero(value)} doses</div>
        <div style={styles.tooltipMeta}>{percent.toFixed(1)}% do total</div>
      </div>
    );
  };

  const CORES_GRAFICO = ['#0f766e', '#0ea5e9', '#f59e0b', '#22c55e', '#f97316', '#84cc16', '#06b6d4', '#ef4444'];

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerGlow} aria-hidden="true" />
        <div style={styles.headerInner}>
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
              <span style={styles.statNum}>{formatarNumero(totalDoses)}</span>
              <span style={styles.statLabel}>Doses Aplicadas</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{Object.keys(resumoEstado).length}</span>
              <span style={styles.statLabel}>Estados</span>
            </div>
          </div>
        </div>
      </header>

      {/* NAVEGAÇÃO */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
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
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main style={styles.main}>
        {feedback && (
          <div
            style={feedback.tipo === 'erro' ? styles.feedbackErro : styles.feedbackSucesso}
            role="alert"
            aria-live="polite"
          >
            <span>{feedback.mensagem}</span>
            <button
              style={styles.feedbackFechar}
              onClick={() => setFeedback(null)}
              aria-label="Fechar mensagem"
            >
              ✕
            </button>
          </div>
        )}

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
              onFeedback={exibirFeedback}
            />
          </>
        )}

        {/* ABA CADASTRO */}
        {aba === 'cadastro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <VacinacaoForm
              onSalvo={handleSalvo}
              registroParaEditar={registroEditando}
              aoFecharEdicao={() => { setRegistroEditando(null); setAba('lista'); }}
              onFeedback={exibirFeedback}
            />
            
            <div 
              style={{ 
                background: isDragging ? 'rgba(15, 118, 110, 0.05)' : '#fff', 
                padding: '40px 32px', 
                borderRadius: '16px', 
                boxShadow: 'var(--shadow-sm)', 
                border: isDragging ? '2px dashed var(--primary-strong)' : '1px solid var(--stroke)',
                textAlign: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-upload').click()}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📂</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a' }}>Importação em Massa</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                Clique para selecionar ou arraste e solte o seu arquivo CSV (Padrão OpenDataSUS) aqui.
              </p>
              <button
                style={{ background: '#f8fafc', padding: '10px 24px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('csv-upload').click();
                }}
              >
                Escolher arquivo
              </button>
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleUploadCSV}
              />
            </div>
          </div>
        )}

        {/* ABA RESUMO */}
        {aba === 'resumo' && (
          <div style={styles.resumoGrid}>
            <div style={styles.resumoCard}>
              <h3 style={styles.resumoTitulo}>📍 Doses por Estado</h3>
              <div style={styles.mapaWrapper}>
                <div style={styles.mapaCanvas} className="mapaCanvas">
                  <style>{`
                    .mapaCanvas path[fill="none"],
                    .mapaCanvas path[fill="transparent"],
                    .mapaCanvas path[fill-opacity="0"] {
                      display: none !important;
                    }
                    .mapaCanvas svg {
                      transform: scale(1.5) translate(5%, 4%);
                      transform-origin: center;
                    }
                  `}</style>
                  <Chart
                    chartType="GeoChart"
                    width="100%"
                    height="100%"
                    data={dadosMapaBrasil}
                    options={mapaOptions}
                    chartEvents={mapaChartEvents}
                  />
                </div>
                <div style={styles.mapaInfo}>
                  {destaqueMapa ? (
                    <>
                      <div style={styles.mapaInfoLabel}>
                        {estadoSelecionado ? 'UF selecionada' : destaqueMapa.label}
                      </div>
                      <div style={styles.mapaInfoUf}>{destaqueMapa.uf}</div>
                      <div style={styles.mapaInfoTotal}>{formatarNumero(destaqueMapa.total)} doses</div>
                      <div style={styles.mapaInfoHint}>Clique em um estado para alternar o destaque.</div>
                    </>
                  ) : (
                    <>
                      <div style={styles.mapaInfoLabel}>Sem dados</div>
                      <div style={styles.mapaInfoHint}>Nenhum estado retornado pela API.</div>
                    </>
                  )}
                </div>
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
                        <td style={{ ...styles.resumoTd, textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {formatarNumero(total)}
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
                        <td style={{ ...styles.resumoTd, textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {formatarNumero(total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <h3 style={{ ...styles.resumoTitulo, marginTop: '32px', textAlign: 'center' }}>Proporção por Vacina</h3>
              <div style={{ width: '100%', height: 360, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={120}
                      paddingAngle={3}
                      labelLine={false}
                      fill="#8884d8"
                      dataKey="value"
                      activeIndex={activeVacinaIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={handlePieEnter}
                      onMouseLeave={handlePieLeave}
                      isAnimationActive={true}
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={renderVacinaTooltip} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  top: '46%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: 14, color: '#64748b' }}>Total de Doses</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{formatarNumero(totalVacinas)}</div>
                </div>
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
    color: 'var(--ink)',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
    color: '#f8fafc',
    padding: '28px 0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    animation: 'fadeUp 0.6s ease',
  },
  headerGlow: {
    position: 'absolute',
    inset: '-30% auto auto -10%',
    width: 450,
    height: 450,
    background: 'radial-gradient(circle at 30% 30%, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0) 70%)',
    opacity: 1,
    pointerEvents: 'none',
  },
  titulo: { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: -0.6 },
  subtitulo: { margin: '6px 0 0', opacity: 0.9, fontSize: 14 },
  stats: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  statCard: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: '10px 16px',
    textAlign: 'left',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(8px)',
    minWidth: 140,
  },
  statNum: { display: 'block', fontSize: 20, fontWeight: 800 },
  statLabel: { display: 'block', fontSize: 11, opacity: 0.9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  feedbackSucesso: {
    marginBottom: 16,
    background: '#ecfdf3',
    color: '#027a48',
    border: '1px solid #a6f4c5',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  feedbackErro: {
    marginBottom: 16,
    background: '#fff5f5',
    color: '#b42318',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  feedbackFechar: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
  },
  nav: {
    background: 'rgba(255,255,255,0.9)',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backdropFilter: 'blur(8px)',
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    gap: 6,
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--muted)',
    transition: 'all 0.2s',
    borderRadius: '8px 8px 0 0',
  },
  navBtnAtivo: {
    color: '#0f172a',
    borderBottom: '3px solid #0f172a',
    background: 'rgba(15, 23, 42, 0.04)',
  },
  main: {
    flex: 1,
    width: '100%',
    boxSizing: 'border-box',
    padding: '28px 24px 40px',
    maxWidth: 1200,
    margin: '0 auto',
    animation: 'fadeUp 0.6s ease',
  },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' },
  resumoCard: {
    background: 'var(--card)',
    borderRadius: 18,
    padding: 24,
    border: '1px solid var(--stroke)',
    boxShadow: 'var(--shadow-md)',
  },
  resumoTitulo: { margin: '0 0 16px', fontSize: 17, color: 'var(--ink)' },
  resumoTable: { width: '100%', borderCollapse: 'collapse' },
  resumoTh: {
    padding: '10px 12px',
    background: '#f8fafc',
    color: '#475569',
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'left',
    borderBottom: '1px solid var(--stroke)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resumoTd: { padding: '10px 12px', borderBottom: '1px solid var(--stroke)', fontSize: 14, color: '#1f2937' },
  badge: {
    background: '#ecfeff',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 12,
  },
  mapaWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  mapaCanvas: {
    flex: '1 1 320px',
    width: '100%',
    aspectRatio: '1 / 1',
    minHeight: 350,
    maxHeight: 500,
    background: '#fff',
    borderRadius: 16,
    border: '1px solid var(--stroke)',
    padding: '8px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapaInfo: {
    flex: '0 1 220px',
    background: 'linear-gradient(180deg, rgba(15,118,110,0.12), rgba(255,255,255,0.9))',
    borderRadius: 16,
    border: '1px solid rgba(15,118,110,0.2)',
    padding: '16px 18px',
    minHeight: 160,
    width: '100%',
    maxWidth: 260,
    minWidth: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  mapaInfoLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', fontWeight: 700 },
  mapaInfoUf: { fontSize: 28, fontWeight: 800, color: 'var(--primary-strong)' },
  mapaInfoTotal: { fontSize: 16, fontWeight: 700, color: 'var(--ink)' },
  mapaInfoHint: { fontSize: 12, color: 'var(--muted)' },
  tooltipCard: {
    background: '#ffffff',
    border: '1px solid rgba(15, 118, 110, 0.15)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
    padding: '10px 12px',
    minWidth: 160,
  },
  tooltipLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'var(--muted)',
    fontWeight: 700,
  },
  tooltipValue: { fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginTop: 6 },
  tooltipMeta: { fontSize: 12, color: 'var(--muted)', marginTop: 4 },
  footer: {
    textAlign: 'center',
    padding: '22px 16px',
    color: 'var(--muted)',
    fontSize: 13,
    borderTop: '1px solid var(--stroke)',
    background: 'rgba(255,255,255,0.9)',
  },
};
