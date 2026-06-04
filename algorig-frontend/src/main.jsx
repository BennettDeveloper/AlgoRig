import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ui/Toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
