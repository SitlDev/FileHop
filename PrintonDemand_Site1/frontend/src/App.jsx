import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Shop from './pages/Shop.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirm from './pages/OrderConfirm.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Header />
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirm />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
