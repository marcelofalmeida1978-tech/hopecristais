import React from 'react';

/**
 * Utilitário de fallbacks visuais e tratamento seguro de erro de carregamento de imagens.
 * 
 * REGRA CRUCIAL:
 * NUNCA atribui fotos de outros produtos reais da loja (como Drusa de Ametista ou Ônix) como fallback.
 * Isso garante que novos produtos ou peças sem imagem não tenham suas fotos trocadas por outras peças.
 */

export const HOPE_PLACEHOLDER_PATH = '/assets/placeholder_produto.svg';

export const HOPE_INLINE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">' +
      '<defs>' +
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FBF9FD"/>' +
          '<stop offset="50%" stop-color="#F3EEF9"/>' +
          '<stop offset="100%" stop-color="#E9E1F3"/>' +
        '</linearGradient>' +
        '<linearGradient id="gem" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#8068B8"/>' +
          '<stop offset="100%" stop-color="#49338A"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="600" height="750" fill="url(#bg)"/>' +
      '<rect x="20" y="20" width="560" height="710" rx="16" fill="none" stroke="#E2D8EE" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>' +
      '<g transform="translate(300, 310)">' +
        '<circle cx="0" cy="0" r="90" fill="#FAF7FC" stroke="#D8CEEA" stroke-width="1.5"/>' +
        '<polygon points="0,-65 48,-20 30,55 -30,55 -48,-20" fill="#F4EFFB" stroke="url(#gem)" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<polyline points="0,-65 0,55" fill="none" stroke="url(#gem)" stroke-width="1.6" opacity="0.75"/>' +
        '<polyline points="-48,-20 0,-10 48,-20" fill="none" stroke="url(#gem)" stroke-width="1.6" opacity="0.75"/>' +
        '<polyline points="-30,55 0,-10 30,55" fill="none" stroke="url(#gem)" stroke-width="1.6" opacity="0.75"/>' +
      '</g>' +
      '<text x="300" y="460" text-anchor="middle" font-family="serif" font-size="20" font-weight="600" letter-spacing="4" fill="#49338A">HOPE CRISTAIS</text>' +
      '<text x="300" y="505" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="#7A6899">FOTO EM ATUALIZACAO</text>' +
      '<text x="300" y="530" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#9C8DB8">Peca autentica &amp; energizada</text>' +
    '</svg>'
  );

export const DEFAULT_PRODUCT_FALLBACK = HOPE_PLACEHOLDER_PATH;

export const CATEGORY_FALLBACKS: Record<string, string> = {
  'Cristais': HOPE_PLACEHOLDER_PATH,
  'Pulseiras': HOPE_PLACEHOLDER_PATH,
  'Decoração': HOPE_PLACEHOLDER_PATH,
  'Kits & Presentes': HOPE_PLACEHOLDER_PATH,
  'Pedras Brutas': HOPE_PLACEHOLDER_PATH,
  'Geodos': HOPE_PLACEHOLDER_PATH,
  'Drusas': HOPE_PLACEHOLDER_PATH,
  'Pontas': HOPE_PLACEHOLDER_PATH,
  'Na Base': HOPE_PLACEHOLDER_PATH,
  'Diversos': HOPE_PLACEHOLDER_PATH
};

/**
 * Retorna o fallback oficial e neutro da Hope Cristais.
 */
export function getFallbackImage(_category?: string): string {
  return HOPE_PLACEHOLDER_PATH;
}

/**
 * Handler seguro para o evento onError de tags <img>.
 * Substitui automaticamente imagens quebradas pelo placeholder neutro oficial da Hope Cristais,
 * evitando loops infinitos e nunca exibindo foto de outro produto.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  _category?: string
): void {
  const target = e.currentTarget;

  if (target.src && (target.src.endsWith(HOPE_PLACEHOLDER_PATH) || target.src.startsWith('data:image/svg+xml'))) {
    return;
  }

  // Tenta carregar o SVG estático da pasta /assets/; se falhar, usa o inline data URI
  target.onerror = () => {
    target.onerror = null;
    target.src = HOPE_INLINE_PLACEHOLDER;
  };
  target.src = HOPE_PLACEHOLDER_PATH;
}

