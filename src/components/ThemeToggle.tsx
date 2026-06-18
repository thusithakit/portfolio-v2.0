"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get initial theme on mount to prevent mismatch
    const currentTheme = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(currentTheme);
    setReady(true);
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Check if View Transitions API is supported by the browser
    if (!(document as any).startViewTransition) {
      setTheme(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("site-theme", nextTheme);
      return;
    }

    // Get the click position, or fallback to the button's center
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("site-theme", nextTheme);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 650,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });
  };

  if (!ready) {
    return (
      <div className="h-11 w-11 rounded-full border border-ink-200/18 bg-ink-800/72 opacity-50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="celestial-toggle group fixed right-4 top-4 z-[60] grid h-11 w-11 place-items-center rounded-full border border-[var(--theme-toggle-border)] bg-[var(--theme-toggle-bg)] shadow-[var(--theme-toggle-shadow)] backdrop-blur-2xl transition-all duration-500 hover:border-peach-300/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-peach-300 md:right-8 md:top-5"
    >
      {/* Background glow and rings */}
      <span aria-hidden="true" className="absolute inset-[14%] rounded-full border border-peach-300/45 animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
      
      <span className="relative grid h-7 w-7 place-items-center transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-95">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="csun" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#fff7e8" />
              <stop offset="44%" stopColor="#ffd27a" />
              <stop offset="100%" stopColor="#f2a046" />
            </radialGradient>
            <radialGradient id="csunh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,206,128,0.55)" />
              <stop offset="55%" stopColor="rgba(255,176,92,0.16)" />
              <stop offset="100%" stopColor="rgba(255,176,92,0)" />
            </radialGradient>
            <radialGradient id="cmoon" cx="38%" cy="36%" r="72%">
              <stop offset="0%" stopColor="#fbf8f1" />
              <stop offset="58%" stopColor="#e7e6df" />
              <stop offset="100%" stopColor="#c6cad4" />
            </radialGradient>
            <radialGradient id="cmoonh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(205,216,242,0.5)" />
              <stop offset="55%" stopColor="rgba(158,176,222,0.16)" />
              <stop offset="100%" stopColor="rgba(158,176,222,0)" />
            </radialGradient>
          </defs>
          
          {/* Sun Halo (Visible in Light Mode) */}
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="url(#csunh)"
            className="transition-all duration-700 origin-center"
            style={{
              opacity: theme === "light" ? 1 : 0,
              transform: theme === "light" ? "none" : "scale(0.7)",
            }}
          />
          
          {/* Moon Halo (Visible in Dark Mode) */}
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="url(#cmoonh)"
            className="transition-all duration-700 origin-center"
            style={{
              opacity: theme === "dark" ? 1 : 0,
              transform: theme === "dark" ? "none" : "scale(0.7)",
            }}
          />
          
          {/* Constellation background for Moon */}
          <g
            className="transition-all duration-700"
            style={{ opacity: theme === "dark" ? 1 : 0 }}
          >
            <circle cx="20" cy="28" r="1.5" fill="#fbf8f1" className="animate-pulse" />
            <circle cx="82" cy="24" r="1.1" fill="#fbf8f1" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
            <circle cx="84" cy="66" r="1" fill="#fbf8f1" className="animate-pulse" style={{ animationDelay: "0.8s" }} />
          </g>
          
          {/* Sun Body & Rays */}
          <g
            className="transition-all duration-700 origin-center"
            style={{
              opacity: theme === "light" ? 1 : 0,
              transform: theme === "light" ? "none" : "scale(0.5) rotate(45deg)",
            }}
          >
            {/* Sun Rays */}
            <g className="hero-sun-rays">
              <line x1="74" y1="50" x2="81" y2="50" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="70.7" y1="62" x2="76.8" y2="65.5" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="62" y1="70.7" x2="65.5" y2="76.8" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="74" x2="50" y2="81" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="38" y1="70.7" x2="34.5" y2="76.8" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="29.2" y1="62" x2="23.1" y2="65.5" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="26" y1="50" x2="19" y2="50" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="29.2" y1="38" x2="23.1" y2="34.5" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="38" y1="29.2" x2="34.5" y2="23.1" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="26" x2="50" y2="19" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="62" y1="29.2" x2="65.5" y2="23.1" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="70.7" y1="38" x2="76.8" y2="34.5" stroke="#ffce80" strokeWidth="2.8" strokeLinecap="round" />
            </g>
            <circle cx="50" cy="50" r="16" fill="url(#csun)" />
          </g>
          
          {/* Moon Body & Craters */}
          <g
            className="transition-all duration-700 origin-center"
            style={{
              opacity: theme === "dark" ? 1 : 0,
              transform: theme === "dark" ? "none" : "scale(0.5) rotate(-45deg)",
            }}
          >
            <circle cx="50" cy="50" r="16" fill="url(#cmoon)" />
            {/* Craters */}
            <circle cx="44" cy="45" r="3.1" fill="rgba(150, 160, 186, 0.35)" />
            <circle cx="56.5" cy="52" r="2.1" fill="rgba(150, 160, 186, 0.3)" />
            <circle cx="48.5" cy="57.5" r="1.5" fill="rgba(150, 160, 186, 0.28)" />
          </g>
        </svg>
      </span>
      
      {/* Label under button on hover */}
      <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap bg-ink-800/80 px-2 py-1 rounded border border-ink-200/14">
        <span className={theme === "light" ? "text-peach-400 font-bold" : "text-ink-200"}>Day</span>
        <span className="text-ink-300 opacity-50">/</span>
        <span className={theme === "dark" ? "text-peach-300 font-bold" : "text-ink-200"}>Night</span>
      </span>
    </button>
  );
}
