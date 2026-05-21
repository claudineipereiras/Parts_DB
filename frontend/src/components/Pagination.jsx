import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', 
            borderRadius: '6px', border: '1px solid var(--border)', background: currentPage === 1 ? '#f1f5f9' : '#fff',
            color: currentPage === 1 ? '#94a3b8' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', 
            borderRadius: '6px', border: '1px solid var(--border)', background: currentPage === totalPages ? '#f1f5f9' : '#fff',
            color: currentPage === totalPages ? '#94a3b8' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
