# Design review and theme treatments

Outcome, 2026-09-26: Allen chose blue. Its rules are now in `prototypes/e-directory/style.css`. Graphite and the theme files are gone. The masthead imprint was dropped; the subtitle says "independent" instead.

Written 2026-09-26 for audit item 5 (replace the Primary type bands). Line numbers were taken while another engineer was editing the same files, so they may drift by a few lines.

## What is in this folder

| File | What it does |
| --- | --- |
| `common.css` | All override rules. Reads tokens only, so both themes share one set of rules |
| `blue.css` | Treatment A. Imports `common.css`, sets blue tokens |
| `graphite.css` | Treatment B, tested as City Index. Imports `common.css`, sets graphite tokens |
| `REVIEW.md` | This file |

Load one theme after `style.css` (`?theme=blue` or `?theme=graphite`). Both themes are light only, because the brief and the base are light only.

What both treatments change:

- The four colored group bands become paper headings with a small mark. Families are told apart by tone and shape (solid, hollow, pale), and the type name is always written next to the mark.
- Masthead moves from a black bar to the suite's light masthead. Wordmark 700, 1.25rem, -.03em, nav .9rem, current page in accent on a soft tint, all copied from paygap.publicworks.nyc.
- The subtitle and imprint sit in the masthead on every view. The imprint uses the sibling sites' portfolio-line styling (12px, faint, bold link, no underline).
- Yellow focus rings and hard offset shadows are gone. Focus and selection use the one accent.
- Red is kept for the not-official notice and wrong exam answers only.
- Type switches to the suite's system stack, as in paygap, schools and hazardhistorian.

## Contrast, computed

WCAG 2 ratios, from a script, not estimated.

| Pair | Blue | Graphite |
| --- | --- | --- |
| Ink on paper | 17.4 | 17.2 |
| Faint text on paper | 6.0 | 6.1 |
| Faint text on selection tint | 5.1 | 5.0 |
| Accent on paper | 8.6 | 11.0 |
| White on accent (buttons, pressed tools) | 8.6 | 11.0 |
| Caution red on paper | 7.2 | 7.5 |
| Control and card edges on paper | 3.7 | 4.0 |
| Control and card edges on the chart canvas | 3.4 | 3.6 |
| Accent against body ink (links) | 2.0 | 1.6 |

The last row is under 3:1 in both themes, so in-text links carry a visible accent underline. The pale "outside the Mayor's line" mark (1.6 to 1.7:1) is decorative and ringed with the edge color.

## Recommendation

Ship Treatment A, blue.

- It gives color a civic meaning. Blue marks the Mayor's line, and everything else is neutral. The Primary look coded four families with four hues, and none of those hues meant anything.
- The accent is civilservice.publicworks.nyc's blue (`#14489b`), which Allen named as the reference. The two sites read as kin with no extra device.
- The name The Blue Pages and a blue accent agree.
- Graphite is calmer, but its links sit only 1.6:1 from body text and its selection is a gray tint, so the current row is harder to find in a 307-row list. It also leans on a generic name.

Assumption, not tested. Nobody has used either treatment yet. If the City Index name test wins on its own merits, graphite is a sound fallback, since both share the same rules.

## Top UI and UX issues beyond the audit

Ordered by impact. The themes already fix items 1 to 3 for their own pages, but the base should carry the fix too.

1. **Links rely on color alone.** `style.css:45` sets the underline to `--hair` (1.35:1 on white), and link blue against body ink is about 2:1. This fails WCAG 1.4.1 in running text. Fix by underlining in-text links in the accent at about 45 percent, as `common.css` does.
2. **Yellow focus and open rings are nearly invisible.** `#f6c400` on white is 1.6:1 (`style.css:91`, `style.css:229`, plus `.dd[open]`, `.card:hover`, `.card.is-focus`). This fails WCAG 1.4.11 for focus indicators. Fix with a 2px accent outline.
3. **Opacity is used to dim text.** `style.css:68`, `69`, `73`, `117`, `264` and `.card.is-dim` at `style.css:269` (opacity .2) lower contrast by an amount nobody checks. Fix with real color tokens, and raise dimmed chart cards to about .4 so names stay legible.
4. **The About page describes the old colors.** `app.js:619` says red marks elected offices and yellow marks boards. Both themes remove those. Fix by describing marks by shape ("solid blue for the Mayor's line, solid dark for elected offices, hollow for boards, pale for bodies outside the Mayor's line") or reading the legend from the theme.
5. **The home view repeats the site name.** It appears in the masthead, as the home `h1` (`app.js:250`) and, on phones, as `rail-intro-title` (`index.html:41`, `style.css:343`). With the new subtitle, the home heading can do a job instead. Try "Look up a City organization" as the `h1`, and drop `rail-intro-title`.
6. **Some text is too small to read.** `.thumb-none` is 7.5px (`style.css:131`), `.card-kind` is 9.5px (`style.css:259`) and `.row-aside` is 10.5px (`style.css:127`). Fix by leaving the no-logo thumb as an empty hairline box (the acronym already sits at the row's right edge) and setting an 11px floor elsewhere.
7. **Fonts load from Google.** `index.html:8-10` requests Inter and IBM Plex Mono from a third party, and the themes no longer use them. The siblings use the system stack and say "no tracking". Fix by removing the three lines. If a webfont stays, self-host it, as the brief requires.
8. **Pane heights use `100vh`.** `style.css:80` and `style.css:217` misreport height on iPad Safari when the toolbar shows, which clips the rail foot and the chart. Fix with `100dvh` and keep `100vh` as the fallback line above it.
9. **The share card hard-codes the primaries.** `app.js:685` builds the result from blue and red squares. That fits Treatment A. Under graphite, switch to a neutral pair or to plain text.
10. **Source notes repeat on every fact.** Five of the eight rows in `viewEntry` say "Agency list" (`app.js:323` onward). The fixed template is right, but the repetition reads as noise. Keep every note, and set it lighter (11px, faint, no underline until hover), which the themes begin to do.

## Branding notes for the suite

- **Masthead imprint versus the suite standard.** The suite's shared masthead comment (paygap and schools `site.css`) says the wordmark does not carry publicworks.nyc, and the portfolio line lives once at the foot. The new masthead imprint departs from that. It is justified here, because a directory of agencies with official logos is the suite site most likely to be taken for a City product. Decide whether to adopt it suite-wide (update the paygap reference and the hub README measurements) or record it as this site's exception.
- **Disclaimer wording.** The siblings put the full "This is not an official product" sentence in every footer. E has it only on Home and About, with a short line in the footer. Carry the full sentence into the footer to match.
- **Masthead register.** Every sibling uses a light masthead with a hairline or rule. The black bar was E's alone, and both themes drop it.
- **Dark mode.** Paygap, civilservice and the hub support it; this site is light only because the logos are drawn for light paper. That is a fair reason, but write it on the About page so the difference reads as a choice.
- **Hub tie.** The hub (publicworks.nyc) uses a gray paper and Arial. Graphite is the closer match to the hub. Blue is the closer match to the sibling data sites, which is the comparison readers will make.
