# Breakpoints & Responsive Scale

## Webflow Breakpoints

| Name   | Max Width | Applies To       |
|--------|-----------|------------------|
| main   | (none)    | Desktop 992px+   |
| medium | 991px     | Tablet           |
| small  | 767px     | Mobile Landscape |
| tiny   | 478px     | Mobile Portrait  |

Styles set at `main` cascade to all smaller breakpoints. Only override at a breakpoint where the value actually differs.

---

## Global Padding

`padding-global`: fixed **2rem** left/right at all breakpoints. NOT percentage-based.

Applied to the wrapper div inside sections. Combined with a `padding-section-*` combo class for vertical spacing.

---

## Section Padding Scale

Three sizes adopted from the Relume template with responsive overrides:

| Class                    | main  | medium | small  | tiny   |
|--------------------------|-------|--------|--------|--------|
| `padding-section-large`  | 7rem  | 5rem   | 3.5rem | 2.5rem |
| `padding-section-medium` | 5rem  | 3.5rem | 2.5rem | 2rem   |
| `padding-section-small`  | 3rem  | 2rem   | 1.5rem | 1rem   |

**Usage pattern:**
```
<section>
  <div class="padding-global padding-section-large">   ← horizontal + vertical padding
    <div class="container-large">                       ← max-width constraint
      [content]
    </div>
  </div>
</section>
```

---

## Container Widths

| Class              | Max Width | Purpose            |
|--------------------|-----------|---------------------|
| `container-large`  | 80rem     | Full-width sections |
| `container-medium` | 64rem     | Standard content    |
| `container-small`  | 48rem     | Narrow content      |
| `container-xl`     | 80rem     | Alias for container-large (project convention) |

All containers use `margin-left: auto; margin-right: auto` for centering.

---

## Typography Responsive Scale

See `style-guide.md` for per-heading breakpoint values.

General principle: headings scale down ~75-80% at tablet, ~50-60% at mobile. Body text stays at 1rem minimum on mobile to prevent iOS auto-zoom on input focus.

---

## Spacing Responsive Scaling

Spacing variables don't have built-in breakpoint support in Webflow. When applying spacing at different breakpoints, use these scaling factors:

| Breakpoint | Scale Factor     |
|------------|------------------|
| main       | 100% (base)      |
| medium     | 75-80% of main   |
| small      | 50-60% of main   |
| tiny       | 40-50% of main   |
