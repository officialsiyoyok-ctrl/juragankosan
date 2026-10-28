import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animasi HP meluncur naik
  const phoneY = interpolate(frame, [0, 25], [400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Tombol WA ditekan pada frame 55 - 65
  const isButtonPressed = frame >= 55 && frame <= 68;
  const buttonScale = isButtonPressed ? 0.94 : 1;

  // Efek kedip perhatian pada "Belum Lunas"
  const blinkOpacity = frame % 20 < 10 ? 1 : 0.7;

  // Chat WhatsApp popup meluncur keluar setelah tombol diklik (frame 68+)
  const chatY = interpolate(frame, [68, 85], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chatScale = spring({
    frame: frame - 68,
    fps,
    config: { damping: 12, mass: 0.7 },
  });

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
      {/* Judul Adegan */}
      <div style={{ marginBottom: "25px" }}>
        <div style={{ fontSize: "56px", fontWeight: "900", color: "#ffffff" }}>
          Pantau Okupansi & Tagih Cepat
        </div>
        <div style={{ fontSize: "28px", color: "#94a3b8", marginTop: "8px" }}>
          Langsung dari layar HP tanpa ribet buka buku kas
        </div>
      </div>

      {/* Frame Mockup HP Persis Brosur */}
      <div
        style={{
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
          width: "580px",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "48px",
          padding: "24px 28px 36px 28px",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.7), 0 0 50px rgba(34, 197, 94, 0.25)",
          border: "8px solid #334155",
          textAlign: "left",
        }}
      >
        {/* Notch HP */}
        <div
          style={{
            width: "160px",
            height: "24px",
            backgroundColor: "#0f172a",
            borderRadius: "14px",
            margin: "0 auto 20px auto",
          }}
        />

        {/* Header App Brosur (Logo + Hamburger) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#056a42",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "20px" }}>🏠</span>
            </div>
            <span style={{ fontSize: "26px", fontWeight: "900", color: "#056a42" }}>
              Juragankosan
            </span>
          </div>
          <div style={{ fontSize: "32px", color: "#334155" }}>☰</div>
        </div>

        {/* Section: Tagihan Kos */}
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a" }}>
            Tagihan Kos
          </div>
          <div style={{ fontSize: "18px", color: "#94a3b8", marginTop: "2px" }}>
            Contoh data kamar aktif
          </div>
        </div>

        {/* List Kamar Sesuai Brosur */}
        <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Kamar 01 - Lunas */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "22px", fontWeight: "700" }}>
              <span>🛏️</span> Kamar 01
            </div>
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#15803d",
                padding: "6px 18px",
                borderRadius: "14px",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              Lunas
            </div>
          </div>

          {/* Kamar 02 - Belum Lunas (Highlight perhatian) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: "18px",
              padding: "16px 20px",
              opacity: blinkOpacity,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "22px", fontWeight: "700" }}>
              <span>🛏️</span> Kamar 02
            </div>
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                padding: "6px 18px",
                borderRadius: "14px",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              Belum lunas
            </div>
          </div>

          {/* Kamar 03 - Lunas */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "22px", fontWeight: "700" }}>
              <span>🛏️</span> Kamar 03
            </div>
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#15803d",
                padding: "6px 18px",
                borderRadius: "14px",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              Lunas
            </div>
          </div>
        </div>

        {/* Tombol Hijau Besar Persis Brosur: Tagih via WA */}
        <div
          style={{
            marginTop: "24px",
            transform: `scale(${buttonScale})`,
            backgroundColor: "#056a42",
            color: "#ffffff",
            padding: "18px 24px",
            borderRadius: "20px",
            fontSize: "24px",
            fontWeight: "800",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: "0 10px 25px rgba(5, 106, 66, 0.4)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "28px" }}>💬</span> Tagih via WA
        </div>
      </div>

      {/* Bubble Pop-up WhatsApp Masuk Saat Tombol Ditekan */}
      {frame >= 68 && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            transform: `translateY(${chatY}px) scale(${chatScale})`,
            backgroundColor: "#075e54",
            color: "#ffffff",
            borderRadius: "24px",
            padding: "24px 32px",
            maxWidth: "720px",
            textAlign: "left",
            boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            border: "2px solid #25d366",
          }}
        >
          <div style={{ fontSize: "22px", color: "#25d366", fontWeight: "800" }}>
            WhatsApp Terkirim Otomatis 1-Klik:
          </div>
          <div style={{ fontSize: "22px", color: "#f1f5f9", marginTop: "8px", lineHeight: "1.4" }}>
            "Halo Mas Dimas, tagihan sewa kamar 02 periode Oktober sebesar{" "}
            <span style={{ color: "#facc15", fontWeight: "800" }}>Rp 1.800.000</span> sudah terbit
            ya. Mohon ditransfer via BCA 5156054387..."
          </div>
        </div>
      )}
    </div>
  );
};
