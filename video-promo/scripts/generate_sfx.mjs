import fs from "fs";
import path from "path";

// Helper membuat file WAV 16-bit PCM Stereo / Mono
function createWavBuffer(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM data
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

const publicDir = path.resolve("./public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sampleRate = 44100;

// 1. WHOOSH SFX (0.35 detik)
{
  const duration = 0.35;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;
    const env = Math.sin(t * Math.PI); // envelope
    const noise = (Math.random() * 2 - 1) * 0.4;
    const freq = 150 + Math.sin(t * Math.PI) * 400;
    const tone = Math.sin(2 * Math.PI * freq * (i / sampleRate));
    samples[i] = (noise + tone * 0.5) * env * 0.7;
  }
  fs.writeFileSync(path.join(publicDir, "whoosh.wav"), createWavBuffer(samples, sampleRate));
}

// 2. CLICK / POP SFX (0.12 detik)
{
  const duration = 0.12;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;
    const env = Math.pow(1 - t, 2.5);
    const freq = 600 - t * 450;
    samples[i] = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * env * 0.8;
  }
  fs.writeFileSync(path.join(publicDir, "click.wav"), createWavBuffer(samples, sampleRate));
}

// 3. WHATSAPP NOTIF CHIME SFX (0.45 detik)
{
  const duration = 0.45;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const sec = i / sampleRate;
    // Nada 1: 659.25 Hz (E5), Nada 2 mulai detik 0.08: 880 Hz (A5)
    let s = 0;
    if (sec < 0.25) {
      const env1 = Math.exp(-sec * 15);
      s += Math.sin(2 * Math.PI * 659.25 * sec) * env1 * 0.5;
    }
    if (sec >= 0.08) {
      const sec2 = sec - 0.08;
      const env2 = Math.exp(-sec2 * 10);
      s += Math.sin(2 * Math.PI * 880 * sec2) * env2 * 0.6;
      s += Math.sin(2 * Math.PI * 1760 * sec2) * env2 * 0.2; // harmonic
    }
    samples[i] = s;
  }
  fs.writeFileSync(path.join(publicDir, "wa_notif.wav"), createWavBuffer(samples, sampleRate));
}

// 4. STEMPEL LUNAS THUD SFX (0.35 detik)
{
  const duration = 0.35;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;
    const sec = i / sampleRate;
    const env = Math.exp(-sec * 18);
    // Low frequency punch (110 Hz drops to 50 Hz)
    const freq = 120 * Math.exp(-sec * 20) + 45;
    const punch = Math.sin(2 * Math.PI * freq * sec);
    const snap = (Math.random() * 2 - 1) * Math.exp(-sec * 40) * 0.4;
    samples[i] = (punch * 0.75 + snap) * env;
  }
  fs.writeFileSync(path.join(publicDir, "stamp.wav"), createWavBuffer(samples, sampleRate));
}

// 5. SUCCESS / CASH TONE SFX (0.6 detik)
{
  const duration = 0.6;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const sec = i / sampleRate;
    let s = 0;
    // Chime C6 (1046 Hz) & E6 (1318 Hz) & G6 (1567 Hz)
    const notes = [
      { f: 1046.5, start: 0.0 },
      { f: 1318.5, start: 0.1 },
      { f: 1567.9, start: 0.2 },
    ];
    for (const note of notes) {
      if (sec >= note.start) {
        const tNote = sec - note.start;
        const env = Math.exp(-tNote * 8);
        s += Math.sin(2 * Math.PI * note.f * tNote) * env * 0.3;
        s += Math.sin(2 * Math.PI * (note.f * 2) * tNote) * env * 0.1;
      }
    }
    samples[i] = s;
  }
  fs.writeFileSync(path.join(publicDir, "success.wav"), createWavBuffer(samples, sampleRate));
}

console.log("Semua SFX berhasil dibuat di folder public!");
