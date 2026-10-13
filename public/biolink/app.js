/**
 * HOPE CRISTAIS — MINI VITRINE DIGITAL & BIO LINK PREMIUM
 * Dynamic interactions, 3D perspective tracking & configurable URLs
 */

// ==========================================================================
// 1. CONFIGURAÇÕES & LINKS OFICIAIS
// ==========================================================================
export const CONFIG = {
  // WhatsApp oficial verificado na loja da Hope Cristais
  // Facilmente editável conforme requisitos do projeto
  WHATSAPP_URL: "https://wa.me/5519997456270?text=Ol%C3%A1%2C%20conheci%20a%20Hope%20Cristais%20e%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20os%20cristais",
  
  // Loja Oficial
  STORE_URL: "https://hopecristais.com.br",
  
  // Instagram Oficial
  INSTAGRAM_URL: "https://www.instagram.com/hopecristais/",

  // Detalhes dos Produtos em Destaque
  FEATURED_PRODUCTS: [
    {
      id: "drusa-ametista",
      name: "Drusa de Ametista",
      category: "Cristais",
      tag: "Destaque",
      url: "https://hopecristais.com.br"
    },
    {
      id: "drusa-branca",
      name: "Drusa Branca",
      category: "Cristais",
      tag: "Exclusivo",
      url: "https://hopecristais.com.br"
    }
  ]
};

// Tornar disponível globalmente para facilidade de personalização
window.HOPE_CONFIG = CONFIG;
window.WHATSAPP_URL = CONFIG.WHATSAPP_URL;

// ==========================================================================
// 2. MICROINTERAÇÕES E EFEITOS 3D
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initUrlBindings();
  init3DPerspectiveTilt();
  initAmbientLightFollow();
  initTouchHaptics();
});

/**
 * Vincula as URLs configuradas aos elementos interativos
 */
function initUrlBindings() {
  const waCard = document.getElementById("whatsapp-card");
  if (waCard) {
    waCard.href = CONFIG.WHATSAPP_URL;
  }

  const igCard = document.getElementById("instagram-card");
  if (igCard) {
    igCard.href = CONFIG.INSTAGRAM_URL;
  }

  const storeButtons = document.querySelectorAll(".store-link");
  storeButtons.forEach(btn => {
    btn.href = CONFIG.STORE_URL;
  });
}

/**
 * Efeito de Perspectiva 3D interativo para os produtos e cards
 * Proporciona sensação física de flutuação e profundidade
 */
function init3DPerspectiveTilt() {
  // Apenas ativar tracking refinado no desktop (mouse)
  if (window.matchMedia("(hover: hover)").matches) {
    const stage = document.querySelector(".showcase-stage");
    const items = document.querySelectorAll(".product-3d-item");

    if (stage && items.length) {
      stage.addEventListener("mousemove", (e) => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Tilt bounds: subtle ±8 degrees
        const rotateY = ((x - centerX) / centerX) * 8;
        const rotateX = -((y - centerY) / centerY) * 6;

        items.forEach((item, index) => {
          const crystal = item.querySelector(".floating-crystal");
          if (crystal) {
            // Diferenciação sutil de profundidade para cada item
            const multiplier = index === 0 ? 1 : 1.15;
            crystal.style.transform = `translateY(-18px) rotateX(${rotateX * multiplier}deg) rotateY(${rotateY * multiplier}deg) scale(1.04)`;
          }
        });
      });

      stage.addEventListener("mouseleave", () => {
        items.forEach((item, index) => {
          const crystal = item.querySelector(".floating-crystal");
          if (crystal) {
            crystal.style.transform = ""; // Retoma a animação CSS natural
          }
        });
      });
    }

    // Efeito suave nos cards editoriais
    const cards = document.querySelectorAll(".editorial-card");
    cards.forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Efeito de brilho de superfície (specular point)
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });

    // Efeito suave nos pedestais dos produtos 3D (Mini Vitrine)
    const productItems = document.querySelectorAll(".product-3d-item");
    productItems.forEach(item => {
      item.addEventListener("mousemove", (e) => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        item.style.setProperty("--mouse-x", `${x}px`);
        item.style.setProperty("--mouse-y", `${y}px`);
      });
    });
  }
}

/**
 * Segue suavemente o ponteiro com um halo de luz discreto (Desktop)
 */
function initAmbientLightFollow() {
  if (window.matchMedia("(hover: hover)").matches) {
    const ambientTop = document.querySelector(".bg-gradient-top");
    if (!ambientTop) return;

    let targetX = 0;
    let currentX = 0;

    window.addEventListener("mousemove", (e) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      targetX = normX * 40; // max 40px shift
    });

    const updateLight = () => {
      currentX += (targetX - currentX) * 0.05;
      ambientTop.style.transform = `translateX(calc(-50% + ${currentX}px))`;
      requestAnimationFrame(updateLight);
    };

    requestAnimationFrame(updateLight);
  }
}

/**
 * Microinterações táteis e efeito interativo no Mobile (Touch, Drag & Giroscópio)
 */
function initTouchHaptics() {
  const touchableCards = document.querySelectorAll(".editorial-card, .btn-cta-primary, .product-3d-item");
  const productItems = document.querySelectorAll(".product-3d-item");

  touchableCards.forEach(card => {
    // Ao tocar (touchstart)
    card.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = card.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
      card.classList.add("is-touch-active");
    }, { passive: true });

    // Ao arrastar o dedo sobre o card (touchmove)
    card.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = card.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    }, { passive: true });

    // Ao soltar (touchend)
    card.addEventListener("touchend", () => {
      setTimeout(() => {
        card.classList.remove("is-touch-active");
      }, 400);
    }, { passive: true });

    // Cancelar toque
    card.addEventListener("touchcancel", () => {
      card.classList.remove("is-touch-active");
    }, { passive: true });
  });

  // Interação de toque dedicada aos Cristais 3D na vitrine mobile
  productItems.forEach((item, index) => {
    item.addEventListener("touchstart", () => {
      const crystal = item.querySelector(".floating-crystal");
      if (crystal) {
        crystal.style.transform = `translateY(-26px) scale(1.08) rotate(${index === 0 ? '-0.5deg' : '1.8deg'})`;
      }
    }, { passive: true });

    item.addEventListener("touchend", () => {
      setTimeout(() => {
        const crystal = item.querySelector(".floating-crystal");
        if (crystal) {
          crystal.style.transform = "";
        }
      }, 450);
    }, { passive: true });
  });

  // Sensor Giroscópio: movimento orgânico ao inclinar o smartphone
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent === "function") {
    try {
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma === null) return;
        // gamma: inclinação lateral (-45° a 45°)
        // beta: inclinação vertical (típica de 35° a 60° segurando o celular)
        const tiltX = Math.max(-10, Math.min(10, e.gamma * 0.35));
        const tiltY = Math.max(-8, Math.min(8, (e.beta - 45) * 0.25));

        productItems.forEach((item, index) => {
          if (!item.classList.contains("is-touch-active")) {
            const crystal = item.querySelector(".floating-crystal");
            if (crystal) {
              const mult = index === 0 ? 1 : 1.15;
              crystal.style.transform = `translateY(-14px) rotateX(${-tiltY * mult}deg) rotateY(${tiltX * mult}deg) scale(1.02)`;
            }
          }
        });
      }, { passive: true });
    } catch (_) {
      // Ignora silenciosamente se o dispositivo restringir o sensor
    }
  }
}
