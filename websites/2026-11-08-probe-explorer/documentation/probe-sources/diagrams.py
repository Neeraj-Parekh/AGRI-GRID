"""AGRI-GRID hackathon prototype: wiring diagrams as theme-aware SVG.

Colours come from CSS variables so the same SVG works in the website (light/dark)
and in the printable build sheet. Run:  python3 diagrams.py <outdir>
"""
import os
import sys
from html import escape

# ------------------------------------------------------------------ primitives
W_COL = {  # wire classes -> css var
    "pwr": "var(--w-pwr)", "gnd": "var(--w-gnd)", "sig": "var(--w-sig)", "i2c": "var(--w-i2c)",
    "probe": "var(--w-probe)", "uart": "var(--w-uart)", "bat": "var(--w-bat)", "v12": "var(--w-v12)",
}


class SVG:
    def __init__(self, w, h, title):
        self.w, self.h, self.title = w, h, title
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def text(self, x, y, s, cls="t", anchor="start", size=None, weight=None, fill=None):
        st = []
        if size:
            st.append("font-size:%spx" % size)
        if weight:
            st.append("font-weight:%s" % weight)
        if fill:
            st.append("fill:%s" % fill)
        style = ' style="%s"' % ";".join(st) if st else ""
        self.add('<text x="%.1f" y="%.1f" class="%s" text-anchor="%s"%s>%s</text>' % (x, y, cls, anchor, style, escape(s)))

    def rect(self, x, y, w, h, cls="bx", rx=6, extra=""):
        self.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%s" class="%s" %s/>' % (x, y, w, h, rx, cls, extra))

    def line(self, pts, kind="sig", width=2.2, dash=None):
        d = "M" + " L".join("%.1f %.1f" % p for p in pts)
        da = ' stroke-dasharray="%s"' % dash if dash else ""
        self.add('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linejoin="round" stroke-linecap="round"%s/>'
                 % (d, W_COL[kind], width, da))

    def dot(self, x, y, kind="sig", r=3.2):
        self.add('<circle cx="%.1f" cy="%.1f" r="%s" fill="%s"/>' % (x, y, r, W_COL[kind]))

    def net(self, x, y, name, kind="pwr", side="r"):
        """net flag: a short stub and a label pill."""
        w = 8 + 6.6 * len(name)
        if side == "r":
            self.line([(x, y), (x + 14, y)], kind)
            self.add('<rect x="%.1f" y="%.1f" width="%.1f" height="16" rx="8" fill="none" stroke="%s" stroke-width="1.4"/>'
                     % (x + 14, y - 8, w, W_COL[kind]))
            self.text(x + 14 + w / 2, y + 4, name, "nl", "middle", fill=W_COL[kind])
        else:
            self.line([(x, y), (x - 14, y)], kind)
            self.add('<rect x="%.1f" y="%.1f" width="%.1f" height="16" rx="8" fill="none" stroke="%s" stroke-width="1.4"/>'
                     % (x - 14 - w, y - 8, w, W_COL[kind]))
            self.text(x - 14 - w / 2, y + 4, name, "nl", "middle", fill=W_COL[kind])

    def gnd(self, x, y):
        self.line([(x, y), (x, y + 8)], "gnd")
        for i, hw in enumerate((9, 6, 3)):
            self.line([(x - hw, y + 8 + i * 3.5), (x + hw, y + 8 + i * 3.5)], "gnd", 1.8)

    def res(self, x1, y1, x2, y2, label, kind="sig"):
        """resistor between two points (axis aligned)."""
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if abs(x2 - x1) > abs(y2 - y1):
            self.line([(x1, y1), (mx - 16, my)], kind)
            self.line([(mx + 16, my), (x2, y2)], kind)
            self.rect(mx - 16, my - 6, 32, 12, "rs", 2)
            self.text(mx, my - 10, label, "sm", "middle")
        else:
            self.line([(x1, y1), (mx, my - 16)], kind)
            self.line([(mx, my + 16), (x2, y2)], kind)
            self.rect(mx - 6, my - 16, 12, 32, "rs", 2)
            self.text(mx + 10, my + 4, label, "sm", "start")

    def cap(self, x, y1, y2, label, kind="pwr", polar=False):
        my = (y1 + y2) / 2
        self.line([(x, y1), (x, my - 4)], kind)
        self.line([(x, my + 4), (x, y2)], "gnd")
        self.line([(x - 9, my - 4), (x + 9, my - 4)], kind, 2.4)
        self.line([(x - 9, my + 4), (x + 9, my + 4)], "gnd", 2.4)
        if polar:
            self.text(x - 14, my - 6, "+", "sm", "middle")
        self.text(x + 13, my + 4, label, "sm")

    def module(self, x, y, w, h, title, sub=None, left=(), right=(), top=(), bottom=(), pitch=26, cls="bx", pin_off=None):
        """box with named pins. returns dict pin -> (x, y)."""
        self.rect(x, y, w, h, cls)
        self.text(x + 10, y + 20, title, "mt")
        if sub:
            self.text(x + 10, y + 36, sub, "ms")
        pins = {}
        off = pin_off if pin_off is not None else (48 if sub else 34)
        for i, p in enumerate(left):
            if p is None:
                continue
            py = y + off + i * pitch
            pins[p] = (x, py)
            self.add('<circle cx="%.1f" cy="%.1f" r="3" class="pin"/>' % (x, py))
            self.text(x + 8, py + 4, p, "pn")
        for i, p in enumerate(right):
            if p is None:
                continue
            py = y + off + i * pitch
            pins[p] = (x + w, py)
            self.add('<circle cx="%.1f" cy="%.1f" r="3" class="pin"/>' % (x + w, py))
            self.text(x + w - 8, py + 4, p, "pn", "end")
        for i, p in enumerate(top):
            if p is None:
                continue
            px = x + 30 + i * (pitch + 30)
            pins[p] = (px, y)
            self.add('<circle cx="%.1f" cy="%.1f" r="3" class="pin"/>' % (px, y))
            self.text(px, y + 16, p, "pn", "middle")
        for i, p in enumerate(bottom):
            if p is None:
                continue
            px = x + 30 + i * (pitch + 30)
            pins[p] = (px, y + h)
            self.add('<circle cx="%.1f" cy="%.1f" r="3" class="pin"/>' % (px, y + h))
            self.text(px, y + h - 8, p, "pn", "middle")
        return pins

    def note(self, x, y, lines, w=300, cls="nt"):
        h = 14 + 17 * len(lines)
        self.rect(x, y, w, h, cls, 8)
        for i, s in enumerate(lines):
            self.text(x + 10, y + 20 + i * 17, s, "sm")

    def render(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" class="dgm" role="img" aria-label="%s">'
                % (self.w, self.h, escape(self.title)) + "".join(self.parts) + "</svg>")


# ------------------------------------------------------------------ pin maps
DEVKIT_L = ["EN", "VP·36", "VN·39", "D34", "D35", "D32", "D33", "D25", "D26", "D27", "D14", "D12", "D13", "GND", "VIN"]
DEVKIT_R = ["D23", "D22", "TX0", "RX0", "D21", "D19", "D18", "D5", "TX2", "RX2", "D4", "D2", "D15", "GND", "3V3"]

HERO_PINS = [  # signal, gpio, devkit pin, note
    ("E1 soil 0–5 cm (SAR-matched)", "GPIO32 · T9", "D32", "touch electrode"),
    ("E2 soil 5–10 cm", "GPIO33 · T8", "D33", "touch electrode"),
    ("E3 soil 10–15 cm", "GPIO27 · T7", "D27", "touch electrode"),
    ("E4 soil 15–20 cm (AWD line)", "GPIO14 · T6", "D14", "touch electrode"),
    ("EW water strip 0 to +100 mm", "GPIO13 · T4", "D13", "touch electrode"),
    ("EREF sealed reference (in cap)", "GPIO4 · T0", "D4", "drift / temperature reference"),
    ("DS18B20 data (soil temp, inside probe)", "GPIO25", "D25", "4.7 kΩ pull-up to 3V3"),
    ("I²C SDA (SHT31 + INA219)", "GPIO21", "D21", "module pull-ups"),
    ("I²C SCL (SHT31 + INA219)", "GPIO22", "D22", "module pull-ups"),
    ("Battery sense (220k / 220k divider)", "GPIO34", "D34", "ADC1, input only"),
    ("3.3 V in (from HT7833)", "3V3", "3V3", "battery mode: do NOT also plug USB"),
    ("Ground", "GND", "GND", ""),
]


# ------------------------------------------------------------------ 1. system
def system():
    s = SVG(1100, 580, "System diagram: ESP-NOW nodes, gateway, SMS, backend, SAR")
    s.text(24, 34, "AGRI-GRID prototype · how data moves", "h1")
    nodes = [("A1", "Hero probe node", "ESP32 · 6-electrode probe", 80),
             ("B2", "Field node", "NodeMCU · mini probe", 180),
             ("C3", "Field node", "NodeMCU · mini probe", 280),
             ("D4", "Field node", "NodeMCU · mini probe + DHT11", 380)]
    for nid, t, sub, y in nodes:
        s.rect(24, y, 230, 76, "bx")
        s.text(40, y + 26, nid + " · " + t, "mt")
        s.text(40, y + 46, sub, "ms")
        s.text(40, y + 64, "18650 · deep sleep · seq + CRC", "sm")
        s.line([(254, y + 38), (420, 290)], "sig", 2, "6 5")
    s.text(270, 70, "ESP-NOW · 2.4 GHz", "lbl")
    s.text(270, 86, "no router · ~100–200 m open air", "sm")
    g = (420, 220, 230, 150)
    s.rect(*g, "bx hl")
    s.text(436, 246, "Gateway · ESP32-CAM", "mt")
    s.text(436, 266, "receives, stamps RSSI, dedupes", "ms")
    s.text(436, 290, "+ SIM800L → SMS alerts", "sm")
    s.text(436, 308, "+ pump relay (12 V)", "sm")
    s.text(436, 326, "+ optional gauge photo", "sm")
    s.text(436, 352, "12 V adapter → 5 V and 4.0 V bucks", "sm")
    # sms
    s.rect(720, 90, 200, 70, "bx")
    s.text(736, 116, "Farmer's phone", "mt")
    s.text(736, 136, "SMS: “A1 −15 cm: irrigate”", "sm")
    s.line([(650, 250), (720, 125)], "uart", 2, "6 5")
    s.text(640, 180, "2G SMS", "lbl")
    # laptop/backend
    s.rect(720, 220, 200, 70, "bx")
    s.text(736, 246, "Laptop · bridge.py", "mt")
    s.text(736, 266, "USB serial → HTTP POST", "sm")
    s.line([(650, 300), (720, 255)], "sig", 2.2)
    s.rect(720, 320, 200, 70, "bx")
    s.text(736, 346, "FastAPI /agri/ingest", "mt")
    s.text(736, 366, "your existing backend", "sm")
    s.line([(820, 290), (820, 320)], "sig", 2.2)
    s.rect(720, 420, 200, 70, "bx")
    s.text(736, 446, "React dashboard", "mt")
    s.text(736, 466, "map · AWD timeline · evidence", "sm")
    s.line([(820, 390), (820, 420)], "sig", 2.2)
    # SAR
    s.rect(950, 320, 130, 70, "bx")
    s.text(962, 346, "Sentinel-1 SAR", "mt")
    s.text(962, 366, "your model", "sm")
    s.line([(950, 355), (920, 355)], "probe", 2.2)
    s.text(930, 410, "ground ↔ space", "lbl", "middle")
    # pump
    s.rect(420, 420, 230, 70, "bx")
    s.text(436, 446, "12 V pump → mini paddy", "mt")
    s.text(436, 466, "closes the loop on the table", "sm")
    s.line([(535, 370), (535, 420)], "v12", 2.4)
    s.note(24, 510, ["Field version: replace ESP-NOW with LoRa SX1262 at 865–867 MHz.",
                     "Same packet, same backend; only the radio file changes."], 560)
    return s.render()


# ------------------------------------------------------------------ 2. hero node schematic
def hero():
    s = SVG(1180, 1010, "Hero probe node wiring: ESP32 DevKit, probe, sensors, power")
    s.text(24, 34, "Node A1 · hero probe node (ESP32 DevKit V1, 30-pin)", "h1")
    s.text(24, 56, "Pills are net names: every pill with the same name is the same wire.", "ms")
    ex, ey, ew = 470, 90, 190
    p = s.module(ex, ey, ew, 15 * 28 + 40, "ESP32 DevKit V1", "top view · USB at bottom", DEVKIT_L, DEVKIT_R, pitch=28)
    gl = (ex, p["D13"][1] + 28)               # left GND pin (dict keeps the right one)
    # ---- J1 probe header (11 pins; 4 and 7 unused so every wire runs straight)
    jy0 = p["D32"][1]
    rows = [("1", "E1 · 0–5 cm", "D32", "probe"), ("2", "E2 · 5–10 cm", "D33", "probe"), ("3", "DQ · DS18B20", "D25", "sig"),
            ("4", "—", None, None), ("5", "E3 · 10–15 cm", "D27", "probe"), ("6", "E4 · 15–20 cm", "D14", "probe"),
            ("7", "—", None, None), ("8", "EW · water", "D13", "probe"), ("9", "GND rings", "GNDL", "gnd"),
            ("10", "VDD · DS18B20", None, "pwr"), ("11", "EREF", None, "probe")]
    s.rect(40, jy0 - 56, 190, len(rows) * 28 + 68, "bx")
    s.text(52, jy0 - 34, "J1 · probe cable", "mt")
    s.text(52, jy0 - 18, "11-pin header", "ms")
    for i, (num, lab, ep, kind) in enumerate(rows):
        y = jy0 + i * 28
        s.add('<circle cx="230" cy="%.1f" r="3" class="pin"/>' % y)
        s.text(52, y + 4, num, "pn")
        s.text(220, y + 4, lab, "pn", "end")
        if ep == "GNDL":
            s.line([(230, y), gl], "gnd")
        elif ep:
            s.line([(230, y), p[ep]], kind)
    y10 = jy0 + 9 * 28
    y11 = jy0 + 10 * 28
    s.net(230, y10, "3V3", "pwr")
    s.net(230, y11, "EREF", "probe")
    # ---- ESP32 other pins
    s.net(*p["D34"], "VSENSE", "sig", "l")
    s.net(*p["D4"], "EREF", "probe")
    s.net(*p["3V3"], "3V3", "pwr")
    s.net(*p["GND"], "GND", "gnd")
    s.text(ex + 10, ey + 15 * 28 + 66, "VIN and USB: not used in battery mode", "sm")
    # ---- I2C sensors
    sda, scl = p["D21"], p["D22"]
    sx = 900
    sh = s.module(sx, 90, 230, 150, "SHT31 module", "air temp · RH (DHT11 for now)", ["VIN", "GND", "SCL", "SDA"])
    ina = s.module(sx, 290, 230, 150, "INA219 module", "plug-in, only while measuring", ["VCC", "GND", "SCL", "SDA"])
    s.line([scl, (780, scl[1]), (780, sh["SCL"][1]), sh["SCL"]], "i2c")
    s.line([sda, (800, sda[1]), (800, sh["SDA"][1]), sh["SDA"]], "i2c")
    s.text(700, scl[1] - 6, "SCL", "pn")
    s.text(700, sda[1] - 6, "SDA", "pn")
    for m, vk in ((sh, "VIN"), (ina, "VCC")):
        s.net(*m[vk], "3V3", "pwr", "l")
        s.net(*m["GND"], "GND", "gnd", "l")
    s.net(*ina["SCL"], "SCL·D22", "i2c", "l")
    s.net(*ina["SDA"], "SDA·D21", "i2c", "l")
    s.text(sx, 466, "INA219 VIN+ → VBAT_SW, VIN− → VSYS", "pn")
    s.text(sx, 484, "(pull JP1 and clip it in its place)", "sm")
    s.text(sx, 262, "DHT11 instead: DATA → D26, 10 kΩ to 3V3", "sm")
    # ---- power path
    py = 660
    s.text(24, py - 40, "Power path", "h2")
    sol = s.module(24, py, 140, 100, "Solar 1 W", "≈ 6 V panel", right=["+", "−"])
    tp = s.module(240, py, 190, 120, "TP4056 + DW01", "protected charger", ["IN+", "IN−"], ["OUT+", "OUT−"],
                  bottom=["B+", "B−"])
    s.line([sol["+"], tp["IN+"]], "pwr")
    s.line([sol["−"], tp["IN−"]], "gnd")
    s.rect(240, py + 170, 190, 40, "bx")
    s.text(252, py + 195, "18650 cell (protected)", "mt")
    s.line([tp["B+"], (tp["B+"][0], py + 170)], "bat")
    s.line([tp["B−"], (tp["B−"][0], py + 170)], "gnd")
    o = tp["OUT+"]
    s.line([o, (470, o[1])], "bat")
    s.rect(470, o[1] - 13, 54, 26, "bx", 4)
    s.text(497, o[1] + 4, "SW1", "pn", "middle")
    s.line([(524, o[1]), (580, o[1])], "bat")
    s.dot(552, o[1], "bat")
    s.line([(552, o[1]), (552, o[1] - 34)], "bat")
    s.net(552, o[1] - 34, "VBAT_SW", "bat")
    s.rect(580, o[1] - 13, 54, 26, "bx", 4)
    s.text(607, o[1] + 4, "JP1", "pn", "middle")
    s.text(607, o[1] + 30, "current jumper", "sm", "middle")
    s.line([(634, o[1]), (700, o[1])], "bat")
    s.net(700, o[1], "VSYS", "bat")
    s.net(*tp["OUT−"], "GND", "gnd")
    ld = s.module(560, py + 100, 170, 110, "HT7833 LDO", "500 mA · µA idle", ["IN", "GND"], ["OUT"])
    s.net(*ld["IN"], "VSYS", "bat", "l")
    s.net(*ld["GND"], "GND", "gnd", "l")
    s.line([ld["OUT"], (800, ld["OUT"][1])], "pwr")
    s.cap(770, ld["OUT"][1], ld["OUT"][1] + 56, "470 µF ‖ 100 nF", "pwr", True)
    s.gnd(770, ld["OUT"][1] + 56)
    s.net(800, ld["OUT"][1], "3V3", "pwr")
    s.text(560, py + 232, "add 10 µF from VSYS to GND at the LDO input", "sm")
    # ---- small blocks: divider and pull-up
    bx = 900
    s.text(bx, py - 40, "Battery sense", "h2")
    s.net(bx + 40, py - 10, "VBAT_SW", "bat", "l")
    s.line([(bx + 40, py - 10), (bx + 60, py - 10)], "bat")
    s.res(bx + 60, py - 10, bx + 60, py + 70, "220 kΩ", "bat")
    s.dot(bx + 60, py + 70)
    s.line([(bx + 60, py + 70), (bx + 120, py + 70)], "sig")
    s.net(bx + 120, py + 70, "VSENSE", "sig")
    s.res(bx + 60, py + 70, bx + 60, py + 150, "220 kΩ")
    s.gnd(bx + 60, py + 150)
    s.line([(bx + 60, py + 70), (bx + 20, py + 70)], "sig")
    s.cap(bx + 20, py + 70, py + 130, "", "sig")
    s.text(bx - 30, py + 104, "100 nF", "sm")
    s.gnd(bx + 20, py + 130)
    s.text(bx, py + 200, "DS18B20 pull-up", "h2")
    s.net(bx + 40, py + 230, "DQ (D25)", "sig", "l")
    s.res(bx + 40, py + 230, bx + 150, py + 230, "4.7 kΩ")
    s.net(bx + 150, py + 230, "3V3", "pwr")
    s.note(24, 930, ["Battery mode feeds the 3V3 pin directly. Switch SW1 off before plugging in USB, every time.",
                     "Pull the DevKit's power LED; then measure sleep current across JP1 with a multimeter on 200 µA."], 820)
    return s.render()


# ------------------------------------------------------------------ 3. perfboard (data-driven + checked)
class Board:
    """Holes (c, r). Parts own pads; wires are polylines on 'top' (insulated jumpers) or 'bot' (solder side)."""

    def __init__(self, cols, rows):
        self.cols, self.rows = cols, rows
        self.pads = {}          # (c,r) -> (net, part)
        self.parts = []         # (c0, r0, c1, r1, label, sub, cls)
        self.wires = []         # (net, side, pts, kind)
        self.bodies = []        # (c0,r0,c1,r1) resistor/cap bodies (segments)
        self.ties = []          # internal connections (part-internal), list of (netname)

    def pad(self, c, r, net, part):
        assert 0 <= c < self.cols and 0 <= r < self.rows, (c, r, net)
        if (c, r) in self.pads and self.pads[(c, r)][0] != net:
            raise ValueError("hole %s used by %s and %s" % ((c, r), self.pads[(c, r)][0], net))
        self.pads[(c, r)] = (net, part)

    def wire(self, net, pts, side="top", kind="sig"):
        self.wires.append((net, side, pts, kind))

    def check(self):
        errs = []
        # vertices of wires
        verts = {}
        for net, side, pts, kind in self.wires:
            for p in (pts[0], pts[-1]):
                verts.setdefault(tuple(p), set()).add(net)
            for p in pts[1:-1]:
                verts.setdefault(tuple(p), set()).add(net)
        for h, nets in verts.items():
            if h in self.pads:
                nets = nets | {self.pads[h][0]}
            if len(nets) > 1:
                errs.append("short at %s: %s" % (h, sorted(nets)))

        def cells(a, b):
            (c0, r0), (c1, r1) = a, b
            assert c0 == c1 or r0 == r1, ("diagonal", a, b)
            n = max(abs(c1 - c0), abs(r1 - r0))
            dc = (c1 > c0) - (c1 < c0)
            dr = (r1 > r0) - (r1 < r0)
            return [(c0 + dc * i, r0 + dr * i) for i in range(n + 1)]
        occ = {"top": {}, "bot": {}}
        for net, side, pts, kind in self.wires:
            for a, b in zip(pts[:-1], pts[1:]):
                cs = cells(tuple(a), tuple(b))
                for i in range(len(cs) - 1):
                    seg = (min(cs[i], cs[i + 1]), max(cs[i], cs[i + 1]))
                    other = occ[side].get(seg)
                    if other and other != net:
                        errs.append("overlap %s vs %s on %s at %s" % (net, other, side, seg))
                    occ[side][seg] = net
                for h in cs[1:-1]:
                    if h in self.pads and self.pads[h][0] != net and side == "bot":
                        errs.append("solder-side %s passes over %s pad at %s" % (net, self.pads[h][0], h))
                    if h in self.pads and self.pads[h][0] != net and side == "top":
                        errs.append("jumper %s passes over %s pad at %s" % (net, self.pads[h][0], h))
        # connectivity per net (union-find over holes)
        parent = {}

        def f(x):
            parent.setdefault(x, x)
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def u(a, b):
            parent[f(a)] = f(b)
        for net, side, pts, kind in self.wires:
            prev = None
            for p in pts:
                if prev is not None:
                    u(("h",) + tuple(prev), ("h",) + tuple(p))
                prev = p
        # T-junctions: a vertex lying inside another segment joins it (same net) or shorts it (other net, same side)
        segs = []
        for net, side, pts, kind in self.wires:
            for a2, b2 in zip(pts[:-1], pts[1:]):
                segs.append((net, side, tuple(a2), tuple(b2)))
        for net, side, pts, kind in self.wires:
            for v in pts:
                v = tuple(v)
                for n2, s2, a2, b2 in segs:
                    inside = (a2[0] == b2[0] == v[0] and min(a2[1], b2[1]) < v[1] < max(a2[1], b2[1])) or \
                             (a2[1] == b2[1] == v[1] and min(a2[0], b2[0]) < v[0] < max(a2[0], b2[0]))
                    if not inside:
                        continue
                    if n2 == net:
                        u(("h",) + v, ("h",) + a2)
                    elif s2 == side:
                        errs.append("%s vertex %s touches %s wire" % (net, v, n2))
        for tie in self.ties:
            hs = [h for h, (n, part) in self.pads.items() if n == tie[0] and part == tie[1]]
            for h in hs[1:]:
                u(("h",) + hs[0], ("h",) + h)
        bynet = {}
        for h, (n, part) in self.pads.items():
            if n.startswith("NC"):
                continue
            bynet.setdefault(n, set()).add(f(("h",) + h))
        for n, roots in bynet.items():
            if len(roots) > 1:
                groups = {}
                for h, (n2, part) in self.pads.items():
                    if n2 == n:
                        groups.setdefault(f(("h",) + h), []).append((h, part))
                errs.append("net %s is split into %d pieces: %s" % (n, len(roots), list(groups.values())))
        return errs


def perfboard_layout():
    b = Board(24, 30)
    L0, R0 = 5, 15
    netL = {"D34": "VSENSE", "D32": "E1", "D33": "E2", "D25": "DQ", "D27": "E3", "D14": "E4", "D13": "EW", "GND": "GND"}
    netR = {"D22": "SCL", "D21": "SDA", "D4": "EREF", "3V3": "3V3", "GND": "GND"}
    for i, n in enumerate(DEVKIT_L):
        b.pad(L0, 1 + i, netL.get(n, "NC_L%d" % i), "esp")
    for i, n in enumerate(DEVKIT_R):
        b.pad(R0, 1 + i, netR.get(n, "NC_R%d" % i), "esp")
    b.ties.append(("GND", "esp"))
    j1 = ["E1", "E2", "DQ", "NC_j4", "E3", "E4", "NC_j7", "EW", "GND", "3V3", "EREF"]
    for i, n in enumerate(j1):
        b.pad(1, 6 + i, n, "J1")
    # electrode jumpers, straight
    for net, r in (("E1", 6), ("E2", 7), ("E3", 10), ("E4", 11), ("EW", 13), ("GND", 14)):
        b.wire(net, [(1, r), (L0, r)], "top", "gnd" if net == "GND" else "probe")
    b.wire("DQ", [(1, 8), (3, 8), (L0, 8)], "top", "sig")
    # DS18B20 pull-up: standing 4k7 in (3,8)-(3,9); (3,9) runs down to the J1 VDD row
    b.pad(3, 9, "3V3", "R4k7")
    b.bodies.append(((3, 8), (3, 9), "R3"))
    b.wire("3V3", [(3, 9), (3, 15), (3, 18), (22, 18)], "top", "pwr")
    b.wire("3V3", [(1, 15), (3, 15)], "top", "pwr")
    # EREF to D4
    b.wire("EREF", [(1, 16), (1, 17), (17, 17), (17, 11), (R0, 11)], "top", "probe")
    # I2C headers J3 (SHT31) col 18 and J4 (INA219) col 20, rows 2..5: 3V3, GND, SCL, SDA
    for col, nm in ((18, "J3"), (20, "J4")):
        for i, n in enumerate(["3V3", "GND", "SCL", "SDA"]):
            b.pad(col, 2 + i, n, nm)
    for i, n in enumerate(["3V3", "GND", "SCL", "SDA"]):
        b.wire(n, [(18, 2 + i), (20, 2 + i)], "top", {"3V3": "pwr", "GND": "gnd"}.get(n, "i2c"))
    b.wire("SCL", [(R0, 2), (16, 2), (16, 4), (18, 4)], "top", "i2c")
    b.wire("SDA", [(R0, 5), (18, 5)], "top", "i2c")
    # 3V3 rail
    b.wire("3V3", [(20, 2), (22, 2), (22, 22)], "top", "pwr")
    b.wire("3V3", [(R0, 15), (22, 15)], "top", "pwr")
    # battery-sense divider, top-left corner
    b.pad(4, 0, "VBAT_SW", "Rtop")
    b.pad(4, 3, "VSENSE", "Rtop")
    b.bodies.append(((4, 0), (4, 3), "R1"))
    b.pad(3, 1, "GND", "Rbot")
    b.pad(3, 4, "VSENSE", "Rbot")
    b.bodies.append(((3, 1), (3, 4), "R2"))
    b.pad(2, 3, "GND", "C100n")
    b.pad(2, 4, "VSENSE", "C100n")
    b.bodies.append(((2, 3), (2, 4), "C1"))
    b.wire("VSENSE", [(2, 4), (3, 4), (4, 4), (L0, 4)], "top", "sig")
    b.wire("VSENSE", [(4, 3), (4, 4)], "top", "sig")
    b.wire("GND", [(3, 1), (0, 1)], "bot", "gnd")
    b.wire("GND", [(2, 3), (0, 3)], "bot", "gnd")
    # GND buses on the solder side
    b.wire("GND", [(0, 0), (0, 29), (23, 29), (23, 0)], "bot", "gnd")
    b.wire("GND", [(1, 14), (0, 14)], "bot", "gnd")
    b.wire("GND", [(20, 3), (23, 3)], "bot", "gnd")
    # power zone
    tp = {"IN+": (2, 23), "IN−": (2, 28), "B+": (9, 23), "OUT+": (9, 24), "OUT−": (9, 27), "B−": (9, 28)}
    tpn = {"IN+": "SOL+", "IN−": "SOL−", "B+": "BAT+", "OUT+": "BATP", "OUT−": "GND", "B−": "BAT−"}
    for k, h in tp.items():
        b.pad(*h, tpn[k], "TP4056")
    b.pad(11, 24, "BATP", "SW1")
    b.pad(12, 24, "VBAT_SW", "SW1")
    b.pad(13, 24, "NC_sw", "SW1")
    b.wire("BATP", [(9, 24), (11, 24)], "top", "bat")
    b.wire("VBAT_SW", [(12, 24), (12, 22), (15, 22), (15, 24)], "top", "bat")
    b.wire("VBAT_SW", [(4, 0), (12, 0), (12, 22)], "bot", "bat")
    b.pad(15, 24, "VBAT_SW", "JP1")
    b.pad(16, 24, "VSYS", "JP1")
    b.pad(18, 24, "VSYS", "LDO")
    b.pad(19, 24, "GND", "LDO")
    b.pad(20, 24, "3V3", "LDO")
    b.wire("VSYS", [(16, 24), (17, 24), (18, 24)], "top", "bat")
    b.pad(17, 25, "VSYS", "C10u")
    b.pad(17, 26, "GND", "C10u")
    b.wire("VSYS", [(17, 24), (17, 25)], "top", "bat")
    b.wire("GND", [(17, 26), (17, 29)], "bot", "gnd")
    b.wire("GND", [(19, 24), (19, 29)], "bot", "gnd")
    b.wire("3V3", [(20, 24), (20, 22), (22, 22)], "top", "pwr")
    b.pad(21, 25, "3V3", "C470u")
    b.pad(21, 26, "GND", "C470u")
    b.wire("3V3", [(20, 24), (20, 25), (21, 25)], "top", "pwr")
    b.wire("GND", [(21, 26), (23, 26)], "bot", "gnd")
    b.wire("GND", [(9, 27), (10, 27), (10, 29)], "bot", "gnd")
    b.parts += [
        ((1, 22), (9, 28), "TP4056 + DW01", "micro-USB faces the left edge", "pbx"),
        ((11, 24), (13, 24), "SW1", None, "pbx"),
        ((15, 24), (16, 24), "JP1", None, "pbx"),
        ((18, 24), (20, 24), "HT7833", None, "pbx"),
    ]
    return b


def perfboard():
    b = perfboard_layout()
    errs = b.check()
    if errs:
        raise SystemExit("perfboard check failed:\n  " + "\n  ".join(errs))
    P = 22.0
    ox, oy = 50, 96
    s = SVG(int(ox + b.cols * P + 420), int(oy + b.rows * P + 70), "Perfboard placement guide for the hero node")
    s.text(24, 34, "Node A1 · perfboard layout (7 × 9 cm, 24 × 30 holes, viewed from the component side)", "h1")
    s.text(24, 56, "Checked by script: no shared holes between nets, no overlapping wires, every net connected.", "ms")
    s.text(24, 74, "Solid = insulated jumper on top. Dashed = bare wire on the solder side. Dots = solder joints.", "ms")

    def H(c, r):
        return (ox + c * P, oy + r * P)
    s.rect(ox - 16, oy - 16, (b.cols - 1) * P + 32, (b.rows - 1) * P + 32, "pcb", 10)
    for c in range(b.cols):
        for r in range(b.rows):
            s.add('<circle cx="%.1f" cy="%.1f" r="2.3" class="hole"/>' % H(c, r))
    # DevKit outline
    x0, y0 = H(5, 1)
    x1, y1 = H(15, 15)
    s.rect(x0 - 14, y0 - 22, x1 - x0 + 28, y1 - y0 + 44, "esp", 6)
    s.text((x0 + x1) / 2, (y0 + y1) / 2 - 10, "ESP32 DevKit", "pl", "middle", fill="#e6ece6")
    s.text((x0 + x1) / 2, (y0 + y1) / 2 + 8, "on 2 × 15 female headers", "sm", "middle", fill="#b9c4bb")
    s.text((x0 + x1) / 2, (y0 + y1) / 2 + 24, "USB end at row 15", "sm", "middle", fill="#b9c4bb")
    for (c0, r0), (c1, r1), lab, sub, cls in b.parts:
        a, z = H(c0, r0), H(c1, r1)
        s.rect(a[0] - 9, a[1] - 9, z[0] - a[0] + 18, z[1] - a[1] + 18, cls, 5)
        small = r0 == r1
        s.text((a[0] + z[0]) / 2, (a[1] - 15) if small else ((a[1] + z[1]) / 2 + 4 - (8 if sub else 0)), lab, "pl", "middle")
        if sub and not small:
            s.text((a[0] + z[0]) / 2, (a[1] + z[1]) / 2 + 14, sub, "sm", "middle")
    for (a, z, lab) in b.bodies:
        pa, pz = H(*a), H(*z)
        if a[0] == z[0]:
            s.rect(pa[0] - 6, pa[1] + 4, 12, pz[1] - pa[1] - 8, "rs", 2)
            s.text(pa[0], pa[1] - 8, lab, "tiny", "middle")
    kind_of = {"top": None}
    for net, side, pts, kind in b.wires:
        s.line([H(*p) for p in pts], kind, 3.2 if side == "top" else 2.2, None if side == "top" else "5 4")
    # pads
    for (c, r), (net, part) in b.pads.items():
        x, y = H(c, r)
        cls = "hdr" if part in ("esp",) else ("hdr2" if part in ("J1", "J3", "J4") else "padc")
        s.add('<rect x="%.1f" y="%.1f" width="11" height="11" rx="2" class="%s"/>' % (x - 5.5, y - 5.5, cls))
    # labels
    for i, n in enumerate(DEVKIT_L):
        x, y = H(5, 1 + i)
        s.text(x + 10, y + 3.5, n, "tiny", fill="#e6ece6")
    for i, n in enumerate(DEVKIT_R):
        x, y = H(15, 1 + i)
        s.text(x - 10, y + 3.5, n, "tiny", "end", fill="#e6ece6")
    j1 = ["E1", "E2", "DQ", "—", "E3", "E4", "—", "EW", "G", "VDD", "REF"]
    for i, n in enumerate(j1):
        x, y = H(1, 6 + i)
        s.text(x - 9, y + 3.5, n, "tiny", "end")
    s.text(H(1, 5)[0], H(1, 5)[1] + 2, "J1", "pl", "middle")
    s.text(H(19, 1)[0], H(19, 1)[1] + 2, "J3 · J4", "pl", "middle")
    for i, n in enumerate(["3V3", "GND", "SCL", "SDA"]):
        x, y = H(21, 2 + i)
        s.text(x + 2, y - 5, n, "tiny")
    s.text(H(18, 6)[0], H(18, 6)[1] + 6, "SHT31", "tiny", "middle")
    s.text(H(20, 6)[0], H(20, 6)[1] + 6, "INA219", "tiny", "middle")
    s.text(H(17, 25)[0] - 8, H(17, 26)[1] + 16, "10µ", "tiny", "end")
    s.text(H(21, 26)[0] + 2, H(21, 26)[1] + 16, "470µ", "tiny", "middle")
    s.text(H(13, 21)[0], H(13, 21)[1] - 4, "VBAT_SW", "tiny", "middle")
    s.text(H(8, 0)[0], H(8, 0)[1] - 6, "VBAT_SW (solder side)", "tiny", "middle")
    s.text(H(10, 17)[0], H(10, 17)[1] - 5, "EREF", "tiny", "middle")
    s.text(H(10, 18)[0], H(10, 18)[1] + 12, "3V3 (DS18B20 VDD)", "tiny", "middle")
    # legend + notes
    lx = ox + b.cols * P + 20
    s.text(lx, 120, "Wire colours", "h2")
    for i, (k, n) in enumerate([("pwr", "3V3"), ("bat", "battery · VBAT_SW · VSYS"), ("gnd", "GND"),
                                 ("probe", "probe electrodes · EREF"), ("i2c", "I²C"), ("sig", "DQ · VSENSE")]):
        y = 150 + i * 26
        s.line([(lx, y), (lx + 40, y)], k, 4)
        s.text(lx + 52, y + 5, n, "pn")
    s.note(lx, 320, ["R1, R2 = 220 kΩ (battery divider) · C1 = 100 nF",
                     "R3 = 4.7 kΩ standing (DS18B20 pull-up)",
                     "10µ / 470µ = electrolytics, + toward the wire",
                     "",
                     "Flying leads, no holes: solar panel → TP4056 IN±,",
                     "18650 holder → TP4056 B±.",
                     "",
                     "Electrode jumpers J1 → ESP32 are short and straight.",
                     "Glue them down: a wire that moves changes the",
                     "capacitance you are trying to measure.",
                     "",
                     "Header rows 10 holes apart (25.4 mm) suit most",
                     "30-pin DevKits; some clones are 9. Measure first.",
                     "",
                     "LDO pin order (IN / GND / OUT) differs between",
                     "HT7833 packages. Follow your part's datasheet.",
                     "",
                     "TP4056 pad order varies between module versions.",
                     "Follow the silkscreen on yours.",
                     "",
                     "Measure sleep current: pull JP1, put the",
                     "multimeter (200 µA range) across its two pins."], 380)
    return s.render()


# ------------------------------------------------------------------ 4. probe section
def probe():
    s = SVG(1100, 860, "Dielectric profile probe: electrode layout and dimensions")
    s.text(24, 34, "Dielectric profile probe · PETG, clamshell print", "h1")
    s.text(24, 56, "Copper tape on the INSIDE wall. The 1.6 mm PETG wall is the insulator: no metal touches soil or water.", "ms")
    cx, top, mm = 260, 124, 1.8       # 1 mm = 1.8 px ; soil line at y0
    y0 = top + 140 * mm
    od, idd = 25 * mm, 21.8 * mm
    # soil & water bands
    s.add('<rect x="80" y="%.1f" width="260" height="%.1f" class="soil"/>' % (y0, 240 * mm))
    s.add('<rect x="80" y="%.1f" width="260" height="%.1f" class="water"/>' % (y0 - 60 * mm, 60 * mm))
    s.text(84, y0 - 60 * mm - 6, "standing water", "sm")
    s.text(84, y0 + 18, "soil 0", "pn", fill="#f4efe6")
    # tube
    x_l, x_r = cx - od / 2, cx + od / 2
    s.add('<path d="M%.1f %.1f L%.1f %.1f L%.1f %.1f L%.1f %.1f Z" class="tube"/>' %
          (x_l, top, x_r, top, x_r, y0 + 210 * mm, x_l, y0 + 210 * mm))
    s.add('<path d="M%.1f %.1f L%.1f %.1f L%.1f %.1f Z" class="tube"/>' %
          (x_l, y0 + 210 * mm, x_r, y0 + 210 * mm, cx, y0 + 230 * mm))
    s.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="cap"/>' % (x_l - 8, top - 30, od + 16, 34))
    s.text(cx, top - 38, "cap: EREF pad + cable gland", "sm", "middle")
    # electrodes
    def band(yc_mm, h_mm, kind, label=None, side_label=None):
        y = y0 + yc_mm * mm - h_mm * mm / 2
        s.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="%s"/>' % (cx - idd / 2, y, idd, h_mm * mm, kind))
        if label:
            s.line([(x_r + 4, y + h_mm * mm / 2), (x_r + 60, y + h_mm * mm / 2)], "probe", 1.4)
            s.text(x_r + 66, y + h_mm * mm / 2 + 4, label, "pn")
    rings = [(25, "E1 · 0–5 cm · C-band SAR depth"), (75, "E2 · 5–10 cm"),
             (125, "E3 · 10–15 cm"), (175, "E4 · 15–20 cm · AWD line")]
    for yc, lab in rings:
        band(yc - 11, 4, "eg")
        band(yc, 10, "es", lab)
        band(yc + 11, 4, "eg")
        # fringing field arcs
        for k in (1, 2):
            r = 6 + k * 5
            s.add('<path d="M%.1f %.1f A %.1f %.1f 0 0 1 %.1f %.1f" class="ff"/>' %
                  (x_r, y0 + (yc - 11) * mm, r * mm * 0.5, r * mm * 0.6, x_r, y0 + yc * mm))
            s.add('<path d="M%.1f %.1f A %.1f %.1f 0 0 0 %.1f %.1f" class="ff"/>' %
                  (x_l, y0 + (yc - 11) * mm, r * mm * 0.5, r * mm * 0.6, x_l, y0 + yc * mm))
    # water strip
    ys, ye = y0 - 100 * mm, y0 + 5 * mm
    s.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="es"/>' % (cx - 5, ys, 6 * mm * 0.9, ye - ys))
    s.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="eg"/>' % (cx + 7, ys, 3 * mm, ye - ys))
    s.line([(x_r + 4, y0 - 50 * mm), (x_r + 60, y0 - 50 * mm)], "probe", 1.4)
    s.text(x_r + 66, y0 - 50 * mm + 4, "EW · water strip, −5 to +100 mm", "pn")
    # DS18B20
    s.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="3" class="ds"/>' % (cx - 5, y0 + 98 * mm, 10, 14 * mm))
    s.line([(x_l - 4, y0 + 105 * mm), (x_l - 50, y0 + 105 * mm)], "sig", 1.4)
    s.text(x_l - 56, y0 + 105 * mm + 4, "DS18B20", "pn", "end", fill="#f4efe6")
    # dimensions
    def dim_v(x, ya, yb, label):
        s.line([(x, ya), (x, yb)], "gnd", 1)
        s.line([(x - 5, ya), (x + 5, ya)], "gnd", 1)
        s.line([(x - 5, yb), (x + 5, yb)], "gnd", 1)
        s.add('<text class="sm" text-anchor="middle" transform="translate(%.1f %.1f) rotate(-90)">%s</text>' % (x - 8, (ya + yb) / 2, label))
    dim_v(56, top, y0, "140 mm above ground")
    dim_v(56, y0, y0 + 230 * mm, "230 mm in the soil")
    s.text(cx, y0 + 248 * mm, "OD 25 · wall 1.6 · tip 20", "sm", "middle")
    # right column: theory + print notes
    nx = 640
    s.text(nx, 110, "How one electrode reads moisture", "h2")
    for i, t in enumerate([
        "Each sense band (10 mm) sits between two GND bands (4 mm).",
        "Its electric field fringes out through the PETG wall into the soil.",
        "Water has a dielectric constant near 80; dry soil about 3–5.",
        "More water → higher capacitance → ESP32 touch count changes.",
        "Topp et al. (1980) turns permittivity ε into water content θ.",
        "Each band reads a thin shell of soil, roughly as far out as",
        "the electrode gap: a few millimetres. Pack soil firmly around it.",
    ]):
        s.text(nx, 140 + i * 20, t, "bd")
    s.text(nx, 300, "Print and build", "h2")
    for i, t in enumerate([
        "Print as two half-shells, flat on the bed, no supports.",
        "Lower section 230 mm, upper 140 mm, joined by a sleeve.",
        "Copper tape on the inner face of ONE half-shell; wires up",
        "the other half. Glue halves with epoxy, seal the tip.",
        "Bands at −25, −75, −125, −175 mm (centres).",
        "Black PETG is fine underground. Paint the part above",
        "ground white so the sun does not heat the water strip.",
        "Bed under 235 mm? Split the lower section in two.",
    ]):
        s.text(nx, 330 + i * 20, t, "bd")
    s.text(nx, 520, "Why it matters for AWD", "h2")
    for i, t in enumerate([
        "The water strip reads standing water above the surface.",
        "Bands E1–E4 keep reading after the water disappears,",
        "so the station sees the −15 cm irrigate point that an",
        "ultrasonic sensor above the field cannot.",
    ]):
        s.text(nx, 550 + i * 20, t, "bd")
    s.note(nx, 650, ["Field nodes B2–D4 carry a mini version: EW strip + one band",
                     "(−75 mm), read with RC timing (1 MΩ) on the ESP8266."], 420)
    return s.render()


# ------------------------------------------------------------------ 5. field node
def field_node():
    s = SVG(1100, 760, "Field node wiring: NodeMCU, mini probe, sensors, battery")
    s.text(24, 34, "Nodes B2 / C3 / D4 · field node (NodeMCU ESP8266)", "h1")
    s.text(24, 56, "Battery-only, deep sleep, ESP-NOW to the gateway. Node D4 also carries the DHT11.", "ms")
    L = ["A0", "RSV", "RSV", "SD3", "SD2", "SD1", "CMD", "SD0", "CLK", "GND", "3V3", "EN", "RST", "GND", "Vin"]
    R = ["D0", "D1", "D2", "D3", "D4", "3V3", "GND", "D5", "D6", "D7", "D8", "RX", "TX", "GND", "3V3"]
    p = s.module(430, 80, 190, 15 * 26 + 40, "NodeMCU v3", "ESP-12E/F · top view", L, R)
    s.net(*p["D0"], "WAKE", "sig")
    s.net(*p["RST"], "WAKE", "sig", "l")
    s.text(700, p["D0"][1] + 4, "D0 ↔ RST: deep-sleep wake. Unplug it to flash.", "sm")
    s.net(*p["D1"], "SENS_PWR", "pwr")
    s.net(*p["D2"], "DHT_DATA", "sig")
    gl = (430, p["CLK"][1] + 26)
    s.net(*gl, "GND", "gnd", "l")
    # probe RC channels
    d5, d6, d7, d8 = p["D5"], p["D6"], p["D7"], p["D8"]
    mp = s.module(900, d6[1] - 48, 170, 160, "Mini probe", "PETG · 2 electrodes", ["EW water", "ES −75 mm", "GND"])
    s.line([d6, mp["EW water"]], "probe")
    s.line([d7, mp["ES −75 mm"]], "probe")
    s.net(*mp["GND"], "GND", "gnd", "l")
    s.res(d5[0], d5[1], 800, d5[1], "1 MΩ", "sig")
    s.line([(800, d5[1]), (800, d6[1])], "sig")
    s.dot(800, d6[1], "probe")
    s.res(d8[0], d8[1], 820, d8[1], "1 MΩ", "sig")
    s.line([(820, d8[1]), (820, d7[1])], "sig")
    s.dot(820, d7[1], "probe")
    s.text(680, d8[1] + 34, "D5 → 1 MΩ → D6 water · D8 → 1 MΩ → D7 soil", "sm")
    s.text(680, d8[1] + 50, "RC charge-time sensing (CapacitiveSensor-style)", "sm")
    # left: comparison sensor + DHT11
    rs = s.module(40, 100, 270, 130, "Two-prong moisture module", "comparison only: it corrodes", right=["VCC", "GND", "AO"])
    s.net(*rs["VCC"], "SENS_PWR", "pwr")
    s.net(*rs["GND"], "GND", "gnd")
    s.line([rs["AO"], (400, rs["AO"][1]), (400, p["A0"][1]), p["A0"]], "sig")
    dh = s.module(40, 270, 270, 130, "DHT11 (node D4 only)", "air temp · RH", right=["VCC", "DATA", "GND"])
    s.net(*dh["VCC"], "SENS_PWR", "pwr")
    s.net(*dh["DATA"], "DHT_DATA", "sig")
    s.net(*dh["GND"], "GND", "gnd")
    s.text(40, 422, "10 kΩ from DHT_DATA to SENS_PWR", "sm")
    # power
    py = 480
    s.text(24, py - 12, "Power path", "h2")
    tp = s.module(40, py, 200, 120, "TP4056 + DW01", "charge from USB 5 V", right=["OUT+", "OUT−"], bottom=["B+", "B−"])
    s.rect(40, py + 170, 200, 40, "bx")
    s.text(52, py + 195, "18650 cell", "mt")
    s.line([tp["B+"], (tp["B+"][0], py + 170)], "bat")
    s.line([tp["B−"], (tp["B−"][0], py + 170)], "gnd")
    ld = s.module(290, py, 120, 110, "HT7833", None, ["IN", "GND"], ["OUT"], pin_off=48)
    s.line([tp["OUT+"], ld["IN"]], "bat")
    s.line([tp["OUT−"], ld["GND"]], "gnd")
    s.gnd(265, tp["OUT−"][1])
    v3 = (430, p["CLK"][1] + 52)
    s.line([ld["OUT"], (418, ld["OUT"][1]), (418, v3[1]), v3], "pwr")
    s.text(24, py + 236, "Feed the 3V3 pin, not Vin: Vin goes through the board's AMS1117, which drops too much from one cell.", "sm")
    s.note(700, py + 80, ["No battery reading on these nodes: A0 is taken by",
                          "the comparison sensor. Node A1 reports battery,",
                          "current and solar for the demo."], 370)
    return s.render()


# ------------------------------------------------------------------ 6. gateway
def gateway():
    s = SVG(1100, 760, "Gateway wiring: ESP32-CAM, SIM800L, bucks, pump")
    s.text(24, 34, "Gateway · ESP32-CAM + SIM800L SMS + 12 V pump", "h1")
    s.text(24, 56, "Runs from your 12 V adapter. The MB USB board links it to the laptop for the data bridge.", "ms")
    adp = s.module(24, 96, 160, 90, "12 V adapter", "≥ 2 A", right=["+12V", "GND"])
    b5 = s.module(270, 96, 170, 100, "LM2596 #1", "set to 5.0 V first", ["IN+", "IN−"], ["OUT+", "OUT−"])
    b4 = s.module(270, 236, 170, 100, "LM2596 #2", "set to 4.0 V first", ["IN+", "IN−"], ["OUT+", "OUT−"])
    xp, xg = 236, 220
    s.line([adp["+12V"], (xp, adp["+12V"][1]), (xp, 518)], "v12")
    s.line([(xp, b5["IN+"][1]), b5["IN+"]], "v12")
    s.line([(xp, b4["IN+"][1]), b4["IN+"]], "v12")
    s.dot(xp, b5["IN+"][1], "v12")
    s.dot(xp, b4["IN+"][1], "v12")
    s.line([adp["GND"], (xg, adp["GND"][1]), (xg, b4["IN−"][1]), b4["IN−"]], "gnd")
    s.line([(xg, b5["IN−"][1]), b5["IN−"]], "gnd")
    s.dot(xg, b5["IN−"][1], "gnd")
    cam = s.module(560, 90, 200, 260, "ESP32-CAM", "on MB USB board", ["5V", "GND", "IO12", "IO13", "IO15", "IO14", "IO2", "IO4"],
                   ["3V3", "IO16", "IO0", "GND", "VCC", "U0R", "U0T", "GND"], pitch=24)
    s.line([b5["OUT+"], (500, b5["OUT+"][1]), (500, cam["5V"][1]), cam["5V"]], "pwr")
    s.net(*b5["OUT−"], "GND", "gnd")
    s.net(560, cam["5V"][1] + 24, "GND", "gnd", "l")
    s.net(*b4["OUT+"], "4V0", "bat")
    s.net(*b4["OUT−"], "GND", "gnd")
    # SIM800L (pins drawn in this order on purpose; match them by label)
    sim = s.module(880, 90, 200, 200, "SIM800L", "2G · antenna fitted", ["VCC", "GND", "RST", "TXD", "RXD"], pitch=28)
    s.net(*sim["VCC"], "4V0", "bat", "l")
    s.net(*sim["GND"], "GND", "gnd", "l")
    s.net(*sim["TXD"], "IO14", "uart", "l")
    r = sim["RXD"]
    s.line([r, (860, r[1]), (860, 390)], "uart")
    s.dot(860, 390, "uart")
    s.res(860, 390, 780, 390, "1 kΩ", "uart")
    s.net(780, 390, "IO15", "uart", "l")
    s.res(860, 390, 860, 460, "2 kΩ", "uart")
    s.gnd(860, 460)
    s.text(880, 312, "1000 µF across VCC and GND,", "sm")
    s.text(880, 328, "right at the module", "sm")
    s.text(600, 446, "IO15 (TX) → 1k/2k → SIM RXD (≈ 2.2 V)", "sm")
    s.net(*cam["IO14"], "IO14", "uart", "l")
    s.net(*cam["IO15"], "IO15", "uart", "l")
    s.text(560, 372, "SIM TXD → IO14 (RX)", "sm")
    # relay + pump
    io13 = cam["IO13"]
    rl = s.module(260, 470, 160, 130, "Relay module", "or logic-level MOSFET", ["COM", "NO"], ["IN", "VCC", "GND"])
    s.line([io13, (480, io13[1]), (480, rl["IN"][1]), rl["IN"]], "sig")
    s.text(522, 480, "IO13 → relay IN", "sm")
    s.net(*rl["VCC"], "5V", "pwr")
    s.net(*rl["GND"], "GND", "gnd")
    s.line([(xp, rl["COM"][1]), rl["COM"]], "v12")
    pm = s.module(260, 640, 160, 90, "12 V pump", "1N4007 across it", ["+", "−"], pin_off=52)
    s.line([rl["NO"], (246, rl["NO"][1]), (246, pm["+"][1]), pm["+"]], "v12")
    s.net(*pm["−"], "GND", "gnd", "l")
    s.text(470, 670, "Diode band (cathode) to the pump's + lead.", "sm")
    s.text(470, 688, "If the relay chatters on 3.3 V logic, drive it", "sm")
    s.text(470, 706, "through an NPN transistor or use an IRLZ44N.", "sm")
    s.note(600, 500, ["SIM800L is 2G only: use an Airtel, Vi or BSNL SIM.",
                      "Jio is 4G-only and will not register.",
                      "It pulls 2 A bursts: never power it from 3.3 V or 5 V.",
                      "Set both buck outputs with a multimeter BEFORE",
                      "connecting anything to them.",
                      "U0R / U0T are taken by the MB USB board."], 470)
    return s.render()


BUILDERS = [("system", system), ("hero", hero), ("perfboard", perfboard), ("probe", probe),
            ("field", field_node), ("gateway", gateway)]

CSS = """
.dgm{font-family:"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif;width:100%;height:auto}
.dgm .h1{font-family:"Bricolage Grotesque","Arial Narrow",system-ui,sans-serif;font-size:22px;font-weight:700;fill:var(--d-ink)}
.dgm .h2{font-family:"Bricolage Grotesque","Arial Narrow",system-ui,sans-serif;font-size:16px;font-weight:700;fill:var(--d-ink)}
.dgm .mt{font-size:14px;font-weight:700;fill:var(--d-ink)}
.dgm .ms{font-size:12px;fill:var(--d-muted)}
.dgm .pn{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11.5px;fill:var(--d-ink)}
.dgm .nl{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;font-weight:600}
.dgm .sm{font-size:11.5px;fill:var(--d-muted)}
.dgm .bd{font-size:13px;fill:var(--d-ink)}
.dgm .lbl{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;font-weight:600;fill:var(--d-ink)}
.dgm .tiny{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;fill:var(--d-ink)}
.dgm .pl{font-size:12px;font-weight:700;fill:var(--d-ink)}
.dgm .bx{fill:var(--d-box);stroke:var(--d-line);stroke-width:1.4}
.dgm .hl{stroke:var(--w-probe);stroke-width:2.2}
.dgm .nt{fill:var(--d-note);stroke:var(--d-line)}
.dgm .rs{fill:var(--d-box);stroke:var(--d-ink);stroke-width:1.4}
.dgm .pin{fill:var(--d-box);stroke:var(--d-ink);stroke-width:1.4}
.dgm .pcb{fill:var(--d-pcb);stroke:var(--d-line)}
.dgm .hole{fill:var(--d-hole)}
.dgm .esp{fill:var(--d-esp);stroke:var(--d-line);opacity:.9}
.dgm .pbx{fill:var(--d-box);stroke:var(--d-ink);stroke-width:1.2;opacity:.92}
.dgm .hdr{fill:#222;stroke:#555}
.dgm .hdr2{fill:var(--w-probe);opacity:.8}
.dgm .soil{fill:var(--d-soil)}
.dgm .water{fill:var(--d-water)}
.dgm .tube{fill:var(--d-tube);stroke:var(--d-ink);stroke-width:1.2}
.dgm .cap{fill:var(--d-ink);opacity:.8}
.dgm .es{fill:#c8742c}
.dgm .eg{fill:#8a5a2b}
.dgm .ds{fill:#333}
.dgm .ff{fill:none;stroke:var(--w-probe);stroke-width:1;stroke-dasharray:2 2;opacity:.8}
"""

TOKENS_LIGHT = """--d-ink:#1b2620;--d-muted:#5b6a5f;--d-box:#fbfcf8;--d-line:#b9c6b5;--d-note:#f3efe2;--d-pcb:#e9dcc2;
--d-hole:#b49a6c;--d-esp:#2a2f33;--d-soil:#8a6a4a;--d-water:#7cc0d6;--d-tube:#dfe3dc;
--w-pwr:#d0342c;--w-bat:#e07a10;--w-gnd:#2a2a2a;--w-sig:#7a4fb0;--w-i2c:#1f6fd0;--w-probe:#1f8a5a;--w-uart:#b0458a;--w-v12:#a5161c;"""
TOKENS_DARK = """--d-ink:#e3ece4;--d-muted:#93a597;--d-box:#18231c;--d-line:#33453a;--d-note:#2a281e;--d-pcb:#3b3324;
--d-hole:#7a6a4c;--d-esp:#0b0e10;--d-soil:#5a4330;--d-water:#2f6f86;--d-tube:#2a332d;
--w-pwr:#ff6b5e;--w-bat:#f2a93b;--w-gnd:#c9d2cc;--w-sig:#b48ae6;--w-i2c:#6fa8ff;--w-probe:#5cd39a;--w-uart:#e07ac0;--w-v12:#ff7a7a;"""


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name, fn in BUILDERS:
        svg = fn()
        with open(os.path.join(out, name + ".svg"), "w") as f:
            # standalone file: embed light tokens + css
            f.write(svg.replace('class="dgm"', 'class="dgm" style="%s"' % TOKENS_LIGHT.replace("\n", ""), 1)
                    .replace("</svg>", "<style>%s</style></svg>" % CSS))
    with open(os.path.join(out, "_pins.txt"), "w") as f:
        for r in HERO_PINS:
            f.write(" | ".join(r) + "\n")
    print("ok")
