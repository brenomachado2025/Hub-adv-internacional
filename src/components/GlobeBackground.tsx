const TEXTURE_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='800' viewBox='0 0 1600 800'>
  <defs>
    <radialGradient id='ocean' cx='50%' cy='50%' r='75%'>
      <stop offset='0%' stop-color='#1e4d7a'/>
      <stop offset='100%' stop-color='#0b2038'/>
    </radialGradient>
    <filter id='blob'>
      <feGaussianBlur stdDeviation='9'/>
    </filter>
  </defs>
  <rect width='1600' height='800' fill='url(#ocean)'/>
  <g fill='#d4af37' opacity='0.55' filter='url(#blob)'>
    <ellipse cx='120' cy='260' rx='90' ry='55'/>
    <ellipse cx='230' cy='340' rx='60' ry='90'/>
    <ellipse cx='430' cy='230' rx='70' ry='40'/>
    <ellipse cx='470' cy='420' rx='55' ry='95'/>
    <ellipse cx='620' cy='210' rx='120' ry='50'/>
    <ellipse cx='760' cy='300' rx='80' ry='60'/>
    <ellipse cx='900' cy='240' rx='100' ry='45'/>
    <ellipse cx='980' cy='400' rx='60' ry='80'/>
    <ellipse cx='1120' cy='270' rx='90' ry='55'/>
    <ellipse cx='1260' cy='340' rx='70' ry='90'/>
    <ellipse cx='1400' cy='230' rx='85' ry='45'/>
    <ellipse cx='1520' cy='400' rx='55' ry='75'/>
    <ellipse cx='120' cy='260' rx='90' ry='55' transform='translate(1600,0)'/>
    <ellipse cx='230' cy='340' rx='60' ry='90' transform='translate(1600,0)'/>
  </g>
  <g stroke='#8fb4d4' stroke-opacity='0.35' fill='none' stroke-width='1.5'>
    <ellipse cx='800' cy='400' rx='800' ry='120'/>
    <ellipse cx='800' cy='400' rx='800' ry='260'/>
    <ellipse cx='800' cy='400' rx='800' ry='380'/>
    <line x1='0' y1='400' x2='1600' y2='400' stroke-opacity='0.5'/>
    <path d='M133,0 C133,440 133,360 133,800' />
    <path d='M266,0 C266,440 266,360 266,800' />
    <path d='M400,0 C400,440 400,360 400,800' />
    <path d='M533,0 C533,440 533,360 533,800' />
    <path d='M666,0 C666,440 666,360 666,800' />
    <path d='M800,0 L800,800' />
    <path d='M933,0 C933,440 933,360 933,800' />
    <path d='M1066,0 C1066,440 1066,360 1066,800' />
    <path d='M1200,0 C1200,440 1200,360 1200,800' />
    <path d='M1333,0 C1333,440 1333,360 1333,800' />
    <path d='M1466,0 C1466,440 1466,360 1466,800' />
  </g>
</svg>
`;

const TEXTURE_URL = `url("data:image/svg+xml,${encodeURIComponent(TEXTURE_SVG)}")`;

export function GlobeBackground({ size = 560 }: { size?: number }) {
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden shrink-0"
    >
      <div
        className="absolute inset-y-0 globe-spin"
        style={{
          width: size * 2,
          backgroundImage: TEXTURE_URL,
          backgroundSize: `${size * 2}px ${size}px`,
          backgroundRepeat: "repeat-x",
        }}
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), radial-gradient(circle at 68% 78%, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: "inset 0 0 40px 10px rgba(0,0,0,0.5), 0 0 60px 10px rgba(212,175,55,0.15)" }}
      />
      <style>{`
        .globe-spin {
          animation: globe-rotate 24s linear infinite;
        }
        @keyframes globe-rotate {
          from { background-position-x: 0; }
          to { background-position-x: -${size * 2}px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .globe-spin { animation: none; }
        }
      `}</style>
    </div>
  );
}
