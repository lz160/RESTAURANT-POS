import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, OrderMaster, StoreEntity } from '../../types';
import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  Sliders,
  Search,
  Layers,
  History,
  Store,
  CreditCard,
  Banknote,
  Clock,
  X,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Filter,
  Eye,
  ShoppingBag,
  Phone,
  QrCode,
  Sparkles,
  Building,
  Check,
  Receipt,
  ArrowUpDown,
} from 'lucide-react';

type ManagerTab = 'TODAY_SALES' | 'INVENTORY_STOCK';

export interface StoreManagerDailyViewProps {
  initialTab?: ManagerTab;
  onlyInventory?: boolean;
  onClose?: () => void;
}

export const StoreManagerDailyView: React.FC<StoreManagerDailyViewProps> = ({
  initialTab = 'TODAY_SALES',
  onlyInventory = false,
  onClose,
}) => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    currentMerchant,
    currentStaffUser,
    orders,
    inventoryItems,
    inventoryLogs,
    adjustInventory,
    createInventoryItem,
    formatPrice,
    t,
  } = useApp();

  const isMerchant = currentStaffUser?.role === 'MERCHANT';
  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';
  const isStoreManager = currentStaffUser?.role === 'STORE_MANAGER';

  // Multi-Store Filtering: Calculate accessible stores for this user
  const accessibleStores: StoreEntity[] = useMemo(() => {
    if (isSuperAdmin) return stores || [];
    if (isMerchant && currentMerchant) {
      return (stores || []).filter(
        (s) =>
          currentMerchant.assignedStoreIds?.includes(s.id) ||
          s.merchantId === currentMerchant.id ||
          (currentStaffUser.accessibleStoreIds && currentStaffUser.accessibleStoreIds.includes(s.id))
      );
    }
    if (isStoreManager) {
      if (currentStaffUser.accessibleStoreIds && currentStaffUser.accessibleStoreIds.length > 0) {
        return (stores || []).filter((s) => currentStaffUser.accessibleStoreIds?.includes(s.id));
      }
      if (currentStaffUser.storeId) {
        return (stores || []).filter((s) => s.id === currentStaffUser.storeId);
      }
    }
    return stores || [];
  }, [stores, isSuperAdmin, isMerchant, isStoreManager, currentMerchant, currentStaffUser]);

  // Store Filter selection: 'ALL' or specific storeId
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(
    accessibleStores.length > 1 ? 'ALL' : (accessibleStores[0]?.id || currentStore.id)
  );

  const [activeTab, setActiveTab] = useState<ManagerTab>(onlyInventory ? 'INVENTORY_STOCK' : initialTab);
  
  // Sales Stream Filters
  const [salesSearch, setSalesSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order for Detail Drawer
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderMaster | null>(null);

  // Shift Printout Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Inventory Filters & State
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('ALL');

  // Modal State for Inventory Action (Restock / Waste / Calibrate)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
  }>({
    isOpen: false,
    item: null,
    type: 'RESTOCK',
  });

  const [adjustAmount, setAdjustAmount] = useState<string>('5');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ingredient Modal State
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    category: 'TEA',
    categoryName: '茶底原叶',
    currentStock: 10,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 15,
  });

  // Calculate Accessible Orders based on store assignment
  const accessibleStoreIds = useMemo(() => {
    return new Set(accessibleStores.map((s) => s.id));
  }, [accessibleStores]);

  // Today's orders scoped to accessible stores
  const allScopedOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      if (isSuperAdmin) return true;
      return accessibleStoreIds.has(o.storeId);
    });
  }, [orders, isSuperAdmin, accessibleStoreIds]);

  // Filtered Today's Orders
  const todayOrders = useMemo(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return allScopedOrders.filter((o) => {
      const isToday = o.createdAt >= startOfToday && o.paymentStatus === 'PAID';
      if (!isToday) return false;

      // Store filter
      if (selectedStoreFilter !== 'ALL' && o.storeId !== selectedStoreFilter) {
        return false;
      }

      // Channel filter
      if (channelFilter !== 'ALL' && o.channel !== channelFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter === 'CASH' && o.paymentMethod !== 'CASH') return false;
      if (paymentFilter === 'CARD' && o.paymentMethod !== 'POS_CARD') return false;
      if (paymentFilter === 'STRIPE' && !o.paymentMethod.startsWith('STRIPE')) return false;

      // Status filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      // Search query
      if (salesSearch.trim()) {
        const query = salesSearch.toLowerCase().trim();
        const matchNo = o.orderNo.toLowerCase().includes(query);
        const matchCode = o.pickupCode.toLowerCase().includes(query);
        const matchItems = o.items.some((it) => it.productName.toLowerCase().includes(query));
        const matchPhone = o.customerPhoneMasked?.toLowerCase().includes(query);
        if (!matchNo && !matchCode && !matchItems && !matchPhone) return false;
      }

      return true;
    });
  }, [allScopedOrders, selectedStoreFilter, channelFilter, paymentFilter, statusFilter, salesSearch]);

  // Revenue Aggregations (Handles single & multi-currency breakdowns)
  const salesMetrics = useMemo(() => {
    const currencyMap: Record<string, { total: number; cash: number; card: number; count: number; symbol: string }> = {};

    todayOrders.forEach((o) => {
      const cur = o.currency || 'EUR';
      const sym = o.currencySymbol || '€';
      if (!currencyMap[cur]) {
        currencyMap[cur] = { total: 0, cash: 0, card: 0, count: 0, symbol: sym };
      }
      currencyMap[cur].total += o.totalAmount || 0;
      currencyMap[cur].count += 1;
      if (o.paymentMethod === 'CASH') {
        currencyMap[cur].cash += o.totalAmount || 0;
      } else {
        currencyMap[cur].card += o.totalAmount || 0;
      }
    });

    const completedCount = todayOrders.filter((o) => o.status === 'COMPLETED').length;
    const readyCount = todayOrders.filter((o) => o.status === 'READY').length;
    const makingCount = todayOrders.filter((o) => o.status === 'MAKING').length;

    return {
      currencyMap,
      currenciesList: Object.entries(currencyMap).map(([cur, data]) => ({ cur, ...data })),
      totalOrdersCount: todayOrders.length,
      completedCount,
      readyCount,
      makingCount,
    };
  }, [todayOrders]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (todayOrders.length === 0) {
      alert('今日暂无订单流水记录可导出');
      return;
    }

    const headers = [
      '订单时间',
      '所属门店',
      '取餐码',
      '系统流水号',
      '下单渠道',
      '订单状态',
      '支付方式',
      '币种',
      '订单总额',
      '品项数量',
      '点餐明细',
      '顾客联系方式',
      'EET2税控FIK',
    ];

    const rows = todayOrders.map((o) => {
      const st = stores.find((s) => s.id === o.storeId);
      const itemsDetail = o.items.map((i) => `${i.productName}x${i.quantity}`).join('; ');
      return [
        new Date(o.createdAt).toLocaleString(),
        `"${st ? st.storeName : o.storeId}"`,
        `"${o.pickupCode}"`,
        `"${o.orderNo}"`,
        o.channel === 'COUNTER_POS' ? '柜台收银' : '手机扫码',
        o.status === 'COMPLETED' ? '已核销' : o.status === 'READY' ? '待取餐' : '制作中',
        o.paymentMethod === 'CASH' ? '现金' : o.paymentMethod === 'POS_CARD' ? 'POS刷卡' : 'Stripe在线',
        o.currency,
        o.totalAmount.toFixed(2),
        o.itemsCount,
        `"${itemsDetail}"`,
        o.customerPhoneMasked || '-',
        o.eet2Fiscal?.fik || '-',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Store_Sales_Ledger_${new Date().toISOString().slice(0, 10)}_${selectedStoreFilter}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Inventory
  const filteredInventory = useMemo(() => {
    return (inventoryItems || []).filter((item) => {
      if (selectedStoreFilter !== 'ALL' && item.storeId && item.storeId !== selectedStoreFilter) {
        return false;
      }
      const matchCat = inventoryCategory === 'ALL' || item.category === inventoryCategory;
      const matchSearch =
        !inventorySearch ||
        item.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.categoryName?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.category?.toLowerCase().includes(inventorySearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventoryItems, inventoryCategory, inventorySearch, selectedStoreFilter]);

  // Low stock alert items count
  const lowStockCount = useMemo(() => {
    return filteredInventory.filter((i) => i.status === 'LOW' || i.status === 'CRITICAL').length;
  }, [filteredInventory]);

  const handleOpenAdjust = (item: InventoryItem, type: 'RESTOCK' | 'WASTE' | 'CALIBRATE') => {
    setActionModal({
      isOpen: true,
      item,
      type,
    });
    setAdjustAmount(type === 'CALIBRATE' ? item.currentStock.toString() : '5');
    setAdjustNotes('');
  };

  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.item) return;

    setIsSubmitting(true);
    try {
      const numVal = parseFloat(adjustAmount);
      if (isNaN(numVal) || numVal < 0) {
        alert('请输入有效的数量数值');
        return;
      }

      await adjustInventory({
        itemId: actionModal.item.id,
        type: actionModal.type,
        delta: actionModal.type === 'CALIBRATE' ? undefined : numVal,
        targetBalance: actionModal.type === 'CALIBRATE' ? numVal : undefined,
        notes: adjustNotes.trim(),
      });

      setActionModal({ isOpen: false, item: null, type: 'RESTOCK' });
    } catch (err: any) {
      alert(err.message || '调整失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name.trim()) {
      alert('请填写物料名称');
      return;
    }

    const targetStoreId = selectedStoreFilter !== 'ALL' ? selectedStoreFilter : currentStore.id;

    setIsSubmitting(true);
    try {
      await createInventoryItem({
        ...newItemData,
        storeId: targetStoreId,
      });
      setIsCreateItemModalOpen(false);
      setNewItemData({
        name: '',
        category: 'TEA',
        categoryName: '茶底原叶',
        currentStock: 10,
        unit: 'kg',
        minThreshold: 3,
        costPerUnit: 15,
      });
    } catch (err: any) {
      alert(err.message || '添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden select-none">
      {/* 顶部标题与导航栏 */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-2xs">
            <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isMerchant
                  ? '连锁门店库存与销售台账'
                  : isStoreManager
                  ? '店长全功能工作台 (多店流水与库存)'
                  : t('storeManagerDaily')}
              </h2>

              {/* 多门店管辖选择器 (Multi-Store Switcher for Manager/Merchant/Admin) */}
              {accessibleStores.length > 1 ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    管辖门店:
                  </span>
                  <select
                    value={selectedStoreFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedStoreFilter(val);
                      if (val !== 'ALL') {
                        const targetStore = accessibleStores.find((s) => s.id === val);
                        if (targetStore) setCurrentStore(targetStore);
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-emerald-900 dark:text-emerald-100 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="dark:bg-zinc-900 font-bold">
                      🌟 全部管辖门店汇总 ({accessibleStores.length} 家门店)
                    </option>
                    {accessibleStores.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                        {s.storeName} ({s.currency})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-[11px] px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                  {accessibleStores[0]?.storeName || currentStore.storeName} ({accessibleStores[0]?.currency || currentStore.currency})
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isStoreManager
                ? `已授权管理 ${accessibleStores.length} 家门店流水与库存 · 实时掌握前台收银、扫码支付与后厨物料`
                : isMerchant
                ? '品牌连锁管理工作台：全门店原材料库存监控、销售流水对账与实物盘点'
                : '店长核心工作台：实时掌控当日营业销售实况与后厨食材物料库存台账'}
            </p>
          </div>
        </div>

        {/* 标签切换、操作按钮与关闭 */}
        <div className="flex items-center gap-2">
          {!onlyInventory ? (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('TODAY_SALES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'TODAY_SALES'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('todaySalesData')}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/70 font-mono">
                  {todayOrders.length} 单
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('INVENTORY_STOCK')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'INVENTORY_STOCK'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>{isMerchant ? '食材物料库存 (入库·盘点)' : t('ingredientInventory')}</span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-mono font-bold">
                    {lowStockCount} 告急
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
              <Package className="w-4 h-4 text-amber-600" />
              <span>后厨原料库存 (查看·入库·盘点)</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px]">
                  {lowStockCount} 项低库存告警
                </span>
              )}
            </div>
          )}

          {/* Quick Actions: Export CSV & Print Shift */}
          {activeTab === 'TODAY_SALES' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportCSV}
                title="导出今日流水报表 CSV"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">导出 CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                title="打印今日钱箱交班对账单"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">交班对账单</span>
              </button>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 视图内容切换 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'TODAY_SALES' ? (
          <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto space-y-6">
            {/* 当日销售数据指标卡片 (支持多币种汇总展示) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 今日营业额 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今日实时总营业额</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                    Live
                  </span>
                </div>
                {salesMetrics.currenciesList.length > 0 ? (
                  <div className="space-y-1">
                    {salesMetrics.currenciesList.map((c) => (
                      <div key={c.cur} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                        {c.symbol} {c.total.toFixed(2)}
                        {salesMetrics.currenciesList.length > 1 && (
                          <span className="text-xs font-normal text-zinc-400 ml-1">({c.cur})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                    {formatPrice(0)}
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                  <span>共成交 {todayOrders.length} 笔订单</span>
                  <span className="font-mono">
                    客单价: {todayOrders.length > 0 && salesMetrics.currenciesList[0] ? `${salesMetrics.currenciesList[0].symbol}${(salesMetrics.currenciesList[0].total / todayOrders.length).toFixed(1)}` : '-'}
                  </span>
                </div>
              </div>

              {/* 已交付核销单量 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">已交付核销单量</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                  {salesMetrics.completedCount} <span className="text-base font-normal text-zinc-400">/ {todayOrders.length}</span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                  <span>
                    核销完成率:{' '}
                    {todayOrders.length > 0
                      ? ((salesMetrics.completedCount / todayOrders.length) * 100).toFixed(0)
                      : 100}
                    %
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {salesMetrics.readyCount} 单待取
                  </span>
                </div>
              </div>

              {/* POS刷卡与在线支付 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">POS刷卡 / 在线支付</span>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                {salesMetrics.currenciesList.length > 0 ? (
                  <div className="space-y-1">
                    {salesMetrics.currenciesList.map((c) => (
                      <div key={c.cur} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                        {c.symbol} {c.card.toFixed(2)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                    {formatPrice(0)}
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                  <span>信用卡/Apple Pay等</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {salesMetrics.currenciesList[0]?.total
                      ? ((salesMetrics.currenciesList[0].card / salesMetrics.currenciesList[0].total) * 100).toFixed(0)
                      : 0}
                    % 占比
                  </span>
                </div>
              </div>

              {/* 现金实收结余 (钱箱对账) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">现金实收结余 (钱箱)</span>
                  <Banknote className="w-4 h-4 text-emerald-600" />
                </div>
                {salesMetrics.currenciesList.length > 0 ? (
                  <div className="space-y-1">
                    {salesMetrics.currenciesList.map((c) => (
                      <div key={c.cur} className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                        {c.symbol} {c.cash.toFixed(2)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                    {formatPrice(0)}
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                  <span>钱箱现钞对账参考</span>
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(true)}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  >
                    交班清点 →
                  </button>
                </div>
              </div>
            </div>

            {/* 当日订单流水明细与筛选控制器 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
              {/* 搜索与多维度筛选栏 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 搜索框 */}
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      placeholder="搜索取餐码 / 流水号 / 菜品..."
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                    />
                  </div>

                  {/* 渠道筛选 */}
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">全部渠道</option>
                    <option value="COUNTER_POS">柜台收银 (POS)</option>
                    <option value="QR_H5">顾客手机扫码 (H5)</option>
                  </select>

                  {/* 支付方式筛选 */}
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">全部支付方式</option>
                    <option value="CASH">现金 (Cash)</option>
                    <option value="CARD">POS 刷卡记账</option>
                    <option value="STRIPE">Stripe 移动支付</option>
                  </select>

                  {/* 状态筛选 */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">全部状态</option>
                    <option value="COMPLETED">已核销出餐</option>
                    <option value="READY">待取餐 (Ready)</option>
                    <option value="MAKING">制作中 (Making)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span>筛选出 {todayOrders.length} 笔流水</span>
                </div>
              </div>

              {/* 订单表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">取餐码</th>
                      <th className="py-2.5 px-3">所属门店</th>
                      <th className="py-2.5 px-3">流水号</th>
                      <th className="py-2.5 px-3">渠道</th>
                      <th className="py-2.5 px-3">点餐品项</th>
                      <th className="py-2.5 px-3 text-right">金额</th>
                      <th className="py-2.5 px-3">支付方式</th>
                      <th className="py-2.5 px-3">下单时间</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-3 text-right">详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {todayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-zinc-400 italic">
                          暂无符合筛选条件的订单记录
                        </td>
                      </tr>
                    ) : (
                      todayOrders.map((ord) => {
                        const targetStore = stores.find((s) => s.id === ord.storeId);
                        return (
                          <tr
                            key={ord.id}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                          >
                            <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                              {ord.pickupCode}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold border border-zinc-200/50 dark:border-zinc-700/50">
                                {targetStore ? targetStore.storeName : ord.storeId}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400">
                              {ord.orderNo}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                                {ord.channel === 'COUNTER_POS' ? '吧台收银' : '手机扫码'}
                              </span>
                            </td>
                            <td className="py-3 px-3 max-w-[200px] truncate text-zinc-800 dark:text-zinc-200 font-medium">
                              {ord.items.map((i) => `${i.productName}x${i.quantity}`).join(', ')}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {ord.currencySymbol || '€'} {ord.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  ord.paymentMethod === 'CASH'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {ord.paymentMethod === 'CASH'
                                  ? '现金'
                                  : ord.paymentMethod === 'POS_CARD'
                                  ? 'POS刷卡'
                                  : 'Stripe移动'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-400 font-mono">
                              {new Date(ord.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  ord.status === 'COMPLETED'
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    : ord.status === 'READY'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {ord.status === 'COMPLETED'
                                  ? '已核销'
                                  : ord.status === 'READY'
                                  ? '待取餐'
                                  : '制作中'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
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
        ) : (
          /* 食材库存管理视图 */
          <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto space-y-6">
            {/* 库存顶部控制与搜索 */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="搜索食材/包材名称..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {['ALL', 'TEA', 'DAIRY', 'MEAT', 'PACKAGING'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        inventoryCategory === cat
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {cat === 'ALL'
                        ? '全部'
                        : cat === 'TEA'
                        ? '茶底'
                        : cat === 'DAIRY'
                        ? '乳品'
                        : cat === 'MEAT'
                        ? '肉禽'
                        : '包材'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateItemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs shadow-2xs active:scale-98 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addInventoryItem')}</span>
              </button>
            </div>

            {/* 食材库存网格清单 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const isCritical = item.status === 'CRITICAL';
                const isLow = item.status === 'LOW';
                const storeName = stores.find((s) => s.id === item.storeId)?.storeName;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition flex flex-col justify-between shadow-2xs ${
                      isCritical
                        ? 'border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                        : isLow
                        ? 'border-amber-400 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-semibold text-zinc-400">
                              {item.categoryName}
                            </span>
                            {storeName && (
                              <span className="text-[9px] px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                                {storeName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            isCritical
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : isLow
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isCritical ? '紧缺告急' : isLow ? '库存偏低' : '库存充足'}
                        </span>
                      </div>

                      {/* 当前库存大字 */}
                      <div className="py-2 flex items-baseline justify-between border-y border-zinc-100 dark:border-zinc-800 my-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">当前在库余量:</span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-2xl font-bold font-mono ${
                              isCritical
                                ? 'text-rose-600 dark:text-rose-400'
                                : isLow
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                        <span>预警阈值: {item.minThreshold} {item.unit}</span>
                        <span>成本价: {formatPrice(item.costPerUnit)}/{item.unit}</span>
                      </div>
                    </div>

                    {/* 操作按钮组 (补货入库 / 损耗 / 盘点校准) */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-1.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'RESTOCK')}
                        className="py-1.5 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition text-center"
                      >
                        {t('restock')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'WASTE')}
                        className="py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition text-center"
                      >
                        {t('waste')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'CALIBRATE')}
                        className="py-1.5 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition text-center"
                      >
                        {t('calibrate')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 变动台账日志 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                <span>食材出入库与盘点流水台账</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold text-[11px]">
                      <th className="py-2 px-3">变动时间</th>
                      <th className="py-2 px-3">食材名称</th>
                      <th className="py-2 px-3">变动类型</th>
                      <th className="py-2 px-3 text-right">变动量</th>
                      <th className="py-2 px-3 text-right">变动后结余</th>
                      <th className="py-2 px-3">操作人</th>
                      <th className="py-2 px-3">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {inventoryLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <td className="py-2.5 px-3 text-zinc-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{log.itemName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              log.type === 'RESTOCK'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : log.type === 'WASTE'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : log.type === 'CONSUME'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {log.type === 'RESTOCK'
                              ? '采购入库'
                              : log.type === 'WASTE'
                              ? '损耗报废'
                              : log.type === 'CONSUME'
                              ? '出杯消耗'
                              : '盘点校准'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-zinc-900 dark:text-zinc-100">
                          {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold font-mono text-zinc-600 dark:text-zinc-400">
                          {log.balance}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{log.operator}</td>
                        <td className="py-2.5 px-3 text-zinc-400 italic">{log.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 订单明细抽屉 / 模态框 */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedOrderForDetail(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-xl font-bold flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                {selectedOrderForDetail.pickupCode}
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                  {selectedOrderForDetail.orderNo}
                </h3>
                <p className="text-xs text-zinc-500">
                  {stores.find((s) => s.id === selectedOrderForDetail.storeId)?.storeName} · 下单时间:{' '}
                  {new Date(selectedOrderForDetail.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* 餐品明细 */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="font-bold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-1 flex justify-between">
                  <span>点餐明细 ({selectedOrderForDetail.itemsCount} 件)</span>
                  <span>金额</span>
                </div>
                {selectedOrderForDetail.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {it.productName} × {it.quantity}
                      </div>
                      {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                        <div className="text-[10px] text-zinc-500">
                          {it.selectedModifiers.map((m) => m.itemName).join(', ')}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[10px] text-amber-600 italic">备注: {it.notes}</div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedOrderForDetail.currencySymbol} {it.totalPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-bold text-sm">
                  <span>实付总额</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedOrderForDetail.currencySymbol} {selectedOrderForDetail.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 支付与税控信息 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">支付方式</span>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedOrderForDetail.paymentMethod === 'CASH'
                      ? '现金实收'
                      : selectedOrderForDetail.paymentMethod === 'POS_CARD'
                      ? 'POS 刷卡'
                      : 'Stripe 在线扣款'}
                  </div>
                  {selectedOrderForDetail.cardDetails && (
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      卡号: •••• {selectedOrderForDetail.cardDetails.cardLast4}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">订单状态</span>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedOrderForDetail.status === 'COMPLETED'
                      ? '已交付核销'
                      : selectedOrderForDetail.status === 'READY'
                      ? '制作完成 待取餐'
                      : '后厨制作中'}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    渠道: {selectedOrderForDetail.channel === 'COUNTER_POS' ? '前台柜台' : '扫码点餐'}
                  </div>
                </div>
              </div>

              {/* 捷克 EET2 税控数字证书签章 (如存在) */}
              {selectedOrderForDetail.eet2Fiscal && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[10px] font-mono space-y-1">
                  <div className="font-bold text-blue-800 dark:text-blue-300">
                    🇨🇿 EET 2.0 捷克国家财政税控已核验 (Digital Receipt)
                  </div>
                  <div className="truncate">FIK: {selectedOrderForDetail.eet2Fiscal.fik}</div>
                  <div className="truncate">BKP: {selectedOrderForDetail.eet2Fiscal.bkp}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 交班清点对账单小票模态框 (Print Shift Ledger Receipt Modal) */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pb-3 border-b border-dashed border-zinc-300 dark:border-zinc-700">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {selectedStoreFilter === 'ALL' ? '多店汇总交班清点对账单' : currentStore.storeName}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                结算日期: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
              <p className="text-[11px] text-zinc-400">
                收银责任人: {currentStaffUser.name} ({currentStaffUser.employeeNumber})
              </p>
            </div>

            <div className="py-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">今日总成交流水:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{todayOrders.length} 单</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">已核销出餐完成:</span>
                <span className="font-bold text-emerald-600">{salesMetrics.completedCount} 单</span>
              </div>

              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 my-2 pt-2">
                <span className="font-bold text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
                  实收汇总 (按币种)
                </span>
                {salesMetrics.currenciesList.map((c) => (
                  <div key={c.cur} className="space-y-1">
                    <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                      <span>{c.cur} 营业总额:</span>
                      <span>
                        {c.symbol} {c.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400 pl-2">
                      <span>• 钱箱现钞 (Cash):</span>
                      <span>
                        {c.symbol} {c.cash.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-blue-700 dark:text-blue-400 pl-2">
                      <span>• POS刷卡/移动支付:</span>
                      <span>
                        {c.symbol} {c.card.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2 text-[10px] text-zinc-400 text-center">
                *** 请店长清点钱箱现金并由接班人签字确认 ***
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>立即打印小票</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 调整库存模态框 (入库/损耗/盘点) */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setActionModal({ isOpen: false, item: null, type: 'RESTOCK' })}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {actionModal.type === 'RESTOCK'
                ? '原料补货入库'
                : actionModal.type === 'WASTE'
                ? '原料损耗报废'
                : '实物盘点校准'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              物料: <strong className="text-zinc-900 dark:text-zinc-100">{actionModal.item.name}</strong> (当前结余:{' '}
              {actionModal.item.currentStock} {actionModal.item.unit})
            </p>

            <form onSubmit={handleExecuteAdjust} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {actionModal.type === 'CALIBRATE' ? '盘点实际在库数量' : '变动数量'} ({actionModal.item.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">操作原因 / 批次备注</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="例如: 供货商到货入库 / 晚间盘点..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, item: null, type: 'RESTOCK' })}
                  className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold shadow-2xs transition"
                >
                  {isSubmitting ? '提交中...' : '确认执行'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增原料物料模态框 */}
      {isCreateItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsCreateItemModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{t('addInventoryItem')}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              为当前门店【{currentStore.storeName}】录入新的食材、乳品、肉禽或包材档案
            </p>

            <form onSubmit={handleCreateNewItem} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">原料名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 锡兰红茶原叶 / 鲜牛奶 / 纸杯"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">原料分类</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const catNames: Record<string, string> = {
                        TEA: '茶底原叶',
                        DAIRY: '乳品鲜奶',
                        MEAT: '肉禽生鲜',
                        PACKAGING: '外卖包材',
                        FRUIT: '鲜果原浆',
                        COFFEE: '咖啡豆',
                      };
                      setNewItemData({
                        ...newItemData,
                        category: cat,
                        categoryName: catNames[cat] || '其它物料',
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="TEA">茶底原叶</option>
                    <option value="DAIRY">乳品鲜奶</option>
                    <option value="MEAT">肉禽生鲜</option>
                    <option value="PACKAGING">外卖包材</option>
                    <option value="FRUIT">鲜果原浆</option>
                    <option value="COFFEE">咖啡豆</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">计量单位</label>
                  <select
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="kg">千克 (kg)</option>
                    <option value="L">升 (L)</option>
                    <option value="个">个 (pcs)</option>
                    <option value="包">包 (packs)</option>
                    <option value="箱">箱 (boxes)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">初始库存</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.currentStock}
                    onChange={(e) => setNewItemData({ ...newItemData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">低库存阈值</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.minThreshold}
                    onChange={(e) => setNewItemData({ ...newItemData, minThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">采购成本单价</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.costPerUnit}
                    onChange={(e) => setNewItemData({ ...newItemData, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateItemModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold shadow-2xs transition"
                >
                  {isSubmitting ? '保存中...' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
