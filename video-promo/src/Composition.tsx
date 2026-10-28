import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./scenes/MainVideo";

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="JuraganKosanPromo"
      component={MainVideo}
      durationInFrames={600} // 20 Detik @ 30 FPS (Durasi pas & lega untuk Voice Over lengkap)
      fps={30}
      width={1080}
      height={1920} // Format 9:16 Vertikal (TikTok / IG Reels / Shorts)
    />
  );
};
