# Voice-over cues · 7:35 animatic

Record each line against the animatic. The in-point is the shot start; the
out-point is the next shot. Leave half a second of room tone at both ends.

| In | Out | Beat | Shot | Line |
|---|---|---|---|---|
| 0:00 | 0:07 | BEAT 1 · HOOK | PROBE EXPLORER · ch1 · flooded paddy | India's rice paddies release about six and a half million tonnes of methane every year. |
| 0:07 | 0:15 | BEAT 1 · HOOK | PROBE EXPLORER · ch1 · water starts to drop | Most of it comes from one habit: keeping fields flooded all season. The fix is already known. |
| 0:15 | 0:21 | BEAT 1 · HOOK | FACE CAM · TAKE 1 · HOOK | The problem is, it happens fifteen centimetres underground, where nobody can see. |
| 0:21 | 0:25 | BEAT 1 · HOOK | TITLE CARD | I'm Neeraj, and this is AGRI-GRID. |
| 0:25 | 0:38 | BEAT 2 · PROBLEM | PROBE EXPLORER · ch1 · time-lapse | Flooded soil has no oxygen, so microbes in it make methane. IRRI's answer is alternate wetting and drying, AWD: let the water drop below the surface, then flood again. |
| 0:38 | 0:50 | BEAT 2 · PROBLEM | CARD · AWD NUMBERS | It saves up to thirty percent of the water, and cuts methane by up to forty-eight percent. India grows rice on about fifty-one million hectares, so this matters. |
| 0:50 | 0:57 | BEAT 2 · PROBLEM | PROBE EXPLORER · ch1 · the −15 cm rule | But AWD has one rule: re-irrigate when the water is fifteen centimetres below the soil. |
| 0:57 | 1:15 | BEAT 2 · PROBLEM | DECK · ROUND 1 · slide 3 | Today a farmer checks that by hand, with a pipe, in one spot, if he has time. Nobody buying carbon credits can verify it was done. And satellites help, but radar only sees the top five centimetres. |
| 1:15 | 1:18 | BEAT 3 · IDEA | CARD · THREE LAYERS | So AGRI-GRID connects three layers. |
| 1:18 | 1:23 | BEAT 3 · IDEA | CARD · GROUND | Ground: a probe that reads water at four depths. |
| 1:23 | 1:28 | BEAT 3 · IDEA | CARD · SPACE | Space: Sentinel-1 radar over the whole farm. |
| 1:28 | 1:38 | BEAT 3 · IDEA | CARD · AI | And AI that turns both into one decision for the farmer, and one record anyone can check. |
| 1:38 | 1:45 | BEAT 3 · IDEA | PROBE EXPLORER · ch2 · probe top-down | Let me show you each piece, starting underground. |
| 1:45 | 1:55 | BEAT 4 · PROBE | PROBE EXPLORER · ch2 · names and scale | This is the probe. A twenty-five millimetre tube, 3D-printed in PETG. White above the soil, black below. |
| 1:55 | 2:04 | BEAT 4 · PROBE | PROBE EXPLORER · ch2 · X-ray bands | Inside, four copper bands sit at zero to five, five to ten, ten to fifteen and fifteen to twenty centimetres. |
| 2:04 | 2:08 | BEAT 4 · PROBE | PROBE EXPLORER · ch3 · copper in pockets | It prints in two halves. |
| 2:08 | 2:13 | BEAT 4 · PROBE | PROBE EXPLORER · ch3 · halves close | The copper goes into shallow pockets, and the halves seal with epoxy. |
| 2:13 | 2:19 | BEAT 4 · PROBE | PROBE EXPLORER · ch4 · 1.6 mm wall | The plastic wall is the insulator. No metal touches the soil, so nothing corrodes, |
| 2:19 | 2:25 | BEAT 4 · PROBE | PROBE EXPLORER · ch4 · resistive sensor | unlike the cheap two-prong sensors that rust in weeks. |
| 2:25 | 2:32 | BEAT 4 · PROBE | PROBE EXPLORER · ch5 · fringing field | Each band is a capacitor. Its electric field reaches through the wall into the soil. |
| 2:32 | 2:47 | BEAT 4 · PROBE | PROBE EXPLORER · ch5 · ε → θ curve | Water has a permittivity of about eighty; dry soil, about four. So as soil gets wetter, capacitance rises, and the ESP32's touch pins measure it directly. A published equation, Topp 1980, turns that into water content. |
| 2:47 | 2:53 | BEAT 4 · PROBE | PROBE EXPLORER · ch6 · guard rings | Guard rings make sure each band reads only its own slice of soil. |
| 2:53 | 3:08 | BEAT 4 · PROBE | PROBE EXPLORER · ch8 · one drying cycle | Here is one drying cycle: about ten days in a few seconds. The water strip follows the flood down. Then the bands dry, top to bottom. |
| 3:08 | 3:15 | BEAT 4 · PROBE | PROBE EXPLORER · ch8 · IRRIGATE NOW | At minus fifteen, the node flags: irrigate. |
| 3:15 | 3:18 | BEAT 5 · HARDWARE | FACE CAM · TAKE 2 · BENCH | This is what's on our bench today. |
| 3:18 | 3:21 | BEAT 5 · HARDWARE | HARDWARE · gateway exterior | The gateway prototype: the box that sits at the farmhouse. |
| 3:21 | 3:26 | BEAT 5 · HARDWARE | HARDWARE · IOTPS-Mini + controller board | Mains-powered, with the power module |
| 3:26 | 3:30 | BEAT 5 · HARDWARE | HARDWARE · internals · second angle | and the controller board inside. |
| 3:30 | 3:36 | BEAT 5 · HARDWARE | HARDWARE · powered on · green LED | And here it is powered on. |
| 3:36 | 3:41 | BEAT 5 · HARDWARE | BUILD SHEET · page 1 | The probes and field nodes are being built to the design you just saw. |
| 3:41 | 3:45 | BEAT 5 · HARDWARE | CIRCUIT · system diagram | The node electronics follow our build sheet. |
| 3:50 | 4:02 | BEAT 6 · GRID | PROBE EXPLORER · ch9 · four nodes | In the field, every node sends its readings to that gateway over ESP-NOW, the ESP32's own radio. No Wi-Fi network, and no SIM card on each node. |
| 4:02 | 4:12 | BEAT 6 · GRID | PROBE EXPLORER · ch9 · B2 leaking bund | Here, node B2 is losing water three times faster than its neighbours. That isn't normal drying. That's a leaking bund. |
| 4:12 | 4:18 | BEAT 6 · GRID | PROBE EXPLORER · ch17 · phone lock screen | The farmer never sees any of the backend. He gets one SMS, in Marathi: |
| 4:18 | 4:24 | BEAT 6 · GRID | PROBE EXPLORER · ch17 · SMS thread | शेत सुकत आहे. २–३ दिवसांत पाणी देण्याची तयारी ठेवा. / Field is drying. Plan to irrigate in 2–3 days. |
| 4:24 | 4:40 | BEAT 6 · GRID | PROBE EXPLORER · ch17 · app opens | One tap opens the app: today's water level, the plan, the rain forecast, and a button to call an agronomist. |
| 4:40 | 4:46 | BEAT 7 · AI | PROBE EXPLORER · ch17 · pipeline cards | Now, where the AI does its work. Three models, each with one job. |
| 4:46 | 4:55 | BEAT 7 · AI | PROBE EXPLORER · ch11 · calibration | First, calibration: it turns raw counts into water content, fitted to oven-dried samples of local soil. |
| 4:55 | 5:05 | BEAT 7 · AI | PROBE EXPLORER · ch9 · anomaly view | Second, anomaly detection: an Isolation Forest compares how fast each node dries. That's how B2's leak gets caught. |
| 5:05 | 5:17 | BEAT 7 · AI | SAR · REAL U-NET OUTPUT · SPAIN TEST CHIP | Third, space. We trained a U-Net on Sentinel-1 radar to map water across whole fields. Here is a radar chip, our prediction, and the ground truth. |
| 5:17 | 5:25 | BEAT 7 · AI | SAR · 89-CHIP MEAN · 0.3817 | Per-chip mean IoU is zero point three eight. A working first model, and the number we'll push up with more labelled fields. |
| 5:25 | 5:40 | BEAT 7 · AI | DECK VISUAL · EVIDENCE ENGINE | And the part I care most about: the disagreement engine. If the probe says wet and the radar says dry, we don't average them. We flag the field for a person to check. That's what makes the record trustworthy. |
| 5:40 | 5:50 | BEAT 8 · DASHBOARD | DASHBOARD · DEMO MODE · farm view | All of this lands on one dashboard. This is the farm view, every field coloured by its state. |
| 5:50 | 6:02 | BEAT 8 · DASHBOARD | DASHBOARD · DEMO MODE · field MVL-01 | Open a field and you get today's decision, the four probe bands, the water history and the SMS that went out. |
| 6:02 | 6:12 | BEAT 8 · DASHBOARD | DASHBOARD · DEMO MODE · 48 h + 3D field | Weather comes from open data for that exact location. Field officers and farmer groups use this view; farmers just get the SMS. |
| 6:12 | 6:20 | BEAT 8 · DASHBOARD | SITE · PROBE SECTION → EXPLORER | And this explorer, which you've been watching, is part of the site too: anyone can open it and learn how the probe works. |
| 6:20 | 6:33 | BEAT 9 · STATUS | CARD · STATUS | To be clear about where we are. The gateway hardware, the dashboard and the explorer are built. The SAR model is trained. The probe is designed and being printed. |
| 6:33 | 6:45 | BEAT 9 · STATUS | CARD · STATUS + NEXT | Probe readings you saw are simulated, and the thresholds are illustrative until we calibrate in real soil. That calibration is the first job of our pilot. |
| 6:45 | 6:57 | BEAT 10 · IMPACT | PROBE EXPLORER · ch18 · IPCC card | Why this is worth building: on one hectare, IPCC defaults put continuous flooding at around a hundred and forty kilograms of methane a season, and AWD at around eighty. |
| 6:57 | 7:03 | BEAT 10 · IMPACT | DECK · ROUND 1 · ₹14,995 cost card | Our prototype setup, three field nodes and a gateway, costs about fifteen thousand rupees. |
| 7:03 | 7:11 | BEAT 10 · IMPACT | DECK VISUAL · GO TO MARKET | We start with farmer producer organisations, then KVK pilots, |
| 7:11 | 7:20 | BEAT 10 · IMPACT | DECK VISUAL · SAME PLATFORM | then use the same records for methane-credit verification. And the platform carries over to sugarcane, wheat and cotton. |
| 7:20 | 7:30 | BEAT 11 · CLOSE | FACE CAM · TAKE 3 · CLOSE | The decision happens fifteen centimetres underground. AGRI-GRID sees it, tells the farmer, and proves it. |
| 7:30 | 7:35 | BEAT 11 · CLOSE | DECK · ROUND 1 · title slide | I'm Neeraj Parekh, team FusionForge. Thank you. |

Total 7:35 (455 s).
