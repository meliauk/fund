'use client';

/**
 * FitText 组件 - 固定字体大小版本
 * 
 * 原版本使用 ResizeObserver 动态调整字体大小，但在 Modal 弹出时会导致页面抖动。
 * 现在改用固定字体大小，避免动态计算导致的布局问题。
 */
export default function FitText({
  children,
  maxFontSize = 14,
  className,
  style = {},
  as: Tag = 'span',
}) {
  return (
    <Tag
      className={className}
      style={{
        display: 'block',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        fontSize: `${maxFontSize}px`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
