'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ANNOUNCEMENT_KEY = 'hasClosedAnnouncement_v1.3.1';

export default function Announcement() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasClosed = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!hasClosed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    // 清理历史 ANNOUNCEMENT_KEY
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hasClosedAnnouncement_v') && key !== ANNOUNCEMENT_KEY) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: 'calc(100dvh - 40px)',
              overflow: 'hidden',
            }}
          >
            <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, fontSize: '18px', color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>公告</span>
            </div>
            <div style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '15px', overflowY: 'auto', minHeight: 0, flex: 1, paddingRight: '4px' }}>
              <p>v1.3.1 更新内容如下：</p>
              <p>1. 更换截图识别 ai 方案。</p>
              <p>2. 修复分组新建、删除问题。</p>
              <p>3. 修复移动端管理分组二次确认弹框层级问题。</p>
              <p>4. 基金卡片、添加分组展示基金标签。</p>
              <p>5. 定投弹框新增重置按钮。</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                className="button"
                onClick={handleClose}
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
              >
                我知道了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
