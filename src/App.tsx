import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { MobileMenu } from './components/layout/MobileMenu';
import { Hero } from './components/home/Hero';
import { BrandStatement } from './components/home/BrandStatement';
import { ProductSection } from './components/home/ProductSection';
import { EditorialBanner } from './components/home/EditorialBanner';
import { AboutSection } from './components/home/AboutSection';
import { ExperienceSection } from './components/home/ExperienceSection';
import { Benefits } from './components/home/Benefits';
import { InstagramSection } from './components/home/InstagramSection';
import { Footer } from './components/layout/Footer';

import { CartDrawer } from './components/modals/CartDrawer';
import { CheckoutModal } from './components/modals/CheckoutModal';
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { SearchModal } from './components/modals/SearchModal';
import { Toast } from './components/ui/Toast';
import { ScrollToTop } from './components/ui/ScrollToTop';

import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

import { Product } from './types';

// Helper to determine if the URL corresponds to the admin route
const checkIsAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path.startsWith('/admin') ||
    hash.startsWith('#/admin') ||
    search.includes('admin=1') ||
    search.includes('admin=true')
  );
};

export const App: React.FC = () => {
  // Routing state
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminRoute());

  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored =
        localStorage.getItem('hope_admin_session') ||
        sessionStorage.getItem('hope_admin_session');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return parsed && parsed.user === 'denisehopecristais';
    } catch {
      return false;
    }
  });

  // Storefront states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Synchronize route with browser history (popstate / hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Navigation handlers
  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('hope_admin_session');
      sessionStorage.removeItem('hope_admin_session');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleOpenDetail = (product: Product) => {
    setDetailProduct(product);
  };

  const handleCloseDetail = () => {
    setDetailProduct(null);
  };

  // If in Admin route, render Admin views
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAuthenticated(true)}
          onBackToStore={navigateToStore}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={handleLogout}
        onViewStore={navigateToStore}
      />
    );
  }

  // Otherwise, render Public Storefront
  return (
    <div className="hope-store-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Fixo */}
      <Header
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Mobile Drawer Navigation */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* 2. Hero com vídeo e estética editorial */}
        <Hero />

        {/* 3. Manifesto / Frase de marca */}
        <BrandStatement />

        {/* 4. Produtos em destaque com filtros e badges */}
        <ProductSection
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onOpenDetail={handleOpenDetail}
        />

        {/* 6. Banner editorial */}
        <EditorialBanner />

        {/* 7. Nossa história */}
        <AboutSection />

        {/* 8. Experiência / Decoração */}
        <ExperienceSection onSelectCategory={handleSelectCategory} />

        {/* 9. Benefícios */}
        <Benefits />

        {/* 10. Instagram */}
        <InstagramSection />
      </main>

      {/* 12. Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={navigateToAdmin}
      />

      {/* Global Interactive Modals & Overlays */}
      <CartDrawer />
      <CheckoutModal />
      <ProductDetailModal product={detailProduct} onClose={handleCloseDetail} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleOpenDetail}
      />
      <Toast />
      <ScrollToTop />
    </div>
  );
};
