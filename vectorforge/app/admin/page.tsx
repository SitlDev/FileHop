import { getUsageStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = await getUsageStats();

  // Filter for PDFeditor specifically as requested
  const pdfEditorStats = stats.filter(s => s.tool_name === 'pdfeditor');
  const otherStats = stats.filter(s => s.tool_name !== 'pdfeditor');

  return (
    <div className="admin-container" style={{
      minHeight: '100vh',
      backgroundColor: '#050510',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      padding: '40px'
    }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Dashboard Admin
        </h1>
        <p style={{ color: '#94a3b8' }}>Tracking usage across knotstranded.com tools</p>
      </header>

      <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button style={{ 
          padding: '12px 24px', 
          backgroundColor: '#6366f1', 
          border: 'none', 
          borderRadius: '8px', 
          color: '#fff', 
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          PDFeditor
        </button>
        <button style={{ 
          padding: '12px 24px', 
          backgroundColor: '#1e1e2e', 
          border: '1px solid #334155', 
          borderRadius: '8px', 
          color: '#94a3b8', 
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Coming Soon...
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#11111e', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Total Interactions</h2>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>{pdfEditorStats.reduce((acc, curr) => acc + Number(curr.count), 0)}</div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Across all categories</p>
        </div>

        <div style={{ backgroundColor: '#11111e', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Recent Logs</h2>
          <div className="stats-list">
            {pdfEditorStats.slice(0, 10).map((stat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{stat.action}</span>
                <span style={{ color: '#94a3b8' }}>{new Date(stat.date).toLocaleDateString()} — <b>{stat.count}</b></span>
              </div>
            ))}
            {pdfEditorStats.length === 0 && <p style={{ color: '#475569' }}>No data logged yet.</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', backgroundColor: '#11111e', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Detailed Activity</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Tool</th>
              <th style={{ padding: '12px' }}>Action</th>
              <th style={{ padding: '12px' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '12px' }}>{new Date(stat.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}><span style={{ backgroundColor: stat.tool_name === 'pdfeditor' ? '#4f46e5' : '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{stat.tool_name}</span></td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{stat.action}</td>
                <td style={{ padding: '12px' }}>{stat.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
