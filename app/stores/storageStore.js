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

  /**
   * 核心写入方法：同步更新 localStorage 和 Store 状态，并触发同步
   * @param {string} key 
   * @param {string} value JSON 字符串或普通字符串
   */
  setItem: (key, value) => {
    const prevValue = (key === 'funds' || key === 'tags') ? window.localStorage.getItem(key) : null;
    
    // 更新本地存储
    window.localStorage.setItem(key, value);

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
