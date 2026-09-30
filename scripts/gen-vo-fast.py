#!/usr/bin/env python3
"""Punchy two-voice VO for the 3-variant Washboard cut via ElevenLabs v4.

Shorter script (~35-40s target). Brian opens + closes, Sarah carries the
method. Keys via env only (ELEVENLABS_API_KEY, _2.._N fallbacks).

    python scripts/gen-vo-fast.py   ->  public/vo-f-s{0..6}.mp3
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE = os.path.join(os.path.dirname(__file__), "..", "public")
MODEL = "eleven_v4"
BRIAN = "nPczCjzI2devNBz1zQrb"    # male — deep
SARAH = "EXAVITQu4vr4xnSDxMaL"    # female — confident

LINES = [
    (BRIAN, "Every DEX board shows you the volume. None of them show you the room."),
    (BRIAN, "Washboard replays two thousand spot tokens and asks two questions. No score."),
    (BRIAN, "Is this turnover real? Three hundred thousand through a twelve-K pool — six traders."),
    (SARAH, "Is this pump backed by anyone? Green candles, an empty room — flagged."),
    (SARAH, "And every flag ships its receipt: the query, the timestamp, the hash."),
    (SARAH, "Deterministic. Replayable. No accusations, no predictions."),
    (BRIAN, "Washboard. Evidence before conviction."),
]


def keys():
    out = [os.environ.get("ELEVENLABS_API_KEY")]
    i = 2
    while os.environ.get(f"ELEVENLABS_API_KEY_{i}"):
        out.append(os.environ[f"ELEVENLABS_API_KEY_{i}"])
        i += 1
    return [k for k in out if k]


def tts(key, voice, text):
    body = json.dumps({
        "text": text,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.35, "similarity_boost": 0.75, "speed": 1.08},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    return urllib.request.urlopen(req, timeout=60).read()


def main():
    pool = keys()
    if not pool:
        sys.exit("ELEVENLABS_API_KEY not set")
    os.makedirs(BASE, exist_ok=True)
    ki = 0
    for i, (voice, text) in enumerate(LINES):
        name = f"vo-f-s{i}.mp3"
        out = os.path.join(BASE, name)
        for _ in range(len(pool)):
            try:
                audio = tts(pool[ki], voice, text)
                with open(out, "wb") as f:
                    f.write(audio)
                print(f"{name}  {len(audio)//1024}KB  key{ki}  {text[:44]}...")
                break
            except urllib.error.HTTPError as e:
                print(f"{name}  HTTP {e.code} key{ki}: {e.read()[:100]!r}")
                ki = (ki + 1) % len(pool)
        else:
            sys.exit(f"all keys failed on line {i}")
        time.sleep(1.0)


if __name__ == "__main__":
    main()
