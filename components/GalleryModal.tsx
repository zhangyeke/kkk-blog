// @ts-nocheck
'use client';

/**
 * 全屏图片画廊：主图预览（支持缩放/旋转/滚轮）、方向键切图、
 * 右侧竖向缩略条（IntersectionObserver 懒加载），可与 Framer Motion layoutId 衔接入场动画。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Image } from '@/components/k-view';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCw, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import type { MapGalleryLocationMeta } from '@/lib/map-project-data';

/** 主图 transform: scale 下限 / 上限 / 按钮与滚轮的单次步进 */
const PREVIEW_SCALE_MIN = 0.5;
const PREVIEW_SCALE_MAX = 3;
const PREVIEW_SCALE_STEP = 0.25;

export type GalleryModalProps = {
  /** 是否展示画廊层 */
  isOpen: boolean;
  /** 点击半透明遮罩时回调（通常等同关闭） */
  onBackdropClick: () => void;
  /** 显式关闭：关闭按钮、Esc 等 */
  onCloseButtonClick: () => void;
  /** 与入口元素共用的 Framer Motion layoutId；须在页面内唯一，避免动画串台 */
  uniqueId: string;
  /** 图片地址列表 */
  urls: Array<string>;
  /** 打开时默认选中的下标（会夹紧到 [0, urls.length-1]） */
  defaultIndex?: number;
  /** 地图下钻等场景：省/市/区（不含拼接的多条 address） */
  locationMeta?: MapGalleryLocationMeta | null;
  /** 与 urls 等长时每张图对应足迹的唯一 address */
  imageAddresses?: string[];
};

/** 缩略图：在侧边滚动容器内用 IO 再挂 src，避免原生 lazy 以视口为根导致条内图片被一次性拉取 */
function GalleryThumb({
  url,
  index,
  selectedIndex,
  scrollRoot,
  onPick,
}: {
  url: string;
  index: number;
  selectedIndex: number;
  scrollRoot: HTMLElement | null;
  onPick: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const isSelected = index === selectedIndex;
  /** 当前项选中则立刻加载；未选中则等 IO 认为进入缩略可视区再挂 src */
  const [shouldLoad, setShouldLoad] = useState(isSelected);

  useEffect(() => {
    // 被选中的缩略图始终加载，避免换页后当前项仍是占位灰块
    if (isSelected) {
      setShouldLoad(true);
    }
  }, [isSelected]);

  useEffect(() => {
    if (shouldLoad || !scrollRoot) {
      return;
    }
    const el = btnRef.current;
    if (!el) {
      return;
    }
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
        }
      },
      { root: scrollRoot, rootMargin: '80px 0px', threshold: 0.01 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [shouldLoad, scrollRoot, url, index]);

  return (
    <button
      ref={btnRef}
      type='button'
      role='listitem'
      className={`relative block w-full p-1 rounded-md shrink-0 text-left transition ring-offset-2 ring-offset-background ${index === selectedIndex
        ? 'ring-2 ring-primary opacity-100'
        : 'opacity-80 hover:opacity-100'
        }`}
      onClick={onPick}
    >
      {shouldLoad ? (
        <Image
          src={url}
          alt={`thumb_${index}`}
          className='w-full h-16  rounded-md pointer-events-none '
          loading='lazy'
        />
      ) : (
        <div
          className='h-16 w-full rounded-md bg-muted'
          aria-hidden
        />
      )}
    </button>
  );
}

/** 全屏画廊：左侧主图与工具栏，右侧缩略列表与关闭。 */
export function GalleryModal({
  isOpen,
  onBackdropClick,
  onCloseButtonClick,
  uniqueId,
  urls,
  defaultIndex = 0,
  locationMeta = null,
  imageAddresses,
}: GalleryModalProps) {
  /** 当前主图在 urls 中的下标 */
  const [selectedIndex, setSelectedIndex] = useState(0);
  /** 主图顺时针旋转，每次按钮 +90° */
  const [previewRotation, setPreviewRotation] = useState(0);
  /** 主图 scale，与旋转同一 transform；换图或关闭时归 1 */
  const [previewScale, setPreviewScale] = useState(1);
  /** 缩略条内 motion 纵向 drag 的下界（内容高于视口时为负，使列表可拖） */
  const [thumbDragConstraints, setThumbDragConstraints] = useState(0);
  const thumbViewportRef = useRef<HTMLDivElement | null>(null);
  /** 大图可视区域 ref：仅在此节点上挂 wheel，且 passive: false 以便 preventDefault */
  const previewWheelRef = useRef<HTMLDivElement | null>(null);
  /** 传给 GalleryThumb 的 IO root，lazy 以侧栏滚动容器为根而非窗口 */
  const [thumbScrollRoot, setThumbScrollRoot] = useState<HTMLElement | null>(null);

  const setThumbViewport = useCallback((el: HTMLDivElement | null) => {
    thumbViewportRef.current = el;
    setThumbScrollRoot(el);
  }, []);

  // 每次打开或 urls / defaultIndex 变化时，将选中下标夹紧到合法区间
  useEffect(() => {
    if (!isOpen || urls.length === 0) {
      return;
    }
    const i = Math.max(0, Math.min(defaultIndex, urls.length - 1));
    setSelectedIndex(i);
  }, [isOpen, defaultIndex, urls]);

  // 关闭再打开时重置主图变换，避免沿用上次缩放/旋转
  useEffect(() => {
    if (isOpen) {
      setPreviewRotation(0);
      setPreviewScale(1);
    }
  }, [isOpen]);

  // 切换当前图片时重置旋转与缩放（每张图独立从默认状态看）
  useEffect(() => {
    setPreviewRotation(0);
    setPreviewScale(1);
  }, [selectedIndex]);

  // 打开时锁定 body 滚动；监听 Esc / 方向键（仅 isOpen 时生效）
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (event.key === 'Escape') {
        onCloseButtonClick();
        return;
      }
      // 左/上 → 上一张；右/下 → 下一张（与常见相册习惯一致）
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : i));
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const last = urls.length - 1;
        setSelectedIndex((i) => (i < last ? i + 1 : i));
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onCloseButtonClick, urls.length]);

  // 侧栏缩略区域高度变化或条目增减时，重算 motion.drag 纵向约束
  useEffect(() => {
    const el = thumbViewportRef.current;
    if (!el || !isOpen) {
      return;
    }
    const measure = () => {
      const viewportHeight = el.offsetHeight;
      const viewScrollHeight = el.scrollHeight;
      setThumbDragConstraints(
        Math.min(0, Number(viewportHeight) - Number(viewScrollHeight))
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, urls.length]);

  // 当前主图对应的 address，仅当 imageAddresses 与 urls 等长且下标合法时展示
  const currentImageAddress = useMemo(() => {
    if (
      !imageAddresses ||
      imageAddresses.length !== urls.length ||
      selectedIndex < 0 ||
      selectedIndex >= imageAddresses.length
    ) {
      return '';
    }
    return (imageAddresses[selectedIndex] ?? '').trim();
  }, [imageAddresses, urls.length, selectedIndex]);

  const currentUrl = useMemo(
    () => (urls.length > 0 ? urls[selectedIndex] ?? null : null),
    [urls, selectedIndex]
  );

  // 大图区域滚轮缩放：须 passive: false 才能 preventDefault，避免背景跟滚
  useEffect(() => {
    if (!isOpen || currentUrl == null) {
      return;
    }
    const el = previewWheelRef.current;
    if (!el) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY === 0) {
        return;
      }
      // 向下滚（deltaY > 0）缩小，向上滚放大，与地图/看图类交互一致
      const sign = e.deltaY > 0 ? -1 : 1;
      setPreviewScale((s) => {
        const next = Math.round((s + sign * PREVIEW_SCALE_STEP) * 100) / 100;
        return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, next));
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen, selectedIndex, currentUrl]);

  const canPrev = useMemo(() => selectedIndex > 0, [selectedIndex]);

  const canNext = useMemo(
    () => urls.length > 0 && selectedIndex < urls.length - 1,
    [urls.length, selectedIndex]
  );

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => {
      const last = urls.length - 1;
      return i < last ? i + 1 : i;
    });
  }, [urls.length]);

  const rotatePreview = useCallback(() => {
    setPreviewRotation((deg) => (deg + 90) % 360);
  }, []);

  const zoomPreviewIn = useCallback(() => {
    setPreviewScale((s) =>
      Math.min(PREVIEW_SCALE_MAX, Math.round((s + PREVIEW_SCALE_STEP) * 100) / 100)
    );
  }, []);

  const zoomPreviewOut = useCallback(() => {
    setPreviewScale((s) =>
      Math.max(PREVIEW_SCALE_MIN, Math.round((s - PREVIEW_SCALE_STEP) * 100) / 100)
    );
  }, []);

  const resetPreviewZoom = useCallback(() => {
    setPreviewScale(1);
  }, []);

  const canZoomIn = previewScale < PREVIEW_SCALE_MAX;
  const canZoomOut = previewScale > PREVIEW_SCALE_MIN;

  // 标题行：行政区 + 单条 address，用于地图下钻等场景
  const locationTitleLine = useMemo(() => {
    const parts: string[] = [];
    if (locationMeta) {
      for (const key of ['provinceName', 'cityName', 'districtName'] as const) {
        const s = (locationMeta[key] ?? '').trim();
        if (s) {
          parts.push(s);
        }
      }
    }
    if (currentImageAddress) {
      parts.push(currentImageAddress);
    }
    return parts.join(' · ');
  }, [locationMeta, currentImageAddress]);

  return (
    <AnimatePresence>
      {isOpen && urls.length > 0 && currentUrl != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 top-0 left-0  right-0 bottom-0  flex flex-col items-center w-full h-screen justify-center dark:bg-black/80 bg-neutral-300/80 backdrop-blur-lg cursor-zoom-out'
          onClick={onBackdropClick}
        >
          {/* 主卡片：阻止冒泡，避免误触遮罩关闭 */}
          <motion.div
            layoutId={uniqueId}
            className='rounded-md box-border w-[95%]  h-[80%] max-h-[90vh] flex flex-row gap-3 items-stretch mx-auto cursor-auto min-w-0'
            onClick={(e) => e.stopPropagation()}
          >
            {/* key=selectedIndex：换图时整段重挂载，配合 AnimatePresence 做淡入 */}
            <motion.figure
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { ease: 'easeInOut', duration: 0.25 },
              }}
              exit={{ opacity: 0 }}
              className='flex flex-col dark:bg-neutral-900/40 bg-neutral-100/40 border-2 border-input rounded-md p-4 flex-1 min-w-0 min-h-0'
            >
              {locationTitleLine ? (
                <div className='mb-3 shrink-0 border-b border-border pb-3 text-sm'>
                  <p className='font-medium text-foreground whitespace-nowrap overflow-x-auto [scrollbar-width:thin]'>
                    {locationTitleLine}
                  </p>
                </div>
              ) : null}
              <div className='flex min-h-0 flex-1 flex-col'>
                {/* 大图聚焦区：滚轮缩放仅绑此节点 */}
                <div
                  ref={previewWheelRef}
                  className='flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden'
                  title='滚轮缩放'
                >
                  <div className='relative size-full min-h-[240px] min-w-0'>
                    {/* 旋转与缩放合并为单次 transform，origin-center 围绕中心变换 */}
                    <div
                      className='relative size-full origin-center transition-transform duration-300 ease-out'
                      style={{
                        transform: `rotate(${previewRotation}deg) scale(${previewScale})`,
                      }}
                    >
                      <Image
                        src={currentUrl}
                        alt={`preview_${selectedIndex}`}
                        className='size-full min-h-0 min-w-0'
                        loading='eager'
                        objectFit='contain'
                      />
                    </div>
                  </div>
                </div>
                <div className='mt-3 flex flex-wrap shrink-0 items-center justify-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!canPrev}
                    onClick={goPrev}
                    aria-label='上一张'
                    title='上一张'
                  >
                    <ChevronLeft className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!canZoomOut}
                    onClick={zoomPreviewOut}
                    aria-label='缩小'
                    title='缩小'
                  >
                    <ZoomOut className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!canZoomIn}
                    onClick={zoomPreviewIn}
                    aria-label='放大'
                    title='放大'
                  >
                    <ZoomIn className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={previewScale === 1}
                    onClick={resetPreviewZoom}
                    aria-label='重置缩放'
                    title='重置缩放'
                  >
                    <Undo2 className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={rotatePreview}
                    aria-label='顺时针旋转'
                    title='旋转'
                  >
                    <RotateCw className='size-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!canNext}
                    onClick={goNext}
                    aria-label='下一张'
                    title='下一张'
                  >
                    <ChevronRight className='size-4' />
                  </Button>
                </div>
              </div>
            </motion.figure>
            {/* 右侧：关闭 + 可拖拽/滚动的缩略列表 */}
            <div className='flex flex-col gap-2 h-full'>
              <Button
                onClick={onCloseButtonClick}
                variant="outline"
              >
                关闭画廊
              </Button>
              <div
                ref={setThumbViewport}
                className='cursor-grab flex-1 min-h-0 w-[120px] sm:w-[132px] shrink-0 no-scrollbar overflow-auto dark:bg-neutral-900/40 bg-white/40 border border-solid border-input rounded-md p-2 flex flex-col'
                role='list'
              >
                <motion.div
                  className='flex flex-col gap-2 h-fit'
                  drag='y'
                  dragConstraints={{ top: thumbDragConstraints, bottom: 0 }}
                  dragElastic={0.2}
                  dragTransition={{ bounceDamping: 30 }}
                  whileDrag={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {urls.map((url, i) => (
                    <GalleryThumb
                      key={`${i}-${String(url)}`}
                      url={url}
                      index={i}
                      selectedIndex={selectedIndex}
                      scrollRoot={thumbScrollRoot}
                      onPick={() => setSelectedIndex(i)}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
