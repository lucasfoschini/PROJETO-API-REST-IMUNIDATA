import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Reset CSS global
const globalStyles = `
  :root {
    --font-body: 'Work Sans', sans-serif;
    --font-display: 'Sora', sans-serif;
    --ink: #0f172a;
    --muted: #64748b;
    --primary: #0f766e;
    --primary-strong: #115e59;
    --accent: #f59e0b;
    --card: #ffffff;
    --stroke: #e2e8f0;
    --bg: #f5f7fb;
    --shadow-sm: 0 6px 18px rgba(15, 23, 42, 0.08);
    --shadow-md: 0 16px 40px rgba(15, 23, 42, 0.12);
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
    background:
      radial-gradient(800px 500px at 10% -10%, #fff2cc 0%, rgba(255, 242, 204, 0) 60%),
      radial-gradient(900px 600px at 100% -20%, #dbeafe 0%, rgba(219, 234, 254, 0) 60%),
      var(--bg);
  }
  #root { min-height: 100vh; }
  h1, h2, h3 { font-family: var(--font-display); margin: 0; }
  button { font-family: inherit; }
  input, select { font-family: inherit; color: inherit; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseSoft {
    0% { box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.2); }
    70% { box-shadow: 0 0 0 12px rgba(15, 118, 110, 0); }
    100% { box-shadow: 0 0 0 0 rgba(15, 118, 110, 0); }
  }
`

const style = document.createElement('style')
style.textContent = globalStyles
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
