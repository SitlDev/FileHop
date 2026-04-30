import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

const TABS = ['ORDERS', 'PRODUCTS', 'WEBHOOKS', 'SETUP'];

export default function Admin() {
  const [tab, setTab] = useState('ORDERS');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTab(tab);
  }, [tab]);

  const fetchTab = async (t) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/api/orders';
      if (t === 'PRODUCTS') endpoint = '/api/printify/products';
      
      const res = await fetch(endpoint);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Fetch failed');
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const registerWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks/register-printify', { method: 'POST' });
      const r = await res.json();
      alert(`Registered ${r.length} webhooks. Check console for details.`);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page" style={{ paddingInline: '32px' }}>
      <div className={styles.header}>
         <h1 className={styles.title}>SYSTEM <span style={{ color: 'var(--muted)' }}>REBELTHREADS-v1.0.4</span></h1>
         <div className={styles.tabs}>
            {TABS.map(t => (
              <button 
                key={t} 
                className={`${styles.tab} ${tab === t ? styles.active : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
         </div>
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.loading}>SCANNING SYSTEM...</div>}
        {error && <div className={styles.error}>FAIL: {error}</div>}

        {!loading && !error && tab === 'ORDERS' && (
          <div className={styles.list}>
             {data?.data?.length === 0 && <p style={{ color: 'var(--muted)' }}>NO ACTIVITY LOGGED.</p>}
             {data?.data?.map(order => (
               <div key={order.orderId} className={styles.orderCard}>
                  <div>
                    <div className={styles.orderId}>{order.orderId}</div>
                    <div className={styles.orderEmail}>{order.email}</div>
                    <div className={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.orderStatus} data-status={order.status}>{order.status}</div>
                    <div className={styles.orderValue}>${order.cart.reduce((s, i) => s + i.price * i.qty, 0)}</div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {!loading && !error && tab === 'PRODUCTS' && (
          <div className={styles.list}>
             {data && data.map(p => (
                <div key={p.id} className={styles.orderCard}>
                   <div>
                      <div className={styles.orderId}>{p.title}</div>
                      <div className={styles.orderEmail}>ID: {p.id}</div>
                   </div>
                   <div className={styles.orderStatus} data-status={p.published ? 'fulfilled' : 'pending'}>
                      {p.published ? 'PUBLISHED' : 'DRAFT'}
                   </div>
                </div>
             ))}
          </div>
        )}

        {tab === 'WEBHOOKS' && (
          <div className={styles.setup}>
             <button className="btn" onClick={registerWebhooks}>REGISTER ALL PRINTIFY WEBHOOKS</button>
             <p style={{ marginTop: '20px', color: 'var(--dim)', fontSize: '12px' }}>This will point Printify events to /webhooks/printify</p>
          </div>
        )}

        {tab === 'SETUP' && (
           <div className={styles.setupText}>
              <pre>
{`1. CREATE PRODUCTS IN PRINTIFY DASHBOARD
2. FETCH PRODUCT AND VARIANT IDS (API)
3. UPDATE LIB/CATALOG.JS WITH IDS
4. SET STRIPE SECRETS IN .ENV
5. RUN SYSTEM.`}
              </pre>
           </div>
        )}
      </div>
    </main>
  );
}
