"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollProgressRef } from "./scroll-progress";
import { RANGES } from "./timeline";
import { DEFAULT_WHATSAPP_MESSAGE, waLink } from "./constants";

export function WhatsAppCTA() {
  const progressRef = useScrollProgressRef();
  const [visible, setVisible] = useState(false);
  const lastRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = progressRef.current > RANGES.space.end;
      if (v !== lastRef.current) {
        lastRef.current = v;
        setVisible(v);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <a
      href={waLink(DEFAULT_WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a HUB INTERNACIONAL no WhatsApp"
      style={{
        position: "fixed",
        right: "5vw",
        bottom: "5vh",
        zIndex: 30,
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #4fb2ff, #2f7dd8)",
        boxShadow: "0 12px 30px -6px rgba(79,178,255,0.6)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.7)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.36 5.08L2 22l5.06-1.33A9.94 9.94 0 0 0 12.02 22C17.54 22 22 17.52 22 12S17.54 2 12.02 2Zm5.24 14.2c-.22.62-1.27 1.21-1.76 1.28-.45.07-1.02.1-1.65-.1-.38-.12-.87-.28-1.5-.55-2.64-1.14-4.36-3.8-4.5-3.98-.13-.18-1.08-1.43-1.08-2.73s.68-1.93.93-2.2c.24-.26.53-.33.71-.33h.5c.16 0 .38-.06.6.45.22.53.75 1.83.82 1.96.07.13.11.29.02.47-.09.18-.13.29-.26.44-.13.15-.28.34-.4.46-.13.13-.27.27-.12.53.16.26.7 1.16 1.5 1.88 1.03.92 1.9 1.2 2.16 1.34.26.13.42.11.57-.07.16-.18.66-.77.84-1.03.18-.26.35-.22.58-.13.24.09 1.5.71 1.76.84.26.13.43.2.5.31.06.11.06.62-.16 1.24Z"
          fill="#041424"
        />
      </svg>
    </a>
  );
}
