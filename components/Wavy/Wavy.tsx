'use client';
import React, {useEffect, useRef} from 'react';

// 1. 在 Props 接口中添加 animated 属性
export interface WavyProps {
    // 组件宽度
    width: number;
    // 组件高度
    height?: number;
    // 波浪高度
    waveHeight?: number;
    // 波浪长度 值越大 波浪间隔越小
    waveLength?: number;
    // 波浪移动速度 值越大移动越快
    waveSpeed?: number;
    // 波浪颜色
    waveColor?: string;
    direction?: 'ltr' | 'rtl';
    animated?: boolean; // 控制是否开启动画
}

export const Wavy: React.FC<WavyProps> = (props) => {
    // 2. 解构出 animated prop 并设置默认值

    const {
        width,
        height = 150,
        waveHeight = 30,
        waveLength = 0.02,
        waveSpeed = 2,
        waveColor = 'rgba(255, 255, 255, 0.5)',
        direction = 'ltr',
        animated = true, // 默认开启动画
    } = props;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const waveOffset = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawWave = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = waveColor;

            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            for (let x = 0; x < width; x += 2) {
                const y = height / 2 + Math.sin((x + waveOffset.current) * waveLength) * waveHeight;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();

            // 3. 关键改动：只有在 animated 为 true 时才更新偏移量
            if (animated) {
                if (direction === 'ltr') {
                    waveOffset.current -= waveSpeed;
                } else {
                    waveOffset.current += waveSpeed;
                }
            }

            animationFrameId.current = requestAnimationFrame(drawWave);
        };

        // 立即绘制第一帧
        drawWave();

        return () => {
            if (typeof animationFrameId.current === "number") {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [width, height, waveHeight, waveLength, waveSpeed, waveColor, direction, animated]); // 4. 将 animated 添加到依赖项数组

    return <canvas ref={canvasRef} width={width} height={height}/>;
};

