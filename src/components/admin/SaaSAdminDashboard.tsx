import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { canAccessView } from '../../utils/rbac';
import { RolePermissionManager } from './RolePermissionManager';
import { MerchantManager } from './MerchantManager';
import { MerchantSalesAnalytics } from '../merchant/MerchantSalesAnalytics';
import { StoreManagerDailyView } from '../manager/StoreManagerDailyView';
import { CollectiveProcurementCollector } from './CollectiveProcurementCollector';
import { DomainRouterManager } from './DomainRouterManager';
import { StripeGatewaySettingsView } from './StripeGatewaySettingsView';
import { EET2FiscalSettingsView } from './EET2FiscalSettingsView';
import {
  Building2,
  FolderTree,
  Package,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Layers,
  Globe,
  Coins,
  Calendar,
  DollarSign,
  UtensilsCrossed,
  ChefHat,
  Network,
  BarChart3,
  Lock,
  ArrowRight,
  CreditCard,
  Scale
} from 'lucide-react';

export type AdminTab =
  | 'FLEET_HUB'           // 商家账户签约与旗下门店
  | 'FLEET_DOMAINS'       // 独立域名与白标
  | 'STAFF_RBAC'          // 全平台员工与RBAC权限中枢 (超管专属，商家不可管)
  | 'PLATFORM_ANALYTICS'  // 平台多商户营收与大盘分析
  | 'STORE_DAILY'         // 门店当日销售与库存 / 集采数据采集中枢
  | 'STRIPE_GATEWAY'      // Stripe 支付网关
  | 'EET2_FISCAL';        // 捷克 EET 2.0 税控

interface SaaSAdminDashboardProps {
  externalActiveTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const SaaSAdminDashboard: React.FC<SaaSAdminDashboardProps> = ({
  externalActiveTab,
  onTabChange,
}) => {
  const {
    stores,
    merchants,
    currentStore,
    currentMerchant,
    products,
    categories,
    orders,
    staffUsers,
    currentStaffUser,
    hasPermission,
    formatPrice,
    t,
    theme,
  } = useApp();

  const isSuperAdmin = currentStaffUser.role === 'SUPER_ADMIN';
  const isMerchant = currentStaffUser.role === 'MERCHANT';
  const isManager = currentStaffUser.role === 'STORE_MANAGER';

  const defaultTab: AdminTab = isSuperAdmin
    ? 'FLEET_HUB'
    : isMerchant
    ? 'PLATFORM_ANALYTICS'
    : 'STORE_DAILY';

  const [internalTab, setInternalTab] = useState<AdminTab>(defaultTab);

  const activeTab = externalActiveTab || internalTab;
  const setActiveTab = (tab: AdminTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Auto reset active tab if current tab is not accessible by this role
  React.useEffect(() => {
    if (!canAccessView(currentStaffUser.role, 'SAAS_ADMIN', activeTab)) {
      if (canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'FLEET_HUB')) {
        setActiveTab('FLEET_HUB');
      } else if (canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'PLATFORM_ANALYTICS')) {
        setActiveTab('PLATFORM_ANALYTICS');
      } else if (canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'STORE_DAILY')) {
        setActiveTab('STORE_DAILY');
      }
    }
  }, [currentStaffUser.role, activeTab]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none">
      {/* Direct Content Render based on selected sidebar item */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* 1. 商家账户签约与套餐 */}
        {activeTab === 'FLEET_HUB' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'FLEET_HUB') && (
          <MerchantManager />
        )}

        {/* 2. 独立域名与白标路由 (超管专属) */}
        {activeTab === 'FLEET_DOMAINS' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'FLEET_DOMAINS') && (
          <DomainRouterManager />
        )}

        {/* 4. Stripe 支付网关调优 */}
        {activeTab === 'STRIPE_GATEWAY' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'STRIPE_GATEWAY') && (
          <StripeGatewaySettingsView />
        )}

        {/* 5. 捷克 EET 2.0 税控合规 */}
        {activeTab === 'EET2_FISCAL' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'EET2_FISCAL') && (
          <EET2FiscalSettingsView />
        )}

        {/* 6. 全平台员工与 RBAC 权限 (超管专属) */}
        {activeTab === 'STAFF_RBAC' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'STAFF_RBAC') && (
          <RolePermissionManager />
        )}

        {/* 7. 平台营收大盘 / 品牌多店分析 */}
        {activeTab === 'PLATFORM_ANALYTICS' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'PLATFORM_ANALYTICS') && (
          <MerchantSalesAnalytics />
        )}

        {/* 9. 门店当日销售与库存台账 / 超管集采数据采集中枢 */}
        {activeTab === 'STORE_DAILY' && canAccessView(currentStaffUser.role, 'SAAS_ADMIN', 'STORE_DAILY') && (
          isSuperAdmin ? <CollectiveProcurementCollector /> : <StoreManagerDailyView />
        )}
      </div>
    </div>
  );
};
