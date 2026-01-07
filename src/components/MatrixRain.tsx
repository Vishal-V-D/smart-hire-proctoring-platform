import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&%';
        const fontSize = 14;
        const columns = width / fontSize;
        const drops: number[] = [];

        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100; // Start at random positions above the screen
        }

        const draw = () => {
            // Semi-transparent black to create trailing effect
            // VERY subtle opacity for the "fade" to make it look like rain
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#22d3ee'; // Cyan text
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));

                // Draw only if visible (optimization)
                // Random opacity for "glimmer"
                ctx.globalAlpha = Math.random() * 0.5 + 0.1;
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly
                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Move drop down - slower speed
                drops[i] += 0.5; // "Little low" speed
            }
            ctx.globalAlpha = 1.0;
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none opacity-20" // Low opacity for subtlety
            style={{ zIndex: 0 }}
        />
    );
};

export default MatrixRain;
