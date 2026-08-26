import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavView } from './AppSidebar';
import { ROLE_PRESETS } from '../../utils/rbac';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';
import {
  Search,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  LogOut,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

interface AppHeaderProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  adminTab?: string;
  onOpenCommandPalette: () => void;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  adminTab,
  onOpenCommandPalette,
  isSidebarHidden = false,
  onToggleSidebar,
}) => {
  const {
    currentStaffUser,
    logout,
    theme,
    setTheme,
    currentLang,
    setCurrentLang,
    audioEnabled,
    setAudioEnabled,
    wsConnected,
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  const currentRolePreset =
    ROLE_PRESETS.find((r) => r.role === currentStaffUser.role) || ROLE_PRESETS[0];

  // Breadcrumb mapping
  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'SAAS_ADMIN':
        if (adminTab === 'STAFF_RBAC') return '账户与 RBAC 权限';
        if (adminTab === 'PLATFORM_ANALYTICS') return '多商户大盘营收';
        if (adminTab === 'STRIPE_GATEWAY') return 'Stripe 支付网关';
        if (adminTab === 'EET2_FISCAL') return '捷克 EET 2.0 税控网关';
        if (adminTab === 'FLEET_DOMAINS') return '独立域名与白标路由';
        if (adminTab === 'STORE_DAILY') return '门店食材库存台账';
        return '商家账户签约与套餐';
      case 'MENU_WORKSHOP':
        return '菜品与配方工坊 (BOM)';
      case 'COUNTER_SCAN':
        return '柜台收银终端 (POS)';
      case 'CUSTOMER_H5':
        return '顾客扫码点餐 (H5)';
      case 'KDS_STATIONS':
        return '后厨出餐看板 (KDS)';
      case 'EXPO_PACK':
        return '打包与叫号总控 (Expo)';
      case 'CALLING_TV':
        return '取餐电视大屏 (Calling TV)';
      case 'SPLIT_SANDBOX':
        return '多端分屏协同沙盒';
      case 'ARCHITECTURE_SPEC':
        return '系统架构规范与 API';
      default:
        return '总览';
    }
  };

  return (
    <header className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* 1. Left: Primary Page Title & Sidebar Toggle Button */}
      <div className="flex items-center gap-2.5">
        <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          {getBreadcrumbTitle()}
        </h1>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-xs font-medium transition shadow-2xs active:scale-95"
            title={isSidebarHidden ? '展开/显示侧边栏 (⌘B)' : '收起/隐藏侧边栏 (⌘B)'}
          >
            {isSidebarHidden ? (
              <PanelLeft className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <PanelLeftClose className="w-4 h-4 shrink-0" />
            )}
            <span className="text-[11px] font-medium hidden sm:inline">
              {isSidebarHidden ? '显示侧栏' : '隐藏侧栏'}
            </span>
          </button>
        )}
      </div>

      {/* 2. Center: Quick Command Palette Trigger Button (shadcn-admin search bar) */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
            <span className="truncate">搜索功能、欧洲门店、税控或快捷指令...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-500 bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 shadow-2xs">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Quick Actions & Status */}
      <div className="flex items-center gap-2">
        {/* Real-time WebSocket connection status */}
        <div
          className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition ${
            wsConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
          title={wsConnected ? 'WebSocket 实时同步已在线' : 'WebSocket 正在重连'}
        >
          {wsConnected ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-amber-500" />}
          <span>{wsConnected ? '实时同步' : '离线容灾'}</span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition shadow-2xs"
          title={audioEnabled ? '静音语音播报' : '开启出餐与排队播报'}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400" />}
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition shadow-2xs"
          >
            <span>{activeLangObj.flag}</span>
            <span className="hidden md:inline text-[11px]">{activeLangObj.code.toUpperCase()}</span>
          </button>

          {isLangOpen && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 mb-1">
                多语言国际化 (i18n)
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setCurrentLang(l.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                      currentLang === l.code
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </div>
                    <span className="text-[10px] opacity-60 font-mono">{l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition shadow-2xs"
          title={theme === 'light' ? '切换为暗色模式' : '切换为亮色模式'}
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-zinc-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {/* Current User Role Pill & Logout */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{currentStaffUser.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              {currentRolePreset.roleName}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            title="退出当前账号并返回登录界面"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">退出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
