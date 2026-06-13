export function HexaCoin({ size = 96, className = "" }: { size?: number; className?: string }) {
  // Futuristic hex-cut coin with gold rim, etched glyphs, dual-tone faces.
  const thickness = Math.max(4, size * 0.06);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size, perspective: 900 }}
    >
      {/* Outer glow halo */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.83 0.17 84 / 35%) 0%, transparent 65%)",
          filter: "blur(12px)",
        }}
      />

      <div
        className="animate-coin-spin relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Coin edge ring (extruded thickness) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #0a0a0a, #f7c948 12%, #b8860b 25%, #0a0a0a 50%, #f7c948 62%, #b8860b 75%, #0a0a0a 100%)",
            transform: `translateZ(-${thickness / 2}px)`,
            boxShadow:
              "0 0 24px oklch(0.83 0.17 84 / 35%), inset 0 0 0 1px oklch(1 0 0 / 10%)",
          }}
        />

        {/* Front face */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)",
            border: "1px solid oklch(0.83 0.17 84 / 55%)",
            boxShadow:
              "inset 0 0 0 2px oklch(0 0 0 / 80%), inset 0 0 24px oklch(0.83 0.17 84 / 18%), 0 0 30px oklch(0.83 0.17 84 / 25%)",
            transform: `translateZ(${thickness / 2}px)`,
          }}
        >
          {/* Hex circuit pattern */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(60deg, oklch(0.83 0.17 84 / 30%) 0 1px, transparent 1px 8px), repeating-linear-gradient(-60deg, oklch(0.83 0.17 84 / 30%) 0 1px, transparent 1px 8px)",
            }}
          />

          {/* Inner ring */}
          <div
            className="absolute rounded-full"
            style={{
              inset: size * 0.08,
              border: "1px dashed oklch(0.83 0.17 84 / 40%)",
            }}
          />

          {/* Bitcoin emblem */}
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="relative grid place-items-center rounded-full"
              style={{
                width: size * 0.6,
                height: size * 0.6,
                background:
                  "linear-gradient(135deg, #f7c948 0%, #d4a017 60%, #8a6308 100%)",
                boxShadow:
                  "0 0 18px oklch(0.83 0.17 84 / 60%), inset 0 -4px 10px oklch(0 0 0 / 35%), inset 0 4px 10px oklch(1 0 0 / 25%)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: size * 0.5,
                  lineHeight: 1,
                  color: "#1a1100",
                  textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                }}
              >
                ₿
              </div>
            </div>
          </div>

          {/* Specular highlight */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 25% 15%, oklch(1 0 0 / 22%) 0%, transparent 45%)",
            }}
          />
        </div>

        {/* Back face (mirrored) */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 70% 75%, #141414 0%, #080808 60%, #030303 100%)",
            border: "1px solid oklch(0.72 0.16 78 / 45%)",
            boxShadow:
              "inset 0 0 0 2px oklch(0 0 0 / 80%), inset 0 0 20px oklch(0.72 0.16 78 / 18%)",
            transform: `translateZ(-${thickness / 2}px) rotateY(180deg)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, oklch(0.72 0.16 78 / 35%) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, oklch(0.72 0.16 78 / 35%) 0 1px, transparent 1px 6px)",
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: size * 0.1,
                letterSpacing: "0.25em",
                color: "oklch(0.83 0.17 84)",
                textShadow: "0 0 8px oklch(0.83 0.17 84 / 70%)",
              }}
            >
              BTC·NET
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
