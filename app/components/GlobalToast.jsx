import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalToast({ toast }) {
  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            zIndex: 9999,
            padding: '10px 20px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                        toast.type === 'success' ? 'rgba(34, 197, 94, 0.9)' :
                        'rgba(30, 41, 59, 0.9)',
            color: '#fff',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: '90vw',
            whiteSpace: 'nowrap'
          }}
        >
          {toast.type === 'error' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          {toast.type === 'success' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
