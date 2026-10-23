import React from "react";

const css = `
.gcl-line{fill:none;stroke-linejoin:round;stroke-linecap:round;stroke-width:2.5}
.gcl-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:gcl-draw var(--gcl-t) ease-in-out infinite}
.gcl-board .gcl-line{stroke:var(--gcl-cap)}
.gcl-body .gcl-line{stroke:var(--gcl-shade)}
.gcl-body .gcl-draw{animation-delay:.25s}
.gcl-fill{opacity:0;animation:gcl-fill var(--gcl-t) ease-in-out infinite}
.gcl-tassel{transform-box:view-box;transform-origin:58px 24px;-webkit-transform-origin:58px 24px;animation:gcl-tassel var(--gcl-t) ease-in-out infinite}

@keyframes gcl-draw{
  0%{stroke-dashoffset:1;opacity:1}
  35%,88%{stroke-dashoffset:0;opacity:1}
  100%{stroke-dashoffset:0;opacity:0}
}
@keyframes gcl-fill{
  0%,45%{opacity:0}
  65%,88%{opacity:1}
  100%{opacity:0}
}
@keyframes gcl-tassel{
  0%,50%{transform:scaleY(0);opacity:1}
  64%{transform:scaleY(1)}
  72%{transform:rotate(6deg)}
  80%,88%{transform:rotate(-3deg) scaleY(1)}
  100%{transform:scaleY(1);opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .gcl-draw,.gcl-fill,.gcl-tassel{animation-duration:8s}
}
`;

/**
 * Loading berbentuk topi wisuda yang menggambar dirinya sendiri.
 *
 * Props:
 *  - size:     lebar dalam px (default 130)
 *  - duration: lama satu siklus dalam detik (default 3)
 *  - cap:      warna papan topi (default #d8d4cc)
 *  - shade:    warna badan topi (default #a9a398)
 *  - tassel:   warna rumbai (default #e0a040)
 */
export default function GraduationCapLoader({
  size = 130,
  duration = 3,
  cap = "#d8d4cc",
  shade = "#a9a398",
  tassel = "#e0a040",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className={`inline-flex items-center justify-center max-w-full ${className}`}
      style={{
        "--gcl-t": `${duration}s`,
        "--gcl-cap": cap,
        "--gcl-shade": shade,
      }}
    >
      <style>{css}</style>
      <svg
        viewBox="-1 0 66 64"
        width={size}
        height={size}
        style={{ overflow: "visible", display: "block", maxWidth: "100%", height: "auto" }}
        aria-hidden="true"
      >
        {/* badan topi */}
        <g className="gcl-body">
          <path
            className="gcl-fill"
            d="M16 30v14c0 5 7 9 16 9s16-4 16-9V30L32 38z"
            fill={shade}
          />
          <path
            className="gcl-line gcl-draw"
            pathLength="1"
            d="M16 30v14c0 5 7 9 16 9s16-4 16-9V30"
          />
        </g>

        {/* papan atas */}
        <g className="gcl-board">
          <path className="gcl-fill" d="M32 10L4 24l28 14 28-14z" fill={cap} />
          <path
            className="gcl-line gcl-draw"
            pathLength="1"
            d="M32 10L4 24l28 14 28-14z"
          />
        </g>

        {/* rumbai */}
        <g className="gcl-tassel">
          <rect x="56.8" y="24" width="2.5" height="20" rx="1.2" fill={tassel} />
          <circle cx="58" cy="46" r="2.6" fill={tassel} />
        </g>
      </svg>
    </div>
  );
}
