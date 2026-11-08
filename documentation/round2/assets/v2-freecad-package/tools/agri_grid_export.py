"""
AGRI-GRID V2 - companion exporter (runs WITHOUT FreeCAD).

Imports the data layer of AGRI_GRID_V2_Assembly.FCMacro and produces:
  - STEP AP214 assembly (one named, coloured product per part)
  - collision / clearance report (convex SAT, mm)
  - preview renders, mounting-plate DXF + drawing, BOM CSV

Usage:  python3 agri_grid_export.py <macro_path> <out_dir>
Note: STEP solids are faceted (planar B-rep; cylinders = 32-48 sided prisms).
The FreeCAD macro builds true analytic cylinders/cones and drills all holes.
"""
import csv
import math
import os
import sys

import numpy as np


# ----------------------------------------------------------------- load macro
def load_macro(path):
    ns = {"__name__": "agri_macro"}
    with open(path) as f:
        exec(compile(f.read(), path, "exec"), ns)
    return ns


# ----------------------------------------------------------------- geometry
def rotate_pts(pts, rots, rot_point):
    out = []
    for p in pts:
        q = tuple(p)
        for axis, deg, pivot in rots:
            q = rot_point(q, axis, deg, pivot)
        out.append(q)
    return out


def frame(d):
    d = np.array(d, float)
    d /= np.linalg.norm(d)
    a = np.array([1.0, 0, 0]) if abs(d[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(d, a); u /= np.linalg.norm(u)
    v = np.cross(d, u)
    return d, u, v


def nseg(r):
    return 16 if r < 3 else (24 if r < 8 else (32 if r < 20 else 48))


def poly_box(p0, size):
    x0, y0, z0 = p0
    sx, sy, sz = size
    V = [(x0 + i * sx, y0 + j * sy, z0 + k * sz) for i in (0, 1) for j in (0, 1) for k in (0, 1)]
    idx = lambda i, j, k: i * 4 + j * 2 + k
    F = [
        ([idx(0, 0, 0), idx(0, 1, 0), idx(1, 1, 0), idx(1, 0, 0)], (0, 0, -1)),
        ([idx(0, 0, 1), idx(1, 0, 1), idx(1, 1, 1), idx(0, 1, 1)], (0, 0, 1)),
        ([idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1), idx(0, 0, 1)], (0, -1, 0)),
        ([idx(0, 1, 0), idx(0, 1, 1), idx(1, 1, 1), idx(1, 1, 0)], (0, 1, 0)),
        ([idx(0, 0, 0), idx(0, 0, 1), idx(0, 1, 1), idx(0, 1, 0)], (-1, 0, 0)),
        ([idx(1, 0, 0), idx(1, 1, 0), idx(1, 1, 1), idx(1, 0, 1)], (1, 0, 0)),
    ]
    return V, F


def poly_frustum(base, d, r1, r2, h, ri=None):
    """solid frustum (ri None) or annular frustum with inner cylinder radius ri."""
    d, u, v = frame(d)
    b = np.array(base, float)
    n = nseg(max(r1, r2))
    ang = [2 * math.pi * i / n for i in range(n)]
    ring = lambda r, z: [tuple(b + d * z + r * (math.cos(a) * u + math.sin(a) * v)) for a in ang]
    V = ring(r1, 0) + ring(max(r2, 1e-3), h)
    F = []
    for i in range(n):
        j = (i + 1) % n
        a = ang[i] + math.pi / n
        F.append(([i, j, n + j, n + i], tuple(math.cos(a) * u + math.sin(a) * v)))
    if ri is None:
        F.append((list(range(n)), tuple(-d)))
        F.append((list(range(n, 2 * n)), tuple(d)))
        return V, F
    V += ring(ri, 0) + ring(ri, h)
    o = 2 * n
    for i in range(n):
        j = (i + 1) % n
        a = ang[i] + math.pi / n
        inward = tuple(-(math.cos(a) * u + math.sin(a) * v))
        F.append(([o + i, o + j, o + n + j, o + n + i], inward))
        F.append(([i, j, o + j, o + i], tuple(-d)))
        F.append(([n + i, n + j, o + n + j, o + n + i], tuple(d)))
    return V, F


def poly_tray(p0, size, t, open_):
    """open-faced box built in canonical frame (open +Z) then axis-mapped."""
    ax = {"x": 0, "y": 1, "z": 2}[open_[1]]
    sgn = 1 if open_[0] == "+" else -1
    perm = [i for i in range(3) if i != ax] + [ax]       # canonical (a,b,c) -> world axes
    S = [size[perm[0]], size[perm[1]], size[perm[2]]]
    A, B, Cc = S
    V, F = [], []

    def vid(p):
        V.append(p)
        return len(V) - 1
    # canonical points; c=0 closed bottom, c=Cc open top
    o = [vid((x, y, 0)) for (x, y) in ((0, 0), (A, 0), (A, B), (0, B))]
    ot = [vid((x, y, Cc)) for (x, y) in ((0, 0), (A, 0), (A, B), (0, B))]
    i_ = [vid((x, y, t)) for (x, y) in ((t, t), (A - t, t), (A - t, B - t), (t, B - t))]
    it = [vid((x, y, Cc)) for (x, y) in ((t, t), (A - t, t), (A - t, B - t), (t, B - t))]
    F.append(([o[0], o[3], o[2], o[1]], (0, 0, -1)))
    F.append(([i_[0], i_[1], i_[2], i_[3]], (0, 0, 1)))
    outn = [(0, -1, 0), (1, 0, 0), (0, 1, 0), (-1, 0, 0)]
    for k in range(4):
        m = (k + 1) % 4
        F.append(([o[k], o[m], ot[m], ot[k]], outn[k]))
        F.append(([i_[k], it[k], it[m], i_[m]], tuple(-np.array(outn[k]))))
        F.append(([ot[k], ot[m], it[m], it[k]], (0, 0, 1)))
    # map canonical -> world
    W = []
    for p in V:
        q = [0.0, 0.0, 0.0]
        q[perm[0]], q[perm[1]] = p[0], p[1]
        q[perm[2]] = p[2] if sgn > 0 else S[2] - p[2]
        W.append((p0[0] + q[0], p0[1] + q[1], p0[2] + q[2]))
    F2 = []
    for loop, hint in F:
        hq = [0.0, 0.0, 0.0]
        hq[perm[0]], hq[perm[1]] = hint[0], hint[1]
        hq[perm[2]] = hint[2] * sgn
        F2.append((loop, tuple(hq)))
    return W, F2


def tray_walls(p0, size, t, open_):
    """convex boxes making up the tray (for collision)."""
    x0, y0, z0 = p0
    sx, sy, sz = size
    ax = {"x": 0, "y": 1, "z": 2}[open_[1]]
    sgn = open_[0]
    boxes = []
    for a in range(3):
        for side in (0, 1):
            if a == ax and ((sgn == "+" and side == 1) or (sgn == "-" and side == 0)):
                continue
            q0 = [x0, y0, z0]
            sz_ = [sx, sy, sz]
            if side == 1:
                q0[a] += sz_[a] - t
            sz_[a] = t
            boxes.append((tuple(q0), tuple(sz_)))
    return boxes


def fix_orientation(V, F):
    """orient each face loop so its Newell normal agrees with the outward hint."""
    out = []
    Vn = np.array(V)
    for loop, hint in F:
        pts = Vn[loop]
        nrm = np.zeros(3)
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            nrm += np.array([(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])])
        if np.dot(nrm, hint) < 0:
            loop = loop[::-1]
        out.append(loop)
    return out


def spec_solids(s, rot_point, for_collision=False):
    """returns list of (verts, faces) in world coords (rotations applied)."""
    k = s["kind"]
    sols = []
    if k == "box":
        sols.append(poly_box(s["p0"], s["size"]))
    elif k == "cyl":
        sols.append(poly_frustum(s["base"], s["dir"], s["r"], s["r"], s["h"]))
    elif k == "cone":
        sols.append(poly_frustum(s["base"], s["dir"], s["r1"], s["r2"], s["h"]))
    elif k == "tube":
        sols.append(poly_frustum(s["base"], s["dir"], s["ro"], s["ro"], s["h"],
                                 None if for_collision else s["ri"]))
    elif k == "ringcone":
        sols.append(poly_frustum(s["base"], s["dir"], s["ro1"], s["ro2"], s["h"],
                                 None if for_collision else s["ri"]))
    elif k == "tray":
        if for_collision:
            for q0, sz in tray_walls(s["p0"], s["size"], s["t"], s["open"]):
                sols.append(poly_box(q0, sz))
        else:
            sols.append(poly_tray(s["p0"], s["size"], s["t"], s["open"]))
    elif k == "cable":
        pts = s["pts"]
        for a, b in zip(pts[:-1], pts[1:]):
            d = np.array(b, float) - np.array(a, float)
            L = np.linalg.norm(d)
            if L > 1e-6:
                sols.append(poly_frustum(a, d, s["r"], s["r"], L))
    out = []
    for V, F in sols:
        V = rotate_pts(V, s.get("rot", []), rot_point)
        out.append((V, fix_orientation(V, F)))
    return out


def check_closed(V, F):
    e = {}
    for loop in F:
        for i in range(len(loop)):
            a, b = loop[i], loop[(i + 1) % len(loop)]
            e[(a, b)] = e.get((a, b), 0) + 1
    for (a, b), c in e.items():
        if c != 1 or e.get((b, a), 0) != 1:
            return False
    return True


# ----------------------------------------------------------------- STEP writer
class Step:
    def __init__(self):
        self.lines = []
        self.n = 0

    def add(self, txt):
        self.n += 1
        self.lines.append("#%d=%s;" % (self.n, txt))
        return "#%d" % self.n


def f(x):
    """STEP real: always has a decimal point, e.g. 12.5 or 3. (trailing dot is valid)."""
    s = ("%.6f" % float(x)).rstrip("0")
    return "0." if s in ("-0.", "0.") else s


def pt(x):
    return "(%s,%s,%s)" % (f(x[0]), f(x[1]), f(x[2]))


def esc(s):
    return s.replace("'", "''").encode("ascii", "replace").decode()


def write_step(path, parts, rot_point, name="AGRI_GRID_V2"):
    st = Step()
    A = st.add
    mm = A("( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )")
    rad = A("( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )")
    sr = A("( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )")
    unc = A("UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-03),%s,'distance_accuracy_value','confusion accuracy')" % mm)
    ctx = A("( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((%s)) "
            "GLOBAL_UNIT_ASSIGNED_CONTEXT((%s,%s,%s)) REPRESENTATION_CONTEXT('Context3D','3D') )" % (unc, mm, rad, sr))
    appc = A("APPLICATION_CONTEXT('core data for automotive mechanical design processes')")
    A("APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,%s)" % appc)
    pc = A("PRODUCT_CONTEXT('',%s,'mechanical')" % appc)
    pdc = A("PRODUCT_DEFINITION_CONTEXT('part definition',%s,'design')" % appc)

    def origin_axis():
        o = A("CARTESIAN_POINT('',(0.,0.,0.))")
        z = A("DIRECTION('',(0.,0.,1.))")
        x = A("DIRECTION('',(1.,0.,0.))")
        return A("AXIS2_PLACEMENT_3D('',%s,%s,%s)" % (o, z, x))

    def product(pname):
        p = A("PRODUCT('%s','%s','',(%s))" % (esc(pname), esc(pname), pc))
        A("PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,(%s))" % p)
        pdf = A("PRODUCT_DEFINITION_FORMATION('','',%s)" % p)
        pd = A("PRODUCT_DEFINITION('design','',%s,%s)" % (pdf, pdc))
        pds = A("PRODUCT_DEFINITION_SHAPE('','',%s)" % pd)
        return pd, pds

    root_pd, root_pds = product(name)
    root_ax = origin_axis()
    root_rep = A("SHAPE_REPRESENTATION('%s',(%s),%s)" % (name, root_ax, ctx))
    A("SHAPE_DEFINITION_REPRESENTATION(%s,%s)" % (root_pds, root_rep))

    styled = []
    colour_cache = {}

    def colour(rgb):
        key = tuple(round(c, 3) for c in rgb)
        if key not in colour_cache:
            c = A("COLOUR_RGB('',%s,%s,%s)" % tuple(f(v) for v in key))
            fac = A("FILL_AREA_STYLE_COLOUR('',%s)" % c)
            fas = A("FILL_AREA_STYLE('',(%s))" % fac)
            ssfa = A("SURFACE_STYLE_FILL_AREA(%s)" % fas)
            sss = A("SURFACE_SIDE_STYLE('',(%s))" % ssfa)
            ssu = A("SURFACE_STYLE_USAGE(.BOTH.,%s)" % sss)
            colour_cache[key] = A("PRESENTATION_STYLE_ASSIGNMENT((%s))" % ssu)
        return colour_cache[key]

    bad = []
    nsolid = 0
    for idx, s in enumerate(parts):
        sols = spec_solids(s, rot_point)
        items = []
        for V, F in sols:
            if not check_closed(V, F):
                bad.append(s["name"])
                continue
            vp = [A("CARTESIAN_POINT('',%s)" % pt(v)) for v in V]
            vv = [A("VERTEX_POINT('',%s)" % p) for p in vp]
            edges = {}
            faces = []
            Vn = np.array(V)
            for loop in F:
                oes = []
                for i in range(len(loop)):
                    a, b = loop[i], loop[(i + 1) % len(loop)]
                    key = (min(a, b), max(a, b))
                    if key not in edges:
                        d = Vn[key[1]] - Vn[key[0]]
                        L = float(np.linalg.norm(d))
                        dr = A("DIRECTION('',%s)" % pt(d / L))
                        vec = A("VECTOR('',%s,%s)" % (dr, f(L)))
                        ln = A("LINE('',%s,%s)" % (vp[key[0]], vec))
                        edges[key] = A("EDGE_CURVE('',%s,%s,%s,.T.)" % (vv[key[0]], vv[key[1]], ln))
                    sense = ".T." if a == key[0] else ".F."
                    oes.append(A("ORIENTED_EDGE('',*,*,%s,%s)" % (edges[key], sense)))
                el = A("EDGE_LOOP('',(%s))" % ",".join(oes))
                fb = A("FACE_OUTER_BOUND('',%s,.T.)" % el)
                P_ = Vn[loop]
                nrm = np.zeros(3)
                for i in range(len(P_)):
                    a_, b_ = P_[i], P_[(i + 1) % len(P_)]
                    nrm += np.array([(a_[1] - b_[1]) * (a_[2] + b_[2]), (a_[2] - b_[2]) * (a_[0] + b_[0]),
                                     (a_[0] - b_[0]) * (a_[1] + b_[1])])
                nrm /= np.linalg.norm(nrm)
                ref = P_[1] - P_[0]
                ref = ref - np.dot(ref, nrm) * nrm
                ref /= np.linalg.norm(ref)
                op = A("CARTESIAN_POINT('',%s)" % pt(P_[0]))
                ax = A("AXIS2_PLACEMENT_3D('',%s,%s,%s)" % (op, A("DIRECTION('',%s)" % pt(nrm)),
                                                          A("DIRECTION('',%s)" % pt(ref))))
                pl = A("PLANE('',%s)" % ax)
                faces.append(A("ADVANCED_FACE('',(%s),%s,.T.)" % (fb, pl)))
            sh = A("CLOSED_SHELL('',(%s))" % ",".join(faces))
            msb = A("MANIFOLD_SOLID_BREP('%s',%s)" % (esc(s["name"]), sh))
            items.append(msb)
            styled.append(A("STYLED_ITEM('color',(%s),%s)" % (colour(s["color"]), msb)))
            nsolid += 1
        if not items:
            continue
        pd, pds = product(s["name"])
        cax = origin_axis()
        rep = A("ADVANCED_BREP_SHAPE_REPRESENTATION('%s',(%s),%s)" % (esc(s["name"]), ",".join(items + [cax]), ctx))
        A("SHAPE_DEFINITION_REPRESENTATION(%s,%s)" % (pds, rep))
        idt = A("ITEM_DEFINED_TRANSFORMATION('','',%s,%s)" % (cax, root_ax))
        rr = A("( REPRESENTATION_RELATIONSHIP('','',%s,%s) REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION(%s) "
               "SHAPE_REPRESENTATION_RELATIONSHIP() )" % (rep, root_rep, idt))
        nauo = A("NEXT_ASSEMBLY_USAGE_OCCURRENCE('%d','%s','',%s,%s,$)" % (idx + 1, esc(s["name"]), root_pd, pd))
        npds = A("PRODUCT_DEFINITION_SHAPE('','',%s)" % nauo)
        A("CONTEXT_DEPENDENT_SHAPE_REPRESENTATION(%s,%s)" % (rr, npds))
    A("MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION('',(%s),%s)" % (",".join(styled), ctx))

    hdr = ("ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('AGRI-GRID V2 reference assembly'),'2;1');\n"
           "FILE_NAME('%s.step','2026-10-20T00:00:00',('AGRI-GRID V2'),(''),'agri_grid_export.py','','');\n"
           "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n" % name)
    with open(path, "w") as fh:
        fh.write(hdr + "\n".join(st.lines) + "\nENDSEC;\nEND-ISO-10303-21;\n")
    return nsolid, bad


# ----------------------------------------------------------------- collision (SAT)
def sat_overlap(V1, F1, V2, F2):
    """min penetration depth along candidate separating axes (<=0 means separated/touching)."""
    A_, B_ = np.array(V1), np.array(V2)

    def normals(V, F):
        out = []
        for loop in F:
            p = V[loop]
            n = np.cross(p[1] - p[0], p[2] - p[0])
            ln = np.linalg.norm(n)
            if ln > 1e-9:
                out.append(n / ln)
        return out

    def edirs(V, F):
        out = []
        for loop in F:
            for i in range(len(loop)):
                d = V[loop[(i + 1) % len(loop)]] - V[loop[i]]
                ln = np.linalg.norm(d)
                if ln > 1e-9:
                    out.append(d / ln)
        return dedupe(out)

    def dedupe(vs):
        res = []
        for v in vs:
            if not any(abs(abs(np.dot(v, r)) - 1) < 1e-6 for r in res):
                res.append(v)
        return res

    axes = dedupe(normals(A_, F1) + normals(B_, F2))
    e1, e2 = edirs(A_, F1), edirs(B_, F2)
    if e1 and e2:
        cr = np.cross(np.array(e1)[:, None, :], np.array(e2)[None, :, :]).reshape(-1, 3)
        ln = np.linalg.norm(cr, axis=1)
        cr = cr[ln > 1e-6] / ln[ln > 1e-6, None]
        axes_arr = np.vstack([np.array(axes), cr])
    else:
        axes_arr = np.array(axes)
    pa = A_ @ axes_arr.T
    pb = B_ @ axes_arr.T
    ov = np.minimum(pa.max(0), pb.max(0)) - np.maximum(pa.min(0), pb.min(0))
    return float(ov.min())


ALLOWED = [
    # (substring a, substring b) intentional contacts / through-features
    ("Mast_GI", "Clamp"), ("Mast_GI", "Concrete_Footing"), ("Anti_Rotation", "Mast"), ("Anti_Rotation", "Concrete"),
    ("U_Bolt", "Saddle"), ("U_Bolt", "Adapter_Plate"), ("U_Bolt_M8", "U_Bolt"), ("U_Bolt_Nut", "U_Bolt"),
    ("Hinge_Tube", "Hinge_Lug"), ("Shield_Rod", "Radiation_Shield"), ("Tilt_Strut", "Mast_Top_Cap"),
    ("Tilt_Strut", "Panel_Rail"), ("Cable_", "Gland_"), ("Cable_Soil", "Conduit"), ("Cable_Soil", "Concrete"),
    ("uFL_to_SMA", "SMA_Bulkhead"), ("uFL_to_SMA", "E22_uFL"), ("uFL_to_SMA", "Fibox"), ("Cable_Solar", "Panel_Junction"),
    ("Cable_Air", "Air_TRH_Sensor"), ("Cable_Air", "Radiation_Shield"), ("Cable_Water", "SEN0311"),
    ("Cable_Water", "US_Sensor_Bracket"), ("Cable_Soil", "SEN0602"), ("REF_Lid", "Fibox_PC200_150_HG_Cover"),
    ("REF_Lid", "Cover_Screw"), ("REF_Cover", "Cover_Screw"), ("Cable_Soil", "Soil_Probe_Marker"),
    ("Gland_", "Fibox_PC200_150_HG_Base"), ("Vent_", "Fibox_PC200_150_HG_Base"),
    ("Air_TRH_Sensor", "Radiation_Shield_Plate"),   # probe r6 sits in the r22 plate bore (checked analytically)
]


def collisions(parts, rot_point, tol=0.05):
    sol = []
    for s in parts:
        for V, F in spec_solids(s, rot_point, for_collision=True):
            Vn = np.array(V)
            sol.append((s["name"], Vn, F, Vn.min(0), Vn.max(0)))
    hits = []
    for i in range(len(sol)):
        n1, V1, F1, lo1, hi1 = sol[i]
        for j in range(i + 1, len(sol)):
            n2, V2, F2, lo2, hi2 = sol[j]
            if n1 == n2:
                continue
            if np.any(lo1 > hi2 - tol) or np.any(lo2 > hi1 - tol):
                continue
            if any((a in n1 and b in n2) or (a in n2 and b in n1) for a, b in ALLOWED):
                continue
            d = sat_overlap(V1, F1, V2, F2)
            if d > tol:
                hits.append((n1, n2, round(d, 2)))
    uniq = {}
    for a, b, d in hits:
        k = tuple(sorted((a, b)))
        uniq[k] = max(d, uniq.get(k, 0))
    return sorted(((a, b, d) for (a, b), d in uniq.items()), key=lambda x: -x[2])


def min_gap(parts, rot_point, name_a, names_b):
    """smallest separation (mm) between part name_a and any part whose name contains a string in names_b."""
    A = [np.array(V) for s in parts if s["name"] == name_a for V, F in spec_solids(s, rot_point, True)]
    best = (1e9, None)
    for s in parts:
        if s["name"] == name_a or not any(n in s["name"] for n in names_b):
            continue
        for V, F in spec_solids(s, rot_point, True):
            Vb = np.array(V)
            for Va in A:
                # coarse: vertex-to-vertex distance (conservative upper bound for convex parts)
                d = np.min(np.linalg.norm(Va[:, None, :] - Vb[None, :, :], axis=2))
                if d < best[0]:
                    best = (d, s["name"])
    return best


# ----------------------------------------------------------------- render (painter)
def render(parts, rot_point, path, view, title, filt=None, size=(10, 10), dpi=150, lims=None, skip=()):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.collections import PolyCollection
    az, el = view
    a, e = math.radians(az), math.radians(el)
    fwd = np.array([math.cos(e) * math.sin(a), math.cos(e) * math.cos(a), math.sin(e)])  # toward viewer (az 0 = from +Y)
    right = np.cross(np.array([0, 0, 1.0]), fwd); right /= np.linalg.norm(right)
    up = np.cross(fwd, right)
    light = fwd * 0.6 + up * 0.5 + right * 0.3
    light /= np.linalg.norm(light)
    polys, cols, depth = [], [], []
    for s in parts:
        if filt and not filt(s):
            continue
        if any(k in s["name"] for k in skip):
            continue
        alpha = 0.18 if s["status"] == "REFERENCE" and s["kind"] != "cable" else 1.0
        for V, F in spec_solids(s, rot_point):
            Vn = np.array(V)
            for loop in F:
                p = Vn[loop]
                n = np.zeros(3)
                for i in range(len(p)):
                    a_, b_ = p[i], p[(i + 1) % len(p)]
                    n += np.array([(a_[1] - b_[1]) * (a_[2] + b_[2]), (a_[2] - b_[2]) * (a_[0] + b_[0]),
                                   (a_[0] - b_[0]) * (a_[1] + b_[1])])
                ln = np.linalg.norm(n)
                if ln < 1e-9:
                    continue
                n /= ln
                if np.dot(n, fwd) <= 0 and alpha == 1.0:
                    continue
                sh = 0.35 + 0.65 * max(0.0, float(np.dot(n, light)))
                c = np.clip(np.array(s["color"]) * sh, 0, 1)
                polys.append(np.c_[p @ right, p @ up])
                cols.append((*c, alpha))
                depth.append(float((p @ fwd).mean()))
    order = np.argsort(depth)
    fig, ax = plt.subplots(figsize=size, dpi=dpi)
    pc = PolyCollection([polys[i] for i in order], facecolors=[cols[i] for i in order],
                        edgecolors=[(0, 0, 0, 0.25 * cols[i][3]) for i in order], linewidths=0.25)
    ax.add_collection(pc)
    ax.set_aspect("equal")
    if lims:
        ax.set_xlim(lims[0]); ax.set_ylim(lims[1])
    else:
        ax.autoscale_view()
    ax.axis("off")
    ax.set_title(title, fontsize=11, loc="left")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)
    return right, up


# ----------------------------------------------------------------- plate DXF + drawing
def plate_outputs(ns, parts, meta, out_dir):
    P = ns["P"]
    PW, PH = P["PLATE_W"], P["PLATE_H"]
    # Drawing frame = plate seen from the FRONT (cover side). Model px runs along +X world, which is the
    # viewer's RIGHT->LEFT when facing the open box, so mirror X here: X_draw = PW - px.
    holes = [(PW - hx, hz, d, lab) for (hx, hz, d, lab) in meta["plate_holes"]]
    slots = [(PW - sx - sw, sz, sw, sh) for (sx, sz, sw, sh) in meta["strap_slots"]]
    EY, EZ, y1, z0 = meta["EY"], meta["EZ"], meta["plate_y1"], meta["plate_z0"]
    # component outlines on plate (anything whose base sits on the plate face +/-)
    outl = []
    for s in parts:
        if s["group"] != "03_Electronics_Enclosure" or s["kind"] != "box":
            continue
        if s["name"].startswith(("MIV200", "Fibox", "REF", "Battery_Rubber", "Battery_Strap", "ESP32_Female")) \
                or s["bom"].startswith("("):
            continue
        x0, y0_, zz = s["p0"]
        if abs(y0_ - (EY + y1)) < 7.7 and s["size"][1] > 0:
            outl.append((PW / 2 - x0 - s["size"][0], zz - EZ - z0, s["size"][0], s["size"][2], s["name"]))
    # DXF R12
    L = ["0", "SECTION", "2", "ENTITIES"]

    def line(a, b, layer):
        L.extend(["0", "LINE", "8", layer, "10", "%.3f" % a[0], "20", "%.3f" % a[1], "30", "0.0",
                  "11", "%.3f" % b[0], "21", "%.3f" % b[1], "31", "0.0"])

    def rect(x, y, w, h, layer):
        pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
        for i in range(4):
            line(pts[i], pts[(i + 1) % 4], layer)

    def circ(x, y, r, layer):
        L.extend(["0", "CIRCLE", "8", layer, "10", "%.3f" % x, "20", "%.3f" % y, "30", "0.0", "40", "%.3f" % r])

    def text(x, y, h, s_, layer):
        L.extend(["0", "TEXT", "8", layer, "10", "%.3f" % x, "20", "%.3f" % y, "30", "0.0", "40", "%.2f" % h,
                  "1", s_.encode("ascii", "replace").decode()])
    rect(0, 0, PW, PH, "PLATE_OUTLINE")
    for (hx, hz, d, lab) in holes:
        circ(hx, hz, d / 2, "HOLES_%s" % ("D%.1f" % d).replace(".", "_"))
    for (sx, sz, sw, sh) in slots:
        rect(sx, sz, sw, sh, "SLOTS")
    for (x, y, w, h, nm) in outl:
        rect(x, y, w, h, "COMPONENT_OUTLINES_REF")
        text(x + 1, y + 1, 2.0, nm[:28], "COMPONENT_OUTLINES_REF")
    text(0, -8, 3.0, "AGRI-GRID V2 MIV200 drill template - FRONT view (component side), origin bottom-left, mm", "NOTES")
    L.extend(["0", "ENDSEC", "0", "EOF"])
    dxf = os.path.join(out_dir, "AGRI_GRID_V2_MIV200_Plate_Drill.dxf")
    with open(dxf, "w") as fh:
        fh.write("\n".join(L) + "\n")
    # drawing (PNG + PDF)
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.patches import Rectangle, Circle
    fig, ax = plt.subplots(figsize=(8.27, 11.69), dpi=150)
    ax.add_patch(Rectangle((0, 0), PW, PH, fc=(0.93, 0.94, 0.95), ec="k", lw=1.2))
    pal = plt.cm.tab20(np.linspace(0, 1, max(len(outl), 1)))
    for k, (x, y, w, h, nm) in enumerate(outl):
        ax.add_patch(Rectangle((x, y), w, h, fc=(*pal[k][:3], 0.25), ec=pal[k][:3], lw=0.8))
        short = nm.replace("_", " ").replace("PCB", "").strip()
        ax.text(x + w / 2, y + h / 2, short, ha="center", va="center", fontsize=4.6, rotation=90 if h > 2.2 * w else 0)
    for (sx, sz, sw, sh) in slots:
        ax.add_patch(Rectangle((sx, sz), sw, sh, fc="w", ec="k", lw=0.6))
    for (hx, hz, d, lab) in holes:
        ax.add_patch(Circle((hx, hz), d / 2, fc="w", ec="r", lw=0.7))
    ax.annotate("", (0, -6), (PW, -6), arrowprops=dict(arrowstyle="<->", lw=0.6))
    ax.text(PW / 2, -10, "%g" % PW, ha="center", fontsize=7)
    ax.annotate("", (-6, 0), (-6, PH), arrowprops=dict(arrowstyle="<->", lw=0.6))
    ax.text(-10, PH / 2, "%g" % PH, va="center", rotation=90, fontsize=7)
    ax.set_xlim(-25, PW + 80); ax.set_ylim(-60, PH + 15); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title("AGRI-GRID V2 - Fibox MIV 200 plate layout & drill pattern (face view, mm)\n"
                 "FRONT view (component side). Origin = plate bottom-left as you face it. Red = holes. Values from macro LAYOUT. 1:1 at A4 is NOT guaranteed - use DXF.",
                 fontsize=7, loc="left")
    # hole table
    tbl = sorted(set((round(h[0], 2), round(h[1], 2), h[2]) for h in holes))
    txt = "\n".join("X%7.2f  Z%7.2f  D%.1f" % t for t in tbl)
    ax.text(PW + 6, PH, "HOLE TABLE (X, Z, dia)\n" + txt, va="top", fontsize=4.2, family="monospace")
    fig.savefig(os.path.join(out_dir, "AGRI_GRID_V2_MIV200_Plate_Drawing.pdf"))
    fig.savefig(os.path.join(out_dir, "AGRI_GRID_V2_MIV200_Plate_Drawing.png"))
    plt.close(fig)
    return len(holes), len(outl)


# ----------------------------------------------------------------- main
def main(macro, out):
    os.makedirs(out, exist_ok=True)
    ns = load_macro(macro)
    rp = ns["rot_point"]
    parts, meta = ns["build_parts"](ns["P"])

    n, bad = write_step(os.path.join(out, "AGRI_GRID_V2_Assembly.step"), parts, rp)
    print("STEP solids:", n, "non-closed:", bad)
    P2 = dict(ns["P"]); P2["LID_EXPLODE"] = 260.0
    parts_s, _ = ns["build_parts"](P2)
    write_step(os.path.join(out, "AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step"),
               [s for s in parts_s if not s["name"].startswith("REF_Cover")], rp, "AGRI_GRID_V2_Service")

    hits = collisions(parts, rp)
    rows = ns["bom_rows"](parts)
    with open(os.path.join(out, "AGRI_GRID_V2_BOM.csv"), "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["Item", "Qty", "Manufacturer", "Part number", "Status", "Source / verification", "Notes"])
        for r in rows:
            w.writerow([r["bom"], r["qty"], r["mfr"], r["pn"], r["status"], r["src"], r["notes"]])
    nh, no = plate_outputs(ns, parts, meta, out)
    print("plate holes", nh, "outlines", no)

    # renders
    render(parts, rp, os.path.join(out, "preview_exterior_iso.png"), (35, 18),
           "AGRI-GRID V2 - exterior (FOV cone shown translucent)", size=(9, 12),
           skip=("REF_Cover", "REF_Lid"))
    enc = lambda s: s["group"] in ("03_Electronics_Enclosure", "07_Cables_and_Connectors") and \
        "Cable_" not in s["name"] and "Cover" not in s["name"] and not s["name"].startswith("REF")
    EZ, EY = meta["EZ"], meta["EY"]
    render(parts, rp, os.path.join(out, "preview_enclosure_front_cover_off.png"), (0, 0),
           "Enclosure internal layout - cover removed, front elevation", filt=enc, size=(8, 10.5),
           lims=((-100, 100), (EZ - 40, EZ + 290)))
    return parts, meta, hits, rows


if __name__ == "__main__":
    parts, meta, hits, rows = main(sys.argv[1], sys.argv[2])
    print("collisions:", len(hits))
    for h in hits:
        print("  ", h)
