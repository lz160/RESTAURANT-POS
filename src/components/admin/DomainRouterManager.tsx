import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Store,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Server,
  ArrowRight,
  Info,
  RefreshCw,
  Sliders,
  Laptop,
  Smartphone,
} from 'lucide-react';

export const DomainRouterManager: React.FC = () => {
  const {
    merchants,
    stores,
    currentStore,
    currentMerchant,
    currentStaffUser,
    setCurrentStore,
    updateMerchantAccount,
    updateStoreEntity,
    t,
  } = useApp();

  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';
  const myMerchant = React.useMemo(() => {
    return (
      merchants.find((m) => m.id === currentStaffUser.merchantId) ||
      currentMerchant ||
      merchants[0]
    );
  }, [merchants, currentStaffUser, currentMerchant]);

  const visibleMerchants = React.useMemo(() => {
    return isSuperAdmin ? merchants : [myMerchant].filter(Boolean);
  }, [isSuperAdmin, merchants, myMerchant]);

  const visibleStores = React.useMemo(() => {
    if (isSuperAdmin) return stores;
    return stores.filter(
      (s) =>
        myMerchant?.assignedStoreIds?.includes(s.id) ||
        s.merchantId === myMerchant?.id ||
        (currentStaffUser.accessibleStoreIds && currentStaffUser.accessibleStoreIds.includes(s.id))
    );
  }, [isSuperAdmin, stores, myMerchant, currentStaffUser]);

  const [testDomainInput, setTestDomainInput] = useState('');
  const [resolveResult, setResolveResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Selected quick tester
  const handleTestDomain = async (domainToTest?: string) => {
    const domain = domainToTest !== undefined ? domainToTest : testDomainInput;
    if (!domain.trim()) return;

    setIsResolving(true);
    try {
      const res = await fetch(`/api/tenant/resolve?host=${encodeURIComponent(domain.trim())}`);
      const data = await res.json();
      setResolveResult(data);
    } catch (err: any) {
      setResolveResult({ error: err.message });
    } finally {
      setIsResolving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-6 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-6">
      {/* 头部说明 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
            <Globe className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">多租户独立域名与子域名路由系统</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                品牌独立白标定制
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              支持为每个合作商家（连锁品牌）及旗下分店绑定独立的公网域名或二级子域名。客户端打开不同域名时，系统自动化解析租户、锁定专属币种（EUR/CZK/HUF/PLN）、菜单与主题。
            </p>
          </div>
        </div>
      </div>

      {/* 域名在线实时模拟解析与测试 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">域名动态路由测试与仿真器</h3>
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">检测当前请求 Host header 的解析归属</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={testDomainInput}
              onChange={(e) => setTestDomainInput(e.target.value)}
              placeholder="输入待测试域名，例如: bts-obchodna.danubefoods.sk 或 order.praguegourmet.cz"
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
              onKeyDown={(e) => e.key === 'Enter' && handleTestDomain()}
            />
          </div>
          <button
            type="button"
            onClick={() => handleTestDomain()}
            disabled={isResolving}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs shadow-2xs active:scale-98 transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
            <span>模拟域名解析</span>
          </button>
        </div>

        {/* 快捷点击测试预设 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold">方案 B 品牌子域名快速测试:</span>
          {['admin.pos.com', 'danube.pos.com', 'sakura.pos.com', 'alps.pos.com', 'oriental.pos.com'].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => {
                setTestDomainInput(sub);
                handleTestDomain(sub);
              }}
              className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold transition flex items-center gap-1 text-amber-900 dark:text-amber-300 shadow-2xs"
            >
              <Globe className="w-3 h-3 text-amber-500" />
              <span>{sub}</span>
            </button>
          ))}
          {(stores || [])
            .filter((s) => s.customDomain)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTestDomainInput(s.customDomain!);
                  handleTestDomain(s.customDomain!);
                }}
                className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-semibold transition flex items-center gap-1 text-zinc-700 dark:text-zinc-300"
              >
                <span>{s.customDomain}</span>
                <span className="text-[9px] px-1 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300">
                  {s.currency}
                </span>
              </button>
            ))}
        </div>

        {/* 解析结果卡片 */}
        {resolveResult && (
          <div
            className={`p-4 rounded-xl border ${
              resolveResult.matched
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
            } transition`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {resolveResult.matched ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {resolveResult.matched
                      ? `解析匹配成功：[${resolveResult.type === 'STORE' ? '门店专属域名' : '商家独立域名'}]`
                      : '未匹配到专属域名 (已回退至平台默认主控上下文)'}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Host: {resolveResult.host}
                  </p>
                </div>
              </div>

              {resolveResult.store && (
                <button
                  type="button"
                  onClick={() => setCurrentStore(resolveResult.store)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold shadow-2xs transition flex items-center gap-1"
                >
                  <span>立即切换至该门店点餐</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {resolveResult.store && (
              <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px]">关联门店名称</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{resolveResult.store.storeName}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px]">结算货币体制</span>
                  <strong className="text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                    {resolveResult.store.currency} ({resolveResult.store.currencySymbol})
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px]">所属集团/商家</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {resolveResult.merchant?.name || resolveResult.store.merchantName || '未分配'}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px]">门店营业状态</span>
                  <strong
                    className={
                      resolveResult.store.status === 'OPEN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                    }
                  >
                    {resolveResult.store.status === 'OPEN' ? '● 正常营业中' : '已打烊'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 域名配置总览矩阵 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 商家企业域名列表 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">商家集团总入口独立域名</h3>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{visibleMerchants.length} 家品牌</span>
            </div>

            <div className="space-y-3">
              {visibleMerchants.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{m.name}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        负责人: {m.contactPerson} · {m.email}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
                      {m.plan}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-750">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-bold">{m.customDomain || '未绑定独立域名'}</span>
                    </div>

                    {m.customDomain && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`https://${m.customDomain}`)}
                          className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold transition flex items-center gap-1"
                        >
                          {copiedDomain === `https://${m.customDomain}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>复制网址</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 各门店点餐专属独立域名列表 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">门店点餐端专属域名列表</h3>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{visibleStores.length} 处分店</span>
            </div>

            <div className="space-y-3">
              {visibleStores.map((s) => {
                const isActive = currentStore.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isActive
                        ? 'bg-zinc-100/70 dark:bg-zinc-850 border-zinc-900 dark:border-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{s.storeName}</h4>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold">
                              当前主控
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{s.address}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold font-mono">
                        {s.currency} ({s.currencySymbol})
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-750">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                        <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold">{s.customDomain || '未设置专属域名'}</span>
                      </div>

                      {s.customDomain && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`https://${s.customDomain}`)}
                            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold transition flex items-center gap-1"
                          >
                            {copiedDomain === `https://${s.customDomain}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>复制</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DNS 域名解析与 Nginx / CDN 接入指引 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:border dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white">生产环境多租户域名 DNS 解析与配置规范</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          在 Cloudflare / 阿里云 / 腾讯云 等 DNS 控制台中，为商家或门店配置 CNAME 指向系统集群网关即可生效：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700 font-mono">
            <span className="text-[10px] text-amber-400 font-bold block mb-1">1. 通配符子域名 (推荐)</span>
            <div className="text-zinc-300 text-[11px]">*.order-app.eu CNAME proxy.seatless.eu</div>
            <p className="text-[10px] text-zinc-400 font-sans mt-1">自动支持所有门店分发二级子域名，无需逐个配置 DNS</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700 font-mono">
            <span className="text-[10px] text-emerald-400 font-bold block mb-1">2. 商家顶级/二级域名</span>
            <div className="text-zinc-300 text-[11px]">order.danubefoods.sk CNAME cname.seatless.eu</div>
            <p className="text-[10px] text-zinc-400 font-sans mt-1">支持商家品牌自有专属顶级域或二级域绑定</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700 font-mono">
            <span className="text-[10px] text-indigo-400 font-bold block mb-1">3. SSL 证书与反向代理</span>
            <div className="text-zinc-300 text-[11px]">Let's Encrypt / SNI Proxy (Port 443/3000)</div>
            <p className="text-[10px] text-zinc-400 font-sans mt-1">Nginx 自动捕获 Host 请求头转发给后端 resolve 中间件</p>
          </div>
        </div>
      </div>
    </div>
  );
};
