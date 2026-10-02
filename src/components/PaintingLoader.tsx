// Shown on the empty canvas while the first design is being made: a pencil sketches,
// then a brush paints over it, on a loop. Strokes draw with CSS; the tools ride the same
// paths with SVG animateMotion, timed to match.

const SKETCH = "M22 92 L52 52 L74 76 L102 38 L138 90";
const PAINT = "M18 104 C 48 78, 84 122, 142 88";
const LOOP = "4.8s";

export function PaintingLoader() {
  return (
    <svg className="dz-paint" viewBox="0 0 160 130" width="160" height="130" aria-hidden="true">
      <rect x="6" y="14" width="148" height="106" rx="4" className="dz-paint-canvas" />

      <path d={SKETCH} pathLength={1} className="dz-paint-sketch" />
      <path d={PAINT} pathLength={1} className="dz-paint-stroke" />

      <g className="dz-paint-tool">
        <animateMotion dur={LOOP} repeatCount="indefinite" path={SKETCH} keyPoints="0;1;1" keyTimes="0;0.4;1" calcMode="linear" />
        <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.4;0.45;1" />
        <polygon points="0,0 3,-8 8,-3" className="dz-paint-wood" />
        <polygon points="0,0 1.2,-3 3,-1.2" className="dz-paint-lead" />
        <polygon points="3,-8 8,-3 25,-20 20,-25" className="dz-paint-pencil" />
        <polygon points="20,-25 25,-20 28,-23 23,-28" className="dz-paint-eraser" />
      </g>

      <g className="dz-paint-tool">
        <animateMotion dur={LOOP} repeatCount="indefinite" path={PAINT} keyPoints="0;0;1;1" keyTimes="0;0.42;0.85;1" calcMode="linear" />
        <animate attributeName="opacity" dur={LOOP} repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.4;0.43;0.86;1" />
        <path d="M0 0 C -1 -5, 3 -9, 7 -9 L 9 -7 C 9 -3, 5 1, 0 0 Z" className="dz-paint-bristles" />
        <polygon points="7,-9 9,-7 13,-11 11,-13" className="dz-paint-ferrule" />
        <line x1="12" y1="-12" x2="30" y2="-30" className="dz-paint-handle" />
      </g>
    </svg>
  );
}
