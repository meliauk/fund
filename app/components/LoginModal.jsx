'use client';

import Image from 'next/image';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { MailIcon } from './Icons';
import githubImg from "../assets/github.svg";

export default function LoginModal({
  onClose,
  isMobile,
  loginEmail,
  setLoginEmail,
  loginOtp,
  setLoginOtp,
  loginLoading,
  loginError,
  loginSuccess,
  handleSendOtp,
  handleVerifyEmailOtp,
  handleGithubLogin
}) {
  const loginModalCardRef = useRef(null);
  const otpTouchWrapRef = useRef(null);

  // iOS 等系统仅在「用户手势」触发的 focus 上弹出软键盘；触摸验证码区域时同步 focus 可稳定唤起键盘
  const focusOtpInput = useCallback(() => {
    const wrap = otpTouchWrapRef.current;
    if (!wrap) return;
    const root = wrap.querySelector('[data-input-otp-container]');
    const input = root?.querySelector('[data-input-otp]');
    if (!(input instanceof HTMLInputElement) || input.disabled) return;
    root.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    input.focus();
    try {
      input.click();
    } catch {
      /* ignore */
    }
  }, []);

  // 发送成功后尝试自动聚焦；若系统仍不弹键盘，用户轻点验证码区会由 onPointerDownCapture 再 focus
  useLayoutEffect(() => {
    if (!loginSuccess || !isMobile) return;
    const run = () => focusOtpInput();
    run();
    const t = requestAnimationFrame(run);
    const t2 = window.setTimeout(run, 50);
    return () => {
      cancelAnimationFrame(t);
      window.clearTimeout(t2);
    };
  }, [loginSuccess, isMobile, focusOtpInput]);
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="登录"
      onClick={onClose}
    >
      <div
        ref={loginModalCardRef}
        className="glass card modal login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="title" style={{ marginBottom: 16 }}>
          <MailIcon width="20" height="20" />
          <span>邮箱登录</span>
          <span className="muted">使用邮箱验证登录</span>
        </div>

        <form onSubmit={handleSendOtp}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              请输入邮箱，我们将发送验证码到您的邮箱
            </div>
            <input
              style={{ width: '100%' }}
              className="input"
              type="email"
              placeholder="your@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={loginLoading || !!loginSuccess}
            />
          </div>

          {loginSuccess && (
            <div className="login-message success" style={{ marginBottom: 12 }}>
              <span>{loginSuccess}</span>
            </div>
          )}

          {loginSuccess && (
            <div
              ref={otpTouchWrapRef}
              className="form-group"
              style={{ marginBottom: 16, touchAction: 'manipulation' }}
              onPointerDownCapture={
                isMobile ? () => focusOtpInput() : undefined
              }
            >
              <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
                请输入邮箱验证码以完成注册/登录
              </div>
              <InputOTP
                maxLength={6}
                value={loginOtp}
                onChange={(value) => setLoginOtp(value)}
                disabled={loginLoading}
                autoFocus={!!isMobile}
                autoComplete="one-time-code"
                type={isMobile ? 'tel' : 'text'}
                enterKeyHint="done"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}
          {loginError && (
            <div className="login-message error" style={{ marginBottom: 12 }}>
              <span>{loginError}</span>
            </div>
          )}
          <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="button"
              type={loginSuccess ? 'button' : 'submit'}
              onClick={loginSuccess ? handleVerifyEmailOtp : undefined}
              disabled={loginLoading || (loginSuccess && !loginOtp)}
            >
              {loginLoading ? '处理中...' : loginSuccess ? '确认验证码' : '发送邮箱验证码'}
            </button>
          </div>
        </form>

        {handleGithubLogin && !loginSuccess && (
          <>
            <div
              className="login-divider"
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>或使用</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              className="github-login-btn"
              onClick={handleGithubLogin}
              disabled={loginLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg)',
                color: 'var(--text)',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: loginLoading ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
          <span className="github-icon-wrap">
            <Image unoptimized alt="项目Github地址" src={githubImg} style={{ width: '24px', height: '24px', cursor: 'pointer' }} onClick={() => window.open("https://github.com/meliauk/fund")} />
          </span>
              <span>使用 GitHub 登录</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
