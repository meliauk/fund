"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"

import { Field, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function SearchFund({
  value,
  onSearch,
  placeholder = "筛选当前分组基金名称或代码...",
  disabled = false,
}) {
  const [draft, setDraft] = useState(value ?? "")
  const inputRef = useRef(null)

  useEffect(() => {
    // 外部 value 变化时同步到输入框（避免 tab 切换/外部清空导致 UI 不一致）
    setDraft(value ?? "")
  }, [value])

  const canSearch = useMemo(() => {
    if (disabled) return false
    const d = String(draft ?? "");
    return d.trim().length > 0
  }, [draft, disabled])

  const handleSearch = useCallback(() => {
    if (!onSearch) return
    const d = String(draft ?? "");
    onSearch(d.trim())
  }, [draft, onSearch])

  const showClear = useMemo(() => {
    if (disabled) return false
    return String(draft ?? "").length > 0
  }, [draft, disabled])

  return (
    <div className="mt-3 mb-3 w-full sm:max-w-[400px]">
      <Field orientation="horizontal" className="items-stretch gap-2">
        <FieldContent className="relative min-w-0">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={showClear ? "pr-9" : undefined}
            ref={inputRef}
            onBlur={() => {
              // 移动端键盘收起时页面可能回弹，失焦后把输入框滚回可见区域
              const el = inputRef.current
              if (!el) return
              // blur 之后通常还会发生一次 viewport resize/scroll 回弹，延迟滚动更可靠
              setTimeout(() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    try {
                      el.scrollIntoView({
                        block: "center",
                        inline: "nearest",
                        behavior: "smooth",
                      })
                    } catch { }

                    // iOS/部分 WebView 可能忽略 scrollIntoView 的 smooth，这里做一次兜底
                    try {
                      const rect = el.getBoundingClientRect()
                      const targetTop =
                        window.scrollY +
                        rect.top -
                        (window.innerHeight / 2 - rect.height / 2)
                      window.scrollTo({
                        top: Math.max(0, targetTop),
                        behavior: "smooth",
                      })
                    } catch { }
                  })
                })
              }, 220)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
          {showClear && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="清空搜索"
              title="清空"
              onMouseDown={(e) => {
                // 避免点击导致 input 失焦
                e.preventDefault()
              }}
              onClick={() => {
                setDraft("")
                onSearch?.("")
                inputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </FieldContent>

        <button
          type="button"
          className="h-9 shrink-0 rounded-md bg-primary px-3 text-sm text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
          disabled={!canSearch}
          onClick={handleSearch}
          aria-label="筛选分组内基金"
          title="筛选"
        >
          筛选
        </button>
      </Field>
    </div>
  )
}

