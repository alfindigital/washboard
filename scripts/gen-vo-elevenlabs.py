#!/usr/bin/env python3
"""Two-voice VO for the Washboard demo via ElevenLabs v4.

Male (Brian) narrates the problem + lenses (s0–s6).
Female (Sarah) narrates evidence + second opinion + guardrails + outro (s7–s14).

Usage:
    set ELEVENLABS_API_KEY=sk_...   (or export on *nix)
    python scripts/gen-vo-elevenlabs.py
Optionally set ELEVENLABS_API_KEY_2..N as fallbacks.

Writes public/vo-el-s{0..14}.mp3 + public/vo-el-timing.json (probe durations
are filled in by scripts/measure-vo-el.py afterwards).
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE = os.path.join(os.path.dirname(__file__), "..", "public")
MODEL = "eleven_v4"
MALE = "nPczCjzI2devNBz1zQrb"    # Brian — deep, resonant
FEMALE = "EXAVITQu4vr4xnSDxMaL"  # Sarah — mature, reassuring, confident

LINES = [
    # --- male: the problem ---
    (MALE, "Most DEX boards rank tokens by volume and price."),
    (MALE, "But volume alone doesn't tell you who's actually in the room."),
    (MALE, "Washboard replays one snapshot of 2,466 spot tokens and asks two separate questions."),
    (MALE, "First: is this turnover real?"),
    (MALE, "High volume cycling through a thin pool, reported by only a handful of unique traders, gets flagged as a turnover anomaly."),
    (MALE, "Second: is this move backed by anyone?"),
    (MALE, "A price pump with a near-empty room gets flagged separately — two lenses, never one score."),
    # --- female: the method + proof ---
    (FEMALE, "Every flag ships with its receipt: the query, the timestamp, the hash."),
    (FEMALE, "Reproducible, not vibes."),
    (FEMALE, "And because numbers deserve a second read, each drill card adds an AI second opinion — labeled, and never the verdict."),
    (FEMALE, "No accusations."),
    (FEMALE, "No predictions."),
    (FEMALE, "Just the evidence, and what would change the view."),
    (FEMALE, "Washboard."),
    (FEMALE, "Evidence before conviction."),
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
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=body,
        headers={
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
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
        name = f"vo-el-s{i}.mp3"
        out = os.path.join(BASE, name)
        for attempt in range(len(pool)):
            try:
                audio = tts(pool[ki], voice, text)
                with open(out, "wb") as f:
                    f.write(audio)
                print(f"{name}  {len(audio)//1024}KB  key{ki}  {text[:48]}...")
                break
            except urllib.error.HTTPError as e:
                print(f"{name}  HTTP {e.code} key{ki}: {e.read()[:120]!r}")
                ki = (ki + 1) % len(pool)
        else:
            sys.exit(f"all keys failed on line {i}")
        time.sleep(1.0)  # free-tier is burst-sensitive


if __name__ == "__main__":
    main()
