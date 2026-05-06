import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PersistenceGate } from './components/PersistenceGate'
import App from './App.tsx'
import './index.css'

const rootEl = document.getElementById('root')

if (!rootEl) {
  document.body.innerHTML =
    '<p style="margin:24px;font-family:sans-serif">Missing #root in index.html.</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <PersistenceGate>
            <App />
          </PersistenceGate>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}
