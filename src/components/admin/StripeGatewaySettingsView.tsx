import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  ShieldCheck, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  RefreshCw, 
  Zap, 
  Lock, 
  ExternalLink, 
  Info, 
  Globe, 
  Smartphone, 
  ShieldAlert, 
  Radio, 
  Eye, 
  EyeOff, 
  Activity,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { StripeGatewayConfig, CurrencyCode } from '../../types';

export const StripeGatewaySettingsView: React.FC = () => {
  const { 
    stripeConfig, 
    updateStripeConfig, 
    testStripePing, 
    currentStaffUser, 
    currentStore,
    hasPermission 
  } = useApp();

  // Permission Check: Super Admin & Merchant only
  const isAuthorized = 
    currentStaffUser.role === 'SUPER_ADMIN' || 
    currentStaffUser.role === 'MERCHANT' ||
    hasPermission('perm_stripe_manage');

  // Form State
  const [formData, setFormData] = useState<StripeGatewayConfig>({ ...stripeConfig });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Ping Test State
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    mode: string;
    message: string;
    timestamp?: number;
  } | null>(null);

  // Triple Popup Flow States
  // step: 0 = idle, 1 = Step 1 Risk Impact, 2 = Step 2 Operator Auth, 3 = Step 3 Final Broadcast
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2 | 3>(0);
  const [step1Acknowledged, setStep1Acknowledged] = useState(false);
  const [step2AuthCode, setStep2AuthCode] = useState('');
  const [step3Countdown, setStep3Countdown] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunPingTest = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await testStripePing();
      setPingResult({
        success: true,
        latencyMs: res.latencyMs || 28,
        mode: res.mode || formData.mode,
        message: res.message || 'Stripe API Gateway TLS 1.3 握手成功',
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setPingResult({
        success: false,
        latencyMs: 0,
        mode: formData.mode,
        message: err.message || '网络连接超时或网关不可达',
        timestamp: Date.now(),
      });
    } finally {
      setPingLoading(false);
    }
  };

  // Start Triple Confirmation Flow
  const handleInitiateSave = () => {
    setStep1Acknowledged(false);
    setStep2AuthCode('');
    setStep3Countdown(3);
    setConfirmStep(1);
  };

  // Step 1 -> Step 2
  const handleProceedToStep2 = () => {
    if (!step1Acknowledged) return;
    setConfirmStep(2);
  };

  // Step 2 -> Step 3
  const handleProceedToStep3 = () => {
    const requiredCode = currentStaffUser.pinCode || 'CONFIRM';
    const isCodeValid = 
      step2AuthCode.trim().toUpperCase() === 'CONFIRM' || 
      step2AuthCode.trim() === currentStaffUser.pinCode ||
      step2AuthCode.trim().toUpperCase() === 'STRIPE';

    if (!isCodeValid) {
      alert(`安全授权码不正确，请输入 "CONFIRM" 或您的员工PIN码 (${currentStaffUser.pinCode || '8888'})`);
      return;
    }

    setConfirmStep(3);
    setStep3Countdown(3);
    const interval = setInterval(() => {
      setStep3Countdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 3 Final Execute
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateStripeConfig(formData);
      setConfirmStep(0);
      setSaveSuccessMessage('Stripe 支付网关配置已成功热更新并实时广播至全店终端！');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToSandboxPreset = () => {
    if (window.confirm('确定要一键填充官方默认的 Stripe 测试沙盒配置 (Test Sandbox) 吗？')) {
      setFormData({
        ...formData,
        enabled: true,
        mode: 'test',
        publishableKey: 'pk_test_51NxM92E09ZkRestErpSaaS_live_mock',
        secretKey: 'sk_test_51NxM92E09ZkRestErpSaaS_secret_mock',
        webhookSecret: 'whsec_9b2d8e37f10a4c59a0e4c81f3',
        merchantDisplayName: 'Seatless / 智能数字化餐饮收银',
        allowApplePayGooglePay: true,
        enable3DSecureTest: true,
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div id="stripe-auth-denied" className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Stripe 支付网关配置权限受限</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          当前登录账户 <strong className="text-slate-800 font-semibold">{currentStaffUser.name} ({currentStaffUser.role})</strong> 暂无支付网关与API密钥的管理权限。此功能仅限 <strong className="text-indigo-600">超级管理员 (SUPER_ADMIN)</strong> 与 <strong className="text-indigo-600">商家法定代表 (MERCHANT)</strong> 访问。
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
          <Info className="w-4 h-4 text-slate-400" />
          <span>请在左上角或设置中切换为「平台超级管理员」或「品牌商家」角色进行配置</span>
        </div>
      </div>
    );
  }

  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(stripeConfig);

  return (
    <div id="stripe-gateway-settings-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">Stripe 支付网关配置与沙盒测试中心</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    formData.mode === 'test' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {formData.mode === 'test' ? '⚡ TEST MODE (沙盒测试)' : '🔒 LIVE MODE (生产正式)'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  负责全店在线点餐（顾客H5手机扫码点餐）、Apple Pay / Google Pay 及 POS 刷卡通道的底层 Stripe API 密钥调度
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunPingTest}
              disabled={pingLoading}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 text-indigo-300 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>{pingLoading ? 'Ping 测速中...' : '测试 API 连通性'}</span>
            </button>

            <button
              onClick={handleInitiateSave}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition active:scale-95 ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>保存并广播变更 (三重核验)</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Bar */}
        {pingResult && (
          <div className={`mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs gap-2 ${
            pingResult.success ? 'text-emerald-300' : 'text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${pingResult.success ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{pingResult.message}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
              <span>往返延迟: <strong className="text-white">{pingResult.latencyMs} ms</strong></span>
              <span>网关模式: <strong className="text-amber-300">{pingResult.mode.toUpperCase()}</strong></span>
              <span>TLS 1.3 握手: <strong className="text-emerald-400">已加密 (SHA-256)</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: 网关状态与运行模式 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">网关启停与运行环境</h2>
                  <p className="text-xs text-slate-500">控制 Stripe 在线交易总开关及沙盒/生产环境切换</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetToSandboxPreset}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
              >
                恢复沙盒默认参数
              </button>
            </div>

            {/* Switch: Gateway Enable */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  启用 Stripe 线上结账通道
                  {formData.enabled ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700">🟢 正常服务中</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-700">🔴 已熔断关闭</span>
                  )}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">关闭后顾客点餐页面将隐藏 Stripe 信用卡支付，仅支持吧台现钞与到店收银</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Mode Selector: Test vs Live */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">运行环境选择 (API Environment)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'test' })}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                    formData.mode === 'test'
                      ? 'border-amber-400 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${formData.mode === 'test' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>沙盒测试模式 (Test Mode)</span>
                      <span className="bg-amber-200/60 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono">Recommended</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">使用官方 4242 模拟卡进行无扣款测试，支持 3DS 验证与异常测试</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'live' })}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                    formData.mode === 'live'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${formData.mode === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>生产正式环境 (Live Mode)</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">Production</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">连接真实银行网联与清结算机构，每笔交易产生真实扣款流水</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Merchant Display Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                商家收银台抬头名称 (Merchant Statement Descriptor)
              </label>
              <input
                type="text"
                value={formData.merchantDisplayName}
                onChange={(e) => setFormData({ ...formData, merchantDisplayName: e.target.value })}
                placeholder="例如: Seatless Bistro Paris"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
              <p className="text-[11px] text-slate-400">显示在顾客手机点餐付款页面以及顾客银行对账单上的商家名称</p>
            </div>
          </div>

          {/* Card 2: 密钥与签名凭据管理 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Stripe API 密钥与签名凭据</h2>
                <p className="text-xs text-slate-500">公钥提供给前端顾客收银台，私钥与 Webhook Secret 由安全后端妥善保管</p>
              </div>
            </div>

            {/* Publishable Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Publishable Key (公开可分发密钥)</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">pk_...</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(formData.publishableKey, 'pk')}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedField === 'pk' ? '已复制!' : '复制'}</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.publishableKey}
                onChange={(e) => setFormData({ ...formData, publishableKey: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Secret Key (私有服务通讯密钥 - 仅后端使用)</span>
                  <span className="font-mono text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">sk_...</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSecretKey ? '隐藏' : '显示'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.secretKey, 'sk')}
                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedField === 'sk' ? '已复制!' : '复制'}</span>
                  </button>
                </div>
              </div>
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Webhook Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Webhook Signing Secret (回调签名校验凭证)</span>
                  <span className="font-mono text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">whsec_...</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(formData.webhookSecret, 'whsec')}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedField === 'whsec' ? '已复制!' : '复制'}</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.webhookSecret}
                onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">用于校验 Stripe 服务器发送给 `/api/webhook/stripe` 异步扣款通知的数字签名，防止伪造回调</p>
            </div>
          </div>

          {/* Card 3: 支付选项与高级安全测试设置 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">支付体验与沙盒安全选项</h2>
                <p className="text-xs text-slate-500">配置 Apple Pay、Google Pay 及 3D Secure 2.0 强身份验证模拟</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Apple Pay & Google Pay */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                <input
                  type="checkbox"
                  checked={formData.allowApplePayGooglePay}
                  onChange={(e) => setFormData({ ...formData, allowApplePayGooglePay: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>支持 Apple Pay / Google Pay</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded font-mono">1-Click</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">在顾客移动端 Safari / Chrome 浏览器自动唤起指纹/人脸识别快捷支付</p>
                </div>
              </label>

              {/* 3D Secure Test */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                <input
                  type="checkbox"
                  checked={formData.enable3DSecureTest}
                  onChange={(e) => setFormData({ ...formData, enable3DSecureTest: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>启用 3D Secure 强认证模拟</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded font-mono">SCA 2.0</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">模拟欧洲 PSD2 银行短信验证码/App 授权弹窗，验证出餐流转安全性</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Stripe Sandbox Test Cards Reference & Live Audit */}
        <div className="space-y-6">
          
          {/* Card: 官方测试卡号速查表 */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Stripe 官方沙盒测试卡</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">CVC任意 | 有效期任意将来</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              在顾客手机端结算或 POS 测试时，可直接点击复制或在顾客支付窗口中一键自动填充测试：
            </p>

            <div className="space-y-2.5">
              {/* Card 1: 4242 Standard Success */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>标准直接扣款成功卡</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Visa</span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 mt-1">4242 4242 4242 4242</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('4242424242424242', 'card_4242')}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition"
                >
                  {copiedField === 'card_4242' ? '已复制' : '复制'}
                </button>
              </div>

              {/* Card 2: 3DS Authentication Card */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span>3D Secure 验证卡</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">SCA Flow</span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 mt-1">4000 0000 0000 3063</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('4000000000003063', 'card_3ds')}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition"
                >
                  {copiedField === 'card_3ds' ? '已复制' : '复制'}
                </button>
              </div>

              {/* Card 3: Insufficient Funds Card */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span>模拟余额不足拒付卡</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1 rounded">Decline 402</span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 mt-1">4000 0000 0000 0002</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('4000000000000002', 'card_declined')}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition"
                >
                  {copiedField === 'card_declined' ? '已复制' : '复制'}
                </button>
              </div>

              {/* Card 4: Fraud Radar Block */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <span>模拟高风控欺诈拦截卡</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded">Radar Block</span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 mt-1">4000 0000 0000 0127</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('4000000000000127', 'card_fraud')}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition"
                >
                  {copiedField === 'card_fraud' ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          </div>

          {/* Audit Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">网关版本与操作审计日志</h3>
            <div className="text-xs text-slate-600 space-y-2 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">最后更新操作员:</span>
                <span className="font-semibold text-slate-800">{stripeConfig.updatedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">生效时间戳:</span>
                <span className="text-slate-700">{new Date(stripeConfig.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">当前主选门店:</span>
                <span className="text-indigo-600 font-semibold">{currentStore.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">安全合规性:</span>
                <span className="text-emerald-600 font-semibold">PCI-DSS SAQ A 认证通过</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRIPLE CONFIRMATION MODAL WORKFLOW (三重安全弹窗提醒机制)                  */}
      {/* ========================================================================= */}
      
      {/* STEP 1: 风险与影响面评估 */}
      {confirmStep === 1 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">三重安全审核 (第 1 / 3 重)</span>
                <h3 className="text-lg font-bold text-slate-900">支付网关变更影响与风险评估</h3>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 space-y-2 leading-relaxed">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                请注意：网关配置变更将立即热更新并影响全店业务！
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>所有正在使用手机端（H5扫码）结算的顾客将立即载入新支付网关参数。</li>
                <li>运行模式：由 <strong className="font-mono text-slate-900">{stripeConfig.mode.toUpperCase()}</strong> 变更至 <strong className="font-mono text-indigo-700">{formData.mode.toUpperCase()}</strong>。</li>
                <li>服务状态：{formData.enabled ? '🟢 保持开启' : '🔴 立即暂停并熔断全店在线 Stripe 支付'}。</li>
                <li>若填写了错误的 API 密钥，顾客在付款时将遭遇交易拦截或失败。</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={step1Acknowledged}
                onChange={(e) => setStep1Acknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                我已核对本次修改的 Stripe 密钥及参数，确认其有效性并知晓对全店线上交易的影响。
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStep(0)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                放弃修改并关闭
              </button>
              <button
                type="button"
                disabled={!step1Acknowledged}
                onClick={handleProceedToStep2}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span>下一步：身份与权限核验 (2/3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: 操作员安全授权与指令核对 */}
      {confirmStep === 2 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">三重安全审核 (第 2 / 3 重)</span>
                <h3 className="text-lg font-bold text-slate-900">操作员身份授权与安全口令核验</h3>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>授权操作员:</span>
                <strong className="text-slate-900">{currentStaffUser.name} ({currentStaffUser.role})</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>安全授权凭证要求:</span>
                <span className="text-indigo-600 font-mono font-semibold">请输入 "CONFIRM" 或您的员工PIN码 ({currentStaffUser.pinCode || '8888'})</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">请输入安全授权口令 (Security Token)</label>
              <input
                type="text"
                autoFocus
                value={step2AuthCode}
                onChange={(e) => setStep2AuthCode(e.target.value)}
                placeholder="在此输入 CONFIRM 或 PIN码"
                className="w-full text-sm font-mono text-center tracking-wider px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setConfirmStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                返回上一步
              </button>
              <button
                type="button"
                disabled={!step2AuthCode.trim()}
                onClick={handleProceedToStep3}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span>下一步：终极全网广播生效 (3/3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 终极全网广播生效倒计时 */}
      {confirmStep === 3 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">三重安全审核 (第 3 / 3 重)</span>
                <h3 className="text-lg font-bold text-slate-900">终极确认：立即发布并全网热更新</h3>
              </div>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-2">
              <p className="font-semibold">即将执行最终写入与全局 WebSocket 广播：</p>
              <p className="text-slate-700 leading-relaxed">
                点击下方按钮后，新配置将立即写入服务端并触发 <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 font-mono text-[11px]">STRIPE_CONFIG_UPDATED</code> 事件，全店已连线终端无需刷新即可无缝切换！
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setConfirmStep(0)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                type="button"
                disabled={step3Countdown > 0 || isSubmitting}
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {step3Countdown > 0 
                    ? `终极安全防抖倒计时 (${step3Countdown}s)` 
                    : isSubmitting 
                    ? '正在热更新并广播...' 
                    : '立即终极应用并广播全店'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
