"use client";

import "./landing.css";
import { ScrollProgressProvider } from "./scroll-progress";
import { CanvasBackdrop } from "./CanvasBackdrop";
import { Nav } from "./Nav";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { DEFAULT_WHATSAPP_MESSAGE, waLink } from "./constants";
import { Hero, WorldToBrazil, Connection, Problem, HubBirth } from "./sections/EarlyScenes";
import { Solutions, Tech, Results } from "./sections/SolutionsAndTech";
import { MapSection, History, Founders, Vision } from "./sections/StoryAndMap";
import { Manifesto, Future, Conversion, Finale } from "./sections/ClosingScenes";

export function Landing() {
  const whatsappHref = waLink(DEFAULT_WHATSAPP_MESSAGE);

  return (
    <ScrollProgressProvider>
      <div id="hub-landing-root" />
      <CanvasBackdrop />
      <Nav whatsappHref={whatsappHref} />
      <main className="hub-landing">
        <Hero />
        <WorldToBrazil />
        <Connection />
        <Problem />
        <div id="o-hub">
          <HubBirth />
        </div>
        <Solutions />
        <Tech />
        <Results />
        <MapSection />
        <History />
        <Founders />
        <Vision />
        <Manifesto />
        <Future />
        <Conversion />
        <Finale />
      </main>
      <WhatsAppCTA />
    </ScrollProgressProvider>
  );
}
