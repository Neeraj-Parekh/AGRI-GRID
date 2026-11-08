# 7:35 animatic · v2

`AGRI-GRID-Round2-animatic-v2-1080p.mp4` is the whole script cut to picture, silent,
1920 × 1080, 24 fps, exactly 7:35 (455 s). It exists so the narration and the three
face-cam takes can be recorded against real timing instead of a stopwatch.

It is **not the final film**. The face-cam shots are placeholder cards, the dashboard
runs in Demo Mode, and the probe readings are simulated. The narration is burned in as
a lower third on the picture shots and as a compact caption on the cards, so every line
has a visible cue.

v1 is kept as `AGRI-GRID-Round2-animatic-scratch-1080p.mp4` for comparison only. Record
against **v2**.

## What changed from v1

| Area | v1 | v2 |
|---|---|---|
| Palette | generic dark UI colours | the live product palette from `frontend/src/theme.css` |
| Cards | flat label panels | paper-and-ink pages with one dominant figure per beat |
| Data beats | KPI rows | a single hero number plus quiet support rows |
| Photographs | static, ungraded | full-bleed documentary grade with a slow lateral pan |
| Chrome | drawn per frame, drifted with the pan | static overlay layer, always pinned |
| Transitions | hard cuts only | hard cuts inside a beat, 0.16 s dip to black at act boundaries |
| Cards motion | held still | 1.8 s entrance, then a settled hold |
| Progress | none | continuous bottom bar, one brand accent |
| Build sheet / circuit | plain image cards | real document pages with three labelled takeaways |

The full design system, data rules and borrowed-pattern notes are in `DESIGN.md`.
The 25-frame overview is `AGRI-GRID-Round2-animatic-v2-contact-sheet.png`.

## What is real and what is a placeholder

| Real | Placeholder / limitation |
|---|---|
| Probe Explorer frames (GPU-rendered from the live app) | Static frames, not motion clips |
| Dashboard stills in Demo Mode | Simulated node values; `DEMO MODE` badge visible |
| Gateway prototype footage, 7 Nov | Phone clip, powered on throughout; no power-off take |
| SAR triptych and 0.3817 metrics from the real checkpoint | One Spain Sen1Floods11 test chip, not a paddy field |
| Build sheet PDF and node circuit diagram | Stills held for the script duration |
| Round 1 deck slides and the twelve editorial backgrounds | Deck visuals are AI-generated, labelled as such in the deck |
| Three face-cam slates | **Not recorded.** Replace with the takes below |

The three `FACE CAM · TAKE n` cards are the only shots that must be replaced by new
footage. Their exact lines are in `VO-CUES.md`.

## Record against it

1. Open the MP4 in any player at 100 % volume. Do not stretch it; the cut is 455 seconds.
2. Record the voice beat by beat, using `VO-CUES.md`. Start each file with half a second
   of room tone and end with half a second. A clap at the top of each take gives you a
   sync mark.
3. Record the three face takes listed below, 1080p, eye level, window light in front,
   quiet room. Leave three seconds before and after each line.
4. Name the files `vo-b01.wav` … `vo-b11.wav` and `face-hook.mp4`, `face-bench.mp4`,
   `face-close.mp4`, then hand them over. They will be trimmed to the cues and mixed
   under the picture.

### Voice

- 48 kHz, 24-bit WAV if possible; a phone memo at 48 kHz is acceptable.
- Mono, one metre from the mouth or a lapel mic; no noise reduction, no compression.
- Read at about 135 words per minute. Slow down in the probe and AI beats, quicker in
  the hook and close. One silent second after each number the script marks with ⏸.
- The lower third is the line to read, not a caption to improvise around.

### Face cam, three takes

| Take | Script time | Line | Framing |
|---|---|---|---|
| 1 | 0:15–0:21 | "The problem is, it happens fifteen centimetres underground, where nobody can see." | medium, eye level |
| 2 | 3:15–3:18 | "This is what's on our bench today." | medium, gateway box in frame |
| 3 | 7:20–7:30 | "The decision happens fifteen centimetres underground. AGRI-GRID sees it, tells the farmer, and proves it." | medium-close, straight to camera |

The title line "I'm Neeraj, and this is AGRI-GRID" sits over the title card at 0:21.
If you want it on camera, record it with take 1 and the edit will move the card later.

## Files

| File | Purpose |
|---|---|
| `AGRI-GRID-Round2-animatic-v2-1080p.mp4` | the silent v2 animatic, 455 s |
| `AGRI-GRID-Round2-animatic-v2-contact-sheet.png` | 25 key frames from the finished file |
| `VO-CUES.md` | every voice line with in/out time, beat and shot |
| `AGRI-GRID-Round2-animatic.srt` | the same cues as subtitles, for a caption pass |
| `DESIGN.md` | palette, type, grid, shot grammar, data rules |
| `build_film.py` | rebuilds v2 from the assets in this repo |
| `film_style.py` | palette, fonts, grade, chrome and lower-third layers |
| `film_cards.py` | every card renderer |
| `build_animatic.py` | v1 builder, kept as a timeline reference |
| `AGRI-GRID-Round2-animatic-scratch-1080p.mp4` | v1, superseded |

Rebuild v2:

```bash
cd documentation/round2/assets/animatic
/mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python build_film.py
```

The script reads the probe stills, dashboard captures, hardware clips, SAR arrays, build
sheet and Round 1 deck from `documentation/round2/assets/`. It auto-rasterises page 1 of
the build-sheet PDF with `pdftoppm` if the PNG is absent. It writes intermediates to
`/tmp/opencode/film/v2` and the final MP4 here. It does not need the network.

## Known gaps in this cut

- The hardware clip is powered on throughout, so the "power off / power on" beat is
  compressed to one continuous shot. The voice-over says "powered on" only; there is no
  false power cycle.
- The SAR triptych is the Spain Sen1Floods11 chip. The Surat p014 images are rule-based
  change detectors, not U-Net output, so they are not used here.
- The dashboard is in Demo Mode. Do not switch to Live Mode for the final field-data shots.
- The probe is designed and being printed; there is no field footage of a printed probe.
- No music, room tone or sound effects are in this file. Those belong in the final mix.
- There is no trained paddy-specific segmentation model. The SAR number is flood water
  on the public Spain dataset, and the film says so.
