export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050510',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '10px', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VectorForge
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.25rem' }}>Professional PDF Editor & Creative Suite</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <a href="/pdfeditor" style={{
          display: 'block',
          padding: '24px',
          backgroundColor: '#1E1E2E',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '16px',
          fontWeight: 700,
          border: '1px solid #334155',
          textAlign: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.3)',
          transition: 'transform 0.2s, border-color 0.2s'
        }}>
          Launch Editor
        </a>
      </div>
      
      {/* Homepage Display Ad */}
      <div style={{
        marginTop: '80px',
        width: '100%',
        maxWidth: '728px',
        height: '90px',
        backgroundColor: '#0A0A15',
        border: '1px dashed #1E293B',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        fontSize: '11px',
        letterSpacing: '1px'
      }}>
        SPONSORED PLACEMENT
      </div>
    </div>
  );
}
