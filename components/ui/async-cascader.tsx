"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Draft, produce } from "immer";
import { ChevronRight, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/k-view/Loader/Spinner"
import { Empty } from "@/components/k-view/Empty"

function pathKey(path: string[]) {
  return path.length ? path.join("\u0001") : "__root__";
}

function parsePathValue(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

export interface AsyncCascaderProps<T> extends BaseComponentProps {
  /**
   * 根据父路径加载下一级选项。`pathPrefix` 为从根到当前父节点的 value 序列，
   * 空数组表示根级 懒加载语义一致）。
   */
  loadData: (pathPrefix: string[]) => Promise<T[]>;
  /** 已选路径，每一项为对应级的 value */
  value: string[];
  /** 已知选项名称，供已有 value 在选项尚未加载时即时显示 */
  valueLabelMap?: Readonly<Record<string, string>>;
  onChange: (path: string[]) => void;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => React.ReactNode;
  /** 为 true 时表示叶子，点击直接选中并关闭；不传则点击后再请求子级，空列表视为叶子 */
  isLeaf?: (option: T) => boolean;
  /** 是否允许在展开分支的同时，直接确认选择当前层级 */
  allowParentSelection?: boolean;
  /** 开始允许确认父级的路径深度，从根级起按 1 计数 */
  minParentSelectionDepth?: number;
  renderOption?: (option: T) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;

  /** 展示已选路径时的分隔符，默认 " / " */
  separator?: string;
  clearable?: boolean;
  columnMinWidth?: number;
}

type ColumnState<T> = {
  loading: boolean;
  fetched: boolean;
  error: string | null;
  options: T[];
};

function optionText<T>(
  option: T,
  getOptionValue: (o: T) => string,
  getOptionLabel: (o: T) => React.ReactNode,
): string {
  const node = getOptionLabel(option);
  if (typeof node === "string" || typeof node === "number") return String(node);
  return getOptionValue(option);
}

export function AsyncCascader<T>({
  loadData,
  value,
  valueLabelMap,
  onChange,
  getOptionValue,
  getOptionLabel,
  isLeaf,
  allowParentSelection = false,
  minParentSelectionDepth = 1,
  renderOption,
  placeholder = "请选择",
  disabled = false,
  className,
  separator = " / ",
  clearable = true,
  columnMinWidth = 168,
  style
}: AsyncCascaderProps<T>) {
  const [open, setOpen] = useState(false);
  const [activePath, setActivePath] = useState<string[]>(value);
  const [columnMap, setColumnMap] = useState<Record<string, ColumnState<T>>>(
    {},
  );
  /** 失败后重试：清掉该列并触发重新拉取 */
  const [reloadToken, setReloadToken] = useState(0);

  const loadRef = useRef(loadData);
  loadRef.current = loadData;

  const loadingPathsRef = useRef(new Set<string>());
  const columnRef = useRef(columnMap);
  columnRef.current = columnMap;

  const valueKey = useMemo(() => pathKey(value), [value]);
  const activeKey = useMemo(() => pathKey(activePath), [activePath]);

  useEffect(() => {
    if (open) return;
    setActivePath(value.length ? [...value] : []);
  }, [open, valueKey, value]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        setActivePath(value.length ? [...value] : []);
      }
    },
    [value],
  );

  useEffect(() => {
    if (!open) return;

    const count = activePath.length + 1;
    const snap = columnRef.current;

    for (let i = 0; i < count; i++) {
      const prefix = activePath.slice(0, i);
      const key = pathKey(prefix);
      if (snap[key]?.fetched || snap[key]?.loading || loadingPathsRef.current.has(key)) continue;

      loadingPathsRef.current.add(key);

      setColumnMap((prev) => {
        if (prev[key]?.fetched || prev[key]?.loading) return prev;
        return produce(prev, (d) => {
          d[key] = {
            loading: true,
            fetched: false,
            error: null,
            options: [],
          };
        });
      });


      void loadRef
        .current(prefix)
        .then((options) => {
          setColumnMap((p) =>
            produce(p, (d) => {
              d[key] = {
                loading: false,
                fetched: true,
                error: null,
                options: options as Draft<T>[],
              };
            }),
          );
        })
        .catch((e) => {
          setColumnMap((p) =>
            produce(p, (d) => {
              d[key] = {
                loading: false,
                fetched: true,
                error: e instanceof Error ? e.message : "加载失败",
                options: [],
              };
            }),
          );
        })
        .finally(() => {
          loadingPathsRef.current.delete(key);
        });
    }
  }, [open, activeKey, activePath, reloadToken]);

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const state of Object.values(columnMap)) {
      if (!state.fetched) continue;
      for (const opt of state.options) {
        const v = getOptionValue(opt);
        map.set(v, optionText(opt, getOptionValue, getOptionLabel));
      }
    }
    return map;
  }, [columnMap, getOptionLabel, getOptionValue]);

  const finalize = useCallback((path: string[]) => {
    onChange(path);
    setActivePath(path);
    setOpen(false);
  }, [onChange]);

  const handleParentSelection = useCallback((serializedPath: string) => {
    const path = parsePathValue(serializedPath);
    if (path) finalize(path);
  }, [finalize]);

  const displayText = useMemo(() => {
    if (!value.length) return null;
    return value.map((v) => labelByValue.get(v) ?? valueLabelMap?.[v] ?? v).join(separator);
  }, [value, valueLabelMap, labelByValue, separator]);

  const handlePick = useCallback(
    (columnIndex: number, option: T) => {
      const v = getOptionValue(option);
      const nextPath = activePath.slice(0, columnIndex).concat(v);
      if (isLeaf?.(option)) {
        finalize(nextPath);
        return;
      }

      // 加载更多层级数据
      void (async () => {
        try {
          const children = await loadRef.current(nextPath);
          const childKey = pathKey(nextPath);
          setColumnMap((prev) =>
            produce(prev, (d) => {
              d[childKey] = {
                loading: false,
                fetched: true,
                error: null,
                options: children as Draft<T>[],
              };
            }),
          );

          if (children.length === 0) {
            finalize(nextPath);
            return;
          }
          setActivePath(nextPath);
        } catch {
          finalize(nextPath);
        }
      })();
    },
    [activePath, getOptionValue, isLeaf, finalize],
  );

  /** 清除已选路径 */
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange([]);
      setActivePath([]);
      setColumnMap({});
      setOpen(false);
    },
    [onChange],
  );

  const handleRetry = useCallback((key: string) => {
    setColumnMap((prev) =>
      produce(prev, (d) => {
        delete d[key];
      }),
    );
    setReloadToken((t) => t + 1);
  }, []);

  const columnCount = activePath.length + 1;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between border-input font-normal min-w-0",
            className,
          )}
          style={style}
        >
          <span
            className={cn(
              "truncate text-left",
              !displayText && "text-muted-foreground",
            )}
          >
            {displayText ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && value.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                className="inline-flex rounded-sm p-0.5 text-muted-foreground opacity-50 hover:opacity-100 hover:text-foreground"
                aria-label="清除"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleClear}
              >
                <X className="size-4" aria-hidden />
              </span>
            )}
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[1050] w-auto max-w-[calc(100vw-1rem)] overflow-x-auto overscroll-contain p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex w-max max-w-none max-h-72 bg-popover text-popover-foreground">
          {Array.from({ length: columnCount }, (_, i) => {
            const prefix = activePath.slice(0, i);
            const key = pathKey(prefix);
            const col = columnMap[key] ?? {
              loading: true,
              fetched: false,
              error: null,
              options: [],
            };
            const selectedAtLevel = activePath[i];
            const selectedParentValue = value.length === i + 1 ? JSON.stringify(value) : "";

            return (
              <div
                key={key}
                className="border-r border-border last:border-r-0 overflow-y-auto shrink-0 relative"
                style={{ minWidth: columnMinWidth, maxWidth: 280 }}
              >
                {col.loading && !col.fetched && (
                  <Spinner className="position-center absolute" />
                )}
                {col.error && (
                  <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                    <p className="text-xs text-muted-foreground">{col.error}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(key)}
                    >
                      重试
                    </Button>
                  </div>
                )}
                {col.fetched && !col.error && col.options.length === 0 && (
                  <Empty type="address" text="没有更多地区了" />
                )}
                <RadioGroup
                  aria-label={`选择第${i + 1}级地区`}
                  className="gap-0 py-1"
                  value={selectedParentValue}
                  onValueChange={handleParentSelection}
                >
                  <ul>
                    {col.options.map((opt) => {
                      const ov = getOptionValue(opt);
                      const active = selectedAtLevel === ov;
                      const leaf = isLeaf?.(opt) ?? false;
                      const nextPath = activePath.slice(0, i).concat(ov);
                      const canSelectParent = allowParentSelection && !leaf && nextPath.length >= minParentSelectionDepth;
                      const label = optionText(opt, getOptionValue, getOptionLabel);
                      const showArrow = !leaf;

                      return (
                        <li key={ov}>
                          <div className="flex items-center">
                            <button
                              type="button"
                              className={cn(
                                "min-w-0 flex-1 flex items-center gap-1 px-3 py-2 text-sm text-left outline-none",
                                "hover:bg-accent hover:text-accent-foreground",
                                active && "bg-accent text-accent-foreground font-medium",
                              )}
                              onClick={() => handlePick(i, opt)}
                            >
                              <span className="flex-1 min-w-0 truncate">
                                {renderOption?.(opt) ?? getOptionLabel(opt)}
                              </span>
                              {showArrow && <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />}
                            </button>
                            {canSelectParent && (
                              <RadioGroupItem
                                value={JSON.stringify(nextPath)}
                                aria-label={`选择${label}`}
                                className="mr-3 cursor-pointer"
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </RadioGroup>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
