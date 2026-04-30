import { useState } from 'react';
import { PRODUCTS, COLLECTIONS } from '../data/products';
import { useCart } from '../context/CartContext.jsx';
import styles from './Shop.module.css';

export default function Shop() {
  const { addItem } = useCart();
  const [selectedSizes, setSelectedSizes] = useState({});
  const [activeCollection, setActiveCollection] = useState('ALL');

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size) {
      alert('SELECT A SIZE FIRST, REBEL.');
      return;
    }
    addItem({ ...product, size });
  };

  const filteredProducts = activeCollection === 'ALL' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.collection === activeCollection);

  return (
    <main className="page">
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>WEAR YOUR <span className={styles.glitch} data-text="DISSENT">DISSENT</span></h1>
          <p className={styles.heroSubtitle}>Premium gear for the unpersuaded. Printed on demand. Delivered to the underground.</p>
        </div>
        <div className={styles.heroOverlay} />
      </section>

      <section className={styles.gridHeader}>
        <div className={styles.filterBar}>
          {['ALL', ...Object.values(COLLECTIONS)].map(c => (
            <button 
              key={c} 
              className={`${styles.filterBtn} ${activeCollection === c ? styles.active : ''}`}
              onClick={() => setActiveCollection(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {filteredProducts.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.productVisual} style={{ '--accent': product.accent }}>
               {product.image ? (
                 <img src={product.image} alt={product.slogan} className={styles.productImg} />
               ) : (
                 <div className={styles.productSlogan}>{product.slogan}</div>
               )}
               <div className={styles.productTag}>REBEL-{product.id.toString().padStart(3, '0')}</div>
            </div>
            
            <div className={styles.productInfo}>
              <h2 className={styles.productTitle}>{product.slogan} TEE</h2>
              <p className={styles.productTagline}>{product.tagline}</p>
              <p className={styles.productPrice}>${product.price} USD</p>
              
              <div className={styles.sizeSelection}>
                <label>SELECT SIZE</label>
                <div className={styles.sizeGrid}>
                  {product.sizes.map(size => (
                    <button 
                      key={size}
                      className={`${styles.sizeBtn} ${selectedSizes[product.id] === size ? styles.active : ''}`}
                      onClick={() => handleSizeSelect(product.id, size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="btn" 
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => handleAddToCart(product)}
              >
                ADD TO CART
              </button>
            </div>
          </div>
        ))}
      </section>

      <footer className={styles.shopFooter}>
         <div className={styles.footerInner}>
           <div className={styles.footerBrand}>REBELTHREADS®</div>
           <div className={styles.footerLinks}>
              <span>© 2024 NO RIGHTS RESERVED.</span>
           </div>
         </div>
      </footer>
    </main>
  );
}
