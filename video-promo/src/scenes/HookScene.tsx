import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animasi Header Logo
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  // Animasi Headline Teks meluncur dari bawah dengan bounce
  const headlineY = interpolate(frame, [10, 30], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animasi Subtitle
  const subY = interpolate(frame, [25, 45], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shake perhatian pada kata "belum bayar kos"
  const pulseScale = 1 + Math.sin(frame * 0.2) * 0.03;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 50px",
        textAlign: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Brand Header Sesuai Brosur */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "50px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo Icon Hijau Rumah + Rp */}
          <div
            style={{
              width: "72px",
              height: "72px",
              backgroundColor: "#056a42",
              borderRadius: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(5, 106, 66, 0.4)",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "38px" }}>🏠</span>
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "#eab308",
                color: "#713f12",
                borderRadius: "50%",
                fontSize: "13px",
                fontWeight: "900",
                padding: "2px 4px",
              }}
            >
              Rp
            </div>
          </div>

          <div
            style={{
              fontSize: "52px",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "-1px",
            }}
          >
            Juragan<span style={{ color: "#22c55e" }}>kosan</span>
          </div>
        </div>

        {/* Pill Badge Hijau Muda */}
        <div
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ade80",
            padding: "8px 24px",
            borderRadius: "50px",
            fontSize: "22px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            marginTop: "16px",
          }}
        >
          UNTUK PEMILIK KOS & KONTRAKAN
        </div>
      </div>

      {/* Main Hook Headline Persis Brosur */}
      <div
        style={{
          transform: `translateY(${headlineY}px) scale(${pulseScale})`,
          opacity: headlineOpacity,
          color: "#ffffff",
          fontSize: "76px",
          fontWeight: "900",
          lineHeight: "1.15",
          letterSpacing: "-2px",
          maxWidth: "960px",
          marginBottom: "35px",
        }}
      >
        Siapa yang{" "}
        <span
          style={{
            color: "#22c55e",
            textDecoration: "underline",
            textUnderlineOffset: "12px",
          }}
        >
          belum bayar kos
        </span>{" "}
        bulan ini?
      </div>

      {/* Subhead Persis Brosur */}
      <div
        style={{
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          color: "#cbd5e1",
          fontSize: "36px",
          fontWeight: "600",
          lineHeight: "1.4",
          maxWidth: "850px",
        }}
      >
        Cek tagihan. Kirim pengingat WA satu klik.
      </div>
    </div>
  );
};
