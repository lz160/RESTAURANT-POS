import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { canAccessView, getRoleDefaultView } from '../../utils/rbac';
import {
  Search,
  Building2,
  ChefHat,
  Zap,
  QrCode,
  Smartphone,
  PackageCheck,
  Tv,
  Cpu,
  Store,
  UserCheck,
  CreditCard,
  Scale,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Sparkles,
  Package,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: any) => void;
  onSelectTab?: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onSelectTab,
}) => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    staffUsers,
    currentStaffUser,
    loginAsUser,
    theme,
    setTheme,
    audioEnabled,
    setAudioEnabled,
  } = useApp();

  const [query, setQuery] = useState('');

  // Global key listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawViews = [
    { id: 'SAAS_ADMIN', label: 'SaaS 管理中台 (Fleet & Admin)', icon: Building2, category: '核心视图' },
    { id: 'MENU_WORKSHOP', label: '菜品与配方工坊 (BOM & Menu)', icon: ChefHat, category: '核心视图' },
    { id: 'SPLIT_SANDBOX', label: '多端协同分屏沙盒 (Split Sandbox)', icon: Zap, category: '核心视图' },
    { id: 'COUNTER_SCAN', label: '柜台收银终端 (Counter POS)', icon: QrCode, category: '终端应用' },
    { id: 'CUSTOMER_H5', label: '顾客移动端扫码点餐 (Customer H5)', icon: Smartphone, category: '终端应用' },
    { id: 'KDS_STATIONS', label: '后厨出餐工位看板 (KDS Stations)', icon: ChefHat, category: '终端应用' },
    { id: 'EXPO_PACK', label: '打包与叫号总控 (Expo Pack)', icon: PackageCheck, category: '终端应用' },
    { id: 'CALLING_TV', label: '取餐大屏电视 (Calling TV Screen)', icon: Tv, category: '终端应用' },
    { id: 'ARCHITECTURE_SPEC', label: '系统架构规范与 API 文档 (Architecture)', icon: Cpu, category: '开发文档' },
  ];

  const rawAdminTabs = [
    { id: 'FLEET_HUB', label: '商家/门店/域名中枢 (Fleet Hub)', icon: Store, view: 'SAAS_ADMIN' },
    { id: 'STORE_DAILY', label: '店长工作台与食材库存台账', icon: Package, view: 'SAAS_ADMIN' },
    { id: 'STAFF_RBAC', label: '账户创建与 RBAC 权限中枢', icon: UserCheck, view: 'SAAS_ADMIN' },
    { id: 'PLATFORM_ANALYTICS', label: '多商户多店营收大盘分析', icon: Building2, view: 'SAAS_ADMIN' },
    { id: 'STRIPE_GATEWAY', label: 'Stripe 支付网关配置与沙盒', icon: CreditCard, view: 'SAAS_ADMIN' },
    { id: 'EET2_FISCAL', label: '捷克国家财政部 EET 2.0 税控网关', icon: Scale, view: 'SAAS_ADMIN' },
  ];

  const views = rawViews.filter((v) => canAccessView(currentStaffUser.role, v.id as any));
  const adminTabs = rawAdminTabs.filter((t) => canAccessView(currentStaffUser.role, 'SAAS_ADMIN', t.id));

  const filteredViews = views.filter((v) =>
    v.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredStores = stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(query.toLowerCase()) ||
      s.currency.toLowerCase().includes(query.toLowerCase()) ||
      s.address.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRoles = staffUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索页面、门店实体、测试角色或快捷操作... (输入关键词)"
            className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-200/80 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {/* Quick Views */}
          {filteredViews.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                系统应用与视图
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredViews.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectView(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 group transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-amber-500 group-hover:text-stone-950 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 font-mono flex items-center gap-1">
                        跳转 <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Fast Tabs */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              SaaS 管理中台快捷功能
            </div>
            <div className="space-y-0.5 mt-1">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectView('SAAS_ADMIN');
                      if (onSelectTab) onSelectTab(tab.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 group transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{tab.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">管理面板</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Store Switcher */}
          {filteredStores.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                切换欧洲多国门店实体
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentStore(s);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                      currentStore.id === s.id
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-zinc-400" />
                      <div>
                        <span className="font-semibold">{s.storeName}</span>
                        <span className="ml-2 text-[10px] text-zinc-400">{s.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {s.currency} ({s.currencySymbol})
                      </span>
                      {currentStore.id === s.id && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-bold">
                          当前
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Switch Staff Role */}
          {filteredRoles.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                模拟切换测试员工与 RBAC 角色
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                {filteredRoles.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      loginAsUser(u);
                      onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                      currentStaffUser.id === u.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 opacity-60" />
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700 font-mono">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Global Toggles */}
          <div className="pt-2 pb-1">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              快捷偏好设置
            </div>
            <div className="flex items-center gap-2 px-3 py-1">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>切换至 {theme === 'light' ? '暗色模式 (Dark)' : '亮色模式 (Light)'}</span>
              </button>

              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400" />}
                <span>音效出餐播报: {audioEnabled ? '已开启' : '已静音'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Shadcn 风格极速指令中枢 · 支持中英双语与快捷直达</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px]">
            <span>↑↓ 导航</span>
            <span>↵ 确认</span>
            <span>ESC 关闭</span>
          </div>
        </div>
      </div>
    </div>
  );
};
