import sys, re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

f = TTFont(sys.argv[1] if len(sys.argv) > 1 else 'fonts/Fraunces.ttf')
f = instantiateVariableFont(f, {"wght": 620, "opsz": 72, "SOFT": 100, "WONK": 0})
gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f['hmtx']; upm = f['head'].unitsPerEm
names = set(f.getGlyphOrder())
dotless = {'i': next((n for n in ('idotless','dotlessi') if n in names), None),
           'j': next((n for n in ('jdotless','uni0237','dotlessj') if n in names), None)}
print('dotless', dotless, file=sys.stderr)
INK = '#3A322B'
PASTELS = ['#F2A9BE', '#F4CF62', '#8FCFB4', '#B9A2E3', '#9DBDEB']

def word(text, size, x0, y0, use_dotless=False):
    s = size / upm; x = x0; paths = []; dots = []
    for ch in text:
        g = cmap[ord(ch)]
        if use_dotless and dotless.get(ch):
            # record the dot position from the dotted glyph bounds
            bp = BoundsPen(gs); gs[g].draw(bp); full = bp.bounds
            g2 = dotless[ch]; bp2 = BoundsPen(gs); gs[g2].draw(bp2); body = bp2.bounds
            cx = x + ((body[0] + body[2]) / 2) * s + (0.02 * size if ch == 'j' else 0)
            dot_top = full[3]; dot_bottom = body[3]
            cy = y0 - ((dot_top + dot_bottom) / 2 + 20) * s
            dots.append((cx, cy, (dot_top - dot_bottom) * s * 0.42))
            g = g2
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y0)))
        paths.append(re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.1f}', pen.getCommands()))
        x += hmtx[g][0] * s
    return ' '.join(paths), x - x0, dots

def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="iamjulia">{body}</svg>\n'

# Variant A: wordmark with pastel dots on i / j / i
d, wd, dots = word('iamjulia', 120, 10, 125, use_dotless=True)
body = f'<path fill="{INK}" d="{d}"/>' + ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{PASTELS[i % len(PASTELS)]}"/>' for i, (cx, cy, r) in enumerate(dots))
open('brand/iamjulia-logo-dots.svg', 'w').write(svg(round(wd + 20), 160, body))
open('brand/iamjulia-logo-dots-light.svg', 'w').write(svg(round(wd + 20), 160, body.replace(f'fill="{INK}"', 'fill="#FFFBF5"')))

# Variant B: bunting above the wordmark
d, wd, _ = word('iamjulia', 120, 10, 175)
W = round(wd + 20)
flags = []; n = 7; x1, x2 = 40, W - 40
for i in range(n):
    fx = x1 + (x2 - x1) * i / (n - 1)
    sx, ex = x1 - 22, x2 + 22; t = (fx - sx) / (ex - sx)
    fy = 18 * (1 - t) ** 2 + 2 * t * (1 - t) * 70 + 18 * t ** 2
    flags.append(f'<path d="M{fx-13:.1f} {fy:.1f} L{fx+13:.1f} {fy:.1f} L{fx:.1f} {fy+28:.1f} Z" fill="{PASTELS[i % len(PASTELS)]}"/>')
string = f'<path d="M{x1-22} 18 Q{W/2} 70 {x2+22} 18" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>'
open('brand/iamjulia-logo-bunting.svg', 'w').write(svg(W, 200, string + ''.join(flags) + f'<path fill="{INK}" d="{d}"/>'))

# Icon: "ij" with pastel dots in a cream circle (favicon / social)
d, wd, dots = word('ij', 170, 0, 0, use_dotless=True)
ox = 128 - wd / 2; d, wd, dots = word('ij', 170, ox, 176, use_dotless=True)
body = f'<circle cx="128" cy="128" r="128" fill="#F5EDE2"/><path fill="{INK}" d="{d}"/>' + ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{PASTELS[i]}"/>' for i, (cx, cy, r) in enumerate(dots))
open('brand/iamjulia-icon.svg', 'w').write(svg(256, 256, body))
