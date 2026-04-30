import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import styles from './Checkout.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
  const { items, total } = useCart();
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  const handleStartPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/orders/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: items, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className={styles.container}>
        <div className={styles.orderSummary}>
          <h1 className={styles.title}>SUMMARY OF DISORDER</h1>
          <div className={styles.items}>
            {items.map(item => (
              <div key={`${item.id}-${item.size}`} className={styles.item}>
                {item.image && (
                  <div className={styles.itemImgWrapper}>
                    <img src={item.image} alt={item.slogan} className={styles.itemImg} />
                  </div>
                )}
                <div className={styles.itemContent}>
                  <div className={styles.itemName}>{item.slogan}</div>
                  <div className={styles.itemMeta}>SIZE: {item.size} · ×{item.qty}</div>
                </div>
                <div className={styles.itemPrice}>${item.price * item.qty}</div>
              </div>
            ))}
          </div>
          <div className={styles.totalRow}>
             <span>TOTAL</span>
             <span>${total} USD</span>
          </div>
        </div>

        <div className={styles.paymentSection}>
          {!clientSecret ? (
            <form onSubmit={handleStartPayment} className={styles.emailForm}>
              <h2 className={styles.secTitle}>01 Identification</h2>
              <p className={styles.hint}>Where should we send the confirmation?</p>
              <input 
                type="email" 
                placeholder="EMAIL@EXAMPLE.COM" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button className="btn" style={{ marginTop: '20px' }} disabled={loading}>
                {loading ? 'INITIALIZING...' : 'START SECURE PAYMENT'}
              </button>
            </form>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#FF4500' } } }}>
              <PaymentForm orderId={orderId} email={email} />
            </Elements>
          )}
        </div>
      </div>
    </main>
  );
}

function PaymentForm({ orderId, email }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    first_name: '', last_name: '', phone: '',
    address1: '', city: '', region: '', zip: '', country: 'US'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    
    // 1. Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/order/${orderId}`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        // 2. Confirm order with our backend
        const confirmRes = await fetch('/api/orders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentIntentId: paymentIntent.id,
            shippingAddress: { ...shipping, email }
          })
        });
        
        if (!confirmRes.ok) throw new Error('Order confirmation failed on server.');
        
        clearCart();
        navigate(`/order/${orderId}`);
      } catch (err) {
        setMessage(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <h2 className={styles.secTitle}>02 Shipping & Finalize</h2>
      
      <div className={styles.shippingGrid}>
        <input placeholder="FIRST NAME" required onChange={e => setShipping({...shipping, first_name: e.target.value})} />
        <input placeholder="LAST NAME" required onChange={e => setShipping({...shipping, last_name: e.target.value})} />
        <input placeholder="ADDRESS" className={styles.full} required onChange={e => setShipping({...shipping, address1: e.target.value})} />
        <input placeholder="CITY" required onChange={e => setShipping({...shipping, city: e.target.value})} />
        <input placeholder="STATE/REGION" required onChange={e => setShipping({...shipping, region: e.target.value})} />
        <input placeholder="ZIP" required onChange={e => setShipping({...shipping, zip: e.target.value})} />
        <input placeholder="PHONE" required onChange={e => setShipping({...shipping, phone: e.target.value})} />
      </div>

      <div style={{ marginTop: '32px' }}>
        <PaymentElement />
      </div>

      <button className="btn" style={{ width: '100%', marginTop: '32px' }} disabled={!stripe || loading}>
        {loading ? 'PROCESSING...' : `PAY NOW`}
      </button>

      {message && <div className={styles.errorMessage}>{message}</div>}
    </form>
  );
}
