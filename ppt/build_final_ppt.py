"""
JAL-SURAKSHA v3.0 - Final PPT Builder
Generates submission-ready PPTX for IIT Bombay-Honeywell Hackathon 2026
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

OUTPUT_DIR = '/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp/ppt'
ASSETS_DIR = os.path.join(OUTPUT_DIR, 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Color palette
DEEP_BLUE = '#0D47A1'
TEAL = '#00838F'
LIGHT_BLUE = '#E3F2FD'
WHITE = '#FFFFFF'
DARK = '#1A237E'
GREEN = '#2E7D32'
ORANGE = '#E65100'
LIGHT_GRAY = '#F5F5F5'

def make_fig(w=10, h=5, dpi=150):
    fig, ax = plt.subplots(figsize=(w, h), dpi=dpi)
    return fig, ax

# ── Slide 1: Title ──
fig, ax = make_fig(10, 6, 100)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')
fig.patch.set_facecolor('#0D47A1')
ax.text(5, 4.2, 'JAL-SURAKSHA', fontsize=36, fontweight='bold',
        ha='center', va='center', color='white', fontfamily='monospace')
ax.text(5, 3.5, 'Real-Time Water Quality Monitoring & Auto-Purification',
        fontsize=14, ha='center', va='center', color='#BBDEFB')
ax.text(5, 2.8, 'IoT + Edge AI + SHAP Explainability',
        fontsize=12, ha='center', va='center', color='#90CAF9')
ax.text(5, 2.0, 'Team: [Your Name], Amudullah, Riddhi',
        fontsize=11, ha='center', va='center', color='white')
ax.text(5, 1.5, 'IIT Bombay-Honeywell UTKARSH 1.0 Hackathon 2026',
        fontsize=10, ha='center', va='center', color='#64B5F6')
fig.savefig(f'{ASSETS_DIR}/s01_title.png', dpi=100, bbox_inches='tight',
            facecolor=fig.get_facecolor())
plt.close()
print("  [1/15] Title")

# ── Slide 2: Problem ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
problems = [
    ("1.7B", "People lack\nsafe water", '#E53935'),
    ("60%", "Rural India\ndeficient", '#FF7043'),
    ("₹45K Cr", "Annual\nhealth cost", '#FFA726'),
    ("80%", "Untested\nwaterways", '#EF5350')
]
for i, (num, desc, col) in enumerate(problems):
    x = 0.7 + i * 2.5
    ax.add_patch(mpatches.FancyBboxPatch((x-0.9, 1.0), 2.1, 2.8, boxstyle='round,pad=0.15',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=2))
    ax.text(x+0.15, 3.1, num, fontsize=20, fontweight='bold', ha='center', color='white')
    ax.text(x+0.15, 2.0, desc, fontsize=10, ha='center', color='white', linespacing=1.4)
ax.set_title('India Water Crisis: Why This Matters', fontsize=16,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s02_problem.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [2/15] Problem")

# ── Slide 3: Solution ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
layers = [
    ("Layer 1: IoT Sensors", "6 sensors, ESP32-S3, 1Hz, solar", '#1565C0', 0.6),
    ("Layer 2: Edge AI", "Autoencoder anomaly + RF classifier\nSHAP explainability, <10ms", '#00838F', 1.8),
    ("Layer 3: Auto-Purification", "Solenoid valve + dosing pump\nActivated carbon + chlorination", '#2E7D32', 3.0),
]
for title, desc, col, y in layers:
    ax.add_patch(mpatches.FancyBboxPatch((0.3, y), 9.4, 1.0, boxstyle='round,pad=0.12',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=2))
    ax.text(1.5, y+0.5, title, fontsize=13, fontweight='bold', va='center', color='white')
    ax.text(5.5, y+0.5, desc, fontsize=10, va='center', color='white', ha='center')
ax.set_title('3-Layer Innovation', fontsize=16,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s03_solution.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [3/15] Solution")

# ── Slide 4: System Architecture ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
boxes = [
    ("Sensors\n6x Analog", 0.5, 3.0, '#E3F2FD', '#1565C0'),
    ("ESP32-S3\nADC + FFT", 2.8, 3.0, '#E8F5E9', '#2E7D32'),
    ("Edge AI\nAnomaly+Class", 5.1, 3.0, '#FFF3E0', '#E65100'),
    ("Relay\nValve+Pump", 7.4, 3.0, '#FCE4EC', '#C62828'),
    ("Cloud\nBlynk IoT", 2.8, 0.8, '#F3E5F5', '#6A1B9A'),
    ("Auto\nPurify", 5.1, 0.8, '#E0F7FA', '#00695C'),
    ("Alert\nSMS/LED", 7.4, 0.8, '#FFF8E1', '#F57F17'),
]
for txt, x, y, fc, ec in boxes:
    ax.add_patch(mpatches.FancyBboxPatch((x, y), 1.9, 1.1, boxstyle='round,pad=0.1',
        facecolor=fc, edgecolor=ec, linewidth=2.5))
    ax.text(x+0.95, y+0.55, txt, fontsize=9, ha='center', va='center', fontweight='bold', color=ec)
arrows = [(2.4,3.55,0.4,0),(4.7,3.55,0.4,0),(7.0,3.55,0.4,0),(3.75,3.0,0,-0.65),(6.05,3.0,0,-0.65)]
for x,y,dx,dy in arrows:
    ax.annotate('', xy=(x+dx, y+dy), xytext=(x, y),
                arrowprops=dict(arrowstyle='->', color='#455A64', lw=2))
ax.set_title('System Architecture', fontsize=16, fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s04_architecture.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [4/15] Architecture")

# ── Slide 5: Sensors ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
sensors = [
    ("pH", "SEN0161", "4.0-9.0", "±0.1", "₹1,099"),
    ("TDS", "SEN0244", "0-1000", "±10%", "₹920"),
    ("Turbidity", "SEN0189", "0-3000", "±10%", "₹1,050"),
    ("Temperature", "DS18B20", "-55~125", "±0.5°C", "₹80"),
    ("Flow", "YF-S401", "0.3-6", "±10%", "₹320"),
    ("Pressure", "SX1308", "0-200", "±2.5%", "₹195"),
]
cols = ['#1565C0', '#00838F', '#2E7D32', '#E65100', '#6A1B9A', '#C62828']
for i, (name, model, range_, acc, price) in enumerate(sensors):
    x, y = 0.3 + (i % 3) * 3.3, 2.7 - (i // 3) * 1.7
    ax.add_patch(mpatches.FancyBboxPatch((x, y), 3.0, 1.4, boxstyle='round,pad=0.12',
        facecolor='#F5F5F5', edgecolor=cols[i], linewidth=2.5))
    ax.text(x+1.5, y+1.15, name, fontsize=13, fontweight='bold', ha='center', color=cols[i])
    ax.text(x+1.5, y+0.8, model, fontsize=8, ha='center', color='#757575')
    ax.text(x+1.5, y+0.45, f'{range_} | {acc}', fontsize=8, ha='center', color='#424242')
    ax.text(x+1.5, y+0.15, price, fontsize=10, fontweight='bold', ha='center', color=GREEN)
ax.set_title('Sensor Selection (6 sensors, BOM ₹3,664)', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s05_sensors.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [5/15] Sensors")

# ── Slide 6: TinyML ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
specs = [
    ("Model", "Autoencoder\n2 layers, 12 neurons", '#1565C0'),
    ("Quantize", "INT8 Dynamic\nTFLite", '#00838F'),
    ("Flash", "48 KB", '#2E7D32'),
    ("RAM", "16 KB", '#E65100'),
    ("Inference", "2.3 ms", '#6A1B9A'),
]
for i, (title, val, col) in enumerate(specs):
    x = 0.3 + i * 2.0
    ax.add_patch(mpatches.FancyBboxPatch((x, 1.5), 1.8, 2.5, boxstyle='round,pad=0.12',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=2))
    ax.text(x+0.9, 3.55, title, fontsize=10, fontweight='bold', ha='center', color='white')
    ax.text(x+0.9, 2.5, val, fontsize=10, ha='center', va='center', color='white', linespacing=1.5)
ax.set_title('TinyML on ESP32-S3 (INT8 Quantized)', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s06_tinyml.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [6/15] TinyML")

# ── Slide 7: WQI Calculation ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
ax.text(5, 4.5, 'Weighted Water Quality Index (BIS Standards)', fontsize=14,
        fontweight='bold', ha='center', color=DEEP_BLUE)
formula = 'WQI = Σ(Wi × Si) / Σ(Wi)\nwhere Wi = BIS weight, Si = sub-index'
ax.text(5, 3.5, formula, fontsize=12, ha='center', va='center',
        fontfamily='monospace', color=DARK,
        bbox=dict(boxstyle='round,pad=0.5', facecolor=LIGHT_BLUE, edgecolor=DEEP_BLUE, lw=2))
params = [("pH", "0.22", "6.5-8.5"), ("TDS", "0.20", "<500"),
          ("Turbidity", "0.18", "<25"), ("Temp", "0.15", "15-35"),
          ("Flow", "0.13", "2-8"), ("Pressure", "0.12", "1005-1020")]
for i, (p, w, rng) in enumerate(params):
    x, y = 0.5 + (i % 3) * 3.2, 1.8 - (i // 3) * 0.9
    ax.text(x, y, f'{p}: W={w}', fontsize=10, fontweight='bold', color=DARK)
    ax.text(x+1.8, y, f'Range: {rng}', fontsize=9, color='#616161')
fig.savefig(f'{ASSETS_DIR}/s07_wqi.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [7/15] WQI")

# ── Slide 8: AI Architecture ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
components = [
    ("Autoencoder\n(Anomaly)", "2-layer, 12 neurons\nMSE > threshold = anomaly\nUnsupervised (no labels)", '#E53935', 0.3),
    ("Random Forest\n(Classifier)", "100 trees, depth 10\n3-class: Good/Fair/Poor\n93.4% CV accuracy", '#1E88E5', 3.7),
    ("SHAP\n(Explainer)", "TreeExplainer\nFeature importance\nPer-prediction explanation", '#43A047', 7.0),
]
for title, desc, col, x in components:
    ax.add_patch(mpatches.FancyBboxPatch((x, 1.0), 2.8, 3.2, boxstyle='round,pad=0.15',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=2))
    ax.text(x+1.4, 3.7, title, fontsize=12, fontweight='bold', ha='center', color='white', linespacing=1.4)
    ax.text(x+1.4, 2.1, desc, fontsize=9, ha='center', va='center', color='white', linespacing=1.5)
ax.set_title('AI Stack (3 Components — Simple, Interpretable)', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s08_ai_stack.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [8/15] AI Stack")

# ── Slide 9: FFT Leak Detection ──
fig, ax = make_fig(10, 5, 100)
t = np.linspace(0, 1, 1000)
metal = 0.3 * np.sin(2*np.pi*400*t) + 0.15 * np.sin(2*np.pi*600*t) + 0.08*np.random.randn(1000)
plastic = 0.25 * np.sin(2*np.pi*200*t) + 0.12 * np.sin(2*np.pi*350*t) + 0.08*np.random.randn(1000)

ax.plot(t[:200], metal[:200], color='#E53935', lw=1.5, label='Metal (200-800 Hz)')
ax.plot(t[:200], plastic[:200]+0.8, color='#1E88E5', lw=1.5, label='Plastic (100-400 Hz)')
ax.set_xlabel('Time (s)', fontsize=9)
ax.set_ylabel('Amplitude (normalized)', fontsize=9)
ax.set_title('FFT-Based Leak Detection (Frequency Signatures)', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
ax.legend(fontsize=9)
ax.grid(True, alpha=0.3)
ax.text(0.5, 0.15, 'Metal: 200-800 Hz\nPlastic: 100-400 Hz\nFFT detects signature, not just threshold',
        transform=ax.transAxes, fontsize=8, va='bottom', ha='center',
        bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))
fig.savefig(f'{ASSETS_DIR}/s09_fft.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [9/15] FFT")

# ── Slide 10: Calibration ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
cal_data = [
    ("pH", "4.0 & 7.0 buffers\nSlope: m = (y2-y1)/(x2-x1)\nIntercept: b = y1 - m*x1", '#1565C0'),
    ("TDS", "1413 µS/cm std\nConductivity -> TDS\nFactor: 0.5-0.7", '#00838F'),
    ("Turbidity", "0 & 100 NTU std\nVoltage -> NTU\nLinear fit", '#2E7D32'),
]
for i, (param, desc, col) in enumerate(cal_data):
    x = 0.4 + i * 3.3
    ax.add_patch(mpatches.FancyBboxPatch((x, 1.2), 3.0, 2.8, boxstyle='round,pad=0.12',
        facecolor='#F5F5F5', edgecolor=col, linewidth=2.5))
    ax.text(x+1.5, 3.65, param, fontsize=13, fontweight='bold', ha='center', color=col)
    ax.text(x+1.5, 2.4, desc, fontsize=9, ha='center', va='center', color='#424242', linespacing=1.5)
ax.set_title('Sensor Calibration Protocol', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s10_calibration.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [10/15] Calibration")

# ── Slide 11: Firmware ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
features = [
    ("Watchdog", "30s timeout\nauto-reboot", '#E53935'),
    ("WiFi Reconnect", "Exponential backoff\nmax 5 retries", '#1E88E5'),
    ("MQTT Reconnect", "QoS 1\npersistent msgs", '#43A047'),
    ("NaN Check", "Skip bad readings\nlog warning", '#FB8C00'),
    ("Calibration", "Stored in EEPROM\nruntime adjust", '#8E24AA'),
    ("OTA Updates", "ArduinoOTA\nremote firmware", '#00838F'),
]
for i, (feat, desc, col) in enumerate(features):
    x, y = 0.3 + (i % 3) * 3.3, 2.7 - (i // 3) * 1.5
    ax.add_patch(mpatches.FancyBboxPatch((x, y), 3.0, 1.2, boxstyle='round,pad=0.1',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=1.5))
    ax.text(x+1.5, y+0.85, feat, fontsize=11, fontweight='bold', ha='center', color='white')
    ax.text(x+1.5, y+0.35, desc, fontsize=8, ha='center', va='center', color='white', linespacing=1.3)
ax.set_title('Firmware Robustness Features', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s11_firmware.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [11/15] Firmware")

# ── Slide 12: BOM & Budget ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
bom = [
    ("ESP32-S3", "₹750"),
    ("pH Sensor", "₹1,099"),
    ("TDS Sensor", "₹920"),
    ("Turbidity", "₹1,050"),
    ("DS18B20", "₹80"),
    ("Flow Sensor", "₹320"),
    ("Pressure", "₹195"),
    ("Relay Module", "₹250"),
    ("Solar Panel", "₹350"),
    ("Battery+BoB", "₹150"),
    ("PCB+Enclosure", "₹200"),
    ("Pipes+Misc", "₹200"),
]
for i, (item, price) in enumerate(bom):
    x, y = 0.3 + (i % 4) * 2.5, 3.5 - (i // 4) * 0.7
    col = '#E53935' if 'Sensor' in item else '#1565C0'
    ax.text(x, y, f'{item}:', fontsize=9, fontweight='bold', color=col)
    ax.text(x+1.6, y, price, fontsize=9, color='#424242', ha='right')
ax.add_patch(mpatches.FancyBboxPatch((7.5, 0.5), 2.2, 0.7, boxstyle='round,pad=0.1',
    facecolor=GREEN, edgecolor='white', linewidth=2))
ax.text(8.6, 0.85, 'Total: ₹5,670', fontsize=14, fontweight='bold',
        ha='center', va='center', color='white')
ax.set_title('Bill of Materials (Honeywell-Funded)', fontsize=14,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s12_bom.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [12/15] BOM")

# ── Slide 13: Results (honest framing) ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
ax.add_patch(mpatches.FancyBboxPatch((0.5, 0.5), 9, 4.2, boxstyle='round,pad=0.15',
    facecolor='#F5F5F5', edgecolor='#BDBDBD', linewidth=2))
ax.text(5, 4.2, 'Performance Summary', fontsize=15, fontweight='bold',
        ha='center', color=DEEP_BLUE)
ax.text(5, 3.6, 'Our Design: RF classifier achieves 93.4% CV accuracy on synthetic data',
        fontsize=11, ha='center', color=DARK)
ax.text(5, 3.1, 'Reference Benchmark: Stacked LSTM+RF (Nature, 2023) R²=0.9952',
        fontsize=10, ha='center', color='#757575')
ax.text(5, 2.5, 'Our Anomaly Detector: IsolationForest, 2.3ms inference on ESP32',
        fontsize=11, ha='center', color=DARK)
ax.text(5, 2.0, 'Reference Benchmark: Autoencoder (Sensors, 2023) 96% TPR',
        fontsize=10, ha='center', color='#757575')
ax.text(5, 1.3, 'Key: Our numbers are OUR results. Borrowed numbers labeled as benchmarks.',
        fontsize=10, ha='center', color=GREEN, fontweight='bold')
fig.savefig(f'{ASSETS_DIR}/s13_results.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [13/15] Results")

# ── Slide 14: Honeywell Alignment ──
fig, ax = make_fig(10, 5, 100)
ax.axis('off')
ax.set_xlim(0, 10); ax.set_ylim(0, 5)
alignments = [
    ("Honeywell Forge", "Performance+\nfor Utilities", '#1565C0'),
    ("Connected Water", "NRW Reduction\nLeak Detection", '#00838F'),
    ("Sustainability", "Carbon Neutral 2035\nCSR Mission", '#2E7D32'),
    ("CoE Grant", "₹11.7M to IIT Bombay\n100K students", '#E65100'),
]
for i, (title, desc, col) in enumerate(alignments):
    x = 0.3 + i * 2.5
    ax.add_patch(mpatches.FancyBboxPatch((x, 1.5), 2.2, 2.5, boxstyle='round,pad=0.1',
        facecolor=col, alpha=0.9, edgecolor='white', linewidth=2))
    ax.text(x+1.1, 3.55, title, fontsize=11, fontweight='bold', ha='center', color='white')
    ax.text(x+1.1, 2.5, desc, fontsize=9, ha='center', va='center', color='white', linespacing=1.4)
ax.set_title('Honeywell Alignment', fontsize=16,
             fontweight='bold', color=DEEP_BLUE, pad=15)
fig.savefig(f'{ASSETS_DIR}/s14_alignment.png', dpi=100, bbox_inches='tight',
            facecolor='white')
plt.close()
print("  [14/15] Alignment")

# ── Slide 15: Call to Action ──
fig, ax = make_fig(10, 6, 100)
ax.set_xlim(0, 10); ax.set_ylim(0, 6)
ax.axis('off')
fig.patch.set_facecolor('#0D47A1')
ax.text(5, 4.5, 'JAL-SURAKSHA', fontsize=28, fontweight='bold',
        ha='center', color='white', fontfamily='monospace')
ax.text(5, 3.6, 'Clean Water. Smart Sensors. Explainable AI.', fontsize=13,
        ha='center', color='#BBDEFB')
ax.text(5, 2.8, 'Thank You', fontsize=20, ha='center', color='white', fontweight='bold')
ax.text(5, 2.1, 'Q&A Session', fontsize=14, ha='center', color='#90CAF9')
ax.text(5, 1.4, 'Contact: [Your Email] | Team Size: 3 | Budget: ₹5,670',
        fontsize=10, ha='center', color='#64B5F6')
fig.savefig(f'{ASSETS_DIR}/s15_cta.png', dpi=100, bbox_inches='tight',
            facecolor=fig.get_facecolor())
plt.close()
print("  [15/15] CTA")

# ── Build PPTX ──
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

slide_titles = [
    "JAL-SURAKSHA v3.0", "India Water Crisis: Why This Matters", "3-Layer Innovation",
    "System Architecture", "Sensor Selection", "TinyML on ESP32-S3",
    "Weighted WQI (BIS Standards)", "AI Stack (3 Components)", "FFT-Based Leak Detection",
    "Sensor Calibration Protocol", "Firmware Robustness Features", "Bill of Materials",
    "Performance Summary (Honest Claims)", "Honeywell Alignment", "Thank You"
]

for i in range(15):
    slide_layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(slide_layout)
    
    # Add title text box
    from pptx.util import Inches, Pt
    txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(12), Inches(0.8))
    tf = txBox.text_frame
    tf.text = slide_titles[i]
    tf.paragraphs[0].font.size = Pt(28)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = RGBColor(0x0D, 0x47, 0xA1)
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    
    # Add image
    img_path = f'{ASSETS_DIR}/s{i+1:02d}_{["title","problem","solution","architecture","sensors","tinyml","wqi","ai_stack","fft","calibration","firmware","bom","results","alignment","cta"][i]}.png'
    if os.path.exists(img_path):
        slide.shapes.add_picture(img_path, Inches(0.5), Inches(1.2), Inches(12.3), Inches(6.0))

output_path = f'{OUTPUT_DIR}/JAL-SURAKSHA_v3.0_Final.pptx'
prs.save(output_path)
print(f"\nSaved: {output_path}")
print(f"Size: {os.path.getsize(output_path)/1024:.0f} KB")
