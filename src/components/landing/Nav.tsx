"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollProgressRef } from "./scroll-progress";
import { RANGES } from "./timeline";

const HIDE_RANGES: Array<[number, number]> = [
  [0, RANGES.space.start + 0.02],
  [RANGES.manifesto.start, RANGES.manifesto.end],
];

function shouldHide(p: number) {
  return HIDE_RANGES.some(([a, b]) => p >= a && p <= b);
}

const LINKS = [
  { href: "#o-hub", label: "O HUB" },
  { href: "#solucoes", label: "SOLUÇÕES" },
  { href: "#historia", label: "NOSSA HISTÓRIA" },
  { href: "#tecnologia", label: "TECNOLOGIA" },
  { href: "#contato", label: "CONTATO" },
];

export function Nav({ whatsappHref }: { whatsappHref: string }) {
  const progressRef = useScrollProgressRef();
  const [hidden, setHidden] = useState(false);
  const lastRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const h = shouldHide(progressRef.current);
      if (h !== lastRef.current) {
        lastRef.current = h;
        setHidden(h);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 5vw",
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(-14px)" : "translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <a
        href="#top"
        style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", color: "#eef4fb", textDecoration: "none" }}
      >
        HUB INTERNACIONAL
      </a>
      <nav style={{ display: "flex", alignItems: "center", gap: 28 }} className="hub-nav-links">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "#c3d3e6",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {l.label}
          </a>
        ))}
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hub-btn hub-btn--primary" style={{ padding: "10px 20px", fontSize: 11 }}>
          FALAR CONOSCO
        </a>
      </nav>
    </header>
  );
}
