import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#141D2E',
            color: '#E2E8F0',
            border: '1px solid #1E2D45',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#141D2E' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#141D2E' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
