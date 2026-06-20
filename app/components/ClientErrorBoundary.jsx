'use client';

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangleIcon, RotateCcwIcon } from 'lucide-react';
import { isError, isFunction, isString } from 'lodash';
import { toast as sonnerToast } from 'sonner';

import { useModalStore } from '../stores';

function getErrorMessage(error) {
  if (isError(error) && error.message) return error.message;
  if (isString(error) && error.trim()) return error;
  if (isString(error?.message) && error.message.trim()) return error.message;
  if (isString(error?.reason) && error.reason.trim()) return error.reason;
  if (isString(error?.type) && error.type.trim()) return error.type;
  return '未知运行错误';
}

export function shouldSilenceClientError(error) {
  return getErrorMessage(error).includes('Error attempting to read image');
}

export function notifyClientError(error, options = {}) {
  const title = options.title || '页面出现异常';
  const message = getErrorMessage(error);
  const silent = options.silent || shouldSilenceClientError(error);

  try {
    Sentry.captureException(error);
  } catch {}

  if (silent) return;

  try {
    if (options.closeModals) {
      useModalStore.getState().closeAllModals?.();
    }
  } catch {}

  sonnerToast.error(title, {
    id: options.toastId || 'client-runtime-error',
    description: message,
    duration: 8000
  });
}

class ClientErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    notifyClientError(error, {
      title: this.props.toastTitle,
      toastId: this.props.toastId,
      closeModals: this.props.closeModals
    });

    if (isFunction(this.props.onError)) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ error: null });
    }
  }

  handleReset = () => {
    this.setState({ error: null });
    if (isFunction(this.props.onReset)) this.props.onReset();
  };

  renderFallback() {
    const { fallback } = this.props;

    if (fallback === null) return null;

    if (isFunction(fallback)) {
      return fallback({ error: this.state.error, reset: this.handleReset });
    }

    if (fallback) return fallback;

    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--foreground)]">
        <div className="glass mx-auto flex max-w-md flex-col gap-4 rounded-[16px] border border-[var(--border)] p-6 text-left">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            <h1 className="m-0 text-lg font-semibold">页面遇到异常</h1>
          </div>
          <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {getErrorMessage(this.state.error)}
          </p>
          <button
            type="button"
            className="button primary flex h-11 items-center gap-2 rounded-xl px-4"
            onClick={this.handleReset}
          >
            <RotateCcwIcon className="h-4 w-4" />
            <span>重新尝试</span>
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.error) return this.renderFallback();
    return this.props.children;
  }
}

export default function ClientErrorBoundary(props) {
  return <ClientErrorBoundaryInner {...props} />;
}
