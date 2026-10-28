import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { HookScene } from "./HookScene";
import { SolutionScene } from "./SolutionScene";
import { FeatureScene } from "./FeatureScene";
import { OfferScene } from "./OfferScene";

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle ambient background light movement
  const orb1X = Math.sin(frame * 0.015) * 80 + 150;
  const orb1Y = Math.cos(frame * 0.015) * 80 + 250;
  const orb2X = Math.cos(frame * 0.02) * 100 + 750;
  const orb2Y = Math.sin(frame * 0.02) * 100 + 1350;

  return (
    <div
      style={{
        position: "relative",
        width: "1080px",
        height: "1920px",
        backgroundColor: "#071711", // Deep forest green / dark aesthetic
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* 🎵 1. BACKSOUND MUSIK (BGM 20 Detik Penuh, volume 0.16 agar VO terdengar jernih) */}
      <Audio src={staticFile("bgm.wav")} volume={0.16} />

      {/* 🎙️ 2. VOICE OVER NARATOR (AI NEURAL VOICE LENGKAP TANPA TERPOTONG) */}
      {/* VO 1 (Detik 0.3 - 4.2): Hook Masalah */}
      <Sequence from={10}>
        <Audio src={staticFile("vo_scene1.mp3")} volume={1.0} />
      </Sequence>

      {/* VO 2 (Detik 5.2 - 8.8): Solusi HP & Tagih WA */}
      <Sequence from={155}>
        <Audio src={staticFile("vo_scene2.mp3")} volume={1.0} />
      </Sequence>

      {/* VO 3 (Detik 10.2 - 13.5): Kwitansi Resmi Otomatis */}
      <Sequence from={305}>
        <Audio src={staticFile("vo_scene3.mp3")} volume={1.0} />
      </Sequence>

      {/* VO 4 (Detik 15.2 - 19.8): Penawaran Seumur Hidup & CTA */}
      <Sequence from={455}>
        <Audio src={staticFile("vo_scene4.mp3")} volume={1.0} />
      </Sequence>

      {/* 🔊 3. SOUND EFFECTS (SFX Momen Aksi Presisi) */}
      {/* SFX Whoosh awal (frame 8) */}
      <Sequence from={8} durationInFrames={20}>
        <Audio src={staticFile("whoosh.wav")} volume={0.35} />
      </Sequence>

      {/* SFX Whoosh saat HP meluncur (frame 152) */}
      <Sequence from={152} durationInFrames={20}>
        <Audio src={staticFile("whoosh.wav")} volume={0.35} />
      </Sequence>

      {/* SFX Click saat tombol 'Tagih via WA' ditekan (frame 212) */}
      <Sequence from={212} durationInFrames={15}>
        <Audio src={staticFile("click.wav")} volume={0.6} />
      </Sequence>

      {/* SFX WhatsApp Notif Chime saat bubble WA meluncur (frame 224) */}
      <Sequence from={224} durationInFrames={25}>
        <Audio src={staticFile("wa_notif.wav")} volume={0.5} />
      </Sequence>

      {/* SFX Whoosh saat Kwitansi Resmi turun (frame 302) */}
      <Sequence from={302} durationInFrames={20}>
        <Audio src={staticFile("whoosh.wav")} volume={0.35} />
      </Sequence>

      {/* SFX Stempel LUNAS Tercap Kuat (frame 350) */}
      <Sequence from={350} durationInFrames={25}>
        <Audio src={staticFile("stamp.wav")} volume={0.75} />
      </Sequence>

      {/* SFX Success Cash Chime saat Promo Rp149.000 muncul (frame 452) */}
      <Sequence from={452} durationInFrames={30}>
        <Audio src={staticFile("success.wav")} volume={0.5} />
      </Sequence>

      {/* Dynamic Ambient Background Glows */}
      <div
        style={{
          position: "absolute",
          top: orb1Y,
          left: orb1X,
          width: "650px",
          height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.22) 0%, rgba(34, 197, 94, 0) 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: orb2Y,
          left: orb2X,
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(5, 106, 66, 0.25) 0%, rgba(5, 106, 66, 0) 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Halus Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* 🎬 4. TIMELINE 4 ADEGAN VIDEO (20 Detik / 600 Frame @ 30 FPS) */}
      {/* Scene 1: Hook Sesuai Brosur (Frame 0 - 150 / 0s - 5s) */}
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>

      {/* Scene 2: HP Mockup Sesuai Brosur (Frame 150 - 300 / 5s - 10s) */}
      <Sequence from={150} durationInFrames={150}>
        <SolutionScene />
      </Sequence>

      {/* Scene 3: Kwitansi Resmi Asli Gambar 1 (Frame 300 - 450 / 10s - 15s) */}
      <Sequence from={300} durationInFrames={150}>
        <FeatureScene />
      </Sequence>

      {/* Scene 4: Card Harga PRO & Tombol Oranye Brosur (Frame 450 - 600 / 15s - 20s) */}
      <Sequence from={450} durationInFrames={150}>
        <OfferScene />
      </Sequence>
    </div>
  );
};
