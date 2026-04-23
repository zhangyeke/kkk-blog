export const animations = {
    count: {
        initial: {y: -15, opacity: 0},
        animate: {y: 0, opacity: 1},
        exit: {y: 15, opacity: 0},
    },
    heart: {
        tap: {scale: 0.85},
    },
    particle: (index: number) => ({
        initial: {x: "-50%", y: "-50%", scale: 0, opacity: 0},
        animate: {
            x: `calc(-50% + ${Math.cos((index * Math.PI) / 3) * 35}px)`,
            y: `calc(-50% + ${Math.sin((index * Math.PI) / 3) * 35}px)`,
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
        },
        transition: {duration: 0.6, delay: index * 0.02, ease: "easeOut" as const},
    }),
    glow: {
        initial: {scale: 1, opacity: 0},
        animate: {scale: [1, 1.6], opacity: [0.6, 0]},
        transition: {duration: 0.5, ease: "easeOut" as const},
    }
};
