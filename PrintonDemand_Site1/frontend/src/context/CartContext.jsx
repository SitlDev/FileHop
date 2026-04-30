import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = `${item.id}-${item.size}`;
      const existing = prev.find((i) => `${i.id}-${i.size}` === key);
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...item, qty: 1 }];
    });
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((id, size) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  }, []);

  const updateQty = useCallback((id, size, qty) => {
    if (qty <= 0) { removeItem(id, size); return; }
    setItems((prev) => prev.map((i) => i.id === id && i.size === size ? { ...i, qty } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, drawerOpen, setDrawerOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
