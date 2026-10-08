import sys, re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
INK = '#3A322B'; PASTELS = ['#F2A9BE', '#F4CF62', '#8FCFB4', '#B9A2E3', '#9DBDEB']

def load(path, axes=None):
    f = TTFont(path)
    if axes and 'fvar' in f: f = instantiateVariableFont(f, axes)
    return f

def word(f, text, size, x0, y0, dots=True):
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f['hmtx']; upm = f['head'].unitsPerEm
    names = set(f.getGlyphOrder())
    dl = {'i': next((n for n in ('dotlessi', 'idotless', 'uni0131') if n in names), None),
          'j': next((n for n in ('dotlessj', 'jdotless', 'uni0237') if n in names), None)}
    s = size / upm; x = x0; out = []; dd = []
    for ch in text:
        g = cmap[ord(ch)]
        if dots and ch in 'ij' and not dl.get(ch):
            rp = DecomposingRecordingPen(gs); gs[g].draw(rp)
            contours, cur = [], []
            for op, args in rp.value:
                cur.append((op, args))
                if op in ('closePath', 'endPath'): contours.append(cur); cur = []
            def ymin(c): return min(pt[1] for op, a in c for pt in a)
            top = max(contours, key=ymin)
            ys = [pt[1] for op, a in top for pt in a]; xs = [pt[0] for op, a in top for pt in a]
            dd.append((x + (min(xs) + max(xs)) / 2 * s, y0 - (min(ys) + max(ys)) / 2 * s, (max(ys) - min(ys)) / 2 * s * 1.05))
            pen = SVGPathPen(gs); tp = TransformPen(pen, (s, 0, 0, -s, x, y0))
            for c in contours:
                if c is top: continue
                for op, a in c: getattr(tp, op)(*a)
            out.append(re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.1f}', pen.getCommands()))
            x += hmtx[g][0] * s; continue
        if dots and dl.get(ch):
            bp = BoundsPen(gs); gs[g].draw(bp); full = bp.bounds
            bp2 = BoundsPen(gs); gs[dl[ch]].draw(bp2); body = bp2.bounds
            # dot centre: centre of the part of the dotted glyph above the dotless body
            dp = BoundsPen(gs); gs[g].draw(dp)
            cy = y0 - ((full[3] + body[3]) / 2 + 15) * s
            dot_r = (full[3] - body[3]) * s * 0.40
            # x of the dot: use the top extent of the dotted glyph
            cx = x + ((full[0] + full[2]) / 2) * s if ch == 'i' else x + (full[2] - (full[3]-body[3]) * 0.45) * s
            dd.append((cx, cy, dot_r)); g = dl[ch]
        pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y0)))
        out.append(re.sub(r'-?\d+\.\d+', lambda m: f'{float(m.group()):.1f}', pen.getCommands()))
        x += hmtx[g][0] * s
    return ' '.join(out), x - x0, dd

def save(name, f, size=120, base=125, h=160, dots=True):
    d, w, dd = word(f, 'iamjulia', size, 12, base, dots)
    body = f'<path fill="{INK}" d="{d}"/>' + ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{PASTELS[i % 5]}"/>' for i, (cx, cy, r) in enumerate(dd))
    W = round(w + 24)
    open(f'logo/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" width="{W}" height="{h}" role="img" aria-label="iamjulia">{body}</svg>\n')

save('font-quicksand', load('fonts/Quicksand.ttf', {'wght': 600}))
save('font-fredoka', load('fonts/Fredoka.ttf', {'wght': 600, 'wdth': 100}))
save('font-pacifico', load('fonts/Pacifico.ttf'), size=110, base=110, h=170)
