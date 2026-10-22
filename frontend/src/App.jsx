import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ToastStack from './components/ToastStack.jsx';
import AuthModal from './components/AuthModal.jsx';
import DemoModal from './components/DemoModal.jsx';
import InfoModal from './components/InfoModal.jsx';
import RadarModal from './components/RadarModal.jsx';
import TxModal from './components/TxModal.jsx';
import useHashScroll from './hooks/useHashScroll.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SolutionsPage from './pages/SolutionsPage.jsx';
import PricingPage from './pages/PricingPage.jsx';

/**
 * ==========================================================================
 * NUSABRIDGE REACT APP - SATU ROUTER UNTUK 4 HALAMAN UTAMA
 * - /        -> HomePage
 * - /produk  -> ProductsPage
 * - /solusi  -> SolutionsPage
 * - /harga   -> PricingPage
 * Navbar, Footer, Toast, dan Modal bersifat global (muncul di semua halaman).
 * ==========================================================================
 */
export default function App() {
  useHashScroll();

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/produk" element={<ProductsPage />} />
        <Route path="/solusi" element={<SolutionsPage />} />
        <Route path="/harga" element={<PricingPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>

      <Footer />

      {/* Global overlays */}
      <ToastStack />
      <AuthModal />
      <DemoModal />
      <InfoModal />
      <RadarModal />
      <TxModal />
    </>
  );
}
