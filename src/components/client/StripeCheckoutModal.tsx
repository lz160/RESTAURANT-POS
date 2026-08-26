import React, { useState } from 'react';
import { OrderMaster } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadCzechReceiptPdf } from '../../utils/czechReceiptPdf';
import { CzechFiscalReceiptModal } from './CzechFiscalReceiptModal';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  X, 
  Sparkles, 
  Smartphone, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileText,
  Download,
  Receipt,
} from 'lucide-react';

interface Props {
  order: OrderMaster;
  onClose: () => void;
  onSuccess: (paidOrder: OrderMaster) => void;
}

/**
 * 顾客端在线 Stripe 支付窗口 (支持测试版沙盒、多支付渠道与测试卡号快捷填充及捷克法定电子小票生成)
 */
export const StripeCheckoutModal: React.FC<Props> = ({ order, onClose, onSuccess }) => {
  const { payOrder, stripeConfig, currentStore, currentMerchant, formatPrice, theme, t } = useApp();

  const [paymentMethodTab, setPaymentMethodTab] = useState<'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY'>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState('GUEST USER');
  const [activeScenario, setActiveScenario] = useState<string>('success');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [is3DSVerifying, setIs3DSVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paidResultOrder, setPaidResultOrder] = useState<OrderMaster | null>(null);
  const [isPreviewReceiptOpen, setIsPreviewReceiptOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Quick Card Preset Filler
  const applyPresetCard = (number: string, scenario: string) => {
    setCardNumber(number);
    setActiveScenario(scenario);
    setErrorMsg(null);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);

    // If card is 3DS simulation
    if (cardNumber.replace(/\s+/g, '').endsWith('3063') || activeScenario === '3ds') {
      setIs3DSVerifying(true);
      await new Promise(r => setTimeout(r, 1200));
      setIs3DSVerifying(false);
    }

    try {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const res = await payOrder(
        order.id, 
        paymentMethodTab === 'APPLE_PAY' ? 'STRIPE_APPLE_PAY' : paymentMethodTab === 'GOOGLE_PAY' ? 'STRIPE_GOOGLE_PAY' : 'STRIPE_CARD', 
        {
          cardNumber: cleanNum,
          brand: cleanNum.startsWith('4') ? 'Visa' : 'Mastercard',
          last4: cleanNum.slice(-4) || '4242',
          simulatedTestScenario: activeScenario,
        }
      );
      setPaidResultOrder(res.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Stripe 支付处理失败，请重试');
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!paidResultOrder) return;
    setIsDownloadingPdf(true);
    try {
      downloadCzechReceiptPdf(paidResultOrder, currentStore, currentMerchant);
    } catch (err) {
      console.error('Download PDF error:', err);
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 600);
    }
  };

  const isTestMode = stripeConfig.mode === 'test';

  // --- 支付成功与取餐码/小票生成视图 ---
  if (paidResultOrder) {
    return (
      <div
        id="stripe-success-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden text-slate-900 relative animate-in zoom-in-95">
          {/* Top Green Accent Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 text-white text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="font-black text-lg text-white">支付成功 · 订单已流转后厨</h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              Platba proběhla úspěšně (Stripe Online Gateway)
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Pickup Code Display */}
            <div className="bg-amber-50/90 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                您的专属取餐码 / VÝDEJNÍ KÓD
              </span>
              <div className="text-5xl font-black text-amber-600 font-mono tracking-wider my-1">
                {paidResultOrder.pickupCode}
              </div>
              <p className="text-xs text-slate-500">
                订单流水号: <span className="font-mono text-slate-800 font-bold">{paidResultOrder.orderNo}</span>
              </p>
            </div>

            {/* Czech Fiscal Receipt Status Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    捷克法定电子小票 (Daňový doklad)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  § 29 ZDPH 合规
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                依据捷克增值税法与消费者保护法，已为您开具含 12% 增值税明细、BKP 与 FIK 防伪税号的电子发票小票。
              </p>

              {/* Action Buttons for Receipt */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? '生成中...' : '下载 PDF 电子小票'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewReceiptOpen(true)}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>在线查阅小票</span>
                </button>
              </div>
            </div>

            {/* Navigate to Live Tracking */}
            <button
              type="button"
              onClick={() => onSuccess(paidResultOrder)}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>查看后厨制作进度实时追踪</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal for viewing detailed Czech Fiscal Receipt */}
        {isPreviewReceiptOpen && (
          <CzechFiscalReceiptModal
            order={paidResultOrder}
            store={currentStore}
            merchant={currentMerchant}
            onClose={() => setIsPreviewReceiptOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      id="stripe-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative">
        
        {/* Header with Stripe styling */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {stripeConfig.merchantDisplayName || 'Stripe 官方收银台'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                  isTestMode 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isTestMode ? 'TEST MODE' : 'LIVE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {currentStore.storeName} · 256-Bit 金融级端到端加密结算
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount Overview */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">应付结算总额</span>
              <div className="text-2xl font-black text-indigo-600 font-mono">
                {formatPrice(order.totalAmount, currentStore.currency)}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                单号: {order.orderNo.slice(-6)}
              </div>
              <div className="text-[10px] text-slate-400">
                共 {order.itemsCount} 件餐品
              </div>
            </div>
          </div>

          {/* Payment Method Selector (Card / Apple Pay / Google Pay) */}
          {stripeConfig.allowApplePayGooglePay && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethodTab('CARD')}
                className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  paymentMethodTab === 'CARD'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>信用卡</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethodTab('APPLE_PAY')}
                className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  paymentMethodTab === 'APPLE_PAY'
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethodTab('GOOGLE_PAY')}
                className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  paymentMethodTab === 'GOOGLE_PAY'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>GPay</span>
              </button>
            </div>
          )}

          {/* Sandbox Test Card Quick Toolbar */}
          {isTestMode && paymentMethodTab === 'CARD' && (
            <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Stripe 沙盒测试卡一键填充:
                </span>
                <span className="text-[10px] text-amber-700 font-mono">无需真实扣款</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetCard('4242 4242 4242 4242', 'success')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition ${
                    activeScenario === 'success' && cardNumber.includes('4242')
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  🟢 4242 成功卡
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetCard('4000 0000 0000 3063', '3ds')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition ${
                    activeScenario === '3ds'
                      ? 'bg-amber-200 text-amber-950 border-amber-400 font-bold'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  🟡 3DS 强认证卡
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetCard('4000 0000 0000 0002', 'insufficient_funds')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition ${
                    activeScenario === 'insufficient_funds'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  🔴 余额不足拒付卡
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetCard('4000 0000 0000 0127', 'fraud_blocked')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left transition ${
                    activeScenario === 'fraud_blocked'
                      ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  🟣 欺诈风控拦截卡
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">支付未通过:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Card Form */}
          <form onSubmit={handlePay} className="space-y-3 text-xs">
            {paymentMethodTab === 'CARD' ? (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">持卡人姓名</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">信用卡卡号</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-indigo-500 pl-9 font-medium"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">到期日 (MM/YY)</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-center focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">CVC 安全码</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-center focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-800">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  {paymentMethodTab === 'APPLE_PAY' ? 'Apple Pay 原生快捷通道' : 'Google Pay 快捷通道'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  点击下方按钮后将自动唤起系统生物识别进行免密结算，已关联 Stripe 虚拟安全支付令牌。
                </p>
              </div>
            )}

            {/* 3DS Verification Overlay */}
            {is3DSVerifying && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-indigo-900">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold">正在与发卡银行进行 3D Secure 2.0 强客户认证握手...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || is3DSVerifying}
              className="w-full mt-3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md active:scale-98 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Stripe 正在扣款与流转后厨...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>确认支付 {formatPrice(order.totalAmount, currentStore.currency)}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stripe PCI-DSS Level 1 认证通道 · 测试沙盒无真实资损</span>
          </div>
        </div>
      </div>
    </div>
  );
};
