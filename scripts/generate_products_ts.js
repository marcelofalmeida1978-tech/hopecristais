import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const backupPath = path.join(projectRoot, 'products_supabase_backup.json');
const rawRows = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

function toProduct(row) {
  const priceNum = Number(row.price) || 0;

  let parsedQty = undefined;
  if (row.quantity !== undefined && row.quantity !== null && !isNaN(Number(row.quantity))) {
    parsedQty = Number(row.quantity);
  } else if (Array.isArray(row.keywords)) {
    const qtyTag = row.keywords.find((k) => typeof k === 'string' && k.startsWith('__stock_qty:'));
    if (qtyTag) {
      const extracted = parseInt(qtyTag.replace('__stock_qty:', ''), 10);
      if (!isNaN(extracted)) {
        parsedQty = extracted;
      }
    }
  }

  if (parsedQty === undefined) {
    parsedQty = row.in_stock === false ? 0 : 1;
  }
  parsedQty = Math.max(0, parsedQty);

  const cleanKeywords = Array.isArray(row.keywords)
    ? row.keywords.filter((k) => typeof k === 'string' && !k.startsWith('__stock_qty:'))
    : [];

  let imagePath = row.image;
  if (imagePath && imagePath.startsWith('data:image/')) {
    imagePath = `/products/${row.id}.jpg`;
  }

  let imagesList = [imagePath];
  if (Array.isArray(row.images) && row.images.length > 0) {
    imagesList = row.images.map((img, idx) => {
      if (img && img.startsWith('data:image/')) {
        return idx === 0 ? `/products/${row.id}.jpg` : `/products/${row.id}_${idx}.jpg`;
      }
      return img;
    });
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category === 'Outros' ? 'Diversos' : row.category,
    price: priceNum,
    priceFormatted:
      row.price_formatted ||
      `R$ ${priceNum.toFixed(2).replace('.', ',')}`,
    image: imagePath,
    images: imagesList,
    description: row.description || '',
    shortDescription:
      row.short_description ||
      (row.description ? row.description.slice(0, 100) : ''),
    dimensions: row.dimensions || undefined,
    weight: row.weight || undefined,
    inStock: row.in_stock !== false && parsedQty > 0,
    quantity: parsedQty,
    isFeatured: !!row.is_featured,
    tag: row.tag || undefined,
    details: Array.isArray(row.details) ? row.details : [],
    careInstructions: row.care_instructions || undefined,
    keywords: cleanKeywords
  };
}

const products = rawRows.map(toProduct);
products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const productsTsPath = path.join(projectRoot, 'src', 'data', 'products.ts');

const fileContent = `import { Product } from '../types';

/**
 * Número do WhatsApp da Hope Cristais para finalização de pedidos e atendimento.
 * Mantenha vazio ou configure no formato internacional: ex: "5511999999999"
 */
export const WHATSAPP_NUMBER = "5519997456270";

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

export const CATEGORIES_DATA = [
  {
    id: 'cristais',
    name: 'CRISTAIS',
    subtitle: 'Drusas, pontas e formações naturais em sua beleza pura.',
    image: '/assets/produto_ametista.jpg',
    categoryKey: 'Cristais' as const
  },
  {
    id: 'pulseiras',
    name: 'PULSEIRAS',
    subtitle: 'Acessórios em pedras autênticas para usar junto a você todos os dias.',
    image: '/assets/produto_pulseira_olho_tigre.jpg',
    categoryKey: 'Pulseiras' as const
  },
  {
    id: 'decoracao',
    name: 'DECORAÇÃO',
    subtitle: 'Objetos esculturais e conjuntos para transformar seu espaço com harmonia.',
    image: '/assets/produto_kit_agata_aromas.jpg',
    categoryKey: 'Decoração' as const
  },
  {
    id: 'kits-presentes',
    name: 'KITS & PRESENTES',
    subtitle: 'Combinações afetuosas pensadas para presentear quem você ama.',
    image: '/assets/produto_jardim_zen.jpg',
    categoryKey: 'Decoração' as const
  },
  {
    id: 'pedras-brutas',
    name: 'PEDRAS BRUTAS',
    subtitle: 'Minerais em seu estado puro e natural direto da terra.',
    image: '/products/hope-1790970732386-b4o1u.jpg',
    categoryKey: 'Pedras Brutas' as const
  },
  {
    id: 'geodos',
    name: 'GEODOS',
    subtitle: 'Cavidades rochosas revestidas por formações cristalinas mágicas.',
    image: '/products/hope-1790972793012-lmdpj.jpg',
    categoryKey: 'Geodos' as const
  },
  {
    id: 'drusas',
    name: 'DRUSAS',
    subtitle: 'Aglomerados de pontas brilhantes com energia revitalizante.',
    image: '/assets/produto_ametista.jpg',
    categoryKey: 'Drusas' as const
  },
  {
    id: 'pontas',
    name: 'PONTAS',
    subtitle: 'Geradores e pontas naturais para direcionar energia e equilíbrio.',
    image: '/products/hope-1790971159780-6er8l.jpg',
    categoryKey: 'Pontas' as const
  },
  {
    id: 'na-base',
    name: 'NA BASE',
    subtitle: 'Peças nobres em pedestais para compor ambientes exclusivos.',
    image: '/products/hope-1790968782855-4g7kj.jpg',
    categoryKey: 'Na Base' as const
  },
  {
    id: 'diversos',
    name: 'DIVERSOS',
    subtitle: 'Amuletos, peças únicas e itens especiais selecionados com afeto.',
    image: '/products/hope-1790968124121-ce4qi.jpg',
    categoryKey: 'Diversos' as const
  }
];

export const INSTAGRAM_POSTS = [
  {
    id: 'post-1',
    image: '/assets/produto_ametista.jpg',
    title: 'Drusa de Ametista'
  },
  {
    id: 'post-2',
    image: '/assets/team_founders.jpg',
    title: 'Nossa Equipe'
  },
  {
    id: 'post-3',
    image: '/assets/produto_kit_agata_aromas.jpg',
    title: 'Kit Ágata & Aromas'
  },
  {
    id: 'post-4',
    image: '/assets/produto_jardim_zen.jpg',
    title: 'Jardim Zen'
  },
  {
    id: 'post-5',
    image: '/assets/produto_pulseira_olho_tigre.jpg',
    title: 'Pulseira Olho de Tigre'
  },
  {
    id: 'post-6',
    image: '/assets/produto_drusa_branca.jpg',
    title: 'Drusa Branca'
  }
];
`;

fs.writeFileSync(productsTsPath, fileContent, 'utf8');
console.log(`Successfully generated ${productsTsPath} with ${products.length} products! Size: ${(fileContent.length / 1024).toFixed(1)} KB`);
