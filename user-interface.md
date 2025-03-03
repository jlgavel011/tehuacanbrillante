### Tehuacán Brillante Design System Documentation

## Color Palette

### Brand Colors

```css
Primary: #47C0CF (HSL: 187, 57%, 54%)
- Usage: Main actions, buttons, progress indicators, active states
- Variations:
  - Light: #7AD4DF (20% lighter) - Hover states
  - Dark: #3599A6 (20% darker) - Pressed states

Secondary: #1C2759 (HSL: 226, 53%, 23%)
- Usage: Headers, navigation, important text
- Variations:
  - Light: #2A3B8A (20% lighter) - Hover states
  - Dark: #131B3F (20% darker) - Pressed states
```

### Neutral Colors

```css
Background: #FFFFFF
Surface: #F5F7FA
Border: #E2E8F0
Text:
- Primary: #1A202C
- Secondary: #4A5568
- Disabled: #A0AEC0
```

### Semantic Colors

```css
Success: #43A047
- Light: #E8F5E9
- Dark: #2E7D32

Warning: #FFB300
- Light: #FFF8E1
- Dark: #FF8F00

Error: #E53935
- Light: #FFEBEE
- Dark: #C62828

Info: #2196F3
- Light: #E3F2FD
- Dark: #1976D2
```

## Typography

### Font Family

```css
Primary Font: 'Open Sans'
- Weights: 400 (Regular), 600 (Semi-bold), 700 (Bold)
Monospace: 'Roboto Mono'
- Usage: Code snippets, technical data
```

### Font Sizes

```css
Headings:
- H1: 24px (1.5rem) - line-height: 32px
- H2: 20px (1.25rem) - line-height: 28px
- H3: 18px (1.125rem) - line-height: 24px
- H4: 16px (1rem) - line-height: 24px

Body:
- Regular: 16px (1rem) - line-height: 24px
- Small: 14px (0.875rem) - line-height: 20px
- Tiny: 12px (0.75rem) - line-height: 16px

Special:
- Display: 32px (2rem) - line-height: 40px
- Caption: 12px (0.75rem) - line-height: 16px
```

## Spacing System

### Grid

```css
Base unit: 4px
Spacing scale:
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
```

### Layout Spacing

```css
Container:
- Max-width: 1440px
- Padding: 24px (responsive)
Grid:
- Gap: 24px
- Column: 12-column grid
```

## Borders & Shadows

### Border Radius

```css
radius-sm: 4px
radius-md: 6px
radius-lg: 8px
radius-xl: 12px
radius-full: 9999px
```

### Shadows

```css
shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

### Border Styles

```css
border-width:
- thin: 1px
- medium: 2px
- thick: 4px

border-color: #E2E8F0 (configurable)
border-style: solid
```

## Components

### Buttons

#### Primary Button

```css
Background: #47C0CF
Text color: white
Padding: 12px 24px
Border-radius: 6px
Font-weight: 600
Height: 40px

States:
- Hover: Brightness 90%
- Active: Brightness 80%
- Disabled: Opacity 50%
```

#### Secondary Button

```css
Background: white
Border: 1px solid #47C0CF
Text color: #47C0CF
Other properties same as primary
```

#### Icon Button

```css
Size: 40px x 40px
Border-radius: 6px
Icon size: 20px
```

### Cards

```css
Background: white
Border-radius: 8px
Shadow: shadow-md
Padding: 24px
Border: 1px solid #E2E8F0
```

### Form Elements

#### Input Fields

```css
Height: 40px
Border: 1px solid #E2E8F0
Border-radius: 6px
Padding: 8px 12px
Background: white

States:
- Focus: Border-color: #47C0CF
- Error: Border-color: #E53935
- Disabled: Background: #F5F7FA
```

#### Select Dropdowns

```css
Same as input fields plus:
Chevron icon: 20px
Dropdown menu:
- Background: white
- Shadow: shadow-lg
- Border-radius: 6px
- Max-height: 300px
```

### Tables

```css
Border: 1px solid #E2E8F0
Header:
- Background: #F8FAFC
- Font-weight: 600

Rows:
- Border-bottom: 1px solid #E2E8F0
- Hover: Background: #F5F7FA

Cells:
- Padding: 12px 16px
- Vertical-align: middle
```

## Interactive States

### Hover States

```css
Transition: all 0.2s ease
Scale: 1.02 (for cards and interactive elements)
Brightness: 90% (for colored elements)
```

### Focus States

```css
Outline: 2px solid #47C0CF
Outline-offset: 2px
```

### Active States

```css
Scale: 0.98
Brightness: 80%
```

## Animation & Transitions

### Duration

```css
quick: 100ms
normal: 200ms
slow: 300ms
```

### Easing

```css
default: cubic-bezier(0.4, 0, 0.2, 1)
in: cubic-bezier(0.4, 0, 1, 1)
out: cubic-bezier(0, 0, 0.2, 1)
```

### Common Animations

```css
fade-in: opacity 0.2s ease
slide-in: transform 0.2s ease
scale: transform 0.2s ease
```

## Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## Accessibility

### Color Contrast

- All text meets WCAG 2.1 AA standards
- Minimum contrast ratio:

- Normal text: 4.5:1
- Large text: 3:1





### Focus Indicators

```css
focus-visible:
  outline: 2px solid #47C0CF
  outline-offset: 2px
  box-shadow: 0 0 0 2px white
```

### Touch Targets

```css
Minimum size: 44px x 44px
Spacing between targets: 8px minimum
```

## Icons

### Sizes

```css
icon-sm: 16px
icon-md: 20px
icon-lg: 24px
icon-xl: 32px
```

### Stroke Width

```css
stroke-width: 2px (default)
stroke-width-thin: 1.5px
```

## Data Visualization

### Chart Colors

```css
Primary series: #47C0CF
Secondary series: #1C2759
Tertiary colors:
- #FFB300 (amber)
- #43A047 (green)
- #E53935 (red)
- #2196F3 (blue)
```

### Chart Typography

```css
Axis labels: 12px
Data labels: 14px
Title: 16px bold
Legend: 14px
```