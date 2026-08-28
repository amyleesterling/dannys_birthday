# Strip a Meshy export down to just its animation.
#
# Every one of these files ships the same character: the same 4,240 triangle
# mesh and the same 2048 square PNG, about 6 MB of it, for the sake of one
# motion. The clips address bones by name and the rig is identical across
# exports, so the animation drops straight onto the model we already loaded.
#
# This keeps the nodes, the animation and the accessors it reads, and throws
# away the mesh, the skin, the materials and the texture. Result is tens of
# kilobytes per motion instead of six megabytes.
#
#   python scripts/extract_animation.py "<in.glb>" games/dust-off/danny_x.glb
import json
import os
import struct
import sys

JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def read_glb(path):
    d = open(path, 'rb').read()
    magic, _, length = struct.unpack('<III', d[:12])
    assert magic == 0x46546C67, 'not a glb: ' + path
    off, J, B = 12, None, b''
    while off < length:
        clen, ctype = struct.unpack('<II', d[off:off + 8])
        chunk = d[off + 8:off + 8 + clen]
        if ctype == JSON_CHUNK:
            J = json.loads(chunk.decode('utf-8'))
        elif ctype == BIN_CHUNK:
            B = chunk
        off += 8 + clen
    return J, B


def write_glb(path, J, B):
    js = json.dumps(J, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    bn = bytes(B) + b'\x00' * ((4 - len(B) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(bn)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), JSON_CHUNK)); f.write(js)
        f.write(struct.pack('<II', len(bn), BIN_CHUNK)); f.write(bn)
    return total


def extract(src, dst):
    J, B = read_glb(src)
    before = os.path.getsize(src)
    assert J.get('animations'), src + ' has no animation in it'

    # which accessors does the animation actually read
    keep = []
    for anim in J['animations']:
        for smp in anim['samplers']:
            keep.append(smp['input'])
            keep.append(smp['output'])
    keep = sorted(set(keep))
    remap = {old: new for new, old in enumerate(keep)}

    accessors, views, blob = [], [], bytearray()
    for old in keep:
        a = dict(J['accessors'][old])
        v = J['bufferViews'][a['bufferView']]
        start = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        # each accessor gets its own tightly packed view, so nothing tags along
        comp = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[a['componentType']]
        num = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        size = comp * num * a['count']
        pad = (4 - len(blob) % 4) % 4
        blob += b'\x00' * pad
        views.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': size})
        blob += B[start:start + size]
        a['bufferView'] = len(views) - 1
        a.pop('byteOffset', None)
        accessors.append(a)

    for anim in J['animations']:
        for smp in anim['samplers']:
            smp['input'] = remap[smp['input']]
            smp['output'] = remap[smp['output']]

    nodes = []
    for n in J['nodes']:
        n = dict(n)
        n.pop('mesh', None)
        n.pop('skin', None)
        nodes.append(n)

    out = {
        'asset': J['asset'],
        'scene': J.get('scene', 0),
        'scenes': J.get('scenes', [{'nodes': [0]}]),
        'nodes': nodes,
        'animations': J['animations'],
        'accessors': accessors,
        'bufferViews': views,
        'buffers': [{'byteLength': len(blob)}],
    }
    total = write_glb(dst, out, blob)
    names = ', '.join(a.get('name', '?') for a in J['animations'])
    print('%s\n  %s\n  %.2f MB -> %.0f KB' % (os.path.basename(dst), names,
                                              before / 1e6, total / 1e3))
    return total


if __name__ == '__main__':
    extract(sys.argv[1], sys.argv[2])
