# Whop Tasks Design System

## Source and Authority

This system is derived from `brand-source/06_Decks/Brand Guidelines /Whop - Brand Guidelines_v2.7.pdf`, the supplied logo, pictogram, font, and ASE files, plus the accepted Whop Tasks implementation plan. The May 2026 v2.7 PDF is authoritative when sources differ. The ASE file labels Off-White as `#F1F1F1`, while the PDF specifies `#F3F3F3`; product tokens use the PDF value.

## Register and Scene

Register: product.

Scene: an earner checks a claim deadline from a phone between commitments, while a business reviewer compares structured proof on a laptop in normal daylight. The interface is light-first for immediate scanning, with a complete dark theme for lower-light use.

## Visual Theme

Use a restrained product strategy: tinted grayscale surfaces carry the interface, and Vermilion marks primary actions, active selection, and key progress. Secondary brand colors are functional and sparse. The product should feel dense, direct, and evidence-rich, not decorative.

No decorative gradients, glass effects, nested card grids, side-stripe accents, gradient text, or ambient animation. Standard Frosted UI patterns are preferred over invented controls.

## Color

### Official brand palette

| Token | Value | Use |
| --- | --- | --- |
| Vermilion | `#FA4616` | Primary actions, active selection, key progress |
| Off-White | `#F3F3F3` | Primary light canvas, per PDF |
| Charcoal | `#151515` | Primary dark canvas and high-emphasis text |
| Indigo | `#354B98` | Informational or data role |
| Cerulean | `#6196C1` | Informational secondary role |
| Chartreuse | `#C1FA81` | Positive highlight where contrast permits |
| Mustard | `#FFD83B` | Warning or pending highlight where contrast permits |
| Dust | `#B6B5B0` | Muted labels and neutral data |
| Bone | `#F1F1F1` | Secondary light surface |
| White | `#FFFFFF` | Approved logo/background utility |
| Black | `#000000` | Approved logo utility |

Live product CSS should expose these exact source values as brand tokens. Derived interface neutrals may interpolate between approved grayscale endpoints. Semantic success, warning, error, and information tokens must pass WCAG AA and may not rely on color alone.

### Theme behavior

- Light theme uses Off-White as the canvas, white or Bone for raised controls, Charcoal for high-emphasis text, and restrained grayscale borders.
- Dark theme uses Charcoal as the canvas, near-charcoal derived surfaces, Off-White for high-emphasis text, and Dust for secondary labels.
- Vermilion is not decorative. It identifies the primary action, current selection, or material progress.
- Duotone lockups are allowed only on grayscale backgrounds.

## Typography

Use Acid Grotesk as the single live-text family for product screens. The PDF identifies Acid Grotesk Regular and Medium as primary choices for product screens and explicitly prohibits mixing Acid Grotesk and Inter in live text. Inter remains available only for a future self-contained data visualization whose entire live text system uses Inter.

Load the supplied variable Acid Grotesk file locally. Favor Regular and Medium; use stronger weights only when hierarchy requires them.

| Role | Size / line height | Weight | Tracking |
| --- | --- | --- | --- |
| Page title | 32 / 35 px | Medium | `0` |
| Section title | 24 / 27 px | Medium | `0` |
| Subsection title | 20 / 23 px | Medium | `0` |
| Body | 15 / 18 px | Regular | `0` |
| Compact body | 12 / 15 px | Regular | `0` |
| Button and label | 15 / 18 px | Medium | `0` |

Use sentence case. Do not use all caps. Keep prose between 65 and 75 characters per line where practical. Use double-story `a` and `g`, and high ascenders when the font technology exposes those alternates.

## Spacing and Layout

Base spacing unit: 4 px.

Preferred steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64 px. Use 16 px gutters on mobile, 24 px on tablet, and 32 px on wide desktop. Use a predictable 12-column desktop grid where it helps task comparison. Break the grid only to improve workflow clarity.

Breakpoints:

- Mobile: below 640 px
- Tablet and small laptop: 640 to 1023 px
- Desktop: 1024 to 1439 px
- Wide desktop: 1440 px and above

Desktop uses a left rail and content canvas. Mobile replaces the rail with a bottom bar or drawer and keeps the current primary action reachable. Responsive behavior changes structure rather than shrinking type.

## Shape, Borders, and Elevation

Frosted UI component geometry is authoritative. Product surfaces use subtle full borders and restrained elevation to communicate stacking. Avoid nested cards. Group related evidence with spacing, dividers, table or list structure before adding a container.

Use three elevation roles:

1. Canvas: no shadow.
2. Control or floating menu: Frosted UI default border and shadow.
3. Overlay: Frosted UI dialog or popover elevation with a clear backdrop.

Never add shadows, filters, strokes, or effects to official logos.

## Component Behavior

- **Buttons:** Direct verbs, one clear primary action per decision area, visible hover, focus, active, disabled, and loading states.
- **Inputs:** Persistent labels, field-level errors, help text where proof expectations need context, and no placeholder-only labeling.
- **Task results:** Dense rows or cards with whole-item navigation, reward, capacity, deadline, business identity, and funding context.
- **Status:** Text plus color or icon. Use stable vocabulary for draft, active, filled, claimed, under review, changes requested, approved, paid, rejected, expired, completed, and archived.
- **Progress:** Show funded and remaining capacity with accessible text, not only a bar.
- **Forms:** Short staged workflows. Dynamic proof requirements retain server order and expose required state.
- **Feedback:** Skeletons for content loading, disabled/loading actions during mutations, inline recoverable errors, concise success confirmation, and useful empty states.
- **Navigation:** Persistent Whop identity, workspace switcher, notifications, balance, profile, and theme control when those surfaces are implemented.

## Motion

Use 150 to 250 ms state transitions with ease-out-quart, quint, or expo curves. Animate opacity and transforms, not layout properties. Motion communicates selection, loading, completion, or state change only. Respect `prefers-reduced-motion`.

## Logo and Asset Rules

- Use exact files from `public/brand`; never redraw or approximate.
- The lockup is the primary external-facing identifier and may not be altered.
- The wordmark is not paired with live text.
- Keep clear space around logomark and lockup as demonstrated in the PDF.
- Use Vermilion logomark as the primary color option.
- Duotone lockups appear only on approved grayscale backgrounds.
- On color backgrounds, use a legible black or white approved asset.
- Never recolor, warp, rotate, reorder, shadow, filter, or create a vertical lockup.
- Pictograms retain their supplied colors and square visual grid. Use them only for discovery, meaningful empty states, and payout confirmation.
- Routine interface actions use `@frosted-ui/icons`.

## Content and State Requirements

Copy is immediate and intentional. Prefer active verbs and positive framing. Avoid broad generalizations and the terms prohibited by the brand guide. Every primary surface eventually needs loading, useful empty, validation, recoverable error, disabled/loading action, success, and mobile states.

Foundation-only work may render a minimal shell. It must not invent marketplace, earner, or business UI before their planned phases.
