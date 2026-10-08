import importlib.util, sys
INK='#3A322B'; P=['#F2A9BE','#F4CF62','#8FCFB4','#B9A2E3','#9DBDEB']
def svg(name, body, w=120, h=120):
    open(f'logo/{name}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')
svg('mark-1-dots', ''.join(f'<circle cx="{24+36*i}" cy="60" r="14" fill="{P[i]}"/>' for i in range(3)))
svg('mark-2-pennant', f'<path d="M30 22 V102" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M33 26 L96 46 L33 66 Z" fill="{P[0]}"/>')
svg('mark-3-rainbow', ''.join(f'<path d="M{20+12*i} 90 A{40-12*i} {40-12*i} 0 0 1 {100-12*i} 90" fill="none" stroke="{P[[0,1,2][i]]}" stroke-width="11" stroke-linecap="round"/>' for i in range(3)))
svg('mark-4-bunting', f'<path d="M8 34 Q60 62 112 34" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>' + ''.join(f'<path d="M{x-13} {y} L{x+13} {y} L{x} {y+30} Z" fill="{P[i]}"/>' for i,(x,y) in enumerate([(32,43),(60,48),(88,43)])))
svg('mark-5-candle', f'<rect x="50" y="48" width="20" height="56" rx="6" fill="{P[3]}"/><path d="M50 62 L70 54 M50 78 L70 70 M50 94 L70 86" stroke="#FFFBF5" stroke-width="4"/><path d="M60 16 C70 28 70 38 60 42 C50 38 50 28 60 16 Z" fill="{P[1]}"/>')
