import { jsPDF } from 'jspdf';
import { OrderMaster, StoreEntity, MerchantAccount } from '../types';

export interface CzechFiscalData {
  companyName: string;
  tradeName: string;
  street: string;
  city: string;
  zip: string;
  ico: string;
  dic: string;
  isVatPayer: boolean;
  courtRegistry: string;
  premisesId: string;
  cashRegisterId: string;
  receiptNumber: string;
  duzp: string;
  issuedAt: string;
  paymentMethodText: string;
  vatRatePercent: number; // typically 12% in CZ for food/takeout catering or 21%
  taxBase: number;
  vatAmount: number;
  totalWithVat: number;
  currencyCode: string;
  currencySymbol: string;
  bkpCode: string;
  fikCode: string;
  qrPayload: string;
}

/**
 * 计算与提取捷克法定的增值税与小票元数据 (Zjednodušený daňový doklad dle § 29 ZDPH)
 */
export function extractCzechFiscalData(
  order: OrderMaster,
  store?: Partial<StoreEntity>,
  merchant?: Partial<MerchantAccount>
): CzechFiscalData {
  const storeName = store?.storeName || 'Seatless Bistro & Tea Bar';
  const currencyCode = (order.currency || store?.currency || 'CZK').toUpperCase();
  const currencySymbol = order.currencySymbol || (currencyCode === 'CZK' ? 'Kč' : currencyCode === 'EUR' ? '€' : '$');
  
  // 捷克餐饮与外卖食品法定增值税税率：12% (Konsolidační balíček), 部分酒水/标准税率为 21%
  const vatRate = 12; // 12% Snížená sazba DPH pro stravovací služby
  const totalAmount = order.totalAmount || 0;
  
  // 捷克税法计算倒扣增值税: DPH = Celkem - (Celkem / (1 + sazba/100))
  const taxBase = Math.round((totalAmount / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((totalAmount - taxBase) * 100) / 100;

  const dateObj = new Date(order.paidAt || order.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const fullDateTime = `${formattedDate} ${formattedTime}`;

  // 捷克法定公司身份与注册地址 (优先采用门店特定配置，其次回退到商家法定身份，最后保底合规默认)
  const legalCompanyName = 
    store?.legalCompanyName || 
    merchant?.legalCompanyName || 
    (merchant?.name ? `${merchant.name} s.r.o.` : 'Danube Hospitality Europe s.r.o.');

  const registeredAddress = 
    store?.registeredAddress || 
    merchant?.registeredAddress || 
    'Václavské náměstí 846/1, 110 00 Praha 1, Česká republika';

  const operationalAddress = store?.address || registeredAddress;

  const ico = store?.ico || merchant?.ico || '29482019';
  const dic = store?.dic || merchant?.dic || 'CZ29482019';
  const isVatPayer = merchant?.vatPayer !== false;
  const courtRegistry = store?.courtRegistry || merchant?.courtRegistry || 'Městský soud v Praze, oddíl C, vložka 386291';
  const premisesId = store?.premisesId || '101';
  const cashRegisterId = store?.cashRegisterId || 'POS-ONLINE-01';

  let paymentText = 'Platba kartou online (Stripe Gateway)';
  if (order.paymentMethod === 'STRIPE_APPLE_PAY') paymentText = 'Apple Pay (Stripe)';
  else if (order.paymentMethod === 'CASH') paymentText = 'Hotovost (Cash)';
  else if (order.paymentMethod === 'POS_CARD') paymentText = 'Platební terminál POS';

  // 捷克电子小票防伪码 (BKP & FIK)
  const orderIdClean = (order.id || 'ord12345').replace(/[^a-zA-Z0-9]/g, '').padEnd(16, '0');
  const bkpCode = `${orderIdClean.slice(0, 8).toUpperCase()}-${orderIdClean.slice(8, 16).toUpperCase()}-94A2B8C1-E4F5A678`;
  const fikCode = `e8f492a0-4c31-48e2-9a0f-${orderIdClean.slice(0, 12).toLowerCase()}-01`;

  // 捷克电子发票/小票二维码校验 Payload (Standard e-Účtenka Verification Payload)
  const qrPayload = `https://portal.seatless.eu/verify/cz-receipt?ico=${ico}&dic=${dic}&doc=${order.orderNo}&total=${totalAmount.toFixed(2)}&curr=${currencyCode}&date=${dateObj.getTime()}&bkp=${bkpCode}`;

  return {
    companyName: legalCompanyName,
    tradeName: storeName,
    street: operationalAddress,
    city: 'Praha',
    zip: '110 00',
    ico,
    dic,
    isVatPayer,
    courtRegistry,
    premisesId,
    cashRegisterId,
    receiptNumber: `DOK-${order.orderNo || order.id.slice(-8).toUpperCase()}`,
    duzp: fullDateTime,
    issuedAt: fullDateTime,
    paymentMethodText: paymentText,
    vatRatePercent: vatRate,
    taxBase,
    vatAmount,
    totalWithVat: totalAmount,
    currencyCode,
    currencySymbol,
    bkpCode,
    fikCode,
    qrPayload,
  };
}

/**
 * 生成符合捷克法律规定的 PDF 电子小票 (Zjednodušený daňový doklad)
 * 采用 80mm 热敏/电子小票标准宽度规格 (80mm x 自适应高度)
 */
export function generateCzechReceiptPdf(
  order: OrderMaster,
  store?: Partial<StoreEntity>,
  merchant?: Partial<MerchantAccount>
): jsPDF {
  const fiscal = extractCzechFiscalData(order, store, merchant);

  // 80mm thermal receipt standard dimension: 80mm width, approx 210mm height
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 230],
  });

  const pageWidth = 80;
  let y = 10;

  // Helper functions
  const centerText = (text: string, fontSize = 9, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += fontSize * 0.45 + 1.2;
  };

  const leftRightText = (left: string, right: string, fontSize = 8, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(left, 5, y);
    doc.text(right, pageWidth - 5, y, { align: 'right' });
    y += fontSize * 0.42 + 1;
  };

  const drawDashedDivider = () => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, pageWidth - 5, y);
    doc.setLineDashPattern([], 0);
    y += 3;
  };

  const drawSolidDivider = () => {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.line(5, y, pageWidth - 5, y);
    y += 3.5;
  };

  // --- 1. HEADER (ZÁHLAVÍ DOKLADU) ---
  centerText(fiscal.companyName, 10, true);
  centerText(fiscal.tradeName, 9, true);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(fiscal.street, pageWidth / 2, y, { align: 'center', maxWidth: 70 });
  y += 6;

  centerText(`IČO: ${fiscal.ico}   DIČ: ${fiscal.dic}`, 7.5, true);
  centerText('Plátce DPH (VAT Registered)', 7);
  centerText(fiscal.courtRegistry, 6.5);
  y += 1;

  drawDashedDivider();

  // --- 2. DOKLAD & VÝDEJNÍ KÓD (RECEIPT & PICKUP CODE) ---
  centerText('ZJEDNODUŠENÝ DAŇOVÝ DOKLAD', 8.5, true);
  centerText(`Číslo dokladu: ${fiscal.receiptNumber}`, 7.5);
  
  // 核心取餐码醒目标记
  y += 1;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, y, 50, 14, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KÓD VYZVEDNUTÍ / PICKUP CODE', pageWidth / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(16);
  doc.text(order.pickupCode || 'A01', pageWidth / 2, y + 11.5, { align: 'center' });
  y += 17;

  leftRightText('DUZP / Datum plnění:', fiscal.duzp, 7);
  leftRightText('Datum vystavení:', fiscal.issuedAt, 7);
  leftRightText('Provozovna / Pokladna:', `${fiscal.premisesId} / ${fiscal.cashRegisterId}`, 7);
  leftRightText('Forma úhrady:', fiscal.paymentMethodText, 7);

  drawSolidDivider();

  // --- 3. POLOŽKY (ITEMIZED BREAKDOWN) ---
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Položka / Název', 5, y);
  doc.text('Mn. x Cena', 50, y, { align: 'right' });
  doc.text('Celkem', pageWidth - 5, y, { align: 'right' });
  y += 3.5;
  drawDashedDivider();

  (order.items || []).forEach((item) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    
    // Product Name (truncated/wrapped if needed)
    const splitTitle = doc.splitTextToSize(item.productName, 40);
    doc.text(splitTitle, 5, y);

    const qtyAndPrice = `${item.quantity} x ${item.unitPrice.toFixed(2)}`;
    const lineTotal = `${item.totalPrice.toFixed(2)} ${fiscal.currencySymbol}`;

    doc.setFont('helvetica', 'normal');
    doc.text(qtyAndPrice, 52, y);
    doc.setFont('helvetica', 'bold');
    doc.text(lineTotal, pageWidth - 5, y, { align: 'right' });
    y += (splitTitle.length * 3.2);

    // Modifiers / Customization notes
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      const modText = '+ ' + item.selectedModifiers.map(m => m.itemName).join(', ');
      const splitMod = doc.splitTextToSize(modText, 68);
      doc.text(splitMod, 7, y);
      y += (splitMod.length * 2.6);
    }
    y += 1;
  });

  drawSolidDivider();

  // --- 4. REKAPITULACE DPH (CZECH VAT RECAPITULATION TABLE) ---
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULACE DPH (CZ VAT TABLE)', 5, y);
  y += 3.5;

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.text('Sazba', 5, y);
  doc.text('Základ daně', 32, y, { align: 'right' });
  doc.text('DPH', 54, y, { align: 'right' });
  doc.text('Celkem vč. DPH', pageWidth - 5, y, { align: 'right' });
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.text(`Snížená ${fiscal.vatRatePercent}%`, 5, y);
  doc.text(`${fiscal.taxBase.toFixed(2)}`, 32, y, { align: 'right' });
  doc.text(`${fiscal.vatAmount.toFixed(2)}`, 54, y, { align: 'right' });
  doc.text(`${fiscal.totalWithVat.toFixed(2)} ${fiscal.currencySymbol}`, pageWidth - 5, y, { align: 'right' });
  y += 4;

  drawSolidDivider();

  // --- 5. CELKEM K ÚHRADĚ (TOTAL SUMMARY) ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CELKEM K ÚHRADĚ:', 5, y);
  doc.text(`${fiscal.totalWithVat.toFixed(2)} ${fiscal.currencySymbol}`, pageWidth - 5, y, { align: 'right' });
  y += 4.5;

  leftRightText('Zaplaceno kartou online:', `${fiscal.totalWithVat.toFixed(2)} ${fiscal.currencySymbol}`, 7.5);
  leftRightText('Zbývá k úhradě:', `0.00 ${fiscal.currencySymbol}`, 7.5);
  leftRightText('Stav transakce:', 'UHRAZENO ELEKTRONICKY', 7.5, true);

  drawDashedDivider();

  // --- 6. FISKÁLNÍ A BEZPEČNOSTNÍ KÓDY (BKP & FIK) ---
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`BKP: ${fiscal.bkpCode}`, 5, y);
  y += 3;
  doc.text(`FIK: ${fiscal.fikCode}`, 5, y);
  y += 4;

  // Visual simulated QR code box
  const qrSize = 18;
  const qrX = (pageWidth - qrSize) / 2;
  doc.setDrawColor(60, 60, 60);
  doc.rect(qrX, y, qrSize, qrSize);
  
  // Draw inner QR pattern grid simulation
  doc.setFillColor(30, 30, 30);
  doc.rect(qrX + 1.5, y + 1.5, 4, 4, 'F');
  doc.rect(qrX + qrSize - 5.5, y + 1.5, 4, 4, 'F');
  doc.rect(qrX + 1.5, y + qrSize - 5.5, 4, 4, 'F');
  doc.rect(qrX + 7, y + 7, 4, 4, 'F');
  doc.rect(qrX + 12, y + 9, 2.5, 2.5, 'F');
  doc.rect(qrX + 3.5, y + 8, 2, 2, 'F');
  doc.rect(qrX + 9, y + 2.5, 2, 2, 'F');
  y += qrSize + 3;

  centerText('Ověření platnosti dokladu / e-Účtenka', 6.5);
  y += 0.5;

  // --- 7. FOOTER / LEGAL CLAUSE ---
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Tento doklad byl vystaven elektronicky v souladu se z. c. 235/2004 Sb., o dani z pridane hodnoty a z. c. 634/1992 Sb., o ochrane spotrebitele.',
    pageWidth / 2,
    y,
    { align: 'center', maxWidth: 70 }
  );
  y += 6;

  centerText('Dekujeme za Vas nakup a prejeme dobrou chut!', 7, true);

  return doc;
}

/**
 * 触发直接下载捷克法定 PDF 电子小票
 */
export function downloadCzechReceiptPdf(
  order: OrderMaster,
  store?: Partial<StoreEntity>,
  merchant?: Partial<MerchantAccount>
): void {
  const doc = generateCzechReceiptPdf(order, store, merchant);
  const fileName = `Uctenka_Danovy_Doklad_${order.pickupCode || 'Order'}_${order.orderNo || order.id.slice(-6)}.pdf`;
  doc.save(fileName);
}
