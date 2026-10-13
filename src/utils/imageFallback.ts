import React from 'react';

/**
 * Utilitário de fallbacks visuais e tratamento de erro de carregamento de imagens.
 * Garante que a vitrine, modais e carrinho sempre apresentem uma imagem de alta qualidade
 * caso uma peça ainda não tenha foto própria ou a URL esteja indisponível.
 */

export const DEFAULT_PRODUCT_FALLBACK = '/assets/produto_drusa_branca.jpg';

export const CATEGORY_FALLBACKS: Record<string, string> = {
  'Cristais': '/assets/produto_ametista.jpg',
  'Pulseiras': '/assets/produto_pulseira_olho_tigre.jpg',
  'Decoração': '/assets/produto_kit_agata_aromas.jpg',
  'Kits & Presentes': '/assets/produto_jardim_zen.jpg',
  'Pedras Brutas': '/assets/produto_drusa_branca.jpg',
  'Geodos': '/assets/produto_drusa_branca.jpg',
  'Drusas': '/assets/produto_ametista.jpg',
  'Pontas': '/assets/produto_ametista.jpg',
  'Na Base': '/assets/produto_ametista.jpg',
  'Diversos': '/assets/produto_drusa_branca.jpg'
};

/**
 * Retorna a imagem de fallback ideal para a categoria informada.
 */
export function getFallbackImage(category?: string): string {
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }
  return DEFAULT_PRODUCT_FALLBACK;
}

/**
 * Handler seguro para o evento onError de tags <img>.
 * Substitui automaticamente imagens quebradas ou não encontradas por uma foto autêntica correspondente.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = e.currentTarget;
  const fallback = getFallbackImage(category);

  // Evitar loops caso o fallback também não seja encontrado
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
