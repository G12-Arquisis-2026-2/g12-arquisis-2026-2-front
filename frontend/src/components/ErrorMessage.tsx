// src/components/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'No se pudo conectar con la API o el servidor no responde.',
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '12px',
        backgroundColor: '#fee2e2',
        border: '1.5px solid #dc2626',
        margin: '1.5rem 0',
        textAlign: 'center',
      }}
    >
      <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        ⚠️ Error de Comunicación con el Nodo
      </div>
      <p style={{ color: '#7f1d1d', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="btn-primary"
        style={{
          backgroundColor: '#b91c1c',
          boxShadow: '0 4px 10px rgba(185, 28, 28, 0.25)',
        }}
      >
        Reintentar Conexión
      </button>
    </div>
  );
};