# Prepare the Meshy walk cycle for the web.
#
# Two jobs. First the size: 5.86MB of the 6.1MB file is a single 2048 square PNG
# for a character that will be drawn about 300px tall on a phone. Second the
# Meshy emissive trap from my notes: emissiveFactor [1,1,1] with an emissive
# texture pointing at the SAME image as the albedo, so every surface
# self-illuminates and the model reads as flat and glowy no matter how it is
# lit. Specular is boosted to 2.0 on top of that.
import json
import struct
import io
import os
from PIL import Image

SRC = ('C:/Users/amyle/dannys_birthday/.work/danny/Meshy_AI_Kindly_Doctor_biped/'
       'Meshy_AI_Kindly_Doctor_biped_Animation_Walking_withSkin.glb')
DST = 'C:/Users/amyle/dannys_birthday/games/dust-off/danny.glb'
TEX = 512
QUALITY = 88


def read_glb(path):
    d = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<III', d[:12])
    assert magic == 0x46546C67, 'not a glb'
    off, J, B = 12, None, b''
    while off < length:
        clen, ctype = struct.unpack('<II', d[off:off + 8])
        chunk = d[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            J = json.loads(chunk.decode('utf-8'))
        elif ctype == 0x004E4942:
            B = chunk
        off += 8 + clen
    return J, B


def write_glb(path, J, B):
    js = json.dumps(J, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    bn = B + b'\x00' * ((4 - len(B) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(bn)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bn), 0x004E4942)); f.write(bn)
    return total


J, B = read_glb(SRC)
before = os.path.getsize(SRC)

# ---- 1. shrink the texture
img_i = 0
img = J['images'][img_i]
bv_i = img['bufferView']
bv = J['bufferViews'][bv_i]
raw = B[bv['byteOffset']:bv['byteOffset'] + bv['byteLength']]
pic = Image.open(io.BytesIO(raw)).convert('RGB')
small = pic.resize((TEX, TEX), Image.LANCZOS)
out = io.BytesIO()
small.save(out, format='JPEG', quality=QUALITY, optimize=True)
new_tex = out.getvalue()
img['mimeType'] = 'image/jpeg'
print('texture %dx%d PNG %.2f MB  ->  %dx%d JPEG %.0f KB'
      % (pic.size[0], pic.size[1], len(raw) / 1e6, TEX, TEX, len(new_tex) / 1e3))

# ---- 2. rebuild the binary chunk with the new image in place
slices = []
for i, v in enumerate(J['bufferViews']):
    if i == bv_i:
        slices.append(new_tex)
    else:
        o = v.get('byteOffset', 0)
        slices.append(B[o:o + v['byteLength']])

newB = bytearray()
for i, v in enumerate(J['bufferViews']):
    pad = (4 - len(newB) % 4) % 4
    newB += b'\x00' * pad
    v['byteOffset'] = len(newB)
    v['byteLength'] = len(slices[i])
    newB += slices[i]
J['buffers'][0]['byteLength'] = len(newB)
J['buffers'][0].pop('uri', None)

# ---- 3. the Meshy material traps
for m in J.get('materials', []):
    if m.pop('emissiveTexture', None) is not None or m.get('emissiveFactor'):
        m['emissiveFactor'] = [0, 0, 0]
        print('killed emissive on', m.get('name'))
    ext = m.get('extensions', {})
    spec = ext.get('KHR_materials_specular')
    if spec and spec.get('specularColorFactor'):
        print('specular', spec['specularColorFactor'], '-> [1,1,1]')
        spec['specularColorFactor'] = [1, 1, 1]
    # Meshy bakes these glossier than they should be
    pbr = m.setdefault('pbrMetallicRoughness', {})
    pbr.setdefault('roughnessFactor', 0.82)
    pbr.setdefault('metallicFactor', 0.0)

total = write_glb(DST, J, bytes(newB))
print('glb %.2f MB -> %.2f MB' % (before / 1e6, total / 1e6))
