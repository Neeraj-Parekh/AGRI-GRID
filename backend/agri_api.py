"""
AGRI-GRID API — Live backend adapter (deterministic demo fallback built-in).
Run: uvicorn agri_api:app --host 0.0.0.0 --port 8001
Preserves existing JAL-SURAKSHA files untouched.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AGRI-GRID API", version="0.1.0", description="Field intelligence — Live mode. Deterministic demo values; SIMULATED SAR/weather.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

FIELDS = [
  {"id":"AGRI-001","crop":"Paddy","area":2.4,"stage":"Vegetative","nodes":4,"awd":"Cycle 3 (Day 12)","state":"watch","health":82,"water":5.2,"moisture":62,"temp":28.4},
  {"id":"AGRI-002","crop":"Paddy","area":3.1,"stage":"Tillering","nodes":4,"awd":"Cycle 2 (Day 8)","state":"normal","health":91,"water":7.8,"moisture":71,"temp":27.9},
  {"id":"AGRI-003","crop":"Paddy","area":1.8,"stage":"Vegetative","nodes":3,"awd":"Cycle 3 (Day 10)","state":"watch","health":74,"water":3.1,"moisture":48,"temp":29.6},
  {"id":"AGRI-004","crop":"Sugarcane","area":4.2,"stage":"Grand growth","nodes":5,"awd":"N/A","state":"normal","health":88,"water":8.4,"moisture":68,"temp":27.2},
]

@app.get("/")
def root(): return {"name":"AGRI-GRID API","mode":"live-prototype","note":"Deterministic demo values; SAR/weather SIMULATED","docs":"/docs"}

@app.get("/agri/fields")
def fields(): return {"cluster":"Pune Pilot Cluster","count":len(FIELDS),"fields":FIELDS,"label":"SIMULATED"}

@app.get("/agri/fields/{fid}")
def field(fid: str):
    f = next((x for x in FIELDS if x["id"]==fid), None)
    return f or {"error":"not found"}

@app.get("/agri/alerts")
def alerts(): return {"alerts":[
  {"id":"AL-101","sev":"crit","title":"Low water level detected","field":"AGRI-001","node":"Node B2"},
  {"id":"AL-102","sev":"warn","title":"Unusual drying pattern","field":"AGRI-003","node":"Zone C1"}]}

@app.get("/agri/evidence")
def evidence(): return {"records":2,"label":"SIMULATED","note":"Ground real-schema; SAR/weather simulated"}

@app.post("/agri/ingest")
def ingest(payload: dict): return {"ok":True,"received":payload,"note":"Prototype ingest; stored in-memory only"}
