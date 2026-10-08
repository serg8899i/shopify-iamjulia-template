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

## Round 3: cornflower (`drafts/cf-*`)

The owner wants a cornflower (василёк) motif for packaging and branding. Drafts: flower mark (colour and
one-colour stamp), flower + Quicksand wordmark, Fraunces wordmark with a cornflower i-dot, round packaging sticker.
Generator: `tools/logo_cornflower.py`.

## Round 4: Fredoka + cornflower i-dot (`drafts/fr-cf-*`)

Owner picked the Fredoka wordmark with the cornflower as the dot of the i. Variants: A cornflower on the first i,
other dots ink; B other dots blue; C cornflowers on i, j, i; plus a cream version of A for dark backgrounds.
Generator: `tools/logo_fredoka_cornflower.py`.

## Round 5: chosen direction B, refined (`drafts/fr-b2-*`)

Cornflower sits right on top of the i stem (the stem reads as its stalk), rotated 22.5 degrees so no petal points
straight down and the stem passes between the two lower petals; j and second i dots are cornflower blue.
`close` = centre 22px above the stem, `closer` = 15px. Generator: `tools/logo_fredoka_b.py`.

## Final logo (chosen 2026-10-08)

Fredoka wordmark, cornflower on the first i (rotated 22.5 deg, sitting on the stem), blue dots on j and i.
`iamjulia-logo.svg|png`, `iamjulia-logo-light.svg|png` (cream letters, used as logo_inverse),
`iamjulia-flower.svg`, `iamjulia-favicon.png`. PNGs are uploaded to Shopify Files (`tools/upload-files.mjs`) and set in
`config/settings_data.json` as logo / logo_inverse / favicon.
