from importlib.machinery import SourceFileLoader
from fontTools.pens.boundsPen import BoundsPen
L = SourceFileLoader('l2', 'tools/logo_fonts.py').load_module()
C = SourceFileLoader('cf', 'tools/logo_cornflower.py').load_module()
INK, BLUE = C.INK, C.BLUE
fr = L.load(__import__('sys').argv[1] if len(__import__('sys').argv) > 1 else 'fonts/Fredoka.ttf', {'wght': 600, 'wdth': 100})
size, x0, y0 = 120, 30, 175
d, w, dots = L.word(fr, 'iamjulia', size, x0, y0, dots=True)
gs = fr.getGlyphSet(); s = size / fr['head'].unitsPerEm
bp = BoundsPen(gs); gs['dotlessi'].draw(bp); xmin, ymin, xmax, ymax = bp.bounds
stem_cx = x0 + (xmin + xmax) / 2 * s
stem_top = y0 - ymax * s
W = round(w + 60); H = 200

def build(name, scale, gap, rot, other=BLUE, ink=INK):
    # centre of the flower sits `gap` px above the top of the i stem, so the stem reads as the flower's stalk
    body = f'<path fill="{ink}" d="{d}"/>' + C.flower(round(stem_cx, 1), round(stem_top - gap, 1), scale, rot=rot)
    body += ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{other}"/>' for cx, cy, r in dots[1:])
    open(f'brand/drafts/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="iamjulia">{body}</svg>\n')

build('fr-b2-close-rot', 1.0, 22, 22.5)
build('fr-b2-closer-rot', 1.0, 15, 22.5)
build('fr-b2-close-rot-light', 1.0, 22, 22.5, other=BLUE, ink=C.CREAM)
