'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, X, Search, Wallet } from 'lucide-react';
import { fetchSectorDetail } from '../api/fund';

export default function SectorFlowModal({
  open,
  onClose,
  sectors,
  onAddSector,
  onRemoveSector,
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'search'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 从 fund_secid 表搜索板块
  const searchSectors = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // 调用东方财富搜索接口搜索板块
      const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(term)}&type=14&count=10`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json?.QuotationCodeTable?.Data) {
        const results = json.QuotationCodeTable.Data
          .filter(item => item.Classify === '板块') // 只取板块类型
          .map(item => ({
            name: item.Name,
            secid: `${item.Mkt}.${item.Code}`,
            code: item.Code,
            market: item.Mkt
          }))
          .filter(s => !sectors.some(us => us.name === s.name)); // 过滤已添加的
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('搜索板块失败:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [sectors]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSectors(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchSectors]);

  // 按资金流入排序
  const sortedSectors = useMemo(() => {
    return [...sectors].sort((a, b) => (b.fundFlow || 0) - (a.fundFlow || 0));
  }, [sectors]);

  const handleAdd = async (sector) => {
    // 获取实时数据后再添加
    try {
      const data = await fetchSectorDetail(sector.secid);
      onAddSector(data ? { ...sector, ...data } : sector);
    } catch {
      onAddSector(sector);
    }
    setSearchTerm('');
    setActiveTab('list');
  };

  // 格式化资金（亿）
  const formatFund = (val) => {
    if (!val && val !== 0) return '-';
    const billion = val / 100000000;
    return `${billion >= 0 ? '+' : ''}${billion.toFixed(2)}亿`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="glass card"
        style={{ maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden' }}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet width="20" height="20" style={{ color: 'var(--success)' }} />
              板块资金流向
            </span>
            <button
              onClick={onClose}
              className="icon-button"
              style={{ background: 'transparent', border: 'none' }}
              aria-label="关闭"
            >
              <X width="18" height="18" />
            </button>
          </DialogTitle>
        </DialogHeader>

        {/* Tab 切换 */}
        <div className="flex-row" style={{ gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <button
            className={`button ${activeTab === 'list' ? '' : 'secondary'}`}
            onClick={() => setActiveTab('list')}
            style={{ flex: 1, fontSize: '13px' }}
          >
            我的板块 ({sectors.length})
          </button>
          <button
            className={`button ${activeTab === 'search' ? '' : 'secondary'}`}
            onClick={() => { setActiveTab('search'); setSearchTerm(''); }}
            style={{ flex: 1, fontSize: '13px' }}
          >
            <Plus width="14" height="14" style={{ marginRight: 4 }} />
            添加板块
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ maxHeight: '50vh', overflowY: 'auto' }}
            >
              {sortedSectors.length === 0 ? (
                <div className="muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  暂无板块，点击「添加板块」搜索添加
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedSectors.map((sector) => (
                    <div
                      key={sector.name}
                      className="glass"
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: 4 }}>
                          {sector.name}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: '13px' }}>
                          <span className={sector.change >= 0 ? 'up' : 'down'}>
                            {sector.change >= 0 ? '+' : ''}{sector.change?.toFixed(2) || '0.00'}%
                          </span>
                          <span style={{ color: sector.fundFlow >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                            资金{sector.fundFlow >= 0 ? '流入' : '流出'} {formatFund(sector.fundFlow)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSector(sector.name)}
                        className="icon-button"
                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)' }}
                        aria-label="删除"
                      >
                        <X width="16" height="16" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* 搜索框 */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search width="16" height="16" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="搜索板块名称，如：CPO、半导体..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 40, width: '100%' }}
                  autoFocus
                />
              </div>

              {/* 搜索结果 */}
              <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                {isSearching ? (
                  <div className="muted" style={{ textAlign: 'center', padding: '30px 20px' }}>
                    搜索中...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="muted" style={{ textAlign: 'center', padding: '30px 20px' }}>
                    {searchTerm ? '未找到相关板块' : '输入板块名称搜索，如：CPO、半导体'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {searchResults.map((sector) => (
                      <div
                        key={sector.name}
                        className="glass"
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleAdd(sector)}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{sector.name}</div>
                          <div className="muted" style={{ fontSize: '12px', marginTop: 2 }}>
                            {sector.code}
                          </div>
                        </div>
                        <Plus width="18" height="18" style={{ color: 'var(--success)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
