export type OrderStatus = 'UNPAID' | 'PENDING' | 'MAKING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type StationTaskStatus = 'PENDING' | 'MAKING' | 'DONE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// Supported Currencies in Czech Republic (CZK Czech Koruna & EUR Euro)
export type CurrencyCode = 'CZK' | 'EUR';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  symbolPosition: 'before' | 'after';
  exchangeRateToEur: number; // For multi-currency consolidated reporting
}

export interface ModifierItem {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number;
  required: boolean;
  items: ModifierItem[];
}

export interface RecipeBOMItem {
  inventoryItemId: string;   // 关联的原料ID
  inventoryItemName: string; // 原料名称
  quantity: number;          // 单份消耗数量 (如 200)
  unit: string;              // 单位 (如 ml, g, 个)
  unitCost?: number;         // 单位成本
}

export interface ProductSKU {
  id: string;
  storeId?: string;          // 所属店铺ID（单店隔离）
  productId?: string;
  name: string;
  category: string;
  categoryId?: string;
  basePrice: number;
  image: string;
  description: string;
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | string;
  prepTimeSeconds: number; // SLA standard duration
  modifierGroupIds?: string[];
  applicableModifierGroupIds?: string[];
  isSoldOut?: boolean;
  isRecommended?: boolean;
  tags?: string[];
  recipeBOM?: RecipeBOMItem[]; // 原料到成品配方构成 (BOM)
  estimatedCost?: number;      // 理论原料成本
  grossMargin?: number;        // 毛利率 %
  salesCount?: number; // Cumulative sales volume
  salesRevenue?: number; // Cumulative sales amount
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  sku: ProductSKU;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  unitPrice: number;
  itemTotalPrice: number;
  notes?: string;
}

export interface OrderItem {
  itemId: string;
  orderId: string;
  skuId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | string;
  selectedModifiers: SelectedModifier[];
  stationStatus: StationTaskStatus;
  prepTimeSeconds: number;
  startedAt?: number;
  completedAt?: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'POS_CARD' | 'STRIPE_CARD' | 'STRIPE_APPLE_PAY';

export interface OrderMaster {
  id: string;
  storeId: string;
  merchantId?: string;
  orderNo: string;
  pickupCode: string; // e.g. "A001", "B012", "C003"
  channel: 'QR_H5' | 'KIOSK' | 'DELIVERY_AGGREGATOR' | 'COUNTER_POS';
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  cashDetails?: {
    receivedAmount: number;
    changeAmount: number;
  };
  cardDetails?: {
    cardLast4: string;
    authCode: string;
  };
  currency: CurrencyCode | string;
  currencySymbol?: string;
  totalAmount: number;
  itemsCount: number;
  items: OrderItem[];
  customerPhoneMasked?: string;
  notes?: string;
  createdAt: number;
  paidAt?: number;
  readyAt?: number;
  completedAt?: number;
  estimatedWaitMinutes: number;
  queuePosition: number;
  eet2Fiscal?: any;
}

export interface KDSStation {
  id: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | 'station_expo';
  name: string;
  type: 'MAKING' | 'EXPO';
  description: string;
  icon: string;
  supportedCategories: string[];
}

export interface BatchAggregationItem {
  skuId: string;
  productName: string;
  targetStationId: string;
  modifierSignature: string;
  modifierSummary: string;
  totalQuantity: number;
  orderRefs: { orderId: string; pickupCode: string; quantity: number; elapsedSeconds: number }[];
  earliestCreatedAt: number;
}

export interface QueueSummary {
  waitingCups: number;
  makingOrdersCount: number;
  readyOrdersCount: number;
  completedTodayCount: number;
  avgWaitTimeMinutes: number;
  currentCallingCodes: string[];
}

export interface WSEvent {
  type: 'NEW_ORDER' | 'PAYMENT_CONFIRMED' | 'TASK_BUMPED' | 'ORDER_READY' | 'ORDER_COMPLETED' | 'ITEM_SOLDOUT_CHANGED' | 'QUEUE_UPDATE' | 'MENU_UPDATED' | 'CATEGORIES_UPDATED' | 'INVENTORY_UPDATED' | 'STORES_UPDATED' | 'MERCHANTS_UPDATED' | 'STRIPE_CONFIG_UPDATED';
  payload: any;
  timestamp: number;
}

// Staff and User Roles
export type StaffRole = 
  | 'SUPER_ADMIN'     // 卖系统的 / 平台超级管理员 (SaaS Vendor / Platform Super Admin)
  | 'MERCHANT'        // 商家账户 (Merchant Account)
  | 'STORE_MANAGER'   // 店长 (Store Manager)
  | 'CHEF'            // 后厨主厨
  | 'CASHIER'         // 吧台收银员
  | 'EXPO_PACKER';    // Expo 打包员

export interface PermissionDefinition {
  id: string;
  name: string;
  category: 'MERCHANT' | 'STORE' | 'MENU' | 'ORDERS' | 'STAFF' | 'FINANCE' | 'INVENTORY' | 'SYSTEM';
  description: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  merchantId?: string; // Associated merchant ID if role is MERCHANT or staff belongs to merchant
  brandCode?: string;  // e.g. 'admin' | 'danube' | 'sakura' | 'alps' | 'oriental'
  subdomain?: string;  // e.g. 'admin.pos.com' | 'danube.pos.com'
  storeId: string;     // Associated current active store ID
  accessibleStoreIds?: string[]; // Multiple stores for MERCHANT or roaming staff
  status: 'ACTIVE' | 'SUSPENDED';
  pinCode: string;
  password?: string;
  avatar: string;
  lastLogin?: number;
  permissions: string[];

  // Enterprise Employee Information (企业员工档案)
  employeeNumber?: string;   // 工号 / Employee ID (e.g. "EMP-DANUBE-001")
  email?: string;            // 电子邮箱
  phone?: string;            // 电话
  position?: string;         // 职位 (e.g. "资深店长", "金牌调饮师", "收银组长", "后厨主厨")
  department?: string;       // 部门 (e.g. "门店运营部", "前厅吧台部", "后厨研发部", "仓储供应链", "总部管理部")
  locationName?: string;     // 工作地点 / 门店描述 (e.g. "巴黎香榭丽舍旗舰店")
  hireDate?: string;         // 入职日期 (YYYY-MM-DD)
  emergencyContact?: {       // 紧急联系人
    name: string;
    phone: string;
    relationship?: string;
  };
  availability?: string;     // 排班可用性 (e.g. "全职 (早晚班轮换)", "兼职 (周末晚班)", "弹性排班")
  skills?: string[];         // 技能特长 (e.g. ["意式咖啡拉花", "手打鲜果茶", "收银POS对账", "后厨温控炸制", "英/法/德三语接待"])
  certifications?: string[]; // 资格证书 (e.g. ["欧盟食品安全卫生证 HACCP Level 2", "SCA 初级咖啡师认证", "急救员证书 First Aid", "捷克卫生从业证"])
}

export type SaaSPlanType = 'SINGLE' | 'CHAIN' | 'FLAGSHIP' | 'STANDARD' | 'PRO' | 'ENTERPRISE';

export interface SaaSPlanInfo {
  code: SaaSPlanType;
  name: string;
  badge: string;
  maxStores: number;
  description: string;
  tagClass: string;
}

export const SAAS_PLANS: Record<string, SaaSPlanInfo> = {
  SINGLE: {
    code: 'SINGLE',
    name: '单店版',
    badge: '单店版 (上限1家)',
    maxStores: 1,
    description: '标准单店 SaaS 方案，支持 1 家独立门店实体',
    tagClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  },
  STANDARD: {
    code: 'STANDARD',
    name: '单店版',
    badge: '单店版 (上限1家)',
    maxStores: 1,
    description: '标准单店 SaaS 方案，支持 1 家独立门店实体',
    tagClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  },
  CHAIN: {
    code: 'CHAIN',
    name: '连锁版',
    badge: '连锁版 (上限10家)',
    maxStores: 10,
    description: '多门店连锁 SaaS 方案，支持最多 10 家门店实体',
    tagClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60',
  },
  PRO: {
    code: 'PRO',
    name: '连锁版',
    badge: '连锁版 (上限10家)',
    maxStores: 10,
    description: '多门店连锁 SaaS 方案，支持最多 10 家门店实体',
    tagClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60',
  },
  FLAGSHIP: {
    code: 'FLAGSHIP',
    name: '旗舰版',
    badge: '旗舰版 (无限制)',
    maxStores: Infinity,
    description: '跨国集团旗舰 SaaS 方案，门店数量无限制',
    tagClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60',
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    name: '旗舰版',
    badge: '旗舰版 (无限制)',
    maxStores: Infinity,
    description: '跨国集团旗舰 SaaS 方案，门店数量无限制',
    tagClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60',
  },
};

export function getSaaSPlanInfo(plan?: string): SaaSPlanInfo {
  const normalized = (plan || 'SINGLE').toUpperCase();
  return SAAS_PLANS[normalized] || SAAS_PLANS.SINGLE;
}

// Merchant Account Model (商家账户)
export interface MerchantAccount {
  id: string;
  name: string;               // 商家企业/品牌名称
  brandCode: string;          // 品牌专属唯一代码 (e.g. "danube", "sakura", "alps", "oriental")
  subdomain: string;          // 品牌专属二级子域名 (e.g. "danube.pos.com", "sakura.pos.com")
  contactPerson: string;      // 联系人姓名
  email: string;              // 登录邮箱/账号
  phone: string;              // 联系电话
  status: 'ACTIVE' | 'SUSPENDED';
  assignedStoreIds: string[]; // 分配给该商家的门店ID列表
  plan: SaaSPlanType;
  customDomain?: string;      // 商家独立前端域名 (e.g. "order.danubefoods.eu" 或 "pos.sakuraramen.at")
  logoIcon?: string;          // 图标标识 (CupSoda, Flame, Coffee, Leaf, Utensils)
  tagline?: string;           // 品牌标语/简介
  themeColor?: 'amber' | 'rose' | 'emerald' | 'indigo' | 'zinc' | 'orange'; // 品牌专属配色
  createdAt: number;
  notes?: string;
  totalRevenue?: number;      // 累计营收

  // 商家企业法定身份与注册信息 (Legal & Fiscal Entity)
  legalCompanyName?: string;  // 法定注册公司全称 (如 Danube European Hospitality s.r.o.)
  registeredAddress?: string; // 公司法定注册地址 (如 Václavské náměstí 846/1, 110 00 Praha 1)
  ico?: string;               // 捷克/欧洲企业统一编号 (IČO: 8位数字)
  dic?: string;               // 增值税税号 (DIČ: 如 CZ29482019)
  vatPayer?: boolean;         // 是否为增值税纳税人 (Plátce DPH)
  courtRegistry?: string;     // 法院商业登记号 (如 Městský soud v Praze, oddíl C, vložka 386291)
}

export interface StorePaymentGateways {
  stripeEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  cardTerminalEnabled: boolean;
  qrPayEnabled: boolean;
  applePayEnabled: boolean;
  googlePayEnabled: boolean;
  adyenEnabled?: boolean;
  paypalEnabled?: boolean;
  vivaWalletEnabled?: boolean;
}

export type StoreStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'OPEN' | 'CLOSED' | 'MAINTENANCE';

// Store Entity Model (门店实体 - 捷克与欧洲门店独立配置)
export interface StoreEntity {
  id: string;
  merchantId: string;         // 所属商家账户ID（创建后永久锁定，不可变更归属）
  merchantName?: string;      // 所属商家名称
  storeName: string;          // 店铺名称
  currency: CurrencyCode;     // 结算币种 (CZK 捷克克朗 / EUR 欧元)
  currencySymbol: string;     // 符号 (Kč, €)
  address: string;            // 物理营业地址 (Provozovna / Address)
  operatingHours: string;     // 营业时间 (如 09:30 - 22:30，非必填默认)
  phone: string;              // 门店电话 (非必填默认)
  status: StoreStatus;        // 门店生命周期状态：DRAFT(草稿，可改可删，商家可核对) | ACTIVE(正式生效不可删只能停用) | SUSPENDED(已停用)
  customDomain?: string;      // 门店独立点餐专属域名/子域名 (e.g. "prague-main.danubefoods.cz")
  createdAt: number;
  publishedAt?: number;       // 正式发布时间
  allowCurrencyChange?: boolean;

  // 门店法定经营场所与税务登记 (Store Fiscal & Legal Overrides)
  legalCompanyName?: string;  // 独立营业法人公司名 (若为空则继承所属商家法定名)
  registeredAddress?: string; // 法人注册地址 (若为空则继承商家注册地址)
  ico?: string;               // 门店统一企业编号 (IČO)
  dic?: string;               // 门店增值税号 (DIČ)
  premisesId?: string;        // 税务登记营业场所编号 (Číslo provozovny, 如 101)
  cashRegisterId?: string;    // 税务收银机编号 (Číslo pokladny, 如 POS-ONLINE-01)
  courtRegistry?: string;     // 商事登记卷号

  // 门店独立/隔离的支付网关配置 (Per-Store Isolated Payment Gateways)
  stripeConfig?: StripeGatewayConfig;
  paymentGateways?: StorePaymentGateways;

  // 门店独立/隔离的捷克 EET 2.0 国家财政税控网关 (Per-Store Isolated Fiscal Gateway)
  eet2Config?: EET2GatewayConfig;
}

export interface MenuCategory {
  id: string;
  storeId?: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

// Inventory / Raw Material (食材库存)
export type InventoryCategory = 'TEA' | 'DAIRY' | 'FRUIT' | 'MEAT' | 'SNACK' | 'PACKAGING' | 'SAUCE';

export interface InventoryItem {
  id: string;
  storeId: string;
  name: string;
  category: InventoryCategory;
  categoryName: string;
  currentStock: number;
  unit: string;
  minThreshold: number; // 安全库存报警阈值
  costPerUnit: number;
  lastUpdated: number;
  status: 'SUFFICIENT' | 'LOW' | 'CRITICAL';
}

export interface InventoryLog {
  id: string;
  storeId: string;
  itemId: string;
  itemName: string;
  type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
  quantityDelta: number;
  balance: number;
  operator: string;
  timestamp: number;
  notes?: string;
}

// =============================================================
// 集体采购预留：商家食材消耗量与采购价数据采集模型
// (Collective Procurement / Group Purchasing Intelligence Models)
// =============================================================
export type TelemetrySource = 
  | 'POS_RECIPE_DEDUCTION'     // POS销售自动配方核销消耗
  | 'STORE_STOCKTAKE'          // 门店定期盘点出库台账
  | 'SUPPLIER_INVOICE_SYNC'    // 供货商发票/进货采购单同步
  | 'MANUAL_TELEMETRY';        // 管理员或店长数据补录

export interface IngredientProcurementRecord {
  id: string;
  merchantId: string;
  merchantName: string;
  storeId: string;
  storeName: string;
  ingredientId: string;
  ingredientName: string;
  category: InventoryCategory;
  categoryName: string;
  unit: string;                     // 计量单位 (kg, L, 块, 箱, 包, 根, etc.)
  consumedQuantity: number;         // 统计周期内消耗总量
  consumedPeriod: string;           // 消耗周期标签 (如 '2026-08 (本月)', '近30天')
  purchasePrice: number;            // 商家当前采购单价
  currency: CurrencyCode;           // 货币代码 (CZK / EUR)
  supplierName?: string;            // 当前供货商/采购来源渠道
  benchmarkMarketPrice?: number;    // 市场常规批发基准单价 (用于评估差价)
  lastReportedAt: number;           // 采集时间戳
  reportingSource: TelemetrySource; // 采集来源
}

export interface CollectivePurchasingPoolItem {
  ingredientId: string;
  ingredientName: string;
  category: InventoryCategory;
  categoryName: string;
  unit: string;
  currency: CurrencyCode;
  participatingMerchantsCount: number; // 消耗此食材的商家总数
  participatingStoresCount: number;    // 消耗此食材的门店总数
  totalConsumedVolume: number;         // 全网全平台月度总消耗量
  avgPurchasePrice: number;            // 全网平均采购单价
  minPurchasePrice: number;            // 全网最低采购单价
  maxPurchasePrice: number;            // 全网最高采购单价
  priceSpreadPct: number;              // 差价浮动率 (%)
  targetGroupBuyPrice: number;         // 预估集采/厂家直采协议批发单价
  projectedSavingsPct: number;         // 预估集体采购降本幅度 (%)
  projectedMonthlySavings: number;     // 预计全网月度节省总金额
  merchantBreakdown: Array<{
    merchantId: string;
    merchantName: string;
    storeId?: string;
    storeName?: string;
    consumedVolume: number;
    purchasePrice: number;
    supplierName?: string;
    reportingSource: TelemetrySource;
    lastReportedAt: number;
  }>;
}

export interface CollectiveProcurementSummary {
  totalMonitoredIngredients: number;      // 监控食材种类数
  totalParticipatingMerchants: number;    // 参与数据采集商家数
  totalParticipatingStores: number;       // 覆盖门店数
  totalMonthlyConsumptionSpend: number;   // 全网月度食材采购总支出 (以EUR折算或基准币种)
  totalEstimatedSavingsAmount: number;    // 预估集体采购月度可节省总金额
  avgSavingsPercentage: number;           // 预估全网平均集采降本率 (%)
  topHighSpreadIngredients: CollectivePurchasingPoolItem[]; // 差价最大、集采价值最高的食材
}

// ==========================================
// 捷克国家财政税控 EET 2.0 (Elektronická evidence tržeb 2.0)
// ==========================================
export type EET2Mode = 'SANDBOX' | 'PRODUCTION';

export interface EET2GatewayConfig {
  enabled: boolean;
  mode: EET2Mode;
  endpointUrl: string;           // 财政部 API 端点 (沙盒/生产)
  ico: string;                   // 企业统一编号
  dic: string;                   // 增值税号 (DIČ poplatníka)
  premisesId: string;            // 场所编号 (Číslo provozovny)
  cashRegisterId: string;        // 收银设备编号 (Označení pokladního zařízení)
  certFileName: string;          // X.509 证书文件名
  certPassword?: string;         // 证书访问密钥
  certFingerprint: string;       // 证书指纹 (SHA-256)
  timeoutMs: number;             // API 超时毫秒数 (法定默认 2000ms)
  autoFallbackToPkp: boolean;    // 超时时是否自动降级为离线签名 (PKP)
  offlineRetentionHours: number; // 离线缓存在线补报时限 (法定 48小时)
  lastPingLatencyMs?: number;
  lastPingStatus?: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastPingTime?: number;
  totalFiscalizedCount?: number; // 累计开具并上报笔数
  totalFiscalizedAmount?: number;// 累计上报总金额 (CZK)
}

export interface EET2FiscalPayload {
  orderId: string;
  orderNo: string;
  dic: string;
  premisesId: string;
  cashRegisterId: string;
  docNumber: string;
  issuedAt: string;
  totalAmount: number;
  currency: string;
  vatBase12: number;
  vatAmount12: number;
  vatBase21?: number;
  vatAmount21?: number;
  isTest: boolean;
}

export interface EET2FiscalResult {
  success: boolean;
  isOffline: boolean;
  fik?: string;                  // Fiskální identifikační kód (财政部在线防伪码)
  bkp: string;                   // Bezpečnostní kód poplatníka (纳税人安全码)
  pkp?: string;                  // Podpisový kód poplatníka (离线备用签名码)
  verificationUrl: string;       // e-Účtenka / 官方查验网址
  receiptDocNo: string;
  latencyMs: number;
  timestamp: number;
  serverMessage?: string;
}

// Stripe Payment Gateway Configuration (Stripe 支付网关配置)
export interface StripeGatewayConfig {
  enabled: boolean;
  mode: 'test' | 'live' | 'TEST' | 'LIVE';
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  merchantDisplayName?: string;
  statementDescriptor?: string;
  currency?: CurrencyCode | string;
  allowApplePayGooglePay?: boolean;
  enableApplePay?: boolean;
  enableGooglePay?: boolean;
  enableIdeal?: boolean;
  enableBancontact?: boolean;
  enableSepaDebit?: boolean;
  enableKlarna?: boolean;
  captureMethod?: 'AUTOMATIC' | 'MANUAL';
  enable3DSecureTest?: boolean;
  supportedCurrencies?: CurrencyCode[];
  lastPingLatencyMs?: number;
  lastPingStatus?: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastPingTime?: number;
  updatedAt?: number;
  updatedBy?: string;
}

