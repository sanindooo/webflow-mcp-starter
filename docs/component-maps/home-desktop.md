# Pierpoint Home-Desktop Component Map

**Figma Frame:** `9805:4133` Home-Desktop
**Viewport:** 94.5rem (1512px) wide
**Page background:** `#fffbdb` (cream)
**Total top-level children:** 30

## Brand Colors

| Token           | Hex       | Usage                          |
| --------------- | --------- | ------------------------------ |
| Navy            | `#192b54` | Text, backgrounds, borders     |
| Cream           | `#fffbdb` | Page background, light text    |
| Light cream     | `#f8f6e1` | Button text on navy, alt cream |
| Coral/Red       | `#e85f62` | Accent borders (wellness)      |
| Periwinkle      | `#6779c2` | Accent borders (wellness)      |

## Typography

| Role           | Font Family             | Weight | Size      | Line-height | Transform | Color     |
| -------------- | ----------------------- | ------ | --------- | ----------- | --------- | --------- |
| Hero H1        | RamaGothicEW01-Heavy    | 900    | 7.5rem    | 0.95        | uppercase | `#fffbdb` |
| Section H2     | Rama Gothic E           | 900    | 5.625rem  | 1.2         | --        | `#192b54` |
| Card H3        | Rama Gothic E           | 700    | 3.125rem  | 1.2         | --        | varies    |
| Subsection H3  | RamaGothicEW01-Heavy    | 900    | 4rem      | 1.202       | --        | `#192b54` |
| Footer nav     | RamaGothicEW01-SemiBold | 600    | 4.375rem  | 1.144       | --        | `#fffbdb` |
| Body large     | Futura / Futura PT      | 500/450| 1.25rem   | 1.4 / 1.328 | --        | `#192b54` |
| Body regular   | Futura PT               | 450    | 1rem      | 1.2         | --        | `#192b54` |
| CTA link       | Calder                  | 400    | 0.875rem  | 1.2         | --        | `#192b54` |
| Button text    | Calder                  | 400    | 0.875rem  | 1.322       | uppercase | varies    |
| Nav label       | Calder                  | 400    | 0.75rem   | 1.322       | uppercase | `#192b54` |
| Footer small   | Calder                  | 400    | 0.8125rem | 1.538       | uppercase | `#fffbdb` |
| Copyright      | Futura PT               | 450    | 0.875rem  | 1.282       | --        | `#fffbdb` |
| Table row      | Calder                  | 400    | 1.25rem   | 1.0         | uppercase | `#192b54` |

---

## 1. Navigation Bar (fixed/sticky)

**Node IDs:** `9805:4376` (wordmark), `9805:4381-4382` (labels), `9805:4383` (hamburger), `10127:642` (top bar)

```
<nav> .nav_component
  |
  +-- <div> .nav_left
  |     +-- [SVG] .nav_wordmark  (PP-WORDMARK, 14rem x 3rem)
  |     +-- <p> .nav_label       "Oceanside'S cultural hub"
  |     +-- <p> .nav_sublabel    "california"
  |
  +-- <div> .nav_right
  |     +-- <div> .nav_top-bar
  |     |     +-- <a> .nav_btn is-outline    "RESORTPASS"
  |     |     |     bg: #f8f6e1, border: 0.125rem solid #192b54
  |     |     +-- <a> .nav_btn is-filled     "BOOK HOTEL"
  |     |           bg: #192b54, color: #f8f6e1
  |     +-- <div> .nav_hamburger  (6.25rem x 1.5rem)
  |           +-- <span> .nav_hamburger-line  (3 lines, 0.125rem tall, bg: #192b54)
```

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4381` | "Oceanside'S cultural hub" | Calder | 0.75rem | 400 | `#192b54` |
| `9805:4382` | "california" | Calder | 0.75rem | 400 | `#192b54` |
| `10127:644` | "RESORTPASS" | Calder | 0.875rem | 400 | `#192b54` |
| `10127:646` | "BOOK HOTEL" | Calder | 0.875rem | 400 | `#f8f6e1` |

### Layout
- Top bar buttons: 8.8125rem x 2.125rem each
- Hamburger: flex-direction: column, gap: 0.5625rem

---

## 2. Hero Section

**Node ID:** `9805:4199`
**Dimensions:** 94.5rem x 61.375rem (full viewport height)

```
<section> .section_hero
  |  background: fill image (pexels-josh-hild) with 35% black overlay
  |  padding: 1.5rem left/right/top
  |  flex-direction: column, justify: space-between, align: center
  |
  +-- <article> .hero_content
        |  width: 91.5rem
        |  flex-direction: column, gap: 1.5rem, align: center
        |
        +-- <div> .hero_text-wrapper
        |     |  width: 73.5rem
        |     |  flex-direction: column, gap: 2rem, justify: flex-end, align: center
        |     |
        |     +-- <h1> .hero_heading       "The Coast is Calling"
        |     +-- <p> .hero_subheading      "Step into Oceanside: where art and surf collide..."
```

### Images
| Node | Name | Dimensions | Notes |
| ---- | ---- | ---------- | ----- |
| `9805:4200` | pexels-josh-hild-1270765-17685535 | 94.5rem x 61.375rem | Background fill, 35% black overlay |

### Text Nodes
| Node | Content | Font | Size | Weight | Line-height | Transform | Color |
| ---- | ------- | ---- | ---- | ------ | ----------- | --------- | ----- |
| `9805:4203` | "The Coast is Calling" | RamaGothicEW01-Heavy | 7.5rem | 900 | 0.95 | uppercase | `#fffbdb` |
| `9805:4204` | "Step into Oceanside: where art and surf collide and the golden-era spirit lives on." | Futura | 1.25rem | 500 | 1.328 | -- | `#fffbdb` |

---

## 3. About Section (O'Side Rhythm)

**Node ID:** `9805:4205`
**Dimensions:** 94.5rem x 80.875rem

```
<section> .section_about
  |  padding: 1.5rem sides, 1.5rem top, 10.875rem bottom
  |  flex-direction: column, justify: flex-end, align: center
  |
  +-- <article> .about_wrapper
        |  width: 91.5rem, height: 68.5rem
        |  flex-direction: row, gap: 1.5rem, align: center
        |
        +-- <div> .about_message
        |     |  width: 45.25rem, padding-left: 7.75rem
        |     |  flex-direction: column, gap: 4rem, justify: flex-end
        |     |
        |     +-- <figure> .about_image-small
        |     |     +-- <img> .u-image    (pexels-mantoine, 29.5rem x 21.75rem)
        |     |           border: 0.4375rem solid #192b54
        |     |
        |     +-- <h2> .about_heading     "O'Side Rhythm"
        |     |
        |     +-- <div> .about_body
        |     |     |  flex-direction: column, gap: 4rem
        |     |     +-- <div> .about_text-block  (gap: 2rem)
        |     |     |     +-- <p> .about_description  "Checking in? Think of it..."
        |     |     +-- <a> .about_cta            "Discover Oceanside" + arrow icon
        |     |
        |     +-- (Note: CTA is circle-arrow pattern, see reusable component below)
        |
        +-- <div> .about_cta-image
              +-- <figure> .about_image-large
                    +-- <img> .u-image    (7d28be18..., 44.75rem x 49.75rem)
                          border: 0.4375rem solid #192b54
```

### Images
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:4208` | pexels-mantoine-1667018 1 | 29.5rem x 21.75rem | 0.4375rem solid `#192b54` |
| `9805:4220` | 7d28be18ba231795... | 44.75rem x 49.75rem | 0.4375rem solid `#192b54` |

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4209` | "O'Side Rhythm" | Rama Gothic E | 5.625rem | 900 | `#192b54` |
| `9805:4212` | "Checking in? Think of it as clocking out..." (full paragraph) | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4215` | "Discover Oceanside" | Calder | 0.875rem | 400 | `#192b54` |

---

## 4. Stay With Us Interstitial

**Node IDs:** `9805:4221`, `9805:4222`, `9805:4223`, `9805:4230`

This is a composite layout of floating elements between sections: two standalone images, a text block with CTA, and a vertical rotated heading.

```
<section> .section_stay-with-us
  |
  +-- <figure> .stay-with-us_image-large
  |     +-- <img> .u-image  (pexels-boonkong-boonpeng, 52.6875rem x 59.9375rem)
  |           border: 0.4375rem solid #192b54
  |
  +-- <figure> .stay-with-us_image-small
  |     +-- <img> .u-image  (pexels-enginakyurt, 21.6875rem x 22.5rem)
  |           border: 0.4375rem solid #192b54
  |
  +-- <div> .stay-with-us_text-block
  |     |  flex-direction: column, gap: 2rem
  |     +-- <p> .stay-with-us_body  "Days start slow and sunlit..."
  |     +-- <a> .stay-with-us_cta   "Explore the Hotel" + arrow icon
  |
  +-- <h2> .stay-with-us_heading    "Stay With Us"
        (rotated vertical text, 5.625rem, Rama Gothic E, 900)
```

### Images
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:4221` | pexels-boonkong-boonpeng-442952-1134176 1 | 52.6875rem x 59.9375rem | 0.4375rem solid `#192b54` |
| `9805:4222` | pexels-enginakyurt-1579253 1 | 21.6875rem x 22.5rem | 0.4375rem solid `#192b54` |

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4224` | "Days start slow and sunlit at Pierpoint's SpringHill Suites..." | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4226` | "Explore the Hotel" | Calder | 0.875rem | 400 | `#192b54` |
| `9805:4230` | "Stay With Us" | Rama Gothic E | 5.625rem | 900 | `#192b54` |

---

## 5. Dining Section (Dine & Drink)

**Node ID:** `9805:5941`
**Dimensions:** 94.5rem x 61.375rem
**Background:** `#fffbdb` (cream)

```
<section> .section_dining
  |  bg: #fffbdb
  |  padding: 1.5rem sides
  |  flex-direction: column, justify: center
  |
  +-- <article> .dining_content
  |     |  width: 52.75rem
  |     |  flex-direction: column, gap: 0.625rem
  |     |  padding: 11.0625rem top/bottom
  |     |
  |     +-- <div> .dining_message
  |     |     |  flex-direction: column, gap: 6.875rem
  |     |     |
  |     |     +-- <h2> .dining_heading     "Dine & Drink"
  |     |     |
  |     |     +-- <div> .dining_details
  |     |           |  flex-direction: column, gap: 2rem
  |     |           |
  |     |           +-- <div> .dining_intro-row  (row, gap: 1.5rem)
  |     |           |     +-- <p> .dining_description  "From first sip to last bite..."
  |     |           |
  |     |           +-- <div> .dining_table
  |     |                 |  flex-direction: column
  |     |                 |
  |     |                 +-- <div> .dining_row
  |     |                 |     border-bottom: 0.0625rem solid #192b54
  |     |                 |     padding: 1rem top/bottom, 0.5rem sides
  |     |                 |     flex-direction: row, justify: space-between
  |     |                 |     +-- <span> .dining_row-label  "About us"
  |     |                 |     +-- <div> .dining_row-arrow   (1.25rem arrow icon)
  |     |                 |
  |     |                 +-- <div> .dining_row
  |     |                       (same structure, second row)
  |
  +-- <div> .dining_images  (GROUP — scattered/collage layout)
        +-- <img> pexels-chevanon-323682       (14.5rem x 17.6rem)
        +-- <img> pexels-chevanon-323682       (28.5rem x 35rem)
        +-- <img> pexels-vince-33389246        (16.5rem x 19.5rem)
        +-- <img> pexels-vince-33389217        (23.3rem x 27.7rem)
        +-- <img> pexels-roman-odintsov        (19.9rem x 25rem)
        +-- <img> pexels-sebastian-coman       (28.6rem x 22.1rem)
        +-- <img> pexels-pixabay-265947        (29.7rem x 24.7rem)
        +-- <img> pexels-pixabay-262978        (21rem x 16.9rem)
        +-- <img> pexels-taryn-elliott          (15.1rem x 20.9rem)
```

### Text Nodes
| Node | Content | Font | Size | Weight | Transform | Color |
| ---- | ------- | ---- | ---- | ------ | --------- | ----- |
| `9805:5944` | "Dine & Drink" | Rama Gothic E | 5.625rem | 900 | -- | `#192b54` |
| `9805:5948` | "From first sip to last bite, dining here is all about easy energy..." | Futura | 1.25rem | 500 | -- | `#192b54` |
| `9805:5952` | "About us" (row 1 label — likely restaurant name) | Calder | 1.25rem | 400 | uppercase | `#192b54` |
| `9805:5957` | "About us" (row 2 label — likely restaurant name) | Calder | 1.25rem | 400 | uppercase | `#192b54` |

### Images (Collage)
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:5978` | pexels-chevanon-323682 | 14.5rem x 17.6rem | 0.4375rem solid `#192b54` |
| `9805:5979` | pexels-chevanon-323682 | 28.5rem x 35rem | 0.4375rem solid `#192b54` |
| `9805:5981` | pexels-vince-33389246 | 16.5rem x 19.5rem | 0.3125rem solid `#192b54` |
| `9805:5982` | pexels-vince-33389217 | 23.3rem x 27.7rem | 0.3125rem solid `#192b54` |
| `9805:5984` | pexels-roman-odintsov-4870434 | 19.9rem x 25rem | 0.3125rem solid `#192b54` |
| `9805:5985` | pexels-sebastian-coman-photography | 28.6rem x 22.1rem | 0.3125rem solid `#192b54` |
| `9805:5987` | pexels-pixabay-265947 | 29.7rem x 24.7rem | 0.3125rem solid `#192b54` |
| `9805:5988` | pexels-pixabay-262978 | 21rem x 16.9rem | 0.3125rem solid `#192b54` |
| `9805:5990` | pexels-taryn-elliott-9716814 | 15.1rem x 20.9rem | 0.4375rem solid `#192b54` |

---

## 6. Horizontal Scroll (Image Strip)

**Node ID:** `9805:4232`

```
<section> .section_scroll-strip
  |
  +-- <div> .scroll-strip_slider
        |  flex-direction: row, gap: 1.5rem
        |  width: 94.5rem, height: 22.4375rem
        |  overflow: hidden (horizontal scroll)
        |
        +-- <figure> .scroll-strip_image
        |     +-- <img>  (pexels-daniela-elena-tentis, 25.5rem x 17rem)
        +-- <figure> .scroll-strip_image
        |     +-- <img>  (pexels-chevanon, 17rem x 22.4rem)
        +-- <figure> .scroll-strip_image
        |     +-- <img>  (pexels-robinstickel, 14.3rem x 9.5rem)
        +-- <figure> .scroll-strip_image
        |     +-- <img>  (pexels-xmtnguyen, 15.9rem x 14.5rem)
        +-- <figure> .scroll-strip_image
              +-- <img>  (pexels-julieaagaard, 18.8rem x 19.4rem)
```

### Images
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:4234` | pexels-daniela-elena-tentis-118658-262959 | 25.5rem x 17rem | 0.3125rem solid `#000` |
| `9805:4235` | pexels-chevanon-323682 | 17rem x 22.4rem | 0.3125rem solid `#000` |
| `9805:4236` | pexels-robinstickel-70497 | 14.3rem x 9.5rem | 0.3125rem solid `#000` |
| `9805:4237` | pexels-xmtnguyen-699953 | 15.9rem x 14.5rem | 0.3125rem solid `#000` |
| `9805:4238` | pexels-julieaagaard-2097090 | 18.8rem x 19.4rem | 0.3125rem solid `#000` |

**Note:** Border color is `#000000` (black), unlike other sections which use navy.

---

## 7. Sip & Savor (Shop Local)

**Node ID:** `9805:4239`
**Dimensions:** 94.5rem x 61.375rem
**Background:** `#192b54` (navy -- dark section)

```
<section> .section_sip-savor
  |  bg: #192b54
  |  padding: 1.5rem sides
  |  flex-direction: column, align: center
  |
  +-- <article> .sip-savor_wrapper
        |  width: 91.5rem
        |  flex-direction: row, gap: 1.5rem, align: center
        |
        +-- <div> .sip-savor_images
        |     |  width: 60.5rem, height: 40.5rem
        |     |  flex-direction: row, gap: 4rem, align: center
        |     |
        |     +-- <figure> .sip-savor_image-left
        |     |     +-- <img> .u-image  (pexels-olegprachuk, 26.5rem x 40.5rem)
        |     |           border: 0.4375rem solid #e85f62
        |     |
        |     +-- <figure> .sip-savor_image-right
        |           +-- <img> .u-image  (pexels-nathanjhilton, 21.8rem x 33.1rem)
        |                 border: 0.4375rem solid #e85f62
        |
        +-- <div> .sip-savor_message
              |  width: 29.5rem
              |  flex-direction: column, gap: 4rem
              |
              +-- <h2> .sip-savor_heading    "Shop Local"
              +-- <div> .sip-savor_body
              |     |  flex-direction: column, gap: 2rem
              |     +-- <p> .sip-savor_description  "Stop by Boardhouse..."
              +-- <a> .sip-savor_cta   "shop around" + arrow icon
                    (circle-arrow in #fffbdb)
```

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4247` | "Shop Local" | Rama Gothic E | 5.625rem | 900 | `#fffbdb` |
| `9805:4249` | "Stop by Boardhouse for daily essentials and local bites..." | Futura PT | 1rem | 450 | `#fffbdb` |
| `9805:4251` | "shop around" | Calder | 0.875rem | 400 | `#fffbdb` |

### Images
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:4243` | pexels-olegprachuk-7934251 | 26.5rem x 40.5rem | 0.4375rem solid `#e85f62` |
| `9805:4245` | pexels-nathanjhilton-32762601 | 21.8rem x 33.1rem | 0.4375rem solid `#e85f62` |

---

## 8. Shop Local / Retail Section

**Node ID:** `9805:4255`
**Background:** transparent (inherits cream)

```
<section> .section_retail
  |
  +-- <article> .retail_wrapper
        |  width: 91.5rem
        |  flex-direction: row, gap: 1.5rem, align: center
        |
        +-- <div> .retail_images
        |     |  width: 60.5rem
        |     |  flex-direction: row, gap: 1.5rem, align: center
        |     |
        |     +-- <div> .retail_accent-square  (6.25rem x 6.25rem, decorative)
        |     +-- <figure> .retail_image-left
        |     |     +-- <img>  (shop image, 21.8rem x 33.1rem)
        |     |           border: 0.4375rem solid #192b54
        |     +-- <figure> .retail_image-right
        |           +-- <img>  (shop image, 21.8rem x 33.1rem)
        |                 border: 0.4375rem solid #192b54
        |
        +-- <div> .retail_message
              |  width: 29.5rem
              |  flex-direction: column, gap: 4rem
              |
              +-- <h3> .retail_heading   "Retail"
              +-- <div> .retail_body
              |     |  flex-direction: column, gap: 2rem
              |     +-- <p> .retail_description  (placeholder lorem ipsum)
              +-- <a> .retail_btn
                    |  flex-direction: row, gap: 0.5805rem, align: center
                    +-- <span> .retail_btn-text  "Explore more"
                    +-- <div> .retail_btn-arrow
                          border-radius: 2rem, border: 0.0625rem solid #192b54
```

### Text Nodes
| Node | Content | Font | Size | Weight | Transform | Color |
| ---- | ------- | ---- | ---- | ------ | --------- | ----- |
| `9805:4264` | "Retail" | RamaGothicEW01-Heavy | 4rem | 900 | -- | `#192b54` |
| `9805:4266` | (Lorem Ipsum placeholder) | Futura | 1.25rem | 500 | -- | `#192b54` |
| `9805:4268` | "Explore more" | Calder-LC | 1.25rem | 400 | uppercase | `#192b54` |

---

## 9. Gather by the Coast

**Node ID:** `9805:4271`
**Dimensions:** 94.5rem x 61.375rem

```
<section> .section_gather
  |  padding: 1.5rem all sides
  |  flex-direction: column, align: center
  |
  +-- <article> .gather_wrapper
        |  width: 91.5rem
        |  flex-direction: column, gap: 4rem, justify: flex-end
        |
        +-- <div> .gather_content
        |     |  padding-left: 7.75rem
        |     |  flex-direction: column, gap: 2.75rem
        |     |
        |     +-- <h2> .gather_heading     "Gather by the Coast"
        |     +-- <p> .gather_description  "Pierpoint is the place to bring people together..."
        |     +-- <a> .gather_cta          "View Event Spaces" + arrow icon
        |
        +-- <div> .gather_images
              |  flex-direction: row, gap: 1.5rem, align: center
              |
              +-- <figure> .gather_image  (29.375rem x 29.375rem) x3
                    border: 0.5rem / 0.4375rem solid #192b54
```

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4274` | "Gather by the Coast" | Rama Gothic E | 5.625rem | 900 | `#192b54` |
| `9805:4275` | "Pierpoint is the place to bring people together..." | Futura | 1.25rem | 500 | `#192b54` |
| `9805:4277` | "View Event Spaces" | Calder | 0.875rem | 400 | `#192b54` |

### Images
| Node | Name | Dimensions | Border |
| ---- | ---- | ---------- | ------ |
| `9805:4282` | Need to be Hotel Image | 29.375rem x 29.375rem | 0.5rem solid `#192b54` |
| `9805:4283` | Need to be Hotel Image | 29.375rem x 29.375rem | 0.5rem solid `#192b54` |
| `9805:4284` | pexels-visual-tag-mx-1321732-2566581 1 | 29.375rem x 29.375rem | 0.4375rem solid `#192b54` |

---

## 10. Neighbourhood V2 (Drift Through O'side)

**Node ID:** `9805:6032` / `10127:687`
**Dimensions:** 94.5rem x 182rem
**Background:** `#192b54` (navy) with `#f8f6e1` (light cream) content squares

This is a large compound section containing multiple sub-sections: Stay the Night, Spend the Day, Wellness, and a "Drift Through O'side" heading. The pattern repeats 3 times in the Figma data (variants/instances).

```
<section> .section_neighbourhood
  |  bg: #192b54
  |  height: 182rem
  |
  +-- <h2> .neighbourhood_heading   "Drift Through O'side"
  |     Rama Gothic E, 5.625rem, 900, #f8f6e1
  |
  +-- <div> .neighbourhood_grid
        |
        +-- <article> .neighbourhood_card is-stay
        |     |  bg: #192b54
        |     |
        |     +-- <div> .neighbourhood_card-header  (bg: #192b54, 29.5rem x 14.1rem)
        |     |     +-- <h3> .neighbourhood_card-heading  "Stay the Night"
        |     |     |     Rama Gothic E, 3.125rem, 700, #f8f6e1
        |     |     +-- <p> .neighbourhood_card-body  "Book a stay and drift..."
        |     |     |     Futura PT, 1rem, 450, #f8f6e1
        |     |     +-- <a> .neighbourhood_card-cta   "Book Your Stay" + arrow
        |     |           Calder, 0.875rem, 400, #f8f6e1
        |     +-- <figure> .neighbourhood_card-image  (29.5rem x 22.5rem)
        |     +-- <p> .neighbourhood_card-label  "Visit Pierpoint"
        |           Calder, 1.875rem, 400, #192b54
        |
        +-- <article> .neighbourhood_card is-day
        |     |
        |     +-- <h3> .neighbourhood_card-heading  "Spend the Day"
        |     |     Rama Gothic E, 3.125rem, 700, #192b54
        |     +-- <p> .neighbourhood_card-body  "Here for the day?..."
        |     |     Futura PT, 1rem, 450, #192b54
        |     +-- <a> .neighbourhood_card-cta  "Get a Day Pass" + arrow
        |     |     Calder, 0.875rem, 400, #192b54
        |     +-- <figure> .neighbourhood_card-image  (29.5rem x 22.5rem)
        |     +-- <figure> .neighbourhood_card-map    (29.5rem x 36.5rem)
        |           border: 0.3125rem solid #192b54
        |
        +-- <article> .neighbourhood_card is-wellness
        |     |
        |     +-- <figure> .neighbourhood_card-image  (21.7rem x 21.7rem)
        |     |     border: 0.3125rem solid #192b54
        |     +-- <p> .neighbourhood_card-body  "Immerse yourself in restorative moments..."
        |     |     Futura PT, 1rem, 450, #192b54
        |     +-- <span> .neighbourhood_card-vertical-label  "WELLNESS"
        |     |     Calder, 1.25rem, 400, #192b54 (vertical text)
        |     +-- <a> .neighbourhood_card-btn
        |           bg: #192b54, padding: 0.875rem / 1.125rem
        |           +-- <span>  "EXPLORE WELLNESS"
        |                 Calder, 0.875rem, uppercase, #f8f6e1
        |
        +-- <div> .neighbourhood_content-squares
              (4 light cream rectangles — decorative placeholders)
              Sizes: 37.25rem, 29.5rem, 29.5rem, 29.5rem x 39.125rem
              bg: #f8f6e1
```

### Restaurant Labels (Neighbourhood)
| Node | Content | Font | Size | Color |
| ---- | ------- | ---- | ---- | ----- |
| `10127:718` | "Lumi Rooftop Sushi Bar" | Calder | 0.875rem | `#f8f6e1` |
| `10127:719` | "Seneca" | Calder | 0.875rem | `#f8f6e1` |
| `10127:720` | "Cowboy Star" | Calder | 0.875rem | `#f8f6e1` |

---

## 11. Horizontal Scroll (Small) -- Recharge & Renew / Wellness

**Node ID:** `10127:648`
**Dimensions:** 94.5625rem x 61.375rem
**Background:** `#fffbdb` (cream)

This is a horizontally scrolling section featuring wellness sub-sections (Rooftop Yoga, Spa, Meditation & Breathwork).

```
<section> .section_wellness-scroll
  |  bg: #fffbdb
  |
  +-- <div> .wellness-scroll_intro
  |     |  padding: 0 7.5rem
  |     |  flex-direction: row, gap: 1.5rem, align: center
  |     |
  |     +-- <div> .wellness-scroll_message
  |     |     |  flex-direction: column, gap: 4rem
  |     |     +-- <h2> .wellness-scroll_heading   "Recharge & Renew"
  |     |     +-- <p> .wellness-scroll_body  "Call it balance, call it a reset..."
  |     |           Futura PT, 1rem, 450, #192b54
  |     +-- <figure> .wellness-scroll_hero-image
  |           +-- <img>  (pexels-cottonbro, 19.9rem x 24.6rem)
  |                 border: 0.625rem solid #192b54
  |
  +-- <div> .wellness-scroll_track
        |  flex-direction: row, gap: 1.5rem, align: flex-end
        |  width: 265rem (overflows for scroll)
        |
        +-- <div> .wellness-scroll_slide is-yoga
        |     +-- <h3> .wellness-scroll_slide-heading  "Rooftop Yoga"
        |     |     Rama Gothic E, 5.625rem, 900, #e85f62
        |     +-- <figure>  (PP-SOCIAL2, 66.4rem x 19.3rem, border #e85f62)
        |     +-- <p> .wellness-scroll_slide-body  "Stretch into the horizon..."
        |     +-- <a> .wellness-scroll_slide-cta  "Join a Class"
        |
        +-- <div> .wellness-scroll_slide is-spa
        |     +-- <h3> .wellness-scroll_slide-heading  "Spa"
        |     |     Rama Gothic E, 5.625rem, 900, #6779c2
        |     +-- <figure>  (PP-IMAGETEST-GPT4, 97.4rem x 38.6rem, border #6779c2)
        |
        +-- <div> .wellness-scroll_slide is-meditation
        |     +-- <h3> .wellness-scroll_slide-heading  "Meditation & Breathwork"
        |     |     Rama Gothic E, 5.625rem, 900, #6779c2
        |     +-- <figure>  (PP-SOCIAL1, 52rem x 28.8rem, border #6779c2)
        |     +-- <p>  "Slow it down, breathe it in..."
        |     +-- <a>  "Book a Session"
        |
        +-- (additional images: pexels-cliff-booth, 0041da82, pexels-pixabay-161737, pexels-jonathanborba)
```

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `10127:652` | "Rooftop Yoga" | Rama Gothic E | 5.625rem | 900 | `#e85f62` |
| `10127:654` | "Spa" | Rama Gothic E | 5.625rem | 900 | `#6779c2` |
| `10127:658` | "Recharge & Renew" | Rama Gothic E | 5.625rem | 900 | `#192b54` |
| `10127:660` | "Call it balance, call it a reset..." | Futura PT | 1rem | 450 | `#192b54` |
| `10127:667` | "Meditation & Breathwork" | Rama Gothic E | 5.625rem | 900 | `#6779c2` |
| `10127:671` | "Slow it down, breathe it in..." | Futura PT | 1rem | 450 | `#192b54` |
| `10127:673` | "Book a Session" | Calder | 0.875rem | 400 | `#192b54` |
| `10127:679` | "Stretch into the horizon..." | Futura PT | 1rem | 450 | `#192b54` |
| `10127:681` | "Join a Class" | Calder | 0.875rem | 400 | `#192b54` |

### Images
| Node | Name | Dimensions | Border color |
| ---- | ---- | ---------- | ------------ |
| `10127:649` | pexels-cottonbro-3997994 | 19.9rem x 24.6rem | `#192b54` |
| `10127:651` | PP-SOCIAL2 | 66.4rem x 19.3rem | `#e85f62` |
| `10127:655` | PP-IMAGETEST-GPT4 | 97.4rem x 38.6rem | `#6779c2` |
| `10127:663` | pexels-cliff-booth-4056723 | 39.8rem x 26.6rem | `#192b54` |
| `10127:664` | 0041da82a3709f0f... | 29.8rem x 29.8rem | `#192b54` |
| `10127:665` | pexels-pixabay-161737 | 43.1rem x 28.8rem | `#192b54` |
| `10127:668` | PP-SOCIAL1 | 52rem x 28.8rem | `#6779c2` |
| `10127:685` | pexels-jonathanborba-3101547 | 32.4rem x 48.6rem | `#192b54` |

---

## 12. Stay the Night / Spend the Day CTA Cards

**Node IDs:** `9805:4331-4338` (Stay the Night), `9805:4341-4351` (Spend the Day)

These are standalone card components also used inside Neighbourhood V2.

### Stay the Night Card
```
<article> .cta-card_component is-stay
  |
  +-- <div> .cta-card_header      (bg: #192b54, 29.5rem x 14.1rem)
  |     +-- <h3> .cta-card_heading   "Stay the Night"
  |     +-- <p> .cta-card_body       "Book a stay and drift..."
  |     +-- <a> .cta-card_link       "Book Your Stay" + circle-arrow
  |
  +-- <figure> .cta-card_image       (29.5rem x 22.5rem)
  +-- <p> .cta-card_label            "Visit Pierpoint"
        Calder, 1.875rem, 400, #192b54
```

### Spend the Day Card
```
<article> .cta-card_component is-day
  |
  +-- <h3> .cta-card_heading        "Spend the Day"
  +-- <p> .cta-card_body             "Here for the day?..."
  +-- <a> .cta-card_link             "Get a Day Pass" + circle-arrow
  +-- <figure> .cta-card_image       (29.5rem x 22.5rem)
  +-- <figure> .cta-card_map         (29.5rem x 36.6rem, border: 0.3125rem solid #192b54)
```

---

## 13. Say Hello / Contact Form

**Node IDs:** `9805:4352-4366`

```
<section> .section_contact
  |
  +-- <header> .contact_header
  |     +-- <h2> .contact_heading     "Say Hello"
  |     +-- <p> .contact_subheading   "Questions, plans, or just want to connect?..."
  |
  +-- <form> .contact_form
        |  width: 29.4375rem
        |  flex-direction: column, gap: 2rem
        |
        +-- <div> .contact_field
        |     border: 0.0625rem solid #192b54
        |     padding: 1rem top/bottom
        |     +-- <label> .contact_field-label  "Name"
        |
        +-- <div> .contact_field
        |     +-- <label> .contact_field-label  "Email"
        |
        +-- <div> .contact_field
        |     +-- <label> .contact_field-label  "Subject"
        |
        +-- <div> .contact_field is-textarea   (height: 9.625rem)
        |     +-- <label> .contact_field-label  "Message"
        |
        +-- <div> .contact_checkbox
        |     |  flex-direction: row, gap: 0.5rem, align: center
        |     +-- <div> .contact_checkbox-box   (0.875rem, border: 0.0625rem solid #192b54)
        |     +-- <p> .contact_checkbox-label    "I acknowledge that I have read..."
        |           Futura, 0.875rem, 500, #192b54
        |
        +-- <button> .contact_submit-btn
              bg: #192b54, width: 29.4375rem, height: 2.6875rem
              padding: 1rem top/bottom, justify: center, align: center
              +-- <span>  "Message Us"
                    Calder, 1rem, 400, uppercase, #f8f6e1
```

### Text Nodes
| Node | Content | Font | Size | Weight | Color |
| ---- | ------- | ---- | ---- | ------ | ----- |
| `9805:4352` | "Say Hello" | Rama Gothic E | 5.625rem | 900 | `#192b54` |
| `9805:4353` | "Questions, plans, or just want to connect? We're here for it." | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4356` | "Name" | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4358` | "Email" | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4360` | "Subject" | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4362` | "Message" | Futura PT | 1rem | 450 | `#192b54` |
| `9805:4365` | "I acknowledge that I have read and accept the Privacy Policy." | Futura | 0.875rem | 500 | `#192b54` |
| `9805:4367` | "Message Us" | Calder | 1rem | 400 | `#f8f6e1` |

---

## 14. Footer

**Node ID:** `9805:4307`
**Dimensions:** 94.5rem x 61.375rem
**Background:** `#192b54` (navy)

```
<footer> .section_footer
  |  bg: #192b54
  |  padding: 1.5rem all sides
  |  flex-direction: column, justify: center, align: center
  |
  +-- <div> .footer_wrapper
        |  width: 91.5rem
        |  flex-direction: column, gap: 10rem, justify: space-between
        |
        +-- <nav> .footer_nav-top   (row, gap: 1.5rem, align: flex-end)
        |
        +-- <div> .footer_main      (row, gap: 1.5rem, align: flex-end)
        |     |
        |     +-- <nav> .footer_menu
        |     |     |  width: 37.1875rem
        |     |     |  flex-direction: column, gap: 2rem, justify: center
        |     |     |
        |     |     +-- <a> .footer_menu-link  "Hotel"
        |     |     +-- <a> .footer_menu-link  "Dining"
        |     |     +-- <a> .footer_menu-link  "Retail"
        |     |     +-- <a> .footer_menu-link  "Meetings & Events"
        |     |     +-- <a> .footer_menu-link  "Wellness"
        |     |     +-- <a> .footer_menu-link  "Neighborhood"
        |     |     +-- <a> .footer_menu-link  "Contact"
        |     |
        |     +-- <div> .footer_links
        |           |  flex-direction: row, gap: 1.5rem, justify: space-between
        |           |
        |           +-- <div> .footer_legal-links
        |           |     +-- <a>  "Contact"
        |           |     +-- <a>  "Privacy Policy"
        |           |     +-- <a>  "Terms & Conditions"
        |           |
        |           +-- <div> .footer_social-links
        |                 +-- <a>  "Instagram"
        |                 +-- <a>  "Facebook"
        |                 +-- <a>  "linkedin"
        |
        +-- <div> .footer_copyright  (row, justify: space-between)
              +-- <p>  "Copyright 2025 Pierpoint"
              +-- <p>  "Credits"
```

### Text Nodes
| Node | Content | Font | Size | Weight | Transform | Color |
| ---- | ------- | ---- | ---- | ------ | --------- | ----- |
| `9805:4312` | "Hotel" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4313` | "Dining" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4314` | "Retail" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4315` | "Meetings & Events" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4316` | "Wellness" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4317` | "Neighborhood" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#f8f6e1` |
| `9805:4318` | "Contact" | RamaGothicEW01-SemiBold | 4.375rem | 600 | -- | `#fffbdb` |
| `9805:4321` | "Contact" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4322` | "Privacy Policy" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4323` | "Terms & Conditions" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4325` | "Instagram" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4326` | "Facebook" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4327` | "linkedin" | Calder | 0.8125rem | 400 | uppercase | `#fffbdb` |
| `9805:4329` | "Copyright 2025 Pierpoint" | Futura PT | 0.875rem | 450 | -- | `#fffbdb` |
| `9805:4330` | "Credits" | Futura PT | 0.875rem | 450 | -- | `#fffbdb` |

---

## Reusable Component: Circle-Arrow CTA Link

Used in: About, Stay With Us, Sip & Savor, Gather, Neighbourhood cards, Wellness scroll

```
<a> .cta-link_component
  |  flex-direction: row, gap: 0.375rem, align: center
  |
  +-- <span> .cta-link_text    (Calder, 0.875rem, 400)
  +-- <div> .cta-link_circle
        |  width: 0.9839rem, height: 0.9839rem
        |  border: 0.0938rem solid (navy or cream depending on section)
        |  border-radius: 50%
        |
        +-- [SVG arrow] .cta-link_arrow  (0.188rem x 0.376rem chevron)
```

---

## Reusable Component: Button with Arrow

Used in: Retail section, Wellness cards

```
<a> .btn_component
  |  flex-direction: row, gap: 0.5805rem
  |  padding: 0.5rem top/bottom (ghost) or full padding (filled)
  |  justify: center, align: center
  |
  +-- <span> .btn_text    (Calder-LC or Calder, 1.25rem or 0.875rem, uppercase)
  +-- <div> .btn_arrow
        width: 1.5rem, height: 1.5rem
        border-radius: 2rem
        border: 0.0625rem solid #192b54
```

---

## Reusable Component: Filled Button

Used in: Contact form submit, Wellness "Explore" button, Top bar "Book Hotel"

```
<button> .btn_filled
  |  bg: #192b54
  |  padding: 0.875rem / 1.125rem (or 1rem top/bottom)
  |  justify: center, align: center
  |
  +-- <span> .btn_filled-text  (Calder, 0.875rem-1rem, uppercase, #f8f6e1)
```

---

## Section Order (top to bottom)

| # | Section | Node ID | Height | Background |
| - | ------- | ------- | ------ | ---------- |
| 1 | Nav bar | `9805:4376+` | sticky | transparent |
| 2 | Hero | `9805:4199` | 61.375rem | image + overlay |
| 3 | About (O'Side Rhythm) | `9805:4205` | 80.875rem | transparent (cream) |
| 4 | Stay With Us interstitial | `9805:4221-4230` | floating | transparent (cream) |
| 5 | Dining (Dine & Drink) | `9805:5941` | 61.375rem | `#fffbdb` cream |
| 6 | Horizontal Scroll strip | `9805:4232` | 22.4375rem | transparent |
| 7 | Sip & Savor / Shop Local | `9805:4239` | 61.375rem | `#192b54` navy |
| 8 | Retail | `9805:4255` | 61.375rem | transparent (cream) |
| 9 | Gather by the Coast | `9805:4271` | 61.375rem | transparent (cream) |
| 10 | Neighbourhood V2 | `9805:6032` | 182rem | `#192b54` navy |
| 11 | Wellness Horizontal Scroll | `10127:648` | 61.375rem | `#fffbdb` cream |
| 12 | Stay the Night / Spend the Day | `9805:4331-4351` | -- | mixed |
| 13 | Contact (Say Hello) | `9805:4352-4366` | -- | transparent (cream) |
| 14 | Footer | `9805:4307` | 61.375rem | `#192b54` navy |

---

## Global Layout Constants

| Property | Value | Notes |
| -------- | ----- | ----- |
| Page width | 94.5rem (1512px) | Desktop viewport |
| Section padding (horizontal) | 1.5rem left/right | Map to `padding-global` (2rem) in Webflow |
| Content wrapper width | 91.5rem | 94.5 - 3rem padding |
| Standard section height | 61.375rem | ~982px, roughly viewport height |
| Standard gap (elements) | 1.5rem | Between major elements |
| Standard gap (text groups) | 2rem | Between text blocks |
| Standard gap (sections) | 4rem-4.1875rem | Between heading and content |
| Image border (standard) | 0.4375rem solid `#192b54` | 7px navy border |
| Image border (thin) | 0.3125rem solid `#192b54` | 5px navy border |
| Image border (thick) | 0.5rem-0.625rem solid `#192b54` | 8-10px navy border |
| Left indent (some sections) | 7.75rem | Used in About, Gather |
