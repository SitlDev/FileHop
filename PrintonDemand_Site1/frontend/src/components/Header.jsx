import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import styles from './Header.module.css';

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      {/* scanline effect */}
      <div className={styles.scanline} />

      <Link to="/" className={styles.logo}>
        <span className={styles.logoRebel}>REBEL</span>
        <span className={styles.logoThreads}>THREADS</span>
      </Link>

      <nav className={styles.nav}>
        <Link to="/" className={styles.navLink}>SHOP</Link>
        <Link to="/admin" className={styles.navLink}>ADMIN</Link>
      </nav>

      <button
        className={styles.cartBtn}
        onClick={() => setDrawerOpen(true)}
        aria-label={`Cart, ${count} items`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>
    </header>
  );
}
