from importlib.machinery import SourceFileLoader
L = SourceFileLoader('l2', 'tools/logo_fonts.py').load_module()
C = SourceFileLoader('cf', 'tools/logo_cornflower.py').load_module()
INK, BLUE = C.INK, C.BLUE
fr = L.load('fonts/Fredoka.ttf', {'wght': 600, 'wdth': 100})
d, w, dots = L.word(fr, 'iamjulia', 120, 30, 160, dots=True)
W = round(w + 60); H = 190

def build(name, flower_idx, other_fill, scale=1.0, lift=12):
    body = f'<path fill="{INK}" d="{d}"/>'
    for i, (cx, cy, r) in enumerate(dots):
        if i in flower_idx:
            body += C.flower(round(cx, 1), round(cy - lift, 1), scale)
        else:
            body += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{other_fill}"/>'
    open(f'logo/{name}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="iamjulia">{body}</svg>\n')

build('fr-cf-a-first-ink', {0}, INK)
build('fr-cf-b-first-blue', {0}, BLUE)
build('fr-cf-c-all', {0, 1, 2}, BLUE, scale=0.8, lift=8)
build('fr-cf-a-first-ink-light', {0}, C.CREAM)
