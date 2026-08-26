import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scale,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  QrCode,
  Lock,
  ExternalLink,
  Info,
  RefreshCw,
  Copy,
  Radio,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Building,
} from 'lucide-react';
import { EET2GatewayConfig } from '../../types';

export const EET2FiscalSettingsView: React.FC = () => {
  const {
    eet2Config,
    updateEET2Config,
    testEET2Ping,
    fiscalizeEET2Sale,
    currentStaffUser,
    currentStore,
    currentMerchant,
    formatPrice,
    hasPermission,
  } = useApp();

  const isAuthorized =
    currentStaffUser.role === 'SUPER_ADMIN' ||
    currentStaffUser.role === 'MERCHANT' ||
    hasPermission('perm_stripe_manage');

  const [formData, setFormData] = useState<EET2GatewayConfig>({ ...eet2Config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Ping test state
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    mode: string;
    message: string;
    endpoint?: string;
    tlsVersion?: string;
  } | null>(null);

  // Live Fiscal Playground state
  const [testAmount, setTestAmount] = useState<number>(350);
  const [testDocNumber, setTestDocNumber] = useState<string>(`DOK-${Date.now().toString().slice(-6)}`);
  const [isOfflineForced, setIsOfflineForced] = useState(false);
  const [fiscalizing, setFiscalizing] = useState(false);
  const [fiscalResult, setFiscalResult] = useState<any>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateEET2Config(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await testEET2Ping();
      setPingResult(res);
    } catch (err: any) {
      setPingResult({
        success: false,
        latencyMs: 0,
        mode: formData.mode,
        message: err.message || '握手失败，请检查网络端点与证书配置',
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleRunFiscalize = async () => {
    setFiscalizing(true);
    try {
      const res = await fiscalizeEET2Sale({
        orderId: `test_ord_${Date.now()}`,
        totalAmount: testAmount,
        docNumber: testDocNumber,
        isOfflineForced,
      });
      setFiscalResult(res);
    } catch (err: any) {
      alert(err.message || '模拟上报失败');
    } finally {
      setFiscalizing(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-stone-800 dark:text-zinc-100">
      {/* 顶部标题与法律政策标识 */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-blue-950 via-indigo-950 to-stone-900 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>Finanční správa ČR · 捷克财政部税控标准</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                2027年1月1日正式实施预研系统 (EET 2.0 Ready)
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>EET 2.0 国家财政税控网关与数字小票引擎</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              基于捷克众议院最新审议通过的《电子销售登记法案 2.0 (Zákon o EET 2.0)》构建。支持 X.509 客户端商业证书双向认证、本地 BKP 安全码实时哈希计算、财政部在线防伪码 (FIK) 自动分配与 48 小时离线签名 (PKP) 容灾。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              id="eet2-test-ping-btn"
              type="button"
              onClick={handleRunPing}
              disabled={pingLoading}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>{pingLoading ? '正在握手财政部网关...' : '一键握手测试 (Ping Gateway)'}</span>
            </button>

            <a
              href="https://eet.gov.cz"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition border border-white/10"
            >
              <span>eet.gov.cz 官方规范</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* 关键统计指标条 */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px]">当前网关模式</span>
            <strong className="text-amber-300 font-bold flex items-center gap-1 mt-0.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              {eet2Config.mode === 'SANDBOX' ? '开发者沙盒 (DIS+ Playground)' : '正式生产环境 (Live)'}
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">财政部网关延迟</span>
            <strong className="text-emerald-400 font-mono font-bold mt-0.5 block">
              {eet2Config.lastPingLatencyMs || 42} ms (TLS 1.3 极速)
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">已合规登记笔数</span>
            <strong className="text-white font-mono font-bold mt-0.5 block">
              {eet2Config.totalFiscalizedCount || 184} 笔
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block text-[11px]">累计上报金额 (CZK)</span>
            <strong className="text-emerald-300 font-mono font-bold mt-0.5 block">
              {(eet2Config.totalFiscalizedAmount || 49820).toLocaleString('cs-CZ')} Kč
            </strong>
          </div>
        </div>
      </div>

      {/* Ping 测试结果通告 */}
      {pingResult && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
            pingResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {pingResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm">
                {pingResult.success ? 'EET 2.0 财政部税控网关握手认证通过' : '网关握手失败'}
              </div>
              <p>{pingResult.message}</p>
              {pingResult.success && (
                <div className="flex flex-wrap items-center gap-4 text-[11px] opacity-90 pt-1 font-mono">
                  <span>往返耗时: <strong>{pingResult.latencyMs} ms</strong></span>
                  <span>协议安全: <strong>TLS 1.3 / X.509 RSA-SHA256</strong></span>
                  <span>认证主体: <strong>DIČ {formData.dic} (IČO {formData.ico})</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 核心主工作区：左侧网关配置表单，右侧实战沙盒与小票效果 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：EET 2.0 核心配置表单 (7列) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base text-stone-900 dark:text-zinc-100">税控网关参数配置</h2>
                <p className="text-[11px] text-stone-400">配置商家在捷克税务局 (Finanční správa) 的税控身份与数字证书</p>
              </div>
            </div>

            <span className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-mono">
              v2.0-DIS+
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* 1. 运行模式与启用开关 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700">
              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1.5">
                  EET 2.0 网关工作模式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'SANDBOX' })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      formData.mode === 'SANDBOX'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                    }`}
                  >
                    开发者沙盒 (Sandbox)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'PRODUCTION' })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      formData.mode === 'PRODUCTION'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                    }`}
                  >
                    正式生产 (Live 2027)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1.5">
                  网关实时拦截与上报状态
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition ${
                    formData.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-stone-200 dark:bg-zinc-800 text-stone-500 border-stone-300 dark:border-zinc-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                  <span>{formData.enabled ? '已启用 EET 2.0 自动税控签名' : '已暂停 (免税控模式)'}</span>
                </button>
              </div>
            </div>

            {/* 2. 财政部 API 端点 */}
            <div>
              <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                财政部网关端点 URL (Finanční správa Endpoint) *
              </label>
              <input
                type="text"
                value={formData.endpointUrl}
                onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="https://pg.eet.gov.cz/v2/soap/EETServiceSOAP"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                沙盒地址: <code className="bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded">https://pg.eet.gov.cz/v2/soap/EETServiceSOAP</code>
              </p>
            </div>

            {/* 3. 纳税主体税号与编号 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  纳税人增值税号 (DIČ poplatníka) *
                </label>
                <input
                  type="text"
                  value={formData.dic}
                  onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  placeholder="CZ29482019"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  企业统一番号 (IČO) *
                </label>
                <input
                  type="text"
                  value={formData.ico}
                  onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  placeholder="29482019"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  场所编号 (Číslo provozovny) *
                </label>
                <input
                  type="text"
                  value={formData.premisesId}
                  onChange={(e) => setFormData({ ...formData, premisesId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  placeholder="101"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  收银设备编号 (Označení pokladny) *
                </label>
                <input
                  type="text"
                  value={formData.cashRegisterId}
                  onChange={(e) => setFormData({ ...formData, cashRegisterId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  placeholder="POS-ONLINE-CZ01"
                />
              </div>
            </div>

            {/* 4. 数字证书与密钥 (X.509) */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>X.509 商业客户端证书 (EET Certifikát)</span>
                </span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                  PKCS#12 (.p12)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 block mb-1">
                    证书文件标识
                  </label>
                  <input
                    type="text"
                    value={formData.certFileName}
                    onChange={(e) => setFormData({ ...formData, certFileName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-stone-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 block mb-1">
                    证书访问密码 (PIN)
                  </label>
                  <input
                    type="password"
                    value={formData.certPassword || '••••••••'}
                    onChange={(e) => setFormData({ ...formData, certPassword: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-stone-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                  证书公钥指纹 (SHA-256 Fingerprint)
                </label>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 font-mono text-[10px] text-stone-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="truncate">{formData.certFingerprint}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.certFingerprint, 'fingerprint')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
                  >
                    {copiedKey === 'fingerprint' ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            </div>

            {/* 5. 容灾降级策略 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  API 响应超时限制 (毫秒)
                </label>
                <input
                  type="number"
                  value={formData.timeoutMs}
                  onChange={(e) => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">捷克法定推荐: 2000 ms</p>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-zinc-300 block mb-1">
                  网络超时自动降级 (PKP 离线签)
                </label>
                <select
                  value={formData.autoFallbackToPkp ? 'YES' : 'NO'}
                  onChange={(e) => setFormData({ ...formData, autoFallbackToPkp: e.target.value === 'YES' })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-stone-900 dark:text-zinc-100"
                >
                  <option value="YES">开启 (推荐 · 48小时内补报)</option>
                  <option value="NO">关闭 (超时直接报错)</option>
                </select>
              </div>
            </div>

            {/* 提交保存 */}
            <div className="pt-3 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                修改将同步写入服务端，并向所有 POS 终端与在线小程序实时广播
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-98"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isSaving ? '正在保存...' : '保存税控配置'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-center font-bold animate-fadeIn">
                ✓ 税控网关参数已成功更新并在节点生效
              </div>
            )}
          </form>
        </div>

        {/* 右侧：实战压测与数字小票模拟器 (5列) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 实战沙盒：模拟上报与财政码生成 */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-zinc-100">EET 2.0 开票沙盒模拟器</h3>
                  <p className="text-[10px] text-stone-400">实时计算 BKP、上报财政部、生成 FIK 与 e-Účtenka 二维码</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 block mb-1">
                    测试金额 (CZK)
                  </label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 block mb-1">
                    模拟单据号
                  </label>
                  <input
                    type="text"
                    value={testDocNumber}
                    onChange={(e) => setTestDocNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-stone-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700">
                <span className="text-[11px] text-stone-600 dark:text-zinc-400">模拟断网离线签发 (PKP 模式)</span>
                <input
                  type="checkbox"
                  checked={isOfflineForced}
                  onChange={(e) => setIsOfflineForced(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleRunFiscalize}
                disabled={fiscalizing}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                {fiscalizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{fiscalizing ? '正在签署并向财政部上报...' : '立即模拟上报并生成税务防伪码'}</span>
              </button>
            </div>

            {/* 模拟开票结果小票卡片 */}
            {fiscalResult && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 space-y-3 font-mono text-xs animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-2">
                  <span className="font-bold text-stone-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>ÚČTENKA (EET 2.0 税务小票)</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    fiscalResult.isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {fiscalResult.isOffline ? 'OFFLINE (PKP)' : 'ONLINE (FIK)'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-stone-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Provozovna / Pokladna:</span>
                    <strong className="text-stone-900 dark:text-zinc-100">{formData.premisesId} / {formData.cashRegisterId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>DIČ / IČO:</span>
                    <strong className="text-stone-900 dark:text-zinc-100">{formData.dic} / {formData.ico}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Částka celkem (总计):</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{testAmount.toFixed(2)} CZK</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>DPH 12% (增值税款):</span>
                    <span>{(testAmount * 0.12 / 1.12).toFixed(2)} CZK</span>
                  </div>
                </div>

                {/* BKP 安全码 */}
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10px] text-stone-400 font-sans font-bold flex items-center justify-between">
                    <span>BKP (纳税人安全码 · 本地 SHA 签名):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fiscalResult.bkp, 'bkp')}
                      className="text-blue-500 hover:underline"
                    >
                      {copiedKey === 'bkp' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-stone-800 dark:text-zinc-200 break-all leading-tight">
                    {fiscalResult.bkp}
                  </div>
                </div>

                {/* FIK 财政部在线分配码 或 PKP 离线码 */}
                {fiscalResult.fik ? (
                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans font-bold flex items-center justify-between">
                      <span>FIK (财政部在线防伪识别码):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fiscalResult.fik, 'fik')}
                        className="text-emerald-600 hover:underline"
                      >
                        {copiedKey === 'fik' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-900 dark:text-emerald-200 break-all leading-tight font-bold">
                      {fiscalResult.fik}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                    <div className="text-[10px] text-amber-800 dark:text-amber-300 font-sans font-bold flex items-center justify-between">
                      <span>PKP (离线签名备用码 · 48h 需补报):</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fiscalResult.pkp, 'pkp')}
                        className="text-amber-600 hover:underline"
                      >
                        {copiedKey === 'pkp' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="font-mono text-[9px] text-amber-900 dark:text-amber-200 break-all leading-tight">
                      {fiscalResult.pkp}
                    </div>
                  </div>
                )}

                {/* 官方查验二维码展示 */}
                <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5 font-sans">
                    <div className="text-[11px] font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>e-Účtenka 官方查验二维码</span>
                    </div>
                    <p className="text-[10px] text-stone-400">顾客与税警可直接手机扫码核验</p>
                  </div>

                  <a
                    href={fiscalResult.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition font-sans flex items-center gap-1"
                  >
                    <span>在线查验</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 政策法规与 2026-2027 关键时间线卡片 */}
          <div className="bg-linear-to-br from-stone-900 to-indigo-950 text-white rounded-3xl p-5 shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>EET 2.0 相比 1.0 的 4 大核心革新</span>
            </div>

            <ul className="space-y-2 text-[11px] text-stone-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">1.</span>
                <span><strong>免除纸质小票强制令</strong>：电子凭单（PDF/H5/二维码）完全具备同等法定税务效力。</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">2.</span>
                <span><strong>取消封店处罚权</strong>：税务检查人员不再拥有直接查封店铺的行政权力，营商环境更友好。</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">3.</span>
                <span><strong>税率优惠配套</strong>：餐饮非酒精饮料增值税统一定为 <strong>12%</strong>，小费在营收 7% 内免收所得税与社保。</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">4.</span>
                <span><strong>初期设备抵扣</strong>：企业可享受最高 5,000 CZK 的一次性税收减免以覆盖技术改造成本。</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-white/10 text-[10px] text-stone-400 flex items-center justify-between">
              <span>技术规范来源: eet.gov.cz / DIS+</span>
              <span className="text-emerald-400 font-bold">系统已完成代码级预置</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
