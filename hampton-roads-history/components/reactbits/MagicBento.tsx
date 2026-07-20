"use client";

// Adapted from react-bits (DavidHDev/react-bits, Components/MagicBento).
// The original ships a fixed grid over a hardcoded `cardData` array; this
// port keeps the exact interaction model (GSAP tilt / magnetism / star
// particles / click ripple + a cursor-tracked global spotlight and
// masked border-glow) but exposes composable <BentoGrid> and <BentoCard>
// primitives so any content — city tiles, dashboard cells, cross-links —
// can opt into the effect. Colors are themed per card via `--glow-color`
// (an "r, g, b" triplet) rather than the library's hardcoded purple.
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { gsap } from "gsap";

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_SPOTLIGHT_RADIUS = 320;
const MOBILE_BREAKPOINT = 768;

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const createParticleElement = (x: number, y: number, glowColor: string): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "rb-particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${glowColor}, 1);
    box-shadow: 0 0 6px rgba(${glowColor}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
    --glow-color: ${glowColor};
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

export interface BentoCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Glow/particle color as an "r, g, b" triplet, e.g. "201, 61, 55". */
  glowColor: string;
  /** Whole-card navigation target (rendered as a stretched overlay link). */
  href?: string;
  ariaLabel?: string;
  enableBorderGlow?: boolean;
  enableStars?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  particleCount?: number;
  /** Set by <BentoGrid>; consumers normally don't pass this. */
  disableAnimations?: boolean;
}

export function BentoCard({
  children,
  className = "",
  style,
  glowColor,
  href,
  ariaLabel,
  enableBorderGlow = true,
  enableStars = false,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  disableAnimations = false,
}: BentoCardProps) {
  const isMobile = useMobileDetection();
  const reducedMotion = useReducedMotion();
  const animationsOff = disableAnimations || isMobile || reducedMotion;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => particle.parentNode?.removeChild(particle),
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true) as HTMLElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: "power2.inOut", repeat: -1, yoyo: true });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (animationsOff || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      if (enableStars) animateParticles();
      if (enableTilt) {
        gsap.to(element, { rotateX: 5, rotateY: 5, duration: 0.3, ease: "power2.out", transformPerspective: 1000 });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      if (enableStars) clearAllParticles();
      if (enableTilt) gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.3, ease: "power2.out" });
      if (enableMagnetism) gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(element, { rotateX, rotateY, duration: 0.1, ease: "power2.out", transformPerspective: 1000 });
      }
      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        magnetismAnimationRef.current = gsap.to(element, { x: magnetX, y: magnetY, duration: 0.3, ease: "power2.out" });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => ripple.remove() }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    animationsOff,
    enableStars,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  const cardStyle: CSSVars = { ...(style as CSSVars), "--glow-color": glowColor };

  return (
    <div
      ref={cardRef}
      className={`rb-bento-card ${enableBorderGlow ? "rb-bento-card--border-glow" : ""} ${className}`}
      style={cardStyle}
    >
      {children}
      {href && (
        <Link href={href} className="rb-bento-card__link" aria-label={ariaLabel}>
          <span className="sr-only">{ariaLabel}</span>
        </Link>
      )}
    </div>
  );
}

interface GlobalSpotlightProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  spotlightRadius: number;
  glowColor: string;
}

function GlobalSpotlight({ gridRef, enabled, spotlightRadius, glowColor }: GlobalSpotlightProps) {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !gridRef.current) return;

    const spotlight = document.createElement("div");
    spotlight.className = "rb-global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current.closest(".rb-bento-section");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        !!rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>(".rb-bento-card"));

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
        cards.forEach((card) => card.style.setProperty("--glow-intensity", "0"));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) glowIntensity = 1;
        else if (effectiveDistance <= fadeDistance)
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: "power2.out" });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll<HTMLElement>(".rb-bento-card").forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
      });
      if (spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, enabled, spotlightRadius, glowColor]);

  return null;
}

export interface BentoGridProps {
  children: ReactNode;
  className?: string;
  /** Enables the cursor-tracked global spotlight over the grid. */
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  /** Spotlight color as an "r, g, b" triplet. */
  glowColor?: string;
  "aria-label"?: string;
}

// Provider for the shared cursor spotlight. Individual cards decide their own
// per-card effects; this only wires the grid-level spotlight and marks the
// section so the spotlight can bound itself to it. Effects self-disable on
// touch/small viewports and when the user prefers reduced motion — the
// disabled state is exposed to descendant cards via a data attribute so a
// card can read it if needed, while cards themselves also gate internally.
export function BentoGrid({
  children,
  className = "",
  enableSpotlight = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = "132, 0, 255",
  "aria-label": ariaLabel,
}: BentoGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobileDetection();
  const reducedMotion = useReducedMotion();
  const disabled = isMobile || reducedMotion;

  return (
    <>
      {enableSpotlight && !disabled && (
        <GlobalSpotlight gridRef={gridRef} enabled spotlightRadius={spotlightRadius} glowColor={glowColor} />
      )}
      <div
        ref={gridRef}
        className={`rb-bento-section ${className}`}
        data-rb-disabled={disabled ? "true" : "false"}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>
  );
}
