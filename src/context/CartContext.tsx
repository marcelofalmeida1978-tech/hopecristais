import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  subtotalFormatted: string;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  toast: { show: boolean; message: string; productName?: string } | null;
  hideToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hope_cristais_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Garante que toda vez que o site for carregado, o carrinho inicia 100% vazio
  const [items, setItems] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; productName?: string } | null>(null);

  // Limpa qualquer dado residual de sessões anteriores
  useEffect(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      // safe
    }
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    const maxAvailable = product.quantity !== undefined
      ? Math.max(0, product.quantity)
      : (product.inStock === false ? 0 : 999);

    if (maxAvailable <= 0 || product.inStock === false) {
      setToast({
        show: true,
        message: 'Esta peça está esgotada no momento!',
        productName: product.name
      });
      return;
    }

    let reachedLimit = false;

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        const currentQty = existing.quantity;
        if (currentQty >= maxAvailable) {
          reachedLimit = true;
          setToast({
            show: true,
            message: `Limite de estoque já atingido (${maxAvailable} ${maxAvailable === 1 ? 'unidade' : 'unidades'})!`,
            productName: product.name
          });
          return prevItems;
        }

        const newQty = Math.min(maxAvailable, currentQty + quantity);
        if (currentQty + quantity > maxAvailable) {
          setToast({
            show: true,
            message: `Ajustado para o limite máximo (${maxAvailable} un. disponíveis)`,
            productName: product.name
          });
        } else {
          setToast({
            show: true,
            message: 'Adicionado à sua sacola!',
            productName: product.name
          });
        }

        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, product: { ...item.product, quantity: maxAvailable } }
            : item
        );
      }

      const safeQuantity = Math.min(maxAvailable, Math.max(1, quantity));
      setToast({
        show: true,
        message: 'Adicionado à sua sacola!',
        productName: product.name
      });
      return [...prevItems, { product: { ...product, quantity: maxAvailable }, quantity: safeQuantity }];
    });

    if (!reachedLimit) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAvailable = item.product.quantity !== undefined
            ? Math.max(0, item.product.quantity)
            : (item.product.inStock === false ? 0 : 999);

          const clampedQty = Math.min(maxAvailable, quantity);
          if (quantity > maxAvailable) {
            setToast({
              show: true,
              message: `Estoque máximo atingido: ${maxAvailable} un. disponíveis`,
              productName: item.product.name
            });
          }
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const subtotalFormatted = subtotal === 0 ? 'R$ 00,00' : `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const hideToast = () => setToast(null);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        subtotalFormatted,
        isCartOpen,
        openCart,
        closeCart,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        toast,
        hideToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
