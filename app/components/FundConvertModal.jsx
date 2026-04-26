'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CloseIcon } from './Icons';
import { DatePicker, NumericInput } from './Common';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

const format2 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
};

export default function FundConvertModal({
  fund,
  maxOutAmount = 0,
  allFunds = [],
  nestedModalOpen = false,
  onClose,
  onPickInFund,
  onConfirm,
}) {
  const [outAmount, setOutAmount] = useState('');
  const [inAmount, setInAmount] = useState('');
  const [inFund, setInFund] = useState(null);
  const [confirmDate, setConfirmDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const ignoreDialogCloseUntilRef = useRef(0);
  const prevNestedModalOpenRef = useRef(false);

  useEffect(() => {
    // 每次打开/切换 fund 时重置表单（避免上一次残留）
    setOutAmount('');
    setInAmount('');
    setInFund(null);
    setConfirmDate(dayjs().format('YYYY-MM-DD'));
  }, [fund?.code]);

  const maxOut = useMemo(() => {
    const n = Number(maxOutAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [maxOutAmount]);

  const outAmt = useMemo(() => Number.parseFloat(outAmount), [outAmount]);
  const inAmt = useMemo(() => Number.parseFloat(inAmount), [inAmount]);

  const outValid = Number.isFinite(outAmt) && outAmt > 0 && outAmt <= maxOut;
  const inValid = Number.isFinite(inAmt) && inAmt > 0;
  const relationValid = outValid && inValid && outAmt >= inAmt;
  const canSubmit = !!fund?.code && !!inFund?.code && relationValid && !!confirmDate;

  useEffect(() => {
    if (nestedModalOpen) {
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    } else if (prevNestedModalOpenRef.current) {
      // 移动端关闭子弹框后，触摸/焦点事件可能延迟触发到父弹框。
      ignoreDialogCloseUntilRef.current = Date.now() + 1200;
    }
    prevNestedModalOpenRef.current = nestedModalOpen;
  }, [nestedModalOpen]);

  const handleOpenChange = (open) => {
    if (!open && (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current)) return;
    if (!open) onClose?.();
  };

  const hintMax = maxOut > 0 ? `最多可转出 ${format2(maxOut)}` : '暂无可转出金额';

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal"
        overlayClassName="modal-overlay"
        onPointerDownOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (nestedModalOpen || Date.now() < ignoreDialogCloseUntilRef.current) event.preventDefault();
        }}
        style={{
          maxWidth: '420px',
          width: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
        }}
      >
        <DialogTitle className="sr-only">转换</DialogTitle>

        <div className="title" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '20px' }}>🔄</span>
            <span>转换</span>
          </div>
          <button className="icon-button" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div className="scrollbar-y-styled" style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="fund-name" style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>
              {fund?.name}
            </div>
            <div className="muted" style={{ fontSize: '12px' }}>#{fund?.code}</div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              转出基金
            </label>
            <div
              className="input"
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                opacity: 0.9,
              }}
            >
              {fund?.name || '-'}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              转出金额 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ border: (!outAmount || !outValid) ? '1px solid var(--danger)' : '1px solid var(--border)', borderRadius: 12 }}>
              <NumericInput
                value={outAmount}
                onChange={setOutAmount}
                step={100}
                min={0}
                placeholder="请输入转出金额"
              />
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              * {hintMax}，且需大于等于转入金额
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              转入基金 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                const picked = await onPickInFund?.({ excludeCodes: [fund?.code], initialSelectedCode: inFund?.code || '' });
                if (picked?.code) setInFund(picked);
              }}
              style={{
                width: '100%',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)',
                padding: '10px 12px',
                borderRadius: 12,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inFund?.name ? `${inFund.name} #${inFund.code}` : '点击选择基金（单选）'}
              </span>
              <span className="muted" style={{ marginLeft: 10 }}>›</span>
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              转入金额 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ border: (!inAmount || !inValid || (outValid && inValid && !(inAmt <= outAmt))) ? '1px solid var(--danger)' : '1px solid var(--border)', borderRadius: 12 }}>
              <NumericInput
                value={inAmount}
                onChange={setInAmount}
                step={100}
                min={0}
                placeholder="请输入转入金额"
              />
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              * 需小于等于转出金额
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              确认转换日期
            </label>
            <DatePicker value={confirmDate} onChange={setConfirmDate} />
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              * 默认当前日期
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 12, marginTop: 4 }}>
          <div className="row" style={{ gap: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              取消
            </button>
            <button
              type="button"
              className="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                onConfirm?.({
                  outFundCode: fund.code,
                  outFundName: fund.name,
                  outAmount: outAmt,
                  inFundCode: inFund.code,
                  inFundName: inFund.name,
                  inAmount: inAmt,
                  date: confirmDate,
                });
              }}
              style={{ flex: 1, opacity: canSubmit ? 1 : 0.6 }}
            >
              确认转换
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

