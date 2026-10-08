# iamjulia logo drafts

Wordmark set in Fraunces (SIL OFL; wght 620, opsz 72, SOFT 100) converted to outlines, so the SVGs need no fonts.

| File | Use |
| --- | --- |
| `iamjulia-logo-dots.svg` | Main wordmark: pastel dots over i / j / i |
| `iamjulia-logo-dots-light.svg` | Same, cream letters for dark backgrounds |
| `iamjulia-logo-bunting.svg` | Wordmark with a pastel bunting strand above |
| `iamjulia-icon.svg` | Square "ij" icon (favicon, social avatar) |

Regenerate: `pip install fonttools`, download the Fraunces variable TTF from google/fonts, then
`python3 tools/logo_gen.py <Fraunces.ttf>` from the repo root.

## Round 2 drafts (`drafts/`)

Wordmarks in Quicksand, Fredoka and Pacifico (all SIL OFL) with the same pastel i/j/i dots, plus five
simple marks: three dots, pennant, rainbow, bunting, candle. Generators: `tools/logo_fonts.py`, `tools/logo_marks.py`.
