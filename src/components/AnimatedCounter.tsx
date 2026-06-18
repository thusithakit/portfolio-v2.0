"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number; // in milliseconds
  delay?: number; // in milliseconds
}

export default function AnimatedCounter({
  target,
  suffix = "",
  duration = 1500,
  delay = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Start the animation after the specified delay
          setTimeout(() => {
            let startTimestamp: number | null = null;

            const step = (timestamp: number) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / duration, 1);
              
              // Premium speedometer ease-out expo easing function: 
              // Fast count-up initially, then beautifully decelerating as it settles on the final value
              const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              
              const currentVal = Math.floor(easeProgress * target);
              setCount(currentVal);

              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                setCount(target); // Ensure precise ending value
              }
            };

            window.requestAnimationFrame(step);
          }, delay);
        }
      },
      {
        threshold: 0.15, // trigger when 15% of the element is in view
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [target, duration, delay]);

  return (
    <span ref={elementRef} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}
