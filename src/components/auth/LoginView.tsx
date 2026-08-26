import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffUser } from '../../types';
import {
  Lock,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChefHat,
  Tv,
  Store,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Check,
  Eye,
  EyeOff,
  Layers,
  ChevronRight,
  Search,
  ExternalLink,
  Flame,
  Coffee,
  Leaf,
  CupSoda,
  UtensilsCrossed,
  ShieldAlert,
  Sliders,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    login,
    loginAsUser,
    staffUsers,
    stores,
    merchants,
    currentSubdomain,
    switchSubdomain,
    brandSubdomains,
    theme,
    setTheme,
  } = useApp();

  const [username, setUsername] = useState('manager_pierre');
  const [pinCode, setPinCode] = useState('1111');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'MANUAL'>('PRESETS');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [showBrandDirectoryModal, setShowBrandDirectoryModal] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Find active tenant info based on currentSubdomain
  const activeTenant = useMemo(() => {
    const clean = currentSubdomain.toLowerCase().trim();
    if (clean.startsWith('admin') || clean === 'admin.pos.com') {
      return {
        brandCode: 'admin',
        name: 'SaaS 平台超级运营中枢',
        subdomain: 'admin.pos.com',
        tagline: '全平台跨商户·跨国门店舰队与系统调度中心',
        logoIcon: 'Building2',
        themeColor: 'zinc',
        isSuperAdmin: true,
        merchant: null,
        stores: stores,
      };
    }

    const matched = merchants.find(
      m =>
        m.subdomain?.toLowerCase() === clean ||
        `${m.brandCode?.toLowerCase()}.pos.com` === clean ||
        m.brandCode?.toLowerCase() === clean ||
        m.customDomain?.toLowerCase() === clean
    );

    if (matched) {
      const brandStores = stores.filter(
        s => matched.assignedStoreIds?.includes(s.id) || s.merchantId === matched.id
      );
      return {
        brandCode: matched.brandCode,
        name: matched.name,
        subdomain: matched.subdomain || `${matched.brandCode}.pos.com`,
        tagline: matched.tagline || matched.notes || '欧洲连锁餐饮数字化运营中台',
        logoIcon: matched.logoIcon || 'Store',
        themeColor: matched.themeColor || 'amber',
        isSuperAdmin: false,
        merchant: matched,
        stores: brandStores,
      };
    }

    // Default fallback to first merchant
    const firstM = merchants[0];
    return {
      brandCode: firstM?.brandCode || 'danube',
      name: firstM?.name || '多瑙茶饮与快餐连锁',
      subdomain: firstM?.subdomain || 'danube.pos.com',
      tagline: firstM?.tagline || '欧洲跨国精品鲜奶茶与手工汉堡连锁',
      logoIcon: firstM?.logoIcon || 'CupSoda',
      themeColor: firstM?.themeColor || 'amber',
      isSuperAdmin: false,
      merchant: firstM,
      stores: stores.filter(s => firstM?.assignedStoreIds?.includes(s.id)),
    };
  }, [currentSubdomain, merchants, stores]);

  // Filter staff users that belong to this brand/tenant OR Super Admin (who can access all)
  const tenantStaffUsers = useMemo(() => {
    if (activeTenant.isSuperAdmin) {
      return staffUsers.filter(u => u.role === 'SUPER_ADMIN');
    }
    return staffUsers.filter(
      u =>
        u.brandCode === activeTenant.brandCode ||
        u.merchantId === activeTenant.merchant?.id ||
        u.subdomain === activeTenant.subdomain
    );
  }, [activeTenant, staffUsers]);

  // Handle manual username/pin submission
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, pinCode);
      if (!res.success) {
        setErrorMessage(res.message || '登录验证失败，请检查账号与密码');
        setIsLoading(false);
      }
    }, 200);
  };

  const handlePresetClick = (user: StaffUser) => {
    loginAsUser(user);
  };

  const handleFillForm = (user: StaffUser) => {
    setUsername(user.username);
    setPinCode(user.pinCode);
    setActiveTab('MANUAL');
    setErrorMessage(null);
  };

  const handleCustomDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDomainInput.trim()) {
      switchSubdomain(customDomainInput.trim());
      setCustomDomainInput('');
      setErrorMessage(null);
    }
  };

  const getBrandIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Leaf':
        return <Leaf className="w-5 h-5 text-indigo-500" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />;
      case 'CupSoda':
      default:
        return <CupSoda className="w-5 h-5 text-amber-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: '平台超级管理员', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
      case 'MERCHANT':
        return { label: '连锁品牌主', bg: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
      case 'STORE_MANAGER':
        return { label: '门店店长', bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 'CHEF':
        return { label: '后厨主厨', bg: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800' };
      case 'CASHIER':
        return { label: '前台收银', bg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
      case 'EXPO_PACKER':
        return { label: '打包叫号', bg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700' };
      default:
        return { label: '员工', bg: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
    }
  };

  // Filtered staff list by role tabs
  const filteredTenantStaff = tenantStaffUsers.filter(u => {
    if (selectedRoleFilter === 'ALL') return true;
    if (selectedRoleFilter === 'ADMIN') return u.role === 'SUPER_ADMIN' || u.role === 'MERCHANT';
    if (selectedRoleFilter === 'STORE') return u.role === 'STORE_MANAGER' || u.role === 'CASHIER';
    if (selectedRoleFilter === 'KITCHEN') return u.role === 'CHEF' || u.role === 'EXPO_PACKER';
    return true;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none transition-colors duration-200">
      {/* 1. Plan B Virtual Browser Subdomain Address Bar */}
      <div className="bg-zinc-900 text-zinc-300 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-b border-zinc-800 shadow-sm z-20">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[11px] shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">https://</span>
            <span className="font-bold text-amber-300">{activeTenant.subdomain}</span>
            <span className="text-zinc-500">/login</span>
            <Lock className="w-3 h-3 text-emerald-400 ml-1" />
          </div>
          <span className="hidden md:inline-block text-[11px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50">
            方案 B：多连锁独立二级子域名隔离
          </span>
        </div>

        {/* Quick Brand Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-0.5">
          <span className="text-zinc-400 text-[11px] shrink-0 mr-1 hidden lg:inline">切换访问域名:</span>
          {brandSubdomains.map(b => {
            const isActive = activeTenant.brandCode === b.brandCode;
            return (
              <button
                key={b.brandCode}
                onClick={() => {
                  switchSubdomain(b.subdomain);
                  setErrorMessage(null);
                }}
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-xs'
                    : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                }`}
                title={`访问 ${b.subdomain} (${b.name})`}
              >
                <span>{b.subdomain}</span>
                {isActive && <Check className="w-3 h-3" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowBrandDirectoryModal(true)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 text-xs shrink-0 transition"
            title="查看全部连锁品牌或输入自定义域名"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Brand Header */}
      <header className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-black text-base shadow-sm">
            {getBrandIcon(activeTenant.logoIcon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                {activeTenant.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {activeTenant.subdomain}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-md">
              {activeTenant.tagline}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBrandDirectoryModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>品牌租户黄页</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition shadow-2xs"
            title={theme === 'light' ? '切换为暗色模式' : '切换为亮色模式'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-zinc-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* 3. Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-6">
        {/* Banner Explaining Plan B */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  当前租户环境：{activeTenant.name} ({activeTenant.subdomain})
                </h2>
                <span className="text-[10px] px-2 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold border border-zinc-200 dark:border-zinc-700">
                  {activeTenant.stores.length} 家门店实体 · {tenantStaffUsers.length} 位员工
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                采用方案 B（二级子域名架构），员工访问对应品牌域名登录时<strong>无需重复输入品牌代码</strong>，会话 Cookie 与本地存储严格隔离，数据完全归属各品牌名下。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-400">切换其他连锁：</span>
            <div className="flex items-center gap-1">
              {brandSubdomains.map(b => (
                <button
                  key={b.brandCode}
                  onClick={() => switchSubdomain(b.subdomain)}
                  className={`text-[11px] px-2 py-1 rounded-md border font-mono transition ${
                    activeTenant.brandCode === b.brandCode
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold border-zinc-900 dark:border-white'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {b.brandCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Column Layout: Left Login Form, Right Preset Role Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Domain-Scoped Login Form (4 cols on lg) */}
          <div className="lg:col-span-5 w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Form Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {activeTenant.isSuperAdmin ? 'SaaS 平台超管认证' : `${activeTenant.name} 登录`}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {activeTenant.subdomain}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                员工身份登录
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                请输入您的账号与 4 位数快捷安全 PIN 码
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Tab switch */}
            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('PRESETS')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  activeTab === 'PRESETS'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                快速演示身份 ({tenantStaffUsers.length}位)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MANUAL')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  activeTab === 'MANUAL'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                手动表单输入
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  用户名 (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setErrorMessage(null);
                    }}
                    required
                    placeholder="输入用户名，例如 manager_pierre"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* PIN Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    PIN 码 / 密码 (PIN Code)
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    通用测试密码: <code className="font-mono font-bold text-amber-600 dark:text-amber-400">8888</code>
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinCode}
                    onChange={e => {
                      setPinCode(e.target.value);
                      setErrorMessage(null);
                    }}
                    required
                    maxLength={10}
                    placeholder="输入 4 位数 PIN 码"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>登录进入 {activeTenant.name}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Legal Entity & Store Info Box */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center justify-between">
                <span>法定注册主体:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[200px]">
                  {activeTenant.merchant?.legalCompanyName || 'Danube Hospitality Europe s.r.o.'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>直属连锁分店:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  {activeTenant.stores.map(s => s.storeName.split('(')[0].trim()).join(' · ') || '全欧洲门店'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>支持结算货币:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 font-mono">
                  {Array.from(new Set(activeTenant.stores.map(s => s.currency))).join(' / ') || 'EUR'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Tenant-Scoped Role Preset Matrix (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header with Filter */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    当前租户预置账号矩阵 ({tenantStaffUsers.length} 位)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                    点击一键免密试用
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  已根据 <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300">{activeTenant.subdomain}</span> 自动隔离筛选
                </p>
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedRoleFilter === 'ALL'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  全部
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ADMIN')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedRoleFilter === 'ADMIN'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  管理层
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('STORE')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedRoleFilter === 'STORE'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  门店与收银
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('KITCHEN')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedRoleFilter === 'KITCHEN'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  后厨与打包
                </button>
              </div>
            </div>

            {/* List of Staff Accounts for this Tenant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredTenantStaff.map(user => {
                const badge = getRoleBadge(user.role);
                const assignedStore = stores.find(s => s.id === user.storeId);

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 transition shadow-2xs flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      {/* Top row: Avatar + Name + Role Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                              {user.name}
                            </h4>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              @{user.username}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Store & PIN Info */}
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 bg-zinc-50 dark:bg-zinc-850/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span>所属门店:</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                            {user.role === 'MERCHANT'
                              ? `全连锁 (${user.accessibleStoreIds?.length || 3} 家分店)`
                              : assignedStore?.storeName.split('(')[0] || '默认门店'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>登录 PIN 码:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {user.pinCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePresetClick(user)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>以此身份快速登录</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillForm(user)}
                        className="py-2 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition"
                        title="将账号和密码填入左侧表单"
                      >
                        填入
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Brand Directory & Subdomain Lookup Modal */}
      {showBrandDirectoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    多连锁品牌二级子域名目录 (Plan B Directory)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    每个连锁品牌拥有独立子域名与白标环境，点击即可跳转至对应品牌专属登录页
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandDirectoryModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Custom Subdomain Input */}
            <form onSubmit={handleCustomDomainSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                输入指定二级域名或品牌代码 (Direct Subdomain Jump)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={e => setCustomDomainInput(e.target.value)}
                    placeholder="输入如 sakura.pos.com 或 alps 或 admin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-2xs shrink-0"
                >
                  解析并跳转
                </button>
              </div>
            </form>

            {/* Brand Directory Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                全平台签约连锁品牌矩阵：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {brandSubdomains.map(b => {
                  const isActive = activeTenant.brandCode === b.brandCode;
                  return (
                    <div
                      key={b.brandCode}
                      onClick={() => {
                        switchSubdomain(b.subdomain);
                        setShowBrandDirectoryModal(false);
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        isActive
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-850/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        {getBrandIcon(b.logoIcon)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {b.name}
                          </h4>
                          {isActive && <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                          https://{b.subdomain}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {b.tagline}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-0.5">
                          <span>{b.storeCount} 家门店</span>
                          <span>·</span>
                          <span>{b.staffCount} 位已建员工</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBrandDirectoryModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
