"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
}

export default function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef<"light" | "dark">("dark");
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set initial theme
    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    themeRef.current = getTheme();

    // Observe theme attribute changes
    const observer = new MutationObserver(() => {
      themeRef.current = getTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let animationId: number;
    let particles: Particle[] = [];
    const maxParticles = 60;
    const connectionDist = 120;
    const mouseConnectionDist = 180;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 25000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          targetAlpha: Math.random() * 0.5 + 0.2,
        });
      }
    };

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    resizeCanvas();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = themeRef.current === "dark";

      // Styles based on theme
      const starColor = isDark ? "255, 246, 230" : "111, 76, 53";
      const lineColor = isDark ? "255, 246, 230" : "111, 76, 53";

      // Draw and update particles
      particles.forEach((p) => {
        // Drifting animation
        p.x += p.vx;
        p.y += p.vy;

        // Bounce back inside boundaries
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Soft twinkle animation
        if (Math.random() < 0.01) {
          p.targetAlpha = Math.random() * 0.6 + 0.2;
        }
        p.alpha += (p.targetAlpha - p.alpha) * 0.05;

        // Particle shape representation
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${p.alpha})`;
        ctx.fill();
      });

      // Draw constellation grid lines (Dark Mode only)
      if (isDark) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];

          // Check proximity to other stars
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDist) {
              const alpha = (1 - dist / connectionDist) * 0.14;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
              ctx.lineWidth = 0.55;
              ctx.stroke();
            }
          }

          // Check proximity to user mouse pointer
          if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
            const dx = p1.x - mouseRef.current.x;
            const dy = p1.y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseConnectionDist) {
              const alpha = (1 - dist / mouseConnectionDist) * 0.22;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
              ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
              ctx.lineWidth = 0.65;
              ctx.stroke();

              // Gentle pull effect towards mouse cursor
              p1.x -= dx * 0.008;
              p1.y -= dy * 0.008;
            }
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 h-full w-full pointer-events-none opacity-40 md:opacity-50 transition-opacity duration-700"
    />
  );
}
