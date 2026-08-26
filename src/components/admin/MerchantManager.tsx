import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MerchantAccount, StoreEntity, getSaaSPlanInfo, SAAS_PLANS, SaaSPlanType } from '../../types';
import { StoreEditView } from './StoreEditView';
import { MerchantContractEditView } from './MerchantContractEditView';
import { SUPPORTED_CURRENCIES } from '../../data/currencies';
import {
  Building2,
  Store,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  X,
  ArrowLeft,
  ShieldCheck,
  Scale,
  MapPin,
  Mail,
  Phone,
  Power,
  Lock,
  Globe,
  Settings2,
  CreditCard,
  FileCheck2,
  Layers,
  ChevronRight,
  Sparkles,
  Link,
  Unlink,
  Check,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const MerchantManager: React.FC = () => {
  const {
    merchants,
    stores,
    createMerchantAccount,
    updateMerchantAccount,
    assignStoreToMerchant,
    formatPrice,
    hasPermission,
    currentStore,
    setCurrentStore,
    currentStaffUser,
    currentMerchant,
    t,
  } = useApp();

  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';

  // Identify merchant strictly for the current staff user if not Super Admin
  const myMerchant = React.useMemo(() => {
    return (
      merchants.find((m) => m.id === currentStaffUser.merchantId) ||
      currentMerchant ||
      merchants[0]
    );
  }, [merchants, currentStaffUser, currentMerchant]);

  // Navigation mode: 'LIST' | 'MERCHANT_STORES' | 'STORE_EDIT' | 'CONTRACT_EDIT'
  const [activeView, setActiveView] = useState<'LIST' | 'MERCHANT_STORES' | 'STORE_EDIT' | 'CONTRACT_EDIT'>(() =>
    isSuperAdmin ? 'LIST' : 'MERCHANT_STORES'
  );
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(() =>
    isSuperAdmin ? null : (myMerchant?.id || null)
  );
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingContractMerchantId, setEditingContractMerchantId] = useState<string | null>(null);

  // Synchronize non-admin users to only access their own merchant stores hub
  React.useEffect(() => {
    if (!isSuperAdmin) {
      if (activeView === 'LIST') {
        setActiveView('MERCHANT_STORES');
      }
      if (!selectedMerchantId || selectedMerchantId !== myMerchant?.id) {
        setSelectedMerchantId(myMerchant?.id || null);
      }
    }
  }, [isSuperAdmin, myMerchant, activeView, selectedMerchantId]);

  // Search & Filter in list view (Super Admin only)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const canManageMerchants = hasPermission('perm_merchant_manage');
  const selectedMerchant = isSuperAdmin
    ? merchants.find((m) => m.id === selectedMerchantId) || null
    : myMerchant;

  // Filter merchants (For Super Admin view)
  const filteredMerchants = (isSuperAdmin ? merchants : [myMerchant].filter(Boolean)).filter((m) => {
    if (!m) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.legalCompanyName?.toLowerCase().includes(q) ||
      m.registeredAddress?.toLowerCase().includes(q) ||
      m.ico?.toLowerCase().includes(q) ||
      m.dic?.toLowerCase().includes(q) ||
      m.contactPerson?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.brandCode?.toLowerCase().includes(q) ||
      (m.customDomain && m.customDomain.toLowerCase().includes(q))
    );
  });

  // Open Full-screen Merchant Contract Creation
  const handleOpenCreateContract = () => {
    setEditingContractMerchantId(null);
    setActiveView('CONTRACT_EDIT');
  };

  // Open Full-screen Merchant Contract Edit
  const handleOpenEditContract = (merchant: MerchantAccount, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingContractMerchantId(merchant.id);
    setActiveView('CONTRACT_EDIT');
  };

  // Enter Merchant Store Creation & Management View (The required "Edit" action)
  const handleEnterMerchantStores = (merchant: MerchantAccount) => {
    setSelectedMerchantId(merchant.id);
    setActiveView('MERCHANT_STORES');
  };

  // Unassign a store from current merchant
  const handleUnassignStore = async (storeId: string, storeName: string) => {
    if (!selectedMerchant) return;
    if (!window.confirm(`确定要从【${selectedMerchant.name}】中解除关联门店【${storeName}】吗？`)) return;

    try {
      const updatedStoreIds = (selectedMerchant.assignedStoreIds || []).filter((id) => id !== storeId);
      await updateMerchantAccount(selectedMerchant.id, {
        assignedStoreIds: updatedStoreIds,
      });
    } catch (err: any) {
      alert(err.message || '解除关联失败');
    }
  };

  // Subview: Dedicated Contract Edit/Create View (Full Screen)
  if (activeView === 'CONTRACT_EDIT') {
    return (
      <MerchantContractEditView
        merchantId={editingContractMerchantId}
        onBack={() => {
          if (selectedMerchantId && editingContractMerchantId === selectedMerchantId) {
            setActiveView('MERCHANT_STORES');
          } else {
            setActiveView('LIST');
          }
          setEditingContractMerchantId(null);
        }}
        onSaved={(savedMerchant) => {
          if (selectedMerchantId && savedMerchant.id === selectedMerchantId) {
            setActiveView('MERCHANT_STORES');
          } else {
            setActiveView('LIST');
          }
          setEditingContractMerchantId(null);
        }}
      />
    );
  }

  // Subview: Dedicated Store Edit (inside Merchant Hub)
  if (activeView === 'STORE_EDIT') {
    return (
      <StoreEditView
        storeId={editingStoreId}
        defaultMerchantId={selectedMerchantId || undefined}
        onBack={() => {
          setActiveView('MERCHANT_STORES');
          setEditingStoreId(null);
        }}
        onSaved={() => {
          setActiveView('MERCHANT_STORES');
          setEditingStoreId(null);
        }}
      />
    );
  }

  // Subview: Merchant Dedicated Store Hub (门店创建与管理界面)
  if (activeView === 'MERCHANT_STORES' && selectedMerchant) {
    const merchantStores = stores.filter(
      (s) => selectedMerchant.assignedStoreIds?.includes(s.id) || s.merchantId === selectedMerchant.id
    );

    const planInfo = getSaaSPlanInfo(selectedMerchant.plan);
    const isAtQuotaLimit = merchantStores.length >= planInfo.maxStores;

    const handleCreateStoreForMerchant = () => {
      if (isAtQuotaLimit) {
        alert(
          `该商家当前签约为【${planInfo.badge}】，已达到配额上限 (${merchantStores.length}/${planInfo.maxStores} 家门店)。\n\n如需增设更多门店实体，请在上方点击【编辑商家信息 / 签约资料】将方案升级为【连锁版】或【旗舰版】。`
        );
        return;
      }
      setEditingStoreId(null);
      setActiveView('STORE_EDIT');
    };

    return (
      <div className="h-full flex flex-col bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden select-none">
        {/* Top Header */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('LIST');
                    setSelectedMerchantId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回商家列表</span>
                </button>

                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
              </>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{selectedMerchant.name}</h2>
                  
                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedMerchant.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedMerchant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{selectedMerchant.status === 'ACTIVE' ? '已激活' : '已停用'}</span>
                  </span>

                  {/* SaaS Plan Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${planInfo.tagClass}`}>
                    <Award className="w-3 h-3" />
                    <span>{planInfo.badge}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {isSuperAdmin ? '门店创建与管理中枢 · 独立配置支付网关、捷克 EET 2.0 国家税控与营业参数' : '旗下经营商铺管理与直属档案 · 独立配置支付网关、捷克 EET 2.0 国家税控与营业参数'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Prominent Edit Merchant Info Button */}
            <button
              type="button"
              onClick={() => handleOpenEditContract(selectedMerchant)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs active:scale-98"
              title="编辑此商家的企业法定名称、税号、签约方案及账号状态"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>编辑商家信息</span>
            </button>

            <button
              type="button"
              onClick={handleCreateStoreForMerchant}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition active:scale-98 ${
                isAtQuotaLimit
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer border border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900'
              }`}
              title={isAtQuotaLimit ? '已达配额上限，点击查看升级方案' : '为此集团创建全新门店实体'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 为此集团新建门店实体</span>
            </button>
          </div>
        </div>

        {/* Quota limit warning banner if full */}
        {isAtQuotaLimit && (
          <div className="px-6 py-2.5 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>开店配额已满</strong>：当前签约方案为【<strong>{planInfo.name}</strong>】（上限 {planInfo.maxStores} 家门店），当前已达上限（{merchantStores.length}/{planInfo.maxStores}）。
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEditContract(selectedMerchant)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <Award className="w-3 h-3" />
              <span>升级签约方案 (连锁版/旗舰版)</span>
            </button>
          </div>
        )}

        {/* Legal & Corporate Info Bar */}
        <div className="px-6 py-3 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>法定企业名称:</span>
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                {selectedMerchant.legalCompanyName || `${selectedMerchant.name} s.r.o.`}
              </strong>
            </div>

            {selectedMerchant.ico && (
              <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-mono">
                <span>企业编号 IČO:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {selectedMerchant.ico}
                </span>
              </div>
            )}

            {selectedMerchant.dic && (
              <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-mono">
                <span>增值税号 DIČ:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {selectedMerchant.dic}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>联系邮箱:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedMerchant.email}</span>
            </div>

            {selectedMerchant.customDomain && (
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Globe className="w-3.5 h-3.5" />
                <span>专属域名:</span>
                <span className="font-mono font-medium">{selectedMerchant.customDomain}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              SaaS 店铺配额:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                {merchantStores.length} / {planInfo.maxStores === Infinity ? '无限制' : `${planInfo.maxStores} 家`}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => handleOpenEditContract(selectedMerchant)}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>修改商家资料</span>
            </button>
          </div>
        </div>

        {/* Store List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {merchantStores.length === 0 ? (
            <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-800">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                该集团暂无门店实体
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                您可以点击下方按钮为该集团创建全新门店实体。
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStoreId(null);
                    setActiveView('STORE_EDIT');
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 新建门店实体</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {merchantStores.map((store) => {
                const currInfo = SUPPORTED_CURRENCIES[store.currency] || SUPPORTED_CURRENCIES.EUR;
                const isCurrentActive = currentStore.id === store.id;

                return (
                  <div
                    key={store.id}
                    className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition flex flex-col justify-between shadow-2xs ${
                      isCurrentActive
                        ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Store Header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {store.storeName}
                            </h3>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
                                当前主控
                              </span>
                            )}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                            结算币种: {currInfo.label} ({store.currencySymbol})
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            store.status === 'OPEN'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {store.status === 'OPEN' ? '正常营业' : '已暂停'}
                        </span>
                      </div>

                      {/* Store Info */}
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-zinc-700 dark:text-zinc-300">
                            {store.address || '未填写详细营业地址'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{store.phone || '未填写联系电话'}</span>
                        </div>

                        {store.customDomain && (
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] pt-1">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{store.customDomain}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment & Fiscal Badges */}
                      <div className="space-y-1.5 mb-3 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Stripe 支付网关:</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                              store.stripeConfig?.enabled
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60'
                                : 'text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800'
                            }`}
                          >
                            {store.stripeConfig?.enabled ? '已开启' : '未启用'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800">
                          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>捷克 EET 2.0 国家税控:</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                              store.eet2Config?.enabled
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60'
                                : 'text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800'
                            }`}
                          >
                            {store.eet2Config?.enabled
                              ? store.eet2Config.mode === 'PRODUCTION'
                                ? '生产税控通过'
                                : '沙盒测试中'
                              : '未启用'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStoreId(store.id);
                          setActiveView('STORE_EDIT');
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-2xs"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>配置与编辑门店</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUnassignStore(store.id, store.storeName)}
                        className="py-1.5 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 text-xs font-semibold transition"
                        title="从该商家解绑"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main View: High-density, professional Merchant List View (Table / List View)
  return (
    <div className="h-full flex flex-col bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">商家账户签约</h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold shrink-0">
                {merchants.length} 家签约集团
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
              集团与法定企业签约 · 激活与停用状态控制 · 点击编辑管理门店
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索集团、税号、联系人..."
              className="w-full pl-8 pr-2.5 py-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="hidden sm:flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              全部 ({merchants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              已激活 ({merchants.filter((m) => m.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              已停用 ({merchants.filter((m) => m.status === 'SUSPENDED').length})
            </button>
          </div>

          {/* Create Merchant Button */}
          {canManageMerchants && (
            <button
              type="button"
              onClick={handleOpenCreateContract}
              className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs shadow-2xs active:scale-98 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增签约</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance & Audit Notice Bar */}
      <div className="px-4 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium truncate">
            财税合规与多租户审计：<strong>签约信息不可删除，仅可停用/冻结</strong>。点击【编辑】进入专属门店管理。
          </span>
        </div>
        <span className="text-[10px] font-mono opacity-80 font-semibold shrink-0 ml-2">
          共 {filteredMerchants.length} 条
        </span>
      </div>

      {/* Merchant Table / List View */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                <th className="py-2.5 px-3 sm:px-4 min-w-[260px]">集团名称（法定企业全称 & 税号）</th>
                <th className="py-2.5 px-3 w-32 text-center">店铺数量</th>
                <th className="py-2.5 px-3 w-28 text-center">激活状态</th>
                <th className="py-2.5 px-3 sm:px-4 w-44 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-400 dark:text-zinc-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p>未找到符合条件的商家签约记录</p>
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => {
                  const assignedStores = stores.filter(
                    (s) => merchant.assignedStoreIds?.includes(s.id) || s.merchantId === merchant.id
                  );
                  const isActive = merchant.status === 'ACTIVE';

                  return (
                    <tr
                      key={merchant.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition duration-150 group"
                    >
                      {/* Column 1: 集团名称（法定企业名称） */}
                      <td className="py-3 px-3 sm:px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 font-bold text-zinc-800 dark:text-zinc-200 text-sm shadow-2xs group-hover:border-zinc-400 transition">
                            <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            {/* Group / Brand Name */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {merchant.name}
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                                {merchant.subdomain || `${merchant.brandCode}.pos.com`}
                              </span>
                              {(() => {
                                const pInfo = getSaaSPlanInfo(merchant.plan);
                                return (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${pInfo.tagClass}`}>
                                    {pInfo.badge}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Legal Enterprise Name */}
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                              <Scale className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>法定企业:</span>
                              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {merchant.legalCompanyName || `${merchant.name} s.r.o.`}
                              </strong>
                            </div>

                            {/* Legal Fiscal Info: IČO / DIČ */}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                              {merchant.ico && (
                                <span className="font-mono">
                                  IČO: <strong className="text-zinc-800 dark:text-zinc-200">{merchant.ico}</strong>
                                </span>
                              )}
                              {merchant.dic && (
                                <span className="font-mono">
                                  DIČ: <strong className="text-zinc-800 dark:text-zinc-200">{merchant.dic}</strong>
                                </span>
                              )}
                              {merchant.registeredAddress && (
                                <span className="flex items-center gap-1 text-zinc-400 truncate max-w-xs">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{merchant.registeredAddress}</span>
                                </span>
                              )}
                            </div>

                            {/* Contact Person & Email */}
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                              <span>联系人: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{merchant.contactPerson}</strong></span>
                              <span>·</span>
                              <span>邮箱: {merchant.email}</span>
                              {merchant.phone && (
                                <>
                                  <span>·</span>
                                  <span>电话: {merchant.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: 门店数量 (Store Count - 只显示门店数量) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex items-center justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => handleEnterMerchantStores(merchant)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs shadow-2xs transition active:scale-95"
                            title="点击进入管理旗下门店"
                          >
                            <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{assignedStores.length} 家</span>
                          </button>
                        </div>
                      </td>

                      {/* Column 3: 激活状态 (Active Status - 纯信息展示，不是按钮) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex flex-col items-center justify-center pt-1">
                          {isActive ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                              title="企业账户状态：已激活"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                              <span>已激活</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs"
                              title="企业账户状态：已停用"
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
                              <span>已停用</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: 操作栏 (管理门店按钮 - 商家编辑已移至管理门店内部) */}
                      <td className="py-3.5 px-3 sm:px-4 align-top text-right">
                        <div className="flex items-center justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleEnterMerchantStores(merchant)}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs shadow-2xs active:scale-98 transition flex items-center gap-1.5"
                            title="进入门店管理中枢"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                            <span>管理门店</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
