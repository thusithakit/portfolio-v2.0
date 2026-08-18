"use client";

import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Sparkles,
  BookOpen,
  Music,
  Cpu,
  Code,
  Palette,
  Layers,
  Terminal,
  Mail,
  MessageSquare,
  ChevronRight,
  Monitor,
  Flame,
  Download
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ConstellationCanvas from "@/components/ConstellationCanvas";
import ContactForm from "@/components/ContactForm";
import AnimatedCounter from "@/components/AnimatedCounter";
import ChatWidget from "@/components/ChatWidget";

// Project Database
const projects = [
  {
    title: "VibeQueue",
    desc: "VibeQueue lets your group curate a hangout playlist together, blind. Suggest your favorite songs, vote on what stays, and hide who added what until the final reveal. Pure music, zero bias.",
    tech: ["Next.js", "TypeScript", "Firebase RTDB", "Clerk", "Zustand", "Push Notifications"],
    link: "https://vibequeue.vercel.app/",
  },
  {
    title: "ConnectWithMe.digital",
    desc: "A modern personal branding and digital profile sharing platform built with Clerk authentication, QR code sharing, vCard contact capabilities, and Cloudinary media delivery.",
    tech: ["Next.js", "TypeScript", "Prisma", "Clerk", "Cloudinary"],
    link: "https://www.connectwithme.digital",
  },
  {
    title: "Sanit.lk Business Website",
    desc: "Freelance client business site with 20+ reusable custom UI components, achieving a 98+ Lighthouse performance score and full meta SEO optimization.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "SEO"],
    link: "https://sanit-demo.netlify.app/",
  },
  {
    title: "Smart Garbage Bin",
    desc: "IoT smart system integrating ultrasonic sensors, GPS tracking, and Firebase to monitor waste levels, coupled with a Progressive Web App (PWA) responsive dashboard.",
    tech: ["Next.js", "TypeScript", "ESP8266", "Firebase", "PWA"],
    link: "https://github.com/thusithakit/go-green",
  },
  {
    title: "Travel Planner Website",
    desc: "Full-stack travel planner platform containing interactive customer itinerary boards, comprehensive admin panel management, and secure JWT token validation flows.",
    tech: ["React", "Spring Boot", "MongoDB", "TypeScript"],
    link: "https://github.com/thusithakit/Odyssey-admin-panel",
  }
];

// Timeline Database
const timelineItems = [
  {
    year: "'25 - Pres",
    title: "Software Engineer at Qoria LK",
    desc: "Working on EdTech Insights production micro-frontends with React + TS, Redux, and Chakra UI with full WCAG accessibility compliance."
  },
  {
    year: "'22 - '26",
    title: "BSc (Hons) Electronics & Computer Science",
    desc: "Studied core software engineering, data structures, and computer systems at University of Kelaniya, Sri Lanka."
  },
  {
    year: "'23 - '25",
    title: "UI Developer at Kongcepts",
    desc: "Developed responsive websites, converted Figma layouts to pixel-perfect code, and optimized loading performance and SEO rankings."
  }
];

// Interactive Physics Playground Node
interface GravityNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function PortfolioPage() {
  const [activeSection, setActiveSection] = useState("top");
  const [hue, setHue] = useState(25); // Peach hue default
  const physicsCanvasRef = useRef<HTMLCanvasElement>(null);
  const physicsNodesRef = useRef<GravityNode[]>([]);
  const physicsFrameRef = useRef<number | null>(null);

  // Scrollspy logic
  useEffect(() => {
    const sections = ["top", "origin", "philosophy", "track-record", "build-log", "toolkit", "signal"];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  // Gravity Physics Study loop
  useEffect(() => {
    const canvas = physicsCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizePlayground = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 400;
      canvas.height = rect?.height || 260;
    };

    window.addEventListener("resize", resizePlayground);
    resizePlayground();

    // Spawn initial particles
    const colors = ["#dec5ab", "#c9a589", "#8fa2ff", "#f5f1e8"];
    const nodes: GravityNode[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - 40),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    physicsNodesRef.current = nodes;

    const gravity = 0.15;
    const friction = 0.85;

    const updatePhysics = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      physicsNodesRef.current.forEach((node) => {
        // Apply gravity
        node.vy += gravity;
        node.x += node.vx;
        node.y += node.vy;

        // Ground collision
        if (node.y + node.radius > canvas.height) {
          node.y = canvas.height - node.radius;
          node.vy *= -friction;
          node.vx *= friction;
        }

        // Side wall collisions
        if (node.x - node.radius < 0) {
          node.x = node.radius;
          node.vx *= -friction;
        } else if (node.x + node.radius > canvas.width) {
          node.x = canvas.width - node.radius;
          node.vx *= -friction;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = node.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      // Draw connections
      ctx.beginPath();
      for (let i = 0; i < physicsNodesRef.current.length; i++) {
        const n1 = physicsNodesRef.current[i];
        for (let j = i + 1; j < physicsNodesRef.current.length; j++) {
          const n2 = physicsNodesRef.current[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 70) {
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
          }
        }
      }
      ctx.strokeStyle = "rgba(185, 169, 154, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      physicsFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    updatePhysics();

    return () => {
      window.removeEventListener("resize", resizePlayground);
      if (physicsFrameRef.current) cancelAnimationFrame(physicsFrameRef.current);
    };
  }, []);

  const handlePhysicsClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = physicsCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Push node with upward speed explosion
    const colors = ["#dec5ab", "#c9a589", "#8fa2ff", "#f5f1e8"];
    const newNode: GravityNode = {
      x: clickX,
      y: clickY,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5 - 2,
      radius: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    physicsNodesRef.current.push(newNode);
    if (physicsNodesRef.current.length > 35) {
      physicsNodesRef.current.shift(); // Max limit
    }
  };

  return (
    <>
      {/* Background Interactive canvas stars */}
      <ConstellationCanvas />

      {/* Themes Manager Button */}
      <ThemeToggle />

      {/* Floating Side TOC Navigation (Scrollspy) */}
      <nav className="toc-rail" aria-label="Table of contents rail">
        <div className="toc-rail-inner">
          <a href="#top" className={`toc-rail-item ${activeSection === "top" ? "active" : ""}`}>
            <span className="num">00</span>
            <span className="label">Intro</span>
          </a>
          <a href="#origin" className={`toc-rail-item ${activeSection === "origin" ? "active" : ""}`}>
            <span className="num">01</span>
            <span className="label">Background</span>
          </a>
          <a href="#philosophy" className={`toc-rail-item ${activeSection === "philosophy" ? "active" : ""}`}>
            <span className="num">02</span>
            <span className="label">Philosophy</span>
          </a>
          <a href="#track-record" className={`toc-rail-item ${activeSection === "track-record" ? "active" : ""}`}>
            <span className="num">03</span>
            <span className="label">Experience</span>
          </a>
          <a href="#build-log" className={`toc-rail-item ${activeSection === "build-log" ? "active" : ""}`}>
            <span className="num">04</span>
            <span className="label">Builds</span>
          </a>
          <a href="#toolkit" className={`toc-rail-item ${activeSection === "toolkit" ? "active" : ""}`}>
            <span className="num">05</span>
            <span className="label">Toolkit</span>
          </a>
          <a href="#signal" className={`toc-rail-item ${activeSection === "signal" ? "active" : ""}`}>
            <span className="num">06</span>
            <span className="label">Contact</span>
          </a>
        </div>
      </nav>

      {/* Primary Content wrapper */}
      <main className="relative z-10 flex flex-col w-full max-w-[1340px] mx-auto px-6 md:px-12 lg:px-20 pt-6 md:pt-10 pb-16">

        {/* ================= SECTION 00: HERO / INTRO ================= */}
        <section id="top" className="min-h-[75vh] flex flex-col justify-between pt-2 pb-8 md:pt-4 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] items-center gap-12 md:gap-16 w-full md:min-h-[calc(70vh-8rem)]">
            <div className="flex flex-col gap-6">

              {/* Back to top Pill */}
              <div className="self-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/18 bg-ink-800/72 px-4 py-1.5 text-xs text-cream-100 backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-peach-300 animate-pulse" />
                  <span className="font-mono uppercase tracking-widest text-[10px]">Open to Opportunities</span>
                </span>
              </div>

              {/* Big bold headline */}
              <div className="flex flex-col gap-3">
                <h1 className="font-display text-[clamp(2.5rem,8.5vw,7.5rem)] font-bold leading-[0.88] tracking-tight text-[var(--hero-headline-text)] uppercase" style={{ textShadow: "var(--hero-headline-shadow)" }}>
                  <span className="block">Thusitha</span>
                  <span className="block italic text-peach-300 font-medium lowercase">Kithuldora</span>
                </h1>
                <p className="font-mono text-[11px] tracking-[0.26em] text-[var(--hero-accent-text)] uppercase mt-2">
                  Frontend focused full-stack software engineer
                </p>
              </div>

              {/* Text Description */}
              <p className="max-w-[32rem] text-base md:text-lg leading-relaxed text-[var(--hero-body-text)] mt-4">
                I build scalable, accessible web architectures using React and TypeScript. Currently engineering micro-frontend EdTech platforms at Qoria LK, with a focus on WCAG compliance, state management, and pixel-perfect layouts.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 mt-6">
                <a
                  href="#signal"
                  className="group relative inline-flex min-h-[44px] items-center gap-3 overflow-hidden rounded-full bg-cream-100 px-6 py-3 text-sm font-medium text-ink-900 transition-all duration-300 hover:bg-peach-300 shadow-md cursor-pointer"
                >
                  <span>Get in touch</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <a
                  href="#build-log"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-ink-200/24 bg-ink-800/20 px-6 py-3 text-sm font-medium hover:border-peach-300/40 hover:bg-ink-800/40 transition-all duration-300 cursor-pointer"
                >
                  View My Work
                </a>
                <a
                  href="/thusitha-kithuldora-frontend-focused-software-engineer-cv.pdf"
                  download="Thusitha_Kithuldora_CV.pdf"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-peach-300/20 bg-peach-400/5 px-6 py-3 text-sm font-medium hover:border-peach-300/40 hover:bg-peach-400/10 text-peach-300 transition-all duration-300 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CV</span>
                </a>
              </div>

            </div>

            {/* Right Column: Hero Image */}
            <div className="flex justify-center lg:justify-end w-full">
              <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-visible select-none max-w-[350px] md:max-w-[480px] lg:max-w-[560px]">
                <img
                  src="/cartoon-me.png"
                  alt="Thusitha Kithuldora"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-xl hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Key Metrics / selected proof */}
          <div className="mt-12 md:mt-24 border-t border-[var(--hero-rule)] pt-6 grid grid-cols-3 gap-6 max-w-[42rem]">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[clamp(1.8rem,4vw,3.5rem)] font-bold leading-none text-[var(--hero-headline-text)]">
                <AnimatedCounter target={70} suffix="+" />
              </span>
              <span className="font-mono text-[9px] md:text-[10px] leading-snug tracking-wider text-[var(--hero-soft-text)] uppercase">Web projects completed</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-[clamp(1.8rem,4vw,3.5rem)] font-bold leading-none text-[var(--hero-headline-text)]">
                <AnimatedCounter target={5} suffix="+" />
              </span>
              <span className="font-mono text-[9px] md:text-[10px] leading-snug tracking-wider text-[var(--hero-soft-text)] uppercase">Years industry experience</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-[clamp(1.8rem,4vw,3.5rem)] font-bold leading-none text-[var(--hero-headline-text)]">
                <AnimatedCounter target={150} suffix="+" />
              </span>
              <span className="font-mono text-[9px] md:text-[10px] leading-snug tracking-wider text-[var(--hero-soft-text)] uppercase">CSS battle score solved</span>
            </div>
          </div>
        </section>

        {/* ================= NOW BOARD TICKER ================= */}
        <section className="relative border-y border-ink-200/18 py-6 my-16 bg-gradient-to-r from-transparent via-peach-300/5 to-transparent">
          <div className="grid grid-cols-1 md:grid-cols-[auto_repeat(4,minmax(0,1fr))] items-start gap-6 md:gap-8 text-xs">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-ink-200 md:min-h-[15px]">
              <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-peach-400/50"></span>
                <span className="relative rounded-full bg-peach-500 h-1 w-1"></span>
              </span>
              <span>Now · 2026</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-wider uppercase text-peach-400">Building</span>
              <span className="font-semibold text-cream-100">ConnectWithMe App</span>
              <span className="text-[11px] text-ink-200">Interactive link layouts</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-wider uppercase text-peach-400">Reading</span>
              <span className="font-semibold text-cream-100">Eloquent JavaScript</span>
              <span className="text-[11px] text-ink-200">Advanced patterns</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-wider uppercase text-peach-400">Listening</span>
              <span className="font-semibold text-cream-100">Syntax.fm</span>
              <span className="text-[11px] text-ink-200">Frontend tech trends</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-wider uppercase text-peach-400">Last Shipped</span>
              <span className="font-semibold text-cream-100">Tailwind System</span>
              <span className="text-[11px] text-ink-200">Custom theme config</span>
            </div>
          </div>
        </section>

        {/* ================= SECTION 01: BACKGROUND & WORKING STYLE ================= */}
        <section id="origin" className="py-16 md:py-24">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
              <span>01</span>
              <span className="h-px w-8 bg-peach-400/50"></span>
              <span>History & Working Style</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
              A software engineer who <span className="italic text-peach-300">bridges design & code</span>.
            </h2>
          </div>

          {/* Scrolling Disciplines Marquee */}
          <div className="border-y border-ink-200/14 py-4 my-8 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ink-900 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ink-900 to-transparent z-10" />

            <div className="marquee-track" style={{ "--marquee-duration": "30s" } as React.CSSProperties}>
              <div className="mq-rail">
                <div className="mq-group">
                  {["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Zod", "Firebase", "React Native", "Expo", "Figma to Code", "Node.js", "REST APIs", "UI/UX Layouts"].map((item, i) => (
                    <span key={i} className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-ink-200">
                      <span>{item}</span>
                      <span className="text-peach-400 font-bold">·</span>
                    </span>
                  ))}
                </div>
                <div className="mq-group" aria-hidden="true">
                  {["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Zod", "Firebase", "React Native", "Expo", "Figma to Code", "Node.js", "REST APIs", "UI/UX Layouts"].map((item, i) => (
                    <span key={i} className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-ink-200">
                      <span>{item}</span>
                      <span className="text-peach-400 font-bold">·</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-20 mt-12">

            {/* Bio paragraphs */}
            <div className="flex flex-col gap-6 text-sm md:text-base leading-relaxed text-ink-200">
              <p className="drop-cap text-cream-100 text-base md:text-lg">
                I build clean, interactive interfaces users love. Having developed over 70+ successful websites, I specialize in translating design prototypes into pixel-perfect, highly responsive frontend structures.
              </p>
              <p>
                My background includes studying Electronic and Computer Science at the University of Kelaniya, giving me solid foundational knowledge in object-oriented programming, data structures, and computer networking. I bridge the gap between backend data models and client-side screens.
              </p>
              <p>
                Whether it&apos;s production micro-frontends, e-learning products, or digital profile platforms, I focus on performance, semantic structure, WCAG accessibility, and testing. My stack includes React, TypeScript, Next.js, Redux, and Tailwind CSS.
              </p>

              {/* History Timeline */}
              <div className="mt-8">
                <h4 className="font-mono text-[10px] tracking-wider uppercase text-ink-100 mb-6 flex items-center gap-2">
                  <span>Professional Milestones</span>
                  <span className="h-px flex-grow bg-gradient-to-r from-ink-200/18 to-transparent"></span>
                </h4>
                <div className="relative pl-6 flex flex-col gap-8">
                  <div className="timeline-line" />

                  {timelineItems.map((item, i) => (
                    <div key={i} className="relative flex gap-6 items-baseline">
                      <span className="absolute -left-[24px] top-1.5 h-2 w-2 rounded-full bg-peach-400 shadow-[0_0_8px_var(--color-peach-300)]" />
                      <span className="font-mono text-[11px] tracking-wider text-peach-300 w-10 shrink-0">{item.year}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-display font-semibold text-cream-100 text-sm md:text-base">{item.title}</span>
                        <span className="text-xs text-ink-200">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vitals Sidebar */}
            <aside className="flex flex-col gap-6 self-start lg:sticky lg:top-24">
              <div className="border border-ink-200/18 bg-ink-800/36 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-baseline border-b border-ink-200/18 pb-3 mb-4">
                  <span className="font-display font-bold text-cream-100 text-lg">Vitals Card</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-200">Vol. 26</span>
                </div>

                <dl className="flex flex-col gap-4 text-xs md:text-sm">
                  <div className="grid grid-cols-[80px_1fr] items-baseline gap-2 border-b border-ink-200/14 pb-2.5">
                    <dt className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Currently</dt>
                    <dd className="text-cream-100 font-medium">Software Engineer at Qoria LK</dd>
                  </div>

                  <div className="grid grid-cols-[80px_1fr] items-baseline gap-2 border-b border-ink-200/14 pb-2.5">
                    <dt className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Education</dt>
                    <dd className="text-cream-100 font-medium">BSc (Hons) Electronics & Computer Science, Kelaniya University</dd>
                  </div>

                  <div className="grid grid-cols-[80px_1fr] items-baseline gap-2 border-b border-ink-200/14 pb-2.5">
                    <dt className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Location</dt>
                    <dd className="text-cream-100 font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-peach-300" />
                      <span>Colombo, Sri Lanka</span>
                    </dd>
                  </div>

                  <div className="grid grid-cols-[80px_1fr] items-baseline gap-2">
                    <dt className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Interests</dt>
                    <dd className="text-cream-100 font-medium">Micro-frontends, WCAG compliance, SEO optimization, responsive design</dd>
                  </div>
                </dl>
              </div>
            </aside>

          </div>
        </section>

        {/* ================= SECTION 02: PHILOSOPHY (STUDIES) ================= */}
        <section id="philosophy" className="py-16 md:py-24">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
              <span>02</span>
              <span className="h-px w-8 bg-peach-400/50"></span>
              <span>Philosophy & Studies</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
              Two studies in <span className="italic text-peach-300">interactivity & visual rendering</span>.
            </h2>
            <p className="text-xs text-ink-200 max-w-lg mt-2">
              These mini-sandboxes are built to showcase canvas speed render operations and real-time color spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

            {/* Study 1: Particle Gravity Canvas */}
            <div className="flex flex-col gap-3 p-6 bg-panel-bg border border-panel-border rounded-2xl shadow-lg">
              <div className="flex justify-between items-center border-b border-ink-200/18 pb-2">
                <span className="font-display font-semibold text-cream-100 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-peach-300" />
                  <span>Study I: Gravity Nodes</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Canvas Physics</span>
              </div>
              <p className="text-xs text-ink-200">
                Click inside the container below to launch floating nodes. They react to gravity and collide with boundaries.
              </p>

              {/* Physics Playground Canvas */}
              <div className="relative min-h-[220px] bg-ink-900/60 rounded-xl overflow-hidden border border-ink-200/14 cursor-pointer mt-2">
                <canvas
                  ref={physicsCanvasRef}
                  onClick={handlePhysicsClick}
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-wider text-ink-300 pointer-events-none bg-ink-900/80 px-2 py-0.5 rounded border border-ink-200/14">
                  Click to add node
                </div>
              </div>
            </div>

            {/* Study 2: OKLCH Hue spectrum contrast tool */}
            <div className="flex flex-col gap-3 p-6 bg-panel-bg border border-panel-border rounded-2xl shadow-lg">
              <div className="flex justify-between items-center border-b border-ink-200/18 pb-2">
                <span className="font-display font-semibold text-cream-100 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-peach-300" />
                  <span>Study II: Dynamic HSL Space</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-peach-400">Color Spectrum</span>
              </div>
              <p className="text-xs text-ink-200">
                Drag the slider to shift the palette hue. Observe the real-time contrast checking with the background.
              </p>

              <div className="flex flex-col gap-4 mt-2 p-4 bg-ink-900/40 border border-ink-200/14 rounded-xl">
                <div
                  className="h-16 rounded-lg transition-colors duration-300 flex items-center justify-center font-mono text-xs font-semibold"
                  style={{
                    backgroundColor: `hsl(${hue}, 80%, 65%)`,
                    color: hue > 50 && hue < 180 ? "#111" : "#fff"
                  }}
                >
                  hsl({hue}, 80%, 65%)
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-ink-200">
                    <span>Shifting Hue value</span>
                    <span>{hue}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hue}
                    onChange={(e) => setHue(parseInt(e.target.value))}
                    className="w-full h-1 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-peach-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div
                    className="p-2.5 rounded border border-ink-200/14 text-center text-[10px] font-mono transition-colors duration-300"
                    style={{ color: `hsl(${hue}, 85%, 65%)` }}
                  >
                    LIGHT: HSL ACCENT
                  </div>
                  <div
                    className="p-2.5 rounded border border-ink-200/14 text-center text-[10px] font-mono transition-colors duration-300"
                    style={{ borderColor: `hsl(${hue}, 85%, 45%)`, color: `hsl(${hue}, 85%, 50%)` }}
                  >
                    DARK: SHIFTED BORDER
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 03: EXPERIENCE ================= */}
        <section id="track-record" className="py-16 md:py-24 border-t border-ink-200/14">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
              <span>03</span>
              <span className="h-px w-8 bg-peach-400/50"></span>
              <span>Track Record</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
              A record of <span className="italic text-peach-300">professional delivery</span>.
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            <div className="p-6 bg-panel-bg border border-panel-border rounded-2xl flex flex-col md:flex-row gap-6 md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-peach-400">Current Role</span>
                <h3 className="font-display font-semibold text-cream-100 text-lg md:text-xl">Software Engineer</h3>
                <span className="text-xs text-ink-300 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-peach-300" />
                  <span>Qoria LK · Sep 2025 - Present</span>
                </span>
              </div>
              <p className="text-xs md:text-sm text-ink-200 max-w-md leading-relaxed">
                Working on EdTech Manager, a production-level EdTech micro-frontend application using React, TypeScript, Redux, and Vite Module Federation. Responsible for WCAG accessibility compliance and unit testing via Vitest.
              </p>
            </div>

            <div className="p-6 bg-panel-bg border border-panel-border rounded-2xl flex flex-col md:flex-row gap-6 md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-peach-400">Previous Role</span>
                <h3 className="font-display font-semibold text-cream-100 text-lg md:text-xl">UI Developer</h3>
                <span className="text-xs text-ink-300 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-peach-300" />
                  <span>Kongcepts · Oct 2020 - Jan 2025</span>
                </span>
              </div>
              <p className="text-xs md:text-sm text-ink-200 max-w-md leading-relaxed">
                Developed responsive websites, improving page load speeds by 50% through code splitting and image optimizations. Converted Figma/PSD layouts into pixel-perfect code matching WCAG 2.1 AA and SEO requirements.
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 04: PRODUCTS / BUILD LOG ================= */}
        <section id="build-log" className="py-16 md:py-24 border-t border-ink-200/14">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
              <span>04</span>
              <span className="h-px w-8 bg-peach-400/50"></span>
              <span>Build Log</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
              Selected <span className="italic text-peach-300">product architectures</span>.
            </h2>
            <p className="text-xs text-ink-200 max-w-lg mt-2">
              A selection of application dashboards, SaaS platforms, and layout prototypes.
            </p>
          </div>

          {/* Grid of cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {projects.map((proj, i) => (
              <div
                key={i}
                className="group relative flex flex-col justify-between p-6 bg-panel-bg border border-panel-border rounded-2xl shadow-lg transition-all duration-300 hover:border-peach-300/40 hover:-translate-y-1"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-display font-semibold text-cream-100 text-lg md:text-xl group-hover:text-peach-300 transition-colors">
                      {proj.title}
                    </h3>
                    <span className="font-mono text-[8px] tracking-widest text-ink-300 uppercase bg-ink-900/80 px-2 py-0.5 rounded border border-ink-200/14">
                      Build 0{i + 1}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-ink-200 leading-relaxed">
                    {proj.desc}
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  {/* Tech tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tech.map((t, idx) => (
                      <span key={idx} className="font-mono text-[9px] text-peach-300 bg-peach-400/5 px-2.5 py-0.5 rounded-full border border-peach-300/10">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* GitHub link */}
                  <div className="border-t border-ink-200/14 pt-3 flex justify-between items-center">
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cream-100 font-medium hover:text-peach-300 transition-all"
                    >
                      <span>Repository Code</span>
                      <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SECTION 05: TOOLKIT ================= */}
        <section id="toolkit" className="py-16 md:py-24 border-t border-ink-200/14">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
              <span>05</span>
              <span className="h-px w-8 bg-peach-400/50"></span>
              <span>Toolkit</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
              Developer <span className="italic text-peach-300">arsenal & systems</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

            {/* Core Languages */}
            <div className="p-6 bg-panel-bg border border-panel-border rounded-2xl">
              <div className="flex items-center gap-2.5 border-b border-ink-200/18 pb-3 mb-4">
                <Code className="h-5 w-5 text-peach-300" />
                <h3 className="font-display font-semibold text-cream-100">Languages</h3>
              </div>
              <ul className="flex flex-col gap-2.5 font-mono text-xs text-ink-200">
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>TypeScript</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>JavaScript (ES6+)</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>HTML5 / CSS3</span>
                  <span className="text-peach-400">Expert</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>SQL</span>
                  <span className="text-peach-400">Intermediate</span>
                </li>
              </ul>
            </div>

            {/* Frameworks & Styling */}
            <div className="p-6 bg-panel-bg border border-panel-border rounded-2xl">
              <div className="flex items-center gap-2.5 border-b border-ink-200/18 pb-3 mb-4">
                <Layers className="h-5 w-5 text-peach-300" />
                <h3 className="font-display font-semibold text-cream-100">Frameworks</h3>
              </div>
              <ul className="flex flex-col gap-2.5 font-mono text-xs text-ink-200">
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>React.js</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>Next.js (App Router)</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>Tailwind CSS</span>
                  <span className="text-peach-400">Expert</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Node.js / Express</span>
                  <span className="text-peach-400">Intermediate</span>
                </li>
              </ul>
            </div>

            {/* Dev Tools & Infrastructure */}
            <div className="p-6 bg-panel-bg border border-panel-border rounded-2xl">
              <div className="flex items-center gap-2.5 border-b border-ink-200/18 pb-3 mb-4">
                <Terminal className="h-5 w-5 text-peach-300" />
                <h3 className="font-display font-semibold text-cream-100">Developer Tools</h3>
              </div>
              <ul className="flex flex-col gap-2.5 font-mono text-xs text-ink-200">
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>Zod / React Hook Form</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>Firebase / Firestore</span>
                  <span className="text-peach-400">Intermediate</span>
                </li>
                <li className="flex justify-between border-b border-ink-200/14 pb-1">
                  <span>Git / GitHub Command</span>
                  <span className="text-peach-400">Advanced</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Figma (Design Conversion)</span>
                  <span className="text-peach-400">Expert</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* ================= SECTION 06: CONTACT / FORM ================= */}
        <section id="signal" className="py-16 md:py-24 border-t border-ink-200/14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20">

            {/* Contact Details */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] tracking-widest uppercase text-peach-400 flex items-center gap-2 mb-2">
                  <span>06</span>
                  <span className="h-px w-8 bg-peach-400/50"></span>
                  <span>Signal</span>
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-semibold text-cream-100 leading-tight">
                  Start a <span className="italic text-peach-300">conversation</span>.
                </h2>
                <p className="text-xs text-ink-200 max-w-sm leading-relaxed mt-2">
                  If you have a frontend role, client work, or simply want to check my capabilities, reach out below or via direct links.
                </p>
              </div>

              {/* Direct channels */}
              <div className="flex flex-col gap-4 mt-4 text-xs md:text-sm">

                <a
                  href="mailto:thusithakit3@gmail.com"
                  className="flex items-center gap-3 text-ink-200 hover:text-peach-300 transition-colors py-2 border-b border-ink-200/14"
                >
                  <Mail className="h-4.5 w-4.5 text-peach-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-300">Email</span>
                    <span className="font-semibold text-cream-100">thusithakit3@gmail.com</span>
                  </div>
                </a>

                <a
                  href="https://www.linkedin.com/in/thusitha-kithuldora-780b4417b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-ink-200 hover:text-peach-300 transition-colors py-2 border-b border-ink-200/14"
                >
                  <svg className="h-4.5 w-4.5 text-peach-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-300">LinkedIn</span>
                    <span className="font-semibold text-cream-100">thusitha-kithuldora</span>
                  </div>
                </a>

                <a
                  href="https://github.com/thusithakit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-ink-200 hover:text-peach-300 transition-colors py-2 border-b border-ink-200/14"
                >
                  <svg className="h-4.5 w-4.5 text-peach-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-300">GitHub</span>
                    <span className="font-semibold text-cream-100">github.com/thusithakit</span>
                  </div>
                </a>

                <a
                  href="https://wa.me/94762600331"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-ink-200 hover:text-peach-300 transition-colors py-2"
                >
                  <MessageSquare className="h-4.5 w-4.5 text-peach-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink-300">WhatsApp Direct</span>
                    <span className="font-semibold text-cream-100">+94 76 260 0331</span>
                  </div>
                </a>

              </div>
            </div>

            {/* Form wrapper */}
            <div>
              <ContactForm />
            </div>

          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="mt-24 pt-8 border-t border-ink-200/14 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-wider uppercase text-ink-300">
          <span>© 2026 Thusitha Kithuldora · Software Engineer</span>
          <div className="flex gap-4">
            <a href="#top" className="hover:text-peach-300 transition-colors">Back to top</a>
            <span>·</span>
            <span>Made with Next.js & Tailwind</span>
          </div>
        </footer>

      </main>

      {/* Floating real-time live chat widget */}
      <ChatWidget />
    </>
  );
}
