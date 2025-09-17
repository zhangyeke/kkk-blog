'use client';
import React, { useRef, useState} from 'react';
import {useIsomorphicLayoutEffect} from "react-use"
import {hex2rgb, rgbaRegex} from "@/lib/color";

// 1. 在 Props 接口中添加 animated 属性
export interface WavyProps {
    // 组件宽度
    width?: number;
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
        width = 300,
        height = 150,
        waveHeight = 30,
        waveLength = 0.012,
        waveSpeed = 2,
        waveColor = '#ffffff',
        direction = 'ltr',
        animated = true, // 默认开启动画
    } = props;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const waveOffset = useRef(0);
    const [isMounted, setIsMounted] = useState(false);


    useIsomorphicLayoutEffect(() => {
        setIsMounted(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawWave = () => {
            ctx.clearRect(0, 0, width, height);
            let gradient
            if (rgbaRegex.test(waveColor)) {
                gradient = waveColor
            } else {
                // 3. 关键改动：创建并应用渐变
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                // 添加颜色断点：顶部 (0%) 的颜色透明度为 0.6
                gradient.addColorStop(0, hex2rgb(waveColor, 0.2));
                // 添加颜色断点：底部 (100%) 的颜色透明度为 1.0
                gradient.addColorStop(1, hex2rgb(waveColor, 0.92));

            }
            // 将填充样式设置为我们创建的渐变
            ctx.fillStyle = gradient;

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
    }, [width, height, waveHeight, waveLength, waveSpeed, waveColor, direction, animated, isMounted]); // 4. 将 animated 添加到依赖项数组

    if (!isMounted) {
        // 在服务端和客户端首次渲染时，都返回 null 或一个占位符
        // 这样可以传递父组件的宽度，但不会渲染 canvas
        return null;
    }
    return <canvas ref={canvasRef} width={width} height={height}/>
};

