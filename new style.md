# FocusBoss — UI Style Guide (extracted from provided HTML/CSS)

This document describes the visual system used in the FocusBoss popup UI: tokens, layout rules, component recipes, and interaction patterns.

---

## 1) Visual language

- Dark, glassy dashboard aesthetic: deep background + lifted surfaces.
- Single primary accent: electric green for “active” states + glow.
- Separation via subtle translucent borders (not heavy dividers).
- Rounded geometry everywhere (cards, pills, toggles, icon buttons).
- Micro-motion: gentle lift/slide and fade transitions.

---

## 2) Core design tokens

### 2.1 Typography
**Font**
- Inter (weights: 400, 500, 600, 700)

**Hierarchy**
- App title: `24px / 700` with gradient text
- Card title: `18px / 600`
- UI text: `13–14px / 500`
- Small labels: `11–12px / 500` muted

**Notable timer typography**
- Timer value: `48px / 700`, `letter-spacing: -2px`
- Timer label: `12px`, muted

---

### 2.2 Color tokens (authoritative)

```css
:root {
  --color-bg: #0a0e14;
  --color-surface: #12171f;
  --color-surface-elevated: #1a2029;

  --color-text: #e6edf3;
  --color-text-muted: #8b949e;

  --color-accent: #00ff88;
  --color-accent-glow: rgba(0, 255, 136, 0.3);

  --color-danger: #ff4757;
  --color-warning: #ffa502;
  --color-info: #00d2ff;

  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.12);
}
```

**Gradient (title)**
- `linear-gradient(135deg, var(--color-accent) 0%, #00b8ff 100%)`

**Common translucent surface tints**
- `rgba(255, 255, 255, 0.03)`
- `rgba(255, 255, 255, 0.05)`
- `rgba(255, 255, 255, 0.10)`

**Active tint (accent wash)**
- `rgba(0, 255, 136, 0.05)`
- `rgba(0, 255, 136, 0.10)`
- `rgba(0, 255, 136, 0.15)`

---

### 2.3 Radius tokens
```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

**Usage**
- Cards: `--radius-lg`
- Inputs, list items, segmented: `--radius-md`
- Segmented inner buttons: `--radius-sm`
- Pills/toggles: `999px`
- Icon buttons: `50%`

---

### 2.4 Shadow tokens
```css
:root {
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px var(--color-accent-glow);
}
```

**Glow policy**
- Use glow only for: primary CTA, active pill, active status, active nav indicator, checked toggle.

---

### 2.5 Motion tokens
- Global pattern: `transition: all 0.3s ease`
- View transition: fade + slight upward motion
- Timer progress: `stroke-dashoffset 1s linear`

**Keyframes**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
```

---

## 3) Layout rules

### 3.1 Popup constraints
- `min-width: 400px`
- `min-height: 600px`
- `overflow: hidden`

### 3.2 App structure
- `.app`: column flex, full height
- Header: fixed top bar
- Main: scrollable content
- Nav: fixed bottom bar (5-column grid)

### 3.3 Spacing rhythm
- Header padding: `20px 24px`
- Main padding: `24px`
- Card padding: `20px`
- Card vertical spacing: `margin-bottom: 16px`
- Grid gaps: commonly `8px` or `12px`

### 3.4 Scrollbar styling (main)
- Width: `6px`
- Thumb: `rgba(255,255,255,0.2)`
- Rounded thumb: `3px`

---

## 4) Component recipes

### 4.1 App header
**Surface**
- Background: `--color-surface`
- Border bottom: `1px solid --color-border`
- Glass: `backdrop-filter: blur(20px)`

**Title**
- `24px / 700`
- Gradient text via background-clip

---

### 4.2 Card
**Base**
- `background: var(--color-surface)`
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-lg)`
- `padding: 20px`
- `transition: all 0.3s ease`

**Hover**
- `border-color: var(--color-border-hover)`
- `transform: translateY(-2px)`
- `box-shadow: var(--shadow-md)`

---

### 4.3 Status pill
**Base**
- Flex row, `gap: 8px`
- `padding: 8px 16px`
- `border-radius: 999px`
- `font-size: 13px; font-weight: 500`
- `border: 1px solid` (color varies by state)

**Active**
- `background: rgba(0, 255, 136, 0.15)`
- `border-color: var(--color-accent)`
- `color: var(--color-accent)`
- `box-shadow: var(--shadow-glow)`

**Dot**
- `6px` circle
- `background: currentColor`
- `animation: pulse 2s ease-in-out infinite`

---

### 4.4 Pills (chips)
**Base**
- `padding: 8px 16px`
- `border-radius: 999px`
- `border: 1px solid var(--color-border)`
- `background: rgba(255, 255, 255, 0.05)`
- `color: var(--color-text-muted)`
- `font-size: 13px; font-weight: 500`
- Hover: accent border + accent text + accent tint

**Active**
- `background: var(--color-accent)`
- `border-color: var(--color-accent)`
- `color: var(--color-bg)`
- `box-shadow: var(--shadow-glow)`

---

### 4.5 Buttons

**.btn (base)**
- `padding: 10px 20px`
- `border-radius: var(--radius-md)`
- `font-size: 14px; font-weight: 500`
- `transition: all 0.3s ease`

**Primary**
- `background: var(--color-accent)`
- `color: var(--color-bg)`
- `box-shadow: var(--shadow-glow)`
- Hover: `transform: translateY(-2px)` + stronger glow

**Secondary**
- `background: var(--color-surface-elevated)`
- `color: var(--color-text)`
- `border: 1px solid var(--color-border)`
- Hover: border + text become accent

**Icon button**
- Default: `32x32`, circular
- Border: subtle, background translucent
- Hover: border + text accent, background accent tint

---

### 4.6 Toggle switch
**Track**
- `width: 56px; height: 32px`
- Background: `rgba(255,255,255,0.1)`
- Border: `1px solid var(--color-border)`
- Radius: `999px`

**Thumb**
- `24x24`, white
- Positioned `left: 3px; top: 3px`
- Subtle thumb shadow

**Checked**
- Track: `background: var(--color-accent)`
- Border: `var(--color-accent)`
- Glow: `--shadow-glow`
- Thumb: `transform: translateX(24px)`

---

### 4.7 Segmented control
- Container: 3-column grid
- Background: translucent white
- Padding: `4px`, gap `4px`
- Buttons:
  - Base: transparent, muted
  - Active: accent fill + `--shadow-sm`

---

### 4.8 List item
- Row layout, spaced
- Background: `rgba(255,255,255,0.03)`
- Border: subtle
- Radius: `--radius-md`
- Hover: border intensifies + `translateX(4px)`

---

### 4.9 Text input
- Full width
- Background: translucent
- Border: subtle
- Focus: border accent + accent wash background

---

### 4.10 Bottom navigation
**Container**
- 5-column grid
- Background: `--color-surface`
- Border top: `1px solid --color-border`
- Padding: `12px 8px`

**Nav button**
- Column layout, centered
- Default color: muted
- Hover/Active color: accent

**Active indicator**
- 40×3 bar below, accent, glow, rounded top corners

---

### 4.11 Timer (Pomodoro)
**Container**
- `240x240`, centered

**Rings**
- BG ring:
  - `stroke: rgba(255,255,255,0.05)`
  - `stroke-width: 12`
- Progress ring:
  - `stroke: var(--color-accent)`
  - `stroke-linecap: round`
  - Glow: `drop-shadow(0 0 8px var(--color-accent-glow))`
  - Start at top: `rotate(-90)`
  - Smooth update: `stroke-dashoffset 1s linear`

**Center typography**
- Value: `48px / 700`, `letter-spacing: -2px`
- Label: `12px`, muted

---

## 5) Interaction patterns (global)

- Hover = accent hint + mild movement:
  - Cards lift up slightly
  - List items slide right slightly
  - Primary buttons lift + glow increases
- Active = accent fill + glow
- Muted defaults use low-contrast borders and subdued text

---

## 6) Do / Don’t

✅ Do
- Keep borders extremely subtle (`rgba(255,255,255,0.06)`)
- Reserve glow for active/primary states only
- Use consistent rounding and 0.3s ease transitions

❌ Don’t
- Use heavy surface gradients (only title + chart bars use gradients)
- Replace borders with heavy shadows; borders are the primary separator
