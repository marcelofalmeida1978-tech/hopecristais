export type ProductCategory =
  | 'Cristais'
  | 'Pulseiras'
  | 'Decoração'
  | 'Kits & Presentes'
  | 'Selenita'
  | 'Drusas'
  | 'Ametistas'
  | 'Diversos'
  | string;

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  priceFormatted: string;
  image: string;
  images?: string[];
  description: string;
  shortDescription?: string;
  details: string[];
  careInstructions?: string;
  keywords?: string[];
  dimensions?: string;
  weight?: string;
  isFeatured?: boolean;
  tag?: string;
  inStock?: boolean;
  quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingOption {
  id: number | string;
  name: string;
  price: number;
  priceFormatted: string;
  originalPrice?: number;
  originalPriceFormatted?: string;
  discount?: string;
  deliveryTime: number;
  deliveryTimeText: string;
  company: {
    id: number | string;
    name: string;
    picture?: string;
  };
}

export interface ShippingAddress {
  cep: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface ShippingFormData {
  fullName: string;
  whatsapp: string;
  email?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  selectedShipping?: ShippingOption;
}

