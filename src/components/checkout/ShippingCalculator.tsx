import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, Clock, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ShippingOption, ShippingAddress, CartItem } from '../../types';
import { calculateShipping, formatCep } from '../../services/shippingService';

interface ShippingCalculatorProps {
  items: CartItem[];
  selectedOption?: ShippingOption | null;
  onSelectOption: (option: ShippingOption, address?: ShippingAddress) => void;
  initialCep?: string;
  onAddressChange?: (address: ShippingAddress) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  items,
  selectedOption,
  onSelectOption,
  initialCep = '',
  onAddressChange
}) => {
  const [cep, setCep] = useState(formatCep(initialCep));
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Campos de endereço complementar
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');

  // Se receber initialCep já preenchido, sincronizar
  useEffect(() => {
    if (initialCep && initialCep.replace(/\D/g, '').length === 8 && !hasCalculated) {
      handleCalculate(initialCep);
    }
  }, [initialCep]);

  const handleCepChange = (val: string) => {
    const formatted = formatCep(val);
    setCep(formatted);
    if (error) setError(null);

    // Se o usuário digitar os 8 dígitos completos, calcula automaticamente
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8 && !isLoading) {
      handleCalculate(clean);
    }
  };

  const handleCalculate = async (targetCep?: string) => {
    const cepToCalc = (targetCep || cep).replace(/\D/g, '');

    if (cepToCalc.length !== 8) {
      setError('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateShipping(cepToCalc, items);

      if (result.success && result.options.length > 0) {
        setOptions(result.options);
        setHasCalculated(true);

        if (result.address) {
          const newAddress = { ...result.address, number, complement };
          setAddress(newAddress);
          if (onAddressChange) onAddressChange(newAddress);
        }

        // Seleciona a opção recomendada (mais econômica ou mais rápida)
        const defaultChoice = selectedOption || result.options[0];
        onSelectOption(defaultChoice, result.address);
      } else {
        setError(result.error || 'Nenhuma opção de frete encontrada para este CEP.');
        setOptions([]);
      }
    } catch (err: any) {
      setError('Não foi possível calcular o frete. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (val: string) => {
    setNumber(val);
    if (address && onAddressChange) {
      onAddressChange({ ...address, number: val, complement });
    }
  };

  const handleComplementChange = (val: string) => {
    setComplement(val);
    if (address && onAddressChange) {
      onAddressChange({ ...address, number, complement: val });
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FAF8FC',
        border: '1px solid #EDE8F5',
        borderRadius: '16px',
        padding: '18px 20px',
        marginBottom: '20px'
      }}
    >
      {/* Cabeçalho do Frete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EDE9FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6D28D9'
            }}
          >
            <Truck size={17} />
          </div>
          <div>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--hope-text)' }}>
              Simular Frete & Prazo (SuperFrete)
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--hope-muted)', display: 'block' }}>
              Envio a partir de Rio Claro - SP (13500-000)
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 600,
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '3px 8px',
            borderRadius: '10px'
          }}
        >
          Desconto Correios
        </span>
      </div>

      {/* Input de CEP */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className="form-input"
            style={{
              paddingLeft: '36px',
              fontSize: '13.5px',
              fontWeight: 500,
              letterSpacing: '0.04em'
            }}
          />
          <MapPin
            size={16}
            color="#6D28D9"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}
          />
        </div>

        <button
          type="button"
          onClick={() => handleCalculate()}
          disabled={isLoading || cep.replace(/\D/g, '').length !== 8}
          style={{
            padding: '10px 18px',
            backgroundColor: cep.replace(/\D/g, '').length === 8 ? 'var(--hope-purple)' : '#E2E8F0',
            color: cep.replace(/\D/g, '').length === 8 ? '#FFFFFF' : '#94A3B8',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: cep.replace(/\D/g, '').length === 8 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Calculando...</span>
            </>
          ) : (
            <span>Calcular</span>
          )}
        </button>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: '#DC2626',
            marginTop: '6px'
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Endereço Encontrado */}
      {address && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E9E4F0',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--hope-text)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 size={15} color="#059669" />
            <span style={{ fontWeight: 600, color: '#065F46' }}>
              {address.city} - {address.state}
            </span>
            <span style={{ color: 'var(--hope-muted)' }}>
              ({address.neighborhood ? `${address.neighborhood}, ` : ''}{address.street})
            </span>
          </div>

          {/* Campos Complementares: Número e Complemento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginTop: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '3px' }}>
                Número *
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder="Ex: 123"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '3px' }}>
                Complemento
              </label>
              <input
                type="text"
                value={complement}
                onChange={(e) => handleComplementChange(e.target.value)}
                placeholder="Apto, Bloco, Casa"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de Opções de Frete Retornadas pela SuperFrete */}
      {options.length > 0 && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Selecione uma opção de entrega:
          </span>

          {options.map((option) => {
            const isSelected = selectedOption?.id === option.id;

            return (
              <div
                key={option.id}
                onClick={() => onSelectOption(option, address || undefined)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                  border: isSelected ? '2px solid var(--hope-purple)' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(73, 51, 138, 0.1)' : 'none'
                }}
              >
                {/* Lado Esquerdo: Radio + Logo/Nome + Prazo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected ? '5px solid var(--hope-purple)' : '2px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13.5px', color: 'var(--hope-text)' }}>
                        {option.name}
                      </strong>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748B',
                          backgroundColor: '#F1F5F9',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {option.company.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '11.5px', color: 'var(--hope-muted)' }}>
                      <Clock size={12} color="#8580C8" />
                      <span>Chega em {option.deliveryTimeText}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Preço e Desconto */}
                <div style={{ textAlign: 'right' }}>
                  {option.originalPriceFormatted && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through' }}>
                      {option.originalPriceFormatted}
                    </span>
                  )}
                  <strong style={{ fontSize: '14px', color: 'var(--hope-purple)' }}>
                    {option.priceFormatted}
                  </strong>
                  {option.discount && (
                    <span style={{ display: 'block', fontSize: '9.5px', color: '#16A34A', fontWeight: 600 }}>
                      SuperFrete -{option.discount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
