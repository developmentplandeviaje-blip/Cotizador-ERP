import React from 'react';

export default function Pagination({ page, lastPage, setPage }) {
  if (!lastPage || lastPage <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '0.8125rem',
    }}>
      <button
        onClick={() => setPage(1)}
        disabled={page === 1}
        style={{ background: 'none', border: 'none', color: page === 1 ? '#ffffff' : '#E87217', cursor: page === 1 ? 'default' : 'pointer', fontSize: '24px' }}
      >
        &laquo;
      </button>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{ background: 'none', border: 'none', color: page === 1 ? '#ffffff' : '#E87217', cursor: page === 1 ? 'default' : 'pointer', fontSize: '24px' }}
      >
        &lsaquo;
      </button>

      {[...Array(lastPage)].map((_, i) => {
        const pageNum = i + 1;
        const isCurrent = page === pageNum;

        // Truncate logic
        if (lastPage > 7) {
           if (pageNum !== 1 && pageNum !== lastPage && (pageNum < page - 1 || pageNum > page + 1)) {
              if (pageNum === page - 2 || pageNum === page + 2) {
                 return <span key={pageNum} style={{ color: '#94A3B8' }}>...</span>;
              }
              return null;
           }
        }

        return (
          <button
            key={pageNum}
            onClick={() => setPage(pageNum)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              border: isCurrent ? '1px solid #919191a1' : 'none',
              background: isCurrent ? 'linear-gradient(45deg, rgb(68 78 109 / 20%) 0%, rgb(178 193 239 / 55%) 100%)' : 'transparent',
              color: isCurrent ? '#FFFFFF' : '#94A3B8',
              fontWeight: isCurrent ? '700' : '400',
              cursor: 'pointer',
            }}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => setPage(p => Math.min(lastPage, p + 1))}
        disabled={page === lastPage}
        style={{ background: 'none', border: 'none', color: page === lastPage ? '#ffffff' : '#E87217', cursor: page === lastPage ? 'default' : 'pointer', fontSize: '24px' }}
      >
        &rsaquo;
      </button>
      <button
        onClick={() => setPage(lastPage)}
        disabled={page === lastPage}
        style={{ background: 'none', border: 'none', color: page === lastPage ? '#ffffff' : '#E87217', cursor: page === lastPage ? 'default' : 'pointer', fontSize: '24px' }}
      >
        &raquo;
      </button>
    </div>
  );
}
