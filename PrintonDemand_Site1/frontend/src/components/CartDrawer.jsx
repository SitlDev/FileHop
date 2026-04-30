import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, drawerOpen, setDrawerOpen } = useCart();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setDrawerOpen(false)}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>YOUR HAUL</h2>
          <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>×</button>
        </div>

        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>THE CART IS EMPTY.</p>
              <button className="btn" onClick={() => setDrawerOpen(false)} style={{ marginTop: '20px' }}>
                GO GET SOME
              </button>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className={styles.item}>
                  <div className={styles.itemImgWrapper}>
                    {item.image && <img src={item.image} alt={item.slogan} className={styles.itemImg} />}
                  </div>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.slogan}</h3>
                    <p className={styles.itemMeta}>SIZE: {item.size} · ${item.price}</p>
                    <div className={styles.qtyControls}>
                      <button onClick={() => updateQty(item.id, item.size, item.qty - 1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.size, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeItem(item.id, item.size)}>
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>SUBTOTAL</span>
              <span>${total}</span>
            </div>
            <button
              className="btn"
              style={{ width: '100%' }}
              onClick={() => {
                setDrawerOpen(false);
                navigate('/checkout');
              }}
            >
              PROCEED TO SECURE CHECKOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
