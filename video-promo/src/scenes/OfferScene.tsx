import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const OfferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animasi Card Promo Muncul Membal
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.7 },
  });

  // Animasi Pulsing Tombol Oranye WhatsApp
  const pulse = Math.sin(frame * 0.18) * 0.04 + 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        textAlign: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Brand Header Mini */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            backgroundColor: "#056a42",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "28px" }}>🏠</span>
        </div>
        <div style={{ fontSize: "40px", fontWeight: "900", color: "#ffffff" }}>
          Juragan<span style={{ color: "#22c55e" }}>kosan</span>
        </div>
      </div>

      {/* Headline Penawaran */}
      <div
        style={{
          fontSize: "58px",
          fontWeight: "900",
          color: "#ffffff",
          lineHeight: "1.2",
          maxWidth: "850px",
          marginBottom: "30px",
        }}
      >
        Kelola Puluhan Pintu Kos{" "}
        <span style={{ color: "#22c55e" }}>Tanpa Biaya Bulanan!</span>
      </div>

      {/* Card Harga PRO Persis Brosur Gambar 2 */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          backgroundColor: "#ffffff",
          borderRadius: "32px",
          padding: "36px 60px",
          width: "720px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.2)",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
          }}
        >
          {/* Badge PRO Hijau Tua */}
          <div
            style={{
              backgroundColor: "#056a42",
              color: "#ffffff",
              padding: "8px 24px",
              borderRadius: "50px",
              fontSize: "26px",
              fontWeight: "900",
              letterSpacing: "1px",
            }}
          >
            PRO
          </div>

          {/* Nominal Rp149.000 */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "900",
              color: "#056a42",
              letterSpacing: "-2px",
            }}
          >
            Rp149.000
          </div>
        </div>

        <div
          style={{
            fontSize: "26px",
            fontWeight: "800",
            color: "#1e293b",
            marginTop: "12px",
          }}
        >
          Sekali bayar • Tanpa biaya bulanan
        </div>

        <div
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#64748b",
            marginTop: "8px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "10px",
          }}
        >
          Promo 50 pembeli pertama (Batch 1)
        </div>
      </div>

      {/* Tombol Oranye Mencolok Persis Brosur Gambar 2 */}
      <div
        style={{
          transform: `scale(${pulse})`,
          background: "linear-gradient(135deg, #ff5a1f, #ea580c)",
          color: "#ffffff",
          padding: "24px 50px",
          borderRadius: "60px",
          fontSize: "34px",
          fontWeight: "900",
          boxShadow: "0 20px 50px rgba(234, 88, 12, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          cursor: "pointer",
          marginBottom: "35px",
        }}
      >
        <span style={{ fontSize: "38px" }}>💬</span>
        <span>Chat WhatsApp untuk Coba Gratis ➔</span>
      </div>

      {/* Footer Website Persis Brosur */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "32px",
          fontWeight: "800",
          color: "#60a5fa",
        }}
      >
        <span>🌐</span> juragankosan.id
      </div>
    </div>
  );
};
