import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const FeatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animasi lembaran kwitansi meluncur turun dari atas
  const receiptY = interpolate(frame, [0, 25], [-200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const receiptScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Animasi Stempel LUNAS Hijau Tercap Kuat (Frame 45+)
  const stampScale = spring({
    frame: frame - 45,
    fps,
    config: { damping: 8, mass: 0.4 },
  });
  const stampRotate = interpolate(frame, [45, 55], [-20, -7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        padding: "40px 30px",
        textAlign: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Judul Adegan */}
      <div style={{ marginBottom: "25px" }}>
        <div style={{ fontSize: "56px", fontWeight: "900", color: "#ffffff" }}>
          Kwitansi Digital Resmi Otomatis
        </div>
        <div style={{ fontSize: "28px", color: "#94a3b8", marginTop: "8px" }}>
          Format standar perbankan dengan terbilang rupiah & stempel sah
        </div>
      </div>

      {/* Lembar Kwitansi Persis Gambar 1 */}
      <div
        style={{
          transform: `translateY(${receiptY}px) scale(${receiptScale})`,
          width: "820px",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "24px",
          padding: "36px 40px",
          textAlign: "left",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 255, 255, 0.1)",
          position: "relative",
        }}
      >
        {/* Header Kwitansi: Nama Kos & Info Pemilik */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "18px",
          }}
        >
          {/* Building Icon */}
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#e6f4ea",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🏢
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a" }}>
              Griya Asri Harmoni Kost
            </div>
            <div style={{ fontSize: "16px", color: "#64748b", marginTop: "2px" }}>
              Jl. Margonda Raya No. 45, Beji, Depok, Jawa Barat
            </div>
            <div style={{ fontSize: "16px", color: "#64748b", marginTop: "2px" }}>
              Kontak: <strong>+62 812-3456-7890</strong> • Pengelola: <strong>Yahya Kurniawan</strong>
            </div>
          </div>
        </div>

        {/* Badge Kwitansi & No Seri */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#056a42",
              color: "#ffffff",
              padding: "6px 18px",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "900",
              letterSpacing: "1px",
            }}
          >
            KWITANSI RESMI PEMBAYARAN SEWA
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "15px", color: "#64748b" }}>
              NO. KWITANSI: <strong style={{ color: "#0f172a" }}>KW/202610/101-01</strong>
            </div>
            <div style={{ fontSize: "15px", color: "#64748b" }}>
              TANGGAL CETAK: <strong>19 Oktober 2026</strong>
            </div>
          </div>
        </div>

        {/* 4 Kolom Info Penyewa */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1.3fr 1.1fr",
            gap: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 18px",
            marginTop: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>NAMA PENYEWA</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>Dimas Pratama Putra</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>UNIT KAMAR</div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>Kamar 101</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>NO. WHATSAPP</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>+62 812-9876-5432</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>METODE BAYAR</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Transfer BCA</div>
          </div>
        </div>

        {/* Tabel Deskripsi Pembayaran */}
        <div
          style={{
            borderTop: "2px solid #0f172a",
            borderBottom: "2px solid #0f172a",
            marginTop: "18px",
            padding: "10px 0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 180px 180px",
              fontSize: "14px",
              fontWeight: "900",
              color: "#0f172a",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: "8px",
            }}
          >
            <div>NO</div>
            <div>DESKRIPSI PEMBAYARAN</div>
            <div>PERIODE</div>
            <div style={{ textAlign: "right" }}>NOMINAL (RP)</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 180px 180px",
              fontSize: "16px",
              paddingTop: "10px",
            }}
          >
            <div style={{ fontWeight: "700" }}>1</div>
            <div>
              <div style={{ fontWeight: "800", color: "#0f172a" }}>Pembayaran Sewa Kamar Bulanan</div>
              <div style={{ fontSize: "14px", color: "#056a42", fontWeight: "800" }}>Status: LUNAS</div>
              <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
                Keterangan: Lunas tepat waktu via m-BCA
              </div>
            </div>
            <div style={{ color: "#056a42", fontWeight: "700", fontSize: "15px" }}>
              Periode Oktober 2026
            </div>
            <div style={{ textAlign: "right", fontWeight: "900", fontSize: "20px", color: "#0f172a" }}>
              Rp 1.800.000
            </div>
          </div>
        </div>

        {/* Total & Terbilang */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "24px",
            padding: "12px 0",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>TOTAL DITERIMA :</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#056a42" }}>Rp 1.800.000</div>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "16px",
            fontStyle: "italic",
            fontWeight: "800",
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          TERBILANG : # Satu Juta Delapan Ratus Ribu Rupiah #
        </div>

        {/* Area Tanda Tangan & Stempel */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "16px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            ⚡ Diterbitkan otomatis via <strong>Juragankosan.id</strong>
          </div>

          <div style={{ textAlign: "center", position: "relative", minWidth: "260px" }}>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Depok, 5 Oktober 2026</div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Pengelola / Pemilik Properti,</div>
            <div style={{ height: "45px" }} />
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
              ( Yahya Kurniawan )
            </div>

            {/* Stempel Hijau Persegi Miring Persis Gambar 1 */}
            {frame >= 45 && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "15px",
                  transform: `scale(${stampScale}) rotate(${stampRotate}deg)`,
                  border: "4px solid #056a42",
                  borderRadius: "12px",
                  padding: "6px 18px",
                  color: "#056a42",
                  textAlign: "center",
                  boxShadow: "0 0 15px rgba(5, 106, 66, 0.3)",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "1px" }}>
                  GRIYA ASRI HARMONI KO...
                </div>
                <div style={{ fontSize: "11px", fontWeight: "800" }}>DEPOK, JAWA BARAT</div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    letterSpacing: "4px",
                    lineHeight: "1.1",
                    margin: "2px 0",
                  }}
                >
                  LUNAS
                </div>
                <div style={{ fontSize: "11px", fontWeight: "800" }}>✓ SAH • 2026-10-05</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
