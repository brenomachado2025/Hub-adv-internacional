"use client";

import { Reveal } from "../Reveal";

export function MapSection() {
  return (
    <section id="mapa" data-scene="map" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">DE EMPRESAS BRASILEIRAS A OPERAÇÕES INTERNACIONAIS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">DE ESCRITÓRIOS DE ADVOCACIA A REDES DE HOTÉIS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">DE DIFERENTES SEGMENTOS A DIFERENTES DESAFIOS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-sub" style={{ fontSize: "clamp(16px,2vw,22px)", maxWidth: "46ch" }}>
            Cada empresa possui uma realidade diferente.
            <br />
            Por isso, nossa tecnologia não começa com uma ferramenta.
            <br />
            Começa com uma pergunta:
          </p>
        </Reveal>
        <Reveal delay={250}>
          <p className="hub-headline hub-glow" style={{ marginTop: 22 }}>
            O QUE A SUA EMPRESA REALMENTE PRECISA?
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const TIMELINE = [
  "Começo",
  "Primeiros projetos",
  "Primeiros clientes",
  "Desenvolvimento de soluções",
  "Expansão",
  "Mais empresas",
  "Mais tecnologia",
  "Mais complexidade",
  "HUB INTERNACIONAL",
];

export function History() {
  return (
    <section id="historia" data-scene="history" >
      <div className="hub-stage">
        <Reveal>
          <div className="hub-badge">NOSSA HISTÓRIA</div>
        </Reveal>
        <Reveal delay={150}>
          <p className="hub-sub" style={{ fontSize: "clamp(16px,2vw,22px)", maxWidth: "48ch", marginTop: 18 }}>
            Há mais de 4 anos, começamos a construir soluções para empresas que buscavam crescer.
          </p>
        </Reveal>
      </div>

      <div className="hub-stage" style={{ minHeight: "80vh" }}>
        <div
          style={{
            position: "relative",
            width: "min(90vw, 900px)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "18px 28px",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(127,196,255,0.4), transparent)",
            }}
          />
          {TIMELINE.map((label, i) => (
            <Reveal
              key={label}
              delay={i * 100}
              className={i === TIMELINE.length - 1 ? "hub-glow" : ""}
              style={{
                position: "relative",
                padding: "10px 6px",
                fontSize: i === TIMELINE.length - 1 ? "clamp(16px,2vw,22px)" : 13,
                fontWeight: i === TIMELINE.length - 1 ? 700 : 600,
                letterSpacing: "0.03em",
                color: i === TIMELINE.length - 1 ? "#eef4fb" : "#9db6cf",
              }}
            >
              {label}
            </Reveal>
          ))}
        </div>
      </div>

      <div className="hub-stage">
        <Reveal>
          <p className="hub-sub" style={{ fontSize: "clamp(16px,2vw,22px)", maxWidth: "50ch" }}>
            Vieram novos desafios. Novos mercados. Novas tecnologias. Novas empresas.
          </p>
        </Reveal>
        <Reveal delay={250}>
          <p className="hub-headline hub-headline--tight" style={{ marginTop: 24 }}>
            E uma certeza foi ficando cada vez maior: as empresas não precisam de mais ferramentas.
          </p>
        </Reveal>
        <Reveal delay={400}>
          <p className="hub-headline hub-glow" style={{ marginTop: 10 }}>
            Elas precisam de ferramentas que trabalhem juntas.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const FOUNDERS = [
  { name: "Breno Machado", role: "Fundador" },
  { name: "Rafael", role: "Fundador" },
];

export function Founders() {
  return (
    <section data-scene="founders" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">POR TRÁS DA TECNOLOGIA, EXISTEM PESSOAS.</p>
        </Reveal>
        <Reveal delay={200}>
          <p className="hub-sub">O HUB INTERNACIONAL nasceu da união de duas visões.</p>
        </Reveal>
      </div>

      <div className="hub-stage">
        <div className="hub-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", width: "min(90vw, 640px)" }}>
          {FOUNDERS.map((f, i) => (
            <Reveal key={f.name} delay={i * 150} className="hub-glass" style={{ padding: 28, textAlign: "center" }}>
              <div
                aria-hidden
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  margin: "0 auto 18px",
                  background: "linear-gradient(140deg, rgba(79,178,255,0.35), rgba(79,178,255,0.05))",
                  border: "1px solid rgba(127,196,255,0.35)",
                }}
              />
              <p style={{ fontSize: 18, fontWeight: 700 }}>{f.name}</p>
              <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "#7fc4ff", marginTop: 4 }}>{f.role.toUpperCase()}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={350}>
          <p className="hub-sub" style={{ marginTop: 32, maxWidth: "50ch" }}>
            Duas trajetórias. Uma mesma inquietação: encontrar maneiras mais inteligentes de conectar empresas,
            pessoas e tecnologia.
          </p>
        </Reveal>
      </div>

      <div className="hub-stage">
        <Reveal>
          <p className="hub-sub" style={{ fontSize: "clamp(16px,2vw,22px)", maxWidth: "48ch" }}>
            Começamos construindo soluções. Depois vieram os processos. Os clientes. Os desafios. Os aprendizados.
          </p>
        </Reveal>
        <Reveal delay={250}>
          <p className="hub-headline hub-headline--tight hub-glow" style={{ marginTop: 20 }}>
            E, com eles, nasceu uma visão maior.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const VISION_WORDS = [
  "TECNOLOGIA",
  "PESSOAS",
  "DADOS",
  "AQUISIÇÃO",
  "VENDAS",
  "PROCESSOS",
  "AUTOMAÇÃO",
  "GESTÃO",
];

export function Vision() {
  return (
    <section data-scene="vision" >
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">O FUTURO DAS EMPRESAS NÃO SERÁ FRAGMENTADO.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-glow">SERÁ CONECTADO.</p>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 30, maxWidth: 560 }}>
          {VISION_WORDS.map((w, i) => (
            <Reveal key={w} delay={300 + i * 90} className="hub-badge">
              {w}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
