"use client";

import { Reveal } from "../Reveal";
import { DEFAULT_WHATSAPP_MESSAGE, waLink } from "../constants";

const MANIFESTO_LINES = [
  "NÃO SOMOS APENAS UMA AGÊNCIA.",
  "NÃO SOMOS APENAS UMA SOFTWARE HOUSE.",
  "NÃO SOMOS APENAS UMA EMPRESA DE TECNOLOGIA.",
  "SOMOS UMA ESTRUTURA.",
  "UMA EQUIPE.",
  "UM ECOSSISTEMA.",
  "UM HUB.",
];

export function Manifesto() {
  return (
    <section data-scene="manifesto" >
      {MANIFESTO_LINES.map((line) => (
        <div key={line} className="hub-manifesto-line">
          <Reveal>
            <p className="hub-headline hub-headline--tight">{line}</p>
          </Reveal>
        </div>
      ))}
      <div className="hub-manifesto-line">
        <Reveal>
          <p className="hub-headline hub-glow">
            CRIADO PARA CONECTAR O QUE SUA EMPRESA PRECISA PARA CHEGAR ONDE ELA QUER.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Future() {
  return (
    <section data-scene="future" className="hub-stage">
      <Reveal>
        <p className="hub-headline">UMA EMPRESA.</p>
      </Reveal>
      <Reveal delay={150}>
        <p className="hub-headline">UM ECOSSISTEMA.</p>
      </Reveal>
      <Reveal delay={300}>
        <p className="hub-headline hub-glow">INÚMERAS POSSIBILIDADES.</p>
      </Reveal>
    </section>
  );
}

export function Conversion() {
  return (
    <section id="contato" data-scene="conversion" className="hub-stage">
      <Reveal>
        <div className="hub-badge">CONTATO</div>
      </Reveal>
      <Reveal delay={150}>
        <p className="hub-headline hub-headline--tight" style={{ marginTop: 18 }}>
          AGORA QUEREMOS CONHECER A SUA EMPRESA.
        </p>
      </Reveal>
      <Reveal delay={280}>
        <p className="hub-sub">
          Conte-nos onde você está. Mostre-nos onde quer chegar. Nós analisamos seus processos, identificamos
          oportunidades e pensamos junto com você em uma estrutura capaz de transformar tecnologia em crescimento.
        </p>
      </Reveal>
      <Reveal delay={420}>
        <p className="hub-headline hub-headline--tight hub-glow" style={{ marginTop: 30 }}>
          SEU PRÓXIMO NÍVEL COMEÇA COM UMA CONVERSA.
        </p>
      </Reveal>
      <Reveal delay={560}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 34 }}>
          <a href="#o-hub" className="hub-btn hub-btn--ghost">
            QUERO CONHECER O HUB
          </a>
          <a
            href={waLink(DEFAULT_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-btn hub-btn--primary"
          >
            FALAR COM NOSSA EQUIPE
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export function Finale() {
  return (
    <section data-scene="finale" className="hub-stage">
      <Reveal>
        <p className="hub-headline hub-headline--tight">TODA GRANDE CONEXÃO COMEÇA COM UMA CONVERSA.</p>
      </Reveal>
      <Reveal delay={220}>
        <p className="hub-kicker" style={{ marginTop: 30 }}>
          HUB INTERNACIONAL
        </p>
      </Reveal>
      <Reveal delay={340}>
        <p className="hub-sub">Tecnologia. Estratégia. Aquisição. Crescimento.</p>
      </Reveal>
      <Reveal delay={480}>
        <a
          href={waLink(DEFAULT_WHATSAPP_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="hub-btn hub-btn--primary"
          style={{ marginTop: 30 }}
        >
          COMEÇAR UMA CONVERSA
        </a>
      </Reveal>
    </section>
  );
}
