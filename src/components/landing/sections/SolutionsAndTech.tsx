"use client";

import { Reveal } from "../Reveal";

const SOLUTIONS = [
  { title: "AQUISIÇÃO DE LEADS", desc: "Criamos processos para transformar estratégias de aquisição em oportunidades reais de negócio." },
  { title: "PROCESSOS COMERCIAIS", desc: "Estruturamos a jornada entre o primeiro contato e a conversão." },
  { title: "TECNOLOGIA", desc: "Desenvolvemos soluções digitais de acordo com a necessidade real de cada empresa." },
  { title: "APLICATIVOS", desc: "Criamos aplicativos funcionais e personalizados para resolver problemas específicos." },
  { title: "AUTOMAÇÃO", desc: "Reduzimos tarefas repetitivas e aumentamos a eficiência operacional." },
  { title: "DADOS", desc: "Transformamos informações em decisões." },
  { title: "INTEGRAÇÃO", desc: "Conectamos ferramentas, processos e informações em um único ecossistema." },
];

export function Solutions() {
  return (
    <section id="solucoes" data-scene="solutions" >
      <div className="hub-stage" style={{ paddingBottom: "2vh" }}>
        <Reveal>
          <div className="hub-badge">NOSSA SOLUÇÃO</div>
        </Reveal>
        <Reveal delay={150}>
          <p className="hub-headline hub-headline--tight" style={{ marginTop: 18 }}>
            Um ecossistema. Sete frentes de crescimento.
          </p>
        </Reveal>
      </div>
      {SOLUTIONS.map((s) => (
        <div key={s.title} className="hub-stage" style={{ minHeight: "72vh" }}>
          <Reveal className="hub-glass" style={{ padding: "38px 42px", maxWidth: 560 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.16em", color: "#7fc4ff", fontWeight: 700, marginBottom: 14 }}>
              {s.title}
            </p>
            <p style={{ fontSize: "clamp(18px, 2.2vw, 26px)", lineHeight: 1.5, fontWeight: 500 }}>{s.desc}</p>
          </Reveal>
        </div>
      ))}
    </section>
  );
}

const COMPONENTS = ["BANCO DE DADOS", "CRM", "DASHBOARD", "WHATSAPP", "MARKETING", "AUTOMAÇÃO", "GESTÃO"];

export function Tech() {
  return (
    <section id="tecnologia" data-scene="tech" >
      <div className="hub-stage" style={{ position: "relative" }}>
        <div
          aria-hidden
          style={{ position: "relative", width: "min(70vw, 520px)", height: "min(70vw, 420px)", marginBottom: 40 }}
        >
          {COMPONENTS.map((c, i) => {
            const angle = (i / COMPONENTS.length) * Math.PI * 2;
            const rx = 42;
            const ry = 34;
            const x = 50 + Math.cos(angle) * rx;
            const y = 50 + Math.sin(angle) * ry;
            return (
              <Reveal
                key={c}
                delay={i * 80}
                className="hub-glass"
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%,-50%)",
                  padding: "10px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "#cfe6ff",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </Reveal>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(79,178,255,0.55), rgba(79,178,255,0))",
              filter: "blur(2px)",
            }}
          />
        </div>
        <Reveal>
          <p className="hub-headline hub-headline--tight">NÃO ACREDITAMOS EM SOLUÇÕES ENGESSADAS.</p>
        </Reveal>
      </div>
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight hub-glow">
            ACREDITAMOS EM TECNOLOGIA QUE SE ADAPTA À EMPRESA.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <p className="hub-sub">
            Você não precisa mudar sua empresa para caber em uma ferramenta.
            <br />
            Nós desenvolvemos a tecnologia para se adaptar ao seu processo.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const STATS = [
  { value: "+4 ANOS", label: "Desenvolvendo soluções, processos e tecnologia." },
  { value: "+140 EMPRESAS", label: "Empresas atendidas e geridas ao longo da nossa trajetória." },
  {
    value: "20%–30%",
    label:
      "Objetivo de crescimento de faturamento em projetos de aquisição e crescimento, conforme o cenário e os objetivos de cada cliente.",
  },
];

export function Results() {
  return (
    <section data-scene="results" >
      {STATS.map((s) => (
        <div key={s.value} className="hub-stage" style={{ minHeight: "70vh" }}>
          <Reveal>
            <p className="hub-number">{s.value}</p>
          </Reveal>
          <Reveal delay={150}>
            <p className="hub-sub">{s.label}</p>
          </Reveal>
        </div>
      ))}
      <div className="hub-stage">
        <Reveal>
          <p className="hub-headline hub-headline--tight">NÚMEROS CONTAM PARTE DA HISTÓRIA.</p>
        </Reveal>
        <Reveal delay={200}>
          <p className="hub-sub" style={{ fontSize: 13, opacity: 0.7 }}>
            Resultados variam conforme o cenário, o segmento e os objetivos de cada empresa.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
