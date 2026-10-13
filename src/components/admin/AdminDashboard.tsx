import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types';
import { Logo } from '../ui/Logo';
import { compressImage } from '../../utils/imageCompressor';
import { handleImageError, getFallbackImage } from '../../utils/imageFallback';
import {
  Plus,
  Upload,
  Image as ImageIcon,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  CloudLightning,
  ExternalLink,
  Search,
  LogOut,
  Sparkles,
  Download,
  Tag,
  AlertCircle,
  Database,
  Settings,
  Link2,
  Package
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onViewStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onViewStore }) => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleStock,
    addCategory,
    deleteCategories,
    deployHookUrl,
    setDeployHookUrl,
    supabaseUrl,
    setSupabaseUrl,
    supabaseConnected,
    isConnectingSupabase,
    isInitialLoading,
    hasLoadedSupabase,
    reconnectSupabase,
    triggerDeploy
  } = useProducts();

  // Enquanto o Supabase estiver conectando na inicialização e o catálogo do banco ainda não tiver terminado de carregar,
  // ocultamos qualquer resquício antigo ou desatualizado do cache local para exibir direto os 68 produtos oficiais.
  const isAwaitingSupabase = !hasLoadedSupabase && (isConnectingSupabase || isInitialLoading);

  // Conectar o Supabase automaticamente ao abrir o painel administrativo
  useEffect(() => {
    if (!supabaseConnected && !isConnectingSupabase) {
      reconnectSupabase();
    }
  }, []);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseUrl);
  const [tempDeployHookUrl, setTempDeployHookUrl] = useState(deployHookUrl);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Deploy Modal & Progress State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployStep, setDeployStep] = useState<number>(0);
  const [deployStatusText, setDeployStatusText] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);

  // Category Management State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isDeleteCategoriesModalOpen, setIsDeleteCategoriesModalOpen] = useState(false);
  const [selectedCategoriesToDelete, setSelectedCategoriesToDelete] = useState<string[]>([]);

  // Product Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cristais');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDimensions, setFormDimensions] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formQuantity, setFormQuantity] = useState<number | string>(1);
  const [formImageProcessing, setFormImageProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to add new category
  const handleConfirmAddCategory = () => {
    const clean = newCategoryInput.trim();
    if (!clean) return;

    const success = addCategory(clean);
    if (success) {
      setFormCategory(clean);
      setNewCategoryInput('');
      setIsAddCategoryOpen(false);
    } else {
      alert(`A categoria "${clean}" já existe ou é inválida.`);
    }
  };

  // Handle Opening Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0] || 'Cristais');
    setFormCustomCategory('');
    setFormPrice('');
    setFormDescription('');
    setFormDimensions('');
    setFormWeight('');
    setFormImage('');
    setFormInStock(true);
    setFormQuantity(1);
    setFormError(null);
    setIsAddCategoryOpen(false);
    setNewCategoryInput('');
    setIsProductModalOpen(true);
  };

  // Handle Opening Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category || 'Diversos');
    setFormCustomCategory('');
    // Formata o preço de forma amigável (ex: 249,00)
    setFormPrice(
      product.price > 0
        ? product.price.toFixed(2).replace('.', ',')
        : product.price === 0
        ? '0,00'
        : product.price.toString()
    );
    setFormDescription(product.description || '');
    setFormDimensions(product.dimensions || '');
    setFormWeight(product.weight || '');
    setFormImage(product.image || '');
    setFormInStock(product.inStock !== false);
    setFormQuantity(
      product.quantity !== undefined
        ? product.quantity
        : (product.inStock === false ? 0 : 1)
    );
    setFormError(null);
    setIsAddCategoryOpen(false);
    setNewCategoryInput('');
    setIsProductModalOpen(true);
  };

  // Handle Device Photo Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFormImageProcessing(true);
      setFormError(null);
      // Otimiza e converte foto do celular/computador
      const compressedDataUrl = await compressImage(file, 1200, 1200, 0.84);
      setFormImage(compressedDataUrl);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao processar a foto selecionada.';
      setFormError(msg);
    } finally {
      setFormImageProcessing(false);
      // Limpa o valor do input para permitir selecionar a mesma imagem novamente se quiser
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Submit Product Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Informe o nome da peça.');
      return;
    }

    // Processamento flexível do preço (suporta 249, 249,00, 249.00, R$ 249,00)
    const cleanPriceStr = formPrice.toString().replace(/[^0-9,.]/g, '').trim();
    let parsedPrice = 0;
    if (cleanPriceStr.includes(',') && cleanPriceStr.includes('.')) {
      parsedPrice = parseFloat(cleanPriceStr.replace(/\./g, '').replace(',', '.'));
    } else if (cleanPriceStr.includes(',')) {
      parsedPrice = parseFloat(cleanPriceStr.replace(',', '.'));
    } else {
      parsedPrice = parseFloat(cleanPriceStr);
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Informe um preço válido (ex: 249,00).');
      return;
    }

    if (!formImage.trim()) {
      setFormError('Selecione ou mantenha a foto da peça.');
      return;
    }

    const parsedQuantity = parseInt(formQuantity.toString(), 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setFormError('Informe uma quantidade válida para o estoque (mínimo 0).');
      return;
    }

    const isAvailable = formInStock && parsedQuantity > 0;

    const finalCategory = (formCategory === 'Diversos' && formCustomCategory.trim()
      ? formCustomCategory.trim()
      : formCategory) as string;

    const formattedPriceStr = `R$ ${parsedPrice.toFixed(2).replace('.', ',')}`;

    let finalImage = formImage.trim();
    if (
      finalImage &&
      !finalImage.startsWith('http://') &&
      !finalImage.startsWith('https://') &&
      !finalImage.startsWith('data:image/') &&
      !finalImage.startsWith('/')
    ) {
      finalImage = `/products/${finalImage}`;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        category: finalCategory,
        price: parsedPrice,
        priceFormatted: formattedPriceStr,
        description: formDescription.trim(),
        shortDescription: formDescription.trim().slice(0, 100),
        dimensions: formDimensions.trim() || undefined,
        weight: formWeight.trim() || undefined,
        image: finalImage,
        images: [finalImage],
        inStock: isAvailable,
        quantity: parsedQuantity
      });
    } else {
      addProduct({
        name: formName.trim(),
        category: finalCategory,
        price: parsedPrice,
        priceFormatted: formattedPriceStr,
        description: formDescription.trim(),
        shortDescription: formDescription.trim().slice(0, 100),
        dimensions: formDimensions.trim() || undefined,
        weight: formWeight.trim() || undefined,
        image: finalImage,
        images: [finalImage],
        inStock: isAvailable,
        quantity: parsedQuantity,
        details: [
          'Peça 100% natural',
          'Energizada e selecionada manualmente',
          'Envio seguro em embalagem protegida'
        ],
        keywords: [formName.toLowerCase(), finalCategory.toLowerCase(), 'cristal', 'pedra']
      });
    }

    setIsProductModalOpen(false);
  };

  // Handle Deploy Action
  const handleDeployToVercel = async () => {
    setIsDeployModalOpen(true);
    setIsDeploying(true);
    setDeployStep(1);
    setDeployStatusText('Salvando alterações pendentes no banco de dados...');

    await new Promise((r) => setTimeout(r, 400));
    setDeployStep(2);
    setDeployStatusText('Puxando todos os produtos e categorias cadastradas no Supabase...');

    const result = await triggerDeploy();

    setDeployStep(3);
    setDeployStatusText('Atualizando vitrine da loja e painel administrativo...');
    await new Promise((r) => setTimeout(r, 500));

    setDeployStep(4);
    setDeployStatusText(result.message || 'Todos os produtos foram puxados do Supabase e sincronizados com a loja online!');
    setIsDeploying(false);
  };

  // Salvar configurações de Supabase e Vercel
  const handleSaveSettings = async () => {
    setSettingsStatus('Salvando configurações...');
    setDeployHookUrl(tempDeployHookUrl);
    await setSupabaseUrl(tempSupabaseUrl);
    setSettingsStatus('Configurações salvas com sucesso!');
    setTimeout(() => {
      setSettingsStatus(null);
      setIsSettingsModalOpen(false);
    }, 1200);
  };

  // Export updated products as TS file
  const handleExportProductsCode = () => {
    const jsonStr = JSON.stringify(products, null, 2);
    const code = `import { Product } from '../types';\n\nexport const PRODUCTS: Product[] = ${jsonStr};\n\nexport const WHATSAPP_NUMBER = '5511999999999';\n`;
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-hope-${new Date().toISOString().slice(0, 10)}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;

    const isAvail = p.inStock !== false && (p.quantity === undefined || p.quantity > 0);
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && isAvail) ||
      (stockFilter === 'out_of_stock' && !isAvail);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.inStock !== false && (p.quantity === undefined || p.quantity > 0)).length;
  const outOfStockCount = totalProducts - inStockCount;
  const totalPiecesInStock = products.reduce((acc, p) => {
    const isAvail = p.inStock !== false && (p.quantity === undefined || p.quantity > 0);
    const qty = isAvail ? (p.quantity !== undefined ? p.quantity : 1) : 0;
    return acc + qty;
  }, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F4', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(142, 68, 173, 0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Logo variant="purple" height={36} layout="horizontal" />
            <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--hope-purple-dark)',
                    letterSpacing: '0.04em'
                  }}
                >
                  PAINEL DA PROPRIETÁRIA
                </span>
                <span
                  style={{
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.06em'
                  }}
                >
                  ADMIN
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                Gestão de Estoque, Fotos & Publicação Automática
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Supabase Status Pill */}
            {supabaseConnected ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid #BBF7D0'
                }}
                title="Banco de dados Supabase conectado e sincronizado"
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                <span>Supabase Conectado</span>
              </div>
            ) : isConnectingSupabase ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid #BFDBFE'
                }}
                title="Conectando automaticamente ao banco Supabase..."
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: '2px solid #2563EB',
                    borderTopColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <span>Conectando Supabase...</span>
              </div>
            ) : (
              <button
                onClick={() => reconnectSupabase()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FCD34D',
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Clique para reconectar ao Supabase"
              >
                <Database size={13} />
                <span>Reconectar Supabase</span>
              </button>
            )}

            {/* Deploy Button */}
            <button
              onClick={handleDeployToVercel}
              style={{
                backgroundColor: 'var(--hope-purple)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(107, 43, 114, 0.3)',
                transition: 'all 0.2s ease'
              }}
              title="Salva alterações no Supabase e atualiza o site na Vercel"
            >
              <CloudLightning size={16} />
              <span>SALVAR E ATUALIZAR SITE</span>
            </button>

            {/* Configurações (Settings) */}
            <button
              onClick={() => {
                setTempSupabaseUrl(supabaseUrl);
                setTempDeployHookUrl(deployHookUrl);
                setIsSettingsModalOpen(true);
              }}
              style={{
                backgroundColor: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Configurações de Conexão (Supabase & Vercel)"
            >
              <Settings size={15} />
              <span>Configurações</span>
            </button>

            {/* View Live Store */}
            <button
              onClick={onViewStore}
              style={{
                backgroundColor: '#FAF5FF',
                color: 'var(--hope-purple)',
                border: '1px solid #DDD6FE',
                borderRadius: '8px',
                padding: '9px 14px',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ExternalLink size={15} />
              <span>Ver Loja</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              style={{
                backgroundColor: 'transparent',
                color: '#94A3B8',
                border: 'none',
                borderRadius: '8px',
                padding: '9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Sair do Painel"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
        {/* KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          {/* Card 1: Total Modelos */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(142, 68, 173, 0.1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Total de Peças Cadastradas
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--hope-purple-dark)', fontWeight: 600, margin: '6px 0 0' }}>
                {isAwaitingSupabase ? (
                  <span style={{ display: 'inline-block', width: '38px', height: '24px', backgroundColor: '#EDE9FE', borderRadius: '6px', animation: 'pulse 1.2s infinite' }}>&nbsp;</span>
                ) : (
                  totalProducts
                )}
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F3E8FF', color: 'var(--hope-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={22} />
            </div>
          </div>

          {/* Card 2: Peças Disponíveis em Estoque (Unidades) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(142, 68, 173, 0.18)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: 'var(--hope-purple)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Unidades em Estoque
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--hope-purple-dark)', fontWeight: 700, margin: '6px 0 0' }}>
                {isAwaitingSupabase ? (
                  <span style={{ display: 'inline-block', width: '38px', height: '24px', backgroundColor: '#F3E8FF', borderRadius: '6px', animation: 'pulse 1.2s infinite' }}>&nbsp;</span>
                ) : (
                  `${totalPiecesInStock} un.`
                )}
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FAF5FF', color: 'var(--hope-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E9D5FF' }}>
              <Package size={22} />
            </div>
          </div>

          {/* Card 3: Modelos Disponíveis */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#047857', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Modelos Disponíveis
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#065F46', fontWeight: 600, margin: '6px 0 0' }}>
                {isAwaitingSupabase ? (
                  <span style={{ display: 'inline-block', width: '38px', height: '24px', backgroundColor: '#D1FAE5', borderRadius: '6px', animation: 'pulse 1.2s infinite' }}>&nbsp;</span>
                ) : (
                  inStockCount
                )}
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Card 4: Baixados / Esgotados */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Modelos Esgotados
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#991B1B', fontWeight: 600, margin: '6px 0 0' }}>
                {isAwaitingSupabase ? (
                  <span style={{ display: 'inline-block', width: '38px', height: '24px', backgroundColor: '#FEE2E2', borderRadius: '6px', animation: 'pulse 1.2s infinite' }}>&nbsp;</span>
                ) : (
                  outOfStockCount
                )}
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Add Product */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(142, 68, 173, 0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, categoria ou cristal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                backgroundColor: '#FAFAF9'
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#334155'
              }}
            >
              <option value="Todos">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'in_stock' | 'out_of_stock')}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#334155'
              }}
            >
              <option value="all">Status: Todos</option>
              <option value="in_stock">Apenas Disponíveis</option>
              <option value="out_of_stock">Apenas Baixados / Esgotados</option>
            </select>

            {/* Add New Product Button */}
            <button
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: 'var(--hope-purple)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(107, 43, 114, 0.25)'
              }}
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Product Table / Cards */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(142, 68, 173, 0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}
        >
          {isAwaitingSupabase ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '3px solid #EDE9FE',
                  borderTopColor: 'var(--hope-purple)',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '16px'
                }}
              />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--hope-purple-dark)', margin: '0 0 6px', fontWeight: 600 }}>
                Conectando ao Supabase...
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
                Sincronizando as peças salvas no banco de dados com fotos e estoque atualizado.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Sparkles size={36} color="var(--hope-purple)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--hope-purple-dark)', margin: '0 0 6px' }}>
                Nenhuma peça encontrada
              </h3>
              <p style={{ fontSize: '13px', margin: 0 }}>
                Tente ajustar os filtros de busca ou adicione um novo produto ao catálogo.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EDE9FE', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ padding: '14px 20px', width: '80px' }}>Foto</th>
                    <th style={{ padding: '14px 20px' }}>Nome & Categoria</th>
                    <th style={{ padding: '14px 20px' }}>Preço</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>Peças Disponíveis</th>
                    <th style={{ padding: '14px 20px' }}>Status na Loja</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>Dar Baixa / Estoque</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isInStock = p.inStock !== false;
                    const stockQuantity = p.quantity !== undefined ? p.quantity : (isInStock ? 1 : 0);
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                          opacity: isInStock && stockQuantity > 0 ? 1 : 0.75
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF5FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Photo */}
                        <td style={{ padding: '12px 20px' }}>
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#F8F6F4',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={p.image || getFallbackImage(p.category)}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => handleImageError(e, p.category)}
                            />
                          </div>
                        </td>

                        {/* Name & Category */}
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--hope-purple-dark)', fontSize: '14px' }}>
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span
                              style={{
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {p.category}
                            </span>
                            {p.dimensions && (
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>• {p.dimensions}</span>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td style={{ padding: '12px 20px', fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                          R$ {p.price.toFixed(2).replace('.', ',')}
                        </td>

                        {/* Quantity Column */}
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              backgroundColor:
                                stockQuantity === 1 && isInStock
                                  ? '#FEF3C7'
                                  : stockQuantity > 1 && isInStock
                                  ? '#F3E8FF'
                                  : '#FEE2E2',
                              color:
                                stockQuantity === 1 && isInStock
                                  ? '#92400E'
                                  : stockQuantity > 1 && isInStock
                                  ? 'var(--hope-purple)'
                                  : '#991B1B',
                              border: `1px solid ${
                                stockQuantity === 1 && isInStock
                                  ? '#FDE68A'
                                  : stockQuantity > 1 && isInStock
                                  ? '#DDD6FE'
                                  : '#FECACA'
                              }`
                            }}
                          >
                            {isInStock && stockQuantity === 1
                              ? '✨ 1 peça'
                              : isInStock && stockQuantity > 1
                              ? `📦 ${stockQuantity} peças`
                              : '0 peças'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '12px 20px' }}>
                          {isInStock ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: '#D1FAE5',
                                color: '#065F46',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: '14px'
                              }}
                            >
                              <CheckCircle2 size={13} />
                              Disponível
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: '14px'
                              }}
                            >
                              <XCircle size={13} />
                              Baixado (Esgotado)
                            </span>
                          )}
                        </td>

                        {/* Toggle Stock ("Dar Baixa") */}
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleStock(p.id)}
                            style={{
                              backgroundColor: isInStock ? '#FEF2F2' : '#ECFDF5',
                              color: isInStock ? '#DC2626' : '#059669',
                              border: `1px solid ${isInStock ? '#FCA5A5' : '#6EE7B7'}`,
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={isInStock ? 'Dar baixa e marcar como esgotado' : 'Reativar produto e torná-lo disponível'}
                          >
                            {isInStock ? 'Dar Baixa (Vendido)' : 'Reativar Estoque'}
                          </button>
                        </td>

                        {/* Actions (Edit / Delete) */}
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              style={{
                                backgroundColor: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Editar dados da peça"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja realmente excluir "${p.name}" do catálogo?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              style={{
                                backgroundColor: '#FFF5F5',
                                color: '#E53E3E',
                                border: '1px solid #FED7D7',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer'
                              }}
                              title="Excluir peça do catálogo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Utility Bar */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleExportProductsCode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--hope-purple)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              <Download size={14} />
              Exportar Arquivo products.ts
            </button>
          </div>

          <div>
            <span>
              Endereço da Loja:{' '}
              <a
                href="https://hopecristais.com.br"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--hope-purple)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                hopecristais.com.br
              </a>
            </span>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--hope-purple)', fontWeight: 700 }}>
                  {editingProduct ? 'Editar Peça' : 'Nova Peça'}
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--hope-purple-dark)', margin: '4px 0 0' }}>
                  {editingProduct ? `Editar: ${editingProduct.name}` : 'Cadastrar Produto no Catálogo'}
                </h2>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Image Upload Area */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Foto da Peça (Subir do Dispositivo) *
                </label>

                <input
                  type="file"
                  accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {formImage ? (
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      backgroundColor: '#FAF5FF',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          backgroundColor: '#FFF',
                          border: '1px solid #DDD6FE',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={formImage || getFallbackImage(formCategory)}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => handleImageError(e, formCategory)}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
                          <CheckCircle2 size={16} />
                          Foto da Peça Definida
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                          Foto pronta e salva no catálogo.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: 'var(--hope-purple)',
                        border: '1px solid #DDD6FE',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #DDD6FE',
                      borderRadius: '12px',
                      backgroundColor: '#FAF5FF',
                      padding: '24px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'border 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--hope-purple)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#DDD6FE')}
                  >
                    {formImageProcessing ? (
                      <div style={{ padding: '12px', color: 'var(--hope-purple)', fontSize: '13px' }}>
                        <span>Otimizando e comprimindo imagem...</span>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#EDE9FE',
                            color: 'var(--hope-purple)',
                            margin: '0 auto 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Upload size={20} />
                        </div>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--hope-purple-dark)', margin: '0 0 4px' }}>
                          Clique para escolher a foto do seu celular ou computador
                        </p>
                        <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                          Aceita fotos da câmera ou galeria (todos os celulares: iPhone HEIC, Android, JPEG, PNG, WebP)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Opção para inserir link externo caso desejado (não obrigatório) */}
                <div style={{ marginTop: '8px' }}>
                  <details style={{ fontSize: '12px', color: '#64748B' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--hope-purple)', fontWeight: 500, userSelect: 'none' }}>
                      + Ou inserir link/endereço externo da imagem (opcional)
                    </summary>
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/foto.jpg"
                        value={formImage.startsWith('data:') ? '' : formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12px',
                          outline: 'none',
                          backgroundColor: '#FAFAF9'
                        }}
                      />
                    </div>
                  </details>
                </div>
              </div>

              {/* Name & Category Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Nome da Peça *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Drusa de Ametista Imperial"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', textTransform: 'uppercase' }}>
                      Categoria *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--hope-purple)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 4px'
                        }}
                        title="Cadastrar uma nova categoria"
                      >
                        <Plus size={12} />
                        Criar Nova
                      </button>
                      <span style={{ color: '#CBD5E1', fontSize: '11px' }}>|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoriesToDelete([]);
                          setIsDeleteCategoriesModalOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 4px'
                        }}
                        title="Excluir uma ou mais categorias"
                      >
                        <Trash2 size={12} />
                        Excluir
                      </button>
                    </div>
                  </div>

                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__CREATE_NEW__') {
                        setIsAddCategoryOpen(true);
                        return;
                      }
                      if (val === '__DELETE_CATEGORY__') {
                        setSelectedCategoriesToDelete([]);
                        setIsDeleteCategoriesModalOpen(true);
                        return;
                      }
                      setFormCategory(val);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none',
                      backgroundColor: '#FFF'
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option disabled style={{ color: '#94A3B8' }}>
                      ──────────
                    </option>
                    <option value="__CREATE_NEW__">➕ Criar Nova Categoria...</option>
                    <option value="__DELETE_CATEGORY__">🗑 Excluir Categoria...</option>
                  </select>

                  {/* Criação de nova categoria inline */}
                  {isAddCategoryOpen && (
                    <div
                      style={{
                        marginTop: '8px',
                        backgroundColor: '#FAF5FF',
                        border: '1px solid #DDD6FE',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hope-purple)', textTransform: 'uppercase' }}>
                          Nome da Nova Categoria:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddCategoryOpen(false);
                            setNewCategoryInput('');
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Ex: Selenita, Incensos..."
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleConfirmAddCategory();
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            outline: 'none',
                            backgroundColor: '#FFFFFF'
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleConfirmAddCategory}
                          style={{
                            backgroundColor: 'var(--hope-purple)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '7px 12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price, Quantity & Stock Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 249,00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Peças Disponíveis (Estoque) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="Ex: 5"
                    value={formQuantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormQuantity(val);
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed)) {
                        if (parsed === 0) {
                          setFormInStock(false);
                        } else if (parsed > 0 && !formInStock) {
                          setFormInStock(true);
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Status da Peça
                  </label>
                  <select
                    value={formInStock && Number(formQuantity) > 0 ? 'true' : 'false'}
                    onChange={(e) => {
                      const inStockVal = e.target.value === 'true';
                      setFormInStock(inStockVal);
                      if (inStockVal && Number(formQuantity) <= 0) {
                        setFormQuantity(1);
                      } else if (!inStockVal) {
                        setFormQuantity(0);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      outline: 'none',
                      backgroundColor: '#FFF'
                    }}
                  >
                    <option value="true">Disponível para Compra</option>
                    <option value="false">Dar Baixa (Já Esgotado)</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: '-4px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: Number(formQuantity) > 0 && formInStock ? '#F0FDF4' : '#FEF2F2',
                  color: Number(formQuantity) > 0 && formInStock ? '#166534' : '#991B1B',
                  border: `1px solid ${Number(formQuantity) > 0 && formInStock ? '#BBF7D0' : '#FECACA'}`
                }}
              >
                {Number(formQuantity) === 1 && formInStock ? (
                  <span>✨ <strong>1 peça disponível:</strong> será exibida na loja com o selo especial <em>"Peça Única (1 un. disponível)"</em>.</span>
                ) : Number(formQuantity) > 1 && formInStock ? (
                  <span>📦 <strong>{formQuantity} peças disponíveis:</strong> os clientes poderão comprar exatamente até {formQuantity} unidades desta peça na loja.</span>
                ) : (
                  <span>⚠️ <strong>0 peças cadastradas:</strong> a peça ficará marcada como <em>"Esgotada"</em> e com compra desabilitada na loja.</span>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--hope-purple-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Descrição & Propriedades
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva a pedra, tonalidade, energias e proposta estética..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Dimensions & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                    Dimensões (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14 x 9 x 8 cm"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                    Peso Aproximado (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 480g"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={formImageProcessing}
                  style={{
                    backgroundColor: 'var(--hope-purple)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(107, 43, 114, 0.3)'
                  }}
                >
                  <Sparkles size={16} />
                  <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar Peça'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DEPLOY NA VERCEL FEEDBACK */}
      {/* ======================================================== */}
      {isDeployModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '36px 30px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isDeploying ? '#EDE9FE' : '#D1FAE5',
                color: isDeploying ? 'var(--hope-purple)' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              {isDeploying ? <CloudLightning size={32} /> : <CheckCircle2 size={32} />}
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--hope-purple-dark)', margin: '0 0 10px' }}>
              {isDeploying ? 'Atualizando Dados no Site...' : 'Site Atualizado com Sucesso!'}
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              {deployStatusText}
            </p>

            {/* Checklist Steps */}
            <div style={{ textAlign: 'left', backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: deployStep >= 1 ? '#059669' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Alterações salvas no banco de dados</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: deployStep >= 2 ? '#059669' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Todos os produtos cadastrados puxados do Supabase</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: deployStep >= 3 ? '#059669' : '#94A3B8' }}>
                <CheckCircle2 size={16} />
                <span>Painel administrativo e loja online 100% atualizados</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {!isDeploying && (
                <>
                  <button
                    onClick={() => setIsDeployModalOpen(false)}
                    style={{
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 20px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Fechar
                  </button>

                  <a
                    href="https://hopecristais.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: 'var(--hope-purple)',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '11px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={15} />
                    Abrir Loja ao Vivo
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EXCLUIR CATEGORIAS */}
      {/* ======================================================== */}
      {isDeleteCategoriesModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            padding: '16px'
          }}
          onClick={() => setIsDeleteCategoriesModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--hope-purple-dark)', margin: 0 }}>
                    Excluir Categorias
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                    Selecione as categorias que deseja remover
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteCategoriesModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Warning / Explanation alert */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: '#991B1B',
                lineHeight: 1.5,
                marginBottom: '18px'
              }}
            >
              Ao excluir, todas as peças que possuíam as categorias selecionadas ficarão <strong>automaticamente com a categoria "Diversos"</strong>.
            </div>

            {/* Categories Checkbox List */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {categories.filter((cat) => cat !== 'Diversos').length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '20px 0' }}>
                  Nenhuma categoria disponível para exclusão.
                </p>
              ) : (
                categories
                  .filter((cat) => cat !== 'Diversos')
                  .map((cat) => {
                    const isChecked = selectedCategoriesToDelete.includes(cat);
                    const productCount = products.filter((p) => p.category === cat).length;

                    return (
                      <label
                        key={cat}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${isChecked ? '#F87171' : '#E2E8F0'}`,
                          backgroundColor: isChecked ? '#FFF5F5' : '#FAFAF9',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategoriesToDelete((prev) => [...prev, cat]);
                              } else {
                                setSelectedCategoriesToDelete((prev) => prev.filter((c) => c !== cat));
                              }
                            }}
                            style={{ accentColor: '#DC2626', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: isChecked ? '#991B1B' : '#1E293B' }}>
                            {cat}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11.5px',
                            color: productCount > 0 ? (isChecked ? '#991B1B' : '#64748B') : '#94A3B8',
                            backgroundColor: isChecked ? '#FEE2E2' : '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}
                        >
                          {productCount === 1 ? '1 produto' : `${productCount} produtos`}
                        </span>
                      </label>
                    );
                  })
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsDeleteCategoriesModalOpen(false)}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={selectedCategoriesToDelete.length === 0}
                onClick={() => {
                  deleteCategories(selectedCategoriesToDelete);
                  if (selectedCategoriesToDelete.includes(formCategory)) {
                    setFormCategory('Diversos');
                  }
                  setIsDeleteCategoriesModalOpen(false);
                  setSelectedCategoriesToDelete([]);
                }}
                style={{
                  backgroundColor: selectedCategoriesToDelete.length === 0 ? '#CBD5E1' : '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: selectedCategoriesToDelete.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} />
                <span>
                  Excluir Selecionadas {selectedCategoriesToDelete.length > 0 ? `(${selectedCategoriesToDelete.length})` : ''}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIGURAÇÕES DE CONEXÃO (SUPABASE & VERCEL) */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            padding: '16px'
          }}
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#EDE9FE', color: 'var(--hope-purple)', padding: '8px', borderRadius: '10px' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--hope-purple-dark)' }}>
                    Configurações de Integração
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    Conexão com Banco de Dados Supabase e Deploy na Vercel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {settingsStatus && (
              <div
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{settingsStatus}</span>
              </div>
            )}

            {/* Supabase Section */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '18px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={17} color="var(--hope-purple)" />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>Banco de Dados Supabase</span>
                </div>
                <span
                  style={{
                    backgroundColor: supabaseConnected ? '#DCFCE7' : isConnectingSupabase ? '#EFF6FF' : '#FEF3C7',
                    color: supabaseConnected ? '#15803D' : isConnectingSupabase ? '#2563EB' : '#B45309',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {supabaseConnected ? 'Conectado' : isConnectingSupabase ? 'Conectando...' : 'Aguardando Conexão'}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  URL do Projeto Supabase (Project URL)
                </label>
                <input
                  type="text"
                  placeholder="https://exemplo.supabase.co"
                  value={tempSupabaseUrl}
                  onChange={(e) => setTempSupabaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Encontre em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
                </span>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>🔑 <strong>Publishable Key:</strong> <code style={{ backgroundColor: '#EEF2F6', padding: '2px 4px', borderRadius: '4px' }}>Protegida no Ambiente (.env)</code></div>
                <div>🔒 <strong>Secret Key:</strong> <code style={{ backgroundColor: '#EEF2F6', padding: '2px 4px', borderRadius: '4px' }}>Protegida no Ambiente (.env)</code></div>
              </div>
            </div>

            {/* Vercel Deploy Hook Section */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '18px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CloudLightning size={17} color="var(--hope-purple)" />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>Deploy Automático Vercel</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  URL do Deploy Hook (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  value={tempDeployHookUrl}
                  onChange={(e) => setTempDeployHookUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Encontre em: Vercel &gt; Project Settings &gt; Git &gt; Deploy Hooks &gt; Criar Hook.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                style={{
                  backgroundColor: 'var(--hope-purple)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
