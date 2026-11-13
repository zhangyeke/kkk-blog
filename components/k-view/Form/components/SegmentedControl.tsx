/** 分段选择器：可配置选项的互斥按钮组。 */
export function SegmentedControl<T extends string | number>({
    ariaLabel,
    options,
    value,
    onChange,
    disabled = false,
    testIdPrefix,
}: {
    ariaLabel: string
    options: Array<{ value: T; label: string }>
    value: T
    onChange: (next: T) => void
    disabled?: boolean
    testIdPrefix?: string
}) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className="inline-flex w-fit items-center gap-0.5 rounded-md border p-0.5"
            style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-3)"}}
        >
            {options.map((option) => {
                const active = option.value === value
                return (
                    <button
                        key={String(option.value)}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        data-testid={testIdPrefix ? `${testIdPrefix}-${String(option.value)}` : undefined}
                        onClick={() => onChange(option.value)}
                        className="h-[26px] cursor-pointer rounded px-3 text-xs md:text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: active ? "var(--adm-paper-2)" : "transparent",
                            color: active ? "var(--adm-ink)" : "var(--adm-ink-3)",
                            boxShadow: active
                                ? "0 1px 2px color-mix(in oklab, var(--adm-ink) 12%, transparent)"
                                : "none",
                        }}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
