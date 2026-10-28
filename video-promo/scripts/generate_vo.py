import asyncio
import edge_tts
import os
import subprocess

VOICE = "id-ID-ArdiNeural"
# Tempo +18% memberi artikulasi cepat, energik, dan meyakinkan khas iklan medsos
RATE = "+18%"

VO_PARTS = [
    {
        "id": "scene1",
        "filename": "vo_scene1.mp3",
        "text": "Siapa yang belum bayar kos bulan ini? Cek tagihan dan kirim pengingat WhatsApp dalam satu klik!"
    },
    {
        "id": "scene2",
        "filename": "vo_scene2.mp3",
        "text": "Buka langsung di HP, cek kamar yang belum bayar, lalu tagih via WhatsApp otomatis."
    },
    {
        "id": "scene3",
        "filename": "vo_scene3.mp3",
        "text": "Begitu transfer masuk, kwitansi resmi langsung terbit rapi berstempel lunas!"
    },
    {
        "id": "scene4",
        "filename": "vo_scene4.mp3",
        "text": "Tanpa biaya bulanan! Cuma 149 ribu seumur hidup. Coba gratis sekarang di Juragankosan.id!"
    }
]

async def generate():
    out_dir = os.path.abspath("./public")
    for part in VO_PARTS:
        file_path = os.path.join(out_dir, part["filename"])
        comm = edge_tts.Communicate(part["text"], VOICE, rate=RATE)
        await comm.save(file_path)

if __name__ == "__main__":
    asyncio.run(generate())
