import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './OrderConfirm.module.css';

export default function OrderConfirm() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        setOrder(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    
    // Poll for status updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <main className="page"><div className={styles.loading}>LOCATING YOUR DATA...</div></main>;
  if (!order) return <main className="page"><div className={styles.error}>ORDER NOT FOUND. THE SYSTEM IS BLIND.</div></main>;

  return (
    <main className="page">
      <div className={styles.container}>
        <div className={styles.header}>
           <div className={styles.check}>✓</div>
           <h1 className={styles.title}>ORDER SECURED</h1>
           <p className={styles.id}>IDENTIFIER: {order.orderId}</p>
        </div>

        <div className={styles.details}>
          <div className={styles.statusBox}>
            <div className={styles.statusLabel}>Fulfillment Status</div>
            <div className={styles.statusValue}>{order.printifyStatus || 'SUBMITTED TO FULFILLMENT'}</div>
            <p className={styles.statusNote}>
              {order.printifyStatus === 'fulfilled' 
                ? 'Your gear is on the move. Check your email for tracking.' 
                : 'Our machines are revving up. Your apparel will be ready in 3-7 business days.'}
            </p>
          </div>

          <div className={styles.infoRow}>
             <div className={styles.infoBlock}>
                <h3>SHIPPING TO</h3>
                <p>{order.shippingAddress.first_name} {order.shippingAddress.last_name}</p>
                <p>{order.shippingAddress.address1}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.zip}</p>
             </div>
             <div className={styles.infoBlock}>
                <h3>WHAT YOU GOT</h3>
                {order.cart.map((item, idx) => (
                  <p key={idx}>{item.slogan} ({item.size}) × {item.qty}</p>
                ))}
             </div>
          </div>
        </div>

        <div className={styles.actions}>
           <button className="btn" onClick={() => window.location.href = '/'}>RETURN TO THE FRONT</button>
        </div>
      </div>
    </main>
  );
}
