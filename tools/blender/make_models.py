"""
Konstruktor uchun detal modellarini Blender'da yasaydi va saytga JSON ko'rinishida eksport qiladi.

Ishga tushirish (Blender oynasini ochmasdan):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" --background --factory-startup --python tools/blender/make_models.py

Natija: frontend/models/<nom>.json — har bir qism: nomi, yig'ish tartibi, rangi, metallik, g'adir-budurlik,
pozitsiya / normal (Float32, base64) va indekslar (Uint16/Uint32, base64).
Koordinatalar three.js tizimida (Y — yuqori). O'lchamlar normallashtirilgan: diametri 1 (sayt detal o'lchamiga moslab cho'zadi).
"""
import bpy, bmesh, math, json, base64, os, struct
from mathutils import Vector, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend', 'models')
os.makedirs(OUT, exist_ok=True)


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, col, metal=0.0, rough=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    m['kons'] = {'col': col, 'metal': metal, 'rough': rough}
    return m


def obj_from_bm(name, bm, material, smooth=True, subdiv=0, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)   # normallar tashqariga (aks holda sirt ichidan ko'rinadi)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(material)
    if bevel > 0:
        md = ob.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'ANGLE'
    if subdiv:
        md = ob.modifiers.new('sub', 'SUBSURF'); md.levels = subdiv; md.render_levels = subdiv
    for p in me.polygons:
        p.use_smooth = smooth
    return ob


# ---------------------------------------------------------------- parrak
def airfoil(chord, thick, n=10):
    """Clark-Y ga o'xshash profil: yuqori qavariq, pastki deyarli tekis. Nuqtalar old qirradan soat bo'yicha."""
    up, lo = [], []
    for i in range(n + 1):
        x = (1 - math.cos(math.pi * i / n)) / 2
        t = 5 * thick * (0.2969 * math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)
        camber = 0.04 * math.sin(math.pi * x)
        up.append(((x - 0.3) * chord, (camber + t) * chord))
        lo.append(((x - 0.3) * chord, (camber - t * 0.55) * chord))
    return up + lo[::-1][1:-1]


def blade(pitch_ratio=0.6):
    """Qanot: o'qdan uchigacha 14 ta kesim; har birida vatar, qalinlik va burilish (qadamdan) hisoblanadi."""
    bm = bmesh.new()
    R, r0, N = 0.5, 0.05, 14
    rings = []
    for k in range(N + 1):
        s = k / N
        r = r0 + (R - r0) * s
        chord = 0.105 * (0.62 + 1.25 * s - 1.55 * s * s) + 0.012          # o'rtada eng keng, uchida toraygan
        thick = 0.13 - 0.06 * s
        twist = math.atan(pitch_ratio / (2 * math.pi * r / (2 * R)))       # qadam burchagi: tg = P / (2πr)
        pts = airfoil(chord, thick)
        ring = []
        for (x, y) in pts:
            v = Vector((x, y * 0.6, 0))
            v = Matrix.Rotation(-twist, 3, 'Z') @ v                          # profilni qadam burchagiga burish
            sweep = 0.03 * s * s                                             # uchiga qarab ozgina orqaga egilish
            ring.append(bm.verts.new((v.x - sweep, r, v.y)))
        rings.append(ring)
    m = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(m):
            bm.faces.new((a[i], a[(i + 1) % m], b[(i + 1) % m], b[i]))
    bm.faces.new(rings[-1][::-1])                                            # uchi yopiq
    return bm


def make_prop(blades):
    clear()
    plastic = mat('plastik', (0.95, 0.43, 0.05), 0.0, 0.35)
    hubm = mat('vtulka', (0.12, 0.12, 0.13), 0.0, 0.45)
    obs = []
    for i in range(blades):
        ob = obj_from_bm('Qanot', blade(), plastic, subdiv=1)
        ob.rotation_euler = (0, 0, 2 * math.pi * i / blades)
        obs.append(ob)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.046, depth=0.085, location=(0, 0, 0.005))
    hub = bpy.context.active_object; hub.name = 'Vtulka'; hub.data.materials.append(plastic)
    md = hub.modifiers.new('bev', 'BEVEL'); md.width = 0.009; md.segments = 3
    for p in hub.data.polygons: p.use_smooth = True
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.02, depth=0.1, location=(0, 0, 0.01))
    hole = bpy.context.active_object; hole.name = 'Val teshigi'; hole.data.materials.append(hubm)
    export(f'prop{blades}', [(o, 'Qanot', 1) for o in obs] + [(hub, 'Vtulka', 2), (hole, 'Val teshigi', 3)])


# ---------------------------------------------------------------- g'ildirak
def make_wheel():
    clear()
    rubber = mat('rezina', (0.05, 0.05, 0.055), 0.0, 0.85)
    rimm = mat('disk', (0.82, 0.84, 0.87), 0.6, 0.3)
    hubm = mat('vtulka', (0.2, 0.21, 0.23), 0.5, 0.35)
    R, W = 0.5, 0.42
    # shina karkasi: dumaloq qirrali profilni o'q atrofida aylantirish (spin)
    bm = bmesh.new()
    prof = []
    ri, ro = 0.33, 0.47
    for i in range(11):
        a = math.pi * i / 10
        prof.append((ri + (ro - ri) * 0.5 + (ro - ri) * 0.5 * math.sin(a) * 1.0, (W / 2) * math.cos(a)))
    vs = [bm.verts.new((r, 0, z)) for (r, z) in prof]
    for a, b in zip(vs, vs[1:]):
        bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=48, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    tire = obj_from_bm('Shina', bm, rubber)
    # protektor: shina sirtida 36 ta chevron (V) shaklidagi bo'rtiq
    blocks = []
    for k in range(30):
        for side in (-1, 1):
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1)
            for v in bm.verts:
                v.co.x *= 0.035; v.co.y *= 0.05; v.co.z *= 0.14
            bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(side * 0.45, 3, 'X'))
            bmesh.ops.translate(bm, verts=bm.verts, vec=(R - 0.004, 0, side * 0.085))
            bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(2 * math.pi * (k + (0.5 if side > 0 else 0)) / 30, 3, 'Z'))
            blocks.append(obj_from_bm('Protektor', bm, rubber, smooth=False))
    # disk: tashqi gardish, 5 ta kegay, markaziy vtulka
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.335, depth=W * 0.86)
    rim = bpy.context.active_object; rim.name = 'Disk gardishi'; rim.data.materials.append(rimm)
    md = rim.modifiers.new('bev', 'BEVEL'); md.width = 0.012; md.segments = 3
    for p in rim.data.polygons: p.use_smooth = True
    spokes = []
    for k in range(5):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
        for v in bm.verts:
            v.co.x *= 0.27; v.co.y *= 0.055 * (1.4 - 0.5 * (v.co.x + 0.5)); v.co.z *= 0.05
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0.17, 0, W * 0.18))
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(2 * math.pi * k / 5, 3, 'Z'))
        spokes.append(obj_from_bm('Kegaylar', bm, rimm, bevel=0.01))
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.075, depth=W * 0.6, location=(0, 0, 0))
    hub = bpy.context.active_object; hub.name = 'Vtulka'; hub.data.materials.append(hubm)
    md = hub.modifiers.new('bev', 'BEVEL'); md.width = 0.01; md.segments = 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.03, depth=W * 0.62, location=(0, 0, 0))
    hexo = bpy.context.active_object; hexo.name = 'Olti qirrali teshik'; hexo.data.materials.append(mat('qora', (0.02, 0.02, 0.02), 0, 0.9))
    parts = [(tire, 'Shina', 1)] + [(b, 'Protektor', 1) for b in blocks] + [(rim, 'Disk gardishi', 2)] + [(s, 'Kegaylar', 2) for s in spokes] + [(hub, 'Vtulka', 3), (hexo, 'Olti qirrali teshik', 3)]
    export('wheel', parts, axis='x')


# ---------------------------------------------------------------- eksport
Q = 0.6 / 32767   # pozitsiya kvantlash qadami (±0,6 oralig'i, 16 bit)


def export(name, parts, axis='y'):
    """Bir xil nom va materialdagi qismlarni bitta to'plamga yig'adi va JSON ga yozadi.
    axis: modelning aylanish o'qi three.js da qaysi o'qqa tushishi (parrak — y, g'ildirak — x)."""
    dg = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for ob, label, order in parts:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        me.calc_loop_triangles()
        mw = ob.matrix_world
        nm = mw.to_3x3().inverted().transposed()
        mt = me.materials[0] if me.materials else None
        k = mt.get('kons') if mt else None
        info = dict(k) if k else {'col': [0.6, 0.6, 0.6], 'metal': 0, 'rough': .5}
        key = (label, mt.name if mt else '-')
        g = groups.setdefault(key, {'mat': mt.name if mt else '', 'name': label, 'ord': order, 'col': list(info['col']), 'metal': info['metal'], 'rough': info['rough'], 'p': [], 'n': [], 'i': [], 'map': {}})
        cn = me.corner_normals
        for tri in me.loop_triangles:
            for li in tri.loops:
                vi = me.loops[li].vertex_index
                co = mw @ me.vertices[vi].co
                no = (nm @ cn[li].vector).normalized()
                kk = (vi, id(ob), round(no.x, 3), round(no.y, 3), round(no.z, 3))
                idx = g['map'].get(kk)
                if idx is None:
                    # Blender (Z yuqori) → three.js (Y yuqori)
                    if axis == 'y':
                        P, N = (co.x, co.z, -co.y), (no.x, no.z, -no.y)
                    else:                                    # g'ildirak: aylanish o'qi Blender Z → three.js X
                        P, N = (co.z, co.x, co.y), (no.z, no.x, no.y)
                    idx = len(g['p']) // 3
                    g['map'][kk] = idx
                    g['p'] += P; g['n'] += N
                g['i'].append(idx)
        ev.to_mesh_clear()
    out = []
    tris = 0
    for g in groups.values():
        nv = len(g['p']) // 3
        big = nv > 65535
        tris += len(g['i']) // 3
        out.append({'name': g['name'], 'mat': g['mat'], 'ord': g['ord'], 'col': [round(c, 4) for c in g['col']], 'metal': g['metal'], 'rough': g['rough'],
                    'pos': base64.b64encode(struct.pack(f'<{len(g["p"])}h', *[max(-32767, min(32767, round(v / Q))) for v in g['p']])).decode(), 'q': Q,
                    'nrm': base64.b64encode(struct.pack(f'<{len(g["n"])}b', *[max(-127, min(127, round(v * 127))) for v in g['n']])).decode(),
                    'idx': base64.b64encode(struct.pack(f'<{len(g["i"])}{"I" if big else "H"}', *g['i'])).decode(), 'i32': big})
    path = os.path.join(OUT, name + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({'v': 1, 'name': name, 'source': 'Blender ' + bpy.app.version_string, 'parts': out}, f, separators=(',', ':'))
    print(f'[kons] {name}: {tris} uchburchak, {os.path.getsize(path) // 1024} KB')


# ---------------------------------------------------------------- cho'tkasiz motor (FPV, 2207 tipidagi)
def cyl(name, r, d, z, mt, verts=48, bev=0.0, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=(0, 0, z))
    o = bpy.context.active_object; o.name = name; o.data.materials.append(mt)
    if bev:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 2; md.limit_method = 'ANGLE'
    for p in o.data.polygons: p.use_smooth = smooth
    return o


def box_obj(name, sx, sy, sz, loc, rot_z, mt, bev=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    bmesh.ops.translate(bm, verts=bm.verts, vec=loc)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rot_z, 3, 'Z'))
    return obj_from_bm(name, bm, mt, smooth=False, bevel=bev)


def make_motor():
    clear()
    bellm = mat('qongiroq', (0.75, 0.05, 0.04), 0.4, 0.3)
    alu = mat('alyuminiy', (0.16, 0.17, 0.19), 0.85, 0.35)
    copper = mat('mis', (0.85, 0.42, 0.18), 1.0, 0.3)
    core = mat('ozak', (0.08, 0.08, 0.09), 0.6, 0.5)
    steel = mat('polat', (0.8, 0.82, 0.85), 1.0, 0.18)
    wire = mat('sim', (0.03, 0.03, 0.03), 0.0, 0.6)
    magnet = mat('magnit', (0.1, 0.1, 0.11), 0.5, 0.4)
    P = []
    # taglik: alyuminiy disk, pastida 4 ta montaj teshigi (M2/M3)
    P.append((cyl('Taglik', 0.47, 0.1, 0.05, alu, bev=0.015), 'Taglik (montaj)', 1))
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.035, depth=0.012, location=(math.cos(a) * 0.28, math.sin(a) * 0.28, -0.001))
        h = bpy.context.active_object; h.name = 'Teshik'; h.data.materials.append(core); P.append((h, 'Taglik (montaj)', 1))
    # stator: qora o'zak va 12 ta mis o'ram (tish) — qo'ng'iroq tirqishlaridan va pastdan ko'rinadi
    P.append((cyl('Stator', 0.25, 0.74, 0.47, core, 36), "Stator (mis o'ramlar)", 2))
    for k in range(12):
        a = 2 * math.pi * k / 12
        P.append((box_obj('Oram', 0.13, 0.07, 0.72, (0.32, 0, 0.47), a, copper, bev=0.018), "Stator (mis o'ramlar)", 2))
    # qo'ng'iroq (rotor): yon devor, ichki magnit halqasi, tepasida 6 ta shamollatish tirqishi orasidagi kegaylar
    bm = bmesh.new()
    prof = [(0.43, 0.2), (0.5, 0.2), (0.505, 0.24), (0.505, 0.9), (0.49, 0.95), (0.45, 0.96), (0.45, 0.9), (0.43, 0.9)]
    vs = [bm.verts.new((r, 0, z)) for (r, z) in prof]
    for a, b in zip(vs, vs[1:] + vs[:1]): bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=64, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    P.append((obj_from_bm('Qongiroq', bm, bellm), "Qo'ng'iroq (rotor)", 3))
    P.append((cyl('Magnit', 0.425, 0.66, 0.55, magnet, 48), "Qo'ng'iroq (rotor)", 3))
    for k in range(6):
        a = 2 * math.pi * k / 6
        P.append((box_obj('Kegay', 0.3, 0.07, 0.05, (0.31, 0, 0.94), a, bellm, bev=0.015), "Qo'ng'iroq (rotor)", 3))
    P.append((cyl('Markaz', 0.17, 0.07, 0.95, bellm, 40, bev=0.02), "Qo'ng'iroq (rotor)", 3))
    # yon tomondagi chiziqlar (dekor) va val
    for z in (0.34, 0.8):
        P.append((cyl('Chiziq', 0.508, 0.012, z, core, 64), "Qo'ng'iroq (rotor)", 3))
    P.append((cyl('Val', 0.04, 0.12, 1.0, steel, 20), 'Val (5 mm)', 4))
    # 3 faza simi: tagligi yonidan chiqadi
    for i, dy in enumerate((-0.07, 0, 0.07)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.028, depth=0.45, location=(-0.62, dy, 0.07), rotation=(0, math.pi / 2, 0))
        w = bpy.context.active_object; w.name = 'Sim'; w.data.materials.append(wire)
        for p in w.data.polygons: p.use_smooth = True
        P.append((w, 'Faza simlari (3 ta)', 5))
    export('motor', P)


make_prop(2)
make_prop(3)
make_wheel()
make_motor()
print('[kons] tayyor')
