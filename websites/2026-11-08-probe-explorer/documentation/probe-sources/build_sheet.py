"""Compile the AGRI-GRID prototype build sheet (HTML -> PDF) from diagrams.py."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import diagrams as D  # noqa: E402

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

FIELD_PINS = [
    ("Mini probe EW (water strip)", "GPIO12", "D6", "receive; 1 MΩ from D5"),
    ("Mini probe ES (soil −75 mm)", "GPIO13", "D7", "receive; 1 MΩ from D8"),
    ("RC send, water", "GPIO14", "D5", "drive high, time D6"),
    ("RC send, soil", "GPIO15", "D8", "board pull-down keeps boot safe"),
    ("Sensor power (moisture module, DHT11)", "GPIO5", "D1", "HIGH only while reading"),
    ("DHT11 data (node D4)", "GPIO4", "D2", "10 kΩ to SENS_PWR"),
    ("Two-prong module AO", "ADC", "A0", "0–3.3 V on NodeMCU"),
    ("Deep-sleep wake", "GPIO16", "D0 → RST", "remove to flash"),
    ("3.3 V in from HT7833", "3V3", "3V3", "not Vin"),
]
GW_PINS = [
    ("SIM800L TXD → ESP RX", "GPIO14", "IO14", "UART2 RX"),
    ("ESP TX → divider → SIM800L RXD", "GPIO15", "IO15", "1 kΩ / 2 kΩ"),
    ("Pump relay / MOSFET", "GPIO13", "IO13", "HIGH = pump on"),
    ("5 V in", "5V", "5V", "from LM2596 #1"),
    ("USB serial to laptop", "U0R/U0T", "MB board", "bridge.py reads this"),
]

STEPS = [
    ("Set the bucks first", "Power each LM2596 from 12 V with nothing attached. Turn the trimmer until the multimeter reads 5.00 V and 4.00 V. Only then wire them up."),
    ("ESP32 alone, on USB", "Flash a sketch that prints touchRead() for GPIO 32, 33, 27, 14, 13 and 4 once a second. Touch each J1 pin with a finger: the count should jump."),
    ("Probe on the bench", "Plug in the probe. Record counts in air, in dry soil and in a glass of water. Water must give the biggest change. If a band does not move, check its wire."),
    ("Battery path", "Charge the 18650 through the TP4056 (red LED → blue). Check OUT+ is 3.7–4.2 V and the HT7833 gives 3.30 V with nothing attached."),
    ("Battery mode", "Unplug USB. Switch SW1 on with the ESP32 fitted. The board should boot from the battery. Never have USB and SW1 on together."),
    ("Measure sleep current", "Pull JP1. Put the multimeter (200 µA or 2 mA range) across its pins and let the node sleep. Write the number down: it is your first real power measurement."),
    ("Field nodes", "Flash each NodeMCU with D0–RST unplugged, then fit the wire. Confirm the gateway prints a packet from each node with rising seq numbers."),
    ("Gateway + SMS", "Insert an Airtel, Vi or BSNL SIM. Send AT, then AT+CREG? until it reports registered. Send one test SMS to your phone before the demo day."),
]

CAL = [
    "Take 5–6 soil samples from the demo field, from bone-dry to saturated (add water in steps).",
    "Pack each sample around the probe in a cup of known volume V. Record the touch counts for the band.",
    "Weigh the wet sample (m_wet). Dry it at 105 °C for 24 h, or in a microwave in 1-minute bursts until the weight stops changing. Weigh again (m_dry).",
    "Volumetric water content: θ = (m_wet − m_dry) / (ρ_water · V), with ρ_water = 1 g/cm³.",
    "Plot θ against the counts and fit a straight line or a quadratic. That curve is your calibration, and the slide judges remember.",
    "Water strip: stand the probe in a bucket and pour in 0, 20, 40, 60, 80 and 100 mm. Fit counts against depth.",
    "Repeat one point at a different temperature to see the drift; the DS18B20 lets you correct for it.",
]


def table(rows, head):
    h = "".join("<th>%s</th>" % x for x in head)
    b = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % c for c in r) for r in rows)
    return "<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % (h, b)


def page(title, body, n):
    return '<section class="pg"><header><b>AGRI-GRID · prototype build sheet</b><span>%s</span><span>%d</span></header>%s</section>' % (title, n, body)


svgs = {name: fn() for name, fn in D.BUILDERS}
pages = []
pages.append(page("Overview", """
<h1>AGRI-GRID hackathon prototype</h1>
<p class="lead">Four ESP nodes with 3D-printed dielectric probes, an ESP-NOW gateway that sends SMS and drives a pump,
and the existing FastAPI backend. Everything here uses parts you already own, plus the short list at the end.</p>
%s""" % svgs["system"], 1))
pages.append(page("Hero node schematic", svgs["hero"], 2))
pages.append(page("Hero node pin map", "<h2>Node A1 pin map (ESP32 DevKit V1, 30-pin)</h2>" +
                  table(D.HERO_PINS, ["Signal", "GPIO", "DevKit pin", "Note"]) +
                  """<h2>Why these pins</h2><ul>
<li>All six electrodes use ESP32 touch channels that are not boot-strapping pins (GPIO 0, 2, 5, 12, 15 are avoided).</li>
<li>The ESP32-C3 has <b>no touch hardware</b>. Any node that reads the probe this way must be a classic ESP32 or an ESP32-S3.</li>
<li>Battery sense is on GPIO34, an ADC1 pin, so it still works while the radio is on.</li>
<li>HT7833 (500 mA) instead of a 250 mA LDO: an ESP32 transmit burst can pull 300 mA or more.</li></ul>""", 3))
pages.append(page("Hero node perfboard", svgs["perfboard"], 4))
pages.append(page("Dielectric probe", svgs["probe"], 5))
pages.append(page("Field node", svgs["field"], 6))
pages.append(page("Gateway", svgs["gateway"], 7))
pages.append(page("Field node and gateway pin maps", "<h2>Field node pin map (NodeMCU v3)</h2>" +
                  table(FIELD_PINS, ["Signal", "GPIO", "NodeMCU pin", "Note"]) + "<h2>Gateway pin map (ESP32-CAM)</h2>" +
                  table(GW_PINS, ["Signal", "GPIO", "ESP32-CAM pin", "Note"]), 8))
pages.append(page("Bring-up and calibration", "<h2>Bring-up order</h2><ol class='steps'>" +
                  "".join("<li><b>%s.</b> %s</li>" % s for s in STEPS) + "</ol><h2>Calibrating the probe</h2><ol class='steps'>" +
                  "".join("<li>%s</li>" % c for c in CAL) + "</ol>", 9))
pages.append(page("Parts", """<h2>Already on your bench</h2>
<p>ESP32 DevKit, ESP32-CAM, 3 × NodeMCU, 3 × ESP-12F, INA219, DHT11, two-prong moisture module, relay module,
12 V pump, 12 V adapter, 4–6 × 18650 with holders, 1 W panel, perfboard, resistors, LEDs, solder station,
black PETG and the printer. SIM800L from your friend.</p>
<h2>Short list to buy (rough prices; check before ordering)</h2>""" + table([
    ("HT7833 (or AP2112K-3.3) LDO", "4", "≈ ₹20 each", "one per battery node"),
    ("TP4056 + DW01 protected module", "4", "≈ ₹30–50 each", "one per battery node"),
    ("LM2596 buck module", "2", "≈ ₹80–120 each", "gateway 5.0 V and 4.0 V rails"),
    ("Waterproof DS18B20", "2", "≈ ₹120 each", "soil temperature, drift correction"),
    ("SHT31 module", "1", "≈ ₹300", "replaces DHT11 outdoors"),
    ("Copper foil tape, 10 mm", "1 roll", "≈ ₹150", "probe electrodes"),
    ("Clear epoxy", "1", "≈ ₹100", "seal the probe halves and tip"),
    ("1000 µF / 470 µF / 10 µF electrolytics", "few", "≈ ₹50", "SIM800L and LDO bulk caps"),
    ("Female headers, 11-pin and 4-pin headers, slide switch", "set", "≈ ₹80", "hero perfboard"),
    ("Later: RFM95W-868 or Ra-01H pair + 868 MHz antennas", "2", "≈ ₹1,400–1,600", "one real LoRa link with RSSI"),
], ["Part", "Qty", "Price", "Why"]) + """<p class="small">Prices are typical Indian online listings, not quotes. LoRa can wait:
ESP-NOW runs the demo, and the firmware keeps the radio behind one interface so swapping later changes one file.</p>""", 10))

CSS = """
@page{size:A4 landscape;margin:10mm}
:root{%s}
body{font-family:"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif;color:#1b2620;margin:0}
.pg{page-break-after:always;break-after:page;padding:0 4mm}
.pg:last-child{page-break-after:auto}
header{display:flex;gap:16px;align-items:baseline;border-bottom:1px solid #c7d2c3;padding:2mm 0;margin-bottom:3mm;font-size:10pt;color:#5b6a5f}
header span:last-child{margin-left:auto}
h1{font-family:"Bricolage Grotesque","Arial Narrow",sans-serif;font-size:22pt;margin:2mm 0}
h2{font-family:"Bricolage Grotesque","Arial Narrow",sans-serif;font-size:13pt;margin:4mm 0 2mm}
.lead{font-size:11pt;max-width:220mm}
.dgm{max-height:165mm}
table{border-collapse:collapse;font-size:9.5pt;width:100%%}
th{text-align:left;border-bottom:1.5px solid #1b2620;padding:3px 6px}
td{border-bottom:1px solid #d6ddd2;padding:3px 6px}
.steps li{margin-bottom:2mm;font-size:10pt;max-width:250mm}
.small{font-size:9pt;color:#5b6a5f}
%s
""" % (D.TOKENS_LIGHT.replace("\n", ""), D.CSS)

html = "<!doctype html><html><head><meta charset='utf-8'><title>AGRI-GRID prototype build sheet</title><style>%s</style></head><body>%s</body></html>" % (CSS, "".join(pages))
hp = os.path.join(OUT, "AGRI_GRID_Prototype_Build_Sheet.html")
open(hp, "w").write(html)


async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        pg = await b.new_page()
        await pg.goto("file://" + os.path.abspath(hp))
        await pg.pdf(path=os.path.join(OUT, "AGRI_GRID_Prototype_Build_Sheet.pdf"), format="A4", landscape=True, print_background=True)
        await b.close()
asyncio.run(main())
print("pdf ok")
