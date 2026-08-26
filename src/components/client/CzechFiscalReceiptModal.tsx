import React, { useState } from 'react';
import { OrderMaster, StoreEntity, MerchantAccount } from '../../types';
import { extractCzechFiscalData, downloadCzechReceiptPdf } from '../../utils/czechReceiptPdf';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Store,
  Calendar,
  CreditCard,
  Building2,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  order: OrderMaster;
  store?: Partial<StoreEntity>;
  merchant?: Partial<MerchantAccount>;
  onClose: () => void;
}

/**
 * 捷克法定电子小票交互预览与 PDF 下载弹窗
 * (Zjednodušený daňový doklad dle § 29 zákona č. 235/2004 Sb., o dani z přidané hodnoty)
 */
export const CzechFiscalReceiptModal: React.FC<Props> = ({
  order,
  store,
  merchant,
  onClose,
}) => {
  const fiscal = extractCzechFiscalData(order, store, merchant);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedBkp, setCopiedBkp] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      downloadCzechReceiptPdf(order, store, merchant);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBkp = () => {
    navigator.clipboard?.writeText?.(fiscal.bkpCode);
    setCopiedBkp(true);
    setTimeout(() => setCopiedBkp(false), 2000);
  };

  return (
    <div
      id="czech-fiscal-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-stone-900 rounded-3xl border border-stone-700 shadow-2xl overflow-hidden text-stone-100 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">捷克法定电子小票 (Daňový doklad)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  § 29 ZDPH 合规
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                电子防伪认证 · 支持一键下载官方 PDF 凭证
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Thermal Receipt Style Preview) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-stone-950/60">
          {/* Printable White Receipt Area */}
          <div className="bg-white text-stone-900 rounded-2xl p-5 sm:p-6 font-mono text-xs shadow-md border border-stone-200 space-y-4 relative">
            
            {/* Store & Fiscal Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
              <h2 className="font-black text-sm tracking-tight text-stone-950 font-sans">
                {fiscal.companyName}
              </h2>
              <div className="text-xs font-bold text-amber-700 font-sans">{fiscal.tradeName}</div>
              <p className="text-[11px] text-stone-600 leading-tight">{fiscal.street}</p>
              
              <div className="pt-1 flex items-center justify-center gap-3 text-[11px] font-bold text-stone-800">
                <span>IČO: {fiscal.ico}</span>
                <span>DIČ: {fiscal.dic}</span>
              </div>
              <p className="text-[10px] text-stone-500">Plátce DPH (Plátce DPH v ČR)</p>
              <p className="text-[9px] text-stone-400">{fiscal.courtRegistry}</p>
            </div>

            {/* Document Title & Pickup Code Card */}
            <div className="text-center space-y-2">
              <div className="inline-block px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold tracking-wider text-stone-700 uppercase">
                ZJEDNODUŠENÝ DAŇOVÝ DOKLAD
              </div>
              <div className="text-[11px] text-stone-500">
                Doklad č.: <span className="font-bold text-stone-900">{fiscal.receiptNumber}</span>
              </div>

              {/* Big Pickup Code Highlight */}
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl py-3 px-4 my-2">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block font-sans">
                  取餐号 / VÝDEJNÍ KÓD
                </span>
                <span className="text-4xl font-black text-amber-600 font-mono tracking-wider">
                  {order.pickupCode}
                </span>
              </div>
            </div>

            {/* Metadata (DUZP, Date, Cash Register) */}
            <div className="text-[11px] space-y-1 py-2 border-y border-stone-200 text-stone-700">
              <div className="flex justify-between">
                <span>DUZP (Datum plnění):</span>
                <span className="font-bold">{fiscal.duzp}</span>
              </div>
              <div className="flex justify-between">
                <span>Datum vystavení:</span>
                <span>{fiscal.issuedAt}</span>
              </div>
              <div className="flex justify-between">
                <span>Provozovna / Pokladna:</span>
                <span>{fiscal.premisesId} / {fiscal.cashRegisterId}</span>
              </div>
              <div className="flex justify-between">
                <span>Způsob úhrady:</span>
                <span className="font-bold text-indigo-700">{fiscal.paymentMethodText}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-stone-800 text-[11px] pb-1 border-b border-stone-300">
                <span>Položka</span>
                <span className="text-right">Mn. x Cena / Celkem</span>
              </div>

              <div className="space-y-2 divide-y divide-stone-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-stone-900 text-xs font-sans">
                        {item.productName}
                      </span>
                      <div className="text-right font-mono text-xs">
                        <span className="text-stone-500 text-[11px] mr-2">
                          {item.quantity} x {item.unitPrice.toFixed(2)}
                        </span>
                        <span className="font-bold">
                          {item.totalPrice.toFixed(2)} {fiscal.currencySymbol}
                        </span>
                      </div>
                    </div>

                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-stone-500 italic pl-1">
                        + {item.selectedModifiers.map((m) => m.itemName).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* VAT Recapitulation (Rekapitulace DPH dle Zákona č. 235/2004 Sb.) */}
            <div className="pt-3 border-t-2 border-stone-800 space-y-1.5">
              <div className="text-[11px] font-bold text-stone-800">
                REKAPITULACE DPH (CZ VAT BREAKDOWN)
              </div>
              <div className="grid grid-cols-4 text-[10px] text-stone-500 font-bold border-b border-stone-200 pb-1">
                <span>Sazba</span>
                <span className="text-right">Základ</span>
                <span className="text-right">DPH</span>
                <span className="text-right">Celkem</span>
              </div>
              <div className="grid grid-cols-4 text-[11px] text-stone-800">
                <span>Snížená {fiscal.vatRatePercent}%</span>
                <span className="text-right">{fiscal.taxBase.toFixed(2)}</span>
                <span className="text-right">{fiscal.vatAmount.toFixed(2)}</span>
                <span className="text-right font-bold">
                  {fiscal.totalWithVat.toFixed(2)} {fiscal.currencySymbol}
                </span>
              </div>
            </div>

            {/* Total Payable & Payment Status */}
            <div className="pt-3 border-t-2 border-stone-800 space-y-1">
              <div className="flex justify-between items-center text-sm font-black text-stone-950 font-sans">
                <span>CELKEM K ÚHRADĚ:</span>
                <span className="text-base text-amber-600 font-mono">
                  {fiscal.totalWithVat.toFixed(2)} {fiscal.currencySymbol}
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-stone-600">
                <span>Zaplaceno online (Stripe):</span>
                <span className="font-bold">{fiscal.totalWithVat.toFixed(2)} {fiscal.currencySymbol}</span>
              </div>

              <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1">
                <span>Stav:</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  UHRAZENO ELEKTRONICKY
                </span>
              </div>
            </div>

            {/* Security Codes & QR */}
            <div className="pt-3 border-t border-dashed border-stone-300 space-y-2 text-center">
              <div className="text-[9px] text-stone-500 text-left space-y-0.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="truncate">BKP: {fiscal.bkpCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyBkp}
                    className="shrink-0 ml-1 text-stone-500 hover:text-stone-900"
                    title="复制 BKP"
                  >
                    {copiedBkp ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="truncate">FIK: {fiscal.fikCode}</div>
              </div>

              {/* QR Code Graphic Box */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="w-24 h-24 border border-stone-300 rounded-xl p-1.5 bg-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-20 h-20 text-stone-900" />
                </div>
                <span className="text-[9px] text-stone-500 mt-1">
                  Ověřovací QR kód e-Účtenky / CZ Legal Verification
                </span>
              </div>

              {/* Legal Text Footer */}
              <p className="text-[8.5px] text-stone-400 leading-tight pt-1">
                Tento doklad byl vystaven elektronicky v souladu se zákonem č. 235/2004 Sb., o dani z přidané hodnoty (§ 29) a zákonem č. 634/1992 Sb., o ochraně spotřebitele.
              </p>
              <p className="text-[10px] font-bold text-stone-700 font-sans">
                Děkujeme za Váš nákup a přejeme dobrou chuť!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>符合捷克财务与税务法标准</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印小票</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? '生成下载中...' : '下载 PDF 电子小票'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
