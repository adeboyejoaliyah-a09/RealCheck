---
name: RealCheck Sentinel
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  data-metric:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system establishes an institutional-grade aesthetic engineered for high-consequence financial risk analysis, automated fraud intelligence, and mission-critical point-of-sale payment operations. The visual posture avoids decorative novelties, opting instead for high-density precision, relentless legibility, and immediate cognitive parsing.

### Visual Aesthetic & Movement
The design movement is **Technical Modernism** fused with **High-Density Utility**:
- **Structured Precision**: Interfaces are calibrated down to the single pixel with meticulous grid alignment, structural dividers, and monospaced alignment for numerical arrays.
- **Controlled Contrast**: Dark tonal surfaces eliminate visual fatigue over extended monitoring sessions, reserving high-energy chromatic accents exclusively for directional intent, state changes, and risk categorization.
- **Zero Gimmicks**: Elimination of amorphous gradients, excessive frosted blurs, and floating pseudo-skeuomorphic objects. Depth is communicated strictly via disciplined tonal tiering and razor-thin slate separation lines.

### Emotional Response
The interface must evoke:
- **Absolute Authority & Rigor**: Users must perceive decisions surfaced by the system as mathematically verified, audited, and uncompromised.
- **Operational Calm**: Amidst high-velocity anomaly detection and sudden payment bottlenecks, the interface organizes urgency logically without inducing panic.
- **Analytical Velocity**: Workflows enable rapid triage—moving from high-level portfolio integrity metrics to raw payload inspection within two keystrokes.

## Colors

The color system operates on an asymmetric dark-first framework where surfaces are stratified by lightness to indicate elevation, while semantic alerts command unequivocal visual authority.

### Base Surfaces & Canvas
- **Canvas Base (`#0B0F17`)**: The global viewport background, providing deep contrast for nested working surfaces.
- **Surface Level 1 (`#111827`)**: Primary structural panels, data tables, sidebars, and metric card foundations.
- **Surface Level 2 (`#1A2234`)**: Secondary card backgrounds, active table rows, flyout dialogs, and elevated inspection panels.
- **Surface Level 3 (`#1F2937`)**: Interactive control backgrounds (unfocused inputs, passive pill containers, segmented controls).

### Structural Borders
- **Border Default (`#1F2937`)**: Standard hairline border (1px) used across cards, dividers, and column separators.
- **Border Subtle (`#162032`)**: Used for nested list item separators and subtle gridlines in charting modules.
- **Border Strong (`#374151`)**: Used for focused interactive states, active panel edges, and modal boundaries.

### Core Accents
- **Primary Violet Accent (`#8B5CF6`)**: Anchors workflow progress, primary CTAs, active navigation items, and positive system AI insights. 
  - *Hover*: `#7C3AED`
  - *Active / Pressed*: `#6D28D9`
  - *Subtle Fill*: `rgba(139, 92, 246, 0.12)` (used for primary chips and selected row highlights)

### Semantic Intelligence Spectrum
- **Critical / High-Risk Red (`#EF4444`)**: Real-time fraud detection alerts, chargeback hazards, and hard payment drops.
  - *Deep State / Hover*: `#DC2626`
  - *Subtle Tint*: `rgba(239, 68, 68, 0.10)`
- **Amber Warning (`#F59E0B`)**: Latency spikes, anomalous velocity scores, and pending compliance clearances.
  - *Subtle Tint*: `rgba(245, 158, 11, 0.10)`
- **Emerald Verified Success (`#10B981`)**: Verified POS transactions, cleared risk audits, and resilient network statuses.
  - *Subtle Tint*: `rgba(16, 185, 129, 0.10)`

### Text Hierarchies
- **Text Primary (`#F9FAFB`)**: High-contrast labels, primary metrics, and header treatments.
- **Text Secondary (`#E5E7EB`)**: Standard body copy, table cell content, and active metadata.
- **Text Muted (`#9CA3AF`)**: Form labels, table headers, column titles, and secondary analytical dimensions.
- **Text Dim (`#6B7280`)**: Inactive states, breadcrumb separators, and disabled controls.

## Typography

Typography delivers strict operational readability. `Inter` provides neutral, crystal-clear forms for headlines and conversational UI, while `JetBrains Mono` handles all programmatic contexts, transaction hashes, payload signatures, and audit logs.

### Typographic Rules & Numerical Rigor
- **Enforced Tabular Figures**: Any interface section displaying financial currency, batch counts, risk probabilities, timestamps, or system latencies must enable OpenType tabular numbers (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1`). This prevents vertical alignment shifts during real-time streaming updates.
- **Dense Data Hierarchy**: Body defaults lean tight (`13px` / `18px` line-height), matching high-density operational terminal requirements without triggering visual fatigue.
- **Label Capitalization**: Table column headers and categoric section markers utilize `label-caps` styled in uppercase with intentional positive tracking (`+0.06em`) to frame lower data cells clearly.

## Layout & Spacing

The layout model is anchored to an ultra-efficient 12-column fluid grid system engineered for enterprise widescreen viewports, adapting down to single-column workflows for mobile operations.

### Grid Anatomy & Breakpoints
- **Desktop Ultrawide / Large (≥ 1440px)**: 12 columns, 16px (`gutter`) gutters, 24px (`margin`) margins. Dynamic split panels for dual-pillar telemetry (Fraud Left, POS Right).
- **Desktop Standard (1024px – 1439px)**: 12 columns, 16px gutters, 20px margins. Telemetry panels collapse into tabbed or stacked analytical views.
- **Tablet / Operational Console (768px – 1023px)**: 8 columns, 12px gutters, 16px margins. Navigation switches from persistent left rail to an icon-only or top dock mode.
- **Mobile Diagnostic (< 768px)**: 4 columns, 8px gutters, 16px (`margin-mobile`) margins. Complete vertical stacking with sticky header breadcrumbs and summary KPI horizontal scrolls.

### Spacing Philosophy
Spacing operates on a disciplined 4px base increment (`0.25rem`). Component paddings remain compact:
- Data cells and table rows strictly use `space-sm` (4px to 8px vertical padding) to preserve scanning volume.
- Metric cards use `space-lg` (16px) internal padding, ensuring high information density while preventing visual tension against inner borders.

## Elevation & Depth

Depth is established primarily through **Tonal Layering** paired with **Low-Contrast Outlines**, explicitly avoiding heavy ambient drop shadows or decorative blurs.

### Surface Elevation Levels
- **Canvas Base (`#0B0F17`)**: Ground plane. Carries structural layout boundaries and global viewport space.
- **Level 1 Panels (`#111827`)**: Base cards, primary operational tables, and static navigation surfaces. Outlined with a 1px solid border of `#1F2937`.
- **Level 2 Insets & Flyouts (`#1A2234`)**: Hover states on interactive cards, contextual menus, tooltips, and secondary diagnostic drawers. Outlined with a 1px solid border of `#374151`.
- **Level 3 Modal Overlays (`#1F2937`)**: System confirmation dialogs and transaction payload inspectors. Accompanied by a crisp, subdued outer perimeter shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.60)`.

### Border-Defined Depth
Shadows are minimized; structure relies on contrasting hairline lines. When hovering over cards or list items, elevation is conveyed by elevating border luminance (transitioning from `#1F2937` to `#374151`), never by inflating shadow spread.

## Shapes

The design system employs **Soft (`1`)** geometry to convey computational exactness and industrial control. High corner radiuses are prohibited, ensuring controls do not look playful or casual.

### Corner Radii Guidelines
- **Base Components (`0.25rem` / 4px)**: Buttons, text inputs, segmented pills, table rows, and status badges.
- **Structural Cards (`0.375rem` / 6px)**: Metric enclosures, data tables, and modal dialogs.
- **Data Points & Badges**: Retain a strict 4px radius or absolute circle (`50%`) for status dot indicators only. Full pill buttons are disallowed.

## Components

### Dual-Pillar Navigation System
The platform architecture revolves around two distinct operational modules: **Fraud Intelligence** and **POS Payment Reliability**.
- **Pillar Switcher**: A segmented control anchored at the top of the persistent left rail. Active selection highlights with a primary violet underline or fill (`#1A2234` container with `#8B5CF6` indicator).
- **Navigation Items**: Low-profile row elements with 13px typography. Active state features a 2px left border accent in `#8B5CF6`, `#F9FAFB` label text, and a background of `rgba(139, 92, 246, 0.08)`.

### Buttons
- **Primary**: Solid background `#8B5CF6`, text `#F9FAFB`, 0.25rem border-radius, font weight 500 (13px). Hover state transitions to `#7C3AED`. Active state drops to `#6D28D9`. Focus state adds an offset ring of `2px solid #8B5CF6`.
- **Secondary / Outline**: Background transparent, border `1px solid #374151`, text `#E5E7EB`. Hover state applies background `#1F2937` and border `#4B5563`.
- **Destructive**: Background `rgba(239, 68, 68, 0.10)`, border `1px solid rgba(239, 68, 68, 0.30)`, text `#EF4444`. Hover state applies `#DC2626` text with `#EF4444` solid border.
- **Dimensions**: Small (28px height, 8px padding), Medium (34px height, 12px padding).

### Refined Metric Cards
- **Structure**: Surface `#111827`, border `1px solid #1F2937`, internal padding `16px`.
- **Header**: Contains secondary muted title (`label-caps` in `#9CA3AF`) and a top-right contextual sparkline or status indicator.
- **Value**: Bold `data-metric` in `#F9FAFB` using tabular figures.
- **Delta Indicator**: Micro badge indicating delta vs previous timeframe. Positive/Verified uses `#10B981` text with `rgba(16, 185, 129, 0.10)` fill. Negative/Risk uses `#EF4444` text with `rgba(239, 68, 68, 0.10)` fill.

### Status Badges & Chips
- **Geometry**: Compact 4px border-radius, 20px total height, padding `2px 8px`. Typography is `code-sm` or `label-caps`.
- **High-Risk**: Border `1px solid rgba(239, 68, 68, 0.40)`, background `rgba(239, 68, 68, 0.12)`, text `#EF4444`. Includes a 6px solid pulsing circular glyph for active threats.
- **Warning / Degraded**: Border `1px solid rgba(245, 158, 11, 0.40)`, background `rgba(245, 158, 11, 0.12)`, text `#F59E0B`.
- **Verified / Optimal**: Border `1px solid rgba(16, 185, 129, 0.40)`, background `rgba(16, 185, 129, 0.12)`, text `#10B981`.
- **Informational / Neutral**: Border `1px solid #374151`, background `#1F2937`, text `#9CA3AF`.

### Data Tables & Dense Lists
- **Header Row**: Height 32px, background `#0B0F17`, typography `label-caps` in `#9CA3AF`, border bottom `1px solid #1F2937`.
- **Data Rows**: Height 38px, background `#111827`, alternate row background `#0E1420`. Typography `body-md` in `#E5E7EB`. Numerical cells align right with `font-variant-numeric: tabular-nums`.
- **Hover Row**: Background `#1A2234` with border top/bottom `1px solid #374151`.

### Form Controls & Input Fields
- **Input Field**: Height 32px, background `#0B0F17`, border `1px solid #1F2937`, corner radius `0.25rem`, text `#F9FAFB`, placeholder `#4B5563`.
- **Active / Focus**: Border `1px solid #8B5CF6`, outline none, box-shadow `0 0 0 1px #8B5CF6`.
- **Checkboxes & Radios**: 14px size, border `1px solid #374151`, background `#0B0F17`, checked state fill `#8B5CF6` with sharp high-contrast white glyph.

### Transaction & Audit Payload Viewer
- Integrated collapsible inspector panel for raw JSON/ledger tracing. Background `#080C13`, border `1px solid #1F2937`, typography `code-sm` in `#E5E7EB`. Syntax highlighting keys in `#9CA3AF`, string values in `#10B981`, and numeric risk values highlighted in dynamic semantic accents.