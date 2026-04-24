'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, TrendingDown, TrendingUp, Users, Building2, UserCircle2, User, Briefcase } from 'lucide-react';

// 获取板块资金流向K线数据
const fetchSectorFlowKline = async (secid) => {
  const timestamp = Date.now();
  const url = `https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=0&klt=1&secid=${secid}&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56&ut=fa5fd1943c7b386f172d6893dbfba10b&_=${timestamp}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    // 解析 JSONP 响应
    const match = text.match(/\(({.*})\)/);
    if (!match) return null;
    
    const json = JSON.parse(match[1]);
    if (!json.data?.klines?.length) return null;
    
    // 取最新的一条数据
    const latest = json.data.klines[json.data.klines.length - 1];
    const parts = latest.split(',');
    
    if (parts.length < 6) return null;
    
    // f52:主力净流入, f53:小单净流入, f54:中单净流入, f55:大单净流入, f56:超大单净流入
    return {
      time: parts[0],
      mainFlow: parseFloat(parts[1]) || 0,      // 主力净流入
      smallFlow: parseFloat(parts[2]) || 0,     // 小单净流入
      mediumFlow: parseFloat(parts[3]) || 0,    // 中单净流入
      largeFlow: parseFloat(parts[4]) || 0,     // 大单净流入
      superLargeFlow: parseFloat(parts[5]) || 0 // 超大单净流入
    };
  } catch (e) {
    console.error('获取板块资金流向失败:', e);
    return null;
  }
};

// 格式化资金（亿）
const formatFund = (val) => {
  const billion = val / 100000000;
  return `${billion >= 0 ? '+' : ''}${billion.toFixed(2)}亿`;
};

// 获取动作描述
const getAction = (val, level) => {
  const absBillion = Math.abs(val) / 100000000;
  
  if (val > 0) {
    if (absBillion > 50) return level === 'super' ? '大幅抢筹' : level === 'large' ? '强势买入' : '积极买入';
    if (absBillion > 20) return level === 'super' ? '抢筹' : '买入';
    return level === 'retail' ? '少量买入' : '买入';
  } else {
    if (absBillion > 50) return level === 'super' ? '大幅出逃' : level === 'large' ? '强势卖出' : '积极卖出';
    if (absBillion > 20) return level === 'super' ? '出逃' : '卖出';
    return level === 'retail' ? '少量卖出' : '卖出';
  }
};

export default function SectorFlowDetailModal({
  open,
  onClose,
  sector
}) {
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = useCallback(async () => {
    if (!sector?.secid) return;
    
    setLoading(true);
    try {
      const data = await fetchSectorFlowKline(sector.secid);
      if (data) {
        setFlowData(data);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('加载板块资金流向失败:', e);
    } finally {
      setLoading(false);
    }
  }, [sector?.secid]);

  // 初始加载
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // 5分钟定时刷新
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30 * 1000); // 5分钟
    
    return () => clearInterval(interval);
  }, [open, loadData]);

  // 计算主力合计
  const mainTotal = flowData ? flowData.superLargeFlow + flowData.largeFlow : 0;

  // 资金流向层级数据
  const flowLevels = flowData ? [
    {
      level: 'super',
      name: '超大单（机构）',
      icon: Building2,
      value: flowData.superLargeFlow,
      color: '#ef4444'
    },
    {
      level: 'large', 
      name: '大单（大户）',
      icon: Briefcase,
      value: flowData.largeFlow,
      color: '#f97316'
    },
    {
      level: 'main',
      name: '主力合计',
      icon: TrendingDown,
      value: mainTotal,
      color: mainTotal >= 0 ? '#22c55e' : '#ef4444',
      isTotal: true
    },
    {
      level: 'medium',
      name: '中单（中户）',
      icon: UserCircle2,
      value: flowData.mediumFlow,
      color: '#3b82f6'
    },
    {
      level: 'small',
      name: '小单（散户）',
      icon: User,
      value: flowData.smallFlow,
      color: '#22c55e'
    }
  ] : [];

  if (!open) {
    return null;
  }

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
              {flowData?.mainFlow >= 0 ? (
                <TrendingUp width="20" height="20" style={{ color: 'var(--success)' }} />
              ) : (
                <TrendingDown width="20" height="20" style={{ color: 'var(--danger)' }} />
              )}
              {sector?.name} 资金流向
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

        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>数据每5分钟自动更新</span>
            {lastUpdate && (
              <span>更新于 {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {loading && !flowData ? (
          <div className="muted" style={{ textAlign: 'center', padding: '60px 20px' }}>
            加载中...
          </div>
        ) : !flowData ? (
          <div className="muted" style={{ textAlign: 'center', padding: '60px 20px' }}>
            暂无数据
          </div>
        ) : (
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {/* 主力净流入汇总 */}
            <div 
              className="glass" 
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                marginBottom: 16,
                background: mainTotal >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${mainTotal >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div className="muted" style={{ fontSize: '13px', marginBottom: 4 }}>今日主力净流入</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '700',
                  color: mainTotal >= 0 ? '#22c55e' : '#ef4444'
                }}>
                  {formatFund(mainTotal)}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  marginTop: 4,
                  color: mainTotal >= 0 ? '#22c55e' : '#ef4444'
                }}>
                  {mainTotal >= 0 ? '主力入场' : '主力撤离'}
                </div>
              </div>
            </div>

            {/* 资金流向分层 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {flowLevels.map((item) => {
                const Icon = item.icon;
                const action = getAction(item.value, item.level);
                
                return (
                  <div
                    key={item.level}
                    className="glass"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${item.isTotal ? 'rgba(148, 163, 184, 0.3)' : 'var(--border)'}`,
                      background: item.isTotal ? 'rgba(148, 163, 184, 0.1)' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          padding: '8px', 
                          borderRadius: '8px',
                          background: item.value >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                        }}>
                          <Icon 
                            width="18" 
                            height="18" 
                            style={{ color: item.value >= 0 ? '#22c55e' : '#ef4444' }} 
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                          <div 
                            style={{ 
                              fontSize: '12px', 
                              marginTop: 2,
                              color: item.value >= 0 ? '#22c55e' : '#ef4444'
                            }}
                          >
                            {action}
                          </div>
                        </div>
                      </div>
                      <div 
                        style={{ 
                          fontWeight: 700, 
                          fontSize: '16px',
                          color: item.value >= 0 ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {formatFund(item.value)}
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    {!item.isTotal && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${Math.min(Math.abs(item.value) / Math.abs(mainTotal) * 100, 100)}%`,
                              background: item.value >= 0 ? '#22c55e' : '#ef4444',
                              borderRadius: '2px'
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 散户动态分析 */}
            {flowData && (
              <div 
                className="glass" 
                style={{ 
                  padding: '14px 16px', 
                  borderRadius: '12px', 
                  marginTop: 16,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Users width="16" height="16" style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>散户动向</span>
                </div>
                <div className="muted" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {mainTotal < 0 && flowData.smallFlow > 0 ? (
                    <span style={{ color: '#ef4444' }}>
                      ⚠️ 主力大幅撤离，散户却在大量接盘，谨防追高被套！
                    </span>
                  ) : mainTotal > 0 && flowData.smallFlow < 0 ? (
                    <span style={{ color: '#22c55e' }}>
                      ✅ 主力抢筹，散户抛售，筹码进一步集中，趋势向好！
                    </span>
                  ) : mainTotal > 0 && flowData.smallFlow > 0 ? (
                    <span>
                      主力和散户都在买入，市场热度较高，注意分歧风险。
                    </span>
                  ) : (
                    <span>
                      主力和散户都在卖出，市场观望情绪浓厚，等待企稳信号。
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
