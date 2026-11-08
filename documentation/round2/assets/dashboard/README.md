# Dashboard stills (1920 × 1080)

Five crops of the live dashboard at `http://localhost:5173/dashboard`, captured in Chrome at
1920 × 1080 on 8 Nov 2026. They cover beat 8 of the 7:35 script, plus the probe section on the
story home page.

**Every capture is in Demo Mode.** The `DEMO MODE · sensor node readings simulated` badge is in
frame on purpose. These shots illustrate the interface and the simulated field; they are not
evidence of live node telemetry. Do not crop the badge out, and do not switch to Live Mode for
these beats.

| File | View | Used for |
|---|---|---|
| `dash-overview.png` | Farm overview, node map, status tiles | 5:40, opening dashboard shot |
| `field-top.png` | Field MVL-01 header, moisture bands, node list | 5:50, one field page |
| `field-charts.png` | 48 h moisture and temperature charts with the 3D field block | 6:02, charts then 3D |
| `field-3d.png` | 3D field block, closer framing | 6:02, alternative cut-in |
| `home-probe.png` | Story home, probe section and link into the explorer | 6:14, bridge to Probe Explorer |

The captures are static. For the final film, either hold them with a slow push-in in the edit or
record a short cursor pass at the same URLs; the live app is deterministic enough that a re-take
will match these frames.

Rebuild the animatic after replacing any of these files:

```bash
cd documentation/round2/assets/animatic
/mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python build_animatic.py
```
