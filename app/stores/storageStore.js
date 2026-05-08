import { create } from 'zustand';
import { getFundCodesFromTagRecord } from '@/app/lib/fundHelpers';

/**
 * 签名函数：用于检测 funds 列表是否发生实质性变更（jzrq, dwjz 等核心字段）
 */
export const getFundCodesSignature = (value, extraFields = []) => {
  try {
    const list = Array.isArray(value) ? value : JSON.parse(value || '[]');
    if (!Array.isArray(list)) return '';
    const fields = Array.from(new Set([
      'jzrq',
      'dwjz',
      ...(Array.isArray(extraFields) ? extraFields : [])
    ]));
    const items = list.map((item) => {
      if (!item?.code) return null;
      const extras = fields.map((field) => item?.[field] ?? '').join(':');
      return `${item.code}:${extras}`;
    }).filter(Boolean);
    return Array.from(new Set(items)).join('|');
  } catch (e) {
    return '';
  }
};

/**
 * 签名函数：用于检测 tags 存储是否发生实质性变更
 */
export const getTagsStoreSignature = (value) => {
  try {
    const list = Array.isArray(value) ? value : JSON.parse(value || '[]');
    if (!Array.isArray(list)) return '';
    return list
      .map((r) => {
        const codes = getFundCodesFromTagRecord(r).sort().join(',');
        return `${codes}\u001e${String(r?.id ?? '').trim()}\u001e${String(r?.name ?? '').trim()}\u001e${String(r?.theme ?? '').trim()}`;
      })
      .sort()
      .join('|');
  } catch (e) {
    return '';
  }
};

/**
 * 仅以下 key 参与云端同步
 */
const SYNC_KEYS = new Set([
  'funds', 'tags', 'favorites', 'groups', 
  'collapsedCodes', 'collapsedTrends', 'collapsedEarnings', 
  'refreshMs', 'holdings', 'groupHoldings', 'pendingTrades', 
  'transactions', 'dcaPlans', 'customSettings', 'fundDailyEarnings'
]);

/**
 * 管理 localStorage 数据的 Zustand Store
 */
export const useStorageStore = create((set, get) => ({
  // 云端同步回调，由 Page 组件注入
  onSync: null,
  
  /** 注入同步回调 */
  setOnSync: (callback) => set({ onSync: callback }),

  funds: [],
  groups: [],
  favorites: new Set(),
  collapsedCodes: new Set(),
  collapsedTrends: new Set(),
  collapsedEarnings: new Set(),
  refreshMs: 30000,
  holdings: {},
  groupHoldings: {},
  pendingTrades: [],
  transactions: {},
  dcaPlans: {},
  customSettings: {},
  fundDailyEarnings: {},

  initFunds: () => {
    if (typeof window !== 'undefined') {
      set({ funds: get().getItem('funds', []) });
    }
  },

  initGroups: () => {
    if (typeof window !== 'undefined') {
      set({ groups: get().getItem('groups', []) });
    }
  },

  initFavorites: () => {
    if (typeof window !== 'undefined') {
      const saved = get().getItem('favorites', []);
      set({ favorites: new Set(Array.isArray(saved) ? saved : []) });
    }
  },

  initRefreshMs: () => {
    if (typeof window !== 'undefined') {
      const savedMs = parseInt(get().getItem('refreshMs', 30000), 10);
      set({ refreshMs: Number.isFinite(savedMs) && savedMs >= 5000 ? savedMs : 30000 });
    }
  },

  initHoldings: () => {
    if (typeof window !== 'undefined') {
      set({ holdings: get().getItem('holdings', {}) });
    }
  },

  initGroupHoldings: () => {
    if (typeof window !== 'undefined') {
      set({ groupHoldings: get().getItem('groupHoldings', {}) });
    }
  },

  initPendingTrades: () => {
    if (typeof window !== 'undefined') {
      set({ pendingTrades: get().getItem('pendingTrades', []) });
    }
  },

  initTransactions: () => {
    if (typeof window !== 'undefined') {
      set({ transactions: get().getItem('transactions', {}) });
    }
  },

  initDcaPlans: () => {
    if (typeof window !== 'undefined') {
      set({ dcaPlans: get().getItem('dcaPlans', {}) });
    }
  },

  initCustomSettings: () => {
    if (typeof window !== 'undefined') {
      set({ customSettings: get().getItem('customSettings', {}) });
    }
  },

  initFundDailyEarnings: () => {
    if (typeof window !== 'undefined') {
      const parsed = get().getItem('fundDailyEarnings', {});
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const values = Object.values(parsed);
        const hasScoped = values.some((v) => v && typeof v === 'object' && !Array.isArray(v));
        if (!hasScoped && Object.keys(parsed).length > 0) {
          // 迁移旧版扁平格式为 { "all": 原对象 }
          set({ fundDailyEarnings: { all: parsed } });
          return;
        }
      }
      set({ fundDailyEarnings: parsed });
    }
  },

  initCollapsed: () => {
    if (typeof window !== 'undefined') {
      const cc = get().getItem('collapsedCodes', []);
      const ct = get().getItem('collapsedTrends', []);
      const ce = get().getItem('collapsedEarnings', []);
      set({
        collapsedCodes: new Set(Array.isArray(cc) ? cc : []),
        collapsedTrends: new Set(Array.isArray(ct) ? ct : []),
        collapsedEarnings: new Set(Array.isArray(ce) ? ce : []),
      });
    }
  },

  setFunds: (nextFunds) => {
    const next = typeof nextFunds === 'function' ? nextFunds(get().funds) : nextFunds;
    set({ funds: next });
    get().setItem('funds', JSON.stringify(next));
  },

  setGroups: (nextGroups) => {
    const next = typeof nextGroups === 'function' ? nextGroups(get().groups) : nextGroups;
    set({ groups: next });
    get().setItem('groups', JSON.stringify(next));
  },

  setFavorites: (nextFavs) => {
    const next = typeof nextFavs === 'function' ? nextFavs(get().favorites) : nextFavs;
    set({ favorites: next });
    get().setItem('favorites', JSON.stringify(Array.from(next)));
  },

  setCollapsedCodes: (nextVal) => {
    const next = typeof nextVal === 'function' ? nextVal(get().collapsedCodes) : nextVal;
    set({ collapsedCodes: next });
    get().setItem('collapsedCodes', JSON.stringify(Array.from(next)));
  },

  setCollapsedTrends: (nextVal) => {
    const next = typeof nextVal === 'function' ? nextVal(get().collapsedTrends) : nextVal;
    set({ collapsedTrends: next });
    get().setItem('collapsedTrends', JSON.stringify(Array.from(next)));
  },

  setCollapsedEarnings: (nextVal) => {
    const next = typeof nextVal === 'function' ? nextVal(get().collapsedEarnings) : nextVal;
    set({ collapsedEarnings: next });
    get().setItem('collapsedEarnings', JSON.stringify(Array.from(next)));
  },

  setRefreshMs: (ms) => {
    set({ refreshMs: ms });
    get().setItem('refreshMs', String(ms));
  },

  setHoldings: (nextHoldings) => {
    const next = typeof nextHoldings === 'function' ? nextHoldings(get().holdings) : nextHoldings;
    set({ holdings: next });
    get().setItem('holdings', JSON.stringify(next));
  },

  setGroupHoldings: (nextGroupHoldings) => {
    const next = typeof nextGroupHoldings === 'function' ? nextGroupHoldings(get().groupHoldings) : nextGroupHoldings;
    set({ groupHoldings: next });
    get().setItem('groupHoldings', JSON.stringify(next));
  },

  setPendingTrades: (nextPendingTrades) => {
    const next = typeof nextPendingTrades === 'function' ? nextPendingTrades(get().pendingTrades) : nextPendingTrades;
    set({ pendingTrades: next });
    get().setItem('pendingTrades', JSON.stringify(next));
  },

  setTransactions: (nextTransactions) => {
    const next = typeof nextTransactions === 'function' ? nextTransactions(get().transactions) : nextTransactions;
    set({ transactions: next });
    get().setItem('transactions', JSON.stringify(next));
  },

  setDcaPlans: (nextDcaPlans) => {
    const next = typeof nextDcaPlans === 'function' ? nextDcaPlans(get().dcaPlans) : nextDcaPlans;
    set({ dcaPlans: next });
    get().setItem('dcaPlans', JSON.stringify(next));
  },

  setCustomSettings: (nextCustomSettings) => {
    const next = typeof nextCustomSettings === 'function' ? nextCustomSettings(get().customSettings) : nextCustomSettings;
    set({ customSettings: next });
    get().setItem('customSettings', JSON.stringify(next));
  },

  setFundDailyEarnings: (nextFundDailyEarnings) => {
    const next = typeof nextFundDailyEarnings === 'function' ? nextFundDailyEarnings(get().fundDailyEarnings) : nextFundDailyEarnings;
    set({ fundDailyEarnings: next });
    get().setItem('fundDailyEarnings', JSON.stringify(next));
  },

  /**
   * 核心写入方法：同步更新 localStorage 和 Store 状态，并触发同步
   * @param {string} key 
   * @param {string} value JSON 字符串或普通字符串
   */
  setItem: (key, value) => {
    const prevValue = (key === 'funds' || key === 'tags') ? window.localStorage.getItem(key) : null;
    
    // 更新本地存储
    window.localStorage.setItem(key, value);

    // 同步更新 Store 状态，确保 UI 响应
    try {
      const parsed = JSON.parse(value);
      if (key === 'funds') set({ funds: parsed });
      else if (key === 'groups') set({ groups: parsed });
      else if (key === 'favorites') set({ favorites: new Set(parsed) });
      else if (key === 'collapsedCodes') set({ collapsedCodes: new Set(parsed) });
      else if (key === 'collapsedTrends') set({ collapsedTrends: new Set(parsed) });
      else if (key === 'collapsedEarnings') set({ collapsedEarnings: new Set(parsed) });
      else if (key === 'refreshMs') set({ refreshMs: Number(parsed) });
      else if (key === 'holdings') set({ holdings: parsed });
      else if (key === 'groupHoldings') set({ groupHoldings: parsed });
      else if (key === 'pendingTrades') set({ pendingTrades: parsed });
      else if (key === 'transactions') set({ transactions: parsed });
      else if (key === 'dcaPlans') set({ dcaPlans: parsed });
      else if (key === 'customSettings') set({ customSettings: parsed });
      else if (key === 'fundDailyEarnings') set({ fundDailyEarnings: parsed });
    } catch (e) {
      // 如果不是 JSON，或者是 refreshMs 这种数字字符串
      if (key === 'refreshMs') set({ refreshMs: Number(value) });
    }

    // 触发同步逻辑
    const { onSync } = get();
    if (onSync && SYNC_KEYS.has(key)) {
      // 特殊逻辑：如果是 funds 或 tags，通过签名判断是否真的需要同步
      if (key === 'funds') {
        if (getFundCodesSignature(prevValue) === getFundCodesSignature(value)) {
          return;
        }
      }
      if (key === 'tags') {
        if (getTagsStoreSignature(prevValue) === getTagsStoreSignature(value)) {
          return;
        }
      }
      
      onSync(key, prevValue, value);
    }
  },

  /**
   * 删除 key
   */
  removeItem: (key) => {
    const prevValue = (key === 'funds' || key === 'tags') ? window.localStorage.getItem(key) : null;
    window.localStorage.removeItem(key);
    
    const { onSync } = get();
    if (onSync && SYNC_KEYS.has(key)) {
      onSync(key, prevValue, null);
    }
  },

  /**
   * 清空所有存储
   */
  clear: () => {
    window.localStorage.clear();
    const { onSync } = get();
    if (onSync) {
      onSync('__clear__', null, null);
    }
  },

  /**
   * 获取数据（封装 JSON 解析）
   */
  getItem: (key, defaultValue = null) => {
    const val = window.localStorage.getItem(key);
    if (val === null) return defaultValue;
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
}));

/** 非 React 代码中使用的快捷方式 */
export const storageStore = {
  setItem: (key, val) => useStorageStore.getState().setItem(key, val),
  getItem: (key, def) => useStorageStore.getState().getItem(key, def),
  removeItem: (key) => useStorageStore.getState().removeItem(key),
  clear: () => useStorageStore.getState().clear(),
};
