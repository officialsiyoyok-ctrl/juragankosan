import fs from "fs";
import path from "path";

// Synth BGM 20 Detik (Upbeat, Modern, Tech/Business Rhythm)
const sampleRate = 44100;
const duration = 20.0; // 20 detik pas
const totalSamples = Math.floor(sampleRate * duration);
const samples = new Float32Array(totalSamples);

const bpm = 124;
const beatDuration = 60 / bpm; // ~0.484 detik per beat

// Chord progression: C - Am - F - G
const chords = [
  [261.63, 329.63, 392.00], // C major
  [220.00, 261.63, 329.63], // A minor
  [174.61, 220.00, 261.63], // F major
  [196.00, 246.94, 293.66], // G major
];

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const currentBeat = Math.floor(t / beatDuration);
  const beatTime = (t % beatDuration) / beatDuration;
  const chordIdx = Math.floor(currentBeat / 4) % chords.length;
  const chord = chords[chordIdx];

  let sample = 0;

  // 1. Bassline
  const bassFreq = chord[0] / 2;
  const bassEnv = Math.exp(-beatTime * 6);
  sample += Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.22;

  // 2. Chords Arpeggio
  const subBeat = Math.floor((t % beatDuration) / (beatDuration / 2));
  const subBeatTime = ((t % (beatDuration / 2)) / (beatDuration / 2));
  const noteFreq = chord[subBeat % chord.length] * 2;
  const arpEnv = Math.exp(-subBeatTime * 12);
  sample += Math.sin(2 * Math.PI * noteFreq * t) * arpEnv * 0.12;

  // 3. Kick Drum
  const kickEnv = Math.exp(-beatTime * 22);
  const kickFreq = 120 * Math.exp(-beatTime * 30) + 45;
  const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.35;
  sample += kick;

  // 4. Snare
  if (currentBeat % 2 === 1) {
    const snareEnv = Math.exp(-beatTime * 16);
    const noise = (Math.random() * 2 - 1) * snareEnv * 0.18;
    sample += noise;
  }

  // 5. Hi-hat
  const hatEnv = Math.exp(-subBeatTime * 35);
  const hat = (Math.random() * 2 - 1) * hatEnv * 0.08;
  sample += hat;

  // Master fade
  let masterEnv = 1;
  if (t < 0.5) masterEnv = t / 0.5;
  if (t > duration - 1.2) masterEnv = (duration - t) / 1.2;

  samples[i] = sample * masterEnv * 0.8;
}

function createWavBuffer(samples, sampleRate) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }
  return buffer;
}

const outputPath = path.resolve("./public/bgm.wav");
fs.writeFileSync(outputPath, createWavBuffer(samples, sampleRate));
console.log("BGM 20 detik berhasil dibuat di public/bgm.wav!");
