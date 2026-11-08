# 7:35 scratch animatic

`AGRI-GRID-Round2-animatic-scratch-1080p.mp4` is the whole script cut to picture, silent,
1920 × 1080, 24 fps, 7:35. It exists so the narration and the three face-cam takes can be
recorded against real timing instead of a stopwatch.

It is **not the final film**. Every shot is labelled with its source, the voice-over line is
burned in as a lower third, and the face-cam shots are placeholder cards. The label
`ANIMATIC · SCRATCH` stays in the corner on purpose.

## What is real and what is a placeholder

| Real | Placeholder / limitation |
|---|---|
| Probe Explorer frames (GPU-rendered from the live app) | Static frames, not motion clips |
| Dashboard stills in Demo Mode | Simulated node values; `DEMO MODE` badge visible |
| Gateway prototype footage, 7 Nov | Phone clip, powered on throughout; no power-off take |
| SAR triptych and 0.3817 card from the real checkpoint | One Spain test chip, not a paddy field |
| Round 1 deck slides and the twelve editorial backgrounds | Deck visuals are AI-generated, labelled as such in the deck |
| Build sheet, circuit diagram, ESP32 bench photos | Stills held for the script duration |

The three `FACE CAM · TAKE n` cards are the only shots that must be replaced by new footage.
Their exact lines are in `VO-CUES.md`.

## Record against it

1. Open the MP4 in any player at 100 % volume. Do not stretch it; the cut is 455 seconds.
2. Record the voice beat by beat, using `VO-CUES.md`. Start each file with half a second of
   room tone and end with half a second. A clap or a hand clap at the top of each take gives
   you a sync mark.
3. Record the three face takes listed below, 1080p, eye level, window light in front, quiet
   room. Leave three seconds before and after each line.
4. Name the files `vo-b01.wav` … `vo-b11.wav` and `face-hook.mp4`, `face-bench.mp4`,
   `face-close.mp4`, then hand them over. They will be trimmed to the cues and mixed under
   the picture.

### Voice

- 48 kHz, 24-bit WAV if possible; a phone memo at 48 kHz is acceptable.
- Mono, one metre from the mouth or a lapel mic; no noise reduction, no compression.
- Read at about 135 words per minute. Slow down in the probe and AI beats, quicker in the hook
  and close. One silent second after each number the script marks with ⏸.
- The animatic's lower third is the line to read, not a caption to improvise around.

### Face cam, three takes

| Take | Script time | Line | Framing |
|---|---|---|---|
| 1 | 0:15–0:21 | "The problem is, it happens fifteen centimetres underground, where nobody can see." | medium, eye level |
| 2 | 3:15–3:18 | "This is what's on our bench today." | medium, gateway box in frame |
| 3 | 7:20–7:30 | "The decision happens fifteen centimetres underground. AGRI-GRID sees it, tells the farmer, and proves it." | medium-close, straight to camera |

The title line "I'm Neeraj, and this is AGRI-GRID" is currently over the title card at 0:21.
If you want it on camera, record it with take 1 and the edit will move the card later.

## Files

| File | Purpose |
|---|---|
| `AGRI-GRID-Round2-animatic-scratch-1080p.mp4` | the silent animatic |
| `VO-CUES.md` | every voice line with in/out time, beat and shot |
| `AGRI-GRID-Round2-animatic.srt` | the same cues as subtitles, for a caption pass |
| `build_animatic.py` | rebuilds the MP4 from the assets in this repo |

Rebuild:

```bash
cd documentation/round2/assets/animatic
/mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python build_animatic.py
```

The script reads the probe stills, dashboard captures, hardware clip, SAR cards and Round 1
deck from `documentation/round2/assets/`. It writes intermediates to `/tmp/opencode/animatic`
and the final MP4 here. It does not need the network.

## Known gaps in this cut

- The hardware clip is powered on throughout, so the "power off / power on" beat is compressed
  to one continuous shot. The voice-over says "powered on" only; there is no false power cycle.
- The SAR triptych is the Spain Sen1Floods11 chip. The Surat p014 images are rule-based change
  detectors, not U-Net output, so they are not used here.
- The dashboard is in Demo Mode. Do not switch to Live Mode for the final field-data shots.
- No music, room tone or sound effects are in this file. Those belong in the final mix.
