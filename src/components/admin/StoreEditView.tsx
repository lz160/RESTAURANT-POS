import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreEntity, StoreStatus, CurrencyCode, StripeGatewayConfig, EET2GatewayConfig, StorePaymentGateways } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../data/currencies';
import {
  Store,
  ArrowLeft,
  Save,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Phone,
  Globe,
  Scale,
  CreditCard,
  Zap,
  ShieldCheck,
  Activity,
  AlertTriangle,
  QrCode,
  Lock,
  ExternalLink,
  Copy,
  Radio,
  FileText,
  Sparkles,
  Send,
  RefreshCw,
  Sliders,
  DollarSign,
  Smartphone,
  Layers,
  FileCheck2,
  Server,
  HelpCircle,
  Trash2,
  Rocket,
  PauseCircle,
  PlayCircle,
  Check,
  Info,
} from 'lucide-react';

interface StoreEditViewProps {
  storeId: string | null; // null means creating a new store
  defaultMerchantId?: string; // Pre-select merchant when creating
  initialSubTab?: 'BASIC' | 'LEGAL' | 'PAYMENTS' | 'EET2';
  onBack: () => void;
  onSaved?: (savedStore: StoreEntity) => void;
}

export const StoreEditView: React.FC<StoreEditViewProps> = ({
  storeId,
  defaultMerchantId,
  initialSubTab = 'BASIC',
  onBack,
  onSaved,
}) => {
  const {
    stores,
    merchants,
    createStoreEntity,
    updateStoreEntity,
    deleteStoreEntity,
    publishStoreEntity,
    toggleStoreSuspend,
    testStripePing,
    testEET2Ping,
    fiscalizeEET2Sale,
    formatPrice,
    currentStaffUser,
    t,
  } = useApp();

  const isCreating = !storeId;
  const existingStore = stores.find((s) => s.id === storeId);

  // Active Tab in Edit Mode
  const [activeSubTab, setActiveSubTab] = useState<'BASIC' | 'LEGAL' | 'PAYMENTS' | 'EET2'>(initialSubTab);

  // Form State initialized from existing store or default
  const [formData, setFormData] = useState<{
    storeName: string;
    currency: CurrencyCode;
    address: string;
    phone: string;
    operatingHours: string;
    status: StoreStatus;
    merchantId: string;
    customDomain: string;
    legalCompanyName: string;
    registeredAddress: string;
    ico: string;
    dic: string;
    premisesId: string;
    cashRegisterId: string;
    courtRegistry: string;
    paymentGateways: StorePaymentGateways;
    stripeConfig: StripeGatewayConfig;
    eet2Config: EET2GatewayConfig;
  }>({
    storeName: '',
    currency: 'CZK',
    address: '',
    phone: '',
    operatingHours: '09:00 - 22:30',
    status: 'DRAFT',
    merchantId: '',
    customDomain: '',
    legalCompanyName: '',
    registeredAddress: '',
    ico: '',
    dic: '',
    premisesId: '101',
    cashRegisterId: 'POS-ONLINE-01',
    courtRegistry: '',
    paymentGateways: {
      stripeEnabled: true,
      cashOnDeliveryEnabled: true,
      cardTerminalEnabled: true,
      qrPayEnabled: true,
      applePayEnabled: true,
      googlePayEnabled: true,
      adyenEnabled: false,
      paypalEnabled: true,
      vivaWalletEnabled: false,
    },
    stripeConfig: {
      enabled: true,
      mode: 'TEST',
      publishableKey: 'pk_test_sample_key',
      secretKey: 'sk_test_••••••••',
      webhookSecret: 'whsec_••••••••',
      currency: 'EUR',
      statementDescriptor: 'SEATLESS RESTAURANT',
      enableApplePay: true,
      enableGooglePay: true,
      enableIdeal: false,
      enableBancontact: false,
      enableSepaDebit: true,
      enableKlarna: false,
      captureMethod: 'AUTOMATIC',
    },
    eet2Config: {
      enabled: false,
      mode: 'SANDBOX',
      endpointUrl: 'https://pg.eet.gov.cz/v2/soap/EETServiceSOAP',
      ico: '29482019',
      dic: 'CZ29482019',
      premisesId: '101',
      cashRegisterId: 'POS-ONLINE-01',
      certFileName: 'EET_CA3_Playground.p12',
      certPassword: '••••••••',
      certFingerprint: '7A:9F:88:2E:3D:5C:1B:44:E0:9A:88:F2:71:39:AA:88:02:11:7C:E5',
      timeoutMs: 2000,
      autoFallbackToPkp: true,
      offlineRetentionHours: 48,
      totalFiscalizedCount: 0,
      totalFiscalizedAmount: 0,
    },
  });

  // Populate state whenever storeId changes
  useEffect(() => {
    if (existingStore) {
      const parentMerchant = merchants.find((m) => m.id === existingStore.merchantId);
      setFormData({
        storeName: existingStore.storeName || '',
        currency: existingStore.currency || 'EUR',
        address: existingStore.address || '',
        phone: existingStore.phone || '',
        operatingHours: existingStore.operatingHours || '09:00 - 22:30',
        status: (existingStore.status as StoreStatus) || 'DRAFT',
        merchantId: existingStore.merchantId || '',
        customDomain: existingStore.customDomain || '',
        legalCompanyName: existingStore.legalCompanyName || parentMerchant?.legalCompanyName || '',
        registeredAddress: existingStore.registeredAddress || parentMerchant?.registeredAddress || '',
        ico: existingStore.ico || parentMerchant?.ico || '',
        dic: existingStore.dic || parentMerchant?.dic || '',
        premisesId: existingStore.premisesId || '101',
        cashRegisterId: existingStore.cashRegisterId || 'POS-ONLINE-01',
        courtRegistry: existingStore.courtRegistry || parentMerchant?.courtRegistry || '',
        paymentGateways: existingStore.paymentGateways || {
          stripeEnabled: true,
          cashOnDeliveryEnabled: true,
          cardTerminalEnabled: true,
          qrPayEnabled: true,
          applePayEnabled: true,
          googlePayEnabled: true,
          adyenEnabled: false,
          paypalEnabled: true,
          vivaWalletEnabled: false,
        },
        stripeConfig: existingStore.stripeConfig || {
          enabled: true,
          mode: 'TEST',
          publishableKey: `pk_test_${existingStore.id}_key`,
          secretKey: 'sk_test_••••••••',
          webhookSecret: 'whsec_••••••••',
          currency: existingStore.currency,
          statementDescriptor: existingStore.storeName.slice(0, 22).toUpperCase(),
          enableApplePay: true,
          enableGooglePay: true,
          enableIdeal: false,
          enableBancontact: false,
          enableSepaDebit: true,
          enableKlarna: false,
          captureMethod: 'AUTOMATIC',
        },
        eet2Config: existingStore.eet2Config || {
          enabled: existingStore.currency === 'CZK',
          mode: 'SANDBOX',
          endpointUrl: 'https://pg.eet.gov.cz/v2/soap/EETServiceSOAP',
          ico: existingStore.ico || parentMerchant?.ico || '29482019',
          dic: existingStore.dic || parentMerchant?.dic || 'CZ29482019',
          premisesId: existingStore.premisesId || '101',
          cashRegisterId: existingStore.cashRegisterId || 'POS-ONLINE-01',
          certFileName: `EET_CA3_${existingStore.id}.p12`,
          certPassword: '••••••••',
          certFingerprint: '7A:9F:88:2E:3D:5C:1B:44:E0:9A:88:F2:71:39:AA:88:02:11:7C:E5',
          timeoutMs: 2000,
          autoFallbackToPkp: true,
          offlineRetentionHours: 48,
          totalFiscalizedCount: 0,
          totalFiscalizedAmount: 0,
        },
      });
    } else {
      // Default for new store
      const defaultM = (defaultMerchantId ? merchants.find((m) => m.id === defaultMerchantId) : null) || merchants[0];
      setFormData({
        storeName: '',
        currency: 'CZK',
        address: '',
        phone: '',
        operatingHours: '09:00 - 22:30',
        status: 'DRAFT',
        merchantId: defaultM?.id || defaultMerchantId || '',
        customDomain: '',
        legalCompanyName: defaultM?.legalCompanyName || '',
        registeredAddress: defaultM?.registeredAddress || '',
        ico: defaultM?.ico || '',
        dic: defaultM?.dic || '',
        premisesId: '101',
        cashRegisterId: 'POS-ONLINE-01',
        courtRegistry: defaultM?.courtRegistry || '',
        paymentGateways: {
          stripeEnabled: true,
          cashOnDeliveryEnabled: true,
          cardTerminalEnabled: true,
          qrPayEnabled: true,
          applePayEnabled: true,
          googlePayEnabled: true,
          adyenEnabled: false,
          paypalEnabled: true,
          vivaWalletEnabled: false,
        },
        stripeConfig: {
          enabled: true,
          mode: 'TEST',
          publishableKey: `pk_test_${Date.now()}`,
          secretKey: 'sk_test_••••••••',
          webhookSecret: 'whsec_••••••••',
          currency: 'CZK',
          statementDescriptor: 'NEW STORE',
          enableApplePay: true,
          enableGooglePay: true,
          enableIdeal: false,
          enableBancontact: false,
          enableSepaDebit: true,
          enableKlarna: false,
          captureMethod: 'AUTOMATIC',
        },
        eet2Config: {
          enabled: true,
          mode: 'SANDBOX',
          endpointUrl: 'https://pg.eet.gov.cz/v2/soap/EETServiceSOAP',
          ico: defaultM?.ico || '29482019',
          dic: defaultM?.dic || 'CZ29482019',
          premisesId: '101',
          cashRegisterId: 'POS-ONLINE-01',
          certFileName: `EET_CA3_Store_${Date.now().toString().slice(-4)}.p12`,
          certPassword: '••••••••',
          certFingerprint: '7A:9F:88:2E:3D:5C:1B:44:E0:9A:88:F2:71:39:AA:88:02:11:7C:E5',
          timeoutMs: 2000,
          autoFallbackToPkp: true,
          offlineRetentionHours: 48,
          totalFiscalizedCount: 0,
          totalFiscalizedAmount: 0,
        },
      });
    }
  }, [storeId, existingStore, merchants, defaultMerchantId]);

  // Saving & Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ show: boolean; msg: string; error?: boolean }>({
    show: false,
    msg: '',
  });

  // Stripe Ping state
  const [stripePingLoading, setStripePingLoading] = useState(false);
  const [stripePingResult, setStripePingResult] = useState<{
    success: boolean;
    latencyMs: number;
    mode: string;
    status: string;
    message: string;
    publishableKeyMasked?: string;
  } | null>(null);

  // EET 2.0 Ping state
  const [eet2PingLoading, setEet2PingLoading] = useState(false);
  const [eet2PingResult, setEet2PingResult] = useState<{
    success: boolean;
    latencyMs: number;
    mode: string;
    status: string;
    message: string;
    endpoint?: string;
    tlsVersion?: string;
  } | null>(null);

  // EET 2.0 Simulator state
  const [simAmount, setSimAmount] = useState<number>(350);
  const [simDocNo, setSimDocNo] = useState<string>(`DOK-${Date.now().toString().slice(-6)}`);
  const [simOfflineForced, setSimOfflineForced] = useState(false);
  const [simFiscalizing, setSimFiscalizing] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Merchant Auto-fill
  const handleMerchantChange = (newMerchantId: string) => {
    const selectedM = merchants.find((m) => m.id === newMerchantId);
    setFormData((prev) => ({
      ...prev,
      merchantId: newMerchantId,
      legalCompanyName: prev.legalCompanyName || selectedM?.legalCompanyName || '',
      registeredAddress: prev.registeredAddress || selectedM?.registeredAddress || '',
      ico: prev.ico || selectedM?.ico || '',
      dic: prev.dic || selectedM?.dic || '',
      courtRegistry: prev.courtRegistry || selectedM?.courtRegistry || '',
    }));
  };

  // Currency change auto sync
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setFormData((prev) => ({
      ...prev,
      currency: newCurrency,
      stripeConfig: {
        ...prev.stripeConfig,
        currency: newCurrency,
      },
      eet2Config: {
        ...prev.eet2Config,
        enabled: newCurrency === 'CZK' ? true : prev.eet2Config.enabled,
      },
    }));
  };

  // Form Submit Handler (Saves ALL isolated configurations for this store)
  const handleSaveStore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.storeName.trim()) {
      setSaveToast({ show: true, msg: '请输入店铺名称', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 3000);
      return;
    }
    if (!formData.merchantId) {
      setSaveToast({ show: true, msg: '请选择所属商家账号（创建后归属不可更改）', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 3000);
      return;
    }
    if (!formData.address.trim()) {
      setSaveToast({ show: true, msg: '请输入店铺物理营业地址', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 3000);
      return;
    }

    setIsSaving(true);
    try {
      let result;
      if (isCreating) {
        // Force DRAFT status on creation
        result = await createStoreEntity({
          ...formData,
          status: 'DRAFT',
        });
        setSaveToast({
          show: true,
          msg: '🎉 门店草稿创建成功！所属商家可登录检查核对，确认无误后由 Super Admin 正式发布。',
          error: false,
        });
      } else {
        result = await updateStoreEntity(storeId, {
          ...formData,
        });
        setSaveToast({
          show: true,
          msg: '门店配置已保存，支付网关与税控设置已即时生效！',
          error: false,
        });
      }
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
      if (onSaved && result?.store) {
        onSaved(result.store);
      }
      if (isCreating) {
        onBack();
      }
    } catch (err: any) {
      setSaveToast({ show: true, msg: err.message || '保存失败', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish DRAFT store to ACTIVE
  const handlePublishStore = async () => {
    if (!storeId) return;
    if (!window.confirm('确认要正式创建并发布此门店吗？发布后门店将正式上线运营，受跨国财税与多租户审计保护，不可再被删除，所属商家亦不可更改。')) {
      return;
    }
    setIsSaving(true);
    try {
      await publishStoreEntity(storeId);
      setFormData((prev) => ({ ...prev, status: 'ACTIVE' }));
      setSaveToast({
        show: true,
        msg: '🚀 门店已正式创建并发布上线！状态已更新为 ACTIVE。',
        error: false,
      });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
    } catch (err: any) {
      setSaveToast({ show: true, msg: err.message || '发布失败', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete DRAFT store
  const handleDeleteDraftStore = async () => {
    if (!storeId) return;
    if (!window.confirm('确定要删除此草稿门店吗？此操作将永久移除该草稿配置。')) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteStoreEntity(storeId);
      onBack();
    } catch (err: any) {
      setSaveToast({ show: true, msg: err.message || '删除草稿失败', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
      setIsSaving(false);
    }
  };

  // Toggle Store Suspension (SUSPENDED <-> ACTIVE)
  const handleToggleSuspendStore = async () => {
    if (!storeId) return;
    const isCurrentlySuspended = formData.status === 'SUSPENDED';
    const confirmMsg = isCurrentlySuspended
      ? '确定要重新启用此门店吗？恢复后将重新对外开放下单。'
      : '确定要停用此门店吗？停用后顾客将无法在此门店下单与支付。';
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      await toggleStoreSuspend(storeId, !isCurrentlySuspended);
      setFormData((prev) => ({ ...prev, status: isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED' }));
      setSaveToast({
        show: true,
        msg: isCurrentlySuspended ? '🟢 门店已重新启用生效！' : '⏸️ 门店已停用（暂停运营服务）',
        error: false,
      });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
    } catch (err: any) {
      setSaveToast({ show: true, msg: err.message || '切换状态失败', error: true });
      setTimeout(() => setSaveToast({ show: false, msg: '' }), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Test Stripe Ping for this isolated store
  const handleRunStripePing = async () => {
    setStripePingLoading(true);
    setStripePingResult(null);
    try {
      const res = await testStripePing(storeId || undefined, formData.stripeConfig);
      setStripePingResult(res);
    } catch (err: any) {
      setStripePingResult({
        success: false,
        latencyMs: 0,
        mode: formData.stripeConfig.mode,
        status: 'ERROR',
        message: err.message || 'Stripe API 连通性测试失败',
      });
    } finally {
      setStripePingLoading(false);
    }
  };

  // Test EET 2.0 Ping for this isolated store
  const handleRunEET2Ping = async () => {
    setEet2PingLoading(true);
    setEet2PingResult(null);
    try {
      const res = await testEET2Ping(storeId || undefined, formData.eet2Config);
      setEet2PingResult(res);
    } catch (err: any) {
      setEet2PingResult({
        success: false,
        latencyMs: 0,
        mode: formData.eet2Config.mode,
        status: 'ERROR',
        message: err.message || 'EET 2.0 网关握手失败',
      });
    } finally {
      setEet2PingLoading(false);
    }
  };

  // Test EET 2.0 Simulation for this isolated store
  const handleRunEET2Fiscalize = async () => {
    setSimFiscalizing(true);
    try {
      const res = await fiscalizeEET2Sale({
        storeId: storeId || undefined,
        orderId: `sim_ord_${Date.now()}`,
        totalAmount: simAmount,
        docNumber: simDocNo,
        isOfflineForced: simOfflineForced,
        config: formData.eet2Config,
      });
      setSimResult(res);
      setFormData((prev) => ({
        ...prev,
        eet2Config: {
          ...prev.eet2Config,
          totalFiscalizedCount: (prev.eet2Config.totalFiscalizedCount || 0) + 1,
          totalFiscalizedAmount: (prev.eet2Config.totalFiscalizedAmount || 0) + Number(simAmount || 0),
        },
      }));
    } catch (err: any) {
      alert(err.message || '模拟开票失败');
    } finally {
      setSimFiscalizing(false);
    }
  };

  const isDraft = formData.status === 'DRAFT';
  const isSuspended = formData.status === 'SUSPENDED';
  const isActive = formData.status === 'ACTIVE' || formData.status === 'OPEN';

  const assignedMerchant = merchants.find((m) => m.id === formData.merchantId);
  const currentCurrency = SUPPORTED_CURRENCIES[formData.currency] || SUPPORTED_CURRENCIES.EUR;

  // Render simplified creation view when creating a new store
  if (isCreating) {
    return (
      <div className="h-full flex flex-col bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden select-none">
        {/* Top Header */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回列表</span>
            </button>
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Super Admin 新建门店
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    初始状态: 草稿 (DRAFT)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  填入核心信息生成草稿 · 所属商家可登录核对 · 确认无误后由 Super Admin 正式发布
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Creation Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Step & Policy Explanation Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-bold text-sm text-amber-950 dark:text-amber-100">
                  门店创建生命周期与合规指引:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11.5px] opacity-90">
                  <li><strong>归属不可更改</strong>：创建时从哪个商家账号创建，即永久归该商家所有。</li>
                  <li><strong>简化创建流程</strong>：无需在此阶段填写营业时间、门店客服电话等次要参数，系统将自动使用欧洲标准默认值。</li>
                  <li><strong>草稿审核流程</strong>：创建后门店为【草稿 (DRAFT)】状态，商家可登录后台核对信息；在此阶段您可自由修改或删除草稿。</li>
                  <li><strong>正式生效与不可删除</strong>：核对无误后，由 Super Admin 点击【正式创建 / 发布】使门店上线，之后不可删除，仅可停用。</li>
                </ul>
              </div>
            </div>

            {/* Creation Form Card */}
            <form onSubmit={handleSaveStore} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-5">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>门店核心信息填写</span>
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">* 必填字段</span>
              </div>

              {/* 1. 店铺名称 */}
              <div>
                <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 text-xs">
                  店铺名称 (Store Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="例如: 布拉格老城区分店 (Prague Old Town Bistro)"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium text-xs"
                />
              </div>

              {/* 2. 所属商家账户 (Immutable Tenant) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>所属商家账号 (Assigned Merchant Account) *</span>
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    创建后归属永久绑定，不可更改
                  </span>
                </div>
                {currentStaffUser?.role === 'SUPER_ADMIN' ? (
                  <select
                    required
                    value={formData.merchantId}
                    onChange={(e) => handleMerchantChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-semibold text-xs"
                  >
                    <option value="" disabled>-- 请选择所属签约商家 --</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.legalCompanyName || `${m.name} s.r.o.`} · {m.contactPerson})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {merchants.find((m) => m.id === formData.merchantId)?.name || '当前商户直属绑定'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                      商户直属归属
                    </span>
                  </div>
                )}
              </div>

              {/* 3. 结算币种选择 (CZK & EUR) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                    <span>门店结算货币 (Base Currency) *</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    捷克运营支持：捷克克朗 (CZK) 或 欧元 (EUR)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
                    const curr = SUPPORTED_CURRENCIES[code];
                    const isSelected = formData.currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleCurrencyChange(code)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{curr.flag}</span>
                          <div>
                            <div className="text-xs font-bold">{curr.name} ({curr.symbol})</div>
                            <div className="text-[10px] opacity-75">{curr.nativeName} · 代码: {curr.code}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 门店物理经营地址 */}
              <div>
                <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>门店物理经营地址 (Physical Store Address / Provozovna adresa) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="例如: Staroměstské nám. 12, 110 00 Praha 1, Czech Republic"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                >
                  取消并返回
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold text-xs shadow-2xs active:scale-98 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在创建草稿...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>创建门店 (生成草稿待核对)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode View
  return (
    <div className="h-full flex flex-col bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden select-none">
      {/* 顶部导航与保存控制条 (Header) */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回门店列表</span>
          </button>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {formData.storeName || '未命名店铺'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  ID: {storeId}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                    isDraft
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : isSuspended
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isDraft ? '📝 草稿状态 (待正式发布)' : isSuspended ? '⏸️ 已停用 (暂停运营)' : '🟢 正式运营中'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                欧洲多国独立门店配置 · 支付网关 (Stripe) 与捷克国家税控 (EET 2.0) 实体级数据隔离
              </p>
            </div>
          </div>
        </div>

        {/* 顶部右侧状态与操作栏 */}
        <div className="flex items-center gap-2">
          {saveToast.show && (
            <div
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 animate-fade-in ${
                saveToast.error
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-bold">{saveToast.msg}</span>
            </div>
          )}

          {/* DRAFT Quick Action: Publish */}
          {isDraft && (
            <button
              type="button"
              onClick={handlePublishStore}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs active:scale-98 transition flex items-center gap-1.5 disabled:opacity-50"
              title="确认无误后由 Super Admin 正式创建并发布该门店"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>正式创建 / 发布门店</span>
            </button>
          )}

          {/* DRAFT Quick Action: Delete Draft */}
          {isDraft && (
            <button
              type="button"
              onClick={handleDeleteDraftStore}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition flex items-center gap-1.5"
              title="删除此草稿门店"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除草稿</span>
            </button>
          )}

          {/* ACTIVE / SUSPENDED Action: Suspend / Reactivate */}
          {!isDraft && (
            <button
              type="button"
              onClick={handleToggleSuspendStore}
              disabled={isSaving}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-2xs ${
                isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isSuspended ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>重新启用门店</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>停用门店</span>
                </>
              )}
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSaveStore()}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold text-xs shadow-2xs active:scale-98 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>保存设置</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lifecycle Status Notification Banner */}
      {isDraft ? (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.2 rounded font-mono font-bold bg-amber-200/60 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px]">
              DRAFT 草稿
            </span>
            <span className="truncate">
              此门店当前为草稿状态。所属商家可检查门店与开票信息，Super Admin 可修改或删除草稿。确认无误后点击右上角【正式创建 / 发布门店】。
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate font-medium">
              正式运营门店 · 已受欧洲跨国财税与多租户审计保护（<strong>归属商家与正式门店不可删除，仅可停用/启用</strong>）。
            </span>
          </div>
        </div>
      )}

      {/* 4 大独立配置模块选项卡 (Segmented Navigation) */}
      <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2">
          {/* Tab 1: 门店基本经营信息 */}
          <button
            type="button"
            onClick={() => setActiveSubTab('BASIC')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeSubTab === 'BASIC'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>1. 基础经营与归属</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/20">
              {currentCurrency.flag} {formData.currency}
            </span>
          </button>

          {/* Tab 2: 法定公司与税务主体 */}
          <button
            type="button"
            onClick={() => setActiveSubTab('LEGAL')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeSubTab === 'LEGAL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>2. 法定企业与开票</span>
            {formData.dic && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/20">
                {formData.dic}
              </span>
            )}
          </button>

          {/* Tab 3: 独立支付网关与 Stripe */}
          <button
            type="button"
            onClick={() => setActiveSubTab('PAYMENTS')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeSubTab === 'PAYMENTS'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. 独立支付网关 (Stripe)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                formData.stripeConfig.enabled
                  ? formData.stripeConfig.mode === 'LIVE'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 text-zinc-900'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {formData.stripeConfig.enabled ? (formData.stripeConfig.mode === 'LIVE' ? '正式' : '测试') : '未启用'}
            </span>
          </button>

          {/* Tab 4: 捷克财政税控 EET 2.0 */}
          <button
            type="button"
            onClick={() => setActiveSubTab('EET2')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeSubTab === 'EET2'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. 捷克财政税控 EET 2.0</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                formData.eet2Config.enabled
                  ? formData.eet2Config.mode === 'PRODUCTION'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-400 text-zinc-900'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {formData.eet2Config.enabled ? (formData.eet2Config.mode === 'PRODUCTION' ? '生产' : '沙盒') : '未启用'}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 hidden xl:flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span>实体级数据隔离与独立合规审计</span>
        </div>
      </div>

      {/* 滚动工作区 (Main Content View) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ========================================================================= */}
          {/* TAB 1: 门店基础与经营信息 (Basic & Operational Profile) */}
          {/* ========================================================================= */}
          {activeSubTab === 'BASIC' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">门店基础营业信息</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">设置店铺公开展示名称、结算货币、营业状态与物理地址</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 店铺名称 */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      店铺名称 (Store Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      placeholder="例如: 布拉格老城区旗舰店 (Prague Old Town)"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>

                  {/* 营业状态 */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      当前营业状态 (Operating Status)
                    </label>
                    <select
                      value={formData.status}
                      disabled={isDraft}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium disabled:opacity-60"
                    >
                      {isDraft && <option value="DRAFT">📝 草稿 (DRAFT - 待正式创建发布)</option>}
                      <option value="OPEN">🟢 正常营业 (OPEN - 顾客可下单付款)</option>
                      <option value="CLOSED">🔴 暂停打烊 (CLOSED - 顾客端提示已打烊)</option>
                      <option value="SUSPENDED">⏸️ 暂停营业 (SUSPENDED)</option>
                    </select>
                  </div>
                </div>

                {/* 门店结算货币选择 (CZK & EUR) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                      <span>门店法定结算币种 (Store Base Currency) *</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      捷克运营：可自由配置为捷克克朗 (CZK) 或 欧元 (EUR)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
                      const curr = SUPPORTED_CURRENCIES[code];
                      const isSelected = formData.currency === code;

                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleCurrencyChange(code)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{curr.flag}</span>
                            <div>
                              <div className="font-bold text-xs">{curr.name} ({curr.symbol})</div>
                              <div className="text-[10px] opacity-75">{curr.nativeName} · 代码: {curr.code}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 门店物理经营地址 */}
                <div>
                  <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>门店物理经营地址 (Physical Store Address / Provozovna adresa) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="例如: Staroměstské nám. 12, 110 00 Praha 1, Czechia"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium text-xs"
                  />
                </div>

                {/* 门店独立专属域名 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>门店点餐独立专属域名 / 子域名 (Custom Subdomain)</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">白标与直达路由</span>
                  </div>
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    placeholder="例如: prague.danubefoods.eu 或 order-prague.myrestaurant.cz"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    绑定后，顾客通过该域名扫码或访问时，系统将直接锁定本门店菜单与币种，无需手动切换。
                  </p>
                </div>

                {/* 营业时间与服务电话 (Edit Mode only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>营业时间 (Operating Hours)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      placeholder="例如: 10:00 - 22:00"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>门店客服电话 (Store Phone)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="例如: +420 221 543 210"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: 法定公司与税务主体 (Legal & Fiscal Entity) */}
          {/* ========================================================================= */}
          {activeSubTab === 'LEGAL' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">门店法定身份与税务开票登记</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        配置门店独立的商事公司名称、增值税号 (DIČ)、营业场所编号 (Provozovna) 与收银设备编号 (Pokladna)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl">
                    法定税务凭证开具主体
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 开票公司法定全称 */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      开票公司法定全称 (Legal Company Name) *
                    </label>
                    <input
                      type="text"
                      value={formData.legalCompanyName}
                      onChange={(e) => setFormData({ ...formData, legalCompanyName: e.target.value })}
                      placeholder="例如: Danube Hospitality Europe s.r.o."
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>

                  {/* 公司注册法定地址 */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      企业注册法定地址 (Registered Headquarters) *
                    </label>
                    <input
                      type="text"
                      value={formData.registeredAddress}
                      onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                      placeholder="例如: Václavské náměstí 846/1, 110 00 Praha 1"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>

                  {/* 捷克组织机构代码 IČO */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center justify-between">
                      <span>捷克公司代码 IČO (Company ID)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">8位数字</span>
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={formData.ico}
                      onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                      placeholder="例如: 29482019"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  {/* 捷克增值税号 DIČ */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center justify-between">
                      <span>捷克增值税号 DIČ (VAT Number)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">以 CZ 开头</span>
                    </label>
                    <input
                      type="text"
                      value={formData.dic}
                      onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                      placeholder="例如: CZ29482019"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono uppercase"
                    />
                  </div>

                  {/* 营业场所编号 Provozovna */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center justify-between">
                      <span>营业场所编号 (Premises / Číslo provozovny) *</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">税局备案号</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.premisesId}
                      onChange={(e) => setFormData({ ...formData, premisesId: e.target.value })}
                      placeholder="例如: 101"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  {/* 收银设备代号 Pokladna */}
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 flex items-center justify-between">
                      <span>收银终端代码 (POS / Označení pokladního zařízení) *</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">EET 2.0 绑定</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cashRegisterId}
                      onChange={(e) => setFormData({ ...formData, cashRegisterId: e.target.value })}
                      placeholder="例如: POS-ONLINE-01"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                {/* 法院商事登记信息 */}
                <div>
                  <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5 text-xs">
                    法院商事登记备案号 (Court Commercial Registry)
                  </label>
                  <input
                    type="text"
                    value={formData.courtRegistry}
                    onChange={(e) => setFormData({ ...formData, courtRegistry: e.target.value })}
                    placeholder="例如: Zapsána v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 189201"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    根据捷克商业法，该信息将自动打印在小票底部的法律声明栏中。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 独立支付网关与 Stripe */}
          {/* ========================================================================= */}
          {activeSubTab === 'PAYMENTS' && (
            <div className="space-y-5">
              {/* Payment Methods Toggle */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">本门店前台结账方式开关</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">单独配置此门店顾客在扫码手机端与收银台可选的结账方式</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Stripe 在线线上支付</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.stripeEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, stripeEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">线下门店现金结账</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.cashOnDeliveryEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, cashOnDeliveryEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">POS 实体刷卡机</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.cardTerminalEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, cardTerminalEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">捷克本地银行 QR 快捷支付</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.qrPayEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, qrPayEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Apple Pay (原生快捷)</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.applePayEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, applePayEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Google Pay (原生快捷)</span>
                    <input
                      type="checkbox"
                      checked={formData.paymentGateways.googlePayEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentGateways: { ...formData.paymentGateways, googlePayEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>
                </div>
              </div>

              {/* Stripe Gateway Dedicated Parameters */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                      S
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">本门店专属 Stripe 账户与密钥配置</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        资金直接清算至本门店绑定的银行账户，与其他门店完全物理隔离
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunStripePing}
                    disabled={stripePingLoading}
                    className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Zap className={`w-3.5 h-3.5 ${stripePingLoading ? 'animate-spin' : ''}`} />
                    <span>{stripePingLoading ? '测试连通中...' : '测试 Stripe 连通性'}</span>
                  </button>
                </div>

                {stripePingResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      stripePingResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {stripePingResult.success ? 'Stripe 连通测试成功' : 'Stripe 连通测试未通过'}
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        模式: {stripePingResult.mode} · 延迟: {stripePingResult.latencyMs}ms · {stripePingResult.message}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      Stripe 运行模式 (Mode)
                    </label>
                    <select
                      value={formData.stripeConfig.mode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stripeConfig: { ...formData.stripeConfig, mode: e.target.value as any },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-bold"
                    >
                      <option value="TEST">🧪 TEST (沙盒测试 - 不产生真实扣款)</option>
                      <option value="LIVE">🚀 LIVE (正式生产 - 真实信用卡结算)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      账单流水声明 (Statement Descriptor)
                    </label>
                    <input
                      type="text"
                      maxLength={22}
                      value={formData.stripeConfig.statementDescriptor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stripeConfig: { ...formData.stripeConfig, statementDescriptor: e.target.value.toUpperCase() },
                        })
                      }
                      placeholder="例如: SEATLESS PRAGUE"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      Publishable Key (前台公钥 pk_live_... / pk_test_...)
                    </label>
                    <input
                      type="text"
                      value={formData.stripeConfig.publishableKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stripeConfig: { ...formData.stripeConfig, publishableKey: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      Secret Key (后台密钥 sk_live_... / sk_test_...)
                    </label>
                    <input
                      type="password"
                      value={formData.stripeConfig.secretKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stripeConfig: { ...formData.stripeConfig, secretKey: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      Webhook Secret (签名密钥 whsec_...)
                    </label>
                    <input
                      type="password"
                      value={formData.stripeConfig.webhookSecret}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stripeConfig: { ...formData.stripeConfig, webhookSecret: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: 捷克财政税控 EET 2.0 */}
          {/* ========================================================================= */}
          {activeSubTab === 'EET2' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">捷克国家财政税控系统 EET 2.0 网关</h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        直连捷克财政部 DIS+ / EET SOAP 核心税控服务器，生成 FIK 与 BKP 财政签名
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunEET2Ping}
                    disabled={eet2PingLoading}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Radio className={`w-3.5 h-3.5 ${eet2PingLoading ? 'animate-spin' : ''}`} />
                    <span>{eet2PingLoading ? '握手中...' : '测试财政部网关握手'}</span>
                  </button>
                </div>

                {eet2PingResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      eet2PingResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {eet2PingResult.success ? 'EET 2.0 财政部握手成功' : 'EET 2.0 握手失败'}
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        模式: {eet2PingResult.mode} · 延迟: {eet2PingResult.latencyMs}ms · {eet2PingResult.message}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      EET 2.0 运行模式 (Environment)
                    </label>
                    <select
                      value={formData.eet2Config.mode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eet2Config: { ...formData.eet2Config, mode: e.target.value as any },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-bold"
                    >
                      <option value="SANDBOX">🧪 SANDBOX (DIS+ 官方沙盒开发测试环境)</option>
                      <option value="PRODUCTION">🚀 PRODUCTION (捷克财政部生产核心税控)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      SOAP 接口超时门限 (Timeout)
                    </label>
                    <input
                      type="number"
                      value={formData.eet2Config.timeoutMs}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eet2Config: { ...formData.eet2Config, timeoutMs: Number(e.target.value) },
                        })
                      }
                      placeholder="2000"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      SOAP 财政接口端点 (Endpoint URL)
                    </label>
                    <input
                      type="text"
                      value={formData.eet2Config.endpointUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eet2Config: { ...formData.eet2Config, endpointUrl: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      P12 财政证书文件名
                    </label>
                    <input
                      type="text"
                      value={formData.eet2Config.certFileName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eet2Config: { ...formData.eet2Config, certFileName: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      P12 证书密码 (Passphrase)
                    </label>
                    <input
                      type="password"
                      value={formData.eet2Config.certPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eet2Config: { ...formData.eet2Config, certPassword: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                {/* Fiscalize Simulator */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>EET 2.0 独立开票模拟器 (FIK / PKP 验证)</span>
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      placeholder="开票金额"
                      className="w-28 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={simDocNo}
                      onChange={(e) => setSimDocNo(e.target.value)}
                      placeholder="单据编号"
                      className="w-36 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono"
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simOfflineForced}
                        onChange={(e) => setSimOfflineForced(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span>模拟脱网 (强制PKP)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleRunEET2Fiscalize}
                      disabled={simFiscalizing}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{simFiscalizing ? '开票签名中...' : '发送财政部开票'}</span>
                    </button>
                  </div>

                  {simResult && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-mono space-y-1">
                      <div className="text-emerald-600 font-bold">
                        开票成功 · 状态: {simResult.status} ({simResult.mode})
                      </div>
                      {simResult.fik && <div>FIK: <span className="font-bold text-zinc-900 dark:text-zinc-100">{simResult.fik}</span></div>}
                      {simResult.bkp && <div>BKP: <span className="text-zinc-600 dark:text-zinc-300">{simResult.bkp}</span></div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
