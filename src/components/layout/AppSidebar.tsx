import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { canAccessView, getRoleDefaultView, ROLE_PRESETS } from '../../utils/rbac';
import {
  Building2,
  ChefHat,
  Zap,
  QrCode,
  Smartphone,
  PackageCheck,
  Tv,
  Cpu,
  Store,
  CreditCard,
  Scale,
  ShieldCheck,
  Package,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  UserCheck,
  Sparkles,
  Layers,
  CircleDot,
  Check,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type NavView =
  | 'SAAS_ADMIN'
  | 'MENU_WORKSHOP'
  | 'CUSTOMER_H5'
  | 'COUNTER_SCAN'
  | 'KDS_STATIONS'
  | 'EXPO_PACK'
  | 'CALLING_TV'
  | 'SPLIT_SANDBOX'
  | 'ARCHITECTURE_SPEC';

interface SubNavItem {
  id: NavView;
  tabId?: string;
  subTabId?: string;
  label: string;
  icon?: any;
  badge?: string;
  badgeVariant?: 'amber' | 'emerald' | 'blue' | 'neutral';
  onClick: () => void;
  isActive: boolean;
}

interface NavItem {
  id: NavView;
  tabId?: string;
  subTabId?: string;
  label: string;
  shortLabel: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'amber' | 'emerald' | 'blue' | 'neutral';
  onClick?: () => void;
  isActive: boolean;
  children?: SubNavItem[];
}

interface NavGroup {
  groupKey: string;
  groupLabel: string;
  items: NavItem[];
}

interface AppSidebarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  adminTab?: string;
  setAdminTab?: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onHide?: () => void;
  onOpenCommandPalette: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  setCurrentView,
  adminTab,
  setAdminTab,
  isCollapsed,
  setIsCollapsed,
  onHide,
  onOpenCommandPalette,
}) => {
  const {
    currentStore,
    setCurrentStore,
    stores,
    merchants,
    currentMerchant,
    currentStaffUser,
    loginAsUser,
    logout,
    staffUsers,
    queueSummary,
    theme,
    setTheme,
    audioEnabled,
    setAudioEnabled,
    t,
  } = useApp();

  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [brandFilterQuery, setBrandFilterQuery] = useState('');

  // Collapsible state for items with children (default expanded)
  const [expandedNavKeys, setExpandedNavKeys] = useState<Record<string, boolean>>({
    'SAAS_ADMIN_FLEET_HUB': true,
  });

  const toggleNavExpand = (key: string) => {
    setExpandedNavKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSuperAdmin = currentStaffUser.role === 'SUPER_ADMIN';
  const isMerchant = currentStaffUser.role === 'MERCHANT';
  const isManager = currentStaffUser.role === 'STORE_MANAGER';

  // Group stores by Merchant / Brand
  const merchantAccessibleStores = React.useMemo(() => {
    if (!isMerchant) return stores;
    const m = (currentStaffUser.merchantId ? merchants.find(m => m.id === currentStaffUser.merchantId) : null) || currentMerchant || merchants[0];
    return stores.filter(s =>
      m?.assignedStoreIds?.includes(s.id) ||
      s.merchantId === m?.id ||
      (currentStaffUser.accessibleStoreIds && currentStaffUser.accessibleStoreIds.includes(s.id))
    );
  }, [isMerchant, currentStaffUser, currentMerchant, merchants, stores]);

  const groupedStores = React.useMemo(() => {
    // If merchant, strictly only show their own stores and brand
    if (isMerchant) {
      const m = (currentStaffUser.merchantId ? merchants.find(m => m.id === currentStaffUser.merchantId) : null) || currentMerchant || merchants[0];
      return [{
        brandId: m?.id || 'm_current',
        brandName: m?.name || '旗下连锁门店',
        subdomain: m?.subdomain || 'danube.pos.com',
        brandCode: m?.brandCode || 'danube',
        stores: merchantAccessibleStores,
      }];
    }

    // For Super Admin or other roles, group all stores by merchant
    const groups: {
      brandId: string;
      brandName: string;
      subdomain: string;
      brandCode: string;
      stores: typeof stores;
    }[] = [];

    merchants.forEach(m => {
      const mStores = stores.filter(s => m.assignedStoreIds?.includes(s.id) || s.merchantId === m.id);
      if (mStores.length > 0) {
        groups.push({
          brandId: m.id,
          brandName: m.name,
          subdomain: m.subdomain || `${m.brandCode}.pos.com`,
          brandCode: m.brandCode || 'brand',
          stores: mStores,
        });
      }
    });

    // Unassigned stores if any
    const assignedIds = new Set(groups.flatMap(g => g.stores.map(s => s.id)));
    const unassigned = stores.filter(s => !assignedIds.has(s.id));
    if (unassigned.length > 0) {
      groups.push({
        brandId: 'unassigned',
        brandName: '独立自营实体',
        subdomain: 'pos.com',
        brandCode: 'self',
        stores: unassigned,
      });
    }

    return groups;
  }, [stores, merchants, isMerchant, currentMerchant, currentStaffUser, merchantAccessibleStores]);

  // Find brand for current store
  const currentStoreBrand = React.useMemo(() => {
    return merchants.find(m => m.assignedStoreIds?.includes(currentStore.id) || m.id === currentStore.merchantId) || merchants[0];
  }, [merchants, currentStore]);

  // Navigation Items Grouping (shadcn-admin style with collapsible tree)
  const rawNavGroups: NavGroup[] = [
    {
      groupKey: 'ADMIN_GROUP',
      groupLabel: '管理中台 (ADMIN & FLEET)',
      items: [
        {
          id: 'SAAS_ADMIN' as NavView,
          tabId: 'FLEET_HUB',
          label: isSuperAdmin ? '多店舰队与管理' : '旗下商铺管理',
          shortLabel: isSuperAdmin ? '多店舰队' : '商铺管理',
          icon: isSuperAdmin ? Building2 : Store,
          badge: isSuperAdmin ? `${stores.length} 店` : `${merchantAccessibleStores.length} 店`,
          badgeVariant: 'amber',
          onClick: () => {
            setCurrentView('SAAS_ADMIN');
            if (setAdminTab) setAdminTab('FLEET_HUB');
          },
          isActive:
            currentView === 'SAAS_ADMIN' &&
            (isSuperAdmin
              ? !adminTab || adminTab === 'FLEET_HUB' || adminTab === 'FLEET_DOMAINS' || adminTab === 'STRIPE_GATEWAY' || adminTab === 'EET2_FISCAL'
              : !adminTab || adminTab === 'FLEET_HUB'),
          children: isSuperAdmin
            ? [
                {
                  id: 'SAAS_ADMIN' as NavView,
                  tabId: 'FLEET_HUB',
                  label: '商家账户签约',
                  icon: Building2,
                  badge: `${merchants.length} 家`,
                  badgeVariant: 'neutral',
                  onClick: () => {
                    setCurrentView('SAAS_ADMIN');
                    if (setAdminTab) setAdminTab('FLEET_HUB');
                  },
                  isActive: currentView === 'SAAS_ADMIN' && (!adminTab || adminTab === 'FLEET_HUB'),
                },
                {
                  id: 'SAAS_ADMIN' as NavView,
                  tabId: 'FLEET_DOMAINS',
                  label: '独立域名与白标',
                  icon: Globe,
                  onClick: () => {
                    setCurrentView('SAAS_ADMIN');
                    if (setAdminTab) setAdminTab('FLEET_DOMAINS');
                  },
                  isActive: currentView === 'SAAS_ADMIN' && adminTab === 'FLEET_DOMAINS',
                },
                {
                  id: 'SAAS_ADMIN' as NavView,
                  tabId: 'STRIPE_GATEWAY',
                  label: 'Stripe 支付网关',
                  icon: CreditCard,
                  badge: currentStore.stripeConfig?.enabled ? '已开' : '沙盒',
                  badgeVariant: currentStore.stripeConfig?.enabled ? 'emerald' : 'neutral',
                  onClick: () => {
                    setCurrentView('SAAS_ADMIN');
                    if (setAdminTab) setAdminTab('STRIPE_GATEWAY');
                  },
                  isActive: currentView === 'SAAS_ADMIN' && adminTab === 'STRIPE_GATEWAY',
                },
                {
                  id: 'SAAS_ADMIN' as NavView,
                  tabId: 'EET2_FISCAL',
                  label: '捷克 EET 2.0 税控',
                  icon: Scale,
                  badge: currentStore.eet2Config?.enabled ? '2027' : '未开',
                  badgeVariant: currentStore.eet2Config?.enabled ? 'blue' : 'neutral',
                  onClick: () => {
                    setCurrentView('SAAS_ADMIN');
                    if (setAdminTab) setAdminTab('EET2_FISCAL');
                  },
                  isActive: currentView === 'SAAS_ADMIN' && adminTab === 'EET2_FISCAL',
                },
              ]
            : undefined,
        },
        ...(!isSuperAdmin
          ? [
              {
                id: 'MENU_WORKSHOP' as NavView,
                label: '菜品与配方工坊',
                shortLabel: '配方工坊',
                icon: ChefHat,
                badge: 'BOM',
                onClick: () => setCurrentView('MENU_WORKSHOP'),
                isActive: currentView === 'MENU_WORKSHOP',
              },
            ]
          : []),
        {
          id: 'SAAS_ADMIN' as NavView,
          tabId: 'PLATFORM_ANALYTICS',
          label: isSuperAdmin ? '多商户营收大盘' : '品牌多店营收分析',
          shortLabel: '营收大盘',
          icon: BarChart3,
          onClick: () => {
            setCurrentView('SAAS_ADMIN');
            if (setAdminTab) setAdminTab('PLATFORM_ANALYTICS');
          },
          isActive: currentView === 'SAAS_ADMIN' && adminTab === 'PLATFORM_ANALYTICS',
        },
        {
          id: 'SAAS_ADMIN' as NavView,
          tabId: 'STORE_DAILY',
          label: isSuperAdmin ? '食材消耗与采购价 (集采数据采集)' : isManager ? '店长工作台 (台账/库存)' : '门店食材库存台账',
          shortLabel: isSuperAdmin ? '集采数据采集' : '库存台账',
          icon: isSuperAdmin ? PackageCheck : Package,
          badge: isSuperAdmin ? '集采预留' : undefined,
          badgeVariant: 'amber',
          onClick: () => {
            setCurrentView('SAAS_ADMIN');
            if (setAdminTab) setAdminTab('STORE_DAILY');
          },
          isActive: currentView === 'SAAS_ADMIN' && adminTab === 'STORE_DAILY',
        },
        {
          id: 'SAAS_ADMIN' as NavView,
          tabId: 'STAFF_RBAC',
          label: isSuperAdmin ? '全平台员工与 RBAC 权限' : '企业员工与 RBAC 权限',
          shortLabel: '员工权限',
          icon: ShieldCheck,
          onClick: () => {
            setCurrentView('SAAS_ADMIN');
            if (setAdminTab) setAdminTab('STAFF_RBAC');
          },
          isActive: currentView === 'SAAS_ADMIN' && adminTab === 'STAFF_RBAC',
        },
        ...(isSuperAdmin
          ? [
              {
                id: 'ARCHITECTURE_SPEC' as NavView,
                label: '系统架构规范与 API',
                shortLabel: '架构规范',
                icon: Cpu,
                onClick: () => setCurrentView('ARCHITECTURE_SPEC'),
                isActive: currentView === 'ARCHITECTURE_SPEC',
              },
            ]
          : []),
      ],
    },
    // Note: If user is Super Admin or Merchant, "门店终端" is completely removed per user requirements
    ...(!isSuperAdmin && !isMerchant
      ? [
          {
            groupKey: 'TERMINAL_GROUP',
            groupLabel: '门店终端 (POS & OPERATIONS)',
            items: [
              {
                id: 'COUNTER_SCAN' as NavView,
                label: '柜台收银终端',
                shortLabel: '收银 POS',
                icon: QrCode,
                badge: 'POS',
                onClick: () => setCurrentView('COUNTER_SCAN'),
                isActive: currentView === 'COUNTER_SCAN',
              },
              {
                id: 'CUSTOMER_H5' as NavView,
                label: '顾客扫码点餐 H5',
                shortLabel: '扫码点餐',
                icon: Smartphone,
                onClick: () => setCurrentView('CUSTOMER_H5'),
                isActive: currentView === 'CUSTOMER_H5',
              },
              {
                id: 'KDS_STATIONS' as NavView,
                label: '后厨出餐工位 KDS',
                shortLabel: '后厨 KDS',
                icon: ChefHat,
                badge: queueSummary.waitingCups > 0 ? `${queueSummary.waitingCups} 单` : 'Live',
                badgeVariant: queueSummary.waitingCups > 0 ? ('amber' as const) : ('neutral' as const),
                onClick: () => setCurrentView('KDS_STATIONS'),
                isActive: currentView === 'KDS_STATIONS',
              },
              {
                id: 'EXPO_PACK' as NavView,
                label: '打包与叫号总控',
                shortLabel: '打包叫号',
                icon: PackageCheck,
                onClick: () => setCurrentView('EXPO_PACK'),
                isActive: currentView === 'EXPO_PACK',
              },
              {
                id: 'CALLING_TV' as NavView,
                label: '取餐大屏电视',
                shortLabel: '取餐电视',
                icon: Tv,
                onClick: () => setCurrentView('CALLING_TV'),
                isActive: currentView === 'CALLING_TV',
              },
              {
                id: 'SPLIT_SANDBOX' as NavView,
                label: '多端分屏协同沙盒',
                shortLabel: '分屏沙盒',
                icon: Zap,
                badge: '3合1',
                onClick: () => setCurrentView('SPLIT_SANDBOX'),
                isActive: currentView === 'SPLIT_SANDBOX',
              },
            ],
          },
        ]
      : []),
  ];

  // RBAC Filter: Only show groups and items that the current staff user is authorized to access
  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canAccessView(currentStaffUser.role, item.id, item.tabId))
        .map((item) => {
          const filteredChildren = item.children?.filter((child) =>
            canAccessView(currentStaffUser.role, child.id, child.tabId)
          );
          return {
            ...item,
            children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined,
          };
        }),
    }))
    .filter((group) => group.items.length > 0);

  const currentRolePreset =
    ROLE_PRESETS.find((r) => r.role === currentStaffUser.role) || ROLE_PRESETS[0];

  return (
    <aside
      className={`relative h-full flex flex-col shrink-0 border-r transition-all duration-300 z-30 select-none bg-zinc-50/70 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 2. Scrollable Navigation List (shadcn collapsible menu) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupKey} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                <span>{group.groupLabel}</span>
                <span className="text-[9px] font-mono text-zinc-400">({group.items.length})</span>
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const active = item.isActive;
                const hasChildren = !!(item.children && item.children.length > 0);
                const itemKey = `${item.id}_${item.tabId || 'main'}`;
                const isExpanded = !!expandedNavKeys[itemKey];

                return (
                  <div key={itemIdx} className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          if (hasChildren && !isCollapsed) {
                            toggleNavExpand(itemKey);
                          }
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                          active && !hasChildren
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs'
                            : active && hasChildren
                            ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-semibold border border-zinc-200/70 dark:border-zinc-800'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                        } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-500' : 'text-zinc-500'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 font-mono ${
                                  item.badgeVariant === 'amber'
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                    : item.badgeVariant === 'emerald'
                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                                    : item.badgeVariant === 'blue'
                                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}

                            {hasChildren && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNavExpand(itemKey);
                                }}
                                className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Render Collapsible Sub-items (Tree Menu) */}
                    {hasChildren && !isCollapsed && isExpanded && (
                      <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-zinc-200 dark:border-zinc-800 ml-4.5 my-1">
                        {item.children!.map((child, cIdx) => {
                          const ChildIcon = child.icon || CircleDot;
                          const isChildActive = child.isActive;
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={child.onClick}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${
                                isChildActive
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? 'text-inherit' : 'text-zinc-400'}`} />
                                <span className="truncate">{child.label}</span>
                              </div>

                              {child.badge && (
                                <span
                                  className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                    isChildActive
                                      ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900'
                                      : child.badgeVariant === 'emerald'
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : child.badgeVariant === 'blue'
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer Section - Removed per user request (备注：已隐藏/删除底部 dev & 退出快捷工具栏，切换账号与退出在顶部 Header 进行) */}
    </aside>
  );
};

