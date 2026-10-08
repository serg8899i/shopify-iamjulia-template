import math, re
from importlib.machinery import SourceFileLoader
L = SourceFileLoader('l2', 'tools/logo_fonts.py').load_module()
INK = '#3A322B'; BLUE = '#4E72D9'; BLUE2 = '#7C9BEA'; CENTER = '#3B3A8C'; CREAM = '#FFFBF5'

def petal_path():
    return 'M-1.8 0 L-7.6 -25 L-5.4 -29.5 L-3.4 -25.8 L-1.4 -30.5 L0 -26.6 L1.4 -30.5 L3.4 -25.8 L5.4 -29.5 L7.6 -25 L1.8 0 Z'

def flower(cx, cy, scale=1.0, n=8, color=BLUE, inner=BLUE2, center=CENTER, mono=None, rot=0.0):
    parts = []
    for i in range(n):
        a = 360 / n * i + rot
        c = mono or (color if i % 2 == 0 else inner)
        parts.append(f'<path d="{petal_path()}" fill="{c}" stroke="{CREAM}" stroke-width="1.4" stroke-linejoin="round" transform="translate({cx} {cy}) rotate({a:.1f}) scale({scale}) translate(0 -8)"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{8.5*scale:.1f}" fill="{mono or center}" stroke="{CREAM}" stroke-width="{1.4*scale:.1f}"/>')
    if not mono:
        for i in range(6):
            a = math.radians(60 * i); parts.append(f'<circle cx="{cx+4.2*scale*math.cos(a):.1f}" cy="{cy+4.2*scale*math.sin(a):.1f}" r="{1.3*scale:.1f}" fill="{BLUE2}"/>')
    return ''.join(parts)

def svg(name, w, h, body):
    open(f'logo/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="iamjulia">{body}</svg>\n')

if __name__ == '__main__':
    # 1. flower mark (colour) and one-colour stamp version
    svg('cf-1-flower', 120, 120, flower(60, 60, 1.35))
    svg('cf-2-flower-mono', 120, 120, flower(60, 60, 1.35, mono=INK))

    # 3. flower + wordmark (Quicksand, plain letters)
    q = L.load('fonts/Quicksand.ttf', {'wght': 600})
    d, w, _ = L.word(q, 'iamjulia', 100, 130, 100, dots=False)
    svg('cf-3-flower-quicksand', round(130 + w + 12), 140, flower(62, 70, 1.45) + f'<path fill="{INK}" d="{d}"/>')

    # 4. Fraunces wordmark: the first i dot becomes a small cornflower
    fr = L.load('fonts/Fraunces.ttf', {"wght": 620, "opsz": 72, "SOFT": 100, "WONK": 0})
    d, w, dots = L.word(fr, 'iamjulia', 120, 12, 135, dots=True)
    cx, cy, r = dots[0]
    body = f'<path fill="{INK}" d="{d}"/>' + flower(round(cx, 1), round(cy - 6, 1), 0.62) + ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="{BLUE}"/>' for x, y, rr in dots[1:])
    svg('cf-4-fraunces-i', round(w + 24), 165, body)

    # 5. round sticker for packaging: text on a circle + flower in the middle
    def ring_text(font, text, cx, cy, radius, size, start_deg):
        gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font['hmtx']; upm = font['head'].unitsPerEm; s = size / upm
        total = sum(hmtx[cmap[ord(c)]][0] for c in text) * s
        ang = start_deg - math.degrees(total / radius) / 2
        out = []
        from fontTools.pens.svgPathPen import SVGPathPen
        from fontTools.pens.transformPen import TransformPen
        for ch in text:
            g = cmap[ord(ch)]; adv = hmtx[g][0] * s
            mid = ang + math.degrees(adv / 2 / radius); th = math.radians(mid)
            px, py = cx + radius * math.sin(th), cy - radius * math.cos(th)
            rot = th
            # glyph local: centre horizontally, baseline on circle, rotated tangentially
            c, sn = math.cos(rot), math.sin(rot)
            pen = SVGPathPen(gs)
            t = (s * c, s * sn, s * sn, -s * c, px - (adv / 2) * c, py - (adv / 2) * sn)
            gs[g].draw(TransformPen(pen, t))
            out.append(re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.1f}', pen.getCommands()))
            ang += math.degrees(adv / radius)
        return ' '.join(out)
    txt = ring_text(q, 'IAMJULIA  •  PARTY DECORATIONS  •', 120, 120, 92, 19, 0)
    body = (f'<circle cx="120" cy="120" r="118" fill="{CREAM}"/><circle cx="120" cy="120" r="112" fill="none" stroke="{BLUE}" stroke-width="3"/>'
            f'<path fill="{INK}" d="{txt}"/>' + flower(120, 120, 1.55))
    svg('cf-5-sticker', 240, 240, body)
