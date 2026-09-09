"use client";

import { Reveal } from "../Reveal";

export function Hero() {
  return (
    <section id="top" data-scene="space" className="hub-stage">
      <Reveal delay={100}>
        <div className="hub-kicker">HUB INTERNACIONAL</div>
      </Reveal>
      <Reveal delay={250}>
        <h1 className="hub-headline hub-glow" style={{ maxWidth: "20ch" }}>
          Tecnologia. Estratégia.
          <br />
          Aquisição. Crescimento.
        </h1>
      </Reveal>
      <div className="hub-scroll-hint">
        <Reveal delay={700}>SCROLL PARA ENTRAR</Reveal>
      </div>
    </section>
  );
}

export function WorldToBrazil() {
  return (
    <section data-scene="worldToBrazil" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">O mundo mudou.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">As empresas também.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight hub-glow">E crescer ficou mais complexo.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function Connection() {
  return (
    <section data-scene="connection" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline">DO MUNDO PARA DENTRO DA SUA EMPRESA.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-sub" style={{ fontSize: "clamp(16px,2vw,22px)", maxWidth: "44ch" }}>
            Foi observando a complexidade do mercado que nasceu uma pergunta:
          </p>
        </Reveal>
        <Reveal delay={200}>
          <p className="hub-headline hub-headline--tight" style={{ marginTop: 22 }}>
            Por que uma empresa precisa de dezenas de ferramentas diferentes para fazer o que poderia estar
            conectado em um único ecossistema?
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const TOOLS = [
  "CRM",
  "MARKETING",
  "WHATSAPP",
  "VENDAS",
  "AUTOMAÇÃO",
  "APLICATIVOS",
  "DADOS",
  "GESTÃO",
];

export function Problem() {
  return (
    <section data-scene="problem" >
      <div className="hub-stage" style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden
          className="hub-tool-grid"
          style={{
            position: "absolute",
            inset: 0,
            padding: "10vh 10vw",
            pointerEvents: "none",
          }}
        >
          {TOOLS.map((tool, i) => (
            <Reveal key={tool} delay={i * 90} className="hub-glass" style={{ padding: "16px 10px", textAlign: "center" }}>
              <span style={{ fontSize: 12, letterSpacing: "0.08em", color: "#9db6cf", fontWeight: 700 }}>{tool}</span>
            </Reveal>
          ))}
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <p className="hub-headline hub-headline--tight">UM APLICATIVO PARA CADA NECESSIDADE.</p>
          </Reveal>
        </div>
      </div>

      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">UM SISTEMA PARA CADA PROCESSO.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">DADOS ESPALHADOS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">PROCESSOS DESCONECTADOS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-glow">COMPLEXIDADE.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">A TECNOLOGIA DEVERIA SIMPLIFICAR O CRESCIMENTO.</p>
        </Reveal>
        <Reveal delay={300}>
          <p className="hub-sub">NÃO COMPLICÁ-LO.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function HubBirth() {
  return (
    <section data-scene="hubBirth" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">FOI AQUI QUE ENTRAMOS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-glow">UM ÚNICO ECOSSISTEMA.</p>
        </Reveal>
      </div>
    </section>
  );
}
