import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "sonner"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      toastOptions={{
        duration: 2600,
        className: "ucef-toast",
      }}
    />
    <App />
  </StrictMode>,
)
