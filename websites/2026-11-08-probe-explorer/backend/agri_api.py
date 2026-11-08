"""
AGRI-GRID API — Live backend prototype (in-memory store).
Run: uvicorn agri_api:app --host 0.0.0.0 --port 8001
Preserves existing JAL-SURAKSHA files untouched.

Node-to-dashboard chain (for the pour-water video):
  1. Node/gateway POSTs a packet to /agri/ingest
  2. Packet is STORED (in-memory ring buffer) and node latest-values updated
  3. Dashboard Live mode reads /agri/fields + /agri/nodes -> shows the packet

Honesty: store is in-memory (resets on restart), SAR/weather stay SIMULATED.
Film the video against this API, not the demo banner.
"""
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="AGRI-GRID API", version="0.2.0",
              description="Field intelligence — live prototype store. Node readings stored in-memory; SAR/weather SIMULATED.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SEED_FIELDS = [
  {"id":"AGRI-001","crop":"Paddy","area":2.4,"stage":"Vegetative","nodes":4,"awd":"Cycle 3 (Day 12)","state":"watch","health":82,"water":5.2,"moisture":62,"temp":28.4,"updated":"15 Sep 2026, 14:30"},
  {"id":"AGRI-002","crop":"Paddy","area":3.1,"stage":"Tillering","nodes":4,"awd":"Cycle 2 (Day 8)","state":"normal","health":91,"water":7.8,"moisture":71,"temp":27.9,"updated":"15 Sep 2026, 14:20"},
  {"id":"AGRI-003","crop":"Paddy","area":1.8,"stage":"Vegetative","nodes":3,"awd":"Cycle 3 (Day 10)","state":"watch","health":74,"water":3.1,"moisture":48,"temp":29.6,"updated":"15 Sep 2026, 13:55"},
  {"id":"AGRI-004","crop":"Sugarcane","area":4.2,"stage":"Grand growth","nodes":5,"awd":"N/A","state":"normal","health":88,"water":8.4,"moisture":68,"temp":27.2,"updated":"15 Sep 2026, 14:10"},
]

SEED_NODES = [
  {"id":"A1","fieldId":"AGRI-001","zone":"B1","lat":18.5295,"lng":73.8550,"water":6.8,"moisture":68,"temp":28.0,"batt":87,"rssi":-71,"status":"normal"},
  {"id":"B2","fieldId":"AGRI-001","zone":"B2","lat":18.5285,"lng":73.8570,"water":2.4,"moisture":44,"temp":30.1,"batt":76,"rssi":-78,"status":"alert"},
  {"id":"C3","fieldId":"AGRI-001","zone":"B3","lat":18.5275,"lng":73.8545,"water":5.9,"moisture":63,"temp":28.3,"batt":91,"rssi":-69,"status":"normal"},
  {"id":"D4","fieldId":"AGRI-001","zone":"B4","lat":18.5300,"lng":73.8530,"water":5.7,"moisture":61,"temp":28.5,"batt":82,"rssi":-73,"status":"normal"},
]

# ---- in-memory prototype store ----
READINGS: list = []          # every ingested packet, newest last (cap 2000)
LATEST: dict = {}            # (fieldId, nodeId) -> latest packet
ALERTS = [
  {"id":"AL-101","sev":"crit","title":"Low water level detected","field":"AGRI-001","node":"Node B2"},
  {"id":"AL-102","sev":"warn","title":"Unusual drying pattern","field":"AGRI-003","node":"Zone C1"},
]

class Packet(BaseModel):
    fieldId: str
    nodeId: str
    water: float
    moisture: Optional[float] = None
    temp: Optional[float] = None
    batt: Optional[float] = None
    rssi: Optional[float] = None

def _now(): return datetime.now(timezone.utc).isoformat()

def live_nodes():
    out = [dict(n) for n in SEED_NODES]
    for n in out:
        pkt = LATEST.get((n["fieldId"], n["id"]))
        if pkt:
            for k in ("water","moisture","temp","batt","rssi"):
                if pkt.get(k) is not None: n[k] = pkt[k]
            n["status"] = "alert" if n["water"] < 2.5 else ("watch" if n["water"] < 4 else "normal")
            n["updated"] = pkt["ts"]
    return out

def live_fields():
    nodes = live_nodes()
    out = []
    for f in SEED_FIELDS:
        f = dict(f)
        fn = [n for n in nodes if n["fieldId"] == f["id"]]
        if fn:
            f["water"] = round(sum(n["water"] for n in fn)/len(fn), 1)
            worst = "alert" if any(n["status"]=="alert" for n in fn) else ("watch" if any(n["status"]=="watch" for n in fn) else "normal")
            f["state"] = worst
        out.append(f)
    return out

@app.get("/")
def root(): return {"name":"AGRI-GRID API","mode":"live-prototype",
    "note":"In-memory store (resets on restart). SAR/weather SIMULATED.","docs":"/docs"}

@app.get("/agri/fields")
def fields(): return {"cluster":"Pune Pilot Cluster","count":len(live_fields()),
    "fields":live_fields(),"ingestedPackets":len(READINGS),"label":"LIVE-STORE + SEED"}

@app.get("/agri/fields/{fid}")
def field(fid: str):
    f = next((x for x in live_fields() if x["id"]==fid), None)
    return f or {"error":"not found"}

@app.get("/agri/nodes")
def nodes(): return {"nodes":live_nodes(),"count":len(live_nodes()),"ingestedPackets":len(READINGS)}

@app.get("/agri/telemetry")
def telemetry(fieldId: str = "AGRI-001", nodeId: str = "B2"):
    pkts = [p for p in READINGS if p["fieldId"]==fieldId and p["nodeId"]==nodeId]
    return {"fieldId":fieldId,"nodeId":nodeId,"readings":pkts[-96:],"count":len(pkts)}

@app.get("/agri/alerts")
def alerts(): return {"alerts":ALERTS}

@app.get("/agri/evidence")
def evidence(): return {"records":2,"label":"SIMULATED","note":"Ground real-schema; SAR/weather simulated"}

@app.post("/agri/ingest")
def ingest(p: Packet):
    pkt = p.model_dump(); pkt["ts"] = _now()
    READINGS.append(pkt)
    if len(READINGS) > 2000: del READINGS[:len(READINGS)-2000]
    LATEST[(p.fieldId, p.nodeId)] = pkt
    return {"ok":True,"stored":pkt,"totalPackets":len(READINGS),
            "verify":f"GET /agri/nodes and /agri/telemetry?fieldId={p.fieldId}&nodeId={p.nodeId}"}
