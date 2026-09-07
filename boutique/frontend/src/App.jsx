import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ProtectedWholesaleRoute from './components/ProtectedWholesaleRoute.jsx';
import { WholesaleCartProvider } from './context/WholesaleCartContext.jsx';
import WholesaleAuth from './pages/WholesaleAuth.jsx';
import WholesaleCatalog from './pages/WholesaleCatalog.jsx';
import AdminWholesaleAccounts from './pages/AdminWholesaleAccounts.jsx';


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/articles" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/comptes-gros" element={<ProtectedRoute><AdminWholesaleAccounts /></ProtectedRoute>} />
        <Route path="/gros" element={<WholesaleAuth />} />
        <Route path="/gros/connexion" element={<WholesaleAuth />} />
        <Route path="/gros/catalogue" element={<ProtectedWholesaleRoute><WholesaleCartProvider><WholesaleCatalog /></WholesaleCartProvider></ProtectedWholesaleRoute>} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/commande-confirmee/:id" element={<OrderConfirmation />} />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/boutique" element={<Shop />} />
                  <Route path="/produit/:slug" element={<ProductDetail />} />
                </Routes>
              </main>
              <Footer />
              <CartDrawer />
              <WhatsAppFloatingButton />
            </>
          }
        />
      </Routes>
    </div>
  );
}
