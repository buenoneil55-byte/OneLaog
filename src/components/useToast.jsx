import React, { createContext, useContext, useState } from 'react'

const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = ({ title, description, variant }) => {
    const id = Date.now()
    setToasts((p) => [...p, { id, title, description, variant }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000)
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant === 'destructive' ? 'toast-error' : ''}`}>
            <strong>{t.title}</strong>
            {t.description && <span>{t.description}</span>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}