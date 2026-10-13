import { CartItem, Product, ShippingFormData } from '../types';
import { WHATSAPP_NUMBER } from '../data/products';

/**
 * Gera o link do WhatsApp para comprar um produto individual diretamente.
 */
export const getProductWhatsAppUrl = (product: Product, quantity = 1): string => {
  const text = `Olá! Tenho interesse em adquirir uma peça na Hope Cristais:

💎 *Produto:* ${product.name}
🏷️ *Categoria:* ${product.category}
📦 *Quantidade:* ${quantity}
💰 *Valor:* ${product.priceFormatted}

Gostaria de saber mais informações e confirmar disponibilidade.`;

  const encoded = encodeURIComponent(text);
  const target = WHATSAPP_NUMBER.trim() ? WHATSAPP_NUMBER.trim() : '';
  return `https://wa.me/${target}?text=${encoded}`;
};

/**
 * Gera o link do WhatsApp com o pedido completo e os dados de entrega.
 */
export const getCartWhatsAppUrl = (
  items: CartItem[],
  subtotalFormatted: string,
  shipping?: Partial<ShippingFormData>,
  isPix = false
): string => {
  let message = `Olá! Quero fazer um pedido na *Hope Cristais* ✨\n\n*ITENS DO PEDIDO:*\n`;

  items.forEach((item, index) => {
    message += `\n${index + 1}. *Produto:* ${item.product.name}\n   *Quantidade:* ${item.quantity}\n   *Valor:* ${item.product.priceFormatted}\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━\n*Total:* ${subtotalFormatted}\n━━━━━━━━━━━━━━━━━━━━\n`;

  if (shipping?.fullName) {
    message += `\n*DADOS DO CLIENTE:*\n`;
    message += `👤 *Nome:* ${shipping.fullName}\n`;
    if (shipping.whatsapp) message += `📱 *WhatsApp:* ${shipping.whatsapp}\n`;
  }

  if (shipping?.selectedShipping) {
    message += `\n🚚 *FRETE ESCOLHIDO (SUPERFRETE):*\n`;
    message += `📦 *Modalidade:* ${shipping.selectedShipping.name} (${shipping.selectedShipping.company.name})\n`;
    message += `💰 *Valor do Frete:* ${shipping.selectedShipping.priceFormatted}\n`;
    message += `⏱️ *Prazo de Entrega:* ${shipping.selectedShipping.deliveryTimeText}\n`;
  }

  if (shipping?.cep) {
    message += `\n📍 *ENDEREÇO DE ENTREGA:*\n`;
    message += `${shipping.street || ''}${shipping.number ? `, nº ${shipping.number}` : ''}${shipping.complement ? ` (${shipping.complement})` : ''}\n`;
    message += `${shipping.neighborhood ? `${shipping.neighborhood}, ` : ''}${shipping.city || ''} - ${shipping.state || ''}\n`;
    message += `CEP: ${shipping.cep}\n`;
  }

  if (isPix) {
    message += `\n💳 *FORMA DE PAGAMENTO:*\nPIX no valor de *${subtotalFormatted}* para a chave: oliveira.deniser7@gmail.com\n📎 *Estou anexando o comprovante do PIX a seguir!*`;
  } else {
    message += `\nAguardo as instruções para envio e conclusão do pedido. Muito obrigado!`;
  }

  const encoded = encodeURIComponent(message);
  const target = WHATSAPP_NUMBER.trim() ? WHATSAPP_NUMBER.trim() : '';
  return `https://wa.me/${target}?text=${encoded}`;
};

/**
 * Gera o link do WhatsApp para notificar a loja sobre um pedido pago com sucesso via Mercado Pago.
 */
export const getPaidOrderWhatsAppUrl = (
  orderId: string,
  items: Array<{ name: string; quantity: number; priceFormatted: string }>,
  subtotalFormatted: string,
  customer: { fullName: string; whatsapp: string },
  paymentDetails?: { id: number | string; cardLastFour?: string; installments?: number },
  shipping?: {
    option?: { name: string; priceFormatted: string; deliveryTimeText: string };
    address?: { cep?: string; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string };
  }
): string => {
  let message = `Olá! Acabei de concluir meu pedido no site da *Hope Cristais* ✨\n\n`;
  message += `✅ *PAGAMENTO APROVADO VIA MERCADO PAGO*\n`;
  message += `🔖 *Nº do Pedido:* ${orderId}\n`;
  if (paymentDetails?.id) {
    message += `💳 *Comprovante Mercado Pago:* #${paymentDetails.id}\n`;
  }
  if (paymentDetails?.cardLastFour) {
    message += `💳 *Cartão:* final ${paymentDetails.cardLastFour} (${paymentDetails.installments || 1}x)\n`;
  }
  message += `💰 *Valor Total Pago:* ${subtotalFormatted}\n\n`;

  message += `*ITENS DO PEDIDO:*\n`;
  items.forEach((item, index) => {
    message += `${index + 1}. *${item.name}* (x${item.quantity}) - ${item.priceFormatted}\n`;
  });

  if (shipping?.option) {
    message += `\n🚚 *FRETE (SUPERFRETE):*\n${shipping.option.name}: ${shipping.option.priceFormatted} (${shipping.option.deliveryTimeText})\n`;
  }

  if (shipping?.address && shipping.address.cep) {
    message += `\n📍 *ENDEREÇO DE ENTREGA:*\n`;
    message += `${shipping.address.street || ''}${shipping.address.number ? `, nº ${shipping.address.number}` : ''}${shipping.address.complement ? ` (${shipping.address.complement})` : ''}\n`;
    message += `${shipping.address.neighborhood ? `${shipping.address.neighborhood}, ` : ''}${shipping.address.city || ''} - ${shipping.address.state || ''}\n`;
    message += `CEP: ${shipping.address.cep}\n`;
  }

  message += `\n*DADOS DE CONTATO:*\n`;
  message += `👤 *Nome:* ${customer.fullName}\n`;
  if (customer.whatsapp) message += `📱 *WhatsApp:* ${customer.whatsapp}\n`;

  message += `\nGostaria de confirmar os detalhes de entrega das minhas peças especiais! ✨`;

  const encoded = encodeURIComponent(message);
  const target = WHATSAPP_NUMBER.trim() ? WHATSAPP_NUMBER.trim() : '';
  return `https://wa.me/${target}?text=${encoded}`;
};

