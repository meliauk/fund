'use client';

import { useEffect } from 'react';

import { notifyClientError } from './ClientErrorBoundary';

export default function GlobalClientErrorHandler() {
  useEffect(() => {
    const handleError = (event) => {
      const errorMsg = event.error?.message || event.message || '';
      if (
        typeof errorMsg === 'string' &&
        (errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
          errorMsg.includes('ResizeObserver loop limit exceeded'))
      ) {
        // 忽略良性的 ResizeObserver 警告，这通常是由于一个动画帧内多次改变元素大小引起的，属于浏览器内置安全机制，不会影响业务功能。
        return;
      }

      notifyClientError(event.error || event.message || event, {
        title: '页面运行异常',
        toastId: 'window-runtime-error',
        closeModals: true
      });
    };

    const handleUnhandledRejection = (event) => {
      notifyClientError(event.reason || event, {
        title: '异步任务异常',
        toastId: 'window-promise-error',
        closeModals: true
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
