import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { STORE_CONFIG, KDS_STATIONS, MODIFIER_GROUPS, INITIAL_PRODUCTS } from './src/data/menuData';
import { INITIAL_CATEGORIES, INITIAL_STAFF_USERS, PERMISSION_DEFINITIONS, INITIAL_STRIPE_CONFIG } from './src/data/adminData';
import { INITIAL_MERCHANTS, INITIAL_STORES } from './src/data/merchantStoreData';
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_LOGS } from './src/data/inventoryData';
import { INITIAL_PROCUREMENT_RECORDS, calculateCollectivePurchasingPool } from './src/data/procurementData';
import { 
  OrderMaster, 
  OrderItem, 
  SelectedModifier, 
  QueueSummary, 
  MenuCategory, 
  StaffUser, 
  ProductSKU, 
  MerchantAccount, 
  StoreEntity, 
  InventoryItem, 
  InventoryLog,
  CurrencyCode,
  StripeGatewayConfig,
  EET2GatewayConfig,
  IngredientProcurementRecord,
  CollectivePurchasingPoolItem,
} from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-Memory Database & State Management
let dailySequenceCount = 0;
let soldOutSkuIds = new Set<string>();
let productsDb: ProductSKU[] = [...INITIAL_PRODUCTS];
let categoriesDb: MenuCategory[] = [...INITIAL_CATEGORIES];
let staffUsersDb: StaffUser[] = [...INITIAL_STAFF_USERS];
let merchantsDb: MerchantAccount[] = [...INITIAL_MERCHANTS];
let storesDb: StoreEntity[] = [...INITIAL_STORES];
let inventoryDb: InventoryItem[] = [...INITIAL_INVENTORY_ITEMS];
let inventoryLogsDb: InventoryLog[] = [...INITIAL_INVENTORY_LOGS];
let procurementRecordsDb: IngredientProcurementRecord[] = [...INITIAL_PROCUREMENT_RECORDS];
let currentStoreConfig = { ...STORE_CONFIG };
let stripeConfigDb: StripeGatewayConfig = { ...INITIAL_STRIPE_CONFIG };

// Helper to calculate daily pickup code
function generatePickupCode(channel: string = 'QR_H5'): string {
  dailySequenceCount += 1;
  const prefix = channel === 'DELIVERY_AGGREGATOR' ? 'B' : channel === 'COUNTER_POS' ? 'C' : 'A';
  const numStr = dailySequenceCount.toString().padStart(3, '0');
  return `${prefix}${numStr}`;
}

// Generate realistic initial seed orders across stores
function generateSeedOrders(): OrderMaster[] {
  const seedList: OrderMaster[] = [];
  const baseTime = Date.now() - 4 * 3600 * 1000; // Today starting 4 hours ago

  const sampleStores = [
    { storeId: 'store_paris_01', merchantId: 'merchant_danube', cur: 'EUR', sym: '€', name: '巴黎旗舰店' },
    { storeId: 'store_berlin_01', merchantId: 'merchant_danube', cur: 'EUR', sym: '€', name: '柏林自营店' },
    { storeId: 'store_prague_01', merchantId: 'merchant_danube', cur: 'CZK', sym: 'Kč', name: '布拉格概念店' },
    { storeId: 'store_vienna_01', merchantId: 'merchant_sakura', cur: 'EUR', sym: '€', name: '维也纳金色大厅店' },
    { storeId: 'store_munich_01', merchantId: 'merchant_sakura', cur: 'EUR', sym: '€', name: '慕尼黑总店' },
  ];

  let counter = 1;
  sampleStores.forEach((st, sIdx) => {
    // 3 to 4 orders per store
    const numOrders = 4;
    for (let i = 0; i < numOrders; i++) {
      const orderTime = baseTime + (sIdx * 30 + i * 25) * 60 * 1000;
      const isPos = i % 2 === 0;
      const isCash = isPos && (i % 4 === 0);
      const isCompleted = i < 2;
      const isReady = i === 2;
      const isMaking = i === 3;

      const codePrefix = isPos ? 'C' : 'A';
      const pickupCode = `${codePrefix}${counter.toString().padStart(3, '0')}`;
      counter++;

      const isCzk = st.cur === 'CZK';
      const item1Price = isCzk ? 135 : 6.8;
      const item2Price = isCzk ? 185 : 9.5;
      const totalAmount = (i % 2 === 0) ? item1Price : Number((item1Price + item2Price).toFixed(2));

      const items: OrderItem[] = [
        {
          itemId: `seed_item_${sIdx}_${i}_1`,
          orderId: `ord_seed_${st.storeId}_${i}`,
          skuId: 'sku_milk_tea_01',
          productName: '多瑙大红袍鲜奶茶 (Dahonpao Fresh Milk Tea)',
          category: '招牌鲜奶茶',
          quantity: 1,
          unitPrice: item1Price,
          totalPrice: item1Price,
          targetStationId: 'station_bar',
          selectedModifiers: [
            { groupId: 'mod_sweetness', groupName: '甜度', itemId: 'sweet_70', itemName: '七分甜 (70%)', price: 0 },
            { groupId: 'mod_ice', groupName: '冰温', itemId: 'ice_less', itemName: '少冰 (Less Ice)', price: 0 }
          ],
          stationStatus: isCompleted ? 'DONE' : isReady ? 'DONE' : 'MAKING',
          prepTimeSeconds: 60,
          notes: '去冰，多加珍珠'
        }
      ];

      if (i % 2 !== 0) {
        items.push({
          itemId: `seed_item_${sIdx}_${i}_2`,
          orderId: `ord_seed_${st.storeId}_${i}`,
          skuId: 'sku_burger_01',
          productName: '安格斯黑椒手打牛肉汉堡 (Angus Beef Burger)',
          category: '现烤手工汉堡',
          quantity: 1,
          unitPrice: item2Price,
          totalPrice: item2Price,
          targetStationId: 'station_grill',
          selectedModifiers: [],
          stationStatus: isCompleted ? 'DONE' : 'PENDING',
          prepTimeSeconds: 180,
          notes: '不要酸黄瓜'
        });
      }

      const seedOrder: OrderMaster = {
        id: `ord_seed_${st.storeId}_${i}`,
        storeId: st.storeId,
        merchantId: st.merchantId,
        orderNo: `ORD-${st.cur}-${new Date(orderTime).toISOString().slice(0, 10).replace(/-/g, '')}-${counter.toString().padStart(4, '0')}`,
        pickupCode,
        channel: isPos ? 'COUNTER_POS' : 'QR_H5',
        status: isCompleted ? 'COMPLETED' : isReady ? 'READY' : isMaking ? 'MAKING' : 'PENDING',
        paymentStatus: 'PAID',
        paymentMethod: isCash ? 'CASH' : isPos ? 'POS_CARD' : 'STRIPE_CARD',
        currency: st.cur as any,
        currencySymbol: st.sym,
        totalAmount,
        itemsCount: items.length,
        items,
        customerPhoneMasked: `+33 6 ** ** ${10 + i}${20 + sIdx}`,
        notes: isPos ? '前台现场极速出单' : '顾客手机扫码下单',
        createdAt: orderTime,
        paidAt: orderTime + 15000,
        readyAt: isCompleted || isReady ? orderTime + 300000 : undefined,
        completedAt: isCompleted ? orderTime + 420000 : undefined,
        estimatedWaitMinutes: isCompleted ? 0 : 5,
        queuePosition: isCompleted ? 0 : (i + 1),
      };

      if (st.cur === 'CZK') {
        seedOrder.eet2Fiscal = {
          fik: `ff38a291-8c4b-4a77-99ea-eet2mock-${counter.toString().padStart(4, '0')}-01`,
          bkp: 'A48F921B-44D9C810-77BE2019-33FA8810-A48F921B',
          pkp: 'dGVzdFBrcFNpZ25hdHVyZUZvckVldDJDemVjaEZpc2NhbA==',
          vatRateStandard: 21,
          vatRateReduced: 12,
          vatAmount: Number((totalAmount * 0.12).toFixed(2)),
          taxableBaseAmount: Number((totalAmount * 0.88).toFixed(2)),
          fiscalMode: 'SANDBOX',
          fiscalizedAt: orderTime + 2000,
          eetStatus: 'FISCALIZED_ONLINE',
          receiptQrPayload: `https://adisspr.mfcr.cz/dpr/eet?fik=ff38a291-8c4b-4a77-99ea-eet2mock-${counter.toString().padStart(4, '0')}-01&bkp=A48F921B-44D9C810-77BE2019-33FA8810-A48F921B`,
          printedCount: 1,
        };
      }

      seedList.push(seedOrder);
    }
  });

  return seedList;
}

let ordersDb: OrderMaster[] = generateSeedOrders();

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastWSEvent(type: string, payload: any) {
  const message = JSON.stringify({
    type,
    payload,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  });
}

wss.on('connection', (ws) => {
  const summary = calculateQueueSummary();
  ws.send(JSON.stringify({
    type: 'QUEUE_UPDATE',
    payload: summary,
    timestamp: Date.now()
  }));
});

function calculateQueueSummary(): QueueSummary {
  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING');
  const readyOrders = ordersDb.filter(o => o.status === 'READY');
  const completedToday = ordersDb.filter(o => o.status === 'COMPLETED').length;

  let totalWaitingItems = 0;
  activeOrders.forEach(o => {
    o.items.forEach(i => {
      if (i.stationStatus !== 'DONE') totalWaitingItems += i.quantity;
    });
  });

  const callingCodes = readyOrders.map(o => o.pickupCode);

  return {
    waitingCups: totalWaitingItems,
    makingOrdersCount: activeOrders.length,
    readyOrdersCount: readyOrders.length,
    completedTodayCount: completedToday,
    avgWaitTimeMinutes: Math.max(3, Math.ceil(totalWaitingItems * 1.8)),
    currentCallingCodes: callingCodes,
  };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Get Store Menu & Metadata (Store Isolated)
app.get('/api/menu', (req, res) => {
  const storeId = (req.query.storeId as string) || currentStoreConfig.storeId || 'store_default_01';
  
  // Filter products by storeId or default
  const storeProducts = productsDb.filter(p => !p.storeId || p.storeId === storeId);
  const storeCategories = categoriesDb.filter(c => !c.storeId || c.storeId === storeId);

  const productsWithStatus = storeProducts.map(p => ({
    ...p,
    isSoldOut: soldOutSkuIds.has(p.id)
  }));

  const categoriesWithCounts = storeCategories.map(c => ({
    ...c,
    productCount: storeProducts.filter(p => p.category === c.name).length
  }));

  const targetStore = storesDb.find(s => s.id === storeId) || storesDb[0];

  res.json({
    store: {
      ...currentStoreConfig,
      storeId: targetStore ? targetStore.id : storeId,
      storeName: targetStore ? targetStore.storeName : currentStoreConfig.storeName,
      currency: targetStore ? targetStore.currency : 'EUR',
      defaultCurrency: targetStore ? targetStore.currencySymbol : '€',
      address: targetStore ? targetStore.address : currentStoreConfig.address,
    },
    stations: KDS_STATIONS,
    modifierGroups: MODIFIER_GROUPS,
    categories: categoriesWithCounts,
    products: productsWithStatus,
    queue: calculateQueueSummary(),
  });
});

// -------------------------------------------------------------
// SaaS Vendor: Merchant Management Endpoints
// -------------------------------------------------------------
app.get('/api/admin/merchants', (req, res) => {
  // Calculate dynamic revenue for merchants based on their assigned stores
  const merchantsWithStats = merchantsDb.map(m => {
    const assignedStores = storesDb.filter(s => m.assignedStoreIds.includes(s.id));
    const storeOrders = ordersDb.filter(o => m.assignedStoreIds.includes(o.storeId) && o.paymentStatus === 'PAID');
    const totalRev = storeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      ...m,
      assignedStoresCount: m.assignedStoreIds.length,
      assignedStoresList: assignedStores,
      totalOrdersCount: storeOrders.length,
      calculatedRevenue: totalRev,
    };
  });
  res.json({ merchants: merchantsWithStats });
});

app.post('/api/admin/merchants', (req, res) => {
  try {
    const { 
      name, 
      contactPerson, 
      email, 
      phone, 
      plan = 'STANDARD', 
      notes = '', 
      customDomain = '', 
      assignedStoreIds = [],
      legalCompanyName = '',
      registeredAddress = '',
      ico = '',
      dic = '',
      vatPayer = true,
      courtRegistry = '',
    } = req.body;
    if (!name || !contactPerson || !email) {
      return res.status(400).json({ error: 'Name, contact person and email are required' });
    }

    const brandCode = (req.body.brandCode || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || `brand${Date.now().toString().slice(-4)}`);
    const subdomain = (req.body.subdomain || `${brandCode}.pos.com`).toLowerCase().trim();

    const newMerchant: MerchantAccount = {
      id: `merchant_${Date.now()}`,
      name: name.trim(),
      brandCode,
      subdomain,
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      status: 'ACTIVE',
      assignedStoreIds: Array.isArray(assignedStoreIds) ? assignedStoreIds : [],
      plan,
      customDomain: (customDomain || '').trim(),
      createdAt: Date.now(),
      notes,
      totalRevenue: 0,
      legalCompanyName: (legalCompanyName || '').trim() || (name.trim() + ' s.r.o.'),
      registeredAddress: (registeredAddress || '').trim(),
      ico: (ico || '').trim(),
      dic: (dic || '').trim(),
      vatPayer: Boolean(vatPayer),
      courtRegistry: (courtRegistry || '').trim(),
    };

    merchantsDb.unshift(newMerchant);

    // Update stores assigned to this merchant
    if (newMerchant.assignedStoreIds.length > 0) {
      storesDb.forEach(s => {
        if (newMerchant.assignedStoreIds.includes(s.id)) {
          s.merchantId = newMerchant.id;
          s.merchantName = newMerchant.name;
        }
      });
    }

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, merchant: newMerchant, merchants: merchantsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/merchants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const merchant = merchantsDb.find(m => m.id === id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    const { 
      name, 
      contactPerson, 
      email, 
      phone, 
      status, 
      plan, 
      notes, 
      customDomain, 
      assignedStoreIds,
      legalCompanyName,
      registeredAddress,
      ico,
      dic,
      vatPayer,
      courtRegistry,
    } = req.body;
    if (name !== undefined) merchant.name = name.trim();
    if (contactPerson !== undefined) merchant.contactPerson = contactPerson.trim();
    if (email !== undefined) merchant.email = email.trim();
    if (phone !== undefined) merchant.phone = phone.trim();
    if (status !== undefined) merchant.status = status;
    if (plan !== undefined) merchant.plan = plan;
    if (notes !== undefined) merchant.notes = notes;
    if (customDomain !== undefined) merchant.customDomain = customDomain.trim();
    if (legalCompanyName !== undefined) merchant.legalCompanyName = legalCompanyName.trim();
    if (registeredAddress !== undefined) merchant.registeredAddress = registeredAddress.trim();
    if (ico !== undefined) merchant.ico = ico.trim();
    if (dic !== undefined) merchant.dic = dic.trim();
    if (vatPayer !== undefined) merchant.vatPayer = Boolean(vatPayer);
    if (courtRegistry !== undefined) merchant.courtRegistry = courtRegistry.trim();

    if (assignedStoreIds !== undefined && Array.isArray(assignedStoreIds)) {
      merchant.assignedStoreIds = assignedStoreIds;
      // Sync store links
      storesDb.forEach(s => {
        if (assignedStoreIds.includes(s.id)) {
          s.merchantId = merchant.id;
          s.merchantName = merchant.name;
        } else if (s.merchantId === merchant.id) {
          // Unassigned
          s.merchantId = '';
          s.merchantName = '未分配商家';
        }
      });
    }

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, merchant, merchants: merchantsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/merchants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const merchant = merchantsDb.find(m => m.id === id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    // 财税合规与审计规范：客户/商户签约信息不可物理删除，仅可进行停用/冻结操作
    merchant.status = 'SUSPENDED';

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({
      success: true,
      message: '客户信息受财税合规与审计规范约束不可物理删除，已自动切换为【已停用】状态',
      merchant,
      merchants: merchantsDb,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SaaS Vendor: Store Management & Lifecycle Endpoints
// -------------------------------------------------------------
app.get('/api/admin/stores', (req, res) => {
  const storesWithStats = storesDb.map(s => {
    const merchant = merchantsDb.find(m => m.id === s.merchantId);
    const storeOrders = ordersDb.filter(o => o.storeId === s.id && o.paymentStatus === 'PAID');
    const totalRev = storeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      ...s,
      merchantName: merchant ? merchant.name : (s.merchantName || '未分配商家'),
      totalOrdersCount: storeOrders.length,
      totalRevenue: totalRev,
    };
  });
  res.json({ stores: storesWithStats });
});

app.post('/api/admin/stores', (req, res) => {
  try {
    const { 
      storeName, 
      currency = 'EUR', 
      address = '', 
      phone = '', 
      operatingHours = '09:00 - 22:30', 
      merchantId = '', 
      customDomain = '',
      legalCompanyName = '',
      registeredAddress = '',
      ico = '',
      dic = '',
      premisesId = '',
      cashRegisterId = '',
      courtRegistry = '',
      stripeConfig,
      paymentGateways,
      eet2Config,
    } = req.body;
    if (!storeName || !storeName.trim()) {
      return res.status(400).json({ error: 'Store name is required (店铺名称为必填项)' });
    }
    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant ID is required (创建店铺必须指定归属的商家账号，创建后归属不可更改)' });
    }

    const currencySymbols: Record<CurrencyCode, string> = {
      CZK: 'Kč',
      EUR: '€',
    };

    const assignedMerchant = merchantsDb.find(m => m.id === merchantId);
    if (!assignedMerchant) {
      return res.status(400).json({ error: 'Selected merchant account does not exist' });
    }

    // Check SaaS subscription plan store quota limit
    // 单店版只能有 1 个店铺；连锁版 10 个；旗舰版店铺数量无限制
    const currentMerchantStores = storesDb.filter(
      s => s.merchantId === assignedMerchant.id || (assignedMerchant.assignedStoreIds && assignedMerchant.assignedStoreIds.includes(s.id))
    );
    const plan = (assignedMerchant.plan || 'SINGLE').toUpperCase();
    let maxStores = 1;
    let planLabel = '单店版 (上限1家)';
    if (plan === 'FLAGSHIP' || plan === 'ENTERPRISE') {
      maxStores = Infinity;
      planLabel = '旗舰版 (无限制)';
    } else if (plan === 'CHAIN' || plan === 'PRO') {
      maxStores = 10;
      planLabel = '连锁版 (上限10家)';
    }

    if (currentMerchantStores.length >= maxStores) {
      return res.status(400).json({
        error: `创建失败：该商家当前签约为【${planLabel}】，已达到店铺配额上限 (${currentMerchantStores.length}/${maxStores})。如需增设更多门店，请先升级为【连锁版】或【旗舰版】。`,
      });
    }

    // 门店创建生命周期：Super Admin 创建初版，状态初始为 DRAFT (草稿)，可改可删，商家可检查核对
    const newStore: StoreEntity = {
      id: `store_${Date.now()}`,
      merchantId: assignedMerchant.id, // 店铺归属不可更改：创建时从哪个商家账号创建就永久归属该商家
      merchantName: assignedMerchant.name,
      storeName: storeName.trim(),
      currency: currency as CurrencyCode,
      currencySymbol: currencySymbols[currency as CurrencyCode] || '€',
      address: address.trim() || `${assignedMerchant.registeredAddress || '欧洲物理营业地址'}`,
      phone: phone.trim() || assignedMerchant.phone || '',
      operatingHours: operatingHours.trim() || '09:00 - 22:30',
      status: 'DRAFT', // 初始为草稿状态
      customDomain: (customDomain || '').trim(),
      createdAt: Date.now(),
      legalCompanyName: (legalCompanyName || '').trim() || (assignedMerchant?.legalCompanyName || ''),
      registeredAddress: (registeredAddress || '').trim() || (assignedMerchant?.registeredAddress || ''),
      ico: (ico || '').trim() || (assignedMerchant?.ico || ''),
      dic: (dic || '').trim() || (assignedMerchant?.dic || ''),
      premisesId: (premisesId || '').trim() || '101',
      cashRegisterId: (cashRegisterId || '').trim() || 'POS-ONLINE-01',
      courtRegistry: (courtRegistry || '').trim() || (assignedMerchant?.courtRegistry || ''),
      allowCurrencyChange: false,
      stripeConfig: stripeConfig || {
        enabled: true,
        mode: 'TEST',
        publishableKey: `pk_test_${Date.now()}`,
        secretKey: 'sk_test_••••••••',
        currency: currency as CurrencyCode,
        statementDescriptor: storeName.trim().slice(0, 22).toUpperCase(),
        enableApplePay: true,
        enableGooglePay: true,
        captureMethod: 'AUTOMATIC',
      },
      paymentGateways: paymentGateways || {
        stripeEnabled: true,
        cashOnDeliveryEnabled: true,
        cardTerminalEnabled: true,
        qrPayEnabled: true,
        applePayEnabled: true,
        googlePayEnabled: true,
        paypalEnabled: true,
      },
      eet2Config: eet2Config || {
        enabled: currency === 'CZK',
        mode: 'SANDBOX',
        endpointUrl: 'https://pg.eet.gov.cz/v2/soap/EETServiceSOAP',
        ico: (ico || assignedMerchant?.ico || '29482019').trim(),
        dic: (dic || assignedMerchant?.dic || 'CZ29482019').trim(),
        premisesId: (premisesId || '101').trim(),
        cashRegisterId: (cashRegisterId || 'POS-ONLINE-01').trim(),
        certFileName: `EET_CA3_Store_${Date.now().toString().slice(-4)}.p12`,
        certPassword: '••••••••',
        certFingerprint: '7A:9F:88:2E:3D:5C:1B:44:E0:9A:88:F2:71:39:AA:88:02:11:7C:E5',
        timeoutMs: 2000,
        autoFallbackToPkp: true,
        offlineRetentionHours: 48,
        totalFiscalizedCount: 0,
        totalFiscalizedAmount: 0,
      },
    };

    storesDb.push(newStore);

    if (!assignedMerchant.assignedStoreIds.includes(newStore.id)) {
      assignedMerchant.assignedStoreIds.push(newStore.id);
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    res.json({ success: true, store: newStore, stores: storesDb, message: '门店草稿已成功创建，等待商家核对或 Super Admin 正式发布' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/stores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const store = storesDb.find(s => s.id === id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const { 
      storeName, 
      currency, 
      address, 
      phone, 
      operatingHours, 
      status, 
      action,
      allowCurrencyChange,
      customDomain,
      legalCompanyName,
      registeredAddress,
      ico,
      dic,
      premisesId,
      cashRegisterId,
      courtRegistry,
      stripeConfig,
      paymentGateways,
      eet2Config,
    } = req.body;

    // 1. 正式创建/发布动作 (DRAFT -> ACTIVE)
    if (action === 'PUBLISH' || (store.status === 'DRAFT' && status === 'ACTIVE')) {
      store.status = 'ACTIVE';
      store.publishedAt = Date.now();
    } else if (status !== undefined) {
      // 2. 正式生效后只能进行停用 (SUSPENDED) 或启用 (ACTIVE / OPEN)
      if (store.status !== 'DRAFT') {
        if (status === 'SUSPENDED' || status === 'ACTIVE' || status === 'OPEN' || status === 'CLOSED' || status === 'MAINTENANCE') {
          store.status = status;
        }
      } else {
        store.status = status;
      }
    }

    // 3. 基础信息修改
    if (storeName !== undefined) store.storeName = storeName.trim();
    if (address !== undefined) store.address = address.trim();
    if (phone !== undefined) store.phone = phone.trim();
    if (operatingHours !== undefined) store.operatingHours = operatingHours.trim();

    // 4. 结算币种 (CZK & EUR)
    if (currency !== undefined) {
      store.currency = currency as CurrencyCode;
      store.currencySymbol = currency === 'CZK' ? 'Kč' : '€';
    }

    // 5. 店铺归属不可更改：如果传了 merchantId，忽略或保持原归属 (创建时归哪个商家就永久归哪个商家)
    // （严格不更改 store.merchantId）

    if (customDomain !== undefined) store.customDomain = customDomain.trim();
    if (legalCompanyName !== undefined) store.legalCompanyName = legalCompanyName.trim();
    if (registeredAddress !== undefined) store.registeredAddress = registeredAddress.trim();
    if (ico !== undefined) store.ico = ico.trim();
    if (dic !== undefined) store.dic = dic.trim();
    if (premisesId !== undefined) store.premisesId = premisesId.trim();
    if (cashRegisterId !== undefined) store.cashRegisterId = cashRegisterId.trim();
    if (courtRegistry !== undefined) store.courtRegistry = courtRegistry.trim();
    if (stripeConfig !== undefined) store.stripeConfig = stripeConfig;
    if (paymentGateways !== undefined) store.paymentGateways = paymentGateways;
    if (eet2Config !== undefined) store.eet2Config = eet2Config;

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    res.json({ success: true, store, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除店铺端点 (严格遵从合规与草稿生命周期：草稿可删除；正式门店不可删除，只能停用)
app.delete('/api/admin/stores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const storeIndex = storesDb.findIndex(s => s.id === id);
    if (storeIndex === -1) return res.status(404).json({ error: 'Store not found' });

    const targetStore = storesDb[storeIndex];

    // 规则：只有 DRAFT (草稿) 状态的店铺允许物理删除；正式店铺不可删除，只能停用
    if (targetStore.status === 'DRAFT') {
      const removedStore = storesDb.splice(storeIndex, 1)[0];
      
      // 从所属商家的 assignedStoreIds 中移除
      const merchant = merchantsDb.find(m => m.id === removedStore.merchantId);
      if (merchant && Array.isArray(merchant.assignedStoreIds)) {
        merchant.assignedStoreIds = merchant.assignedStoreIds.filter(sid => sid !== id);
      }

      broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
      return res.json({ 
        success: true, 
        message: `草稿门店【${removedStore.storeName}】已成功删除`,
        stores: storesDb 
      });
    }

    // 正式门店不可删除
    return res.status(400).json({ 
      error: `正式门店【${targetStore.storeName}】已正式生效，受欧洲跨国财税与多租户合规审计保护，不可删除！如需停止运营，请将其状态变更为【已停用】。` 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Domain Routing / Tenant Resolution by Domain / Hostname
app.get('/api/tenant/resolve', (req, res) => {
  const host = (req.query.host as string) || req.headers.host || '';
  const cleanHost = host.split(':')[0].toLowerCase().trim();

  // 0. Check for Super Admin Platform Portal (admin.pos.com or platform.pos.com or admin)
  if (cleanHost === 'admin.pos.com' || cleanHost === 'platform.pos.com' || cleanHost === 'admin') {
    const adminStaff = staffUsersDb.filter(u => u.role === 'SUPER_ADMIN');
    return res.json({
      matched: true,
      type: 'SUPER_ADMIN',
      brandCode: 'admin',
      subdomain: 'admin.pos.com',
      name: 'SaaS 平台超级运营中枢',
      tagline: '全平台跨商户·跨国门店舰队与系统调度中心',
      stores: storesDb,
      staffCount: adminStaff.length,
      host: cleanHost,
    });
  }

  // 1. Check if matches a merchant subdomain (e.g. danube.pos.com, sakura.pos.com, alps.pos.com) or brandCode
  const matchedMerchant = merchantsDb.find(
    m => (m.subdomain && m.subdomain.toLowerCase() === cleanHost) ||
         (m.brandCode && (cleanHost === `${m.brandCode.toLowerCase()}.pos.com` || cleanHost === m.brandCode.toLowerCase())) ||
         (m.customDomain && m.customDomain.toLowerCase() === cleanHost)
  );
  if (matchedMerchant) {
    const merchantStores = storesDb.filter(s => matchedMerchant.assignedStoreIds?.includes(s.id) || s.merchantId === matchedMerchant.id);
    const merchantStaff = staffUsersDb.filter(u => u.merchantId === matchedMerchant.id || u.brandCode === matchedMerchant.brandCode);
    return res.json({
      matched: true,
      type: 'MERCHANT',
      brandCode: matchedMerchant.brandCode,
      subdomain: matchedMerchant.subdomain || `${matchedMerchant.brandCode}.pos.com`,
      merchant: matchedMerchant,
      stores: merchantStores,
      staffCount: merchantStaff.length,
      defaultStore: merchantStores[0] || null,
      host: cleanHost,
    });
  }

  // 2. Check if matches a store custom domain directly
  const matchedStore = storesDb.find(
    s => s.customDomain && s.customDomain.toLowerCase() === cleanHost
  );
  if (matchedStore) {
    const merchant = merchantsDb.find(m => m.id === matchedStore.merchantId);
    return res.json({
      matched: true,
      type: 'STORE',
      store: matchedStore,
      merchant: merchant || null,
      host: cleanHost,
    });
  }

  // 3. Fallback default
  res.json({
    matched: false,
    type: 'DEFAULT',
    defaultStore: storesDb[0] || null,
    host: cleanHost,
  });
});

app.post('/api/admin/stores/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { merchantId } = req.body;
    const store = storesDb.find(s => s.id === id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Remove from old
    if (store.merchantId) {
      const oldMerchant = merchantsDb.find(m => m.id === store.merchantId);
      if (oldMerchant) {
        oldMerchant.assignedStoreIds = oldMerchant.assignedStoreIds.filter(sid => sid !== store.id);
      }
    }

    store.merchantId = merchantId || '';
    const newMerchant = merchantsDb.find(m => m.id === merchantId);
    if (newMerchant) {
      store.merchantName = newMerchant.name;
      if (!newMerchant.assignedStoreIds.includes(store.id)) {
        newMerchant.assignedStoreIds.push(store.id);
      }
    } else {
      store.merchantName = '未分配商家';
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, store, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/stores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const storeIdx = storesDb.findIndex(s => s.id === id);
    if (storeIdx === -1) return res.status(404).json({ error: 'Store not found' });

    const [deleted] = storesDb.splice(storeIdx, 1);
    // Unassign from merchant
    if (deleted.merchantId) {
      const merchant = merchantsDb.find(m => m.id === deleted.merchantId);
      if (merchant) {
        merchant.assignedStoreIds = merchant.assignedStoreIds.filter(sid => sid !== id);
      }
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, deleted, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Store Manager: Ingredient Raw Material Inventory Endpoints
// -------------------------------------------------------------
app.get('/api/admin/inventory', (req, res) => {
  const { storeId } = req.query;
  let items = [...inventoryDb];
  if (storeId) {
    items = items.filter(i => i.storeId === storeId);
  }
  res.json({ inventory: items, logs: inventoryLogsDb.slice(0, 50) });
});

app.post('/api/admin/inventory/adjust', (req, res) => {
  try {
    const { itemId, type, delta = 0, targetBalance, operator = '店长', notes = '' } = req.body;
    const item = inventoryDb.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    const numDelta = Number(delta);
    let oldBalance = item.currentStock;
    let newBalance = oldBalance;

    if (type === 'RESTOCK') {
      newBalance = oldBalance + Math.abs(numDelta);
    } else if (type === 'CONSUME' || type === 'WASTE') {
      newBalance = Math.max(0, oldBalance - Math.abs(numDelta));
    } else if (type === 'CALIBRATE' && targetBalance !== undefined) {
      newBalance = Number(targetBalance);
    }

    item.currentStock = Number(newBalance.toFixed(2));
    item.lastUpdated = Date.now();

    // Recalculate status
    if (item.currentStock <= item.minThreshold * 0.5) {
      item.status = 'CRITICAL';
    } else if (item.currentStock <= item.minThreshold) {
      item.status = 'LOW';
    } else {
      item.status = 'SUFFICIENT';
    }

    const log: InventoryLog = {
      id: `log_${Date.now()}`,
      storeId: item.storeId,
      itemId: item.id,
      itemName: item.name,
      type,
      quantityDelta: Number((newBalance - oldBalance).toFixed(2)),
      balance: item.currentStock,
      operator,
      timestamp: Date.now(),
      notes,
    };

    inventoryLogsDb.unshift(log);

    broadcastWSEvent('INVENTORY_UPDATED', { inventory: inventoryDb, latestLog: log });
    res.json({ success: true, item, log, inventory: inventoryDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/inventory/create', (req, res) => {
  try {
    const { storeId = 'store_bratislava_01', name, category = 'TEA', categoryName = '茶底原叶', currentStock = 10, unit = 'kg', minThreshold = 5, costPerUnit = 20 } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      storeId,
      name: name.trim(),
      category,
      categoryName,
      currentStock: Number(currentStock),
      unit,
      minThreshold: Number(minThreshold),
      costPerUnit: Number(costPerUnit),
      lastUpdated: Date.now(),
      status: Number(currentStock) <= Number(minThreshold) ? 'LOW' : 'SUFFICIENT',
    };

    inventoryDb.unshift(newItem);
    broadcastWSEvent('INVENTORY_UPDATED', { inventory: inventoryDb });
    res.json({ success: true, item: newItem, inventory: inventoryDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 集体采购预留：商家食材消耗量与采购价数据采集中心 API (Admin Collective Procurement Hub)
// -------------------------------------------------------------

// 1. 获取全平台食材集采聚合看板概览 (Overview & Aggregates)
app.get('/api/admin/collective-procurement/overview', (req, res) => {
  try {
    const { poolItems, summary } = calculateCollectivePurchasingPool(procurementRecordsDb);
    res.json({
      success: true,
      summary,
      poolItems,
      totalRecordsCount: procurementRecordsDb.length,
      lastUpdatedAt: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 获取按食材聚合的集采池清单 (Group Purchasing Pool Items)
app.get('/api/admin/collective-procurement/pool', (req, res) => {
  try {
    const { category, search } = req.query;
    let { poolItems } = calculateCollectivePurchasingPool(procurementRecordsDb);

    if (category && category !== 'ALL') {
      poolItems = poolItems.filter(item => item.category === category);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      poolItems = poolItems.filter(item => 
        item.ingredientName.toLowerCase().includes(q) || 
        item.categoryName.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      poolItems,
      count: poolItems.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 获取各商家的食材消耗与进货价原始台账 (Raw Merchant Procurement Records)
app.get('/api/admin/collective-procurement/records', (req, res) => {
  try {
    const { merchantId, storeId, category, ingredientId, search } = req.query;
    let records = [...procurementRecordsDb];

    if (merchantId && merchantId !== 'ALL') {
      records = records.filter(r => r.merchantId === merchantId);
    }
    if (storeId && storeId !== 'ALL') {
      records = records.filter(r => r.storeId === storeId);
    }
    if (category && category !== 'ALL') {
      records = records.filter(r => r.category === category);
    }
    if (ingredientId) {
      records = records.filter(r => r.ingredientId === ingredientId);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter(r => 
        r.ingredientName.toLowerCase().includes(q) ||
        r.merchantName.toLowerCase().includes(q) ||
        r.storeName.toLowerCase().includes(q) ||
        (r.supplierName && r.supplierName.toLowerCase().includes(q))
      );
    }

    // Sort by latest reported first
    records.sort((a, b) => b.lastReportedAt - a.lastReportedAt);

    res.json({
      success: true,
      records,
      total: records.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 数据采集上报 / 补录接口 (Ingest Ingredient Consumption & Purchase Price Telemetry)
app.post('/api/admin/collective-procurement/ingest', (req, res) => {
  try {
    const {
      merchantId,
      storeId,
      ingredientName,
      category = 'TEA',
      categoryName = '茶底原叶',
      unit = 'kg',
      consumedQuantity = 100,
      consumedPeriod = '2026-08 (本月)',
      purchasePrice = 10.0,
      currency = 'EUR',
      supplierName = '自采供货商',
      benchmarkMarketPrice,
      reportingSource = 'MANUAL_TELEMETRY',
    } = req.body;

    if (!ingredientName || !ingredientName.trim()) {
      return res.status(400).json({ error: '食材名称为必填项 (Ingredient Name is required)' });
    }

    const targetMerchant = merchantsDb.find(m => m.id === merchantId) || merchantsDb[0];
    const targetStore = storesDb.find(s => s.id === storeId) || storesDb[0];

    const slug = ingredientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const ingredientId = `ing_${slug}_${category.toLowerCase()}`;

    // Check if record for this merchant + store + ingredient already exists in current period
    const existingIndex = procurementRecordsDb.findIndex(
      r => r.merchantId === targetMerchant.id && 
           r.storeId === targetStore.id && 
           r.ingredientName.trim().toLowerCase() === ingredientName.trim().toLowerCase()
    );

    const priceNum = Number(purchasePrice);
    const qtyNum = Number(consumedQuantity);

    let createdOrUpdated: IngredientProcurementRecord;

    if (existingIndex !== -1) {
      // Update existing record
      procurementRecordsDb[existingIndex] = {
        ...procurementRecordsDb[existingIndex],
        consumedQuantity: qtyNum,
        purchasePrice: priceNum,
        currency: (currency as CurrencyCode) || 'EUR',
        supplierName: supplierName.trim(),
        benchmarkMarketPrice: benchmarkMarketPrice ? Number(benchmarkMarketPrice) : procurementRecordsDb[existingIndex].benchmarkMarketPrice,
        lastReportedAt: Date.now(),
        reportingSource: reportingSource || 'MANUAL_TELEMETRY',
      };
      createdOrUpdated = procurementRecordsDb[existingIndex];
    } else {
      // Create new record
      createdOrUpdated = {
        id: `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        merchantId: targetMerchant.id,
        merchantName: targetMerchant.name,
        storeId: targetStore.id,
        storeName: targetStore.storeName,
        ingredientId,
        ingredientName: ingredientName.trim(),
        category,
        categoryName,
        unit,
        consumedQuantity: qtyNum,
        consumedPeriod,
        purchasePrice: priceNum,
        currency: (currency as CurrencyCode) || 'EUR',
        supplierName: supplierName.trim(),
        benchmarkMarketPrice: benchmarkMarketPrice ? Number(benchmarkMarketPrice) : Number((priceNum * 1.1).toFixed(2)),
        lastReportedAt: Date.now(),
        reportingSource: reportingSource || 'MANUAL_TELEMETRY',
      };
      procurementRecordsDb.unshift(createdOrUpdated);
    }

    const pool = calculateCollectivePurchasingPool(procurementRecordsDb);

    broadcastWSEvent('PROCUREMENT_TELEMETRY_UPDATED', {
      record: createdOrUpdated,
      summary: pool.summary,
    });

    res.json({
      success: true,
      message: `已成功采集【${targetMerchant.name}】食材【${ingredientName}】的消耗量与进货单价`,
      record: createdOrUpdated,
      summary: pool.summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. 删除采集记录
app.delete('/api/admin/collective-procurement/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = procurementRecordsDb.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }
    const [deleted] = procurementRecordsDb.splice(idx, 1);
    const pool = calculateCollectivePurchasingPool(procurementRecordsDb);
    
    broadcastWSEvent('PROCUREMENT_TELEMETRY_UPDATED', {
      deletedId: id,
      summary: pool.summary,
    });

    res.json({ success: true, deleted, summary: pool.summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Merchant & Store Manager: Multi-dimension Analytics API
// -------------------------------------------------------------
app.get('/api/admin/analytics/sales', (req, res) => {
  const { storeId, merchantId, timeRange, startDate, endDate, category } = req.query;
  const now = new Date();
  const dayMs = 86400000;

  let filteredOrders = ordersDb.filter(o => o.paymentStatus === 'PAID');

  // 1. Filter by merchantId (if specified, filter orders from stores belonging to this merchant)
  if (merchantId && merchantId !== 'ALL') {
    const merchant = merchantsDb.find(m => m.id === merchantId);
    if (merchant && Array.isArray(merchant.assignedStoreIds)) {
      filteredOrders = filteredOrders.filter(o => merchant.assignedStoreIds.includes(o.storeId));
    } else {
      // Fallback: match store's merchantId
      const merchantStoreIds = storesDb.filter(s => s.merchantId === merchantId).map(s => s.id);
      filteredOrders = filteredOrders.filter(o => merchantStoreIds.includes(o.storeId));
    }
  }

  // 2. Filter by storeId
  if (storeId && storeId !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => o.storeId === storeId);
  }

  // 3. Filter by date range or preset (default to current month)
  if (startDate && endDate) {
    // Exact date range
    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= start.getTime() && o.createdAt <= end.getTime());
  } else if (timeRange === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfToday.getTime());
  } else if (timeRange === 'yesterday') {
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfYesterday.getTime() && o.createdAt <= endOfYesterday.getTime());
  } else if (timeRange === 'last7') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= Date.now() - 7 * dayMs);
  } else if (timeRange === 'last30') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= Date.now() - 30 * dayMs);
  } else if (timeRange === 'all') {
    // All history
  } else {
    // Default: Current month (当月 1 号 00:00 到当月末 23:59)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= firstDayOfMonth.getTime() && o.createdAt <= lastDayOfMonth.getTime());
  }

  // Aggregate Metrics
  let totalRevenue = 0;
  let cashIncome = 0;
  let cardIncome = 0;
  let totalItemsSold = 0;

  const productSalesMap: Record<string, {
    skuId: string;
    productName: string;
    category: string;
    volume: number;
    revenue: number;
  }> = {};

  // Hourly stats for today
  const hourlyOrders: Record<number, { hour: string; count: number; revenue: number }> = {};
  for (let h = 8; h <= 23; h++) {
    hourlyOrders[h] = { hour: `${h.toString().padStart(2, '0')}:00`, count: 0, revenue: 0 };
  }

  filteredOrders.forEach(ord => {
    totalRevenue += ord.totalAmount;
    if (ord.paymentMethod === 'CASH') {
      cashIncome += ord.totalAmount;
    } else {
      cardIncome += ord.totalAmount;
    }

    const orderHour = new Date(ord.createdAt).getHours();
    if (hourlyOrders[orderHour]) {
      hourlyOrders[orderHour].count += 1;
      hourlyOrders[orderHour].revenue += ord.totalAmount;
    }

    ord.items.forEach(item => {
      totalItemsSold += item.quantity;
      if (!productSalesMap[item.skuId]) {
        productSalesMap[item.skuId] = {
          skuId: item.skuId,
          productName: item.productName,
          category: item.category,
          volume: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.skuId].volume += item.quantity;
      productSalesMap[item.skuId].revenue += item.totalPrice;
    });
  });

  let productRankings = Object.values(productSalesMap);
  if (category && category !== 'ALL') {
    productRankings = productRankings.filter(p => p.category === category);
  }

  productRankings.sort((a, b) => b.volume - a.volume);

  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  res.json({
    metrics: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: filteredOrders.length,
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      cashIncome: Number(cashIncome.toFixed(2)),
      cardIncome: Number(cardIncome.toFixed(2)),
      totalItemsSold,
    },
    hourlyTrend: Object.values(hourlyOrders),
    productRankings,
  });
});

// Categories Management
app.get('/api/admin/categories', (req, res) => {
  const storeId = req.query.storeId as string;
  let filteredCategories = [...categoriesDb];
  if (storeId) {
    filteredCategories = filteredCategories.filter(c => !c.storeId || c.storeId === storeId);
  }
  const categoriesWithCounts = filteredCategories.map(c => ({
    ...c,
    productCount: productsDb.filter(p => p.category === c.name && (!storeId || !p.storeId || p.storeId === storeId)).length
  }));
  res.json({ categories: categoriesWithCounts });
});

app.post('/api/admin/categories', (req, res) => {
  try {
    const { name, icon = 'CupSoda', sortOrder = categoriesDb.length + 1, storeId = 'store_default_01' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCategory: MenuCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      storeId,
      name: name.trim(),
      icon,
      sortOrder: Number(sortOrder) || categoriesDb.length + 1,
      isActive: true,
      productCount: 0,
    };
    categoriesDb.push(newCategory);
    categoriesDb.sort((a, b) => a.sortOrder - b.sortOrder);

    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    res.json({ success: true, category: newCategory, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, sortOrder, isActive, storeId } = req.body;
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const oldName = cat.name;
    if (name !== undefined) cat.name = name.trim();
    if (icon !== undefined) cat.icon = icon;
    if (sortOrder !== undefined) cat.sortOrder = Number(sortOrder);
    if (isActive !== undefined) cat.isActive = Boolean(isActive);
    if (storeId !== undefined) cat.storeId = storeId;

    if (name && name.trim() !== oldName) {
      productsDb.forEach(p => {
        if (p.category === oldName && (!cat.storeId || !p.storeId || p.storeId === cat.storeId)) {
          p.category = name.trim();
        }
      });
    }

    categoriesDb.sort((a, b) => a.sortOrder - b.sortOrder);
    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, category: cat, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const catIndex = categoriesDb.findIndex(c => c.id === id);
    if (catIndex === -1) return res.status(404).json({ error: 'Category not found' });

    const [deleted] = categoriesDb.splice(catIndex, 1);
    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    res.json({ success: true, deleted, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products Management
app.get('/api/admin/products', (req, res) => {
  const storeId = req.query.storeId as string;
  let filtered = [...productsDb];
  if (storeId) {
    filtered = filtered.filter(p => !p.storeId || p.storeId === storeId);
  }
  res.json({ products: filtered });
});

app.post('/api/admin/products', (req, res) => {
  try {
    const { 
      name, 
      category, 
      basePrice, 
      targetStationId = 'station_bar', 
      prepTimeSeconds = 60, 
      image, 
      description, 
      isRecommended = false, 
      storeId = 'store_default_01',
      tags = [],
      recipeBOM = [] 
    } = req.body;

    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({ error: 'Name, category, and basePrice are required' });
    }

    // Calculate BOM cost & gross margin
    let estimatedCost = 0;
    if (Array.isArray(recipeBOM) && recipeBOM.length > 0) {
      recipeBOM.forEach((bom: any) => {
        const cost = (Number(bom.quantity) || 0) * (Number(bom.unitCost) || 0);
        estimatedCost += cost;
      });
    }
    const priceNum = Number(basePrice);
    const grossMargin = priceNum > 0 ? Number((((priceNum - estimatedCost) / priceNum) * 100).toFixed(1)) : 0;

    const newProduct: ProductSKU = {
      id: `sku_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      storeId,
      name: name.trim(),
      category: category.trim(),
      basePrice: priceNum,
      targetStationId,
      prepTimeSeconds: Number(prepTimeSeconds),
      image: image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: description || '',
      isRecommended: Boolean(isRecommended),
      tags,
      recipeBOM,
      estimatedCost: Number(estimatedCost.toFixed(3)),
      grossMargin,
    };

    productsDb.unshift(newProduct);
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, product: newProduct, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const prod = productsDb.find(p => p.id === id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const { name, category, basePrice, targetStationId, prepTimeSeconds, image, description, isRecommended, storeId, tags, recipeBOM } = req.body;
    if (name !== undefined) prod.name = name.trim();
    if (category !== undefined) prod.category = category.trim();
    if (basePrice !== undefined) prod.basePrice = Number(basePrice);
    if (targetStationId !== undefined) prod.targetStationId = targetStationId;
    if (prepTimeSeconds !== undefined) prod.prepTimeSeconds = Number(prepTimeSeconds);
    if (image !== undefined) prod.image = image;
    if (description !== undefined) prod.description = description;
    if (isRecommended !== undefined) prod.isRecommended = Boolean(isRecommended);
    if (storeId !== undefined) prod.storeId = storeId;
    if (tags !== undefined) prod.tags = tags;
    if (recipeBOM !== undefined) prod.recipeBOM = recipeBOM;

    // Recalculate cost & margin
    let estimatedCost = 0;
    if (Array.isArray(prod.recipeBOM) && prod.recipeBOM.length > 0) {
      prod.recipeBOM.forEach((bom: any) => {
        const cost = (Number(bom.quantity) || 0) * (Number(bom.unitCost) || 0);
        estimatedCost += cost;
      });
    }
    prod.estimatedCost = Number(estimatedCost.toFixed(3));
    prod.grossMargin = prod.basePrice > 0 ? Number((((prod.basePrice - estimatedCost) / prod.basePrice) * 100).toFixed(1)) : 0;

    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, product: prod, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = productsDb.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const [deleted] = productsDb.splice(idx, 1);
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, deleted, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff Management
const ROLE_LEVEL_WEIGHTS: Record<string, number> = {
  SUPER_ADMIN: 100,
  MERCHANT: 80,
  STORE_MANAGER: 60,
  CHEF: 20,
  CASHIER: 20,
  EXPO_PACKER: 20,
};

app.get('/api/admin/staff', (req, res) => {
  const { merchantId, brandCode, storeId, operatorRole, operatorId } = req.query;
  let list = [...staffUsersDb];

  // If operator details are provided, filter to strictly subordinate roles
  if (operatorRole && typeof operatorRole === 'string') {
    const opWeight = ROLE_LEVEL_WEIGHTS[operatorRole] ?? 0;
    if (operatorRole !== 'SUPER_ADMIN') {
      list = list.filter(u => {
        const uWeight = ROLE_LEVEL_WEIGHTS[u.role] ?? 0;
        // Strict lower privilege check and not self
        if (uWeight >= opWeight || u.id === operatorId) return false;
        return true;
      });
    }
  }

  if (merchantId && merchantId !== 'ALL') {
    list = list.filter(u => u.merchantId === merchantId);
  } else if (brandCode && brandCode !== 'ALL') {
    list = list.filter(u => u.brandCode === brandCode);
  }
  if (storeId && storeId !== 'ALL') {
    list = list.filter(u => u.storeId === storeId || (u.accessibleStoreIds && u.accessibleStoreIds.includes(storeId as string)));
  }
  res.json({
    staff: list,
    allStaff: staffUsersDb,
    permissions: PERMISSION_DEFINITIONS,
  });
});

app.post('/api/admin/staff', (req, res) => {
  try {
    const { 
      name, 
      username, 
      role = 'CASHIER', 
      pinCode = '1234', 
      permissions = [],
      merchantId,
      brandCode,
      storeId,
      accessibleStoreIds = [],
      employeeNumber,
      email = '',
      phone = '',
      position = '',
      department = '',
      locationName = '',
      hireDate = '',
      emergencyContact,
      availability = '全职 (全时段覆盖)',
      skills = [],
      certifications = [],
      avatar,
      status = 'ACTIVE',
      operatorRole,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '员工姓名 (Name) 为必填项' });
    }

    // Role hierarchy check if operatorRole is provided
    if (operatorRole && operatorRole !== 'SUPER_ADMIN') {
      const opWeight = ROLE_LEVEL_WEIGHTS[operatorRole] ?? 0;
      const targetWeight = ROLE_LEVEL_WEIGHTS[role] ?? 0;
      if (targetWeight >= opWeight) {
        return res.status(403).json({ error: `越权错误：当前身份 (${operatorRole}) 只能创建更低权限等级的账户` });
      }
    }

    // Default username if not provided
    const cleanUsername = (username && username.trim()) 
      ? username.trim() 
      : `staff_${Date.now().toString().slice(-4)}`;

    const effectiveMerchantId = merchantId || (req.body.merchant && req.body.merchant.id) || undefined;
    const targetStore = storeId ? storesDb.find(s => s.id === storeId) : null;
    const targetMerchant = targetStore 
      ? merchantsDb.find(m => m.id === targetStore.merchantId) 
      : (effectiveMerchantId ? merchantsDb.find(m => m.id === effectiveMerchantId) : null);
    const effectiveBrandCode = brandCode || (targetMerchant ? targetMerchant.brandCode : 'danube');

    const generatedEmpNum = employeeNumber && employeeNumber.trim() 
      ? employeeNumber.trim() 
      : `EMP-${(effectiveBrandCode || 'POS').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    const newStaff: StaffUser = {
      id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      username: cleanUsername,
      role: role || 'CASHIER',
      merchantId: effectiveMerchantId,
      brandCode: effectiveBrandCode,
      storeId: storeId || currentStoreConfig.storeId,
      accessibleStoreIds: Array.isArray(accessibleStoreIds) && accessibleStoreIds.length > 0 ? accessibleStoreIds : (storeId ? [storeId] : []),
      status: status || 'ACTIVE',
      pinCode: pinCode || '1234',
      avatar: avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      permissions: Array.isArray(permissions) ? permissions : [],
      employeeNumber: generatedEmpNum,
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      position: (position || '').trim() || '餐饮运营服务专员',
      department: (department || '').trim() || '门店运营部',
      locationName: (locationName || '').trim() || (targetStore ? targetStore.storeName : '旗舰店'),
      hireDate: hireDate || new Date().toISOString().slice(0, 10),
      emergencyContact: emergencyContact && emergencyContact.name ? emergencyContact : {
        name: '应急联系人',
        phone: '+33 6 00 00 00 00',
        relationship: '家属',
      },
      availability: availability || '全职 (常驻轮班)',
      skills: Array.isArray(skills) ? skills : (skills ? String(skills).split(/[,，、\n]+/).map(s => s.trim()).filter(Boolean) : ['POS收银', '餐品核验']),
      certifications: Array.isArray(certifications) ? certifications : (certifications ? String(certifications).split(/[,，、\n]+/).map(s => s.trim()).filter(Boolean) : ['食品安全卫生证']),
    };

    staffUsersDb.push(newStaff);
    broadcastWSEvent('STAFF_UPDATED', { staffList: staffUsersDb, newStaff });
    res.json({ success: true, staff: newStaff, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = staffUsersDb.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Staff user not found' });

    const { 
      name, 
      username, 
      role, 
      status, 
      pinCode, 
      permissions,
      storeId,
      accessibleStoreIds,
      employeeNumber,
      email,
      phone,
      position,
      department,
      locationName,
      hireDate,
      emergencyContact,
      availability,
      skills,
      certifications,
      avatar,
      operatorRole,
    } = req.body;

    // Hierarchy check: cannot update users of equal or higher level
    if (operatorRole && operatorRole !== 'SUPER_ADMIN') {
      const opWeight = ROLE_LEVEL_WEIGHTS[operatorRole] ?? 0;
      const targetWeight = ROLE_LEVEL_WEIGHTS[user.role] ?? 0;
      if (targetWeight >= opWeight) {
        return res.status(403).json({ error: `越权错误：无权修改同级或上级账户 (${user.name})` });
      }
      if (role && (ROLE_LEVEL_WEIGHTS[role] ?? 0) >= opWeight) {
        return res.status(403).json({ error: `越权错误：不能将员工角色提升为同级或更高权限 (${role})` });
      }
    }

    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username.trim();
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (pinCode !== undefined) user.pinCode = pinCode;
    if (permissions !== undefined) user.permissions = permissions;
    if (storeId !== undefined) user.storeId = storeId;
    if (accessibleStoreIds !== undefined) user.accessibleStoreIds = accessibleStoreIds;
    if (employeeNumber !== undefined) user.employeeNumber = employeeNumber.trim();
    if (email !== undefined) user.email = email.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (position !== undefined) user.position = position.trim();
    if (department !== undefined) user.department = department.trim();
    if (locationName !== undefined) user.locationName = locationName.trim();
    if (hireDate !== undefined) user.hireDate = hireDate;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (availability !== undefined) user.availability = availability;
    if (skills !== undefined) {
      user.skills = Array.isArray(skills) ? skills : String(skills).split(/[,，、\n]+/).map(s => s.trim()).filter(Boolean);
    }
    if (certifications !== undefined) {
      user.certifications = Array.isArray(certifications) ? certifications : String(certifications).split(/[,，、\n]+/).map(s => s.trim()).filter(Boolean);
    }
    if (avatar !== undefined) user.avatar = avatar;

    broadcastWSEvent('STAFF_UPDATED', { staffList: staffUsersDb, updatedStaff: user });
    res.json({ success: true, staff: user, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 重置密码 / PIN 码专门接口
app.post('/api/admin/staff/:id/reset-password', (req, res) => {
  try {
    const { id } = req.params;
    const user = staffUsersDb.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Staff user not found' });

    const operatorRole = req.body?.operatorRole || req.query?.operatorRole || (req.headers['x-operator-role'] as string);
    if (operatorRole && operatorRole !== 'SUPER_ADMIN') {
      const opWeight = ROLE_LEVEL_WEIGHTS[operatorRole] ?? 0;
      const targetWeight = ROLE_LEVEL_WEIGHTS[user.role] ?? 0;
      if (targetWeight >= opWeight) {
        return res.status(403).json({ error: `越权错误：无权重置同级或上级账户的登录 PIN 码` });
      }
    }

    const newPin = req.body.pinCode || Math.floor(1000 + Math.random() * 9000).toString();
    user.pinCode = newPin;

    broadcastWSEvent('STAFF_UPDATED', { staffList: staffUsersDb, updatedStaff: user });
    res.json({ 
      success: true, 
      message: `员工【${user.name}】的登录 PIN 码已重置为: ${newPin}`, 
      pinCode: newPin,
      staff: user 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = staffUsersDb.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Staff user not found' });

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: '禁止删除平台超级管理员账号' });
    }

    const operatorRole = req.body?.operatorRole || req.query?.operatorRole || (req.headers['x-operator-role'] as string);
    if (operatorRole && operatorRole !== 'SUPER_ADMIN') {
      const opWeight = ROLE_LEVEL_WEIGHTS[operatorRole] ?? 0;
      const targetWeight = ROLE_LEVEL_WEIGHTS[user.role] ?? 0;
      if (targetWeight >= opWeight) {
        return res.status(403).json({ error: `越权错误：无权删除同级或上级账户` });
      }
    }

    const idx = staffUsersDb.findIndex(u => u.id === id);
    const [deleted] = staffUsersDb.splice(idx, 1);
    broadcastWSEvent('STAFF_UPDATED', { staffList: staffUsersDb, deletedId: id });
    res.json({ success: true, deleted, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// H5 Pre-Order
app.post('/api/order/create', (req, res) => {
  try {
    const { items, customerPhone, notes, channel = 'QR_H5' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least 1 item' });
    }

    const now = Date.now();
    let calculatedTotal = 0;
    let totalItemsCount = 0;
    const orderItems: OrderItem[] = [];

    items.forEach((cartItem: any, idx: number) => {
      const sku = productsDb.find(p => p.id === (cartItem.skuId || cartItem.sku?.id)) || INITIAL_PRODUCTS[0];
      let itemUnitPrice = sku.basePrice;
      const selectedModifiers: SelectedModifier[] = [];

      if (cartItem.selectedModifiers && Array.isArray(cartItem.selectedModifiers)) {
        cartItem.selectedModifiers.forEach((mod: any) => {
          itemUnitPrice += Number(mod.price || 0);
          selectedModifiers.push({
            groupId: mod.groupId,
            groupName: mod.groupName,
            itemId: mod.itemId,
            itemName: mod.itemName,
            price: Number(mod.price || 0),
          });
        });
      }

      const itemTotalPrice = itemUnitPrice * cartItem.quantity;
      calculatedTotal += itemTotalPrice;
      totalItemsCount += cartItem.quantity;

      orderItems.push({
        itemId: `item_${now}_${idx}`,
        orderId: '',
        skuId: sku.id,
        productName: sku.name,
        category: sku.category,
        quantity: cartItem.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotalPrice,
        targetStationId: sku.targetStationId,
        selectedModifiers,
        stationStatus: 'PENDING',
        prepTimeSeconds: sku.prepTimeSeconds,
        notes: cartItem.notes || '',
      });
    });

    const orderId = `ord_${now}_${Math.floor(Math.random() * 1000)}`;
    orderItems.forEach(i => i.orderId = orderId);

    const newOrder: OrderMaster = {
      id: orderId,
      storeId: 'store_bratislava_01',
      merchantId: 'merchant_002',
      orderNo: 'ORD' + now,
      pickupCode: '',
      channel,
      status: 'UNPAID',
      paymentStatus: 'PENDING',
      paymentMethod: 'STRIPE_CARD',
      stripePaymentIntentId: `pi_mock_${now}_${Math.random().toString(36).substring(7)}`,
      currency: 'EUR',
      currencySymbol: '€',
      totalAmount: calculatedTotal,
      itemsCount: totalItemsCount,
      items: orderItems,
      customerPhoneMasked: customerPhone ? customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
      notes: notes || '',
      createdAt: now,
      estimatedWaitMinutes: Math.max(4, Math.ceil(totalItemsCount * 2)),
      queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
    };

    ordersDb.unshift(newOrder);

    res.json({
      success: true,
      order: newOrder,
      stripeClientSecret: `pi_secret_mock_${newOrder.stripePaymentIntentId}`,
      publishableKey: stripeConfigDb.publishableKey,
      stripeEnabled: stripeConfigDb.enabled,
      stripeMode: stripeConfigDb.mode,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Stripe Gateway Settings APIs (SaaS Admin & Merchant)
app.get('/api/admin/stripe-config', (req, res) => {
  res.json({
    success: true,
    config: stripeConfigDb,
  });
});

// =============================================================
// EET 2.0 捷克国家财政税控网关 (Elektronická evidence tržeb 2.0)
// =============================================================
let eet2ConfigDb: EET2GatewayConfig = {
  enabled: true,
  mode: 'SANDBOX',
  endpointUrl: 'https://pg.eet.gov.cz/v2/soap/EETServiceSOAP',
  ico: '29482019',
  dic: 'CZ29482019',
  premisesId: '101',
  cashRegisterId: 'POS-ONLINE-CZ01',
  certFileName: 'EET_CA3_Playground_CZ29482019.p12',
  certPassword: '••••••••',
  certFingerprint: '7A:9F:88:2E:3D:5C:1B:44:E0:9A:88:F2:71:39:AA:88:02:11:7C:E5',
  timeoutMs: 2000,
  autoFallbackToPkp: true,
  offlineRetentionHours: 48,
  lastPingLatencyMs: 42,
  lastPingStatus: 'ONLINE',
  lastPingTime: Date.now() - 1800000,
  totalFiscalizedCount: 184,
  totalFiscalizedAmount: 49820,
};

// Generate BKP (Bezpečnostní kód poplatníka) - 5x8 hex format
function generateEET2Bkp(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const hexPart = (Math.abs(hash).toString(16) + 'abcdef0123456789abcdef0123456789').toUpperCase();
  return [
    hexPart.substring(0, 8),
    hexPart.substring(8, 16),
    hexPart.substring(16, 24),
    hexPart.substring(24, 32),
    hexPart.substring(0, 8),
  ].join('-');
}

// Generate FIK (Fiskální identifikační kód) - 39 char standard UUID-ff
function generateEET2Fik(isTest: boolean): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  const prefix = isTest ? 'ff' : '01';
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}-${prefix}`;
}

// Generate PKP (Podpisový kód poplatníka) for offline fallback
function generateEET2Pkp(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '=';
}

app.get('/api/admin/fiscal/eet2-config', (req, res) => {
  res.json({
    success: true,
    config: eet2ConfigDb,
  });
});

app.post('/api/admin/fiscal/eet2-config', (req, res) => {
  try {
    const updates = req.body;
    eet2ConfigDb = {
      ...eet2ConfigDb,
      ...updates,
      lastPingTime: Date.now(),
    };
    broadcastWSEvent('EET2_CONFIG_UPDATED', eet2ConfigDb);
    res.json({ success: true, config: eet2ConfigDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update EET 2.0 configuration' });
  }
});

app.post('/api/fiscal/eet2/test-ping', (req, res) => {
  const { storeId, config: customConfig } = req.body || {};
  let targetConfig = { ...eet2ConfigDb };
  if (storeId) {
    const st = storesDb.find(s => s.id === storeId);
    if (st && st.eet2Config) targetConfig = { ...st.eet2Config };
  }
  if (customConfig) {
    targetConfig = { ...targetConfig, ...customConfig };
  }

  const isSandbox = targetConfig.mode === 'SANDBOX';
  const simulatedLatency = Math.floor(30 + Math.random() * 25);
  const now = Date.now();
  
  targetConfig.lastPingLatencyMs = simulatedLatency;
  targetConfig.lastPingStatus = 'ONLINE';
  targetConfig.lastPingTime = now;

  if (storeId) {
    const st = storesDb.find(s => s.id === storeId);
    if (st && st.eet2Config) {
      st.eet2Config.lastPingLatencyMs = simulatedLatency;
      st.eet2Config.lastPingStatus = 'ONLINE';
      st.eet2Config.lastPingTime = now;
    }
  }

  res.json({
    success: true,
    latencyMs: simulatedLatency,
    mode: targetConfig.mode,
    status: 'ONLINE',
    endpoint: targetConfig.endpointUrl,
    dic: targetConfig.dic,
    ico: targetConfig.ico,
    certFingerprint: targetConfig.certFingerprint,
    tlsVersion: 'TLS 1.3 / X.509 RSA-SHA256 Client Auth',
    serverTimestamp: new Date().toISOString(),
    message: isSandbox
      ? `捷克财政部 EET 2.0 沙盒网关握手成功 (DIČ: ${targetConfig.dic} / IČO: ${targetConfig.ico} - HTTP 200 OK)`
      : `捷克财政部 EET 2.0 生产环境官方税控网关握手认证通过 (DIČ: ${targetConfig.dic} - Live TLS 1.3)`,
  });
});

app.post('/api/fiscal/eet2/fiscalize', (req, res) => {
  try {
    const { storeId, orderId, totalAmount, docNumber, isOfflineForced = false, config: customConfig } = req.body;
    let targetConfig = { ...eet2ConfigDb };
    const targetStore = storesDb.find(s => s.id === storeId);
    if (targetStore && targetStore.eet2Config) {
      targetConfig = { ...targetStore.eet2Config };
    }
    if (customConfig) {
      targetConfig = { ...targetConfig, ...customConfig };
    }

    const isSandbox = targetConfig.mode === 'SANDBOX';
    const latency = Math.floor(35 + Math.random() * 25);
    const now = Date.now();

    const seed = `${targetConfig.dic}|${targetConfig.premisesId}|${targetConfig.cashRegisterId}|${docNumber || orderId}|${totalAmount}`;
    const bkp = generateEET2Bkp(seed);

    let isOffline = isOfflineForced;
    let fik: string | undefined = undefined;
    let pkp: string | undefined = undefined;

    if (isOffline) {
      pkp = generateEET2Pkp();
    } else {
      fik = generateEET2Fik(isSandbox);
    }

    const verificationUrl = `https://adisspr.mfcr.cz/dpr/eet/overeni?dic=${targetConfig.dic}&bkp=${bkp}&total=${totalAmount}`;

    if (targetStore && targetStore.eet2Config) {
      targetStore.eet2Config.totalFiscalizedCount = (targetStore.eet2Config.totalFiscalizedCount || 0) + 1;
      targetStore.eet2Config.totalFiscalizedAmount = (targetStore.eet2Config.totalFiscalizedAmount || 0) + Number(totalAmount || 0);
    } else {
      eet2ConfigDb.totalFiscalizedCount = (eet2ConfigDb.totalFiscalizedCount || 0) + 1;
      eet2ConfigDb.totalFiscalizedAmount = (eet2ConfigDb.totalFiscalizedAmount || 0) + Number(totalAmount || 0);
    }

    res.json({
      success: true,
      isOffline,
      fik,
      bkp,
      pkp,
      verificationUrl,
      receiptDocNo: docNumber || `DOK-${Date.now()}`,
      latencyMs: latency,
      timestamp: now,
      serverMessage: isOffline
        ? '已生成离线安全签名 (PKP)，需在48小时内通过 EET 2.0 网关完成在线补报'
        : `财政部税控系统认证成功 (FIK 已分配 · ${isSandbox ? '测试沙盒' : '正式税控'})`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'EET 2.0 Fiscalize failed' });
  }
});

app.post('/api/admin/stripe-config', (req, res) => {
  try {
    const { storeId, ...updates } = req.body;
    if (storeId) {
      const store = storesDb.find(s => s.id === storeId);
      if (store) {
        store.stripeConfig = {
          ...(store.stripeConfig || ({} as any)),
          ...updates,
        };
        broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
        return res.json({ success: true, config: store.stripeConfig, storeId });
      }
    }
    stripeConfigDb = {
      ...stripeConfigDb,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: req.body.operator || '超级管理员 (Super Admin)',
    };
    STORE_CONFIG.stripePublishableKey = stripeConfigDb.publishableKey;
    broadcastWSEvent('STRIPE_CONFIG_UPDATED', stripeConfigDb);
    res.json({ success: true, config: stripeConfigDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update Stripe configuration' });
  }
});

// Stripe Test Connection Ping
app.post('/api/stripe/test-ping', (req, res) => {
  const { storeId, config: customConfig } = req.body || {};
  let targetConfig: any = stripeConfigDb;
  if (storeId) {
    const st = storesDb.find(s => s.id === storeId);
    if (st && st.stripeConfig) targetConfig = st.stripeConfig;
  }
  if (customConfig) {
    targetConfig = { ...targetConfig, ...customConfig };
  }

  const isTest = (targetConfig.mode || 'TEST').toUpperCase() === 'TEST';
  const latency = Math.floor(22 + Math.random() * 25);
  const pubKey = targetConfig.publishableKey || 'pk_test_placeholder_key';
  
  res.json({
    success: true,
    latencyMs: latency,
    mode: targetConfig.mode || 'TEST',
    status: 'CONNECTED',
    publishableKeyMasked: pubKey.length > 16 ? pubKey.slice(0, 12) + '••••' + pubKey.slice(-4) : pubKey,
    merchantDisplayName: targetConfig.statementDescriptor || 'SEATLESS RESTAURANT',
    message: isTest
      ? 'Stripe 沙盒测试环境握手成功 (HTTP 200 OK - Test API Gateway)'
      : 'Stripe 生产环境在线网关认证成功 (HTTP 200 OK - Live API Gateway)',
  });
});

// Stripe Online Checkout & Charge Handler (Customer H5 & Online)
app.post('/api/stripe/charge', (req, res) => {
  try {
    const { orderId, paymentMethod = 'STRIPE_CARD', cardDetails = {} } = req.body;
    
    if (!stripeConfigDb.enabled) {
      return res.status(400).json({ error: 'Stripe 在线支付通道已暂停服务，请选择其他支付方式' });
    }

    const order = ordersDb.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: '找不到待支付订单' });

    if (order.status !== 'UNPAID' && order.paymentStatus === 'PAID') {
      return res.json({ success: true, order, message: '订单已支付完成' });
    }

    // Simulate test card error scenarios
    const cardNum = (cardDetails.cardNumber || cardDetails.last4 || '').replace(/[\s•]/g, '');
    if (cardNum.endsWith('0002') || cardDetails.simulatedTestScenario === 'insufficient_funds') {
      return res.status(402).json({ error: 'Your card has insufficient funds (Stripe Sandbox 模拟余额不足 402 Declined)' });
    }
    if (cardNum.endsWith('0127') || cardDetails.simulatedTestScenario === 'fraud_blocked') {
      return res.status(402).json({ error: 'Your card was declined due to high fraud risk (Stripe Radar 模拟风控拦截)' });
    }

    const now = Date.now();
    const pickupCode = generatePickupCode(order.channel);
    const chargeId = `ch_test_${now}_${Math.random().toString(36).slice(2, 9)}`;

    order.pickupCode = pickupCode;
    order.status = 'PENDING';
    order.paymentStatus = 'PAID';
    order.paidAt = now;
    order.paymentMethod = paymentMethod;

    order.items.forEach(item => {
      item.stationStatus = 'PENDING';
    });

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order,
      pickupCode,
      queue: queueSummary,
      chargeId,
    });

    res.json({
      success: true,
      order,
      chargeId,
      receiptUrl: `https://pay.stripe.com/receipts/test/${chargeId}`,
      timestamp: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Stripe 扣款处理失败' });
  }
});

// Stripe Webhook Simulator
app.post('/api/webhook/stripe', (req, res) => {
  try {
    const { orderId, paymentMethod = 'STRIPE_CARD' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);

    if (!order) return res.status(404).json({ error: 'Order not found for webhook' });

    if (order.status !== 'UNPAID' && order.paymentStatus === 'PAID') {
      return res.json({ message: 'Order already paid and routed', order });
    }

    const now = Date.now();
    const pickupCode = generatePickupCode(order.channel);

    order.pickupCode = pickupCode;
    order.status = 'PENDING';
    order.paymentStatus = 'PAID';
    order.paidAt = now;
    order.paymentMethod = paymentMethod;

    order.items.forEach(item => {
      item.stationStatus = 'PENDING';
    });

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order,
      pickupCode,
      queue: queueSummary,
    });

    res.json({
      success: true,
      orderId: order.id,
      pickupCode,
      status: order.status,
      timestamp: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Counter POS Checkout (Only CASH & POS_CARD supported, QR aggregated payments removed)
app.post('/api/counter/order/create-and-pay', (req, res) => {
  try {
    const { items, paymentMethod = 'CASH', cashDetails, cardDetails, customerPhone, notes, storeId = 'store_bratislava_01' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least 1 item' });
    }

    const targetStore = storesDb.find(s => s.id === storeId) || storesDb[0];

    const now = Date.now();
    let calculatedTotal = 0;
    let totalItemsCount = 0;
    const orderItems: OrderItem[] = [];

    items.forEach((cartItem: any, idx: number) => {
      const sku = productsDb.find(p => p.id === (cartItem.skuId || cartItem.sku?.id)) || INITIAL_PRODUCTS[0];
      let itemUnitPrice = sku.basePrice;
      const selectedModifiers: SelectedModifier[] = [];

      if (cartItem.selectedModifiers && Array.isArray(cartItem.selectedModifiers)) {
        cartItem.selectedModifiers.forEach((mod: any) => {
          itemUnitPrice += Number(mod.price || 0);
          selectedModifiers.push({
            groupId: mod.groupId,
            groupName: mod.groupName,
            itemId: mod.itemId,
            itemName: mod.itemName,
            price: Number(mod.price || 0),
          });
        });
      }

      const itemTotalPrice = itemUnitPrice * cartItem.quantity;
      calculatedTotal += itemTotalPrice;
      totalItemsCount += cartItem.quantity;

      orderItems.push({
        itemId: `item_${now}_pos_${idx}`,
        orderId: '',
        skuId: sku.id,
        productName: sku.name,
        category: sku.category,
        quantity: cartItem.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotalPrice,
        targetStationId: sku.targetStationId,
        selectedModifiers,
        stationStatus: 'PENDING',
        prepTimeSeconds: sku.prepTimeSeconds,
        notes: cartItem.notes || '',
      });
    });

    const orderId = `ord_pos_${now}_${Math.floor(Math.random() * 1000)}`;
    orderItems.forEach(i => i.orderId = orderId);

    const pickupCode = generatePickupCode('COUNTER_POS');

    const newOrder: OrderMaster = {
      id: orderId,
      storeId: targetStore.id,
      merchantId: targetStore.merchantId,
      orderNo: 'POS' + now,
      pickupCode,
      channel: 'COUNTER_POS',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod === 'POS_CARD' ? 'POS_CARD' : 'CASH',
      cashDetails: cashDetails || (paymentMethod === 'CASH' ? { receivedAmount: calculatedTotal, changeAmount: 0 } : undefined),
      cardDetails: cardDetails || (paymentMethod === 'POS_CARD' ? { cardLast4: '8899', authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}` } : undefined),
      currency: targetStore.currency,
      currencySymbol: targetStore.currencySymbol,
      totalAmount: Number(calculatedTotal.toFixed(2)),
      itemsCount: totalItemsCount,
      items: orderItems,
      customerPhoneMasked: customerPhone ? customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
      notes: notes || '',
      createdAt: now,
      paidAt: now,
      estimatedWaitMinutes: Math.max(3, Math.ceil(totalItemsCount * 2)),
      queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
    };

    ordersDb.unshift(newOrder);

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order: newOrder,
      pickupCode,
      queue: queueSummary,
    });

    res.json({
      success: true,
      order: newOrder,
      pickupCode,
      queue: queueSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Counter order creation failed' });
  }
});

// Orders List & Query
app.get('/api/orders', (req, res) => {
  const { status, pickupCode, storeId, storeIds, merchantId, limit = 200 } = req.query;
  let filtered = [...ordersDb];

  if (storeIds && typeof storeIds === 'string' && storeIds !== 'ALL') {
    const ids = storeIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      filtered = filtered.filter(o => ids.includes(o.storeId));
    }
  } else if (storeId && storeId !== 'ALL') {
    filtered = filtered.filter(o => o.storeId === storeId);
  }

  if (merchantId && merchantId !== 'ALL') {
    filtered = filtered.filter(o => o.merchantId === merchantId);
  }

  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  if (pickupCode) {
    filtered = filtered.filter(o => o.pickupCode === pickupCode);
  }

  res.json({
    orders: filtered.slice(0, Number(limit)),
    total: filtered.length,
    queue: calculateQueueSummary(),
  });
});

app.get('/api/order/:id', (req, res) => {
  const order = ordersDb.find(o => o.id === req.params.id || o.pickupCode === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING');
  const orderIndex = activeOrders.findIndex(o => o.id === order.id);
  const queuePos = orderIndex >= 0 ? orderIndex + 1 : 0;

  res.json({
    order: {
      ...order,
      queuePosition: queuePos,
    },
    queue: calculateQueueSummary(),
  });
});

// KDS Tasks & Operations
app.get('/api/kds/station/:stationId/tasks', (req, res) => {
  const { stationId } = req.params;
  const isExpo = stationId === 'station_expo';

  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING' || (isExpo && o.status === 'READY'));

  if (isExpo) {
    return res.json({
      stationId,
      stationName: '总控装配打包台 (Expo)',
      activeOrders: activeOrders.map(order => ({
        ...order,
        allItemsDone: order.items.every(i => i.stationStatus === 'DONE'),
      })),
      queue: calculateQueueSummary(),
    });
  }

  const stationTasks: { order: OrderMaster; item: OrderItem }[] = [];
  activeOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.targetStationId === stationId && item.stationStatus !== 'DONE') {
        stationTasks.push({ order, item });
      }
    });
  });

  res.json({
    stationId,
    tasks: stationTasks,
    queue: calculateQueueSummary(),
  });
});

app.post('/api/kds/task/bump', (req, res) => {
  try {
    const { orderId, itemId, stationId, action = 'BUMP_ITEM' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const now = Date.now();

    if (action === 'BUMP_ALL') {
      order.items.forEach(it => {
        it.stationStatus = 'DONE';
        it.completedAt = now;
      });
      order.status = 'READY';
      order.readyAt = now;
    } else if (itemId) {
      const item = order.items.find(i => i.itemId === itemId);
      if (item) {
        item.stationStatus = 'DONE';
        item.completedAt = now;
      }
      const allDone = order.items.every(i => i.stationStatus === 'DONE');
      if (allDone) {
        order.status = 'READY';
        order.readyAt = now;
      } else {
        order.status = 'MAKING';
      }
    }

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('TASK_BUMPED', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      status: order.status,
      queue: queueSummary,
    });

    if (order.status === 'READY') {
      broadcastWSEvent('ORDER_READY', {
        orderId: order.id,
        pickupCode: order.pickupCode,
        voiceText: `请 ${order.pickupCode} 号顾客到取餐口取餐`,
        queue: queueSummary,
      });
    }

    res.json({ success: true, order, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/expo/call', (req, res) => {
  try {
    const { orderId, pickupCode } = req.body;
    const order = ordersDb.find(o => o.id === orderId || o.pickupCode === pickupCode);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'READY';
    order.readyAt = Date.now();

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('ORDER_READY', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      voiceText: `请 ${order.pickupCode} 号顾客到取餐口取餐`,
      queue: queueSummary,
    });

    res.json({ success: true, pickupCode: order.pickupCode, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/order/complete', (req, res) => {
  try {
    const { pickupCode, orderId } = req.body;
    const order = ordersDb.find(o => (pickupCode && o.pickupCode === pickupCode) || (orderId && o.id === orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'COMPLETED';
    order.completedAt = Date.now();

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('ORDER_COMPLETED', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      queue: queueSummary,
    });

    res.json({ success: true, order, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/simulate/traffic', (req, res) => {
  try {
    const { count = 1 } = req.body;
    const now = Date.now();

    for (let c = 0; c < count; c++) {
      const pickupCode = generatePickupCode('QR_H5');
      const randomSku = productsDb[Math.floor(Math.random() * productsDb.length)] || INITIAL_PRODUCTS[0];

      const simOrder: OrderMaster = {
        id: `ord_sim_${now}_${c}`,
        storeId: 'store_bratislava_01',
        merchantId: 'merchant_002',
        orderNo: 'SIM' + (now + c),
        pickupCode,
        channel: 'QR_H5',
        status: 'PENDING',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE_CARD',
        currency: 'EUR',
        currencySymbol: '€',
        totalAmount: randomSku.basePrice,
        itemsCount: 1,
        items: [
          {
            itemId: `sim_item_${now}_${c}`,
            orderId: `ord_sim_${now}_${c}`,
            skuId: randomSku.id,
            productName: randomSku.name,
            category: randomSku.category,
            quantity: 1,
            unitPrice: randomSku.basePrice,
            totalPrice: randomSku.basePrice,
            targetStationId: randomSku.targetStationId,
            selectedModifiers: [],
            stationStatus: 'PENDING',
            prepTimeSeconds: randomSku.prepTimeSeconds,
          }
        ],
        createdAt: now,
        paidAt: now,
        estimatedWaitMinutes: 5,
        queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
      };

      ordersDb.unshift(simOrder);
    }

    const queueSummary = calculateQueueSummary();
    broadcastWSEvent('PAYMENT_CONFIRMED', { queue: queueSummary });

    res.json({ success: true, count, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/sku/soldout', (req, res) => {
  const { skuId, isSoldOut } = req.body;
  if (isSoldOut) {
    soldOutSkuIds.add(skuId);
  } else {
    soldOutSkuIds.delete(skuId);
  }
  broadcastWSEvent('ITEM_SOLDOUT_CHANGED', { skuId, isSoldOut });
  res.json({ success: true, skuId, isSoldOut });
});

// -------------------------------------------------------------
// System Architecture Spec & AI Master Prompt Specification
// -------------------------------------------------------------
app.get('/api/architecture/spec', (req, res) => {
  res.json({
    ddl: `-- MySQL 8.0 餐饮SaaS多租户核心表结构规范
CREATE TABLE \`tenant_merchants\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(128) NOT NULL,
  \`contact_person\` VARCHAR(64),
  \`email\` VARCHAR(128),
  \`phone\` VARCHAR(32),
  \`status\` ENUM('ACTIVE', 'SUSPENDED', 'PENDING') DEFAULT 'ACTIVE',
  \`plan_type\` ENUM('TRIAL', 'PRO', 'ENTERPRISE') DEFAULT 'PRO',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`tenant_stores\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`merchant_id\` VARCHAR(64) NOT NULL,
  \`store_name\` VARCHAR(128) NOT NULL,
  \`country\` VARCHAR(64) NOT NULL,
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'EUR',
  \`currency_symbol\` VARCHAR(8) NOT NULL DEFAULT '€',
  \`address\` VARCHAR(256),
  \`operating_hours\` VARCHAR(128),
  \`status\` ENUM('OPEN', 'BUSY', 'CLOSED') DEFAULT 'OPEN',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_merchant\` (\`merchant_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`orders_master\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`merchant_id\` VARCHAR(64),
  \`order_no\` VARCHAR(64) NOT NULL UNIQUE,
  \`pickup_code\` VARCHAR(16) NOT NULL,
  \`channel\` ENUM('QR_H5', 'COUNTER_POS', 'KIOSK', 'DELIVERY_AGGREGATOR') DEFAULT 'QR_H5',
  \`status\` ENUM('UNPAID', 'PENDING', 'MAKING', 'READY', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  \`payment_status\` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PAID',
  \`payment_method\` ENUM('CASH', 'POS_CARD', 'STRIPE_CARD', 'STRIPE_APPLE_PAY') DEFAULT 'STRIPE_CARD',
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'EUR',
  \`total_amount\` DECIMAL(10, 2) NOT NULL,
  \`items_count\` INT NOT NULL DEFAULT 1,
  \`created_at\` BIGINT NOT NULL,
  \`paid_at\` BIGINT,
  \`ready_at\` BIGINT,
  \`completed_at\` BIGINT,
  INDEX \`idx_store_created\` (\`store_id\`, \`created_at\`),
  INDEX \`idx_pickup_code\` (\`pickup_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`order_items\` (
  \`item_id\` VARCHAR(64) PRIMARY KEY,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`sku_id\` VARCHAR(64) NOT NULL,
  \`product_name\` VARCHAR(128) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(10, 2) NOT NULL,
  \`total_price\` DECIMAL(10, 2) NOT NULL,
  \`target_station_id\` VARCHAR(64) NOT NULL,
  \`selected_modifiers\` JSON,
  \`station_status\` ENUM('PENDING', 'MAKING', 'DONE') DEFAULT 'PENDING',
  \`prep_time_seconds\` INT DEFAULT 60,
  INDEX \`idx_order_id\` (\`order_id\`),
  INDEX \`idx_station\` (\`target_station_id\`, \`station_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    apiContract: [
      { method: 'POST', path: '/api/order/create', desc: '顾客手机H5扫码提交定制订单并初始化付款' },
      { method: 'POST', path: '/api/counter/order/create-and-pay', desc: '吧台POS操作员直接收银(现金/POS刷卡)即时出单' },
      { method: 'GET', path: '/api/orders', desc: '根据门店与状态筛选获取当前工单流水' },
      { method: 'POST', path: '/api/kds/task/bump', desc: 'KDS分工位触屏一键消单推进制作状态' },
      { method: 'POST', path: '/api/kds/expo/call', desc: 'Expo总控打包台齐套确认触发大屏叫号与语音TTS' },
      { method: 'POST', path: '/api/kds/order/complete', desc: '顾客取餐核销完成闭环' },
      { method: 'GET', path: '/api/admin/analytics/sales', desc: '商家与店长多维度营业额与商品销量统计分析' },
      { method: 'GET', path: '/api/admin/inventory', desc: '店长查询当前门店原料物料库存与预警台账' },
      { method: 'POST', path: '/api/admin/inventory/adjust', desc: '店长执行采购入库、制作消耗、损耗报废、盘点校准' }
    ],
    wsTopics: [
      { topic: 'ORDER_CREATED', desc: '新订单入库，通知所有终端' },
      { topic: 'PAYMENT_CONFIRMED', desc: '支付成功，KDS分站与排队引擎实时刷新' },
      { topic: 'STATION_TASK_BUMPED', desc: '分工位制作推进，Expo装配看板同步更新' },
      { topic: 'EXPO_ORDER_CALLED', desc: '总控齐套叫号，取餐大屏翻牌与TTS语音播报' },
      { topic: 'ORDER_COMPLETED', desc: '出餐核销，移出活动列表' },
      { topic: 'MERCHANTS_UPDATED', desc: '商家信息及门店管辖范围变动实时推送' },
      { topic: 'STORES_UPDATED', desc: '门店基础信息与法定币种配置变动实时推送' },
      { topic: 'INVENTORY_UPDATED', desc: '食材库存发生变动，即时同步店长端' }
    ]
  });
});

// Vite Middleware integration for SPA
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Seatless SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
